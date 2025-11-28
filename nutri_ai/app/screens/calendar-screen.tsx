import { router } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Dummy meal data
const dummyMeals: Record<
  string,
  Record<string, Array<{ name: string; details: string }>>
> = {
  "2025-11-11": {
    breakfast: [{ name: "Oatmeal", details: "Oats, banana, honey" }],
    lunch: [{ name: "Chicken Salad", details: "Chicken, lettuce, tomato" }],
    dinner: [{ name: "Pasta", details: "Pasta, tomato sauce, cheese" }],
    snack: [{ name: "Apple", details: "Green apple" }],
    other: [],
  },
  "2025-11-12": { breakfast: [], lunch: [], dinner: [], snack: [], other: [] },
  "2025-11-13": {
    breakfast: [{ name: "Toast", details: "Whole grain, butter" }],
    lunch: [],
    dinner: [],
    snack: [],
    other: [],
  },
};

const mealCategories = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "other",
] as const;
const categoryLabels: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  other: "Other",
};

const getMealIcon = (category: string) => {
  switch (category) {
    case "breakfast":
      return "sunny-outline";
    case "lunch":
      return "restaurant-outline";
    case "dinner":
      return "moon-outline";
    case "snack":
      return "cafe-outline";
    default:
      return "fast-food-outline";
  }
};

export default function MergedCalendar() {
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
  const GREEN = Colors.primary;

  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0],
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
    const dateStr = dateObj.toISOString().split("T")[0];
    setSelectedDate(dateStr);
    setExpanded({});
  };

  const toggleExpand = (category: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const mealsForSelected = dummyMeals[selectedDate] || {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
    other: [],
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 60 + insets.top },
        ]}
      >
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
                  const dayStr = day
                    ? new Date(year, month, day).toISOString().split("T")[0]
                    : "";
                  const hasMeal =
                    dayStr &&
                    dummyMeals[dayStr] &&
                    Object.values(dummyMeals[dayStr]).some(
                      (arr) => arr.length > 0,
                    );

                  return (
                    <View key={cIdx} style={styles.gridCell}>
                      {day ? (
                        <TouchableOpacity
                          onPress={() => handleDayPress(day)}
                          style={[
                            styles.dayCircle,
                            isToday && {
                              backgroundColor: GREEN,
                              shadowColor: "#000",
                              shadowOpacity: 0.15,
                              shadowRadius: 4,
                            },
                            hasMeal &&
                              !isToday && { borderWidth: 2, borderColor: GREEN },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              {
                                color: isToday ? "white" : textColor,
                                fontWeight: isToday ? "700" : "400",
                              },
                            ]}
                          >
                            {day}
                          </Text>
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
          </View>
        )}

        {/* Selected Date */}
        <Text style={[styles.dateTitle, { color: GREEN }]}>{selectedDate}</Text>

        {/* Meal List */}
        <View style={styles.mealList}>
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons
                    name={getMealIcon(category) as any}
                    size={20}
                    color={GREEN}
                  />
                  <Text style={[styles.categoryTitle, { color: GREEN }]}>
                    {categoryLabels[category]}
                  </Text>
                </View>
                <Ionicons
                  name={expanded[category] ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={GREEN}
                />
              </TouchableOpacity>
              {expanded[category] && (
                <View style={styles.mealDetails}>
                  {mealsForSelected[category].length === 0 ? (
                    <Text style={[styles.noMealText, { color: secondaryText }]}>
                      No meals recorded.
                    </Text>
                  ) : (
                    mealsForSelected[category].map((meal, idx) => (
                      <View key={idx} style={styles.mealItem}>
                        <Text style={[styles.mealName, { color: textColor }]}>
                          {meal.name}
                        </Text>
                        <Text style={[styles.mealDesc, { color: secondaryText }]}>
                          {meal.details}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Glass Header */}
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.absoluteHeader,
          {
            paddingTop: insets.top,
            height: 44 + insets.top,
            borderBottomColor: isDark ? "#333" : "#ccc",
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitleText, { color: textColor }]}>
            Calendar
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: Spacing.xl,
  },
  absoluteHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 100,
    justifyContent: "center",
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 44,
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: "600",
  },
  doneButtonText: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: "600",
  },
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
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: { fontSize: Typography.sizes.base },
  dayEmpty: { width: 42, height: 42 },
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
    width: "100%",
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
  mealItem: { marginBottom: 8 },
  mealName: { fontSize: Typography.sizes.base, fontWeight: "500" },
  mealDesc: { fontSize: Typography.sizes.xs, opacity: 0.7 },
  noMealText: {
    fontSize: Typography.sizes.xs,
    fontStyle: "italic",
    opacity: 0.6,
  },
});
