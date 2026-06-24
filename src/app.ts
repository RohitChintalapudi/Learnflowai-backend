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
import analogyRoute from "./modules/workflow/analogy/analogy.route";
import explanationRoute from "./modules/workflow/explanation/explanation.route";
import interviewQuestionsRoute from "./modules/workflow/interview-questions/interviewQuestions.route";
import mindmapRoute from "./modules/workflow/mindmap/mindmap.route";
import notesRoute from "./modules/workflow/notes/notes.route";
import quizRoute from "./modules/workflow/quiz/quiz.route";
import simulationRoute from "./modules/workflow/simulation/simulation.route";
import documentRouter from "./routes/document.routes";

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

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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
app.use("/api/analytics", analyticsRoute);

app.get("/", (_req, res) => {
	res.redirect("http://localhost:5173/login");
});

app.use(notFound);
app.use(errorHandler);

export { app };
