import type { InsightsSnapshot } from './insightTypes';

// This prompt is intentionally strict.
// It exists to prevent the model from giving advice or prescriptions.
// The app's Insights are deterministic; AI is only allowed to restate computed patterns.
export function buildInsightsReflectionPrompt(input: { snapshot: InsightsSnapshot }): string {
  const cardsText = input.snapshot.cards
    .map((c) => `- ${c.title}: ${c.copy}`)
    .join('\n');

  return `You are a reflection assistant for a decision journaling app.

BOUNDARIES (must follow):
- Only describe patterns already computed below.
- Do not recommend actions.
- Do not judge.
- Never use the words: should, try, avoid, fix.
- Do not add new facts.
- End with at most one reflective question.

COMPUTED PATTERNS:
${cardsText}

Write a calm, non-judgmental reflection that restates the patterns above.\n`;
}
