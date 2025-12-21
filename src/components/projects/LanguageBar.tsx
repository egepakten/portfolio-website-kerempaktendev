import { Loader2 } from 'lucide-react';

interface LanguageBarProps {
  languages: Record<string, number>;
  isLoading?: boolean;
}

// GitHub-like language colors
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Scala: '#c22d40',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  HCL: '#844fba',
  Nix: '#7e7eff',
  Lua: '#000080',
  Perl: '#0298c3',
  R: '#198CE7',
  Julia: '#a270ba',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Clojure: '#db5855',
  Erlang: '#B83998',
  OCaml: '#3be133',
  YAML: '#cb171e',
  JSON: '#292929',
  Markdown: '#083fa1',
  SQL: '#e38c00',
  PLpgSQL: '#336790',
};

function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] || '#8b8b8b';
}

export function LanguageBar({ languages, isLoading }: LanguageBarProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);
  if (totalBytes === 0) return null;

  const sortedLanguages = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .map(([lang, bytes]) => ({
      name: lang,
      percentage: (bytes / totalBytes) * 100,
      color: getLanguageColor(lang),
    }));

  // Group small languages (<1%) as "Other"
  const visibleLanguages = sortedLanguages.filter(l => l.percentage >= 1);
  const otherPercentage = sortedLanguages
    .filter(l => l.percentage < 1)
    .reduce((sum, l) => sum + l.percentage, 0);

  if (otherPercentage > 0) {
    visibleLanguages.push({
      name: 'Other',
      percentage: otherPercentage,
      color: '#8b8b8b',
    });
  }

  return (
    <div className="space-y-3">
      {/* Color bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        {visibleLanguages.map((lang) => (
          <div
            key={lang.name}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${lang.percentage}%`,
              backgroundColor: lang.color,
              minWidth: lang.percentage > 0 ? '3px' : 0,
            }}
            title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {visibleLanguages.map((lang) => (
          <div key={lang.name} className="flex items-center gap-1.5 text-sm">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: lang.color }}
            />
            <span className="font-medium text-foreground">{lang.name}</span>
            <span className="text-muted-foreground">{lang.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
