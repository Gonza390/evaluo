'use client';

import { cn } from '@/lib/utils';

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions: number[];
  onQuestionSelect: (questionNumber: number) => void;
}

export function QuestionNavigator({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  onQuestionSelect,
}: QuestionNavigatorProps) {
  return (
    <aside className="border-border bg-card flex h-full w-full flex-col border-r p-4">
      <h2 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
        Navegación
      </h2>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((num) => {
          const isAnswered = answeredQuestions.includes(num);
          const isCurrent = num === currentQuestion;

          return (
            <button
              key={num}
              onClick={() => onQuestionSelect(num)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-all',
                'focus:ring-ring hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:outline-none',
                {
                  'bg-muted text-muted-foreground': !isAnswered && !isCurrent,
                  'bg-primary/20 text-primary': isAnswered && !isCurrent,
                  'ring-primary bg-primary text-primary-foreground ring-2': isCurrent,
                }
              )}
            >
              {num}
            </button>
          );
        })}
      </div>
      <div className="mt-6 space-y-2">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span className="bg-muted h-3 w-3 rounded-sm" />
          Sin responder
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span className="bg-primary/20 h-3 w-3 rounded-sm" />
          Respondida
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span className="bg-primary h-3 w-3 rounded-sm" />
          Actual
        </div>
      </div>
    </aside>
  );
}
