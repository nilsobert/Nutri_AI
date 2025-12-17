import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Button,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useMeals } from "../context/MealContext";
import { useUser } from "../context/UserContext";
import { MealEntry, MealCategory } from "../types/mealEntry";
import { MealQuality } from "../types/mealQuality";
import { NutritionInfo } from "../types/nutritionInfo";
import { MS_TO_S } from "../constants/values";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../constants/theme";

/* this is just a placeholder screen */
const AddMealScreen = () => {
  const { addMeal, meals } = useMeals();
  const { goals } = useUser();
  const { date } = useLocalSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>(
    MealCategory.Lunch,
  );
  const [selectedDate, setSelectedDate] = useState<Date>(
    date ? new Date(date as string) : new Date(),
  );

  // Calculate remaining calories
  const todaysMeals = meals.filter(m => {
    const d = new Date(m.getTimestamp() * 1000);
    return d.getDate() === selectedDate.getDate() && 
           d.getMonth() === selectedDate.getMonth() && 
           d.getFullYear() === selectedDate.getFullYear();
  });
  
  const totalCalories = todaysMeals.reduce((sum, m) => sum + m.getNutritionInfo().getCalories(), 0);
  const calorieGoal = goals?.calories || 2000;
  const remaining = calorieGoal - totalCalories;

  const handleAddTestMeal = async () => {
    const nutrition = new NutritionInfo({
      calories: 500,
      carbs: 50,
      sugar: 10,
      protein: 30,
      fat: 20,
    });
    const quality = new MealQuality(1.2, 80, 8);

    const timestamp = Math.floor(selectedDate.getTime() / MS_TO_S);

    const meal = new MealEntry(
      selectedCategory,
      quality,
      nutrition,
      undefined,
      undefined,
      "Test Meal",
      timestamp,
    );

    await addMeal(meal);
    router.back();
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.title}>Add a Meal</Text>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Goal Context Card */}
        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>Calories Remaining</Text>
          <Text style={[styles.goalValue, { color: remaining < 0 ? Colors.secondary.fat : Colors.primary }]}>
            {remaining}
          </Text>
          <Text style={styles.goalSubtext}>
            Goal: {calorieGoal} • Eaten: {totalCalories}
          </Text>
        </View>

        <Text style={styles.placeholderText}>
          Debug: Select Meal Details
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <View style={styles.dateControl}>
            <Button title="-1 Day" onPress={() => changeDate(-1)} />
            <Text>{selectedDate.toDateString()}</Text>
            <Button title="+1 Day" onPress={() => changeDate(1)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryContainer}>
            {Object.values(MealCategory).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  selectedCategory === cat && styles.selectedCategory,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat && styles.selectedCategoryText,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button title="Add Test Meal" onPress={handleAddTestMeal} />
      </ScrollView>
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
    marginBottom: 20,
  },
  content: {
    alignItems: "center",
    gap: 20,
    paddingBottom: 40,
  },
  placeholderText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  section: {
    width: "100%",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  dateControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  categoryButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedCategory: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  categoryText: {
    color: "black",
  },
  selectedCategoryText: {
    color: "white",
  },
  goalCard: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  goalLabel: {
    fontSize: Typography.sizes.sm,
    color: '#6c757d',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  goalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  goalSubtext: {
    fontSize: Typography.sizes.sm,
    color: '#adb5bd',
  },
});

export default AddMealScreen;
