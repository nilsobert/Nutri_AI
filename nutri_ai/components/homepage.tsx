import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  Platform,
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
  FlatList,
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
import { MealImage } from "./MealImage";


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
    const visualX = snapOffset + dynamicPadding - scrollX.value;

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
  const { isServerReachable } = useNetwork();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const scrollX = useSharedValue(0);
  const { width: screenWidth } = useWindowDimensions();

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

  const mealWithImage = meals.find((m) => m.image);

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
              {quality.calorieDensity ? quality.calorieDensity.toFixed(1) : "0.0"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
            mealWithImage && { overflow: "hidden" },
          ]}
        >
          {mealWithImage ? (
            <MealImage
              uri={mealWithImage.image}
              style={styles.mealIconImage}
              showPlaceholder={false}
            />
          ) : (
            <Ionicons
              name={getMealIcon(category) as any}
              size={24}
              color={Colors.primary}
            />
          )}
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
                  <View key={meal.id || index}>
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
    </Animated.View>
  );
};

interface DayContentProps {
  date: Date;
  isDark: boolean;
  insetsTop: number;
  screenWidth: number;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const DayContent = React.memo(function DayContent({
  date,
  isDark,
  insetsTop,
  screenWidth,
  onScroll,
}: DayContentProps) {
  const { meals: allMeals } = useMeals();
  const { goals } = useUser();

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const meals = useMemo(() => {
    return allMeals.filter((meal) => {
      const mealDate = new Date(meal.timestamp * 1000);
      return isSameDay(mealDate, date);
    });
  }, [allMeals, date]);

  const groupedMeals = useMemo(() => {
    const groups = new Map<MealCategory, MealEntry[]>();
    meals.forEach((meal) => {
      const cat = meal.category;
      if (!groups.has(cat)) {
        groups.set(cat, []);
      }
      groups.get(cat)?.push(meal);
    });
    return groups;
  }, [meals]);

  const categoryOrder = [
    MealCategory.Breakfast,
    MealCategory.Lunch,
    MealCategory.Dinner,
    MealCategory.Snack,
    MealCategory.Other,
  ];

  const totalCalories = meals.reduce(
    (sum, meal) => sum + meal.nutritionInfo.calories,
    0,
  );
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.nutritionInfo.carbs, 0);
  const totalProtein = meals.reduce(
    (sum, meal) => sum + meal.nutritionInfo.protein,
    0,
  );
  const totalFat = meals.reduce((sum, meal) => sum + meal.nutritionInfo.fat, 0);

  const calorieGoal = goals?.calories || DAILY_CALORIE_GOAL;
  const carbsGoal = goals?.carbs || 300;
  const proteinGoal = goals?.protein || 150;
  const fatGoal = goals?.fat || 80;

  const remainingCalories = calorieGoal - totalCalories;

  const cardBg = isDark ? Colors.cardBackground.dark : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";

  return (
    <Animated.ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: 160 + insetsTop, width: screenWidth },
      ]}
    >
      <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
        <Text style={[styles.summaryTitle, { color: textColor }]}>Daily Summary</Text>
        <View style={styles.summaryContent}>
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
              <Text
                style={[
                  styles.ringsOverlayValue,
                  { color: remainingCalories < 0 ? Colors.error : textColor },
                ]}
              >
                {Math.abs(remainingCalories)}
              </Text>
              <Text
                style={[
                  styles.ringsOverlayLabel,
                  { color: remainingCalories < 0 ? Colors.error : secondaryText },
                ]}
              >
                {remainingCalories < 0 ? "kcal over" : "kcal left"}
              </Text>
            </View>
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <Text style={[styles.legendLabel, { color: Colors.primary }]}>Calories</Text>
              <View style={styles.legendValues}>
                <Text
                  style={[
                    styles.legendValue,
                    { color: totalCalories > calorieGoal ? Colors.error : textColor },
                  ]}
                >
                  {totalCalories}
                </Text>
                <Text style={[styles.legendGoal, { color: secondaryText }]}>/ {calorieGoal} kcal</Text>
              </View>
            </View>

            <View style={styles.legendItem}>
              <Text style={[styles.legendLabel, { color: Colors.secondary.carbs }]}>Carbs</Text>
              <View style={styles.legendValues}>
                <Text
                  style={[
                    styles.legendValue,
                    { color: totalCarbs > carbsGoal ? Colors.error : textColor },
                  ]}
                >
                  {totalCarbs}g
                </Text>
                <Text style={[styles.legendGoal, { color: secondaryText }]}>/ {carbsGoal}g</Text>
              </View>
            </View>

            <View style={styles.legendItem}>
              <Text style={[styles.legendLabel, { color: Colors.secondary.protein }]}>Protein</Text>
              <View style={styles.legendValues}>
                <Text
                  style={[
                    styles.legendValue,
                    { color: totalProtein > proteinGoal ? Colors.error : textColor },
                  ]}
                >
                  {totalProtein}g
                </Text>
                <Text style={[styles.legendGoal, { color: secondaryText }]}>/ {proteinGoal}g</Text>
              </View>
            </View>

            <View style={styles.legendItem}>
              <Text style={[styles.legendLabel, { color: Colors.secondary.fat }]}>Fat</Text>
              <View style={styles.legendValues}>
                <Text
                  style={[
                    styles.legendValue,
                    { color: totalFat > fatGoal ? Colors.error : textColor },
                  ]}
                >
                  {totalFat}g
                </Text>
                <Text style={[styles.legendGoal, { color: secondaryText }]}>/ {fatGoal}g</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.mealsSection}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          {isSameDay(date, new Date()) ? "Today's Meals" : "Meals"}
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
                currentDate={date}
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
  );
});

const IOSStyleHomeScreen: React.FC = () => {
  const { isServerReachable } = useNetwork();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStripRef = useRef<Animated.ScrollView>(null);
  const pagerRef = useRef<FlatList>(null);
  const { profileImage } = useUser();

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
    const height = interpolate(scrollY.value, [0, 100], [60, 0], Extrapolation.CLAMP);
    const opacity = interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [0, 100], [0, -20], Extrapolation.CLAMP);

    return {
      height,
      opacity,
      transform: [{ translateY }],
      overflow: "hidden",
    };
  });

  const itemWidth = 32;
  const normalGap = 14;
  const weekGap = 40;
  const itemFullWidth = itemWidth + normalGap;
  const basePadding = Spacing.xl;

  const availableWidth = screenWidth - basePadding * 2;
  const numVisibleItems = 7;
  const totalItemWidth = numVisibleItems * itemFullWidth - normalGap;
  const remainingSpace = availableWidth - totalItemWidth;
  const dynamicPadding = Math.max(basePadding, basePadding + remainingSpace / 2);

  const days = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date;
    });
  }, []);

  const { snapOffsets, gaps } = useMemo(() => {
    const offsets: number[] = [];
    const gaps: number[] = [];
    let currentX = 0;

    days.forEach((_, index) => {
      offsets.push(currentX);
      const isLast = index === days.length - 1;
      const isWeekBreak = (days.length - 1 - index) % 7 === 0 && !isLast;
      const currentGap = isWeekBreak ? weekGap : normalGap;
      gaps.push(currentGap);
      currentX += itemWidth + currentGap;
    });
    return { snapOffsets: offsets, gaps };
  }, [days]);

  const todayIndex = days.length - 1;

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
    const index = days.findIndex((d) => isSameDay(d, date));
    if (index !== -1) {
      pagerRef.current?.scrollToIndex({ index, animated: true });
      dateStripRef.current?.scrollTo({ x: snapOffsets[index], animated: true });
    }
  }, [days, snapOffsets]);

  const scrollToToday = () => {
    handleDateChange(new Date());
  };

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    const newDate = days[index];
    if (newDate && !isSameDay(newDate, currentDate)) {
      setCurrentDate(newDate);
      dateStripRef.current?.scrollTo({ x: snapOffsets[index], animated: true });
    }
  };



  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const cardBg = isDark ? Colors.cardBackground.dark : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <FlatList
        ref={pagerRef}
        data={days}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        keyExtractor={(_, index) => index.toString()}
        initialScrollIndex={todayIndex}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        onScrollToIndexFailed={({ index }) => {
          requestAnimationFrame(() => {
            pagerRef.current?.scrollToIndex({ index, animated: false });
          });
        }}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        renderItem={({ item }) => (
          <DayContent
            date={item}
            isDark={isDark}
            insetsTop={insets.top}
            screenWidth={screenWidth}
            onScroll={scrollHandler}
          />
        )}
      />

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
                <Text style={[styles.todayButtonText, { color: Colors.primary }]}>Today</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: cardBg }]}
              onPress={() => router.push("/screens/calendar-screen")}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: cardBg }]}
              onPress={() => router.push("/profile")}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person" size={20} color={Colors.primary} />
              )}
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isServerReachable ? "#34C759" : "#FF3B30" },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={[styles.dateStripContainer, dateStripAnimatedStyle]}>
          <Animated.ScrollView
            ref={dateStripRef}
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
                setCurrentDate={handleDateChange}
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

      <AnimatedTouchableOpacity
        style={[styles.fab, !isServerReachable && { opacity: 0.5 }]}
        onPress={() => {
          if (isServerReachable) {
            router.push({
              pathname: "/add-meal",
              params: { date: currentDate.toISOString() },
            });
          }
        }}
        activeOpacity={isServerReachable ? 0.8 : 1}
        entering={FadeIn}
        exiting={FadeOut}
        disabled={!isServerReachable}
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
  },
  dateItem: {
    alignItems: "center",
    gap: 6,
    width: 32,
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
  mealIconImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
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

export default IOSStyleHomeScreen;
