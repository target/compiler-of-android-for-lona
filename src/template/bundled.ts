import path from 'path'

export type BundledTemplateNames = 'project' | 'module' | 'gallery'

const templatesPath = path.join(__dirname, '../../templates')

export function templatePathForName(
  templateName: BundledTemplateNames
): string {
  switch (templateName) {
    case 'project':
      return path.join(
        templatesPath,
        'android-studio/gradle-projects/NewAndroidProject'
      )
    case 'module':
      return path.join(
        templatesPath,
        'android-studio/gradle-projects/NewAndroidModule'
      )
    case 'gallery':
      return path.join(templatesPath, 'GalleryActivity')
  }
}
