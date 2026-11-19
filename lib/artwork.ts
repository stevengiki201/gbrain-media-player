const GRADIENTS: [string, string][] = [
  ['#00D4FF', '#7C3AED'],
  ['#F472B6', '#8B5CF6'],
  ['#34D399', '#0D9488'],
  ['#FBBF24', '#F97316'],
  ['#60A5FA', '#2563EB'],
  ['#F87171', '#DC2626'],
  ['#A78BFA', '#6D28D9'],
  ['#2DD4BF', '#0E7490'],
  ['#FB923C', '#DB2777'],
  ['#A3E635', '#059669'],
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function gradientFor(seed: string): [string, string] {
  return GRADIENTS[hashString(seed || 'media') % GRADIENTS.length];
}

export function initialsFor(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}