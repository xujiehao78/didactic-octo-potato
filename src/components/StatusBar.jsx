import './StatusBar.css'

function formatTime(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  const frames = Math.floor((secs % 1) * 25)
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(frames).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(frames).padStart(2, '0')}`
}

function StatusBar({ currentTime, totalDuration, clipCount, zoom }) {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">
          <span className="status-label">时间码:</span>
          <span className="status-value">{formatTime(currentTime)}</span>
        </span>
        <span className="status-sep">|</span>
        <span className="status-item">
          <span className="status-label">总时长:</span>
          <span className="status-value">{formatTime(totalDuration)}</span>
        </span>
      </div>
      <div className="status-center">
        视频剪辑 PC版 — 专业视频编辑器
      </div>
      <div className="status-right">
        <span className="status-item">
          <span className="status-label">片段数:</span>
          <span className="status-value">{clipCount}</span>
        </span>
        <span className="status-sep">|</span>
        <span className="status-item">
          <span className="status-label">缩放:</span>
          <span className="status-value">{zoom}%</span>
        </span>
        <span className="status-sep">|</span>
        <span className="status-item">
          <span className="status-value">25 fps</span>
        </span>
      </div>
    </div>
  )
}

export default StatusBar
