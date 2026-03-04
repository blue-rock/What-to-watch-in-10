import { useState } from 'react';
import { moods } from '../data/moods';
import { useI18n } from '../hooks/useI18n';
import './MoodSelector.css';

const DEFAULT_VISIBLE = 12;

export default function MoodSelector({ selected, onSelect }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const visibleMoods = expanded ? moods : moods.slice(0, DEFAULT_VISIBLE);

  return (
    <section className="mood-selector">
      <h2 className="mood-selector__label">{t('mood.label')}</h2>
      <div className="mood-selector__grid" role="radiogroup" aria-label={t('mood.label')}>
        {visibleMoods.map((mood) => (
          <button
            key={mood.id}
            className={`mood-card ${selected?.id === mood.id ? 'mood-card--active' : ''}`}
            onClick={() => onSelect(mood)}
            role="radio"
            aria-checked={selected?.id === mood.id}
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
          {expanded ? t('mood.showLess') : t('mood.showMore', { count: moods.length - DEFAULT_VISIBLE })}
        </button>
      )}
    </section>
  );
}
