import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import {
  Svg,
  Rect,
  Defs,
  ClipPath,
  G,
  Line,
  Text as SvgText,
  Polyline,
  LinearGradient,
  Stop,
  Polygon,
} from "react-native-svg";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  SharedValue,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { mockMeals } from "@/mock-data/meals";
import { MS_TO_S } from "@/constants/values";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
  Typography,
} from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_HEIGHT = 250;
const RANGES = ["Day", "Week", "Month", "Year"];
const TREND_METRICS = ["Calories", "Protein", "Carbs", "Fat"];
const GOAL_CALORIES = 2000;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface AnimatedBarProps {
  x: number;
  yBase: number;
  totalHeight: number;
  barWidth: number;
  index: number;
  progress: SharedValue<number>;
}

const AnimatedBar = ({
  x,
  yBase,
  totalHeight,
  barWidth,
  index,
  progress,
}: AnimatedBarProps) => {
  const animatedProps = useAnimatedProps(() => {
    const currentHeight = totalHeight * progress.value;
    return {
      y: yBase - currentHeight,
      height: currentHeight,
    };
  });

  return (
    <ClipPath key={`clip-${index}`} id={`clip-${index}`}>
      <AnimatedRect x={x} width={barWidth} animatedProps={animatedProps} />
    </ClipPath>
  );
};

interface CalorieChartProps {
  data: any[];
  chartMax: number;
  barWidth: number;
  barSpacing: number;
  width: number;
  axisLabels: { text: string; index: number }[];
  progress: SharedValue<number>;
  isDark: boolean;
}

const CalorieChart = ({
  data,
  chartMax,
  barWidth,
  barSpacing,
  width,
  axisLabels,
  progress,
  isDark,
}: CalorieChartProps) => {
  return (
    <View style={{ width }}>
      <Svg width={width} height={CHART_HEIGHT}>
        {/* Vertical Border Line */}
        <Line
          x1={width}
          y1={0}
          x2={width}
          y2={CHART_HEIGHT}
          stroke={isDark ? "#333" : "#e0e0e0"}
          strokeWidth={1}
        />
        
        {/* Stacked Bars */}
        <Defs>
          {data.map((d, i) => {
            if (d.calories === 0) return null;
            const totalHeight = (d.calories / chartMax) * (CHART_HEIGHT - 50);
            // Center the bars within the allocated space (barWidth + barSpacing)
            // x = spacing/2 + i * (barWidth + spacing)
            const x = barSpacing / 2 + i * (barWidth + barSpacing);
            const yBase = CHART_HEIGHT - 30;
            return (
              <AnimatedBar
                key={`clip-${i}`}
                index={i}
                x={x}
                yBase={yBase}
                totalHeight={totalHeight}
                barWidth={barWidth}
                progress={progress}
              />
            );
          })}
        </Defs>
        {data.map((d, i) => {
          if (d.calories === 0) return null;
          const totalHeight = (d.calories / chartMax) * (CHART_HEIGHT - 50);
          const x = barSpacing / 2 + i * (barWidth + barSpacing);
          const yBase = CHART_HEIGHT - 30;
          const carbH = ((d.carbs * 4) / d.calories) * totalHeight;
          const proteinH = ((d.protein * 4) / d.calories) * totalHeight;
          const fatH = ((d.fat * 9) / d.calories) * totalHeight;

          return (
            <G key={`bar-${i}`} clipPath={`url(#clip-${i})`}>
              <Rect
                x={x}
                y={yBase - totalHeight}
                width={barWidth}
                height={totalHeight}
                fill={Colors.grey.light}
              />
              <Rect
                x={x}
                y={yBase - fatH}
                width={barWidth}
                height={fatH}
                fill={Colors.secondary.fat}
              />
              <Rect
                x={x}
                y={yBase - fatH - proteinH}
                width={barWidth}
                height={proteinH}
                fill={Colors.secondary.protein}
              />
              <Rect
                x={x}
                y={yBase - fatH - proteinH - carbH}
                width={barWidth}
                height={carbH}
                fill={Colors.secondary.carbs}
              />
            </G>
          );
        })}

        {/* X-Axis Labels */}
        {axisLabels.map((label, i) => {
          const x =
            barSpacing / 2 +
            label.index * (barWidth + barSpacing) +
            barWidth / 2;
          return (
            <SvgText
              key={`label-${i}`}
              x={x}
              y={CHART_HEIGHT - 10}
              fill={isDark ? "#999" : "#666"}
              fontSize={Typography.sizes.sm}
              textAnchor="middle"
            >
              {label.text}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

const FixedYAxis = ({ chartMax, isDark, width }: { chartMax: number, isDark: boolean, width: number }) => {
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width, zIndex: 10, pointerEvents: 'none' }}>
      <Svg width={width} height={CHART_HEIGHT}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = CHART_HEIGHT - 30 - ratio * (CHART_HEIGHT - 50);
          return (
            <G key={`grid-${ratio}`}>
              <SvgText
                x={width - 8}
                y={y + 4}
                fill={isDark ? "#999" : "#666"}
                fontSize={Typography.sizes.sm}
                textAnchor="end"
              >
                {Math.round(chartMax * ratio)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const BackgroundGrid = ({ width, isDark }: { width: number, isDark: boolean }) => {
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width, zIndex: 0 }}>
      <Svg width={width} height={CHART_HEIGHT}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = CHART_HEIGHT - 30 - ratio * (CHART_HEIGHT - 50);
          return (
            <Line
              key={`grid-${ratio}`}
              x1={0}
              y1={y}
              x2={width}
              y2={y}
              stroke={isDark ? "#444" : Colors.grey.light}
              strokeDasharray="4, 4"
              strokeWidth={1}
            />
          );
        })}
      </Svg>
    </View>
  );
};

function shiftDate(date: Date, range: string, offset: number) {
  const newDate = new Date(date);
  if (range === "Day") {
    newDate.setDate(newDate.getDate() + offset);
  } else if (range === "Week") {
    newDate.setDate(newDate.getDate() + offset * 7);
  } else if (range === "Month") {
    newDate.setDate(newDate.getDate() + offset * 30);
  } else if (range === "Year") {
    newDate.setFullYear(newDate.getFullYear() + offset);
  }
  return newDate;
}

function getAxisLabels(range: string, dataLength: number, startDate: Date) {
  const labels: { text: string; index: number }[] = [];
  const baseDate = new Date(startDate);

  if (range === "Day") {
    // Label every 6 hours: 0, 6, 12, 18
    [0, 6, 12, 18].forEach((h) => {
      if (h < dataLength) labels.push({ text: `${h}:00`, index: h });
    });
  } else if (range === "Week") {
    // Label every day
    for (let i = 0; i < dataLength; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      labels.push({
        text: d.toLocaleDateString("en-US", { weekday: "short" }),
        index: i,
      });
    }
  } else if (range === "Month") {
    // Label every 5 days
    for (let i = 0; i < dataLength; i += 5) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      labels.push({ text: d.getDate().toString(), index: i });
    }
  } else if (range === "Year") {
    // Label every month
    for (let i = 0; i < dataLength; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      labels.push({
        text: d.toLocaleDateString("en-US", { month: "narrow" }),
        index: i,
      });
    }
  }
  return labels;
}

function aggregateData(range: string, startDate?: Date) {
  const baseDate = startDate || new Date();
  let dataPoints = 0;
  if (range === "Day") dataPoints = 24;
  else if (range === "Week") dataPoints = 7;
  else if (range === "Month") dataPoints = 30;
  else if (range === "Year") dataPoints = 12;

  const data = Array(dataPoints)
    .fill(null)
    .map(() => ({
      carbs: 0,
      protein: 0,
      fat: 0,
      calories: 0,
      count: 0,
      quality: 0,
    }));

  mockMeals.forEach((meal) => {
    const mealDate = new Date(meal.getTimestamp() * MS_TO_S);
    let index = -1;

    if (range === "Day") {
      if (
        mealDate.getFullYear() === baseDate.getFullYear() &&
        mealDate.getMonth() === baseDate.getMonth() &&
        mealDate.getDate() === baseDate.getDate()
      ) {
        index = mealDate.getHours();
      }
    } else if (range === "Week") {
      const diff = Math.floor(
        (mealDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diff >= 0 && diff < 7) {
        index = diff;
      }
    } else if (range === "Month") {
      const diff = Math.floor(
        (mealDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diff >= 0 && diff < 30) {
        index = diff;
      }
    } else if (range === "Year") {
      const monthDiff =
        (mealDate.getFullYear() - baseDate.getFullYear()) * 12 +
        (mealDate.getMonth() - baseDate.getMonth());
      if (monthDiff >= 0 && monthDiff < 12) {
        index = monthDiff;
      }
    }

    if (index !== -1 && index < dataPoints) {
      const info = meal.getNutritionInfo();
      data[index].carbs += info.getCarbs();
      data[index].protein += info.getProtein();
      data[index].fat += info.getFat();
      data[index].calories +=
        info.getCarbs() * 4 + info.getProtein() * 4 + info.getFat() * 9;
      data[index].quality += meal.getMealQuality().getMealQualityScore();
      data[index].count += 1;
    }
  });

  return data;
}

function getHistoricalData(count: number, resolution: "day" | "month", endDate?: Date) {
  const data = Array(count)
    .fill(null)
    .map(() => ({
      carbs: 0,
      protein: 0,
      fat: 0,
      calories: 0,
      date: new Date(),
    }));
  const end = endDate || new Date();

  // Initialize dates - going backwards from end date
  for (let i = 0; i < count; i++) {
    const d = new Date(end);
    if (resolution === "day") {
      d.setDate(d.getDate() - (count - 1 - i));
    } else {
      d.setMonth(d.getMonth() - (count - 1 - i));
      d.setDate(1);
    }
    data[i].date = d;
  }

  mockMeals.forEach((meal) => {
    const mDate = new Date(meal.getTimestamp() * MS_TO_S);
    let index = -1;

    if (resolution === "day") {
      const diffTime = end.getTime() - mDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < count) {
        index = count - 1 - diffDays;
      }
    } else {
      const monthDiff =
        (end.getFullYear() - mDate.getFullYear()) * 12 +
        (end.getMonth() - mDate.getMonth());
      if (monthDiff >= 0 && monthDiff < count) {
        index = count - 1 - monthDiff;
      }
    }

    if (index >= 0 && index < count) {
      const info = meal.getNutritionInfo();
      data[index].carbs += info.getCarbs();
      data[index].protein += info.getProtein();
      data[index].fat += info.getFat();
      data[index].calories +=
        info.getCarbs() * 4 + info.getProtein() * 4 + info.getFat() * 9;
    }
  });

  return data;
}

function calculateStreak() {
  const now = new Date();
  let streak = 0;
  let currentDay = new Date(now);

  for (let i = 0; i < 365; i++) {
    const hasMeal = mockMeals.some((m) => {
      const d = new Date(m.getTimestamp() * MS_TO_S);
      return (
        d.getDate() === currentDay.getDate() &&
        d.getMonth() === currentDay.getMonth() &&
        d.getFullYear() === currentDay.getFullYear()
      );
    });

    if (hasMeal) {
      streak++;
      currentDay.setDate(currentDay.getDate() - 1);
    } else {
      if (i === 0) {
        currentDay.setDate(currentDay.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

function getDailyGoalMetCount(startDate: Date, endDate: Date): number {
  let daysMet = 0;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayTotalCalories = mockMeals
      .filter((m) => {
        const mealDate = new Date(m.getTimestamp() * MS_TO_S);
        return (
          mealDate.getDate() === d.getDate() &&
          mealDate.getMonth() === d.getMonth() &&
          mealDate.getFullYear() === d.getFullYear()
        );
      })
      .reduce((sum, meal) => {
        const info = meal.getNutritionInfo();
        return sum + info.getCarbs() * 4 + info.getProtein() * 4 + info.getFat() * 9;
      }, 0);

    if (
      dayTotalCalories >= GOAL_CALORIES * 0.9 &&
      dayTotalCalories <= GOAL_CALORIES * 1.1
    ) {
      daysMet++;
    }
  }
  return daysMet;
}

function calculateStreakInPeriod(startDate: Date, endDate: Date): number {
  let streak = 0;
  let checkDay = new Date(endDate);

  // Go backwards from the end date to find the first day without a meal
  while (checkDay >= startDate) {
    const hasMealOnThisDay = mockMeals.some((m) => {
      const d = new Date(m.getTimestamp() * MS_TO_S);
      return (
        d.getDate() === checkDay.getDate() &&
        d.getMonth() === checkDay.getMonth() &&
        d.getFullYear() === checkDay.getFullYear()
      );
    });

    if (!hasMealOnThisDay) {
      // This is the day the streak was broken.
      // The streak is the number of days from the day *after* this one, until the end date.
      const dayAfterBreak = new Date(checkDay);
      dayAfterBreak.setDate(dayAfterBreak.getDate() + 1);

      while (dayAfterBreak <= endDate) {
        streak++;
        dayAfterBreak.setDate(dayAfterBreak.getDate() + 1);
      }
      return streak;
    }

    checkDay.setDate(checkDay.getDate() - 1);
  }

  // If we get here, it means every day in the period had a meal.
  // The streak is the total number of days in the period.
  const totalDays = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1,
  );
  return totalDays;
}

function calculateLongestStreakOverall(): number {
  if (mockMeals.length === 0) return 0;

  // Get all unique dates that have meals
  const mealDates = new Set<string>();
  mockMeals.forEach((meal) => {
    const d = new Date(meal.getTimestamp() * MS_TO_S);
    const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    mealDates.add(dateKey);
  });

  if (mealDates.size === 0) return 0;

  // Convert to sorted array of dates
  const sortedDates = Array.from(mealDates)
    .map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month, day);
    })
    .sort((a, b) => a.getTime() - b.getTime());

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1];
    const currentDate = sortedDates[i];
    
    // Check if dates are consecutive (exactly 1 day apart)
    const diffTime = currentDate.getTime() - prevDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day, extend current streak
      currentStreak++;
    } else {
      // Break in streak, reset counter
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }

  // Final check for the last streak
  longestStreak = Math.max(longestStreak, currentStreak);
  
  return longestStreak;
}

function getMaxMealInPeriod(startDate: Date, endDate: Date): number {
  let maxCalories = 0;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  mockMeals.forEach((meal) => {
    const mealDate = new Date(meal.getTimestamp() * MS_TO_S);
    if (mealDate >= start && mealDate <= end) {
      const info = meal.getNutritionInfo();
      const mealCalories =
        info.getCarbs() * 4 + info.getProtein() * 4 + info.getFat() * 9;
      if (mealCalories > maxCalories) {
        maxCalories = mealCalories;
      }
    }
  });

  return maxCalories;
}

export default function InsightsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [selectedRange, setSelectedRange] = useState("Week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleTrends, setVisibleTrends] = useState([
    "Calories",
    "Protein",
    "Carbs",
    "Fat",
  ]);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const chartScrollRef = useRef<ScrollView>(null);
  const progress = useSharedValue(0);

  // Theme Colors
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

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 600 });
    setCurrentDate(new Date());
  }, [selectedRange]);

  // Calculate start date for the current range
  const getStartDate = (range: string, baseDate: Date) => {
    const startDate = new Date(baseDate);
    
    if (range === "Week") {
      startDate.setDate(baseDate.getDate() - 6);
    } else if (range === "Month") {
      startDate.setDate(baseDate.getDate() - 29);
    } else if (range === "Year") {
      startDate.setMonth(0, 1);
    }
    
    return startDate;
  };

  // Prepare data for 3 pages: Prev, Current, Next
  const prevDate = useMemo(() => shiftDate(currentDate, selectedRange, -1), [currentDate, selectedRange]);
  const nextDate = useMemo(() => shiftDate(currentDate, selectedRange, 1), [currentDate, selectedRange]);

  const currentStartDate = useMemo(() => getStartDate(selectedRange, currentDate), [selectedRange, currentDate]);
  const prevStartDate = useMemo(() => getStartDate(selectedRange, prevDate), [selectedRange, prevDate]);
  const nextStartDate = useMemo(() => getStartDate(selectedRange, nextDate), [selectedRange, nextDate]);

  const currentData = useMemo(() => aggregateData(selectedRange, currentStartDate), [selectedRange, currentStartDate]);
  const prevPageData = useMemo(() => aggregateData(selectedRange, prevStartDate), [selectedRange, prevStartDate]);
  const nextPageData = useMemo(() => aggregateData(selectedRange, nextStartDate), [selectedRange, nextStartDate]);

  // Chart Dimensions
  const yAxisWidth = 50;
  const chartContainerWidth = SCREEN_WIDTH - Spacing.xl * 2;
  const chartScrollWidth = chartContainerWidth - yAxisWidth;
  
  const barWidth =
    selectedRange === "Year"
      ? 8
      : selectedRange === "Month"
        ? 4
        : selectedRange === "Week"
          ? 16
          : 8;
  
  // Helper to get chart props
  const getChartProps = (data: any[], startDate: Date) => {
    const maxVal = Math.max(...data.map((d) => d.calories), 10);
    let step = 10;
    if (maxVal > 2000) step = 500;
    else if (maxVal > 1000) step = 200;
    else if (maxVal > 500) step = 100;
    else if (maxVal > 100) step = 50;
    else step = 10;
    
    let chartMax = Math.ceil(maxVal / step) * step;
    // Ensure chartMax is divisible by 4 for uniform integer labels
    if (chartMax % 4 !== 0) {
      chartMax += (4 - (chartMax % 4));
    }
    
    // Calculate spacing to fill the width
    // width = n * barWidth + n * spacing
    // spacing = (width - n * barWidth) / n
    const barSpacing = (chartScrollWidth - data.length * barWidth) / data.length;
    const axisLabels = getAxisLabels(selectedRange, data.length, startDate);

    return { chartMax, barSpacing, axisLabels };
  };

  const currentChartProps = getChartProps(currentData, currentStartDate);
  const prevChartProps = getChartProps(prevPageData, prevStartDate);
  const nextChartProps = getChartProps(nextPageData, nextStartDate);
  
  // Use current chart max for all to ensure consistency
  const unifiedChartMax = currentChartProps.chartMax;

  // Trend Data - Align with current view
  const trendData = currentData;

  useEffect(() => {
    // Scroll to beginning for better UX
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: 0, animated: true });
    }, 100);
  }, [trendData, visibleTrends]);

  // Metrics (based on currentData)
  const totalCalories = currentData.reduce((sum, d) => sum + d.calories, 0);
  const totalMeals = currentData.reduce((sum, d) => sum + d.count, 0);
  const totalQuality = currentData.reduce((sum, d) => sum + d.quality, 0);
  const avgQuality =
    totalMeals > 0 ? (totalQuality / totalMeals).toFixed(1) : "N/A";

  const daysTracked = currentData.filter((d) => d.calories > 0).length;

  // Calculate goal met days based on the actual period
  let startDate, endDate, totalDaysInPeriod;

  if (selectedRange === "Day") {
    startDate = new Date(currentDate);
    endDate = new Date(currentDate);
    totalDaysInPeriod = 1;
  } else if (selectedRange === "Week") {
    startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - 6);
    endDate = new Date(currentDate);
    totalDaysInPeriod = 7;
  } else if (selectedRange === "Month") {
    startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - 29);
    endDate = new Date(currentDate);
    totalDaysInPeriod = 30;
  } else {
    // Year
    startDate = new Date(currentDate.getFullYear(), 0, 1);
    endDate = new Date(currentDate.getFullYear(), 11, 31);
    totalDaysInPeriod = Math.round(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1,
    );
  }

  const daysGoalMet = getDailyGoalMetCount(startDate, endDate);

  // Calculate for previous period (relative to current view)
  let prevPeriodStartDate, prevPeriodEndDate;
  if (selectedRange === "Day") {
    prevPeriodStartDate = new Date(currentDate);
    prevPeriodStartDate.setDate(currentDate.getDate() - 1);
    prevPeriodEndDate = new Date(currentDate);
    prevPeriodEndDate.setDate(currentDate.getDate() - 1);
  } else if (selectedRange === "Week") {
    prevPeriodStartDate = new Date(startDate);
    prevPeriodStartDate.setDate(startDate.getDate() - 7);
    prevPeriodEndDate = new Date(endDate);
    prevPeriodEndDate.setDate(endDate.getDate() - 7);
  } else if (selectedRange === "Month") {
    prevPeriodStartDate = new Date(startDate);
    prevPeriodStartDate.setDate(startDate.getDate() - 30);
    prevPeriodEndDate = new Date(endDate);
    prevPeriodEndDate.setDate(endDate.getDate() - 30);
  } else {
    // Year
    prevPeriodStartDate = new Date(startDate.getFullYear() - 1, 0, 1);
    prevPeriodEndDate = new Date(startDate.getFullYear() - 1, 11, 31);
  }
  const prevDaysGoalMet = getDailyGoalMetCount(prevPeriodStartDate, prevPeriodEndDate);

  // Use longest streak overall for Year view, otherwise use period-specific streak
  const streak = selectedRange === "Year" 
    ? calculateLongestStreakOverall()
    : calculateStreakInPeriod(startDate, endDate);
  
  const maxCalorieMeal = getMaxMealInPeriod(startDate, endDate);

  const toggleTrend = (metric: string) => {
    if (visibleTrends.includes(metric)) {
      // Prevent deselecting the last metric
      if (visibleTrends.length > 1) {
        setVisibleTrends(visibleTrends.filter((t) => t !== metric));
      }
    } else {
      setVisibleTrends([...visibleTrends, metric]);
    }
  };

  const handleScrollEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    if (x < chartScrollWidth / 2) {
      // Scrolled to Prev
      setCurrentDate(prevDate);
    } else if (x > chartScrollWidth * 1.5) {
      // Scrolled to Next
      setCurrentDate(nextDate);
    }
  };

  useEffect(() => {
    // Reset scroll to center whenever date changes
    chartScrollRef.current?.scrollTo({ x: chartScrollWidth, animated: false });
  }, [currentDate, chartScrollWidth]);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 140 + insets.top },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Chart Card (Stacked Bar Only) */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.cardHeader}>
            <View>
              <ThemedText style={[styles.cardTitle, { color: textColor }]}>
                Calories
              </ThemedText>
              <ThemedText
                style={[styles.cardSubtitle, { color: secondaryText }]}
              >
                Total: {Math.round(totalCalories)} kcal
              </ThemedText>
            </View>
          </View>

          <View style={{ height: CHART_HEIGHT, width: chartContainerWidth }}>
            <FixedYAxis chartMax={unifiedChartMax} isDark={isDark} width={yAxisWidth} />
            <View style={{ marginLeft: yAxisWidth, width: chartScrollWidth, height: CHART_HEIGHT }}>
              <BackgroundGrid width={chartScrollWidth} isDark={isDark} />
              <ScrollView
                ref={chartScrollRef}
                horizontal
                pagingEnabled={false}
                snapToInterval={chartScrollWidth}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ width: chartScrollWidth * 3 }}
                contentOffset={{ x: chartScrollWidth, y: 0 }}
                onMomentumScrollEnd={handleScrollEnd}
                scrollEventThrottle={16}
              >
                <CalorieChart
                  data={prevPageData}
                  chartMax={unifiedChartMax}
                  barWidth={barWidth}
                  barSpacing={prevChartProps.barSpacing}
                  width={chartScrollWidth}
                  axisLabels={prevChartProps.axisLabels}
                  progress={progress}
                  isDark={isDark}
                />
                <CalorieChart
                  data={currentData}
                  chartMax={unifiedChartMax}
                  barWidth={barWidth}
                  barSpacing={currentChartProps.barSpacing}
                  width={chartScrollWidth}
                  axisLabels={currentChartProps.axisLabels}
                  progress={progress}
                  isDark={isDark}
                />
                <CalorieChart
                  data={nextPageData}
                  chartMax={unifiedChartMax}
                  barWidth={barWidth}
                  barSpacing={nextChartProps.barSpacing}
                  width={chartScrollWidth}
                  axisLabels={nextChartProps.axisLabels}
                  progress={progress}
                  isDark={isDark}
                />
              </ScrollView>
            </View>
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: Colors.secondary.protein },
                ]}
              />
              <ThemedText style={[styles.legendText, { color: secondaryText }]}>
                Protein
              </ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: Colors.secondary.carbs },
                ]}
              />
              <ThemedText style={[styles.legendText, { color: secondaryText }]}>
                Carbs
              </ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: Colors.secondary.fat },
                ]}
              />
              <ThemedText style={[styles.legendText, { color: secondaryText }]}>
                Fat
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Analytics Cards */}
        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
          Highlights
        </ThemedText>

        <View style={styles.metricsGrid}>
          <View
            style={[styles.card, styles.metricCard, { backgroundColor: cardBg }]}
          >
            <ThemedText style={styles.metricTitle}>Avg Meal Quality</ThemedText>
            <View style={styles.metricValueContainer}>
              <ThemedText style={[styles.metricValue, { color: textColor }]}>
                {avgQuality}
              </ThemedText>
              <ThemedText style={[styles.metricUnit, { color: secondaryText }]}>
                / 10
              </ThemedText>
            </View>
          </View>

          <View
            style={[styles.card, styles.metricCard, { backgroundColor: cardBg }]}
          >
            <ThemedText style={styles.metricTitle}>
              {selectedRange === "Year" ? "Longest Streak" : "Current Streak"}
            </ThemedText>
            <View style={styles.metricValueContainer}>
              <ThemedText style={[styles.metricValue, { color: textColor }]}>
                {streak}
              </ThemedText>
              <ThemedText style={[styles.metricUnit, { color: secondaryText }]}>
                days
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View
            style={[styles.card, styles.metricCard, { backgroundColor: cardBg }]}
          >
            <ThemedText style={styles.metricTitle}>Goal Met</ThemedText>
            <View style={styles.metricValueContainer}>
              <ThemedText style={[styles.metricValue, { color: textColor }]}>
                {daysGoalMet}
              </ThemedText>
              <ThemedText style={[styles.metricUnit, { color: secondaryText }]}>
                / {totalDaysInPeriod} days
              </ThemedText>
            </View>
            <ThemedText style={[styles.insightText, { color: secondaryText }]}>
              {daysGoalMet > prevDaysGoalMet
                ? "Better than last period!"
                : daysGoalMet < prevDaysGoalMet
                  ? "Keep pushing!"
                  : "Consistent with last period."}
            </ThemedText>
          </View>

          <View
            style={[styles.card, styles.metricCard, { backgroundColor: cardBg }]}
          >
            <ThemedText style={styles.metricTitle}>Max Meal</ThemedText>
            <View style={styles.metricValueContainer}>
              <ThemedText style={[styles.metricValue, { color: textColor }]}>
                {Math.round(maxCalorieMeal)}
              </ThemedText>
              <ThemedText style={[styles.metricUnit, { color: secondaryText }]}>
                kcal
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Trends Chart */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.cardHeader}>
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>
              Trends
            </ThemedText>
            <View style={styles.metricSelector}>
              {TREND_METRICS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.metricChip,
                    visibleTrends.includes(m) && styles.metricChipSelected,
                    {
                      backgroundColor: visibleTrends.includes(m)
                        ? Colors.primary
                        : isDark
                          ? "#333"
                          : Colors.grey.light,
                    },
                  ]}
                  onPress={() => toggleTrend(m)}
                >
                  <ThemedText
                    style={[
                      styles.metricChipText,
                      visibleTrends.includes(m) &&
                        styles.metricChipTextSelected,
                      {
                        color: visibleTrends.includes(m)
                          ? "#fff"
                          : secondaryText,
                      },
                    ]}
                  >
                    {m}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            ref={scrollRef}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
          >
            <Svg
              width={Math.max(
                SCREEN_WIDTH - Spacing.xl * 2,
                trendData.length * 40,
              )}
              height={240}
            >
              <Defs>
                <LinearGradient id="gradCal" x1="0" y1="0" x2="0" y2="1">
                  <Stop
                    offset="0"
                    stopColor={Colors.primary}
                    stopOpacity="0.2"
                  />
                  <Stop offset="1" stopColor={Colors.primary} stopOpacity="0" />
                </LinearGradient>
                <LinearGradient id="gradProt" x1="0" y1="0" x2="0" y2="1">
                  <Stop
                    offset="0"
                    stopColor={Colors.secondary.protein}
                    stopOpacity="0.2"
                  />
                  <Stop
                    offset="1"
                    stopColor={Colors.secondary.protein}
                    stopOpacity="0"
                  />
                </LinearGradient>
                <LinearGradient id="gradCarb" x1="0" y1="0" x2="0" y2="1">
                  <Stop
                    offset="0"
                    stopColor={Colors.secondary.carbs}
                    stopOpacity="0.2"
                  />
                  <Stop
                    offset="1"
                    stopColor={Colors.secondary.carbs}
                    stopOpacity="0"
                  />
                </LinearGradient>
                <LinearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                  <Stop
                    offset="0"
                    stopColor={Colors.secondary.fat}
                    stopOpacity="0.2"
                  />
                  <Stop
                    offset="1"
                    stopColor={Colors.secondary.fat}
                    stopOpacity="0"
                  />
                </LinearGradient>
              </Defs>

              {(() => {
                const maxCal = Math.max(
                  ...trendData.map((d) => d.calories),
                  100,
                );
                const maxMacro = Math.max(
                  ...trendData.map((d) => Math.max(d.protein, d.carbs, d.fat)),
                  10,
                );

                // Round scales
                const roundScale = (val: number) => {
                  let s = 10;
                  if (val > 2000) s = 500;
                  else if (val > 1000) s = 200;
                  else if (val > 500) s = 100;
                  else if (val > 100) s = 50;
                  return Math.ceil(val / s) * s;
                };

                const scaleCal = roundScale(maxCal);
                const scaleMacro = roundScale(maxMacro);

                const chartH = 240;
                const chartW = Math.max(
                  SCREEN_WIDTH - Spacing.xl * 2,
                  trendData.length * 40,
                );
                const pX = 10;
                const pR = 10;
                const drawW = chartW - pX - pR;
                const stepX = drawW / (trendData.length - 1 || 1);

                const getX = (i: number) => pX + i * stepX;
                const getYCal = (v: number) =>
                  chartH - 40 - (v / scaleCal) * (chartH - 60);
                const getYMacro = (v: number) =>
                  chartH - 40 - (v / scaleMacro) * (chartH - 60);

                return (
                  <G>
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = chartH - 40 - ratio * (chartH - 60);
                      return (
                        <G key={`grid-${ratio}`}>
                          <Line
                            x1={0}
                            y1={y}
                            x2={chartW}
                            y2={y}
                            stroke={isDark ? "#444" : Colors.grey.light}
                            strokeDasharray="4, 4"
                            strokeWidth={1}
                          />
                        </G>
                      );
                    })}

                    {/* Data Areas & Lines */}
                    {visibleTrends.includes("Calories") && (
                      <>
                        <Polygon
                          points={
                            `${getX(0)},${chartH - 40} ` +
                            trendData
                              .map(
                                (d, i) => `${getX(i)},${getYCal(d.calories)}`,
                              )
                              .join(" ") +
                            ` ${getX(trendData.length - 1)},${chartH - 40}`
                          }
                          fill="url(#gradCal)"
                        />
                        <Polyline
                          points={trendData
                            .map((d, i) => `${getX(i)},${getYCal(d.calories)}`)
                            .join(" ")}
                          fill="none"
                          stroke={Colors.primary}
                          strokeWidth={3}
                        />
                      </>
                    )}
                    {visibleTrends.includes("Protein") && (
                      <>
                        <Polygon
                          points={
                            `${getX(0)},${chartH - 40} ` +
                            trendData
                              .map(
                                (d, i) => `${getX(i)},${getYMacro(d.protein)}`,
                              )
                              .join(" ") +
                            ` ${getX(trendData.length - 1)},${chartH - 40}`
                          }
                          fill="url(#gradProt)"
                        />
                        <Polyline
                          points={trendData
                            .map((d, i) => `${getX(i)},${getYMacro(d.protein)}`)
                            .join(" ")}
                          fill="none"
                          stroke={Colors.secondary.protein}
                          strokeWidth={2}
                        />
                      </>
                    )}
                    {visibleTrends.includes("Carbs") && (
                      <>
                        <Polygon
                          points={
                            `${getX(0)},${chartH - 40} ` +
                            trendData
                              .map((d, i) => `${getX(i)},${getYMacro(d.carbs)}`)
                              .join(" ") +
                            ` ${getX(trendData.length - 1)},${chartH - 40}`
                          }
                          fill="url(#gradCarb)"
                        />
                        <Polyline
                          points={trendData
                            .map((d, i) => `${getX(i)},${getYMacro(d.carbs)}`)
                            .join(" ")}
                          fill="none"
                          stroke={Colors.secondary.carbs}
                          strokeWidth={2}
                        />
                      </>
                    )}
                    {visibleTrends.includes("Fat") && (
                      <>
                        <Polygon
                          points={
                            `${getX(0)},${chartH - 40} ` +
                            trendData
                              .map((d, i) => `${getX(i)},${getYMacro(d.fat)}`)
                              .join(" ") +
                            ` ${getX(trendData.length - 1)},${chartH - 40}`
                          }
                          fill="url(#gradFat)"
                        />
                        <Polyline
                          points={trendData
                            .map((d, i) => `${getX(i)},${getYMacro(d.fat)}`)
                            .join(" ")}
                          fill="none"
                          stroke={Colors.secondary.fat}
                          strokeWidth={2}
                        />
                      </>
                    )}

                    {/* X-Axis Labels */}
                    {trendData.map((d, i) => {
                      // Use axisLabels from currentChartProps to get correct labels
                      const label = currentChartProps.axisLabels.find(l => l.index === i)?.text;
                      if (!label) return null;
                      
                      // Show fewer labels if too many
                      if (trendData.length > 10 && i % Math.ceil(trendData.length / 5) !== 0) return null;

                      return (
                        <SvgText
                          key={`label-${i}`}
                          x={getX(i)}
                          y={chartH - 10}
                          fill={secondaryText}
                          fontSize={Typography.sizes.sm}
                          textAnchor="middle"
                        >
                          {label}
                        </SvgText>
                      );
                    })}
                  </G>
                );
              })()}
            </Svg>
          </ScrollView>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText style={[styles.cardTitle, { color: textColor }]}>
            Insights
          </ThemedText>
          <View style={[styles.insightRow, { borderBottomColor: borderColor }]}>
            <ThemedText style={[styles.insightLabel, { color: textColor }]}>
              Days Tracked:
            </ThemedText>
            <ThemedText style={[styles.insightValue, { color: secondaryText }]}>
              {daysTracked} days
            </ThemedText>
          </View>
          <View style={[styles.insightRow, { borderBottomColor: borderColor }]}>
            <ThemedText style={[styles.insightLabel, { color: textColor }]}>
              Avg Calories:
            </ThemedText>
            <ThemedText style={[styles.insightValue, { color: secondaryText }]}>
              {daysTracked > 0 ? Math.round(totalCalories / daysTracked) : 0}{" "}
              kcal
            </ThemedText>
          </View>
          <View style={[styles.insightRow, { borderBottomColor: borderColor }]}>
            <ThemedText style={[styles.insightLabel, { color: textColor }]}>
              Comparison:
            </ThemedText>
            <ThemedText style={[styles.insightValue, { color: secondaryText }]}>
              {daysGoalMet > prevDaysGoalMet
                ? `You met your goal ${daysGoalMet - prevDaysGoalMet} more times than last ${selectedRange.toLowerCase()}.`
                : "Track more to see improvements!"}
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Header with Title */}
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.header,
          { paddingTop: insets.top, borderBottomColor: borderColor },
        ]}
      >
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          Insights
        </ThemedText>
        {/* Segmented Control */}
        <View
          style={[
            styles.segmentedControl,
            { backgroundColor: segmentBg, marginTop: Spacing.sm },
          ]}
        >
          {RANGES.map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.segment,
                selectedRange === range && {
                  ...styles.segmentSelected,
                  backgroundColor: segmentSelectedBg,
                },
              ]}
              onPress={() => setSelectedRange(range)}
            >
              <ThemedText
                style={[
                  styles.segmentText,
                  { color: segmentTextColor },
                  selectedRange === range && styles.segmentTextSelected,
                ]}
              >
                {range}
              </ThemedText>
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
    backgroundColor: Colors.grey.light,
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#000",
    lineHeight: 41,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "rgba(118, 118, 128, 0.12)",
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  segmentSelected: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "500",
    color: "#000",
  },
  segmentTextSelected: {
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  cardHeader: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: "600",
    color: "#000",
  },
  metricSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  metricChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.grey.light,
  },
  metricChipSelected: {
    backgroundColor: Colors.primary,
  },
  metricChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "600",
    color: "#666",
  },
  metricChipTextSelected: {
    color: "#fff",
  },
  cardSubtitle: {
    fontSize: Typography.sizes.sm,
    color: "#8E8E93",
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: Typography.sizes.sm,
    color: "#8E8E93",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: Spacing.md,
    color: "#000",
  },
  metricsGrid: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.lg,
    marginBottom: 0,
  },
  metricTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  metricValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  metricUnit: {
    fontSize: Typography.sizes.sm,
    color: "#8E8E93",
    fontWeight: "500",
  },
  insightText: {
    fontSize: Typography.sizes.sm,
    color: "#8E8E93",
    marginTop: Spacing.xs,
  },
  insightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  insightLabel: {
    fontSize: Typography.sizes.sm,
    color: "#000",
  },
  insightValue: {
    fontSize: Typography.sizes.sm,
    color: "#8E8E93",
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
});
