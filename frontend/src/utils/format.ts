export const formatDateTime = (value: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

export const safeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const percentage = (value: number) => `${Math.max(0, Math.min(100, value)).toFixed(0)}%`;

export const getOverFromBallNumber = (ballNumber: number) => {
  if (ballNumber <= 0) return 0;
  return Math.floor((ballNumber - 1) / 6);
};

export const getBallInOver = (ballNumber: number) => {
  if (ballNumber <= 0) return 0;
  return ((ballNumber - 1) % 6) + 1;
};

export const formatOverBall = (ballNumber: number) => {
  return `${getOverFromBallNumber(ballNumber)}.${getBallInOver(ballNumber)}`;
};
