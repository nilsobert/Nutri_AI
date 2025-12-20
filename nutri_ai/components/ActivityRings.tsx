import React, { useEffect } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import Svg, {
  Circle,
  G,
  Defs,
  LinearGradient,
  Stop,
  Mask,
  Rect,
} from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Colors } from "../constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingProps {
  radius: number;
  stroke: string;
  strokeWidth: number;
  progress: number;
  delay?: number;
  center: number;
}

const darkenColor = (color: string, amount: number = 0.3) => {
  let c = color.replace("#", "");
  if (c.length === 3)
    c = c
      .split("")
      .map((char) => char + char)
      .join("");
  const num = parseInt(c, 16);
  let r = (num >> 16) - Math.round(255 * amount);
  let g = ((num >> 8) & 0x00ff) - Math.round(255 * amount);
  let b = (num & 0x0000ff) - Math.round(255 * amount);

  return (
    "#" +
    (
      0x1000000 +
      (r < 0 ? 0 : r) * 0x10000 +
      (g < 0 ? 0 : g) * 0x100 +
      (b < 0 ? 0 : b)
    )
      .toString(16)
      .slice(1)
  );
};

const lightenColor = (color: string, amount: number = 0.3) => {
  let c = color.replace("#", "");
  if (c.length === 3)
    c = c
      .split("")
      .map((char) => char + char)
      .join("");
  const num = parseInt(c, 16);
  let r = (num >> 16) + Math.round(255 * amount);
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * amount);
  let b = (num & 0x0000ff) + Math.round(255 * amount);

  return (
    "#" +
    (
      0x1000000 +
      (r > 255 ? 255 : r) * 0x10000 +
      (g > 255 ? 255 : g) * 0x100 +
      (b > 255 ? 255 : b)
    )
      .toString(16)
      .slice(1)
  );
};

const Ring = ({
  radius,
  stroke,
  strokeWidth,
  progress,
  delay = 0,
  center,
}: RingProps) => {
  const circumference = 2 * Math.PI * radius;
  const fill = useSharedValue(0);
  const colorScheme = useColorScheme();
  const baseStroke =
    colorScheme === "dark" ? darkenColor(stroke) : lightenColor(stroke);
  const dotColor = colorScheme === "dark" ? "black" : "white";

  useEffect(() => {
    fill.value = withDelay(
      delay,
      withTiming(progress, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [progress, delay]);

  // Props for the first loop (no mask)
  const firstLoopProps = useAnimatedProps(() => {
    const val = fill.value;
    return {
      strokeDashoffset: circumference * (1 - (val >= 1 ? 1 : val)),
      opacity: val > 1 ? 0 : 1,
    };
  });

  // Props for subsequent loops (with mask)
  const laterLoopsProps = useAnimatedProps(() => {
    const val = fill.value;
    const effectiveProgress = val > 1 ? val % 1 : 0;
    const displayProgress = val > 1 && val % 1 === 0 ? 1 : effectiveProgress;
    return {
      strokeDashoffset: circumference * (1 - displayProgress),
      opacity: val > 1 ? 1 : 0,
    };
  });

  // Props for the dark base ring (previous loops)
  const darkBaseProps = useAnimatedProps(() => {
    return {
      strokeOpacity: fill.value >= 1 ? 1 : 0,
    };
  });

  const dotProps = useAnimatedProps(() => {
    const val = fill.value;
    const effectiveProgress = val > 1 ? val % 1 : val;
    const displayProgress = val > 1 && val % 1 === 0 ? 1 : effectiveProgress;

    const angle = displayProgress * 2 * Math.PI;
    return {
      cx: center + radius * Math.cos(angle),
      cy: center + radius * Math.sin(angle),
      opacity: val > 0 ? 0.5 : 0,
    };
  });

  return (
    <G rotation="-90" origin={`${center}, ${center}`}>
      <Defs>
        <LinearGradient id={`grad-${radius}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="black" stopOpacity="1" />
          <Stop offset="1" stopColor="black" stopOpacity="0" />
        </LinearGradient>
        <Mask id={`mask-${radius}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="white"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Rect
            x={center + radius - strokeWidth}
            y={center - strokeWidth / 2}
            width={strokeWidth * 2}
            height={strokeWidth * 2}
            fill={`url(#grad-${radius})`}
          />
        </Mask>
      </Defs>
      {/* 1. Background Track */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeOpacity={0.2}
        fill="transparent"
      />

      {/* 2. Dark Base (Visible only when progress >= 1) */}
      <AnimatedCircle
        cx={center}
        cy={center}
        r={radius}
        stroke={baseStroke}
        strokeWidth={strokeWidth}
        fill="transparent"
        animatedProps={darkBaseProps}
      />

      {/* 3a. Bright Overlay (First Loop - No Mask) */}
      <AnimatedCircle
        cx={center}
        cy={center}
        r={radius}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={[circumference]}
        animatedProps={firstLoopProps}
        strokeLinecap="round"
        fill="transparent"
      />

      {/* 3b. Bright Overlay (Later Loops - With Mask) */}
      <AnimatedCircle
        cx={center}
        cy={center}
        r={radius}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={[circumference]}
        animatedProps={laterLoopsProps}
        strokeLinecap="round"
        fill="transparent"
        mask={`url(#mask-${radius})`}
      />

      {/* 4. Tip Highlight Dot */}
      <AnimatedCircle
        r={strokeWidth / 2.5}
        fill={dotColor}
        animatedProps={dotProps}
      />
    </G>
  );
};

interface ActivityRingsProps {
  carbs: number;
  carbsGoal: number;
  protein: number;
  proteinGoal: number;
  fat: number;
  fatGoal: number;
  size?: number;
}

export const ActivityRings: React.FC<ActivityRingsProps> = ({
  carbs,
  carbsGoal,
  protein,
  proteinGoal,
  fat,
  fatGoal,
  size = 180,
}) => {
  const center = size / 2;
  const strokeWidth = size * 0.08; // Responsive stroke width (thinner)
  const gap = 4;

  const outerRadius = (size - strokeWidth) / 2;
  const middleRadius = outerRadius - strokeWidth - gap;
  const innerRadius = middleRadius - strokeWidth - gap;

  // Allow progress > 1
  const carbsProgress = carbs / carbsGoal;
  const proteinProgress = protein / proteinGoal;
  const fatProgress = fat / fatGoal;

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Svg width={size} height={size}>
        <Ring
          radius={outerRadius}
          stroke={Colors.secondary.carbs}
          strokeWidth={strokeWidth}
          progress={carbsProgress}
          center={center}
          delay={0}
        />
        <Ring
          radius={middleRadius}
          stroke={Colors.secondary.protein}
          strokeWidth={strokeWidth}
          progress={proteinProgress}
          center={center}
          delay={200}
        />
        <Ring
          radius={innerRadius}
          stroke={Colors.secondary.fat}
          strokeWidth={strokeWidth}
          progress={fatProgress}
          center={center}
          delay={400}
        />
      </Svg>
    </View>
  );
};
