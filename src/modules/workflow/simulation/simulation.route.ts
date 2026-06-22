import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { SimulationController } from "./simulation.controller";

const router: Router = Router();
const simulationController = new SimulationController();

router.post("/", authMiddleware, simulationController.generateSimulation.bind(simulationController));

export default router;
