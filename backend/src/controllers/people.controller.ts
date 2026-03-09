import { Request, Response } from 'express';
import { getPeople } from '../services/people.service';

export async function listPeople(req: Request, res: Response): Promise<void> {
  try {
    const role = req.query.role as 'student' | 'instructor' | undefined;
    const search = req.query.search as string | undefined;

    if (role && role !== 'student' && role !== 'instructor') {
      res.status(400).json({ error: 'Invalid role. Must be "student" or "instructor".' });
      return;
    }

    const people = await getPeople(role, search);
    res.json(people);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
