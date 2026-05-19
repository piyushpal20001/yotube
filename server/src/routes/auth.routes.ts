import { Router } from 'express';
import { getGoogleAuthUrl, googleCallback } from '../controllers/auth.controller';

const router = Router();

router.get('/google', getGoogleAuthUrl);
router.get('/google/callback', googleCallback);

export default router;
