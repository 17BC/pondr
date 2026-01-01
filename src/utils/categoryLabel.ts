import type { DecisionCategory } from '../models/decision';

export function categoryLabel(category: DecisionCategory): string {
  switch (category) {
    case 'career':
      return 'Career';
    case 'health':
      return 'Health';
    case 'relationships':
      return 'Relationships';
    case 'learning':
      return 'Learning';
    case 'lifestyle':
      return 'Lifestyle';
    case 'money-choice':
      return 'Money';
    case 'other':
      return 'Other';
    default:
      return 'Other';
  }
}
