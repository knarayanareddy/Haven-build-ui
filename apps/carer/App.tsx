import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StatusBar, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { I18nProvider } from '@haven/i18n';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { HandoverForm } from './src/screens/HandoverForm';
import { ShiftSummary } from './src/screens/ShiftSummary';
import { ResponsiveDrawerTabNavigator } from './src/navigation/ResponsiveDrawerTabNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { CarerErrorBoundary } from './src/components/CarerErrorBoundary';

// Apply Nunito as the default font for all Text components
(Text as any).defaultProps = {
  ...((Text as any).defaultProps || {}),
  style: { fontFamily: 'Nunito' },
};

SplashScreen.preventAutoHideAsync();

type CarerScreen =
  | { name: 'Main' }
  | { name: 'HandoverForm'; params: { elder_id: string; elder_name: string } }
  | { name: 'ShiftSummary' };

function AppContent() {
  const { session, isReady } = useAuth();
  const [screen, setScreen] = useState<CarerScreen>({ name: 'Main' });

  const navigation = useMemo(() => ({
    navigate: (name: string, params?: Record<string, unknown>) => {
      setScreen({ name, params } as unknown as CarerScreen);
    },
    goBack: () => setScreen({ name: 'Main' }),
  }), []);

  const route = useMemo(() => ({
    params: 'params' in screen ? screen.params : {},
  }), [screen]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2C3E6B' }}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  const renderHeader = (title: string) => (
    <View style={{ backgroundColor: '#2C3E6B', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 }}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Terug"
        onPress={() => setScreen({ name: 'Main' })}
        style={{ paddingHorizontal: 8, paddingVertical: 4 }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900', fontFamily: 'Nunito-Black' }}>←</Text>
      </TouchableOpacity>
      <Text style={{ color: '#FFFFFF', fontWeight: '900', fontFamily: 'Nunito-Black', fontSize: 20, marginLeft: 8 }}>{title}</Text>
    </View>
  );

  if (screen.name === 'HandoverForm') {
    return (
      <View style={{ flex: 1 }}>
        {renderHeader('Handover Notitie')}
        <HandoverForm route={route as any} navigation={navigation} />
      </View>
    );
  }

  if (screen.name === 'ShiftSummary') {
    return (
      <View style={{ flex: 1 }}>
        {renderHeader('Overdracht')}
        <ShiftSummary />
      </View>
    );
  }

  return <ResponsiveDrawerTabNavigator navigation={navigation} />;
}

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
        <CarerErrorBoundary>
          <AppContent />
        </CarerErrorBoundary>
      </I18nProvider>
    </AuthProvider>
  );

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      {Platform.OS === 'android' ? (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#2C3E6B', paddingTop: StatusBar.currentHeight }}>
          {content}
        </SafeAreaView>
      ) : (
        content
      )}
    </SafeAreaProvider>
  );
}
