import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAboutStore } from '@/stores/aboutStore'
import * as api from '@/services/api'
import type { Memorial, DraftResponse } from '@/types/memorial'

vi.mock('@/services/api')

const mockMemorial: Memorial = {
  id: 1,
  name: 'Test Memorial',
  aboutHtml: '<p>Original content</p>',
}

const mockDraft: DraftResponse = {
  id: 1,
  memorialId: 1,
  contentHtml: '<p>Draft content</p>',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(api.getMemorial).mockResolvedValue(mockMemorial)
  vi.mocked(api.getDraft).mockRejectedValue({ response: { status: 404 } })
  vi.mocked(api.postDraft).mockResolvedValue(mockDraft)
  vi.mocked(api.patchAbout).mockResolvedValue({ ...mockMemorial, aboutHtml: '<p>Saved</p>' })
  vi.mocked(api.deleteDraft).mockResolvedValue(undefined)
})

// ─── loadMemorial ─────────────────────────────────────────────────────────────

describe('loadMemorial', () => {
  it('fetches memorial and sets savedContent', async () => {
    const store = useAboutStore()
    await store.loadMemorial(1)

    expect(api.getMemorial).toHaveBeenCalledWith(1)
    expect(store.memorial).toEqual(mockMemorial)
    expect(store.savedContent).toBe('<p>Original content</p>')
  })

  it('sets hasDraft and draftContent from localStorage when draft exists', async () => {
    localStorage.setItem('memorial_draft_1', '<p>Local draft</p>')
    const store = useAboutStore()
    await store.loadMemorial(1)

    expect(store.hasDraft).toBe(true)
    expect(store.draftContent).toBe('<p>Local draft</p>')
    // Should NOT call backend draft endpoint when localStorage has a value
    expect(api.getDraft).not.toHaveBeenCalled()
  })

  it('falls back to backend draft when localStorage is empty', async () => {
    vi.mocked(api.getDraft).mockResolvedValue(mockDraft)
    const store = useAboutStore()
    await store.loadMemorial(1)

    expect(api.getDraft).toHaveBeenCalledWith(1)
    expect(store.hasDraft).toBe(true)
    expect(store.draftContent).toBe('<p>Draft content</p>')
    // Should also sync backend draft into localStorage
    expect(localStorage.getItem('memorial_draft_1')).toBe('<p>Draft content</p>')
  })

  it('sets hasDraft false when no draft exists anywhere', async () => {
    const store = useAboutStore()
    await store.loadMemorial(1)

    expect(store.hasDraft).toBe(false)
    expect(store.draftContent).toBeNull()
  })

  it('sets error when API call fails', async () => {
    vi.mocked(api.getMemorial).mockRejectedValue(new Error('Network error'))
    const store = useAboutStore()
    await store.loadMemorial(1)

    expect(store.error).toBe('Failed to load memorial. Please refresh.')
    expect(store.memorial).toBeNull()
  })
})

// ─── currentContent computed ──────────────────────────────────────────────────

describe('currentContent', () => {
  it('returns savedContent when no draft', async () => {
    const store = useAboutStore()
    await store.loadMemorial(1)

    expect(store.currentContent).toBe('<p>Original content</p>')
  })

  it('returns draftContent when hasDraft is true', async () => {
    localStorage.setItem('memorial_draft_1', '<p>Local draft</p>')
    const store = useAboutStore()
    await store.loadMemorial(1)

    expect(store.currentContent).toBe('<p>Local draft</p>')
  })
})

// ─── editing state ────────────────────────────────────────────────────────────

describe('startEditing / stopEditing', () => {
  it('toggles isEditing', () => {
    const store = useAboutStore()
    expect(store.isEditing).toBe(false)

    store.startEditing()
    expect(store.isEditing).toBe(true)

    store.stopEditing()
    expect(store.isEditing).toBe(false)
  })
})

// ─── cancelEditing ────────────────────────────────────────────────────────────

describe('cancelEditing', () => {
  it('stops editing', () => {
    const store = useAboutStore()
    store.startEditing()
    store.cancelEditing()

    expect(store.isEditing).toBe(false)
  })

  it('does NOT clear the draft', async () => {
    localStorage.setItem('memorial_draft_1', '<p>Local draft</p>')
    const store = useAboutStore()
    await store.loadMemorial(1)
    store.startEditing()
    store.cancelEditing()

    expect(store.hasDraft).toBe(true)
    expect(store.draftContent).toBe('<p>Local draft</p>')
    expect(localStorage.getItem('memorial_draft_1')).toBe('<p>Local draft</p>')
  })

  it('cancels a pending debounced draft save', async () => {
    vi.useFakeTimers()
    const store = useAboutStore()
    await store.loadMemorial(1)
    store.startEditing()

    store.saveDraft('<p>Typing…</p>')
    store.cancelEditing()

    // Advance past the debounce — draft save should NOT fire
    vi.advanceTimersByTime(3000)
    expect(api.postDraft).not.toHaveBeenCalled()

    vi.useRealTimers()
  })
})

// ─── saveDraft ────────────────────────────────────────────────────────────────

describe('saveDraft', () => {
  it('debounces — does not save immediately', async () => {
    vi.useFakeTimers()
    const store = useAboutStore()
    await store.loadMemorial(1)

    store.saveDraft('<p>Draft</p>')
    expect(api.postDraft).not.toHaveBeenCalled()
    expect(localStorage.getItem('memorial_draft_1')).toBeNull()

    vi.useRealTimers()
  })

  it('saves to localStorage and API after 2 seconds', async () => {
    vi.useFakeTimers()
    const store = useAboutStore()
    await store.loadMemorial(1)

    store.saveDraft('<p>Draft</p>')
    await vi.advanceTimersByTimeAsync(2000)

    expect(localStorage.getItem('memorial_draft_1')).toBe('<p>Draft</p>')
    expect(api.postDraft).toHaveBeenCalledWith(1, '<p>Draft</p>')
    expect(store.hasDraft).toBe(true)
    expect(store.draftContent).toBe('<p>Draft</p>')

    vi.useRealTimers()
  })

  it('resets the timer on each call (debounce resets)', async () => {
    vi.useFakeTimers()
    const store = useAboutStore()
    await store.loadMemorial(1)

    store.saveDraft('<p>First</p>')
    vi.advanceTimersByTime(1500)
    store.saveDraft('<p>Second</p>') // resets the 2s window
    vi.advanceTimersByTime(1500)     // only 1.5s after the second call
    expect(api.postDraft).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(500) // now 2s since second call
    expect(api.postDraft).toHaveBeenCalledTimes(1)
    expect(api.postDraft).toHaveBeenCalledWith(1, '<p>Second</p>')

    vi.useRealTimers()
  })

  it('silently ignores API failure (localStorage already persisted)', async () => {
    vi.useFakeTimers()
    vi.mocked(api.postDraft).mockRejectedValue(new Error('Network error'))
    const store = useAboutStore()
    await store.loadMemorial(1)

    store.saveDraft('<p>Draft</p>')
    await vi.advanceTimersByTimeAsync(2000)

    // localStorage was saved, no error surfaced
    expect(localStorage.getItem('memorial_draft_1')).toBe('<p>Draft</p>')
    expect(store.error).toBeNull()

    vi.useRealTimers()
  })
})

// ─── saveContent ─────────────────────────────────────────────────────────────

describe('saveContent', () => {
  it('calls patchAbout and updates savedContent', async () => {
    const store = useAboutStore()
    await store.loadMemorial(1)
    store.startEditing()

    await store.saveContent('<p>Saved</p>')

    expect(api.patchAbout).toHaveBeenCalledWith(1, '<p>Saved</p>')
    expect(store.savedContent).toBe('<p>Saved</p>')
  })

  it('clears draft from store and localStorage on save', async () => {
    localStorage.setItem('memorial_draft_1', '<p>Draft</p>')
    const store = useAboutStore()
    await store.loadMemorial(1)
    store.startEditing()

    await store.saveContent('<p>Saved</p>')

    expect(store.hasDraft).toBe(false)
    expect(store.draftContent).toBeNull()
    expect(localStorage.getItem('memorial_draft_1')).toBeNull()
  })

  it('calls deleteDraft API on save', async () => {
    const store = useAboutStore()
    await store.loadMemorial(1)
    await store.saveContent('<p>Saved</p>')

    expect(api.deleteDraft).toHaveBeenCalledWith(1)
  })

  it('exits edit mode on successful save', async () => {
    const store = useAboutStore()
    await store.loadMemorial(1)
    store.startEditing()
    await store.saveContent('<p>Saved</p>')

    expect(store.isEditing).toBe(false)
  })

  it('sets error and stays in edit mode on API failure', async () => {
    vi.mocked(api.patchAbout).mockRejectedValue(new Error('Network error'))
    const store = useAboutStore()
    await store.loadMemorial(1)
    store.startEditing()

    await store.saveContent('<p>Saved</p>')

    expect(store.error).toBe('Failed to save. Please try again.')
    expect(store.isEditing).toBe(true)
  })

  it('sets isSaving to false even after failure', async () => {
    vi.mocked(api.patchAbout).mockRejectedValue(new Error('Network error'))
    const store = useAboutStore()
    await store.loadMemorial(1)

    await store.saveContent('<p>Saved</p>')

    expect(store.isSaving).toBe(false)
  })

  it('does nothing when no memorial is loaded', async () => {
    const store = useAboutStore()
    await store.saveContent('<p>Saved</p>')

    expect(api.patchAbout).not.toHaveBeenCalled()
  })
})
