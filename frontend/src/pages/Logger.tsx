import { useState } from 'react';
import { format } from 'date-fns';
import {
  useWorkoutLogs, useAddWorkoutLog, useDeleteWorkoutLog,
  useMealLogs, useAddMealLog, useDeleteMealLog, useDailySummary,
} from '../hooks';
import { Trash2, Plus, Dumbbell, Salad } from 'lucide-react';

type Tab = 'workout' | 'meal';

const today = format(new Date(), 'yyyy-MM-dd');

export default function Logger() {
  const [tab, setTab] = useState<Tab>('workout');
  const [date, setDate] = useState(today);

  // Workout
  const { data: workoutLogs = [] } = useWorkoutLogs(date);
  const addWorkout = useAddWorkoutLog();
  const deleteWorkout = useDeleteWorkoutLog();
  const [wForm, setWForm] = useState({ exercise_name: '', sets: '', reps: '', duration_minutes: '', notes: '' });

  // Meal
  const { data: mealLogs = [] } = useMealLogs(date);
  const addMeal = useAddMealLog();
  const deleteMeal = useDeleteMealLog();
  const [mForm, setMForm] = useState({
    meal_type: 'Breakfast', food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', notes: '',
  });

  const { data: summary } = useDailySummary(date);

  const submitWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wForm.exercise_name.trim()) return;
    addWorkout.mutate({
      date,
      exercise_name: wForm.exercise_name,
      sets: wForm.sets ? parseInt(wForm.sets) : null,
      reps: wForm.reps ? parseInt(wForm.reps) : null,
      duration_minutes: wForm.duration_minutes ? parseInt(wForm.duration_minutes) : null,
      notes: wForm.notes || null,
    });
    setWForm({ exercise_name: '', sets: '', reps: '', duration_minutes: '', notes: '' });
  };

  const submitMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mForm.food_name.trim()) return;
    addMeal.mutate({
      date,
      meal_type: mForm.meal_type,
      food_name: mForm.food_name,
      calories: mForm.calories ? parseFloat(mForm.calories) : null,
      protein_g: mForm.protein_g ? parseFloat(mForm.protein_g) : null,
      carbs_g: mForm.carbs_g ? parseFloat(mForm.carbs_g) : null,
      fat_g: mForm.fat_g ? parseFloat(mForm.fat_g) : null,
      notes: mForm.notes || null,
    });
    setMForm({ meal_type: 'Breakfast', food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', notes: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Daily Log</h1>
        <input
          type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
        />
      </div>

      {/* Day summary bar */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Workouts Done', value: `${summary.workouts_completed} / ${summary.total_workouts}` },
            { label: 'Calories Eaten', value: `${summary.nutrition.calories} kcal` },
            { label: 'Protein', value: `${summary.nutrition.protein_g}g` },
            { label: 'Carbs / Fat', value: `${summary.nutrition.carbs_g}g / ${summary.nutrition.fat_g}g` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-semibold mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-2">
        {(['workout', 'meal'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400 hover:text-gray-100'
            }`}>
            {t === 'workout' ? <Dumbbell size={14} /> : <Salad size={14} />}
            {t === 'workout' ? 'Workout' : 'Meals'}
          </button>
        ))}
      </div>

      {/* ── Workout Tab ─────────────────────────────────────────────────────── */}
      {tab === 'workout' && (
        <div className="space-y-4">
          <form onSubmit={submitWorkout} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold">Log Workout</h2>
            <input
              placeholder="Exercise name *" value={wForm.exercise_name}
              onChange={(e) => setWForm((f) => ({ ...f, exercise_name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              required
            />
            <div className="grid grid-cols-3 gap-2">
              {(['sets', 'reps', 'duration_minutes'] as const).map((k) => (
                <input key={k} type="number" placeholder={k.replace('_', ' ')} value={wForm[k]}
                  onChange={(e) => setWForm((f) => ({ ...f, [k]: e.target.value }))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
              ))}
            </div>
            <input
              placeholder="Notes (optional)" value={wForm.notes}
              onChange={(e) => setWForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <button type="submit" disabled={addWorkout.isPending}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              <Plus size={14} /> Add
            </button>
          </form>

          <div className="space-y-2">
            {workoutLogs.length === 0 && <p className="text-gray-500 text-sm">No workouts logged for this day.</p>}
            {workoutLogs.map((log: { id: number; exercise_name: string; sets?: number; reps?: number; duration_minutes?: number; notes?: string }) => (
              <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{log.exercise_name}</p>
                  <p className="text-xs text-gray-400">
                    {[log.sets && `${log.sets} sets`, log.reps && `${log.reps} reps`, log.duration_minutes && `${log.duration_minutes} min`].filter(Boolean).join(' · ')}
                    {log.notes && ` — ${log.notes}`}
                  </p>
                </div>
                <button onClick={() => deleteWorkout.mutate(log.id)} className="text-gray-600 hover:text-rose-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Meal Tab ─────────────────────────────────────────────────────────── */}
      {tab === 'meal' && (
        <div className="space-y-4">
          <form onSubmit={submitMeal} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold">Log Meal</h2>
            <div className="grid grid-cols-2 gap-2">
              <select value={mForm.meal_type} onChange={(e) => setMForm((f) => ({ ...f, meal_type: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((m) => <option key={m}>{m}</option>)}
              </select>
              <input placeholder="Food name *" value={mForm.food_name}
                onChange={(e) => setMForm((f) => ({ ...f, food_name: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" required
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['calories', 'protein_g', 'carbs_g', 'fat_g'] as const).map((k) => (
                <input key={k} type="number" step="0.1" placeholder={k.replace('_g', '').replace('_', ' ')}
                  value={mForm[k]}
                  onChange={(e) => setMForm((f) => ({ ...f, [k]: e.target.value }))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
              ))}
            </div>
            <input placeholder="Notes (optional)" value={mForm.notes}
              onChange={(e) => setMForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <button type="submit" disabled={addMeal.isPending}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              <Plus size={14} /> Add
            </button>
          </form>

          <div className="space-y-2">
            {mealLogs.length === 0 && <p className="text-gray-500 text-sm">No meals logged for this day.</p>}
            {mealLogs.map((log: { id: number; meal_type: string; food_name: string; calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number; notes?: string }) => (
              <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{log.food_name} <span className="text-xs text-gray-400">({log.meal_type})</span></p>
                  <p className="text-xs text-gray-400">
                    {[log.calories && `${log.calories} kcal`, log.protein_g && `P ${log.protein_g}g`, log.carbs_g && `C ${log.carbs_g}g`, log.fat_g && `F ${log.fat_g}g`].filter(Boolean).join(' · ')}
                    {log.notes && ` — ${log.notes}`}
                  </p>
                </div>
                <button onClick={() => deleteMeal.mutate(log.id)} className="text-gray-600 hover:text-rose-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
