import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Alert,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "@/context/UserContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import {
  ActivityLevel,
  MotivationToTrackCalories,
  WeightGoalType,
  WeightLossRate,
  User,
} from "@/types/user";
import { calculateGoals } from "@/lib/utils/goals";

// Helper to format enum values for display
const formatEnum = (value: string) => {
  return value.replace(/([A-Z])/g, " $1").trim();
};

interface SelectionModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  isDark: boolean;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  isDark,
}) => {
  const bgColor = isDark ? Colors.cardBackground.dark : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textColor }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  item === selectedValue && { backgroundColor: isDark ? "#333" : "#f0f0f0" },
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: item === selectedValue ? Colors.primary : textColor },
                    item === selectedValue && { fontWeight: "bold" },
                  ]}
                >
                  {formatEnum(item)}
                </Text>
                {item === selectedValue && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

export default function EditGoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, saveUser } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // State for form fields
  const [motivation, setMotivation] = useState<MotivationToTrackCalories>(
    user?.motivation || MotivationToTrackCalories.LeadAHealthyLife
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    user?.activityLevel || ActivityLevel.Moderate
  );
  const [weight, setWeight] = useState(user?.weightKg?.toString() || "");
  const [targetWeight, setTargetWeight] = useState(
    user?.targetWeightKg?.toString() || ""
  );
  const [weightGoalType, setWeightGoalType] = useState<WeightGoalType>(
    user?.weightGoalType || WeightGoalType.Maintain
  );
  const [weightLossRate, setWeightLossRate] = useState<WeightLossRate>(
    user?.weightLossRate || WeightLossRate.Moderate
  );

  // Custom Goals State
  const [isCustomGoals, setIsCustomGoals] = useState(user?.isCustomGoals || false);
  const [customCalories, setCustomCalories] = useState(
    user?.customCalories?.toString() || ""
  );
  const [customProtein, setCustomProtein] = useState(
    user?.customProtein?.toString() || ""
  );
  const [customCarbs, setCustomCarbs] = useState(
    user?.customCarbs?.toString() || ""
  );
  const [customFat, setCustomFat] = useState(user?.customFat?.toString() || "");

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"motivation" | "activity" | "goalType" | "rate" | null>(null);

  // Derived values for preview
  const [previewGoals, setPreviewGoals] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    // Create a temporary user object to calculate goals
    const tempUser: User = {
      ...user, // Copy existing user props
      motivation,
      activityLevel,
      weightKg: parseFloat(weight) || user.weightKg,
      targetWeightKg: parseFloat(targetWeight) || undefined,
      weightGoalType,
      weightLossRate,
      isCustomGoals,
      customCalories: parseFloat(customCalories) || undefined,
      customProtein: parseFloat(customProtein) || undefined,
      customCarbs: parseFloat(customCarbs) || undefined,
      customFat: parseFloat(customFat) || undefined,
    };

    setPreviewGoals(calculateGoals(tempUser));
  }, [
    motivation,
    activityLevel,
    weight,
    targetWeight,
    weightGoalType,
    weightLossRate,
    isCustomGoals,
    customCalories,
    customProtein,
    customCarbs,
    customFat,
    user,
  ]);

  const handleSave = async () => {
    if (!user) return;

    try {
      const updatedUser: User = {
        ...user,
        motivation,
        activityLevel,
        weightKg: parseFloat(weight) || user.weightKg,
        targetWeightKg: parseFloat(targetWeight) || undefined,
        weightGoalType,
        weightLossRate,
        isCustomGoals,
        customCalories: isCustomGoals ? parseFloat(customCalories) : undefined,
        customProtein: isCustomGoals ? parseFloat(customProtein) : undefined,
        customCarbs: isCustomGoals ? parseFloat(customCarbs) : undefined,
        customFat: isCustomGoals ? parseFloat(customFat) : undefined,
      };

      await saveUser(updatedUser);
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to save goals. Please check your inputs.");
    }
  };

  const openModal = (type: "motivation" | "activity" | "goalType" | "rate") => {
    setModalType(type);
    setModalVisible(true);
  };

  const getModalOptions = () => {
    switch (modalType) {
      case "motivation":
        return Object.values(MotivationToTrackCalories);
      case "activity":
        return Object.values(ActivityLevel);
      case "goalType":
        return Object.values(WeightGoalType);
      case "rate":
        return Object.values(WeightLossRate);
      default:
        return [];
    }
  };

  const handleModalSelect = (value: string) => {
    switch (modalType) {
      case "motivation":
        setMotivation(value as MotivationToTrackCalories);
        break;
      case "activity":
        setActivityLevel(value as ActivityLevel);
        break;
      case "goalType":
        setWeightGoalType(value as WeightGoalType);
        break;
      case "rate":
        setWeightLossRate(value as WeightLossRate);
        break;
    }
  };

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const cardBg = isDark ? Colors.cardBackground.dark : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";
  const borderColor = isDark ? "#333" : "#f0f0f0";

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.header,
          { paddingTop: insets.top, height: 44 + insets.top },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Edit Goals
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.headerButtonText, { fontWeight: "bold" }]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 60 + insets.top },
        ]}
      >
        {/* Preview Card */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: secondaryText }]}>
            ESTIMATED DAILY TARGETS
          </Text>
          <View style={styles.previewRow}>
            <View style={styles.previewItem}>
              <Text style={[styles.previewValue, { color: Colors.primary }]}>
                {previewGoals?.calories || 0}
              </Text>
              <Text style={[styles.previewLabel, { color: secondaryText }]}>
                Calories
              </Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewItem}>
              <Text style={[styles.previewValue, { color: Colors.secondary.protein }]}>
                {previewGoals?.protein || 0}g
              </Text>
              <Text style={[styles.previewLabel, { color: secondaryText }]}>
                Protein
              </Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewItem}>
              <Text style={[styles.previewValue, { color: Colors.secondary.carbs }]}>
                {previewGoals?.carbs || 0}g
              </Text>
              <Text style={[styles.previewLabel, { color: secondaryText }]}>
                Carbs
              </Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewItem}>
              <Text style={[styles.previewValue, { color: Colors.secondary.fat }]}>
                {previewGoals?.fat || 0}g
              </Text>
              <Text style={[styles.previewLabel, { color: secondaryText }]}>
                Fat
              </Text>
            </View>
          </View>
        </View>

        {/* Basic Settings */}
        <Text style={[styles.sectionHeader, { color: secondaryText }]}>
          BASIC SETTINGS
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, padding: 0 }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => openModal("motivation")}
          >
            <Text style={[styles.rowLabel, { color: textColor }]}>Motivation</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: secondaryText }]}>
                {formatEnum(motivation)}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={secondaryText} />
            </View>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <TouchableOpacity
            style={styles.row}
            onPress={() => openModal("activity")}
          >
            <Text style={[styles.rowLabel, { color: textColor }]}>
              Activity Level
            </Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: secondaryText }]}>
                {formatEnum(activityLevel)}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={secondaryText} />
            </View>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: textColor }]}>Current Weight (kg)</Text>
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={secondaryText}
            />
          </View>
        </View>

        {/* Weight Goal Settings */}
        <Text style={[styles.sectionHeader, { color: secondaryText }]}>
          WEIGHT GOAL
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, padding: 0 }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => openModal("goalType")}
          >
            <Text style={[styles.rowLabel, { color: textColor }]}>Goal Type</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: secondaryText }]}>
                {formatEnum(weightGoalType)}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={secondaryText} />
            </View>
          </TouchableOpacity>

          {weightGoalType !== WeightGoalType.Maintain && (
            <>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: textColor }]}>
                  Target Weight (kg)
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={secondaryText}
                />
              </View>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <TouchableOpacity
                style={styles.row}
                onPress={() => openModal("rate")}
              >
                <Text style={[styles.rowLabel, { color: textColor }]}>Pace</Text>
                <View style={styles.rowRight}>
                  <Text style={[styles.rowValue, { color: secondaryText }]}>
                    {formatEnum(weightLossRate)}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={secondaryText} />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Custom Goals Toggle */}
        <Text style={[styles.sectionHeader, { color: secondaryText }]}>
          ADVANCED
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, padding: 0 }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: textColor }]}>
              Use Custom Macros
            </Text>
            <Switch
              value={isCustomGoals}
              onValueChange={setIsCustomGoals}
              trackColor={{ false: "#767577", true: Colors.primary }}
            />
          </View>

          {isCustomGoals && (
            <>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: textColor }]}>
                  Calories (kcal)
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={customCalories}
                  onChangeText={setCustomCalories}
                  keyboardType="numeric"
                  placeholder="2000"
                  placeholderTextColor={secondaryText}
                />
              </View>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: textColor }]}>
                  Protein (g)
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={customProtein}
                  onChangeText={setCustomProtein}
                  keyboardType="numeric"
                  placeholder="150"
                  placeholderTextColor={secondaryText}
                />
              </View>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: textColor }]}>
                  Carbs (g)
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={customCarbs}
                  onChangeText={setCustomCarbs}
                  keyboardType="numeric"
                  placeholder="250"
                  placeholderTextColor={secondaryText}
                />
              </View>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: textColor }]}>
                  Fat (g)
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={customFat}
                  onChangeText={setCustomFat}
                  keyboardType="numeric"
                  placeholder="70"
                  placeholderTextColor={secondaryText}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <SelectionModal
        visible={modalVisible}
        title={modalType ? formatEnum(modalType).toUpperCase() : ""}
        options={getModalOptions()}
        selectedValue={
          modalType === "motivation"
            ? motivation
            : modalType === "activity"
            ? activityLevel
            : modalType === "goalType"
            ? weightGoalType
            : weightLossRate
        }
        onSelect={handleModalSelect}
        onClose={() => setModalVisible(false)}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerButtonText: {
    fontSize: 17,
    color: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.md,
    letterSpacing: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewItem: {
    alignItems: "center",
    flex: 1,
  },
  previewValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  previewLabel: {
    fontSize: 12,
  },
  previewDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#ccc",
    opacity: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    minHeight: 50,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowValue: {
    fontSize: 16,
  },
  input: {
    fontSize: 16,
    textAlign: "right",
    minWidth: 100,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  optionText: {
    fontSize: 16,
  },
});
