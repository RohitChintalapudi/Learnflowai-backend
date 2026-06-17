import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Express } from "express";
import { auth } from "./auth";
import { env } from "./config/env";
import { registerSwaggerDocs } from "./docs/swagger";
import { healthRouter } from "./features/health/routes/health-routes";
import documentRouter from "./routes/document.routes";
import { errorHandler } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";

const app: Express = express();

app.use(
	cors({
		origin: [env.BETTER_AUTH_URL, "http://localhost:5173", "http://localhost:5174"],
		credentials: true,
	}),
);

registerSwaggerDocs(app);

// Express 5
app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/health", healthRouter);
app.use("/api/documents", documentRouter);

app.use(notFound);
app.use(errorHandler);

export { app };
