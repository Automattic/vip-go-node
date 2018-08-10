# Contributing

## Releasing / Publishing

### New release
Publishing a new version can be done using the following checklist:

1. Set the version (via `npm version minor` or `npm version major` or `npm version patch`)
2. For most regular releases, this will be `npm version minor`.
3. By default, npm publish scaped modules as private. To make it public, make sure to add the `access` flag. The whole command is: `npm run publish-please --access public`
4. Push the tag to GitHub (`git push --tags`)
5. Edit the release on Github to include a description of the changes and publish
6. Bump the version to the next preminor: `npm --no-git-tag-version version preminor`
7. Make a new PR with the changes (`git add -u` + `git commit` + `git push origin master`).