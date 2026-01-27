import React, { useEffect } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  SharedValue,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface IOSWaveformProps {
  level: number; // 0 to 1
  isRecording: boolean;
  isSpeaking?: boolean;
}

const WAVE_COUNT = 3;
const COLORS = [
  "rgba(255, 255, 255, 0.8)",
  "rgba(255, 255, 255, 0.5)",
  "rgba(255, 255, 255, 0.3)",
];

export const IOSWaveform: React.FC<IOSWaveformProps> = ({
  level,
  isRecording,
  isSpeaking,
}) => {
  const { width: screenWidth } = useWindowDimensions();

  // Keep it narrower than before (more like iOS).
  const width = Math.min(280, screenWidth * 0.62);
  // Give it a bit more headroom to avoid vertical clipping when levels spike.
  const height = 104;
  const midY = height / 2;

  const phase = useSharedValue(0);
  const amplitude = useSharedValue(0);
  const visibility = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      phase.value = withRepeat(
        withTiming(2 * Math.PI, { duration: 1600, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      phase.value = 0;
    }
  }, [isRecording]);

  useEffect(() => {
    // Slightly slower than the metering callback to keep things buttery.
    amplitude.value = withTiming(level, { duration: 80 });
  }, [level]);

  useEffect(() => {
    // Fade in when "speaking" and fade out when quiet to avoid a constant baseline.
    const shouldShow = Boolean(isRecording && (isSpeaking ?? level > 0.12));
    visibility.value = withTiming(shouldShow ? 1 : 0, {
      duration: shouldShow ? 120 : 420,
      easing: shouldShow ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    });
  }, [isRecording, isSpeaking, level]);

  return (
    <Animated.View
      style={[styles.container, { width, height, opacity: visibility }]}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {Array.from({ length: WAVE_COUNT }).map((_, i) => (
          <WaveLine
            key={i}
            index={i}
            width={width}
            midY={midY}
            phase={phase}
            amplitude={amplitude}
            visibility={visibility}
            color={COLORS[i]}
          />
        ))}
      </Svg>
    </Animated.View>
  );
};

interface WaveLineProps {
  index: number;
  width: number;
  midY: number;
  phase: SharedValue<number>;
  amplitude: SharedValue<number>;
  visibility: SharedValue<number>;
  color: string;
}

const WaveLine: React.FC<WaveLineProps> = ({
  index,
  width,
  midY,
  phase,
  amplitude,
  visibility,
  color,
}) => {
  const animatedProps = useAnimatedProps(() => {
    // Make it more reactive: raise amplitude and make it non-linear.
    const base = Math.pow(amplitude.value, 0.65);
    const amp = base * 54 * (1 - index * 0.16);

    // Slightly more freq so it feels "alive".
    const freq = 2.6 + index * 0.65;
    const p = phase.value * (1 + index * 0.25);

    // When fading out, also flatten the wave to avoid a white line.
    const vis = visibility.value;

    let d = `M 0 ${midY}`;
    const step = 4;

    for (let x = 0; x <= width; x += step) {
      // Envelope to taper ends.
      const normalization = x / width;
      const envelope = Math.pow(4 * normalization * (1 - normalization), 2.2);

      const y =
        midY +
        Math.sin(x * (freq / width) * 2 * Math.PI + p) * amp * envelope * vis;
      d += ` L ${x} ${y}`;
    }

    return { d };
  });

  return (
    <AnimatedPath
      animatedProps={animatedProps}
      stroke={color}
      strokeWidth={2.25}
      fill="none"
      strokeLinecap="round"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
});
