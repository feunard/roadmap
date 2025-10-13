import { $inject, t } from "alepha";
import { FileService } from "alepha/api/files";
import { $action } from "alepha/server";
import { Db, users } from "../providers/Db.js";

export class UserApi {
	db = $inject(Db);
	fileService = $inject(FileService);

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

	updateAvatar = $action({
		schema: {
			body: t.object({
				file: t.file(),
			}),
			response: users.$schema,
		},
		handler: async ({ user, body }) => {
			// Store the file in the avatars bucket
			const file = await this.fileService.uploadFile(body.file, {
				user,
				bucket: this.db.avatars.name,
			});

			// Update the user's picture field
			return await this.db.users.updateById(user.id, {
				picture: file.id,
			});
		},
	});
}
