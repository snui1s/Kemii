import { expect, test, describe } from "bun:test";
import { cn } from "../lib/utils";

describe("Utils - cn (Class Merger)", () => {
  test("should combine Tailwind classes correctly", () => {
    const result = cn("text-red-500", "bg-blue-200");
    expect(result).toBe("text-red-500 bg-blue-200");
  });

  test("should handle conditional classes", () => {
    const isActive = true;
    const result = cn(
      "p-4",
      isActive && "text-green-500",
      !isActive && "text-gray-500"
    );
    expect(result).toBe("p-4 text-green-500");
  });

  test("should merge conflicting Tailwind classes, keeping the last one", () => {
    const result = cn("p-4", "p-8", "text-red-500", "text-blue-500");
    // tailwind-merge should resolve this to the last ones
    expect(result).toBe("p-8 text-blue-500");
  });

  test("should handle empty inputs gracefully", () => {
    // @ts-ignore - testing runtime behavior with falsy values
    const result = cn("", "bg-black", null, undefined, false);
    expect(result).toBe("bg-black");
  });

  test("should return an empty string if all inputs are empty or falsy", () => {
    // @ts-ignore
    const result = cn("", null, undefined, false);
    expect(result).toBe("");
  });

  test("should handle multiple array inputs", () => {
    const result = cn(["p-4", "m-2"], ["text-lg", "font-bold"]);
    expect(result).toBe("p-4 m-2 text-lg font-bold");
  });

  test("should handle mixed types of inputs", () => {
    const result = cn(
      "flex",
      { "items-center": true, "justify-between": false },
      ["gap-4", "w-full"]
    );
    expect(result).toBe("flex items-center gap-4 w-full");
  });
});
