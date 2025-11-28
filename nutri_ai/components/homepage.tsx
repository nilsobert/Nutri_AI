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
import { SafeAreaView } from "react-native-safe-area-context";
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

  return (
    <TouchableOpacity
      onPress={toggleExpand}
      style={[styles.mealCard, { backgroundColor: cardBg }]}
      activeOpacity={0.7}
    >
      <View style={styles.mealCardHeader}>
        <View style={styles.mealIconContainer}>
          <View
            style={[
              styles.mealIcon,
              { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5" },
            ]}
          >
            <Ionicons
              name={getMealIcon(meal.getCategory()) as any}
              size={24}
              color={Colors.primary}
            />
          </View>
          <View style={styles.mealInfo}>
            <Text style={[styles.mealName, { color: textColor }]}>
              {meal.getCategory()}
            </Text>
            <Text style={[styles.mealDescription, { color: secondaryText }]}>
              {meal.getTranscription() || "No description"}
            </Text>
          </View>
        </View>
        <View style={styles.mealCaloriesContainer}>
          <Text style={[styles.mealCalories, { color: Colors.primary }]}>
            {nutrition.getCalories()}
          </Text>
          <Text style={[styles.mealCaloriesLabel, { color: secondaryText }]}>
            kcal
          </Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.mealDetails}>
          <View
            style={[
              styles.detailsDivider,
              { backgroundColor: isDark ? "#333" : "#eee" },
            ]}
          />

          {/* Nutrition Info */}
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionLabel, { color: secondaryText }]}>
                Carbs
              </Text>
              <Text style={[styles.nutritionValue, { color: textColor }]}>
                {nutrition.getCarbs()}g
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionLabel, { color: secondaryText }]}>
                Protein
              </Text>
              <Text style={[styles.nutritionValue, { color: textColor }]}>
                {nutrition.getProtein()}g
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionLabel, { color: secondaryText }]}>
                Fat
              </Text>
              <Text style={[styles.nutritionValue, { color: textColor }]}>
                {nutrition.getFat()}g
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionLabel, { color: secondaryText }]}>
                Sugar
              </Text>
              <Text style={[styles.nutritionValue, { color: textColor }]}>
                {nutrition.getSugar()}g
              </Text>
            </View>
          </View>

          {/* Meal Quality */}
          <View style={styles.qualitySection}>
            <View style={styles.qualityRow}>
              <Text style={[styles.qualityLabel, { color: secondaryText }]}>
                Quality Score
              </Text>
              <View style={styles.qualityBadge}>
                <Text style={styles.qualityScore}>
                  {quality.getMealQualityScore()}/10
                </Text>
              </View>
            </View>
            <View style={styles.qualityRow}>
              <Text style={[styles.qualityLabel, { color: secondaryText }]}>
                Goal Fit
              </Text>
              <Text style={[styles.qualityValue, { color: textColor }]}>
                {quality.getGoalFitPercentage()}%
              </Text>
            </View>
            <View style={styles.qualityRow}>
              <Text style={[styles.qualityLabel, { color: secondaryText }]}>
                Calorie Density
              </Text>
              <Text style={[styles.qualityValue, { color: textColor }]}>
                {quality.getCalorieDensity().toFixed(1)} kcal/g
              </Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const IOSStyleHomeScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = [-3, -2, -1, 0].map((offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date;
  });

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
  const consumedPercentage = (totalCalories / calorieGoal) * 100;

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
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.calendarButton, { backgroundColor: cardBg }]}
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Date Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dateSelector}
          contentContainerStyle={styles.dateSelectorContent}
        >
          {days.map((day, index) => {
            const isSelected = day.getDate() === currentDate.getDate();
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateChip,
                  { backgroundColor: cardBg },
                  isSelected && { backgroundColor: Colors.primary },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dateText,
                    { color: textColor },
                    isSelected && styles.selectedDateText,
                  ]}
                >
                  {formatDate(day)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-meal")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerDate: {
    fontSize: Typography.sizes.sm,
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.small,
  },
  dateSelector: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  dateSelectorContent: {
    gap: Spacing.sm,
  },
  dateChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.small,
  },
  dateText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  selectedDateText: {
    color: "white",
    fontWeight: Typography.weights.bold,
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  mealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
  },
  mealDescription: {
    fontSize: Typography.sizes.sm,
  },
  mealCaloriesContainer: {
    alignItems: "flex-end",
  },
  mealCalories: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.bold,
  },
  mealCaloriesLabel: {
    fontSize: Typography.sizes.xs,
  },
  mealDetails: {
    marginTop: Spacing.lg,
  },
  detailsDivider: {
    height: 1,
    marginBottom: Spacing.lg,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: Spacing.lg,
  },
  nutritionItem: {
    width: "50%",
    marginBottom: Spacing.md,
  },
  nutritionLabel: {
    fontSize: Typography.sizes.sm,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
  },
  qualitySection: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  qualityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  qualityLabel: {
    fontSize: Typography.sizes.sm,
  },
  qualityValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  qualityBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  qualityScore: {
    color: "white",
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
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
