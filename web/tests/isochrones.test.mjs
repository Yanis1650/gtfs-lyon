import assert from 'node:assert/strict'
import { test } from 'node:test'
import { creerLecteur, validerIndex, validerTemps } from '../src/isochrones/chargement.ts'
import { dessiner, frontiere, ordonner } from '../src/isochrones/geometrie.ts'

const cellule = (id, x, y, pop = 10) => ({ type: 'Feature', properties: { id, pop },
  geometry: { type: 'Polygon', coordinates: [[[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x, y]]] } })
const index = { format: 'r5-median-u8-v1', version: '1234567890abcdef', ids: ['a', 'b'],
  date: '2026-11-17', heure: 8, fenetre: 60, maximum: 45 }

test('une frontière enlève les arêtes partagées et garde les deux îlots', () => {
  const cellules = [cellule('a', 0, 0), cellule('b', 1, 0), cellule('c', 4, 0)]
  assert.equal(frontiere(cellules, new Uint8Array([10, 20, 30]), 15).length, 4)
  assert.equal(frontiere(cellules, new Uint8Array([10, 20, 30]), 30).length, 10)
})

test('un trou non habité conserve sa frontière intérieure', () => {
  const cellules = []
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
    if (x !== 1 || y !== 1) cellules.push(cellule(`${x},${y}`, x, y))
  }
  assert.equal(frontiere(cellules, new Uint8Array(8).fill(10), 15).length, 16)
})

test('les seuils sont inclusifs, les absences ne comptent pas, les temps sont orientés', () => {
  const cellules = [cellule('a', 0, 0, 100), cellule('b', 1, 0, 200), cellule('c', 2, 0, 300)]
  const trace = dessiner(cellules, new Uint8Array([0, 15, 255]), 0, 15)
  assert.equal(trace.habitants, 300)
  assert.equal(trace.carreaux, 2)
  assert.deepEqual(trace.depart.features[0].geometry.coordinates, [.5, .5])
  assert.deepEqual(trace.contours.features.map(f => f.properties.minutes), [15])
  assert.equal(dessiner(cellules, new Uint8Array([30, 0, 255]), 1, 15).habitants, 200)
  assert.throws(() => dessiner(cellules, new Uint8Array([0]), 0, 15))
})

test('les identifiants du manifeste déterminent l’ordre, pas celui du GeoJSON', () => {
  const a = cellule('a', 0, 0), b = cellule('b', 1, 0)
  assert.deepEqual(ordonner({ features: [a, b] }, ['b', 'a']), [b, a])
  assert.throws(() => ordonner({ features: [a] }, ['absent']))
})

test('un chemin de manifeste ou une ligne binaire invalide est refusé', () => {
  assert.equal(validerIndex(index), index)
  assert.throws(() => validerIndex({ ...index, version: '../../secret' }))
  assert.throws(() => validerIndex({ ...index, ids: ['a', 'a'] }))
  assert.throws(() => validerIndex({ ...index, heure: 24 }))
  assert.throws(() => validerTemps(new Uint8Array([0, 46]).buffer, 2))
  assert.throws(() => validerTemps(new Uint8Array([0]).buffer, 2))
  assert.deepEqual([...validerTemps(new Uint8Array([0, 255]).buffer, 2)], [0, 255])
})

test('le lecteur utilise un cache borné et refuse une origine inconnue', async () => {
  const requetes = []
  const lire = creerLecteur('/data/', async url => {
    requetes.push(url)
    return url.endsWith('index.json') ? Response.json(index) : new Response(new Uint8Array([0, 25]))
  })
  const signal = new AbortController().signal
  assert.deepEqual([...(await lire('a', signal)).temps], [0, 25])
  await lire('a', signal)
  assert.deepEqual(requetes, ['/data/isochrones/index.json', '/data/isochrones/1234567890abcdef/0.bin'])
  await assert.rejects(lire('introuvable', signal))
})

test('un index indisponible peut être retenté ; une requête annulée ne renvoie pas de résultat', async () => {
  let appels = 0
  const lire = creerLecteur('/data/', async url => {
    if (appels++ === 0) return new Response('', { status: 503 })
    return url.endsWith('index.json') ? Response.json(index) : new Response(new Uint8Array([0, 25]))
  })
  const controle = new AbortController()
  await assert.rejects(lire('a', controle.signal))
  await lire('a', controle.signal)
  controle.abort()
  await assert.rejects(lire('a', controle.signal), { name: 'AbortError' })
})
