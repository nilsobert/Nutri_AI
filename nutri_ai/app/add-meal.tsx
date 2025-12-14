import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { Audio } from "expo-av";
import { useMeals } from "../context/MealContext";
import { useUser } from "../context/UserContext";
import { MealEntry, MealCategory } from "../types/mealEntry";
import { MealQuality } from "../types/mealQuality";
import { NutritionInfo } from "../types/nutritionInfo";
import { MS_TO_S } from "../constants/values";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../constants/theme";

const AddMealScreen = () => {
  const { addMeal } = useMeals();
  const { date, imageUri, audioUri } = useLocalSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>(
    MealCategory.Lunch,
  );
  const [selectedDate, setSelectedDate] = useState<Date>(
    date ? new Date(date as string) : new Date(),
  );

  const [sound, setSound] = useState<Audio.Sound | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playSound = async () => {
    if (!audioUri) return;
    
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: audioUri as string });
      setSound(sound);
      setIsPlaying(true);
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("Error playing sound", error);
    }
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  const handleAddMeal = async () => {
    if (!imageUri || !audioUri) {
      Alert.alert("Error", "Missing image or audio data.");
      return;
    }

    const nutrition = new NutritionInfo({
      calories: 0, 
      carbs: 0,
      sugar: 0,
      protein: 0,
      fat: 0,
    });
    const quality = new MealQuality(0, 0, 0); 

    const timestamp = Math.floor(selectedDate.getTime() / MS_TO_S);

    const meal = new MealEntry(
      selectedCategory,
      quality,
      nutrition,
      imageUri as string,
      audioUri as string,
      "Processing...", 
      timestamp,
    );

    await addMeal(meal);
    
    // Navigate back to home (or wherever appropriate)
    // Since we might have come through multiple screens, we should probably go to root or popToTop
    router.dismissAll();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Review Meal</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Image Preview */}
        <View style={styles.section}>
          <Image source={{ uri: imageUri as string }} style={styles.previewImage} />
        </View>

        {/* Audio Preview */}
        <View style={styles.section}>
          <View style={styles.audioPreview}>
             <TouchableOpacity style={styles.playButton} onPress={isPlaying ? stopSound : playSound}>
               <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={Colors.primary} />
             </TouchableOpacity>
             <Text style={styles.audioText}>Audio Description Recorded</Text>
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Category</Text>
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

      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleAddMeal}
        >
            <Text style={styles.submitButtonText}>Save Meal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 100,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: '#333',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  audioText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#eee",
  },
  selectedCategory: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedCategoryText: {
    color: "white",
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 40,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...Shadows.medium,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddMealScreen;
