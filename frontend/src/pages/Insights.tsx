import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Lightbulb, TrendingUp, Target, AlertCircle } from 'lucide-react';

interface Insight {
  id: number;
  insight_type: string;
  title: string;
  content: string;
  confidence_score: number;
  habit_name?: string;
  created_at: string;
}

interface Pattern {
  type: string;
  description: string;
  confidence: number;
}

const Insights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [habits, setHabits] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    fetchRecentInsights();
    fetchPatterns();
    fetchHabits();
  }, []);

  const fetchRecentInsights = async () => {
    try {
      const response = await api.get('/insights/recent');
      setInsights(response.data.insights);
    } catch (error) {
      toast.error('Failed to load insights');
    }
  };

  const fetchPatterns = async () => {
    try {
      const response = await api.get('/insights/patterns');
      setPatterns(response.data.patterns || []);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      toast.error('Failed to load patterns');
    } finally {
      setLoading(false);
    }
  };

  const fetchHabits = async () => {
    try {
      const response = await api.get('/habits');
      setHabits(response.data.habits);
    } catch (error) {
      // Ignore error
    }
  };

  const generateInsight = async () => {
    if (!selectedHabitId) {
      toast.error('Please select a habit');
      return;
    }

    try {
      const response = await api.get(`/insights/habit/${selectedHabitId}`);
      toast.success('New insight generated!');
      fetchRecentInsights();
    } catch (error) {
      toast.error('Failed to generate insight');
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'suggestion':
        return <Target className="h-5 w-5" />;
      case 'pattern':
        return <TrendingUp className="h-5 w-5" />;
      case 'prediction':
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'suggestion':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pattern':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'prediction':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Insights</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Get personalized suggestions and behavior analysis
        </p>
      </div>

      {/* Generate Insight */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Generate New Insight
        </h2>
        <div className="flex space-x-3">
          <select
            value={selectedHabitId || ''}
            onChange={(e) => setSelectedHabitId(Number(e.target.value) || null)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500"
          >
            <option value="">Select a habit...</option>
            {habits.map((habit) => (
              <option key={habit.id} value={habit.id}>
                {habit.name}
              </option>
            ))}
          </select>
          <button
            onClick={generateInsight}
            disabled={!selectedHabitId}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate
          </button>
        </div>
      </div>

      {/* Patterns */}
      {patterns.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Detected Patterns
          </h2>
          <div className="space-y-3">
            {patterns.map((pattern, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{pattern.type}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {(pattern.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{pattern.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Personalized Suggestions
          </h2>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <Lightbulb className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Insights
        </h2>
        {insights.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No insights yet. Generate one above to get started!
          </p>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={getInsightColor(insight.insight_type) + ' p-2 rounded'}>
                      {getInsightIcon(insight.insight_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {insight.title}
                      </h3>
                      {insight.habit_name && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {insight.habit_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(insight.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mt-2">{insight.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;

