import { Router } from "express";
import { NotesController } from "./notes.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router: Router = Router();
const notesController = new NotesController();

router.post(
  "/",
  authMiddleware,
  notesController.generateNotes.bind(notesController)
);

export default router;
