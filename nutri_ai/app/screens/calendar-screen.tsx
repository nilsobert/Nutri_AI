import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  useColorScheme,
  View,
  useWindowDimensions,
  Image,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useAnimatedScrollHandler,
  interpolate,
  interpolateColor,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useMeals } from "../../context/MealContext";
import { useNetwork } from "../../context/NetworkContext";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { MealCategory, MealEntry } from "../../types/mealEntry";
import { MealImage } from "../../components/MealImage";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Helper Components from Homepage ---

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

interface PaginationDotProps {
  index: number;
  scrollX: SharedValue<number>;
  contentWidth: number;
  isDark: boolean;
}

const PaginationDot: React.FC<PaginationDotProps> = ({
  index,
  scrollX,
  contentWidth,
  isDark,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * contentWidth,
      index * contentWidth,
      (index + 1) * contentWidth,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [6, 16, 6],
      Extrapolation.CLAMP,
    );

    const backgroundColor = interpolateColor(scrollX.value, inputRange, [
      isDark ? "#444" : "#ddd",
      Colors.primary,
      isDark ? "#444" : "#ddd",
    ]);

    return {
      width,
      backgroundColor,
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

interface MealCardProps {
  category: MealCategory;
  meals: MealEntry[];
  isDark: boolean;
  currentDate: Date;
}

const MealCard: React.FC<MealCardProps> = ({
  category,
  meals,
  isDark,
  currentDate,
}) => {
  const { isServerReachable } = useNetwork();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const scrollX = useSharedValue(0);
  const { width: screenWidth } = useWindowDimensions();

  // Calculate content width for the slider
  const contentWidth = screenWidth - Spacing.xl * 2 - Spacing.lg * 2;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
    rotation.value = withTiming(expanded ? 0 : 180);
  };

  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const getQualityColor = (score: number) => {
    if (score >= 7) return "#34C759"; // Green
    if (score >= 4) return "#FF9500"; // Orange
    return "#FF3B30"; // Red
  };

  const getMealIcon = (cat: MealCategory) => {
    switch (cat) {
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

  const totalCalories = meals.reduce(
    (sum, meal) => sum + meal.nutritionInfo.calories,
    0,
  );

  const renderMealDetails = (meal: MealEntry) => {
    const nutrition = meal.nutritionInfo;
    const quality = meal.mealQuality;

    return (
      <TouchableOpacity
        style={{ width: contentWidth }}
        activeOpacity={0.9}
        onPress={() => {
          router.push({
            pathname: "/meal-detail",
            params: { id: meal.id },
          });
        }}
      >
        {meals.length > 1 && (
          <View style={styles.slideHeader}>
            <Text
              style={[styles.slideTitle, { color: textColor }]}
              numberOfLines={1}
            >
              {meal.name || meal.transcription || "Meal Item"}
            </Text>
            <Text style={[styles.slideCalories, { color: secondaryText }]}>
              {nutrition.calories} kcal
            </Text>
          </View>
        )}

        {/* Meal Image */}
        {meal.image && (
          <View style={styles.mealImageContainer}>
            <MealImage uri={meal.image} style={styles.mealImage} />
          </View>
        )}

        <View style={styles.nutrientRow}>
          <NutrientPill
            label="Carbs"
            value={`${nutrition.carbs}g`}
            color={Colors.secondary.carbs}
            isDark={isDark}
          />
          <NutrientPill
            label="Protein"
            value={`${nutrition.protein}g`}
            color={Colors.secondary.protein}
            isDark={isDark}
          />
          <NutrientPill
            label="Fat"
            value={`${nutrition.fat}g`}
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
                  backgroundColor: getQualityColor(quality.mealQualityScore),
                },
              ]}
            >
              <Text style={styles.qualityScore}>
                {quality.mealQualityScore}
              </Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: secondaryText }]}>
              Goal Fit
            </Text>
            <Text style={[styles.statValue, { color: textColor }]}>
              {quality.goalFitPercentage}%
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: secondaryText }]}>
              Density
            </Text>
            <Text style={[styles.statValue, { color: textColor }]}>
              {quality.calorieDensity
                ? quality.calorieDensity.toFixed(1)
                : "0.0"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.mealCard, { backgroundColor: cardBg }]}>
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        style={styles.mealCardHeader}
      >
        <View
          style={[
            styles.mealIcon,
            { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
          ]}
        >
          <Ionicons
            name={getMealIcon(category) as any}
            size={24}
            color={Colors.primary}
          />
        </View>

        <View style={styles.mealHeaderInfo}>
          <View style={styles.mealTitleRow}>
            <Text style={[styles.mealName, { color: textColor }]}>
              {category}
            </Text>
            <Text style={[styles.mealCalories, { color: textColor }]}>
              {totalCalories}{" "}
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
              {meals.length > 1
                ? `${meals.length} items`
                : meals[0]?.name || meals[0]?.transcription || "No description"}
            </Text>
            <Animated.View style={chevronStyle}>
              <Ionicons name="chevron-down" size={16} color={secondaryText} />
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View
          style={styles.mealDetails}
          entering={FadeIn}
          exiting={FadeOut}
        >
          {meals.length > 1 ? (
            <View>
              <Animated.ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
              >
                {meals.map((meal, index) => (
                  <View key={meal.id || index}>{renderMealDetails(meal)}</View>
                ))}
              </Animated.ScrollView>
              <View style={styles.dotsContainer}>
                {meals.map((_, i) => (
                  <PaginationDot
                    key={i}
                    index={i}
                    scrollX={scrollX}
                    contentWidth={contentWidth}
                    isDark={isDark}
                  />
                ))}
              </View>
            </View>
          ) : (
            renderMealDetails(meals[0])
          )}

          <TouchableOpacity
            style={[
              styles.addMealButton,
              {
                backgroundColor: isDark ? "#333" : "#f5f5f5",
                opacity: isServerReachable ? 1 : 0.5,
              },
            ]}
            onPress={() => {
              if (isServerReachable) {
                router.push({
                  pathname: "/add-meal",
                  params: { date: currentDate.toISOString() },
                });
              }
            }}
            activeOpacity={isServerReachable ? 0.7 : 1}
            disabled={!isServerReachable}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={isServerReachable ? Colors.primary : "#999"}
            />
            <Text
              style={[
                styles.addMealButtonText,
                { color: isServerReachable ? Colors.primary : "#999" },
              ]}
            >
              {isServerReachable ? "Add Item" : "Offline"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

// --- Main Calendar Component ---

export default function CalendarScreen() {
  const router = useRouter();
  const { meals } = useMeals();
  const today = new Date();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";
  const borderColor = isDark ? "#333" : "rgba(0,0,0,0.1)";
  const segmentBg = isDark
    ? "rgba(118, 118, 128, 0.24)"
    : "rgba(118, 118, 128, 0.12)";
  const segmentSelectedBg = isDark ? "#636366" : "#fff";
  const segmentTextColor = isDark ? "#fff" : "#000";

  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0],
  );

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Calendar calculations
  const getMonthMatrix = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const firstDayIndexMon = firstDay === 0 ? 6 : firstDay - 1;
    const days = new Date(year, month + 1, 0).getDate();
    const matrix: (number | null)[][] = [];
    let row: (number | null)[] = [];
    for (let i = 0; i < firstDayIndexMon; i++) row.push(null);
    for (let d = 1; d <= days; d++) {
      row.push(d);
      if (row.length === 7) {
        matrix.push(row);
        row = [];
      }
    }
    if (row.length) while (row.length < 7) row.push(null);
    if (row.length) matrix.push(row);
    return matrix;
  };
  const monthMatrix = getMonthMatrix();
  const yearGrid = Array.from({ length: 12 }, (_, i) => i);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  const prevYear = () => setYear((y) => y - 1);
  const nextYear = () => setYear((y) => y + 1);

  const isSameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const handleDayPress = (day: number) => {
    const dateObj = new Date(year, month, day);
    // Adjust for timezone offset to get correct local date string
    const offset = dateObj.getTimezoneOffset();
    const localDate = new Date(dateObj.getTime() - offset * 60 * 1000);
    const dateStr = localDate.toISOString().split("T")[0];
    setSelectedDate(dateStr);
  };

  // Group meals by date and category
  const mealsByDate = useMemo(() => {
    const map: Record<string, MealEntry[]> = {};
    meals.forEach((meal) => {
      const date = new Date(meal.timestamp * 1000);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60 * 1000);
      const dateStr = localDate.toISOString().split("T")[0];
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(meal);
    });
    return map;
  }, [meals]);

  const selectedMeals = mealsByDate[selectedDate] || [];

  const groupedMeals = useMemo(() => {
    const groups = new Map<MealCategory, MealEntry[]>();
    selectedMeals.forEach((meal) => {
      const cat = meal.category;
      if (!groups.has(cat)) {
        groups.set(cat, []);
      }
      groups.get(cat)?.push(meal);
    });
    return groups;
  }, [selectedMeals]);

  const categoryOrder = [
    MealCategory.Breakfast,
    MealCategory.Lunch,
    MealCategory.Dinner,
    MealCategory.Snack,
    MealCategory.Other,
  ];

  const selectedDateObj = new Date(selectedDate);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 140 + insets.top },
        ]}
      >
        {/* Calendar Card */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {/* Header Controls */}
          <View style={styles.calendarHeader}>
            {viewMode === "month" ? (
              <>
                <TouchableOpacity
                  onPress={prevMonth}
                  style={styles.arrowButton}
                >
                  <Ionicons
                    name="chevron-back"
                    size={24}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
                <Text style={[styles.calendarTitle, { color: textColor }]}>
                  {monthNames[month]} {year}
                </Text>
                <TouchableOpacity
                  onPress={nextMonth}
                  style={styles.arrowButton}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={prevYear} style={styles.arrowButton}>
                  <Ionicons
                    name="chevron-back"
                    size={24}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
                <Text style={[styles.calendarTitle, { color: textColor }]}>
                  {year}
                </Text>
                <TouchableOpacity onPress={nextYear} style={styles.arrowButton}>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* MONTH VIEW */}
          {viewMode === "month" && (
            <View>
              <View style={styles.weekLabelsRow}>
                {["M", "T", "W", "T", "F", "S", "S"].map((ini, i) => (
                  <Text
                    key={i}
                    style={[styles.weekLabel, { color: secondaryText }]}
                  >
                    {ini}
                  </Text>
                ))}
              </View>
              {monthMatrix.map((row, rIdx) => (
                <View key={rIdx} style={styles.gridRow}>
                  {row.map((day, cIdx) => {
                    const isToday =
                      day !== null &&
                      isSameDate(new Date(year, month, day), new Date());
                    const dayObj = day ? new Date(year, month, day) : null;
                    let dayStr = "";
                    if (dayObj) {
                      const offset = dayObj.getTimezoneOffset();
                      const localDate = new Date(
                        dayObj.getTime() - offset * 60 * 1000,
                      );
                      dayStr = localDate.toISOString().split("T")[0];
                    }

                    const isSelected = dayStr === selectedDate;
                    const hasMeal = dayStr && mealsByDate[dayStr]?.length > 0;

                    return (
                      <View key={cIdx} style={styles.gridCell}>
                        {day ? (
                          <TouchableOpacity
                            onPress={() => handleDayPress(day)}
                            style={[
                              styles.dayCircle,
                              isSelected && {
                                backgroundColor: Colors.primary,
                                shadowColor: Colors.primary,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                              },
                              isToday &&
                                !isSelected && {
                                  borderWidth: 1,
                                  borderColor: Colors.primary,
                                },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayText,
                                {
                                  color: isSelected
                                    ? "white"
                                    : isToday
                                      ? Colors.primary
                                      : textColor,
                                  fontWeight:
                                    isSelected || isToday ? "600" : "400",
                                },
                              ]}
                            >
                              {day}
                            </Text>
                            {hasMeal && !isSelected && (
                              <View
                                style={[
                                  styles.mealDot,
                                  { backgroundColor: Colors.primary },
                                ]}
                              />
                            )}
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.dayEmpty} />
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          {/* YEAR VIEW */}
          {viewMode === "year" && (
            <View style={styles.yearGrid}>
              {yearGrid.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.yearCell,
                    {
                      backgroundColor:
                        m === month && year === today.getFullYear()
                          ? isDark
                            ? "#333"
                            : "#f0f0f0"
                          : "transparent",
                    },
                  ]}
                  onPress={() => {
                    setMonth(m);
                    setViewMode("month");
                  }}
                >
                  <Text
                    style={[
                      styles.yearMonthText,
                      {
                        color:
                          m === month && year === today.getFullYear()
                            ? Colors.primary
                            : textColor,
                      },
                    ]}
                  >
                    {monthNames[m].substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Selected Date Title */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Meals for{" "}
            {selectedDateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Meal List */}
        <View style={styles.mealList}>
          {selectedMeals.length > 0 ? (
            categoryOrder.map((category) => {
              const categoryMeals = groupedMeals.get(category);
              if (!categoryMeals || categoryMeals.length === 0) return null;
              return (
                <MealCard
                  key={category}
                  category={category}
                  meals={categoryMeals}
                  isDark={isDark}
                  currentDate={selectedDateObj}
                />
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="restaurant-outline"
                size={48}
                color={isDark ? "#333" : "#ddd"}
              />
              <Text style={[styles.emptyStateText, { color: secondaryText }]}>
                No meals recorded for this day.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Header with Title */}
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.md,
            borderBottomColor: borderColor,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View>
            <Text style={[styles.headerDate, { color: secondaryText }]}>
              {viewMode === "month"
                ? `${monthNames[month]} ${year}`.toUpperCase()
                : `${year}`.toUpperCase()}
            </Text>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Calendar
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.doneButton]}
            onPress={() => router.back()}
          >
            <Text style={[styles.doneButtonText, { color: Colors.primary }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
        {/* Segmented Control */}
        <View style={[styles.segmentedControl, { backgroundColor: segmentBg }]}>
          {(["month", "year"] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.segment,
                viewMode === range && {
                  ...styles.segmentSelected,
                  backgroundColor: segmentSelectedBg,
                },
              ]}
              onPress={() => setViewMode(range)}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: segmentTextColor },
                  viewMode === range && styles.segmentTextSelected,
                ]}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 2,
    marginHorizontal: Spacing.xl,
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  segmentSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "500",
  },
  segmentTextSelected: {
    fontWeight: "600",
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  calendarTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: "600",
  },
  arrowButton: {
    padding: 4,
  },
  weekLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 12,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  gridCell: {
    width: `${100 / 7}%`,
    alignItems: "center",
    height: 40,
    justifyContent: "center",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  dayText: {
    fontSize: 15,
  },
  dayEmpty: {
    width: 36,
    height: 36,
  },
  mealDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: "absolute",
    bottom: 4,
  },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingTop: Spacing.sm,
  },
  yearCell: {
    width: "30%",
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    alignItems: "center",
  },
  yearMonthText: {
    fontSize: 16,
    fontWeight: "500",
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: "600",
  },
  mealList: {
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
  },
  // Meal Card Styles (Copied & Adapted)
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
  slideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  slideTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    flex: 1,
    marginRight: Spacing.md,
  },
  slideCalories: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  mealImageContainer: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  mealImage: {
    width: "100%",
    height: "100%",
  },
});
