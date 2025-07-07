import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Users, BookOpen, TrendingUp, AlertTriangle, User, LogOut, Brain } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import AnalyticsChart from "@/components/analytics-chart";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast: showToast } = toast;

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      showToast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user?.role, showToast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && user?.role === "admin",
    retry: false,
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["/api/admin/insights"],
    enabled: isAuthenticated && user?.role === "admin",
    retry: false,
  });

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</span>
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
                  <span>{user?.firstName || 'Admin'}</span>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Admin Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Overview</h1>
            <div className="flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400">
              <Brain className="w-4 h-4" />
              <span>AI-Powered Analytics</span>
            </div>
          </div>

          {/* Admin Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.students?.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.students?.activeStudents || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.courses?.activeCourses || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.courses?.totalCourses || 0} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(stats?.students?.avgCompletionRate || 0)}%
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Platform average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">At-Risk Students</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.students?.atRiskStudents || 0}</div>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Require attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Engagement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart 
                  data={stats?.engagement || []}
                  type="line"
                  dataKey="activeUsers"
                  xAxisKey="date"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart 
                  data={[
                    { name: "Completed", value: 68, color: "#059669" },
                    { name: "In Progress", value: 23, color: "#2563EB" },
                    { name: "Not Started", value: 9, color: "#E5E7EB" },
                  ]}
                  type="doughnut"
                  dataKey="value"
                />
              </CardContent>
            </Card>
          </div>

          {/* AI-Generated Insights */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>AI-Generated Insights</CardTitle>
                <div className="flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400">
                  <Brain className="w-4 h-4" />
                  <span>Generated by Gemini AI</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights?.dropoutAlerts?.map((alert: string, index: number) => (
                    <div key={index} className="alert-gradient rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Dropout Risk Alert</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {insights?.performanceInsights?.map((insight: string, index: number) => (
                    <div key={index} className="success-gradient rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Performance Insight</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {insights?.contentRecommendations?.map((recommendation: string, index: number) => (
                    <div key={index} className="ai-gradient rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Content Recommendation</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
