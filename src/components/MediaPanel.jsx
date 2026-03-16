import { useRef, useEffect } from 'react'
import './MediaPanel.css'

function MediaItem({ media, onAddToTimeline, onDurationLoaded }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleLoaded = () => {
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = 120
        canvas.height = 68
        const ctx = canvas.getContext('2d')
        video.currentTime = Math.min(1, video.duration * 0.1)
        const drawFrame = () => {
          ctx.drawImage(video, 0, 0, 120, 68)
          onDurationLoaded(media.id, video.duration, canvas.toDataURL())
        }
        video.addEventListener('seeked', drawFrame, { once: true })
      }
    }
    video.addEventListener('loadedmetadata', handleLoaded, { once: true })
  }, [media.id, media.url, onDurationLoaded])

  const formatDuration = (secs) => {
    if (!secs) return '--:--'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="media-item" title={media.name}>
      <div
        className="media-thumbnail"
        onDoubleClick={() => onAddToTimeline(media)}
        title="双击添加到时间线"
      >
        {media.thumbnail ? (
          <img src={media.thumbnail} alt={media.name} />
        ) : (
          <div className="media-thumb-placeholder">
            <span>🎥</span>
          </div>
        )}
        <div className="media-duration">{formatDuration(media.duration)}</div>
        <div className="media-add-hint">双击添加</div>
      </div>
      <div className="media-info">
        <span className="media-name">{media.name}</span>
      </div>
      <video
        ref={videoRef}
        src={media.url}
        preload="metadata"
        muted
        style={{ display: 'none' }}
        crossOrigin="anonymous"
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

function MediaPanel({ mediaFiles, onAddMedia, onMediaDurationLoaded, onAddToTimeline }) {
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('video/')
    )
    if (files.length > 0) onAddMedia(files)
  }

  const handleDragOver = (e) => e.preventDefault()

  return (
    <aside className="media-panel">
      <div className="panel-header">
        <span className="panel-title">媒体库</span>
        <button
          className="panel-add-btn"
          onClick={() => inputRef.current?.click()}
          title="导入媒体文件"
        >
          + 导入
        </button>
      </div>
      <div
        className="media-drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {mediaFiles.length === 0 ? (
          <div className="media-empty">
            <div className="media-empty-icon">📁</div>
            <div className="media-empty-text">拖入视频文件</div>
            <div className="media-empty-sub">或点击"导入"按钮</div>
            <button
              className="media-import-btn"
              onClick={() => inputRef.current?.click()}
            >
              导入文件
            </button>
          </div>
        ) : (
          <div className="media-grid">
            {mediaFiles.map((media) => (
              <MediaItem
                key={media.id}
                media={media}
                onAddToTimeline={onAddToTimeline}
                onDurationLoaded={onMediaDurationLoaded}
              />
            ))}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => onAddMedia(e.target.files)}
      />
    </aside>
  )
}

export default MediaPanel
