import { db } from "../../config/db";
import {
  detectOverPattern,
  detectInningsPattern,
  detectMatchPattern
} from "../patterns/pattern.service";

export const ingestBall = async (data:any) => {

  await db.query(
    `INSERT INTO ball_events
     (match_id,timestamp,ball_number,runs,is_four,is_six,is_wicket,is_dot)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      data.match_id,
      data.timestamp,
      data.ball_number,
      data.runs,
      data.is_four,
      data.is_six,
      data.is_wicket,
      data.is_dot
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
