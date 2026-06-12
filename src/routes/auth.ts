/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import { MemoryDatabase } from '../lib/memoryDb';
import { requireSupabaseAuth, AuthenticatedRequest } from '../middleware/auth';

export const authRouter = Router();

/**
 * GET /api/auth/me
 * Retrieves current active profile info and points stats
 */
authRouter.get('/me', requireSupabaseAuth, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user?.id || '22222222-2222-2222-2222-222222222222';
  const profile = MemoryDatabase.profiles.find(p => p.id === userId);

  if (!profile) {
    // Dynamically insert profile block if absent
     res.status(200).json({
      id: userId,
      fullName: 'Inversor Novato Base',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      role: 'student',
      pointsEarned: 100,
    });
     return;
  }

  res.status(200).json(profile);
});

/**
 * POST /api/auth/role
 * Utility endpoint to easily toggle actor role ('student' <-> 'instructor') during sandbox tests
 */
authRouter.post('/role', requireSupabaseAuth, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user?.id || '22222222-2222-2222-2222-222222222222';
  const { role } = req.body;

  if (role !== 'student' && role !== 'instructor' && role !== 'admin') {
     res.status(400).json({ error: 'Bad Request', message: 'Invalid role state requested.' });
     return;
  }

  const profile = MemoryDatabase.profiles.find(p => p.id === userId);
  if (profile) {
    profile.role = role;
     res.status(200).json({
      message: 'Role patched in development simulation.',
      profile,
    });
     return;
  }

  // Create profile if missing
  const newProfile = {
    id: userId,
    fullName: role === 'instructor' ? 'Profe Sandbox' : 'Inversor Novato',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    role,
    pointsEarned: 150,
  };
  MemoryDatabase.profiles.push(newProfile);

  res.status(201).json({
    message: 'Profile spawned with requested role.',
    profile: newProfile,
  });
});
