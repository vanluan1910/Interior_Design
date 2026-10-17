export interface LocationItem {
  code: string | number;
  name: string;
}

export interface ProvinceItem {
  code: string | number;
  name: string;
  districts?: LocationItem[];
}

const OPEN_API_PROVINCES_URL = 'https://provinces.open-api.vn/api';

// In-memory caches
let cachedProvinces: ProvinceItem[] | null = null;
const districtCache = new Map<string | number, LocationItem[]>();
const wardCache = new Map<string | number, LocationItem[]>();

export const locationApi = {
  /**
   * Cấp 1: Lấy danh sách Tỉnh / Thành phố
   */
  async getProvinces(): Promise<ProvinceItem[]> {
    if (cachedProvinces && cachedProvinces.length > 0) {
      return cachedProvinces;
    }

    try {
      const res = await fetch(`${OPEN_API_PROVINCES_URL}/p/`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedProvinces = data.map((item: any) => ({
          code: item.code,
          name: item.name,
        }));
        return cachedProvinces;
      }
    } catch (err) {
      console.warn('Lỗi tải tỉnh/thành từ API:', err);
    }

    cachedProvinces = [];
    return cachedProvinces;
  },

  /**
   * Cấp 2: Lấy danh sách Quận / Huyện theo Tỉnh
   */
  async getDistrictsByProvince(provinceNameOrCode: string | number): Promise<LocationItem[]> {
    if (!provinceNameOrCode) return [];

    const cacheKey = `dist_${provinceNameOrCode}`;
    if (districtCache.has(cacheKey)) {
      return districtCache.get(cacheKey)!;
    }

    let pCode = provinceNameOrCode;
    const provinces = await this.getProvinces();
    const foundProv = provinces.find(
      (p) =>
        String(p.code) === String(provinceNameOrCode) ||
        p.name.toLowerCase() === String(provinceNameOrCode).toLowerCase() ||
        p.name.toLowerCase().replace(/^(tỉnh|thành phố|tp\.)\s+/i, '').trim() ===
          String(provinceNameOrCode).toLowerCase().replace(/^(tỉnh|thành phố|tp\.)\s+/i, '').trim()
    );

    if (foundProv && foundProv.code) {
      pCode = foundProv.code;
    }

    if (typeof pCode === 'number' || !isNaN(Number(pCode))) {
      try {
        const res = await fetch(`${OPEN_API_PROVINCES_URL}/p/${pCode}?depth=2`, {
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.districts)) {
            const list: LocationItem[] = data.districts.map((d: any) => ({
              code: d.code,
              name: d.name,
            }));
            districtCache.set(cacheKey, list);
            districtCache.set(`dist_${pCode}`, list);
            return list;
          }
        }
      } catch (err) {
        console.warn('Lỗi tải quận/huyện từ API:', err);
      }
    }

    return [];
  },

  /**
   * Cấp 3: Lấy danh sách Phường / Xã / Thị trấn theo Quận / Huyện
   */
  async getWardsByDistrict(
    districtNameOrCode: string | number,
    provinceNameOrCode?: string | number
  ): Promise<LocationItem[]> {
    if (!districtNameOrCode) return [];

    const cacheKey = `ward_${provinceNameOrCode || ''}_${districtNameOrCode}`;
    if (wardCache.has(cacheKey)) {
      return wardCache.get(cacheKey)!;
    }

    let dCode = districtNameOrCode;

    if (isNaN(Number(dCode)) && provinceNameOrCode) {
      const districts = await this.getDistrictsByProvince(provinceNameOrCode);
      const matched = districts.find(
        (d) =>
          d.name.toLowerCase() === String(districtNameOrCode).toLowerCase() ||
          d.name.toLowerCase().replace(/^(quận|huyện|thị xã|thành phố|tp\.)\s+/i, '').trim() ===
            String(districtNameOrCode).toLowerCase().replace(/^(quận|huyện|thị xã|thành phố|tp\.)\s+/i, '').trim()
      );
      if (matched && matched.code) {
        dCode = matched.code;
      }
    }

    if (typeof dCode === 'number' || !isNaN(Number(dCode))) {
      try {
        const res = await fetch(`${OPEN_API_PROVINCES_URL}/d/${dCode}?depth=2`, {
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.wards)) {
            const list: LocationItem[] = data.wards.map((w: any) => ({
              code: w.code,
              name: w.name,
            }));
            wardCache.set(cacheKey, list);
            return list;
          }
        }
      } catch (err) {
        console.warn('Lỗi tải phường/xã từ API:', err);
      }
    }

    return [];
  },
};
