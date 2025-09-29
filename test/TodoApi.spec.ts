import { Alepha } from "alepha";
import { describe, it } from "vitest";
import { TodoApi } from "../src/api/TodoApi.js";

describe("Todo API", () => {
	const alepha = Alepha.create();
	const todoApi = alepha.inject(TodoApi);

	it("should add and retrieve tasks", async ({ expect }) => {
		const tasks = await todoApi.addTask.run({ body: { task: "Test Task" } });

		expect(tasks[3]).toEqual({
			id: expect.any(String),
			name: "Test Task",
		});
	});
});
