import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import LoginScreen from '../screens/LoginScreen';
import TripDashboard from '../screens/TripDashboard';
import TripExecution from '../screens/TripExecution';
import ParentDashboard from '../screens/ParentDashboard';
import LiveTrack from '../screens/LiveTrack';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function AppNavigation() {
  const { user, isLoading, restoreToken } = useAuthStore();

  React.useEffect(() => {
    restoreToken();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            {user.role === 'PARENT' ? (
              <>
                <Stack.Screen name="Main" component={ParentDashboard} />
                <Stack.Screen name="LiveTrack" component={LiveTrack} />
              </>
            ) : (
              <>
                <Stack.Screen name="Main" component={TripDashboard} />
                <Stack.Screen name="TripExecution" component={TripExecution} />
              </>
            )}
          </>
        ) : (
          <Stack.Screen name="Auth" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
