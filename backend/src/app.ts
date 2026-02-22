import express from "express";
import cors from "cors";
import routes from "./routes";import ingestRoutes from "./modules/ingest/ingest.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/ingest", ingestRoutes);


app.use(routes);

export default app;
