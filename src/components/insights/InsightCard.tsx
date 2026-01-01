import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Card } from '../common/Card';
import { colors } from '../../theme/colors';
import type { InsightCard as InsightCardModel } from '../../insights/insightTypes';

export function InsightCard({ card }: { card: InsightCardModel }): React.JSX.Element {
  const c = colors.light;

  return (
    <Card>
      <Text style={[styles.title, { color: c.textPrimary }]}>{card.title}</Text>
      <Text style={[styles.copy, { color: c.textSecondary }]}>{card.copy}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  copy: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
});
