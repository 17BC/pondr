import type { WeeklySnapshot, WeeklyReflection } from '../../review/reviewTypes';
import { categoryLabel } from '../../utils/categoryLabel';
import { confidenceTrendCopy, directionStatusCopy } from '../../confidence/confidence';

// AI boundaries are enforced in the prompt.
// This service is only allowed to describe the computed snapshot.
// It must not recommend actions or judge the user.

type AiReviewResponse = {
  reflection: string;
  observedPattern: string;
  question: string | null;
};

type RollingReflectionInput = {
  windowStartIso: string;
  windowEndIso: string;
  metrics: {
    decisionCount: number;
    focusCopy: string;
    mostCommonCategory: string | null;
    avgConfidence: number | null;
    confidenceTrend: string;
    directionStatus: string;
    notablePatterns: string[];
  };
};

export type RollingReflectionResult = {
  reflectionText: string;
  observedPatternText: string;
  gentleQuestionText: string | null;
};

const BANNED_WORDS = ['should', 'try', 'avoid', 'fix', 'improve'];

function containsBannedWords(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some((w) => lower.includes(w));
}

async function callOpenAiJson(prompt: string): Promise<AiReviewResponse> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_OPENAI_API_KEY');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: 'You are a careful, non-judgmental reflection writer.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const content = String(json?.choices?.[0]?.message?.content ?? '').trim();

  let parsed: AiReviewResponse | null = null;
  try {
    parsed = JSON.parse(content) as AiReviewResponse;
  } catch {
    parsed = null;
  }

  const reflectionText = parsed && typeof parsed.reflection === 'string' ? parsed.reflection.trim() : '';
  const observedPatternText = parsed && typeof parsed.observedPattern === 'string' ? parsed.observedPattern.trim() : '';
  const questionText = parsed && (parsed.question === null || typeof parsed.question === 'string') ? parsed.question : null;

  if (!reflectionText || !observedPatternText) {
    throw new Error('AI returned an incomplete reflection.');
  }

  return {
    reflection: reflectionText,
    observedPattern: observedPatternText,
    question: questionText && questionText.trim().length > 0 ? questionText.trim() : null,
  };
}

function buildPrompt(snapshot: WeeklySnapshot): string {
  const category = snapshot.mostCommonCategory ? categoryLabel(snapshot.mostCommonCategory) : '—';
  const trendSentence = confidenceTrendCopy(snapshot.confidenceTrend);
  const directionSentence = directionStatusCopy(snapshot.directionStatus).title;
  return `You are generating a calm weekly reflection for a decision journaling app.

CRITICAL BOUNDARIES:
- Only describe the patterns in the WEEKLY SNAPSHOT below.
- Never recommend actions.
- Never judge.
- Never use the words: should, try, avoid, fix.
- Ask at most one reflective question.

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no extra text) with this exact shape:
{"reflection":"...","observedPattern":"...","question":null | "..."}

CONTENT REQUIREMENTS:
- reflection: 3–5 sentences.
- observedPattern: exactly 1 sentence.
- question: optional, at most 1 question.

WEEKLY SNAPSHOT:
- Decisions logged this week: ${snapshot.decisionsThisWeek}
- Most common category: ${category}
- Confidence trend sentence: ${trendSentence}
- Direction sentence: ${directionSentence}
`;
}

export async function generateWeeklyReflection(input: { snapshot: WeeklySnapshot }): Promise<WeeklyReflection> {
  const prompt = buildPrompt(input.snapshot);
  const out = await callOpenAiJson(prompt);

  return {
    weekId: input.snapshot.weekId,
    createdAt: Date.now(),
    reflection: out.reflection,
    observedPattern: out.observedPattern,
    question: out.question,
  };
}

function buildRollingPrompt(input: RollingReflectionInput): string {
  const mostCommon = input.metrics.mostCommonCategory ? categoryLabel(input.metrics.mostCommonCategory as any) : '—';
  const trendSentence = confidenceTrendCopy(input.metrics.confidenceTrend as any);
  const directionSentence = directionStatusCopy(input.metrics.directionStatus as any).title;
  const limitedDataNote =
    input.metrics.decisionCount <= 2 ? 'With limited data, this is just a snapshot.' : '';

  return `You are generating a calm weekly reflection for a decision journaling app.

CRITICAL BOUNDARIES:
- Only describe the patterns in the METRICS below.
- Never recommend actions.
- Never judge.
- Never use the words: should, try, avoid, fix, improve.
- Ask at most one reflective question.

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no extra text) with this exact shape:
{"reflection":"...","observedPattern":"...","question":null | "..."}

CONTENT REQUIREMENTS:
- reflection: 3–5 sentences.
- observedPattern: exactly 1 sentence.
- question: optional, at most 1 question.

WINDOW:
- Start: ${input.windowStartIso}
- End: ${input.windowEndIso}

METRICS:
- Decisions logged: ${input.metrics.decisionCount}
- Focus insight: ${input.metrics.focusCopy}
- Most common category label: ${mostCommon}
- Avg confidence: ${input.metrics.avgConfidence === null ? '—' : input.metrics.avgConfidence}
- Confidence trend sentence: ${trendSentence}
- Direction sentence: ${directionSentence}
- Notable patterns: ${input.metrics.notablePatterns.length ? input.metrics.notablePatterns.join(' | ') : '—'}

${limitedDataNote}`;
}

export async function generateRollingReflection(input: RollingReflectionInput): Promise<RollingReflectionResult> {
  const prompt = buildRollingPrompt(input);
  const first = await callOpenAiJson(prompt);

  const combined = `${first.reflection}\n${first.observedPattern}\n${first.question ?? ''}`;
  if (containsBannedWords(combined)) {
    // Simple safety approach: retry once with strengthened constraints.
    // If still unsafe, drop the question and use a deterministic fallback.
    const retryPrompt = `${prompt}\n\nFINAL CHECK: If you would include any banned words, remove them and keep the tone descriptive only.`;
    const second = await callOpenAiJson(retryPrompt);
    const combined2 = `${second.reflection}\n${second.observedPattern}\n${second.question ?? ''}`;

    if (containsBannedWords(combined2)) {
      return {
        reflectionText:
          'This is a quiet snapshot of your last 7 days. The reflection is intentionally descriptive and avoids conclusions. If anything here feels off, it may simply be a sign that the week held mixed signals.',
        observedPatternText: 'With limited data, this is just a snapshot of what was logged.',
        gentleQuestionText: null,
      };
    }

    return {
      reflectionText: second.reflection,
      observedPatternText: second.observedPattern,
      gentleQuestionText: null,
    };
  }

  return {
    reflectionText: first.reflection,
    observedPatternText: first.observedPattern,
    gentleQuestionText: null,
  };
}
