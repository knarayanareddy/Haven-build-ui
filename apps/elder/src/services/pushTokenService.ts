// ─── Push Notification Token Registration ───
// Registers the Expo push token with fn-push-token-register on Supabase
// after the user is authenticated. Handles permission requests gracefully.

import { getExpoPushTokenAsync } from 'expo-notifications';
import { requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { addNotificationReceivedListener, addNotificationResponseReceivedListener } from 'expo-notifications/build/NotificationsEmitter';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { Platform } from 'react-native';
import { HavenClient } from './havenClient';

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerPushToken(client: HavenClient, profileId: string): Promise<string | null> {
  try {
    const permissions = await requestPermissionsAsync();
    if (!permissions.granted) return null;

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await setNotificationChannelAsync('haven-default', {
        name: 'HAVEN',
        importance: AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#059669',
      });
    }

    const tokenData = await getExpoPushTokenAsync();
    const token = tokenData.data;

    // Register with Supabase via fn-push-token-register
    await client.registerPushToken({
      profile_id: profileId,
      token,
      platform: Platform.OS,
    });

    return token;
  } catch {
    // Gracefully skip — push notifications are optional
    return null;
  }
}

export function addNotificationListeners(
  onReceived?: (notification: unknown) => void,
  onResponse?: (response: unknown) => void,
) {
  const receivedSub = addNotificationReceivedListener((notification) => {
    onReceived?.(notification);
  });

  const responseSub = addNotificationResponseReceivedListener((response) => {
    onResponse?.(response);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
