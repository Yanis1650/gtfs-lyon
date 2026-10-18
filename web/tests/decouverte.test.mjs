import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createRenderer, nextTick, ref } from 'vue'

test('la découverte reconnaît une seule URL, initialise la scène et respecte les mouvements réduits', async t => {
  const serveur = await createServer({ configFile: false, logLevel: 'silent',
    root: fileURLToPath(new URL('..', import.meta.url)), appType: 'custom',
    server: { middlewareMode: true, watch: null } })
  const initial = globalThis.window
  const evenements = new Map()
  let ancre = '#offre', reduire = false
  globalThis.window = {
    location: { get hash() { return ancre }, set hash(v) { ancre = v.startsWith('#') ? v : '#' + v } },
    addEventListener: (n, f) => evenements.set(n, f), removeEventListener: n => evenements.delete(n),
    history: { replaceState: (_, __, v) => { ancre = v } },
    matchMedia: () => ({ matches: reduire }),
  }
  const { useVue, ouvrirDemonstration } = await serveur.ssrLoadModule('/src/etat/vue.ts')
  const { useDecouverte } = await serveur.ssrLoadModule('/src/etat/decouverte.ts')
  const { demonstration } = await serveur.ssrLoadModule('/src/etat/demonstration.ts')
  const { simulation } = await serveur.ssrLoadModule('/src/etat/simulation.ts')
  const moteur = createRenderer({ insert() {}, remove() {}, patchProp() {},
    createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
    setText() {}, setElementText() {}, parentNode: () => null, nextSibling: () => null })
  let vue, contexte, app, effacements = 0
  function monter() {
    contexte = { heure: ref(0), relief: ref(false), exploration: ref(true), effacer: () => effacements++ }
    app = moteur.createApp({ setup() { vue = useVue(); useDecouverte(contexte); return () => null } })
    app.mount({})
  }
  t.after(async () => { app?.unmount(); globalThis.window = initial; await serveur.close() })
  monter()
  assert.equal(simulation.actif, false)
  ouvrirDemonstration()
  evenements.get('hashchange')()
  await nextTick()
  assert.equal(ancre, '#offre-demo')
  assert.equal(vue.value, 'offre')
  assert.equal(contexte.heure.value, 4)
  assert.equal(contexte.relief.value, true)
  assert.equal(contexte.exploration.value, false)
  assert.equal(simulation.temps, 30600)
  assert.equal(simulation.vitesse, 1)
  assert.equal(simulation.lecture, true)
  assert.equal(effacements, 1, 'La scène efface une ancienne sélection qui masquerait la découverte')
  simulation.temps = 36000
  await nextTick()
  assert.equal(simulation.temps, 36000, 'Le curseur reste libre après le lancement')
  reduire = true
  ouvrirDemonstration()
  await nextTick()
  assert.equal(simulation.temps, 30600, 'La même URL permet de rejouer la scène')
  assert.equal(simulation.lecture, false, 'La préférence de réduction des mouvements reste prioritaire')
  vue.value = 'vitesse'
  await nextTick()
  assert.equal(ancre, '#vitesse')
  const demandes = demonstration.demande
  ancre = '#offre-demo?heure=999&url=https://exemple.invalid'
  evenements.get('hashchange')()
  await nextTick()
  assert.equal(vue.value, 'offre')
  assert.equal(demonstration.demande, demandes, 'Les ancres et paramètres non autorisés ne lancent rien')
  app.unmount()
  assert.equal(evenements.size, 0, 'Les écouteurs sont retirés au démontage')
  ancre = '#offre-demo'
  demonstration.demande = demonstration.cadrageEffectue = 0
  simulation.actif = false
  monter()
  assert.equal(simulation.actif, true, 'Le lien fonctionne dès le chargement initial')
  assert.equal(simulation.lecture, false)
  assert.equal(contexte.relief.value, true)
})

test('la scène cadre un vrai tram même hors du cadrage courant, sans inventer de véhicule', async t => {
  const serveur = await createServer({ configFile: false, logLevel: 'silent',
    root: fileURLToPath(new URL('..', import.meta.url)), appType: 'custom',
    server: { middlewareMode: true, watch: null } })
  const initial = globalThis.window
  globalThis.window = { matchMedia: () => ({ matches: true }) }
  t.after(async () => { globalThis.window = initial; await serveur.close() })
  const { montrerModele } = await serveur.ssrLoadModule('/src/simulation/zoom.ts')
  const course = (mode, x, debut = 30500) => ({ mode, heures: [debut, debut + 200],
    traces: [{ points: [[x, 45.757], [x + .001, 45.757]], cumul: [0, .001] }] })
  const vols = []
  const carte = { getZoom: () => 18, getCenter: () => ({ lng: 5, lat: 45.8 }),
    getBounds: () => ({ contains: () => false }), flyTo: v => vols.push(v) }
  const courses = [course('bus', 4.857), course('tram', 4.860), course('tram', 4.857, 32000)]
  montrerModele(carte, courses, 30600, true)
  assert.equal(vols.length, 1)
  assert.ok(vols[0].center[0] >= 4.860 && vols[0].center[0] <= 4.861)
  assert.equal(vols[0].zoom, 18)
  assert.equal(vols[0].pitch, 58)
  assert.equal(vols[0].duration, 0)
  montrerModele(carte, courses, 30600)
  assert.equal(vols.length, 1, 'L’activation ordinaire conserve une vue déjà rapprochée')
  montrerModele(carte, [], 30600, true)
  assert.equal(vols.length, 1, 'Une heure vide ne produit aucun cadrage fictif')
})
