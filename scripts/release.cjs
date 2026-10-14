const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure git and node are accessible in PATH on Windows
const minGitCmd = 'C:\\Users\\Lilian\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\\cmd';
if (fs.existsSync(minGitCmd) && !process.env.PATH.includes(minGitCmd)) {
  process.env.PATH = `${minGitCmd};${process.env.PATH}`;
}

// Parse arguments
const args = process.argv.slice(2);
let releaseType = 'patch';
const positionalArgs = [];

for (const arg of args) {
  if (arg.startsWith('--type=')) {
    releaseType = arg.split('=')[1];
  } else if (arg === '--minor') {
    releaseType = 'minor';
  } else if (arg === '--major') {
    releaseType = 'major';
  } else if (arg === '--patch') {
    releaseType = 'patch';
  } else {
    positionalArgs.push(arg);
  }
}

const commitMessage = positionalArgs.join(' ').trim() || 'chore: automated release';

function run(command, description) {
  console.log(`\n⏳ ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', env: process.env });
  } catch (error) {
    console.error(`\n❌ Échec lors de : ${description}`);
    console.error(`Commande : ${command}`);
    process.exit(1);
  }
}

function runCapture(command) {
  return execSync(command, { encoding: 'utf8', env: process.env }).trim();
}

console.log('========================================');
console.log(`🚀 Préparation de la release Habix (${releaseType})`);
console.log(`📝 Message de commit : "${commitMessage}"`);
console.log('========================================');

// a. Vérifier que le build passe
run('npm run build', '1/4 Vérification du build de production');

// b. Git add -A et commit si nécessaire
console.log('\n⏳ 2/4 Préparation du commit Git...');
try {
  runCapture('git add -A');
  const status = runCapture('git status --porcelain');
  if (status.length > 0) {
    run(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, 'Enregistrement du commit');
  } else {
    console.log('ℹ️ Aucun changement en cours à commiter, poursuite.');
  }
} catch (error) {
  console.error('❌ Erreur lors du commit Git :', error.message);
  process.exit(1);
}

// c. Monter la version avec npm version et créer le tag
run(`npm version ${releaseType} -m "v%s"`, `3/4 Incrémentation de la version (${releaseType}) et création du tag`);

const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
const newVersion = packageJson.version;

// d. Envoyer le code et le tag sur GitHub
run('git push --follow-tags', '4/4 Publication du code et des tags vers GitHub (remote origin)');

console.log('\n========================================');
console.log(`🎉 Habix v${newVersion} a été publiée avec succès !`);
console.log('📡 Le workflow GitHub Actions va maintenant générer les patch notes et empaqueter la release Windows.');
console.log('========================================\n');
