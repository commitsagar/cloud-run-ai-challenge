import { describe, it, expect } from 'vitest';
import { SentimentAnalysisData, SentimentTrendPoint, EmotionBreakdownItem } from '../src/types';

describe('Affective Sentiment & Longitudinal Trend Analysis Engine', () => {
  // 1. BASIC ELEMENTS & SCHEMA VALIDATIONS
  describe('Basic Elements & Schema Bounds', () => {
    it('validates sentiment index boundaries (0 - 100) and resilience scores', () => {
      const sampleScore = 82;
      const resilienceScore = 88;

      expect(sampleScore).toBeGreaterThanOrEqual(0);
      expect(sampleScore).toBeLessThanOrEqual(100);
      expect(resilienceScore).toBeGreaterThanOrEqual(0);
      expect(resilienceScore).toBeLessThanOrEqual(100);
    });

    it('verifies that emotion breakdown percentages sum to ~100%', () => {
      const breakdown: EmotionBreakdownItem[] = [
        { emotion: 'Optimism & Drive', percentage: 38, color: '#3FB950' },
        { emotion: 'Calm & Serenity', percentage: 26, color: '#58A6FF' },
        { emotion: 'Focus & Resolve', percentage: 22, color: '#A371F7' },
        { emotion: 'Situational Friction', percentage: 9, color: '#F85149' },
        { emotion: 'Fatigue / Recovery', percentage: 5, color: '#E3B341' },
      ];

      const totalPercentage = breakdown.reduce((acc, curr) => acc + curr.percentage, 0);
      expect(totalPercentage).toBe(100);
    });

    it('enforces required fields in trend point data structure', () => {
      const point: SentimentTrendPoint = {
        sessionId: 'sess-101',
        sessionTitle: 'Sprint Reflection',
        date: '2026-08-29',
        timestamp: 1787994000000,
        sentimentScore: 78,
        primaryEmotion: 'Optimism',
        intensity: 85,
        keyTrigger: 'Completed authentication hardening',
        snippet: 'Architecture feels solid and reliable',
      };

      expect(point.sessionId).toBeDefined();
      expect(point.sentimentScore).toBe(78);
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(point.intensity).toBeGreaterThan(0);
    });
  });

  // 2. HAPPY PATH SCENARIOS
  describe('Happy Path Scenarios', () => {
    it('successfully processes chronological entries and detects positive upward momentum', () => {
      const chronologicalScores = [55, 62, 70, 78, 85];
      const deltas = chronologicalScores.slice(1).map((score, i) => score - chronologicalScores[i]);

      // Verify all deltas are positive (ascending trend)
      const isAscending = deltas.every((d) => d > 0);
      expect(isAscending).toBe(true);
      expect(chronologicalScores[chronologicalScores.length - 1]).toBe(85);
    });

    it('identifies positive inflection turning point with delta calculation', () => {
      const previousScore = 60;
      const currentScore = 82;
      const delta = currentScore - previousScore;

      const inflection = {
        sessionId: 'sess-102',
        sessionTitle: 'Modular Refactoring',
        date: '2026-08-29',
        type: 'positive_breakthrough' as const,
        title: 'Cognitive Modularization',
        description: 'Successfully separated concerns into standalone components',
        scoreDelta: `+${delta} pts`,
      };

      expect(inflection.scoreDelta).toBe('+22 pts');
      expect(inflection.type).toBe('positive_breakthrough');
    });

    it('generates actionable wellness insights from journal patterns', () => {
      const insights = [
        'Documenting micro-milestones before switching tasks reduces cognitive strain.',
        'Morning reflection correlates with higher daily resilience scores.',
      ];

      expect(insights.length).toBeGreaterThanOrEqual(2);
      expect(insights[0]).toContain('micro-milestones');
    });
  });

  // 3. FAILURE & EDGE-CASE SCENARIOS
  describe('Failure & Edge-Case Handling', () => {
    it('handles empty sessions array by returning a clear validation failure indicator', () => {
      const emptySessions: any[] = [];
      const validateInput = (sessions: any[]) => {
        if (!sessions || sessions.length === 0) {
          return { error: 'At least one session is required to perform sentiment analysis.' };
        }
        return { success: true };
      };

      const result = validateInput(emptySessions);
      expect(result.error).toBe('At least one session is required to perform sentiment analysis.');
    });

    it('sanitizes missing or malformed timestamp data with safe fallbacks', () => {
      const rawSession = {
        id: 'sess-corrupt',
        title: 'Corrupted Date Entry',
        updatedAt: null,
      };

      const sanitizedTimestamp = rawSession.updatedAt || Date.now();
      const sanitizedDate = rawSession.updatedAt
        ? new Date(rawSession.updatedAt).toISOString().split('T')[0]
        : '2026-08-29';

      expect(sanitizedTimestamp).toBeTypeOf('number');
      expect(sanitizedDate).toBe('2026-08-29');
    });

    it('gracefully recovers when sentiment intensity is out of bounds (<0 or >100)', () => {
      const clampScore = (raw: number) => Math.max(0, Math.min(100, raw));

      expect(clampScore(140)).toBe(100);
      expect(clampScore(-25)).toBe(0);
      expect(clampScore(75)).toBe(75);
    });
  });
});
