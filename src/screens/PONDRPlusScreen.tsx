import React, { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../components/common/AppButton';
import { Card } from '../components/common/Card';
import type { MainStackParamList } from '../navigation/types';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<MainStackParamList, 'PONDRPlus'>;

export function PONDRPlusScreen(props: Props): React.JSX.Element {
  const c = colors.light;

  const status = useSubscriptionStore((s) => s.status);
  const isSubscribed = useSubscriptionStore((s) => s.isSubscribed);
  const error = useSubscriptionStore((s) => s.error);
  const refresh = useSubscriptionStore((s) => s.refresh);
  const subscribeDev = useSubscriptionStore((s) => s.subscribeDev);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.primaryMuted }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.textPrimary }]}>P<Image source={require('../../assets/pondr_icon_1.png')} style={styles.titleIcon} />{'\u200A'}NDR Plus</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>More room to reflect, at your own pace.</Text>

      <View style={styles.spacer} />

      <Card>
        <Text style={[styles.body, { color: c.textSecondary }]}>PONDR Plus adds a bit of flexibility to the weekly rhythm. If you miss a reflection, you can still look back once. You’ll also receive a monthly reflection that brings together patterns over time.</Text>

        <View style={styles.spacerSmall} />

        <View style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: c.primary }]} />
          <Text style={[styles.bulletText, { color: c.textPrimary }]}>Reflect once on the previous week if you missed it</Text>
        </View>
        <View style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: c.primary }]} />
          <Text style={[styles.bulletText, { color: c.textPrimary }]}>Receive a monthly reflection summary</Text>
        </View>
        <View style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: c.primary }]} />
          <Text style={[styles.bulletText, { color: c.textPrimary }]}>Everything stays private and intentional</Text>
        </View>

        <View style={styles.spacer} />

        <Text style={[styles.price, { color: c.textPrimary }]}>$1 / month</Text>
        <Text style={[styles.caption, { color: c.textMuted }]}>Cancel anytime.</Text>

        <View style={styles.ctaRow}>
          <AppButton
            title={isSubscribed ? 'Subscribed' : status === 'loading' ? 'Preparing…' : 'Subscribe'}
            onPress={subscribeDev}
            disabled={isSubscribed || status === 'loading'}
          />
          <View style={styles.ctaSpacer} />
          <AppButton title="Not now" variant="secondary" onPress={() => props.navigation.goBack()} />
        </View>

        {error ? <Text style={[styles.inlineError, { color: c.warning }]}>{error}</Text> : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  titleIcon: {
    width: 26,
    height: 26,
    transform: [{ translateY: 2 }],
    resizeMode: 'contain',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  spacer: {
    height: 16,
  },
  spacerSmall: {
    height: 10,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
  },
  caption: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  ctaRow: {
    marginTop: 14,
  },
  ctaSpacer: {
    height: 10,
  },
  inlineError: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
});
