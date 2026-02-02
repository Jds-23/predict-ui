import * as fs from 'node:fs'
import * as path from 'node:path'

export interface ComponentsJson {
  aliases?: {
    components?: string
    hooks?: string
    lib?: string
    adapters?: string
  }
}

export function loadComponentsJson(cwd: string): ComponentsJson {
  const configPath = path.join(cwd, 'components.json')
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  }
  return {}
}

export function resolveAlias(config: ComponentsJson, type: string): string {
  const defaults: Record<string, string> = {
    components: 'src/components',
    hooks: 'src/hooks',
    lib: 'src/lib',
    adapters: 'src/adapters',
  }
  return config.aliases?.[type as keyof typeof config.aliases] ?? defaults[type] ?? `src/${type}`
}

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function copyFile(src: string, dest: string): void {
  ensureDir(path.dirname(dest))
  fs.copyFileSync(src, dest)
}

export function transformImports(content: string, config: ComponentsJson): string {
  // Transform relative imports to aliased imports
  let result = content

  // ../hooks/ -> @/hooks/
  result = result.replace(/from ['"]\.\.\/hooks\//g, `from '@/${resolveAlias(config, 'hooks').replace('src/', '')}/`)

  // ../adapters/ -> @/adapters/
  result = result.replace(/from ['"]\.\.\/adapters\//g, `from '@/${resolveAlias(config, 'adapters').replace('src/', '')}/`)

  // ../lib/ -> @/lib/
  result = result.replace(/from ['"]\.\.\/lib\//g, `from '@/${resolveAlias(config, 'lib').replace('src/', '')}/`)

  // ./ (same dir) - keep as relative

  return result
}
