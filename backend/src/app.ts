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

app.get("/live", (_req, res) => {
  const frontendUrl = process.env.FRONTEND_URL;

  if (frontendUrl) {
    res.redirect(302, `${frontendUrl.replace(/\/+$/, "")}/live`);
    return;
  }

  res.status(200).json({
    ok: true,
    message: "Live endpoint moved. Use /api/match/:matchId/live"
  });
});

app.use(routes);

export default app;
