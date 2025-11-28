import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
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
            // Wrap the icon in a centered container to ensure perfect centering
            <View style={{ width: 36, justifyContent: 'center', alignItems: 'center' }}>
              <IconSymbol size={28} name="house.fill" color={color} />
            </View>
          ),
        }}
      />
      {/* Keep the explore route hidden from the tab bar (file may still exist) */}
      <Tabs.Screen
        name="explore"
        options={{
          tabBarButton: () => null,
          headerShown: false,
        }}
      />
      {/* Explore tab removed — Home is the single tab now. */}
    </Tabs>
  );
}
