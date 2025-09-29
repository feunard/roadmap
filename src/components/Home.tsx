import { useClient } from "alepha/react";
import { useI18n } from "alepha/react/i18n";
import { useState } from "react";
import type { TodoApi } from "../api/TodoApi.js";
import type { I18n } from "../locales/I18n.js";
import type { Task } from "../schemas/taskSchema.js";

type Props = {
	tasks: Task[];
};

const Home = (props: Props) => {
	const client = useClient<TodoApi>();
	const { tr } = useI18n<I18n, "en">();
	const [tasks, setTasks] = useState(props.tasks);

	const onClickDelete = (taskId: string) => async () => {
		const updatedTasks = await client.deleteTask({
			params: { task: taskId },
		});

		setTasks(updatedTasks);
	};

	return (
		<div>
			<ul>
				{tasks.map((task) => (
					<li key={task.id}>
						{task.name}
						<button type="button" onClick={onClickDelete(task.id)}>
							{tr("home.deleteButton")}
						</button>
					</li>
				))}
			</ul>
		</div>
	);
};

export default Home;
