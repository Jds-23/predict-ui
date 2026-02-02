#!/usr/bin/env node
import * as fs from 'node:fs'
import * as path from 'node:path'
import { loadComponentsJson, resolveAlias, ensureDir, transformImports } from './utils'

interface RegistryFile {
  path: string
  type: string
  target: string
}

interface RegistryJson {
  name: string
  description: string
  dependencies?: Record<string, string>
  files: RegistryFile[]
  cssVariables?: string[]
}

const REGISTRY_PATH = path.join(import.meta.dirname, '..', 'registry')

function getAvailableComponents(): string[] {
  return fs.readdirSync(REGISTRY_PATH).filter((name) => {
    const registryJson = path.join(REGISTRY_PATH, name, 'registry.json')
    return fs.existsSync(registryJson)
  })
}

function loadRegistry(componentName: string): RegistryJson {
  const registryPath = path.join(REGISTRY_PATH, componentName, 'registry.json')
  if (!fs.existsSync(registryPath)) {
    throw new Error(`Component "${componentName}" not found in registry`)
  }
  return JSON.parse(fs.readFileSync(registryPath, 'utf-8'))
}

function copyComponentFiles(componentName: string, cwd: string): void {
  const registry = loadRegistry(componentName)
  const config = loadComponentsJson(cwd)
  const srcDir = path.join(REGISTRY_PATH, componentName)

  console.log(`\nInstalling ${registry.name}...`)

  for (const file of registry.files) {
    const srcPath = path.join(srcDir, file.path)
    const targetDir = resolveAlias(config, file.type === 'root' ? 'components' : file.type + 's')
    const destPath = path.join(cwd, targetDir, file.target.replace(`${file.type}s/`, ''))

    if (!fs.existsSync(srcPath)) {
      console.warn(`  ! Skipping ${file.path} (not found)`)
      continue
    }

    // Read and transform imports
    let content = fs.readFileSync(srcPath, 'utf-8')
    if (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) {
      content = transformImports(content, config)
    }

    ensureDir(path.dirname(destPath))
    fs.writeFileSync(destPath, content)
    console.log(`  + ${destPath.replace(cwd + '/', '')}`)
  }

  // Print dependency info
  if (registry.dependencies && Object.keys(registry.dependencies).length > 0) {
    console.log('\nRequired dependencies:')
    for (const [dep, version] of Object.entries(registry.dependencies)) {
      console.log(`  npm install ${dep}@${version}`)
    }
  }

  // Print CSS variable info
  if (registry.cssVariables && registry.cssVariables.length > 0) {
    console.log('\nRequired CSS variables:')
    for (const cssVar of registry.cssVariables) {
      console.log(`  ${cssVar}`)
    }
  }

  console.log('\nDone!')
}

function main(): void {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Usage: npx add <component>')
    console.log('\nAvailable components:')
    for (const comp of getAvailableComponents()) {
      console.log(`  - ${comp}`)
    }
    process.exit(0)
  }

  const componentName = args[0]
  const cwd = process.cwd()

  try {
    copyComponentFiles(componentName, cwd)
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`)
    process.exit(1)
  }
}

main()
