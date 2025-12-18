import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import Animated, {
  Extrapolate,
  FadeIn,
  FadeOut,
  SlideInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { useMeals } from '../../context/MealContext';
import { useNetwork } from '../../context/NetworkContext';
import { createMealEntry, MealCategory } from '../../types/mealEntry';
import { StorageService } from '../../services/storage';
import { API_BASE_URL } from '../../constants/values';
import { IOSWaveform } from './IOSWaveform';
import { MealReviewModal } from './MealReviewModal';

type Mode = 'CAMERA' | 'IMAGE_PREVIEW' | 'CONTEXT_INPUT' | 'ANALYZING' | 'REVIEW';

interface CaptureWaitReviewContainerProps {
  initialDate?: string;
}

const CaptureWaitReviewContainer: React.FC<CaptureWaitReviewContainerProps> = ({ initialDate }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { addMeal } = useMeals();
  const { isConnected } = useNetwork();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('CAMERA');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  
  // Data State
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("0");
  const [protein, setProtein] = useState("0");
  const [carbs, setCarbs] = useState("0");
  const [fat, setFat] = useState("0");
  const [mealQualityScore, setMealQualityScore] = useState(0);
  const [goalFitPercentage, setGoalFitPercentage] = useState(0);
  const [calorieDensity, setCalorieDensity] = useState(0);
  const [transcription, setTranscription] = useState("");
  const [contextText, setContextText] = useState("");
  const [mealType, setMealType] = useState<MealCategory>(MealCategory.Lunch);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  
  // Focus State
  const [focusPoint, setFocusPoint] = useState<{ x: number, y: number } | null>(null);
  const focusOpacity = useSharedValue(0);
  const focusScale = useSharedValue(1);

  // Animations
  const blurIntensity = useSharedValue(0);
  const micScale = useSharedValue(1);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
    Audio.requestPermissionsAsync();
  }, [permission]);

  useEffect(() => {
    if (mode === 'ANALYZING') {
      // No specific animation setup needed for ActivityIndicator
    } else if (mode === 'CONTEXT_INPUT') {
        blurIntensity.value = withTiming(50, { duration: 500 });
    } else if (mode === 'REVIEW') {
        // Keep blur
    } else {
      blurIntensity.value = withTiming(0);
    }
  }, [mode, screenHeight]);

  const handleFocus = (x: number, y: number) => {
    setFocusPoint({ x, y });
    focusOpacity.value = 1;
    focusScale.value = 1.5;
    focusScale.value = withSpring(1);
    focusOpacity.value = withSequence(withTiming(1, { duration: 200 }), withTiming(0, { duration: 1000 }));

    // Note: expo-camera's CameraView focus APIs vary by version.
    // Here we keep a lightweight visual affordance without calling native focus APIs.
  };

  const retakePhoto = () => {
    setMode('CAMERA');
    setImageUri(null);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          skipProcessing: true,
        });
        
        if (photo) {
          setImageUri(photo.uri);
          setMode('IMAGE_PREVIEW');
        }
      } catch (error) {
        console.error("Failed to take picture", error);
        Alert.alert("Error", "Failed to capture image");
      }
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
        await stopRecording();
    } else {
        await startRecording();
    }
  };

  // Smoothed mic level (0..1). We smooth because raw metering is spiky.
  const [audioLevel, setAudioLevel] = useState(0);
  const levelRef = useRef(0);

  // Speech detection: when quiet we fade the waveform out.
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingHoldUntilRef = useRef(0);

  // Drives the *layout* of the card: when quiet, waveform collapses and card shrinks.
  const wavePresence = useSharedValue(0);
  useEffect(() => {
    const show = isRecording && isSpeaking;
    wavePresence.value = withTiming(show ? 1 : 0, {
      duration: show ? 160 : 320,
    });
  }, [isRecording, isSpeaking]);

  const startRecording = async () => {
    try {
      // Ensure any previous recording is fully cleaned up.
      if (recording !== null) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Enable metering so we can render a waveform/level indicator.
      const recordingOptions: Audio.RecordingOptions = {
        ...(Audio.RecordingOptionsPresets.HIGH_QUALITY as Audio.RecordingOptions),
        // expo-av supports metering mainly on iOS; newer versions also expose it on Android.
        // We set it defensively.
        ios: {
          ...(Audio.RecordingOptionsPresets.HIGH_QUALITY as any).ios,
          isMeteringEnabled: true,
        },
        android: {
          ...(Audio.RecordingOptionsPresets.HIGH_QUALITY as any).android,
          isMeteringEnabled: true,
        },
      } as any;

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);

      // More frequent updates = snappier UI.
      newRecording.setProgressUpdateInterval(60);
      newRecording.setOnRecordingStatusUpdate((status) => {
        // metering is typically in dBFS (-160..0)
        const metering = (status as any)?.metering;
        if (typeof metering === 'number') {
          // Map dBFS -> usable 0..1 amplitude.
          // -55dB is "quiet room", -10dB is "speaking close". Clamp outside.
          const clamped = Math.max(-55, Math.min(-10, metering));
          const t = (clamped + 55) / 45; // 0..1

          // Exponential curve + gain makes small changes visible (more iOS-like).
          const gained = Math.pow(t, 1.8) * 1.35;
          const target = Math.max(0, Math.min(1, gained));

          // Attack/release smoothing.
          const prev = levelRef.current;
          const attack = 0.55;
          const release = 0.18;
          const next = target > prev ? prev + (target - prev) * attack : prev + (target - prev) * release;

          levelRef.current = next;
          setAudioLevel(next);

          // "Speaking" if above threshold; hold briefly so it doesn't flicker.
          const now = Date.now();
          const speakingThreshold = 0.12;
          if (next > speakingThreshold) {
            speakingHoldUntilRef.current = now + 250;
            if (!isSpeaking) setIsSpeaking(true);
          } else if (isSpeaking && now > speakingHoldUntilRef.current) {
            setIsSpeaking(false);
          }
        }
      });

      setRecording(newRecording);
      setIsRecording(true);
      micScale.value = withRepeat(withTiming(1.2, { duration: 500 }), -1, true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Microphone error', 'Could not start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      setIsRecording(false);
      setAudioLevel(0);
      levelRef.current = 0;
      setIsSpeaking(false);
      micScale.value = withTiming(1);
    } catch (error) {
      console.error('Error stopping recording', error);
    }
  };

  const startAnalysis = async () => {
      if (isRecording) {
          await stopRecording();
      }
      analyzeMeal(imageUri!, audioUri);
  };

  const analyzeMeal = async (imgUri: string, audUri: string | null) => {
    setMode('ANALYZING');
    
    if (!isConnected) {
      // Offline mode - skip analysis
      setTimeout(() => {
        setMealName("Manual Entry");
        setMode('REVIEW');
      }, 500);
      return;
    }

    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) throw new Error("No auth token");

      const formData = new FormData();
      // @ts-ignore
      formData.append("image", {
        uri: imgUri,
        name: "meal.jpg",
        type: "image/jpeg",
      });

      if (audUri) {
        // @ts-ignore
        formData.append("audio", {
          uri: audUri,
          name: "note.m4a",
          type: "audio/m4a",
        });
      }
      
      if (contextText) {
          formData.append("context_text", contextText);
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
          setMealQualityScore(item.nutrition.meal_quality || 0);
          setGoalFitPercentage(item.nutrition.goal_fit_percent ? Math.round(item.nutrition.goal_fit_percent * 100) : 0);
          setCalorieDensity(item.nutrition.calorie_density_cal_per_gram || 0);
          
          if (data.transcription) {
              setTranscription(data.transcription);
          }
          
          setMode('REVIEW');
          setReviewModalVisible(true);
      } else {
          setMode('REVIEW');
          setErrorModalVisible(true);
      }
    } catch (e) {
      console.error(e);
      setMode('REVIEW');
      setErrorModalVisible(true);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const permImage = imageUri ? await StorageService.moveFileToPermanentStorage(imageUri) : undefined;
      const permAudio = audioUri ? await StorageService.moveFileToPermanentStorage(audioUri) : undefined;

      const meal = createMealEntry({
        category: data.mealType,
        name: data.name,
        image: permImage,
        audio: permAudio,
        transcription: data.transcription,
        nutritionInfo: {
          calories: parseInt(data.calories) || 0,
          protein: parseInt(data.protein) || 0,
          carbs: parseInt(data.carbs) || 0,
          fat: parseInt(data.fat) || 0,
          sugar: 0,
        },
        mealQuality: {
          calorieDensity: data.calorieDensity || 0,
          goalFitPercentage: data.goalFitPercentage || 0,
          mealQualityScore: data.mealQualityScore || 0,
        },
        timestamp: Math.floor(data.date.getTime() / 1000),
      });

      await addMeal(meal);
      setReviewModalVisible(false);
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save meal");
    }
  };

  const animatedBlurStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(blurIntensity.value, [0, 50], [0, 1]),
    };
  });

  const focusStyle = useAnimatedStyle(() => {
      return {
          opacity: focusOpacity.value,
          transform: [{ scale: focusScale.value }],
          left: (focusPoint?.x || 0) - 30,
          top: (focusPoint?.y || 0) - 30,
      };
  });

  const waveformWrapperAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(wavePresence.value, [0, 1], [0, 108], Extrapolate.CLAMP),
      marginBottom: interpolate(wavePresence.value, [0, 1], [0, 10], Extrapolate.CLAMP),
      opacity: wavePresence.value,
    };
  });

  // Elegant handoff: when recording starts, slightly lift the mic button and subtly fade it,
  // while the waveform becomes the visual focus.
  const micHandoffStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isRecording ? 0.92 : 1, { duration: 180 }),
      transform: [
        { scale: micScale.value },
        { translateY: withTiming(isRecording ? 2 : 0, { duration: 220 }) },
      ],
    };
  });

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Please allow photo library access to pick a meal photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
        setAudioUri(null);
        setContextText('');
        setTranscription('');
        setMode('CONTEXT_INPUT');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not open photo library');
    }
  };

  return (
    <View style={styles.container}>
      {/* BACKGROUND LAYER */}
      {!imageUri || mode === 'CAMERA' ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPressIn={(e) => {
            // locationX/Y are relative to the pressed view
            handleFocus(e.nativeEvent.locationX, e.nativeEvent.locationY);
          }}
        >
          <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing="back" />
          <Animated.View style={[styles.focusSquare, focusStyle]} />
        </Pressable>
      ) : (
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} />
      )}

        {/* GLASS EFFECTS LAYER */}
        {mode !== 'CAMERA' && (
            <Animated.View style={[StyleSheet.absoluteFill, animatedBlurStyle]}>
                <BlurView intensity={50} style={StyleSheet.absoluteFill} tint="systemMaterialDark" />
            </Animated.View>
        )}

        {/* PHASE 1: CAMERA CONTROLS */}
        {mode === 'CAMERA' && (
          <>
            <TouchableOpacity
              style={[styles.closeButton, { top: insets.top + 20 }]}
              onPress={() => router.back()}
            >
              <BlurView intensity={40} style={styles.closeButtonBlur}>
                <Ionicons name="close" size={24} color="white" />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.galleryButton, { top: insets.top + 20 }]}
              onPress={pickFromGallery}
            >
              <BlurView intensity={40} style={styles.closeButtonBlur}>
                <Ionicons name="images" size={22} color="white" />
              </BlurView>
            </TouchableOpacity>

            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.shutterButton} onPress={takePicture}>
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* PHASE 1.5: IMAGE PREVIEW */}
        {mode === 'IMAGE_PREVIEW' && (
            <View style={[styles.bottomControls, { bottom: 50, flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingHorizontal: 30 }]}>
                <TouchableOpacity onPress={retakePhoto} style={{ alignItems: 'center' }}>
                    <BlurView intensity={40} style={styles.previewActionButton}>
                        <Ionicons name="close" size={32} color="white" />
                    </BlurView>
                    <Text style={styles.previewActionText}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMode('CONTEXT_INPUT')} style={{ alignItems: 'center' }}>
                    <BlurView intensity={80} tint="light" style={[styles.previewActionButton, styles.previewPrimaryButton]}>
                        <Ionicons name="checkmark" size={36} color={Colors.primary} />
                    </BlurView>
                    <Text style={styles.previewActionText}>Use Photo</Text>
                </TouchableOpacity>
            </View>
        )}

        {/* PHASE 2: CONTEXT INPUT */}
        {mode === 'CONTEXT_INPUT' && (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.contextContainer}>
              <BlurView intensity={80} tint="systemMaterial" style={styles.contextCard}>
              <Text style={styles.contextTitle}>Describe this meal...</Text>

              <Animated.View style={[styles.waveformWrapper, waveformWrapperAnimatedStyle]}>
                <IOSWaveform level={audioLevel} isRecording={isRecording} isSpeaking={isSpeaking} />
              </Animated.View>

              {audioUri && !isRecording ? (
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <View style={[styles.micButtonBig, { backgroundColor: '#34C759' }]}>
                    <Ionicons name="checkmark" size={32} color="white" />
                  </View>
                  <TouchableOpacity onPress={() => setAudioUri(null)}>
                    <Text style={{ color: '#FF3B30', fontSize: 16, fontWeight: '600' }}>Re-record</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.micButtonBig, isRecording && styles.micButtonActive]}
                  onPress={toggleRecording}
                  activeOpacity={0.9}
                >
                  <Animated.View style={micHandoffStyle}>
                    <Ionicons name={isRecording ? 'stop' : 'mic'} size={32} color="white" />
                  </Animated.View>
                </TouchableOpacity>
              )}

              <TextInput
                style={styles.contextInput}
                placeholder="Or type details here"
                placeholderTextColor="#999"
                value={contextText}
                onChangeText={setContextText}
                multiline
              />

              {(audioUri || contextText || isRecording) && (
                <TouchableOpacity style={styles.analyzeButton} onPress={startAnalysis}>
                  <Text style={styles.analyzeButtonText}>Analyze Meal</Text>
                </TouchableOpacity>
              )}

              {!audioUri && !contextText && !isRecording && (
                <TouchableOpacity style={styles.skipButton} onPress={startAnalysis}>
                  <Text style={styles.skipButtonText}>Skip & Analyze</Text>
                </TouchableOpacity>
              )}
            </BlurView>
            </Animated.View>
          </TouchableWithoutFeedback>
        )}

        {/* PHASE 3: LOADING STATE */}
        {mode === 'ANALYZING' && (
            <View style={styles.analyzingContainer}>
                <View style={styles.overlayDark} />
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 20 }} />
                <Text style={styles.analyzingText}>Processing your input</Text>
            </View>
        )}

        {/* PHASE 4: RESULTS PANEL (MODAL) */}
        <MealReviewModal
            visible={reviewModalVisible}
            onClose={() => {
                setReviewModalVisible(false);
                router.back(); // Abort
            }}
            onRetake={() => {
                setReviewModalVisible(false);
                setMode('CAMERA');
                setImageUri(null);
                setAudioUri(null);
                setContextText("");
            }}
            onSave={handleSave}
            initialData={{
                name: mealName,
                calories,
                protein,
                carbs,
                fat,
                mealQualityScore,
                goalFitPercentage,
                calorieDensity,
                transcription: transcription || contextText,
                mealType,
                date: selectedDate,
            }}
        />

        {/* ERROR MODAL */}
        <MealReviewModal
            visible={errorModalVisible}
            onClose={() => {
                setErrorModalVisible(false);
                router.back(); // Abort
            }}
            onRetake={() => {
                setErrorModalVisible(false);
                setMode('CAMERA');
                setImageUri(null);
                setAudioUri(null);
                setContextText("");
            }}
            onSave={() => {}} // Not used in error mode
            initialData={{
                name: "",
                calories: "0",
                protein: "0",
                carbs: "0",
                fat: "0",
                transcription: "",
            }}
            isError={true}
        />
    </View>
  );
};


// (Removed old bar-based waveform; replaced by IOSWaveform)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  permissionText: {
    color: 'white',
    marginBottom: 20,
  },
  permissionButton: {
    padding: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Phase 1: Camera
  closeButton: {
    position: 'absolute',
    left: 20,
    zIndex: 100,
  },
  galleryButton: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  closeButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  focusSquare: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#FFD700', // Gold
    borderRadius: 8,
    zIndex: 50,
  },
  // Phase 2: Context Input
  contextContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    padding: 20,
  },
  contextCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  waveformWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  contextTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  micButtonBig: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  micButtonActive: {
    backgroundColor: '#FF3B30', // Red when recording
  },
  contextInput: {
    width: '100%',
    fontSize: 17,
    color: 'white',
    textAlign: 'center',
    padding: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    minHeight: 50,
  },
  analyzeButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    padding: 10,
  },
  skipButtonText: {
    color: '#999',
    fontSize: 14,
  },
  // Phase 3: Analyzing
  analyzingContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scannerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  analyzingTextContainer: {
    position: 'absolute',
    bottom: 100,
  },
  analyzingText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  previewActionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  previewPrimaryButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'white',
  },
  previewActionText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

export default CaptureWaitReviewContainer;
