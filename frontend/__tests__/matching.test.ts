import { expect, test, describe } from "bun:test";
import { matchesDepartment } from "../lib/matching";

describe("Matching Utils", () => {
  test("matchesDepartment - exact match", () => {
    const dept = { name: "Software", label: "ซอฟต์แวร์" };
    expect(matchesDepartment("Software", dept)).toBe(true);
  });

  test("matchesDepartment - partial match", () => {
    const dept = { name: "Software", label: "ซอฟต์แวร์" };
    expect(matchesDepartment("Software Engineering", dept)).toBe(true);
  });

  test("matchesDepartment - Thai label match", () => {
    const dept = { name: "Design", label: "ดีไซน์" };
    expect(matchesDepartment("นักดีไซน์", dept)).toBe(true);
  });

  test("matchesDepartment - no match", () => {
    const dept = { name: "Design", label: "ดีไซน์" };
    expect(matchesDepartment("Accounting", dept)).toBe(false);
  });
});
