import { db } from '../db';
import { users, courses, enrollments, eprRecords } from '../db/schema';
import { eq, and, or, ilike, desc, count, sql } from 'drizzle-orm';
import type { Person, EnrollmentStatus } from '../types';

export async function getPeople(
  role?: 'student' | 'instructor',
  search?: string
): Promise<Person[]> {
  // Build base user query (exclude admins)
  let baseQuery = db
    .select()
    .from(users)
    .where(
      search
        ? and(
            sql`${users.role} != 'admin'`,
            role ? eq(users.role, role) : sql`true`,
            or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
          )
        : and(
            sql`${users.role} != 'admin'`,
            role ? eq(users.role, role) : sql`true`
          )
    );

  const allUsers = await baseQuery;

  const results: Person[] = [];

  for (const user of allUsers) {
    if (user.role === 'student') {
      // Get most recent active enrollment
      const enrollment = await db
        .select({
          courseName: courses.name,
          status: enrollments.status,
        })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(enrollments.studentId, user.id))
        .orderBy(desc(enrollments.startDate))
        .limit(1);

      results.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'student',
        courseName: enrollment[0]?.courseName ?? null,
        enrollmentStatus: (enrollment[0]?.status as EnrollmentStatus) ?? null,
      });
    } else if (user.role === 'instructor') {
      // Count EPRs written by this instructor
      const [{ value }] = await db
        .select({ value: count() })
        .from(eprRecords)
        .where(eq(eprRecords.evaluatorId, user.id));

      results.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'instructor',
        totalEprsWritten: Number(value),
      });
    }
  }

  return results;
}
