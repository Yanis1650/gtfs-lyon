// Calque des véhicules : une toile 2D posée sur la carte, redessinée à chaque image.
// Un millier de disques par image ne demande ni WebGL ni bibliothèque de plus.
import type { Map as CarteMapLibre } from 'maplibre-gl'

import type { Mode } from '../donnees'

export interface Vehicule {
  lon: number
  lat: number
  mode: Mode
  couleur: string
}

export interface Teintes {
  /** Contour des disques, couleur du papier : il détache chaque véhicule des traits. */
  contour: string
  /** Bus et trolleybus, trop nombreux pour leurs couleurs propres. */
  bus: string
}

// Les modes lourds se dessinent en dernier, par-dessus, plus gros et aux couleurs de leurs lignes.
const ORDRE: Mode[] = ['bus', 'trolleybus', 'navette_fluviale', 'funiculaire', 'tram', 'metro', 'train']
const RAYON: Record<Mode, number> = {
  bus: 2.6,
  trolleybus: 2.6,
  navette_fluviale: 3.2,
  funiculaire: 3.4,
  tram: 3.6,
  metro: 4.4,
  train: 4.4,
}
const EN_TEINTE_COMMUNE = new Set<Mode>(['bus', 'trolleybus'])

export function creerCalque(carte: CarteMapLibre) {
  const toile = document.createElement('canvas')
  toile.className = 'calque-vehicules'
  toile.setAttribute('aria-hidden', 'true')
  Object.assign(toile.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' })
  carte.getCanvasContainer().appendChild(toile)
  const ctx = toile.getContext('2d')!

  // Une toile à la densité de l'écran, pour des disques nets sur téléphone.
  function dimensionner() {
    const { clientWidth: l, clientHeight: h } = carte.getCanvas()
    const r = window.devicePixelRatio || 1
    toile.width = Math.round(l * r)
    toile.height = Math.round(h * r)
    toile.style.width = `${l}px`
    toile.style.height = `${h}px`
    ctx.setTransform(r, 0, 0, r, 0, 0)
  }
  dimensionner()
  carte.on('resize', dimensionner)

  function effacer() {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, toile.width, toile.height)
    ctx.restore()
  }

  function dessiner(vehicules: Vehicule[], teintes: Teintes) {
    effacer()
    const { clientWidth: l, clientHeight: h } = carte.getCanvas()
    // Disques un peu plus gros quand on zoome, sans devenir énormes.
    const echelle = Math.min(2.2, Math.max(0.7, 2 ** ((carte.getZoom() - 12) / 2)))
    ctx.lineWidth = 1.2
    ctx.strokeStyle = teintes.contour
    for (const mode of ORDRE) {
      const r = RAYON[mode] * echelle
      for (const v of vehicules) {
        if (v.mode !== mode) continue
        const p = carte.project([v.lon, v.lat])
        if (p.x < -r || p.y < -r || p.x > l + r || p.y > h + r) continue
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, 2 * Math.PI)
        ctx.fillStyle = EN_TEINTE_COMMUNE.has(mode) ? teintes.bus : v.couleur
        ctx.fill()
        ctx.stroke()
      }
    }
  }

  return { dessiner, effacer }
}
