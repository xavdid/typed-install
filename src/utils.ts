import { access } from 'mz/fs'
import { exec } from 'shelljs'
import { resolve } from 'path'
import got from 'got'
import * as pkgDir from 'pkg-dir'

import debugFunc from 'debug'
const debug = debugFunc('typedi')

const REGISTRY_URL = 'https://registry.npmjs.org'

// some packages are exceptions - they ship with types, but those are stubs for some reason
// if a package is in this set, then @types/x will always be installed
const EXCEPTION_PACKAGES = new Set(['jest'])

export const formatPackageMessage = (message: string, packages: string[]) => {
  return packages.length
    ? `${message}:\n${packages.map(p => `  * ${p}`).join('\n')}`
    : ''
}

export type SUPPORTED_PACKAGE_MANAGERS = 'npm' | 'yarn' | 'pnpm'

const parseOpts = (packageManager: SUPPORTED_PACKAGE_MANAGERS) => {
  const command = {
    npm: 'npm i',
    yarn: 'yarn add',
    pnpm: 'pnpm i'
  }[packageManager]

  return {
    command,
    devFlag: '-D',
    exactFlag: '-E'
  }
}

export const installWithTool = (
  modules: string[],
  {
    packageManager = 'npm',
    dev = false,
    exact = false
  }: {
    dev?: boolean
    packageManager?: SUPPORTED_PACKAGE_MANAGERS
    exact?: boolean
  } = {}
) => {
  if (!modules.length) {
    return Promise.resolve()
  }

  const { command, devFlag, exactFlag } = parseOpts(packageManager)

  return new Promise((res, rej) =>
    exec(
      [command, dev ? devFlag : '', exact ? exactFlag : '', ...modules].join(
        ' '
      ),
      // yarn works when silent, but npm doesn't
      { async: true, silent: true },
      (code, stdout, stderr) => {
        if (code) {
          rej(stderr)
        }
        res(stdout)
      }
    )
  )
}

/**
 * gets the `@types/name` registry info
 */
export const getTypingInfo = async (name: string) => {
  const url = `${REGISTRY_URL}/@${encodeURIComponent(`types/${name}`)}`

  const response = await got(url, { throwHttpErrors: false })
  if (response.statusCode === 404) {
    return null
  } else if (response.statusCode >= 400) {
    throw new Error(`trouble reading from registry: ${response.body}`)
  }
  return name
}

/**
 * returns `null` for functions that have type info
 * returns the module name if types are missing
 */
export const missingTypes = async (m: string) => {
  debug('looking at', m)
  if (EXCEPTION_PACKAGES.has(m)) {
    debug(m, 'is an exception, returning')
    return m
  }
  const pkgRoot = await pkgDir()
  const installDir = resolve(`${pkgRoot || '.'}/node_modules/${m}`)
  try {
    const pkg = require(`${installDir}/package.json`)

    // if the file exists at root, it doesn't need to be specified in pkg
    let orphanIndex = false
    try {
      await access(`${installDir}/index.d.ts`)
      orphanIndex = true
    } catch {}

    if (pkg.typings || pkg.types || orphanIndex) {
      debug(m, 'has native types')
      return null
    } else {
      debug(m, 'is missing types')
      return m
    }
  } catch (e) {
    console.error('problem reading', m, '-', e)
    return null
  }
}
