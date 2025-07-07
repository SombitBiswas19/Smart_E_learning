import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, TrendingUp, Calendar, Brain, User, LogOut, Search, Filter, Grid, List } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import CourseCard from "@/components/course-card";
import AiInsights from "@/components/ai-insights";

export default function StudentDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast: showToast } = useToast();
  
  // State for course filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["/api/enrollments"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ["/api/ai/recommendations"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: dropoutRisk, isLoading: dropoutRiskLoading } = useQuery({
    queryKey: ["/api/ai/dropout-risk"],
    enabled: isAuthenticated,
    retry: false,
  });

  if (isLoading || enrollmentsLoading || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const enrolledCourses = enrollments || [];
  const avgProgress = enrolledCourses.length > 0 
    ? enrolledCourses.reduce((acc: number, e: any) => acc + parseFloat(e.progress || "0"), 0) / enrolledCourses.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Smart E-learning</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary"
                  onClick={() => window.location.href = "/api/logout"}
                >
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover" 
                    />
                  ) : (
                    <User className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 p-1" />
                  )}
                  <span>{user?.firstName || user?.email}</span>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.firstName || 'Student'}!
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Brain className="w-4 h-4" />
              <span>AI-Powered Learning Analytics</span>
            </div>
          </div>

          {/* Progress Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{enrolledCourses.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(avgProgress)}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7 days</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dropoutRisk ? `${Math.round((1 - dropoutRisk.confidence) * 100)}%` : "85%"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Continue Learning</CardTitle>
            </CardHeader>
            <CardContent>
              {enrolledCourses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No courses enrolled yet</p>
                  <Button className="mt-4">
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrolledCourses.map((enrollment: any) => {
                    const course = courses?.find((c: any) => c.id === enrollment.courseId);
                    if (!course) return null;
                    
                    return (
                      <div key={enrollment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{course.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {course.instructorId ? `By ${course.instructorId}` : 'Self-paced'}
                            </p>
                            <div className="flex items-center mt-2">
                              <Progress value={parseFloat(enrollment.progress || "0")} className="w-32" />
                              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                {Math.round(parseFloat(enrollment.progress || "0"))}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link href={`/course/${course.id}`}>
                          <Button>Continue</Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <AiInsights 
            recommendations={recommendations}
            dropoutRisk={dropoutRisk}
            isLoading={recommendationsLoading || dropoutRiskLoading}
          />
        </div>
      </main>
    </div>
  );
}
