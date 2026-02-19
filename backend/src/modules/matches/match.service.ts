import { db } from "../../config/db";

export const getLiveMatch = async (matchId:string)=>{

  const balls = await db.query(
    `SELECT * FROM ball_events
     WHERE match_id=$1
     ORDER BY id DESC LIMIT 30`,
    [matchId]
  );

  return {
    balls: balls.rows
  };
};
