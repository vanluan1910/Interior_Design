/**
 * Danh mục chuẩn các loại chất liệu gỗ trong hệ sinh thái Nội Thất Tinh Hoa D2 LUXURY
 * Dùng đồng bộ cho:
 * 1. Form Thêm / Chỉnh sửa sản phẩm trong Admin (InventoryTab)
 * 2. Form Tạo / Chỉnh sửa đơn hàng (OrdersTab)
 * 3. Bộ lọc Chất Liệu Tuyển Chọn tại trang Danh mục sản phẩm (Products Page)
 */

export interface WoodMaterialItem {
  id: string;
  name: string;
  shortName: string;
  queryKey: string;
  count: number;
}

/**
 * Gợi ý các loại gỗ cao cấp tiêu chuẩn khi thêm sản phẩm mới trong Admin
 */
export const DEFAULT_WOOD_SUGGESTIONS = [
  'Gỗ Sồi Tự Nhiên (Ash / Oak)',
  'Gỗ Tần Bì & Veneer Sồi',
  'Gỗ Óc Chó Bắc Mỹ (Walnut FAS)',
  'Gỗ Me Tây Nguyên Tấm',
  'Mây Tự Nhiên & Khung Gỗ',
  'Gỗ Gõ Đỏ Cao Cấp',
  'Gỗ Hương Đá',
  'Gỗ Mun Hoa & Gỗ Gụ',
  'Khung Gỗ Bọc Da Bò Cao Cấp',
];

export const WOOD_MATERIAL_AUTOCOMPLETE_OPTIONS = DEFAULT_WOOD_SUGGESTIONS.map((w) => ({
  value: w,
  label: w,
}));

/**
 * Chuẩn hóa tên chất liệu gỗ từ dữ liệu thô trong Database
 */
export function extractPrimaryWood(wood: string): string {
  const str = (wood || '').trim();
  if (!str) return 'Gỗ Tự Nhiên Cao Cấp';
  const lower = str.toLowerCase();
  if (lower.includes('óc chó') || lower.includes('walnut')) return 'Gỗ Óc Chó Bắc Mỹ';
  if (lower.includes('me tây')) return 'Gỗ Me Tây Nguyên Tấm';
  if (lower.includes('tần bì')) return 'Gỗ Tần Bì (Ash)';
  if (lower.includes('sồi') || lower.includes('oak')) return 'Gỗ Sồi Tự Nhiên (Oak)';
  if (lower.includes('gõ đỏ')) return 'Gỗ Gõ Đỏ Cao Cấp';
  if (lower.includes('hương')) return 'Gỗ Hương Đá';
  if (lower.includes('mun') || lower.includes('gụ')) return 'Gỗ Mun Hoa & Gỗ Gụ';
  if (lower.includes('mây')) return 'Mây Tự Nhiên';
  if (lower.includes('da bò') || lower.includes('leather') || lower.includes('bọc da')) return 'Khung Gỗ Bọc Da';
  return str;
}

/**
 * Lấy từ khóa truy vấn API tìm kiếm/lọc tương ứng với nhóm gỗ
 */
export function getMaterialQueryKey(woodName: string): string {
  const lower = (woodName || '').toLowerCase();
  if (lower.includes('óc chó') || lower.includes('walnut')) return 'óc chó';
  if (lower.includes('me tây')) return 'me tây';
  if (lower.includes('tần bì')) return 'tần bì';
  if (lower.includes('sồi') || lower.includes('oak')) return 'sồi';
  if (lower.includes('gõ đỏ')) return 'gõ đỏ';
  if (lower.includes('hương')) return 'hương';
  if (lower.includes('mun') || lower.includes('gụ')) return 'mun';
  if (lower.includes('mây')) return 'mây';
  if (lower.includes('da')) return 'da';
  return woodName;
}

/**
 * Tổng hợp dữ liệu chất liệu gỗ thực tế lấy từ Database API (/api/products/materials)
 * Nhóm theo chủng loại gỗ chính và tính tổng số lượng thật 100% từ Database
 */
export function groupDbMaterials(dbList: { name: string; count: number }[]): WoodMaterialItem[] {
  if (!Array.isArray(dbList) || dbList.length === 0) {
    return [];
  }

  const map = new Map<string, number>();

  for (const item of dbList) {
    const rawName = item.name || '';
    if (!rawName.trim()) continue;
    const standardName = extractPrimaryWood(rawName);
    const current = map.get(standardName) || 0;
    map.set(standardName, current + (item.count || 0));
  }

  // Chuyển Map thành mảng danh sách được sắp xếp theo số lượng sản phẩm giảm dần
  return Array.from(map.entries())
    .map(([name, count]) => ({
      id: name,
      name: name,
      shortName: name,
      queryKey: getMaterialQueryKey(name),
      count: count,
    }))
    .sort((a, b) => b.count - a.count);
}
