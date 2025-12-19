import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMeals } from "../context/MealContext";
import { Colors, Spacing, Typography, BorderRadius, Shadows } from "../constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MealImage } from "../components/MealImage";

const HEADER_HEIGHT = 400;
const { width } = Dimensions.get("window");

interface NutrientPillProps {
  label: string;
  value: string;
  color: string;
  isDark: boolean;
}

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

interface StatBoxProps {
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
  isDark: boolean;
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, subValue, color, isDark }) => (
  <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8f9fa' }]}>
    <Text style={[styles.statLabel, { color: isDark ? '#999' : '#666' }]}>{label}</Text>
    <Text style={[styles.statValue, { color: color || (isDark ? '#fff' : '#000') }]}>{value}</Text>
    {subValue && <Text style={[styles.statSub, { color: isDark ? '#666' : '#999' }]}>{subValue}</Text>}
  </View>
);

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { meals } = useMeals();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  const meal = meals.find((m) => m.id === id);

  if (!meal) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
        <View style={[styles.navHeader, { paddingTop: 20 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                <Ionicons 
                  name="close-circle" 
                  size={36} 
                  color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"} 
                />
            </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
            <Text style={{ color: isDark ? Colors.text.dark : Colors.text.light }}>Meal not found</Text>
        </View>
      </View>
    );
  }

  const { nutritionInfo, mealQuality } = meal;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";
  const bgColor = isDark ? Colors.background.dark : Colors.background.light;

  const getQualityColor = (score: number) => {
    if (score >= 7) return "#34C759"; // Green
    if (score >= 4) return "#FF9500"; // Orange
    return "#FF3B30"; // Red
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Parallax Header Image */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          {meal.image ? (
            <MealImage uri={meal.image} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: isDark ? "#333" : "#f5f5f5" }]}>
              <Ionicons name="restaurant" size={64} color={isDark ? "#555" : "#ccc"} />
            </View>
          )}
          {/* Gradient Overlay for better text contrast if we had text on image, but we don't. 
              However, a slight gradient at the bottom helps the sheet blend in. */}
          <View style={[styles.imageOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)' }]} />
        </Animated.View>

        {/* Content Sheet */}
        <View style={[styles.contentContainer, { backgroundColor: bgColor }]}>
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]} />
          </View>

          {/* Header Info */}
          <View style={styles.headerSection}>
            <View style={styles.categoryRow}>
              <Text style={[styles.category, { color: Colors.primary }]}>{meal.category}</Text>
              <Text style={[styles.date, { color: secondaryText }]}>
                {new Date(meal.timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={[styles.title, { color: textColor }]}>
              {meal.name || "Untitled Meal"}
            </Text>
          </View>

          {/* Description */}
          {meal.transcription ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: secondaryText }]}>Description</Text>
              <Text style={[styles.description, { color: textColor }]}>{meal.transcription}</Text>
            </View>
          ) : null}

          {/* Nutrition */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: secondaryText }]}>Nutrition</Text>
            <View style={styles.caloriesRow}>
              <Text style={[styles.caloriesValue, { color: textColor }]}>{nutritionInfo.calories}</Text>
              <Text style={[styles.caloriesLabel, { color: secondaryText }]}>kcal</Text>
            </View>
            <View style={styles.macrosRow}>
              <NutrientPill
                label="Carbs"
                value={`${nutritionInfo.carbs}g`}
                color={Colors.secondary.carbs}
                isDark={isDark}
              />
              <NutrientPill
                label="Protein"
                value={`${nutritionInfo.protein}g`}
                color={Colors.secondary.protein}
                isDark={isDark}
              />
              <NutrientPill
                label="Fat"
                value={`${nutritionInfo.fat}g`}
                color={Colors.secondary.fat}
                isDark={isDark}
              />
            </View>
          </View>

          {/* Analysis */}
          <View style={[styles.section, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={[styles.sectionLabel, { color: secondaryText }]}>Analysis</Text>
            <View style={styles.analysisGrid}>
              <StatBox 
                label="Quality" 
                value={`${mealQuality.mealQualityScore}/10`} 
                color={getQualityColor(mealQuality.mealQualityScore)}
                isDark={isDark}
              />
              <StatBox 
                label="Goal Fit" 
                value={`${mealQuality.goalFitPercentage}%`} 
                isDark={isDark}
              />
              <StatBox 
                label="Density" 
                value={mealQuality.calorieDensity.toFixed(1)} 
                subValue="cal/g"
                isDark={isDark}
              />
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Floating Close Button */}
      <View style={[styles.closeButtonContainer, { top: 20 }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.closeButton}
        >
          <Ionicons 
            name="close-circle" 
            size={36} 
            color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  closeButton: {
    padding: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: HEADER_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    marginTop: -40, // Overlap the image
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
    ...Shadows.large,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  headerSection: {
    marginBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
    paddingBottom: Spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  category: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  date: {
    fontSize: Typography.sizes.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: Typography.weights.bold,
    lineHeight: 38,
  },
  section: {
    marginBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
    paddingBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
    letterSpacing: 1,
  },
  description: {
    fontSize: Typography.sizes.base,
    lineHeight: 24,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
    gap: 6,
  },
  caloriesValue: {
    fontSize: 36,
    fontWeight: Typography.weights.bold,
  },
  caloriesLabel: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.medium,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  nutrientPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  nutrientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nutrientValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  nutrientLabel: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
  },
  analysisGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  statSub: {
    fontSize: 10,
    marginTop: 2,
  },
  closeButtonContainer: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 100,
  },
});
