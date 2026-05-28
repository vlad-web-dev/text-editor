<script setup lang="ts">
import { ref } from 'vue'
import AboutEditor from './AboutEditor.vue'

const props = defineProps<{
  name: string
  initialContent: string
  isSaving: boolean
  error: string | null
}>()

const emit = defineEmits<{
  save: [html: string]
  cancel: []
  change: [html: string]
}>()

const currentHtml = ref(props.initialContent)

function onEditorChange(html: string) {
  currentHtml.value = html
  emit('change', html)
}

function handleSave() {
  emit('save', currentHtml.value)
}
</script>

<template>
  <Teleport to="body">
    <div class="mobile-editor-dialog__overlay" />
    <div class="mobile-editor-dialog__container" role="dialog" aria-modal="true" aria-label="Edit About">
      <div class="mobile-editor-dialog__header">
        <button class="mobile-editor-dialog__back-btn" aria-label="Go back" @click="emit('cancel')">←</button>
        <h2 class="mobile-editor-dialog__title">{{ name }}</h2>
      </div>

      <div class="mobile-editor-dialog__content">
        <div class="mobile-editor-dialog__editor-wrapper">
          <AboutEditor
            :initial-content="initialContent"
            @change="onEditorChange"
          />
        </div>
      </div>

      <div class="mobile-editor-dialog__footer">
        <p v-if="error" class="mobile-editor-dialog__error">{{ error }}</p>
        <button
          class="mobile-editor-dialog__save-btn"
          :disabled="isSaving"
          @click="handleSave"
        >{{ isSaving ? 'Saving…' : 'Save' }}</button>
      </div>
    </div>
  </Teleport>
</template>
