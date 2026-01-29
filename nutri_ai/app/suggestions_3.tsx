import React, { useEffect, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing } from "../constants/theme";
import { API_BASE_URL } from "../constants/values";

/* ---------------- ROUTE OPTIONS ---------------- */
export const options = {
  headerShown: false,
  animation: "none",
};

/* ---------------- TYPES ---------------- */
type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Recipe = {
  ingredients: string[];
  preparation: string[];
};

type Meal = {
  name: string;
  description: string;
  nutrition: Nutrition;
  recipe?: Recipe;
};

type MealSuggestions = {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
};

/* ---------------- COMPONENT ---------------- */
export default function SuggestionsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const params = useLocalSearchParams();
  const remainingCalories = Number(params.remainingCalories || 0);
  const remainingProtein = Number(params.remainingProtein || 0);
  const remainingCarbs = Number(params.remainingCarbs || 0);
  const remainingFat = Number(params.remainingFat || 0);
  const lastMeal = Number(params.lastMealNumber || 0);

  const [mealSuggestions, setMealSuggestions] = useState<MealSuggestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openRecipe, setOpenRecipe] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);

        const requestBody = {
          remaining_calories: remainingCalories,
          remaining_protein: remainingProtein,
          remaining_carbs: remainingCarbs,
          remaining_fat: remainingFat,
          last_meal: lastMeal,
        };

        const token = await AsyncStorage.getItem("auth_token");

        const response = await fetch(`${API_BASE_URL}/api/suggest-meals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text);
        }

        const data: MealSuggestions = await response.json();
        setMealSuggestions(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch meal suggestions");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [
    remainingCalories,
    remainingProtein,
    remainingCarbs,
    remainingFat,
    lastMeal,
  ]);

  /* ---------------- LOADING & ERROR ---------------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, color: isDark ? "#fff" : "#111" }}>
          Generating suggestions…
        </Text>
      </View>
    );
  }

  if (error || !mealSuggestions) {
    return (
      <View style={styles.center}>
        <Text style={{ color: isDark ? "#fff" : "#111" }}>
          {error || "No suggestions available"}
        </Text>
      </View>
    );
  }

  const filteredMeals = Object.keys(mealSuggestions).filter(
    (key) => mealSuggestions[key as keyof MealSuggestions].name !== "none"
  );

  /* ---------------- COLORS ---------------- */
  const bgColor = isDark ? "#121212" : "#f0f3f5";
  const cardBg = isDark ? "#1e1e1e" : "#fff";
  const textColor = isDark ? "#fff" : "#111";
  const descriptionColor = isDark ? "#ccc" : "#555";
  const recipeBoxBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  /* ---------------- RENDER ---------------- */
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* Header inside ScrollView */}
        <Text style={[styles.headerText, { color: textColor, marginBottom: Spacing.lg }]}>
          Today's Suggestions
        </Text>

        {filteredMeals.map((key) => {
          const item = mealSuggestions[key as keyof MealSuggestions];
          const recipeOpen = openRecipe === key;

          return (
            <View
              key={key}
              style={[styles.card, { backgroundColor: cardBg }]}
            >
              <Text style={[styles.mealType, { color: Colors.primary }]}>
                {key.toUpperCase()}
              </Text>

              <Text style={[styles.mealName, { color: textColor }]}>
                {item.name}
              </Text>

              <Text style={[styles.mealDescription, { color: descriptionColor }]}>
                {item.description}
              </Text>

              {/* Nutrition */}
              <View style={styles.nutritionContainer}>
                {["calories", "protein", "carbs", "fat"].map((nutr) => (
                  <View style={styles.nutritionItem} key={nutr}>
                    <Text
                      style={[
                        styles.nutritionLabel,
                        {
                          color: Colors.secondary[
                            nutr as keyof typeof Colors.secondary
                          ],
                        },
                      ]}
                    >
                      {nutr.charAt(0).toUpperCase() + nutr.slice(1)}
                    </Text>
                    <Text style={[styles.nutritionValue, { color: textColor }]}>
                      {item.nutrition[nutr as keyof Nutrition]}{" "}
                      {nutr === "calories" ? "kcal" : "g"}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Recipe Button */}
              {item.recipe && (
                <TouchableOpacity
                  style={[styles.recipeButton, { backgroundColor: Colors.primary }]}
                  onPress={() => setOpenRecipe(recipeOpen ? null : key)}
                >
                  <Text style={styles.recipeButtonText}>
                    {recipeOpen ? "Hide Recipe" : "Show Recipe"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Recipe */}
              {recipeOpen && item.recipe && (
                <View style={[styles.recipeBox, { backgroundColor: recipeBoxBg }]}>
                  <Text style={[styles.recipeTitle, { color: textColor }]}>Ingredients</Text>
                  {item.recipe.ingredients.map((i, idx) => (
                    <Text key={idx} style={[styles.recipeText, { color: textColor }]}>
                      • {i}
                    </Text>
                  ))}

                  <Text style={[styles.recipeTitle, { color: textColor }]}>Preparation</Text>
                  {item.recipe.preparation.map((p, idx) => (
                    <Text key={idx} style={[styles.recipeText, { color: textColor }]}>
                      {idx + 1}. {p}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: Spacing.xl },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerText: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },

  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },

  mealType: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  mealName: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  mealDescription: { fontSize: 16, marginBottom: 12 },

  nutritionContainer: { flexDirection: "row", marginBottom: 12 },
  nutritionItem: { flex: 1, alignItems: "center" },
  nutritionLabel: { fontWeight: "700", fontSize: 12 },
  nutritionValue: { fontSize: 14, fontWeight: "600" },

  recipeButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },

  recipeButtonText: { color: "#fff", fontWeight: "600" },

  recipeBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },

  recipeTitle: {
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },

  recipeText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
