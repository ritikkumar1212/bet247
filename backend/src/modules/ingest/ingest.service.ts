import { db } from "../../config/db";
import {
  detectOverPattern,
  detectInningsPattern,
  detectMatchPattern
} from "../patterns/pattern.service";

let schemaReady = false;

const ensureBallEventsSchema = async () => {
  if (schemaReady) return;

  await db.query(`
    ALTER TABLE ball_events
      ADD COLUMN IF NOT EXISTS round_id TEXT,
      ADD COLUMN IF NOT EXISTS card TEXT,
      ADD COLUMN IF NOT EXISTS over_num INT,
      ADD COLUMN IF NOT EXISTS ball_in_over INT,
      ADD COLUMN IF NOT EXISTS team1_name TEXT,
      ADD COLUMN IF NOT EXISTS team2_name TEXT,
      ADD COLUMN IF NOT EXISTS team1_score TEXT,
      ADD COLUMN IF NOT EXISTS team2_score TEXT,
      ADD COLUMN IF NOT EXISTS team1_crr NUMERIC,
      ADD COLUMN IF NOT EXISTS team2_crr NUMERIC
  `);

  schemaReady = true;
};

export const ingestBall = async (data:any) => {
  await ensureBallEventsSchema();

  await db.query(
    `INSERT INTO ball_events
     (
       match_id,timestamp,ball_number,runs,is_four,is_six,is_wicket,is_dot,
       round_id,card,over_num,ball_in_over,
       team1_name,team2_name,team1_score,team2_score,team1_crr,team2_crr
     )
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      data.match_id,
      data.timestamp,
      data.ball_number,
      data.runs,
      data.is_four,
      data.is_six,
      data.is_wicket,
      data.is_dot,
      data.round_id ?? null,
      data.card ?? null,
      data.over ?? null,
      data.ball ?? null,
      data.team1_name ?? null,
      data.team2_name ?? null,
      data.team1_score ?? null,
      data.team2_score ?? null,
      data.team1_crr ?? null,
      data.team2_crr ?? null
    ]
  );

  /* ---------- PATTERN TRIGGERS ---------- */

  const overNumber = Math.ceil(data.ball_number / 6);

  if(data.ball_number % 6 === 0){
    await detectOverPattern(data.match_id, overNumber);
  }

  if(data.match_status === "INNINGS_BREAK"){
    await detectInningsPattern(data.match_id);
  }

  if(data.match_status === "COMPLETED"){
    await detectMatchPattern(data.match_id);
  }
};
