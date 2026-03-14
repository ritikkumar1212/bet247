export type MatchStatus = "LIVE" | "INNINGS_BREAK" | "COMPLETED" | "UNKNOWN";

export interface BallEvent {
  id?: number;
  matchId: string;
  timestamp: string;
  ballNumber: number;
  runs: number;
  isFour: boolean;
  isSix: boolean;
  isWicket: boolean;
  isDot: boolean;
  overNumber: number;
}

export interface Match {
  matchId: string;
  status: MatchStatus;
  marketStatus: "OPEN" | "PAUSED" | "CLOSED";
  lastUpdated: string;
  balls: BallEvent[];
}

export interface OverPattern {
  id?: number;
  matchId: string;
  overNumber: number;
  sequence: string;
  seenCount: number;
  lastOccurrence: string;
}

export interface InningPattern {
  id?: number;
  matchId: string;
  sequence: string[];
  seenCount: number;
  patternStrength: number;
  lastOccurrence: string;
}

export interface MatchPattern {
  id?: number;
  matchId: string;
  timeline: string[];
  similarityPercent: number;
  seenCount: number;
  lastOccurrence: string;
}

export interface MatchPatternComparisonItem {
  id?: number;
  matchId: string;
  timeline: string[];
  seenCount: number;
  lastOccurrence: string;
  currentSeenCount?: number;
  currentLastOccurrence?: string;
  similarityPercent: number;
}

export interface MatchPatternComparison {
  selectedDate: string | null;
  currentMatchId: string;
  previous: MatchPatternComparisonItem[];
  current: MatchPatternComparisonItem[];
  matches: MatchPatternComparisonItem[];
}
