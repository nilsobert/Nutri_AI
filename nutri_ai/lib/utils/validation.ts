import log from "@/lib/logger";

export function validateNonNegative(fieldName: string, value: number): void {
  if (value >= 0) return;
  log.error(`Invalid parameter ${fieldName}. Value must be non-negative.`);
  throw new RangeError(`Please provide valid ${fieldName}.`);
}
