// stub set of types for ora

declare module 'ora' {
  interface OraOptions {
    text: string
    spinner?: string | { interval: number; frames: any[] }
    color?:
      | 'black'
      | 'red'
      | 'green'
      | 'yellow'
      | 'blue'
      | 'magenta'
      | 'cyan'
      | 'white'
      | 'grey'
    hideCursor?: boolean
    interval?: number
    // stream: WriteStream
    enabled?: boolean
  }

  class Ora {
    start(text?: string): this
    stop(): this
    succeed(text?: string): this
    fail(text?: string): this
    text: string
    frame: string
  }

  function O(opts?: string | OraOptions): Ora
  export = O
}
