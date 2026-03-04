import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { useI18n } from '../hooks/useI18n';
import './SearchBar.css';

const SearchBar = forwardRef(function SearchBar({ onSearch, value }, ref) {
  const { t } = useI18n();
  const [query, setQuery] = useState(value || '');
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) onSearch(trimmed);
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-bar__input-wrap">
        <svg className="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          className="search-bar__input"
          type="text"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('search.button')}
        />
        {query && (
          <button
            type="button"
            className="search-bar__clear"
            onClick={handleClear}
            aria-label={t('search.clear')}
          >
            &times;
          </button>
        )}
      </div>
      <button type="submit" className="search-bar__btn" disabled={!query.trim()}>
        {t('search.button')}
      </button>
    </form>
  );
});

export default SearchBar;
