import AsyncStorage from '@react-native-async-storage/async-storage';

import { uuidV4 } from '../utils/uuid';

const INSTALL_ID_KEY = '@cnsdr_install_id_v1';

export async function getOrCreateInstallId(): Promise<string> {
  const existing = await AsyncStorage.getItem(INSTALL_ID_KEY);
  if (existing && existing.trim().length > 0) return existing;

  const id = uuidV4();
  await AsyncStorage.setItem(INSTALL_ID_KEY, id);
  return id;
}
