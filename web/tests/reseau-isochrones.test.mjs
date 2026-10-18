import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const attendre = ms => new Promise(resolve => setTimeout(resolve, ms))
async function jusquA(condition) {
  const fin = Date.now() + 2000
  while (!condition() && Date.now() < fin) await attendre(10)
  assert.ok(condition())
}

test('un réseau lent termine le chargement courant puis passe au dernier survol, sans file de requêtes', async t => {
  const serveur = await createServer({ configFile: false, logLevel: 'silent',
    root: fileURLToPath(new URL('..', import.meta.url)), appType: 'custom',
    server: { middlewareMode: true, watch: null } })
  const initial = globalThis.fetch
  const evenements = new Map(), sources = new Map(), requetes = []
  let id = 'a', recherches = 0, liberer
  const lente = new Promise(resolve => { liberer = resolve })
  const carte = {
    on: (n, f) => evenements.set(n, f), off: n => evenements.delete(n),
    getLayer: () => true, isMoving: () => false,
    getSource(n) { if (!sources.has(n)) sources.set(n, { setData() {} }); return sources.get(n) },
    setFeatureState() {}, setLayoutProperty() {}, setPaintProperty() {},
    queryRenderedFeatures() { recherches++; return [{ properties: { id } }] },
  }
  t.after(async () => {
    liberer()
    evenements.get('remove')?.()
    globalThis.fetch = initial
    await serveur.close()
  })
  const index = { format: 'r5-median-u8-v1', version: '1234567890abcdef', ids: ['a', 'b', 'c'],
    date: '2026-11-17', heure: 8, fenetre: 60, maximum: 45 }
  globalThis.fetch = async url => {
    if (url.endsWith('index.json')) return Response.json(index)
    if (url.endsWith('carreaux.geojson')) return Response.json({ type: 'FeatureCollection',
      features: index.ids.map((id, x) => ({ type: 'Feature', properties: { id, pop: 10 },
        geometry: { type: 'Polygon', coordinates: [[[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]]] } })) })
    const numero = Number(url.match(/\/(\d+)\.bin$/)[1])
    requetes.push(numero)
    if (numero === 0) await lente
    return new Response(new Uint8Array([0, 0, 0]))
  }
  const { brancherIsochrones } = await serveur.ssrLoadModule('/src/isochrones/exploration.ts')
  const { isochrones } = await serveur.ssrLoadModule('/src/etat/isochrones.ts')
  isochrones.actif = true
  brancherIsochrones(carte, { vue: () => 'acces' })
  const survoler = () => evenements.get('mousemove')({ point: { x: 0, y: 0 }, originalEvent: { buttons: 0 } })
  survoler()
  await jusquA(() => requetes.length === 1)
  id = 'b'; survoler()
  await jusquA(() => recherches >= 2)
  id = 'c'; survoler()
  await jusquA(() => recherches >= 3)
  assert.deepEqual(requetes, [0], 'Le mouvement ne relance et n’annule pas sans cesse le réseau')
  liberer()
  await jusquA(() => isochrones.origine === 'c' && !isochrones.chargement)
  assert.deepEqual(requetes, [0, 2], 'Les cibles intermédiaires en attente sont remplacées par la dernière')
  assert.equal(isochrones.fixe, false)
  assert.equal(isochrones.erreur, '')
})
