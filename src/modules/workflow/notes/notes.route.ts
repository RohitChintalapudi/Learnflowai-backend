import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { NotesController } from "./notes.controller";

const router: Router = Router();
const notesController = new NotesController();

router.post("/", authMiddleware, notesController.generateNotes.bind(notesController));

router.get("/", authMiddleware, notesController.getNotes.bind(notesController));

router.delete("/:id", authMiddleware, notesController.deleteNote.bind(notesController));

export default router;
