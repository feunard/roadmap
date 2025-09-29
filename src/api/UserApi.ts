import { $inject } from "alepha";
import { $action } from "alepha/server";
import { Db, users } from "../providers/Db.js";

export class UserApi {
	db = $inject(Db);

	me = $action({
		schema: {
			response: users.$schema,
		},
		handler: async ({ user }) => {
			return await this.db.users.findOne({
				id: { eq: user.id },
			});
		},
	});
}
