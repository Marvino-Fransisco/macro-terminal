import { Entity } from "../../../shared";

export type UserCredential = Entity & {
  userId: string;
  passwordHash: string;
}
