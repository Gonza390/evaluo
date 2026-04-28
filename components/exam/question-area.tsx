'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  text: string;
}

interface QuestionAreaProps {
  questionNumber: number;
  questionText: string;
  options: Option[];
  correctOption: string | null;
  explanation?: string | null;
  selectedOption: string | null;
  onOptionSelect: (optionId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function QuestionArea({
  questionNumber,
  questionText,
  options,
  correctOption,
  explanation,
  selectedOption,
  onOptionSelect,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: QuestionAreaProps) {
  return (
    <main className="flex h-full flex-col p-8">
      <div className="text-muted-foreground mb-2 text-sm font-medium">
        Pregunta {questionNumber}
      </div>
      <h2 className="text-foreground mb-8 text-2xl leading-relaxed font-semibold text-balance">
        {questionText}
      </h2>

      <div className="flex-1 space-y-3">
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          return (
            <Card
              key={option.id}
              onClick={() => onOptionSelect(option.id)}
              className={cn('cursor-pointer p-4 transition-all hover:shadow-md', 'border-2', {
                'border-border bg-card hover:border-muted-foreground/30': !isSelected,
                'border-primary bg-primary/5 shadow-md': isSelected,
              })}
            >
              <div className="flex items-start gap-4">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    {
                      'bg-muted text-muted-foreground': !isSelected,
                      'bg-primary text-primary-foreground': isSelected,
                    }
                  )}
                >
                  {option.label}
                </span>
                <p className="text-foreground pt-1 text-base leading-relaxed">{option.text}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {correctOption && (
        <div className="border-primary/30 bg-primary/5 mt-6 rounded-md border p-4">
          <p className="text-foreground text-sm font-semibold">
            Respuesta correcta: {correctOption}
          </p>
          {explanation ? <p className="text-muted-foreground mt-1 text-sm">{explanation}</p> : null}
        </div>
      )}

      <div className="border-border mt-8 flex items-center justify-between border-t pt-6">
        <Button variant="outline" onClick={onPrevious} disabled={!hasPrevious} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button onClick={onNext} disabled={!hasNext} className="gap-2">
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </main>
  );
}
