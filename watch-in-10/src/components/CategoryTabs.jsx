import { useI18n } from '../hooks/useI18n';
import './CategoryTabs.css';

const TABS = ['forYou', 'trending', 'favorites', 'playlists'];

export default function CategoryTabs({ active, onChange }) {
  const { t } = useI18n();

  return (
    <div className="category-tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab}
          className={`category-tabs__tab ${active === tab ? 'category-tabs__tab--active' : ''}`}
          onClick={() => onChange(tab)}
          role="tab"
          aria-selected={active === tab}
        >
          {t(`tabs.${tab}`)}
        </button>
      ))}
    </div>
  );
}
