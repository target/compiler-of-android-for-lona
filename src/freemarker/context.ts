export type ContextData = { [key: string]: any }

export class Context {
  #data: ContextData

  constructor(data: ContextData) {
    this.#data = data
  }

  get(key: string): any {
    return this.#data[key]
  }

  has(key: string): boolean {
    return key in this.#data
  }

  set(key: string, value: any) {
    this.#data[key] = value
  }

  withDefaults(data: ContextData): Context {
    return new Context({ 
      ...data,
      ...this.#data
    })
  }
}
