<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import {
  fontFamilyIcon, caretDownIcon,
  boldIcon, italicIcon, underlineIcon, textColorIcon,
  linkIcon, blockquoteIcon,
  alignIcon, listIcon, outdentIcon, indentIcon, hrIcon,
  clearIcon, codeIcon,
  undoIcon, redoIcon,
} from './toolbar-icons'

const props = defineProps<{
  editor: Editor | null
}>()

const fontsizeOpen = ref(false)
const alignOpen    = ref(false)
const listOpen     = ref(false)
const colorInputRef = ref<HTMLInputElement | null>(null)

// Trigger button refs for positioning teleported dropdowns
const fontsizeBtnRef = ref<HTMLElement | null>(null)
const alignBtnRef    = ref<HTMLElement | null>(null)
const listBtnRef     = ref<HTMLElement | null>(null)

interface DropdownPos { top: number; left: number }
const fontsizePos = ref<DropdownPos | null>(null)
const alignPos    = ref<DropdownPos | null>(null)
const listPos     = ref<DropdownPos | null>(null)

function calcPos(el: HTMLElement | null): DropdownPos | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.bottom + 4, left: r.left }
}

interface FontOption {
  label: string
  cls: string
  apply: (e: Editor) => void
  isActive: (e: Editor) => boolean
}

const FONT_OPTIONS: FontOption[] = [
  { label: 'Small',     cls: '_small', apply: e => e.chain().focus().setFontSize('12').run(),           isActive: e => e.isActive('textStyle', { fontSize: '12' }) },
  { label: 'Normal',    cls: '_normal', apply: e => e.chain().focus().setFontSize('14').run(),          isActive: e => e.isActive('textStyle', { fontSize: '14' }) },
  { label: 'Large',     cls: '_large', apply: e => e.chain().focus().setFontSize('20').run(),           isActive: e => e.isActive('textStyle', { fontSize: '20' }) },
  { label: 'Heading 1', cls: '_h1',    apply: e => e.chain().focus().toggleHeading({ level: 1 }).run(), isActive: e => e.isActive('heading', { level: 1 }) },
  { label: 'Heading 2', cls: '_h2',    apply: e => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: e => e.isActive('heading', { level: 2 }) },
  { label: 'Heading 3', cls: '_h3',    apply: e => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: e => e.isActive('heading', { level: 3 }) },
]

const ALIGN_OPTIONS = [
  { label: 'Left',    value: 'left' },
  { label: 'Center',  value: 'center' },
  { label: 'Right',   value: 'right' },
  { label: 'Justify', value: 'justify' },
]

interface ListOption {
  label: string
  apply: (e: Editor) => void
  isActive: (e: Editor) => boolean
}

const LIST_OPTIONS: ListOption[] = [
  { label: 'Bullet list',  apply: e => e.chain().focus().toggleBulletList().run(),  isActive: e => e.isActive('bulletList') },
  { label: 'Ordered list', apply: e => e.chain().focus().toggleOrderedList().run(), isActive: e => e.isActive('orderedList') },
]

// ─── Click-outside to close ────────────────────────────────────────────────────
function makeDocClose(flag: { value: boolean }) {
  return () => { flag.value = false }
}
const closeFontsize = makeDocClose(fontsizeOpen)
const closeAlign    = makeDocClose(alignOpen)
const closeList     = makeDocClose(listOpen)

watch(fontsizeOpen, open => {
  if (open) {
    fontsizePos.value = calcPos(fontsizeBtnRef.value)
    alignOpen.value = false; listOpen.value = false
    document.addEventListener('click', closeFontsize)
  } else {
    document.removeEventListener('click', closeFontsize)
  }
})
watch(alignOpen, open => {
  if (open) {
    alignPos.value = calcPos(alignBtnRef.value)
    fontsizeOpen.value = false; listOpen.value = false
    document.addEventListener('click', closeAlign)
  } else {
    document.removeEventListener('click', closeAlign)
  }
})
watch(listOpen, open => {
  if (open) {
    listPos.value = calcPos(listBtnRef.value)
    fontsizeOpen.value = false; alignOpen.value = false
    document.addEventListener('click', closeList)
  } else {
    document.removeEventListener('click', closeList)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeFontsize)
  document.removeEventListener('click', closeAlign)
  document.removeEventListener('click', closeList)
})

// ─── Actions ──────────────────────────────────────────────────────────────────
function selectFont(opt: FontOption) {
  fontsizeOpen.value = false
  if (props.editor) opt.apply(props.editor)
}
function selectAlign(value: string) {
  alignOpen.value = false
  props.editor?.chain().focus().setTextAlign(value).run()
}
function selectList(opt: ListOption) {
  listOpen.value = false
  if (props.editor) opt.apply(props.editor)
}
function onColorInput(e: Event) {
  props.editor?.chain().focus().setColor((e.target as HTMLInputElement).value).run()
}
function handleLink() {
  if (!props.editor) return
  if (props.editor.isActive('link')) {
    props.editor.chain().focus().unsetLink().run()
  } else {
    const url = window.prompt('Enter URL:')
    if (url) props.editor.chain().focus().setLink({ href: url }).run()
  }
}
</script>

<template>
  <div class="editor-toolbar">

    <!-- ── Undo / Redo  (mobile only) ───────────────────────────────────────── -->
    <button class="editor-toolbar__btn editor-toolbar__btn_history" title="Undo" @click="editor?.chain().focus().undo().run()">
      <span class="editor-toolbar__icon" v-html="undoIcon" />
    </button>
    <button class="editor-toolbar__btn editor-toolbar__btn_history" title="Redo" @click="editor?.chain().focus().redo().run()">
      <span class="editor-toolbar__icon" v-html="redoIcon" />
    </button>
    <span class="editor-toolbar__sep editor-toolbar__sep_history" />

    <!-- ── Font size ────────────────────────────────────────────────────────── -->
    <button
      ref="fontsizeBtnRef"
      class="editor-toolbar__btn editor-toolbar__btn_wide"
      :class="{ 'editor-toolbar__btn_open': fontsizeOpen }"
      title="Font size"
      @click.stop="fontsizeOpen = !fontsizeOpen"
    >
      <span class="editor-toolbar__icon" v-html="fontFamilyIcon" />
      <span class="editor-toolbar__caret" v-html="caretDownIcon" />
    </button>

    <!-- ── Bold ─────────────────────────────────────────────────────────────── -->
    <button class="editor-toolbar__btn" :class="{ 'editor-toolbar__btn_active': editor?.isActive('bold') }" title="Bold (Ctrl+B)" @click="editor?.chain().focus().toggleBold().run()">
      <span class="editor-toolbar__icon" v-html="boldIcon" />
    </button>

    <!-- ── Italic ───────────────────────────────────────────────────────────── -->
    <button class="editor-toolbar__btn" :class="{ 'editor-toolbar__btn_active': editor?.isActive('italic') }" title="Italic (Ctrl+I)" @click="editor?.chain().focus().toggleItalic().run()">
      <span class="editor-toolbar__icon" v-html="italicIcon" />
    </button>

    <!-- ── Underline ─────────────────────────────────────────────────────────── -->
    <button class="editor-toolbar__btn" :class="{ 'editor-toolbar__btn_active': editor?.isActive('underline') }" title="Underline (Ctrl+U)" @click="editor?.chain().focus().toggleUnderline().run()">
      <span class="editor-toolbar__icon" v-html="underlineIcon" />
    </button>

    <!-- ── Text color ────────────────────────────────────────────────────────── -->
    <button class="editor-toolbar__btn" title="Text color" @click="colorInputRef?.click()">
      <span class="editor-toolbar__icon" v-html="textColorIcon" />
    </button>
    <input ref="colorInputRef" type="color" class="editor-toolbar__color-input" tabindex="-1" aria-hidden="true" @input="onColorInput" />

    <span class="editor-toolbar__sep" />

    <!-- ── Link ─────────────────────────────────────────────────────────────── -->
    <button class="editor-toolbar__btn" :class="{ 'editor-toolbar__btn_active': editor?.isActive('link') }" title="Link" @click="handleLink">
      <span class="editor-toolbar__icon" v-html="linkIcon" />
    </button>

    <!-- ── Blockquote ────────────────────────────────────────────────────────── -->
    <button class="editor-toolbar__btn" :class="{ 'editor-toolbar__btn_active': editor?.isActive('blockquote') }" title="Blockquote" @click="editor?.chain().focus().toggleBlockquote().run()">
      <span class="editor-toolbar__icon" v-html="blockquoteIcon" />
    </button>

    <span class="editor-toolbar__sep" />

    <!-- ── Align ─────────────────────────────────────────────────────────────── -->
    <button
      ref="alignBtnRef"
      class="editor-toolbar__btn editor-toolbar__btn_wide"
      :class="{ 'editor-toolbar__btn_open': alignOpen }"
      title="Text alignment"
      @click.stop="alignOpen = !alignOpen"
    >
      <span class="editor-toolbar__icon" v-html="alignIcon" />
      <span class="editor-toolbar__caret" v-html="caretDownIcon" />
    </button>

    <!-- ── List ──────────────────────────────────────────────────────────────── -->
    <button
      ref="listBtnRef"
      class="editor-toolbar__btn editor-toolbar__btn_wide"
      :class="{ 'editor-toolbar__btn_open': listOpen }"
      title="Lists"
      @click.stop="listOpen = !listOpen"
    >
      <span class="editor-toolbar__icon" v-html="listIcon" />
      <span class="editor-toolbar__caret" v-html="caretDownIcon" />
    </button>

    <!-- ── Decrease indent ───────────────────────────────────────────────────── -->
    <button class="editor-toolbar__btn" title="Decrease indent" @click="editor?.chain().focus().liftListItem('listItem').run()">
      <span class="editor-toolbar__icon" v-html="outdentIcon" />
    </button>

    <!-- ── Increase indent ───────────────────────────────────────────────────── -->
    <button class="editor-toolbar__btn" title="Increase indent" @click="editor?.chain().focus().sinkListItem('listItem').run()">
      <span class="editor-toolbar__icon" v-html="indentIcon" />
    </button>

    <!-- ── Horizontal rule ───────────────────────────────────────────────────── -->
    <button class="editor-toolbar__btn" title="Horizontal rule" @click="editor?.chain().focus().setHorizontalRule().run()">
      <span class="editor-toolbar__icon" v-html="hrIcon" />
    </button>

    <span class="editor-toolbar__sep" />

    <!-- ── Clear formatting ──────────────────────────────────────────────────── -->
    <button class="editor-toolbar__btn" title="Clear formatting" @click="editor?.chain().focus().clearNodes().unsetAllMarks().run()">
      <span class="editor-toolbar__icon" v-html="clearIcon" />
    </button>

    <!-- ── Code block ────────────────────────────────────────────────────────── -->
    <button class="editor-toolbar__btn" :class="{ 'editor-toolbar__btn_active': editor?.isActive('codeBlock') }" title="Code block" @click="editor?.chain().focus().toggleCodeBlock().run()">
      <span class="editor-toolbar__icon" v-html="codeIcon" />
    </button>

  </div>

  <!-- ── Teleported dropdown panels — escape all overflow containers ───────── -->
  <Teleport to="body">
    <div
      v-if="fontsizeOpen && fontsizePos"
      class="editor-toolbar__dropdown"
      :style="{ position: 'fixed', top: fontsizePos.top + 'px', left: fontsizePos.left + 'px' }"
      @click.stop
    >
      <button
        v-for="opt in FONT_OPTIONS" :key="opt.label"
        class="editor-toolbar__dropdown-item"
        :class="[`editor-toolbar__dropdown-item${opt.cls}`, { 'editor-toolbar__dropdown-item_active': editor ? opt.isActive(editor) : false }]"
        @click="selectFont(opt)"
      >{{ opt.label }}</button>
    </div>

    <div
      v-if="alignOpen && alignPos"
      class="editor-toolbar__dropdown"
      :style="{ position: 'fixed', top: alignPos.top + 'px', left: alignPos.left + 'px' }"
      @click.stop
    >
      <button
        v-for="opt in ALIGN_OPTIONS" :key="opt.value"
        class="editor-toolbar__dropdown-item editor-toolbar__dropdown-item_normal"
        :class="{ 'editor-toolbar__dropdown-item_active': editor?.isActive({ textAlign: opt.value }) }"
        @click="selectAlign(opt.value)"
      >{{ opt.label }}</button>
    </div>

    <div
      v-if="listOpen && listPos"
      class="editor-toolbar__dropdown"
      :style="{ position: 'fixed', top: listPos.top + 'px', left: listPos.left + 'px' }"
      @click.stop
    >
      <button
        v-for="opt in LIST_OPTIONS" :key="opt.label"
        class="editor-toolbar__dropdown-item editor-toolbar__dropdown-item_normal"
        :class="{ 'editor-toolbar__dropdown-item_active': editor ? opt.isActive(editor) : false }"
        @click="selectList(opt)"
      >{{ opt.label }}</button>
    </div>
  </Teleport>
</template>
