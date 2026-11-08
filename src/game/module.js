// Modulliste in Startreihenfolge (Pfad relativ zu /spiel/). Jedes Modul: export function init(ctx) → { update(dt)?, dispose()?, selbsttest()? }
// Bausteine mit „MiniMax“ entstehen über build/auftraege_spiel/ (Anleitung: build/ANLEITUNG_SPIEL.md).
export const MODULE = [
  { name: 'assets', pfad: './core/assets.js' },             // Claude: Laden von Räumen/Objekten aus der API
  { name: 'licht', pfad: './core/licht.js' },               // Claude: Lichtpool
  { name: 'kollision', pfad: './welt/kollision.js' },       // Claude: BVH-Kollision, Kapsel-Bewegung
  { name: 'huelle', pfad: './welt/huelle.js' },          // MiniMax: Material der Stadt-Außenhülle
  { name: 'aussen', pfad: './welt/aussen.js' },             // MiniMax: Stadt-Außenhülle, Wasser, Himmel
  { name: 'welt', pfad: './welt/streaming.js' },            // MiniMax: Räume nachladen/entladen, Transporter-Ziele
  { name: 'planet', pfad: './welt/planet.js' },           // MiniMax: Fremdplanet
  { name: 'transporter', pfad: './core/transporter.js' }, // Claude: Transporterkabinen an den Planpunkten
  { name: 'spieler', pfad: './spieler/steuerung.js' },      // MiniMax: Laufen, Springen, Blick, Respawn
  { name: 'torreise', pfad: './spieler/torreise.js' },   // MiniMax: Reise durch das Stargate
  { name: 'jumper', pfad: './spieler/jumper.js' },        // Claude: Jumper-Flug, automatische Luken
  { name: 'innenaussen', pfad: './core/innen_aussen.js' }, // Claude: Licht drinnen/draußen
  { name: 'verdeckung', pfad: './core/verdeckung.js' }, // Claude: Occlusion Culling (Räume/Hüllenkacheln)
  { name: 'benutzen', pfad: './spieler/benutzen.js' },      // MiniMax: Benutzen-Punkte, Funktionsmenü, Türen
  { name: 'ui', pfad: './ui/menue.js' },                    // MiniMax: Anzeige, Einstellungsmenü, Pause
  { name: 'leistung', pfad: './core/leistung.js' },     // Claude: Leistungsanzeige (F3)
  { name: 'nachbearbeitung', pfad: './core/nachbearbeitung.js' }, // Claude: Bloom
];
