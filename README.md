# typed-install

[![npm](https://img.shields.io/npm/v/typed-install.svg?style=flat-square)](https://www.npmjs.com/package/typed-install)

You're writing Typescript and it's time to install your favorite node module. Has this ever happened to you?

```
% npm i my-module @types/my-module
npm ERR! code E404
npm ERR! 404 Not Found: @types/my-module@latest

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/user/.npm/_logs/2018-03-31T23_41_37_683Z-debug.log
```

It's hard to know if type declarations are included with the module, shipped separately, or non-existent. Enter `typed-install`.

## Installation and Usage

Install from npm using your favorite package manager.

```
% npm i -g typed-install
```

Run it with the `typedi` command, passing any number space-separated package names (this should be very familiar).

```
% typedi heroku-config lodash striptags
✔ Installing Packages
✔ Checking for @types
✔ Installing Available Types

The following packages were fully installed:
  * lodash
  * striptags

The following packages were installed, but lack types:
  * heroku-config
```

By default, `typedi` guesses your preferred package manager (based on a lockfile), uses `npm` if there's no hint, saves packages into `dependencies`, and `@types` into `devDependencies.`. This is configurable with the following flags:

- **-d** | **--dev**: save packages into the `devDependencies`
- **-p** | **--prod**: save @types into `dependencies`
- **-m** | **--package-manager**: one of `npm`, `yarn`, or `pnpm`. Specifying one of these overwrites lockfile guessing.
- **-e** | **--exact**: install with an exact type instead of a caret (`^`). This overwrites your config files for the tool you're using

Using `--dev` and `--prod` together will probably not do what you expect.

### Exceptions

As of the release of `v1.0.6`, the following packages ship with a stub types file, confusing this utility:

- `jest`

Those are always explicitly fetched. If you know of another example (or one of the above is shipping actual types) [file an issue](https://github.com/xavdid/typed-install/issues/new) and I'll add the exception.

### Using without installing

If you have `npm@5.2.0` or greater installed, you can run this via `npx` ([more info](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b)), a tool to run CLI packages without explicitly installing them. This is great for periodic or one time use.

The previous example becomes:

```
% npx typed-install heroku-config lodash striptags
```

Similarly, if you're using `yarn@2`, you can use `yarn dlx` (see [the docs](https://yarnpkg.com/cli/dlx)).

If you're going to invoke this repeatedly or frequently, global installation is recommended.

## API

The code that powers `typedi` can also be used via the Node.js API.

The main function takes the following options, in order:

### modules (string[])

An array of npm module names

### opts (object, default `{}`)

an object with any of the following keys (see above):

- dev
- prod
- packageManager
- exact

Any keys not present default to false.

### shouldSpin (boolean, default `false`)

Whether or not to run the fancy spinner. If you're using this in other code, this should probably be `false`. Also controls whether messages are logged.

```js
const typedi = require('typed-install').default

typedi(['lodash', 'striptags'], { dev: true }).then(() => {
  console.log('all done!')
})
```
