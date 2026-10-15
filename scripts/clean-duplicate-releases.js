/**
 * scripts/clean-duplicate-releases.js
 * Detects and removes orphan duplicate GitHub releases that contain only .blockmap files
 * and lack latest.yml / installer executables, ensuring download URLs route correctly.
 */

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
  console.log('ℹ️ No GH_TOKEN provided; skipping duplicate release cleanup.');
  process.exit(0);
}

const owner = 'AgentViande';
const repo = 'Habix';

async function cleanup() {
  console.log(`\n🔍 Checking for duplicate releases on ${owner}/${repo}...`);
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Habix-Release-Cleaner',
    },
  });

  if (!res.ok) {
    console.warn(`Failed to fetch releases: HTTP ${res.status}`);
    return;
  }

  const releases = await res.json();
  if (!Array.isArray(releases)) {
    console.warn('Releases response is not an array.');
    return;
  }

  // Group releases by tag_name
  const byTag = new Map();
  for (const r of releases) {
    const tag = r.tag_name;
    if (!byTag.has(tag)) {
      byTag.set(tag, []);
    }
    byTag.get(tag).push(r);
  }

  let cleanedCount = 0;
  for (const [tag, list] of byTag.entries()) {
    if (list.length > 1) {
      console.log(`⚠️ Found ${list.length} releases for tag "${tag}"`);
      // Find the release that does not have latest.yml or .exe
      for (const r of list) {
        const hasLatestYml = r.assets && r.assets.some((a) => a.name === 'latest.yml');
        const hasExe = r.assets && r.assets.some((a) => a.name.endsWith('.exe'));

        if (!hasLatestYml && !hasExe) {
          console.log(`🗑️ Deleting orphan release ID ${r.id} for tag "${tag}" (assets: ${r.assets.map(a => a.name).join(', ') || 'none'})...`);
          const delRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/${r.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'Habix-Release-Cleaner',
            },
          });
          if (delRes.status === 204 || delRes.ok) {
            console.log(`✅ Successfully deleted orphan release ID ${r.id}`);
            cleanedCount++;
          } else {
            console.warn(`❌ Failed to delete release ID ${r.id}: HTTP ${delRes.status}`);
          }
        }
      }
    }
  }

  console.log(`✨ Cleanup completed. ${cleanedCount} orphan duplicate release(s) removed.\n`);
}

cleanup().catch((err) => {
  console.error('Error during duplicate release cleanup:', err);
  process.exit(0); // Non-blocking failure
});
