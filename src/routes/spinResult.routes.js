import express from 'express'
import { isAuthenticated } from '../middlewares/auth.middlewares.js'
import { createSpin } from '../controllers/spinResult.controller.js'

const router = express.Router()

router.post('/spin', createSpin)

export default router
