import React, { useCallback } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { I18nProvider, useTranslation } from '@haven/i18n';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { FamilyDashboard } from './src/screens/vision/FamilyDashboard';
import { LoginScreen } from './src/screens/LoginScreen';
import { GrandchildErrorBoundary } from './src/components/GrandchildErrorBoundary';

// Apply Nunito as the default font for all Text components
(Text as any).defaultProps = {
  ...((Text as any).defaultProps || {}),
  style: { fontFamily: 'Nunito' },
};

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { session, isReady } = useAuth();

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1B3A4B' }}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <FamilyDashboardWithLocale />;
}

function FamilyDashboardWithLocale() {
  const { locale } = useTranslation();
  return <FamilyDashboard locale={locale} />;
}

export default function GrandchildApp() {
  const [fontsLoaded] = useFonts({
    Nunito: Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-Black': Nunito_900Black,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <I18nProvider>
        <SafeAreaProvider onLayout={onLayoutRootView}>
          <GrandchildErrorBoundary>
            <AppContent />
          </GrandchildErrorBoundary>
        </SafeAreaProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
