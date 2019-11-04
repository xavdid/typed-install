import * as ora from 'ora'

export class Spinner {
  public spinner: ora.Ora
  constructor(public shouldSpin: boolean) {
    this.spinner = ora()
  }

  public log = (message: string, logAlways = false) => {
    if ((logAlways || this.shouldSpin) && message) {
      console.log(`${message}\n`)
    }
  }

  public waitOn = (message: string) => {
    if (this.shouldSpin) {
      this.spinner.start(message)
    }
  }
  public succeed = () => {
    if (this.shouldSpin) {
      this.spinner.succeed()
    }
  }
  public fail = (e: any) => {
    if (this.shouldSpin) {
      this.spinner.fail()
    }
    console.error(e)
    process.exitCode = e.code
  }
}
