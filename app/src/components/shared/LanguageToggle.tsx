import { useI18n } from '@/i18n';

interface Props {
  className?: string;
}

export function LanguageToggle({ className = '' }: Props) {
  const { lang, setLang } = useI18n();

  return (
    <div
      className={`inline-flex items-center gap-0 text-[10px] font-mono uppercase tracking-wider opacity-50 hover:opacity-100 transition-opacity ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`px-1.5 py-0.5 transition-colors ${
          lang === 'en'
            ? 'text-[var(--text-primary)] font-semibold'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
      >
        EN
      </button>
      <span className="text-[var(--text-muted)]" aria-hidden>
        ·
      </span>
      <button
        type="button"
        onClick={() => setLang('fr')}
        aria-pressed={lang === 'fr'}
        className={`px-1.5 py-0.5 transition-colors ${
          lang === 'fr'
            ? 'text-[var(--text-primary)] font-semibold'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
      >
        FR
      </button>
    </div>
  );
}
