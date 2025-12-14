import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Audio } from 'expo-av';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Shadows, BorderRadius, Typography } from '../constants/theme';

export default function RecordAudioScreen() {
  const { imageUri } = useLocalSearchParams();
  const [recording, setRecording] = useState<Audio.Recording | undefined>(undefined);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [sound, setSound] = useState<Audio.Sound | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [recording, sound]);

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        await requestPermission();
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync( 
         Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      Alert.alert('Failed to start recording', 'Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI(); 
    setAudioUri(uri);
  };

  const playSound = async () => {
    if (!audioUri) return;
    
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
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

  const handleNext = () => {
    if (!audioUri) {
      Alert.alert("Required", "Please record a description of your meal.");
      return;
    }
    
    router.push({
      pathname: "/add-meal",
      params: { 
        imageUri: imageUri as string,
        audioUri: audioUri 
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Describe Meal</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Image source={{ uri: imageUri as string }} style={styles.previewImage} />
        
        <Text style={styles.instruction}>
          Describe how you made this meal...
        </Text>

        <View style={styles.audioControls}>
           <TouchableOpacity 
              style={[styles.recordButton, recording ? styles.recordingActive : {}]} 
              onPress={recording ? stopRecording : startRecording}
            >
              <Ionicons name={recording ? "stop" : "mic"} size={32} color="white" />
           </TouchableOpacity>
           
           <Text style={styles.statusText}>
             {recording ? "Recording..." : (audioUri ? "Recorded" : "Tap to Record")}
           </Text>

           {audioUri && !recording && (
             <TouchableOpacity style={styles.playButton} onPress={isPlaying ? stopSound : playSound}>
               <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={Colors.primary} />
             </TouchableOpacity>
           )}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, !audioUri && styles.disabledButton]} 
          onPress={handleNext}
          disabled={!audioUri}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    gap: 30,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  instruction: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  audioControls: {
    alignItems: 'center',
    gap: 15,
    width: '100%',
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  recordingActive: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  playButton: {
    marginTop: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    ...Shadows.medium,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
