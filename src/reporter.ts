import { Reporter } from '@lona/compiler/lib/helpers/reporter'

export const silentReporter: Reporter = {
  log: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
}
