import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './db';
import { users, courses, enrollments, eprRecords } from './db/schema';

// Fixed admin user id used across the application
export const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';

async function seed() {
  console.log('🌱 Seeding database...');

  // ─── Users ────────────────────────────────────────────────────────────────
  const [admin] = await db
    .insert(users)
    .values({
      id: ADMIN_USER_ID,
      name: 'Admin User',
      email: 'admin@airman.academy',
      role: 'admin',
    })
    .onConflictDoNothing()
    .returning();

  const seedInstructors = await db
    .insert(users)
    .values([
      {
        name: 'Captain James Harrington',
        email: 'j.harrington@airman.academy',
        role: 'instructor',
      },
      {
        name: 'First Officer Sarah Chen',
        email: 's.chen@airman.academy',
        role: 'instructor',
      },
      {
        name: 'Captain Michael Torres',
        email: 'm.torres@airman.academy',
        role: 'instructor',
      },
    ])
    .onConflictDoNothing()
    .returning();

  const seedStudents = await db
    .insert(users)
    .values([
      { name: 'Alex Kumar', email: 'a.kumar@airman.academy', role: 'student' },
      { name: 'Priya Sharma', email: 'p.sharma@airman.academy', role: 'student' },
      { name: 'James O\'Brien', email: 'j.obrien@airman.academy', role: 'student' },
      { name: 'Maria Gonzalez', email: 'm.gonzalez@airman.academy', role: 'student' },
      { name: 'David Nakamura', email: 'd.nakamura@airman.academy', role: 'student' },
      { name: 'Sophie Dubois', email: 's.dubois@airman.academy', role: 'student' },
      { name: 'Omar Al-Rashid', email: 'o.alrashid@airman.academy', role: 'student' },
      { name: 'Emily Watson', email: 'e.watson@airman.academy', role: 'student' },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`✅ Created ${seedInstructors.length} instructors, ${seedStudents.length} students`);

  // ─── Courses ──────────────────────────────────────────────────────────────
  const seedCourses = await db
    .insert(courses)
    .values([
      {
        name: 'PPL Integrated',
        licenseType: 'PPL',
        totalRequiredHours: '45',
      },
      {
        name: 'CPL Integrated',
        licenseType: 'CPL',
        totalRequiredHours: '150',
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`✅ Created ${seedCourses.length} courses`);

  // ─── Enrollments ──────────────────────────────────────────────────────────
  if (seedStudents.length > 0 && seedCourses.length >= 2) {
    const [pplCourse, cplCourse] = seedCourses;
    const enrollmentData = seedStudents.map((student, idx) => ({
      studentId: student.id,
      courseId: idx < 4 ? pplCourse.id : cplCourse.id,
      startDate: idx < 4 ? '2024-09-01' : '2024-10-01',
      status: (idx === 2 ? 'completed' : 'active') as 'active' | 'completed' | 'dropped',
    }));

    await db.insert(enrollments).values(enrollmentData).onConflictDoNothing();
    console.log(`✅ Created ${enrollmentData.length} enrollments`);
  }

  // ─── EPR Records ──────────────────────────────────────────────────────────
  if (seedStudents.length >= 4 && seedInstructors.length >= 2) {
    const [inst1, inst2, inst3] = seedInstructors;
    const [s1, s2, s3, s4, s5, s6] = seedStudents;

    const eprData = [
      // Student EPRs
      {
        personId: s1.id,
        evaluatorId: inst1.id,
        roleType: 'student' as const,
        periodStart: '2024-01-01',
        periodEnd: '2024-03-31',
        overallRating: 5,
        technicalSkillsRating: 5,
        nonTechnicalSkillsRating: 4,
        remarks:
          'Alex demonstrates exceptional airmanship. CRM skills are outstanding — consistently briefs crew effectively and maintains excellent situational awareness. Checklist discipline is impeccable.',
        status: 'submitted' as const,
      },
      {
        personId: s1.id,
        evaluatorId: inst2.id,
        roleType: 'student' as const,
        periodStart: '2024-04-01',
        periodEnd: '2024-06-30',
        overallRating: 4,
        technicalSkillsRating: 4,
        nonTechnicalSkillsRating: 5,
        remarks:
          'Good performance showing consistent improvement. Non-technical skills particularly strong — leadership qualities evident during multi-crew operations.',
        status: 'submitted' as const,
      },
      {
        personId: s2.id,
        evaluatorId: inst1.id,
        roleType: 'student' as const,
        periodStart: '2024-01-01',
        periodEnd: '2024-03-31',
        overallRating: 3,
        technicalSkillsRating: 3,
        nonTechnicalSkillsRating: 4,
        remarks:
          'Priya shows solid foundations in navigation and communications but needs to sharpen instrument scan technique. Focus on ILS approaches during next training phase.',
        status: 'submitted' as const,
      },
      {
        personId: s3.id,
        evaluatorId: inst3.id,
        roleType: 'student' as const,
        periodStart: '2024-07-01',
        periodEnd: '2024-09-30',
        overallRating: 2,
        technicalSkillsRating: 2,
        nonTechnicalSkillsRating: 3,
        remarks:
          'James requires additional focus on checklist discipline and situational awareness. Recommend dedicated ground school review of emergency procedures. Support sessions scheduled.',
        status: 'submitted' as const,
      },
      {
        personId: s4.id,
        evaluatorId: inst2.id,
        roleType: 'student' as const,
        periodStart: '2024-10-01',
        periodEnd: '2024-12-31',
        overallRating: 4,
        technicalSkillsRating: 5,
        nonTechnicalSkillsRating: 3,
        remarks:
          'Maria excels in technical airmanship — demonstrates precise aircraft control and strong systems knowledge. CRM development is an area to nurture going into next phase.',
        status: 'submitted' as const,
      },
      {
        personId: s5.id,
        evaluatorId: inst1.id,
        roleType: 'student' as const,
        periodStart: '2024-04-01',
        periodEnd: '2024-06-30',
        overallRating: 5,
        technicalSkillsRating: 5,
        nonTechnicalSkillsRating: 5,
        remarks:
          'Outstanding evaluation. David exhibits mastery of technical airmanship combined with exemplary CRM. Ready for accelerated progression. Natural leader.',
        status: 'submitted' as const,
      },
      {
        personId: s6.id,
        evaluatorId: inst3.id,
        roleType: 'student' as const,
        periodStart: '2025-01-01',
        periodEnd: '2025-03-31',
        overallRating: 3,
        technicalSkillsRating: 4,
        nonTechnicalSkillsRating: 3,
        remarks:
          'Draft evaluation in progress. Sophie shows technical aptitude but situational awareness under high workload needs development.',
        status: 'draft' as const,
      },
      // Instructor EPRs
      {
        personId: inst1.id,
        evaluatorId: ADMIN_USER_ID,
        roleType: 'instructor' as const,
        periodStart: '2024-01-01',
        periodEnd: '2024-06-30',
        overallRating: 5,
        technicalSkillsRating: 5,
        nonTechnicalSkillsRating: 5,
        remarks:
          'Captain Harrington continues to set the benchmark for instructional excellence. Technical knowledge is encyclopaedic and CRM facilitation superb.',
        status: 'submitted' as const,
      },
      {
        personId: inst2.id,
        evaluatorId: ADMIN_USER_ID,
        roleType: 'instructor' as const,
        periodStart: '2024-01-01',
        periodEnd: '2024-06-30',
        overallRating: 4,
        technicalSkillsRating: 4,
        nonTechnicalSkillsRating: 5,
        remarks:
          'First Officer Chen demonstrates strong instructional capability. Particularly effective at building student confidence during instrument flying phases.',
        status: 'submitted' as const,
      },
    ];

    await db.insert(eprRecords).values(eprData).onConflictDoNothing();
    console.log(`✅ Created ${eprData.length} EPR records`);
  }

  console.log('🎉 Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
