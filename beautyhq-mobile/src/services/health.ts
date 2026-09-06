import { Platform, NativeModules } from 'react-native';
import { api } from './api';
type Sample = { externalId: string; metric: 'steps'; value: number; unit: 'count'; measuredAt: string };
export async function importAppleHealthSteps() {
  if (Platform.OS !== 'ios') throw new Error('Apple Health requires an iPhone with a development or release build.');
  // Local Expo module is registered by the native build, not by Expo Go.
  const { requireNativeModule } = require('expo-modules-core');
  const health = requireNativeModule('BeautyHQHealth') as { requestAuthorization(): Promise<boolean>; readSteps(days: number): Promise<Sample[]> };
  const requested = await health.requestAuthorization();
  if (!requested) throw new Error('HealthKit authorization request was not completed.');
  const samples = await health.readSteps(7);
  if (!samples.length) return { samplesProcessed: 0, message: 'No readable samples. This may mean no data or access was not granted.' };
  await api.post('/integrations/apple-health/connect', { granted: true });
  return api.post('/integrations/apple-health/sync', { samples });
}
