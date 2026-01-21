import Constants from 'expo-constants';

import type { StoredEntitlement } from '../../storage/subscriptionStorage';

type RevenueCatConfig = {
  sdkKey: string;
  entitlementId: string;
  productId: string;
};

export type RevenueCatStatus = {
  configured: boolean;
  sdkKeyPresent: boolean;
  entitlementId: string;
  productIdPresent: boolean;
  customerInfoOk: boolean;
  activeEntitlement: boolean;
  activeEntitlementIds: string[];
  offeringsCurrentOk: boolean;
  availablePackagesCount: number;
  availablePackageIds: string[];
  availableProductIds: string[];
  error: string | null;
};

function readRevenueCatConfig(): RevenueCatConfig {
  const extra: any = (Constants.expoConfig as any)?.extra ?? (Constants.manifest as any)?.extra ?? {};
  const rc: any = extra.revenuecat ?? {};

  return {
    sdkKey: typeof rc.sdkKey === 'string' ? rc.sdkKey : '',
    entitlementId: typeof rc.entitlementId === 'string' ? rc.entitlementId : 'pondr_plus',
    productId: typeof rc.productId === 'string' ? rc.productId : '',
  };
}

async function getPurchasesModule(): Promise<any | null> {
  try {
    const mod: any = await import('react-native-purchases');
    return mod?.default ?? mod;
  } catch {
    return null;
  }
}

let configuredKey: string | null = null;

async function ensureConfigured(): Promise<{ Purchases: any; config: RevenueCatConfig } | null> {
  const Purchases = await getPurchasesModule();
  if (!Purchases) return null;

  const config = readRevenueCatConfig();
  if (!config.sdkKey) return null;

  if (configuredKey !== config.sdkKey) {
    await Purchases.configure({ apiKey: config.sdkKey });
    configuredKey = config.sdkKey;
  }

  return { Purchases, config };
}

function entitlementFromCustomerInfo(input: { customerInfo: any; entitlementId: string }): StoredEntitlement {
  const entitlements = input.customerInfo?.entitlements?.active ?? {};
  const entitlement = entitlements[input.entitlementId];

  const expiresDate: string | null = entitlement?.expirationDate ?? null;
  const expiresAtMs = expiresDate ? new Date(expiresDate).getTime() : null;

  const active = !!entitlement;

  return {
    subscriptionTier: active ? 'plus' : 'free',
    currentPeriodEndAtMs: typeof expiresAtMs === 'number' && Number.isFinite(expiresAtMs) ? expiresAtMs : null,
    lastSyncedAtMs: Date.now(),
    source: 'revenuecat_sandbox',
  };
}

export async function revenueCatSyncEntitlement(): Promise<StoredEntitlement | null> {
  const configured = await ensureConfigured();
  if (!configured) return null;

  const result = await configured.Purchases.getCustomerInfo();
  const customerInfo = result?.customerInfo ?? result;
  return entitlementFromCustomerInfo({ customerInfo, entitlementId: configured.config.entitlementId });
}

export async function revenueCatRestorePurchases(): Promise<StoredEntitlement | null> {
  const configured = await ensureConfigured();
  if (!configured) return null;

  const result = await configured.Purchases.restorePurchases();
  const customerInfo = result?.customerInfo ?? result;
  return entitlementFromCustomerInfo({ customerInfo, entitlementId: configured.config.entitlementId });
}

export async function revenueCatPurchasePlus(): Promise<StoredEntitlement | null> {
  const configured = await ensureConfigured();
  if (!configured) return null;

  const preferredId = configured.config.productId;
  const offerings = await configured.Purchases.getOfferings();
  const current = offerings?.current ?? null;
  const packages: any[] = current?.availablePackages ?? [];

  if (!packages.length) return null;

  const matching = preferredId
    ? packages.find((p) => p?.identifier === preferredId || p?.product?.identifier === preferredId)
    : null;
  const chosen = matching ?? packages[0];

  const result = await configured.Purchases.purchasePackage(chosen);
  const customerInfo = result?.customerInfo ?? result;
  return entitlementFromCustomerInfo({ customerInfo, entitlementId: configured.config.entitlementId });
}

export async function revenueCatCheckStatus(): Promise<RevenueCatStatus> {
  const config = readRevenueCatConfig();
  const Purchases = await getPurchasesModule();

  const sdkKeyPresent = !!config.sdkKey;
  const productIdPresent = !!config.productId;

  if (!Purchases) {
    return {
      configured: false,
      sdkKeyPresent,
      entitlementId: config.entitlementId,
      productIdPresent,
      customerInfoOk: false,
      activeEntitlement: false,
      activeEntitlementIds: [],
      offeringsCurrentOk: false,
      availablePackagesCount: 0,
      availablePackageIds: [],
      availableProductIds: [],
      error: 'Purchases module not available (not in dev client?).',
    };
  }

  if (!sdkKeyPresent) {
    return {
      configured: false,
      sdkKeyPresent,
      entitlementId: config.entitlementId,
      productIdPresent,
      customerInfoOk: false,
      activeEntitlement: false,
      activeEntitlementIds: [],
      offeringsCurrentOk: false,
      availablePackagesCount: 0,
      availablePackageIds: [],
      availableProductIds: [],
      error: 'RevenueCat SDK key missing in expo.extra.revenuecat.',
    };
  }

  try {
    const ensured = await ensureConfigured();
    if (!ensured) {
      return {
        configured: false,
        sdkKeyPresent,
        entitlementId: config.entitlementId,
        productIdPresent,
        customerInfoOk: false,
        activeEntitlement: false,
        activeEntitlementIds: [],
        offeringsCurrentOk: false,
        availablePackagesCount: 0,
        availablePackageIds: [],
        availableProductIds: [],
        error: 'RevenueCat not configured.',
      };
    }

    const result = await ensured.Purchases.getCustomerInfo();
    const customerInfo = result?.customerInfo ?? result;
    const entitlements = customerInfo?.entitlements?.active ?? {};
    const activeEntitlementIds = Object.keys(entitlements);
    const activeEntitlement = !!entitlements[ensured.config.entitlementId];

    const offerings = await ensured.Purchases.getOfferings();
    const current = offerings?.current ?? null;
    const packages: any[] = current?.availablePackages ?? [];
    const availablePackageIds = packages.map((p) => String(p?.identifier ?? '')).filter(Boolean);
    const availableProductIds = packages
      .map((p) => String(p?.product?.identifier ?? ''))
      .filter(Boolean);

    return {
      configured: true,
      sdkKeyPresent,
      entitlementId: ensured.config.entitlementId,
      productIdPresent,
      customerInfoOk: true,
      activeEntitlement,
      activeEntitlementIds,
      offeringsCurrentOk: !!current,
      availablePackagesCount: packages.length,
      availablePackageIds,
      availableProductIds,
      error: null,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown RevenueCat error.';
    return {
      configured: true,
      sdkKeyPresent,
      entitlementId: config.entitlementId,
      productIdPresent,
      customerInfoOk: false,
      activeEntitlement: false,
      activeEntitlementIds: [],
      offeringsCurrentOk: false,
      availablePackagesCount: 0,
      availablePackageIds: [],
      availableProductIds: [],
      error: message,
    };
  }
}
