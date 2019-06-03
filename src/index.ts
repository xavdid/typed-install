#!/usr/bin/env node

import { existsSync } from 'fs'

import * as _ from 'lodash'

import {
  formatPackageMessage,
  installWithTool,
  getTypingInfo,
  missingTypes
} from './utils'

import * as ora from 'ora'
import chalk from 'chalk'

/* TESTING
 * asdfasdfasdfasdf doesn't exist at all
 * heroku-config has no types at all
 * lodash has types in @types
 * commander, striptags has included types (package.json)
 */

const prodDeps = 'dependencies'
const devDeps = 'devDependencies'

// inverted is whether a flag was passed in
// defaultDev is whether or not devDeps are the default if the first arg is false
const whichDeps = (inverted: boolean, defaultDev = false) => {
  if (inverted) {
    if (defaultDev) {
      return prodDeps
    }
    return devDeps
  } else {
    if (defaultDev) {
      return devDeps
    }
    return prodDeps
  }
}

export interface MainOpts {
  dev?: boolean
  prod?: boolean
  yarn?: boolean
  exact?: boolean
}
export default async (
  modules: string[],
  { dev = false, prod = false, yarn = false, exact = false }: MainOpts = {},
  shouldSpin: boolean = false
) => {
  // SPINNER COMMANDS
  const spinner = ora()

  const log = (message: string, logAlways = false) => {
    if ((logAlways || shouldSpin) && message) {
      console.log(`${message}\n`)
    }
  }

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

  // MAIN
  if (dev && prod) {
    log(
      `${chalk.redBright(
        'WARNING'
      )} using both --dev and --prod will probably not do what you expect`,
      true
    )
  }

  // if there's a yarn lockfile, assume they want to use it
  yarn = yarn || existsSync('./yarn.lock')

  log(`Running using ${chalk.cyanBright(yarn ? 'yarn' : 'npm')}`)

  try {
    waitOn(
      `Installing Packages into ${chalk.cyanBright(whichDeps(Boolean(dev)))}`
    )
    await installWithTool(modules, { dev, yarn, exact })
  } catch (e) {
    fail(e)
  }
  succeed()

  const needsTypes = (await Promise.all(modules.map(missingTypes))).filter(
    Boolean
  ) as string[]

  waitOn('Checking for @types')
  const typesToFetch = (await Promise.all(
    needsTypes.map(getTypingInfo)
  )).filter(Boolean) as string[]
  succeed()

  try {
    waitOn(
      `Installing Available Types into ${chalk.cyanBright(
        whichDeps(Boolean(prod), true)
      )}`
    )
    await installWithTool(typesToFetch.map(t => `@types/${t}`), {
      dev: !Boolean(prod),
      yarn,
      exact
    })
  } catch (e) {
    fail(e)
  }
  succeed()

  const missing = _.difference(needsTypes, typesToFetch)
  const installed = _.difference(modules, missing)

  log(
    formatPackageMessage(
      `\nThe following packages were ${chalk.greenBright.bold(
        'fully installed'
      )}`,
      installed
    )
  )

  log(
    formatPackageMessage(
      `${
        // need a leading newline if this is our first print statement
        installed.length ? '' : '\n'
      }The following packages were installed, but ${chalk.yellowBright.bold(
        'lack types'
      )}`,
      missing
    )
  )
}
