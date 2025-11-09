/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type ColorKey = "text" | "background" | "cardBackground";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorKey,
) {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // Handle the nested color structure in the unified theme
    if (colorName === "text") {
      return Colors.text[theme];
    } else if (colorName === "background") {
      return Colors.background[theme];
    } else if (colorName === "cardBackground") {
      return Colors.cardBackground[theme];
    }
    // Fallback to text color if unknown key
    return Colors.text[theme];
  }
}
