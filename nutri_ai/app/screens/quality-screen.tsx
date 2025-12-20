import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  FlatList,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Svg, Path, Line, Text as SvgText, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { useMeals } from "@/context/MealContext";
import { MS_TO_S } from "@/constants/values";
import { Colors, Spacing, BorderRadius, Shadows, Typography } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_HEIGHT = 200;
const CHART_WIDTH = SCREEN_WIDTH * 2; // Make chart wider for scrolling

// --- Helper Functions ---

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

export default function QualityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meals } = useMeals();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const cardBg = isDark ? Colors.cardBackground.dark : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";

  // --- Data Processing ---

  const { avgQuality, totalMeals, highQualityMeals, chartData } = useMemo(() => {
    if (meals.length === 0) {
      return { avgQuality: 0, totalMeals: 0, highQualityMeals: [], chartData: [] };
    }

    const totalQ = meals.reduce((sum, m) => sum + m.mealQuality.mealQualityScore, 0);
    const avg = totalQ / meals.length;

    // Top 10 meals by quality
    const sortedMeals = [...meals].sort((a, b) => b.mealQuality.mealQualityScore - a.mealQuality.mealQualityScore).slice(0, 10);

    // Chart Data (Last 30 days)
    const now = new Date();
    const last30Days = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      return d;
    });

    const data = last30Days.map(date => {
      const dayMeals = meals.filter(m => {
        const mDate = new Date(m.timestamp * MS_TO_S);
        return mDate.getDate() === date.getDate() &&
               mDate.getMonth() === date.getMonth() &&
               mDate.getFullYear() === date.getFullYear();
      });

      if (dayMeals.length === 0) return { date, score: 0, hasData: false };
      
      const dayTotal = dayMeals.reduce((sum, m) => sum + m.mealQuality.mealQualityScore, 0);
      return { date, score: dayTotal / dayMeals.length, hasData: true };
    });

    return {
      avgQuality: avg,
      totalMeals: meals.length,
      highQualityMeals: sortedMeals,
      chartData: data
    };
  }, [meals]);

  // --- Chart Rendering ---
  
  const renderChart = () => {
    if (chartData.length < 2) return null;

    const maxScore = 10;
    const stepX = CHART_WIDTH / (chartData.length - 1);
    const getY = (score: number) => CHART_HEIGHT - (score / maxScore) * CHART_HEIGHT;

    const points = chartData.map((d, i) => ({
      x: i * stepX,
      y: getY(d.hasData ? d.score : 0)
    }));

    // Filter points to only draw lines between existing data points if needed, 
    // but for simplicity we'll treat 0 as 0 quality if no data, or maybe skip?
    // Better: Connect only points with data.
    // For this implementation, let's just show the points that have data.
    
    const validPoints = chartData.map((d, i) => ({
        x: i * stepX,
        y: getY(d.score),
        hasData: d.hasData
    })).filter(p => p.hasData);

    return (
      <View style={{ height: CHART_HEIGHT + 30, marginTop: Spacing.lg }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.sm }}
          contentOffset={{ x: CHART_WIDTH - SCREEN_WIDTH + Spacing.xl * 2, y: 0 }} // Start at end
        >
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
            <Defs>
                <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.5" />
                    <Stop offset="1" stopColor={Colors.primary} stopOpacity="0" />
                </SvgLinearGradient>
            </Defs>
            
            {/* Grid Lines */}
            {[0, 2.5, 5, 7.5, 10].map(val => (
                <Line 
                    key={val}
                    x1={0} y1={getY(val)}
                    x2={CHART_WIDTH} y2={getY(val)}
                    stroke={isDark ? "#444" : "#eee"}
                    strokeWidth={1}
                />
            ))}

            {/* Line */}
            {validPoints.length > 1 && (
                <Path
                    d={generateSmoothPath(validPoints, false)}
                    fill="none"
                    stroke={Colors.primary}
                    strokeWidth={3}
                />
            )}

            {/* Area (optional, tricky with gaps) */}

            {/* Points */}
            {validPoints.map((p, i) => (
                <Circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    fill={Colors.primary}
                    stroke={cardBg}
                    strokeWidth={2}
                />
            ))}

            {/* X-Axis Labels */}
            {chartData.map((d, i) => (
                <SvgText
                    key={i}
                    x={i * stepX}
                    y={CHART_HEIGHT + 20}
                    fill={secondaryText}
                    fontSize={10}
                    textAnchor="middle"
                >
                    {d.date.getDate()}
                </SvgText>
            ))}
          </Svg>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen options={{ headerShown: false }} />
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
        <ThemedText style={styles.headerTitle}>Meal Quality</ThemedText>
      </BlurView>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: 60 + insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
            <LinearGradient
              colors={[Colors.primary, '#4CAF50']} // Blue to Green gradient
              style={styles.scoreRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.scoreRingInner, { backgroundColor: bgColor }]}>
                <ThemedText style={styles.scoreValue}>{avgQuality.toFixed(1)}</ThemedText>
                <ThemedText style={styles.scoreLabel}>/ 10</ThemedText>
              </View>
            </LinearGradient>
            <ThemedText style={[styles.heroTitle, { color: textColor }]}>Average Quality</ThemedText>
            <ThemedText style={[styles.heroSubtitle, { color: secondaryText }]}>Based on {totalMeals} meals</ThemedText>
        </View>

        {/* Chart Section */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>Last 30 Days</ThemedText>
            {renderChart()}
        </View>

        {/* Top Meals Section */}
        <View style={[styles.sectionHeader]}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Top Rated Meals</ThemedText>
        </View>

        {highQualityMeals.map((meal, index) => (
            <TouchableOpacity 
                key={meal.id} 
                style={[styles.mealCard, { backgroundColor: cardBg }]}
                onPress={() => router.push({ pathname: "/meal-detail", params: { id: meal.id } })}
            >
                <View style={styles.mealRank}>
                    <ThemedText style={styles.rankText}>#{index + 1}</ThemedText>
                </View>
                <View style={styles.mealInfo}>
                    <ThemedText style={[styles.mealName, { color: textColor }]}>
                        {meal.name || "Unknown Meal"}
                    </ThemedText>
                    <ThemedText style={[styles.mealDate, { color: secondaryText }]}>
                        {new Date(meal.timestamp * MS_TO_S).toLocaleDateString()}
                    </ThemedText>
                </View>
                <View style={styles.mealScore}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <ThemedText style={[styles.mealScoreValue, { color: textColor }]}>
                        {meal.mealQuality.mealQualityScore.toFixed(1)}
                    </ThemedText>
                </View>
            </TouchableOpacity>
        ))}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  heroSection: {
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  scoreRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  scoreRingInner: {
    width: 156,
    height: 156,
    borderRadius: 78,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 2,
    lineHeight: 56,
  },
  scoreLabel: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.small,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    alignSelf: 'flex-start',
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  mealRank: {
    width: 30,
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  rankText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8E8E93",
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  mealDate: {
    fontSize: 12,
  },
  mealScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealScoreValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
