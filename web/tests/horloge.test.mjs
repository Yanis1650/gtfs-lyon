import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { createServer } from 'vite'
import { h } from 'vue'
import { renderToString } from '@vue/server-renderer'

async function contexte(t) {
  const serveur = await createServer({ configFile: false, logLevel: 'silent', plugins: [vue()],
    root: fileURLToPath(new URL('..', import.meta.url)), appType: 'custom',
    server: { middlewareMode: true, watch: null } })
  t.after(() => serveur.close())
  const { simulation } = await serveur.ssrLoadModule('/src/etat/simulation.ts')
  const { default: Horloge } = await serveur.ssrLoadModule('/src/composants/Horloge.vue')
  return { serveur, simulation, afficher: heure => renderToString(h(Horloge, { modelValue: heure })) }
}

test('l’horloge et le curseur suivent les secondes, même avant le changement de minute', async t => {
  const { simulation, afficher } = await contexte(t)
  Object.assign(simulation, { actif: true, lecture: true, temps: 30600, vitesse: 10 })
  const debut = await afficher(4)
  assert.match(debut, /08:30:00/)
  assert.match(debut, /value="30600"/)
  assert.match(debut, /Simulation ×10/)
  simulation.temps = 30612.7
  const suivant = await afficher(4)
  assert.match(suivant, /08:30:12/)
  assert.match(suivant, /value="30612"/)
  assert.match(suivant, /step="1"/)
  assert.match(suivant, /aria-label="Mettre en pause"/)
  Object.assign(simulation, { lecture: false, vitesse: 60, temps: 90005 })
  const nuit = await afficher(21)
  assert.match(nuit, /01:00:05/)
  assert.match(nuit, /value="90005"/)
  assert.match(nuit, /Simulation ×60/)
  assert.match(nuit, /aria-label="Faire défiler la journée"/)
  simulation.actif = false
  const theorique = await afficher(4)
  assert.match(theorique, /value="4"/)
  assert.match(theorique, /Théorique/)
  assert.doesNotMatch(theorique, /Simulation/)
})

test('chaque activation des véhicules démarre en ×10 et respecte la réduction des mouvements', async t => {
  const { serveur, simulation } = await contexte(t)
  const initial = globalThis.window
  let reduire = false
  globalThis.window = { matchMedia: () => ({ matches: reduire }) }
  t.after(() => { globalThis.window = initial })
  const { basculerVehicules } = await serveur.ssrLoadModule('/src/etat/lecture.ts')
  Object.assign(simulation, { actif: false, lecture: false, vitesse: 1 })
  basculerVehicules(4)
  assert.equal(simulation.actif, true)
  assert.equal(simulation.vitesse, 10)
  assert.equal(simulation.temps, 28800)
  assert.equal(simulation.lecture, true)
  simulation.vitesse = 60
  basculerVehicules(4)
  assert.equal(simulation.lecture, false)
  assert.equal(simulation.actif, false)
  reduire = true
  basculerVehicules(5)
  assert.equal(simulation.vitesse, 10)
  assert.equal(simulation.temps, 32400)
  assert.equal(simulation.lecture, false)
})
