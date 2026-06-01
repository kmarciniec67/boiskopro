import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { login, register, user, logout } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    try {
      if (mode === 'login') {
        await login(fd.get('email') as string, fd.get('password') as string);
      } else {
        await register({
          email: fd.get('email') as string,
          password: fd.get('password') as string,
          firstName: fd.get('firstName') as string,
          lastName: fd.get('lastName') as string,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd logowania');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-pitch-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Zamknij"
        >
          ✕
        </button>
        {user ? (
          <div className="text-center">
            <p className="text-lg font-semibold">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-white/50">{user.email}</p>
            {user.role === 'admin' && (
              <p className="mt-2 text-sm text-accent">Konto administratora</p>
            )}
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="mt-6 w-full rounded-xl border border-white/15 py-2 hover:bg-white/5"
            >
              Wyloguj się
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                  mode === 'login' ? 'bg-pitch-500 text-pitch-950' : 'bg-white/5'
                }`}
              >
                Logowanie
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                  mode === 'register' ? 'bg-pitch-500 text-pitch-950' : 'bg-white/5'
                }`}
              >
                Rejestracja
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="firstName"
                    required
                    placeholder="Imię"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 outline-none focus:border-pitch-500"
                  />
                  <input
                    name="lastName"
                    required
                    placeholder="Nazwisko"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 outline-none focus:border-pitch-500"
                  />
                </div>
              )}
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 outline-none focus:border-pitch-500"
              />
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Hasło"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 outline-none focus:border-pitch-500"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-pitch-500 py-3 font-semibold text-pitch-950 hover:bg-pitch-400 disabled:opacity-50"
              >
                {loading ? 'Proszę czekać…' : mode === 'login' ? 'Zaloguj się' : 'Załóż konto'}
              </button>
            </form>

            {mode === 'login' && (
              <p className="mt-4 text-center text-xs text-white/40">
                Admin: admin@boiskopro.pl / admin123
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
