import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Svg,
  Rect,
  Defs,
  ClipPath,
  G,
  Line,
  Text as SvgText,
  Polyline,
  LinearGradient as SvgLinearGradient,
  Stop,
  Polygon,
  Path,
  Circle,
} from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  SharedValue,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { useMeals } from "@/context/MealContext";
import { useUser } from "@/context/UserContext";
import { MS_TO_S, DAILY_CALORIE_GOAL } from "@/constants/values";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
  Typography,
} from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_HEIGHT = 250;
const CHART_PADDING_X = 30;
const RANGES = ["Day", "Week", "Month", "Year"];
const TREND_METRICS = ["Calories", "Protein", "Carbs", "Fat"];

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
  width: number;
  axisLabels: { text: string; index: number }[];
  progress: SharedValue<number>;
  isDark: boolean;
  paddingX?: number;
  goalCalories?: number;
  onBarPress?: (index: number) => void;
  selectedRange: string;
}

const CalorieChart = ({
  data,
  chartMax,
  barWidth,
  width,
  axisLabels,
  progress,
  isDark,
  paddingX = 0,
  goalCalories,
  onBarPress,
  selectedRange,
}: CalorieChartProps) => {
  const goalY = goalCalories
    ? CHART_HEIGHT - 30 - (goalCalories / chartMax) * (CHART_HEIGHT - 50)
    : null;

  const step = (width - 2 * paddingX) / (data.length > 1 ? data.length - 1 : 1);

  return (
    <View style={{ width }}>
      <Svg width={width} height={CHART_HEIGHT}>
        {/* Vertical Border Line */}
        <Line
          x1={width}
          y1={0}
          x2={width}
          y2={CHART_HEIGHT}
          stroke={isDark ? "#555" : "#ccc"}
          strokeWidth={1}
        />

        {/* Goal Line */}
        {goalY !== null && (
          <Line
            x1={0}
            y1={goalY}
            x2={width}
            y2={goalY}
            stroke={Colors.primary}
            strokeWidth={2}
            strokeDasharray="5, 5"
            opacity={0.6}
          />
        )}

        {/* Stacked Bars */}
        <Defs>
          {data.map((d, i) => {
            if (d.calories === 0) return null;
            const totalHeight = (d.calories / chartMax) * (CHART_HEIGHT - 50);
            const x = paddingX + i * step - barWidth / 2;
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
          const x = paddingX + i * step - barWidth / 2;
          const yBase = CHART_HEIGHT - 30;
          const carbH = ((d.carbs * 4) / d.calories) * totalHeight;
          const proteinH = ((d.protein * 4) / d.calories) * totalHeight;
          const fatH = ((d.fat * 9) / d.calories) * totalHeight;

          return (
            <G
              key={`bar-${i}`}
              clipPath={`url(#clip-${i})`}
              onPress={() => onBarPress && onBarPress(i)}
            >
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

        {/* Week Separators for Month View */}
        {selectedRange === "Month" &&
          Array.from({ length: Math.ceil(data.length / 7) }).map((_, weekIndex) => {
            const xPos = paddingX + weekIndex * 7 * step;
            return (
              <Line
                key={`week-separator-${weekIndex}`}
                x1={xPos}
                y1={0}
                x2={xPos}
                y2={CHART_HEIGHT - 30}
                stroke={isDark ? "#666" : "#ddd"}
                strokeWidth={1}
                strokeDasharray="2, 2"
              />
            );
          })}

        {/* X-Axis Labels */}
        {axisLabels.map((label, i) => {
          const x = paddingX + label.index * step;
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

const FixedYAxis = ({
  chartMax,
  isDark,
  width,
}: {
  chartMax: number;
  isDark: boolean;
  width: number;
}) => {
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width,
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      <Svg width={width} height={CHART_HEIGHT}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = CHART_HEIGHT - 30 - ratio * (CHART_HEIGHT - 50);
          return (
            <G key={`grid-${ratio}`}>
              <SvgText
                x={width - 8}
                y={y}
                dy="4"
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

const BackgroundGrid = ({
  width,
  isDark,
}: {
  width: number;
  isDark: boolean;
}) => {
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width,
        zIndex: 0,
      }}
    >
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
    newDate.setMonth(newDate.getMonth() + offset);
  } else if (range === "Year") {
    newDate.setFullYear(newDate.getFullYear() + offset);
  }
  return newDate;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getAxisLabels(range: string, dataLength: number, startDate: Date) {
  const labels: { text: string; index: number }[] = [];
  const baseDate = new Date(startDate);

  if (range === "Day") {
    // Label every 5 hours starting from 6:00
    [0, 5, 10, 15].forEach((i) => {
      if (i < dataLength) labels.push({ text: `${i + 6}:00`, index: i });
    });
  } else if (range === "Week") {
    // Label every day using a fixed array for consistency
    for (let i = 0; i < dataLength; i++) {
      const dayIndex = (baseDate.getDay() + i) % 7;
      labels.push({
        text: WEEKDAYS[dayIndex],
        index: i,
      });
    }
  } else if (range === "Month") {
    const daysInMonth = dataLength;
    for (let i = 0; i < daysInMonth; i++) {
      // Label the first day, last day, and every 7th day
      if (i === 0 || i === daysInMonth - 1 || (i + 1) % 7 === 0) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        labels.push({
          text: d.getDate().toString(),
          index: i,
        });
      }
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

function aggregateData(range: string, startDate?: Date, meals: any[] = []) {
  const baseDate = startDate || new Date();
  let dataPoints = 0;
  if (range === "Day") dataPoints = 18;
  else if (range === "Week") dataPoints = 7;
  else if (range === "Month") {
    // Get number of days in the month
    dataPoints = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
  }
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

  meals.forEach((meal) => {
    const mealDate = new Date(meal.timestamp * MS_TO_S);
    let index = -1;

    if (range === "Day") {
      if (
        mealDate.getFullYear() === baseDate.getFullYear() &&
        mealDate.getMonth() === baseDate.getMonth() &&
        mealDate.getDate() === baseDate.getDate()
      ) {
        const h = mealDate.getHours();
        if (h >= 6) {
          index = h - 6;
        }
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
      if (diff >= 0 && diff < dataPoints) {
        index = diff;
      }
    } else if (range === "Year") {
      const diff = mealDate.getMonth() - baseDate.getMonth() + (12 * (mealDate.getFullYear() - baseDate.getFullYear()));
      if (diff >= 0 && diff < dataPoints) {
        index = diff;
      }
    }

    if (index !== -1 && index < dataPoints) {
      const info = meal.nutritionInfo;
      data[index].carbs += info.carbs;
      data[index].protein += info.protein;
      data[index].fat += info.fat;
      data[index].calories += info.calories;
      data[index].quality += meal.mealQuality.mealQualityScore;
      data[index].count += 1;
    }
  });

  return data;
}

function getHistoricalData(
  count: number,
  resolution: "day" | "month",
  endDate?: Date,
  meals: any[] = [],
) {
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

  meals.forEach((meal) => {
    const mDate = new Date(meal.timestamp * MS_TO_S);
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
      const info = meal.nutritionInfo;
      data[index].carbs += info.carbs;
      data[index].protein += info.protein;
      data[index].fat += info.fat;
      data[index].calories += info.calories;
    }
  });

  return data;
}

function calculateStreak(meals: any[]) {
  const now = new Date();
  let streak = 0;
  let currentDay = new Date(now);

  for (let i = 0; i < 365; i++) {
    const hasMeal = meals.some((m) => {
      const d = new Date(m.timestamp * MS_TO_S);
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

function getDailyGoalMetCount(
  startDate: Date,
  endDate: Date,
  meals: any[],
  calorieGoal: number,
): number {
  let daysMet = 0;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayTotalCalories = meals
      .filter((m) => {
        const mealDate = new Date(m.timestamp * MS_TO_S);
        return (
          mealDate.getDate() === d.getDate() &&
          mealDate.getMonth() === d.getMonth() &&
          mealDate.getFullYear() === d.getFullYear()
        );
      })
      .reduce((sum, meal) => {
        const info = meal.nutritionInfo;
        return sum + info.calories;
      }, 0);

    if (
      dayTotalCalories >= calorieGoal * 0.9 &&
      dayTotalCalories <= calorieGoal * 1.1
    ) {
      daysMet++;
    }
  }
  return daysMet;
}

function calculateStreakInPeriod(
  startDate: Date,
  endDate: Date,
  meals: any[],
): number {
  let streak = 0;
  let checkDay = new Date(endDate);

  // Go backwards from the end date to find the first day without a meal
  while (checkDay >= startDate) {
    const hasMealOnThisDay = meals.some((m) => {
      const d = new Date(m.timestamp * MS_TO_S);
      return (
        d.getDate() === checkDay.getDate() &&
        d.getMonth() === checkDay.getMonth() &&
        d.getFullYear() === checkDay.getFullYear()
      );
    });

    if (hasMealOnThisDay) {
      streak++;
      checkDay.setDate(checkDay.getDate() - 1);
    } else {
      // This is the day the streak was broken.
      // Return the streak we've counted so far
      return streak;
    }
  }

  // If we get here, it means every day in the period had a meal.
  // The streak is the total number of days in the period.
  const totalDays = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1,
  );
  return totalDays;
}

function calculateLongestStreakOverall(meals: any[]): number {
  if (meals.length === 0) return 0;

  // Get all unique dates that have meals
  const mealDates = new Set<string>();
  meals.forEach((meal) => {
    const d = new Date(meal.timestamp * MS_TO_S);
    const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    mealDates.add(dateKey);
  });

  if (mealDates.size === 0) return 0;

  // Convert to sorted array of dates
  const sortedDates = Array.from(mealDates)
    .map((dateStr) => {
      const [year, month, day] = dateStr.split("-").map(Number);
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

function getMaxMealInPeriod(
  startDate: Date,
  endDate: Date,
  meals: any[],
): any | null {
  let maxMeal = null;
  let maxCalories = 0;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  meals.forEach((meal) => {
    const mealDate = new Date(meal.timestamp * MS_TO_S);
    if (mealDate >= start && mealDate <= end) {
      const info = meal.nutritionInfo;
      const mealCalories = info.calories;
      if (mealCalories > maxCalories) {
        maxCalories = mealCalories;
        maxMeal = meal;
      }
    }
  });

  return maxMeal;
}

const generateSmoothPath = (
  points: { x: number; y: number }[],
  close: boolean = false,
  height: number = 0,
) => {
  if (points.length < 2) return "";

  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX1 = current.x + (next.x - current.x) / 2;
    const controlY1 = current.y;
    const controlX2 = current.x + (next.x - current.x) / 2;
    const controlY2 = next.y;

    d += ` C ${controlX1},${controlY1} ${controlX2},${controlY2} ${next.x},${next.y}`;
  }

  if (close) {
    d += ` L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;
  }

  return d;
};

function roundScale(val: number) {
  let s = 10;
  if (val > 2000) s = 500;
  else if (val > 1000) s = 200;
  else if (val > 500) s = 100;
  else if (val > 100) s = 50;
  return Math.ceil(val / s) * s;
}

interface TrendsChartProps {
  data: any[];
  labels: { text: string; index: number }[];
  width: number;
  height: number;
  visibleTrends: string[];
  isDark: boolean;
  range: string;
  scaleCal: number;
  scaleMacro: number;
  pointsPerPage: number;
}

const TrendsChart = ({
  data,
  labels,
  width,
  height,
  visibleTrends,
  isDark,
  range,
  scaleCal,
  scaleMacro,
  pointsPerPage,
}: TrendsChartProps) => {
  const pX = 30;
  const pR = 30;
  const pageWidth = width / 3;
  const drawW = pageWidth - pX - pR;
  const stepX = drawW / (pointsPerPage - 1 || 1);

  const getX = (i: number) => {
    const pageIndex = Math.floor(i / pointsPerPage);
    const localIndex = i % pointsPerPage;
    return pageIndex * pageWidth + pX + localIndex * stepX;
  };
  const getYCal = (v: number) => height - 40 - (v / scaleCal) * (height - 60);
  const getYMacro = (v: number) =>
    height - 40 - (v / scaleMacro) * (height - 60);

  const calPoints = data.map((d, i) => ({
    x: getX(i),
    y: getYCal(d.calories),
  }));
  const protPoints = data.map((d, i) => ({
    x: getX(i),
    y: getYMacro(d.protein),
  }));
  const carbPoints = data.map((d, i) => ({
    x: getX(i),
    y: getYMacro(d.carbs),
  }));
  const fatPoints = data.map((d, i) => ({
    x: getX(i),
    y: getYMacro(d.fat),
  }));

  return (
    <View style={{ width }}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id="gradCal" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.4" />
            <Stop offset="1" stopColor={Colors.primary} stopOpacity="0" />
          </SvgLinearGradient>
          <SvgLinearGradient id="gradProt" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0"
              stopColor={Colors.secondary.protein}
              stopOpacity="0.4"
            />
            <Stop
              offset="1"
              stopColor={Colors.secondary.protein}
              stopOpacity="0"
            />
          </SvgLinearGradient>
          <SvgLinearGradient id="gradCarb" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0"
              stopColor={Colors.secondary.carbs}
              stopOpacity="0.4"
            />
            <Stop
              offset="1"
              stopColor={Colors.secondary.carbs}
              stopOpacity="0"
            />
          </SvgLinearGradient>
          <SvgLinearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0"
              stopColor={Colors.secondary.fat}
              stopOpacity="0.4"
            />
            <Stop offset="1" stopColor={Colors.secondary.fat} stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        <G>
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = height - 40 - ratio * (height - 60);
            return (
              <G key={`grid-${ratio}`}>
                <Line
                  x1={pX}
                  y1={y}
                  x2={width - pR}
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
              <Path
                d={generateSmoothPath(calPoints, true, height - 40)}
                fill="url(#gradCal)"
              />
              <Path
                d={generateSmoothPath(calPoints)}
                fill="none"
                stroke={Colors.primary}
                strokeWidth={3}
              />
            </>
          )}
          {visibleTrends.includes("Protein") && (
            <>
              <Path
                d={generateSmoothPath(protPoints, true, height - 40)}
                fill="url(#gradProt)"
              />
              <Path
                d={generateSmoothPath(protPoints)}
                fill="none"
                stroke={Colors.secondary.protein}
                strokeWidth={2}
              />
            </>
          )}
          {visibleTrends.includes("Carbs") && (
            <>
              <Path
                d={generateSmoothPath(carbPoints, true, height - 40)}
                fill="url(#gradCarb)"
              />
              <Path
                d={generateSmoothPath(carbPoints)}
                fill="none"
                stroke={Colors.secondary.carbs}
                strokeWidth={2}
              />
            </>
          )}
          {visibleTrends.includes("Fat") && (
            <>
              <Path
                d={generateSmoothPath(fatPoints, true, height - 40)}
                fill="url(#gradFat)"
              />
              <Path
                d={generateSmoothPath(fatPoints)}
                fill="none"
                stroke={Colors.secondary.fat}
                strokeWidth={2}
              />
            </>
          )}

          {/* X-Axis Labels */}
          {data.map((d, i) => {
            const label = labels.find((l) => l.index === i)?.text;
            if (!label) return null;

            return (
              <SvgText
                key={`label-${i}`}
                x={getX(i)}
                y={height - 10}
                fill={isDark ? "#999" : "#666"}
                fontSize={Typography.sizes.sm}
                textAnchor="middle"
              >
                {label}
              </SvgText>
            );
          })}
        </G>
      </Svg>
    </View>
  );
};

export default function InsightsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { meals, isLoading } = useMeals();
  const { goals } = useUser();
  const calorieGoal = goals?.calories || DAILY_CALORIE_GOAL;
  const [selectedRange, setSelectedRange] = useState("Week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleTrends, setVisibleTrends] = useState([
    "Calories",
    "Protein",
    "Carbs",
    "Fat",
  ]);
  const [currentViewIndex, setCurrentViewIndex] = useState(1); // 0: prev, 1: current, 2: next
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const chartScrollRef = useRef<ScrollView>(null);
  const trendsScrollRef = useRef<ScrollView>(null);
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
    // Only reset date on initial mount, not on range change
    if (currentDate.getTime() === 0) {
      setCurrentDate(new Date());
    }
  }, [selectedRange, currentDate]);

  // Calculate start date for the current range
  const getStartDate = (range: string, baseDate: Date) => {
    const startDate = new Date(baseDate);

    if (range === "Week") {
      // Find the Monday of the week for the given baseDate
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday (0)
      startDate.setDate(diff);
    } else if (range === "Month") {
      startDate.setDate(1); // Set to the first day of the month
    } else if (range === "Year") {
      startDate.setMonth(0, 1);
    }

    return startDate;
  };

  // Prepare data for 3 pages: Prev, Current, Next
  const prevDate = useMemo(
    () => shiftDate(currentDate, selectedRange, -1),
    [currentDate, selectedRange],
  );
  const nextDate = useMemo(
    () => shiftDate(currentDate, selectedRange, 1),
    [currentDate, selectedRange],
  );

  const currentStartDate = useMemo(
    () => getStartDate(selectedRange, currentDate),
    [selectedRange, currentDate],
  );
  const prevStartDate = useMemo(
    () => getStartDate(selectedRange, prevDate),
    [selectedRange, prevDate],
  );
  const nextStartDate = useMemo(
    () => getStartDate(selectedRange, nextDate),
    [selectedRange, nextDate],
  );

  const currentData = useMemo(
    () => aggregateData(selectedRange, currentStartDate, meals),
    [selectedRange, currentStartDate, meals],
  );
  const prevPageData = useMemo(
    () => aggregateData(selectedRange, prevStartDate, meals),
    [selectedRange, prevStartDate, meals],
  );
  const nextPageData = useMemo(
    () => aggregateData(selectedRange, nextStartDate, meals),
    [selectedRange, nextStartDate, meals],
  );

  // Check if current date is today
  const isCurrentDate = useMemo(() => {
    const now = new Date();
    return (
      currentDate.getDate() === now.getDate() &&
      currentDate.getMonth() === now.getMonth() &&
      currentDate.getFullYear() === now.getFullYear()
    );
  }, [currentDate]);

  // Chart Dimensions
  const yAxisWidth = 50;
  const chartContainerWidth = SCREEN_WIDTH - Spacing.xl * 2 - Spacing.lg * 2;
  const chartScrollWidth = chartContainerWidth - yAxisWidth;

  const barWidth =
    selectedRange === "Year"
      ? 8
      : selectedRange === "Month"
        ? 4
        : selectedRange === "Week"
          ? 16
          : 10;

  // Helper to get chart props
  const getChartProps = (data: any[], startDate: Date) => {
    const maxVal = Math.max(...data.map((d) => d.calories), calorieGoal, 10);
    let step = 10;
    if (maxVal > 2000) step = 500;
    else if (maxVal > 1000) step = 200;
    else if (maxVal > 500) step = 100;
    else if (maxVal > 100) step = 50;
    else step = 10;

    let chartMax = Math.ceil(maxVal / step) * step;
    // Ensure chartMax is divisible by 4 for uniform integer labels
    if (chartMax % 4 !== 0) {
      chartMax += 4 - (chartMax % 4);
    }

    const axisLabels = getAxisLabels(selectedRange, data.length, startDate);

    return { chartMax, axisLabels };
  };

  const currentChartProps = getChartProps(currentData, currentStartDate);
  const prevChartProps = getChartProps(prevPageData, prevStartDate);
  const nextChartProps = getChartProps(nextPageData, nextStartDate);

  // Use current chart max for all to ensure consistency
  const unifiedChartMax = currentChartProps.chartMax;

  const maxCal = Math.max(...currentData.map((d) => d.calories), 100);
  const maxMacro = Math.max(
    ...currentData.map((d) => Math.max(d.protein, d.carbs, d.fat)),
    10,
  );
  const trendScaleCal = roundScale(maxCal);
  const trendScaleMacro = roundScale(maxMacro);

  const pointsPerPage = useMemo(() => {
    if (selectedRange === "Day") return 18;
    if (selectedRange === "Week") return 7;
    if (selectedRange === "Month") return 30;
    if (selectedRange === "Year") return 12;
    return 7;
  }, [selectedRange]);

  // Combine data for continuous chart
  const combinedTrendData = useMemo(() => {
    return [...prevPageData, ...currentData, ...nextPageData];
  }, [prevPageData, currentData, nextPageData]);

  const combinedTrendLabels = useMemo(() => {
    const prevLabels = prevChartProps.axisLabels.map((l) => ({
      ...l,
      index: l.index,
    }));
    const currentLabels = currentChartProps.axisLabels.map((l) => ({
      ...l,
      index: l.index + prevPageData.length,
    }));
    const nextLabels = nextChartProps.axisLabels.map((l) => ({
      ...l,
      index: l.index + prevPageData.length + currentData.length,
    }));
    return [...prevLabels, ...currentLabels, ...nextLabels];
  }, [
    prevChartProps.axisLabels,
    currentChartProps.axisLabels,
    nextChartProps.axisLabels,
    prevPageData.length,
    currentData.length,
  ]);

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
    startDate = getStartDate(selectedRange, currentDate);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    totalDaysInPeriod = 7;
  } else if (selectedRange === "Month") {
    startDate = getStartDate(selectedRange, currentDate);
    endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // Last day of the month
    totalDaysInPeriod = endDate.getDate();
  } else {
    // Year
    startDate = new Date(currentDate.getFullYear(), 0, 1);
    endDate = new Date(currentDate.getFullYear(), 11, 31);
    totalDaysInPeriod = Math.round(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1,
    );
  }

  const daysGoalMet = getDailyGoalMetCount(
    startDate,
    endDate,
    meals,
    calorieGoal,
  );

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
    prevPeriodStartDate.setMonth(startDate.getMonth() - 1);
    prevPeriodEndDate = new Date(prevPeriodStartDate.getFullYear(), prevPeriodStartDate.getMonth() + 1, 0);
  } else {
    // Year
    prevPeriodStartDate = new Date(startDate.getFullYear() - 1, 0, 1);
    prevPeriodEndDate = new Date(startDate.getFullYear() - 1, 11, 31);
  }
  const prevDaysGoalMet = getDailyGoalMetCount(
    prevPeriodStartDate,
    prevPeriodEndDate,
    meals,
    calorieGoal,
  );

  // Use longest streak overall for Year view, otherwise use period-specific streak
  const streak =
    selectedRange === "Year"
      ? calculateLongestStreakOverall(meals)
      : calculateStreakInPeriod(startDate, endDate, meals);

  const maxMeal = getMaxMealInPeriod(startDate, endDate, meals);
  const maxMealCalories = maxMeal ? maxMeal.nutritionInfo.calories : 0;

  const getMetricGradient = (metric: string) => {
    switch (metric) {
      case "Calories":
        return [Colors.primary, "#4CAF50"];
      case "Protein":
        return [Colors.secondary.protein, "#20B2AA"];
      case "Carbs":
        return [Colors.secondary.carbs, "#32CD32"];
      case "Fat":
        return [Colors.secondary.fat, "#FF4500"];
      default:
        return [Colors.primary, Colors.primary];
    }
  };

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
      setCurrentViewIndex(0);
    } else if (x > chartScrollWidth * 1.5) {
      // Scrolled to Next
      setCurrentDate(nextDate);
      setCurrentViewIndex(2);
    } else {
      // In the middle - Current
      setCurrentViewIndex(1);
    }
  };

  // Use fixed width for trends chart to fit in container
  const trendsChartWidth = chartContainerWidth;

  const handleTrendsScrollEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    if (x < trendsChartWidth / 2) {
      // Scrolled to Prev
      setCurrentDate(prevDate);
      setCurrentViewIndex(0);
    } else if (x > trendsChartWidth * 1.5) {
      // Scrolled to Next
      setCurrentDate(nextDate);
      setCurrentViewIndex(2);
    } else {
      // In the middle - Current
      setCurrentViewIndex(1);
    }
  };

  useEffect(() => {
    // Reset scroll to center whenever date changes
    chartScrollRef.current?.scrollTo({ x: chartScrollWidth, animated: false });
    trendsScrollRef.current?.scrollTo({ x: trendsChartWidth, animated: false });
    setCurrentViewIndex(1); // Reset to current view
  }, [currentDate, chartScrollWidth, trendsChartWidth]);

  const getDateRangeString = () => {
    const start = getStartDate(selectedRange, currentDate);

    if (selectedRange === "Day") {
      return start.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    } else if (selectedRange === "Week") {
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      if (start.getFullYear() === end.getFullYear()) {
        return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      }
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else if (selectedRange === "Month") {
      return currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } else if (selectedRange === "Year") {
      return start.getFullYear().toString();
    }
    return "";
  };

  const handleBarPress = (index: number, startDate: Date) => {
    const date = new Date(startDate);

    if (selectedRange === "Week") {
      date.setDate(date.getDate() + index);
      setCurrentDate(date);
      setSelectedRange("Day");
    } else if (selectedRange === "Month") {
      date.setDate(date.getDate() + index);
      setCurrentDate(date);
      setSelectedRange("Day");
    } else if (selectedRange === "Year") {
      date.setMonth(date.getMonth() + index);
      setCurrentDate(date);
      setSelectedRange("Month");
    }
  };

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
            <FixedYAxis
              chartMax={unifiedChartMax}
              isDark={isDark}
              width={yAxisWidth}
            />
            <View
              style={{
                marginLeft: yAxisWidth,
                width: chartScrollWidth,
                height: CHART_HEIGHT,
              }}
            >
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
                  width={chartScrollWidth}
                  axisLabels={prevChartProps.axisLabels}
                  progress={progress}
                  isDark={isDark}
                  paddingX={CHART_PADDING_X}
                  goalCalories={calorieGoal}
                  onBarPress={(index) => handleBarPress(index, prevStartDate)}
                  selectedRange={selectedRange}
                />
                <CalorieChart
                  data={currentData}
                  chartMax={unifiedChartMax}
                  barWidth={barWidth}
                  width={chartScrollWidth}
                  axisLabels={currentChartProps.axisLabels}
                  progress={progress}
                  isDark={isDark}
                  paddingX={CHART_PADDING_X}
                  goalCalories={calorieGoal}
                  onBarPress={(index) =>
                    handleBarPress(index, currentStartDate)
                  }
                  selectedRange={selectedRange}
                />
                <CalorieChart
                  data={nextPageData}
                  chartMax={unifiedChartMax}
                  barWidth={barWidth}
                  width={chartScrollWidth}
                  axisLabels={nextChartProps.axisLabels}
                  progress={progress}
                  isDark={isDark}
                  paddingX={CHART_PADDING_X}
                  goalCalories={calorieGoal}
                  onBarPress={(index) => handleBarPress(index, nextStartDate)}
                  selectedRange={selectedRange}
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

        {/* Highlights Section */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText
            style={[
              styles.cardTitle,
              { color: textColor, marginBottom: Spacing.md },
            ]}
          >
            Highlights
          </ThemedText>

          <View style={styles.insightsGrid}>
            <View
              style={[
                styles.insightBox,
                { backgroundColor: isDark ? "#333" : "#f5f5f5" },
              ]}
            >
              <Ionicons name="star-outline" size={24} color="#FFD700" />
              <ThemedText
                style={[styles.insightBoxValue, { color: textColor }]}
              >
                {totalMeals > 0 ? avgQuality : "N/A"}
              </ThemedText>
              <ThemedText
                style={[styles.insightBoxLabel, { color: secondaryText }]}
              >
                Avg Quality
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[
                styles.insightBox,
                { backgroundColor: isDark ? "#333" : "#f5f5f5" },
              ]}
              onPress={() => router.push("/screens/streaks-screen")}
            >
              <Ionicons name="trophy-outline" size={24} color="#FF9500" />
              <ThemedText
                style={[styles.insightBoxValue, { color: textColor }]}
              >
                {streak}
              </ThemedText>
              <ThemedText
                style={[styles.insightBoxLabel, { color: secondaryText }]}
              >
                {selectedRange === "Year" ? "Longest Streak" : "Current Streak"}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.insightsGrid}>
            <View
              style={[
                styles.insightBox,
                { backgroundColor: isDark ? "#333" : "#f5f5f5" },
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color={Colors.primary}
              />
              <ThemedText
                style={[styles.insightBoxValue, { color: textColor }]}
              >
                {daysGoalMet}/{totalDaysInPeriod}
              </ThemedText>
              <ThemedText
                style={[styles.insightBoxLabel, { color: secondaryText }]}
              >
                Calorie Goal Met
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[
                styles.insightBox,
                { backgroundColor: isDark ? "#333" : "#f5f5f5" },
              ]}
              onPress={() => {
                if (maxMeal) {
                  router.push({
                    pathname: "/meal-detail",
                    params: { id: maxMeal.id },
                  });
                }
              }}
              disabled={!maxMeal}
            >
              <Ionicons
                name="restaurant-outline"
                size={24}
                color={Colors.secondary.fat}
              />
              <ThemedText
                style={[styles.insightBoxValue, { color: textColor }]}
              >
                {Math.round(maxMealCalories)}
              </ThemedText>
              <ThemedText
                style={[styles.insightBoxLabel, { color: secondaryText }]}
              >
                Max Meal (kcal)
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.insightTipBox,
              {
                backgroundColor: isDark
                  ? "rgba(32, 150, 33, 0.15)"
                  : "rgba(32, 150, 33, 0.08)",
              },
            ]}
          >
            <View style={styles.insightTipHeader}>
              <Ionicons
                name="trending-up-outline"
                size={20}
                color={Colors.primary}
                style={{ marginRight: 8 }}
              />
              <ThemedText
                style={[styles.insightTipTitle, { color: Colors.primary }]}
              >
                Progress
              </ThemedText>
            </View>
            <ThemedText style={[styles.insightTipText, { color: textColor }]}>
              {daysGoalMet > prevDaysGoalMet
                ? "Better than last period!"
                : daysGoalMet < prevDaysGoalMet
                  ? "Keep pushing!"
                  : "Consistent with last period."}
            </ThemedText>
          </View>
        </View>

        {/* Trends Chart */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={[styles.cardHeader, { marginBottom: Spacing.sm }]}>
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>
              Trends
            </ThemedText>
          </View>

          <View style={styles.metricSelector}>
            {TREND_METRICS.map((m) => {
              const isSelected = visibleTrends.includes(m);
              const color = getMetricGradient(m)[0];

              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.metricChip,
                    {
                      backgroundColor: isSelected
                        ? color
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
                      isSelected && styles.metricChipTextSelected,
                      {
                        color: isSelected ? "#fff" : secondaryText,
                        zIndex: 1,
                      },
                    ]}
                  >
                    {m}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 240, width: trendsChartWidth }}>
            <ScrollView
              ref={trendsScrollRef}
              horizontal
              pagingEnabled={false}
              snapToInterval={trendsChartWidth}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ width: trendsChartWidth * 3 }}
              contentOffset={{ x: trendsChartWidth, y: 0 }}
              onMomentumScrollEnd={handleTrendsScrollEnd}
              scrollEventThrottle={16}
            >
              <TrendsChart
                data={combinedTrendData}
                labels={combinedTrendLabels}
                width={trendsChartWidth * 3}
                height={240}
                visibleTrends={visibleTrends}
                isDark={isDark}
                range={selectedRange}
                scaleCal={trendScaleCal}
                scaleMacro={trendScaleMacro}
                pointsPerPage={pointsPerPage}
              />
            </ScrollView>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText
            style={[
              styles.cardTitle,
              { color: textColor, marginBottom: Spacing.md },
            ]}
          >
            Overview
          </ThemedText>
          <View style={styles.insightsGrid}>
            <View
              style={[
                styles.insightBox,
                { backgroundColor: isDark ? "#333" : "#f5f5f5" },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={24}
                color={Colors.primary}
              />
              <ThemedText
                style={[styles.insightBoxValue, { color: textColor }]}
              >
                {daysTracked}
              </ThemedText>
              <ThemedText
                style={[styles.insightBoxLabel, { color: secondaryText }]}
              >
                Days Tracked
              </ThemedText>
            </View>

            <View
              style={[
                styles.insightBox,
                { backgroundColor: isDark ? "#333" : "#f5f5f5" },
              ]}
            >
              <Ionicons name="flame-outline" size={24} color="#FF9500" />
              <ThemedText
                style={[styles.insightBoxValue, { color: textColor }]}
              >
                {daysTracked > 0 ? Math.round(totalCalories / daysTracked) : 0}
              </ThemedText>
              <ThemedText
                style={[styles.insightBoxLabel, { color: secondaryText }]}
              >
                Avg Calories
              </ThemedText>
            </View>
          </View>

          <View
            style={[
              styles.insightTipBox,
              {
                backgroundColor: isDark
                  ? "rgba(32, 150, 33, 0.15)"
                  : "rgba(32, 150, 33, 0.08)",
              },
            ]}
          >
            <View style={styles.insightTipHeader}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={Colors.primary}
                style={{ marginRight: 8 }}
              />
              <ThemedText
                style={[styles.insightTipTitle, { color: Colors.primary }]}
              >
                Did you know?
              </ThemedText>
            </View>
            <ThemedText style={[styles.insightTipText, { color: textColor }]}>
              {daysGoalMet > prevDaysGoalMet
                ? `You're doing great! You met your goal ${daysGoalMet - prevDaysGoalMet} more times than last ${selectedRange.toLowerCase()}.`
                : "Consistency is key. Try to log your meals every day to get better insights!"}
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
          {
            paddingTop: insets.top + Spacing.md,
            borderBottomColor: borderColor,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View>
            <Text style={[styles.headerDate, { color: secondaryText }]}>
              {getDateRangeString().toUpperCase()}
            </Text>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Insights
            </Text>
          </View>
          {!isCurrentDate &&
            (selectedRange === "Day" || selectedRange === "Week") && (
              <TouchableOpacity
                style={[
                  styles.todayButton,
                  {
                    backgroundColor: segmentBg,
                  },
                ]}
                onPress={() => setCurrentDate(new Date())}
              >
                <ThemedText
                  style={[styles.todayButtonText, { color: textColor }]}
                >
                  Today
                </ThemedText>
              </TouchableOpacity>
            )}
        </View>
        {/* Segmented Control */}
        <View style={[styles.segmentedControl, { backgroundColor: segmentBg }]}>
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
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
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
    color: "#000",
    letterSpacing: 0.3,
  },
  headerDate: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "rgba(118, 118, 128, 0.12)",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  todayButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: "600",
    color: "#000",
  },
  metricSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
    marginBottom: Spacing.lg,
  },
  metricChip: {
    flex: 1,
    paddingVertical: 6,
    marginHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  metricChipSelected: {
    // Handled by LinearGradient
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
  insightsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  insightBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  insightBoxValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: Spacing.xs,
  },
  insightBoxLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  insightTipBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  insightTipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  insightTipTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  insightTipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
