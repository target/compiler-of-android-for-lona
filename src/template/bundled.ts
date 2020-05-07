import path from 'path'

export type BundledTemplateNames = 'project' | 'module'

export function templatePathForName(
  templateName: BundledTemplateNames
): string {
  switch (templateName) {
    case 'project':
      return path.join(
        __dirname,
        '../../templates/android-studio/gradle-projects/NewAndroidProject'
      )
    case 'module':
      return path.join(
        __dirname,
        '../../templates/android-studio/gradle-projects/NewAndroidModule'
      )
  }
}
