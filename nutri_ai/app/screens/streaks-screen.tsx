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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { useMeals } from "@/context/MealContext";
import { MS_TO_S } from "@/constants/values";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Helper Functions ---

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

function calculateLongestStreakOverall(meals: any[]): number {
  if (meals.length === 0) return 0;

  const mealDates = new Set<string>();
  meals.forEach((meal) => {
    const d = new Date(meal.timestamp * MS_TO_S);
    const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    mealDates.add(dateKey);
  });

  if (mealDates.size === 0) return 0;

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

    const diffTime = currentDate.getTime() - prevDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);
  return longestStreak;
}

interface DayStatus {
  date: Date;
  hasMeal: boolean;
  isToday: boolean;
  isFuture: boolean;
}

interface WeekData {
  id: string;
  startDate: Date;
  endDate: Date;
  days: DayStatus[];
  loggedCount: number;
  isCurrentWeek: boolean;
  score: 'perfect' | 'good' | 'low';
}

function getWeeks(meals: any[], count: number): WeekData[] {
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
    let loggedCount = 0;

    for (let j = 0; j < 7; j++) {
      const d = new Date(start);
      d.setDate(d.getDate() + j);
      
      const hasMeal = meals.some((m) => {
        const mealDate = new Date(m.timestamp * MS_TO_S);
        return (
          mealDate.getDate() === d.getDate() &&
          mealDate.getMonth() === d.getMonth() &&
          mealDate.getFullYear() === d.getFullYear()
        );
      });

      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      
      const isFuture = d > now;

      if (hasMeal) loggedCount++;

      days.push({ date: d, hasMeal, isToday, isFuture });
    }

    let score: 'perfect' | 'good' | 'low' = 'low';
    if (loggedCount === 7) score = 'perfect';
    else if (loggedCount >= 4) score = 'good';

    weeks.push({
      id: start.toISOString(),
      startDate: start,
      endDate: end,
      days,
      loggedCount,
      isCurrentWeek: i === 0,
      score,
    });
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
  const isLeft = index % 2 === 0;
  const bgColor = isDark ? "#333" : "#fff";
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";

  // Colors based on score
  let nodeColor = Colors.grey.light;
  let iconName: any = "star-outline";
  let iconColor = secondaryText;

  if (week.score === 'perfect') {
    nodeColor = Colors.secondary.carbs; // Orange/Gold-ish
    iconName = "trophy";
    iconColor = "#fff";
  } else if (week.score === 'good') {
    nodeColor = Colors.primary; // Blue
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
            shadowColor: Colors.secondary.carbs,
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
              {week.loggedCount}/7 Days
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
              {week.days.map((day, i) => (
                <View key={i} style={styles.dayColumn}>
                  <ThemedText style={[styles.dayName, { color: secondaryText }]}>
                    {day.date.toLocaleDateString("en-US", { weekday: "narrow" }).charAt(0)}
                  </ThemedText>
                  <View
                    style={[
                      styles.dayStatusCircle,
                      day.hasMeal && { backgroundColor: Colors.secondary.carbs },
                      !day.hasMeal && day.isToday && { borderWidth: 2, borderColor: Colors.secondary.carbs },
                      !day.hasMeal && !day.isToday && { backgroundColor: isDark ? "#444" : "#f0f0f0" },
                    ]}
                  >
                    {day.hasMeal && (
                      <Ionicons name="flame" size={12} color="#fff" />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function StreaksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meals } = useMeals();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const currentStreak = useMemo(() => calculateStreak(meals), [meals]);
  const longestStreak = useMemo(
    () => calculateLongestStreakOverall(meals),
    [meals],
  );
  const totalDaysLogged = useMemo(() => {
    const uniqueDays = new Set(
      meals.map((m) => {
        const d = new Date(m.timestamp * MS_TO_S);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }),
    );
    return uniqueDays.size;
  }, [meals]);

  const [weeksCount, setWeeksCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const weeks = useMemo(() => getWeeks(meals, weeksCount), [meals, weeksCount]);
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
    // Simulate network delay or just wait a bit for UX
    setTimeout(() => {
      setWeeksCount(prev => prev + 12);
      setIsLoadingMore(false);
    }, 500);
  };

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;

  const renderHeader = () => (
    <View>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={[Colors.secondary.carbs, Colors.secondary.fat]}
          style={styles.streakRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.streakRingInner, { backgroundColor: bgColor }]}>
            <Ionicons
              name="flame"
              size={40}
              color={Colors.secondary.carbs}
              style={{ marginBottom: 2 }}
            />
            <ThemedText style={styles.streakCount}>{currentStreak}</ThemedText>
            <ThemedText style={styles.streakLabel}>Day Streak</ThemedText>
          </View>
        </LinearGradient>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: isDark ? "#333" : "#fff" }]}>
          <ThemedText style={styles.statValue}>{longestStreak}</ThemedText>
          <ThemedText style={styles.statLabel}>Longest Streak</ThemedText>
        </View>
        <View style={[styles.statBox, { backgroundColor: isDark ? "#333" : "#fff" }]}>
          <ThemedText style={styles.statValue}>{totalDaysLogged}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Days Logging</ThemedText>
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
        <ThemedText style={styles.headerTitle}>Your Journey</ThemedText>
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
    shadowColor: "#FF9500",
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
});
