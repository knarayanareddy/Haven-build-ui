import 'react-native-gesture-handler';
import React, { useCallback } from 'react';
import { Platform, StatusBar, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { I18nProvider } from '@haven/i18n';
import { AuthProvider } from './src/auth/AuthProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ElderErrorBoundary } from './src/components/ElderErrorBoundary';

// Apply Nunito as the default font for all Text components
(Text as any).defaultProps = {
  ...((Text as any).defaultProps || {}),
  style: { fontFamily: 'Nunito' },
};

SplashScreen.preventAutoHideAsync();

export default function App() {
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

  const content = (
    <AuthProvider>
      <I18nProvider initialLocale="nl-NL">
        <ElderErrorBoundary>
          <AppNavigator />
        </ElderErrorBoundary>
      </I18nProvider>
    </AuthProvider>
  );

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      {Platform.OS === 'android' ? (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1A2B4C', paddingTop: StatusBar.currentHeight }}>
          {content}
        </SafeAreaView>
      ) : (
        content
      )}
    </SafeAreaProvider>
  );
}
