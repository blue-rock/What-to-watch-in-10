import { useState, useRef, useImperativeHandle, forwardRef, useEffect, useCallback } from 'react';
import { useI18n } from '../hooks/useI18n';
import './SearchBar.css';

const SearchBar = forwardRef(function SearchBar({ onSearch, value }, ref) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const fetchSuggestions = useCallback(async (q) => {
    if (!q.trim() || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}&hl=${locale}`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
    } catch {
      setSuggestions([]);
    }
  }, [locale]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);
    clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      onSearch(trimmed);
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSelect = (suggestion) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  return (
    <form className="search-bar" onSubmit={handleSubmit} ref={wrapRef}>
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
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          aria-label={t('search.button')}
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions && suggestions.length > 0}
          aria-activedescendant={activeIndex >= 0 ? `suggest-${activeIndex}` : undefined}
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
        {showSuggestions && suggestions.length > 0 && (
          <ul className="search-bar__suggestions" role="listbox">
            {suggestions.map((s, i) => (
              <li
                key={s}
                id={`suggest-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={`search-bar__suggestion ${i === activeIndex ? 'search-bar__suggestion--active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <svg className="search-bar__suggest-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" className="search-bar__btn" disabled={!query.trim()}>
        {t('search.button')}
      </button>
    </form>
  );
});

export default SearchBar;
