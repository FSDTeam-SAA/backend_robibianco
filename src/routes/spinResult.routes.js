import express from 'express'
import { isAuthenticated } from '../middlewares/auth.middlewares.js'
import {
  claimSpin,
  createSpin,
  getSpinById,
} from '../controllers/spinResult.controller.js'

const router = express.Router()

router.post('/spin', createSpin)

// Get a single spin by ID
router.get('/spin/:id', getSpinById)

// Claim spin (authenticated user)
router.patch('/spin/:id/claim', isAuthenticated, claimSpin)

export default router
