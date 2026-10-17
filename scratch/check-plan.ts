import { prisma } from "../src/database/prisma";
import { PlanService } from "../src/modules/plan/plan.service";

async function main() {
	const email = process.argv[2];
	const action = process.argv[3] || "show";

	const user = await prisma.user.findFirst({ where: { email } });
	if (!user) {
		console.log("USER_FOUND: false");
		return;
	}

	if (action === "expire") {
		const past = new Date();
		past.setDate(past.getDate() - 1);
		await prisma.user.update({
			where: { id: user.id },
			data: { planExpiresAt: past },
		});
		console.log("EXPIRED_SET: true");
	}

	console.log("DB_ROW:", JSON.stringify({
		plan: user.plan,
		planInterval: user.planInterval,
		planStartedAt: user.planStartedAt,
		planExpiresAt: user.planExpiresAt,
	}));

	const status = await PlanService.getPlan(user.id);
	console.log("PLAN_STATUS:", JSON.stringify(status));

	const after = await prisma.user.findFirst({ where: { email } });
	console.log("DB_ROW_AFTER_GET:", JSON.stringify({
		plan: after?.plan,
		planInterval: after?.planInterval,
		planStartedAt: after?.planStartedAt,
		planExpiresAt: after?.planExpiresAt,
	}));
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
