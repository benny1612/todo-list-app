import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
});

// Interceptor — מזהה session פג (401) ומרענן את הדף
// כך המשתמש מועבר למסך login בצורה חלקה במקום שהאפליקציה תישבר
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // נקה localStorage ורענן — AuthContext יזהה שאין משתמש וייעבר ל-Login
      localStorage.removeItem('lastListId');
      // אם כבר בדף ה-login, אל תרענן שוב (למנוע לולאה)
      if (!window.location.pathname.includes('login')) {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;