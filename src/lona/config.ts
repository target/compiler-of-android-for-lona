import fs from 'fs'
import path from 'path'
import * as Options from '../options'

export type Config = {
  ignore: string[]
  android: Partial<Options.Raw>
}

export async function getConfig(workspacePath: string): Promise<Config> {
  const configPath = path.join(workspacePath, 'lona.json')

  const data = JSON.parse(await fs.promises.readFile(configPath, 'utf-8'))

  if (!data.ignore) {
    data.ignore = ['**/node_modules/**', '**/.git/**']
  }

  if (!data.android) {
    data.android = {}
  }

  if (data.android.output) {
    if (!data.android.output.startsWith('/')) {
      data.android.output = path.join(workspacePath, data.android.output)
    }
  }

  return data
}
