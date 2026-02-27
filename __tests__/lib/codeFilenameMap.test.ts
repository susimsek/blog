import { extractCodeFilenameByStartLine } from '@/lib/codeFilenameMap';

describe('extractCodeFilenameByStartLine', () => {
  it('collects filename metadata by code block start line', () => {
    const markdown = `
Intro

\`\`\`java filename="SecurityConfig.java"
public class SecurityConfig {}
\`\`\`

\`\`\`yaml filename="application.yml"
spring:
  application:
    name: demo
\`\`\`
`;

    const map = extractCodeFilenameByStartLine(markdown);
    expect(map.get(4)).toBe('SecurityConfig.java');
    expect(map.get(8)).toBe('application.yml');
  });

  it('supports title/file/path aliases', () => {
    const markdown = `
\`\`\`java title="A.java"
class A {}
\`\`\`
\`\`\`yaml file="config.yml"
a: b
\`\`\`
\`\`\`json path="src/config/app.json"
{}
\`\`\`
`;

    const map = extractCodeFilenameByStartLine(markdown);
    expect(map.get(2)).toBe('A.java');
    expect(map.get(5)).toBe('config.yml');
    expect(map.get(8)).toBe('src/config/app.json');
  });

  it('accepts a bare path-like meta value as the filename', () => {
    const markdown = `
\`\`\`ts src/lib/example.ts
export const demo = true;
\`\`\`
`;

    const map = extractCodeFilenameByStartLine(markdown);
    expect(map.get(2)).toBe('src/lib/example.ts');
  });

  it('ignores bare meta values that are not path-like', () => {
    const markdown = `
\`\`\`ts filename
export const demo = true;
\`\`\`
`;

    const map = extractCodeFilenameByStartLine(markdown);
    expect(map.size).toBe(0);
  });

  it('returns an empty map for blank markdown', () => {
    expect(extractCodeFilenameByStartLine('   \n')).toEqual(new Map());
  });
});
