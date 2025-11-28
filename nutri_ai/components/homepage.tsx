import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { MealEntry, MealCategory } from "../types/mealEntry";
import { NutritionInfo } from "../types/nutritionInfo";
import { MealQuality } from "../types/mealQuality";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TextStyles,
} from "../constants/theme";
import { mockMeals } from "../mock-data/meals";
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

const IOSStyleHomeScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate a week of dates ending with today
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i)); // 6 days ago to today
    return date;
  });

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
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 160 + insets.top },
        ]}
      >
        {/* Calorie Summary Card */}
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

        {/* Meals Section */}
        <View style={styles.mealsSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Today's Meals
          </Text>
          {meals.map((meal: MealEntry, index: number) => (
            <MealCard key={index} meal={meal} isDark={isDark} />
          ))}
        </View>
      </ScrollView>

      {/* Blur Header */}
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.absoluteHeader,
          {
            paddingTop: insets.top + Spacing.md,
            borderBottomColor: isDark ? "#333" : "#ccc",
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View>
            <Text style={[styles.headerDate, { color: secondaryText }]}>
              {new Date()
                .toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
                .toUpperCase()}
            </Text>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Today
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: cardBg }]}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: cardBg }]}
            >
              <Ionicons name="person" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Strip */}
        <View style={styles.dateStrip}>
          {days.map((day, index) => {
            const isSelected = day.getDate() === currentDate.getDate();
            const isToday = day.getDate() === new Date().getDate();
            return (
              <TouchableOpacity
                key={index}
                style={styles.dateItem}
                onPress={() => setCurrentDate(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayName,
                    {
                      color: isSelected
                        ? Colors.primary
                        : isToday
                          ? Colors.primary
                          : secondaryText,
                      fontWeight: isSelected ? "600" : "400",
                    },
                  ]}
                >
                  {day.toLocaleDateString("en-US", { weekday: "short" })[0]}
                </Text>
                <View
                  style={[
                    styles.dayNumberContainer,
                    isSelected && { backgroundColor: Colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      {
                        color: isSelected
                          ? "white"
                          : isToday
                            ? Colors.primary
                            : textColor,
                      },
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-meal")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  absoluteHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 100,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
  headerDate: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  headerButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.small,
  },
  dateStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
  },
  dateItem: {
    alignItems: "center",
    gap: 6,
  },
  dayName: {
    fontSize: 11,
    fontWeight: "500",
  },
  dayNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  dayNumber: {
    fontSize: 17,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 100,
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
