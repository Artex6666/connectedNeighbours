import { useEffect, useRef, useState } from 'react'

type Props = {
  src: string
  /** Optional known duration (in seconds). Used as a fallback when WebM/Opus
   *  blobs from MediaRecorder report Infinity/NaN duration in the browser. */
  fallbackDurationSeconds?: number
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VoiceMessage({ src, fallbackDurationSeconds }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [duration, setDuration] = useState(fallbackDurationSeconds ?? 0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Force WebM/Opus blobs (created by MediaRecorder) to expose a real duration.
  // The classic trick: seek to a huge timestamp, the browser computes the
  // real length, then seek back to 0.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoadedMetadata = () => {
      if (audio.duration === Infinity || Number.isNaN(audio.duration)) {
        const onTimeUpdate = () => {
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration)
            audio.currentTime = 0
            audio.removeEventListener('timeupdate', onTimeUpdate)
          }
        }
        audio.addEventListener('timeupdate', onTimeUpdate)
        audio.currentTime = 1e9
      } else {
        setDuration(audio.duration)
      }
    }

    const onTime = () => setCurrentTime(audio.currentTime)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [src])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play()
    } else {
      audio.pause()
    }
  }

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const next = Number(event.target.value)
    audio.currentTime = next
    setCurrentTime(next)
  }

  const safeDuration = duration > 0 ? duration : fallbackDurationSeconds ?? 0

  return (
    <div className="voice-message">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        className="voice-message__play"
        aria-label={isPlaying ? 'Pause' : 'Lecture'}
        onClick={togglePlay}
      >
        {isPlaying ? '❚❚' : '▶'}
      </button>
      <input
        type="range"
        className="voice-message__progress"
        min={0}
        max={safeDuration || 0.01}
        step={0.05}
        value={Math.min(currentTime, safeDuration || 0)}
        onChange={handleSeek}
        aria-label="Position"
      />
      <span className="voice-message__time">
        {formatTime(currentTime)} / {formatTime(safeDuration)}
      </span>
    </div>
  )
}
