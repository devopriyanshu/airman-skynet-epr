import { db } from '../db';
import { users, eprRecords } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import type {
  EprRecord,
  CreateEprBody,
  UpdateEprBody,
  EprSummary,
  AssistBody,
  AssistResponse,
  EprRoleType,
} from '../types';

function toEprRecord(row: typeof eprRecords.$inferSelect): EprRecord {
  return {
    id: row.id,
    personId: row.personId,
    evaluatorId: row.evaluatorId,
    roleType: row.roleType as EprRoleType,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    overallRating: row.overallRating,
    technicalSkillsRating: row.technicalSkillsRating,
    nonTechnicalSkillsRating: row.nonTechnicalSkillsRating,
    remarks: row.remarks,
    status: row.status as 'draft' | 'submitted' | 'archived',
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

export async function getEprsByPersonId(personId: string): Promise<EprRecord[]> {
  const rows = await db
    .select()
    .from(eprRecords)
    .where(eq(eprRecords.personId, personId))
    .orderBy(desc(eprRecords.periodStart));

  return rows.map(toEprRecord);
}

export async function getEprById(id: string): Promise<EprRecord | null> {
  const [row] = await db.select().from(eprRecords).where(eq(eprRecords.id, id));
  return row ? toEprRecord(row) : null;
}

function validateRating(val: number, fieldName: string): string | null {
  if (!Number.isInteger(val) || val < 1 || val > 5) {
    return `${fieldName} must be an integer between 1 and 5`;
  }
  return null;
}

export async function createEpr(body: CreateEprBody): Promise<{ error?: string; record?: EprRecord }> {
  // Validate ratings
  const ratingErrors = [
    validateRating(body.overallRating, 'overallRating'),
    validateRating(body.technicalSkillsRating, 'technicalSkillsRating'),
    validateRating(body.nonTechnicalSkillsRating, 'nonTechnicalSkillsRating'),
  ].filter(Boolean);

  if (ratingErrors.length > 0) {
    return { error: ratingErrors[0]! };
  }

  // Validate period
  if (new Date(body.periodEnd) < new Date(body.periodStart)) {
    return { error: 'periodEnd must be on or after periodStart' };
  }

  // Validate personId exists
  const [person] = await db.select().from(users).where(eq(users.id, body.personId));
  if (!person) {
    return { error: `Person with id ${body.personId} not found` };
  }

  // Validate evaluatorId exists
  const [evaluator] = await db.select().from(users).where(eq(users.id, body.evaluatorId));
  if (!evaluator) {
    return { error: `Evaluator with id ${body.evaluatorId} not found` };
  }

  const [row] = await db
    .insert(eprRecords)
    .values({
      personId: body.personId,
      evaluatorId: body.evaluatorId,
      roleType: body.roleType,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      overallRating: body.overallRating,
      technicalSkillsRating: body.technicalSkillsRating,
      nonTechnicalSkillsRating: body.nonTechnicalSkillsRating,
      remarks: body.remarks,
      status: body.status,
    })
    .returning();

  return { record: toEprRecord(row) };
}

export async function updateEpr(
  id: string,
  body: UpdateEprBody
): Promise<{ error?: string; record?: EprRecord }> {
  // Validate provided ratings
  if (body.overallRating !== undefined) {
    const err = validateRating(body.overallRating, 'overallRating');
    if (err) return { error: err };
  }
  if (body.technicalSkillsRating !== undefined) {
    const err = validateRating(body.technicalSkillsRating, 'technicalSkillsRating');
    if (err) return { error: err };
  }
  if (body.nonTechnicalSkillsRating !== undefined) {
    const err = validateRating(body.nonTechnicalSkillsRating, 'nonTechnicalSkillsRating');
    if (err) return { error: err };
  }

  const updateData: Partial<typeof eprRecords.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (body.overallRating !== undefined) updateData.overallRating = body.overallRating;
  if (body.technicalSkillsRating !== undefined) updateData.technicalSkillsRating = body.technicalSkillsRating;
  if (body.nonTechnicalSkillsRating !== undefined) updateData.nonTechnicalSkillsRating = body.nonTechnicalSkillsRating;
  if (body.remarks !== undefined) updateData.remarks = body.remarks;
  if (body.status !== undefined) updateData.status = body.status;

  const [row] = await db
    .update(eprRecords)
    .set(updateData)
    .where(eq(eprRecords.id, id))
    .returning();

  if (!row) return { error: `EPR record with id ${id} not found` };

  return { record: toEprRecord(row) };
}

// ─── Level 2A: Summary ────────────────────────────────────────────────────────

function getQuarterLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getUTCMonth(); // 0-indexed
  const year = date.getUTCFullYear();
  const quarter = Math.floor(month / 3) + 1;
  return `Q${quarter} ${year}`;
}

export async function getEprSummary(personId: string): Promise<EprSummary> {
  // Only submitted EPRs for averages
  const submittedEprs = await db
    .select()
    .from(eprRecords)
    .where(and(eq(eprRecords.personId, personId), eq(eprRecords.status, 'submitted')))
    .orderBy(desc(eprRecords.periodStart));

  const eprCount = submittedEprs.length;

  let averageOverallRating = 0;
  let averageTechnicalRating = 0;
  let averageNonTechnicalRating = 0;

  if (eprCount > 0) {
    averageOverallRating =
      submittedEprs.reduce((sum, r) => sum + r.overallRating, 0) / eprCount;
    averageTechnicalRating =
      submittedEprs.reduce((sum, r) => sum + r.technicalSkillsRating, 0) / eprCount;
    averageNonTechnicalRating =
      submittedEprs.reduce((sum, r) => sum + r.nonTechnicalSkillsRating, 0) / eprCount;
  }

  const lastThreePeriods = submittedEprs.slice(0, 3).map((r) => ({
    periodLabel: getQuarterLabel(r.periodStart),
    overallRating: r.overallRating,
  }));

  // Determine roleType from all EPRs for this person
  const [anyEpr] = await db
    .select({ roleType: eprRecords.roleType })
    .from(eprRecords)
    .where(eq(eprRecords.personId, personId))
    .limit(1);

  return {
    personId,
    roleType: (anyEpr?.roleType as EprRoleType) ?? null,
    averageOverallRating: Math.round(averageOverallRating * 10) / 10,
    averageTechnicalRating: Math.round(averageTechnicalRating * 10) / 10,
    averageNonTechnicalRating: Math.round(averageNonTechnicalRating * 10) / 10,
    eprCount,
    lastThreePeriods,
  };
}

// ─── Level 2C: AI Assist ──────────────────────────────────────────────────────

export function generateSuggestedRemarks(body: AssistBody): AssistResponse {
  const avg = (body.overallRating + body.technicalSkillsRating + body.nonTechnicalSkillsRating) / 3;

  let suggestedRemarks: string;

  if (avg >= 4.5) {
    suggestedRemarks =
      'This individual consistently demonstrates exceptional performance across all competency domains. ' +
      'Technical airmanship is exemplary — aircraft handling precision, systems knowledge, and instrument proficiency are of the highest standard. ' +
      'CRM skills and situational awareness are outstanding; the individual sets a benchmark within the cohort. ' +
      'Checklist discipline and threat & error management are applied intuitively. Highly recommended for accelerated progression.';
  } else if (avg >= 3.5) {
    suggestedRemarks =
      'Good overall performance with consistent application of technical and non-technical skills. ' +
      'Aircraft handling and instrument flying meet the required standard with solid checklist discipline. ' +
      'CRM and situational awareness are developing well, with constructive participation in multi-crew environments. ' +
      'Minor refinements in threat & error management and decision-making under high workload will support continued progression. ' +
      'On track for next training phase as scheduled.';
  } else if (avg >= 2.5) {
    suggestedRemarks =
      'Demonstrates solid foundational knowledge with satisfactory technical airmanship. ' +
      'Instrument scan technique and navigation accuracy are adequate but would benefit from targeted practice on ILS approaches and non-precision procedures. ' +
      'Situational awareness and workload management need further development — particularly during high-density traffic and emergencies. ' +
      'Recommend additional focus on CRM facilitation and checklist habit formation. A structured improvement plan has been discussed and shared.';
  } else {
    suggestedRemarks =
      'Performance requires focused remedial attention across technical and non-technical areas. ' +
      'Checklist discipline and adherence to standard operating procedures must be prioritised urgently. ' +
      'Situational awareness deficits noted during complex routing and instrument meteorological conditions — immediate ground school review of emergency procedures is recommended. ' +
      'CRM engagement and crew communication need significant development. A formal Support and Improvement Plan (SIP) has been initiated ' +
      'with dedicated instructor support sessions scheduled. Progress will be reviewed at the next monthly evaluation.';
  }

  return { suggestedRemarks };
}
