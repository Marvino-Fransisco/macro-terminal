export type Email = string & {
  readonly __brand: "Email";
};

export function createEmail(value: string): Email {
  const normalized = value.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Invalid email");
  }

  return normalized as Email;
}
