import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCourseSchema, insertLessonSchema, insertQuizSchema, insertQuizQuestionSchema, insertQuizAttemptSchema, insertEnrollmentSchema } from "@shared/schema";
import { z } from "zod";
import {
  predictDropoutRisk,
  predictPerformance,
  generateContentRecommendations,
  generateLearningPathSuggestion,
  generateQuizHint,
  generateAdminInsights,
  generateAdaptiveQuestions,
  analyzeStudentLearningPattern,
} from "./gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse({
        ...courseData,
        instructorId: userId,
      });

      // Log activity
      await storage.logActivity({
        userId,
        action: "course_created",
        entityType: "course",
        entityId: course.id,
        metadata: { courseTitle: course.title },
      });

      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  // Lesson routes
  app.get("/api/courses/:courseId/lessons", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const lessons = await storage.getLessons(courseId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.post("/api/courses/:courseId/lessons", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const courseId = parseInt(req.params.courseId);
      const lessonData = insertLessonSchema.parse(req.body);
      const lesson = await storage.createLesson({
        ...lessonData,
        courseId,
      });

      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  // Enrollment routes
  app.get("/api/enrollments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const enrollments = await storage.getEnrollments(userId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { courseId } = req.body;
      
      const existingEnrollment = await storage.getEnrollment(userId, courseId);
      if (existingEnrollment) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }

      const enrollment = await storage.createEnrollment({
        userId,
        courseId,
        progress: "0",
      });

      // Log activity
      await storage.logActivity({
        userId,
        action: "course_enrolled",
        entityType: "course",
        entityId: courseId,
        metadata: { enrollmentId: enrollment.id },
      });

      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });

  // Lesson progress routes
  app.post("/api/lessons/:lessonId/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lessonId = parseInt(req.params.lessonId);
      const { watchTime, completed } = req.body;

      await storage.updateLessonProgress(userId, lessonId, watchTime, completed);

      // Log activity
      await storage.logActivity({
        userId,
        action: completed ? "lesson_completed" : "lesson_progress",
        entityType: "lesson",
        entityId: lessonId,
        metadata: { watchTime, completed },
      });

      res.json({ message: "Progress updated successfully" });
    } catch (error) {
      console.error("Error updating lesson progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Quiz routes
  app.get("/api/courses/:courseId/quizzes", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const quizzes = await storage.getQuizzes(courseId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get("/api/quizzes/:quizId", async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.get("/api/quizzes/:quizId/questions", async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const questions = await storage.getQuizQuestions(quizId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Failed to fetch quiz questions" });
    }
  });

  app.post("/api/quizzes/:quizId/attempts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quizId = parseInt(req.params.quizId);
      
      const attempt = await storage.createQuizAttempt({
        userId,
        quizId,
        startedAt: new Date(),
      });

      // Log activity
      await storage.logActivity({
        userId,
        action: "quiz_started",
        entityType: "quiz",
        entityId: quizId,
        metadata: { attemptId: attempt.id },
      });

      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error starting quiz attempt:", error);
      res.status(500).json({ message: "Failed to start quiz attempt" });
    }
  });

  app.patch("/api/quiz-attempts/:attemptId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const attemptId = parseInt(req.params.attemptId);
      const { answers, score, correctAnswers, timeSpent } = req.body;

      const updatedAttempt = await storage.updateQuizAttempt(attemptId, {
        answers,
        score: score?.toString(),
        correctAnswers,
        timeSpent,
        completedAt: new Date(),
      });

      // Log activity
      await storage.logActivity({
        userId,
        action: "quiz_completed",
        entityType: "quiz",
        entityId: updatedAttempt.quizId,
        metadata: { attemptId, score, correctAnswers },
      });

      res.json(updatedAttempt);
    } catch (error) {
      console.error("Error updating quiz attempt:", error);
      res.status(500).json({ message: "Failed to update quiz attempt" });
    }
  });

  // AI-powered routes
  app.get("/api/ai/recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recommendations = await generateContentRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.get("/api/ai/dropout-risk", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prediction = await predictDropoutRisk(userId);
      res.json(prediction);
    } catch (error) {
      console.error("Error predicting dropout risk:", error);
      res.status(500).json({ message: "Failed to predict dropout risk" });
    }
  });

  app.get("/api/ai/performance/:courseId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const courseId = parseInt(req.params.courseId);
      const prediction = await predictPerformance(userId, courseId);
      res.json(prediction);
    } catch (error) {
      console.error("Error predicting performance:", error);
      res.status(500).json({ message: "Failed to predict performance" });
    }
  });

  app.post("/api/ai/quiz-hint", isAuthenticated, async (req: any, res) => {
    try {
      const { question, options, userAnswer } = req.body;
      const hint = await generateQuizHint(question, options, userAnswer);
      res.json({ hint });
    } catch (error) {
      console.error("Error generating quiz hint:", error);
      res.status(500).json({ message: "Failed to generate quiz hint" });
    }
  });

  app.get('/api/ai/adaptive-questions/:quizId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quizId = parseInt(req.params.quizId);
      const attempts = await storage.getQuizAttempts(userId, quizId);
      const adaptiveQuestions = await generateAdaptiveQuestions(userId, quizId, attempts);
      res.json(adaptiveQuestions);
    } catch (error) {
      console.error("Error generating adaptive questions:", error);
      res.status(500).json({ message: "Failed to generate adaptive questions" });
    }
  });

  app.get('/api/ai/learning-pattern', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pattern = await analyzeStudentLearningPattern(userId);
      res.json(pattern);
    } catch (error) {
      console.error("Error analyzing learning pattern:", error);
      res.status(500).json({ message: "Failed to analyze learning pattern" });
    }
  });

  // Admin routes
  app.get("/api/admin/insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const insights = await generateAdminInsights();
      res.json(insights);
    } catch (error) {
      console.error("Error generating admin insights:", error);
      res.status(500).json({ message: "Failed to generate admin insights" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const [studentStats, courseStats, engagementData] = await Promise.all([
        storage.getStudentStats(),
        storage.getCourseStats(),
        storage.getEngagementData(),
      ]);

      res.json({
        students: studentStats,
        courses: courseStats,
        engagement: engagementData,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
