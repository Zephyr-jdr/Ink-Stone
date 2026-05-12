import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { useAppStore } from '@/stores/appStore';
import { useT } from '@/i18n';

export function Header() {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, clearSession } = useAppStore();
  const isAppPage = location.pathname !== '/';

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  return (
    <header className="relative">
      <div className="px-4 sm:px-6 h-20 sm:h-24 md:h-28 lg:h-32 flex items-center justify-between max-w-6xl mx-auto gap-2">
        <button
          onClick={() => navigate(session ? '/dashboard' : '/')}
          className="hover:opacity-80 transition-opacity flex-shrink-0"
          aria-label={t('header.home')}
        >
          <Logo size="sm" />
        </button>

        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {isAppPage && session && (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-[var(--accent-primary)] rounded-full min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-[var(--text-inverse)] text-xs font-medium font-body truncate max-w-[100px] sm:max-w-[180px]">
                  {session.space.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title={t('header.leave')}
                className="ml-0.5 p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}

          {/* Language toggle, always visible top-right. Discreet. */}
          <LanguageToggle />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--border-paper)] to-transparent" />
    </header>
  );
}
