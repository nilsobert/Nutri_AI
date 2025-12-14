import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants/theme';

export default function CaptureMealScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();
  const [recording, setRecording] = useState<Audio.Recording | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const isPressed = useRef(false);

  if (!permission || !audioPermission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  if (!audioPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to record audio</Text>
        <Button onPress={requestAudioPermission} title="grant permission" />
      </View>
    );
  }

  const startRecording = async () => {
    isPressed.current = true;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      if (!isPressed.current) {
        // User released button while initializing
        await recording.stopAndUnloadAsync();
        return;
      }

      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecordingAndCapture = async () => {
    isPressed.current = false;
    if (!recording) return;

    console.log('Stopping recording and capturing...');
    setIsRecording(false);

    try {
      // 1. Take Picture
      let photoUri = null;
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        photoUri = photo?.uri;
      }

      // 2. Stop Audio
      await recording.stopAndUnloadAsync();
      const audioUri = recording.getURI();
      setRecording(undefined);

      if (photoUri && audioUri) {
        // Navigate to Add Meal Screen
        router.push({
          pathname: "/add-meal",
          params: { 
            imageUri: photoUri,
            audioUri: audioUri 
          }
        });
      } else {
        Alert.alert("Error", "Failed to capture both image and audio.");
      }

    } catch (error) {
      console.error("Error capturing:", error);
      Alert.alert("Error", "Something went wrong during capture.");
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          <View style={styles.controlsContainer}>
            <Text style={styles.instructionText}>
              {isRecording ? "Recording..." : "Hold to Record & Capture"}
            </Text>
            <TouchableOpacity
              style={[styles.captureButton, isRecording && styles.captureButtonActive]}
              onPressIn={startRecording}
              onPressOut={stopRecordingAndCapture}
              activeOpacity={0.8}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: Spacing.xl,
  },
  closeButton: {
    alignSelf: 'flex-start',
    marginTop: 40,
    padding: 10,
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 20,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonActive: {
    borderColor: Colors.primary, // Or red
    backgroundColor: 'rgba(255, 59, 48, 0.3)', // Red tint
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
});
