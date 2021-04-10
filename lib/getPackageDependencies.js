module.exports = packages => {
  var results = [];

  for (let i = 0; i < packages.length; i++) {
    let parent = packages[i];

    for (let j = 0; j < packages.length; j++) {
      if (i === j) continue;

      let dependency = packages[j];

      if (parent.dependencies && Object.keys(parent.dependencies).indexOf(dependency.name) > -1) {
        const currVersion = parent.dependencies[dependency.name];
        const nextVersion = dependency.version;
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
  }

  return results;
};
