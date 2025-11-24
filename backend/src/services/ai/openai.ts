import OpenAI from 'openai';
import { AIAdapter, HabitHistory, UserContext, AIInsight, PatternAnalysis } from './adapter';

export class OpenAIAdapter implements AIAdapter {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateInsight(
    habitHistory: HabitHistory,
    userContext: UserContext
  ): Promise<AIInsight> {
    const prompt = this.buildInsightPrompt(habitHistory, userContext);

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert habit coach and behavioral psychologist. Analyze habit tracking data and provide actionable, personalized insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseInsightResponse(content, habitHistory);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getDefaultInsight(habitHistory);
    }
  }

  async analyzePatterns(habitHistories: HabitHistory[]): Promise<PatternAnalysis> {
    const prompt = this.buildPatternAnalysisPrompt(habitHistories);

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing behavioral patterns. Identify patterns, trends, and provide actionable suggestions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parsePatternResponse(content);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return { patterns: [], suggestions: [] };
    }
  }

  private buildInsightPrompt(habitHistory: HabitHistory, userContext: UserContext): string {
    const completionRate = habitHistory.logs.filter(l => l.completed).length / habitHistory.logs.length;
    const recentLogs = habitHistory.logs.slice(0, 14); // Last 14 days

    return `Analyze this habit tracking data and provide a personalized insight:

Habit: ${habitHistory.habitName}
Frequency: ${habitHistory.frequency}
Current Streak: ${habitHistory.currentStreak} days
Longest Streak: ${habitHistory.longestStreak} days
Consistency Score: ${habitHistory.consistencyScore}%
Completion Rate: ${(completionRate * 100).toFixed(1)}%

Recent Activity (last 14 days):
${recentLogs.map(log => `${log.date}: ${log.completed ? '✓' : '✗'}`).join('\n')}

User Context:
- Total Habits: ${userContext.totalHabits}
- Average Consistency: ${userContext.averageConsistency.toFixed(1)}%

Provide ONE of the following:
1. A pattern explanation (why streaks are breaking)
2. A personalized suggestion (how to improve)
3. A prediction (success probability)
4. An explanation (what's working/not working)

Format your response as JSON:
{
  "type": "suggestion|pattern|prediction|explanation",
  "title": "Short title",
  "content": "Detailed explanation (2-3 sentences)",
  "confidenceScore": 0.0-1.0
}`;
  }

  private buildPatternAnalysisPrompt(habitHistories: HabitHistory[]): string {
    return `Analyze these multiple habits and identify patterns:

${habitHistories.map(h => `
Habit: ${h.habitName}
Frequency: ${h.frequency}
Streak: ${h.currentStreak}/${h.longestStreak}
Consistency: ${h.consistencyScore}%
`).join('\n')}

Identify:
1. Common patterns (e.g., "habits done in morning have higher success")
2. Actionable suggestions (e.g., "pair exercise with morning coffee")

Format as JSON:
{
  "patterns": [
    {"type": "pattern name", "description": "...", "confidence": 0.0-1.0}
  ],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;
  }

  private parseInsightResponse(content: string, habitHistory: HabitHistory): AIInsight {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          type: parsed.type || 'suggestion',
          title: parsed.title || 'Habit Insight',
          content: parsed.content || content,
          confidenceScore: parsed.confidenceScore || 0.7,
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }

    return {
      type: 'suggestion',
      title: 'Habit Insight',
      content: content.substring(0, 500),
      confidenceScore: 0.6,
    };
  }

  private parsePatternResponse(content: string): PatternAnalysis {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse pattern response:', error);
    }

    return { patterns: [], suggestions: [] };
  }

  private getDefaultInsight(habitHistory: HabitHistory): AIInsight {
    if (habitHistory.currentStreak === 0) {
      return {
        type: 'suggestion',
        title: 'Get Back on Track',
        content: `Your ${habitHistory.habitName} habit needs attention. Try starting with smaller, more achievable goals to rebuild momentum.`,
        confidenceScore: 0.5,
      };
    }

    return {
      type: 'encouragement',
      title: 'Keep Going!',
      content: `Great job maintaining your ${habitHistory.currentStreak}-day streak! Consistency is key to building lasting habits.`,
      confidenceScore: 0.5,
    };
  }
}

