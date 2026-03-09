// ─── Shared Types ──────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'instructor' | 'admin';
export type EprStatus = 'draft' | 'submitted' | 'archived';
export type EprRoleType = 'student' | 'instructor';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export interface Person {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  // Student-specific
  courseName?: string | null;
  enrollmentStatus?: EnrollmentStatus | null;
  // Instructor-specific
  totalEprsWritten?: number;
}

export interface EprRecord {
  id: string;
  personId: string;
  evaluatorId: string;
  roleType: EprRoleType;
  periodStart: string;
  periodEnd: string;
  overallRating: number;
  technicalSkillsRating: number;
  nonTechnicalSkillsRating: number;
  remarks: string | null;
  status: EprStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateEprBody {
  personId: string;
  evaluatorId: string;
  roleType: EprRoleType;
  periodStart: string;
  periodEnd: string;
  overallRating: number;
  technicalSkillsRating: number;
  nonTechnicalSkillsRating: number;
  remarks?: string;
  status: EprStatus;
}

export interface UpdateEprBody {
  overallRating?: number;
  technicalSkillsRating?: number;
  nonTechnicalSkillsRating?: number;
  remarks?: string;
  status?: EprStatus;
}

export interface EprSummary {
  personId: string;
  roleType: EprRoleType | null;
  averageOverallRating: number;
  averageTechnicalRating: number;
  averageNonTechnicalRating: number;
  eprCount: number;
  lastThreePeriods: Array<{
    periodLabel: string;
    overallRating: number;
  }>;
}

export interface AssistBody {
  overallRating: number;
  technicalSkillsRating: number;
  nonTechnicalSkillsRating: number;
}

export interface AssistResponse {
  suggestedRemarks: string;
}
