// One-shot script: generate static MP3s for every scripted Ari line and write
// a manifest mapping text → filename. Run via `npm run bake:voice`.
//
// Run with: node --env-file=.env scripts/bake-voice.mts
//
// The output lives under public/audio/voice/. ttsClient.ts reads the manifest
// at runtime; manifest miss falls back to the live /api/tts route so this
// script is safe to skip during dev.

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { lesson } from '../src/lib/lesson/lessonData.ts';
import { stripMarkup } from '../src/lib/lesson/stripMarkup.ts';
import { SAMPLE_GREETING } from '../src/lib/voice/sampleGreeting.ts';
import { synthesizeSpeech } from '../src/lib/voice/elevenLabsClient.ts';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, '..');
const outDir = join(projectRoot, 'public', 'audio', 'voice');
const manifestPath = join(outDir, 'manifest.json');

function collectTexts(): readonly string[] {
  const seen = new Set<string>();
  const texts: string[] = [];
  const push = (raw: string): void => {
    const trimmed = stripMarkup(raw).trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    texts.push(trimmed);
  };
  push(SAMPLE_GREETING);
  for (const beat of lesson.beats) push(beat.prose);
  return texts;
}

function fileNameFor(text: string): string {
  const sha = createHash('sha1').update(text).digest('hex').slice(0, 16);
  return `${sha}.mp3`;
}

function loadExistingManifest(): Record<string, string> {
  if (!existsSync(manifestPath)) return {};
  try {
    const raw = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown;
    if (raw && typeof raw === 'object') return raw as Record<string, string>;
    return {};
  } catch {
    return {};
  }
}

async function main(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('ELEVENLABS_API_KEY is not set. Run with `node --env-file=.env scripts/bake-voice.mts` or export the key.');
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });
  const existing = loadExistingManifest();
  const next: Record<string, string> = {};
  const texts = collectTexts();

  let baked = 0;
  let skipped = 0;
  for (const text of texts) {
    const file = fileNameFor(text);
    const filePath = join(outDir, file);
    next[text] = file;

    if (existing[text] === file && existsSync(filePath)) {
      skipped += 1;
      console.log(`  skip  ${file}  ${JSON.stringify(text)}`);
      continue;
    }

    process.stdout.write(`  bake  ${file}  ${JSON.stringify(text)} … `);
    const bytes = await synthesizeSpeech(text, { apiKey });
    writeFileSync(filePath, Buffer.from(bytes));
    baked += 1;
    process.stdout.write('ok\n');
  }

  writeFileSync(manifestPath, JSON.stringify(next, null, 2) + '\n');
  console.log(`\nbaked ${baked}, skipped ${skipped}, wrote manifest with ${Object.keys(next).length} entries.`);
}

await main();
