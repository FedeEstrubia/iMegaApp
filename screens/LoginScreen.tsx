
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { supabase } from '../services/supabase';

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');


  useEffect(() => {
    if (session) {
      navigate('/profile');
    }
  }, [session, navigate]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: `${username}@imega.local`,
        password: password,
      });

      if (error) throw error;

      setMessage({
        text: 'Sesión iniciada correctamente.',
        type: 'success'
      });

    } catch (error: any) {
      setMessage({
        text: error.message || 'Credenciales incorrectas.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="relative flex h-full min-h-screen w-full max-w-[430px] flex-col bg-background-light dark:bg-background-dark overflow-hidden shadow-2xl mx-auto">
      {/* Header / Nav */}
      <div className="flex items-center justify-between p-4 pt-12">
        <button
          onClick={handleBack}
          className="flex size-10 items-center justify-center rounded-full bg-transparent hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[#111418] dark:text-white"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div className="w-10"></div>
      </div>

      {/* Content Wrapper */}
      <div className="flex flex-1 flex-col px-6 pt-4 pb-8">
        {/* Logo Area */}
        <div className="flex justify-center mb-8">
          <div className="size-20 rounded-2xl bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-[40px]">bolt</span>
          </div>
        </div>

        {/* Headlines */}
        <div className="mb-8 text-center space-y-3">
          <h1 className="text-[#111418] dark:text-white text-[28px] font-bold leading-tight tracking-tight">Bienvenidos a iMega</h1>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'} text-sm font-medium text-center`}>
            {message.text}
          </div>
        )}

        {/* Form */}
        {!message || message.type === 'error' ? (
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <div className="relative group">

                <input

                  type="text"
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-xl border-0 my-4 py-4 pl-12 pr-4 text-[#111418] dark:text-white bg-white dark:bg-[#1a2632] ring-1 ring-inset ring-gray-300 dark:ring-[#324d67] placeholder:text-[#9ca3af] dark:placeholder:text-[#637588] focus:ring-2 focus:ring-inset focus:ring-primary sm:text-base sm:leading-6 transition-all shadow-sm"
                />

                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border-0 my-4 py-4 pl-12 pr-4 text-[#111418] dark:text-white bg-white dark:bg-[#1a2632] ring-1 ring-inset ring-gray-300 dark:ring-[#324d67] placeholder:text-[#9ca3af] dark:placeholder:text-[#637588] focus:ring-2 focus:ring-inset focus:ring-primary sm:text-base sm:leading-6 transition-all shadow-sm"
                />

              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-4 text-white font-semibold text-[17px] shadow-lg shadow-primary/25 hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  <span>Ingresar</span>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <button
              onClick={() => setMessage(null)}
              className="text-primary font-semibold hover:underline"
            >
              Intentar con otro correo
            </button>
          </div>
        )}

        <div className="flex-1"></div>

        {/* Footer / Legal */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#637588] dark:text-[#6b7280] leading-relaxed max-w-[280px] mx-auto">
            Al continuar, aceptas nuestros
            <a className="mx-1 underline hover:text-primary dark:hover:text-white transition-colors" href="#">Términos de Servicio</a>
            y
            <a className="mx-1 underline hover:text-primary dark:hover:text-white transition-colors" href="#">Política de Privacidad</a>.
          </p>
        </div>

        <div className="h-4"></div>
      </div>
    </div>
  );
};

export default LoginScreen;
