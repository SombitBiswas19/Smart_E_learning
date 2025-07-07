import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, Lightbulb, BookOpen } from "lucide-react";
import { Link } from "wouter";

interface Recommendation {
  courseId: number;
  title: string;
  description: string;
  reason: string;
  confidence: number;
}

interface DropoutRisk {
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  factors: string[];
  recommendations: string[];
}

interface AiInsightsProps {
  recommendations?: Recommendation[];
  dropoutRisk?: DropoutRisk;
  isLoading?: boolean;
}

export default function AiInsights({ recommendations, dropoutRisk, isLoading }: AiInsightsProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low':
        return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>AI Insights</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400">
              <Brain className="w-4 h-4" />
              <span>Powered by Gemini AI</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Insights</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400">
            <Brain className="w-4 h-4" />
            <span>Powered by Gemini AI</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dropout Risk Assessment */}
        {dropoutRisk && (
          <div className="ai-gradient rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                {getRiskIcon(dropoutRisk.riskLevel)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Learning Progress Assessment
                  </p>
                  <Badge className={getRiskColor(dropoutRisk.riskLevel)}>
                    {dropoutRisk.riskLevel} risk
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Based on your engagement patterns, you're showing {dropoutRisk.riskLevel} risk of 
                  discontinuing your studies. Confidence: {Math.round(dropoutRisk.confidence * 100)}%
                </p>
                
                {dropoutRisk.factors.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Key Factors:
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {dropoutRisk.factors.slice(0, 3).map((factor, index) => (
                        <li key={index}>• {factor}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {dropoutRisk.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Recommendations:
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {dropoutRisk.recommendations.slice(0, 2).map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Course Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Recommended for You
            </h3>
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="success-gradient rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {rec.title}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(rec.confidence * 100)}% match
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {rec.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                      {rec.reason}
                    </p>
                    <Link href={`/course/${rec.courseId}`}>
                      <Button size="sm" variant="outline">
                        View Course
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* General Learning Tips */}
        <div className="ai-gradient rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Study Tip</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Based on your learning patterns, try to maintain consistent daily study sessions 
                of 20-30 minutes for optimal retention and progress.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
