import { useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import { LogIn } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();

  return (
    <ThemeProvider>
      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center bg-slate-50 dark:bg-slate-900 transition-colors">
        {/* Theme toggle top-right */}
        <div className="absolute top-4 left-4">
          <ThemeToggle />
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full">
          {/* Logo */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <LogIn size={28} className="text-white" />
          </div>

          <h1 className="text-4xl font-black mb-1 text-blue-500">Co-Do</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">רשימת משימות שיתופית בזמן אמת</p>

          <button
            onClick={login}
            className="flex items-center justify-center gap-3 w-full bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold py-3 px-6 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 transition-all active:scale-95 shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="google" className="w-5 h-5" />
            התחברות עם Google
          </button>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Login;