import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nProvider } from '@haven/i18n';
import { FamilyDashboard } from './src/screens/vision/FamilyDashboard';

export default function GrandchildApp() {
  return (
    <I18nProvider>
      <SafeAreaProvider>
        <FamilyDashboard locale="nl-NL" />
      </SafeAreaProvider>
    </I18nProvider>
  );
}
