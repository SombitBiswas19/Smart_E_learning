import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Star, Users } from "lucide-react";
import { Link } from "wouter";
import type { Course, Enrollment } from "@shared/schema";

interface CourseCardProps {
  course: Course;
  enrollment?: Enrollment;
  showProgress?: boolean;
  onEnroll?: () => void;
  isEnrolling?: boolean;
}

export default function CourseCard({ 
  course, 
  enrollment, 
  showProgress = false, 
  onEnroll,
  isEnrolling = false 
}: CourseCardProps) {
  const progress = enrollment ? parseFloat(enrollment.progress || "0") : 0;
  const isEnrolled = !!enrollment;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 line-clamp-2">{course.title}</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {course.description}
            </p>
          </div>
          <div className="ml-4 w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {course.difficulty && (
            <Badge className={getDifficultyColor(course.difficulty)}>
              {course.difficulty}
            </Badge>
          )}
          {course.category && (
            <Badge variant="outline">
              {course.category}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            <span>{course.totalDuration || 0} minutes</span>
            <span className="mx-2">•</span>
            <span>{course.totalLessons || 0} lessons</span>
          </div>

          {showProgress && isEnrolled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
            <span>4.5</span>
            <span className="mx-2">•</span>
            <Users className="w-4 h-4 mr-1" />
            <span>1,234 students</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {course.instructorId && (
              <span>By {course.instructorId}</span>
            )}
          </div>
          
          {isEnrolled ? (
            <Link href={`/course/${course.id}`}>
              <Button size="sm">
                {progress > 0 ? 'Continue' : 'Start Course'}
              </Button>
            </Link>
          ) : (
            <Button 
              size="sm" 
              onClick={onEnroll}
              disabled={isEnrolling}
            >
              {isEnrolling ? 'Enrolling...' : 'Enroll'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
