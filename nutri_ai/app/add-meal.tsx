import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Button,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TextInput
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useMeals } from "../context/MealContext";
import { createMealEntry, MealCategory } from "../types/mealEntry";
import { StorageService } from "../services/storage";
import { API_BASE_URL } from "../constants/values";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/theme";

const AddMealScreen = () => {
  const { addMeal } = useMeals();
  const [step, setStep] = useState<'CAPTURE' | 'REVIEW'>('CAPTURE');
  
  // Capture State
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Review State (Form Data)
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("0");
  const [protein, setProtein] = useState("0");
  const [carbs, setCarbs] = useState("0");
  const [fat, setFat] = useState("0");
  const [transcription, setTranscription] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
      }
      await Audio.requestPermissionsAsync();
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setAudioUri(uri);
    setRecording(null);
  };

  const analyzeMeal = async () => {
    if (!imageUri) {
      Alert.alert("Missing Image", "Please take a photo of your meal first.");
      return;
    }

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert("Offline", "Online connection required for AI analysis. You can skip analysis to enter details manually.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) throw new Error("No auth token");

      const formData = new FormData();
      // @ts-ignore
      formData.append("image", {
        uri: imageUri,
        name: "meal.jpg",
        type: "image/jpeg",
      });

      if (audioUri) {
        // @ts-ignore
        formData.append("audio", {
          uri: audioUri,
          name: "note.m4a",
          type: "audio/m4a",
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      // Populate form
      if (data.structured_meal && data.structured_meal.items && data.structured_meal.items.length > 0) {
          const item = data.structured_meal.items[0]; // Just take first for now
          setMealName(item.name);
          setCalories(item.nutrition.calories.toString());
          setProtein(item.nutrition.protein_g.toString());
          setCarbs(item.nutrition.carbohydrates_g.toString());
          setFat(item.nutrition.fat_g.toString());
      }
      if (data.transcription) {
          setTranscription(data.transcription);
      }
      
      setStep('REVIEW');
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Analysis failed. Please try again or enter manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    try {
      // Move files to permanent storage
      const permImage = imageUri ? await StorageService.moveFileToPermanentStorage(imageUri) : undefined;
      const permAudio = audioUri ? await StorageService.moveFileToPermanentStorage(audioUri) : undefined;

      const meal = createMealEntry({
        category: MealCategory.Lunch, // Default or add selector
        image: permImage,
        audio: permAudio,
        transcription: transcription,
        nutritionInfo: {
          calories: parseInt(calories) || 0,
          protein: parseInt(protein) || 0,
          carbs: parseInt(carbs) || 0,
          fat: parseInt(fat) || 0,
          sugar: 0,
        },
        mealQuality: {
          calorieDensity: 0,
          goalFitPercentage: 0,
          mealQualityScore: 0,
        },
        timestamp: Math.floor(Date.now() / 1000),
      });

      await addMeal(meal);
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save meal");
    }
  };

  const handleSkipAnalysis = () => {
      setStep('REVIEW');
  };

  const handleRetake = () => {
      setImageUri(null);
      setAudioUri(null);
      setTranscription("");
      setMealName("");
      setCalories("0");
      setStep('CAPTURE');
  };

  if (step === 'CAPTURE') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Capture Meal</Text>

        <View style={styles.captureContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
              <Ionicons name="camera" size={48} color="#666" />
              <Text>Take Photo</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.recordButton, isRecording && styles.recordingActive]} 
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons name={isRecording ? "stop" : "mic"} size={32} color="white" />
            <Text style={{color: 'white'}}>{isRecording ? "Stop Recording" : "Record Note"}</Text>
          </TouchableOpacity>
          
          {audioUri && <Text style={styles.audioStatus}>Audio Note Recorded</Text>}
        </View>

        <View style={styles.actionButtons}>
          {isAnalyzing ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <>
              <Button title="Analyze with AI" onPress={analyzeMeal} disabled={!imageUri} />
              <Button title="Skip Analysis (Manual Entry)" onPress={handleSkipAnalysis} />
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={handleRetake} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.title}>Review Meal</Text>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.thumbnail} />}
      
      <View style={styles.form}>
        <Text style={styles.label}>Meal Name</Text>
        <TextInput style={styles.input} value={mealName} onChangeText={setMealName} placeholder="e.g. Grilled Chicken" />

        <Text style={styles.label}>Calories</Text>
        <TextInput style={styles.input} value={calories} onChangeText={setCalories} keyboardType="numeric" />

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Protein (g)</Text>
            <TextInput style={styles.input} value={protein} onChangeText={setProtein} keyboardType="numeric" />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Carbs (g)</Text>
            <TextInput style={styles.input} value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Fat (g)</Text>
            <TextInput style={styles.input} value={fat} onChangeText={setFat} keyboardType="numeric" />
          </View>
        </View>

        {transcription ? (
            <View style={styles.transcriptionBox}>
                <Text style={styles.label}>Audio Note:</Text>
                <Text style={{fontStyle: 'italic'}}>{transcription}</Text>
            </View>
        ) : null}

        <Button title="Save Meal" onPress={handleSave} />
        <Button title="Retake / Cancel" onPress={handleRetake} color="red" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  backButton: {
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  captureContainer: {
    alignItems: 'center',
    gap: 20,
    marginBottom: 40,
  },
  previewImage: {
    width: 300,
    height: 300,
    borderRadius: 10,
  },
  cameraButton: {
    width: 300,
    height: 300,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 30,
    paddingHorizontal: 30,
  },
  recordingActive: {
    backgroundColor: 'red',
  },
  audioStatus: {
    color: 'green',
    fontWeight: 'bold',
  },
  actionButtons: {
    gap: 10,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  form: {
    gap: 15,
    paddingBottom: 50,
  },
  label: {
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  transcriptionBox: {
      padding: 10,
      backgroundColor: '#f9f9f9',
      borderRadius: 8,
  }
});

export default AddMealScreen;
