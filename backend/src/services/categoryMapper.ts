import categoryData from '../config/categoryMapper.json';

interface CategoryMapping {
  mappings: Record<string, string[]>;
  directoryTaxonomies: Record<string, {
    categories: string[];
    matchStrategy: string;
  }>;
}

const data = categoryData as CategoryMapping;

function normalizeCategory(cat: string): string {
  return cat.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function calculateSimilarity(a: string, b: string): number {
  const aNorm = normalizeCategory(a);
  const bNorm = normalizeCategory(b);

  if (aNorm === bNorm) return 1;
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) return 0.8;

  const aWords = new Set(aNorm.split(/\s+/));
  const bWords = new Set(bNorm.split(/\s+/));
  let commonWords = 0;
  for (const word of aWords) {
    if (bWords.has(word)) commonWords++;
  }

  const totalWords = Math.max(aWords.size, bWords.size);
  return totalWords > 0 ? commonWords / totalWords : 0;
}

export function getExpandedCategories(companyCategories: string[]): string[] {
  const expanded = new Set<string>();

  for (const cat of companyCategories) {
    expanded.add(cat);

    for (const [key, mapped] of Object.entries(data.mappings)) {
      if (normalizeCategory(cat) === normalizeCategory(key)) {
        mapped.forEach(m => expanded.add(m));
      }

      if (mapped.some(m => normalizeCategory(m) === normalizeCategory(cat))) {
        expanded.add(key);
        mapped.forEach(m => expanded.add(m));
      }
    }
  }

  return Array.from(expanded);
}

export function mapCategories(
  companyCategories: string[],
  directoryTaxonomy: string[]
): string[] {
  if (!directoryTaxonomy || directoryTaxonomy.length === 0) {
    return companyCategories.slice(0, 3);
  }

  const expandedCategories = getExpandedCategories(companyCategories);
  const scored: Array<{ category: string; score: number }> = [];

  for (const dirCat of directoryTaxonomy) {
    let bestScore = 0;

    for (const companyCat of expandedCategories) {
      const sim = calculateSimilarity(companyCat, dirCat);
      if (sim > bestScore) bestScore = sim;
    }

    if (bestScore > 0.3) {
      scored.push({ category: dirCat, score: bestScore });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return directoryTaxonomy.slice(0, 1);
  }

  return scored.slice(0, 3).map(s => s.category);
}

export function mapCategoriesForDirectory(
  companyCategories: string[],
  directoryName: string
): string[] {
  const taxonomy = data.directoryTaxonomies[directoryName];
  if (!taxonomy) {
    return companyCategories.slice(0, 3);
  }
  return mapCategories(companyCategories, taxonomy.categories);
}
