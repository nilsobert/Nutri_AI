import { router } from "expo-router";
import React, { useState } from "react";
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
} from "../constants/theme";

export default function IOSStyleCalendar() {
  const today = new Date();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // THEME COLORS
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
    const selectedDate = new Date(year, month, day);
    router.push({
      pathname: "/screens/home-screen",
      params: { selectedDate: selectedDate.toISOString() },
    });
  };

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
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            { color: textColor },
                            isToday && { color: "white", fontWeight: "700" },
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
  },
  /* Segmented Control */
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
  segmentText: {
    fontWeight: Typography.weights.semibold,
  },
  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  centeredHeader: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
  },
  arrow: {
    fontSize: 32,
    paddingHorizontal: 12,
  },
  /* Month Labels */
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
  /* Calendar Grid */
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  gridCell: {
    width: `${100 / 7}%`,
    alignItems: "center",
  },
  dayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontSize: Typography.sizes.base,
  },
  dayEmpty: {
    width: 42,
    height: 42,
  },
  /* Year Grid */
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
});
