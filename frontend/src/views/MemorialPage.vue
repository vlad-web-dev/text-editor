<script setup lang="ts">
import { onMounted } from 'vue'
import { useAboutStore } from '@/stores/aboutStore'
import AboutSection from '@/components/memorial/AboutSection.vue'

const store = useAboutStore()
const MEMORIAL_ID = 1

onMounted(() => {
  store.loadMemorial(MEMORIAL_ID)
})
</script>

<template>
  <main class="memorial-page">
    <!-- Loading -->
    <div v-if="!store.memorial && !store.error" class="memorial-page__loading">
      Loading memorial…
    </div>

    <!-- Error -->
    <div v-else-if="store.error && !store.memorial" class="memorial-page__error">
      {{ store.error }}
    </div>

    <!-- Memorial content -->
    <template v-else-if="store.memorial">
      <header class="memorial-page__header">
        <h1 class="memorial-page__name">{{ store.memorial.name }}</h1>
      </header>

      <section class="memorial-page__about">
        <h2 class="memorial-page__section-title">About</h2>
        <AboutSection />
      </section>
    </template>
  </main>
</template>

<style lang="scss">
@use '@/assets/styles/variables' as *;

.memorial-page {
  max-width: 760px;
  margin: 0 auto;
  padding: $spacing-xl $spacing-md;

  &__loading,
  &__error {
    text-align: center;
    padding: $spacing-xl;
    color: $color-text-muted;
  }

  &__error {
    color: $color-error;
  }

  &__header {
    margin-bottom: $spacing-xl;
    padding-bottom: $spacing-lg;
    border-bottom: 1px solid $color-border;
  }

  &__name {
    font-size: 28px;
    font-weight: 700;
    color: $color-text;
    margin: 0;
  }

  &__section-title {
    font-size: 18px;
    font-weight: 600;
    color: $color-text;
    margin: 0 0 $spacing-md;
  }

  &__about {
    margin-bottom: $spacing-xl;
  }
}
</style>
