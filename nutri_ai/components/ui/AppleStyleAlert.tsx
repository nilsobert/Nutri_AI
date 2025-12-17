import React from "react";
import { Modal, View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

interface AppleStyleAlertProps {
  visible: boolean;
  text: string;
}

export const AppleStyleAlert: React.FC<AppleStyleAlertProps> = ({
  visible,
  text,
}) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.centeredView}>
        <View style={styles.alertContainer}>
          <BlurView intensity={50} tint="dark" style={styles.blurView}>
            <ActivityIndicator
              size="large"
              color="#FFFFFF"
              style={styles.spinner}
            />
            <Text style={styles.text}>{text}</Text>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)", // Very subtle dimming
  },
  alertContainer: {
    width: 160,
    height: 160,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(30, 30, 30, 0.85)", // Fallback/Base for blur
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  blurView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  spinner: {
    marginBottom: 16,
    transform: [{ scale: 1.2 }], // Make it slightly larger
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },
});
