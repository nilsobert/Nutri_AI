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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CalendarScreen from "../app/screens/calendarScreen";
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
  const secondaryText = isDark ? Colors.text.dark : Colors.text.light;

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
              { backgroundColor: isDark ? Colors.cardBackground.dark : Colors.cardBackground.light },
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
              { backgroundColor: isDark ? Colors.nutrientBar.dark : Colors.nutrientBar.light },
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
  const [showCalendar, setShowCalendar] = useState(false);

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
  const remainingCalories = calorieGoal - totalCalories;
  const consumedPercentage = (totalCalories / calorieGoal) * 100;

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? Colors.text.dark : Colors.text.light;

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
            onPress={() => setShowCalendar((s) => !s)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showCalendar ? "calendar" : "calendar-outline"}
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Open calendar as a full-screen modal when toggled */}
        <Modal
          visible={showCalendar}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowCalendar(false)}
        >
          <CalendarScreen onClose={() => setShowCalendar(false)} />
        </Modal>

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

          <View style={styles.calorieCircle}>
            <View style={[styles.circleOuter, { borderColor: Colors.primary }]}>
              <View style={[styles.circleInner, { backgroundColor: bgColor }]}>
                <Text
                  style={[styles.remainingCalories, { color: Colors.primary }]}
                >
                  {remainingCalories}
                </Text>
                <Text style={[styles.remainingText, { color: secondaryText }]}>
                  remaining
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.calorieInfo}>
            <View style={styles.calorieInfoItem}>
              <Text style={[styles.calorieInfoValue, { color: textColor }]}>
                {totalCalories}
              </Text>
              <Text style={[styles.calorieInfoLabel, { color: secondaryText }]}>
                consumed
              </Text>
            </View>
            <View style={styles.calorieInfoDivider} />
            <View style={styles.calorieInfoItem}>
              <Text style={[styles.calorieInfoValue, { color: textColor }]}>
                {calorieGoal}
              </Text>
              <Text style={[styles.calorieInfoLabel, { color: secondaryText }]}>
                goal
              </Text>
            </View>
          </View>

          {/* Macros Breakdown */}
          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <View style={[styles.macroIcon, { backgroundColor: Colors.iconBackground.breakfast }]}>
                <Text style={styles.macroEmoji}>🍞</Text>
              </View>
              <Text style={[styles.macroValue, { color: textColor }]}>
                {totalCarbs}g
              </Text>
              <Text style={[styles.macroLabel, { color: secondaryText }]}>
                Carbs
              </Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroIcon, { backgroundColor: Colors.iconBackground.lunch }]}>
                <Text style={styles.macroEmoji}>🥩</Text>
              </View>
              <Text style={[styles.macroValue, { color: textColor }]}>
                {totalProtein}g
              </Text>
              <Text style={[styles.macroLabel, { color: secondaryText }]}>
                Protein
              </Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroIcon, { backgroundColor: Colors.iconBackground.dinner }]}>
                <Text style={styles.macroEmoji}>🥑</Text>
              </View>
              <Text style={[styles.macroValue, { color: textColor }]}>
                {totalFat}g
              </Text>
              <Text style={[styles.macroLabel, { color: secondaryText }]}>
                Fat
              </Text>
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
  calorieCircle: {
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  circleOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  circleInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: "center",
    alignItems: "center",
  },
  remainingCalories: {
    fontSize: Typography.sizes["4xl"],
    fontWeight: Typography.weights.bold,
  },
  remainingText: {
    fontSize: Typography.sizes.sm,
    marginTop: 4,
  },
  calorieInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  calorieInfoItem: {
    alignItems: "center",
  },
  calorieInfoValue: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.semibold,
  },
  calorieInfoLabel: {
    fontSize: Typography.sizes.sm,
    marginTop: 4,
  },
  calorieInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.nutrientBar.light,
  },
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.nutrientBar.light,
  },
  macroItem: {
    alignItems: "center",
  },
  macroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  macroEmoji: {
    fontSize: Typography.sizes.lg,
  },
  macroValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  macroLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
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
    borderTopColor: Colors.nutrientBar.light,
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
