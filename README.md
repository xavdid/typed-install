# typed-install

You're writing Typescript and it's time to install your favorite node module. Has this ever happened to you?

```
% npm i my-module @types/my-module
npm ERR! code E404
npm ERR! 404 Not Found: @types/my-module@latest

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/user/.npm/_logs/2018-03-31T23_41_37_683Z-debug.log
```

It's hard to know is the types are included with the module, shipped separately, or non-existent. Enter `typed-install`.

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

By default, `typedi` uses npm, saves packages into `dependencies`, and `@types` into `devDependencies.`. This is configurable with the following flags:

* **-d** | **--dev**: save everything into the dev dependencies
* **-p** | **--prod**: save the @types into `dependencies`
* **-y** | **--yarn**: install using yarn instead of npm

<!-- [snippet:options] -->
