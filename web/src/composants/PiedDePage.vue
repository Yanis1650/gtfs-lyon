<script setup lang="ts">
const emit = defineEmits<{ methode: []; mentions: [] }>()
</script>

<template>
  <!-- Pied de page en bandeau compact : liens à gauche, signature vers le portfolio à droite. -->
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
      href="https://portfolio.drekky.fr/"
      target="_blank"
      rel="noopener noreferrer"
      title="Conçu et développé par Yanis Lepesant"
    >
      <span class="pied__nom">Yanis Lepesant</span>
      <span class="etiquette pied__portfolio">Portfolio</span>
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
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  line-height: 1;
  color: #efe6d1;
  text-decoration: none;
  opacity: 0.85;
}
.pied__signature:hover {
  opacity: 1;
}
.pied__nom {
  font-family: var(--police-titre);
  font-size: 13px;
  font-weight: 600;
}
.pied__portfolio {
  font-size: 9px;
  line-height: 1;
  color: var(--pied-texte);
}
.pied__signature:hover .pied__portfolio {
  text-decoration: underline;
}

@media (min-width: 900px) {
  .pied {
    padding: 10px 24px;
  }
}
</style>
