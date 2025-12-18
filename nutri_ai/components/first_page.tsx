import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  TextStyles,
} from "../constants/theme";

export default function FirstPage() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const logoSize = 420;

  const spin = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  const btn1 = useRef(new Animated.Value(0)).current;
  const btn2 = useRef(new Animated.Value(0)).current;
  const btn3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(bob, {
          toValue: -8,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      Animated.stagger(140, [
        Animated.timing(btn1, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(btn2, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(btn3, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const rotateX = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const makeBtnStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateX: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-80, 0],
        }),
      },
    ],
  });

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            alignItems: "center",
            marginTop: Spacing.xl,
            marginBottom: Spacing.sm,
          }}
        >
          <Animated.View
            style={{
              width: logoSize,
              height: logoSize,
              alignItems: "center",
              justifyContent: "center",
              transform: [
                { perspective: 1200 },
                { rotateX },
                { translateY: bob },
              ],
            }}
          >
            <Animated.Image
              source={require("../assets/images/logo_no_bg.png")}
              style={{ width: logoSize, height: logoSize }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <View
          style={{
            alignItems: "center",
            paddingHorizontal: Spacing["2xl"],
            marginTop: Spacing.lg,
            width: "100%",
          }}
        >
          {/* LOG IN BUTTON */}
          <Animated.View
            style={[
              { width: "100%", maxWidth: 380, marginVertical: Spacing.sm },
              makeBtnStyle(btn1),
            ]}
          >
            <TouchableOpacity
              style={{
                width: "100%",
                paddingVertical: 16,
                borderRadius: BorderRadius["2xl"],
                alignItems: "center",
                backgroundColor: Colors.primary,
                ...Shadows.large,
              }}
              onPress={() => router.push("/screens/login-screen")}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  ...TextStyles.buttonText,
                  fontSize: 20,
                  color: "#FFFFFF",
                }}
              >
                LOG IN
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* SIGN UP BUTTON */}
          <Animated.View
            style={[
              { width: "100%", maxWidth: 380, marginVertical: Spacing.sm },
              makeBtnStyle(btn2),
            ]}
          >
            <TouchableOpacity
              style={{
                width: "100%",
                paddingVertical: 16,
                borderRadius: BorderRadius["2xl"],
                alignItems: "center",
                backgroundColor: Colors.primary,
                ...Shadows.large,
              }}
              onPress={() => router.push("/screens/signup-screen")}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  ...TextStyles.buttonText,
                  fontSize: 20,
                  color: "#FFFFFF",
                }}
              >
                SIGN UP
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* SCAN MY MEAL BUTTON */}
          <Animated.View
            style={[
              { width: "100%", maxWidth: 380, marginVertical: Spacing.sm },
              makeBtnStyle(btn3),
            ]}
          >
            <TouchableOpacity
              style={{
                width: "100%",
                paddingVertical: 16,
                borderRadius: BorderRadius["2xl"],
                alignItems: "center",
                backgroundColor: Colors.primary,
                ...Shadows.large,
              }}
              onPress={() => router.push("/(tabs)")}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  ...TextStyles.buttonText,
                  fontSize: 20,
                  color: "#FFFFFF",
                }}
              >
                SCAN MY MEAL
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
