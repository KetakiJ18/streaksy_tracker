import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle2, Circle, TrendingUp, Flame, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Habit {
  id: number;
  name: string;
  description: string;
  frequency: string;
  color: string;
  completed: boolean;
  currentStreak: number;
  longestStreak: number;
  consistencyScore: number;
}

const Dashboard = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [motivationalQuote, setMotivationalQuote] = useState('');

  useEffect(() => {
    fetchTodayHabits();
    fetchMotivationalQuote();
  }, []);

  const fetchTodayHabits = async () => {
    try {
      const response = await api.get('/tracks/today');
      setHabits(response.data.habits);
    } catch (error) {
      toast.error('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const fetchMotivationalQuote = () => {
    const quotes = [
      'Small steps lead to big changes! 💪',
      'Consistency beats perfection every time! ✨',
      'You are stronger than your excuses! 🚀',
      'Progress, not perfection! 🌟',
      'Every day is a fresh start! 🌈',
    ];
    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  const toggleHabit = async (habitId: number, completed: boolean) => {
    try {
      if (completed) {
        await api.post(`/tracks/${habitId}/incomplete`);
      } else {
        await api.post(`/tracks/${habitId}/complete`);
      }
      fetchTodayHabits();
      toast.success(completed ? 'Habit marked as incomplete' : 'Habit completed! 🎉');
    } catch (error) {
      toast.error('Failed to update habit');
    }
  };

  const totalHabits = habits.length;
  const completedHabits = habits.filter((h) => h.completed).length;
  const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
  const totalStreaks = habits.reduce((sum, h) => sum + h.currentStreak, 0);
  const avgConsistency = habits.length > 0
    ? habits.reduce((sum, h) => sum + h.consistencyScore, 0) / habits.length
    : 0;

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Progress</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {completedHabits}/{totalHabits}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Streaks</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalStreaks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Consistency</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {avgConsistency.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Quote / AI Hint */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-6 text-white">
        <p className="text-lg font-medium">{motivationalQuote}</p>
        <Link
          to="/insights"
          className="mt-2 text-sm underline hover:no-underline"
        >
          Get personalized insights →
        </Link>
      </div>

      {/* Today's Habits */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Today's Habits</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {habits.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">No habits for today</p>
              <Link
                to="/habits"
                className="mt-2 inline-block text-primary-600 dark:text-primary-400 hover:underline"
              >
                Create your first habit →
              </Link>
            </div>
          ) : (
            habits.map((habit) => (
              <div
                key={habit.id}
                className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center flex-1">
                  <button
                    onClick={() => toggleHabit(habit.id, habit.completed)}
                    className="mr-4 focus:outline-none"
                  >
                    {habit.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{habit.name}</h3>
                    {habit.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{habit.description}</p>
                    )}
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      <span className="flex items-center text-gray-600 dark:text-gray-400">
                        <Flame className="h-4 w-4 mr-1 text-orange-500" />
                        {habit.currentStreak} day streak
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {habit.consistencyScore.toFixed(0)}% consistent
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className="w-3 h-3 rounded-full ml-4"
                  style={{ backgroundColor: habit.color }}
                ></div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

