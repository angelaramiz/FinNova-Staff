/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import { MemoryDatabase } from '../lib/memoryDb';
import { requireSupabaseAuth, optionalSupabaseAuth, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

export const coursesRouter = Router();

const CourseCreateSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  imageUrl: z.string().url().optional(),
});

/**
 * GET /api/courses
 * List all active/published courses or full inventory for instruction
 */
coursesRouter.get('/', optionalSupabaseAuth, (req: AuthenticatedRequest, res: Response) => {
  const { difficulty } = req.query;
  let list = MemoryDatabase.courses;

  const rawMockFlag = process.env.ENABLE_DOCKER_MOCKS || '';
  const isMockAllowed = rawMockFlag.trim().toLowerCase().replace(/['"]/g, '') !== 'false' && process.env.REQUIRE_REAL_AUTH !== 'true';

  // Filter unpublished unless logged-in instructor/admin asks otherwise
  let isInstructor = false;
  if (isMockAllowed && req.headers['x-view-mode'] === 'instructor') {
    isInstructor = true;
  } else if (req.user && (req.user.role === 'instructor' || req.user.role === 'admin')) {
    isInstructor = true;
  }

  if (!isInstructor) {
    list = list.filter(c => c.isPublished);
  }

  if (difficulty) {
    list = list.filter(c => c.difficulty === difficulty);
  }

  res.status(200).json(list);
});

/**
 * GET /api/courses/:id
 * Retrieve details of a course and compile associated clips + exercises
 */
coursesRouter.get('/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const course = MemoryDatabase.courses.find(c => c.id === id);

  if (!course) {
     res.status(404).json({ error: 'Not Found', message: 'Course profile not found.' });
     return;
  }

  // Retrieve associated clips sorted by sequenceOrder
  const clips = MemoryDatabase.clips
    .filter(clip => clip.courseId === id && clip.status === 'approved')
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  // For each clip, grab exercises
  const clipsWithExercises = clips.map(clip => {
    const exercises = MemoryDatabase.exercises.filter(ex => ex.clipId === clip.id);
    return {
      ...clip,
      exercises,
    };
  });

  res.status(200).json({
    ...course,
    clips: clipsWithExercises,
  });
});

/**
 * POST /api/courses
 * Creating an active course (Instructor-restricted)
 */
coursesRouter.post('/', requireSupabaseAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user?.role !== 'instructor' && req.user?.role !== 'admin') {
     res.status(403).json({ error: 'Forbidden', message: 'Restricted to instructors or admins.' });
     return;
  }

  const parseResult = CourseCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
     res.status(400).json({ error: 'Bad Request', details: parseResult.error.format() });
     return;
  }

  const { title, description, difficulty, imageUrl } = parseResult.data;
  const newCourse = {
    id: `c0000000-0000-0000-0000-${Math.random().toString(10).substring(2, 14)}`,
    title,
    description,
    difficulty,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600',
    instructorId: req.user.id,
    isPublished: false,
    createdAt: new Date().toISOString(),
  };

  MemoryDatabase.courses.push(newCourse);
  res.status(201).json(newCourse);
});
