import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nProvider, useTranslation } from '@haven/i18n';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { FamilyDashboard } from './src/screens/vision/FamilyDashboard';
import { LoginScreen } from './src/screens/LoginScreen';

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
  return (
    <AuthProvider>
      <I18nProvider>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
