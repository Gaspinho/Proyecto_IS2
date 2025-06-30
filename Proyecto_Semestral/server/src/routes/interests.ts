import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getUserInterests,
  getOnUserInterests,
  createInterest,
  updateInterest,
  deleteInterest,
  updateInterestState
} from '../controllers/interests';
const router = express.Router();

router.get('/all', authenticateToken, getUserInterests);
router.get('/', authenticateToken, getOnUserInterests);
router.post('/', authenticateToken, createInterest);
router.put('/:id', authenticateToken, updateInterest);
router.delete('/:id', authenticateToken, deleteInterest);
router.patch('/:id/estado', authenticateToken, updateInterestState);

export default router;