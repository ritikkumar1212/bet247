import { Router } from "express";
import { db } from "../../config/db";

const router = Router();

router.get("/patterns/overs", async (req, res) => {
  try {
    const matchId = typeof req.query.matchId === "string" ? req.query.matchId : undefined;

    const result = await db.query(
      `SELECT
         MIN(id) as id,
         match_id,
         over_number,
         over_signature,
         COUNT(*)::int as count,
         MAX(created_at) as last_time
       FROM over_patterns
       WHERE ($1::text IS NULL OR match_id = $1)
       GROUP BY match_id, over_number, over_signature
       ORDER BY last_time DESC
       LIMIT 200`,
      [matchId ?? null]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch over patterns:", error);
    res.status(500).json({ error: "failed to fetch over patterns" });
  }
});

router.get("/patterns/innings", async (req, res) => {
  try {
    const matchId = typeof req.query.matchId === "string" ? req.query.matchId : undefined;

    const result = await db.query(
      `SELECT
         MIN(id) as id,
         match_id,
         innings_signature,
         COUNT(*)::int as count,
         MAX(created_at) as last_time
       FROM innings_patterns
       WHERE ($1::text IS NULL OR match_id = $1)
       GROUP BY match_id, innings_signature
       ORDER BY last_time DESC
       LIMIT 200`,
      [matchId ?? null]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch innings patterns:", error);
    res.status(500).json({ error: "failed to fetch innings patterns" });
  }
});

router.get("/patterns/match", async (req, res) => {
  try {
    const matchId = typeof req.query.matchId === "string" ? req.query.matchId : undefined;

    const result = await db.query(
      `SELECT
         MIN(id) as id,
         match_id,
         match_signature,
         COUNT(*)::int as count,
         MAX(created_at) as last_time
       FROM match_patterns
       WHERE ($1::text IS NULL OR match_id = $1)
       GROUP BY match_id, match_signature
       ORDER BY last_time DESC
       LIMIT 200`,
      [matchId ?? null]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch match patterns:", error);
    res.status(500).json({ error: "failed to fetch match patterns" });
  }
});

export default router;
