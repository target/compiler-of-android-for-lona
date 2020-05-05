import os from 'os'
import fs from 'fs-extra'
import path from 'path'
import { execSync } from 'child_process'

enum ProjectType {
  basic = 'basic',
}

enum DSL {
  groovy = 'groovy',
  kotlin = 'kotlin',
}

const commands = {
  gradleInit: ({
    type,
    dsl,
    projectName,
    projectDirectory,
  }: {
    type: ProjectType
    dsl: DSL
    projectName: string
    projectDirectory: string
  }): string => {
    return `gradle init --type ${type} --dsl ${dsl} --project-name ${projectName} --project-dir ${projectDirectory}`
  },
}

export default function sync() {
  // Create a temp directory
  const directoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'gradle-'))

  console.log(`Initializing gradle project in ${directoryPath}`)

  // Initialize a new gradle project
  execSync(
    commands.gradleInit({
      type: ProjectType.basic,
      dsl: DSL.groovy,
      projectName: 'temp-gradle-project',
      projectDirectory: directoryPath,
    })
  )

  const gradleWrapperTemplatePath = path.join(
    __dirname,
    '../../templates/android-studio/gradle/wrapper'
  )

  // Remove any old wrapper
  fs.removeSync(gradleWrapperTemplatePath)

  const wrapperFiles = ['gradle', 'gradlew', 'gradlew.bat']

  for (const file of wrapperFiles) {
    const sourcePath = path.join(directoryPath, file)
    const targetPath = path.join(gradleWrapperTemplatePath, file)

    console.log(`Copying gradle file ${sourcePath} to ${targetPath}`)

    // Copy new templates
    fs.copySync(sourcePath, targetPath)
  }

  // Clean up temp directory
  fs.removeSync(directoryPath)
}
