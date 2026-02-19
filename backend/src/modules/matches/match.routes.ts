import { Router } from "express";
import { getLiveMatch } from "./match.service";

const router = Router();

router.get("/match/:matchId/live", async (req,res)=>{
  const data = await getLiveMatch(req.params.matchId);
  res.json(data);
});

export default router;
