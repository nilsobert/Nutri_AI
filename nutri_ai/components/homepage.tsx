import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
  NativeSyntheticEvent,
  NativeScrollEvent,
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
import { useUser } from "../context/UserContext";
import { useMeals } from "../context/MealContext";
import { useNetwork } from "../context/NetworkContext";
import { DAILY_CALORIE_GOAL } from "../constants/values";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
  TextStyles,
} from "../constants/theme";
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

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

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

interface DayItemProps {
  date: Date;
  index: number;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  gap: number;
  isLast: boolean;
  isDark: boolean;
  textColor: string;
  secondaryText: string;
  scrollX: SharedValue<number>;
  snapOffset: number;
  dynamicPadding: number;
}

const DayItem: React.FC<DayItemProps> = ({
  date,
  index,
  currentDate,
  setCurrentDate,
  gap,
  isLast,
  isDark,
  textColor,
  secondaryText,
  scrollX,
  snapOffset,
  dynamicPadding,
}) => {
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const isSelected = isSameDay(date, currentDate);
  const isToday = isSameDay(date, new Date());

  const animatedStyle = useAnimatedStyle(() => {
    // snapOffset is the scroll position where this item is the first visible one
    // When scrollX == snapOffset, the item is at dynamicPadding
    // We want to calculate the item's visual position relative to the viewport left edge
    // itemVisualX = dynamicPadding + (snapOffset - scrollX.value)
    // Wait, snapOffset is the offset of the item start.
    // itemAbsoluteX = snapOffset + dynamicPadding? No.
    // snapOffsets in parent are calculated as `currentX`.
    // `currentX` starts at 0.
    // So `snapOffset` is the position of the item relative to content start (ignoring padding).
    // But content has paddingLeft = dynamicPadding.
    // So absolute position of item is `snapOffset + dynamicPadding`.
    // Visual position `visualX = (snapOffset + dynamicPadding) - scrollX.value`.

    const visualX = snapOffset + dynamicPadding - scrollX.value;

    // Fade out items that are to the left of the centered list start
    // dynamicPadding: start of the list
    // dynamicPadding - 20: fully transparent
    const opacity = interpolate(
      visualX,
      [dynamicPadding - 20, dynamicPadding],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
    };
  });

  return (
    <AnimatedTouchableOpacity
      style={[styles.dateItem, !isLast && { marginRight: gap }, animatedStyle]}
      onPress={() => setCurrentDate(date)}
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
        {date.toLocaleDateString("en-US", { weekday: "short" })[0]}
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
          {date.getDate()}
        </Text>
      </View>
    </AnimatedTouchableOpacity>
  );
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
  const { isConnected } = useNetwork();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const scrollX = useSharedValue(0);
  const { width: screenWidth } = useWindowDimensions();

  // Calculate content width for the slider
  // Screen padding: Spacing.xl (20) * 2 = 40
  // Card padding: Spacing.lg (16) * 2 = 32
  // Total deduction: 72
  const contentWidth = screenWidth - Spacing.xl * 2 - Spacing.lg * 2;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const toggleExpand = () => {
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
    (sum, meal) => sum + meal.getNutritionInfo().getCalories(),
    0,
  );

  const renderMealDetails = (meal: MealEntry) => {
    const nutrition = meal.getNutritionInfo();
    const quality = meal.getMealQuality();

    return (
      <View style={{ width: contentWidth }}>
        {meals.length > 1 && (
          <View style={styles.slideHeader}>
            <Text
              style={[styles.slideTitle, { color: textColor }]}
              numberOfLines={1}
            >
              {meal.getTranscription() || "Meal Item"}
            </Text>
            <Text style={[styles.slideCalories, { color: secondaryText }]}>
              {nutrition.getCalories()} kcal
            </Text>
          </View>
        )}

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
      </View>
    );
  };

  return (
    <Animated.View
      style={[styles.mealCard, { backgroundColor: cardBg }]}
      layout={LinearTransition}
    >
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
                : meals[0]?.getTranscription() || "No description"}
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
                  <View key={meal.getId() || index}>
                    {renderMealDetails(meal)}
                  </View>
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
                opacity: isConnected ? 1 : 0.5,
              },
            ]}
            onPress={() => {
              if (isConnected) {
                router.push({
                  pathname: "/add-meal",
                  params: { date: currentDate.toISOString() },
                });
              }
            }}
            activeOpacity={isConnected ? 0.7 : 1}
            disabled={!isConnected}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={isConnected ? Colors.primary : "#999"}
            />
            <Text
              style={[
                styles.addMealButtonText,
                { color: isConnected ? Colors.primary : "#999" },
              ]}
            >
              {isConnected ? "Add Item" : "Offline"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const IOSStyleHomeScreen: React.FC = () => {
  const { isConnected } = useNetwork();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [currentDate, setCurrentDate] = useState(new Date());
  const scrollViewRef = React.useRef<Animated.ScrollView>(null);
  const { profileImage } = useUser();
  const { meals: allMeals } = useMeals();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const dateScrollX = useSharedValue(0);
  const dateScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      dateScrollX.value = event.contentOffset.x;
    },
  });

  const dateStripAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 100],
      [60, 0],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollY.value,
      [0, 80],
      [1, 0],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -20],
      Extrapolation.CLAMP,
    );

    return {
      height,
      opacity,
      transform: [{ translateY }],
      overflow: "hidden",
    };
  });

  // Layout calculations for date strip
  const itemWidth = 32;
  const normalGap = 14;
  const weekGap = 40;
  const itemFullWidth = itemWidth + normalGap;
  const basePadding = Spacing.xl;

  // Calculate dynamic padding to ensure integer number of items are visible
  const availableWidth = screenWidth - basePadding * 2;
  // Force 7 items to be visible as requested
  const numVisibleItems = 7;
  const totalItemWidth = numVisibleItems * itemFullWidth - normalGap;
  const remainingSpace = availableWidth - totalItemWidth;
  // Ensure padding doesn't go below basePadding if screen is too small (though 7 items fit on 375px+)
  const dynamicPadding = Math.max(
    basePadding,
    basePadding + remainingSpace / 2,
  );

  // Generate 30 days of dates ending with today
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i)); // 29 days ago to today
    return date;
  });

  // Calculate snap offsets and gaps
  const { snapOffsets, gaps } = React.useMemo(() => {
    const offsets: number[] = [];
    const gaps: number[] = [];
    let currentX = 0; // Start at 0 relative to content (padding handled by container style)

    days.forEach((_, index) => {
      // Snap to the start of each item
      // Note: contentContainerStyle adds paddingLeft, so the first item starts at dynamicPadding
      // But snapToOffsets is relative to scroll offset 0.
      // If scroll offset is 0, the view starts at dynamicPadding.
      // We want to snap such that the item is at dynamicPadding?
      // Yes, if we snap to 0, item 0 is at dynamicPadding.
      // If we snap to X, the view starts at X.
      // We want item i to be at dynamicPadding.
      // Item i position = dynamicPadding + sum(widths + gaps before i).
      // So we want scrollOffset = sum(widths + gaps before i).

      offsets.push(currentX);

      const isLast = index === days.length - 1;
      // Add larger gap every 7 days (counting from end)
      // Index 29 is last. 29-22=7. So after 22.
      const isWeekBreak = (days.length - 1 - index) % 7 === 0 && !isLast;
      const currentGap = isWeekBreak ? weekGap : normalGap;

      gaps.push(currentGap);
      currentX += itemWidth + currentGap;
    });
    return { snapOffsets: offsets, gaps };
  }, [days, itemWidth, normalGap, weekGap]);

  React.useEffect(() => {
    // Scroll to end (today) on mount
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const scrollToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const meals: MealEntry[] = allMeals.filter((meal) => {
    const mealDate = new Date(meal.getTimestamp() * 1000);
    return isSameDay(mealDate, currentDate);
  });

  // Group meals by category
  const groupedMeals = React.useMemo(() => {
    const groups = new Map<MealCategory, MealEntry[]>();
    meals.forEach((meal) => {
      const cat = meal.getCategory();
      if (!groups.has(cat)) {
        groups.set(cat, []);
      }
      groups.get(cat)?.push(meal);
    });
    return groups;
  }, [meals]);

  // Order of categories
  const categoryOrder = [
    MealCategory.Breakfast,
    MealCategory.Lunch,
    MealCategory.Dinner,
    MealCategory.Snack,
    MealCategory.Other,
  ];

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

  const calorieGoal = DAILY_CALORIE_GOAL;
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
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
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
                <Text
                  style={[styles.ringsOverlayLabel, { color: secondaryText }]}
                >
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
                <Text
                  style={[
                    styles.legendLabel,
                    { color: Colors.secondary.carbs },
                  ]}
                >
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
                <Text
                  style={[
                    styles.legendLabel,
                    { color: Colors.secondary.protein },
                  ]}
                >
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
                <Text
                  style={[styles.legendLabel, { color: Colors.secondary.fat }]}
                >
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
            {isSameDay(currentDate, new Date()) ? "Today's Meals" : "Meals"}
          </Text>
          {meals.length > 0 ? (
            categoryOrder.map((category) => {
              const categoryMeals = groupedMeals.get(category);
              if (!categoryMeals || categoryMeals.length === 0) return null;
              return (
                <MealCard
                  key={category}
                  category={category}
                  meals={categoryMeals}
                  isDark={isDark}
                  currentDate={currentDate}
                />
              );
            })
          ) : (
            <Text style={{ color: secondaryText, textAlign: "center" }}>
              No meals recorded for this day
            </Text>
          )}
        </View>
      </Animated.ScrollView>

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
              {currentDate
                .toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
                .toUpperCase()}
            </Text>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              {isSameDay(currentDate, new Date())
                ? "Today"
                : currentDate.toLocaleDateString("en-US", { weekday: "long" })}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            {!isSameDay(currentDate, new Date()) && (
              <TouchableOpacity
                style={[styles.todayButton, { backgroundColor: cardBg }]}
                onPress={scrollToToday}
              >
                <Text
                  style={[styles.todayButtonText, { color: Colors.primary }]}
                >
                  Today
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: cardBg }]}
              onPress={() => router.push("/screens/calendar-screen")}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: cardBg }]}
              onPress={() => router.push("/profile")}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <Ionicons name="person" size={20} color={Colors.primary} />
              )}
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? "#34C759" : "#FF3B30" },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Strip */}
        <Animated.View
          style={[styles.dateStripContainer, dateStripAnimatedStyle]}
        >
          <Animated.ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={dateScrollHandler}
            scrollEventThrottle={16}
            contentContainerStyle={[
              styles.dateStripContent,
              { paddingHorizontal: dynamicPadding },
            ]}
            style={styles.dateStrip}
            snapToOffsets={snapOffsets}
            decelerationRate="fast"
          >
            {days.map((day, index) => (
              <DayItem
                key={index}
                date={day}
                index={index}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                gap={gaps[index]}
                isLast={index === days.length - 1}
                isDark={isDark}
                textColor={textColor}
                secondaryText={secondaryText}
                scrollX={dateScrollX}
                snapOffset={snapOffsets[index]}
                dynamicPadding={dynamicPadding}
              />
            ))}
          </Animated.ScrollView>
        </Animated.View>
      </BlurView>

      {/* Floating Action Button */}
      <AnimatedTouchableOpacity
        style={[styles.fab, !isConnected && { opacity: 0.5 }]}
        onPress={() => {
          if (isConnected) {
            router.push({
              pathname: "/add-meal",
              params: { date: currentDate.toISOString() },
            });
          }
        }}
        activeOpacity={isConnected ? 0.8 : 1}
        entering={FadeIn}
        exiting={FadeOut}
        disabled={!isConnected}
      >
        <Ionicons name="add" size={28} color="white" />
      </AnimatedTouchableOpacity>
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
    // overflow: "hidden", // Removed to allow dot to overflow if needed, but dot is inside
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "white",
  },
  todayButton: {
    height: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.small,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dateStripContainer: {
    position: "relative",
  },
  dateStrip: {
    flexGrow: 0,
  },
  dateStripContent: {
    // paddingHorizontal is handled dynamically
  },
  dateItem: {
    alignItems: "center",
    gap: 6,
    width: 32, // Fixed width for alignment
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
});

export default IOSStyleHomeScreen;
