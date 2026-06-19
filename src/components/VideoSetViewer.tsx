import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import type { VideoAsset } from '../data/modalityAssets';

const VIDEO_START_FRAME = 38;
const VIDEO_FRAME_RATE = 25;
const VIDEO_START_TIME = VIDEO_START_FRAME / VIDEO_FRAME_RATE;

type VideoSetViewerProps = {
  videos: VideoAsset[];
};

export function VideoSetViewer({ videos }: VideoSetViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const selectedVideo = videos[selectedIndex];

  useEffect(() => {
    setSelectedIndex(0);
  }, [videos]);

  useEffect(() => {
    setHasError(false);
    setIsPlaying(false);
  }, [selectedVideo?.mp4, selectedVideo?.webm]);

  const seekToStartFrame = (video: HTMLVideoElement) => {
    const startTime = Number.isFinite(video.duration) && video.duration > VIDEO_START_TIME
      ? VIDEO_START_TIME
      : 0;
    if (Math.abs(video.currentTime - startTime) > 0.05) {
      video.currentTime = startTime;
    }
  };

  const handleMetadataLoaded = (event: SyntheticEvent<HTMLVideoElement>) => {
    seekToStartFrame(event.currentTarget);
  };

  const handleEnded = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    seekToStartFrame(video);
    void video.play();
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      if (video.currentTime < VIDEO_START_TIME - 0.05) {
        seekToStartFrame(video);
      }
      void video.play();
    } else {
      video.pause();
    }
  };

  if (!selectedVideo || (!selectedVideo.mp4 && !selectedVideo.webm)) {
    return (
      <div className="video-set-viewer actorshq-video-preview">
        <div className="actorshq-fallback">Preview unavailable</div>
      </div>
    );
  }

  return (
    <div className="video-set-viewer actorshq-video-preview">
      <div className="video-set-canvas">
        {hasError ? (
          <div className="actorshq-fallback">Preview unavailable</div>
        ) : (
          <video
            ref={videoRef}
            key={`${selectedVideo.webm ?? ''}-${selectedVideo.mp4 ?? ''}`}
            controls
            muted
            playsInline
            preload="metadata"
            poster={selectedVideo.poster}
            onLoadedMetadata={handleMetadataLoaded}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={() => setHasError(true)}
          >
            {selectedVideo.webm ? <source src={selectedVideo.webm} type="video/webm" /> : null}
            {selectedVideo.mp4 ? <source src={selectedVideo.mp4} type="video/mp4" /> : null}
          </video>
        )}
      </div>
      <div className="video-set-tabs" aria-label="Video controls">
        <button
          type="button"
          className="video-play-toggle"
          onClick={togglePlayback}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
          aria-pressed={isPlaying}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        {videos.length > 1
          ? videos.map((video, index) => (
            <button
              type="button"
              key={`${video.label}-${index}`}
              className={index === selectedIndex ? 'is-active' : ''}
              onClick={() => setSelectedIndex(index)}
              aria-pressed={index === selectedIndex}
              aria-label={`Show ${video.label}`}
            >
              {video.label}
            </button>
          ))
          : null}
      </div>
    </div>
  );
}
