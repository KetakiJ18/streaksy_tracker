import Anthropic from '@anthropic-ai/sdk';
import { AIAdapter, HabitHistory, UserContext, AIInsight, PatternAnalysis } from './adapter';

export class ClaudeAdapter implements AIAdapter {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
    });
  }

  async generateInsight(
    habitHistory: HabitHistory,
    userContext: UserContext
  ): Promise<AIInsight> {
    const prompt = this.buildInsightPrompt(habitHistory, userContext);

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0]?.type === 'text' 
        ? response.content[0].text 
        : '';
      
      return this.parseInsightResponse(content, habitHistory);
    } catch (error) {
      console.error('Claude API error:', error);
      return this.getDefaultInsight(habitHistory);
    }
  }

  async analyzePatterns(habitHistories: HabitHistory[]): Promise<PatternAnalysis> {
    const prompt = this.buildPatternAnalysisPrompt(habitHistories);

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0]?.type === 'text'
        ? response.content[0].text
        : '';
      
      return this.parsePatternResponse(content);
    } catch (error) {
      console.error('Claude API error:', error);
      return { patterns: [], suggestions: [] };
    }
  }

  private buildInsightPrompt(habitHistory: HabitHistory, userContext: UserContext): string {
    const completionRate = habitHistory.logs.filter(l => l.completed).length / habitHistory.logs.length;
    const recentLogs = habitHistory.logs.slice(0, 14);

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
    // Similar parsing logic
    return {
      type: 'suggestion',
      title: 'Habit Insight',
      content: content.substring(0, 500),
      confidenceScore: 0.6,
    };
  }

  private parsePatternResponse(content: string): PatternAnalysis {
    return { patterns: [], suggestions: [] };
  }

  private getDefaultInsight(habitHistory: HabitHistory): AIInsight {
    return {
      type: 'suggestion',
      title: 'Habit Insight',
      content: 'Keep tracking your habits for personalized insights!',
      confidenceScore: 0.5,
    };
  }
}

