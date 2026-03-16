import { useRef, useState, useCallback, useEffect } from 'react'
import './Timeline.css'

const TRACK_HEIGHT = 56
const RULER_HEIGHT = 24
const LABEL_WIDTH = 60

function formatRulerTime(secs) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function ClipBlock({ clip, pixelsPerSec, selectedClipId, tool, onSelect, onMove, onSplit, onDelete }) {
  const dragRef = useRef(null)
  const isSelected = clip.id === selectedClipId
  const left = clip.startTime * pixelsPerSec
  const width = Math.max(clip.duration * pixelsPerSec, 4)

  const handleMouseDown = (e) => {
    if (tool === 'cut') {
      onSplit(clip.id)
      return
    }
    if (tool !== 'select') return
    e.stopPropagation()
    onSelect(clip.id)

    const startX = e.clientX
    const origStart = clip.startTime
    dragRef.current = { startX, origStart }

    const handleMouseMove = (me) => {
      const delta = (me.clientX - dragRef.current.startX) / pixelsPerSec
      const newStart = Math.max(0, dragRef.current.origStart + delta)
      onMove(clip.id, newStart)
    }
    const handleMouseUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const hue = Math.abs(clip.id.charCodeAt(0) * 17) % 360

  return (
    <div
      className={`clip-block ${isSelected ? 'selected' : ''} ${tool === 'cut' ? 'tool-cut' : ''}`}
      style={{
        left,
        width,
        top: 4,
        height: TRACK_HEIGHT - 8,
        '--clip-hue': hue,
        opacity: clip.opacity ?? 1,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={() => tool === 'select' && onSelect(clip.id)}
      onContextMenu={(e) => {
        e.preventDefault()
        onDelete(clip.id)
      }}
      title={`${clip.name}\n右键删除`}
    >
      <div className="clip-label">{clip.name}</div>
      {isSelected && (
        <>
          <div className="clip-resize-handle left" />
          <div className="clip-resize-handle right" />
        </>
      )}
    </div>
  )
}

function Timeline({
  clips,
  currentTime,
  totalDuration,
  zoom,
  tool,
  selectedClipId,
  playing,
  onSelectClip,
  onTimeChange,
  onMoveClip,
  onDeleteClip,
  onSplitClip,
  onZoomChange,
  onPlayingChange,
}) {
  const scrollRef = useRef(null)
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false)

  // Compute pixels per second from zoom (20..200)
  const pixelsPerSec = zoom * 2

  const visibleDuration = Math.max(totalDuration * 1.2, 60)
  const timelineWidth = visibleDuration * pixelsPerSec

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    if (!playing) return
    const container = scrollRef.current
    if (!container) return
    const playheadX = currentTime * pixelsPerSec + LABEL_WIDTH
    const scrollLeft = container.scrollLeft
    const viewWidth = container.clientWidth
    if (playheadX > scrollLeft + viewWidth - 40) {
      container.scrollLeft = playheadX - viewWidth / 2
    }
  }, [currentTime, pixelsPerSec, playing])

  const getTimeFromX = useCallback(
    (clientX) => {
      const container = scrollRef.current
      if (!container) return 0
      const rect = container.getBoundingClientRect()
      const x = clientX - rect.left + container.scrollLeft - LABEL_WIDTH
      return Math.max(0, x / pixelsPerSec)
    },
    [pixelsPerSec]
  )

  const handleRulerMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return
      onPlayingChange(false)
      const time = getTimeFromX(e.clientX)
      onTimeChange(time)
      setIsDraggingPlayhead(true)

      const handleMouseMove = (me) => {
        const t = getTimeFromX(me.clientX)
        onTimeChange(Math.max(0, Math.min(totalDuration, t)))
      }
      const handleMouseUp = () => {
        setIsDraggingPlayhead(false)
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [getTimeFromX, onTimeChange, onPlayingChange, totalDuration]
  )

  // Generate ruler ticks
  const generateTicks = () => {
    const ticks = []
    const step = pixelsPerSec >= 100 ? 1 : pixelsPerSec >= 40 ? 5 : pixelsPerSec >= 10 ? 10 : 30
    const count = Math.ceil(visibleDuration / step) + 1
    for (let i = 0; i < count; i++) {
      const t = i * step
      ticks.push({ t, x: t * pixelsPerSec, label: formatRulerTime(t) })
    }
    return ticks
  }

  const ticks = generateTicks()
  const playheadX = currentTime * pixelsPerSec + LABEL_WIDTH

  // Group clips by track
  const trackCount = Math.max(1, ...clips.map((c) => c.track + 1))

  return (
    <div className="timeline">
      <div className="timeline-toolbar">
        <div className="timeline-toolbar-left">
          <button
            className="tl-btn"
            onClick={() => onPlayingChange(!playing)}
            disabled={totalDuration === 0}
            title={playing ? '暂停' : '播放'}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <button
            className="tl-btn"
            onClick={() => { onTimeChange(0); onPlayingChange(false) }}
            title="回到开头"
          >
            ⏮
          </button>
        </div>
        <div className="timeline-toolbar-center">
          <span className="zoom-label">缩放</span>
          <button className="zoom-btn" onClick={() => onZoomChange(Math.max(5, zoom - 10))}>－</button>
          <input
            type="range"
            min={5}
            max={200}
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="zoom-slider"
          />
          <button className="zoom-btn" onClick={() => onZoomChange(Math.min(200, zoom + 10))}>＋</button>
          <span className="zoom-value">{zoom}%</span>
        </div>
        <div className="timeline-toolbar-right">
          {clips.length > 0 && (
            <span className="tl-info">{clips.length} 个片段</span>
          )}
        </div>
      </div>

      <div className="timeline-body" ref={scrollRef}>
        {/* Track labels */}
        <div className="track-labels">
          <div className="ruler-label" style={{ height: RULER_HEIGHT }} />
          {Array.from({ length: trackCount }).map((_, i) => (
            <div key={i} className="track-label" style={{ height: TRACK_HEIGHT }}>
              <span>轨道 {i + 1}</span>
            </div>
          ))}
        </div>

        {/* Scrollable area */}
        <div className="timeline-scroll-area">
          <div
            className="timeline-content"
            style={{ width: timelineWidth, position: 'relative' }}
          >
            {/* Ruler */}
            <div
              className="ruler"
              style={{ height: RULER_HEIGHT }}
              onMouseDown={handleRulerMouseDown}
            >
              {ticks.map((tick) => (
                <div
                  key={tick.t}
                  className="ruler-tick"
                  style={{ left: tick.x }}
                >
                  <div className="ruler-tick-line" />
                  <div className="ruler-tick-label">{tick.label}</div>
                </div>
              ))}
            </div>

            {/* Tracks */}
            {Array.from({ length: trackCount }).map((_, trackIdx) => (
              <div
                key={trackIdx}
                className="track"
                style={{ height: TRACK_HEIGHT }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    onSelectClip(null)
                  }
                }}
              >
                {clips
                  .filter((c) => c.track === trackIdx)
                  .map((clip) => (
                    <ClipBlock
                      key={clip.id}
                      clip={clip}
                      pixelsPerSec={pixelsPerSec}
                      selectedClipId={selectedClipId}
                      tool={tool}
                      onSelect={onSelectClip}
                      onMove={onMoveClip}
                      onSplit={onSplitClip}
                      onDelete={onDeleteClip}
                    />
                  ))}
              </div>
            ))}

            {/* Playhead */}
            <div
              className={`playhead ${isDraggingPlayhead ? 'dragging' : ''}`}
              style={{ left: currentTime * pixelsPerSec }}
            >
              <div className="playhead-head" />
              <div className="playhead-line" style={{ height: RULER_HEIGHT + trackCount * TRACK_HEIGHT }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Timeline
