import { Router } from "express";
import ingestRoutes from "../modules/ingest/ingest.routes";
import matchRoutes from "../modules/matches/match.routes";

const router = Router();

router.use("/api", ingestRoutes);
router.use("/api", matchRoutes);

export default router;
