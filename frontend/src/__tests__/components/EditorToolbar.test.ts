import { describe, it, expect, vi, beforeEach } from 'vitest'
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
    run,
  }
  return {
    isActive: vi.fn().mockReturnValue(false),
    chain: vi.fn().mockReturnValue(chain),
    _run: run,
  }
}

function mountToolbar(editor: ReturnType<typeof makeEditorMock> | null = null) {
  return mount(EditorToolbar, {
    props: { editor },
    attachTo: document.body,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// Groups: [0] formatting (Aa▾ B I U A), [1] insert (⛓ ❝), [2] structure (≡▾ ☰▾ ⇤ ⇥ —), [3] utility (✕ <>)

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('rendering', () => {
  it('renders 4 toolbar groups', () => {
    const wrapper = mountToolbar()
    expect(wrapper.findAll('.editor-toolbar__group')).toHaveLength(4)
  })

  it('renders font size trigger button', () => {
    const wrapper = mountToolbar()
    expect(wrapper.find('.editor-toolbar__fontsize-btn').exists()).toBe(true)
  })

  it('font size dropdown is hidden by default', () => {
    const wrapper = mountToolbar()
    expect(wrapper.find('.editor-toolbar__dropdown').exists()).toBe(false)
  })

  it('font size dropdown shows 6 options when opened', async () => {
    const wrapper = mountToolbar()
    const fontsizeBtn = wrapper.findAll('.editor-toolbar__fontsize-btn')[0]
    await fontsizeBtn.trigger('click')
    const items = wrapper.findAll('.editor-toolbar__dropdown-item')
    expect(items).toHaveLength(6)
    expect(items[0].text()).toBe('Small')
    expect(items[3].text()).toBe('Heading 1')
  })

  it('renders B, I, U, A buttons in formatting group', () => {
    const wrapper = mountToolbar()
    const formatBtns = wrapper.findAll('.editor-toolbar__group')[0].findAll('.editor-toolbar__btn')
    expect(formatBtns).toHaveLength(4)
  })

  it('renders link and blockquote buttons in insert group', () => {
    const wrapper = mountToolbar()
    const insertBtns = wrapper.findAll('.editor-toolbar__group')[1].findAll('.editor-toolbar__btn')
    expect(insertBtns).toHaveLength(2)
  })

  it('renders outdent, indent, hr buttons in structure group', () => {
    const wrapper = mountToolbar()
    const structureBtns = wrapper.findAll('.editor-toolbar__group')[2].findAll('.editor-toolbar__btn')
    expect(structureBtns).toHaveLength(3)
  })

  it('renders clear and code buttons in utility group', () => {
    const wrapper = mountToolbar()
    const utilityBtns = wrapper.findAll('.editor-toolbar__group')[3].findAll('.editor-toolbar__btn')
    expect(utilityBtns).toHaveLength(2)
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
    await wrapper.findAll('.editor-toolbar__fontsize-btn')[0].trigger('click')
    expect(wrapper.find('.editor-toolbar__dropdown').exists()).toBe(true)
  })

  it('closes font size dropdown after selecting an option', async () => {
    const wrapper = mountToolbar()
    await wrapper.findAll('.editor-toolbar__fontsize-btn')[0].trigger('click')
    await wrapper.findAll('.editor-toolbar__dropdown-item')[0].trigger('click')
    expect(wrapper.find('.editor-toolbar__dropdown').exists()).toBe(false)
  })

  it('opens alignment dropdown on trigger click', async () => {
    const wrapper = mountToolbar()
    // align trigger is the second __fontsize-btn (index 1)
    await wrapper.findAll('.editor-toolbar__fontsize-btn')[1].trigger('click')
    const items = wrapper.findAll('.editor-toolbar__dropdown-item')
    expect(items.length).toBeGreaterThanOrEqual(4)
    expect(items[0].text()).toBe('Left')
    expect(items[3].text()).toBe('Justify')
  })

  it('opens list dropdown on trigger click', async () => {
    const wrapper = mountToolbar()
    // list trigger is the third __fontsize-btn (index 2)
    await wrapper.findAll('.editor-toolbar__fontsize-btn')[2].trigger('click')
    const items = wrapper.findAll('.editor-toolbar__dropdown-item')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toBe('Bullet list')
    expect(items[1].text()).toBe('Ordered list')
  })

  it('opening a second dropdown closes the first', async () => {
    const wrapper = mountToolbar()
    await wrapper.findAll('.editor-toolbar__fontsize-btn')[0].trigger('click')
    expect(wrapper.find('.editor-toolbar__dropdown').exists()).toBe(true)

    // Open align dropdown — font size should close
    await wrapper.findAll('.editor-toolbar__fontsize-btn')[1].trigger('click')
    const items = wrapper.findAll('.editor-toolbar__dropdown-item')
    // Only alignment items visible (4), not font-size items (6)
    expect(items).toHaveLength(4)
  })
})

// ─── Active state classes ─────────────────────────────────────────────────────

describe('active state classes', () => {
  it('adds _active to bold button when bold is active', async () => {
    const editor = makeEditorMock()
    editor.isActive.mockImplementation((arg: unknown) => arg === 'bold')
    const wrapper = mountToolbar(editor as never)
    await wrapper.vm.$nextTick()

    // group[0]: [B=0, I=1, U=2, A=3]
    const btns = wrapper.findAll('.editor-toolbar__group')[0].findAll('.editor-toolbar__btn')
    expect(btns[0].classes()).toContain('editor-toolbar__btn_active')
    expect(btns[1].classes()).not.toContain('editor-toolbar__btn_active')
  })

  it('adds _active to blockquote button when blockquote is active', async () => {
    const editor = makeEditorMock()
    editor.isActive.mockImplementation((arg: unknown) => arg === 'blockquote')
    const wrapper = mountToolbar(editor as never)
    await wrapper.vm.$nextTick()

    // group[1]: [link=0, blockquote=1]
    const btns = wrapper.findAll('.editor-toolbar__group')[1].findAll('.editor-toolbar__btn')
    expect(btns[1].classes()).toContain('editor-toolbar__btn_active')
  })

  it('adds _active to link button when link is active', async () => {
    const editor = makeEditorMock()
    editor.isActive.mockImplementation((arg: unknown) => arg === 'link')
    const wrapper = mountToolbar(editor as never)
    await wrapper.vm.$nextTick()

    const btns = wrapper.findAll('.editor-toolbar__group')[1].findAll('.editor-toolbar__btn')
    expect(btns[0].classes()).toContain('editor-toolbar__btn_active')
  })
})

// ─── Button commands ──────────────────────────────────────────────────────────

describe('button commands', () => {
  it('calls toggleBold on B click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const toggleBold = vi.spyOn(chain as never, 'toggleBold').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    const btns = wrapper.findAll('.editor-toolbar__group')[0].findAll('.editor-toolbar__btn')
    await btns[0].trigger('click')
    expect(toggleBold).toHaveBeenCalled()
  })

  it('calls toggleItalic on I click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const toggleItalic = vi.spyOn(chain as never, 'toggleItalic').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    const btns = wrapper.findAll('.editor-toolbar__group')[0].findAll('.editor-toolbar__btn')
    await btns[1].trigger('click')
    expect(toggleItalic).toHaveBeenCalled()
  })

  it('calls toggleUnderline on U click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const toggleUnderline = vi.spyOn(chain as never, 'toggleUnderline').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    const btns = wrapper.findAll('.editor-toolbar__group')[0].findAll('.editor-toolbar__btn')
    await btns[2].trigger('click')
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

    await wrapper.findAll('.editor-toolbar__fontsize-btn')[0].trigger('click')
    await wrapper.findAll('.editor-toolbar__dropdown-item')[1].trigger('click') // Normal = index 1
    expect(setFontSize).toHaveBeenCalledWith('14')
  })

  it('calls toggleHeading({ level: 1 }) when H1 font option clicked', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const toggleHeading = vi.spyOn(chain as never, 'toggleHeading').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.findAll('.editor-toolbar__fontsize-btn')[0].trigger('click')
    await wrapper.findAll('.editor-toolbar__dropdown-item')[3].trigger('click') // H1 = index 3
    expect(toggleHeading).toHaveBeenCalledWith({ level: 1 })
  })

  it('calls setLink with URL when link button clicked and no link active', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const setLink = vi.spyOn(chain as never, 'setLink').mockReturnValue(chain)
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('https://example.com'))
    const wrapper = mountToolbar(editor as never)

    const insertBtns = wrapper.findAll('.editor-toolbar__group')[1].findAll('.editor-toolbar__btn')
    await insertBtns[0].trigger('click')
    expect(setLink).toHaveBeenCalledWith({ href: 'https://example.com' })
  })

  it('calls unsetLink when link button clicked and link is already active', async () => {
    const editor = makeEditorMock()
    editor.isActive.mockImplementation((arg: unknown) => arg === 'link')
    const chain = editor.chain()
    const unsetLink = vi.spyOn(chain as never, 'unsetLink').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    const insertBtns = wrapper.findAll('.editor-toolbar__group')[1].findAll('.editor-toolbar__btn')
    await insertBtns[0].trigger('click')
    expect(unsetLink).toHaveBeenCalled()
  })

  it('calls toggleBlockquote on blockquote click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const toggleBlockquote = vi.spyOn(chain as never, 'toggleBlockquote').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    const insertBtns = wrapper.findAll('.editor-toolbar__group')[1].findAll('.editor-toolbar__btn')
    await insertBtns[1].trigger('click')
    expect(toggleBlockquote).toHaveBeenCalled()
  })

  it('calls setTextAlign("center") when Center alignment option clicked', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const setTextAlign = vi.spyOn(chain as never, 'setTextAlign').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.findAll('.editor-toolbar__fontsize-btn')[1].trigger('click') // align dropdown
    await wrapper.findAll('.editor-toolbar__dropdown-item')[1].trigger('click') // Center = index 1
    expect(setTextAlign).toHaveBeenCalledWith('center')
  })

  it('calls toggleBulletList when Bullet list option clicked', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const toggleBulletList = vi.spyOn(chain as never, 'toggleBulletList').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    await wrapper.findAll('.editor-toolbar__fontsize-btn')[2].trigger('click') // list dropdown
    await wrapper.findAll('.editor-toolbar__dropdown-item')[0].trigger('click') // Bullet = index 0
    expect(toggleBulletList).toHaveBeenCalled()
  })

  it('calls liftListItem on outdent click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const liftListItem = vi.spyOn(chain as never, 'liftListItem').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    const structureBtns = wrapper.findAll('.editor-toolbar__group')[2].findAll('.editor-toolbar__btn')
    await structureBtns[0].trigger('click') // ⇤ outdent
    expect(liftListItem).toHaveBeenCalledWith('listItem')
  })

  it('calls sinkListItem on indent click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const sinkListItem = vi.spyOn(chain as never, 'sinkListItem').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    const structureBtns = wrapper.findAll('.editor-toolbar__group')[2].findAll('.editor-toolbar__btn')
    await structureBtns[1].trigger('click') // ⇥ indent
    expect(sinkListItem).toHaveBeenCalledWith('listItem')
  })

  it('calls setHorizontalRule on hr click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const setHorizontalRule = vi.spyOn(chain as never, 'setHorizontalRule').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    const structureBtns = wrapper.findAll('.editor-toolbar__group')[2].findAll('.editor-toolbar__btn')
    await structureBtns[2].trigger('click') // — hr
    expect(setHorizontalRule).toHaveBeenCalled()
  })

  it('calls clearNodes and unsetAllMarks on clear click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const clearNodes    = vi.spyOn(chain as never, 'clearNodes').mockReturnValue(chain)
    const unsetAllMarks = vi.spyOn(chain as never, 'unsetAllMarks').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    const utilityBtns = wrapper.findAll('.editor-toolbar__group')[3].findAll('.editor-toolbar__btn')
    await utilityBtns[0].trigger('click') // ✕ clear
    expect(clearNodes).toHaveBeenCalled()
    expect(unsetAllMarks).toHaveBeenCalled()
  })

  it('calls toggleCodeBlock on code click', async () => {
    const editor = makeEditorMock()
    const chain = editor.chain()
    const toggleCodeBlock = vi.spyOn(chain as never, 'toggleCodeBlock').mockReturnValue(chain)
    const wrapper = mountToolbar(editor as never)

    const utilityBtns = wrapper.findAll('.editor-toolbar__group')[3].findAll('.editor-toolbar__btn')
    await utilityBtns[1].trigger('click') // <> code
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
    const insertBtns = wrapper.findAll('.editor-toolbar__group')[1].findAll('.editor-toolbar__btn')
    await expect(insertBtns[0].trigger('click')).resolves.not.toThrow()
  })
})
