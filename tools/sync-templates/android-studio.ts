import os from 'os'
import fs from 'fs-extra'
import path from 'path'
import { execSync } from 'child_process'

const ANDROID_STUDIO_TOOLS_REPO =
  'https://android.googlesource.com/platform/tools/base'

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

export default function sync() {
  // Create a temp directory
  const directoryPath = fs.mkdtempSync(
    path.join(os.tmpdir(), 'android-studio-templates-')
  )

  const repositoryPath = path.join(directoryPath, 'base')

  console.log(`Cloning ${ANDROID_STUDIO_TOOLS_REPO} to ${repositoryPath}`)

  // Clone the Android Studio repository
  execSync(
    commands.clone({
      branch: 'master',
      repositoryUrl: ANDROID_STUDIO_TOOLS_REPO,
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

  console.log(`Copying ${downloadedTemplatesPath} to ${localTemplatesPath}`)

  // Copy new templates
  fs.copySync(downloadedTemplatesPath, localTemplatesPath)

  // Clean up temp directory
  fs.removeSync(directoryPath)
}
