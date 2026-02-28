import { Router } from "express";
import { downloadReportController } from "./report.controller";

const reportRoutes = Router();

reportRoutes.get("/download", downloadReportController);

export default reportRoutes;
