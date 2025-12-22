import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing } from "../../../constants/theme";

export default function BasicInfo() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [errors, setErrors] = useState({ age: "", height: "", weight: "" });
  const progressAnim = useRef(new Animated.Value(0.28)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.42,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";
  const inputBg = isDark ? "#2a2a2a" : "#f5f5f5";
  const placeholderColor = isDark ? "#888" : "#9aa5a0";

  const validate = () => {
    const newErrors = { age: "", height: "", weight: "" };
    let isValid = true;

    const ageNum = parseInt(age);
    if (!age) {
      newErrors.age = "Age is required";
      isValid = false;
    } else if (isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
      newErrors.age = "Age must be between 10 and 120";
      isValid = false;
    }

    const heightNum = parseFloat(height);
    if (!height) {
      newErrors.height = "Height is required";
      isValid = false;
    } else if (isNaN(heightNum) || heightNum < 50 || heightNum > 250) {
      newErrors.height = "Height must be between 50 and 250 cm";
      isValid = false;
    }

    const weightNum = parseFloat(weight);
    if (!weight) {
      newErrors.weight = "Weight is required";
      isValid = false;
    } else if (isNaN(weightNum) || weightNum < 20 || weightNum > 500) {
      newErrors.weight = "Weight must be between 20 and 500 kg";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validate()) {
      router.push({
        pathname: "/screens/onboarding/activity-level",
        params: { ...params, age, height, weight },
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: textColor }]}>
            Tell us about yourself!
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: secondaryText }]}>
                  Age
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: inputBg, color: textColor },
                    errors.age ? styles.inputError : null,
                  ]}
                  placeholder="Enter your age"
                  placeholderTextColor={placeholderColor}
                  value={age}
                  onChangeText={(text) => {
                    setAge(text);
                    if (errors.age) setErrors({ ...errors, age: "" });
                  }}
                  keyboardType="number-pad"
                />
                {errors.age ? (
                  <Text style={styles.errorText}>{errors.age}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons
                  name="resize-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: secondaryText }]}>
                  Height
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: inputBg, color: textColor },
                    errors.height ? styles.inputError : null,
                  ]}
                  placeholder="cm"
                  placeholderTextColor={placeholderColor}
                  value={height}
                  onChangeText={(text) => {
                    setHeight(text);
                    if (errors.height) setErrors({ ...errors, height: "" });
                  }}
                  keyboardType="decimal-pad"
                />
                {errors.height ? (
                  <Text style={styles.errorText}>{errors.height}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons
                  name="scale-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: secondaryText }]}>
                  Weight
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: inputBg, color: textColor },
                    errors.weight ? styles.inputError : null,
                  ]}
                  placeholder="kg"
                  placeholderTextColor={placeholderColor}
                  value={weight}
                  onChangeText={(text) => {
                    setWeight(text);
                    if (errors.weight) setErrors({ ...errors, weight: "" });
                  }}
                  keyboardType="decimal-pad"
                />
                {errors.weight ? (
                  <Text style={styles.errorText}>{errors.weight}</Text>
                ) : null}
              </View>
            </View>
          </View>

          
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!age || !height || !weight) && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!age || !height || !weight}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  skipText: {
    fontSize: 14,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl * 2,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xl * 2,
  },
  form: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    fontWeight: "600",
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
