const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure git is accessible in PATH on Windows
const minGitCmd = 'C:\\Users\\Lilian\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\\cmd';
if (fs.existsSync(minGitCmd) && !process.env.PATH.includes(minGitCmd)) {
  process.env.PATH = `${minGitCmd};${process.env.PATH}`;
}

function runGit(cmd) {
  try {
    return execSync(`git ${cmd}`, { encoding: 'utf8', env: process.env }).trim();
  } catch (_e) {
    return '';
  }
}

// 1. Identify current tag and previous tag
const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
const currentVersion = packageJson.version;
let currentTag = process.env.GITHUB_REF_NAME || runGit('describe --tags --exact-match') || `v${currentVersion}`;
if (!currentTag.startsWith('v')) {
  currentTag = `v${currentTag}`;
}

// Get all tags sorted by creation date descending
const allTagsRaw = runGit('tag --sort=-creatordate');
const allTags = allTagsRaw ? allTagsRaw.split('\n').map((t) => t.trim()).filter(Boolean) : [];

let prevTag = '';
if (allTags.length > 0) {
  const currentIndex = allTags.indexOf(currentTag);
  if (currentIndex >= 0 && currentIndex < allTags.length - 1) {
    prevTag = allTags[currentIndex + 1];
  } else if (currentIndex === -1) {
    // Current tag is not yet created or different, previous tag is the latest existing tag
    prevTag = allTags[0];
  }
}

console.log(`📌 Tag courant : ${currentTag}`);
console.log(`📌 Tag précédent : ${prevTag || '(aucun - premier release)'}`);

// 2. Fetch git log
let logCmd = 'log --no-merges --pretty=format:"%h|%s"';
if (prevTag && prevTag !== currentTag) {
  logCmd += ` ${prevTag}..HEAD`;
}

const rawCommits = runGit(logCmd);
const commitLines = rawCommits ? rawCommits.split('\n').filter(Boolean) : [];

// 3. Classify commits into sections
const sections = {
  feat: { title: '✨ Nouveautés', items: [] },
  fix: { title: '🐛 Corrections', items: [] },
  perf: { title: '⚡ Performance', items: [] },
  ui: { title: '🎨 Interface', items: [] },
  other: { title: '🔧 Autres changements', items: [] },
};

for (const line of commitLines) {
  const [hash, ...rest] = line.split('|');
  const subject = rest.join('|').trim();

  // Ignore release version commits, bump commits, or changelog commits
  if (
    /^v?\d+\.\d+\.\d+$/i.test(subject) ||
    subject.startsWith('chore: update changelog') ||
    subject.startsWith('chore: release')
  ) {
    continue;
  }

  const cleanSubject = subject.replace(/^(feat|fix|perf|ui|style|refactor|chore|docs|test)(\([^)]+\))?:\s*/i, '');
  const formattedMsg = cleanSubject ? cleanSubject.charAt(0).toUpperCase() + cleanSubject.slice(1) : subject;
  const itemText = `- ${formattedMsg} (\`${hash}\`)`;

  const lower = subject.toLowerCase();
  if (/^feat(\([^)]+\))?:/i.test(lower)) {
    sections.feat.items.push(itemText);
  } else if (/^fix(\([^)]+\))?:/i.test(lower)) {
    sections.fix.items.push(itemText);
  } else if (/^perf(\([^)]+\))?:/i.test(lower)) {
    sections.perf.items.push(itemText);
  } else if (/^(ui|style)(\([^)]+\))?:/i.test(lower)) {
    sections.ui.items.push(itemText);
  } else {
    sections.other.items.push(itemText);
  }
}

// 4. Build Markdown patch notes
const todayStr = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

let patchNotes = `## Habix ${currentTag} (${todayStr})\n\n`;

let hasContent = false;
for (const key of ['feat', 'fix', 'perf', 'ui', 'other']) {
  const section = sections[key];
  if (section.items.length > 0) {
    patchNotes += `### ${section.title}\n\n`;
    patchNotes += `${section.items.join('\n')}\n\n`;
    hasContent = true;
  }
}

if (!hasContent) {
  patchNotes += `### 🔧 Améliorations générales\n\n- Mises à jour de stabilité et améliorations de performances.\n\n`;
}

// Footer link
if (prevTag && prevTag !== currentTag) {
  patchNotes += `**Full Changelog**: https://github.com/AgentViande/Habix/compare/${prevTag}...${currentTag}\n`;
} else {
  patchNotes += `**Initial Release**: https://github.com/AgentViande/Habix/releases/tag/${currentTag}\n`;
}

// Write notes.md
fs.writeFileSync(path.resolve('notes.md'), patchNotes.trim() + '\n', 'utf8');
console.log('✅ Fichier notes.md généré avec succès !');

// 5. Update or prepend to CHANGELOG.md
const changelogPath = path.resolve('CHANGELOG.md');
let currentChangelog = '';
if (fs.existsSync(changelogPath)) {
  currentChangelog = fs.readFileSync(changelogPath, 'utf8');
}

const changelogHeader = '# 📜 Journal des modifications (Changelog)\n\n';
if (!currentChangelog.includes(currentTag)) {
  let body = currentChangelog.replace(changelogHeader, '').trim();
  const updatedChangelog = `${changelogHeader}${patchNotes.trim()}\n\n---\n\n${body}`.trim() + '\n';
  fs.writeFileSync(changelogPath, updatedChangelog, 'utf8');
  console.log('✅ Fichier CHANGELOG.md mis à jour avec succès !');
} else {
  console.log('ℹ️ Section déjà présente dans CHANGELOG.md, aucun doublon inséré.');
}
