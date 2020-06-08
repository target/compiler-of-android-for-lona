// import { Config } from "@lona/compiler/lib/utils/config"
// import { Reporter } from "@lona/compiler/lib/helpers/reporter"
// import path from 'path'
// import fs from 'fs'
// import * as LogicAST from "@lona/compiler/lib/helpers/logic-ast"
// import * as LogicScope from "@lona/compiler/lib/helpers/logic-scope"
// import * as LogicUnify from "@lona/compiler/lib/helpers/logic-unify"
// import * as LogicEvaluate from "@lona/compiler/lib/helpers/logic-evaluate"

// export const generate = (config: Config, reporter: Reporter) => {
//   const standardLibsPath = path.join(__dirname, '../../static/logic')
//   const standardLibs = fs.readdirSync(standardLibsPath)

//   const libraryFiles: LogicAST.AST.Program[] = standardLibs.map(
//     x =>
//       LogicAST.makeProgram(
//         JSON.parse(fs.readFileSync(path.join(standardLibsPath, x), 'utf8'))
//       ) as LogicAST.AST.Program
//   )

//   const standardLibsProgram = LogicAST.joinPrograms(libraryFiles)

//   const logicPrograms = Object.keys(config.logicFiles)
//     .map(k => {
//       const node = LogicAST.makeProgram(config.logicFiles[k])
//       if (!node) {
//         return undefined
//       }
//       return {
//         in: k,
//         node,
//       }
//     })
//     .filter(x => !!x)

//   const scopeContext = LogicScope.build(
//     [{ node: standardLibsProgram, in: 'standard library' }].concat(logicPrograms),
//     reporter
//   )

//   const programNode = LogicAST.joinPrograms([
//     standardLibsProgram,
//     ...logicPrograms.map(x => x.node),
//   ])

//   const unificationContext = LogicUnify.makeUnificationContext(
//     programNode,
//     scopeContext,
//     reporter
//   )
//   const substitution = LogicUnify.unify(
//     unificationContext.constraints,
//     reporter
//   )

//   const evaluationContext = LogicEvaluate.evaluate(
//     programNode,
//     programNode,
//     scopeContext,
//     unificationContext,
//     substitution,
//     reporter
//   )

//   return evaluationContext
// }
