import path from 'path'

export type BuiltInTemplateNames = 'project' | 'module'

export function templatePathForName(
  templateName: BuiltInTemplateNames
): string {
  switch (templateName) {
    case 'project':
      return path.join(
        __dirname,
        '../../templates/android-studio/gradle-projects/NewAndroidProject/template.xml'
      )
    case 'module':
      return path.join(
        __dirname,
        '../../templates/android-studio/gradle-projects/NewAndroidModule/template.xml'
      )
  }
}
