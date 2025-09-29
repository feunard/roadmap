import { $inject, t } from "alepha";
import { $logger } from "alepha/logger";
import { pageQuerySchema } from "alepha/postgres";
import { $action, ForbiddenError, okSchema } from "alepha/server";
import {
	type Character,
	characters,
	Db,
	projects,
	tasks,
	type User,
	users,
} from "../providers/Db.js";
import { Security } from "../providers/Security.js";

export class ProjectApi {
	log = $logger();
	db = $inject(Db);
	security = $inject(Security);

	createProject = $action({
		schema: {
			body: t.pick(projects.$insertSchema, ["title", "public"]),
			response: projects.$schema,
		},
		handler: async ({ body, user }) => {
			// TODO: load user + check if they have a free project slot

			const count = await this.db.projects.count({
				createdBy: user.id,
			});

			if (count >= 5) {
				throw new ForbiddenError(
					"You have reached the maximum number of projects allowed.",
				);
			}

			const project = await this.db.projects.create({
				...body,
				createdBy: user.id,
			});

			await this.db.characters.create({
				projectId: project.id,
				userId: user.id,
				xp: 0,
				balance: 0,
				owner: true,
			});

			return project;
		},
	});

	getMyProjects = $action({
		description: "Get all projects for the authenticated user",
		schema: {
			query: pageQuerySchema,
			response: t.array(projects.$schema),
		},
		handler: async ({ user }) => {
			const characters = await this.db.characters.find({
				where: { userId: { eq: user.id } },
			});

			const characterProjectIds = characters.map((it) => it.projectId);

			return await this.db.projects.find({
				where: { id: { inArray: characterProjectIds } },
				limit: characterProjectIds.length,
			});
		},
	});

	// -------------------------------------------------------------------------------------------------------------------

	getProjectUsers = $action({
		schema: {
			params: t.object({
				id: t.int(),
			}),
			response: t.array(users.$schema),
		},
		handler: async ({ params, user }) => {
			await this.security.checkOwnership(params.id, user);

			const characters = await this.db.characters.find({
				where: { projectId: { eq: params.id } },
			});

			const userIds = characters.map((it) => it.userId);

			return await this.db.users.find({
				where: { id: { inArray: userIds } },
				limit: userIds.length,
			});
		},
	});

	updateProjectById = $action({
		schema: {
			params: t.object({
				id: t.int(),
			}),
			body: t.partial(t.pick(projects.$insertSchema, ["title", "public"])),
			response: projects.$schema,
		},
		handler: async ({ params, body, user }) => {
			const { project } = await this.security.checkOwnership(params.id, user);

			if (body.title) {
				project.title = body.title.trim();
			}

			if (body.public != null) {
				project.public = body.public;
			}

			return await this.db.projects.save(project);
		},
	});

	getProjectById = $action({
		schema: {
			params: t.object({
				id: t.int(),
			}),
			response: t.interface([projects.$schema], {
				character: t.optional(characters.$schema),
				tasks: t.array(tasks.$schema),
			}),
		},
		handler: async ({ params, user }) => {
			const { project } = await this.security.checkOwnership(params.id, user);

			const character = await this.db.characters
				.findOne({
					projectId: { eq: params.id },
					userId: { eq: user.id },
				})
				.catch((err) => {
					if (project.public) return undefined;
					throw err;
				});

			const tasks = await this.db.tasks.find({
				where: {
					projectId: { eq: params.id },
					completedAt: { isNull: true },
					acceptedBy: { eq: user.id },
				},
			});

			return { ...project, tasks, character };
		},
	});

	getProjectPlayers = $action({
		schema: {
			params: t.object({
				id: t.int(),
			}),
			response: t.array(
				t.interface([characters.$schema], {
					user: users.$schema,
				}),
			),
		},
		handler: async ({ params, user }) => {
			await this.security.checkOwnership(params.id, user);

			const projectCharacters = await this.db.characters.find({
				where: { projectId: { eq: params.id } },
			});

			const users = await this.db.users.find({
				limit: projectCharacters.length,
				where: {
					id: { inArray: projectCharacters.map((char) => char.userId) },
				},
			});

			const charactersWithUsers: Array<
				Character & {
					user: User;
				}
			> = [];

			for (const character of projectCharacters) {
				const characterUser = users.find((it) => it.id === character.userId);
				if (!characterUser) {
					this.log.warn(
						`User with id ${character.userId} not found for character ${character.id}`,
					);
					continue;
				}
				charactersWithUsers.push({
					...character,
					user: characterUser,
				});
			}

			// Sort by owner first, then by creation date
			return charactersWithUsers.sort((a, b) => {
				if (a.owner && !b.owner) return -1;
				if (!a.owner && b.owner) return 1;
				return (
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				);
			});
		},
	});

	deleteProjectById = $action({
		schema: {
			params: t.object({
				id: t.int(),
			}),
			response: okSchema,
		},
		handler: async ({ params, user }) => {
			await this.security.checkOwnership(params.id, user);

			await this.db.projects.deleteById(params.id);
			await this.db.characters.deleteMany({
				projectId: { eq: params.id },
			});
			await this.db.tasks.deleteMany({
				projectId: { eq: params.id },
			});

			return { ok: true };
		},
	});
}
