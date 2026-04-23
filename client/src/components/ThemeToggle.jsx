import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'מצב בהיר' : 'מצב כהה'}
      className={`
        relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0
        ${isDark
          ? 'bg-slate-700 focus:ring-offset-slate-800'
          : 'bg-amber-100 focus:ring-offset-white border border-amber-200'
        }
      `}
    >
      {/* Track pill */}
      <span
        className={`
          absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-md
          ${isDark
            ? 'translate-x-7 bg-blue-500'
            : 'translate-x-0 bg-amber-400'
          }
        `}
      >
        {isDark
          ? <Moon size={13} className="text-white" />
          : <Sun size={13} className="text-white" />
        }
      </span>
    </button>
  );
};

export default ThemeToggle;
