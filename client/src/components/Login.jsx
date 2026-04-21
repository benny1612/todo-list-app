import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-sm w-full">
        <h1 className="text-4xl font-bold mb-2 text-blue-400">Co-Do</h1>
        <p className="text-slate-400 mb-8">רשימת משימות שיתופית בזמן אמת</p>
        
        <button 
          onClick={login}
          className="flex items-center justify-center gap-3 w-full bg-white text-slate-900 font-bold py-3 px-6 rounded-xl hover:bg-slate-200 transition-all active:scale-95"
        >
          <img src="https://www.google.com/favicon.ico" alt="google" className="w-5 h-5" />
          התחברות עם Google
        </button>
      </div>
    </div>
  );
};

export default Login;