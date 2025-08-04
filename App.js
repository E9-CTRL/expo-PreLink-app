// App.js (for testing verification flow only)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import VerificationScreen from './screens/VerificationScreen';
import VerifyScreen from './screens/VerifyScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        <Stack.Screen
          name="VerificationScreen"
          component={VerificationScreen}
          options={{ title: 'Verify Your Identity' }}
        />
        <Stack.Screen
          name="VerifyScreen"
          component={VerifyScreen}
          options={{ title: 'Verification Result' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
