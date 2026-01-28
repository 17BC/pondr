import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../components/common/AppButton';
import { Card } from '../components/common/Card';
import type { MainStackParamList } from '../navigation/types';
import { revenueCatCheckStatus, revenueCatShowManageSubscriptions } from '../services/subscription/revenuecat';
import { clearPlusContinuePending, getPlusContinuePending } from '../storage/subscriptionStorage';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<MainStackParamList, 'PONDRPlus'>;

export function PONDRPlusScreen(props: Props): React.JSX.Element {
  const c = colors.light;

  const status = useSubscriptionStore((s) => s.status);
  const isSubscribed = useSubscriptionStore((s) => s.isSubscribed);
  const source = useSubscriptionStore((s) => s.source);
  const lastSyncedAtMs = useSubscriptionStore((s) => s.lastSyncedAtMs);
  const currentPeriodEndAtMs = useSubscriptionStore((s) => s.currentPeriodEndAtMs);
  const error = useSubscriptionStore((s) => s.error);
  const refresh = useSubscriptionStore((s) => s.refresh);
  const subscribe = useSubscriptionStore((s) => s.subscribe);
  const restore = useSubscriptionStore((s) => s.restore);
  const resetDev = useSubscriptionStore((s) => s.resetDev);

  const [continuePending, setContinuePendingState] = useState(false);
  const [managing, setManaging] = useState(false);

  const [showDevTools, setShowDevTools] = useState(false);
  const [rcStatusText, setRcStatusText] = useState<string | null>(null);
  const [rcChecking, setRcChecking] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const pending = await getPlusContinuePending();
      if (!alive) return;
      setContinuePendingState(pending);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const entry = props.route.params?.entry ?? 'other';
  const showManage = entry === 'settings' && isSubscribed;

  const ctaTitle = useMemo(() => {
    if (!isSubscribed) return 'Subscribe for $1 / month';
    if (showManage) return 'Manage subscription';
    if (continuePending) return 'Continue';
    return 'Not now';
  }, [continuePending, isSubscribed, showManage]);

  const onPressCta = async (): Promise<void> => {
    if (!isSubscribed) {
      await subscribe();
      return;
    }

    if (showManage) {
      if (managing) return;
      setManaging(true);
      try {
        const opened = await revenueCatShowManageSubscriptions();
        if (!opened) {
          // If platform UI isn't available, just keep the user here.
        }
      } finally {
        setManaging(false);
      }
      return;
    }

    if (continuePending) {
      await clearPlusContinuePending();
      setContinuePendingState(false);
      props.navigation.goBack();
      return;
    }

    props.navigation.goBack();
  };

  const checkRevenueCat = async (): Promise<void> => {
    if (rcChecking) return;
    setRcChecking(true);
    try {
      const s = await revenueCatCheckStatus();
      setRcStatusText(
        `rc: configured=${String(s.configured)} sdkKey=${String(s.sdkKeyPresent)} productId=${String(
          s.productIdPresent,
        )} customerInfo=${String(s.customerInfoOk)} entitlementId=${s.entitlementId} entitlementActive=${String(
          s.activeEntitlement,
        )} activeIds=${s.activeEntitlementIds.join(',') || '—'} offeringsCurrent=${String(
          s.offeringsCurrentOk,
        )} packages=${String(s.availablePackagesCount)} pkgIds=${s.availablePackageIds.join(',') || '—'} prodIds=${
          s.availableProductIds.join(',') || '—'
        }${s.error ? ` error=${s.error}` : ''}`,
      );
    } finally {
      setRcChecking(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.primaryMuted }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.textPrimary }]}>PONDR Plus</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>Extra flexibility for reflection.</Text>

      <View style={styles.spacer} />

      <Card>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          PONDR Plus doesn’t change how the app works.
          {'\n'}It adds a bit more flexibility to the weekly rhythm.
          {'\n'}
          {'\n'}If you miss a reflection, you can still look back once.
          {'\n'}You’ll also receive a monthly reflection that gathers patterns over time.
          {'\n'}
          {'\n'}Everything else stays the same.
          {'\n'}No advice, no goals, no judgment.
        </Text>

        <View style={styles.spacer} />

        <Text style={[styles.footerReassurance, { color: c.textMuted }]}>Your data stays on your device.</Text>
        <Text style={[styles.footerReassurance, { color: c.textMuted }]}>Cancel anytime through your app store.</Text>

        <View style={styles.ctaRow}>
          <AppButton title={status === 'loading' ? 'Preparing…' : ctaTitle} onPress={onPressCta} disabled={status === 'loading' || managing} />
          <View style={styles.ctaSpacer} />
          {!showManage ? <AppButton title="Restore purchases" variant="secondary" onPress={restore} /> : null}
        </View>

        {__DEV__ ? (
          <View style={styles.devToolsSection}>
            <View style={styles.ctaSpacer} />
            <AppButton
              title={showDevTools ? 'Hide dev tools' : 'Show dev tools'}
              variant="secondary"
              onPress={() => setShowDevTools((v) => !v)}
            />

            {showDevTools ? (
              <>
                <Text style={[styles.devText, { color: c.textMuted }]}>
                  {`debug: subscribed=${String(isSubscribed)} source=${source} end=${currentPeriodEndAtMs ?? '—'} synced=${
                    lastSyncedAtMs ?? '—'
                  }`}
                </Text>
                {rcStatusText ? <Text style={[styles.devText, { color: c.textMuted }]}>{rcStatusText}</Text> : null}

                <View style={styles.ctaSpacer} />
                <AppButton
                  title={rcChecking ? 'Checking RevenueCat…' : 'Check RevenueCat status (Dev)'}
                  variant="secondary"
                  onPress={checkRevenueCat}
                  disabled={rcChecking}
                />
                <View style={styles.ctaSpacer} />
                <AppButton title="Reset subscription (Dev)" variant="secondary" onPress={resetDev} />
              </>
            ) : null}
          </View>
        ) : null}

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
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  spacer: {
    height: 16,
  },
  spacerSmall: {
    height: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerReassurance: {
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
  devToolsSection: {
    marginTop: 12,
  },
  devText: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '600',
  },
});
