import {
  printPackages,
  installWithTool,
  getTypingInfo,
  missingTypes
} from '../src/utils'

import * as mock from 'mock-fs'

import * as path from 'path'

describe('printing packages', () => {
  let spy: jest.SpyInstance

  beforeEach(() => {
    spy = jest.spyOn(console, 'log')
  })

  test('prints packages', () => {
    printPackages('this is a test', ['a', 'b', 'c'])
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain(':')
  })

  test('prints packages', () => {
    printPackages('this is a test', [])
    expect(spy).not.toHaveBeenCalled()
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
