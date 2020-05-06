export type Context = {
  get(key: string): any
  has(key: string): boolean
  set(key: string, value: any): void
}

export function createContext(data: { [key: string]: any }): Context {
  return {
    get(key: string): any {
      return data[key]
    },
    has(key: string): boolean {
      return key in data
    },
    set(key: string, value: any): void {
      data[key] = value
    },
  }
}
