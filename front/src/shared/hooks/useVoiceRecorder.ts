import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'recorded' | 'error'

export type UseVoiceRecorderResult = {
  state: RecorderState
  durationSeconds: number
  blob: Blob | null
  error: string | null
  start: () => Promise<void>
  stop: () => void
  reset: () => void
}

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/aac',
]

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  for (const candidate of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate
    }
  }
  return undefined
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [state, setState] = useState<RecorderState>('idle')
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    recorderRef.current = null
    chunksRef.current = []
    stopTimer()
  }

  const reset = useCallback(() => {
    cleanupStream()
    setState('idle')
    setDurationSeconds(0)
    setBlob(null)
    setError(null)
  }, [])

  const start = useCallback(async () => {
    setError(null)

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError("Votre navigateur ne supporte pas l'enregistrement audio.")
      setState('error')
      return
    }

    setState('requesting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = pickMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []
      setDurationSeconds(0)
      setBlob(null)

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || 'audio/webm'
        const finalBlob = new Blob(chunksRef.current, { type: finalMime })
        setBlob(finalBlob)
        cleanupStream()
        setState('recorded')
      }

      recorder.onerror = () => {
        setError("Erreur d'enregistrement audio.")
        cleanupStream()
        setState('error')
      }

      recorder.start(250)
      setState('recording')

      timerRef.current = window.setInterval(() => {
        setDurationSeconds((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      const isPermission =
        err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
      setError(isPermission ? "Accès au microphone refusé." : "Impossible d'accéder au microphone.")
      cleanupStream()
      setState('error')
    }
  }, [])

  const stop = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    } else {
      cleanupStream()
      setState('idle')
    }
  }, [])

  useEffect(() => {
    return () => {
      cleanupStream()
    }
  }, [])

  return { state, durationSeconds, blob, error, start, stop, reset }
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}:${remaining.toString().padStart(2, '0')}`
}
