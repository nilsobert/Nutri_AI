import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useColorScheme,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
  Typography,
} from "../../constants/theme";
import { MealCategory } from "../../types/mealEntry";

interface MealReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onRetake: () => void;
  onSave: (data: any) => void;
  initialData: {
    name: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    mealQualityScore?: number;
    goalFitPercentage?: number;
    calorieDensity?: number;
    transcription: string;
    mealType?: MealCategory;
    date?: Date;
  };
  isError?: boolean;
}

export const MealReviewModal: React.FC<MealReviewModalProps> = ({
  visible,
  onClose,
  onRetake,
  onSave,
  initialData,
  isError = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [mealName, setMealName] = useState(initialData.name);
  const [calories, setCalories] = useState(initialData.calories);
  const [protein, setProtein] = useState(initialData.protein);
  const [carbs, setCarbs] = useState(initialData.carbs);
  const [fat, setFat] = useState(initialData.fat);
  const [mealQualityScore, setMealQualityScore] = useState(
    (initialData.mealQualityScore || 0).toString(),
  );
  const [goalFitPercentage, setGoalFitPercentage] = useState(
    (initialData.goalFitPercentage || 0).toString(),
  );
  const [calorieDensity, setCalorieDensity] = useState(
    (initialData.calorieDensity || 0).toString(),
  );
  const [transcription, setTranscription] = useState(initialData.transcription);
  const [mealType, setMealType] = useState<MealCategory>(
    initialData.mealType || MealCategory.Lunch,
  );
  const [selectedDate, setSelectedDate] = useState(
    initialData.date || new Date(),
  );

  // Reset state when initialData changes or modal opens
  useEffect(() => {
    if (visible) {
      setMealName(initialData.name);
      setCalories(initialData.calories);
      setProtein(initialData.protein);
      setCarbs(initialData.carbs);
      setFat(initialData.fat);
      setMealQualityScore((initialData.mealQualityScore || 0).toString());
      setGoalFitPercentage((initialData.goalFitPercentage || 0).toString());
      setCalorieDensity((initialData.calorieDensity || 0).toString());
      setTranscription(initialData.transcription);

      // Set default meal type based on calories if under 150, otherwise based on time
      if (parseInt(initialData.calories) < 150) {
        setMealType(MealCategory.Snack);
      } else if (!initialData.mealType) {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) setMealType(MealCategory.Breakfast);
        else if (hour >= 11 && hour < 16) setMealType(MealCategory.Lunch);
        else if (hour >= 16 && hour < 22) setMealType(MealCategory.Dinner);
        else setMealType(MealCategory.Snack);
      } else {
        setMealType(initialData.mealType);
      }

      setSelectedDate(initialData.date || new Date());
    }
  }, [visible, initialData]);

  const handleSave = () => {
    onSave({
      name: mealName,
      calories,
      protein,
      carbs,
      fat,
      mealQualityScore: parseFloat(mealQualityScore) || 0,
      goalFitPercentage: parseFloat(goalFitPercentage) || 0,
      calorieDensity: parseFloat(calorieDensity) || 0,
      transcription,
      mealType,
      date: selectedDate,
    });
  };

  if (isError) {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.centeredView}>
          <BlurView
            intensity={80}
            tint={isDark ? "dark" : "light"}
            style={styles.errorCard}
          >
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={48} color={"#FF3B30"} />
            </View>
            <Text
              style={[
                styles.errorTitle,
                { color: isDark ? Colors.text.dark : Colors.text.light },
              ]}
            >
              No Meal Detected
            </Text>
            <Text
              style={[
                styles.errorMessage,
                {
                  color: isDark ? Colors.text.dark : Colors.text.light,
                  opacity: 0.7,
                },
              ]}
            >
              We couldn{"'"}t identify a meal in your photo. Please try again or
              enter details manually.
            </Text>

            <View style={styles.errorButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.errorButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  },
                ]}
                onPress={onClose}
              >
                <Text
                  style={[
                    styles.errorButtonText,
                    { color: isDark ? Colors.text.dark : Colors.text.light },
                  ]}
                >
                  Abort
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.errorButton,
                  { backgroundColor: Colors.primary },
                ]}
                onPress={onRetake}
              >
                <Text style={[styles.errorButtonText, { color: "white" }]}>
                  Retake
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={onClose} // Handles swipe down on iOS
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark
              ? Colors.background.dark
              : Colors.background.light,
          },
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: isDark ? "#333" : "#E5E5EA" },
          ]}
        >
          <TouchableOpacity onPress={onRetake} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Retake</Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? Colors.text.dark : Colors.text.light },
            ]}
          >
            Review Meal
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: "#FF3B30" }]}>
              Abort
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* AI Estimation Notice */}
          <View style={[styles.noticeContainer, { backgroundColor: isDark ? 'rgba(52, 152, 219, 0.15)' : '#E3F2FD' }]}>
            <Ionicons name="information-circle" size={24} color={Colors.primary} style={styles.noticeIcon} />
            <Text style={[styles.noticeText, { color: isDark ? Colors.text.dark : Colors.text.light }]}>
              These values are AI-generated estimates based on your image and audio. Please review and adjust as needed.
            </Text>
          </View>

          {/* Meal Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: isDark ? "#999" : "#666" }]}>
              MEAL NAME
            </Text>
            <TextInput
              style={[
                styles.mealNameInput,
                { color: isDark ? Colors.text.dark : Colors.text.light },
              ]}
              value={mealName}
              onChangeText={setMealName}
              placeholder="Enter meal name"
              placeholderTextColor={isDark ? "#666" : "#999"}
              multiline
            />
          </View>

          {/* Transcription */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: isDark ? "#999" : "#666" }]}>
              DESCRIPTION
            </Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" },
              ]}
            >
              <TextInput
                style={[
                  styles.textArea,
                  { color: isDark ? Colors.text.dark : Colors.text.light },
                ]}
                value={transcription}
                onChangeText={setTranscription}
                placeholder="Add notes or description..."
                placeholderTextColor={isDark ? "#666" : "#999"}
                multiline
                scrollEnabled={false}
              />
            </View>
          </View>

          {/* Nutrition */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: isDark ? "#999" : "#666" }]}>
              NUTRITION
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" },
              ]}
            >
              <EditableMetricRow
                label="Calories"
                value={calories}
                onChange={setCalories}
                icon="flame"
                color={Colors.primary}
                isDark={isDark}
                unit="kcal"
              />
              <Divider isDark={isDark} />
              <EditableMetricRow
                label="Protein"
                value={protein}
                onChange={setProtein}
                icon="fitness"
                color={Colors.secondary?.protein || "#FF9500"}
                isDark={isDark}
              />
              <Divider isDark={isDark} />
              <EditableMetricRow
                label="Carbs"
                value={carbs}
                onChange={setCarbs}
                icon="nutrition"
                color={Colors.secondary?.carbs || "#30B0C7"}
                isDark={isDark}
              />
              <Divider isDark={isDark} />
              <EditableMetricRow
                label="Fat"
                value={fat}
                onChange={setFat}
                icon="water"
                color={Colors.secondary?.fat || "#AF52DE"}
                isDark={isDark}
              />
            </View>
          </View>

          {/* Analysis */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: isDark ? "#999" : "#666" }]}>
              ANALYSIS
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" },
              ]}
            >
              <EditableMetricRow
                label="Quality Score"
                value={mealQualityScore}
                onChange={setMealQualityScore}
                icon="ribbon"
                color="#FFD700"
                isDark={isDark}
                unit="/10"
              />
              <Divider isDark={isDark} />
              <EditableMetricRow
                label="Goal Fit"
                value={goalFitPercentage}
                onChange={setGoalFitPercentage}
                icon="checkmark-circle"
                color="#34C759"
                isDark={isDark}
                unit="%"
              />
              <Divider isDark={isDark} />
              <EditableMetricRow
                label="Calorie Density"
                value={calorieDensity}
                onChange={setCalorieDensity}
                icon="flash"
                color="#FF9500"
                isDark={isDark}
                unit="cal/g"
              />
            </View>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: isDark ? "#999" : "#666" }]}>
              DETAILS
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" },
              ]}
            >
              <View style={styles.row}>
                <View style={styles.rowLabelContainer}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={isDark ? "#999" : "#666"}
                    style={styles.rowIcon}
                  />
                  <Text
                    style={[
                      styles.rowLabel,
                      { color: isDark ? Colors.text.dark : Colors.text.light },
                    ]}
                  >
                    Date
                  </Text>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => date && setSelectedDate(date)}
                  themeVariant={isDark ? "dark" : "light"}
                  style={{ marginRight: -10 }} // Adjust alignment
                />
              </View>
              <Divider isDark={isDark} />
              <View style={styles.row}>
                <View style={styles.rowLabelContainer}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={isDark ? "#999" : "#666"}
                    style={styles.rowIcon}
                  />
                  <Text
                    style={[
                      styles.rowLabel,
                      { color: isDark ? Colors.text.dark : Colors.text.light },
                    ]}
                  >
                    Time
                  </Text>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display="default"
                  onChange={(event, date) => date && setSelectedDate(date)}
                  themeVariant={isDark ? "dark" : "light"}
                  style={{ marginRight: -10 }}
                />
              </View>
              <Divider isDark={isDark} />
              <View
                style={[
                  styles.row,
                  { alignItems: "flex-start", paddingVertical: 12 },
                ]}
              >
                <View style={[styles.rowLabelContainer, { marginTop: 4 }]}>
                  <Ionicons
                    name="restaurant-outline"
                    size={20}
                    color={isDark ? "#999" : "#666"}
                    style={styles.rowIcon}
                  />
                  <Text
                    style={[
                      styles.rowLabel,
                      { color: isDark ? Colors.text.dark : Colors.text.light },
                    ]}
                  >
                    Type
                  </Text>
                </View>
                <View style={styles.tagsContainer}>
                  {Object.values(MealCategory).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.tag,
                        mealType === cat
                          ? { backgroundColor: Colors.primary }
                          : { backgroundColor: isDark ? "#333" : "#E5E5EA" },
                      ]}
                      onPress={() => setMealType(cat)}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          mealType === cat
                            ? { color: "white" }
                            : { color: isDark ? "#CCC" : "#666" },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Footer Save Button */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: isDark
                ? Colors.background.dark
                : Colors.background.light,
              borderTopColor: isDark ? "#333" : "#E5E5EA",
            },
          ]}
        >
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Meal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const Divider = ({ isDark }: { isDark: boolean }) => (
  <View
    style={[styles.divider, { backgroundColor: isDark ? "#333" : "#E5E5EA" }]}
  />
);

const EditableMetricRow = ({
  label,
  value,
  onChange,
  icon,
  color,
  isDark,
  unit = "g",
}: any) => {
  const inputRef = useRef<TextInput>(null);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <View style={styles.row}>
      <View style={styles.rowLabelContainer}>
        <Ionicons name={icon} size={20} color={color} style={styles.rowIcon} />
        <Text
          style={[
            styles.rowLabel,
            { color: isDark ? Colors.text.dark : Colors.text.light },
          ]}
        >
          {label}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          setIsEditing(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        style={styles.valueContainer}
      >
        {isEditing ? (
          <TextInput
            ref={inputRef}
            style={[
              styles.valueInput,
              { color: isDark ? Colors.text.dark : Colors.text.light },
            ]}
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            onBlur={() => setIsEditing(false)}
            returnKeyType="done"
          />
        ) : (
          <Text style={[styles.valueText, { color: isDark ? "#999" : "#666" }]}>
            {value} <Text style={{ fontSize: 12 }}>{unit}</Text>
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 17,
    color: Colors.primary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  mealNameInput: {
    fontSize: 28,
    fontWeight: "bold",
    padding: 0,
  },
  inputContainer: {
    borderRadius: 12,
    padding: 12,
  },
  textArea: {
    fontSize: 16,
    minHeight: 60,
    lineHeight: 22,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    minHeight: 48,
  },
  rowLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
  },
  valueContainer: {
    minWidth: 60,
    alignItems: "flex-end",
  },
  valueText: {
    fontSize: 16,
  },
  valueInput: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
    minWidth: 60,
  },
  divider: {
    height: 0.5,
    marginLeft: 44,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
    justifyContent: "flex-end",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 0.5,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  // Error State
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  errorCard: {
    width: "80%",
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  errorButtonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  errorButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  noticeIcon: {
    marginRight: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
