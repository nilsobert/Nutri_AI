import { Platform } from "react-native";

// Colors
export const Colors = {
  primary: "#209621", // replaced blue with dark green
  secondary: {
    protein: "#4ECDC4",
    carbs: "#3bd445",
    fat: "#FF6B6B",
  },
  background: {
    light: "#fff",
    dark: "#151718",
  },
  cardBackground: {
    light: "#fff",
    dark: "#1E2021",
  },
  text: {
    light: "#11181C",
    dark: "#ECEDEE",
  },
  iconBackground: {
    breakfast: "#FFE5E5",
    lunch: "#E5F5FF",
    dinner: "#F0F0F0",
  },
  shadow: "#000",
  nutrientBar: {
    light: "#f0f0f0",
    dark: "#333",
  },
  floatingButton: {
    light: "#1E8E3E", // replaced blue with dark green
    dark: "#1E8E3E",
  },
  grey: {
    light: "#f0f0f0",
  },
};

// Typography
export const Typography = {
  fonts: Platform.select({
    ios: {
      sans: "system-ui",
      serif: "ui-serif",
      rounded: "ui-rounded",
      mono: "ui-monospace",
    },
    default: {
      sans: "normal",
      serif: "serif",
      rounded: "normal",
      mono: "monospace",
    },
    web: {
      sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      serif: "Georgia, 'Times New Roman', serif",
      rounded:
        "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
      mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
  }),
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
  },
  weights: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
};

// Border radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  full: 9999,
};

// Shadows
export const Shadows = {
  small: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2.22,
    elevation: 3,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Component-specific styles
export const ComponentStyles = {
  header: {
    height: 120,
    padding: Spacing.lg,
    paddingTop: 60,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  floatingButton: {
    position: "absolute" as const,
    bottom: Spacing["3xl"],
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    ...Shadows.large,
  },
  circularProgress: {
    size: 120,
    innerSize: 104,
    borderWidth: 8,
  },
  nutrientBar: {
    height: 8,
    borderRadius: BorderRadius.sm,
  },
  mealItem: {
    paddingVertical: Spacing.sm,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  dateOverview: {
    height: 80,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: Colors.cardBackground.light,
    ...Shadows.small,
  },
};

// Text styles
export const TextStyles = {
  greeting: {
    fontSize: Typography.sizes["3xl"],
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.sizes["3xl"] * Typography.lineHeights.tight,
  },
  date: {
    fontSize: Typography.sizes.base,
    opacity: 0.7,
    lineHeight: Typography.sizes.base * Typography.lineHeights.normal,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
    lineHeight: Typography.sizes.xl * Typography.lineHeights.normal,
  },
  numbers: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
    lineHeight: Typography.sizes["2xl"] * Typography.lineHeights.tight,
  },
  remaining: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    lineHeight: Typography.sizes.base * Typography.lineHeights.normal,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    marginBottom: Spacing.lg,
    lineHeight: Typography.sizes.xl * Typography.lineHeights.normal,
  },
  nutrientLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    lineHeight: Typography.sizes.base * Typography.lineHeights.normal,
  },
  nutrientValues: {
    fontSize: Typography.sizes.sm,
    opacity: 0.7,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  buttonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    lineHeight: Typography.sizes.lg * Typography.lineHeights.normal,
  },
  mealName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    marginBottom: 2,
    lineHeight: Typography.sizes.base * Typography.lineHeights.normal,
  },
  mealCalories: {
    fontSize: Typography.sizes.sm,
    opacity: 0.7,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  circularProgressText: {
    fontSize: Typography.sizes["2xl"],
    lineHeight: Typography.sizes["2xl"] * Typography.lineHeights.tight,
  },
  circularProgressSubtext: {
    fontSize: Typography.sizes.xs,
    opacity: 0.7,
    lineHeight: Typography.sizes.xs * Typography.lineHeights.normal,
  },
  dateOverviewText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  dateOverviewValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    lineHeight: Typography.sizes.base * Typography.lineHeights.tight,
  },
  // Ring Overlay
  ringValue: {
    fontSize: Typography.sizes["3xl"],
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.sizes["3xl"] * Typography.lineHeights.tight,
  },
  ringLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  // Legend
  legendLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  legendValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.sizes.lg * Typography.lineHeights.normal,
  },
  legendGoal: {
    fontSize: Typography.sizes.sm,
    opacity: 0.7,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
};

// Export legacy compatibility
export const HomeStyles = {
  colors: Colors,
  typography: TextStyles,
  spacing: Spacing,
  shadow: Shadows,
};
