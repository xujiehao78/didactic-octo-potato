import { useRef, useEffect, useCallback } from 'react'
import './PreviewPlayer.css'

function formatTime(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  const ms = Math.floor((secs % 1) * 100)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
}

function PreviewPlayer({ clips, currentTime, playing, totalDuration, onTimeUpdate, onPlayingChange }) {
  const canvasRef = useRef(null)
  const videoRefs = useRef({})
  const animFrameRef = useRef(null)
  const playStartTimeRef = useRef(null)
  const playStartCurrentRef = useRef(null)

  // Find which clip is active at currentTime
  const activeClip = clips.find(
    (c) => currentTime >= c.startTime && currentTime < c.endTime
  )

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (activeClip) {
      const video = videoRefs.current[activeClip.id]
      if (video && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      }
    }

    if (!activeClip || clips.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('在媒体库中双击视频添加到时间线', canvas.width / 2, canvas.height / 2)
    }
  }, [activeClip, clips])

  // Sync video element seek
  useEffect(() => {
    if (!activeClip) return
    const video = videoRefs.current[activeClip.id]
    if (!video) return
    const clipLocalTime = currentTime - activeClip.startTime + activeClip.trimStart
    if (Math.abs(video.currentTime - clipLocalTime) > 0.1) {
      video.currentTime = clipLocalTime
    }
  }, [activeClip, currentTime])

  // Playback loop
  useEffect(() => {
    if (playing) {
      playStartTimeRef.current = performance.now()
      playStartCurrentRef.current = currentTime

      const tick = () => {
        const elapsed = (performance.now() - playStartTimeRef.current) / 1000
        const newTime = playStartCurrentRef.current + elapsed
        if (newTime >= totalDuration) {
          onPlayingChange(false)
          onTimeUpdate(totalDuration)
          return
        }
        onTimeUpdate(newTime)
        drawFrame()
        animFrameRef.current = requestAnimationFrame(tick)
      }
      animFrameRef.current = requestAnimationFrame(tick)

      // Play active video
      if (activeClip) {
        const video = videoRefs.current[activeClip.id]
        if (video) video.play().catch(() => {})
      }

      return () => {
        cancelAnimationFrame(animFrameRef.current)
        // Pause all videos
        Object.values(videoRefs.current).forEach((v) => v?.pause())
      }
    } else {
      Object.values(videoRefs.current).forEach((v) => v?.pause())
      drawFrame()
    }
  }, [playing]) // eslint-disable-line react-hooks/exhaustive-deps

  // Draw on time change when paused
  useEffect(() => {
    if (!playing) {
      drawFrame()
    }
  }, [currentTime, playing, drawFrame])

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    onTimeUpdate(ratio * totalDuration)
    if (playing) onPlayingChange(false)
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  return (
    <div className="preview-player">
      <div className="preview-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="preview-canvas"
          width={1280}
          height={720}
        />
        {/* Hidden video elements for each clip */}
        {clips.map((clip) => (
          <video
            key={clip.id}
            ref={(el) => {
              if (el) videoRefs.current[clip.id] = el
              else delete videoRefs.current[clip.id]
            }}
            src={clip.url}
            preload="auto"
            muted
            playsInline
            style={{ display: 'none' }}
            crossOrigin="anonymous"
          />
        ))}
      </div>
      <div className="preview-controls">
        <div className="preview-seekbar-wrap" onClick={handleSeek}>
          <div className="preview-seekbar">
            <div className="preview-seekbar-fill" style={{ width: `${progress}%` }} />
            <div className="preview-seekbar-thumb" style={{ left: `${progress}%` }} />
          </div>
        </div>
        <div className="preview-buttons">
          <button
            className="ctrl-btn"
            onClick={() => onTimeUpdate(0)}
            title="回到开头"
          >
            ⏮
          </button>
          <button
            className="ctrl-btn"
            onClick={() => onTimeUpdate(Math.max(0, currentTime - 5))}
            title="后退5秒"
          >
            ◀◀
          </button>
          <button
            className="ctrl-btn play-btn"
            onClick={() => {
              if (totalDuration === 0) return
              onPlayingChange(!playing)
            }}
            disabled={totalDuration === 0}
            title={playing ? '暂停' : '播放'}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <button
            className="ctrl-btn"
            onClick={() => onTimeUpdate(Math.min(totalDuration, currentTime + 5))}
            title="前进5秒"
          >
            ▶▶
          </button>
          <button
            className="ctrl-btn"
            onClick={() => onTimeUpdate(totalDuration)}
            title="跳到结尾"
          >
            ⏭
          </button>
          <div className="preview-time">
            <span className="time-current">{formatTime(currentTime)}</span>
            <span className="time-sep"> / </span>
            <span className="time-total">{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreviewPlayer
