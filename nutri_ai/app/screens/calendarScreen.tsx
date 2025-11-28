import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Colors, Typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Dummy meal data for demonstration
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
  "2025-11-12": {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
    other: [],
  },
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

const getMarkedDates = (meals: typeof dummyMeals) => {
  const marked: Record<string, any> = {};
  Object.keys(meals).forEach((date) => {
    const hasMeal = mealCategories.some((cat) => meals[date][cat].length > 0);
    if (hasMeal) {
      // Use a slightly larger dot for days with meals. Keep the simple marking
      // so the calendar retains its native look.
      marked[date] = {
        marked: true,
        dotColor: Colors.primary,
        dotStyle: {
          width: 11,
          height: 11,
          borderRadius: 6,
        },
      };
    }
  });
  return marked;
};

type CalendarScreenProps = {
  compact?: boolean;
  onClose?: () => void;
};

const CalendarScreen: React.FC<CalendarScreenProps> = ({ compact = false, onClose }) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    Object.keys(dummyMeals)[0],
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const mealsForSelected = dummyMeals[selectedDate] || {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
    other: [],
  };

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setExpanded({});
  };

  const toggleExpand = (category: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const cardBg = isDark ? Colors.cardBackground.dark : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;

  return (
    <View style={[styles.container, compact && styles.compactContainer, { backgroundColor: bgColor }]}>
      {/* Modal header to avoid overlapping calendar header */}
      {onClose && (
        <View style={[styles.modalHeader, { backgroundColor: bgColor }]}>
          <Text style={[styles.modalTitle, { color: textColor }]}>Calendar</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose} activeOpacity={0.8}>
            <Feather name="minimize-2" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}
      <View style={[styles.calendarWrapper, { backgroundColor: cardBg }]}
      >
        {(() => {
          const baseMarked = getMarkedDates(dummyMeals);
          const markedDates = {
            ...baseMarked,
            [selectedDate]: {
              ...(baseMarked[selectedDate] || {}),
              selected: true,
              selectedColor: Colors.primary,
              dotColor: Colors.primary,
            },
          };

          return (
            <Calendar
              markedDates={markedDates}
              onDayPress={handleDayPress}
              theme={{
                calendarBackground: cardBg,
                selectedDayBackgroundColor: Colors.primary,
                selectedDayTextColor: "#fff",
                todayTextColor: Colors.primary,
                dotColor: Colors.primary,
                arrowColor: Colors.primary,
                monthTextColor: textColor,
                textSectionTitleColor: textColor,
                dayTextColor: textColor,
                textDisabledColor: isDark ? "#555" : "#cfcfcf",
                // Increase overall calendar font sizes for better readability
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={[styles.calendar, compact && styles.compactCalendar, { backgroundColor: 'transparent' }]}
            />
          );
        })()}
      </View>
      <Text style={styles.dateTitle}>{selectedDate}</Text>
      <ScrollView style={[styles.mealList, compact && styles.mealListCompact]}>
        {mealCategories.map((category) => (
          <View key={category} style={styles.categoryContainer}>
            <TouchableOpacity
              style={[styles.categoryHeader, { backgroundColor: isDark ? '#262727' : '#E3F2FD' }]}
              onPress={() => toggleExpand(category)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryTitle, { color: Colors.primary }]}> 
                {categoryLabels[category]}
              </Text>
              <Ionicons
                name={expanded[category] ? "calendar" : "calendar"}
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>
            {expanded[category] && (
              <View style={styles.mealDetails}>
                {mealsForSelected[category].length === 0 ? (
                  <Text style={styles.noMealText}>No meals recorded.</Text>
                ) : (
                  mealsForSelected[category].map((meal, idx) => (
                    <View key={idx} style={styles.mealItem}>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.mealDesc}>{meal.details}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default CalendarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingTop: 40,
  },
  compactContainer: {
    flex: 0,
    paddingTop: 8,
    paddingBottom: 8,
  },
  calendar: {
    marginHorizontal: 0,
    borderRadius: 0,
    elevation: 0,
    marginBottom: 0,
  },
  compactCalendar: {
    marginHorizontal: 0,
    borderRadius: 8,
    height: 320,
    marginBottom: 6,
  },
  calendarWrapper: {
    marginHorizontal: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
  },
  dateTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 8,
    color: Colors.primary,
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 44 : 16,
    paddingBottom: 12,
    zIndex: 30,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
  },
  modalClose: {
    padding: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.light,
  },
  closeButton: {
    position: "absolute",
    right: 12,
    top: Platform.OS === "ios" ? 48 : 16,
    zIndex: 20,
    backgroundColor: "transparent",
    padding: 6,
  },
  mealList: {
    marginHorizontal: 10,
  },
  mealListCompact: {
    maxHeight: 180,
  },
  categoryContainer: {
    marginBottom: 10,
    backgroundColor: Colors.cardBackground.light,
    borderRadius: 8,
    overflow: "hidden",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: Colors.cardBackground.light,
  },
  categoryTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: "600",
    color: Colors.primary,
  },
  mealDetails: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.cardBackground.light,
  },
  mealItem: {
    marginBottom: 8,
  },
  mealName: {
    fontSize: Typography.sizes.base,
    fontWeight: "500",
    color: Colors.text.light,
  },
  mealDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.light,
    opacity: 0.7,
  },
  noMealText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.light,
    fontStyle: "italic",
    opacity: 0.6,
  },
});
