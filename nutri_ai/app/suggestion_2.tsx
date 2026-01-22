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
import OpenAI from "openai";

// API shit
const OPENAI_API_KEY = "gen-pj2pTKEv2ek3upIL0B4wAnKIATXdgR5sFznz9KbNuIQ2XCTw";


const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: "https://llm-server.llmhub.t-systems.net/v2",
});

//Extract JSON from LLm

function extractJSON(text: string) {
  const match = text.match(/\{[\s\S]*\}/); // grab first {...} block
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (err) {
    console.warn("Failed to parse JSON:", err);
    return null;
  }
}

//Import parameters from Homepage



export default function SuggestionsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const params = useLocalSearchParams();

  const remainingCalories = Number(params.remainingCalories || 0);
  const remainingProtein = Number(params.remainingProtein || 0);
  const remainingCarbs = Number(params.remainingCarbs || 0);
  const remainingFat = Number(params.remainingFat || 0);
  const lastMeal = Number(params.lastMealNumber || 0);

  const [mealSuggestions, setMealSuggestions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

//Call model

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const prompt = `
You are a helpful nutrition assistant.

Based on the remaining nutrients for today:
- Calories: ${remainingCalories} kcal
- Protein: ${remainingProtein} g
- Carbs: ${remainingCarbs} g
- Fat: ${remainingFat} g

The meals you suggest must fill out the rest of the nutrients for the day. 
The total number of nutrients per category you suggest should total the remainig amounts. 

Please suggest:
1. One healthy dinner
2. One healthy snack

Output a JSON object exactly like this:

{
  "snack": {
    "name": "Snack name",
    "description": "Short description",
    "nutrition": { "calories": 180, "protein": 12, "carbs": 20, "fat": 4 }
  },
  "dinner": {
    "name": "Dinner name",
    "description": "Short description",
    "nutrition": { "calories": 520, "protein": 35, "carbs": 45, "fat": 18 }
  }
}

The JSON must be valid and parseable. No text outside the JSON.
`;

        const response = await client.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            { role: "system", content: "You are a helpful assistant named Llama-3." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 512,
        });

        const aiContent = response.choices?.[0]?.message?.content || "";
        const parsed = extractJSON(aiContent);

        if (parsed) setMealSuggestions(parsed);
        else setError("Failed to parse LLM JSON");
      } catch (err) {
        console.error(err);
        setError("Failed to generate suggestions.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [remainingCalories, remainingProtein, remainingCarbs, remainingFat]);


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

      {Object.keys(mealSuggestions).map((key) => {
        const item = mealSuggestions[key];
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
              {["calories","protein","carbs","fat"].map((nutr) => (
                <View style={styles.nutritionItem} key={nutr}>
                  <Text
                    style={[
                      styles.nutritionLabel,
                      { color: Colors.secondary[nutr as keyof typeof Colors.secondary] },
                    ]}
                  >
                    {nutr.charAt(0).toUpperCase() + nutr.slice(1)}
                  </Text>
                  <Text
                    style={[
                      styles.nutritionValue,
                      { color: isDark ? "#fff" : "#111" },
                    ]}
                  >
                    {item.nutrition[nutr]} {nutr === "calories" ? "kcal" : "g"}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.recipeButton, { backgroundColor: Colors.primary }]}
            >
              <Text style={styles.recipeButtonText}>Show Recipe</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

//Styles
const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  card: {
    borderRadius: 20, padding: 20, marginBottom: 20,
    shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10, elevation: 5,
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
