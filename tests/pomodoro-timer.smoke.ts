import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  INITIAL_POMODORO,
  POMODORO_DURATION_SECONDS,
  beginPomodoro,
  pausePomodoro,
  remainingPomodoroSeconds,
  isPomodoroComplete,
  finishedPomodoro,
  restorePomodoro,
  formatPomodoroTime,
} from '../lib/pomodoro-timer.ts';

const now = 1_800_000_000_000;
assert.equal(POMODORO_DURATION_SECONDS, 1500);
assert.equal(formatPomodoroTime(1500), '25:00');
assert.equal(formatPomodoroTime(65), '01:05');
assert.equal(formatPomodoroTime(0), '00:00');

const started = beginPomodoro(INITIAL_POMODORO, now);
assert.equal(started.phase, 'running');
assert.equal(started.endsAt, now + 25 * 60 * 1000);
assert.equal(remainingPomodoroSeconds(started, now + 10_000), 1490);
assert.equal(remainingPomodoroSeconds(started, now + 90_000), 1410);

const paused = pausePomodoro(started, now + 90_000);
assert.equal(paused.phase, 'paused');
assert.equal(paused.remainingSeconds, 1410);
assert.equal(paused.endsAt, null);
assert.equal(remainingPomodoroSeconds(paused, now + 90_000 + 3600_000), 1410);

const resumed = beginPomodoro(paused, now + 90_000 + 3600_000);
assert.equal(remainingPomodoroSeconds(resumed, now + 90_000 + 3600_000), 1410);
assert.equal(isPomodoroComplete(resumed, resumed.endsAt! - 1), false);
assert.equal(isPomodoroComplete(resumed, resumed.endsAt!), true);
assert.deepEqual(finishedPomodoro(), { phase: 'finished', remainingSeconds: 0, endsAt: null });

assert.equal(restorePomodoro(JSON.stringify(started), now + 91_000).phase, 'running');
assert.equal(remainingPomodoroSeconds(restorePomodoro(JSON.stringify(started), now + 91_000), now + 91_000), 1409);
assert.deepEqual(restorePomodoro(JSON.stringify(started), now + 1500_000), finishedPomodoro());
assert.deepEqual(restorePomodoro(JSON.stringify(paused), now + 3600_000), paused);
assert.deepEqual(restorePomodoro('not valid json', now), INITIAL_POMODORO);
assert.deepEqual(restorePomodoro('{}', now), INITIAL_POMODORO);
assert.deepEqual(restorePomodoro('{"phase":"running","endsAt":1e999}', now), INITIAL_POMODORO);

const ui = readFileSync('components/dashboard/pomodoro-header.tsx', 'utf8');
const shell = readFileSync('components/ClientLayoutClient.tsx', 'utf8');

assert.match(shell, /<PomodoroHeader key=\{user\.id\} userId=\{user\.id\} \/>/);
assert.match(ui, /evaluo_pomodoro_25_\$\{userId\}/, 'Persist timer per user');
assert.match(ui, /window\.localStorage\.setItem/);
assert.match(ui, /window\.localStorage\.getItem/);
assert.match(ui, /Date\.now\(\)/, 'Use a real clock so background tabs do not cause timer drift');
assert.match(ui, /role="dialog"/, 'Accessible, compact clock popup');
assert.match(ui, /aria-expanded=\{open\}/);
assert.match(ui, /Pausar/);
assert.match(ui, /Reanudar/);
assert.match(ui, /Reiniciar/);
assert.match(ui, /¡Completaste tus 25 minutos!/);
assert.doesNotMatch(ui, /45 min|60 min|tiempo de descanso|descanso automático/i);
console.log('Pomodoro 25-minute timer checks passed.');
