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

router.get(
  "/",
  authMiddleware,
  notesController.getNotes.bind(notesController)
);

router.delete(
  "/:id",
  authMiddleware,
  notesController.deleteNote.bind(notesController)
);

export default router;
