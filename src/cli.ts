#!/usr/bin/env node

import * as program from 'commander'
import * as update from 'update-notifier'
import main, { MainOpts } from './index'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../package.json')

update({ pkg })

program
  .version(pkg.version)
  .usage('[options] <modules ...>')
  .option('-d, --dev', 'save everything into `devDependencies`')
  .option('-p, --prod', 'save the @types into `dependencies`')
  .option(
    '-m, --package-manager <packageManager>',
    'specify package manager (npm|yarn|pnpm). Guesses using lockfile by default'
  )
  .option('-e, --exact', 'pin modules to an exact version')
  .parse(process.argv)

if (program.args.length === 0) {
  console.error(`ERR: specify at least one module`)
  process.exitCode = 1
} else {
  // the program object has the flags set on it when they're present
  main(program.args, program as MainOpts, true).catch(console.error)
}
