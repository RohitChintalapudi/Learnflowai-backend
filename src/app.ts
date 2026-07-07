import path from "node:path";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Express } from "express";
import { allowedOrigins, auth } from "./auth";
import { registerSwaggerDocs } from "./docs/swagger";
import { healthRouter } from "./features/health/routes/health-routes";
import { errorHandler } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";
import analyticsRoute from "./modules/analytics/analytics.route";
import dashboardRoute from "./modules/dashboard/dashboard.route";
import learningHistoryRoute from "./modules/learning-history/learningHistory.route";
import profileRoute from "./modules/profile/profile.route";
import quizDashboardRoute from "./modules/quiz-dashboard/quizDashboard.route";
import accountSettingsRoute from "./modules/settings/account/account.route";
import changePasswordRoute from "./modules/settings/change-password/changePassword.route";
import deleteAccountRoute from "./modules/settings/delete-account/deleteAccount.route";
import settingsExportRoute from "./modules/settings/export/export.route";
import settingsStorageRoute from "./modules/settings/storage/storage.route";
import analogyRoute from "./modules/workflow/analogy/analogy.route";
import explanationRoute from "./modules/workflow/explanation/explanation.route";
import interviewQuestionsRoute from "./modules/workflow/interview-questions/interviewQuestions.route";
import mindmapRoute from "./modules/workflow/mindmap/mindmap.route";
import notesRoute from "./modules/workflow/notes/notes.route";
import quizRoute from "./modules/workflow/quiz/quiz.route";
import simulationRoute from "./modules/workflow/simulation/simulation.route";
import documentRouter from "./routes/document.routes";

import alertsRoute from "./modules/alerts/alerts.route";

const app: Express = express();

app.set("trust proxy", true);

app.use(
	cors({
		origin: allowedOrigins,
		credentials: true,
	}),
);

registerSwaggerDocs(app);

// Express 5
app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory with caching headers for fast reload
app.use(
	"/uploads",
	express.static(path.join(process.cwd(), "uploads"), {
		maxAge: "30d",
		etag: true,
		lastModified: true,
	}),
);

app.use("/api/health", healthRouter);
app.use("/api/documents", documentRouter);
app.use("/api/workflow/explanation", explanationRoute);
app.use("/api/workflow/interview-questions", interviewQuestionsRoute);
app.use("/api/workflow/quiz", quizRoute);
app.use("/api/workflow/notes", notesRoute);
app.use("/api/workflow/mindmap", mindmapRoute);
app.use("/api/workflow/analogy", analogyRoute);
app.use("/api/workflow/simulation", simulationRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/quizzes", quizDashboardRoute);
app.use("/api/profile", profileRoute);
app.use("/api/learning-history", learningHistoryRoute);
app.use("/api/settings/account", accountSettingsRoute);
app.use("/api/settings/storage", settingsStorageRoute);
app.use("/api/settings/export", settingsExportRoute);
app.use("/api/settings/delete-account", deleteAccountRoute);
app.use("/api/settings/change-password", changePasswordRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/alerts", alertsRoute);

app.get("/", (req, res) => {
	const host = req.get("host")?.split(":")[0] || "localhost";
	const isLocal = host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.");
	if (isLocal) {
		res.redirect(`http://${host}:5173/login`);
	} else {
		res.redirect("https://ai-doubt-clarification.vercel.app/login");
	}
});

app.use(notFound);
app.use(errorHandler);

export { app };
