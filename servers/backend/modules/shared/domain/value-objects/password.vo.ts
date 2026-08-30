export type Password = string & {
  readonly __brand: "Password";
};

export function createPassword(value: string): Password {
  const isLengthValid = value.length >= 8;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  if(!isLengthValid || !hasLetter || !hasNumber || !hasSymbol) {
    throw new Error("Password must contain at least one letter, one number, and one symbol");
  }

  return value as Password;
}
