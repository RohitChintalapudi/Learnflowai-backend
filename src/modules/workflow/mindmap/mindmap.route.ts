import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { MindMapController } from "./mindmap.controller";

const router: Router = Router();
const mindMapController = new MindMapController();

router.post("/", authMiddleware, mindMapController.generateMindMap.bind(mindMapController));

router.post("/explain", authMiddleware, mindMapController.explainMindMap.bind(mindMapController));

export default router;
