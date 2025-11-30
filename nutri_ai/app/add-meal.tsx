import { View, Text, StyleSheet, TouchableOpacity, Button } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useMeals } from "../context/MealContext";
import { MealEntry, MealCategory } from "../types/mealEntry";
import { MealQuality } from "../types/mealQuality";
import { NutritionInfo } from "../types/nutritionInfo";

/* this is just a placeholder screen */
const AddMealScreen = () => {
  const { addMeal } = useMeals();

  const handleAddTestMeal = async () => {
    const nutrition = new NutritionInfo({
      calories: 500,
      carbs: 50,
      sugar: 10,
      protein: 30,
      fat: 20,
    });
    const quality = new MealQuality(1.2, 80, 8);
    const meal = new MealEntry(
      MealCategory.Lunch,
      quality,
      nutrition,
      undefined,
      "Test Meal",
    );

    await addMeal(meal);
    router.back();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.title}>Add a Meal</Text>
      <View style={styles.content}>
        <Text style={styles.placeholderText}>
          This is a placeholder for the Add Meal screen.
        </Text>
        <Button title="Add Test Meal" onPress={handleAddTestMeal} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 60,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default AddMealScreen;
