import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Play, CheckCircle, Clock, BookOpen, FileText } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import VideoPlayer from "@/components/video-player";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast: showToast } = toast;
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);

  const courseId = parseInt(id || "0");

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

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
    enabled: isAuthenticated && courseId > 0,
    retry: false,
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}/lessons`],
    enabled: isAuthenticated && courseId > 0,
    retry: false,
  });

  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ["/api/enrollments"],
    enabled: isAuthenticated,
    retry: false,
    select: (data: any[]) => data?.find(e => e.courseId === courseId),
  });

  const { data: quizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}/quizzes`],
    enabled: isAuthenticated && courseId > 0,
    retry: false,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/enrollments", { courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      showToast({
        title: "Enrolled Successfully",
        description: "You have been enrolled in this course.",
      });
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
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const progressMutation = useMutation({
    mutationFn: async ({ lessonId, watchTime, completed }: { lessonId: number; watchTime: number; completed: boolean }) => {
      return await apiRequest("POST", `/api/lessons/${lessonId}/progress`, { watchTime, completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
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
      console.error("Progress update failed:", error);
    },
  });

  if (isLoading || courseLoading || lessonsLoading || enrollmentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !course) {
    return null;
  }

  const currentLesson = lessons?.find((l: any) => l.id === currentLessonId) || lessons?.[0];
  const progress = enrollment ? parseFloat(enrollment.progress || "0") : 0;

  const handleLessonComplete = (lessonId: number, watchTime: number) => {
    progressMutation.mutate({ lessonId, watchTime, completed: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{course.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Progress: <span className="font-semibold text-primary">{Math.round(progress)}%</span>
              </span>
              {quizzes && quizzes.length > 0 && (
                <Link href={`/quiz/${quizzes[0].id}`}>
                  <Button>Take Quiz</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player and Content */}
          <div className="lg:col-span-2 space-y-6">
            {!enrollment ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Enroll in this course</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Get access to all lessons and quizzes in this course.
                  </p>
                  <Button 
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Video Player */}
                {currentLesson && (
                  <div className="bg-black rounded-lg overflow-hidden">
                    <VideoPlayer
                      lesson={currentLesson}
                      onProgress={(watchTime) => {
                        progressMutation.mutate({ 
                          lessonId: currentLesson.id, 
                          watchTime, 
                          completed: false 
                        });
                      }}
                      onComplete={(watchTime) => handleLessonComplete(currentLesson.id, watchTime)}
                    />
                  </div>
                )}

                {/* Course Content */}
                <Card>
                  <CardHeader>
                    <CardTitle>{currentLesson?.title || course.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {currentLesson?.description || course.description}
                      </p>
                      {currentLesson && (
                        <>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Learning Objectives:
                          </h3>
                          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                            <li>Understand the core concepts covered in this lesson</li>
                            <li>Apply the knowledge through practical examples</li>
                            <li>Prepare for the upcoming quiz assessment</li>
                          </ul>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
              </CardHeader>
              <CardContent>
                {lessons && lessons.length > 0 ? (
                  <div className="space-y-2">
                    {lessons.map((lesson: any, index: number) => (
                      <div
                        key={lesson.id}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          currentLessonId === lesson.id || (currentLessonId === null && index === 0)
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => setCurrentLessonId(lesson.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                            <Play className="w-3 h-3 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{lesson.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {lesson.duration || 0} min
                            </p>
                          </div>
                        </div>
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No lessons available yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle>My Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes here..."
                  className="min-h-32"
                />
                <Button className="mt-3 w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
