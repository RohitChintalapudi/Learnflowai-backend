import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth } from "../auth/auth";
import { env } from "../config/env";
import { prisma } from "../database";

export const authMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		// Allow test user ID bypass in dev/test mode
		const testUserId = req.headers["x-test-user-id"];
		if (testUserId && env.NODE_ENV !== "production") {
			const user = await prisma.user.findUnique({
				where: { id: testUserId as string },
			});
			if (user) {
				req.user = user as any;
				next();
				return;
			}
		}

		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers),
		});

		if (!session) {
			res.status(401).json({ success: false, message: "Unauthorized" });
			return;
		}

		req.user = session.user as any;
		req.session = session.session as any;

		next();
	} catch (error) {
		console.error("Auth middleware error:", error);
		res
			.status(500)
			.json({ success: false, message: "Internal server error during authentication" });
	}
};
