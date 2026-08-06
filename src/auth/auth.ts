import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";
import { env } from "../config/env";
import { prisma } from "../database";
import { hashPassword, verifyPassword } from "./password";

export const allowedOrigins = [
	env.BETTER_AUTH_URL,
	"http://localhost:5173",
	"http://localhost:5174",
	env.FRONTEND_URL,
	`${env.FRONTEND_URL}/`,
	"https://learnflow-ai-prod.vercel.app",
	"https://learnflow-ai-prod.vercel.app/",
	"https://learnflowai-frontend.vercel.app",
	"https://learnflowai-frontend.vercel.app/",
	...(env.TRUSTED_ORIGINS ? env.TRUSTED_ORIGINS.split(",").map((o) => o.trim()) : []),
];

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	errorURL: (() => {
		try {
			const url = new URL(env.BETTER_AUTH_URL);
			if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname.startsWith("192.168.")) {
				return `http://${url.hostname}:5173/login`;
			}
		} catch {}
		return `${env.FRONTEND_URL}/login`;
	})(),
	trustedOrigins: allowedOrigins,
	advanced: {
		defaultCookieAttributes: {
			sameSite: env.NODE_ENV === "production" ? "none" : "lax",
			secure: env.NODE_ENV === "production",
		},
	},
	emailAndPassword: {
		enabled: true,
		password: {
			hash: hashPassword,
			verify: ({ hash, password }) => verifyPassword(password, hash),
		},
	},
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
	},
	plugins: [openAPI()],
	logger: {
		level: "debug",
	},
});
