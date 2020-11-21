import * as ora from 'ora'

export class Spinner {
  public spinner: ora.Ora
  constructor(public shouldSpin: boolean) {
    this.spinner = ora()
  }

  public log = (message: string, logAlways = false): void => {
    if ((logAlways || this.shouldSpin) && message !== '') {
      console.log(`${message}\n`)
    }
  }

  public waitOn = (message: string): void => {
    if (this.shouldSpin) {
      this.spinner.start(message)
    }
  }

  public succeed = (): void => {
    if (this.shouldSpin) {
      this.spinner.succeed()
    }
  }

  public fail = (e: any): void => {
    if (this.shouldSpin) {
      this.spinner.fail()
    }
    console.error(e)
    process.exitCode = e.code
  }
}
