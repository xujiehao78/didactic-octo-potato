import './Toolbar.css'

const TOOLS = [
  { id: 'select', icon: '↖', label: '选择工具' },
  { id: 'cut', icon: '✂', label: '切割工具' },
  { id: 'text', icon: 'T', label: '文字工具' },
]

function Toolbar({ tool, onToolChange, onExport, hasClips, onSplit, onDelete, selectedClip }) {
  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <span className="toolbar-logo">🎬</span>
        <span className="toolbar-title">视频剪辑</span>
      </div>
      <div className="toolbar-tools">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={`tool-btn ${tool === t.id ? 'active' : ''}`}
            onClick={() => onToolChange(t.id)}
            title={t.label}
          >
            <span className="tool-icon">{t.icon}</span>
            <span className="tool-label">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-actions">
        <button
          className="action-btn"
          onClick={onSplit}
          disabled={!selectedClip}
          title="在播放头处分割片段"
        >
          ⚡ 分割
        </button>
        <button
          className="action-btn danger"
          onClick={onDelete}
          disabled={!selectedClip}
          title="删除选中片段"
        >
          🗑 删除
        </button>
      </div>
      <div className="toolbar-spacer" />
      <div className="toolbar-right">
        <button
          className="export-btn"
          onClick={onExport}
          disabled={!hasClips}
          title="导出视频"
        >
          ⬇ 导出
        </button>
      </div>
    </header>
  )
}

export default Toolbar
