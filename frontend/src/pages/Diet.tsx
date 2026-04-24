import { useDietPlan } from '../hooks';
import { RefreshCw, Leaf } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MACRO_COLORS = ['#10b981', '#6366f1', '#f59e0b'];

export default function Diet() {
  const { data, isLoading, isError, refetch, isFetching } = useDietPlan();

  const macroData = data
    ? [
        { name: 'Protein', value: Math.round(data.protein_target_g) },
        { name: 'Carbs', value: Math.round(data.carbs_target_g) },
        { name: 'Fat', value: Math.round(data.fat_target_g) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Diet Recommendations</h1>
        <button onClick={() => refetch()} disabled={isFetching}
          className="flex items-center gap-1.5 text-sm bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Regenerate
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-16 text-gray-400">
          <Leaf size={32} className="mx-auto mb-3 animate-pulse text-emerald-400" />
          <p>Generating your personalised vegetarian meal plan…</p>
        </div>
      )}

      {isError && (
        <div className="bg-amber-900/30 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-300">
          ⚠ Could not load diet plan. Make sure you have set up your profile on the Home tab and the backend is running.
        </div>
      )}

      {data && !isLoading && (
        <>
          {/* Macro summary */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="font-semibold mb-1">Daily Targets</h2>
              <p className="text-3xl font-bold text-emerald-400 mb-3">{data.daily_calorie_target} <span className="text-base font-normal text-gray-400">kcal</span></p>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <p className="text-emerald-400 font-semibold">{Math.round(data.protein_target_g)}g</p>
                  <p className="text-gray-400 text-xs">Protein</p>
                </div>
                <div className="text-center">
                  <p className="text-indigo-400 font-semibold">{Math.round(data.carbs_target_g)}g</p>
                  <p className="text-gray-400 text-xs">Carbs</p>
                </div>
                <div className="text-center">
                  <p className="text-amber-400 font-semibold">{Math.round(data.fat_target_g)}g</p>
                  <p className="text-gray-400 text-xs">Fat</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="font-semibold mb-2">Macro Split</h2>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={macroData} cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                    dataKey="value" paddingAngle={3}>
                    {macroData.map((_, i) => <Cell key={i} fill={MACRO_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Meals */}
          <div className="space-y-4">
            {(data.meals ?? []).map((meal: {
              type: string; total_calories: number;
              items: { name: string; portion: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }[];
            }) => (
              <div key={meal.type} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base">{meal.type}</h3>
                  <span className="text-sm text-gray-400">{meal.total_calories} kcal</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-800">
                        <th className="text-left pb-2">Food</th>
                        <th className="text-left pb-2">Portion</th>
                        <th className="text-right pb-2">Kcal</th>
                        <th className="text-right pb-2">P</th>
                        <th className="text-right pb-2">C</th>
                        <th className="text-right pb-2">F</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meal.items.map((item) => (
                        <tr key={item.name} className="border-b border-gray-800/50 last:border-0">
                          <td className="py-1.5">{item.name}</td>
                          <td className="py-1.5 text-gray-400">{item.portion}</td>
                          <td className="py-1.5 text-right">{item.calories}</td>
                          <td className="py-1.5 text-right text-emerald-400">{item.protein_g}g</td>
                          <td className="py-1.5 text-right text-indigo-400">{item.carbs_g}g</td>
                          <td className="py-1.5 text-right text-amber-400">{item.fat_g}g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          {data.tips?.length > 0 && (
            <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-2xl p-5">
              <h3 className="font-semibold mb-3 text-emerald-400">Nutrition Tips</h3>
              <ul className="space-y-2">
                {data.tips.map((tip: string, i: number) => (
                  <li key={i} className="text-sm text-gray-300 flex gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
