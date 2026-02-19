import { db } from "../../config/db";

/* -------- OVER PATTERN -------- */
export const detectOverPattern = async (matchId:string, overNumber:number) => {

  const startBall = (overNumber - 1) * 6 + 1;
  const endBall = overNumber * 6;

  const balls = await db.query(
    `SELECT runs FROM ball_events
     WHERE match_id=$1
     AND ball_number BETWEEN $2 AND $3
     ORDER BY ball_number`,
    [matchId, startBall, endBall]
  );

  if(balls.rows.length < 6) return;

  const signature = balls.rows.map(b=>b.runs).join("-");

  const stats = await db.query(
    `SELECT COUNT(*) as count, MAX(created_at) as last_time
     FROM over_patterns
     WHERE over_signature=$1`,
    [signature]
  );

  await db.query(
    `INSERT INTO over_patterns(match_id,over_number,over_signature)
     VALUES ($1,$2,$3)`,
    [matchId, overNumber, signature]
  );

  return stats.rows[0];
};


/* -------- INNINGS PATTERN -------- */
export const detectInningsPattern = async (matchId:string) => {

  const balls = await db.query(
    `SELECT runs FROM ball_events
     WHERE match_id=$1 ORDER BY ball_number`,
    [matchId]
  );

  const signature = balls.rows.map(b=>b.runs).join("-");

  const stats = await db.query(
    `SELECT COUNT(*) as count, MAX(created_at) as last_time
     FROM innings_patterns
     WHERE innings_signature=$1`,
    [signature]
  );

  await db.query(
    `INSERT INTO innings_patterns(match_id,innings_signature)
     VALUES ($1,$2)`,
    [matchId, signature]
  );

  return stats.rows[0];
};


/* -------- MATCH PATTERN -------- */
export const detectMatchPattern = async (matchId:string) => {

  const balls = await db.query(
    `SELECT runs FROM ball_events
     WHERE match_id=$1 ORDER BY ball_number`,
    [matchId]
  );

  const signature = balls.rows.map(b=>b.runs).join("-");

  const stats = await db.query(
    `SELECT COUNT(*) as count, MAX(created_at) as last_time
     FROM match_patterns
     WHERE match_signature=$1`,
    [signature]
  );

  await db.query(
    `INSERT INTO match_patterns(match_id,match_signature)
     VALUES ($1,$2)`,
    [matchId, signature]
  );

  return stats.rows[0];
};
