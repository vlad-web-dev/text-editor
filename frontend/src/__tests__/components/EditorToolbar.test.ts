import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EditorToolbar from '@/components/memorial/EditorToolbar.vue'

// Chainable mock: editor?.chain().focus().<cmd>().run()
function makeEditorMock() {
  const run = vi.fn()
  const chain: Record<string, unknown> = {
    focus: () => chain,
    toggleBold: () => chain,
    toggleItalic: () => chain,
    toggleUnderline: () => chain,
    toggleBlockquote: () => chain,
    toggleHeading: () => chain,
    toggleBulletList: () => chain,
    toggleOrderedList: () => chain,
    toggleCodeBlock: () => chain,
    setFontSize: () => chain,
    setColor: () => chain,
    setLink: () => chain,
    unsetLink: () => chain,
    setTextAlign: () => chain,
    liftListItem: () => chain,
    sinkListItem: () => chain,
    setHorizontalRule: () => chain,
    clearNodes: () => chain,
    unsetAllMarks: () => chain,
    undo: () => chain,
    redo: () => chain,
    run,
  }
  return {
    isActive: vi.fn().mockReturnValue(false),
    chain: vi.fn().mockReturnValue(chain),
    _run: run,
  }
}

const wrappers: ReturnType<typeof mount>[] = []

function mountToolbar(editor: ReturnType<typeof makeEditorMock> | null = null) {
  const w = mount(EditorToolbar, {
    props: { editor },
    attachTo: document.body,
  })
  wrappers.push(w)
  return w
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  wrappers.forEach(w => w.unmount())
  wrappers.length = 0
})

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('rendering', () => {
  it('renders 3 dropdown trigger buttons', () => {
    const wrapper = mountToolbar()
    expect(wrapper.findAll('.editor-toolbar__btn--wide')).toHaveLength(3)
  })

  it('renders font size trigger button', () => {
    const wrapper = mountToolbar()
    expect(wrapper.find('[title="Font size"]').exists()).toBe(true)
  })

  it('font size dropdown is hidden by default', () => {
    mountToolbar()
    expect(document.querySelector('.editor-toolbar__dropdown')).toBeNull()
  })

  it('font size dropdown shows 6 options when opened', async () => {
    const wrapper = mountToolbar()
    await wrapper.find('[title="Font size"]').trigger('click')
    const items = document.querySelectorAll('.editor-toolbar__dropdown-item')
    expect(items).toHaveLength(6)
    expect(items[0].textContent).toBe('Small')
    expect(items[3].textContent).toBe('Heading 1')
  })

  it('renders Bold, Italic, Underline, Text color buttons', () => {
    const wrapper = mountToolbar()
    expect(wrapper.find('[title="Bold (Ctrl+B)"]').exists()).toBe(true)
    expect(wrapper.find('[title="Italic (Ctrl+I)"]').exists()).toBe(true)
    expect(wrapper.find('[title="Underline (Ctrl+U)"]').exists()).toBe(true)
    expect(wrapper.find('[title="Text color"]').exists()).toBe(true)
  })

  it('renders link and blockquote buttons', () => {
    const wrapper = mountToolbar()
    expect(wrapper.find('[title="Link"]').exists()).toBe(true)
    expect(wrapper.find('[title="Blockquote"]').exists()).toBe(true)
  })

  it('renders outdent, indent, hr buttons', () => {
    const wrapper = mountToolbar()
    expect(wrapper.find('[title="Decrease indent"]').exists()).toBe(true)
    expect(wrapper.find('[title="Increase indent"]').exists()).toBe(true)
    expect(wrapper.find('[title="Horizontal rule"]').exists()).toBe(true)
  })

  it('renders clear and code buttons', () => {
    const wrapper = mountToolbar()
    expect(wrapper.find('[title="Clear formatting"]').exists()).toBe(true)
    expect(wrapper.find('[title="Code block"]').exists()).toBe(true)
  })

  it('renders hidden color input', () => {
    const wrapper = mountToolbar()
    expect(wrapper.find('.editor-toolbar__color-input').exists()).toBe(true)
  })
})

// ─── Dropdown behaviour ───────────────────────────────────────────────────────

describe('dropdown behaviour', () => {
  it('opens font size dropdown on trigger click', async () => {
    const wrapper = mountToolbar()
    await wrapper.find('[title="Font size"]').trigger('click')
    expect(document.querySelector('.editor-toolbar__dropdown')).not.toBeNull()
  })

  it('closes font size dropdown after selecting an option', async () => {
    const wrapper = mountToolbar()
    await wrapper.find('[title="Font size"]').trigger('click')
    ;(document.querySelector('.editor-toolbar__dropdown-item') as HTMLElement).click()
    await wrapper.vm.$nextTick()
    expect(document.querySelector('.editor-toolbar__dropdown')).toBeNull()
  })

  it('opens alignment dropdown on trigger click', async () => {
    const wrapper = mountToolbar()
    await wrapper.find('[title="Text alignment"]').trigger('click')
    const items = document.querySelectorAll('.editor-toolbar__dropdown-item')
    expect(items.length).toBeGreaterThanOrEqual(4)
    expect(items[0].textContent).toBe('Left')
    expect(items[3].textContent).toBe('Justify')
  })

  it('opens list dropdown on trigger click', async () => {
    const wrapper = mountToolbar()
    await wrapper.find('[title="Lists"]').trigger('click')
    const items = document.querySelectorAll('.editor-toolbar__dropdown-item')
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toBe('Bullet list')
    expect(items[1].textContent).toBe('Ordered list')
  })

  it('opening a second dropdown closes the first', async () => {
    const wrapper = mountToolbar()
    await wrapper.find('[title="Font size"]').trigger('click')
    expect(document.querySelectorAll('.editor-toolbar__dropdown')).toHaveLength(1)

    await wrapper.find('[title="Text alignment"]').trigger('click')
    // Only alignment items (4), not font-size items (6)
    expect(document.querySelectorAll('.editor-toolbar__dropdown-item')).toHaveLength(4)
  })
})

// ─── Active state classes ─────────────────────────────────────────────────────

describe('active state classes', () => {
  it('adds --active to bold button when bold is active', async () => {
    const editor = makeEditorMock()
    editor.isActive.mockImplementation((arg: unknown) => arg === 'bold')
    const wrapper = mountToolbar(editor as never)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[title="Bold (Ctrl+B)"]').classes()).toContain('editor-toolbar__btn--active')
    expect(wrapper.find('[title="Italic (Ctrl+I)"]').classes()).not.toContain('editor-toolbar__btn--active')
  })

  it('adds --active to blockquote button when blockquote is active', async () => {
    const editor = makeEditorMock()
    editor.isActive.mockImplementation((arg: unknown) => arg === 'blockquote')
    const wrapper = mountToolbar(editor as never)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[title="Blockquote"]').classes()).toContain('editor-toolbar__btn--active')
  })

  it('adds --active to link button when link is active', async () => {
    const editor = makeEditorMock()
    editor.isActive.mockImplementation((arg: unknown) => arg === 'link')
    const wrapper = mountToolbar(editor as never)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[title="Link"]').classes()).toContain('editor-toolbar__btn--active')
  })
})

// ─── Button commands ──────────────────────────────────────────────────────────

describe('button commands', () => {
  it('calls toggleBold on B click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const toggleBold = vi.spyOn(chain as never, 'toggleBold').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Bold (Ctrl+B)"]').trigger('click')
    expect(toggleBold).toHaveBeenCalled()
  })

  it('calls toggleItalic on I click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const toggleItalic = vi.spyOn(chain as never, 'toggleItalic').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Italic (Ctrl+I)"]').trigger('click')
    expect(toggleItalic).toHaveBeenCalled()
  })

  it('calls toggleUnderline on U click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const toggleUnderline = vi.spyOn(chain as never, 'toggleUnderline').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Underline (Ctrl+U)"]').trigger('click')
    expect(toggleUnderline).toHaveBeenCalled()
  })

  it('calls setColor when color input fires', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const setColor = vi.spyOn(chain as never, 'setColor').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    const input = wrapper.find('.editor-toolbar__color-input')
    ;(input.element as HTMLInputElement).value = '#ff0000'
    await input.trigger('input')

    expect(setColor).toHaveBeenCalledWith('#ff0000')
  })

  it('calls setFontSize("14") when Normal font option clicked', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const setFontSize = vi.spyOn(chain as never, 'setFontSize').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Font size"]').trigger('click')
    ;(document.querySelectorAll('.editor-toolbar__dropdown-item')[1] as HTMLElement).click() // Normal = index 1
    await wrapper.vm.$nextTick()
    expect(setFontSize).toHaveBeenCalledWith('14')
  })

  it('calls toggleHeading({ level: 1 }) when H1 font option clicked', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const toggleHeading = vi.spyOn(chain as never, 'toggleHeading').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Font size"]').trigger('click')
    ;(document.querySelectorAll('.editor-toolbar__dropdown-item')[3] as HTMLElement).click() // H1 = index 3
    await wrapper.vm.$nextTick()
    expect(toggleHeading).toHaveBeenCalledWith({ level: 1 })
  })

  it('calls setLink with URL when link button clicked and no link active', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const setLink = vi.spyOn(chain as never, 'setLink').mockReturnValue(chain)
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('https://example.com'))
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Link"]').trigger('click')
    expect(setLink).toHaveBeenCalledWith({ href: 'https://example.com' })
  })

  it('calls unsetLink when link button clicked and link is already active', async () => {
    const editor = makeEditorMock()
    editor.isActive.mockImplementation((arg: unknown) => arg === 'link')
    const chain = editor.chain()
    const unsetLink = vi.spyOn(chain as never, 'unsetLink').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Link"]').trigger('click')
    expect(unsetLink).toHaveBeenCalled()
  })

  it('calls toggleBlockquote on blockquote click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const toggleBlockquote = vi.spyOn(chain as never, 'toggleBlockquote').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Blockquote"]').trigger('click')
    expect(toggleBlockquote).toHaveBeenCalled()
  })

  it('calls setTextAlign("center") when Center alignment option clicked', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const setTextAlign = vi.spyOn(chain as never, 'setTextAlign').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Text alignment"]').trigger('click')
    ;(document.querySelectorAll('.editor-toolbar__dropdown-item')[1] as HTMLElement).click() // Center = index 1
    await wrapper.vm.$nextTick()
    expect(setTextAlign).toHaveBeenCalledWith('center')
  })

  it('calls toggleBulletList when Bullet list option clicked', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const toggleBulletList = vi.spyOn(chain as never, 'toggleBulletList').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Lists"]').trigger('click')
    ;(document.querySelectorAll('.editor-toolbar__dropdown-item')[0] as HTMLElement).click() // Bullet = index 0
    await wrapper.vm.$nextTick()
    expect(toggleBulletList).toHaveBeenCalled()
  })

  it('calls liftListItem on outdent click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const liftListItem = vi.spyOn(chain as never, 'liftListItem').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Decrease indent"]').trigger('click')
    expect(liftListItem).toHaveBeenCalledWith('listItem')
  })

  it('calls sinkListItem on indent click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const sinkListItem = vi.spyOn(chain as never, 'sinkListItem').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Increase indent"]').trigger('click')
    expect(sinkListItem).toHaveBeenCalledWith('listItem')
  })

  it('calls setHorizontalRule on hr click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const setHorizontalRule = vi.spyOn(chain as never, 'setHorizontalRule').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Horizontal rule"]').trigger('click')
    expect(setHorizontalRule).toHaveBeenCalled()
  })

  it('calls clearNodes and unsetAllMarks on clear click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const clearNodes    = vi.spyOn(chain as never, 'clearNodes').mockReturnValue(chain)
    const unsetAllMarks = vi.spyOn(chain as never, 'unsetAllMarks').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Clear formatting"]').trigger('click')
    expect(clearNodes).toHaveBeenCalled()
    expect(unsetAllMarks).toHaveBeenCalled()
  })

  it('calls toggleCodeBlock on code click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const toggleCodeBlock = vi.spyOn(chain as never, 'toggleCodeBlock').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.find('[title="Code block"]').trigger('click')
    expect(toggleCodeBlock).toHaveBeenCalled()
  })
})

// ─── Null editor ─────────────────────────────────────────────────────────────

describe('null editor', () => {
  it('renders without errors when editor is null', () => {
    expect(() => mountToolbar(null)).not.toThrow()
  })

  it('does not throw when buttons are clicked with null editor', async () => {
    const wrapper = mountToolbar(null)
    const btn = wrapper.find('.editor-toolbar__btn')
    await expect(btn.trigger('click')).resolves.not.toThrow()
  })

  it('does not throw when link button is clicked with null editor', async () => {
    const wrapper = mountToolbar(null)
    await expect(wrapper.find('[title="Link"]').trigger('click')).resolves.not.toThrow()
  })
})
