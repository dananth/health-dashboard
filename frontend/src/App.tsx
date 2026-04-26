import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Activity, Dumbbell, Salad, ClipboardList, LogOut, Loader2 } from 'lucide-react';
import Home from './pages/Home';
import Exercise from './pages/Exercise';
import Diet from './pages/Diet';
import Logger from './pages/Logger';
import Login from './pages/Login';
import { fetchAuthStatus, logout } from './api';

const queryClient = new QueryClient();

const navItems = [
  { to: '/', label: 'Home', icon: Activity },
  { to: '/exercise', label: 'Exercise', icon: Dumbbell },
  { to: '/diet', label: 'Diet', icon: Salad },
  { to: '/log', label: 'Log', icon: ClipboardList },
];

function Dashboard() {
  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <span className="text-emerald-400 font-bold text-lg tracking-wide">⚡ Health Dashboard</span>
        <nav className="ml-auto flex gap-1 items-center">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-rose-400 hover:bg-gray-800 transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </nav>
      </header>
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exercise" element={<Exercise />} />
          <Route path="/diet" element={<Diet />} />
          <Route path="/log" element={<Logger />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    fetchAuthStatus()
      .then((data) => setLoggedIn(data.logged_in))
      .catch(() => setLoggedIn(false));
  }, []);

  if (loggedIn === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={28} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {loggedIn ? (
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      ) : (
        <Login onLogin={() => setLoggedIn(true)} />
      )}
    </QueryClientProvider>
  );
}

