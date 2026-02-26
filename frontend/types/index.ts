import { components } from "./api";

// Re-export generated types for easier access
export type User = components["schemas"]["UserPublic"];
export type UserCandidate = components["schemas"]["UserCandidate"];
export type Quest = components["schemas"]["QuestResponse"];
export type Skill = components["schemas"]["SkillItem"];
export type AuthResponse = components["schemas"]["AuthResponse"];
export type UserListResponse = components["schemas"]["UserListResponse"];

// Helper for paged responses (Generic version still useful for other lists, or we can use UserListResponse directly)
export interface PagedResponse<T> {
  users: T[];
  total: number;
}
