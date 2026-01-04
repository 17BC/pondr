export type GentleQuestionBucketId =
  | 'LOW_DATA'
  | 'DIRECTION_GROWING'
  | 'DIRECTION_STABLE'
  | 'DIRECTION_DRIFTING'
  | 'CONFIDENCE_TREND'
  | 'CATEGORY_FOCUS'
  | 'CATEGORY_CONFIDENCE';

export type GentleQuestion = {
  id: string;
  bucketId: GentleQuestionBucketId;
  text: string;
};

export const QUESTION_BUCKETS: Record<GentleQuestionBucketId, GentleQuestion[]> = {
  LOW_DATA: [
    {
      id: 'LOW_DATA_1',
      bucketId: 'LOW_DATA',
      text: 'Even with just a few decisions logged, what stands out to you?',
    },
    {
      id: 'LOW_DATA_2',
      bucketId: 'LOW_DATA',
      text: 'What do you notice about how these recent choices felt?',
    },
    {
      id: 'LOW_DATA_3',
      bucketId: 'LOW_DATA',
      text: 'What made these decisions feel worth logging?',
    },
    {
      id: 'LOW_DATA_4',
      bucketId: 'LOW_DATA',
      text: 'How did you feel while making these choices?',
    },
    {
      id: 'LOW_DATA_5',
      bucketId: 'LOW_DATA',
      text: 'What feels most noticeable about this week so far?',
    },
  ],
  DIRECTION_GROWING: [
    {
      id: 'DIRECTION_GROWING_1',
      bucketId: 'DIRECTION_GROWING',
      text: 'What seems to support feeling confident in your recent decisions?',
    },
    {
      id: 'DIRECTION_GROWING_2',
      bucketId: 'DIRECTION_GROWING',
      text: 'What do these recent choices tell you about what’s working right now?',
    },
    {
      id: 'DIRECTION_GROWING_3',
      bucketId: 'DIRECTION_GROWING',
      text: 'What feels steady or supportive about the way you’ve been deciding lately?',
    },
    {
      id: 'DIRECTION_GROWING_4',
      bucketId: 'DIRECTION_GROWING',
      text: 'What helps decisions feel clearer during weeks like this?',
    },
  ],
  DIRECTION_STABLE: [
    {
      id: 'DIRECTION_STABLE_1',
      bucketId: 'DIRECTION_STABLE',
      text: 'What feels consistent about the way you’ve been making decisions recently?',
    },
    {
      id: 'DIRECTION_STABLE_2',
      bucketId: 'DIRECTION_STABLE',
      text: 'What do these patterns suggest about your current pace?',
    },
    {
      id: 'DIRECTION_STABLE_3',
      bucketId: 'DIRECTION_STABLE',
      text: 'What feels familiar or steady about your recent choices?',
    },
    {
      id: 'DIRECTION_STABLE_4',
      bucketId: 'DIRECTION_STABLE',
      text: 'What tends to help maintain balance in weeks like this?',
    },
  ],
  DIRECTION_DRIFTING: [
    {
      id: 'DIRECTION_DRIFTING_1',
      bucketId: 'DIRECTION_DRIFTING',
      text: 'What do you notice when decisions feel less certain?',
    },
    {
      id: 'DIRECTION_DRIFTING_2',
      bucketId: 'DIRECTION_DRIFTING',
      text: 'What seems to influence how steady decisions feel during busier periods?',
    },
    {
      id: 'DIRECTION_DRIFTING_3',
      bucketId: 'DIRECTION_DRIFTING',
      text: 'What feels most challenging about making choices right now?',
    },
    {
      id: 'DIRECTION_DRIFTING_4',
      bucketId: 'DIRECTION_DRIFTING',
      text: 'What tends to affect clarity when things feel unsettled?',
    },
  ],
  CONFIDENCE_TREND: [
    {
      id: 'CONFIDENCE_TREND_1',
      bucketId: 'CONFIDENCE_TREND',
      text: 'What tends to influence how confident decisions feel over time?',
    },
    {
      id: 'CONFIDENCE_TREND_2',
      bucketId: 'CONFIDENCE_TREND',
      text: 'What feels different when confidence shifts from week to week?',
    },
    {
      id: 'CONFIDENCE_TREND_3',
      bucketId: 'CONFIDENCE_TREND',
      text: 'What usually supports confidence when it’s higher?',
    },
    {
      id: 'CONFIDENCE_TREND_4',
      bucketId: 'CONFIDENCE_TREND',
      text: 'What do you notice when confidence feels more mixed?',
    },
    {
      id: 'CONFIDENCE_TREND_5',
      bucketId: 'CONFIDENCE_TREND',
      text: 'What seems to shape how sure or unsure decisions feel lately?',
    },
  ],
  CATEGORY_FOCUS: [
    {
      id: 'CATEGORY_FOCUS_1',
      bucketId: 'CATEGORY_FOCUS',
      text: 'When decisions involve {Category}, what tends to matter most to you?',
    },
    {
      id: 'CATEGORY_FOCUS_2',
      bucketId: 'CATEGORY_FOCUS',
      text: 'What stands out about how you approach decisions related to {Category}?',
    },
    {
      id: 'CATEGORY_FOCUS_3',
      bucketId: 'CATEGORY_FOCUS',
      text: 'What feels important when choices span different areas of life?',
    },
    {
      id: 'CATEGORY_FOCUS_4',
      bucketId: 'CATEGORY_FOCUS',
      text: 'How do priorities shift when decisions touch multiple areas at once?',
    },
  ],
  CATEGORY_CONFIDENCE: [
    {
      id: 'CATEGORY_CONFIDENCE_1',
      bucketId: 'CATEGORY_CONFIDENCE',
      text: 'What tends to make decisions about {Category} feel clearer?',
    },
    {
      id: 'CATEGORY_CONFIDENCE_2',
      bucketId: 'CATEGORY_CONFIDENCE',
      text: 'What feels different when decisions involve {Category}?',
    },
    {
      id: 'CATEGORY_CONFIDENCE_3',
      bucketId: 'CATEGORY_CONFIDENCE',
      text: 'What do you notice about how confidence varies across different areas?',
    },
    {
      id: 'CATEGORY_CONFIDENCE_4',
      bucketId: 'CATEGORY_CONFIDENCE',
      text: 'What influences how certain decisions feel depending on the context?',
    },
  ],
};
