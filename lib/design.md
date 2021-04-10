# getPackageDependencies, transitive

The initial implementation fo getPackageDependencies did not detect transitive dependencies.
The reason we need transitive dependencies is to allow for all meta-repos to be properly linked
and prevent unindented use of older versions of the meta-repo.

Our detection of "transitive" dependencies is less strict than a correct walk of the various
package.json's would accomplish. In fact, we need to take the laxer approach. This is because
we need to delete all relevant versions of these packages, and create new symlinks to use
the meta-repo children.

For our purposes, it's sufficient to ensure that all direct meta-repo dependencies are
properly symlinks as are any transitive meta-repo dependencies from these set of dependencies.

Say we have the following meta-repo deps defined

```
meta-repo
    repos
        depA@v2 -> depB@v2
        depB@v2
        depC@v2 -> depD@v2
                -> externalDep -> depA@v1
        depD@v2 -> depA@v2
        depE@v2 -> depA@v2
                -> depD@v1


Current implementation handles depA and depB just fine.
We are interested in the node_modules structure for depC and depE.

depC:
    node_modules
        depD@v2
        depA@v2 (via depC -> depD)
        depB@v2 (via depC -> depD -> depA)
        externalDep
            node_modules
                depA@v1
                depB@v1 (via externalDep -> depA -> depB)

depE:
    node_modules:
        depA@v2
        depD@v1
            node_modules
                depA@v1 (cannot be deduped)

```

Basically we land up with two cases to consider with a dedupe:

1. when dependencies are deduped:
   ```
   root_pkg/node_modules/depA
   root_pkg/node_modules/depB
   ```
2. when dependencies are not deduped:
   `root_pkg/node_modules/depA/node_modules/depB`
   When packages are not deduped (case 2), deleting the parent of a transitive dependency and creating a symlink provides a sufficient solution for us.

When dedupe is possible (case 1), we have to actually seek and convert the dependency to a symlink,
otherwise we land up confusing npm/node's install directives.

We have two choices now - to actually re-implement `npm install`s depth first walk and deduping, or do
something simpler. You've probably guessed, we are shooting for simpler! Instead of doing a depth first
walk, we can just search `root_pkg/node_modules` for all modules of interest (deduped or not), and record
a dependency. We can further track if it only created due to a transitive dependnecy.
