import { durations } from '../data/moods';
import './TimePicker.css';

export default function TimePicker({ selected, onSelect }) {
  return (
    <section className="time-picker">
      <h2 className="time-picker__label">How much time do you have?</h2>
      <div className="time-picker__pills">
        {durations.map((mins) => (
          <button
            key={mins}
            className={`time-pill ${selected === mins ? 'time-pill--active' : ''}`}
            onClick={() => onSelect(mins)}
          >
            {mins} min
          </button>
        ))}
      </div>
    </section>
  );
}
