import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import { db } from "../../config/db";

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
  round_id?: string | null;
  card?: string | null;
  over_num?: number | null;
  ball_in_over?: number | null;
  team1_name?: string | null;
  team2_name?: string | null;
  team1_score?: string | null;
  team2_score?: string | null;
  team1_crr?: number | null;
  team2_crr?: number | null;
};

type ReportRow = {
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
  Pattern_Over_Count: number;
  Pattern_Over_Last_Occur: string;
  Pattern_1stInn_Count: number;
  Pattern_1stInn_Last_Occur: string;
  Pattern_FinalScore_Count: number;
  Pattern_FinalScore_Last_Occur: string;
  Pattern_Match_Card_Count: number;
  Pattern_Match_Card_Last_Occur: string;
};

const COLUMNS: Array<keyof ReportRow> = [
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
  "Fancy_MinMax",
  "Pattern_Over_Count",
  "Pattern_Over_Last_Occur",
  "Pattern_1stInn_Count",
  "Pattern_1stInn_Last_Occur",
  "Pattern_FinalScore_Count",
  "Pattern_FinalScore_Last_Occur",
  "Pattern_Match_Card_Count",
  "Pattern_Match_Card_Last_Occur"
];

const RUN_TO_CARD: Record<string, { card: string; cardRuns: number }> = {
  "0": { card: "10", cardRuns: 0 },
  "1": { card: "A", cardRuns: 1 },
  "2": { card: "2", cardRuns: 2 },
  "3": { card: "3", cardRuns: 3 },
  "4": { card: "4", cardRuns: 4 },
  "6": { card: "6", cardRuns: 6 }
};

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const safeIsoTime = (value: Date | string): string => {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
};

const toRoundId = (matchId: string): string => {
  const digits = String(matchId ?? "").match(/\d+/g)?.join("") ?? "";
  return digits || String(matchId ?? "LIVE");
};

const normalizeRuns = (runs: number | string) => {
  const text = String(runs ?? "").trim();
  const lowered = text.toLowerCase();
  if (lowered === "w" || lowered === "ww" || lowered === "wk" || lowered === "wicket") {
    return { text, numeric: -1, isWicketByRuns: true };
  }
  const parsed = Number(text);
  if (Number.isFinite(parsed)) return { text, numeric: parsed, isWicketByRuns: false };
  return { text, numeric: 0, isWicketByRuns: false };
};

const parseScore = (scoreText: string | null | undefined) => {
  const text = String(scoreText ?? "").trim();
  const scoreMatch = text.match(/^(\d+)-(\d+)/);
  const overMatch = text.match(/\((\d+)\.(\d+)\)/);

  const runs = scoreMatch ? Number(scoreMatch[1]) : 0;
  const wickets = scoreMatch ? Number(scoreMatch[2]) : 0;
  const over = overMatch ? Number(overMatch[1]) : 0;
  const ball = overMatch ? Number(overMatch[2]) : 0;
  const oversAsFloat = over + ball / 6;
  const crr = oversAsFloat > 0 ? Number((runs / oversAsFloat).toFixed(2)) : 0;

  return { text, runs, wickets, over, ball, crr };
};

const mapRow = (row: BallEventRow): ReportRow => {
  const runs = normalizeRuns(row.runs);
  const isWicket = Boolean(row.is_wicket) || runs.isWicketByRuns;
  const cardData = isWicket
    ? { card: "K", cardRuns: -1 }
    : RUN_TO_CARD[String(runs.numeric)] ?? { card: "", cardRuns: runs.numeric };
  const team1 = parseScore(row.team1_score);
  const team2 = parseScore(row.team2_score);
  const team1Name = row.team1_name || (team1.text ? "AUS" : "");
  const team2Name = row.team2_name || (team2.text ? "IND" : "");

  return {
    Timestamp: safeIsoTime(row.timestamp),
    Round_ID: String(row.round_id ?? toRoundId(row.match_id)),
    Match_ID: row.match_id,
    Ball_Number: row.ball_number,
    Card: row.card || cardData.card,
    Card_Runs: cardData.cardRuns,
    Runs: runs.text,
    Is_Four: Boolean(row.is_four),
    Is_Six: Boolean(row.is_six),
    Is_Wicket: isWicket,
    Is_Dot: Boolean(row.is_dot),
    Team1_Name: team1Name,
    Team1_Score: team1.text,
    Team1_Wickets: team1.wickets,
    Team1_Over: team1.over,
    Team1_Ball: team1.ball,
    Team1_CRR: Number(row.team1_crr ?? team1.crr),
    Team2_Name: team2Name,
    Team2_Score: team2.text,
    Team2_Wickets: team2.wickets,
    Team2_Over: team2.over,
    Team2_Ball: team2.ball,
    Team2_CRR: Number(row.team2_crr ?? team2.crr),
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
    Fancy_MinMax: "",
    Pattern_Over_Count: 0,
    Pattern_Over_Last_Occur: "None",
    Pattern_1stInn_Count: 0,
    Pattern_1stInn_Last_Occur: "None",
    Pattern_FinalScore_Count: 0,
    Pattern_FinalScore_Last_Occur: "None",
    Pattern_Match_Card_Count: 0,
    Pattern_Match_Card_Last_Occur: "None"
  };
};

const colLetter = (index: number) => {
  let n = index;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
};

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (data: Buffer) => {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const u16 = (n: number) => {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n & 0xffff, 0);
  return b;
};

const u32 = (n: number) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0, 0);
  return b;
};

const makeZip = (files: Array<{ name: string; data: Buffer }>) => {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, "utf8");
    const dataBuf = file.data;
    const crc = crc32(dataBuf);

    const localHeader = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(dataBuf.length),
      u32(dataBuf.length),
      u16(nameBuf.length),
      u16(0),
      nameBuf
    ]);

    localParts.push(localHeader, dataBuf);

    const centralHeader = Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(dataBuf.length),
      u32(dataBuf.length),
      u16(nameBuf.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBuf
    ]);
    centralParts.push(centralHeader);

    offset += localHeader.length + dataBuf.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0)
  ]);

  return Buffer.concat([...localParts, centralDir, eocd]);
};

const toCellXml = (rowIndex: number, colIndex: number, value: unknown, isHeader = false) => {
  const ref = `${colLetter(colIndex)}${rowIndex}`;
  const style = isHeader ? ` s="1"` : "";

  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}"${style}><v>${value}</v></c>`;
  }

  if (typeof value === "boolean") {
    return `<c r="${ref}" t="b"${style}><v>${value ? 1 : 0}</v></c>`;
  }

  const text = value == null ? "" : String(value);
  return `<c r="${ref}" t="inlineStr"${style}><is><t>${xmlEscape(text)}</t></is></c>`;
};

const buildSheetXml = (rows: Array<Partial<ReportRow>>) => {
  const widths = COLUMNS.map((col) => Math.min(Math.max(String(col).length + 2, 10), 36));
  const colsXml = widths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join("");

  const headerCells = COLUMNS.map((col, i) => toCellXml(1, i + 1, col, true)).join("");
  const rowXml = [`<row r="1">${headerCells}</row>`];

  rows.forEach((row, idx) => {
    const r = idx + 2;
    const cells = COLUMNS.map((col, colIdx) => toCellXml(r, colIdx + 1, row[col])).join("");
    rowXml.push(`<row r="${r}">${cells}</row>`);
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${colsXml}</cols>
  <sheetData>${rowXml.join("")}</sheetData>
</worksheet>`;
};

const buildWorkbookBuffer = (rows: Array<Partial<ReportRow>>) => {
  const sheetXml = buildSheetXml(rows);

  const files = [
    {
      name: "[Content_Types].xml",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
      )
    },
    {
      name: "_rels/.rels",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
      )
    },
    {
      name: "xl/workbook.xml",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
      )
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
      )
    },
    {
      name: "xl/styles.xml",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><name val="Calibri"/><sz val="11"/></font>
    <font><b/><color rgb="FFFFFFFF"/><name val="Calibri"/><sz val="11"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="00366092"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">
      <alignment horizontal="center"/>
    </xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>`
      )
    },
    { name: "xl/worksheets/sheet1.xml", data: Buffer.from(sheetXml) }
  ];

  return makeZip(files);
};

const fetchReportRows = async () => {
  const result = await db.query<BallEventRow>(
    `SELECT
       id, match_id, timestamp, ball_number, runs, is_four, is_six, is_wicket, is_dot,
       round_id, card, over_num, ball_in_over, team1_name, team2_name,
       team1_score, team2_score, team1_crr, team2_crr
     FROM ball_events
     ORDER BY timestamp ASC, id ASC`
  );
  return result.rows.map(mapRow);
};

const addMatchGaps = (rows: ReportRow[]) => {
  const withGaps: Array<Partial<ReportRow>> = [];
  let previousMatchId: string | null = null;

  for (const row of rows) {
    if (previousMatchId !== null && row.Match_ID !== previousMatchId) {
      withGaps.push({});
      withGaps.push({});
    }
    withGaps.push(row);
    previousMatchId = row.Match_ID;
  }

  return withGaps;
};

export const downloadReportController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await fetchReportRows();
    if (rows.length === 0) {
      res.status(404).json({ error: "no data found in ball_events" });
      return;
    }

    const reportPath = path.join(process.cwd(), "5five_cricket_patterns.xlsx");
    const xlsxBuffer = buildWorkbookBuffer(addMatchGaps(rows));
    await fs.promises.writeFile(reportPath, xlsxBuffer);

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
    const details = error instanceof Error ? error.message : "unknown error";
    res.status(500).json({ error: "failed to generate report", details });
  }
};
