export type TimerPhase = "thinking" | "solving" | "overtime";

export type SessionResult =
  | "solved"
  | "solved_overtime"
  | "stuck"
  | "mistake"
  | "checked_answer";

export type Template = {
  id: string;
  name: string;
  subject: string;
  chapter: string;
  problemType: string;
  familiarity: number;
  mastery: number;
  thinkingMinutes: number;
  solvingMinutes: number;
  totalMinutes: number;
  accent: string;
};

export type SessionRecord = {
  id: string;
  templateId: string;
  templateName: string;
  subject: string;
  chapter: string;
  problemType: string;
  result: SessionResult;
  elapsedSeconds: number;
  thinkingLimitSeconds: number;
  solvingLimitSeconds: number;
  totalLimitSeconds: number;
  note: string;
  createdAt: string;
};
