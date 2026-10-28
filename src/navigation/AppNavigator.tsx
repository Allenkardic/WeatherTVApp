import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen, MovieDetailScreen, PlayerScreen } from '../screens';
import { colors, routes } from '../utils';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={routes.HOME}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.ghostWhite },
        }}
      >
        <Stack.Screen name={routes.HOME} component={HomeScreen} />
        <Stack.Screen
          name={routes.MOVIE_DETAILS}
          component={MovieDetailScreen}
          options={{ contentStyle: { backgroundColor: colors.primary } }}
        />
        <Stack.Screen
          name={routes.PLAYER}
          component={PlayerScreen}
          options={{ contentStyle: { backgroundColor: colors.black } }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
