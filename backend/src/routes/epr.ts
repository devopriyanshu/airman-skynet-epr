import { Router } from 'express';
import {
  listEprs,
  getEpr,
  createEprRecord,
  patchEprRecord,
  getEprSummaryHandler,
  assistHandler,
} from '../controllers/epr.controller';

const router = Router();

// Level 2C: AI assist
router.post('/assist', assistHandler);

// Level 2A: Summary
router.get('/summary/:personId', getEprSummaryHandler);

// CRUD
router.get('/', listEprs);
router.get('/:id', getEpr);
router.post('/', createEprRecord);
router.patch('/:id', patchEprRecord);

export default router;
