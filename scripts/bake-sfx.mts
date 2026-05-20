// One-shot script: generate short SFX via ElevenLabs sound-generation API.
// Run via `npm run bake:sfx`. Skip-if-exists per file.
//
// To tweak a sound: edit its prompt below and delete the existing file in
// public/audio/sfx/, then re-run.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, '..');
const outDir = join(projectRoot, 'public', 'audio', 'sfx');

type SfxDef = {
  readonly file: string;
  readonly prompt: string;
  readonly duration_seconds: number;
  readonly prompt_influence: number;
};

const SFX: readonly SfxDef[] = [
  {
    file: 'chocolate-snap.mp3',
    prompt:
      'soft warm chocolate bar snap, single short gentle crack, dry close-mic foley, no reverb, no echo, low and mid frequencies only, mellow, brief, satisfying, ASMR-quality, no high-end harshness',
    duration_seconds: 0.5,
    prompt_influence: 0.6,
  },
  {
    file: 'paper-fold.mp3',
    prompt:
      'soft thin paper folding, gentle paper crease, single slow press along a crease, dry close-mic foley, no reverb, no harsh crackle, calm, brief, ASMR-quality, papery whoosh',
    duration_seconds: 1.0,
    prompt_influence: 0.6,
  },
  {
    file: 'whole-split.mp3',
    prompt:
      'chocolate bar splitting cleanly in two, single crisp snap with a soft separating crack, dry close-mic foley, no reverb, warm low-mid frequencies, brief, satisfying, ASMR-quality',
    duration_seconds: 0.6,
    prompt_influence: 0.6,
  },
  {
    file: 'hammer-break.mp3',
    prompt:
      'small wooden mallet tapping a chocolate bar so it breaks into pieces, single soft thock then a light shatter of small pieces, dry close-mic foley, no reverb, playful, brief, ASMR-quality, no harsh high-end',
    duration_seconds: 0.8,
    prompt_influence: 0.6,
  },
];

async function generate(def: SfxDef, apiKey: string): Promise<Uint8Array> {
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'content-type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: def.prompt,
      duration_seconds: def.duration_seconds,
      prompt_influence: def.prompt_influence,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`sound-generation failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function main(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('ELEVENLABS_API_KEY is not set. Run with `node --env-file=.env scripts/bake-sfx.mts`.');
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });

  let baked = 0;
  let skipped = 0;
  for (const def of SFX) {
    const filePath = join(outDir, def.file);
    if (existsSync(filePath)) {
      skipped += 1;
      console.log(`  skip  ${def.file}  (delete to regenerate)`);
      continue;
    }
    process.stdout.write(`  bake  ${def.file}  (${def.duration_seconds}s) … `);
    const bytes = await generate(def, apiKey);
    writeFileSync(filePath, bytes);
    baked += 1;
    process.stdout.write('ok\n');
  }

  console.log(`\nbaked ${baked}, skipped ${skipped}.`);
}

await main();
