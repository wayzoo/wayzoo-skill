import { Players } from "@rbxts/services";
import { greet } from "shared/greeting";

Players.PlayerAdded.Connect((player) => {
	print(greet(player.Name));
});
