import { Router } from "express";
import ingestRoutes from "../modules/ingest/ingest.routes";
import matchRoutes from "../modules/matches/match.routes";
import patternRoutes from "../modules/patterns/pattern.routes";

const router = Router();

router.use("/api", ingestRoutes);
router.use("/api", matchRoutes);
router.use("/api", patternRoutes);

export default router;
