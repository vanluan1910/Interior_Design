/**
 * Utility functions for Branch-based scoping and filtering across the admin application.
 */

export function normalizeBranchName(name?: string | null): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Checks if a given target (branch name, warehouse name, showroom name, address, salesRep, etc.)
 * matches the currently selected global branch.
 */
export function isMatchBranch(
  target?: string | null,
  selectedBranch?: string | null,
  fallbackWarehouses?: { name: string; branch: string }[]
): boolean {
  if (!selectedBranch || selectedBranch === 'all') return true;
  if (!target) return false;

  const targetNorm = normalizeBranchName(target);
  const selectedNorm = normalizeBranchName(selectedBranch);

  if (targetNorm === selectedNorm) return true;
  if (targetNorm.includes(selectedNorm) || selectedNorm.includes(targetNorm)) return true;

  // Keyword-based fuzzy matching
  const branchKeywords = [
    { key: 'thao dien', aliases: ['thao dien', 'thu duc', 'td01', 'quoc huong', 'thao.pt'] },
    { key: 'quan 10', aliases: ['quan 10', 'q10', 'ba thang hai', '3 thang 2', 'linh.ptm', 'hq'] },
    { key: 'binh chanh', aliases: ['binh chanh', 'bc01', 'le minh xuan', 'nam.nv', 'bach.hv'] },
    { key: 'ha noi', aliases: ['ecopark', 'ha noi', 'hung yen', 'van giang', 'eco', 'minh.vh', 'hn'] },
    { key: 'nam dinh', aliases: ['nam dinh', 'nd', 'thanh nam', 'quang trung'] },
  ];

  for (const group of branchKeywords) {
    const isSelectedInGroup = group.aliases.some((alias) => selectedNorm.includes(alias));
    if (isSelectedInGroup) {
      const isTargetInGroup = group.aliases.some((alias) => targetNorm.includes(alias));
      if (isTargetInGroup) return true;
    }
  }

  // Check if target is a warehouse name that belongs to the selected branch
  if (fallbackWarehouses && fallbackWarehouses.length > 0) {
    const matchingWh = fallbackWarehouses.find(
      (w) => normalizeBranchName(w.name) === targetNorm || targetNorm.includes(normalizeBranchName(w.name))
    );
    if (matchingWh) {
      return isMatchBranch(matchingWh.branch, selectedBranch);
    }
  }

  return false;
}

/**
 * Checks if a product belongs to or is available in the given branch.
 * If branchStocksJson has configured branch stocks, the product ONLY belongs to branches in the json.
 */
export function isProductInBranch(
  product?: { branch?: string; branchStocksJson?: string } | null,
  selectedBranch?: string | null,
  fallbackWarehouses?: { name: string; branch: string }[]
): boolean {
  if (!product) return false;
  if (!selectedBranch || selectedBranch === 'all') return true;

  // 1. Check multi-branch stocks dictionary if configured
  if (product.branchStocksJson && product.branchStocksJson !== '{}') {
    try {
      const dict: Record<string, number> = JSON.parse(product.branchStocksJson);
      const keys = Object.keys(dict);
      if (keys.length > 0) {
        // If dictionary specifies branches, product strictly belongs only to those branches
        return keys.some((k) => isMatchBranch(k, selectedBranch, fallbackWarehouses));
      }
    } catch {
      // fallback to next checks
    }
  }

  // 2. Check direct branch property
  if (product.branch && product.branch.trim() !== '') {
    return isMatchBranch(product.branch, selectedBranch, fallbackWarehouses);
  }

  // 3. Shared legacy product (no explicit branch restriction)
  return true;
}

/**
 * Gets the numeric stock level of a product in the given branch.
 */
export function getProductStockForBranch(
  product?: { inStock?: number; stockNote?: string; branchStocksJson?: string; branch?: string } | null,
  selectedBranch?: string | null,
  fallbackWarehouses?: { name: string; branch: string }[]
): number {
  if (!product) return 0;
  if (!selectedBranch || selectedBranch === 'all') {
    return product.inStock ?? (parseInt(product.stockNote?.replace(/[^-0-9]/g, '') || '0', 10) || 0);
  }

  // 1. Check multi-branch stocks dictionary if configured
  if (product.branchStocksJson && product.branchStocksJson !== '{}') {
    try {
      const dict: Record<string, number> = JSON.parse(product.branchStocksJson);
      const matchedKey = Object.keys(dict).find((k) => isMatchBranch(k, selectedBranch, fallbackWarehouses));
      if (matchedKey !== undefined && typeof dict[matchedKey] === 'number') {
        return dict[matchedKey];
      }
      // If branch stocks dictionary exists and this branch is not in it, stock is 0
      return 0;
    } catch {
      // fallback
    }
  }

  // 2. Check direct branch property
  if (product.branch && product.branch.trim() !== '') {
    if (isMatchBranch(product.branch, selectedBranch, fallbackWarehouses)) {
      return product.inStock ?? (parseInt(product.stockNote?.replace(/[^-0-9]/g, '') || '0', 10) || 0);
    }
    return 0;
  }

  // 3. Shared product
  return product.inStock ?? (parseInt(product.stockNote?.replace(/[^-0-9]/g, '') || '0', 10) || 0);
}
