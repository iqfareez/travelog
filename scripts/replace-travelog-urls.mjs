import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

const oldPrefix = 'https://cdn.iqfareez.com/t/Travelog/';
const newPrefix = 'https://r2-fareez-bucket.iqfareez.com/public/Travelog/';
const git = (args, input) => execFileSync('git', args, { input, maxBuffer: 64 * 1024 * 1024 });

function replaceUrls(buffer) {
  const text = buffer.toString('utf8');
  // Leave binary/non-UTF-8 files alone, even if they have a Markdown extension.
  if (buffer.includes(0) || !Buffer.from(text).equals(buffer)) return buffer;
  return Buffer.from(text.replaceAll(oldPrefix, newPrefix));
}

const filenames = git(['diff', '--cached', '--name-only', '--diff-filter=AM', '--no-renames', '-z'])
  .toString('utf8')
  .split('\0')
  .filter(Boolean);

for (const filename of filenames) {
  if (!/^src\/content\/.*\.mdx?$/i.test(filename)) continue;

  const entry = git(['ls-files', '--stage', '-z', '--', filename]).toString('utf8');
  const [mode, objectId, stage] = entry.slice(0, entry.indexOf('\t')).split(' ');
  // Do not follow symlinks or touch unresolved merge entries.
  if (!['100644', '100755'].includes(mode) || stage !== '0') continue;

  const staged = git(['cat-file', 'blob', objectId]);
  const updated = replaceUrls(staged);
  if (updated.equals(staged)) continue;

  // Update only the staged blob so unrelated unstaged edits stay unstaged.
  const updatedId = git(['hash-object', '-w', '--stdin'], updated).toString('utf8').trim();
  git(['update-index', '-z', '--index-info'], `${mode} ${updatedId}\t${filename}\0`);

  // Apply the same URL-only edit to the working copy without staging it.
  if (lstatSync(filename, { throwIfNoEntry: false })?.isFile()) {
    const working = readFileSync(filename);
    const updatedWorking = replaceUrls(working);
    if (!updatedWorking.equals(working)) writeFileSync(filename, updatedWorking);
  }
  process.stdout.write(`Updated Travelog URLs in ${filename}\n`);
}
