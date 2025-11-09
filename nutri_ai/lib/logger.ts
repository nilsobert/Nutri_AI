import { logger, consoleTransport } from "react-native-logs";

const config = {
// Only show debug logs in development
  severity: __DEV__ ? "debug" : "warn",
  transport: consoleTransport,
  transportOptions: {
    colors: {
      info: "blueBright",
      warn: "yellowBright",
      error: "redBright",
    },
  },
} as const;

const log = logger.createLogger(config);

export default log;