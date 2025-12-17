// eslint.config.js
import expoConfig from "eslint-config-expo/flat.js";
import prettierConfig from "eslint-config-prettier";

export default [
  // Apply the default Expo config
  ...expoConfig,

  {
    // These files will be affected by the rules below
    files: ["**/*.{js,jsx,ts,tsx}"],

    // Global ignores for this config object
    ignores: [
      ".expo/**", // Ignore Expo's build and cache directories
      "dist/**", // Ignore the distribution folder for builds
    ],

    // Custom rules
    rules: {
      // Warn about variables that are defined but never used.
      "no-unused-vars": [
        "warn",
        {
          args: "after-used",
          ignoreRestSiblings: true,
        },
      ],

      // Warn about the use of console.log(), etc.
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],
    },
  },
  // Add prettier config last so it can override other formatting rules
  prettierConfig,
];
