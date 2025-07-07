import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Award, Brain, TrendingUp, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Smart E-learning</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary hover:bg-primary/90"
          >
            Sign In
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                AI-Powered Learning Platform
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Transform your education with intelligent analytics, personalized recommendations, and predictive insights powered by advanced AI.
              </p>
            </div>
            <div className="space-x-4">
              <Button 
                size="lg" 
                onClick={() => window.location.href = "/api/login"}
                className="bg-primary hover:bg-primary/90"
              >
                Get Started
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="grid items-center gap-6 lg:grid-cols-3 lg:gap-12">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-primary/10 p-3">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">AI-Powered Analytics</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Advanced machine learning algorithms analyze your learning patterns and provide personalized insights to optimize your study experience.
              </p>
            </div>
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-primary/10 p-3">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Predictive Performance</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Get ahead of potential challenges with our AI that predicts performance outcomes and suggests interventions before you fall behind.
              </p>
            </div>
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Personalized Learning</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Tailored course recommendations and learning paths based on your interests, progress, and learning style preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,847</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Courses Available</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">143</div>
                <p className="text-xs text-muted-foreground">+8 new this week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">74%</div>
                <p className="text-xs text-muted-foreground">+3% this month</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white dark:bg-gray-900">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 Smart E-learning. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Button variant="link" size="sm" className="text-xs">
            Terms of Service
          </Button>
          <Button variant="link" size="sm" className="text-xs">
            Privacy
          </Button>
        </nav>
      </footer>
    </div>
  );
}
