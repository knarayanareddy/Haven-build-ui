import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { productionScreens } from '@haven/schema/src/screenSchema';
import { ElderScreen } from '../screens/ElderScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { useAuth } from '../auth/AuthProvider';

export type ElderStackParamList = Record<string, undefined>;
const Stack = createNativeStackNavigator<ElderStackParamList>();

export function AppNavigator() {
  const { session, isReady } = useAuth();

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A2B4C' }}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <Stack.Navigator initialRouteName="HOME" screenOptions={{ headerShown: false, animation: 'none' }}>
      {productionScreens.map((screen) => <Stack.Screen key={screen.screenId} name={screen.screenId} component={ElderScreen} />)}
    </Stack.Navigator>
  );
}
