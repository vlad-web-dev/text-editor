import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent } from 'vue'
import AboutSection from '@/components/memorial/AboutSection.vue'
import { useAboutStore } from '@/stores/aboutStore'
import * as api from '@/services/api'
import type { Memorial } from '@/types/memorial'

vi.mock('@/services/api')

// Stub child components that depend on Tiptap (complex DOM environment).
// Must expose getHTML so AboutSection's Save path can call editorRef.value.getHTML().
const StubEditor = defineComponent({
  name: 'AboutEditor',
  props: { initialContent: { type: String, default: '' } },
  emits: ['change'],
  setup(props, { expose }) {
    expose({ getHTML: () => props.initialContent })
  },
  template: '<div class="stub-editor" />',
})

const StubMobileDialog = defineComponent({
  name: 'MobileEditorDialog',
  emits: ['save', 'cancel', 'change'],
  props: ['initialContent', 'isSaving'],
  template: '<div class="stub-mobile-dialog" />',
})

const mockMemorial: Memorial = {
  id: 1,
  name: 'Test Memorial',
  aboutHtml: '<p>About content</p>',
}

function mountSection() {
  return mount(AboutSection, {
    global: {
      plugins: [createPinia()],
      stubs: {
        AboutEditor: StubEditor,
        MobileEditorDialog: StubMobileDialog,
      },
    },
    attachTo: document.body,
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(api.getMemorial).mockResolvedValue(mockMemorial)
  vi.mocked(api.getDraft).mockRejectedValue({ response: { status: 404 } })
  vi.mocked(api.patchAbout).mockResolvedValue(mockMemorial)
  vi.mocked(api.deleteDraft).mockResolvedValue(undefined)
  vi.mocked(api.postDraft).mockResolvedValue({
    id: 1, memorialId: 1, contentHtml: '', updatedAt: '',
  })
})

// ─── Static view ─────────────────────────────────────────────────────────────

describe('static view', () => {
  it('renders saved content via v-html', async () => {
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()

    expect(wrapper.find('.about-section__content').html()).toContain('About content')
  })

  it('shows edit button in static view', async () => {
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()

    expect(wrapper.find('.about-section__edit-btn').exists()).toBe(true)
  })

  it('does not show editor in static view', async () => {
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()

    expect(wrapper.find('.stub-editor').exists()).toBe(false)
  })
})

// ─── Draft banner ─────────────────────────────────────────────────────────────

describe('draft banner', () => {
  it('shows draft banner when hasDraft and not editing', async () => {
    localStorage.setItem('memorial_draft_1', '<p>Draft</p>')
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()

    expect(wrapper.find('.about-section__draft-banner').exists()).toBe(true)
  })

  it('hides draft banner when not in draft state', async () => {
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()

    expect(wrapper.find('.about-section__draft-banner').exists()).toBe(false)
  })

  it('hides draft banner while editing (editor is visible instead)', async () => {
    localStorage.setItem('memorial_draft_1', '<p>Draft</p>')
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()

    store.startEditing()
    await flushPromises()

    expect(wrapper.find('.about-section__draft-banner').exists()).toBe(false)
  })

  it('applies draft modifier class to content when hasDraft', async () => {
    localStorage.setItem('memorial_draft_1', '<p>Draft</p>')
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()

    expect(wrapper.find('.about-section__content_draft').exists()).toBe(true)
  })
})

// ─── Edit mode (desktop) ──────────────────────────────────────────────────────

describe('edit mode', () => {
  it('switches to editor when edit button is clicked', async () => {
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()

    await wrapper.find('.about-section__edit-btn').trigger('click')

    expect(store.isEditing).toBe(true)
    expect(wrapper.find('.stub-editor').exists()).toBe(true)
    expect(wrapper.find('.about-section__content').exists()).toBe(false)
  })

  it('shows Save and Cancel buttons in edit mode', async () => {
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()
    store.startEditing()
    await flushPromises()

    const buttons = wrapper.findAll('.about-section__actions-btn')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].text()).toContain('Cancel')
    expect(buttons[1].text()).toContain('Save')
  })

  it('calls cancelEditing when Cancel is clicked', async () => {
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()
    store.startEditing()
    await flushPromises()

    const cancelBtn = wrapper.findAll('.about-section__actions-btn')[0]
    await cancelBtn.trigger('click')

    expect(store.isEditing).toBe(false)
  })

  it('calls saveContent with current content when Save is clicked', async () => {
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()
    // Simulate a draft being tracked in the store
    store.startEditing()
    await flushPromises()

    const saveBtn = wrapper.findAll('.about-section__actions-btn')[1]
    await saveBtn.trigger('click')
    await flushPromises()

    expect(api.patchAbout).toHaveBeenCalledWith(1, expect.any(String))
  })

  it('disables Save button while saving', async () => {
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()
    store.startEditing()
    // Manually set isSaving
    store.isSaving = true
    await flushPromises()

    const saveBtn = wrapper.findAll('.about-section__actions-btn')[1]
    expect(saveBtn.attributes('disabled')).toBeDefined()
  })

  it('shows error message when store has an error', async () => {
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()
    store.startEditing()
    store.error = 'Failed to save. Please try again.'
    await flushPromises()

    expect(wrapper.find('.about-section__error').text()).toContain('Failed to save')
  })

  it('passes draft content to editor when draft exists', async () => {
    localStorage.setItem('memorial_draft_1', '<p>Draft content</p>')
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()
    store.startEditing()
    await flushPromises()

    const editor = wrapper.findComponent(StubEditor)
    expect(editor.props('initialContent')).toBe('<p>Draft content</p>')
  })

  it('passes saved content to editor when no draft', async () => {
    const wrapper = mountSection()
    const store = useAboutStore()
    await store.loadMemorial(1)
    await flushPromises()
    store.startEditing()
    await flushPromises()

    const editor = wrapper.findComponent(StubEditor)
    expect(editor.props('initialContent')).toBe('<p>About content</p>')
  })
})
