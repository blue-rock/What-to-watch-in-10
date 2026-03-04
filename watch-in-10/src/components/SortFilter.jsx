import { useI18n } from '../hooks/useI18n';
import './SortFilter.css';

const SORT_OPTIONS = [
  { value: 'relevance', key: 'sort.relevance' },
  { value: 'views', key: 'sort.views' },
  { value: 'shortest', key: 'sort.shortest' },
  { value: 'longest', key: 'sort.longest' },
];

export default function SortFilter({ sortBy, onSortChange }) {
  const { t } = useI18n();

  return (
    <div className="sort-filter">
      <label className="sort-filter__label">{t('sort.label')}</label>
      <div className="sort-filter__options" role="radiogroup" aria-label={t('sort.label')}>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`sort-filter__btn ${sortBy === opt.value ? 'sort-filter__btn--active' : ''}`}
            onClick={() => onSortChange(opt.value)}
            role="radio"
            aria-checked={sortBy === opt.value}
          >
            {t(opt.key)}
          </button>
        ))}
      </div>
    </div>
  );
}
