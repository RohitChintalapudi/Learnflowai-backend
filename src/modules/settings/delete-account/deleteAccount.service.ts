import { prisma } from "../../../database/prisma";
import { verifyPassword } from "../../../auth/password";
import { AppError } from "../../../utils/app-error";

export class DeleteAccountService {
	public async deleteUserAccount(userId: string, password: string): Promise<void> {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				accounts: {
					where: {
						providerId: "credential",
					},
					select: {
						password: true,
					},
				},
			},
		});

		if (!user) {
			throw new AppError("Unauthorized.", 401);
		}

		const passwordAccount = user.accounts.find((account) => Boolean(account.password));
		if (!passwordAccount?.password) {
			throw new AppError("Invalid password.", 400); // 400 or 401 per instructions
		}

		const isPasswordCorrect = await verifyPassword(
			password,
			passwordAccount.password,
		);
		
		if (!isPasswordCorrect) {
			throw new AppError("Invalid password.", 400); // 400 or 401 per instructions
		}

		await prisma.user.delete({
			where: { id: userId },
		});
	}
}
