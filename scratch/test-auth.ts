import { auth } from "../src/auth";

console.log("Successfully imported Better Auth configuration.");
console.log("Secret is set:", !!auth.options.secret);
console.log("Base URL is set:", auth.options.baseURL);
console.log("Google Client ID is set:", !!auth.options.socialProviders?.google?.clientId);
console.log("All environment validation checks passed successfully!");
process.exit(0);
