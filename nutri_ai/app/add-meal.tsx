import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Typography, Colors } from "@/constants/theme";
/* this is just a placeholder screen */
const AddMealScreen = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={Colors.text.light} />
      </TouchableOpacity>
      <Text style={styles.title}>Add a Meal</Text>
      {/* Add meal form will go here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background.light,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 60,
  },
});

export default AddMealScreen;
