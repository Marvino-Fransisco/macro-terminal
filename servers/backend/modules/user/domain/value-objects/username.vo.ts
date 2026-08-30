import { MAX_USERNAME_LENGTH, MIN_USERNAME_LENGTH } from "../../constants/username.const";
import { InvalidUsernameError } from "../errors/username.error";

export type Username = string & {
  readonly __brand: "Username";
};

export function createUsername(value: string): Username {
  const normalized = value.trim();

  if (normalized.length < MIN_USERNAME_LENGTH || normalized.length > MAX_USERNAME_LENGTH) {
    throw new InvalidUsernameError();
  }

  return normalized as Username;
}
