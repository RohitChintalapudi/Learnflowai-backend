import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";
import { env } from "../config/env";
import { prisma } from "../database";

export const allowedOrigins = [
	env.BETTER_AUTH_URL,
	"http://localhost:5173",
	"http://localhost:5174",
	...(env.TRUSTED_ORIGINS ? env.TRUSTED_ORIGINS.split(",").map((o) => o.trim()) : []),
];

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	errorURL: "http://localhost:5173/login",
	trustedOrigins: allowedOrigins,
	emailAndPassword: {
		enabled: true,
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
