import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Clock, HelpCircle, Brain } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import QuizQuestion from "@/components/quiz-question";

export default function Quiz() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast: showToast } = toast;
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const quizId = parseInt(id || "0");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      showToast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, showToast]);

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: isAuthenticated && quizId > 0,
    retry: false,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: [`/api/quizzes/${quizId}/questions`],
    enabled: isAuthenticated && quizId > 0,
    retry: false,
  });

  // Start quiz attempt
  const startAttemptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/quizzes/${quizId}/attempts`, {});
      return response.json();
    },
    onSuccess: (data) => {
      setAttemptId(data.id);
      if (quiz?.timeLimit) {
        setTimeRemaining(quiz.timeLimit * 60); // Convert minutes to seconds
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        showToast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      showToast({
        title: "Failed to Start Quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit quiz attempt
  const submitAttemptMutation = useMutation({
    mutationFn: async () => {
      if (!attemptId) throw new Error("No attempt ID");
      
      const correctAnswers = questions?.filter((q: any) => 
        answers[q.id] === q.correctAnswer
      ).length || 0;
      
      const score = (correctAnswers / (questions?.length || 1)) * 100;
      
      const response = await apiRequest("PATCH", `/api/quiz-attempts/${attemptId}`, {
        answers,
        score,
        correctAnswers,
        timeSpent: quiz?.timeLimit ? (quiz.timeLimit * 60 - timeRemaining) : 0,
      });
      return response.json();
    },
    onSuccess: () => {
      showToast({
        title: "Quiz Submitted",
        description: "Your quiz has been submitted successfully!",
      });
      // Redirect back to course
      window.history.back();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        showToast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      showToast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get AI hint
  const getHintMutation = useMutation({
    mutationFn: async () => {
      const currentQuestion = questions?.[currentQuestionIndex];
      if (!currentQuestion) throw new Error("No current question");
      
      const response = await apiRequest("POST", "/api/ai/quiz-hint", {
        question: currentQuestion.question,
        options: currentQuestion.options || [],
        userAnswer: answers[currentQuestion.id],
      });
      return response.json();
    },
    onSuccess: (data) => {
      setHint(data.hint);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        showToast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Failed to get hint:", error);
    },
  });

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            submitAttemptMutation.mutate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, submitAttemptMutation]);

  // Start attempt on load
  useEffect(() => {
    if (quiz && !attemptId) {
      startAttemptMutation.mutate();
    }
  }, [quiz, attemptId, startAttemptMutation]);

  if (isLoading || quizLoading || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !quiz || !questions) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    setHint(null); // Clear hint when answer changes
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setHint(null);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setHint(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Button>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{quiz.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Question <span className="font-semibold">{currentQuestionIndex + 1}</span> of{" "}
                <span className="font-semibold">{questions.length}</span>
              </div>
              {timeRemaining > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time: <span className="font-semibold text-orange-600">{formatTime(timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          {/* Progress Bar */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <Progress value={progress} className="w-full" />
          </div>

          {/* Question */}
          <div className="p-8">
            <QuizQuestion
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
            />

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => getHintMutation.mutate()}
                  disabled={getHintMutation.isPending}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  {getHintMutation.isPending ? "Getting Hint..." : "Get Hint"}
                </Button>
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button onClick={handleNext}>
                    Next Question
                  </Button>
                ) : (
                  <Button 
                    onClick={() => submitAttemptMutation.mutate()}
                    disabled={submitAttemptMutation.isPending}
                  >
                    {submitAttemptMutation.isPending ? "Submitting..." : "Submit Quiz"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* AI-Powered Hint */}
        {hint && (
          <Card className="mt-6 ai-gradient">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">AI Study Hint</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{hint}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
