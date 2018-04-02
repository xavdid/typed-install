#!/usr/bin/env node

import * as _ from 'lodash'

import { printPackages, npmInstall, getTypingInfo, missingTypes } from './utils'

import ora = require('ora')

/* TESTING
* asdfasdfasdfasdf doesn't exist at all
* heroku-config has no types at all
* lodash has types in @types
* commander, striptags has included types (package.json)
*/

export interface MainOpts {
  dev?: boolean
  prod?: boolean
  yarn?: boolean
}
export default async (
  modules: string[],
  { dev, prod, yarn }: MainOpts = {},
  shouldSpin: boolean = false
) => {
  // SPINNER
  const spinner = ora()

  const waitOn = (message: string) => {
    if (shouldSpin) {
      spinner.start(message)
    }
  }
  const succeed = () => {
    if (shouldSpin) {
      spinner.succeed()
    }
  }
  const fail = (e: any) => {
    if (shouldSpin) {
      spinner.fail()
    }
    console.error(e)
    process.exit(e.code)
  }
  // END OF SPINNER

  try {
    waitOn('Installing Packages')
    await npmInstall(modules, Boolean(dev), yarn)
  } catch (e) {
    fail(e)
  }
  succeed()

  const needsTypes = _.filter(
    await Promise.all(modules.map(missingTypes))
  ) as string[]

  waitOn('Checking for @types')
  const typesToFetch = _.filter(
    await Promise.all(needsTypes.map(m => getTypingInfo(m)))
  ) as string[]
  succeed()

  try {
    waitOn('Installing Available Types')
    await npmInstall(typesToFetch.map(t => `@types/${t}`), !Boolean(prod), yarn)
  } catch (e) {
    fail(e)
  }
  succeed()

  const missing = _.difference(needsTypes, typesToFetch)

  printPackages(
    '\nThe following packages were fully installed',
    _.difference(modules, missing)
  )

  printPackages(
    'The following packages were installed, but lack types',
    missing
  )
}
