import { StyleSheet, Text, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { Typography, Colors } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: Typography.sizes.base,
    lineHeight: Math.round(Typography.sizes.base * Typography.lineHeights.normal),
  },
  defaultSemiBold: {
    fontSize: Typography.sizes.base,
    lineHeight: Math.round(Typography.sizes.base * Typography.lineHeights.normal),
    fontWeight: "600",
  },
  title: {
    fontSize: Typography.sizes["3xl"],
    fontWeight: "bold",
    lineHeight: Math.round(Typography.sizes["3xl"] * Typography.lineHeights.tight),
  },
  subtitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: "bold",
  },
  link: {
    lineHeight: Math.round(Typography.sizes.base * Typography.lineHeights.normal),
    fontSize: Typography.sizes.base,
    color: Colors.primary,
  },
});
