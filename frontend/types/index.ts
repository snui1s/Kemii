export interface Skill {
  name: string;
  level: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role?: "user" | "admin";
  character_class: string;
  level: number;
  ocean_openness: number;
  ocean_conscientiousness: number;
  ocean_extraversion: number;
  ocean_agreeableness: number;
  ocean_neuroticism: number;
  skills: Skill[];
  is_available: boolean;
  team_name?: string;
  analysis_result?: string;
}
