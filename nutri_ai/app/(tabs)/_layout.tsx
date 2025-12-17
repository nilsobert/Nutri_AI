import { Tabs } from "expo-router";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";
import { BottomTabBar } from "@react-navigation/bottom-tabs";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import NetworkBanner from "../../components/NetworkBanner";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <View>
          <BottomTabBar {...props} />
          <NetworkBanner />
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
