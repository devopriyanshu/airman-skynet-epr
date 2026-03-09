import { Router } from 'express';
import { listPeople } from '../controllers/people.controller';

const router = Router();

router.get('/', listPeople);

export default router;
