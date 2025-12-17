import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import { Colors, Spacing } from "../../constants/theme";
import { useUser } from "../../context/UserContext";
import { ActivityLevel, Gender, MedicalCondition } from "../../types/user";

export default function EditProfile() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user, saveUser } = useUser();

  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState(user?.age?.toString() || "");
  const [heightCm, setHeightCm] = useState(user?.heightCm?.toString() || "");
  const [weightKg, setWeightKg] = useState(user?.weightKg?.toString() || "");
  const [gender, setGender] = useState<Gender>(user?.gender || Gender.Male);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    user?.activityLevel || ActivityLevel.Moderate,
  );
  const [medicalCondition, setMedicalCondition] = useState<MedicalCondition>(
    user?.medicalCondition || MedicalCondition.None,
  );

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;
  const secondaryText = isDark
    ? Colors.secondaryText.dark
    : Colors.secondaryText.light;

  const handleSave = async () => {
    if (!name || !age || !heightCm || !weightKg) {
      Alert.alert("Missing Fields", "Please fill in all required fields");
      return;
    }

    try {
      const updatedUser = user!;
      updatedUser.name = name;
      updatedUser.age = parseInt(age);
      updatedUser.heightCm = parseFloat(heightCm);
      updatedUser.weightKg = parseFloat(weightKg);
      updatedUser.gender = gender;
      updatedUser.activityLevel = activityLevel;
      updatedUser.medicalCondition = medicalCondition;

      await saveUser(updatedUser);

      Alert.alert("Success", "Profile updated successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
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
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Edit Profile
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.saveButton, { color: Colors.primary }]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: secondaryText }]}>NAME</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: cardBg, color: textColor },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={secondaryText}
            />
          </View>

          {/* Age */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: secondaryText }]}>AGE</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: cardBg, color: textColor },
              ]}
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              placeholderTextColor={secondaryText}
              keyboardType="number-pad"
            />
          </View>

          {/* Height */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: secondaryText }]}>
              HEIGHT (CM)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: cardBg, color: textColor },
              ]}
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="Enter your height"
              placeholderTextColor={secondaryText}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Weight */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: secondaryText }]}>
              WEIGHT (KG)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: cardBg, color: textColor },
              ]}
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="Enter your weight"
              placeholderTextColor={secondaryText}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: secondaryText }]}>GENDER</Text>
            <View style={styles.segmentedControl}>
              {Object.values(Gender).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.segment,
                    { backgroundColor: cardBg },
                    gender === g && { backgroundColor: Colors.primary },
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: gender === g ? "#fff" : textColor },
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Activity Level */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: secondaryText }]}>
              ACTIVITY LEVEL
            </Text>
            <View style={styles.segmentedControl}>
              {Object.values(ActivityLevel).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.segment,
                    { backgroundColor: cardBg },
                    activityLevel === level && {
                      backgroundColor: Colors.primary,
                    },
                  ]}
                  onPress={() => setActivityLevel(level)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: activityLevel === level ? "#fff" : textColor },
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Medical Condition */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: secondaryText }]}>
              MEDICAL CONDITION
            </Text>
            <View style={styles.pickerContainer}>
              {Object.values(MedicalCondition).map((condition) => (
                <TouchableOpacity
                  key={condition}
                  style={[
                    styles.pickerItem,
                    { backgroundColor: cardBg },
                    medicalCondition === condition && {
                      borderColor: Colors.primary,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setMedicalCondition(condition)}
                >
                  <Text style={[styles.pickerText, { color: textColor }]}>
                    {condition}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    gap: Spacing.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
  },
  pickerContainer: {
    gap: Spacing.sm,
  },
  pickerItem: {
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  pickerText: {
    fontSize: 16,
  },
});
