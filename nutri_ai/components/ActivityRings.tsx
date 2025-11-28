import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';

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
  let c = color.replace('#', '');
  if (c.length === 3) c = c.split('').map((char) => char + char).join('');
  const num = parseInt(c, 16);
  let r = (num >> 16) - Math.round(255 * amount);
  let g = ((num >> 8) & 0x00ff) - Math.round(255 * amount);
  let b = (num & 0x0000ff) - Math.round(255 * amount);

  return (
    '#' +
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
  const darkerStroke = darkenColor(stroke);

  useEffect(() => {
    fill.value = withDelay(
      delay,
      withTiming(progress, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );
  }, [progress, delay]);

  // Props for the bright overlay ring (current loop)
  const animatedProps = useAnimatedProps(() => {
    const val = fill.value;
    // If overlapping, we show the remainder. If not, we show full progress.
    // When val > 1, we want to show (val % 1).
    // But we need to handle the transition carefully.
    // If val = 1.5, we want 0.5 of the circle to be bright (on top of dark).
    const effectiveProgress = val > 1 ? val % 1 : val;
    // Handle exact integer case where % 1 is 0 but we want full circle if it's exactly 1.0 (though >1 handles that)
    // If val is exactly 2.0, effective is 0. We want full.
    // Actually, if val > 1, the base is dark full. The overlay is bright partial.
    // If val = 2.0, overlay is 0 (invisible) or full?
    // Visually, 2.0 should look like a full bright circle (on top of dark).
    // So if val % 1 === 0 && val > 0, effective = 1.
    
    const displayProgress = (val > 1 && val % 1 === 0) ? 1 : effectiveProgress;

    return {
      strokeDashoffset: circumference * (1 - displayProgress),
    };
  });

  // Props for the dark base ring (previous loops)
  const darkBaseProps = useAnimatedProps(() => {
    return {
      strokeOpacity: fill.value >= 1 ? 1 : 0,
    };
  });

  return (
    <G rotation="-90" origin={`${center}, ${center}`}>
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
        stroke={darkerStroke}
        strokeWidth={strokeWidth}
        fill="transparent"
        animatedProps={darkBaseProps}
      />

      {/* 3. Bright Overlay (Current Loop) */}
      <AnimatedCircle
        cx={center}
        cy={center}
        r={radius}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={[circumference]}
        animatedProps={animatedProps}
        strokeLinecap="round"
        fill="transparent"
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
        justifyContent: 'center',
        alignItems: 'center',
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
