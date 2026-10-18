import { CATEGORIES } from "../../constants/category.const";
import { InvalidCategoryError } from "../errors/invalid-category.error";

export type Category = typeof CATEGORIES[number];

export function createCategory(value: string): Category {
  if (!CATEGORIES.includes(value as Category)) {
    throw new InvalidCategoryError(value);
  }
  return value as Category;
}
