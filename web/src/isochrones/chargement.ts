export interface IndexIsochrones {
  format: 'r5-median-u8-v1'
  version: string
  ids: string[]
  date: string
  heure: number
  fenetre: number
  maximum: number
}

/** N'accepte ni chemin libre dans le manifeste, ni ligne partielle ou de version inconnue. */
export function validerIndex(d: unknown): IndexIsochrones {
  const i = d as IndexIsochrones
  if (!i || i.format !== 'r5-median-u8-v1' || !/^[a-f0-9]{16}$/.test(i.version)
    || !Array.isArray(i.ids) || !i.ids.length || i.ids.length > 50000
    || i.ids.some(id => typeof id !== 'string') || new Set(i.ids).size !== i.ids.length
    || !/^\d{4}-\d{2}-\d{2}$/.test(i.date) || i.maximum !== 45
    || !Number.isInteger(i.heure) || i.heure < 0 || i.heure > 23
    || !Number.isInteger(i.fenetre) || i.fenetre < 1 || i.fenetre > 120) throw new Error('Index invalide')
  return i
}

export function validerTemps(buffer: ArrayBuffer, taille: number): Uint8Array {
  const temps = new Uint8Array(buffer)
  if (temps.length !== taille || temps.some(t => t > 45 && t !== 255)) throw new Error('Temps invalides')
  return temps
}

export function creerLecteur(base: string, recuperer: typeof fetch = fetch) {
  let index: Promise<IndexIsochrones> | undefined
  let numeros: Map<string, number>
  const cache = new Map<string, Uint8Array>()
  async function lireIndex(signal: AbortSignal) {
    // Le signal d'une origine n'annule pas l'index partagé entre deux survols.
    index ??= recuperer(`${base}isochrones/index.json`, { signal: AbortSignal.timeout(15000) })
      .then(r => { if (!r.ok) throw new Error('Calculs indisponibles'); return r.json() })
      .then(validerIndex).then(i => { numeros = new Map(i.ids.map((id, n) => [id, n])); return i })
      .catch(e => { index = undefined; throw e })
    const i = await index
    signal.throwIfAborted()
    return i
  }
  return async (origine: string, signal: AbortSignal) => {
    const i = await lireIndex(signal)
    const numero = numeros.get(origine)
    if (numero === undefined) throw new Error('Origine absente')
    const cle = `${i.version}/${numero}`
    let temps = cache.get(cle)
    if (!temps) {
      const reponse = await recuperer(`${base}isochrones/${cle}.bin`, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
      })
      if (!reponse.ok) throw new Error('Temps indisponibles')
      temps = validerTemps(await reponse.arrayBuffer(), i.ids.length)
      if (cache.size >= 128) cache.delete(cache.keys().next().value!)
    }
    cache.delete(cle)
    cache.set(cle, temps)
    signal.throwIfAborted()
    return { index: i, temps, numero }
  }
}
