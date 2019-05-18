export type TFns = Function[]
export type TFnsMap = Map<string, TFns>
export type TFnsIntMap = Map<number, TFns>


export class Tpubsub {

  private fns: TFnsMap = new Map<string, TFns>()
  private fnsOnce: TFnsMap = new Map<string, TFns>()
  private fnsInt: TFnsIntMap = new Map<number, TFns>()
  private fnsIntOnce: TFnsIntMap = new Map<number, TFns>()

  protected publishFn(subject: string, args: any[], fnsMap: TFnsMap) {
    let fns: TFns = fnsMap.get(subject) || []
    fns.forEach((fn: Function) => {
      fn.apply(this, args)
    })
  }

  publish(subject: string, ...args: any[]): void {
    this.publishFn(subject, args, this.fns)
    this.publishFn(subject, args, this.fnsOnce)

    // delete fnsOnce register callback
    this.fnsOnce.delete(subject)
  }

  subscribe(subject: string, Fn: Function): void {
    let fns: TFns = this.fns.get(subject) || []
    if (fns.includes(Fn)) {
      return
    }

    fns.push(Fn)
    this.fns.set(subject, fns)
  }

  subscribeOnce(subject: string, Fn: Function): void {
    let fnsOnce: TFns = this.fnsOnce.get(subject) || []
    if (fnsOnce.includes(Fn)) {
      return
    }

    fnsOnce.push(Fn)
    this.fnsOnce.set(subject, fnsOnce)
  }

  unsubscribe(subject: string, Fn?: Function): void {
    if (!Fn) {
      this.fns.delete(subject)
      return
    }
    let fns: TFns = this.fns.get(subject) || []
    if (!fns.includes(Fn)) {
      return
    }

    fns = fns.filter((v) => {
      return v !== Fn
    })
    this.fnsOnce.set(subject, fns)
  }

  protected publishFnInt(subject: number, args: any[], fnsIntMap: TFnsIntMap) {
    let fns: TFns = fnsIntMap.get(subject) || []
    fns.forEach((fn: Function) => {
      fn.apply(this, args)
    })
  }

  publishInt(subject: number, ...args: any[]): void {
    this.publishFnInt(subject, args, this.fnsInt)
    this.publishFnInt(subject, args, this.fnsIntOnce)

    // delete fnsOnce register callback
    this.fnsIntOnce.delete(subject)
  }

  subscribeInt(subject: number, Fn: Function): void {
    let fns: TFns = this.fnsInt.get(subject) || []
    if (fns.includes(Fn)) {
      return
    }

    fns.push(Fn)
    this.fnsInt.set(subject, fns)
  }

  subscribeOnceInt(subject: number, Fn: Function): void {
    let fnsOnce: TFns = this.fnsIntOnce.get(subject) || []
    if (fnsOnce.includes(Fn)) {
      return
    }

    fnsOnce.push(Fn)
    this.fnsIntOnce.set(subject, fnsOnce)
  }

  unsubscribeInt(subject: number, Fn?: Function): void {
    if (!Fn) {
      this.fnsInt.delete(subject)
      return
    }
    let fns: TFns = this.fnsInt.get(subject) || []
    if (!fns.includes(Fn)) {
      return
    }

    fns = fns.filter((v) => {
      return v !== Fn
    })
    this.fnsInt.set(subject, fns)

  }

  hasSubscribe(subject: string): boolean {
    return this.fns.has(subject) || this.fnsOnce.has(subject)
  }

  hasSubscribeInt(subject: number): boolean {
    return this.fnsInt.has(subject) || this.fnsIntOnce.has(subject)

  }
}

export default new Tpubsub()
