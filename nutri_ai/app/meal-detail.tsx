import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMeals } from "../context/MealContext";
import { Colors, Spacing, Typography, BorderRadius, Shadows } from "../constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MealImage } from "../components/MealImage";

interface NutrientPillProps {
  label: string;
  value: string;
  color: string;
  isDark: boolean;
}

const NutrientPill: React.FC<NutrientPillProps> = ({
  label,
  value,
  color,
  isDark,
}) => (
  <View
    style={[
      styles.nutrientPill,
      { backgroundColor: isDark ? `${color}20` : `${color}15` },
    ]}
  >
    <View style={[styles.nutrientDot, { backgroundColor: color }]} />
    <View>
      <Text style={[styles.nutrientValue, { color: isDark ? "#fff" : "#000" }]}>
        {value}
      </Text>
      <Text style={[styles.nutrientLabel, { color: color }]}>{label}</Text>
    </View>
  </View>
);

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { meals } = useMeals();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const meal = meals.find((m) => m.id === id);

  if (!meal) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
        <Text style={{ color: isDark ? Colors.text.dark : Colors.text.light }}>Meal not found</Text>
      </View>
    );
  }

  const { nutritionInfo, mealQuality } = meal;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";
  const cardBg = isDark ? Colors.cardBackground.dark : Colors.cardBackground.light;

  const getQualityColor = (score: number) => {
    if (score >= 7) return "#34C759"; // Green
    if (score >= 4) return "#FF9500"; // Orange
    return "#FF3B30"; // Red
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Header */}
        <View style={styles.imageContainer}>
          {meal.image ? (
            <MealImage uri={meal.image} style={styles.image} resizeMode="cover" />
          ) : (
            <View
              style={[
                styles.placeholderImage,
                { backgroundColor: isDark ? "#333" : "#e1e1e1" },
              ]}
            >
              <Ionicons
                name="restaurant"
                size={64}
                color={isDark ? "#555" : "#ccc"}
              />
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.closeButton, { top: insets.top + 10 }]}
            onPress={() => router.back()}
          >
            <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={styles.closeButtonBlur}>
              <Ionicons name="close" size={24} color={textColor} />
            </BlurView>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Header Info */}
          <View style={styles.header}>
            <Text style={[styles.category, { color: Colors.primary }]}>{meal.category}</Text>
            <Text style={[styles.title, { color: textColor }]}>
              {meal.name || meal.transcription || "Meal Item"}
            </Text>
            <Text style={[styles.date, { color: secondaryText }]}>
              {new Date(meal.timestamp * 1000).toLocaleString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
              })}
            </Text>
          </View>

          {/* Calories Card */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.caloriesRow}>
              <View>
                <Text style={[styles.cardLabel, { color: secondaryText }]}>Total Calories</Text>
                <Text style={[styles.caloriesValue, { color: textColor }]}>
                  {nutritionInfo.calories} <Text style={styles.unit}>kcal</Text>
                </Text>
              </View>
              <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(mealQuality.mealQualityScore) }]}>
                <Text style={styles.qualityScore}>{mealQuality.mealQualityScore}/10</Text>
              </View>
            </View>
          </View>

          {/* Macros */}
          <View style={styles.macrosContainer}>
            <NutrientPill
              label="Carbs"
              value={`${nutritionInfo.carbs}g`}
              color={Colors.secondary.carbs}
              isDark={isDark}
            />
            <NutrientPill
              label="Protein"
              value={`${nutritionInfo.protein}g`}
              color={Colors.secondary.protein}
              isDark={isDark}
            />
            <NutrientPill
              label="Fat"
              value={`${nutritionInfo.fat}g`}
              color={Colors.secondary.fat}
              isDark={isDark}
            />
          </View>

          {/* Detailed Stats */}
          <View style={[styles.card, { backgroundColor: cardBg, marginTop: Spacing.lg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Analysis</Text>
            
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: secondaryText }]}>Goal Fit</Text>
                <Text style={[styles.statValue, { color: textColor }]}>{mealQuality.goalFitPercentage}%</Text>
                <Text style={[styles.statDesc, { color: secondaryText }]}>Alignment with your goals</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: isDark ? "#333" : "#f0f0f0" }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: secondaryText }]}>Calorie Density</Text>
                <Text style={[styles.statValue, { color: textColor }]}>{mealQuality.calorieDensity.toFixed(1)}</Text>
                <Text style={[styles.statDesc, { color: secondaryText }]}>Calories per gram</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? "#333" : "#f0f0f0", marginVertical: Spacing.md }]} />

            <View style={styles.additionalStats}>
              <View style={styles.additionalStatRow}>
                <Text style={[styles.additionalStatLabel, { color: secondaryText }]}>Sugar</Text>
                <Text style={[styles.additionalStatValue, { color: textColor }]}>{nutritionInfo.sugar}g</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
  },
  closeButtonBlur: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  content: {
    padding: Spacing.xl,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "transparent", // Let the container background show through, but we might need a solid background if we want to cover the image bottom
  },
  header: {
    marginBottom: Spacing.xl,
  },
  category: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: Typography.sizes.sm,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.small,
  },
  caloriesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: Typography.sizes.sm,
    marginBottom: 4,
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: Typography.weights.bold,
  },
  unit: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
  },
  qualityBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  qualityScore: {
    color: "white",
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  macrosContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  nutrientPill: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  nutrientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nutrientValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  nutrientLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.lg,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: "100%",
    backgroundColor: "#f0f0f0",
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: Typography.weights.bold,
    marginBottom: 2,
  },
  statDesc: {
    fontSize: 10,
  },
  additionalStats: {
    gap: Spacing.sm,
  },
  additionalStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  additionalStatLabel: {
    fontSize: Typography.sizes.sm,
  },
  additionalStatValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
});
