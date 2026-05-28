import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as api from '@/services/api'
import type { Memorial } from '@/types/memorial'

const draftKey = (id: number) => `memorial_draft_${id}`

export const useAboutStore = defineStore('about', () => {
  const memorial = ref<Memorial | null>(null)
  const savedContent = ref('')
  const draftContent = ref<string | null>(null)
  const hasDraft = ref(false)
  const isEditing = ref(false)
  const isSaving = ref(false)
  const isDraftSaving = ref(false)
  const error = ref<string | null>(null)

  let draftTimer: ReturnType<typeof setTimeout> | null = null

  const currentContent = computed(() =>
    hasDraft.value && draftContent.value !== null ? draftContent.value : savedContent.value,
  )

  async function loadMemorial(id: number) {
    error.value = null
    try {
      const data = await api.getMemorial(id)
      memorial.value = data
      savedContent.value = data.aboutHtml

      // Check localStorage first — zero latency on refresh
      const localDraft = localStorage.getItem(draftKey(id))
      if (localDraft) {
        draftContent.value = localDraft
        hasDraft.value = true
        return
      }

      // Fallback: check backend draft
      try {
        const draft = await api.getDraft(id)
        draftContent.value = draft.contentHtml
        hasDraft.value = true
        localStorage.setItem(draftKey(id), draft.contentHtml)
      } catch {
        hasDraft.value = false
      }
    } catch {
      error.value = 'Failed to load memorial. Please refresh.'
    }
  }

  function startEditing() {
    isEditing.value = true
  }

  function stopEditing() {
    isEditing.value = false
  }

  async function saveContent(html: string) {
    if (!memorial.value) return
    isSaving.value = true
    error.value = null

    try {
      const updated = await api.patchAbout(memorial.value.id, html)
      savedContent.value = updated.aboutHtml
      draftContent.value = null
      hasDraft.value = false
      localStorage.removeItem(draftKey(memorial.value.id))
      // Best-effort backend draft cleanup
      api.deleteDraft(memorial.value.id).catch(() => undefined)
      stopEditing()
    } catch {
      error.value = 'Failed to save. Please try again.'
    } finally {
      isSaving.value = false
    }
  }

  // Cancel does NOT clear the draft — user may want to resume editing later
  function cancelEditing() {
    if (draftTimer) {
      clearTimeout(draftTimer)
      draftTimer = null
    }
    stopEditing()
  }

  function saveDraft(html: string) {
    if (!memorial.value) return
    const id = memorial.value.id

    if (draftTimer) clearTimeout(draftTimer)

    draftTimer = setTimeout(async () => {
      isDraftSaving.value = true
      draftContent.value = html
      hasDraft.value = true
      localStorage.setItem(draftKey(id), html)

      try {
        await api.postDraft(id, html)
      } catch {
        // Silent fail — localStorage already saved it
      } finally {
        isDraftSaving.value = false
      }
    }, 2000)
  }

  return {
    memorial,
    savedContent,
    draftContent,
    hasDraft,
    isEditing,
    isSaving,
    isDraftSaving,
    error,
    currentContent,
    loadMemorial,
    startEditing,
    stopEditing,
    saveContent,
    cancelEditing,
    saveDraft,
  }
})
