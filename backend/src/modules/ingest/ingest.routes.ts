import { Router } from "express";
import { ingestBallController } from "./ingest.controller";

const router = Router();

router.post("/ingest/ball", ingestBallController);

export default router;
