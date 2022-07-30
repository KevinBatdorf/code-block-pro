import { exec } from 'child_process'
import fs from 'fs'
import { deleteFile, loadFileData, __rootDir } from './utils.mjs'
import util from 'util'

const execPromise = util.promisify(exec)
const command = process.argv[2]
if (!command) {
    console.error('No command provided')
    console.error('Usage: npm run eject <command>')
    process.exit(1)
}
console.log(`Ejecting feature: ${command}`)

const removeTailwind = async () => {
    deleteFile('./tailwind.config.js')
    deleteFile('./postcss.config.js')
    const editorCss = `${__rootDir}/src/editor/editor.css`
    const editorData = loadFileData(editorCss).replace(
        /(@tailwind|--tw).*\n/g,
        '',
    )
    fs.writeFileSync(editorCss, editorData)
    const frontCss = `${__rootDir}/src/front/style.css`
    const frontData = loadFileData(frontCss).replace(
        /(\/\* --tw-ring|@tailwind|--tw).*\n/g,
        '',
    )
    fs.writeFileSync(frontCss, frontData)
    await execPromise('npm uninstall tailwindcss')
    console.log('Removed Tailwind files.')
}

const removeRust = async () => {
    deleteFile(`${__rootDir}/Cargo.toml`)
    deleteFile(`${__rootDir}/Cargo.lock`)
    deleteFile(`${__rootDir}/webpack.config.js`)
    deleteFile(`${__rootDir}/server`)
    deleteFile(`${__rootDir}/pkg`)
    deleteFile(`${__rootDir}/src/hooks/useServer.ts`)
    const controlsFile = `${__rootDir}/src/editor/Controls.tsx`
    const controlData = loadFileData(controlsFile)
        .replace(/(import { useServer).*\n/g, '')
        .replace(
            /(const server = ).*\n/g,
            'const server = { get_text() { return "Rust was removed" } }\n',
        )
    fs.writeFileSync(controlsFile, controlData)
    await execPromise('npm uninstall @wasm-tool/wasm-pack-plugin')
    console.log('Removed Rust files.')
}

const removeCypress = async () => {
    deleteFile(`${__rootDir}/cypress.json`)
    deleteFile(`${__rootDir}/cypress`)
    deleteFile(`${__rootDir}/.github/workflows/cypress.yml`)
    const esLintFile = `${__rootDir}/.eslintrc`
    const esLintData = loadFileData(esLintFile).replace(/, "cypress"/g, '')
    fs.writeFileSync(esLintFile, esLintData)
    await execPromise(
        'npm uninstall cypress eslint-plugin-cypress @wordpress/url',
    )
    console.log('Removed Cypress files.')
}

if (['tw', 'tailwind'].includes(command)) {
    removeTailwind().then(() => process.exit(0))
}
if (['rust', 'r'].includes(command)) {
    removeRust().then(() => process.exit(0))
}
if (['cypress', 'c'].includes(command)) {
    removeCypress().then(() => process.exit(0))
}
