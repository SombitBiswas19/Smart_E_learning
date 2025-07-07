import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, TrendingUp, Calendar, Brain, User, LogOut, Search, Filter, Grid, List, Star, Clock, Users } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import CourseCard from "@/components/course-card";
import AiInsights from "@/components/ai-insights";
import type { Course, Enrollment } from "@shared/schema";

interface ExtendedCourse extends Course {
  enrollmentCount?: number;
  rating?: number;
  instructor?: string;
}

export default function EnhancedStudentDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast: showToast } = useToast();
  
  // State for course filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");

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

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["/api/enrollments"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: aiRecommendations, isLoading: aiRecommendationsLoading } = useQuery({
    queryKey: ["/api/ai/recommendations"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: dropoutRisk, isLoading: dropoutRiskLoading } = useQuery({
    queryKey: ["/api/ai/dropout-risk"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Filter and sort courses
  const filteredCourses = courses.filter((course: Course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || course.category === selectedCategory;
    const matchesDifficulty = !selectedDifficulty || course.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const sortedCourses = filteredCourses.sort((a: Course, b: Course) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title);
      case "difficulty":
        const difficultyOrder = { "beginner": 1, "intermediate": 2, "advanced": 3 };
        return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) - 
               (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0);
      case "newest":
      default:
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  });

  // Get unique categories and difficulties
  const categories = [...new Set(courses.map((c: Course) => c.category).filter(Boolean))];
  const difficulties = ["beginner", "intermediate", "advanced"];

  // Calculate stats
  const totalCourses = courses.length;
  const enrolledCourses = enrollments.length;
  const completedCourses = enrollments.filter((e: any) => e.progress === 100).length;
  const avgProgress = enrollments.length > 0 
    ? enrollments.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / enrollments.length 
    : 0;

  if (isLoading || enrollmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Smart Learning</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {(user as any)?.firstName || (user as any)?.email || "Student"}
                </span>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href="/api/logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCourses}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enrolled</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{enrolledCourses}</p>
                </div>
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedCourses}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(avgProgress)}%</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses">All Courses</TabsTrigger>
            <TabsTrigger value="enrolled">My Courses</TabsTrigger>
            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            {/* Search and Filter Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Course Browser
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Levels</SelectItem>
                        {difficulties.map((difficulty) => (
                          <SelectItem key={difficulty} value={difficulty}>
                            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="difficulty">Difficulty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Grid/List */}
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {coursesLoading ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : sortedCourses.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No courses found matching your criteria.</p>
                </div>
              ) : (
                sortedCourses.map((course: Course) => {
                  const enrollment = enrollments.find((e: any) => e.courseId === course.id);
                  return (
                    <CourseCard
                      key={course.id}
                      course={course}
                      enrollment={enrollment}
                      showProgress={!!enrollment}
                    />
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="enrolled" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Enrolled Courses</CardTitle>
              </CardHeader>
              <CardContent>
                {enrollments.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    You haven't enrolled in any courses yet. Browse courses to get started!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments.map((enrollment: any) => {
                      const course = courses.find((c: Course) => c.id === enrollment.courseId);
                      if (!course) return null;
                      return (
                        <CourseCard
                          key={course.id}
                          course={course}
                          enrollment={enrollment}
                          showProgress={true}
                        />
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-6">
            <AiInsights
              recommendations={aiRecommendations as any}
              dropoutRisk={dropoutRisk as any}
              isLoading={aiRecommendationsLoading || dropoutRiskLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}