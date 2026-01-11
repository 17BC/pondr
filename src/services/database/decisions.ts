import { getDb } from './db';
import { uuidV4 } from '../../utils/uuid';
import type { Decision, DecisionCategory, DirectionStatus } from '../../models/decision';
import type { InsightsSnapshot, InsightCard } from '../../insights/insightTypes';
import type { ConfidenceTrend, WeeklySnapshot } from '../../review/reviewTypes';
import { weekIdFromMs } from '../../review/week';
import {
  avgConfidence,
  computeConfidenceTrend,
  computeDirectionStatus,
  getCurrentWeekRange,
  getPreviousWeekRange,
} from '../../confidence/confidence';
import {
  INSIGHT_TITLES,
  categoryOverlapsCopy,
  confidenceByCategoryCopy,
  confidenceTrendCopy,
  decisionFocusCopy,
  decisionPaceCopy,
  directionStatusCopy,
  repeatedChoicePatternCopy,
} from '../../insights/insightCopy';
import { computeCategoryOverlapSummary } from '../../insights/categoryOverlaps';

function safeJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) return parsed;
    return [];
  } catch {
    return [];
  }

}

export async function getHomeConfidenceSummary(
  nowMs: number = Date.now(),
  weekStartDay: number = 1
): Promise<{
  weekDecisionCount: number;
  avgConfidence: number;
  direction: DirectionStatus;
  confidenceTrend: ConfidenceTrend;
}> {
  const db = await getDb();
  const weekRange = getCurrentWeekRange(nowMs, weekStartDay);
  const prevWeekRange = getPreviousWeekRange(nowMs, weekStartDay);
  const weekStartAt = weekRange.start.getTime();
  const weekEndAt = weekRange.end.getTime();
  const prevWeekStartAt = prevWeekRange.start.getTime();
  const prevWeekEndAt = prevWeekRange.end.getTime();

  const rows = await db.getAllAsync<{ confidence: number }>(
    'SELECT confidence FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [weekStartAt, weekEndAt]
  );
  const weekDecisionCount = rows.length;
  const weekAvg = avgConfidence(rows);
  const avgConfidenceValue = weekAvg ?? 0;
  const direction = computeDirectionStatus(weekDecisionCount, weekAvg);

  const currentWeekAvgRow = await db.getFirstAsync<{ avg: number | null }>(
    'SELECT AVG(confidence) as avg FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [weekStartAt, weekEndAt]
  );
  const prevWeekAvgRow = await db.getFirstAsync<{ avg: number | null }>(
    'SELECT AVG(confidence) as avg FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [prevWeekStartAt, prevWeekEndAt]
  );

  const currentWeekCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [weekStartAt, weekEndAt]
  );

  const prevWeekCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [prevWeekStartAt, prevWeekEndAt]
  );

  const currentWeekAvg =
    currentWeekAvgRow?.avg === null || currentWeekAvgRow?.avg === undefined ? null : Number(currentWeekAvgRow.avg);
  const prevWeekAvg =
    prevWeekAvgRow?.avg === null || prevWeekAvgRow?.avg === undefined ? null : Number(prevWeekAvgRow.avg);
  const currentCount = Number(currentWeekCountRow?.count ?? 0);
  const prevCount = Number(prevWeekCountRow?.count ?? 0);
  const confidenceTrend: ConfidenceTrend =
    currentCount >= 1 && prevCount >= 1 ? computeConfidenceTrend(currentWeekAvg, prevWeekAvg) : 'NA';

  return {
    weekDecisionCount,
    avgConfidence: avgConfidenceValue,
    direction,
    confidenceTrend,
  };
}

export async function getWeeklyConfidenceSeries(
  nowMs: number = Date.now(),
  weekStartDay: number = 1
): Promise<
  Array<{ dayStartAt: number; avgConfidence: number | null; count: number }>
> {
  const db = await getDb();
  const weekRange = getCurrentWeekRange(nowMs, weekStartDay);
  const weekStartAt = weekRange.start.getTime();
  const weekEndAt = weekRange.end.getTime();

  // Bucket by local day start timestamps.
  // SQLite doesn't know device timezone for epoch ms, so we compute day-start boundaries in JS,
  // then aggregate per-day with BETWEEN ranges.
  const dayMs = 24 * 60 * 60 * 1000;
  const days: number[] = [];
  for (let t = weekStartAt; t < weekEndAt; t += dayMs) days.push(t);

  const out: Array<{ dayStartAt: number; avgConfidence: number | null; count: number }> = [];
  for (const startAt of days) {
    const endAt = startAt + dayMs;
    const row = await db.getFirstAsync<{ avg: number | null; count: number }>(
      'SELECT AVG(confidence) as avg, COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
      [startAt, endAt]
    );
    const avg = row?.avg === null || row?.avg === undefined ? null : Number(row.avg);
    const count = Number(row?.count ?? 0);
    out.push({ dayStartAt: startAt, avgConfidence: avg, count });
  }

  return out;
}

export async function getDecisionCountInRange(startAt: number, endAt: number): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [startAt, endAt]
  );
  return Number(row?.count ?? 0);
}

export async function getLastDecisionCreatedAt(): Promise<number | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ createdAt: number }>(
    'SELECT createdAt FROM decisions ORDER BY createdAt DESC LIMIT 1;'
  );
  const ms = row?.createdAt;
  return typeof ms === 'number' && Number.isFinite(ms) ? ms : null;
}

function rowToDecision(row: any): Decision {
  return {
    id: String(row.id),
    title: String(row.title),
    category: row.category as DecisionCategory,
    secondaryCategories: safeJsonArray(row.secondaryCategories) as any,
    whyText: row.whyText ?? null,
    feeling: Number(row.feeling) as Decision['feeling'],
    confidence: Number(row.confidence) as Decision['confidence'],
    tradeoffGains: safeJsonArray(row.tradeoffGains) as any,
    tradeoffLosses: safeJsonArray(row.tradeoffLosses) as any,
    tags: safeJsonArray(row.tags),
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  };
}

function startOfDayMs(nowMs: number): number {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function createQuickDecision(input: {
  title: string;
  category?: DecisionCategory;
  secondaryCategories?: DecisionCategory[];
  whyText?: string | null;
  confidence: Decision['confidence'];
}): Promise<Decision> {
  const db = await getDb();
  const now = Date.now();

  const decision: Decision = {
    id: uuidV4(),
    title: input.title.trim(),
    category: input.category ?? 'other',
    secondaryCategories: input.secondaryCategories ?? [],
    whyText: input.whyText ?? null,
    feeling: 3,
    confidence: input.confidence,
    tradeoffGains: [],
    tradeoffLosses: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    `INSERT INTO decisions 
      (id, title, category, secondaryCategories, whyText, feeling, confidence, tradeoffGains, tradeoffLosses, tags, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      decision.id,
      decision.title,
      decision.category,
      JSON.stringify(decision.secondaryCategories),
      decision.whyText ?? null,
      decision.feeling,
      decision.confidence,
      JSON.stringify(decision.tradeoffGains),
      JSON.stringify(decision.tradeoffLosses),
      JSON.stringify(decision.tags),
      decision.createdAt,
      decision.updatedAt,
    ]
  );

  return decision;
}

export async function getThisWeekMetrics(): Promise<{
  weekDecisionCount: number;
  avgConfidence: number;
  direction: DirectionStatus;
}> {
  const db = await getDb();
  const range = getCurrentWeekRange(Date.now());
  const startAt = range.start.getTime();
  const endAt = range.end.getTime();

  const rows = await db.getAllAsync<{ confidence: number }>(
    'SELECT confidence FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [startAt, endAt]
  );

  const weekDecisionCount = rows.length;
  const weekAvg = avgConfidence(rows);
  const avgConfidenceValue = weekAvg ?? 0;

  const direction = computeDirectionStatus(weekDecisionCount, weekAvg);

  return {
    weekDecisionCount,
    avgConfidence: avgConfidenceValue,
    direction,
  };
}

export async function listDecisions(input?: { searchText?: string; limit?: number }): Promise<Decision[]> {
  const db = await getDb();
  const limit = input?.limit ?? 200;
  const q = input?.searchText?.trim();

  if (q) {
    const like = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
    const rows = await db.getAllAsync<any>(
      "SELECT * FROM decisions WHERE title LIKE ? ESCAPE '\\' ORDER BY createdAt DESC LIMIT ?;",
      [like, limit]
    );
    return rows.map(rowToDecision);
  }

  const rows = await db.getAllAsync<any>('SELECT * FROM decisions ORDER BY createdAt DESC LIMIT ?;', [limit]);
  return rows.map(rowToDecision);
}

export async function getDecisionById(id: string): Promise<Decision | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM decisions WHERE id = ? LIMIT 1;', [id]);
  if (!row) return null;
  return rowToDecision(row);
}

export async function updateDecision(input: { id: string; title: string; whyText: string | null }): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) {
    throw new Error('Please add a short title.');
  }

  await db.runAsync('UPDATE decisions SET title = ?, whyText = ?, updatedAt = ? WHERE id = ?;', [
    trimmedTitle,
    input.whyText,
    now,
    input.id,
  ]);
}

export async function updateDecisionWhyText(input: { id: string; whyText: string | null }): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync('UPDATE decisions SET whyText = ?, updatedAt = ? WHERE id = ?;', [input.whyText, now, input.id]);
}

export async function getInsightsSnapshot(nowMs: number = Date.now(), weekStartDay: number = 1): Promise<InsightsSnapshot> {
  const db = await getDb();
  const now = nowMs;

  const startOfToday = startOfDayMs(now);

  // Period choices are deterministic and explainable:
  // - "Recent" = last 14 days
  // - Trend comparison = previous 14 days
  // - Pace baseline = long-run average rate since first decision
  const recentStartAt = startOfToday - 13 * 24 * 60 * 60 * 1000;
  const prevRecentStartAt = recentStartAt - 14 * 24 * 60 * 60 * 1000;

  const cards: InsightCard[] = [];

  const weekRange = getCurrentWeekRange(now, weekStartDay);
  const weekStartAt = weekRange.start.getTime();
  const weekEndAt = weekRange.end.getTime();

  // 1) Decision Focus (Pattern): most frequent category in recent period
  const focusRows = await db.getAllAsync<{ category: string; count: number }>(
    'SELECT category, COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ? GROUP BY category ORDER BY count DESC LIMIT 2;',
    [weekStartAt, weekEndAt]
  );
  if (focusRows.length > 0) {
    const topCount = Number(focusRows[0].count ?? 0);
    const secondCount = focusRows.length > 1 ? Number(focusRows[1].count ?? 0) : -1;
    const topCategory = String(focusRows[0].category) as DecisionCategory;

    const tie = topCount > 0 && secondCount === topCount;
    const copy = tie
      ? 'No clear focus yet — your decisions are spread across a few areas.'
      : decisionFocusCopy(topCategory);

    cards.push({
      id: 'decision_focus',
      type: 'decision_focus',
      title: INSIGHT_TITLES.decision_focus,
      copy,
      category: topCategory,
    });
  }

  // 1b) Category Overlaps (Pattern): decisions where the user explicitly selected 1–2 secondary categories
  const overlapRows = await db.getAllAsync<{ category: string; secondaryCategories: string }>(
    'SELECT category, secondaryCategories FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [weekStartAt, weekEndAt]
  );
  const overlapInput = overlapRows.map((r) => ({
    category: String(r.category) as DecisionCategory,
    secondaryCategories: safeJsonArray(r.secondaryCategories) as any,
  }));
  const overlapSummary = computeCategoryOverlapSummary({ decisions: overlapInput });
  cards.push({
    id: 'category_overlaps',
    type: 'category_overlaps',
    title: INSIGHT_TITLES.category_overlaps,
    copy: categoryOverlapsCopy({
      overlapDecisionCount: overlapSummary.overlapDecisionCount,
      mostCommonPair: overlapSummary.mostCommonPair,
    }),
    overlapDecisionCount: overlapSummary.overlapDecisionCount,
    mostCommonPair: overlapSummary.mostCommonPair,
  });

  // 2) Confidence by Category (Pattern): current week, min 2 decisions per category
  const categoryAvgRows = await db.getAllAsync<{ category: string; avg: number | null; count: number }>(
    'SELECT category, AVG(confidence) as avg, COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ? GROUP BY category HAVING COUNT(1) >= 2;',
    [weekStartAt, weekEndAt]
  );
  if (categoryAvgRows.length > 0) {
    const sorted = [...categoryAvgRows]
      .map((r) => ({ category: String(r.category) as DecisionCategory, avg: Number(r.avg ?? 0), count: Number(r.count ?? 0) }))
      .sort((a, b) => b.avg - a.avg);
    const top = sorted[0];
    cards.push({
      id: 'confidence_by_category',
      type: 'confidence_by_category',
      title: INSIGHT_TITLES.confidence_by_category,
      copy: confidenceByCategoryCopy({ category: top.category, direction: 'more' }),
      category: top.category,
      direction: 'more',
    });
  } else {
    cards.push({
      id: 'confidence_by_category',
      type: 'confidence_by_category',
      title: INSIGHT_TITLES.confidence_by_category,
      copy: 'Log a few decisions in each area to see confidence patterns.',
      category: 'other',
      direction: 'more',
    });
  }

  // 3) Confidence Trend (Trend): compare current week vs previous week
  const prevWeekRange = getPreviousWeekRange(now, weekStartDay);
  const prevWeekStartAt = prevWeekRange.start.getTime();
  const prevWeekEndAt = prevWeekRange.end.getTime();

  const currentWeekAvgRow = await db.getFirstAsync<{ avg: number | null }>(
    'SELECT AVG(confidence) as avg FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [weekStartAt, weekEndAt]
  );
  const prevWeekAvgRow = await db.getFirstAsync<{ avg: number | null }>(
    'SELECT AVG(confidence) as avg FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [prevWeekStartAt, prevWeekEndAt]
  );

  const currentWeekCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [weekStartAt, weekEndAt]
  );
  const prevWeekCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [prevWeekStartAt, prevWeekEndAt]
  );

  const currentWeekAvg = currentWeekAvgRow?.avg === null || currentWeekAvgRow?.avg === undefined ? null : Number(currentWeekAvgRow.avg);
  const prevWeekAvg = prevWeekAvgRow?.avg === null || prevWeekAvgRow?.avg === undefined ? null : Number(prevWeekAvgRow.avg);

  const currentCount = Number(currentWeekCountRow?.count ?? 0);
  const prevCount = Number(prevWeekCountRow?.count ?? 0);
  const trend = currentCount >= 1 && prevCount >= 1 ? computeConfidenceTrend(currentWeekAvg, prevWeekAvg) : 'NA';

  cards.push({
    id: 'confidence_trend',
    type: 'confidence_trend',
    title: INSIGHT_TITLES.confidence_trend,
    copy: trend === 'NA' ? 'Log a few decisions over time to see confidence trends.' : confidenceTrendCopy(trend),
    trend,
  });

  // 4) Decision Pace (Trend): compare recent decision count to personal average rate
  const totalCountRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(1) as count FROM decisions;');
  const totalCount = Number(totalCountRow?.count ?? 0);
  const firstRow = await db.getFirstAsync<{ createdAt: number }>('SELECT createdAt FROM decisions ORDER BY createdAt ASC LIMIT 1;');
  const firstAt = Number(firstRow?.createdAt ?? 0);
  const recentCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(1) as count FROM decisions WHERE createdAt >= ?;',
    [recentStartAt]
  );
  const recentCount = Number(recentCountRow?.count ?? 0);

  if (totalCount >= 3 && firstAt > 0) {
    const daysSinceFirst = Math.max(14, Math.floor((now - firstAt) / (24 * 60 * 60 * 1000)) + 1);
    const avgPer14 = totalCount / (daysSinceFirst / 14);
    const pace: 'more' | 'fewer' = recentCount >= avgPer14 ? 'more' : 'fewer';

    cards.push({
      id: 'decision_pace',
      type: 'decision_pace',
      title: INSIGHT_TITLES.decision_pace,
      copy: decisionPaceCopy(pace),
      pace,
    });
  }

  // 5) Direction Status (Direction): Growing / Stable / Drifting
  const weekRows = await db.getAllAsync<{ confidence: number }>(
    'SELECT confidence FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [weekStartAt, weekEndAt]
  );
  const weekCount = weekRows.length;
  const weekAvgConfidence = avgConfidence(weekRows);
  const status: DirectionStatus = computeDirectionStatus(weekCount, weekAvgConfidence);

  cards.push({
    id: 'direction_status',
    type: 'direction_status',
    title: INSIGHT_TITLES.direction_status,
    copy: directionStatusCopy(status),
    status,
  });

  // 6) Repeated Choice Pattern (Direction): detect repeated categories or themes
  // Deterministic signal: in the last 10 decisions, does one category appear 5+ times?
  const last10Rows = await db.getAllAsync<{ category: string }>(
    'SELECT category FROM decisions ORDER BY createdAt DESC LIMIT 10;'
  );
  if (last10Rows.length >= 8) {
    const counts: Record<string, number> = {};
    for (const r of last10Rows) {
      const key = String(r.category);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const max = Object.values(counts).reduce((m, v) => (v > m ? v : m), 0);
    if (max >= 5) {
      cards.push({
        id: 'repeated_choice_pattern',
        type: 'repeated_choice_pattern',
        title: INSIGHT_TITLES.repeated_choice_pattern,
        copy: repeatedChoicePatternCopy(),
      });
    }
  }

  return { cards };
}

export async function getWeeklyReviewSnapshot(nowMs: number = Date.now(), weekStartDay: number = 1): Promise<WeeklySnapshot> {
  const db = await getDb();
  const weekRange = getCurrentWeekRange(nowMs, weekStartDay);
  const prevWeekRange = getPreviousWeekRange(nowMs, weekStartDay);
  const weekStartAt = weekRange.start.getTime();
  const weekEndAt = weekRange.end.getTime();
  const prevWeekStartAt = prevWeekRange.start.getTime();
  const prevWeekEndAt = prevWeekRange.end.getTime();

  const thisWeekCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [weekStartAt, weekEndAt]
  );
  const decisionsThisWeek = Number(thisWeekCountRow?.count ?? 0);

  const mostCommonRows = await db.getAllAsync<{ category: string; count: number }>(
    'SELECT category, COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ? GROUP BY category ORDER BY count DESC LIMIT 1;',
    [weekStartAt, weekEndAt]
  );
  const mostCommonCategory =
    mostCommonRows.length > 0 ? (String(mostCommonRows[0].category) as DecisionCategory) : null;

  const thisWeekAvgRow = await db.getFirstAsync<{ avg: number | null }>(
    'SELECT AVG(confidence) as avg FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [weekStartAt, weekEndAt]
  );
  const prevWeekAvgRow = await db.getFirstAsync<{ avg: number | null }>(
    'SELECT AVG(confidence) as avg FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [prevWeekStartAt, prevWeekEndAt]
  );

  const prevWeekCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [prevWeekStartAt, prevWeekEndAt]
  );

  const thisWeekAvg = thisWeekAvgRow?.avg === null || thisWeekAvgRow?.avg === undefined ? null : Number(thisWeekAvgRow.avg);
  const prevWeekAvg = prevWeekAvgRow?.avg === null || prevWeekAvgRow?.avg === undefined ? null : Number(prevWeekAvgRow.avg);

  const prevWeekCount = Number(prevWeekCountRow?.count ?? 0);
  const confidenceTrend: ConfidenceTrend =
    decisionsThisWeek >= 1 && prevWeekCount >= 1 ? computeConfidenceTrend(thisWeekAvg, prevWeekAvg) : 'NA';
  const directionStatus: DirectionStatus = computeDirectionStatus(decisionsThisWeek, thisWeekAvg);

  return {
    weekId: weekIdFromMs(nowMs),
    weekStartAt,
    decisionsThisWeek,
    mostCommonCategory,
    confidenceTrend,
    directionStatus,
  };
}

export async function getWeeklyReviewDetail(nowMs: number = Date.now(), weekStartDay: number = 1): Promise<{
  windowStartAt: number;
  windowEndAt: number;
  decisionCount: number;
  mostCommonCategory: DecisionCategory | null;
  decisionFocus: { focusCategory: DecisionCategory | null; isTie: boolean };
  confidenceByCategoryInsight: { kind: 'MORE' | 'LESS' | 'NONE'; category: DecisionCategory | null };
  focusCopy: string;
  avgConfidence: number | null;
  confidenceTrend: ConfidenceTrend;
  directionStatus: DirectionStatus;
  notablePatterns: string[];
}> {
  const db = await getDb();
  const weekRange = getCurrentWeekRange(nowMs, weekStartDay);
  const prevWeekRange = getPreviousWeekRange(nowMs, weekStartDay);
  const windowStartAt = weekRange.start.getTime();
  const windowEndAt = weekRange.end.getTime();
  const prevWindowStartAt = prevWeekRange.start.getTime();
  const prevWindowEndAt = prevWeekRange.end.getTime();

  const countRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [windowStartAt, windowEndAt]
  );
  const decisionCount = Number(countRow?.count ?? 0);

  const topCategoryRows = await db.getAllAsync<{ category: string; count: number }>(
    'SELECT category, COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ? GROUP BY category ORDER BY count DESC LIMIT 2;',
    [windowStartAt, windowEndAt]
  );

  let mostCommonCategory: DecisionCategory | null = null;
  let focusCopy: string;
  let focusIsTie = false;
  if (topCategoryRows.length === 0) {
    focusCopy = 'No clear focus yet — your decisions are spread across a few areas.';
  } else {
    const top = topCategoryRows[0];
    const second = topCategoryRows.length > 1 ? topCategoryRows[1] : null;
    if (second && Number(second.count) === Number(top.count)) {
      focusIsTie = true;
      focusCopy = 'No clear focus yet — your decisions are spread across a few areas.';
      mostCommonCategory = null;
    } else {
      mostCommonCategory = String(top.category) as DecisionCategory;
      focusCopy = decisionFocusCopy(mostCommonCategory);
    }
  }

  const avgRow = await db.getFirstAsync<{ avg: number | null }>(
    'SELECT AVG(confidence) as avg FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [windowStartAt, windowEndAt]
  );
  const avgConfidenceValue = avgRow?.avg === null || avgRow?.avg === undefined ? null : Number(avgRow.avg);

  const prevAvgRow = await db.getFirstAsync<{ avg: number | null }>(
    'SELECT AVG(confidence) as avg FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [prevWindowStartAt, prevWindowEndAt]
  );
  const prevCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [prevWindowStartAt, prevWindowEndAt]
  );
  const prevAvgConfidenceValue = prevAvgRow?.avg === null || prevAvgRow?.avg === undefined ? null : Number(prevAvgRow.avg);
  const prevCount = Number(prevCountRow?.count ?? 0);
  const confidenceTrend: ConfidenceTrend =
    decisionCount >= 1 && prevCount >= 1 ? computeConfidenceTrend(avgConfidenceValue, prevAvgConfidenceValue) : 'NA';

  const directionStatus: DirectionStatus = computeDirectionStatus(decisionCount, avgConfidenceValue);

  // Confidence-by-category insight (weekly, min 2 decisions per category).
  // Deterministic: we avoid new thresholds and use the same eligibility rule as Insights.
  const categoryAvgRows = await db.getAllAsync<{ category: string; avg: number | null; count: number }>(
    'SELECT category, AVG(confidence) as avg, COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ? GROUP BY category HAVING COUNT(1) >= 2;',
    [windowStartAt, windowEndAt]
  );

  const eligibleCategoryAvgs = categoryAvgRows
    .map((r) => ({
      category: String(r.category) as DecisionCategory,
      avg: r.avg === null || r.avg === undefined ? null : Number(r.avg),
      count: Number(r.count ?? 0),
    }))
    .filter((r) => r.avg !== null);

  let confidenceByCategoryInsight: { kind: 'MORE' | 'LESS' | 'NONE'; category: DecisionCategory | null } = {
    kind: 'NONE',
    category: null,
  };

  if (eligibleCategoryAvgs.length === 1) {
    confidenceByCategoryInsight = { kind: 'MORE', category: eligibleCategoryAvgs[0].category };
  } else if (eligibleCategoryAvgs.length >= 2) {
    const sorted = [...eligibleCategoryAvgs].sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
    const most = sorted[0].category;
    const least = sorted[sorted.length - 1].category;
    confidenceByCategoryInsight =
      directionStatus === 'DRIFTING' ? { kind: 'LESS', category: least } : { kind: 'MORE', category: most };
  }

  return {
    windowStartAt,
    windowEndAt,
    decisionCount,
    mostCommonCategory,
    decisionFocus: { focusCategory: mostCommonCategory, isTie: focusIsTie },
    confidenceByCategoryInsight,
    focusCopy,
    avgConfidence: avgConfidenceValue,
    confidenceTrend,
    directionStatus,
    notablePatterns: [],
  };
}

export async function getRollingReviewSnapshot(input?: {
  nowMs?: number;
  days?: number;
}): Promise<{
  windowStartAt: number;
  windowEndAt: number;
  decisionCount: number;
  mostCommonCategory: DecisionCategory | null;
  focusCopy: string;
  avgConfidence: number | null;
  confidenceTrend: ConfidenceTrend;
  directionStatus: DirectionStatus;
  notablePatterns: string[];
}> {
  const db = await getDb();
  const nowMs = input?.nowMs ?? Date.now();
  const days = input?.days ?? 7;

  const windowEndAt = nowMs;
  const windowStartAt = nowMs - days * 24 * 60 * 60 * 1000;
  const prevWindowEndAt = windowStartAt;
  const prevWindowStartAt = windowStartAt - days * 24 * 60 * 60 * 1000;

  const countRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [windowStartAt, windowEndAt]
  );
  const decisionCount = Number(countRow?.count ?? 0);

  const topCategoryRows = await db.getAllAsync<{ category: string; count: number }>(
    'SELECT category, COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ? GROUP BY category ORDER BY count DESC LIMIT 2;',
    [windowStartAt, windowEndAt]
  );

  let mostCommonCategory: DecisionCategory | null = null;
  let focusCopy: string;
  if (topCategoryRows.length === 0) {
    focusCopy = 'No clear focus yet — your decisions are spread across a few areas.';
  } else {
    const top = topCategoryRows[0];
    const second = topCategoryRows.length > 1 ? topCategoryRows[1] : null;
    if (second && Number(second.count) === Number(top.count)) {
      focusCopy = 'No clear focus yet — your decisions are spread across a few areas.';
      mostCommonCategory = null;
    } else {
      mostCommonCategory = String(top.category) as DecisionCategory;
      focusCopy = decisionFocusCopy(mostCommonCategory);
    }
  }

  const avgRow = await db.getFirstAsync<{ avg: number | null }>(
    'SELECT AVG(confidence) as avg FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [windowStartAt, windowEndAt]
  );
  const avgConfidenceValue = avgRow?.avg === null || avgRow?.avg === undefined ? null : Number(avgRow.avg);

  const prevAvgRow = await db.getFirstAsync<{ avg: number | null }>(
    'SELECT AVG(confidence) as avg FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [prevWindowStartAt, prevWindowEndAt]
  );
  const prevCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ?;',
    [prevWindowStartAt, prevWindowEndAt]
  );

  const prevAvgConfidenceValue =
    prevAvgRow?.avg === null || prevAvgRow?.avg === undefined ? null : Number(prevAvgRow.avg);
  const prevCount = Number(prevCountRow?.count ?? 0);
  const confidenceTrend: ConfidenceTrend =
    decisionCount >= 1 && prevCount >= 1 ? computeConfidenceTrend(avgConfidenceValue, prevAvgConfidenceValue) : 'NA';

  const directionStatus: DirectionStatus = computeDirectionStatus(decisionCount, avgConfidenceValue);

  return {
    windowStartAt,
    windowEndAt,
    decisionCount,
    mostCommonCategory,
    focusCopy,
    avgConfidence: avgConfidenceValue,
    confidenceTrend,
    directionStatus,
    notablePatterns: [],
  };
}
