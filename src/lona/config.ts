import fs from 'fs'
import path from 'path'

export type Config = {
  ignore: string[]
}

export async function getConfig(workspacePath: string): Promise<Config> {
  const data = JSON.parse(
    await fs.promises.readFile(path.join(workspacePath, 'lona.json'), 'utf-8')
  )

  if (!data.ignore) {
    data.ignore = ['**/node_modules/**', '**/.git/**']
  }

  return data
}
