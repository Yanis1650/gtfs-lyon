import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { nextTick } from 'vue'

const attendre = ms => new Promise(resolve => setTimeout(resolve, ms))
async function jusquA(condition) {
  const fin = Date.now() + 2000
  while (!condition() && Date.now() < fin) await attendre(10)
  assert.ok(condition(), 'Le résultat attendu doit arriver sans attendre une autre interaction')
}

class CarteTest {
  evenements = new Map()
  sources = new Map()
  id = 'a'
  on(nom, f) { this.evenements.set(nom, f) }
  off(nom) { this.evenements.delete(nom) }
  getLayer() { return true }
  getSource(id) {
    return { setData: donnees => this.sources.set(id, donnees) }
  }
  setLayoutProperty() {}
  setPaintProperty() {}
  isMoving() { return false }
  queryRenderedFeatures() { return [{ properties: { id: this.id } }] }
  emettre(nom) {
    this.evenements.get(nom)?.({ point: { x: 0, y: 0 }, originalEvent: { buttons: 0 } })
  }
}

test('survol, fixation, changement de vue et réponses obsolètes', async t => {
  const serveur = await createServer({ configFile: false, logLevel: 'silent',
    root: fileURLToPath(new URL('..', import.meta.url)), appType: 'custom',
    server: { middlewareMode: true, watch: null } })
  const fetchInitial = globalThis.fetch
  const cartes = []
  t.after(async () => {
    for (const carte of cartes) carte.emettre('remove')
    globalThis.fetch = fetchInitial
    await serveur.close()
  })
  const { brancherIsochrones } = await serveur.ssrLoadModule('/src/isochrones/exploration.ts')
  const { isochrones, effacerIsochrone } = await serveur.ssrLoadModule('/src/etat/isochrones.ts')
  const cellule = (id, x) => ({ type: 'Feature', properties: { id, pop: 10 },
    geometry: { type: 'Polygon', coordinates: [[[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]]] } })
  const index = { format: 'r5-median-u8-v1', version: '1234567890abcdef', ids: ['a', 'b'],
    date: '2026-11-17', heure: 8, fenetre: 60, maximum: 45 }
  let retarderA = false
  let reponsesA = 0
  let departsA = 0
  globalThis.fetch = async url => {
    if (url.endsWith('index.json')) return Response.json(index)
    if (url.endsWith('carreaux.geojson')) return Response.json({ type: 'FeatureCollection',
      features: [cellule('a', 0), cellule('b', 1)] })
    if (url.endsWith('/0.bin')) {
      departsA++
      if (retarderA) await attendre(500) // Un serveur peut finir une réponse malgré l'annulation côté client.
      reponsesA++
      return new Response(new Uint8Array([0, 25]))
    }
    return new Response(new Uint8Array([40, 0]))
  }
  isochrones.actif = true
  let vue = 'acces'
  let carte = new CarteTest()
  cartes.push(carte)
  brancherIsochrones(carte, { vue: () => vue })
  carte.emettre('mousemove')
  await jusquA(() => isochrones.origine === 'a')
  assert.equal(isochrones.fixe, false, 'Le survol calcule sans fixer le départ')
  assert.equal(isochrones.habitants, 20)
  carte.id = 'b'
  carte.emettre('click')
  await jusquA(() => isochrones.origine === 'b')
  assert.equal(isochrones.fixe, true)
  carte.id = 'a'
  carte.emettre('mousemove')
  await attendre(200)
  assert.equal(isochrones.origine, 'b', 'Le survol conserve un départ fixé')
  carte.emettre('remove')
  carte = new CarteTest()
  cartes.push(carte)
  brancherIsochrones(carte, { vue: () => vue })
  await jusquA(() => carte.sources.get('iso-depart')?.features.length === 1)
  assert.equal(isochrones.origine, 'b', 'Une carte recréée retrouve le tracé du départ conservé')
  effacerIsochrone()
  await nextTick()
  assert.equal(carte.sources.get('iso-zones').features.length, 0)
  vue = 'offre'
  carte.emettre('click')
  await attendre(200)
  assert.equal(isochrones.origine, null, 'Les autres vues ne lancent pas de calcul')
  carte.emettre('remove')

  vue = 'acces'
  retarderA = true
  reponsesA = 0
  departsA = 0
  const autre = new CarteTest()
  cartes.push(autre)
  brancherIsochrones(autre, { vue: () => vue })
  autre.emettre('mousemove')
  await jusquA(() => departsA === 1)
  autre.id = 'b'
  autre.emettre('mousemove')
  await jusquA(() => isochrones.origine === 'b')
  await jusquA(() => reponsesA === 1)
  await attendre(30)
  assert.equal(isochrones.origine, 'b', 'Une réponse ancienne ne remplace pas la dernière origine')
  assert.equal(isochrones.erreur, '')
})
