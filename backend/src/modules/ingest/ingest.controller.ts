import { Request, Response } from "express";
import { ingestBall } from "./ingest.service";

export const ingestBallController = async (req:Request,res:Response)=>{
  try{
    await ingestBall(req.body);
    res.json({success:true});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"failed"});
  }
};
