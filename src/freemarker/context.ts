export type ContextData = { [key: string]: any }

type ListScope = {
  index: number
  length: number
  data: ContextData
}

export class Context {
  #data: ContextData
  #scopes: ListScope[] = []

  constructor(data: ContextData) {
    this.#data = data
  }

  findScope(key: string): ListScope | undefined {
    for (const scope of this.#scopes.slice().reverse()) {
      if (key in scope) {
        return scope
      }
    }

    return undefined
  }

  get(key: string): any {
    const data = this.findScope(key) || this.#data

    return data[key]
  }

  has(key: string): boolean {
    const data = this.findScope(key) || this.#data

    return key in data
  }

  set(key: string, value: any) {
    const scope = this.findScope(key)
    
    if (scope) {
      scope.data[key] = value
    } else {
      this.#data[key] = value 
    }
  }

  withDefaults(data: ContextData): Context {
    return new Context({ 
      ...data,
      ...this.#data
    })
  }

  // Lists 

  pushListScope(length: number) {
    this.#scopes.push({ data: {}, index: 0, length })
  }

  getTopListScope(): ListScope {
    return this.#scopes[this.#scopes.length - 1]
  }

  popListScope() {
    this.#scopes.pop()
  }

  setListIndex(index: number) {
    this.#scopes[this.#scopes.length - 1].index = index
  }

}
