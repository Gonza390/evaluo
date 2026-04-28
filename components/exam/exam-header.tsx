'use client';

import { Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ExamHeaderProps {
  subjectTitle: string;
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining: string;
}

export function ExamHeader({
  subjectTitle,
  currentQuestion,
  totalQuestions,
  timeRemaining,
}: ExamHeaderProps) {
  const progressValue = (currentQuestion / totalQuestions) * 100;

  return (
    <header className="border-border bg-card fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-foreground text-lg font-semibold">{subjectTitle}</h1>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Abandonar intento
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center gap-3 px-8">
        <span className="text-muted-foreground text-sm font-medium whitespace-nowrap">
          Pregunta {currentQuestion} de {totalQuestions}
        </span>
        <Progress value={progressValue} className="h-2 w-48" />
      </div>

      <div className="bg-primary/10 flex items-center gap-2 rounded-lg px-4 py-2">
        <Clock className="text-primary h-5 w-5" />
        <span className="text-primary text-lg font-bold tabular-nums">{timeRemaining}</span>
      </div>
    </header>
  );
}
