import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { colors } from '../../theme/colors';

export function Card(props: ViewProps & { padding?: number }): React.JSX.Element {
  const c = colors.light;
  const padding = props.padding ?? 16;

  return (
    <View
      {...props}
      style={[
        styles.base,
        { backgroundColor: c.surface, borderColor: c.border, padding },
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 16,
  },
});
