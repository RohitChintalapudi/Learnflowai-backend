import { prisma } from "../../../database";

export class AccountSettingsService {
	public async getAccountDetails(userId: string) {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				name: true,
				email: true,
				createdAt: true,
			},
		});

		if (!user) {
			throw new Error("User not found");
		}

		// Find provider details from Account table
		const account = await prisma.account.findFirst({
			where: { userId: userId },
			select: {
				providerId: true,
			},
		});

		// Default to 'credential' if no specific provider account is found
		const provider = account ? account.providerId : "credential";

		return {
			name: user.name,
			email: user.email,
			provider: provider,
			createdAt: user.createdAt,
		};
	}
}
