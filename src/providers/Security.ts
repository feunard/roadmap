import { $cursor, $inject } from "alepha";
import {
	$authGithub,
	$authGoogle,
	$realmUsers,
	SessionService,
} from "alepha/api/users";
import { $auth } from "alepha/react/auth";
import type { RealmDescriptor, UserAccountToken } from "alepha/security";
import { type Character, Db, type Project } from "./Db.js";

const $authCredentials = (realm: RealmDescriptor) => {
	const { context } = $cursor();
	const sessionService = context.inject(SessionService);

	return $auth({
		realm,
		name: "credentials",
		credentials: {
			account: async (it) => {
				return await sessionService.login(
					"credentials",
					it.username, // username can act as email or username
					it.password,
				);
			},
		},
	});
};

export class Security {
	db = $inject(Db);
	realm = $realmUsers();

	// login providers
	credentials = $authCredentials(this.realm);
	google = $authGoogle(this.realm);
	github = $authGithub(this.realm);

	async checkOwnership(
		projectId: number,
		user: UserAccountToken,
	): Promise<ProjectGuard> {
		const project = await this.db.projects.findOne({
			id: { eq: projectId },
		});

		if (project.createdBy !== user.id && !project.public && user.ownership) {
			return {
				project,
				character: await this.db.characters.findOne({
					projectId: { eq: projectId },
					userId: { eq: user.id },
				}),
			};
		}

		return { project };
	}
}

export interface ProjectGuard {
	project: Project;
	character?: Character;
}
