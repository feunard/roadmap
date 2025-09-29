import { type Static, t } from "alepha";

export const taskSchema = t.object({
	id: t.uuid(),
	name: t.string(),
});

export type Task = Static<typeof taskSchema>;
