import bcrypt from "bcryptjs";
import { verifyPassword as verifyBetterAuthPassword } from "better-auth/crypto";

const BCRYPT_SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
		return bcrypt.compare(password, hash);
	}

	return verifyBetterAuthPassword({
		hash,
		password,
	});
}
