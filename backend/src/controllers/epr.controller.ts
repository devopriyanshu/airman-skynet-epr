import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  getEprsByPersonId,
  getEprById,
  createEpr,
  updateEpr,
  getEprSummary,
  generateSuggestedRemarks,
} from '../services/epr.service';
import type { CreateEprBody, UpdateEprBody, AssistBody } from '../types';

// Hardcoded admin user ID — fallback when no x-user-id header provided
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';

async function resolveCurrentUser(req: Request): Promise<{ id: string; role: string } | null> {
  const userId = (req.headers['x-user-id'] as string) || ADMIN_USER_ID;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user ? { id: user.id, role: user.role } : null;
}

export async function listEprs(req: Request, res: Response): Promise<void> {
  try {
    const { personId } = req.query;

    if (!personId || typeof personId !== 'string') {
      res.status(400).json({ error: 'personId query param is required' });
      return;
    }

    // Level 2B: role-based access
    const currentUser = await resolveCurrentUser(req);
    if (currentUser?.role === 'student' && currentUser.id !== personId) {
      res.status(403).json({ error: 'Students can only view their own EPR records' });
      return;
    }

    const eprs = await getEprsByPersonId(personId);
    res.json(eprs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getEpr(req: Request, res: Response): Promise<void> {
  try {
    const epr = await getEprById(req.params.id);
    if (!epr) {
      res.status(404).json({ error: 'EPR record not found' });
      return;
    }
    res.json(epr);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createEprRecord(req: Request, res: Response): Promise<void> {
  try {
    // Level 2B: students cannot create EPRs
    const currentUser = await resolveCurrentUser(req);
    if (currentUser?.role === 'student') {
      res.status(403).json({ error: 'Students cannot create EPR records' });
      return;
    }

    const body = req.body as CreateEprBody;
    const result = await createEpr(body);

    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json(result.record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function patchEprRecord(req: Request, res: Response): Promise<void> {
  try {
    // Level 2B: students cannot edit EPRs
    const currentUser = await resolveCurrentUser(req);
    if (currentUser?.role === 'student') {
      res.status(403).json({ error: 'Students cannot edit EPR records' });
      return;
    }

    const body = req.body as UpdateEprBody;
    const result = await updateEpr(req.params.id, body);

    if (result.error) {
      const status = result.error.includes('not found') ? 404 : 400;
      res.status(status).json({ error: result.error });
      return;
    }

    res.json(result.record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getEprSummaryHandler(req: Request, res: Response): Promise<void> {
  try {
    const { personId } = req.params;
    const summary = await getEprSummary(personId);
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function assistHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as AssistBody;

    if (
      typeof body.overallRating !== 'number' ||
      typeof body.technicalSkillsRating !== 'number' ||
      typeof body.nonTechnicalSkillsRating !== 'number'
    ) {
      res.status(400).json({ error: 'overallRating, technicalSkillsRating, and nonTechnicalSkillsRating are required numbers' });
      return;
    }

    const result = generateSuggestedRemarks(body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
