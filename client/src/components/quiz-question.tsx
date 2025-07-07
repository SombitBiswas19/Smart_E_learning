import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { QuizQuestion } from "@shared/schema";

interface QuizQuestionProps {
  question: QuizQuestion;
  answer?: string;
  onAnswerChange: (answer: string) => void;
  showCorrectAnswer?: boolean;
  disabled?: boolean;
}

export default function QuizQuestion({ 
  question, 
  answer, 
  onAnswerChange, 
  showCorrectAnswer = false,
  disabled = false 
}: QuizQuestionProps) {
  const renderQuestionContent = () => {
    switch (question.type) {
      case "multiple_choice":
        const options = question.options as string[] || [];
        return (
          <RadioGroup
            value={answer || ""}
            onValueChange={onAnswerChange}
            disabled={disabled}
            className="space-y-4"
          >
            {options.map((option, index) => {
              const optionId = `option-${index}`;
              const isCorrect = showCorrectAnswer && option === question.correctAnswer;
              const isSelected = answer === option;
              const isWrong = showCorrectAnswer && isSelected && option !== question.correctAnswer;
              
              return (
                <div
                  key={index}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : isWrong
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <RadioGroupItem value={option} id={optionId} className="mr-4" />
                  <Label 
                    htmlFor={optionId} 
                    className={`flex-1 cursor-pointer ${
                      isCorrect ? "text-green-700 dark:text-green-300" : 
                      isWrong ? "text-red-700 dark:text-red-300" : ""
                    }`}
                  >
                    {option}
                  </Label>
                  {showCorrectAnswer && isCorrect && (
                    <span className="text-green-600 text-sm font-medium">✓ Correct</span>
                  )}
                  {showCorrectAnswer && isWrong && (
                    <span className="text-red-600 text-sm font-medium">✗ Incorrect</span>
                  )}
                </div>
              );
            })}
          </RadioGroup>
        );

      case "true_false":
        return (
          <RadioGroup
            value={answer || ""}
            onValueChange={onAnswerChange}
            disabled={disabled}
            className="space-y-4"
          >
            {["True", "False"].map((option) => {
              const isCorrect = showCorrectAnswer && option === question.correctAnswer;
              const isSelected = answer === option;
              const isWrong = showCorrectAnswer && isSelected && option !== question.correctAnswer;
              
              return (
                <div
                  key={option}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : isWrong
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <RadioGroupItem value={option} id={option} className="mr-4" />
                  <Label 
                    htmlFor={option} 
                    className={`flex-1 cursor-pointer ${
                      isCorrect ? "text-green-700 dark:text-green-300" : 
                      isWrong ? "text-red-700 dark:text-red-300" : ""
                    }`}
                  >
                    {option}
                  </Label>
                  {showCorrectAnswer && isCorrect && (
                    <span className="text-green-600 text-sm font-medium">✓ Correct</span>
                  )}
                  {showCorrectAnswer && isWrong && (
                    <span className="text-red-600 text-sm font-medium">✗ Incorrect</span>
                  )}
                </div>
              );
            })}
          </RadioGroup>
        );

      case "short_answer":
        return (
          <div className="space-y-4">
            <Textarea
              value={answer || ""}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Enter your answer here..."
              disabled={disabled}
              className="min-h-32"
            />
            {showCorrectAnswer && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                  Correct Answer:
                </p>
                <p className="text-green-700 dark:text-green-300">{question.correctAnswer}</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            value={answer || ""}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Enter your answer..."
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {question.question}
        </h2>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="capitalize">
            {question.type?.replace('_', ' ') || 'Multiple Choice'}
          </span>
          {question.type === "multiple_choice" && (
            <span>• Select one answer</span>
          )}
          {question.type === "true_false" && (
            <span>• Select True or False</span>
          )}
          {question.type === "short_answer" && (
            <span>• Write your answer in the text area</span>
          )}
        </div>
      </div>

      {renderQuestionContent()}

      {showCorrectAnswer && question.explanation && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Explanation:
          </p>
          <p className="text-blue-700 dark:text-blue-300">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
