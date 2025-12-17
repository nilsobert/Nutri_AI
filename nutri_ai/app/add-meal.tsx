import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Button,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { Audio } from "expo-av";
import { useMeals } from "../context/MealContext";
import { useUser } from "../context/UserContext";
import { useNetwork } from "../context/NetworkContext";
import { MealEntry, MealCategory, createMealEntry } from "../types/mealEntry";
import { MealQuality } from "../types/mealQuality";
import { NutritionInfo } from "../types/nutritionInfo";
import { MS_TO_S } from "../constants/values";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../constants/theme";

const AddMealScreen = () => {
  const { addMeal, meals } = useMeals();
  const { goals } = useUser();
  const { api } = useNetwork();
  const { date, imageUri, audioUri } = useLocalSearchParams();
  
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>(
    MealCategory.Lunch,
  );
  const [selectedDate, setSelectedDate] = useState<Date>(
    date ? new Date(date as string) : new Date(),
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-analyze on mount if media is present
  useEffect(() => {
    if (imageUri && !analysisResult) {
      analyzeMeal();
    }
  }, [imageUri]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playSound = async () => {
    if (!audioUri) return;
    
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri as string }
        );
        setSound(newSound);
        setIsPlaying(true);
        await newSound.playAsync();
        
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            newSound.setPositionAsync(0);
          }
        });
      }
    } catch (error) {
      console.error("Error playing sound", error);
    }
  };

  const analyzeMeal = async () => {
    if (!imageUri) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      
      // Append Image
      const imageFilename = (imageUri as string).split('/').pop() || 'photo.jpg';
      const imageMatch = /\.(\w+)$/.exec(imageFilename);
      const imageType = imageMatch ? `image/${imageMatch[1]}` : `image/jpeg`;
      
      formData.append('image', {
        uri: imageUri as string,
        name: imageFilename,
        type: imageType,
      } as any);

      // Append Audio if exists
      if (audioUri) {
        const audioFilename = (audioUri as string).split('/').pop() || 'audio.m4a';
        const audioMatch = /\.(\w+)$/.exec(audioFilename);
        const audioType = audioMatch ? `audio/${audioMatch[1]}` : `audio/m4a`;
        
        formData.append('audio', {
          uri: audioUri as string,
          name: audioFilename,
          type: audioType,
        } as any);
      }

      const response = await api.post('/api/track-meal', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        setAnalysisResult(response.data);
      } else {
        Alert.alert("Analysis Failed", "Could not analyze the meal. Please try again.");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      Alert.alert("Error", "Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMeal = async () => {
    if (!analysisResult) return;

    const timestamp = Math.floor(selectedDate.getTime() / MS_TO_S);
    
    // Aggregate items if multiple
    const items = analysisResult.items || [];
    const totalNutrition = items.reduce((acc: any, item: any) => ({
      calories: acc.calories + (item.nutrition.calories || 0),
      carbs: acc.carbs + (item.nutrition.carbohydrates_g || 0),
      sugar: acc.sugar + (item.nutrition.sugar_g || 0),
      protein: acc.protein + (item.nutrition.protein_g || 0),
      fat: acc.fat + (item.nutrition.fat_g || 0),
    }), { calories: 0, carbs: 0, sugar: 0, protein: 0, fat: 0 });

    // Calculate quality score (mock logic for now based on protein/cal ratio)
    const proteinRatio = totalNutrition.protein * 4 / totalNutrition.calories;
    const qualityScore = Math.min(10, Math.floor(proteinRatio * 20) + 5);

    const meal = createMealEntry({
      category: selectedCategory,
      mealQuality: {
        calorieDensity: totalNutrition.calories / (items.reduce((sum: number, i: any) => sum + i.serving_size_grams, 0) || 100),
        goalFitPercentage: 85, // Mock
        mealQualityScore: qualityScore,
      },
      nutritionInfo: {
        calories: Math.round(totalNutrition.calories),
        carbs: Math.round(totalNutrition.carbs),
        sugar: Math.round(totalNutrition.sugar),
        protein: Math.round(totalNutrition.protein),
        fat: Math.round(totalNutrition.fat),
      },
      transcription: analysisResult.transcript || items.map((i: any) => i.name).join(", "),
      timestamp: timestamp,
      image: imageUri as string,
      audio: audioUri as string,
    });

    await addMeal(meal);
    router.back();
  };

  // Calculate remaining calories
  const todaysMeals = meals.filter(m => {
    const d = new Date(m.timestamp * 1000);
    return d.getDate() === selectedDate.getDate() && 
           d.getMonth() === selectedDate.getMonth() && 
           d.getFullYear() === selectedDate.getFullYear();
  });
  
  const totalCalories = todaysMeals.reduce((sum, m) => sum + m.nutritionInfo.calories, 0);
  const calorieGoal = goals?.calories || 2000;
  const remaining = calorieGoal - totalCalories;

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
        {/* Media Preview */}
        {imageUri && (
          <View style={styles.mediaPreview}>
            <Image source={{ uri: imageUri as string }} style={styles.previewImage} />
            {audioUri && (
              <TouchableOpacity style={styles.playButton} onPress={playSound}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Analyzing your meal...</Text>
          </View>
        )}

        {/* Analysis Results */}
        {!isLoading && analysisResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Analysis Complete</Text>
            {analysisResult.items.map((item: any, index: number) => (
              <View key={index} style={styles.foodItem}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodDetails}>
                  {item.serving_size_grams}g • {item.nutrition.calories} kcal
                </Text>
                <View style={styles.macrosRow}>
                  <Text style={{color: Colors.secondary.protein}}>P: {item.nutrition.protein_g}g</Text>
                  <Text style={{color: Colors.secondary.carbs}}>C: {item.nutrition.carbohydrates_g}g</Text>
                  <Text style={{color: Colors.secondary.fat}}>F: {item.nutrition.fat_g}g</Text>
                </View>
              </View>
            ))}
          </View>
        )}

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

        <TouchableOpacity 
          style={[styles.saveButton, (!analysisResult && !isLoading) && { opacity: 0.5 }]} 
          onPress={handleSaveMeal}
          disabled={!analysisResult || isLoading}
        >
          <Text style={styles.saveButtonText}>Save Meal</Text>
        </TouchableOpacity>
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
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.text.light,
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  foodItem: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
  },
  foodDetails: {
    color: '#666',
    fontSize: 14,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
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
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddMealScreen;
