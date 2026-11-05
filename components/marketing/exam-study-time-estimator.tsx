'use client';

import { useState } from 'react';

const FIRST_PASS_MINUTES = 35;
const REVIEW_MINUTES = 15;
const MIXED_PRACTICE_MINUTES = 90;
const ERROR_REVIEW_MINUTES = 60;

function formatMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function boundedInteger(raw: string, minimum: number, maximum: number) {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, Math.round(parsed))) : minimum;
}

/**
 * Transparent planning worksheet, NOT a prediction of grades or a validated
 * minimum number of hours for a given syllabus.
 */
export function ExamStudyTimeEstimator() {
  const [topics, setTopics] = useState(6);
  const [days, setDays] = useState(7);
  const [minutesPerDay, setMinutesPerDay] = useState(75);

  const topicMinutes = topics * (FIRST_PASS_MINUTES + REVIEW_MINUTES);
  const practiceMinutes = MIXED_PRACTICE_MINUTES + ERROR_REVIEW_MINUTES;
  const estimatedMinutes = topicMinutes + practiceMinutes;
  const availableMinutes = days * minutesPerDay;
  const difference = availableMinutes - estimatedMinutes;
  const hasBuffer = difference >= 0;

  const fields = [
    {
      id: 'exam-time-topics',
      label: 'Topics in your exam',
      value: topics,
      min: 1,
      max: 40,
      onChange: setTopics,
      help: 'Count syllabus topics, not PDF pages',
    },
    {
      id: 'exam-time-days',
      label: 'Days remaining',
      value: days,
      min: 1,
      max: 60,
      onChange: setDays,
      help: 'Include only days you can actually study',
    },
    {
      id: 'exam-time-daily',
      label: 'Study minutes per day',
      value: minutesPerDay,
      min: 15,
      max: 240,
      onChange: setMinutesPerDay,
      help: 'Choose a sustainable amount of time',
    },
  ] as const;

  return (
    <section aria-labelledby="exam-time-estimator-heading" className="mt-10 rounded-2xl border border-[#E7EBF4] bg-white p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Free study-time worksheet</p>
      <h2 id="exam-time-estimator-heading" className="mt-2 text-2xl font-bold tracking-tight text-[#0F1B3D]">
        Estimate your study hours
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Change the inputs to see whether an illustrative workload fits your calendar. The assumptions below are adjustable
        planning examples, not proven hour requirements.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {fields.map((field) => (
          <div key={field.id}>
            <label htmlFor={field.id} className="block text-sm font-semibold text-[#0F1B3D]">{field.label}</label>
            <input
              id={field.id}
              type="number"
              inputMode="numeric"
              min={field.min}
              max={field.max}
              step={1}
              value={field.value}
              onChange={(event) => field.onChange(boundedInteger(event.target.value, field.min, field.max))}
              className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base font-semibold text-[#0F1B3D] outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-200"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">{field.help}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2" aria-live="polite">
        <div className="rounded-xl bg-[#EEF2FF] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#42506A]">Illustrative workload</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#0F1B3D]">{formatMinutes(estimatedMinutes)}</p>
          <p className="mt-1 text-xs text-[#42506A]">Topics, practice test and mistake review</p>
        </div>
        <div className="rounded-xl border border-[#E7EBF4] bg-[#F5F7FB] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#42506A]">Your available time</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#0F1B3D]">{formatMinutes(availableMinutes)}</p>
          <p className="mt-1 text-xs text-[#42506A]">{days} days × {minutesPerDay} minutes</p>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold leading-7 text-[#0F1B3D]" aria-live="polite">
        {hasBuffer
          ? `This illustrative schedule has ${formatMinutes(difference)} of room for harder topics or delays.`
          : `This illustrative schedule is short by ${formatMinutes(Math.abs(difference))}. Prioritize the syllabus or revise the plan; do not sacrifice sleep to force the numbers.`}
      </p>
      <details className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-600">
        <summary className="cursor-pointer font-semibold text-blue-700">Show the calculation</summary>
        <p className="mt-3 leading-7">
          {topics} topics × (35 minutes for first practice + 15 minutes for a later review) = {formatMinutes(topicMinutes)}.
          Add 90 minutes of mixed exam questions and 60 minutes of mistake review = {formatMinutes(practiceMinutes)}.
          Total: {formatMinutes(estimatedMinutes)}. Adjust for difficulty, prior knowledge and the real assessment format.
        </p>
      </details>
    </section>
  );
}
