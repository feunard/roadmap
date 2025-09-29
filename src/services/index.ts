import { $module } from "alepha";
import { CharacterInfo } from "./CharacterInfo.js";
import { I18n } from "./I18n.js";
import { Toaster } from "./Toaster.js";

export const RoadmapServices = $module({
	name: "roadmap.services",
	services: [Toaster, I18n, CharacterInfo],
});
