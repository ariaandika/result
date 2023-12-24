export class Result <T = void,R = void>{
  #cbs: CallableFunction[] = []

  async handle(arg: T) {
    let i = 0
    try {
      let currentArg: any = arg
      for (let len = this.#cbs.length;i < len;i++) {
        currentArg = await this.#cbs[i](currentArg)
      }
      return { error: null, data: currentArg as R }
    } catch (e) {
      return { error: e as Error, data: null }
    }
  }

  async unwrap(arg: T) {
    const { error, data } = await this.handle(arg)
    if (error) {
      throw error
    }
    return data
  }

  async unwrapOr(arg: T, or: R) {
    const { error, data } = await this.handle(arg)
    return error ? or : data
  }

  async unwrapOrElse(arg: T, or: (arg: T) => R) {
    const { error, data } = await this.handle(arg)
    return error ? or(arg) : data
  }

  map<R2>(cb: (arg: R) => R2) {
    this.#cbs.push(cb)
    return this as unknown as Result<T,R2>
  }
}

export function result<T,R>(cb: (arg: T) => R) {
  const r = new Result<T extends unknown ? void : T,Awaited<R>>()
  r.map(cb as any)
  return r
}

type FetchArg = Parameters<typeof fetch>

result.json = <T = any>(...args: FetchArg) => {
  return result.fetch(...args).map(async (e) => e.json()) as Result<void,T>
}

result.fetch = (...args: FetchArg) => {
  return result(async () => await fetch(...args))
}

export default result
