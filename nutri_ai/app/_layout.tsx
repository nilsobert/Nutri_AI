import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { UserProvider, useUser } from "@/context/UserContext";
import { MealProvider } from "@/context/MealContext";
import { NetworkProvider } from "@/context/NetworkContext";

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useUser();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // @ts-ignore
    if (isLoading) return;

    const inTabsGroup = segments[0] === "(tabs)";

    if (!user && inTabsGroup) {
      // Redirect to the login page if the user is not authenticated
      router.replace("/");
      // @ts-ignore
    } else if (user && segments.length === 0) {
      // Redirect to the home page if the user is authenticated and on the landing page
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="screens/calendar-screen"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="screens/streaks-screen"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
        <Stack.Screen
          name="profile"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="settings"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="screens/edit-goals"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="add-meal"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="meal-detail"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screens/onboarding/welcome"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screens/onboarding/gender-selection"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screens/onboarding/goal-selection"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screens/onboarding/basic-info"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screens/onboarding/target-weight"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screens/onboarding/activity-level"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screens/onboarding/profile-picture"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screens/login-screen"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screens/signup-screen"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <NetworkProvider>
      <UserProvider>
        <MealProvider>
          <RootLayoutNav />
        </MealProvider>
      </UserProvider>
    </NetworkProvider>
  );
}
