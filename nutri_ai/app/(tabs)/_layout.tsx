import { Tabs } from "expo-router";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { View, Text, StyleSheet } from "react-native";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNetwork } from "../../context/NetworkContext";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isConnected } = useNetwork();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <Tabs
      tabBar={(props) => (
        <View>
          <BottomTabBar {...props} />
          {!isConnected && (
            <View
              style={[
                styles.offlineBanner,
                {
                  backgroundColor: theme.colors.card,
                  paddingBottom: Math.max(insets.bottom, 8),
                },
              ]}
            >
              <Text
                style={[
                  styles.offlineText,
                  {
                    color:
                      colorScheme === "dark"
                        ? Colors.text.dark
                        : Colors.text.light,
                  },
                ]}
              >
                No internet connection
              </Text>
            </View>
          )}
        </View>
      )}
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Insights",
          tabBarIcon: ({ color }) => (
            <Ionicons name="analytics" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    paddingTop: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  offlineText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
