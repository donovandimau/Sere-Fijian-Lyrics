import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const P=require('../practice.js');
const pcs=a=>[...new Set(a.map(m=>((m%12)+12)%12))].sort((x,y)=>x-y);

// Chord names per key.
assert.deepEqual(P.chordsFor('C').map(c=>c.name),['C','F','G','Am','G7']);
assert.deepEqual(P.chordsFor('G').map(c=>c.name),['G','C','D','Em','D7']);
assert.deepEqual(P.chordsFor('E').map(c=>c.name),['E','A','B','C#m','B7']);
assert.deepEqual(P.chordsFor('Bb').map(c=>c.name),['Bb','Eb','F','Gm','F7']);
assert.deepEqual(P.chordsFor('Eb').map(c=>c.name),['Eb','Ab','Bb','Cm','Bb7']);

// Every guitar and ukulele shape, with its capo, sounds exactly the chord it claims, in every key.
for(const [key] of P.KEYS)for(const instr of ['guitar','uke']){
  const chords=P.chordsFor(key),shapes=P.shapesFor(key,instr);
  assert.equal(shapes.length,5);
  shapes.forEach((s,i)=>{
    assert.deepEqual(pcs(s.midi),pcs(chords[i].midi),`${instr} ${key}: ${s.shape} capo ${s.capo} should sound ${chords[i].name}`);
    assert.equal(s.sounds,chords[i].name);
    assert.equal(s.frets.length,P.INSTR[instr].open.length);
  });
}
assert.equal(P.capoText('A','guitar'),'capo 2, play G shapes');
assert.equal(P.capoText('C','uke'),'no capo, C shapes');

// Sol-fa: doh is the key note, and the scale is major.
assert.deepEqual(P.solfaFor('G').map(n=>n.name),['G','A','B','C','D','E','F#','G']);
assert.deepEqual(P.solfaFor('F').map(n=>n.name),['F','G','A','Bb','C','D','E','F']);
assert.equal(P.solfaFor('C')[0].midi,60);

// The page is reachable and honest about what the chords are.
const html=readFileSync(new URL('../practice.html',import.meta.url),'utf8');
assert.match(html,/not this song's own chords/);
assert.match(html,/check your songbook or music leader/);
for(const f of ['index.html','studio.html'])assert.match(readFileSync(new URL('../'+f,import.meta.url),'utf8'),/<a href="practice\.html"/);
assert.match(readFileSync(new URL('../app.js',import.meta.url),'utf8'),/practice\.html\?song=\$\{encodeURIComponent\(s\.id\)\}">Practise this song/);
// Song words are written as text, never as markup.
const js=readFileSync(new URL('../practice.js',import.meta.url),'utf8');
assert.doesNotMatch(js,/innerHTML/);
console.log('PASS: chords, guitar/ukulele shapes with capo, sol-fa, links and safe text on the practice page.');
