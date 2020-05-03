import os from 'os'
import fs from 'fs-extra'
import path from 'path'
import { execSync } from 'child_process'

const commands = {
  clone: ({
    branch,
    repositoryUrl,
    outputPath,
  }: {
    branch: string
    repositoryUrl: string
    outputPath: string
  }): string => {
    return `git clone -b ${branch} --single-branch ${repositoryUrl} ${outputPath}`
  },
}

// Create a temp directory
const directoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'foo-'))

const repositoryPath = path.join(directoryPath, 'base')

// Clone the Android Studio repository
execSync(
  commands.clone({
    branch: 'master',
    repositoryUrl: 'https://android.googlesource.com/platform/tools/base',
    outputPath: repositoryPath,
  })
)

const downloadedTemplatesPath = path.join(repositoryPath, 'templates')
const localTemplatesPath = path.join(
  __dirname,
  '../../templates/android-studio'
)

// Remove any old templates
fs.removeSync(localTemplatesPath)

// Copy new templates
fs.copySync(downloadedTemplatesPath, localTemplatesPath)

// Clean up temp directory
fs.removeSync(directoryPath)
