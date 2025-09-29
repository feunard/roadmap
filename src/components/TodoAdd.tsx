import { t } from "alepha";
import { useClient, useRouter } from "alepha/react";
import { useForm } from "alepha/react/form";
import { useI18n } from "alepha/react/i18n";
import type { AppRouter } from "../AppRouter.js";
import type { TodoApi } from "../api/TodoApi.js";
import type { I18n } from "../locales/I18n.js";

const TodoAdd = () => {
	const router = useRouter<AppRouter>();
	const client = useClient<TodoApi>();
	const { tr } = useI18n<I18n, "en">();

	const form = useForm({
		schema: t.object({
			task: t.string(),
		}),
		handler: async (body) => {
			await client.addTask({
				body,
			});

			await router.go("home");
		},
	});

	return (
		<div>
			<h2>{tr("addTask.title")}</h2>
			<form onSubmit={form.onSubmit}>
				<input
					{...form.input.task.props}
					placeholder={tr("addTask.placeholder")}
				/>
				<button type="submit">{tr("addTask.submitButton")}</button>
			</form>
		</div>
	);
};

export default TodoAdd;
