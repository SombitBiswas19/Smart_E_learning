import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";
import type { ActivityLog, User, Course, Enrollment } from "@shared/schema";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

export interface DropoutRiskPrediction {
  userId: string;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  factors: string[];
  recommendations: string[];
}

export interface PerformancePrediction {
  userId: string;
  courseId: number;
  predictedScore: number;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface ContentRecommendation {
  userId: string;
  courseId: number;
  title: string;
  description: string;
  reason: string;
  confidence: number;
}

export interface LearningPathSuggestion {
  userId: string;
  currentCourse: string;
  nextCourse: string;
  reason: string;
  confidence: number;
}

export async function predictDropoutRisk(userId: string): Promise<DropoutRiskPrediction> {
  try {
    // Get user activity logs
    const activityLogs = await storage.getActivityLogs(userId, 100);
    const enrollments = await storage.getEnrollments(userId);
    
    // Prepare data for AI analysis
    const userData = {
      enrollments: enrollments.length,
      avgProgress: enrollments.reduce((acc, e) => acc + parseFloat(e.progress || "0"), 0) / enrollments.length,
      recentActivity: activityLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return logDate > weekAgo;
      }).length,
      totalActivity: activityLogs.length,
      lastLogin: activityLogs.find(log => log.action === "login")?.timestamp,
    };

    const prompt = `
    Analyze this student's learning data and predict their dropout risk:
    
    Student Data:
    - Total enrolled courses: ${userData.enrollments}
    - Average progress across courses: ${userData.avgProgress}%
    - Recent activity (last 7 days): ${userData.recentActivity} actions
    - Total activity: ${userData.totalActivity} actions
    - Last login: ${userData.lastLogin}
    
    Provide a JSON response with the following structure:
    {
      "riskLevel": "low" | "medium" | "high",
      "confidence": number (0-1),
      "factors": ["factor1", "factor2", ...],
      "recommendations": ["recommendation1", "recommendation2", ...]
    }
    
    Consider factors like:
    - Low activity levels
    - Declining engagement
    - Low completion rates
    - Irregular login patterns
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            riskLevel: { type: "string", enum: ["low", "medium", "high"] },
            confidence: { type: "number" },
            factors: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
          },
          required: ["riskLevel", "confidence", "factors", "recommendations"],
        },
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text);
    
    // Save prediction to database
    await storage.savePrediction({
      userId,
      predictionType: "dropout_risk",
      confidence: result.confidence.toString(),
      prediction: result,
    });

    return {
      userId,
      ...result,
    };
  } catch (error) {
    console.error("Error predicting dropout risk:", error);
    throw new Error("Failed to predict dropout risk");
  }
}

export async function predictPerformance(userId: string, courseId: number): Promise<PerformancePrediction> {
  try {
    // Get user's quiz attempts and progress for the course
    const quizzes = await storage.getQuizzes(courseId);
    const enrollment = await storage.getEnrollment(userId, courseId);
    
    if (!enrollment) {
      throw new Error("User not enrolled in course");
    }

    const prompt = `
    Analyze this student's performance in their current course and predict their future performance:
    
    Student Performance Data:
    - Current progress: ${enrollment.progress}%
    - Number of quizzes available: ${quizzes.length}
    - Enrollment date: ${enrollment.enrolledAt}
    
    Provide a JSON response with:
    {
      "predictedScore": number (0-100),
      "confidence": number (0-1),
      "strengths": ["strength1", "strength2", ...],
      "weaknesses": ["weakness1", "weakness2", ...],
      "recommendations": ["recommendation1", "recommendation2", ...]
    }
    
    Base your prediction on the student's current progress and engagement patterns.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            predictedScore: { type: "number" },
            confidence: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
          },
          required: ["predictedScore", "confidence", "strengths", "weaknesses", "recommendations"],
        },
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text);
    
    // Save prediction
    await storage.savePrediction({
      userId,
      predictionType: "performance_prediction",
      confidence: result.confidence.toString(),
      prediction: { ...result, courseId },
    });

    return {
      userId,
      courseId,
      ...result,
    };
  } catch (error) {
    console.error("Error predicting performance:", error);
    throw new Error("Failed to predict performance");
  }
}

export async function generateContentRecommendations(userId: string): Promise<ContentRecommendation[]> {
  try {
    const enrollments = await storage.getEnrollments(userId);
    const courses = await storage.getCourses();
    
    const enrolledCourseIds = enrollments.map(e => e.courseId);
    const availableCourses = courses.filter(c => !enrolledCourseIds.includes(c.id));
    
    const prompt = `
    Generate personalized course recommendations for this student:
    
    Student's Current Enrollments:
    ${enrollments.map(e => `- Course ID: ${e.courseId}, Progress: ${e.progress}%`).join('\n')}
    
    Available Courses:
    ${availableCourses.map(c => `- ID: ${c.id}, Title: ${c.title}, Category: ${c.category}, Difficulty: ${c.difficulty}`).join('\n')}
    
    Provide a JSON array of up to 3 recommendations:
    [{
      "courseId": number,
      "title": "course title",
      "description": "why this course is recommended",
      "reason": "brief reason for recommendation",
      "confidence": number (0-1)
    }]
    
    Consider:
    - Student's current interests based on enrolled courses
    - Skill progression (beginner to advanced)
    - Course categories and difficulty levels
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              courseId: { type: "number" },
              title: { type: "string" },
              description: { type: "string" },
              reason: { type: "string" },
              confidence: { type: "number" },
            },
            required: ["courseId", "title", "description", "reason", "confidence"],
          },
        },
      },
      contents: prompt,
    });

    const recommendations = JSON.parse(response.text);
    
    return recommendations.map((rec: any) => ({
      userId,
      ...rec,
    }));
  } catch (error) {
    console.error("Error generating content recommendations:", error);
    throw new Error("Failed to generate content recommendations");
  }
}

export async function generateLearningPathSuggestion(userId: string, currentCourseId: number): Promise<LearningPathSuggestion> {
  try {
    const currentCourse = await storage.getCourse(currentCourseId);
    const enrollment = await storage.getEnrollment(userId, currentCourseId);
    const allCourses = await storage.getCourses();
    
    if (!currentCourse || !enrollment) {
      throw new Error("Invalid course or enrollment");
    }

    const prompt = `
    Suggest the next course in the learning path for this student:
    
    Current Course: ${currentCourse.title} (${currentCourse.category}, ${currentCourse.difficulty})
    Current Progress: ${enrollment.progress}%
    
    Available Courses:
    ${allCourses.filter(c => c.id !== currentCourseId).map(c => 
      `- ${c.title} (${c.category}, ${c.difficulty})`
    ).join('\n')}
    
    Provide a JSON response:
    {
      "nextCourse": "course title",
      "reason": "explanation for this recommendation",
      "confidence": number (0-1)
    }
    
    Consider logical skill progression and related topics.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            nextCourse: { type: "string" },
            reason: { type: "string" },
            confidence: { type: "number" },
          },
          required: ["nextCourse", "reason", "confidence"],
        },
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text);
    
    return {
      userId,
      currentCourse: currentCourse.title,
      ...result,
    };
  } catch (error) {
    console.error("Error generating learning path suggestion:", error);
    throw new Error("Failed to generate learning path suggestion");
  }
}

export async function generateQuizHint(question: string, options: string[], userAnswer?: string): Promise<string> {
  try {
    const prompt = `
    Provide a helpful hint for this quiz question without giving away the answer:
    
    Question: ${question}
    Options: ${options.join(', ')}
    ${userAnswer ? `Student's answer: ${userAnswer}` : ''}
    
    Give a hint that guides the student toward the correct thinking without revealing the answer directly.
    Keep it concise and encouraging.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Think about the fundamental concepts we've covered in this lesson.";
  } catch (error) {
    console.error("Error generating quiz hint:", error);
    return "Think about the fundamental concepts we've covered in this lesson.";
  }
}

export async function generateAdminInsights(): Promise<{
  dropoutAlerts: string[];
  performanceInsights: string[];
  contentRecommendations: string[];
}> {
  try {
    const studentStats = await storage.getStudentStats();
    const courseStats = await storage.getCourseStats();
    const engagementData = await storage.getEngagementData();
    
    const prompt = `
    Generate administrative insights based on platform analytics:
    
    Student Statistics:
    - Total students: ${studentStats.totalStudents}
    - Active students: ${studentStats.activeStudents}
    - Average completion rate: ${studentStats.avgCompletionRate}%
    - At-risk students: ${studentStats.atRiskStudents}
    
    Course Statistics:
    - Total courses: ${courseStats.totalCourses}
    - Active courses: ${courseStats.activeCourses}
    
    Recent Engagement:
    ${engagementData.map(d => `- ${d.date}: ${d.activeUsers} active users`).join('\n')}
    
    Provide a JSON response with:
    {
      "dropoutAlerts": ["alert1", "alert2", ...],
      "performanceInsights": ["insight1", "insight2", ...],
      "contentRecommendations": ["recommendation1", "recommendation2", ...]
    }
    
    Focus on actionable insights for administrators.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            dropoutAlerts: { type: "array", items: { type: "string" } },
            performanceInsights: { type: "array", items: { type: "string" } },
            contentRecommendations: { type: "array", items: { type: "string" } },
          },
          required: ["dropoutAlerts", "performanceInsights", "contentRecommendations"],
        },
      },
      contents: prompt,
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating admin insights:", error);
    return {
      dropoutAlerts: ["System unable to generate insights at this time"],
      performanceInsights: ["System unable to generate insights at this time"],
      contentRecommendations: ["System unable to generate insights at this time"],
    };
  }
}

export interface AdaptiveQuizQuestion {
  questionId: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  adaptedExplanation: string;
  suggestedHints: string[];
}

export async function generateAdaptiveQuestions(
  userId: string,
  quizId: number,
  studentPerformanceHistory: any[]
): Promise<AdaptiveQuizQuestion[]> {
  const performanceAnalysis = studentPerformanceHistory.length > 0 
    ? `Student has completed ${studentPerformanceHistory.length} previous attempts with an average score of ${
        studentPerformanceHistory.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / studentPerformanceHistory.length
      }%.`
    : "This is the student's first attempt.";

  const prompt = `
    You are an adaptive learning AI that customizes quiz questions based on student performance.
    
    Context:
    - Student ID: ${userId}
    - Quiz ID: ${quizId}
    - Performance History: ${performanceAnalysis}
    
    Based on the student's performance, recommend:
    1. Appropriate difficulty level (beginner/intermediate/advanced)
    2. Customized explanations that match their learning level
    3. Helpful hints tailored to their understanding
    
    Respond with JSON containing recommendations for adaptive learning.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            recommendedDifficulty: { type: "string" },
            adaptedQuestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  questionId: { type: "number" },
                  difficulty: { type: "string" },
                  adaptedExplanation: { type: "string" },
                  suggestedHints: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    return result.adaptedQuestions || [];
  } catch (error) {
    console.error("Error generating adaptive questions:", error);
    return [];
  }
}

export async function analyzeStudentLearningPattern(userId: string): Promise<{
  learningStyle: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}> {
  const prompt = `
    Analyze the learning patterns for student ${userId} and provide insights about their learning style,
    strengths, weaknesses, and personalized recommendations for improvement.
    
    Consider factors like:
    - Quiz performance trends
    - Time spent on different topics
    - Common mistake patterns
    - Engagement levels
    
    Provide actionable insights to help personalize their learning experience.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            learningStyle: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt,
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing learning pattern:", error);
    return {
      learningStyle: "Visual learner",
      strengths: ["Quick understanding of concepts"],
      weaknesses: ["Needs more practice with advanced topics"],
      recommendations: ["Try interactive exercises", "Review fundamentals"]
    };
  }
}
