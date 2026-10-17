<script setup lang="ts">
import mot from '../assets/drekky/mot.svg?raw'
import symbole from '../assets/drekky/symbole.svg?raw'

const emit = defineEmits<{ methode: []; mentions: [] }>()
</script>

<template>
  <!-- Pied de page de la charte : fond ardoise, texte muted-dark, symbole en crème. -->
  <footer class="pied">
    <div class="pied__liens">
      <button class="pied__lien" @click="emit('methode')">Méthode et sources</button>
      <button class="pied__lien" @click="emit('mentions')">Mentions légales</button>
      <a class="pied__lien" href="https://github.com/Yanis1650/gtfs-lyon" target="_blank" rel="noopener noreferrer">
        Code source
      </a>
    </div>
    <a class="pied__signature" href="https://studio.drekky.fr" target="_blank" rel="noopener noreferrer">
      <!-- Logos de la charte, fichiers du dépôt (jamais de contenu venu des données). -->
      <span class="pied__symbole" aria-hidden="true" v-html="symbole" />
      <span class="pied__marque" aria-hidden="true">
        <span class="pied__mot" v-html="mot" />
        <span class="etiquette pied__studio">Studio</span>
      </span>
      <span class="pied__auteur">
        Conçu et développé par Yanis Lepesant. Données&nbsp;: SYTRAL Mobilités (ODbL), Insee, OpenStreetMap.
      </span>
    </a>
  </footer>
</template>

<style scoped>
.pied {
  display: grid;
  gap: 10px;
  padding: 16px 20px 20px;
  background: var(--pied);
  color: var(--pied-texte);
  font-size: 13px;
}
.pied__liens {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
}
.pied__lien {
  padding: 0;
  border: none;
  background: none;
  color: #f7f2e6;
  font-size: 14px;
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
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--pied-filet);
  color: #efe6d1;
  text-decoration: none;
}
.pied__symbole {
  flex: none;
  display: block;
  width: 32px;
  height: 32px;
}
.pied__marque {
  display: flex;
  flex-direction: column;
  line-height: 1;
}
.pied__mot {
  display: block;
  width: 60px;
  height: 17px;
}
.pied__symbole :deep(svg),
.pied__mot :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
.pied__studio {
  margin-top: 3px;
  font-size: 8px;
  color: var(--pied-texte);
}
.pied__auteur {
  margin-left: auto;
  max-width: 240px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--pied-texte);
  text-align: right;
}
.pied__signature:hover .pied__auteur {
  color: #f7f2e6;
}

@media (min-width: 900px) {
  .pied {
    padding: 14px 24px 16px;
  }
}
</style>
