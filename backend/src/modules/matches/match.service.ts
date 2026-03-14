import { db } from "../../config/db";

const resolveMatchId = async (matchId: string) => {
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

export const getLiveMatch = async (matchId: string) => {
  const resolvedMatchId = await resolveMatchId(matchId);

  const balls = await db.query(
    `SELECT *
     FROM ball_events
     WHERE match_id = $1
     ORDER BY id DESC
     LIMIT 30`,
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

export const getMatchesByDate = async (date: string) => {
  const resolvedDate = String(date ?? "").trim();
  if (!resolvedDate) {
    return [];
  }

  const result = await db.query(
    `SELECT
       match_id,
       MIN(timestamp) as started_at,
       MAX(timestamp) as last_updated,
       COUNT(*)::int as ball_count,
       MAX(team1_name) FILTER (WHERE team1_name IS NOT NULL AND team1_name <> '') as team1_name,
       MAX(team2_name) FILTER (WHERE team2_name IS NOT NULL AND team2_name <> '') as team2_name,
       (
         ARRAY_AGG(team1_score ORDER BY timestamp DESC, id DESC)
         FILTER (WHERE team1_score IS NOT NULL AND team1_score <> '')
       )[1] as team1_score,
       (
         ARRAY_AGG(team2_score ORDER BY timestamp DESC, id DESC)
         FILTER (WHERE team2_score IS NOT NULL AND team2_score <> '')
       )[1] as team2_score
     FROM ball_events
     WHERE DATE(timestamp) = $1::date
     GROUP BY match_id
     ORDER BY last_updated DESC NULLS LAST`,
    [resolvedDate]
  );

  return result.rows;
};

export const getMatchDetails = async (matchId: string) => {
  const resolvedMatchId = await resolveMatchId(matchId);

  const ballsResult = await db.query(
    `SELECT *
     FROM ball_events
     WHERE match_id = $1
     ORDER BY ball_number ASC, id ASC`,
    [resolvedMatchId]
  );

  const summaryResult = await db.query(
    `SELECT
       match_id,
       MIN(timestamp) as started_at,
       MAX(timestamp) as last_updated,
       COUNT(*)::int as ball_count,
       MAX(team1_name) FILTER (WHERE team1_name IS NOT NULL AND team1_name <> '') as team1_name,
       MAX(team2_name) FILTER (WHERE team2_name IS NOT NULL AND team2_name <> '') as team2_name,
       (
         ARRAY_AGG(team1_score ORDER BY timestamp DESC, id DESC)
         FILTER (WHERE team1_score IS NOT NULL AND team1_score <> '')
       )[1] as team1_score,
       (
         ARRAY_AGG(team2_score ORDER BY timestamp DESC, id DESC)
         FILTER (WHERE team2_score IS NOT NULL AND team2_score <> '')
       )[1] as team2_score
     FROM ball_events
     WHERE match_id = $1
     GROUP BY match_id`,
    [resolvedMatchId]
  );

  const summary = summaryResult.rows[0];
  const lastBall = ballsResult.rows[ballsResult.rows.length - 1];

  return {
    match_id: resolvedMatchId,
    status: lastBall ? "COMPLETED" : "UNKNOWN",
    market_status: "CLOSED",
    started_at: summary?.started_at ?? null,
    last_updated: summary?.last_updated ?? new Date().toISOString(),
    ball_count: summary?.ball_count ?? 0,
    teams: {
      team1_name: summary?.team1_name ?? "",
      team1_score: summary?.team1_score ?? "",
      team2_name: summary?.team2_name ?? "",
      team2_score: summary?.team2_score ?? ""
    },
    balls: ballsResult.rows
  };
};
