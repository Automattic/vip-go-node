# Contributing

## Releasing / Publishing

### New release

Publishing a new version can be done using the following checklist:

1. Run `npm run publish-please --dry-run` to catch any issues.
1. Set the version (via `npm --no-git-tag-version version minor` or `npm --no-git-tag-version version major` or `npm --no-git-tag-version version patch`).
1. `git tag -a preflight-checks-v[VERSION]`.
1. By default, npm publishes scoped modules as private. To make them public, be sure to add the `access` flag. The whole command is: `npm run publish-please --access public`
1. Push the tag to GitHub (`git push --tags`)
1. Edit the release on Github to include a description of the changes and publish
1. Bump the version to the next preminor: `npm --no-git-tag-version version preminor`. This will bump the version in `package.json` and `package-lock.json` to the next minor and add a `-0` to it (ex: `0.1.0 => 0.2.0-0`)
1. Create a new branch, commit your changes and push them (`git checkout -b [name_of_your_new_branch]` + `git add -u` + `git commit` + `git push origin [name_of_your_new_branch]`)
1. Create a new PR once your branch is pushed
