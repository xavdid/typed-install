import program = require('commander')
import main, { MainOpts } from './index'
const pj = require('../package.json')

program
  // .usage('typedi PACKAGE...')
  .version(pj.version)
  // .option('-N, --no-save', '')
  .option('-d, --dev', 'save everything into the dev dependencies')
  .option('-p, --prod', 'save the @types into `dependencies`')
  .option('-y, --yarn', 'install using yarn instead of npm')
  .parse(process.argv)

if (!program.args.length) {
  console.error(`ERR: specify at least one module`)
  process.exit(1)
}

// the program object has the flags set on it when they're present
main(program.args, program as MainOpts, true)
