import { useState } from 'react';
import { moods } from '../data/moods';
import './MoodSelector.css';

const DEFAULT_VISIBLE = 12;

export default function MoodSelector({ selected, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const visibleMoods = expanded ? moods : moods.slice(0, DEFAULT_VISIBLE);

  return (
    <section className="mood-selector">
      <h2 className="mood-selector__label">What are you in the mood for?</h2>
      <div className="mood-selector__grid">
        {visibleMoods.map((mood) => (
          <button
            key={mood.id}
            className={`mood-card ${selected?.id === mood.id ? 'mood-card--active' : ''}`}
            onClick={() => onSelect(mood)}
            style={{
              '--mood-color': mood.color,
              '--mood-color-light': mood.color + '18',
            }}
          >
            <span className="mood-card__icon">{mood.icon}</span>
            <span className="mood-card__label">{mood.label}</span>
          </button>
        ))}
      </div>
      {moods.length > DEFAULT_VISIBLE && (
        <button
          className="mood-selector__toggle"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show Less' : `Show More (${moods.length - DEFAULT_VISIBLE} more)`}
        </button>
      )}
    </section>
  );
}
