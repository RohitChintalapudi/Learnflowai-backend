import { prisma } from "../../database";

const PLAN_INTERVALS = ["monthly", "yearly"] as const;
export type PlanInterval = (typeof PLAN_INTERVALS)[number];

export interface PlanStatus {
	plan: "free" | "pro";
	interval: PlanInterval | null;
	startedAt: string | null;
	expiresAt: string | null;
	isActive: boolean;
}

const planSelect = {
	plan: true,
	planInterval: true,
	planStartedAt: true,
	planExpiresAt: true,
} as const;

export class PlanService {
	public async getPlan(userId: string): Promise<PlanStatus> {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: planSelect,
		});

		if (!user) {
			throw new Error("User not found");
		}

		let current = user;

		// Mandatory cancellation: a pro plan past its expiry date is downgraded immediately.
		if (user.plan === "pro" && user.planExpiresAt && user.planExpiresAt.getTime() <= Date.now()) {
			current = await prisma.user.update({
				where: { id: userId },
				data: {
					plan: "free",
					planInterval: null,
					planStartedAt: null,
					planExpiresAt: null,
				},
				select: planSelect,
			});
		}

		const isActive = current.plan === "pro";

		return {
			plan: isActive ? "pro" : "free",
			interval: (current.planInterval as PlanInterval | null) || null,
			startedAt: current.planStartedAt ? current.planStartedAt.toISOString() : null,
			expiresAt: current.planExpiresAt ? current.planExpiresAt.toISOString() : null,
			isActive,
		};
	}

	public async upgradeToPro(userId: string, interval: PlanInterval): Promise<PlanStatus> {
		if (!PLAN_INTERVALS.includes(interval)) {
			throw new Error("Invalid plan interval");
		}

		const startedAt = new Date();
		const expiresAt = new Date(startedAt);
		if (interval === "monthly") {
			expiresAt.setMonth(expiresAt.getMonth() + 1);
		} else {
			expiresAt.setFullYear(expiresAt.getFullYear() + 1);
		}

		const user = await prisma.user.update({
			where: { id: userId },
			data: {
				plan: "pro",
				planInterval: interval,
				planStartedAt: startedAt,
				planExpiresAt: expiresAt,
			},
			select: planSelect,
		});

		if (!user) {
			throw new Error("User not found");
		}

		return this.getPlan(userId);
	}
}
