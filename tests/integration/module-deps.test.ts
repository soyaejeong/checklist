import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const srcDir = path.resolve(__dirname, '../../src');

function getImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importRegex = /(?:import|from)\s+['"](@\/[^'"]+)['"]/g;
  const imports: string[] = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function resolveAlias(importPath: string): string {
  return importPath.replace('@/', '');
}

function getModuleDir(importPath: string): string {
  const resolved = resolveAlias(importPath);
  return resolved.split('/')[0];
}

describe('Module dependency rules (TECHSPEC)', () => {
  it('types/ imports nothing', () => {
    const typesDir = path.join(srcDir, 'types');
    const files = fs.readdirSync(typesDir).filter((f) => f.endsWith('.ts'));
    for (const file of files) {
      const imports = getImports(path.join(typesDir, file));
      expect(imports, `${file} should have no internal imports`).toEqual([]);
    }
  });

  it('utils/ imports nothing', () => {
    const utilsDir = path.join(srcDir, 'utils');
    const files = fs.readdirSync(utilsDir).filter((f) => f.endsWith('.ts'));
    for (const file of files) {
      const imports = getImports(path.join(utilsDir, file));
      expect(imports, `${file} should have no internal imports`).toEqual([]);
    }
  });

  it('lib/ imports only from lib/ (no types/, utils/, repositories/, services/)', () => {
    const libDir = path.join(srcDir, 'lib');
    const files: string[] = [];
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name));
        } else if (entry.name.endsWith('.ts')) {
          files.push(path.join(dir, entry.name));
        }
      }
    }
    walk(libDir);

    const forbiddenModules = ['types', 'repositories', 'services', 'utils', 'hooks'];
    for (const file of files) {
      const imports = getImports(file);
      for (const imp of imports) {
        const moduleDir = getModuleDir(imp);
        if (moduleDir !== 'lib') {
          expect(
            forbiddenModules.includes(moduleDir),
            `${path.basename(file)} imports from ${moduleDir}/ which violates TECHSPEC`,
          ).toBe(false);
        }
      }
    }
  });

  it('repositories/ imports only from types/', () => {
    const reposDir = path.join(srcDir, 'repositories');
    const files = fs.readdirSync(reposDir).filter((f) => f.endsWith('.ts'));
    for (const file of files) {
      const imports = getImports(path.join(reposDir, file));
      for (const imp of imports) {
        const moduleDir = getModuleDir(imp);
        expect(
          moduleDir,
          `${file} should only import from types/, got ${moduleDir}/`,
        ).toBe('types');
      }
    }
  });

  it('services/ imports only from types/', () => {
    const servicesDir = path.join(srcDir, 'services');
    const files = fs.readdirSync(servicesDir).filter((f) => f.endsWith('.ts'));
    for (const file of files) {
      const imports = getImports(path.join(servicesDir, file));
      for (const imp of imports) {
        const moduleDir = getModuleDir(imp);
        expect(
          moduleDir,
          `${file} should only import from types/, got ${moduleDir}/`,
        ).toBe('types');
      }
    }
  });

  it('data/ imports only from types/', () => {
    const dataDir = path.join(srcDir, 'data');
    const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.ts'));
    for (const file of files) {
      const imports = getImports(path.join(dataDir, file));
      for (const imp of imports) {
        const moduleDir = getModuleDir(imp);
        expect(
          moduleDir,
          `${file} should only import from types/, got ${moduleDir}/`,
        ).toBe('types');
      }
    }
  });

  it('all type exports are importable without errors', async () => {
    await import('@/types/checklist');
    await import('@/types/trip');
    await import('@/types/suggestion');
    expect(true).toBe(true);
  });

  it('no circular dependencies between modules', () => {
    const modules = ['types', 'utils', 'lib', 'repositories', 'services', 'data', 'hooks'];
    const graph: Record<string, Set<string>> = {};

    for (const mod of modules) {
      graph[mod] = new Set();
      const modDir = path.join(srcDir, mod);
      if (!fs.existsSync(modDir)) continue;

      function walkDir(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            walkDir(path.join(dir, entry.name));
          } else if (entry.name.endsWith('.ts')) {
            const imports = getImports(path.join(dir, entry.name));
            for (const imp of imports) {
              const depModule = getModuleDir(imp);
              if (depModule !== mod && modules.includes(depModule)) {
                graph[mod].add(depModule);
              }
            }
          }
        }
      }
      walkDir(modDir);
    }

    function hasCycle(
      node: string,
      visited: Set<string>,
      stack: Set<string>,
    ): string[] | null {
      visited.add(node);
      stack.add(node);
      for (const dep of graph[node]) {
        if (stack.has(dep)) return [node, dep];
        if (!visited.has(dep)) {
          const cycle = hasCycle(dep, visited, stack);
          if (cycle) return cycle;
        }
      }
      stack.delete(node);
      return null;
    }

    const visited = new Set<string>();
    for (const mod of modules) {
      if (!visited.has(mod)) {
        const cycle = hasCycle(mod, visited, new Set());
        expect(cycle, `Circular dependency: ${cycle?.join(' -> ')}`).toBeNull();
      }
    }
  });
});
