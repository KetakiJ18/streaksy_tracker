import { OpenAIAdapter } from './openai';
import { ClaudeAdapter } from './claude';

export interface AIAdapter {
  generateInsight(
    habitHistory: HabitHistory,
    userContext: UserContext
  ): Promise<AIInsight>;
  analyzePatterns(
    habitHistory: HabitHistory[]
  ): Promise<PatternAnalysis>;
}

export interface HabitHistory {
  habitId: number;
  habitName: string;
  frequency: string;
  logs: {
    date: string;
    completed: boolean;
  }[];
  currentStreak: number;
  longestStreak: number;
  consistencyScore: number;
}

export interface UserContext {
  userId: number;
  totalHabits: number;
  averageConsistency: number;
}

export interface AIInsight {
  type: 'pattern' | 'suggestion' | 'prediction' | 'explanation';
  title: string;
  content: string;
  confidenceScore: number;
  metadata?: Record<string, any>;
}

export interface PatternAnalysis {
  patterns: {
    type: string;
    description: string;
    confidence: number;
  }[];
  suggestions: string[];
}

// Factory function to get the appropriate AI adapter
export const getAIAdapter = (): AIAdapter => {
  const provider = process.env.AI_PROVIDER || 'openai';

  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIAdapter();
    case 'claude':
      return new ClaudeAdapter();
    default:
      return new OpenAIAdapter();
  }
};

