export function minutesToSeconds(minutes: number) {
  return Math.max(0, Math.round(minutes * 60));
}

export function formatDuration(seconds: number) {
  const absolute = Math.abs(Math.round(seconds));
  const minutes = Math.floor(absolute / 60);
  const rest = absolute % 60;
  const prefix = seconds < 0 ? "+" : "";
  return `${prefix}${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function sameDay(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
