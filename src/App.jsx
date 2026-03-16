import { useState, useRef, useCallback } from 'react'
import Toolbar from './components/Toolbar.jsx'
import MediaPanel from './components/MediaPanel.jsx'
import PreviewPlayer from './components/PreviewPlayer.jsx'
import PropertiesPanel from './components/PropertiesPanel.jsx'
import Timeline from './components/Timeline.jsx'
import StatusBar from './components/StatusBar.jsx'
import './App.css'

function App() {
  const [mediaFiles, setMediaFiles] = useState([])
  const [clips, setClips] = useState([])
  const [selectedClipId, setSelectedClipId] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [totalDuration, setTotalDuration] = useState(0)
  const [zoom, setZoom] = useState(50)
  const [tool, setTool] = useState('select') // select | cut | text
  const videoRef = useRef(null)

  const selectedClip = clips.find((c) => c.id === selectedClipId) || null

  const handleAddMedia = useCallback((files) => {
    const newMedia = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      file,
      url: URL.createObjectURL(file),
      duration: 0,
      thumbnail: null,
    }))
    setMediaFiles((prev) => [...prev, ...newMedia])
  }, [])

  const handleMediaDurationLoaded = useCallback((mediaId, duration, thumbnail) => {
    setMediaFiles((prev) =>
      prev.map((m) => (m.id === mediaId ? { ...m, duration, thumbnail } : m))
    )
  }, [])

  const handleAddToTimeline = useCallback((media) => {
    const startTime = totalDuration
    const newClip = {
      id: crypto.randomUUID(),
      mediaId: media.id,
      name: media.name,
      url: media.url,
      file: media.file,
      startTime,
      endTime: startTime + media.duration,
      trimStart: 0,
      trimEnd: media.duration,
      duration: media.duration,
      mediaDuration: media.duration,
      track: 0,
      type: 'video',
      opacity: 1,
      textOverlays: [],
    }
    setClips((prev) => {
      const updated = [...prev, newClip]
      setTotalDuration(updated.reduce((max, c) => Math.max(max, c.endTime), 0))
      return updated
    })
    setSelectedClipId(newClip.id)
  }, [totalDuration])

  const handleSelectClip = useCallback((clipId) => {
    setSelectedClipId(clipId)
    const clip = clips.find((c) => c.id === clipId)
    if (clip) {
      setCurrentTime(clip.startTime)
    }
  }, [clips])

  const handleUpdateClip = useCallback((clipId, updates) => {
    setClips((prev) => {
      const updated = prev.map((c) => (c.id === clipId ? { ...c, ...updates } : c))
      setTotalDuration(updated.reduce((max, c) => Math.max(max, c.endTime), 0))
      return updated
    })
  }, [])

  const handleDeleteClip = useCallback((clipId) => {
    setClips((prev) => {
      const updated = prev.filter((c) => c.id !== clipId)
      setTotalDuration(updated.reduce((max, c) => Math.max(max, c.endTime), 0))
      return updated
    })
    if (selectedClipId === clipId) setSelectedClipId(null)
  }, [selectedClipId])

  const handleSplitClip = useCallback((clipId) => {
    const clip = clips.find((c) => c.id === clipId)
    if (!clip || currentTime <= clip.startTime || currentTime >= clip.endTime) return
    const splitPoint = currentTime - clip.startTime
    const clipA = {
      ...clip,
      id: crypto.randomUUID(),
      endTime: currentTime,
      trimEnd: clip.trimStart + splitPoint,
      duration: splitPoint,
    }
    const clipB = {
      ...clip,
      id: crypto.randomUUID(),
      startTime: currentTime,
      trimStart: clip.trimStart + splitPoint,
      duration: clip.endTime - currentTime,
    }
    setClips((prev) => {
      const updated = prev.filter((c) => c.id !== clipId)
      updated.push(clipA, clipB)
      updated.sort((a, b) => a.startTime - b.startTime)
      setTotalDuration(updated.reduce((max, c) => Math.max(max, c.endTime), 0))
      return updated
    })
    setSelectedClipId(clipA.id)
  }, [clips, currentTime])

  const handleMoveClip = useCallback((clipId, newStartTime) => {
    setClips((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== clipId) return c
        const clamped = Math.max(0, newStartTime)
        return { ...c, startTime: clamped, endTime: clamped + c.duration }
      })
      setTotalDuration(updated.reduce((max, c) => Math.max(max, c.endTime), 0))
      return updated
    })
  }, [])

  const handleExport = useCallback(() => {
    // Create a simple export simulation with canvas
    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1080
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#fff'
    ctx.font = '48px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('视频导出功能需要服务端支持', canvas.width / 2, canvas.height / 2)
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'export-preview.png'
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [])

  return (
    <div className="app">
      <Toolbar
        tool={tool}
        onToolChange={setTool}
        onExport={handleExport}
        hasClips={clips.length > 0}
        onSplit={() => selectedClipId && handleSplitClip(selectedClipId)}
        onDelete={() => selectedClipId && handleDeleteClip(selectedClipId)}
        selectedClip={selectedClip}
      />
      <div className="workspace">
        <MediaPanel
          mediaFiles={mediaFiles}
          onAddMedia={handleAddMedia}
          onMediaDurationLoaded={handleMediaDurationLoaded}
          onAddToTimeline={handleAddToTimeline}
        />
        <div className="center-panel">
          <PreviewPlayer
            clips={clips}
            currentTime={currentTime}
            playing={playing}
            totalDuration={totalDuration}
            onTimeUpdate={setCurrentTime}
            onPlayingChange={setPlaying}
            videoRef={videoRef}
          />
        </div>
        <PropertiesPanel
          clip={selectedClip}
          onUpdateClip={handleUpdateClip}
          onDeleteClip={handleDeleteClip}
        />
      </div>
      <Timeline
        clips={clips}
        currentTime={currentTime}
        totalDuration={totalDuration}
        zoom={zoom}
        tool={tool}
        selectedClipId={selectedClipId}
        playing={playing}
        onSelectClip={handleSelectClip}
        onTimeChange={setCurrentTime}
        onMoveClip={handleMoveClip}
        onDeleteClip={handleDeleteClip}
        onSplitClip={handleSplitClip}
        onZoomChange={setZoom}
        onPlayingChange={setPlaying}
      />
      <StatusBar
        currentTime={currentTime}
        totalDuration={totalDuration}
        clipCount={clips.length}
        zoom={zoom}
      />
    </div>
  )
}

export default App
