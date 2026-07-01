import { hashPassword, verifyPassword } from "../../../auth/password";
import { prisma } from "../../../database";
import { AppError } from "../../../utils/app-error";

export class ChangePasswordService {
	public async changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string,
	): Promise<void> {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				accounts: {
					where: {
						providerId: "credential",
					},
					select: {
						id: true,
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
			throw new AppError("Password cannot be changed for OAuth accounts.", 400);
		}

		const isCurrentPasswordCorrect = await verifyPassword(
			currentPassword,
			passwordAccount.password,
		);
		if (!isCurrentPasswordCorrect) {
			throw new AppError("Current password is incorrect.", 400);
		}

		const isSamePassword = await verifyPassword(newPassword, passwordAccount.password);
		if (isSamePassword) {
			throw new AppError("New password must be different from the current password.", 400);
		}

		const passwordHash = await hashPassword(newPassword);

		await prisma.account.update({
			where: { id: passwordAccount.id },
			data: {
				password: passwordHash,
			},
		});
	}
}
