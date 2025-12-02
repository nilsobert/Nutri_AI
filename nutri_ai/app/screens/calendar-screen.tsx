// CalendarScreen.tsx
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

import { MealTypes, generateYearMeals } from "../utils/generator";

const mealCategories: (keyof MealTypes)[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];
const categoryLabels: Record<keyof MealTypes, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export default function CalendarScreen() {
  const today = new Date();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const GREEN = Colors.primary;

  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [yearMeals, setYearMeals] = useState<
    Record<
      string,
      Record<
        keyof MealTypes,
        { calories: number; protein: number; carbs: number; fat: number }
      >
    >
  >({});

  // Generate meals once
  useEffect(() => {
    const meals = generateYearMeals();
    setYearMeals(meals);
  }, []);

  // Month matrix
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

  const isSameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const handleDayPress = (day: number) => {
    const dateObj = new Date(year, month, day);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setExpanded({});
  };

  const toggleExpand = (category: string) => {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  type GeneratedMeal = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  const mealsForSelected: Record<keyof MealTypes, GeneratedMeal> = yearMeals[
    selectedDate
  ] || {
    breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    snack: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  };

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

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Segmented control */}
      <View
        style={[
          styles.segmentWrap,
          { backgroundColor: isDark ? "#2a2a2a" : "#e8e8e8" },
        ]}
      >
        {(["month", "year"] as const).map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => setViewMode(v)}
            style={[
              styles.segment,
              viewMode === v && { backgroundColor: GREEN },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: viewMode === v ? "white" : GREEN },
              ]}
            >
              {v.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        {viewMode === "month" && (
          <>
            <TouchableOpacity onPress={prevMonth}>
              <Text style={[styles.arrow, { color: GREEN }]}>‹</Text>
            </TouchableOpacity>
            <View style={styles.centeredHeader}>
              <Text style={[styles.headerTitle, { color: textColor }]}>
                {monthNames[month]} {year}
              </Text>
            </View>
            <TouchableOpacity onPress={nextMonth}>
              <Text style={[styles.arrow, { color: GREEN }]}>›</Text>
            </TouchableOpacity>
          </>
        )}
        {viewMode === "year" && (
          <View style={styles.yearHeader}>
            <TouchableOpacity onPress={prevYear}>
              <Text style={[styles.arrow, { color: GREEN }]}>‹</Text>
            </TouchableOpacity>
            <View style={styles.centeredHeader}>
              <Text style={[styles.headerTitle, { color: textColor }]}>
                {year}
              </Text>
            </View>
            <TouchableOpacity onPress={nextYear}>
              <Text style={[styles.arrow, { color: GREEN }]}>›</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Month View */}
      {viewMode === "month" && (
        <View>
          <View style={styles.weekLabelsRow}>
            {["M", "T", "W", "T", "F", "S", "S"].map((ini, i) => (
              <Text key={i} style={[styles.weekLabel, { color: "#666" }]}>
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
                const dayStr = day
                  ? new Date(year, month, day).toISOString().split("T")[0]
                  : "";
                const hasMeal = dayStr && yearMeals[dayStr];

                return (
                  <View key={cIdx} style={styles.gridCell}>
                    {day ? (
                      <TouchableOpacity
                        onPress={() => handleDayPress(day)}
                        style={[
                          styles.dayCircle,
                          isToday && {
                            backgroundColor: GREEN,
                            borderRadius: 21,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            { color: isToday ? "white" : textColor },
                          ]}
                        >
                          {day}
                        </Text>
                        {/* Green dot for days with meal info (except today) */}
                        {hasMeal && !isToday && (
                          <View style={styles.greenDot} />
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

      {/* Year View */}
      {viewMode === "year" && (
        <ScrollView contentContainerStyle={styles.yearGrid}>
          {yearGrid.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.yearCell,
                { backgroundColor: cardBg },
                Shadows.small,
              ]}
              onPress={() => {
                setMonth(m);
                setViewMode("month");
              }}
            >
              <Text style={[styles.yearMonthText, { color: textColor }]}>
                {monthNames[m]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text style={[styles.dateTitle, { color: GREEN }]}>{selectedDate}</Text>

      {/* Meal Nutritional Info */}
      <ScrollView style={styles.mealList}>
        {mealCategories.map((category) => (
          <View
            key={category}
            style={[styles.categoryContainer, { backgroundColor: cardBg }]}
          >
            <TouchableOpacity
              style={[
                styles.categoryHeader,
                { backgroundColor: isDark ? "#262727" : "#E3F2FD" },
              ]}
              onPress={() => toggleExpand(category)}
            >
              <Text style={[styles.categoryTitle, { color: GREEN }]}>
                {categoryLabels[category]}
              </Text>
              <Ionicons
                name={expanded[category] ? "calendar" : "calendar"}
                size={20}
                color={GREEN}
              />
            </TouchableOpacity>
            {expanded[category] && (
              <View style={styles.mealDetails}>
                <Text style={styles.nutritionText}>
                  Calories: {mealsForSelected[category].calories}
                </Text>
                <Text style={styles.nutritionText}>
                  Protein: {mealsForSelected[category].protein} g
                </Text>
                <Text style={styles.nutritionText}>
                  Carbs: {mealsForSelected[category].carbs} g
                </Text>
                <Text style={styles.nutritionText}>
                  Fat: {mealsForSelected[category].fat} g
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl },
  segmentWrap: {
    flexDirection: "row",
    padding: 4,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  segmentText: { fontWeight: Typography.weights.semibold },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  centeredHeader: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
  },
  arrow: { fontSize: 32, paddingHorizontal: 12 },
  weekLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontWeight: Typography.weights.semibold,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  gridCell: { width: `${100 / 7}%`, alignItems: "center" },
  dayCircle: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: { fontSize: Typography.sizes.base },
  dayEmpty: { width: 42, height: 42 },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingTop: Spacing.md,
  },
  yearCell: {
    width: "48%",
    paddingVertical: 18,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  yearHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  yearMonthText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  dateTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: "bold",
    marginVertical: 10,
  },
  mealList: { marginHorizontal: 0 },
  categoryContainer: { marginBottom: 10, borderRadius: 8, overflow: "hidden" },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  categoryTitle: { fontSize: Typography.sizes.base, fontWeight: "600" },
  mealDetails: { paddingHorizontal: 16, paddingVertical: 8 },
  nutritionText: { color: "white" },
});
