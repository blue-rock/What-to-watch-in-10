import { useMemo, useState, useEffect } from 'react';
import VideoCard from './VideoCard';
import { fallbackVideos } from '../data/fallback';
import { useI18n } from '../hooks/useI18n';
import './DailyPicks.css';

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

async function checkVideo(video) {
  const id = video.url?.match(/[?&]v=([^&]+)/)?.[1];
  if (!id) return false;
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return !data.error;
  } catch {
    return true; // on error, assume available
  }
}

export default function DailyPicks({ onPlay, onToggleFavorite, isFavorite }) {
  const { t } = useI18n();
  // Generate a larger pool of candidates using today's seed
  const candidates = useMemo(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const rand = seededRandom(seed);

    const allVideos = Object.values(fallbackVideos).flat();
    const shuffled = [...allVideos].sort(() => rand() - 0.5);
    return shuffled.slice(0, 9); // pick 9 candidates, filter down to 3 available
  }, []);

  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function filterAvailable() {
      const available = [];
      for (const video of candidates) {
        if (available.length >= 3) break;
        const ok = await checkVideo(video);
        if (ok && !cancelled) available.push(video);
      }
      if (!cancelled) {
        setPicks(available);
        setLoading(false);
      }
    }

    filterAvailable();
    return () => { cancelled = true; };
  }, [candidates]);

  return (
    <section className="daily-picks">
      <h2 className="daily-picks__title">{t('daily.title')}</h2>
      <p className="daily-picks__subtitle">{t('daily.subtitle')}</p>
      {loading ? (
        <div className="daily-picks__grid">
          {[0, 1, 2].map((i) => (
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
      ) : picks.length > 0 ? (
        <div className="daily-picks__grid">
          {picks.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onPlay={onPlay}
              onToggleFavorite={onToggleFavorite}
              isFavorited={isFavorite?.(video.id)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
