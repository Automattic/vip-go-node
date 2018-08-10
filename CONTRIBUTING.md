# Contributing

## Releasing / Publishing

### New release
Publishing a new version can be done using the following checklist:

1. Set the version (via `npm version minor` or `npm version major` or `npm version patch`)
2. For most regular releases, this will be `npm version minor`.
3. By default, npm publishes scoped modules as private. To make them public, be sure to add the `access` flag. The whole command is: `npm run publish-please --access public`
4. Push the tag to GitHub (`git push --tags`)
5. Edit the release on Github to include a description of the changes and publish
6. Bump the version to the next preminor: `npm --no-git-tag-version version preminor`. This will bump the version in `package.json` and `package-lock.json` to the next minor and add a `-0` to it (ex: `0.1.0 => 0.2.0-0`)
7. Create a new branch, commit your changes and push them (`git checkout -b [name_of_your_new_branch]` + `git add -u` + `git commit` + `git push origin [name_of_your_new_branch]`)
8. Create a new PR once your branch is pushed