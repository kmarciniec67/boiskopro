import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface HeaderProps {
  onAuthClick: () => void;
}

export function Header({ onAuthClick }: HeaderProps) {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();

  const linkClass = (path: string) =>
    `text-sm font-medium transition ${
      location.pathname === path ? 'text-pitch-400' : 'text-white/60 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-pitch-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pitch-500 to-pitch-700 text-lg font-bold">
            BP
          </span>
          <span className="text-lg font-bold tracking-tight">BoiskoPro</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <Link to="/" className={linkClass('/')}>
            Sklep
          </Link>
          {user && (
            <Link to="/zamowienia" className={linkClass('/zamowienia')}>
              Moje zamówienia
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className={linkClass('/admin')}>
              Panel admina
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <span className="hidden text-sm text-white/50 sm:inline">
              Cześć, {user.firstName}
            </span>
          ) : null}

          <button
            type="button"
            onClick={onAuthClick}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm font-medium hover:bg-white/5"
          >
            {user ? 'Konto' : 'Zaloguj'}
          </button>

          {user && (
            <button
              type="button"
              onClick={logout}
              className="hidden rounded-xl px-3 py-2 text-sm text-white/50 hover:text-white sm:block"
            >
              Wyloguj
            </button>
          )}

          <Link
            to="/koszyk"
            className="relative rounded-xl bg-pitch-500 px-4 py-2 text-sm font-semibold text-pitch-950 hover:bg-pitch-400"
          >
            Koszyk
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-pitch-950">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
