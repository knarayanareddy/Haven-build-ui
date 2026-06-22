import React, { useCallback } from 'react';
import { Platform, StatusBar, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { I18nProvider } from '@haven/i18n';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { HandoverForm } from './src/screens/HandoverForm';
import { ShiftSummary } from './src/screens/ShiftSummary';
import { ResponsiveDrawerTabNavigator } from './src/navigation/ResponsiveDrawerTabNavigator';
import { LoginScreen } from './src/screens/LoginScreen';

// Apply Nunito as the default font for all Text components
(Text as any).defaultProps = {
  ...((Text as any).defaultProps || {}),
  style: { fontFamily: 'Nunito' },
};

SplashScreen.preventAutoHideAsync();

type CarerStackParamList = {
  Main: undefined;
  HandoverForm: { elder_id: string; elder_name: string };
  ShiftSummary: undefined;
};

const Stack = createNativeStackNavigator<CarerStackParamList>();

function AppContent() {
  const { session, isReady } = useAuth();

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

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerStyle: { backgroundColor: '#2C3E6B' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '900', fontSize: 20 },
        }}
      >
        <Stack.Screen name="Main" component={ResponsiveDrawerTabNavigator as any} options={{ headerShown: false }} />
        <Stack.Screen name="HandoverForm" component={HandoverForm as any} options={{ title: 'Handover Notitie' }} />
        <Stack.Screen name="ShiftSummary" component={ShiftSummary as any} options={{ title: 'Overdracht' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito: Nunito_400Regular,
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
        <AppContent />
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
