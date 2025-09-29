import { $module } from "alepha";
import { Db } from "../providers/Db.js";
import { Security } from "../providers/Security.js";
import { AdminApi } from "./AdminApi.js";
import { CharacterApi } from "./CharacterApi.js";
import { IdentityApi } from "./IdentityApi.js";
import { InvitationApi } from "./InvitationApi.js";
import { ProjectApi } from "./ProjectApi.js";
import { ProjectStatsApi } from "./ProjectStatsApi.js";
import { SessionApi } from "./SessionApi.js";
import { TaskApi } from "./TaskApi.js";
import { UserApi } from "./UserApi.js";

export const RoadmapApi = $module({
	name: "roadmap.api",
	services: [
		Security,
		Db,
		TaskApi,
		ProjectApi,
		UserApi,
		SessionApi,
		CharacterApi,
		IdentityApi,
		ProjectStatsApi,
		InvitationApi,
		AdminApi,
	],
});
