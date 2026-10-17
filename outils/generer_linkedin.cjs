// Visuels reproductibles : aucun tracé ni chiffre inventé. npm install --no-save sharp, hors du projet si nécessaire.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const charger = process.env.ATLAS_SHARP_MODULES
  ? createRequire(path.join(process.env.ATLAS_SHARP_MODULES, 'package.json')) : require;
const sharp = charger('sharp');
const racine = path.resolve(__dirname, '..');
const lire = nom => JSON.parse(fs.readFileSync(path.join(racine, 'web/public/data', nom), 'utf8'));
const meta = lire('meta.json');
const date = new Intl.DateTimeFormat('fr-FR', {day:'numeric', month:'long', year:'numeric', timeZone:'Europe/Paris'})
  .format(new Date(`${meta.date_reference}T12:00:00Z`));
const lignes = lire('lignes.geojson').features;
const arrets = lire('arrets.geojson').features;
const selection = ['T1', 'T3'].map(id => lignes.find(f => f.properties.id === id));
if (selection.some(f => !f || !Number.isFinite(f.properties.vitesse))) throw new Error('T1/T3 introuvables');
const c = { papier: '#f7f2e6', plan: '#efe6d1', encre: '#1c2523', discret: '#4a5654',
  ardoise: '#3c565d', doux: '#a8bec3', terre: '#bc6a4a', filet: '#dcd3bd' };
const ech = s => String(s).replace(/[&<>"']/g, a => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[a]));
const nombre = n => new Intl.NumberFormat('fr-FR').format(n).replace(/\s/g, ' ');
const vitesse = f => f.properties.vitesse.toFixed(1).replace('.', ',');
const texte = (x, y, contenu, taille = 24, couleur = c.encre, poids = 400, extra = '') =>
  `<text x="${x}" y="${y}" fill="${couleur}" font-size="${taille}" font-weight="${poids}" ${extra}>${ech(contenu)}</text>`;
const trait = (x1, y1, x2, y2, couleur = c.filet, largeur = 1) =>
  `<path d="M${x1},${y1}L${x2},${y2}" stroke="${couleur}" stroke-width="${largeur}"/>`;
const rect = (x, y, w, h, couleur) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${couleur}"/>`;
const sequences = f => f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
function carte(x, y, w, h, comparaison = false) {
  const bornes = comparaison ? [4.815, 45.72, 5.06, 45.815] : [4.775, 45.685, 4.995, 45.835];
  const [ouest, sud, est, nord] = bornes;
  const ratio = Math.cos(45.76 * Math.PI / 180);
  const echelle = Math.min(w / ((est-ouest)*ratio), h / (nord-sud));
  const proj = p => [x+w/2+(p[0]-(est+ouest)/2)*ratio*echelle, y+h/2-(p[1]-(nord+sud)/2)*echelle];
  const trace = f => sequences(f).map(s => s.map((p, i) => `${i ? 'L' : 'M'}${proj(p).map(n => n.toFixed(1)).join(',')}`).join('')).join('');
  const rail = f => ['metro','tram','funiculaire'].includes(f.properties.mode);
  const id = `carte-${x}-${y}`;
  let svg = `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs>`;
  svg += rect(x, y, w, h, c.plan) + `<g clip-path="url(#${id})" fill="none" stroke-linecap="round" stroke-linejoin="round">`;
  for (const f of lignes) svg += `<path d="${trace(f)}" stroke="${rail(f) ? c.ardoise : c.doux}" stroke-width="${rail(f) ? 2.1 : 0.85}" opacity="${comparaison ? 0.18 : 0.65}"/>`;
  if (comparaison) selection.forEach((f, i) => { svg += `<path d="${trace(f)}" stroke="${i ? c.ardoise : c.terre}" stroke-width="5.5"/>`; });
  else for (const f of arrets.filter(a => a.properties.departs > 1300)) {
    const p = proj(f.geometry.coordinates);
    svg += `<circle cx="${p[0]}" cy="${p[1]}" r="3.7" stroke="${c.ardoise}" stroke-width="1.5" fill="${c.papier}"/>`;
  }
  svg += '</g>';
  const points = comparaison ? [] : [meta.poles.find(p => p.id === 'bellecour'), meta.poles.find(p => p.id === 'part_dieu')];
  for (const p of points) {
    const [px, py] = proj([p.lon, p.lat]);
    svg += rect(px+5, py-21, p.id === 'bellecour' ? 83 : 90, 23, c.papier);
    svg += texte(px+9, py-4, p.id === 'bellecour' ? 'Bellecour' : 'Part-Dieu', 15, c.ardoise, 600);
  }
  return svg;
}
const entete = (numero, titre) => texte(64, 76, 'ATLAS DES TRANSPORTS LYONNAIS', 19, c.terre, 600, 'letter-spacing="2"')
  + texte(1016, 76, numero, 19, c.discret, 400, 'text-anchor="end"') + texte(64, 166, titre, 58, c.encre, 650);
const pied = (h, source = 'Sources : SYTRAL Mobilités (GTFS) · OpenStreetMap — ODbL') =>
  trait(64, h-132, 1016, h-132) + texte(64, h-93, `Horaires théoriques · ${date}`, 20, c.discret)
  + texte(64, h-58, source, 17, c.discret) + texte(64, h-23, 'atlas-lyon.drekky.fr', 22, c.ardoise, 600)
  + texte(1016, h-23, 'Yanis Lepesant', 19, c.discret, 400, 'text-anchor="end"');
function document(w, h, contenu, titre) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>${ech(titre)}</title><rect width="${w}" height="${h}" fill="${c.papier}"/><g font-family="Segoe UI, Arial, sans-serif">${contenu}</g></svg>`;
}
async function enregistrer(nom, w, h, contenu, titre) {
  const svg = document(w,h,contenu,titre);
  const dossier = path.join(racine, 'Linkedin');
  fs.mkdirSync(path.join(dossier, 'sources'), {recursive:true});
  fs.mkdirSync(path.join(dossier, 'images'), {recursive:true});
  fs.writeFileSync(path.join(dossier, 'sources', `${nom}.svg`), svg);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync(path.join(dossier, 'images', `${nom}.png`), png);
  console.log(`${nom}.png : ${w} × ${h}, ${Math.round(png.length/1024)} Ko`);
  return png;
}
async function main() {
  let s = texte(64,65,'ATLAS DES TRANSPORTS LYONNAIS',17,c.terre,600,'letter-spacing="1.7"');
  s += texte(64,169,'Lyon',76,c.encre,650) + texte(64,253,'sans voiture',76,c.terre,650);
  s += texte(67,320,'Jusqu’où va le réseau TCL ?',28,c.ardoise,500);
  s += texte(67,386,'Offre · Vitesses · Accessibilité',23,c.discret);
  s += trait(67,421,552,421) + texte(67,475,nombre(meta.courses),42,c.encre,650)
    + texte(67,505,'courses programmées',19,c.discret) + texte(352,475,nombre(meta.arrets),42,c.encre,650)
    + texte(352,505,'arrêts desservis',19,c.discret);
  s += carte(635,24,541,519) + texte(652,526,'Tracés : SYTRAL Mobilités / OSM · ODbL',14,c.discret);
  s += trait(64,554,1136,554) + texte(64,591,`Horaires théoriques · ${date}`,17,c.discret)
    + texte(1136,591,'atlas-lyon.drekky.fr',21,c.ardoise,600,'text-anchor="end"');
  const couverture = await enregistrer('couverture-lien',1200,627,s,'Lyon sans voiture : atlas interactif du réseau TCL');
  fs.mkdirSync(path.join(racine,'web/public/partage'),{recursive:true});
  fs.writeFileSync(path.join(racine,'web/public/partage/lyon-sans-voiture.png'),couverture);
  s = entete('01 / 03','Lyon sans voiture');
  s += texte(64,225,'Et si l’on regardait le réseau autrement ?',29,c.ardoise);
  s += carte(64,274,952,630) + texte(83,878,'Extrait géographique des tracés du réseau',18,c.discret);
  s += texte(64,1006,nombre(meta.courses),68,c.encre,650) + texte(64,1047,'courses programmées dans la journée',24,c.discret);
  s += texte(700,1006,nombre(meta.arrets),68,c.terre,650) + texte(700,1047,'arrêts desservis',24,c.discret);
  s += texte(64,1138,'Une carte interactive. Trois façons d’explorer.',29,c.ardoise,500) + pied(1350);
  await enregistrer('01-atlas',1080,1350,s,`Lyon sans voiture : ${nombre(meta.courses)} courses et ${nombre(meta.arrets)} arrêts le jour de référence`);
  s = entete('02 / 03','Deux trams. Deux rythmes.');
  s += texte(64,232,'Presque du simple au double.',34,c.ardoise,500);
  s += texte(64,303,'Vitesse commerciale moyenne sur la ligne complète',23,c.discret);
  const x0 = 200, echelle = 19, y0 = 580;
  for (let tick=0; tick<=40; tick+=10) {
    s += trait(x0+tick*echelle,370,x0+tick*echelle,y0,c.filet)
      + texte(x0+tick*echelle,y0+34,tick,19,c.discret,400,'text-anchor="middle"');
  }
  selection.forEach((f,i) => {
    const y=390+i*100, couleur=i?c.ardoise:c.terre, v=f.properties.vitesse;
    s += texte(64,y+35,f.properties.ligne,34,couleur,650) + rect(x0,y,v*echelle,48,couleur)
      + texte(x0+v*echelle+16,y+36,vitesse(f),32,couleur,650);
  });
  s += texte(960,660,'Vitesse commerciale (km/h)',22,c.discret,400,'text-anchor="end"');
  s += carte(64,722,952,313,true);
  s += texte(64,1086,'T1 · Debourg — IUT Feyssine',22,c.terre,600)
    + texte(64,1120,'T3 · Part-Dieu Villette — Meyzieu les Panettes',22,c.ardoise,600);
  s += texte(64,1173,'Arrêts compris. Cette comparaison ne mesure pas les causes de l’écart.',21,c.discret) + pied(1350);
  await enregistrer('02-vitesses-T1-T3',1080,1350,s,`Vitesse commerciale théorique : T1 ${vitesse(selection[0])} km/h, T3 ${vitesse(selection[1])} km/h`);
  s = entete('03 / 03','À vous d’explorer.');
  s += texte(64,235,'Trois questions pour lire le réseau TCL.',30,c.ardoise);
  const items = [
    ['01','À quelle heure passe-t-il ?','Explorez l’offre et les départs à chaque arrêt.'],
    ['02','À quelle vitesse ?','Comparez les lignes et leurs tronçons.'],
    ['03','Que peut-on rejoindre ?','Explorez l’accessibilité en 30 et 45 minutes.'],
  ];
  items.forEach(([n,t,d],i) => {
    const y=347+i*198;
    s += trait(64,y-36,1016,y-36) + texte(64,y+4,n,25,c.terre,600)
      + texte(146,y+4,t,36,c.encre,600) + texte(146,y+53,d,25,c.discret);
  });
  s += rect(64,930,952,220,c.ardoise) + texte(100,994,'Ouvrez la carte interactive',32,c.papier,600)
    + texte(100,1065,'atlas-lyon.drekky.fr',44,c.papier,600)
    + texte(100,1111,'Code public · Données ouvertes · Sans suivi publicitaire',20,c.papier);
  s += pied(1350,'Sources : SYTRAL Mobilités · OSM · Insee Filosofi 2021');
  await enregistrer('03-explorer',1080,1350,s,'Explorer l’offre, les vitesses et l’accessibilité du réseau TCL');
  const provenance = {date_reference:meta.date_reference,source_generation:meta.genere_le,
    sources:['web/public/data/meta.json','web/public/data/lignes.geojson','web/public/data/arrets.geojson'],
    courses:meta.courses,arrets:meta.arrets,vitesses:selection.map(f=>f.properties),
    limites:'Horaires théoriques. Comparaison de lignes complètes, sans inférence causale. Aucun chiffre d’accessibilité dans les visuels.'};
  fs.writeFileSync(path.join(racine,'Linkedin/sources/chiffres.json'),JSON.stringify(provenance,null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
