import './SkeletonGrid.css';

const SKELETON_COUNT = 9;

export default function SkeletonGrid() {
  return (
    <section className="skeleton-grid-section">
      <div className="skeleton-grid">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-card__thumb">
              <div className="skeleton-card__duration" />
            </div>
            <div className="skeleton-card__info">
              <div className="skeleton-card__title" />
              <div className="skeleton-card__title skeleton-card__title--short" />
              <div className="skeleton-card__channel" />
            </div>
          </div>
        ))}
      </div>
      <p className="skeleton-grid__text">Finding the perfect watch...</p>
    </section>
  );
}
