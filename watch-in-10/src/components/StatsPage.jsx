import { useI18n } from '../hooks/useI18n';
import { useStats } from '../hooks/useStats';
import { moods } from '../data/moods';
import './StatsPage.css';

export default function StatsPage({ usage, onClose }) {
  const { t } = useI18n();
  const stats = useStats(usage);

  return (
    <div className="stats-page">
      <div className="stats-page__header">
        <h2 className="stats-page__title">{t('stats.title')}</h2>
        <button className="stats-page__close" onClick={onClose}>&times;</button>
      </div>

      {stats.totalWatched === 0 ? (
        <p className="stats-page__empty">{t('stats.noData')}</p>
      ) : (
        <div className="stats-page__content">
          <div className="stats-page__cards">
            <div className="stats-page__card">
              <span className="stats-page__card-value">{stats.totalWatched}</span>
              <span className="stats-page__card-label">{t('stats.totalWatched')}</span>
            </div>
            <div className="stats-page__card">
              <span className="stats-page__card-value">{t('stats.minutes', { mins: stats.totalMinutes })}</span>
              <span className="stats-page__card-label">{t('stats.totalTime')}</span>
            </div>
          </div>

          {stats.topMoods.length > 0 && (
            <div className="stats-page__section">
              <h3 className="stats-page__section-title">{t('stats.topMoods')}</h3>
              <div className="stats-page__bars">
                {stats.topMoods.map(({ id, count }) => {
                  const mood = moods.find((m) => m.id === id);
                  const maxCount = stats.topMoods[0].count;
                  return (
                    <div key={id} className="stats-page__bar-row">
                      <span className="stats-page__bar-label">
                        {mood?.icon} {mood?.label || id}
                      </span>
                      <div className="stats-page__bar-track">
                        <div
                          className="stats-page__bar-fill"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="stats-page__bar-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stats.topChannels.length > 0 && (
            <div className="stats-page__section">
              <h3 className="stats-page__section-title">{t('stats.topChannels')}</h3>
              <div className="stats-page__bars">
                {stats.topChannels.map(({ channel, count }) => {
                  const maxCount = stats.topChannels[0].count;
                  return (
                    <div key={channel} className="stats-page__bar-row">
                      <span className="stats-page__bar-label">{channel}</span>
                      <div className="stats-page__bar-track">
                        <div
                          className="stats-page__bar-fill"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="stats-page__bar-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
