// Week helpers for caching and deterministic weekly windows.
// ISO-like: weeks start on Monday.

export function startOfWeekMs(nowMs: number): number {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d.getTime();
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

// Week id is used only for local caching (not for analytics).
// Format: YYYY-Www (e.g. 2025-W03)
export function weekIdFromMs(nowMs: number): string {
  const weekStart = new Date(startOfWeekMs(nowMs));
  const year = weekStart.getFullYear();

  // Compute week number by counting Mondays since the first Monday of the year.
  const jan1 = new Date(year, 0, 1);
  jan1.setHours(0, 0, 0, 0);
  const firstWeekStart = new Date(startOfWeekMs(jan1.getTime()));
  const diffDays = Math.floor((weekStart.getTime() - firstWeekStart.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.floor(diffDays / 7) + 1;

  return `${year}-W${pad2(weekNum)}`;
}
