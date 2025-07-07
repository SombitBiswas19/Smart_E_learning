import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  numeric,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["admin", "student"] }).default("student"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  instructorId: varchar("instructor_id").references(() => users.id),
  thumbnailUrl: varchar("thumbnail_url"),
  difficulty: varchar("difficulty", { enum: ["beginner", "intermediate", "advanced"] }),
  category: varchar("category"),
  totalLessons: integer("total_lessons").default(0),
  totalDuration: integer("total_duration").default(0), // in minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lessons table
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  title: varchar("title").notNull(),
  description: text("description"),
  videoUrl: varchar("video_url"),
  duration: integer("duration").default(0), // in minutes
  orderIndex: integer("order_index"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enrollments table
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  progress: numeric("progress", { precision: 5, scale: 2 }).default("0"),
});

// Lesson progress table
export const lessonProgress = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  courseId: integer("course_id").references(() => courses.id),
  watchTime: integer("watch_time").default(0), // in seconds
  completed: boolean("completed").default(false),
  lastWatchedAt: timestamp("last_watched_at").defaultNow(),
});

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  title: varchar("title").notNull(),
  description: text("description"),
  totalQuestions: integer("total_questions").default(0),
  passingScore: integer("passing_score").default(70),
  timeLimit: integer("time_limit"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz questions table
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => quizzes.id),
  question: text("question").notNull(),
  type: varchar("type", { enum: ["multiple_choice", "true_false", "short_answer"] }).default("multiple_choice"),
  options: jsonb("options"), // Array of options for multiple choice
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  orderIndex: integer("order_index"),
});

// Quiz attempts table
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  quizId: integer("quiz_id").references(() => quizzes.id),
  score: numeric("score", { precision: 5, scale: 2 }),
  totalQuestions: integer("total_questions"),
  correctAnswers: integer("correct_answers"),
  timeSpent: integer("time_spent"), // in seconds
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  answers: jsonb("answers"), // Store user answers
});

// Activity logs table for AI analysis
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(), // login, video_play, video_pause, quiz_start, etc.
  entityType: varchar("entity_type"), // course, lesson, quiz
  entityId: integer("entity_id"),
  metadata: jsonb("metadata"), // Additional context data
  timestamp: timestamp("timestamp").defaultNow(),
});

// AI predictions table
export const aiPredictions = pgTable("ai_predictions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  predictionType: varchar("prediction_type").notNull(), // dropout_risk, performance_prediction, etc.
  confidence: numeric("confidence", { precision: 5, scale: 2 }),
  prediction: jsonb("prediction"), // Prediction data
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses),
  enrollments: many(enrollments),
  lessonProgress: many(lessonProgress),
  quizAttempts: many(quizAttempts),
  activityLogs: many(activityLogs),
  aiPredictions: many(aiPredictions),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, { fields: [courses.instructorId], references: [users.id] }),
  lessons: many(lessons),
  enrollments: many(enrollments),
  quizzes: many(quizzes),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
  progress: many(lessonProgress),
  quizzes: many(quizzes),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  course: one(courses, { fields: [quizzes.courseId], references: [courses.id] }),
  lesson: one(lessons, { fields: [quizzes.lessonId], references: [lessons.id] }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizQuestions.quizId], references: [quizzes.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertCourseSchema = createInsertSchema(courses);
export const insertLessonSchema = createInsertSchema(lessons);
export const insertEnrollmentSchema = createInsertSchema(enrollments);
export const insertQuizSchema = createInsertSchema(quizzes);
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions);
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts);
export const insertActivityLogSchema = createInsertSchema(activityLogs);
export const insertAiPredictionSchema = createInsertSchema(aiPredictions);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type AiPrediction = typeof aiPredictions.$inferSelect;
export type InsertAiPrediction = z.infer<typeof insertAiPredictionSchema>;
