using System.Globalization;
using System.Text;
using InteriorDesign.Domain.Entities;

namespace InteriorDesign.Infrastructure.Data;

/// <summary>
/// Dynamic Branch & Warehouse matcher purely based on real Database entities.
/// Eliminates hardcoded alias lists and mock strings.
/// </summary>
public static class BranchMatcher
{
    public static string RemoveDiacritics(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalizedString.Length);
        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }
        return sb.ToString().Normalize(NormalizationForm.FormC).Replace("đ", "d").Replace("Đ", "D");
    }

    public static string Normalize(string? text)
    {
        return RemoveDiacritics(text).Trim().ToLowerInvariant();
    }

    public static bool Matches(string? candidate, string? target)
    {
        if (string.IsNullOrWhiteSpace(candidate) || string.IsNullOrWhiteSpace(target)) return false;
        var cNorm = Normalize(candidate);
        var tNorm = Normalize(target);
        if (cNorm == tNorm) return true;
        if (cNorm.Contains(tNorm) || tNorm.Contains(cNorm)) return true;
        return false;
    }

    /// <summary>
    /// Finds the corresponding Branch from database entities dynamically.
    /// Matches by Code, Name, Address, or associated Warehouses.
    /// </summary>
    public static Branch? FindMatchingBranch(IEnumerable<Branch> branches, string? target, IEnumerable<Warehouse>? warehouses = null)
    {
        if (string.IsNullOrWhiteSpace(target)) return null;
        var branchList = branches as IList<Branch> ?? branches.ToList();
        if (branchList.Count == 0) return null;

        var tNorm = Normalize(target);

        // 1. Exact or partial match on Branch.Code or Branch.Name
        var directMatch = branchList.FirstOrDefault(b =>
            string.Equals(b.Code, target, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(b.Name, target, StringComparison.OrdinalIgnoreCase) ||
            Normalize(b.Code) == tNorm ||
            Normalize(b.Name) == tNorm);
        if (directMatch != null) return directMatch;

        // 2. Normalized inclusion on Branch.Name
        var nameMatch = branchList.FirstOrDefault(b =>
            Normalize(b.Name).Contains(tNorm) || tNorm.Contains(Normalize(b.Name)));
        if (nameMatch != null) return nameMatch;

        // 3. Match against associated Warehouses in DB
        if (warehouses != null)
        {
            var whList = warehouses as IList<Warehouse> ?? warehouses.ToList();
            var matchedWh = whList.FirstOrDefault(w =>
                string.Equals(w.Code, target, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(w.Name, target, StringComparison.OrdinalIgnoreCase) ||
                Normalize(w.Code) == tNorm ||
                Normalize(w.Name) == tNorm ||
                Normalize(w.Name).Contains(tNorm) ||
                tNorm.Contains(Normalize(w.Name)));

            if (matchedWh != null && !string.IsNullOrWhiteSpace(matchedWh.Branch))
            {
                var whBranch = branchList.FirstOrDefault(b =>
                    string.Equals(b.Name, matchedWh.Branch, StringComparison.OrdinalIgnoreCase) ||
                    Normalize(b.Name) == Normalize(matchedWh.Branch) ||
                    Normalize(b.Name).Contains(Normalize(matchedWh.Branch)) ||
                    Normalize(matchedWh.Branch).Contains(Normalize(b.Name)));
                if (whBranch != null) return whBranch;
            }
        }

        // 4. Match against Address / Region if target has meaningful length
        if (tNorm.Length >= 3)
        {
            var addrMatch = branchList.FirstOrDefault(b =>
                (!string.IsNullOrWhiteSpace(b.Address) && Normalize(b.Address).Contains(tNorm)) ||
                (!string.IsNullOrWhiteSpace(b.Region) && Normalize(b.Region).Contains(tNorm)));
            if (addrMatch != null) return addrMatch;
        }

        return null;
    }

    /// <summary>
    /// Checks if two branch/warehouse strings refer to the same branch.
    /// Can resolve dynamically against database branches/warehouses without hardcoding.
    /// </summary>
    public static bool IsBranchMatch(
        string? storedBranch,
        string? targetBranch,
        IEnumerable<Branch>? dbBranches = null,
        IEnumerable<Warehouse>? dbWarehouses = null)
    {
        if (string.IsNullOrWhiteSpace(storedBranch) || string.IsNullOrWhiteSpace(targetBranch)) return false;

        // Direct equality or substring check
        if (Matches(storedBranch, targetBranch)) return true;

        // If DB branches are available, resolve both to their real DB Branch and compare
        if (dbBranches != null)
        {
            var branchList = dbBranches as IList<Branch> ?? dbBranches.ToList();
            var bA = FindMatchingBranch(branchList, storedBranch, dbWarehouses);
            var bB = FindMatchingBranch(branchList, targetBranch, dbWarehouses);
            if (bA != null && bB != null && (bA.Id == bB.Id || string.Equals(bA.Name, bB.Name, StringComparison.OrdinalIgnoreCase)))
            {
                return true;
            }
        }

        return false;
    }
}
