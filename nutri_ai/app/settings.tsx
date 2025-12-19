import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { useMeals } from "@/context/MealContext";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { fillLastXDays } = useMeals();
  const [isFillingMeals, setIsFillingMeals] = useState(false);

  const handleFillLastXDays = async (days: number) => {
    setIsFillingMeals(true);
    try {
      await fillLastXDays(days);
      Alert.alert(
        "Success",
        `Filled the last ${days} days with ${days * 4} generated meals!`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to fill meals. Check console for details.");
      console.error("Error filling meals:", error);
    } finally {
      setIsFillingMeals(false);
    }
  };

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: 20,
            backgroundColor: bgColor,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Settings</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Ionicons
              name="close-circle"
              size={30}
              color={isDark ? "#333" : "#E5E5EA"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Debug Menu Section */}
        <Text style={[styles.sectionTitle, { color: secondaryText }]}>
          DEBUG MENU
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleFillLastXDays(7)}
            disabled={isFillingMeals}
          >
            <View style={styles.menuItemContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                ]}
              >
                <Ionicons
                  name="flask-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <Text style={[styles.menuItemText, { color: textColor }]}>
                Fill Last 7 Days
              </Text>
            </View>
            {isFillingMeals ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={secondaryText} />
            )}
          </TouchableOpacity>
          <View
            style={[
              styles.divider,
              { backgroundColor: isDark ? "#333" : "#f0f0f0" },
            ]}
          />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleFillLastXDays(30)}
            disabled={isFillingMeals}
          >
            <View style={styles.menuItemContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                ]}
              >
                <Ionicons
                  name="flask-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <Text style={[styles.menuItemText, { color: textColor }]}>
                Fill Last 30 Days
              </Text>
            </View>
            {isFillingMeals ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={secondaryText} />
            )}
          </TouchableOpacity>
          <View
            style={[
              styles.divider,
              { backgroundColor: isDark ? "#333" : "#f0f0f0" },
            ]}
          />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleFillLastXDays(365)}
            disabled={isFillingMeals}
          >
            <View style={styles.menuItemContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                ]}
              >
                <Ionicons
                  name="flask-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <Text style={[styles.menuItemText, { color: textColor }]}>
                Fill Last Year
              </Text>
            </View>
            {isFillingMeals ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={secondaryText} />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 44,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 4,
    marginRight: -4,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    letterSpacing: 1,
  },
  sectionCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.small,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  divider: {
    height: 1,
    marginLeft: 52,
  },
});
