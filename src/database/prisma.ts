import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { env } from "../config/env";

// Configure Neon to use the WebSocket library for Node.js
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
	const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });
	return new PrismaClient({
		adapter,
		log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
	});
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}
