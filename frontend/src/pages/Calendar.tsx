import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';

interface HeatmapDay {
  date: string;
  habits: Array<{
    habitId: number;
    habitName: string;
    completed: boolean;
    color: string;
  }>;
  totalCompleted: number;
  totalHabits: number;
}

const Calendar = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), 365), 'yyyy-MM-dd');
      const response = await api.get(`/tracks/calendar?startDate=${startDate}&endDate=${endDate}`);
      setHeatmapData(response.data.heatmap);
    } catch (error) {
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const getIntensity = (day: HeatmapDay) => {
    if (day.totalHabits === 0) return 0;
    const ratio = day.totalCompleted / day.totalHabits;
    if (ratio === 0) return 0;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  };

  const getColorClass = (intensity: number) => {
    const colors = [
      'bg-gray-100 dark:bg-gray-800',
      'bg-green-200 dark:bg-green-900',
      'bg-green-400 dark:bg-green-700',
      'bg-green-600 dark:bg-green-600',
      'bg-green-800 dark:bg-green-500',
    ];
    return colors[intensity];
  };

  // Generate last 365 days
  const days = eachDayOfInterval({
    start: subDays(new Date(), 364),
    end: new Date(),
  }).reverse();

  const selectedDayData = selectedDate
    ? heatmapData.find((d) => isSameDay(new Date(d.date), new Date(selectedDate)))
    : null;

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar View</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track your habit completion over time
        </p>
      </div>

      {/* Heatmap */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Activity Heatmap</h2>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Less</span>
            <div className="flex space-x-1">
              {[0, 1, 2, 3, 4].map((intensity) => (
                <div
                  key={intensity}
                  className={`w-3 h-3 rounded ${getColorClass(intensity)}`}
                />
              ))}
            </div>
            <span className="text-gray-600 dark:text-gray-400">More</span>
          </div>
        </div>

        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(53, minmax(0, 1fr))', display: 'grid' }}>
          {days.map((day, index) => {
            const dayData = heatmapData.find((d) => isSameDay(new Date(d.date), day));
            const intensity = dayData ? getIntensity(dayData) : 0;
            const isSelected = selectedDate && isSameDay(day, new Date(selectedDate));

            return (
              <div
                key={index}
                onClick={() => setSelectedDate(format(day, 'yyyy-MM-dd'))}
                className={`w-3 h-3 rounded cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all ${
                  isSelected ? 'ring-2 ring-primary-600' : ''
                } ${getColorClass(intensity)}`}
                title={format(day, 'MMM d, yyyy')}
              />
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && selectedDayData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
          </h3>
          <div className="space-y-2">
            {selectedDayData.habits.map((habit) => (
              <div
                key={habit.habitId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: habit.color }}
                  ></div>
                  <span className="text-gray-900 dark:text-white">{habit.habitName}</span>
                </div>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    habit.completed
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {habit.completed ? 'Completed' : 'Not completed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDate && !selectedDayData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-400">
            No activity recorded for {format(new Date(selectedDate), 'MMMM d, yyyy')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Calendar;

