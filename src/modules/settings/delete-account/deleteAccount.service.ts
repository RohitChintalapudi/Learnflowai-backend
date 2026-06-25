import { prisma } from "../../../database/prisma";

export class DeleteAccountService {
	public async deleteUserAccount(userId: string): Promise<void> {
		await prisma.user.delete({
			where: { id: userId },
		});
	}
}
