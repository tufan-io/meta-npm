const fs = require('fs');

module.exports = packages => {
  const results = [];

  const pkgNames = packages.map(p => p.name);

  const depPairs = new Map();
  for (let i = 0; i < packages.length; i++) {
    let parent = packages[i];
    let found = [];

    for (let j = 0; j < packages.length; j++) {
      if (i === j) continue;

      let dependency = packages[j];

      if (parent.dependencies && Object.keys(parent.dependencies).indexOf(dependency.name) > -1) {
        const currVersion = parent.dependencies[dependency.name];
        const nextVersion = dependency.version;
        depPairs.set(parent.name, dependency.name);
        found.push(dependency.name);
        results.push({
          source: dependency.name,
          sourceFolder: dependency.folder,
          target: parent.name,
          targetFolder: parent.folder,
          nextVersion,
          currVersion,
          dev: false,
        });
      }

      if (parent.devDependencies && Object.keys(parent.devDependencies).indexOf(dependency.name) > -1) {
        const currVersion = parent.devDependencies[dependency.name];
        const nextVersion = dependency.version;
        found.push(dependency.name);
        results.push({
          source: dependency.name,
          sourceFolder: dependency.folder,
          target: parent.name,
          targetFolder: parent.folder,
          nextVersion,
          currVersion,
          dev: true,
        });
      }
    }

    // at this point, we'll search parent folder for all other installations of `packages`.
    // please see attached[design doc](./ design.md) for a reasoning why.
    const deduped = getInstalledDeps(parent.folder, pkgNames).forEach(installedDep => {
      if (!found.includes(installedDep.name)) {
        // transitive dependency that was deduped. We need to add this to the list
        const matchingDependency = packages.filter(d => d.name === installedDep.name).pop();
        results.push({
          source: installedDep.name,
          sourceFolder: installedDep.folder,
          target: parent.name,
          targetFolder: parent.folder,
          nextVersion: matchingDependency.version,
          currVersion: installedDep.version,
        });
      }
    });
  }

  return results;
};

function getInstalledDeps(rootDir, pkgNames) {
  const installedDeps = [];
  rootDir = `${rootDir}/node_modules`;
  fs.readdirSync(rootDir, { withFileTypes: true }).forEach(dir1 => {
    if (dir1.isDirectory()) {
      fs.readdirSync(`${rootDir}/${dir1.name}`, { withFileTypes: true }).forEach(dir2 => {
        const name = `${dir1.name}/${dir2.name}`;
        if (dir2.isDirectory() && pkgNames.includes(name)) {
          const folder = `${rootDir}/${name}`;
          const { version } = JSON.parse(fs.readFileSync(`${folder}/package.json`, 'utf8'));
          installedDeps.push({
            name,
            version,
            folder,
          });
        }
      });
    } else if (pkgNames.includes(dir1.name)) {
      const folder = `${rootDir}/${dir1.name}`;
      const { version, name } = JSON.parse(fs.readFileSync(`${folder}/package.json`, 'utf8'));
      installedDeps.push({
        name,
        version,
        folder,
      });
    }
  });
  return installedDeps;
}
