import { durations } from '../data/moods';
import { useI18n } from '../hooks/useI18n';
import './TimePicker.css';

export default function TimePicker({ selected, onSelect }) {
  const { t } = useI18n();

  return (
    <section className="time-picker">
      <h2 className="time-picker__label">{t('time.label')}</h2>
      <div className="time-picker__pills" role="radiogroup" aria-label={t('time.label')}>
        <button
          className={`time-pill ${selected === 'any' ? 'time-pill--active' : ''}`}
          onClick={() => onSelect('any')}
          role="radio"
          aria-checked={selected === 'any'}
        >
          {t('time.any')}
        </button>
        {durations.map((mins) => (
          <button
            key={mins}
            className={`time-pill ${selected === mins ? 'time-pill--active' : ''}`}
            onClick={() => onSelect(mins)}
            role="radio"
            aria-checked={selected === mins}
          >
            {t('time.min', { mins })}
          </button>
        ))}
      </div>
    </section>
  );
}
