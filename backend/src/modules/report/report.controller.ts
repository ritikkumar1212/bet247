import { exec as execCallback } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import type { Request, Response } from "express";
import { db } from "../../config/db";

const execAsync = promisify(execCallback);

type BallEventRow = {
  id: number;
  match_id: string;
  timestamp: Date | string;
  ball_number: number;
  runs: number | string;
  is_four: boolean;
  is_six: boolean;
  is_wicket: boolean;
  is_dot: boolean;
};

type ReportCsvRow = {
  Timestamp: string;
  Round_ID: string;
  Match_ID: string;
  Ball_Number: number;
  Card: string;
  Card_Runs: number;
  Runs: string;
  Is_Four: boolean;
  Is_Six: boolean;
  Is_Wicket: boolean;
  Is_Dot: boolean;
  Team1_Name: string;
  Team1_Score: string;
  Team1_Wickets: number;
  Team1_Over: number;
  Team1_Ball: number;
  Team1_CRR: number;
  Team2_Name: string;
  Team2_Score: string;
  Team2_Wickets: number;
  Team2_Over: number;
  Team2_Ball: number;
  Team2_CRR: number;
  Match_Status: string;
  Bookmaker_Status: string;
  Bookmaker_MinMax: string;
  Bookmaker_AUS_Back_Odd: string;
  Bookmaker_AUS_Back_Vol: string;
  Bookmaker_AUS_Lay_Odd: string;
  Bookmaker_AUS_Lay_Vol: string;
  Bookmaker_IND_Back_Odd: string;
  Bookmaker_IND_Back_Vol: string;
  Bookmaker_IND_Lay_Odd: string;
  Bookmaker_IND_Lay_Vol: string;
  Fancy_Status: string;
  Fancy_Name: string;
  Fancy_No_Odd: string;
  Fancy_No_Vol: string;
  Fancy_Yes_Odd: string;
  Fancy_Yes_Vol: string;
  Fancy_MinMax: string;
};

const CSV_COLUMNS: Array<keyof ReportCsvRow> = [
  "Timestamp",
  "Round_ID",
  "Match_ID",
  "Ball_Number",
  "Card",
  "Card_Runs",
  "Runs",
  "Is_Four",
  "Is_Six",
  "Is_Wicket",
  "Is_Dot",
  "Team1_Name",
  "Team1_Score",
  "Team1_Wickets",
  "Team1_Over",
  "Team1_Ball",
  "Team1_CRR",
  "Team2_Name",
  "Team2_Score",
  "Team2_Wickets",
  "Team2_Over",
  "Team2_Ball",
  "Team2_CRR",
  "Match_Status",
  "Bookmaker_Status",
  "Bookmaker_MinMax",
  "Bookmaker_AUS_Back_Odd",
  "Bookmaker_AUS_Back_Vol",
  "Bookmaker_AUS_Lay_Odd",
  "Bookmaker_AUS_Lay_Vol",
  "Bookmaker_IND_Back_Odd",
  "Bookmaker_IND_Back_Vol",
  "Bookmaker_IND_Lay_Odd",
  "Bookmaker_IND_Lay_Vol",
  "Fancy_Status",
  "Fancy_Name",
  "Fancy_No_Odd",
  "Fancy_No_Vol",
  "Fancy_Yes_Odd",
  "Fancy_Yes_Vol",
  "Fancy_MinMax"
];

const RUN_TO_CARD: Record<string, { card: string; cardRuns: number }> = {
  "0": { card: "10", cardRuns: 0 },
  "1": { card: "A", cardRuns: 1 },
  "2": { card: "2", cardRuns: 2 },
  "3": { card: "3", cardRuns: 3 },
  "4": { card: "4", cardRuns: 4 },
  "6": { card: "6", cardRuns: 6 }
};

const safeIsoTime = (value: Date | string): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }
  return parsed.toISOString();
};

const toRoundId = (matchId: string): string => {
  const digits = String(matchId ?? "").match(/\d+/g)?.join("") ?? "";
  return digits || String(matchId ?? "LIVE");
};

const normalizeRuns = (runs: number | string): { text: string; numeric: number; isWicketByRuns: boolean } => {
  const text = String(runs ?? "").trim();
  const lowered = text.toLowerCase();

  if (lowered === "w" || lowered === "ww" || lowered === "wk" || lowered === "wicket") {
    return { text, numeric: -1, isWicketByRuns: true };
  }

  const parsed = Number(text);
  if (Number.isFinite(parsed)) {
    return { text, numeric: parsed, isWicketByRuns: false };
  }

  return { text, numeric: 0, isWicketByRuns: false };
};

const escapeCsv = (value: unknown): string => {
  const raw = value == null ? "" : String(value);
  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replace(/"/g, "\"\"")}"`;
  }
  return raw;
};

const mapRowToCsv = (row: BallEventRow): ReportCsvRow => {
  const runs = normalizeRuns(row.runs);
  const isWicket = Boolean(row.is_wicket) || runs.isWicketByRuns;
  const cardData = isWicket ? { card: "K", cardRuns: -1 } : RUN_TO_CARD[String(runs.numeric)] ?? { card: "", cardRuns: runs.numeric };

  return {
    Timestamp: safeIsoTime(row.timestamp),
    Round_ID: toRoundId(row.match_id),
    Match_ID: row.match_id,
    Ball_Number: row.ball_number,
    Card: cardData.card,
    Card_Runs: cardData.cardRuns,
    Runs: runs.text,
    Is_Four: Boolean(row.is_four),
    Is_Six: Boolean(row.is_six),
    Is_Wicket: isWicket,
    Is_Dot: Boolean(row.is_dot),
    Team1_Name: "",
    Team1_Score: "",
    Team1_Wickets: 0,
    Team1_Over: 0,
    Team1_Ball: 0,
    Team1_CRR: 0,
    Team2_Name: "",
    Team2_Score: "",
    Team2_Wickets: 0,
    Team2_Over: 0,
    Team2_Ball: 0,
    Team2_CRR: 0,
    Match_Status: "LIVE",
    Bookmaker_Status: "",
    Bookmaker_MinMax: "",
    Bookmaker_AUS_Back_Odd: "",
    Bookmaker_AUS_Back_Vol: "",
    Bookmaker_AUS_Lay_Odd: "",
    Bookmaker_AUS_Lay_Vol: "",
    Bookmaker_IND_Back_Odd: "",
    Bookmaker_IND_Back_Vol: "",
    Bookmaker_IND_Lay_Odd: "",
    Bookmaker_IND_Lay_Vol: "",
    Fancy_Status: "",
    Fancy_Name: "",
    Fancy_No_Odd: "",
    Fancy_No_Vol: "",
    Fancy_Yes_Odd: "",
    Fancy_Yes_Vol: "",
    Fancy_MinMax: ""
  };
};

const writeCsvFromDatabase = async (csvPath: string): Promise<number> => {
  const result = await db.query<BallEventRow>(
    `SELECT id, match_id, timestamp, ball_number, runs, is_four, is_six, is_wicket, is_dot
     FROM ball_events
     ORDER BY timestamp ASC, id ASC`
  );

  if (result.rows.length === 0) {
    return 0;
  }

  const rows = result.rows.map(mapRowToCsv);
  const header = CSV_COLUMNS.join(",");
  const body = rows
    .map((row) => CSV_COLUMNS.map((col) => escapeCsv(row[col])).join(","))
    .join("\n");

  await fs.promises.writeFile(csvPath, `${header}\n${body}\n`, "utf8");
  return rows.length;
};

const resolvePatternScript = async (projectRoot: string): Promise<string | null> => {
  const candidates = [
    path.join(projectRoot, "pattern_matcher.py"),
    path.join(projectRoot, "..", "scrapper", "pattern_matcher.py")
  ];

  for (const candidate of candidates) {
    try {
      await fs.promises.access(candidate, fs.constants.F_OK);
      return candidate;
    } catch {
      // try next path
    }
  }

  return null;
};

export const downloadReportController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const projectRoot = process.cwd();
    const csvPath = path.join(projectRoot, "cricket_data.csv");
    const reportPath = path.join(projectRoot, "5five_cricket_patterns.xlsx");

    const scriptPath = await resolvePatternScript(projectRoot);
    if (!scriptPath) {
      res.status(500).json({ error: "pattern_matcher.py not found" });
      return;
    }

    const rowCount = await writeCsvFromDatabase(csvPath);
    if (rowCount === 0) {
      res.status(404).json({ error: "no data found in ball_events" });
      return;
    }

    await fs.promises.rm(reportPath, { force: true });

    const scriptDir = path.dirname(scriptPath);
    const scriptName = path.basename(scriptPath);

    await execAsync(`python3 "${scriptName}" "${csvPath}"`, {
      cwd: scriptDir,
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024
    });

    await fs.promises.access(reportPath, fs.constants.F_OK);

    res.download(reportPath, "cricket_report.xlsx", (error) => {
      if (error) {
        console.error("Failed to send report file:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "failed to send report file" });
        }
      }
    });
  } catch (error) {
    console.error("Report generation failed:", error);
    res.status(500).json({ error: "failed to generate report" });
  }
};
