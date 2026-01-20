import { Router } from 'express';
import { getOrderAnalytics } from '../controllers/orderanalyticcontroller';
import { authToken } from '../middleware/authtoken'
import {Admin} from '../middleware/rbac'

const router = Router();

router.get('/v1/analytics', authToken, Admin, getOrderAnalytics);

export default router;