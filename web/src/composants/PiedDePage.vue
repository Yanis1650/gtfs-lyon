<script setup lang="ts">
import mot from '../assets/drekky/mot.svg?raw'
import symbole from '../assets/drekky/symbole.svg?raw'

const emit = defineEmits<{ methode: []; mentions: [] }>()
</script>

<template>
  <!-- Pied de page de la charte, en bandeau compact : liens à gauche, signature à droite. -->
  <footer class="pied">
    <div class="pied__liens">
      <button class="pied__lien" @click="emit('methode')">Méthode et sources</button>
      <button class="pied__lien" @click="emit('mentions')">Mentions légales</button>
      <a class="pied__lien" href="https://github.com/Yanis1650/gtfs-lyon" target="_blank" rel="noopener noreferrer">
        Code source
      </a>
    </div>
    <a
      class="pied__signature"
      href="https://studio.drekky.fr"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Drekky Studio, conçu et développé par Yanis Lepesant"
      title="Conçu et développé par Yanis Lepesant"
    >
      <!-- Logos de la charte, fichiers du dépôt (jamais de contenu venu des données). -->
      <span class="pied__symbole" aria-hidden="true" v-html="symbole" />
      <span class="pied__marque" aria-hidden="true">
        <span class="pied__mot" v-html="mot" />
        <span class="etiquette pied__studio">Studio</span>
      </span>
    </a>
  </footer>
</template>

<style scoped>
.pied {
  display: flex;
  align-items: center;
  gap: 8px 16px;
  padding: 10px 20px;
  background: var(--pied);
  color: var(--pied-texte);
  font-size: 13px;
}
.pied__liens {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
}
.pied__lien {
  padding: 0;
  border: none;
  background: none;
  color: #f7f2e6;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}
.pied__lien::after {
  content: ' →';
}
.pied__lien:hover {
  color: #ffffff;
  text-decoration: underline;
}
.pied__signature {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #efe6d1;
  text-decoration: none;
  opacity: 0.85;
}
.pied__signature:hover {
  opacity: 1;
}
.pied__symbole {
  flex: none;
  display: block;
  width: 22px;
  height: 22px;
}
.pied__marque {
  display: flex;
  flex-direction: column;
  line-height: 1;
}
.pied__mot {
  display: block;
  width: 44px;
  height: 12.5px;
}
.pied__symbole :deep(svg),
.pied__mot :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
.pied__studio {
  margin-top: 2px;
  font-size: 6.5px;
  color: var(--pied-texte);
}

@media (min-width: 900px) {
  .pied {
    padding: 10px 24px;
  }
}
</style>
