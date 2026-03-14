import { Router } from "express";
import { db } from "../../config/db";

const router = Router();

const resolveMatchId = async (matchId?: string) => {
  const requestedMatchId = String(matchId ?? "").trim();
  if (requestedMatchId && requestedMatchId.toUpperCase() !== "LIVE") {
    return requestedMatchId;
  }

  const latestMatch = await db.query(
    `SELECT match_id
     FROM ball_events
     WHERE match_id IS NOT NULL
     ORDER BY timestamp DESC NULLS LAST, id DESC
     LIMIT 1`
  );

  return String(latestMatch.rows[0]?.match_id ?? "LIVE");
};

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

router.get("/patterns/match/compare", async (req, res) => {
  try {
    const requestedMatchId = typeof req.query.matchId === "string" ? req.query.matchId : undefined;
    const historyDate = typeof req.query.historyDate === "string" ? req.query.historyDate : undefined;
    const currentMatchId = await resolveMatchId(requestedMatchId);

    const currentResult = await db.query(
      `SELECT
         MIN(id) as id,
         match_id,
         match_signature,
         COUNT(*)::int as count,
         MAX(created_at) as last_time
       FROM match_patterns
       WHERE match_id = $1
       GROUP BY match_id, match_signature
       ORDER BY last_time DESC
       LIMIT 200`,
      [currentMatchId]
    );

    const previousResult = historyDate
      ? await db.query(
          `SELECT
             MIN(id) as id,
             match_id,
             match_signature,
             COUNT(*)::int as count,
             MAX(created_at) as last_time
           FROM match_patterns
           WHERE DATE(created_at) = $1::date
           GROUP BY match_id, match_signature
           ORDER BY last_time DESC
           LIMIT 200`,
          [historyDate]
        )
      : { rows: [] };

    const matchesResult = historyDate
      ? await db.query(
          `SELECT
             MIN(old_patterns.id) as id,
             old_patterns.match_id,
             old_patterns.match_signature,
             COUNT(*)::int as count,
             MAX(old_patterns.created_at) as last_time,
             MAX(current_patterns.created_at) as current_last_time,
             COUNT(current_patterns.id)::int as current_count
           FROM match_patterns old_patterns
           INNER JOIN match_patterns current_patterns
             ON current_patterns.match_id = $1
            AND current_patterns.match_signature = old_patterns.match_signature
           WHERE DATE(old_patterns.created_at) = $2::date
             AND old_patterns.match_id <> $1
           GROUP BY old_patterns.match_id, old_patterns.match_signature
           ORDER BY last_time DESC
           LIMIT 200`,
          [currentMatchId, historyDate]
        )
      : { rows: [] };

    res.json({
      selectedDate: historyDate ?? null,
      currentMatchId,
      previous: previousResult.rows,
      current: currentResult.rows,
      matches: matchesResult.rows
    });
  } catch (error) {
    console.error("Failed to compare match patterns:", error);
    res.status(500).json({ error: "failed to compare match patterns" });
  }
});

export default router;
