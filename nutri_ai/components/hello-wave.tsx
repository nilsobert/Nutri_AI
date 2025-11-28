import Animated from "react-native-reanimated";
import { Typography } from "@/constants/theme";

export function HelloWave() {
  return (
    <Animated.Text
      style={{
        fontSize: Typography.sizes.xl,
        lineHeight: Math.round(Typography.sizes.xl * Typography.lineHeights.tight),
        marginTop: -6,
        animationName: {
          "50%": { transform: [{ rotate: "25deg" }] },
        },
        animationIterationCount: 4,
        animationDuration: "300ms",
      }}
    >
      👋
    </Animated.Text>
  );
}
