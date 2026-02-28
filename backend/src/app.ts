import express from "express";
import cors from "cors";
import routes from "./routes";
import ingestRoutes from "./modules/ingest/ingest.routes";
import reportRoutes from "./modules/report/report.routes";

const app = express();

app.use(
  cors({
    exposedHeaders: ["Content-Disposition"]
  })
);
app.use(express.json());
app.use("/api/ingest", ingestRoutes);
app.use("/api/report", reportRoutes);


app.use(routes);

export default app;
