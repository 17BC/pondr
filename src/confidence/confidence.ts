import type { ConfidenceScore, Decision, DecisionCategory, DirectionStatus } from '../models/decision';

export type ConfidenceBand = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
export type ConfidenceTrend = 'UP' | 'DOWN' | 'STEADY' | 'NA';

// Window choice (used consistently across Home / Insights / Review):
// Calendar week in local device time, starting Monday 00:00 through next Monday 00:00.
// This keeps summaries stable and easy to understand.
// weekStartDay follows JS Date.getDay(): 0=Sun ... 6=Sat.
export function startOfWeekMs(nowMs: number, weekStartDay: number = 1): number {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const start = Number(weekStartDay);
  const diff = (day - start + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

export function getCurrentWeekRange(nowMs: number = Date.now(), weekStartDay: number = 1): { start: Date; end: Date } {
  const startMs = startOfWeekMs(nowMs, weekStartDay);
  const endMs = startMs + 7 * 24 * 60 * 60 * 1000;
  return { start: new Date(startMs), end: new Date(endMs) };
}

export function getPreviousWeekRange(nowMs: number = Date.now(), weekStartDay: number = 1): { start: Date; end: Date } {
  const current = getCurrentWeekRange(nowMs, weekStartDay);
  const startMs = current.start.getTime() - 7 * 24 * 60 * 60 * 1000;
  const endMs = current.start.getTime();
  return { start: new Date(startMs), end: new Date(endMs) };
}

export function clampConfidence(n: number): ConfidenceScore {
  const rounded = Math.round(n);
  if (rounded <= 1) return 1;
  if (rounded >= 5) return 5;
  return rounded as ConfidenceScore;
}

export function avgConfidence(decisions: Array<{ confidence: number }>): number | null {
  if (decisions.length === 0) return null;
  const sum = decisions.reduce((s, d) => s + Number(d.confidence), 0);
  return sum / decisions.length;
}

export function confidenceBand(avg: number | null): ConfidenceBand {
  if (!avg || avg <= 0) return 'NONE';
  if (avg >= 4.0) return 'HIGH';
  if (avg >= 2.5) return 'MEDIUM';
  return 'LOW';
}

export function computeConfidenceTrend(currentAvg: number | null, prevAvg: number | null): ConfidenceTrend {
  if (currentAvg === null || prevAvg === null) return 'NA';
  const delta = currentAvg - prevAvg;
  if (delta >= 0.3) return 'UP';
  if (delta <= -0.3) return 'DOWN';
  return 'STEADY';
}

export function confidenceTrendCopy(trend: ConfidenceTrend): string {
  if (trend === 'UP') return 'Confidence has been trending up recently.';
  if (trend === 'DOWN') return 'Confidence has been trending down recently.';
  if (trend === 'STEADY') return 'Confidence has been holding steady recently.';
  return 'Log a few decisions over time to see a confidence trend.';
}

export function computeDirectionStatus(weekCount: number, weekAvg: number | null): DirectionStatus {
  if (weekCount === 0) return 'NO_SIGNAL';

  const avg = weekAvg ?? 0;

  if (weekCount === 1 || weekCount === 2) {
    if (weekAvg !== null && avg < 2.5) return 'DRIFTING';
    return 'STABLE';
  }

  if (avg >= 4.0) return 'GROWING';
  if (avg < 2.5) return 'DRIFTING';
  return 'STABLE';
}

export function avgConfidenceLabel(input: { count: number; avg: number | null }): { label: string; value: string } {
  if (input.count <= 0 || input.avg === null) {
    return { label: 'Avg confidence', value: '—' };
  }

  const base = input.count < 3 ? 'Avg confidence (so far)' : 'Avg confidence';
  return { label: base, value: input.avg.toFixed(1) };
}

export function directionStatusCopy(status: DirectionStatus): { title: string; subtext: string } {
  if (status === 'NO_SIGNAL') {
    return {
      title: 'Not enough data yet',
      subtext: 'Patterns will appear as you log decisions over time.',
    };
  }

  const subtext = 'This reflects recent confidence and consistency.';
  if (status === 'GROWING') return { title: 'Your current direction looks Growing.', subtext };
  if (status === 'STABLE') return { title: 'Your current direction looks Stable.', subtext };
  return { title: 'Your current direction looks Drifting.', subtext };
}

export function computeConfidenceByCategory(
  decisions: Array<Pick<Decision, 'category' | 'confidence'>>
): Array<{ category: DecisionCategory; avg: number; count: number }> {
  const groups: Record<string, { sum: number; count: number }> = {};
  for (const d of decisions) {
    const key = String(d.category);
    const g = groups[key] ?? { sum: 0, count: 0 };
    g.sum += Number(d.confidence);
    g.count += 1;
    groups[key] = g;
  }

  const out: Array<{ category: DecisionCategory; avg: number; count: number }> = [];
  for (const [k, v] of Object.entries(groups)) {
    out.push({ category: k as DecisionCategory, avg: v.sum / v.count, count: v.count });
  }

  out.sort((a, b) => b.avg - a.avg);
  return out;
}

export function pickCategoryConfidenceInsight(
  stats: Array<{ category: DecisionCategory; avg: number; count: number }>
): { kind: 'MORE' | 'LESS' | 'NONE'; category?: DecisionCategory } {
  const eligible = stats.filter((s) => s.count >= 2);
  if (eligible.length === 0) return { kind: 'NONE' };

  const most = eligible.reduce((best, s) => (s.avg > best.avg ? s : best), eligible[0]);
  const least = eligible.reduce((best, s) => (s.avg < best.avg ? s : best), eligible[0]);

  if (most.avg === least.avg) {
    return { kind: 'MORE', category: most.category };
  }

  // Prefer “most confident” when there’s a clear signal.
  return { kind: 'MORE', category: most.category };
}
