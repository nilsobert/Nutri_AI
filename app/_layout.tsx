import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { Colors } from "@/constants/theme";
import { MealProvider } from "@/context/MealContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { UserProvider, useUser } from "@/context/UserContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Custom Dark Theme
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary,
    background: Colors.background.dark,
    card: Colors.cardBackground.dark,
    text: Colors.text.dark,
    border: Colors.border.dark,
    notification: Colors.primary,
  },
};

// Custom Light Theme
const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background.light,
    card: Colors.cardBackground.light,
    text: Colors.text.light,
    border: Colors.border.light,
    notification: Colors.primary,
  },
};

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
    <ThemeProvider
      value={colorScheme === "dark" ? CustomDarkTheme : CustomLightTheme}
    >
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="screens/calendar-screen"
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
