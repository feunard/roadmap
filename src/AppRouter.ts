import { $page } from "alepha/react";
import { $client } from "alepha/server/links";
import type { TodoApi } from "./api/TodoApi.js";

export class AppRouter {
	// use only <type> here, no need to import the class
	todoApi = $client<TodoApi>();

	root = $page({
		children: () => [this.taskCreate, this.home],
		head: {
			title: "Demo App",
			titleSeparator: " | ",
		},
		lazy: () => import("./components/Layout.js"),
	});

	taskCreate = $page({
		path: "/add-task",
		head: {
			title: "Add a new Todo",
		},
		lazy: () => import("./components/TodoAdd.js"),
	});

	home = $page({
		path: "/",
		head: {
			title: "Todo List",
		},
		// this is the resolver for the page, it fetches the tasks from the API
		// and passes them to the component as props
		resolve: async () => {
			return {
				tasks: await this.todoApi.getTasks(),
			};
		},
		lazy: () => import("./components/Home.js"),
	});
}
