'use client';
import { useState } from 'react';
import { Play } from 'lucide-react';

/** Privacy-conscious embed: nothing from YouTube loads until the visitor clicks play (nocookie domain). */
export default function VideoEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [play, setPlay] = useState(false);
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;
  return (
    <div className="video-embed">
      {play ? (
        <iframe src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`} title={title} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      ) : (
        <button className="video-embed-poster" onClick={() => setPlay(true)} aria-label={`Play video: ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" loading="lazy" />
          <span className="play-circle"><Play size={25} fill="currentColor" /></span>
          <span className="video-embed-note">Loads from YouTube when you press play</span>
        </button>
      )}
    </div>
  );
}
