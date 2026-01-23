import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Colors } from "../constants/theme";
import { API_BASE_URL } from '../constants/values';

type Nutrition = { calories: number; protein: number; carbs: number; fat: number };
type Meal = { name: string; description: string; nutrition: Nutrition };
type MealSuggestions = { breakfast: Meal; lunch: Meal; dinner: Meal };

export default function SuggestionsScreen() {
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

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Replace with your actual server URL
        const response = await fetch(`${API_BASE_URL}/api/suggest-meals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            remaining_calories: remainingCalories,
            remaining_protein: remainingProtein,
            remaining_carbs: remainingCarbs,
            remaining_fat: remainingFat,
            last_meal: lastMeal,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data: MealSuggestions = await response.json();

        // Check that JSON has the correct structure
        if (data.breakfast && data.lunch && data.dinner) {
          setMealSuggestions(data);
        } else {
          throw new Error("Invalid JSON structure from server");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch meal suggestions");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [remainingCalories, remainingProtein, remainingCarbs, remainingFat, lastMeal]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: isDark ? "#fff" : "#111" }]}>
          Generating suggestions…
        </Text>
      </View>
    );
  }

  if (error || !mealSuggestions) {
    return (
      <View style={styles.center}>
        <Text style={[styles.errorText, { color: isDark ? "#fff" : "#111" }]}>
          {error || "No suggestions available."}
        </Text>
      </View>
    );
  }

  // Filter out meals with name "none"
  const filteredMeals = Object.keys(mealSuggestions).filter(
    (key) => mealSuggestions[key as keyof MealSuggestions].name.toLowerCase() !== "none"
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#f0f3f5" },
      ]}
    >
      <Text style={[styles.title, { color: isDark ? "#fff" : "#222" }]}>
        Today's Meal Suggestions
      </Text>

      {filteredMeals.length === 0 && (
        <Text
          style={[
            styles.errorText,
            { color: isDark ? "#fff" : "#111", textAlign: "center" },
          ]}
        >
          No meals suggested for today.
        </Text>
      )}

      {filteredMeals.map((key) => {
        const item = mealSuggestions[key as keyof MealSuggestions];
        return (
          <View
            key={key}
            style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
          >
            <Text style={[styles.mealType, { color: Colors.primary }]}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
            <Text style={[styles.mealName, { color: isDark ? "#fff" : "#111" }]}>
              {item.name}
            </Text>
            <Text style={[styles.mealDescription, { color: isDark ? "#ccc" : "#555" }]}>
              {item.description}
            </Text>

            <View style={styles.nutritionContainer}>
              {["calories", "protein", "carbs", "fat"].map((nutr) => (
                <View style={styles.nutritionItem} key={nutr}>
                  <Text
                    style={[
                      styles.nutritionLabel,
                      { color: Colors.secondary[nutr as keyof typeof Colors.secondary] },
                    ]}
                  >
                    {nutr.charAt(0).toUpperCase() + nutr.slice(1)}
                  </Text>
                  <Text style={[styles.nutritionValue, { color: isDark ? "#fff" : "#111" }]}>
                    {item.nutrition[nutr as keyof Nutrition]}{" "}
                    {nutr === "calories" ? "kcal" : "g"}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[styles.recipeButton, { backgroundColor: Colors.primary }]}>
              <Text style={styles.recipeButtonText}>Show Recipe</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  mealType: { fontSize: 14, fontWeight: "600", marginBottom: 6, textTransform: "uppercase" },
  mealName: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  mealDescription: { fontSize: 16, marginBottom: 16, lineHeight: 22 },
  nutritionContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  nutritionItem: { alignItems: "center", flex: 1 },
  nutritionLabel: { fontSize: 14, marginBottom: 4, fontWeight: "bold" },
  nutritionValue: { fontSize: 14, fontWeight: "600" },
  recipeButton: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  recipeButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  loadingText: { marginTop: 12, fontSize: 16 },
  errorText: { fontSize: 16, fontWeight: "600" },
});
