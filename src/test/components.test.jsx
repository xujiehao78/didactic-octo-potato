import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toolbar from '../components/Toolbar.jsx'
import StatusBar from '../components/StatusBar.jsx'
import PropertiesPanel from '../components/PropertiesPanel.jsx'

// Mock crypto.randomUUID
beforeEach(() => {
  vi.stubGlobal('crypto', {
    randomUUID: () => Math.random().toString(36).slice(2),
  })
})

describe('Toolbar', () => {
  it('renders brand name', () => {
    render(
      <Toolbar
        tool="select"
        onToolChange={() => {}}
        onExport={() => {}}
        hasClips={false}
        onSplit={() => {}}
        onDelete={() => {}}
        selectedClip={null}
      />
    )
    expect(screen.getByText('视频剪辑')).toBeInTheDocument()
  })

  it('shows all tools', () => {
    render(
      <Toolbar
        tool="select"
        onToolChange={() => {}}
        onExport={() => {}}
        hasClips={false}
        onSplit={() => {}}
        onDelete={() => {}}
        selectedClip={null}
      />
    )
    expect(screen.getByText('选择工具')).toBeInTheDocument()
    expect(screen.getByText('切割工具')).toBeInTheDocument()
    expect(screen.getByText('文字工具')).toBeInTheDocument()
  })

  it('export button is disabled when no clips', () => {
    render(
      <Toolbar
        tool="select"
        onToolChange={() => {}}
        onExport={() => {}}
        hasClips={false}
        onSplit={() => {}}
        onDelete={() => {}}
        selectedClip={null}
      />
    )
    expect(screen.getByText('⬇ 导出')).toBeDisabled()
  })

  it('export button enabled when clips exist', () => {
    render(
      <Toolbar
        tool="select"
        onToolChange={() => {}}
        onExport={() => {}}
        hasClips={true}
        onSplit={() => {}}
        onDelete={() => {}}
        selectedClip={null}
      />
    )
    expect(screen.getByText('⬇ 导出')).not.toBeDisabled()
  })

  it('calls onToolChange when tool clicked', async () => {
    const user = userEvent.setup()
    const onToolChange = vi.fn()
    render(
      <Toolbar
        tool="select"
        onToolChange={onToolChange}
        onExport={() => {}}
        hasClips={false}
        onSplit={() => {}}
        onDelete={() => {}}
        selectedClip={null}
      />
    )
    await user.click(screen.getByText('切割工具'))
    expect(onToolChange).toHaveBeenCalledWith('cut')
  })

  it('delete and split disabled when no clip selected', () => {
    render(
      <Toolbar
        tool="select"
        onToolChange={() => {}}
        onExport={() => {}}
        hasClips={true}
        onSplit={() => {}}
        onDelete={() => {}}
        selectedClip={null}
      />
    )
    expect(screen.getByText('⚡ 分割')).toBeDisabled()
    expect(screen.getByText('🗑 删除')).toBeDisabled()
  })
})

describe('StatusBar', () => {
  it('renders time code and total duration', () => {
    render(
      <StatusBar
        currentTime={65.5}
        totalDuration={120}
        clipCount={3}
        zoom={50}
      />
    )
    expect(screen.getByText('01:05:12')).toBeInTheDocument()
    expect(screen.getByText('02:00:00')).toBeInTheDocument()
  })

  it('shows clip count and zoom', () => {
    render(
      <StatusBar
        currentTime={0}
        totalDuration={0}
        clipCount={5}
        zoom={75}
      />
    )
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })
})

describe('PropertiesPanel', () => {
  it('shows placeholder when no clip selected', () => {
    render(
      <PropertiesPanel
        clip={null}
        onUpdateClip={() => {}}
        onDeleteClip={() => {}}
      />
    )
    expect(screen.getByText('选择一个片段')).toBeInTheDocument()
  })

  it('shows clip properties when clip is selected', () => {
    const clip = {
      id: 'clip-1',
      name: 'test-video.mp4',
      duration: 30,
      startTime: 0,
      endTime: 30,
      trimStart: 0,
      trimEnd: 30,
      opacity: 1,
      textOverlays: [],
    }
    render(
      <PropertiesPanel
        clip={clip}
        onUpdateClip={() => {}}
        onDeleteClip={() => {}}
      />
    )
    expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
    expect(screen.getByText('00:30')).toBeInTheDocument()
  })

  it('calls onDeleteClip when delete button clicked', async () => {
    const user = userEvent.setup()
    const onDeleteClip = vi.fn()
    const clip = {
      id: 'clip-1',
      name: 'test.mp4',
      duration: 10,
      startTime: 0,
      endTime: 10,
      trimStart: 0,
      trimEnd: 10,
      opacity: 1,
      textOverlays: [],
    }
    render(
      <PropertiesPanel
        clip={clip}
        onUpdateClip={() => {}}
        onDeleteClip={onDeleteClip}
      />
    )
    await user.click(screen.getByText('🗑 删除此片段'))
    expect(onDeleteClip).toHaveBeenCalledWith('clip-1')
  })

  it('can add a text overlay', async () => {
    const user = userEvent.setup()
    const onUpdateClip = vi.fn()
    const clip = {
      id: 'clip-1',
      name: 'test.mp4',
      duration: 10,
      startTime: 0,
      endTime: 10,
      trimStart: 0,
      trimEnd: 10,
      opacity: 1,
      textOverlays: [],
    }
    render(
      <PropertiesPanel
        clip={clip}
        onUpdateClip={onUpdateClip}
        onDeleteClip={() => {}}
      />
    )
    const input = screen.getByPlaceholderText('输入文字...')
    await user.type(input, '标题文字')
    await user.click(screen.getByText('+ 添加文字'))
    expect(onUpdateClip).toHaveBeenCalledWith(
      'clip-1',
      expect.objectContaining({
        textOverlays: expect.arrayContaining([
          expect.objectContaining({ text: '标题文字' }),
        ]),
      })
    )
  })
})
