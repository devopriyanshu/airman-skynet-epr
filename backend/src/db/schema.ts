import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  date,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['student', 'instructor', 'admin'] }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── Courses ──────────────────────────────────────────────────────────────────
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  licenseType: text('license_type').notNull(),
  totalRequiredHours: numeric('total_required_hours').notNull(),
});

// ─── Enrollments ──────────────────────────────────────────────────────────────
export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid('student_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'restrict' }),
  startDate: date('start_date').notNull(),
  status: text('status', { enum: ['active', 'completed', 'dropped'] }).notNull(),
});

// ─── EPR Records ──────────────────────────────────────────────────────────────
export const eprRecords = pgTable(
  'epr_records',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    personId: uuid('person_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    evaluatorId: uuid('evaluator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    roleType: text('role_type', { enum: ['student', 'instructor'] }).notNull(),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    overallRating: integer('overall_rating').notNull(),
    technicalSkillsRating: integer('technical_skills_rating').notNull(),
    nonTechnicalSkillsRating: integer('non_technical_skills_rating').notNull(),
    remarks: text('remarks'),
    status: text('status', { enum: ['draft', 'submitted', 'archived'] }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    personIdIdx: index('epr_person_id_idx').on(table.personId),
    evaluatorIdIdx: index('epr_evaluator_id_idx').on(table.evaluatorId),
    periodStartIdx: index('epr_period_start_idx').on(table.periodStart),
    periodEndIdx: index('epr_period_end_idx').on(table.periodEnd),
  })
);
