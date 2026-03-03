import './Header.css';

export default function Header({ onSurpriseMe, theme, onToggleTheme, onOpenFavorites }) {
  return (
    <header className="header">
      <div className="header__top-bar">
        {onOpenFavorites && (
          <button
            className="header__favorites-btn"
            onClick={onOpenFavorites}
            aria-label="Open favorites and history"
          >
            &#9829; My List
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
      </div>
      <h1 className="header__title">
        What Should I Watch
        <span className="header__accent"> in 10 Minutes?</span>
      </h1>
      <p className="header__subtitle">
        Short films, mini docs, TED talks &amp; more — curated for your mood and your time.
      </p>
      {onSurpriseMe && (
        <button className="header__surprise-btn" onClick={onSurpriseMe}>
          Surprise Me
        </button>
      )}
    </header>
  );
}
