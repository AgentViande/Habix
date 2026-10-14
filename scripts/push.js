import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
let bumpType = 'patch';
const messageParts = [];

for (const arg of args) {
  if (arg === '--minor') {
    bumpType = 'minor';
  } else if (arg === '--major') {
    bumpType = 'major';
  } else if (arg === '--patch') {
    bumpType = 'patch';
  } else if (arg === '--no-bump') {
    bumpType = 'none';
  } else {
    messageParts.push(arg);
  }
}

const customMessage = messageParts.join(' ').trim();

function run(cmd, desc) {
  console.log(`\n⏳ ${desc}...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`\n❌ Échec : ${desc}`);
    console.error(`Commande : ${cmd}`);
    process.exit(1);
  }
}

function runCapture(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

console.log('\n============================================================');
console.log('🚀 Habix — Publication Automatique vers GitHub');
console.log('============================================================');

// 1. Lire et incrémenter la version dans package.json
const pkgPath = path.resolve('package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const oldVersion = pkg.version || '1.0.0';

let newVersion = oldVersion;
if (bumpType !== 'none') {
  const parts = oldVersion.split('.').map(Number);
  if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
    if (bumpType === 'major') {
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
    } else if (bumpType === 'minor') {
      parts[1] += 1;
      parts[2] = 0;
    } else {
      parts[2] += 1;
    }
    newVersion = parts.join('.');
    pkg.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`📦 Version : v${oldVersion} ➔ v${newVersion} (${bumpType})`);
  }
}

const commitTitle = customMessage
  ? `v${newVersion}: ${customMessage}`
  : `v${newVersion}: mise à jour et synchronisation`;

// 2. Vérification que le build passe avant de push
run('npm run build', '1/4 Vérification et compilation du code');

// 3. Git commit
console.log('\n⏳ 2/4 Préparation du commit Git...');
run('git add -A', 'Indexation des fichiers modifiés');
const status = runCapture('git status --porcelain');
if (status.length > 0) {
  run(`git commit -m "${commitTitle.replace(/"/g, '\\"')}"`, `Enregistrement du commit "${commitTitle}"`);
} else {
  console.log('ℹ️ Aucun fichier supplémentaire à commiter.');
}

// 4. Création du tag Git
const tagName = `v${newVersion}`;
console.log(`\n⏳ 3/4 Création du tag ${tagName}...`);
const existingTags = runCapture(`git tag -l "${tagName}"`);
if (!existingTags) {
  run(`git tag -a "${tagName}" -m "Release ${tagName}"`, `Création du tag ${tagName}`);
} else {
  console.log(`ℹ️ Le tag ${tagName} existe déjà localement.`);
}

// 5. Envoi vers GitHub
console.log('\n⏳ 4/4 Envoi du code et des tags vers GitHub...');
run('git push origin main --tags', 'Publication sur GitHub (branche main et tags)');

console.log('\n============================================================');
console.log(`🎉 Habix ${tagName} a été envoyé avec succès vers GitHub !`);
console.log('🌐 Dépôt : https://github.com/AgentViande/Habix.git');
console.log('🤖 Le workflow GitHub Actions va maintenant :');
console.log('   1. Compiler l\'application native Windows (Habix Setup.exe)');
console.log('   2. Publier la mise à jour sur GitHub Releases');
console.log('   3. Mettre à jour latest.yml pour l\'auto-update des clients installés');
console.log(`📥 Lien direct : https://github.com/AgentViande/Habix/releases/tag/${tagName}`);
console.log('============================================================\n');
