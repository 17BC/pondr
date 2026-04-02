import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { ImageSourcePropType, ImageStyle, TextStyle, ViewStyle } from 'react-native';

type Props = {
  leftText?: string;
  rightText?: string;
  color?: string;
  textStyle?: TextStyle;
  containerStyle?: ViewStyle;
  size?: number;
  spacing?: number;
  iconSource?: ImageSourcePropType;
  iconStyle?: ImageStyle;
};

export function InlineWordmark({
  leftText = 'P',
  rightText = 'NDR',
  color,
  textStyle,
  containerStyle,
  size = 12,
  spacing = 1,
  iconSource = require('../../../assets/pondr_icon_6.png'),
  iconStyle,
}: Props): React.JSX.Element {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[{ color }, textStyle]}>{leftText}</Text>
      <View style={{ width: spacing }} />
      <Image source={iconSource} style={[{ width: size, height: size }, styles.icon, iconStyle]} />
      <View style={{ width: spacing }} />
      <Text style={[{ color }, textStyle]}>{rightText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    resizeMode: 'contain',
  },
});
