import { db } from "../../config/db";

export const getLiveMatch = async (matchId:string)=>{
  const requestedMatchId = String(matchId ?? "").trim();
  let resolvedMatchId = requestedMatchId;

  // "LIVE" means "show the latest active match from DB", not a literal match id.
  if (!resolvedMatchId || resolvedMatchId.toUpperCase() === "LIVE") {
    const latestMatch = await db.query(
      `SELECT match_id
       FROM ball_events
       WHERE match_id IS NOT NULL
       ORDER BY timestamp DESC NULLS LAST, id DESC
       LIMIT 1`
    );

    resolvedMatchId = String(latestMatch.rows[0]?.match_id ?? "LIVE");
  }

  const balls = await db.query(
    `SELECT * FROM ball_events
     WHERE match_id=$1
     ORDER BY id DESC LIMIT 30`,
    [resolvedMatchId]
  );

  const latestBall = balls.rows[0];

  return {
    match_id: resolvedMatchId,
    status: latestBall ? "LIVE" : "UNKNOWN",
    market_status: "OPEN",
    last_updated: latestBall?.timestamp ?? new Date().toISOString(),
    balls: balls.rows
  };
};
