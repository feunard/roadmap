import { t } from "alepha";
import { $action } from "alepha/server";
import { type Task, taskSchema } from "../schemas/taskSchema.js";

export class TodoApi {
	tasks: Array<Task> = [
		{
			id: crypto.randomUUID(),
			name: "Set up Alepha development environment",
		},
		{
			id: crypto.randomUUID(),
			name: "Learn Alepha's descriptor-driven architecture",
		},
		{
			id: crypto.randomUUID(),
			name: "Build first Alepha API with type-safe routing",
		},
	];

	getTasks = $action({
		schema: {
			response: t.array(taskSchema),
		},
		handler: async () => {
			return this.tasks;
		},
	});

	addTask = $action({
		schema: {
			body: t.object({
				task: t.string(),
			}),
			response: t.array(taskSchema),
		},
		handler: async ({ body }) => {
			this.tasks.push({
				id: crypto.randomUUID(),
				name: body.task,
			});
			return this.tasks;
		},
	});

	deleteTask = $action({
		method: "DELETE",
		schema: {
			params: t.object({
				task: t.uuid(),
			}),
			response: t.array(taskSchema),
		},
		handler: async ({ params }) => {
			this.tasks = this.tasks.filter((t) => t.id !== params.task);
			return this.tasks;
		},
	});
}
