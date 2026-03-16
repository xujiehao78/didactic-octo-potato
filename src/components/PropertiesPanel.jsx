import { useState } from 'react'
import './PropertiesPanel.css'

function PropertiesPanel({ clip, onUpdateClip, onDeleteClip }) {
  const [newOverlayText, setNewOverlayText] = useState('')
  const [overlayTime, setOverlayTime] = useState(0)
  const [overlayDuration, setOverlayDuration] = useState(3)
  const [overlaySize, setOverlaySize] = useState(32)
  const [overlayColor, setOverlayColor] = useState('#ffffff')

  if (!clip) {
    return (
      <aside className="properties-panel">
        <div className="panel-header">
          <span className="panel-title">属性</span>
        </div>
        <div className="properties-empty">
          <span>选择一个片段</span>
          <span className="properties-empty-sub">以编辑属性</span>
        </div>
      </aside>
    )
  }

  const handleTrimStartChange = (val) => {
    const trimStart = parseFloat(val)
    if (trimStart >= clip.trimEnd) return
    const newDuration = clip.trimEnd - trimStart
    onUpdateClip(clip.id, {
      trimStart,
      duration: newDuration,
      endTime: clip.startTime + newDuration,
    })
  }

  const handleTrimEndChange = (val) => {
    const trimEnd = parseFloat(val)
    if (trimEnd <= clip.trimStart) return
    const newDuration = trimEnd - clip.trimStart
    onUpdateClip(clip.id, {
      trimEnd,
      duration: newDuration,
      endTime: clip.startTime + newDuration,
    })
  }

  const handleOpacityChange = (val) => {
    onUpdateClip(clip.id, { opacity: parseFloat(val) })
  }

  const handleAddOverlay = () => {
    if (!newOverlayText.trim()) return
    const overlay = {
      id: crypto.randomUUID(),
      text: newOverlayText.trim(),
      time: parseFloat(overlayTime),
      duration: parseFloat(overlayDuration),
      fontSize: parseInt(overlaySize),
      color: overlayColor,
      x: 50,
      y: 80,
    }
    onUpdateClip(clip.id, {
      textOverlays: [...(clip.textOverlays || []), overlay],
    })
    setNewOverlayText('')
  }

  const handleRemoveOverlay = (overlayId) => {
    onUpdateClip(clip.id, {
      textOverlays: (clip.textOverlays || []).filter((o) => o.id !== overlayId),
    })
  }

  const formatDuration = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  return (
    <aside className="properties-panel">
      <div className="panel-header">
        <span className="panel-title">属性</span>
      </div>
      <div className="properties-content">
        <div className="prop-section">
          <div className="prop-section-title">片段信息</div>
          <div className="prop-row">
            <span className="prop-label">名称</span>
            <span className="prop-value">{clip.name}</span>
          </div>
          <div className="prop-row">
            <span className="prop-label">时长</span>
            <span className="prop-value">{formatDuration(clip.duration)}</span>
          </div>
          <div className="prop-row">
            <span className="prop-label">起点</span>
            <span className="prop-value">{formatDuration(clip.startTime)}</span>
          </div>
        </div>

        <div className="prop-section">
          <div className="prop-section-title">裁剪</div>
          <div className="prop-field">
            <label className="prop-field-label">
              开始点: {clip.trimStart.toFixed(1)}s
            </label>
            <input
              type="range"
              min={0}
              max={clip.trimEnd}
              step={0.1}
              value={clip.trimStart}
              onChange={(e) => handleTrimStartChange(e.target.value)}
            />
          </div>
          <div className="prop-field">
            <label className="prop-field-label">
              结束点: {clip.trimEnd.toFixed(1)}s
            </label>
            <input
              type="range"
              min={clip.trimStart}
              max={clip.mediaDuration ?? clip.trimEnd}
              step={0.1}
              value={clip.trimEnd}
              onChange={(e) => handleTrimEndChange(e.target.value)}
            />
          </div>
        </div>

        <div className="prop-section">
          <div className="prop-section-title">透明度</div>
          <div className="prop-field">
            <label className="prop-field-label">
              {Math.round((clip.opacity ?? 1) * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={clip.opacity ?? 1}
              onChange={(e) => handleOpacityChange(e.target.value)}
            />
          </div>
        </div>

        <div className="prop-section">
          <div className="prop-section-title">文字叠加</div>
          <div className="overlay-form">
            <input
              className="overlay-input"
              type="text"
              placeholder="输入文字..."
              value={newOverlayText}
              onChange={(e) => setNewOverlayText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddOverlay()}
            />
            <div className="overlay-opts">
              <div className="overlay-opt-field">
                <span>出现时间</span>
                <input
                  type="number"
                  min={0}
                  max={clip.duration}
                  step={0.5}
                  value={overlayTime}
                  onChange={(e) => setOverlayTime(e.target.value)}
                  className="overlay-num"
                />
                <span>s</span>
              </div>
              <div className="overlay-opt-field">
                <span>持续</span>
                <input
                  type="number"
                  min={0.5}
                  max={clip.duration}
                  step={0.5}
                  value={overlayDuration}
                  onChange={(e) => setOverlayDuration(e.target.value)}
                  className="overlay-num"
                />
                <span>s</span>
              </div>
              <div className="overlay-opt-field">
                <span>字号</span>
                <input
                  type="number"
                  min={12}
                  max={120}
                  step={2}
                  value={overlaySize}
                  onChange={(e) => setOverlaySize(e.target.value)}
                  className="overlay-num"
                />
              </div>
              <div className="overlay-opt-field">
                <span>颜色</span>
                <input
                  type="color"
                  value={overlayColor}
                  onChange={(e) => setOverlayColor(e.target.value)}
                  className="overlay-color"
                />
              </div>
            </div>
            <button className="overlay-add-btn" onClick={handleAddOverlay}>
              + 添加文字
            </button>
          </div>
          {(clip.textOverlays || []).length > 0 && (
            <div className="overlay-list">
              {(clip.textOverlays || []).map((o) => (
                <div key={o.id} className="overlay-item">
                  <span className="overlay-text">{o.text}</span>
                  <span className="overlay-meta">{o.time}s</span>
                  <button
                    className="overlay-del"
                    onClick={() => handleRemoveOverlay(o.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="prop-section">
          <button
            className="delete-clip-btn"
            onClick={() => onDeleteClip(clip.id)}
          >
            🗑 删除此片段
          </button>
        </div>
      </div>
    </aside>
  )
}

export default PropertiesPanel
