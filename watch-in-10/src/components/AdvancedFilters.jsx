import { useI18n } from '../hooks/useI18n';
import './AdvancedFilters.css';

const UPLOAD_OPTIONS = ['any', 'today', 'week', 'month'];

export default function AdvancedFilters({ filters, onChange }) {
  const { t } = useI18n();

  return (
    <div className="advanced-filters">
      <span className="advanced-filters__label">{t('filters.title')}:</span>
      <div className="advanced-filters__group">
        <span className="advanced-filters__group-label">{t('filters.uploadDate')}:</span>
        {UPLOAD_OPTIONS.map((opt) => (
          <button
            key={opt}
            className={`advanced-filters__chip ${filters.uploadDate === opt ? 'advanced-filters__chip--active' : ''}`}
            onClick={() => onChange({ ...filters, uploadDate: opt })}
          >
            {t(`filters.${opt}`)}
          </button>
        ))}
      </div>
      <label className="advanced-filters__toggle">
        <input
          type="checkbox"
          checked={filters.hd || false}
          onChange={(e) => onChange({ ...filters, hd: e.target.checked })}
        />
        <span>{t('filters.hd')}</span>
      </label>
    </div>
  );
}
