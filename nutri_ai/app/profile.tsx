import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import {
  IUser,
  MedicalCondition,
  MotivationToTrackCalories,
} from "@/types/user";
import { useUser } from "@/context/UserContext";

interface InfoRowProps {
  label: string;
  value: string;
  icon: string;
  isLast?: boolean;
  isDark: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  icon,
  isLast,
  isDark,
}) => {
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";
  const borderColor = isDark ? "#333" : "#f0f0f0";

  return (
    <View style={styles.infoRowContainer}>
      <View style={styles.infoRowContent}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
          ]}
        >
          <Ionicons name={icon as any} size={20} color={Colors.primary} />
        </View>
        <View style={styles.infoTextContainer}>
          <Text style={[styles.infoLabel, { color: secondaryText }]}>
            {label}
          </Text>
          <Text style={[styles.infoValue, { color: textColor }]}>{value}</Text>
        </View>
      </View>
      {!isLast && (
        <View style={[styles.divider, { backgroundColor: borderColor }]} />
      )}
    </View>
  );
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { profileImage, setProfileImage, user, logout } = useUser();

  const handleLogout = async () => {
    await logout();
    router.dismissAll();
    router.replace("/");
  };

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";

  const formatMotivation = (motivation: string) => {
    return motivation.replace(/([A-Z])/g, " $1").trim();
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 60 + insets.top },
        ]}
      >
        {/* Profile Header Card */}
        <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
              <View style={styles.avatar}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Text>
                )}
                <View style={styles.editIconContainer}>
                  <Ionicons name="camera" size={14} color="white" />
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.profileHeaderText}>
              <Text style={[styles.userName, { color: textColor }]}>
                {user?.name}
              </Text>
              <Text style={[styles.userEmail, { color: secondaryText }]}>
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Personal Info Section */}
        <Text style={[styles.sectionTitle, { color: secondaryText }]}>
          PERSONAL INFO
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
          <InfoRow
            label="Age"
            value={`${user?.age} years`}
            icon="calendar-outline"
            isDark={isDark}
          />
          <InfoRow
            label="Weight"
            value={`${user?.weightKg} kg`}
            icon="scale-outline"
            isDark={isDark}
          />
          <InfoRow
            label="Email"
            value={user?.email || ""}
            icon="mail-outline"
            isLast
            isDark={isDark}
          />
        </View>

        {/* Health & Goals Section */}
        <Text style={[styles.sectionTitle, { color: secondaryText }]}>
          HEALTH & GOALS
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
          <InfoRow
            label="Motivation"
            value={formatMotivation(
              user?.motivation || MotivationToTrackCalories.LeadAHealthyLife,
            )}
            icon="trophy-outline"
            isDark={isDark}
          />
          <InfoRow
            label="Medical Condition"
            value={user?.medicalCondition || MedicalCondition.None}
            icon="medical-outline"
            isLast
            isDark={isDark}
          />
        </View>

        {/* Settings Section */}
        <Text style={[styles.sectionTitle, { color: secondaryText }]}>
          SETTINGS
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                ]}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <Text style={[styles.menuItemText, { color: textColor }]}>
                App Settings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={secondaryText} />
          </TouchableOpacity>
          <View
            style={[
              styles.divider,
              { backgroundColor: isDark ? "#333" : "#f0f0f0" },
            ]}
          />
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuItemContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                ]}
              >
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={Colors.secondary.fat}
                />
              </View>
              <Text
                style={[styles.menuItemText, { color: Colors.secondary.fat }]}
              >
                Log Out
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Glass Header */}
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.absoluteHeader,
          {
            paddingTop: insets.top,
            height: 44 + insets.top, // Force thin header
            borderBottomColor: isDark ? "#333" : "#ccc",
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Profile
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  absoluteHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 100,
    justifyContent: "center",
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 44,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "bold",
    letterSpacing: 0.3,
    lineHeight: 41, // Ensure line height fits
  },
  doneButtonText: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: Spacing.lg,
  },
  profileCard: {
    borderRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
    ...Shadows.small,
    position: "relative",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.text.light,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profileHeaderText: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.bold,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: Typography.sizes.base,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    letterSpacing: 1,
  },
  sectionCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.small,
  },
  infoRowContainer: {
    paddingVertical: Spacing.xs,
  },
  infoRowContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.sizes.xs,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  divider: {
    height: 1,
    marginLeft: 52, // Align with text start (icon width + margin)
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
});
