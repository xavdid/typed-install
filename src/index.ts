#!/usr/bin/env node

import { existsSync } from 'fs'

import chalk = require('chalk')
import { difference } from 'lodash'

import {
  formatPackageMessage,
  installWithTool,
  getTypingInfo,
  missingTypes,
  SUPPORTED_PACKAGE_MANAGERS
} from './utils'
import { Spinner } from './spinner'

import debugFunc from 'debug'
const debug = debugFunc('typedi')

/* TESTING
 * asdfasdfasdfasdf doesn't exist at all
 * heroku-config has no types at all
 * lodash has types in @types
 * commander, striptags have included types (package.json)
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
  yarn?: boolean // deprecated
  exact?: boolean
  packageManager?: SUPPORTED_PACKAGE_MANAGERS
}
export default async (
  modules: string[],
  {
    dev = false,
    prod = false,
    yarn = false,
    exact = false,
    // can't set a default here because we want to differentiate between the default and what the user actually passes
    packageManager
  }: MainOpts = {},
  shouldSpin: boolean = false
) => {
  const spinner = new Spinner(shouldSpin)
  // MAIN
  if (dev && prod) {
    spinner.log(
      `${chalk.redBright(
        'WARNING'
      )} using both --dev and --prod will probably not do what you expect`,
      true
    )
  }

  if (!packageManager) {
    if (existsSync('./pnpm-lock.yaml')) {
      // lock file for pnpm
      packageManager = 'pnpm'
    } else if (yarn || existsSync('./yarn.lock')) {
      // if there's a yarn lockfile, assume they want to use yarn
      packageManager = 'yarn'
      if (yarn) {
        spinner.log(
          'use of the --yarn option is deprecated, use --package-manager=yarn instead',
          true
        )
      }
    } else {
      packageManager = 'npm'
    }
  }

  spinner.log(`Running using ${chalk.cyanBright(packageManager)}`)

  try {
    spinner.waitOn(
      `Installing Packages into ${chalk.cyanBright(whichDeps(Boolean(dev)))}`
    )
    await installWithTool(modules, { dev, packageManager, exact })
  } catch (e) {
    spinner.fail(e)
    return
  }
  spinner.succeed()

  const needsTypes = (await Promise.all(modules.map(missingTypes))).filter(
    Boolean
  ) as string[]

  debug('missing types:', needsTypes)

  spinner.waitOn('Checking for @types')
  const typesToFetch = (await Promise.all(
    needsTypes.map(getTypingInfo)
  )).filter(Boolean) as string[]
  spinner.succeed()
  debug('found @types for:', typesToFetch)

  try {
    spinner.waitOn(
      `Installing Available Types into ${chalk.cyanBright(
        whichDeps(Boolean(prod), true)
      )}`
    )
    await installWithTool(typesToFetch.map(t => `@types/${t}`), {
      dev: !Boolean(prod),
      packageManager,
      exact
    })
  } catch (e) {
    spinner.fail(e)
    return
  }
  spinner.succeed()

  const missing = difference(needsTypes, typesToFetch)
  const installed = difference(modules, missing)

  spinner.log(
    formatPackageMessage(
      `\nThe following packages were ${chalk.greenBright.bold(
        'fully installed'
      )}`,
      installed
    )
  )

  spinner.log(
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
