import { access } from 'mz/fs'
import { exec } from 'shelljs'
import { resolve } from 'path'
import * as got from 'got'
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

const parseOpts = (packageManager: string) => {
  let command: string

  switch (packageManager.toLowerCase()) {
    case 'npm':
      command = 'npm i'
      break

    case 'yarn':
      command = 'yarn add'
      break

    case 'pnpm':
      command = 'pnpm i'
      break

    default:
      throw new Error('--package-manager is not valid')
  }

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
  }: { dev?: boolean; packageManager?: string; exact?: boolean } = {}
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
  try {
    await got(url)
    // if this completes without throwing, then the types exist
    return name
  } catch (e) {
    if (e.statusCode === 404) {
      return null
    } else {
      throw e
    }
  }
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
    } catch { }

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
