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
    { key: 'quan 10', aliases: ['quan 10', 'q10', 'ba thang hai', '3 thang 2', 'linh.ptm'] },
    { key: 'binh chanh', aliases: ['binh chanh', 'bc01', 'le minh xuan', 'nam.nv', 'bach.hv'] },
    { key: 'ecopark', aliases: ['ecopark', 'ha noi', 'hung yen', 'van giang', 'eco', 'minh.vh'] },
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
