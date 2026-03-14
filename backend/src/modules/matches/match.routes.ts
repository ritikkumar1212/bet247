import { Router } from "express";
import { getLiveMatch, getMatchDetails, getMatchesByDate } from "./match.service";

const router = Router();

router.get("/matches/by-date", async (req, res) => {
  const date = typeof req.query.date === "string" ? req.query.date : "";
  const data = await getMatchesByDate(date);
  res.json(data);
});

router.get("/match/:matchId", async (req, res) => {
  const data = await getMatchDetails(req.params.matchId);
  res.json(data);
});

router.get("/match/:matchId/live", async (req,res)=>{
  const data = await getLiveMatch(req.params.matchId);
  res.json(data);
});

export default router;
