import { moods } from '../data/moods';
import './MoodSelector.css';

export default function MoodSelector({ selected, onSelect }) {
  return (
    <section className="mood-selector">
      <h2 className="mood-selector__label">What are you in the mood for?</h2>
      <div className="mood-selector__grid">
        {moods.map((mood) => (
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
    </section>
  );
}
