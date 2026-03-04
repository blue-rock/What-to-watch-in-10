import { useI18n } from '../hooks/useI18n';
import './Header.css';

const LOCALE_LABELS = { en: 'EN', hi: 'HI', es: 'ES', fr: 'FR' };

export default function Header({ onSurpriseMe, theme, onToggleTheme, onOpenFavorites, onOpenQueue, onOpenStats, queueCount }) {
  const { t, locale, setLocale, availableLocales } = useI18n();

  return (
    <header className="header">
      <a href="#main-content" className="skip-to-content">{t('header.skipToContent')}</a>
      <nav className="header__top-bar" aria-label="Site actions">
        <select
          className="header__lang-select"
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          aria-label="Select language"
        >
          {availableLocales.map((loc) => (
            <option key={loc} value={loc}>{LOCALE_LABELS[loc] || loc.toUpperCase()}</option>
          ))}
        </select>
        {onOpenStats && (
          <button className="header__stats-btn" onClick={onOpenStats} title={t('stats.title')}>
            {t('stats.title')}
          </button>
        )}
        {onOpenQueue && (
          <button className="header__queue-btn" onClick={onOpenQueue} title={t('queue.title')}>
            &#128339; {queueCount > 0 && <span className="header__queue-badge">{queueCount}</span>}
          </button>
        )}
        {onOpenFavorites && (
          <button
            className="header__favorites-btn"
            onClick={onOpenFavorites}
            aria-label={t('fav.favorites')}
          >
            {t('header.myList')}
          </button>
        )}
        {onToggleTheme && (
          <button
            className="header__theme-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </button>
        )}
      </nav>
      <h1 className="header__title">
        {t('header.title1')}
        <span className="header__accent">{t('header.title2')}</span>
      </h1>
      <p className="header__subtitle">{t('header.subtitle')}</p>
      {onSurpriseMe && (
        <button className="header__surprise-btn" onClick={onSurpriseMe}>
          {t('header.surpriseMe')}
        </button>
      )}
    </header>
  );
}
