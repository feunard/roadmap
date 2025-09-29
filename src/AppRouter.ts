import { notifications } from "@mantine/notifications";
import { $hook, $inject, Alepha, t } from "alepha";
import { $page, NotFound, ReactRouter, Redirection } from "alepha/react";
import { ReactAuth } from "alepha/react/auth";
import { $head } from "alepha/react/head";
import { HttpError, NotFoundError } from "alepha/server";
import { $client } from "alepha/server/links";
import { createElement } from "react";
import type { InvitationApi } from "./api/InvitationApi.js";
import type { ProjectApi } from "./api/ProjectApi.js";
import type { ProjectStatsApi } from "./api/ProjectStatsApi.js";
import type { TaskApi } from "./api/TaskApi.js";
import { AdminRouter } from "./components/admin/AdminRouter.js";
import { MeRouter } from "./components/auth/MeRouter.js";
import ErrorPage from "./components/shared/ErrorPage.jsx";

export class AppRouter {
	alepha = $inject(Alepha);
	taskApi = $client<TaskApi>();
	projectApi = $client<ProjectApi>();
	projectStatsApi = $client<ProjectStatsApi>();
	invitationApi = $client<InvitationApi>();
	router = $inject(ReactRouter);
	auth = $inject(ReactAuth);
	meRouter = $inject(MeRouter);
	adminRouter = $inject(AdminRouter);

	head = $head(() => ({
		title: "Roadmap",
	}));

	login = $page({
		path: "/login",
		schema: {
			query: t.object({
				r: t.optional(t.string()),
			}),
		},
		lazy: () => import("./components/auth/Login.jsx"),
	});

	layout = $page({
		children: () => [
			this.login, //
			this.home, //
			this.project,
			this.projectCreate,
			this.meRouter.me,
			this.adminRouter.admin,
			this.notFound,
		],
		lazy: () => import("./components/Layout.jsx"),
		resolve: async ({ user }) => {
			if (user) {
				this.alepha.state.set(
					"user_projects",
					await this.projectApi.getMyProjects(),
				);
			}
		},
		errorHandler: (error, state) => {
			if (HttpError.is(error, 401) && state.url.pathname !== "/login") {
				return new Redirection(`/login?r=${state.url.pathname}`);
			}

			if (!this.alepha.isProduction()) {
				return;
			}

			return createElement(ErrorPage, {
				error,
				alepha: this.alepha,
			});
		},
	});

	// -------------------------------------------------------------------------------------------------------------------

	onFetchError = $hook({
		on: "client:onError",
		handler: async ({ error }) => {
			// when user try to access a resource without being logged in (expired session or just no logged in)
			if (
				this.alepha.isBrowser() &&
				HttpError.is(error, 401) &&
				this.router.state.url.pathname !== "/login"
			) {
				this.alepha.state.set("user", undefined);
				await this.router.go(`/login?r=${this.router.state.url.pathname}`);
			}
		},
	});

	onFormError = $hook({
		on: "form:submit:error",
		handler: async ({ error }) => {
			notifications.show({
				title: "Invalid Request",
				message: error.message || "An error occurred",
				color: "red",
				position: "top-center",
				autoClose: 5000,
			});
		},
	});

	// -------------------------------------------------------------------------------------------------------------------

	home = $page({
		path: "/",
		lazy: () => import("./components/home/Home.jsx"),
	});

	projectCreate = $page({
		path: "/p-new",
		lazy: () => import("./components/project/ProjectCreate.jsx"),
	});

	project = $page({
		children: () => [
			this.projectTask, //
			this.projectBoard,
			this.projectSettings,
			this.projectAnalytics,
			this.projectPlayers,
			this.projectShop,
		],
		path: "/p/:projectId",
		schema: {
			params: t.object({
				projectId: t.int(),
			}),
		},
		lazy: () => import("./components/project/ProjectView.jsx"),
		resolve: async ({ params }) => {
			const { character, tasks, ...project } =
				await this.projectApi.getProjectById({
					params: {
						id: params.projectId,
					},
				});

			this.alepha.state.set("current_project", project);
			this.alepha.state.set("current_project_character", character);
			this.alepha.state.set("current_assigned_tasks", tasks);

			return {
				project,
			};
		},
		onLeave: () => {
			this.alepha.state.set("current_project_character", null);
			this.alepha.state.set("current_project", null);
			this.alepha.state.set("current_assigned_tasks", []);
		},
	});

	projectBoard = $page({
		path: "/",
		lazy: () => import("./components/project/ProjectBoard.jsx"),
	});

	projectPlayers = $page({
		path: "/players",
		lazy: () => import("./components/project/ProjectPlayers.jsx"),
		resolve: async ({ params }) => {
			const project = this.alepha.state.get("current_project");
			if (!project) {
				throw new NotFoundError("Project not found");
			}

			const [players, pendingInvitations] = await Promise.all([
				this.projectApi.getProjectPlayers({
					params: { id: project.id },
				}),
				this.invitationApi
					.getProjectInvitations({
						params: { projectId: project.id },
					})
					.catch(() => []), // Fail gracefully if no permission
			]);

			return {
				players,
				project,
				pendingInvitations: pendingInvitations.filter(
					(inv) => inv.status === "pending",
				),
			};
		},
	});

	projectAnalytics = $page({
		path: "/analytics",
		lazy: () => import("./components/project/ProjectStats.jsx"),
		resolve: async ({ params }) => {
			const stats = await this.projectStatsApi.getProjectStats({
				params: {
					id: this.alepha.state.get("current_project")?.id ?? -1,
				},
			});
			return {
				stats,
			};
		},
	});

	projectSettings = $page({
		path: "/settings",
		lazy: () => import("./components/project/ProjectSettings.jsx"),
	});

	projectShop = $page({
		path: "/shop",
		lazy: () => import("./components/project/ProjectShop.jsx"),
	});

	projectTask = $page({
		path: "/q/:taskId",
		schema: {
			params: t.object({
				taskId: t.int(),
			}),
		},
		animation: ({ meta }) => {
			if (meta.transition) {
				return meta.transition;
			}

			if (meta.completed) {
				return {
					exit: {
						name: "zoomOutUp",
						duration: 800,
					},
				};
			}

			if (meta.deleted) {
				return {
					exit: {
						name: "zoomOut",
						duration: 400,
					},
				};
			}
		},
		lazy: () => import("./components/project/task/TaskView.jsx"),
		resolve: async ({ params }) => {
			const task = await this.taskApi.getTaskById({
				params: {
					id: params.taskId,
				},
			});
			this.alepha.state.set("current_task", task);
			return { task };
		},
		onLeave: () => {
			this.alepha.state.set("current_task", null);
		},
		errorHandler: (error) => {
			if (HttpError.is(error, 404)) {
				return createElement(NotFound, { style: { height: "100%" } });
			}
		},
	});

	notFound = $page({
		path: "/*",
		component: NotFound,
	});
}
