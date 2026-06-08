export const SUPPORTED_UNITS = [
  "g",
  "ml",
  "szt",
  "łyżka",
  "łyżeczka",
  "szklanka",
] as const;

export type SupportedUnit = (typeof SUPPORTED_UNITS)[number];

export function isSupportedUnit(value: string): value is SupportedUnit {
  return (SUPPORTED_UNITS as readonly string[]).includes(value);
}
