using InteriorDesign.Domain.Entities;
using InteriorDesign.Domain.Enums;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace InteriorDesign.Api.Controllers;

/// <summary>
/// API Controller phục vụ toàn diện dữ liệu màn hình Trang chủ (Landing Page / Homepage)
/// </summary>
[Route("api/home")]
public sealed class HomeController : ApiControllerBase
{
    private readonly InteriorDbContext _context;
    private readonly IMemoryCache _cache;

    public HomeController(InteriorDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    /// <summary>
    /// Lấy toàn bộ dữ liệu tổng hợp cho màn hình Trang chủ (Hero, Không gian sống, Sản phẩm nổi bật, Cam kết, Showroom, Công ty)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetHomeData(CancellationToken cancellationToken = default)
    {
        try
        {
            if (_cache.TryGetValue("home_data", out HomeResponseDto? cachedHome) && cachedHome != null)
            {
                return Ok(ApiResponse<HomeResponseDto>.Ok(cachedHome, "Lấy dữ liệu trang chủ thành công (Cache)."));
            }
            // 1. Lấy cấu hình công ty & thương hiệu từ StoreSettings
            var storeSetting = await _context.StoreSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);

            var companyInfo = new HomeCompanyDto(
                BrandName: !string.IsNullOrWhiteSpace(storeSetting?.StoreName) ? storeSetting.StoreName : "D2 LUXURY DESIGN",
                Slogan: "Nội Thất Gỗ Tự Nhiên Cao Cấp",
                Hotline: !string.IsNullOrWhiteSpace(storeSetting?.Hotline) ? storeSetting.Hotline : "0986.739.587",
                Email: !string.IsNullOrWhiteSpace(storeSetting?.Email) ? storeSetting.Email : "contact@d2luxury.vn",
                Address: !string.IsNullOrWhiteSpace(storeSetting?.Address) ? storeSetting.Address : "Ngã 4 Cửa Cạn, đặc khu Phú Quốc, tỉnh An Giang",
                LogoUrl: !string.IsNullOrWhiteSpace(storeSetting?.LogoUrl) ? storeSetting.LogoUrl : "/logo.png",
                Website: "https://d2luxury.vn"
            );

            // 2. Lấy sản phẩm nổi bật từ DB với Projection nhẹ (không load Description, Images, BranchStocksJson...)
            var activeProductsProjection = _context.Products
                .AsNoTracking()
                .Where(p => p.Status == ProductStatus.Active)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Slug,
                    p.Sku,
                    p.Space,
                    CategoryName = p.Category != null ? p.Category.Name : "Tuyệt tác gỗ tự nhiên",
                    p.Price,
                    p.OriginalPrice,
                    p.DiscountPercent,
                    p.MainImageUrl,
                    p.WoodType,
                    p.Dimensions,
                    p.Rating,
                    p.ReviewCount,
                    p.InStock,
                    p.IsFeatured,
                    p.CreatedAt
                });

            var livingProducts = await activeProductsProjection
                .Where(p => p.Space.Contains("khách") || p.Space.Contains("Living") || p.Space == "KG01")
                .OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.CreatedAt)
                .Take(8)
                .ToListAsync(cancellationToken);

            var bedroomProducts = await activeProductsProjection
                .Where(p => p.Space.Contains("ngủ") || p.Space.Contains("Bed") || p.Space == "KG02" || p.Space == "KG03")
                .OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.CreatedAt)
                .Take(8)
                .ToListAsync(cancellationToken);

            var diningProducts = await activeProductsProjection
                .Where(p => p.Space.Contains("ăn") || p.Space.Contains("bếp") || p.Space.Contains("Dining"))
                .OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.CreatedAt)
                .Take(8)
                .ToListAsync(cancellationToken);

            var officeProducts = await activeProductsProjection
                .Where(p => p.Space.Contains("việc") || p.Space.Contains("sách") || p.Space.Contains("Office") || p.Space == "KG04")
                .OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.CreatedAt)
                .Take(8)
                .ToListAsync(cancellationToken);

            var combinedFeatured = new List<dynamic>();
            combinedFeatured.AddRange(livingProducts);
            combinedFeatured.AddRange(bedroomProducts);
            combinedFeatured.AddRange(diningProducts);
            combinedFeatured.AddRange(officeProducts);

            var featuredProducts = combinedFeatured.Select(p => {
                decimal pr = (decimal)p.Price;
                decimal origRaw = (decimal)p.OriginalPrice;
                int discRaw = (int)p.DiscountPercent;
                decimal orig = origRaw > pr ? origRaw : (discRaw > 0 && pr > 0 ? Math.Round(pr / (1 - (decimal)discRaw / 100m)) : pr);
                int disc = discRaw > 0 ? discRaw : (orig > pr && orig > 0 ? (int)Math.Round(((orig - pr) / orig) * 100m) : 0);

                return new HomeProductDto(
                    Id: (Guid)p.Id,
                    Name: (string)p.Name,
                    Slug: (string)p.Slug,
                    Sku: (string)p.Sku,
                    Category: MapSpaceToCategoryKey((string)p.Space, (string)p.Name, (string)p.Sku),
                    CategoryName: (string)p.CategoryName,
                    Price: pr,
                    OriginalPrice: orig > pr ? orig : null,
                    Image: !string.IsNullOrWhiteSpace((string?)p.MainImageUrl) ? (string)p.MainImageUrl : "/images/placeholder.jpg",
                    WoodType: !string.IsNullOrWhiteSpace((string?)p.WoodType) ? (string)p.WoodType : "Gỗ tự nhiên",
                    Dimensions: !string.IsNullOrWhiteSpace((string?)p.Dimensions) ? (string)p.Dimensions : "Theo thiết kế",
                    Tag: disc > 0 ? $"-{disc}%" : "",
                    Rating: (decimal)p.Rating > 0 ? (decimal)p.Rating : 5.0m,
                    ReviewCount: (int)p.ReviewCount > 0 ? (int)p.ReviewCount : 24,
                    InStock: (bool)((int)p.InStock > 0),
                    DiscountPercent: disc
                );
            }).ToList();


            // 3. Lấy danh sách Không gian sống từ DB (Spaces Table) - Hoàn toàn động theo cấu hình người dùng
            var spacesDb = await _context.Spaces
                .AsNoTracking()
                .Where(s => !s.IsDeleted && s.Status == "active" && s.ShowOnHome)
                .OrderBy(s => s.DisplayOrder)
                .ThenBy(s => s.CreatedAt)
                .ToListAsync(cancellationToken);

            var productCountRaw = await _context.Products
                .AsNoTracking()
                .Where(p => p.Status == ProductStatus.Active && !string.IsNullOrEmpty(p.Space))
                .GroupBy(p => p.Space)
                .Select(g => new { Space = g.Key, Count = g.Count() })
                .ToListAsync(cancellationToken);

            var productCountBySpace = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            foreach (var item in productCountRaw)
            {
                if (!string.IsNullOrWhiteSpace(item.Space))
                {
                    productCountBySpace[item.Space.Trim().ToLower()] = item.Count;
                }
            }

            var livingSpaces = spacesDb.Select((s, idx) =>
            {
                var spaceKey = !string.IsNullOrWhiteSpace(s.Slug)
                    ? s.Slug.Trim()
                    : (!string.IsNullOrWhiteSpace(s.Code) ? s.Code.Trim().ToLower() : s.Id.ToString());

                var normName = (s.Name ?? "").Trim().ToLower();
                var normCode = (s.Code ?? "").Trim().ToLower();

                var pCount = productCountBySpace.GetValueOrDefault(normName, 0);
                if (pCount == 0 && !string.IsNullOrWhiteSpace(normCode))
                {
                    pCount = productCountBySpace.GetValueOrDefault(normCode, 0);
                }
                if (pCount == 0 && !string.IsNullOrWhiteSpace(s.Slug))
                {
                    pCount = productCountBySpace.GetValueOrDefault(s.Slug.Trim().ToLower(), 0);
                }

                var countText = pCount > 0 ? $"Xem {pCount} thiết kế" : "Xem thiết kế";
                var colSpan = (idx % 4 == 0 || idx % 4 == 3) ? 7 : 5;
                var codeLabel = !string.IsNullOrWhiteSpace(s.Code) ? s.Code : $"0{idx + 1}";

                var desc = !string.IsNullOrWhiteSpace(s.Description)
                    ? s.Description
                    : (!string.IsNullOrWhiteSpace(s.Tagline) ? s.Tagline : $"Bộ sưu tập nội thất {s.Name}");
                var tagline = !string.IsNullOrWhiteSpace(s.Tagline) ? s.Tagline : s.Name;
                var imageUrl = !string.IsNullOrWhiteSpace(s.Image) ? s.Image : "/logo.png";

                return new HomeSpaceDto(
                    Key: spaceKey,
                    Name: s.Name,
                    Tagline: tagline,
                    Description: desc,
                    ImageUrl: imageUrl,
                    CountText: countText,
                    CodeLabel: codeLabel,
                    ColSpan: colSpan,
                    LinkUrl: $"/products?space={Uri.EscapeDataString(spaceKey)}",
                    Id: s.Id
                );
            }).ToList();

            // 4. Lấy danh sách Showroom & Chi nhánh từ DB (Branches Table)
            var branchesDb = await _context.Branches
                .AsNoTracking()
                .Where(b => !b.IsDeleted && b.Status == "active")
                .OrderByDescending(b => b.IsHeadquarter)
                .ThenBy(b => b.Name)
                .ToListAsync(cancellationToken);

            var showrooms = branchesDb.Select(b => new HomeShowroomDto(
                Id: b.Id,
                Name: b.Name,
                Address: b.Address,
                Phone: !string.IsNullOrWhiteSpace(b.ManagerPhone) ? b.ManagerPhone : (companyInfo.Hotline ?? "0986.739.587"),
                OpeningHours: "08:00 - 21:00 (Tất cả các ngày)",
                ImageUrl: null,
                IsHeadquarter: b.IsHeadquarter
            )).ToList();

            if (showrooms.Count == 0)
            {
                showrooms = GetDefaultShowrooms();
            }

            // 5. Hero Banner & Stats
            var totalProjectsCount = await _context.Orders.CountAsync(cancellationToken);
            var displayProjectCount = totalProjectsCount > 100 ? $"{totalProjectsCount:N0}+" : "2,500+";

            var heroBanner = !string.IsNullOrWhiteSpace(storeSetting?.HeroBannerUrl) && storeSetting.HeroBannerUrl != "/hero-interior.jpg"
                ? storeSetting.HeroBannerUrl
                : "/hero-bg.jpg";

            var hero = new HomeHeroDto(
                Tagline: "Tuyệt Tác Không Gian Gỗ Tự Nhiên",
                Title: "Kiến Tạo Nghệ Thuật Sống Từ Tâm & Đôi Bàn Tay Nghệ Nhân",
                Subtitle: "Đồng hành cùng 2,500+ biệt thự, dinh thự và căn hộ cao cấp kiến tạo không gian sống đỉnh cao từ gỗ óc chó Bắc Mỹ, gõ đỏ và sồi tự nhiên.",
                PrimaryCtaText: "Khám phá bộ sưu tập",
                PrimaryCtaLink: "#living-spaces",
                SecondaryCtaText: "Đặt lịch tư vấn KTS",
                SecondaryCtaLink: "#consultation",
                BackgroundImageUrl: heroBanner,
                Stats: new List<HomeStatDto>
                {
                    new("Năm kinh nghiệm mộc thủ công", "15+", "Năm"),
                    new("Dự án biệt thự & dinh thự", displayProjectCount, "Công trình"),
                    new("Tỷ lệ khách hàng hài lòng", "99.2%", "Hài lòng"),
                    new("Quy mô nhà máy sản xuất", "2,000 m²", "Quy mô")
                }
            );

            // 6. Cam kết thương hiệu
            var commitments = new List<HomeCommitmentDto>
            {
                new(
                    Icon: "forest",
                    Title: "Gỗ Tự Nhiên Tuyển Chọn 100%",
                    Description: "Gỗ óc chó Bắc Mỹ, Gõ đỏ Pachy và Sồi Nga nhập khẩu có chứng chỉ nguồn gốc FSC bền vững, tẩm sấy tiêu chuẩn quốc tế MC 8-12%."
                ),
                new(
                    Icon: "carpenter",
                    Title: "Kỹ Nghệ Mộc Âm Dương Truyền Thống",
                    Description: "Khớp mộng mộc truyền thống không dùng đinh kim loại, đảm bảo kết cấu vững chắc trường tồn qua nhiều thế hệ."
                ),
                new(
                    Icon: "verified_user",
                    Title: "Bảo Hành Chính Hãng 05 Năm",
                    Description: "Bảo dưỡng định kỳ miễn phí, đồng hành bảo trì trọn đời sản phẩm cùng đội ngũ nghệ nhân lành nghề."
                ),
                new(
                    Icon: "local_shipping",
                    Title: "Vận Chuyển & Lắp Đặt Tận Nơi",
                    Description: "Đội ngũ chuyên viên kỹ thuật giao lắp cẩn trọng, bọc đệm bảo vệ chống xước an toàn tuyệt đối tại công trình."
                )
            };

            // 7. Câu chuyện chế tác
            var craftsmanship = new HomeCraftsmanshipDto(
                Badge: "Di Sản Làng Nghề",
                Title: "Tâm Huyết Trong Từng Thớ Gỗ",
                Description: "Mỗi sản phẩm nội thất tại D2 Luxury là kết tinh giữa tinh hoa mộc truyền thống và ngôn ngữ thiết kế đương đại. Chúng tôi tôn trọng vẻ đẹp nguyên bản của từng đường vân gỗ, biến mỗi khối gỗ thành một tác phẩm nghệ thuật độc bản trong ngôi nhà của bạn.",
                ImageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&q=80",
                Highlights: new List<string>
                {
                    "Quy trình tẩm sấy 60 ngày đạt độ ẩm chuẩn 8-12% chống cong vênh nứt nẻ",
                    "Kỹ thuật chà nhám thủ công 8 cấp độ mịn màng như lụa",
                    "Sơn lau dầu thực vật tự nhiên Osmo (Đức) an toàn tuyệt đối cho trẻ nhỏ",
                    "Kiểm tra chất lượng KCS nghiêm ngặt 3 bước trước khi xuất xưởng"
                }
            );

            // 8. Đánh giá khách hàng
            var testimonials = new List<HomeTestimonialDto>
            {
                new(
                    CustomerName: "Anh Hoàng Minh Tuấn",
                    ProjectLocation: "Penthouse Ciputra Tây Hồ, Hà Nội",
                    Quote: "Bộ bàn ăn gỗ óc chó nguyên tấm của D2 Luxury thực sự là tâm điểm của ngôi nhà. Vân gỗ cuộn sóng tuyệt đẹp, hoàn thiện mịn màng và rất đầm tay.",
                    Rating: 5,
                    AvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"
                ),
                new(
                    CustomerName: "Chị Nguyễn Bích Ngọc",
                    ProjectLocation: "Biệt thự Vinhomes Riverside, Long Biên",
                    Quote: "Rất ấn tượng với sự tận tâm của đội ngũ KTS và các bác thợ mộc. Thi công đúng tiến độ cam kết và chất lượng gỗ chuẩn chỉ 100%.",
                    Rating: 5,
                    AvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80"
                )
            };

            var homeData = new HomeResponseDto(
                Hero: hero,
                LivingSpaces: livingSpaces,
                FeaturedProducts: featuredProducts,
                Commitments: commitments,
                Craftsmanship: craftsmanship,
                Showrooms: showrooms,
                CompanyInfo: companyInfo,
                Testimonials: testimonials
            );

            _cache.Set("home_data", homeData, TimeSpan.FromSeconds(30));
            return Ok(ApiResponse<HomeResponseDto>.Ok(homeData, "Lấy dữ liệu trang chủ thành công."));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<object>.Fail("Yêu cầu đã bị hủy."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"Lỗi khi lấy dữ liệu trang chủ: {ex.Message}"));
        }
    }

    /// <summary>
    /// Lấy danh sách sản phẩm nổi bật phục vụ riêng cho section Featured Products trên Trang chủ
    /// </summary>
    [HttpGet("featured-products")]
    public async Task<IActionResult> GetFeaturedProducts([FromQuery] string? category = null, [FromQuery] int limit = 8, CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _context.Products
                .Include(p => p.Category)
                .AsNoTracking()
                .Where(p => p.Status == ProductStatus.Active);

            if (!string.IsNullOrWhiteSpace(category) && category != "all")
            {
                var catKey = category.ToLower().Trim();
                if (catKey == "living")
                {
                    query = query.Where(p => p.Space.ToLower().Contains("living") || p.Space.ToLower().Contains("khách") || p.Space == "KG01" || p.Name.ToLower().Contains("sofa") || p.Name.ToLower().Contains("kệ tivi") || p.Name.ToLower().Contains("bàn trà"));
                }
                else if (catKey == "bedroom")
                {
                    query = query.Where(p => p.Space.ToLower().Contains("bed") || p.Space.ToLower().Contains("ngủ") || p.Space == "KG02" || p.Space == "KG03" || p.Name.ToLower().Contains("giường") || p.Name.ToLower().Contains("táp") || p.Name.ToLower().Contains("tủ áo"));
                }
                else if (catKey == "dining")
                {
                    query = query.Where(p => p.Space.ToLower().Contains("din") || p.Space.ToLower().Contains("ăn") || p.Space.ToLower().Contains("bếp") || p.Name.ToLower().Contains("bàn ăn") || p.Name.ToLower().Contains("ghế ăn"));
                }
                else if (catKey == "office")
                {
                    query = query.Where(p => p.Space.ToLower().Contains("off") || p.Space.ToLower().Contains("work") || p.Space.ToLower().Contains("việc") || p.Space.ToLower().Contains("sách") || p.Space == "KG04" || p.Name.ToLower().Contains("làm việc") || p.Name.ToLower().Contains("kệ sách"));
                }
            }

            var orderedQuery = query
                .OrderByDescending(p => p.IsFeatured)
                .ThenByDescending(p => p.CreatedAt);

            var rawProducts = await (limit > 0 ? orderedQuery.Take(limit) : orderedQuery)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Slug,
                    p.Sku,
                    p.Space,
                    CategoryName = p.Category != null ? p.Category.Name : "Tuyệt tác gỗ tự nhiên",
                    p.Price,
                    p.OriginalPrice,
                    p.DiscountPercent,
                    p.MainImageUrl,
                    p.WoodType,
                    p.Dimensions,
                    p.Rating,
                    p.ReviewCount,
                    p.InStock
                })
                .ToListAsync(cancellationToken);

            var products = rawProducts.Select(p => {
                decimal pr = p.Price;
                decimal orig = p.OriginalPrice > pr ? p.OriginalPrice : (p.DiscountPercent > 0 && pr > 0 ? Math.Round(pr / (1 - (decimal)p.DiscountPercent / 100m)) : pr);
                int disc = p.DiscountPercent > 0 ? p.DiscountPercent : (orig > pr && orig > 0 ? (int)Math.Round(((orig - pr) / orig) * 100m) : 0);

                return new HomeProductDto(
                    p.Id,
                    p.Name,
                    p.Slug,
                    p.Sku,
                    MapSpaceToCategoryKey(p.Space, p.Name, p.Sku),
                    p.CategoryName,
                    pr,
                    orig > pr ? orig : null,
                    !string.IsNullOrWhiteSpace(p.MainImageUrl) ? p.MainImageUrl : "/images/placeholder.jpg",
                    !string.IsNullOrWhiteSpace(p.WoodType) ? p.WoodType : "Gỗ tự nhiên",
                    !string.IsNullOrWhiteSpace(p.Dimensions) ? p.Dimensions : "Theo thiết kế",
                    disc > 0 ? $"-{disc}%" : "",
                    p.Rating > 0 ? p.Rating : 5.0m,
                    p.ReviewCount > 0 ? p.ReviewCount : 24,
                    p.InStock > 0,
                    disc
                );
            }).ToList();

            return Ok(ApiResponse<List<HomeProductDto>>.Ok(products, "Lấy danh sách sản phẩm nổi bật thành công."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"Lỗi lấy sản phẩm nổi bật: {ex.Message}"));
        }
    }

    /// <summary>
    /// Lấy danh sách showroom phục vụ section Showroom trên Trang chủ
    /// </summary>
    [HttpGet("showrooms")]
    public async Task<IActionResult> GetHomeShowrooms(CancellationToken cancellationToken = default)
    {
        try
        {
            var branches = await _context.Branches.AsNoTracking()
                .Where(b => !b.IsDeleted && b.Status == "active")
                .OrderByDescending(b => b.IsHeadquarter)
                .ThenBy(b => b.Name)
                .Select(b => new HomeShowroomDto(
                    b.Id,
                    b.Name,
                    b.Address,
                    !string.IsNullOrWhiteSpace(b.ManagerPhone) ? b.ManagerPhone : "0986.739.587",
                    "08:00 - 21:00 (Tất cả các ngày)",
                    null,
                    b.IsHeadquarter
                ))
                .ToListAsync(cancellationToken);

            return Ok(ApiResponse<List<HomeShowroomDto>>.Ok(branches, "Lấy danh sách showroom thành công."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"Lỗi lấy danh sách showroom: {ex.Message}"));
        }
    }

    private static string MapSpaceToCategoryKey(string space, string? name = null, string? sku = null)
    {
        var s = (space ?? "").ToLower().Trim();
        var n = (name ?? "").ToLower().Trim();
        var k = (sku ?? "").ToLower().Trim();

        if (s.Contains("bed") || s.Contains("ngủ") || s == "kg03" || s == "nh03" ||
            n.Contains("giường") || n.Contains("táp") || n.Contains("tab") || n.Contains("tủ áo") ||
            k.StartsWith("bd") || k.StartsWith("gn"))
            return "bedroom";

        if (s.Contains("din") || s.Contains("ăn") || s.Contains("bếp") || s == "kg02" || s == "nh02" ||
            n.Contains("bàn ăn") || n.Contains("ghế ăn") || n.Contains("bếp") ||
            k.StartsWith("dt") || k.StartsWith("dc") || k.StartsWith("ba") || k.StartsWith("ga"))
            return "dining";

        if (s.Contains("off") || s.Contains("work") || s.Contains("việc") || s.Contains("sách") || s == "kg04" || s == "nh04" ||
            n.Contains("làm việc") || n.Contains("giám đốc") || n.Contains("kệ sách") || n.Contains("bàn học") ||
            k.StartsWith("of") || k.StartsWith("dk") || k.StartsWith("blv"))
            return "office";

        return "living";
    }

    private static string MapCategoryKeyToSpace(string category)
    {
        return category.ToLower() switch
        {
            "living" => "living",
            "bedroom" => "bedroom",
            "dining" => "dining",
            "office" => "office",
            _ => category
        };
    }

    private static string GetDefaultSpaceImage(string spaceKey)
    {
        return spaceKey switch
        {
            "living" => "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1000&q=80",
            "dining" => "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1000&q=80",
            "office" => "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1000&q=80",
            "bedroom" => "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1000&q=80",
            _ => "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1000&q=80"
        };
    }

    private static List<HomeSpaceDto> GetDefaultSpaces()
    {
        return new List<HomeSpaceDto>
        {
            new("living", "Phòng Khách Tĩnh Tại", "Không gian chính", "Sofa mộc bọc nỉ lanh tự nhiên, bàn trà điêu khắc hữu cơ, hệ kệ TV tinh gọn tôn vinh sự mộc mạc.", GetDefaultSpaceImage("living"), "Xem 38 thiết kế", "01 / PHÒNG KHÁCH", 7, "/products?space=living"),
            new("dining", "Phòng Ăn Sum Vầy", "Bữa cơm ấm cúng", "Bàn ăn mở rộng thông minh, ghế tựa công thái học ôm sát sống lưng.", GetDefaultSpaceImage("dining"), "Xem 19 thiết kế", "02 / PHÒNG ĂN", 5, "/products?space=dining"),
            new("office", "Góc Làm Việc Tĩnh Tại", "Tập trung & sáng tạo", "Bàn làm việc cạnh cong bo mềm, giá sách modul tuỳ biến theo kích thước căn hộ.", GetDefaultSpaceImage("office"), "Xem 15 thiết kế", "03 / PHÒNG LÀM VIỆC", 5, "/products?space=office"),
            new("bedroom", "Phòng Ngủ Vỗ Về", "Giấc ngủ thư thái", "Giường phản thấp giấu chân, tủ áo lam gỗ thanh mảnh và tab đầu giường nguyên khối.", GetDefaultSpaceImage("bedroom"), "Xem 24 thiết kế", "04 / PHÒNG NGỦ", 7, "/products?space=bedroom")
        };
    }

    private static List<HomeShowroomDto> GetDefaultShowrooms()
    {
        return new List<HomeShowroomDto>
        {
            new(Guid.NewGuid(), "Trụ sở & Showroom Flagship Phú Quốc", "Ngã 4 Cửa Cạn, đặc khu Phú Quốc, tỉnh An Giang", "0986.739.587", "08:00 - 21:00 (Tất cả các ngày)", "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80", true),
            new(Guid.NewGuid(), "Showroom & Xưởng Mộc Nam Định", "Khu Công Nghiệp Ý Yên, Huyện Ý Yên, Tỉnh Nam Định", "0986.739.587", "07:30 - 18:30 (Thứ 2 - Thứ 7)", "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80", false),
            new(Guid.NewGuid(), "Chi nhánh Showroom TP. Hồ Chí Minh", "215 Nguyễn Văn Trỗi, Phường 10, Quận Phú Nhuận, TP.HCM", "0986.739.587", "08:30 - 21:30 (Tất cả các ngày)", "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&q=80", false)
        };
    }
}
