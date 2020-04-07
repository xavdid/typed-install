#!/usr/bin/env node

import * as program from 'commander'
import * as update from 'update-notifier'
import main, { MainOpts } from './index'

const pkg = require('../package.json')

update({ pkg })

program
  .version(pkg.version)
  .usage('[options] <modules ...>')
  .option('-d, --dev', 'save everything into the dev dependencies')
  .option('-p, --prod', 'save the @types into `dependencies`')
  .option('-y, --yarn', 'install using yarn instead of npm')
  .option(
    '-m, --package-manager <packageManager>',
    'specify package manager (npm|yarn|pnpm)'
  )
  .option('-e, --exact', 'pin modules to an exact version')
  .parse(process.argv)

if (!program.args.length) {
  console.error(`ERR: specify at least one module`)
  process.exitCode = 1
} else {
  // the program object has the flags set on it when they're present
  main(program.args, program as MainOpts, true).catch(console.error)
}
