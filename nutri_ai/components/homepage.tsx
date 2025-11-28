import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  useColorScheme,
  View,
} from "react-native";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
  TextStyles,
} from "../constants/theme";
import { mockMeals } from "../mock-data/meals";
import { MealCategory, MealEntry } from "../types/mealEntry";
import { ActivityRings } from "./ActivityRings";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

interface MealCardProps {
  meal: MealEntry;
  isDark: boolean;
}

const MealCard: React.FC<MealCardProps> = ({ meal, isDark }) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const nutrition = meal.getNutritionInfo();
  const quality = meal.getMealQuality();

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const getQualityColor = (score: number) => {
    if (score >= 7) return "#34C759"; // Green
    if (score >= 4) return "#FF9500"; // Orange
    return "#FF3B30"; // Red
  };

  const getMealIcon = (category: MealCategory) => {
    switch (category) {
      case MealCategory.Breakfast:
        return "sunny-outline";
      case MealCategory.Lunch:
        return "restaurant-outline";
      case MealCategory.Dinner:
        return "moon-outline";
      case MealCategory.Snack:
        return "cafe-outline";
      default:
        return "fast-food-outline";
    }
  };

  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";
  const borderColor = isDark ? "#333" : "#f0f0f0";

  return (
    <TouchableOpacity
      onPress={toggleExpand}
      style={[styles.mealCard, { backgroundColor: cardBg }]}
      activeOpacity={0.7}
    >
      <View style={styles.mealCardHeader}>
        <View
          style={[
            styles.mealIcon,
            { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
          ]}
        >
          <Ionicons
            name={getMealIcon(meal.getCategory()) as any}
            size={24}
            color={Colors.primary}
          />
        </View>

        <View style={styles.mealHeaderInfo}>
          <View style={styles.mealTitleRow}>
            <Text style={[styles.mealName, { color: textColor }]}>
              {meal.getCategory()}
            </Text>
            <Text style={[styles.mealCalories, { color: textColor }]}>
              {nutrition.getCalories()}{" "}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "400",
                  color: secondaryText,
                }}
              >
                kcal
              </Text>
            </Text>
          </View>
          <View style={styles.mealSubtitleRow}>
            <Text
              style={[styles.mealDescription, { color: secondaryText }]}
              numberOfLines={1}
            >
              {meal.getTranscription() || "No description"}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={secondaryText}
            />
          </View>
        </View>
      </View>

      {expanded && (
        <View style={styles.mealDetails}>
          <View style={styles.nutrientRow}>
            <NutrientPill
              label="Carbs"
              value={`${nutrition.getCarbs()}g`}
              color={Colors.secondary.carbs}
              isDark={isDark}
            />
            <NutrientPill
              label="Protein"
              value={`${nutrition.getProtein()}g`}
              color={Colors.secondary.protein}
              isDark={isDark}
            />
            <NutrientPill
              label="Fat"
              value={`${nutrition.getFat()}g`}
              color={Colors.secondary.fat}
              isDark={isDark}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: secondaryText }]}>
                Quality
              </Text>
              <View
                style={[
                  styles.qualityBadge,
                  {
                    backgroundColor: getQualityColor(
                      quality.getMealQualityScore(),
                    ),
                  },
                ]}
              >
                <Text style={styles.qualityScore}>
                  {quality.getMealQualityScore()}
                </Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: secondaryText }]}>
                Goal Fit
              </Text>
              <Text style={[styles.statValue, { color: textColor }]}>
                {quality.getGoalFitPercentage()}%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: secondaryText }]}>
                Density
              </Text>
              <Text style={[styles.statValue, { color: textColor }]}>
                {quality.getCalorieDensity().toFixed(1)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.addMealButton,
              { backgroundColor: isDark ? "#333" : "#f5f5f5" },
            ]}
            onPress={() => router.push("/add-meal")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={[styles.addMealButtonText, { color: Colors.primary }]}>
              Add Item
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const IOSStyleHomeScreen: React.FC = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [currentDate, setCurrentDate] = useState(new Date());

  // compute previous 3 days + current
  const getDays = (date: Date) => {
    return [-3, -2, -1, 0].map((offset) => {
      const d = new Date(date);
      d.setDate(date.getDate() + offset);
      return d;
    });
  };

  const days = getDays(currentDate);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const meals: MealEntry[] = mockMeals;

  const totalCalories = meals.reduce(
    (sum: number, meal: MealEntry) =>
      sum + meal.getNutritionInfo().getCalories(),
    0,
  );

  const totalCarbs = meals.reduce(
    (sum: number, meal: MealEntry) => sum + meal.getNutritionInfo().getCarbs(),
    0,
  );

  const totalProtein = meals.reduce(
    (sum: number, meal: MealEntry) =>
      sum + meal.getNutritionInfo().getProtein(),
    0,
  );

  const totalFat = meals.reduce(
    (sum: number, meal: MealEntry) => sum + meal.getNutritionInfo().getFat(),
    0,
  );

  const calorieGoal = 2500;
  const carbsGoal = 300;
  const proteinGoal = 150;
  const fatGoal = 80;
  
  const remainingCalories = calorieGoal - totalCalories;

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Today
            </Text>
            <Text style={[styles.headerDate, { color: secondaryText }]}>
              {currentDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.calendarButton, { backgroundColor: cardBg }]}
            onPress={() => router.push("/screens/calendar-screen")}
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* 4-day horizontal bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginVertical: Spacing.lg, paddingHorizontal: Spacing.lg }}
          contentContainerStyle={{ gap: Spacing.sm }}
        >
          {days.map((day, index) => {
            const isSelected = day.getDate() === currentDate.getDate();
            return (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentDate(day)}
                style={{
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.lg,
                  borderRadius: BorderRadius.xl,
                  backgroundColor: isSelected ? Colors.primary : cardBg,
                }}
              >
                <Text
                  style={{
                    color: isSelected ? "white" : textColor,
                    fontWeight: isSelected ? "700" : "500",
                  }}
                >
                  {formatDate(day)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Calories and Meals Section */}
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryTitle, { color: textColor }]}>
            Daily Summary
          </Text>

          <View style={styles.summaryContent}>
            {/* Rings Section */}
            <View style={styles.ringsContainer}>
              <ActivityRings
                carbs={totalCarbs}
                carbsGoal={carbsGoal}
                protein={totalProtein}
                proteinGoal={proteinGoal}
                fat={totalFat}
                fatGoal={fatGoal}
                size={180}
              />
              <View style={styles.ringsOverlay}>
                <Text style={[styles.ringsOverlayValue, { color: textColor }]}>
                  {remainingCalories}
                </Text>
                <Text style={[styles.ringsOverlayLabel, { color: secondaryText }]}>
                  kcal left
                </Text>
              </View>
            </View>

            {/* Legend Section */}
            <View style={styles.legendContainer}>
              {/* Calories */}
              <View style={styles.legendItem}>
                <Text style={[styles.legendLabel, { color: Colors.primary }]}>
                  Calories
                </Text>
                <View style={styles.legendValues}>
                  <Text style={[styles.legendValue, { color: textColor }]}>
                    {totalCalories}
                  </Text>
                  <Text style={[styles.legendGoal, { color: secondaryText }]}>
                    / {calorieGoal} kcal
                  </Text>
                </View>
              </View>

              {/* Carbs */}
              <View style={styles.legendItem}>
                <Text style={[styles.legendLabel, { color: Colors.secondary.carbs }]}>
                  Carbs
                </Text>
                <View style={styles.legendValues}>
                  <Text style={[styles.legendValue, { color: textColor }]}>
                    {totalCarbs}g
                  </Text>
                  <Text style={[styles.legendGoal, { color: secondaryText }]}>
                    / {carbsGoal}g
                  </Text>
                </View>
              </View>

              {/* Protein */}
              <View style={styles.legendItem}>
                <Text style={[styles.legendLabel, { color: Colors.secondary.protein }]}>
                  Protein
                </Text>
                <View style={styles.legendValues}>
                  <Text style={[styles.legendValue, { color: textColor }]}>
                    {totalProtein}g
                  </Text>
                  <Text style={[styles.legendGoal, { color: secondaryText }]}>
                    / {proteinGoal}g
                  </Text>
                </View>
              </View>

              {/* Fat */}
              <View style={styles.legendItem}>
                <Text style={[styles.legendLabel, { color: Colors.secondary.fat }]}>
                  Fat
                </Text>
                <View style={styles.legendValues}>
                  <Text style={[styles.legendValue, { color: textColor }]}>
                    {totalFat}g
                  </Text>
                  <Text style={[styles.legendGoal, { color: secondaryText }]}>
                    / {fatGoal}g
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.xl, paddingBottom: 100 }}>
          <Text
            style={{
              fontSize: Typography.sizes.xl,
              fontWeight: Typography.weights.semibold,
              marginBottom: Spacing.lg,
              color: textColor,
            }}
          >
            Today's Meals
          </Text>
          {meals.map((meal, idx) => (
            <MealCard key={idx} meal={meal} isDark={isDark} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes["4xl"],
    fontWeight: Typography.weights.bold,
    marginBottom: 4,
  },
  headerDate: { fontSize: Typography.sizes.sm },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.small,
  },
  summaryCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius["2xl"],
    ...Shadows.medium,
  },
  summaryTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.lg,
  },
  summaryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  ringsContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  ringsOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ringsOverlayValue: {
    ...TextStyles.ringValue,
  },
  ringsOverlayLabel: {
    ...TextStyles.ringLabel,
    marginTop: 2,
  },
  legendContainer: {
    flex: 1,
    marginLeft: Spacing.xl,
    justifyContent: "center",
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "column",
  },
  legendLabel: {
    ...TextStyles.legendLabel,
  },
  legendValues: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  legendValue: {
    ...TextStyles.legendValue,
  },
  legendGoal: {
    ...TextStyles.legendGoal,
  },
  mealsSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.lg,
  },
  mealCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  mealCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  mealHeaderInfo: {
    flex: 1,
    justifyContent: "center",
  },
  mealTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  mealSubtitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  mealDescription: {
    fontSize: Typography.sizes.sm,
    flex: 1,
    marginRight: Spacing.sm,
  },
  mealCalories: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  mealDetails: {
    marginTop: Spacing.lg,
  },
  nutrientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  nutrientPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  nutrientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nutrientValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    lineHeight: 20,
  },
  nutrientLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  qualityBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  qualityScore: {
    color: "white",
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  addMealButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  addMealButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  fab: {
    position: "absolute",
    bottom: Spacing["3xl"],
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.large,
  },
});

export default IOSStyleHomeScreen;
