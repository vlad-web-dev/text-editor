<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAboutStore } from '@/stores/aboutStore'
import AboutEditor from './AboutEditor.vue'
import MobileEditorDialog from './MobileEditorDialog.vue'

const store = useAboutStore()

// ─── Mobile detection ─────────────────────────────────────────────────────────
const isMobile = ref(false)

function updateMobile(e: MediaQueryListEvent | MediaQueryList) {
  isMobile.value = e.matches
}

let mq: MediaQueryList | null = null

onMounted(() => {
  mq = window.matchMedia('(max-width: 767px)')
  updateMobile(mq)
  mq.addEventListener('change', updateMobile)
})

onUnmounted(() => {
  mq?.removeEventListener('change', updateMobile)
})

// ─── Editor ref for Save (template-ref approach avoids lifting all state) ─────
const editorRef = ref<InstanceType<typeof AboutEditor> | null>(null)

// ─── Actions ─────────────────────────────────────────────────────────────────
function onEditClick() {
  store.startEditing()
}

function onSave(html?: string) {
  const content = html ?? editorRef.value?.getHTML() ?? store.savedContent
  store.saveContent(content)
}

function onCancel() {
  store.cancelEditing()
}

function onChange(html: string) {
  store.saveDraft(html)
}
</script>

<template>
  <div class="about-section">
    <!-- Draft banner — shown when a draft exists and editor is not open -->
    <div v-if="store.hasDraft && !store.isEditing" class="about-section__draft-banner">
      <span class="about-section__draft-indicator">📝 Unsaved draft</span>
      <span>— click Edit to resume, or Save to keep changes.</span>
      <span v-if="store.isDraftSaving" class="about-section__draft-saving">Saving draft…</span>
    </div>

    <!-- Static view -->
    <template v-if="!store.isEditing">
      <div class="about-section__content-wrapper">
        <div
          class="about-section__content"
          :class="{ 'about-section__content_draft': store.hasDraft }"
          v-html="store.currentContent"
        />
        <button class="about-section__edit-btn" @click="onEditClick">
          ✏️ Edit
        </button>
      </div>
    </template>

    <!-- Inline editor (desktop only) -->
    <template v-else-if="!isMobile">
      <div class="about-section__panel">
        <div class="about-section__panel-header">
          <h3 class="about-section__panel-title">About {{ store.memorial?.name }}</h3>
        </div>

        <div class="about-section__editor-wrapper">
          <AboutEditor
            ref="editorRef"
            :initial-content="store.hasDraft && store.draftContent !== null
              ? store.draftContent
              : store.savedContent"
            @change="onChange"
          />
        </div>

        <p v-if="store.error" class="about-section__error">{{ store.error }}</p>

        <div class="about-section__actions">
          <button
            class="about-section__actions-btn about-section__actions-btn_secondary"
            @click="onCancel"
          >Cancel</button>
          <button
            class="about-section__actions-btn about-section__actions-btn_primary"
            :disabled="store.isSaving"
            @click="onSave()"
          >{{ store.isSaving ? 'Saving…' : 'Save' }}</button>
        </div>
      </div>
    </template>

    <!-- Mobile full-screen dialog -->
    <MobileEditorDialog
      v-else
      :name="store.memorial?.name ?? ''"
      :initial-content="store.hasDraft && store.draftContent !== null
        ? store.draftContent
        : store.savedContent"
      :is-saving="store.isSaving"
      @save="onSave"
      @cancel="onCancel"
      @change="onChange"
    />
  </div>
</template>
