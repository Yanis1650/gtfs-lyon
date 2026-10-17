<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ etiquette: string; titre: string; id: string }>()
const dialogue = ref<HTMLDialogElement>()
defineExpose({ ouvrir: () => dialogue.value?.showModal(), fermer: () => dialogue.value?.close() })
</script>

<template>
  <dialog ref="dialogue" class="dialogue" :aria-labelledby="id" @click.self="dialogue?.close()">
    <article>
      <header>
        <div>
          <p class="etiquette">{{ etiquette }}</p>
          <h2 :id="id">{{ titre }}</h2>
        </div>
        <button class="fermer" aria-label="Fermer" @click="dialogue?.close()">×</button>
      </header>
      <slot />
    </article>
  </dialog>
</template>

<style scoped>
.dialogue {
  width: min(680px, calc(100vw - 24px));
  max-height: calc(100dvh - 32px);
  padding: 0;
  border: 1px solid var(--filet);
  border-radius: var(--rayon);
  background: var(--surface);
  color: var(--encre);
  box-shadow: var(--ombre-levee);
}
.dialogue::backdrop {
  background: rgba(22, 34, 37, 0.5);
}
article {
  padding: 18px 20px 22px;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
h2 {
  font-size: 24px;
}
article :slotted(h3) {
  font-size: 17px;
  margin: 20px 0 4px;
}
article :slotted(p),
article :slotted(li) {
  max-width: 36rem;
  color: var(--encre-2);
}
article :slotted(ul) {
  margin: 0;
  padding-left: 18px;
}
article :slotted(.note) {
  margin-top: 16px;
  font-size: 14px;
  color: var(--discret);
}
.fermer {
  flex: none;
  width: 44px;
  height: 44px;
  border: 1px solid transparent;
  border-radius: var(--rayon);
  background: transparent;
  font-size: 22px;
  cursor: pointer;
  color: var(--encre-2);
}
.fermer:hover {
  border-color: var(--filet);
  color: var(--encre);
}

@media (min-width: 600px) {
  article {
    padding: 24px 28px 28px;
  }
  h2 {
    font-size: 28px;
  }
}
</style>
