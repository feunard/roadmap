import { $inject, t } from "alepha";
import { createFile } from "alepha/file";
import { sql } from "alepha/postgres";
import { $action, ForbiddenError } from "alepha/server";
import { Db, tasks } from "../providers/Db.js";
import { Security } from "../providers/Security";

export class ProjectStatsApi {
	db = $inject(Db);
	security = $inject(Security);

	getProjectStats = $action({
		cache: true,
		schema: {
			params: t.object({
				id: t.int(),
			}),
			response: t.object({
				overview: t.object({
					totalTasks: t.int(),
					completedTasks: t.int(),
					activePlayers: t.int(),
					totalXP: t.int(),
					averageTaskComplexity: t.number(),
				}),
				tasksByPriority: t.array(
					t.object({
						priority: t.string(),
						count: t.int(),
						completed: t.int(),
					}),
				),
				tasksByComplexity: t.array(
					t.object({
						complexity: t.int(),
						count: t.int(),
						averageXP: t.int(),
					}),
				),
				topZones: t.array(
					t.object({
						zone: t.string(),
						totalTasks: t.int(),
					}),
				),
				activityTimeline: t.array(
					t.object({
						date: t.string(),
						tasksCompleted: t.int(),
					}),
				),
				completionRate: t.object({
					weekly: t.number(),
					monthly: t.number(),
					overall: t.number(),
				}),
			}),
		},
		handler: async ({ params, user }) => {
			await this.security.checkOwnership(params.id, user);

			// Get overview stats
			const overviewQuery = await this.db.query(sql`
				SELECT
					COUNT(CASE WHEN t.deleted_at IS NULL THEN 1 END) as total_tasks,
					COUNT(CASE WHEN t.completed_at IS NOT NULL THEN 1 END) as completed_tasks,
					COUNT(DISTINCT c.user_id) as active_players,
					COALESCE(SUM(c.xp), 0) as total_xp,
					COALESCE(AVG(t.complexity::numeric), 0) as average_task_complexity
				FROM ${tasks} t
				LEFT JOIN ${this.db.characters.table} c ON c.project_id = t.project_id
				WHERE t.project_id = ${params.id}
			`);

			const overview = {
				totalTasks: Number(overviewQuery[0].total_tasks) || 0,
				completedTasks: Number(overviewQuery[0].completed_tasks) || 0,
				activePlayers: Number(overviewQuery[0].active_players) || 0,
				totalXP: Number(overviewQuery[0].total_xp) || 0,
				averageTaskComplexity:
					Number(overviewQuery[0].average_task_complexity) || 0,
			};

			// Get tasks by priority
			const priorityQuery = await this.db.query(
				sql`
				SELECT
					${tasks.priority},
					COUNT(*) as count,
					COUNT(CASE WHEN ${tasks.completedAt} IS NOT NULL THEN 1 END) as completed
				FROM ${tasks}
				WHERE ${tasks.projectId} = ${params.id} AND ${tasks.deletedAt} IS NULL
				GROUP BY ${tasks.priority}
				ORDER BY
					CASE ${tasks.priority}
						WHEN 'high' THEN 1
						WHEN 'medium' THEN 2
						WHEN 'low' THEN 3
						WHEN 'optional' THEN 4
					END
			`,
				t.object({
					priority: t.string(),
					count: t.string(),
					completed: t.string(),
				}),
			);

			const tasksByPriority = priorityQuery.map((row) => ({
				priority: row.priority,
				count: Number(row.count),
				completed: Number(row.completed),
			}));

			// Get tasks by complexity
			const complexityQuery = await this.db.query(
				sql`
				SELECT
					${tasks.complexity},
					COUNT(*) as count,
					AVG(
						CASE
							WHEN ${tasks.priority} = 'high' THEN ${tasks.complexity} * 150 + 300
							WHEN ${tasks.priority} = 'medium' THEN ${tasks.complexity} * 150 + 180
							ELSE ${tasks.complexity} * 150 + 80
						END
					) as average_xp
				FROM ${tasks}
				WHERE ${tasks.projectId} = ${params.id} AND ${tasks.deletedAt} IS NULL
				GROUP BY ${tasks.complexity}
				ORDER BY ${tasks.complexity}
			`,
				t.object({
					complexity: t.string(),
					count: t.string(),
					average_xp: t.string(),
				}),
			);

			const tasksByComplexity = complexityQuery.map((row) => ({
				complexity: Number(row.complexity),
				count: Number(row.count),
				averageXP: Math.round(Number(row.average_xp) || 0),
			}));

			// Get top 6 zones/packages
			const zonesQuery = await this.db.query(
				sql`
				SELECT
					COALESCE(${tasks.package}, 'Unassigned') as zone,
					COUNT(*) as total_tasks
				FROM ${tasks}
				WHERE ${tasks.projectId} = ${params.id} AND ${tasks.deletedAt} IS NULL
				GROUP BY ${tasks.package}
				ORDER BY total_tasks DESC
				LIMIT 6
			`,
				t.object({
					zone: t.string(),
					total_tasks: t.string(),
				}),
			);

			const topZones = zonesQuery.map((row) => ({
				zone: row.zone,
				totalTasks: Number(row.total_tasks) || 0,
			}));

			// Get activity timeline (last 365 days with all dates for filtering on frontend)
			const timelineQuery = await this.db.query(
				sql`
				WITH date_series AS (
					SELECT generate_series(
						CURRENT_DATE - INTERVAL '364 days',
						CURRENT_DATE,
						'1 day'::interval
					)::date AS date
				)
				SELECT
					ds.date,
					COALESCE(COUNT(t.id), 0) as tasks_completed
				FROM date_series ds
				LEFT JOIN ${tasks} t ON DATE(t.completed_at) = ds.date
					AND t.project_id = ${params.id}
					AND t.completed_at IS NOT NULL
				GROUP BY ds.date
				ORDER BY ds.date ASC
			`,
				t.object({
					date: t.string(),
					tasks_completed: t.string(),
				}),
			);

			const activityTimeline = timelineQuery.map((row) => ({
				date: row.date,
				tasksCompleted: Number(row.tasks_completed),
			}));

			// Calculate completion rates
			const weeklyQuery = await this.db.query(sql`
				SELECT COUNT(*) as completed
				FROM ${tasks}
				WHERE ${tasks.projectId} = ${params.id}
					AND ${tasks.completedAt} IS NOT NULL
					AND ${tasks.completedAt} >= CURRENT_DATE - INTERVAL '7 days'
			`);

			const monthlyQuery = await this.db.query(sql`
				SELECT COUNT(*) as completed
				FROM ${tasks}
				WHERE ${tasks.projectId} = ${params.id}
					AND ${tasks.completedAt} IS NOT NULL
					AND ${tasks.completedAt} >= CURRENT_DATE - INTERVAL '30 days'
			`);

			const weeklyCompleted = Number(weeklyQuery[0]?.completed) || 0;
			const monthlyCompleted = Number(monthlyQuery[0]?.completed) || 0;
			const overallRate =
				overview.totalTasks > 0
					? (overview.completedTasks / overview.totalTasks) * 100
					: 0;

			const completionRate = {
				weekly: weeklyCompleted,
				monthly: monthlyCompleted,
				overall: overallRate,
			};

			return {
				overview,
				tasksByPriority,
				tasksByComplexity,
				topZones,
				activityTimeline,
				completionRate,
			};
		},
	});

	exportTasksCsv = $action({
		path: "/projects/:id/export",
		schema: {
			params: t.object({
				id: t.int(),
			}),
			response: t.file(),
		},
		handler: async ({ params, user }) => {
			// Verify project access
			const project = await this.db.projects.findOne({
				id: { eq: params.id },
			});

			await this.db.characters.findOne({
				userId: user.id,
				projectId: project.id,
			});

			const tasks = await this.db.tasks.find({
				where: { projectId: { eq: params.id } },
				orderBy: "createdAt",
				limit: 1000,
			});

			const fields = [
				"id",
				"title",
				"package",
				"priority",
				"complexity",
				"createdAt",
				"acceptedAt",
				"completedAt",
			];

			let csvContent = `${fields.join(",")}\n`;
			for (const task of tasks) {
				const row = fields.map((field) => {
					let value = (task as any)[field] ?? "";
					if (value instanceof Date) {
						value = value.toISOString();
					} else if (typeof value === "string") {
						// Escape double quotes in strings
						value = value.replace(/"/g, '""');
						// Wrap string values in double quotes
						value = `"${value}"`;
					} else if (typeof value === "object") {
						// For objects/arrays, stringify them
						value = `"${JSON.stringify(value).replace(/"/g, '""')}"`;
					}
					return value;
				});
				csvContent += `${row.join(",")}\n`;
			}

			return createFile(csvContent, {
				name: `tasks-export-${project.title}-${new Date().toISOString().split("T")[0]}.csv`,
				type: "text/csv",
			});
		},
	});
}
