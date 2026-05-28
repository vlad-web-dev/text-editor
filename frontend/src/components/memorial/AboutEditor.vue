<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Link } from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { FontSize } from '@/extensions/FontSize'
import EditorToolbar from './EditorToolbar.vue'

const props = defineProps<{
  initialContent: string
}>()

const emit = defineEmits<{
  change: [html: string]
}>()

const editor = useEditor({
  content: props.initialContent,
  extensions: [
    // StarterKit includes: Bold, Italic, Blockquote, History, Paragraph, etc.
    // Do NOT add those separately or Tiptap throws "Extension already registered".
    StarterKit,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color,
    FontSize,
    Underline,
    Link.configure({ openOnClick: false }),
  ],
  onUpdate({ editor }) {
    emit('change', editor.getHTML())
  },
})

// Expose getHTML so AboutSection can call it on Save without lifting all state
defineExpose({
  getHTML: () => editor.value?.getHTML() ?? '',
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div>
    <EditorToolbar :editor="editor ?? null" />
    <EditorContent :editor="editor" />
  </div>
</template>
