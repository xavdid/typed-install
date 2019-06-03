import * as sh from 'shelljs'
import * as got from 'got'
import * as fs from 'mz/fs'
import { resolve } from 'path'
import * as pkgDir from 'pkg-dir'

const REGISTRY_URL = 'https://registry.npmjs.org'
const EXCEPTION_PACKAGES = new Set(['jest'])

export const formatPackageMessage = (message: string, packages: string[]) => {
  return packages.length
    ? `${message}:\n${packages.map(p => `  * ${p}`).join('\n')}`
    : ''
}

const parseOpts = (yarn: boolean) => {
  return {
    command: yarn ? 'yarn add' : 'npm i',
    devFlag: '-D',
    exactFlag: '-E'
  }
}

export const installWithTool = (
  modules: string[],
  {
    yarn = false,
    dev = false,
    exact = false
  }: { dev?: boolean; yarn?: boolean; exact?: boolean } = {}
) => {
  if (!modules.length) {
    return Promise.resolve()
  }

  const { command, devFlag, exactFlag } = parseOpts(yarn)

  return new Promise((res, rej) =>
    sh.exec(
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

// gets the `@types/name` registry info
export const getTypingInfo = async (name: string) => {
  // make sure to encode the / in the name
  const url = `${REGISTRY_URL}/@${encodeURIComponent(`types/${name}`)}`
  try {
    await got(url)
    return name
  } catch (e) {
    if (e.statusCode === 404) {
      return null
    } else {
      throw e
    }
  }
}

// returns null for functions that have type info and the module name if they're missing
export const missingTypes = async (m: string) => {
  if (EXCEPTION_PACKAGES.has(m)) {
    return m
  }
  const pkgRoot = await pkgDir()
  const installDir = resolve(`${pkgRoot || '.'}/node_modules/${m}`)
  try {
    const pkg = require(`${installDir}/package.json`)

    // if the file exists at root, it doesn't need to be specified in pkg
    let orphanIndex = false
    try {
      await fs.access(`${installDir}/index.d.ts`)
      orphanIndex = true
    } catch {}

    if (pkg.typings || pkg.types || orphanIndex) {
      return null
    } else {
      return m
    }
  } catch (e) {
    console.error('problem reading', m, ':', e)
    return null
  }
}
