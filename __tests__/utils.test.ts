import {
  formatPackageMessage,
  installWithTool,
  getTypingInfo,
  missingTypes
} from '../src/utils'

import * as mock from 'mock-fs'

import * as path from 'path'

describe('printing packages', () => {
  test('prints packages', () => {
    const res = formatPackageMessage('this is a test', ['a', 'b', 'c'])
    expect(res.includes(':')).toBeTruthy()
    expect(res.includes('* a')).toBeTruthy()
  })

  test('prints packages', () => {
    const res = formatPackageMessage('this is a test', [])
    expect(res).toEqual('')
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })
})

describe('fetching type info', () => {
  test('successful', async () => {
    const n = 'lodash'
    const out = await getTypingInfo(n)
    expect(n).toEqual(out)
  })

  test('unsuccessful', async () => {
    expect(await getTypingInfo('qwerasdfqwerasdfjasdfah')).toBeNull()
  })
})

describe('finding local types', () => {
  beforeEach(() => {
    mock({
      node_modules: {
        a: {
          'package.json': JSON.stringify({ name: 'a', typings: 'index.d.ts' })
        },
        b: {
          'package.json': JSON.stringify({ name: 'b' }),
          'index.d.ts': 'this is a ts file'
        },
        c: { 'package.json': JSON.stringify({ name: 'c' }) }
      }
    })
  })

  test('finding listed types', async () => {
    const n = 'a'
    const out = await missingTypes(n)
    expect(out).toBeNull()
  })

  test('finding unlisted types', async () => {
    const n = 'b'
    const out = await missingTypes(n)
    expect(out).toBeNull()
  })

  test('missing types', async () => {
    const n = 'c'
    const out = await missingTypes(n)
    expect(out).toEqual(n)
  })

  afterEach(() => {
    mock.restore()
  })
})

describe.skip('installing from npm', () => {
  beforeAll(() => {
    jest.setTimeout(1000 * 10)
  })
  beforeEach(() => {
    mock({
      'package.json': JSON.stringify({ name: 'tytest', version: '1.0.0' }),
      node_modules: {}
    })
  })

  test('without extra args', async () => {
    // the child_process doesn't play nicely with the mocked fs
    // the modules are installed in the project directory for real
    try {
      await installWithTool(['heroku-config'])
      const pkg = require(path.resolve('./package.json'))
      expect(pkg.striptags).toBeTruthy()
    } catch (e) {
      console.log(e)
      fail()
    }
  })

  afterEach(() => {
    mock.restore()
  })

  afterAll(() => {
    jest.setTimeout(1000 * 5)
  })
})
