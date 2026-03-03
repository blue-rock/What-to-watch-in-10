import { useState } from 'react';
import './SearchBar.css';

export default function SearchBar({ onSearch, value }) {
  const [query, setQuery] = useState(value || '');

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
          className="search-bar__input"
          type="text"
          placeholder="Search for any video..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search for videos"
        />
        {query && (
          <button
            type="button"
            className="search-bar__clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>
      <button type="submit" className="search-bar__btn" disabled={!query.trim()}>
        Search
      </button>
    </form>
  );
}
