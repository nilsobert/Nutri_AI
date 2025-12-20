import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
  LayoutAnimation,
  Platform,
  UIManager,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { useMeals } from "@/context/MealContext";
import { useUser } from "@/context/UserContext";
import { MS_TO_S, DAILY_CALORIE_GOAL, MIN_LOGGING_THRESHOLD } from "@/constants/values";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Helper Functions ---

function calculateGoalStreak(meals: any[], calorieGoal: number) {
  const now = new Date();
  let streak = 0;
  let currentDay = new Date(now);

  for (let i = 0; i < 365; i++) {
    const dayCalories = meals
      .filter((m) => {
        const d = new Date(m.timestamp * MS_TO_S);
        return (
          d.getDate() === currentDay.getDate() &&
          d.getMonth() === currentDay.getMonth() &&
          d.getFullYear() === currentDay.getFullYear()
        );
      })
      .reduce((sum, m) => sum + m.nutritionInfo.calories, 0);

    // Check if goal met: logged enough AND didn't exceed
    if (dayCalories >= MIN_LOGGING_THRESHOLD && dayCalories <= calorieGoal) {
      streak++;
      currentDay.setDate(currentDay.getDate() - 1);
    } else {
      if (i === 0) {
        // If today is not met yet, check yesterday to see if streak is alive
        // But for "current streak", usually we include today if met, or continue from yesterday
        // If today is 0 or partial, we check yesterday.
        // If yesterday was met, streak continues.
        // However, strictly speaking, if today is not met, the streak is what it was yesterday?
        // Or does it break? Usually apps allow "today" to be incomplete without breaking streak.
        currentDay.setDate(currentDay.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

function calculateBestGoalStreak(meals: any[], calorieGoal: number): number {
  if (meals.length === 0) return 0;

  const mealDates = new Set<string>();
  const dateToCals = new Map<string, number>();

  meals.forEach((meal) => {
    const d = new Date(meal.timestamp * MS_TO_S);
    const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    mealDates.add(dateKey);
    dateToCals.set(dateKey, (dateToCals.get(dateKey) || 0) + meal.nutritionInfo.calories);
  });

  if (mealDates.size === 0) return 0;

  const sortedDates = Array.from(mealDates)
    .map((dateStr) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month, day);
    })
    .sort((a, b) => a.getTime() - b.getTime());

  // We need to iterate through all days between first and last meal to check for breaks
  if (sortedDates.length === 0) return 0;

  const start = sortedDates[0];
  const end = new Date(); // Up to today
  end.setHours(0,0,0,0);

  let longestStreak = 0;
  let currentStreak = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const cals = dateToCals.get(key) || 0;

    if (cals >= MIN_LOGGING_THRESHOLD && cals <= calorieGoal) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 0;
    }
  }
  
  longestStreak = Math.max(longestStreak, currentStreak);
  return longestStreak;
}

interface DayStatus {
  date: Date;
  status: 'met' | 'exceeded' | 'insufficient' | 'none' | 'future';
  isToday: boolean;
}

interface WeekData {
  id: string;
  startDate: Date;
  endDate: Date;
  days: DayStatus[];
  metCount: number;
  isCurrentWeek: boolean;
  score: 'perfect' | 'good' | 'low';
  yearLabel?: string;
}

function getWeeks(meals: any[], count: number, calorieGoal: number): WeekData[] {
  const weeks: WeekData[] = [];
  const now = new Date();
  
  // Start from the beginning of the current week (Monday)
  const currentWeekStart = new Date(now);
  const day = currentWeekStart.getDay();
  const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
  currentWeekStart.setDate(diff);
  currentWeekStart.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - i * 7);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const days: DayStatus[] = [];
    let metCount = 0;

    for (let j = 0; j < 7; j++) {
      const d = new Date(start);
      d.setDate(d.getDate() + j);
      
      const dayCalories = meals
        .filter((m) => {
          const mealDate = new Date(m.timestamp * MS_TO_S);
          return (
            mealDate.getDate() === d.getDate() &&
            mealDate.getMonth() === d.getMonth() &&
            mealDate.getFullYear() === d.getFullYear()
          );
        })
        .reduce((sum, m) => sum + m.nutritionInfo.calories, 0);

      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      
      const isFuture = d > now;

      let status: 'met' | 'exceeded' | 'insufficient' | 'none' | 'future' = 'none';

      if (isFuture) {
        status = 'future';
      } else if (dayCalories === 0) {
        status = 'none';
      } else if (dayCalories < MIN_LOGGING_THRESHOLD) {
        status = 'insufficient';
      } else if (dayCalories <= calorieGoal) {
        status = 'met';
        metCount++;
      } else {
        status = 'exceeded';
      }

      days.push({ date: d, status, isToday });
    }

    let score: 'perfect' | 'good' | 'low' = 'low';
    if (metCount === 7) score = 'perfect';
    else if (metCount >= 4) score = 'good';

    weeks.push({
      id: start.toISOString(),
      startDate: start,
      endDate: end,
      days,
      metCount,
      isCurrentWeek: i === 0,
      score,
    });
  }

  // Post-process to add year labels
  if (weeks.length > 0) {
    let lastYear = weeks[0].startDate.getFullYear();
    for (let i = 1; i < weeks.length; i++) {
      const currentYear = weeks[i].startDate.getFullYear();
      if (currentYear !== lastYear) {
        weeks[i].yearLabel = currentYear.toString();
        lastYear = currentYear;
      }
    }
  }

  return weeks;
}

// --- Components ---

const WeekNode = ({
  week,
  isExpanded,
  onToggle,
  isDark,
  index,
}: {
  week: WeekData;
  isExpanded: boolean;
  onToggle: () => void;
  isDark: boolean;
  index: number;
}) => {
  const bgColor = isDark ? "#333" : "#fff";
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";

  // Colors based on score
  let nodeColor = Colors.grey.light;
  let iconName: any = "star-outline";
  let iconColor = secondaryText;

  if (week.score === 'perfect') {
    nodeColor = Colors.primary; // Blue/Green
    iconName = "trophy";
    iconColor = "#fff";
  } else if (week.score === 'good') {
    nodeColor = Colors.secondary.protein; // Green
    iconName = "star";
    iconColor = "#fff";
  } else {
    nodeColor = isDark ? "#444" : "#e0e0e0";
    iconName = "ellipse-outline";
    iconColor = secondaryText;
  }

  const dateRange = `${week.startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${week.endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;

  return (
    <View>
      {week.yearLabel && (
        <View style={styles.yearMarker}>
          <View style={[styles.yearLine, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]} />
          <ThemedText style={styles.yearText}>{week.yearLabel}</ThemedText>
          <View style={[styles.yearLine, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]} />
        </View>
      )}
      <View style={styles.nodeRow}>
        {/* Connector Line */}
        <View style={styles.connectorLine} />

        {/* Node Content */}
        <TouchableOpacity
          style={[
            styles.nodeCard,
            { 
              backgroundColor: bgColor,
              alignSelf: 'center',
            },
            week.score === 'perfect' && {
              shadowColor: Colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            },
          ]}
          onPress={onToggle}
          activeOpacity={0.8}
        >
          <View style={styles.nodeHeader}>
            <View style={[styles.iconCircle, { backgroundColor: nodeColor }]}>
              <Ionicons name={iconName} size={20} color={iconColor} />
            </View>
            <View style={styles.nodeInfo}>
              <ThemedText style={[styles.nodeTitle, { color: textColor }]}>
                {week.isCurrentWeek ? "Current Week" : dateRange}
              </ThemedText>
              <ThemedText style={[styles.nodeSubtitle, { color: secondaryText }]}>
                {week.metCount}/7 Days Met
              </ThemedText>
            </View>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={secondaryText} 
            />
          </View>

          {isExpanded && (
            <Animated.View 
              entering={FadeInDown.duration(300)}
              style={styles.expandedContent}
            >
              <View style={styles.daysRow}>
                {week.days.map((day, i) => {
                  let dayColor = isDark ? "#444" : "#f0f0f0";
                  let dayIcon = null;
                  let dayIconColor = "#fff";

                  if (day.status === 'met') {
                    dayColor = Colors.primary;
                    dayIcon = "checkmark";
                  } else if (day.status === 'exceeded') {
                    dayColor = Colors.secondary.fat;
                    dayIcon = "alert";
                  }
                  // Insufficient and None are treated as "No Logs" (Grey)

                  return (
                    <View key={i} style={styles.dayColumn}>
                      <ThemedText style={[styles.dayName, { color: secondaryText }]}>
                        {day.date.toLocaleDateString("en-US", { weekday: "narrow" }).charAt(0)}
                      </ThemedText>
                      <View
                        style={[
                          styles.dayStatusCircle,
                          { backgroundColor: dayColor },
                          day.isToday && (day.status === 'none' || day.status === 'insufficient') && { borderWidth: 2, borderColor: Colors.primary, backgroundColor: 'transparent' },
                        ]}
                      >
                        {dayIcon && (
                          <Ionicons name={dayIcon as any} size={12} color={dayIconColor} />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
              
              {/* Legend for expanded view */}
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                  <ThemedText style={styles.legendText}>Met</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.secondary.fat }]} />
                  <ThemedText style={styles.legendText}>Over</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: isDark ? "#444" : "#f0f0f0" }]} />
                  <ThemedText style={styles.legendText}>No Logs</ThemedText>
                </View>
              </View>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function GoalsMetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meals } = useMeals();
  const { goals } = useUser();
  const calorieGoal = goals?.calories || DAILY_CALORIE_GOAL;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const currentStreak = useMemo(() => calculateGoalStreak(meals, calorieGoal), [meals, calorieGoal]);
  const bestStreak = useMemo(() => calculateBestGoalStreak(meals, calorieGoal), [meals, calorieGoal]);
  
  const totalDaysMet = useMemo(() => {
    const uniqueDays = new Set<string>();
    const dateToCals = new Map<string, number>();
    
    meals.forEach(m => {
        const d = new Date(m.timestamp * MS_TO_S);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        dateToCals.set(key, (dateToCals.get(key) || 0) + m.nutritionInfo.calories);
    });

    let count = 0;
    dateToCals.forEach((cals) => {
        if (cals >= MIN_LOGGING_THRESHOLD && cals <= calorieGoal) {
            count++;
        }
    });
    return count;
  }, [meals, calorieGoal]);

  const [weeksCount, setWeeksCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const weeks = useMemo(() => getWeeks(meals, weeksCount, calorieGoal), [meals, weeksCount, calorieGoal]);
  const [expandedWeekId, setExpandedWeekId] = useState<string | null>(null);

  useEffect(() => {
    if (weeks.length > 0 && !expandedWeekId) {
      setExpandedWeekId(weeks[0].id);
    }
  }, [weeks]);

  const handleToggleWeek = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedWeekId(expandedWeekId === id ? null : id);
  };

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setWeeksCount(prev => prev + 12);
      setIsLoadingMore(false);
    }, 500);
  };

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;

  const renderHeader = () => (
    <View>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary.protein]}
          style={styles.streakRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.streakRingInner, { backgroundColor: bgColor }]}>
            <Ionicons
              name="trophy"
              size={40}
              color={Colors.primary}
              style={{ marginBottom: 2 }}
            />
            <ThemedText style={styles.streakCount}>{currentStreak}</ThemedText>
            <ThemedText style={styles.streakLabel}>Goal Streak</ThemedText>
          </View>
        </LinearGradient>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: isDark ? "#333" : "#fff" }]}>
          <ThemedText style={styles.statValue}>{bestStreak}</ThemedText>
          <ThemedText style={styles.statLabel}>Best Streak</ThemedText>
        </View>
        <View style={[styles.statBox, { backgroundColor: isDark ? "#333" : "#fff" }]}>
          <ThemedText style={styles.statValue}>{totalDaysMet}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Days Met</ThemedText>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      {isLoadingMore && <ActivityIndicator size="small" color={Colors.primary} />}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
          <ThemedText style={{ color: Colors.primary, fontSize: 17 }}>
            Back
          </ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Calorie Goals</ThemedText>
      </BlurView>

      <View style={styles.listContainer}>
        <View style={[styles.centerLine, { backgroundColor: isDark ? "#333" : "#e0e0e0", top: 0 }]} />
        <FlatList
          data={weeks}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <WeekNode
              week={item}
              index={index}
              isExpanded={expandedWeekId === item.id}
              onToggle={() => handleToggleWeek(item.id)}
              isDark={isDark}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingTop: 60 + insets.top, paddingBottom: Spacing.xl }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    position: "absolute",
    left: Spacing.lg,
    bottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  listContainer: {
    flex: 1,
    position: 'relative',
  },
  heroSection: {
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  streakRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  streakRingInner: {
    width: 156,
    height: 156,
    borderRadius: 78,
    justifyContent: "center",
    alignItems: "center",
  },
  streakCount: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 2,
    lineHeight: 56,
  },
  streakLabel: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    ...Shadows.small,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    bottom: 0,
    width: 4,
    marginLeft: -2,
    borderRadius: 2,
    zIndex: 0,
  },
  nodeRow: {
    marginBottom: Spacing.lg,
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  connectorLine: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '50%',
    height: 2,
    backgroundColor: 'transparent',
  },
  nodeCard: {
    width: SCREEN_WIDTH * 0.85,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.small,
    zIndex: 1,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  nodeInfo: {
    flex: 1,
  },
  nodeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  nodeSubtitle: {
    fontSize: 12,
  },
  expandedContent: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayColumn: {
    alignItems: "center",
    gap: 6,
  },
  dayName: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  dayStatusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    height: 60,
  },
  yearMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
    width: '100%',
    paddingHorizontal: Spacing.xl,
  },
  yearLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  yearText: {
    marginHorizontal: Spacing.md,
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#8E8E93',
  },
});
