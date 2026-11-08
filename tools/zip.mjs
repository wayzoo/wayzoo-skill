// Minimal dependency-free ZIP writer/reader (deflate), so packing works on any OS with just Node 18+.
// Output is reproducible: fixed timestamps, sorted entries.
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const TABLE = (() => {
	const t = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		t[n] = c >>> 0;
	}
	return t;
})();

export function crc32(buf) {
	let c = 0xffffffff;
	for (let i = 0; i < buf.length; i++) c = TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

// 2026-01-01 00:00:00 in DOS format (fixed so the archive is byte-for-byte reproducible).
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;
const DOS_TIME = 0;

// entries: [{ name: "wayzoo/SKILL.md", data: Buffer, mode?: 0o644 }]
export function buildZip(entries) {
	const sorted = [...entries].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
	const locals = [];
	const centrals = [];
	let offset = 0;
	for (const e of sorted) {
		const name = Buffer.from(e.name, "utf8");
		const raw = Buffer.isBuffer(e.data) ? e.data : Buffer.from(e.data);
		const comp = deflateRawSync(raw, { level: 9 });
		const crc = crc32(raw);
		const mode = (e.mode ?? 0o644) | 0o100000;

		const lh = Buffer.alloc(30);
		lh.writeUInt32LE(0x04034b50, 0);
		lh.writeUInt16LE(20, 4); // version needed
		lh.writeUInt16LE(0x0800, 6); // UTF-8 names
		lh.writeUInt16LE(8, 8); // deflate
		lh.writeUInt16LE(DOS_TIME, 10);
		lh.writeUInt16LE(DOS_DATE, 12);
		lh.writeUInt32LE(crc, 14);
		lh.writeUInt32LE(comp.length, 18);
		lh.writeUInt32LE(raw.length, 22);
		lh.writeUInt16LE(name.length, 26);
		lh.writeUInt16LE(0, 28);
		locals.push(lh, name, comp);

		const ch = Buffer.alloc(46);
		ch.writeUInt32LE(0x02014b50, 0);
		ch.writeUInt16LE((3 << 8) | 20, 4); // made by: Unix, v2.0 (keeps file modes)
		ch.writeUInt16LE(20, 6);
		ch.writeUInt16LE(0x0800, 8);
		ch.writeUInt16LE(8, 10);
		ch.writeUInt16LE(DOS_TIME, 12);
		ch.writeUInt16LE(DOS_DATE, 14);
		ch.writeUInt32LE(crc, 16);
		ch.writeUInt32LE(comp.length, 20);
		ch.writeUInt32LE(raw.length, 24);
		ch.writeUInt16LE(name.length, 28);
		ch.writeUInt32LE(((mode << 16) >>> 0), 38);
		ch.writeUInt32LE(offset, 42);
		centrals.push(ch, name);

		offset += lh.length + name.length + comp.length;
	}
	const cd = Buffer.concat(centrals);
	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50, 0);
	end.writeUInt16LE(sorted.length, 8);
	end.writeUInt16LE(sorted.length, 10);
	end.writeUInt32LE(cd.length, 12);
	end.writeUInt32LE(offset, 16);
	return Buffer.concat([...locals, cd, end]);
}

// Read a zip written by buildZip (or any zip with deflate/stored entries). Returns [{ name, data }].
export function readZip(buf) {
	let eocd = -1;
	for (let i = buf.length - 22; i >= 0; i--) {
		if (buf.readUInt32LE(i) === 0x06054b50) {
			eocd = i;
			break;
		}
	}
	if (eocd < 0) throw new Error("not a zip file");
	const count = buf.readUInt16LE(eocd + 10);
	let p = buf.readUInt32LE(eocd + 16);
	const out = [];
	for (let i = 0; i < count; i++) {
		if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("bad central directory");
		const method = buf.readUInt16LE(p + 10);
		const crc = buf.readUInt32LE(p + 16);
		const csize = buf.readUInt32LE(p + 20);
		const nlen = buf.readUInt16LE(p + 28);
		const elen = buf.readUInt16LE(p + 30);
		const clen = buf.readUInt16LE(p + 32);
		const lho = buf.readUInt32LE(p + 42);
		const name = buf.toString("utf8", p + 46, p + 46 + nlen);
		const dstart = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
		const comp = buf.subarray(dstart, dstart + csize);
		const data = method === 8 ? inflateRawSync(comp) : comp;
		if (crc32(data) !== crc) throw new Error(`CRC mismatch: ${name}`);
		out.push({ name, data });
		p += 46 + nlen + elen + clen;
	}
	return out;
}

const SKIP_DIRS = new Set(["node_modules", "__pycache__", ".git", "evals"]);
const SKIP_FILES = new Set([".DS_Store", "Thumbs.db"]);

// Collect every file of a folder as zip entries under `prefix/`. Names always use forward slashes.
export function collectDir(root, prefix) {
	const out = [];
	const walk = (dir, rel) => {
		for (const name of readdirSync(dir).sort()) {
			if (SKIP_FILES.has(name) || name.endsWith(".pyc")) continue;
			const p = join(dir, name);
			const r = rel ? `${rel}/${name}` : name;
			if (statSync(p).isDirectory()) {
				if (!SKIP_DIRS.has(name)) walk(p, r);
			} else {
				out.push({ name: `${prefix}/${r}`, data: readFileSync(p), mode: name.endsWith(".sh") ? 0o755 : 0o644 });
			}
		}
	};
	walk(root, "");
	return out;
}
