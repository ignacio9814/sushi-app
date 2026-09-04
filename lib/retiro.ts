export const RETIRO_OPTIONS = [
  "Lo antes posible",
  "En 30 min",
  "En 45 min",
  "En 1 hora",
] as const;

export type RetiroOption = (typeof RETIRO_OPTIONS)[number];

export function isPresetRetiro(value: string): value is RetiroOption {
  return (RETIRO_OPTIONS as readonly string[]).includes(value);
}
