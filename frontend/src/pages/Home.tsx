import { useState } from 'react';
import { useGarminSummary, useProfile, useCalculateMetrics } from '../hooks';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format } from 'date-fns';
import { Heart, Footprints, Moon, Flame, Wind, Activity } from 'lucide-react';
import type { UserProfile } from '../api';

const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const GOALS = ['weight_loss', 'maintenance', 'muscle_gain'];

function StatCard({ icon: Icon, label, value, unit, color = 'emerald' }: {
  icon: React.ElementType; label: string; value?: string | number | null; unit?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  };
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${colorMap[color]}`}>
      <Icon size={22} />
      <div>
        <p className="text-xs opacity-70">{label}</p>
        <p className="text-xl font-bold">{value ?? '—'} {unit && <span className="text-sm font-normal">{unit}</span>}</p>
      </div>
    </div>
  );
}

function ProfileModal({ onClose }: { onClose: () => void }) {
  const { mutate, isPending, data } = useCalculateMetrics();
  const [form, setForm] = useState<UserProfile>({
    weight_kg: 70, height_cm: 170, age: 30, gender: 'male',
    activity_level: 'moderate', goal: 'weight_loss',
  });

  const handle = (k: keyof UserProfile, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Setup Your Profile</h2>
        <div className="space-y-3">
          {(['weight_kg', 'height_cm', 'age'] as const).map((k) => (
            <div key={k}>
              <label className="text-xs text-gray-400 capitalize">{k.replace('_', ' ')}</label>
              <input
                type="number" value={form[k] as number}
                onChange={(e) => handle(k, parseFloat(e.target.value))}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-400">Gender</label>
            <select value={form.gender} onChange={(e) => handle('gender', e.target.value)}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400">Activity Level</label>
            <select value={form.activity_level} onChange={(e) => handle('activity_level', e.target.value)}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
              {ACTIVITY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400">Goal</label>
            <select value={form.goal} onChange={(e) => handle('goal', e.target.value)}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
              {GOALS.map((g) => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>

        {data && (
          <div className="mt-4 bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-3 text-sm grid grid-cols-2 gap-2">
            <div>BMI: <span className="font-bold">{data.bmi}</span> ({data.bmi_category})</div>
            <div>BMR: <span className="font-bold">{data.bmr}</span> kcal</div>
            <div>TDEE: <span className="font-bold">{data.tdee}</span> kcal</div>
            <div>Target: <span className="font-bold">{data.target_calories}</span> kcal</div>
            <div>Ideal weight: <span className="font-bold">{data.ideal_weight_kg}</span> kg</div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button onClick={() => mutate(form)} disabled={isPending}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
            {isPending ? 'Calculating…' : 'Calculate'}
          </button>
          <button onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-lg py-2 text-sm font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: garmin, isLoading, isError } = useGarminSummary(7);
  const { data: profile } = useProfile();
  const [showModal, setShowModal] = useState(false);

  const sleepChartData = (garmin?.sleep ?? []).map((s: { date: string; total_seconds: number; deep_seconds: number; rem_seconds: number }) => ({
    date: s.date,
    Total: +(s.total_seconds / 3600).toFixed(1),
    Deep: +(s.deep_seconds / 3600).toFixed(1),
    REM: +(s.rem_seconds / 3600).toFixed(1),
  }));

  const stepsData = (garmin?.steps ?? []).map((s: { date: string; steps: number; goal: number }) => ({
    date: format(new Date(s.date), 'MMM d'),
    Steps: s.steps,
    Goal: s.goal,
  }));

  const hrData = (() => {
    const raw: { timestamp: string; value: number }[] = garmin?.heart_rate ?? [];
    const sampled = raw.filter((_, i) => i % Math.max(1, Math.floor(raw.length / 60)) === 0);
    return sampled.map((p) => ({ time: p.timestamp, HR: p.value }));
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Overview</h1>
        <button onClick={() => setShowModal(true)}
          className="text-sm bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition-colors">
          {profile ? 'Update Profile' : 'Setup Profile'}
        </button>
      </div>

      {isError && (
        <div className="bg-amber-900/30 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-300">
          ⚠ Could not fetch Garmin data — make sure your credentials are set in <code>backend/.env</code> and the backend is running.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Heart} label="Resting HR" value={garmin?.resting_hr} unit="bpm" color="rose" />
        <StatCard icon={Footprints} label="Steps Today" value={garmin?.steps?.at(-1)?.steps?.toLocaleString()} color="emerald" />
        <StatCard icon={Moon} label="Sleep Last Night"
          value={garmin?.sleep?.at(-1) ? +((garmin.sleep.at(-1).total_seconds ?? 0) / 3600).toFixed(1) : null}
          unit="hrs" color="purple" />
        <StatCard icon={Wind} label="VO₂ Max" value={garmin?.vo2max} color="sky" />
        <StatCard icon={Flame} label="Active Cal" value={garmin?.calories_active} unit="kcal" color="amber" />
        <StatCard icon={Activity} label="Stress" value={garmin?.stress_level} color="blue" />
      </div>

      {/* Computed metrics (if profile exists) */}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'BMI', value: profile.bmi, extra: profile.bmi_category },
            { label: 'BMR', value: `${profile.bmr} kcal` },
            { label: 'TDEE', value: `${profile.tdee} kcal` },
            { label: 'Target Calories', value: `${profile.target_calories} kcal` },
          ].map(({ label, value, extra }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-xl font-bold mt-1">{value ?? '—'}</p>
              {extra && <p className="text-xs text-emerald-400 mt-0.5">{extra}</p>}
            </div>
          ))}
        </div>
      )}

      {isLoading && <p className="text-gray-500 text-sm">Loading Garmin data…</p>}

      {/* Steps Chart */}
      {stepsData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Daily Steps (7 days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stepsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="Steps" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Goal" fill="#374151" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Heart Rate Chart */}
      {hrData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Heart Rate (7 days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={hrData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" hide />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
              <Line type="monotone" dataKey="HR" stroke="#f43f5e" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sleep Chart */}
      {sleepChartData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Sleep Breakdown (7 days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sleepChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} unit="h" />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Deep" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="REM" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {showModal && <ProfileModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
