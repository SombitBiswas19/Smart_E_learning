import {
  users,
  courses,
  lessons,
  enrollments,
  lessonProgress,
  quizzes,
  quizQuestions,
  quizAttempts,
  activityLogs,
  aiPredictions,
  type User,
  type UpsertUser,
  type Course,
  type InsertCourse,
  type Lesson,
  type InsertLesson,
  type Enrollment,
  type InsertEnrollment,
  type LessonProgress,
  type Quiz,
  type InsertQuiz,
  type QuizQuestion,
  type InsertQuizQuestion,
  type QuizAttempt,
  type InsertQuizAttempt,
  type ActivityLog,
  type InsertActivityLog,
  type AiPrediction,
  type InsertAiPrediction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, avg, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: number): Promise<void>;
  
  // Lesson operations
  getLessons(courseId: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson>;
  
  // Enrollment operations
  getEnrollments(userId: string): Promise<Enrollment[]>;
  getEnrollment(userId: string, courseId: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollmentProgress(userId: string, courseId: number, progress: number): Promise<void>;
  
  // Lesson progress operations
  getLessonProgress(userId: string, lessonId: number): Promise<LessonProgress | undefined>;
  updateLessonProgress(userId: string, lessonId: number, watchTime: number, completed: boolean): Promise<void>;
  
  // Quiz operations
  getQuizzes(courseId: number): Promise<Quiz[]>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuizQuestions(quizId: number): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  
  // Quiz attempt operations
  getQuizAttempts(userId: string, quizId: number): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  updateQuizAttempt(id: number, attempt: Partial<InsertQuizAttempt>): Promise<QuizAttempt>;
  
  // Activity log operations
  logActivity(log: InsertActivityLog): Promise<void>;
  getActivityLogs(userId: string, limit?: number): Promise<ActivityLog[]>;
  
  // AI predictions operations
  savePrediction(prediction: InsertAiPrediction): Promise<AiPrediction>;
  getPredictions(userId: string, type?: string): Promise<AiPrediction[]>;
  
  // Analytics operations
  getStudentStats(): Promise<{
    totalStudents: number;
    activeStudents: number;
    avgCompletionRate: number;
    atRiskStudents: number;
  }>;
  getCourseStats(): Promise<{
    totalCourses: number;
    activeCourses: number;
    avgRating: number;
  }>;
  getEngagementData(): Promise<Array<{ date: string; activeUsers: number }>>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isActive, true));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...course, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.update(courses).set({ isActive: false }).where(eq(courses.id, id));
  }

  // Lesson operations
  async getLessons(courseId: number): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(lessons.orderIndex);
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  async updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson> {
    const [updatedLesson] = await db
      .update(lessons)
      .set(lesson)
      .where(eq(lessons.id, id))
      .returning();
    return updatedLesson;
  }

  // Enrollment operations
  async getEnrollments(userId: string): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.enrolledAt));
  }

  async getEnrollment(userId: string, courseId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return enrollment;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateEnrollmentProgress(userId: string, courseId: number, progress: number): Promise<void> {
    await db
      .update(enrollments)
      .set({ progress: progress.toString() })
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
  }

  // Lesson progress operations
  async getLessonProgress(userId: string, lessonId: number): Promise<LessonProgress | undefined> {
    const [progress] = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)));
    return progress;
  }

  async updateLessonProgress(userId: string, lessonId: number, watchTime: number, completed: boolean): Promise<void> {
    await db
      .insert(lessonProgress)
      .values({
        userId,
        lessonId,
        watchTime,
        completed,
        lastWatchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: {
          watchTime,
          completed,
          lastWatchedAt: new Date(),
        },
      });
  }

  // Quiz operations
  async getQuizzes(courseId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.courseId, courseId));
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
    return await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.orderIndex);
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [newQuestion] = await db.insert(quizQuestions).values(question).returning();
    return newQuestion;
  }

  // Quiz attempt operations
  async getQuizAttempts(userId: string, quizId: number): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)))
      .orderBy(desc(quizAttempts.startedAt));
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return newAttempt;
  }

  async updateQuizAttempt(id: number, attempt: Partial<InsertQuizAttempt>): Promise<QuizAttempt> {
    const [updatedAttempt] = await db
      .update(quizAttempts)
      .set(attempt)
      .where(eq(quizAttempts.id, id))
      .returning();
    return updatedAttempt;
  }

  // Activity log operations
  async logActivity(log: InsertActivityLog): Promise<void> {
    await db.insert(activityLogs).values(log);
  }

  async getActivityLogs(userId: string, limit = 100): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
  }

  // AI predictions operations
  async savePrediction(prediction: InsertAiPrediction): Promise<AiPrediction> {
    const [newPrediction] = await db.insert(aiPredictions).values(prediction).returning();
    return newPrediction;
  }

  async getPredictions(userId: string, type?: string): Promise<AiPrediction[]> {
    if (type) {
      return await db
        .select()
        .from(aiPredictions)
        .where(and(eq(aiPredictions.userId, userId), eq(aiPredictions.predictionType, type)))
        .orderBy(desc(aiPredictions.createdAt));
    }
    
    return await db
      .select()
      .from(aiPredictions)
      .where(eq(aiPredictions.userId, userId))
      .orderBy(desc(aiPredictions.createdAt));
  }

  // Analytics operations
  async getStudentStats(): Promise<{
    totalStudents: number;
    activeStudents: number;
    avgCompletionRate: number;
    atRiskStudents: number;
  }> {
    const [stats] = await db
      .select({
        totalStudents: count(users.id),
        avgCompletionRate: avg(enrollments.progress),
      })
      .from(users)
      .leftJoin(enrollments, eq(users.id, enrollments.userId))
      .where(eq(users.role, "student"));

    // Calculate active students (those who have logged in recently)
    const activeStudentsQuery = await db
      .select({ count: count() })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.action, "login"),
          sql`${activityLogs.timestamp} > NOW() - INTERVAL '7 days'`
        )
      );

    const activeStudents = activeStudentsQuery[0]?.count || 0;

    // Calculate at-risk students (low completion rate)
    const atRiskQuery = await db
      .select({ count: count() })
      .from(enrollments)
      .where(sql`${enrollments.progress} < 30`);

    const atRiskStudents = atRiskQuery[0]?.count || 0;

    return {
      totalStudents: stats?.totalStudents || 0,
      activeStudents,
      avgCompletionRate: parseFloat(stats?.avgCompletionRate || "0"),
      atRiskStudents,
    };
  }

  async getCourseStats(): Promise<{
    totalCourses: number;
    activeCourses: number;
    avgRating: number;
  }> {
    const [stats] = await db
      .select({
        totalCourses: count(courses.id),
        activeCourses: count(sql`CASE WHEN ${courses.isActive} THEN 1 END`),
      })
      .from(courses);

    return {
      totalCourses: stats?.totalCourses || 0,
      activeCourses: stats?.activeCourses || 0,
      avgRating: 4.5, // Placeholder for now
    };
  }

  async getEngagementData(): Promise<Array<{ date: string; activeUsers: number }>> {
    const result = await db
      .select({
        date: sql<string>`DATE(${activityLogs.timestamp})`,
        activeUsers: sql<number>`COUNT(DISTINCT ${activityLogs.userId})`,
      })
      .from(activityLogs)
      .where(sql`${activityLogs.timestamp} > NOW() - INTERVAL '7 days'`)
      .groupBy(sql`DATE(${activityLogs.timestamp})`)
      .orderBy(sql`DATE(${activityLogs.timestamp})`);

    return result;
  }
}

export const storage = new DatabaseStorage();
