import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import type { DirectionStatus } from '../../models/decision';

export function DirectionStatusBadge(props: { status: DirectionStatus }): React.JSX.Element {
  const c = colors.light;

  const tone =
    props.status === 'GROWING'
      ? { bg: c.primaryMuted, fg: c.primary }
      : props.status === 'STABLE'
        ? { bg: '#EEF2EE', fg: c.textSecondary }
        : { bg: '#F3EFE8', fg: c.warning };

  const label = props.status === 'GROWING' ? 'Growing' : props.status === 'STABLE' ? 'Stable' : 'Drifting';

  return (
    <View style={[styles.base, { backgroundColor: tone.bg, borderColor: c.border }]}>
      <View style={[styles.dot, { backgroundColor: tone.fg }]} />
      <Text style={[styles.text, { color: tone.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
