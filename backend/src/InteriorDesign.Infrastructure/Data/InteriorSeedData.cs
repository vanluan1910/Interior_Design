using InteriorDesign.Domain.Entities;
using InteriorDesign.Domain.Enums;

namespace InteriorDesign.Infrastructure.Data;

public static class InteriorSeedData
{
    public static readonly Guid CatLivingRoomId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid CatDiningRoomId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid CatBedroomId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    public static readonly Guid CatOfficeId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    public static readonly Guid CatDecorId = Guid.Parse("55555555-5555-5555-5555-555555555555");

    public static List<InteriorSpace> GetSpaces() =>
    [
        new InteriorSpace
        {
            Id = Guid.Parse("d1111111-1111-1111-1111-111111111111"),
            Code = "KG01",
            Name = "Phòng Khách",
            Slug = "living",
            Tagline = "Không gian chính",
            Description = "Sofa mộc bọc nỉ lanh tự nhiên, bàn trà điêu khắc hữu cơ, hệ kệ TV tinh gọn tôn vinh sự mộc mạc.",
            Image = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80",
            DisplayOrder = 1,
            Status = "active",
            ShowOnHome = true,
            ShowOnHeader = true,
            CategoryCount = 42,
            CreatedAt = DateTime.UtcNow
        },
        new InteriorSpace
        {
            Id = Guid.Parse("d2222222-2222-2222-2222-222222222222"),
            Code = "KG02",
            Name = "Phòng Ăn & Bếp",
            Slug = "dining",
            Tagline = "Bữa cơm ấm cúng",
            Description = "Bàn ăn mở rộng thông minh, ghế tựa công thái học ôm sát sống lưng.",
            Image = "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80",
            DisplayOrder = 2,
            Status = "active",
            ShowOnHome = true,
            ShowOnHeader = true,
            CategoryCount = 36,
            CreatedAt = DateTime.UtcNow
        },
        new InteriorSpace
        {
            Id = Guid.Parse("d3333333-3333-3333-3333-333333333333"),
            Code = "KG03",
            Name = "Phòng Làm Việc",
            Slug = "office",
            Tagline = "Tập trung & sáng tạo",
            Description = "Bàn làm việc cạnh cong bo mềm, giá sách modul tuỳ biến theo kích thước căn hộ.",
            Image = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop&q=80",
            DisplayOrder = 3,
            Status = "active",
            ShowOnHome = true,
            ShowOnHeader = true,
            CategoryCount = 19,
            CreatedAt = DateTime.UtcNow
        },
        new InteriorSpace
        {
            Id = Guid.Parse("d4444444-4444-4444-4444-444444444444"),
            Code = "KG04",
            Name = "Phòng Ngủ",
            Slug = "bedroom",
            Tagline = "Giấc ngủ thư thái",
            Description = "Giường phản thấp giấu chân, tủ áo lam gỗ thanh mảnh và tab đầu giường nguyên khối.",
            Image = "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=80",
            DisplayOrder = 4,
            Status = "active",
            ShowOnHome = true,
            ShowOnHeader = true,
            CategoryCount = 28,
            CreatedAt = DateTime.UtcNow
        },
        new InteriorSpace
        {
            Id = Guid.Parse("d5555555-5555-5555-5555-555555555555"),
            Code = "KG05",
            Name = "Ngoại Thất & Ban Công",
            Slug = "outdoor",
            Tagline = "Gần gũi thiên nhiên",
            Description = "Bàn trà ngoài trời gỗ Teak chống chịu thời tiết, ghế xích đu đan mây thư giãn.",
            Image = "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80",
            DisplayOrder = 5,
            Status = "active",
            ShowOnHome = false,
            ShowOnHeader = true,
            CategoryCount = 8,
            CreatedAt = DateTime.UtcNow
        },
        new InteriorSpace
        {
            Id = Guid.Parse("d6666666-6666-6666-6666-666666666666"),
            Code = "KG06",
            Name = "Sản phẩm khác",
            Slug = "san-pham-khac",
            Tagline = "Đồ trang trí & phụ kiện khác",
            Description = "Các mẫu ghế thư giãn, đôn mây, phụ kiện và sản phẩm trang trí độc đáo.",
            Image = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80",
            DisplayOrder = 6,
            Status = "active",
            ShowOnHome = false,
            ShowOnHeader = true,
            CategoryCount = 20,
            CreatedAt = DateTime.UtcNow
        }
    ];

    public static List<Category> GetCategories() =>
    [
        new Category
        {
            Id = CatLivingRoomId,
            Code = "NH01",
            Name = "Phòng Khách",
            Slug = "phong-khach",
            Description = "Không gian phòng khách Japandi ấm cúng, tối giản với sofa và bàn trà gỗ tự nhiên nguyên khối.",
            ImageUrl = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
            Icon = "Armchair",
            Space = "Phòng khách",
            DisplayOrder = 1,
            ProductCount = 42,
            FeaturedProduct = "Sofa Kyoto Gỗ Óc Chó, Bàn Trà Nami",
            ShowOnHome = true,
            ShowOnMenu = true,
            Status = "active",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        },
        new Category
        {
            Id = CatDiningRoomId,
            Code = "NH02",
            Name = "Phòng Ăn & Bếp",
            Slug = "phong-an-bep",
            Description = "Bàn ăn nguyên tấm Live-Edge kết hợp ghế ăn công thái học bọc da bò Ý cao cấp.",
            ImageUrl = "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80",
            Icon = "Utensils",
            Space = "Phòng ăn",
            DisplayOrder = 2,
            ProductCount = 36,
            FeaturedProduct = "Bàn Ăn Komorebi 2.8m, Ghế Ăn Katakana",
            ShowOnHome = true,
            ShowOnMenu = true,
            Status = "active",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        },
        new Category
        {
            Id = CatBedroomId,
            Code = "NH03",
            Name = "Phòng Ngủ",
            Slug = "phong-ngu",
            Description = "Không gian nghỉ dưỡng thanh tịnh với giường phản gỗ sồi, tủ quần áo mộng âm dương.",
            ImageUrl = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80",
            Icon = "Bed",
            Space = "Phòng ngủ",
            DisplayOrder = 3,
            ProductCount = 28,
            FeaturedProduct = "Giường Phản Tatami, Tủ Đầu Giường Mộc",
            ShowOnHome = true,
            ShowOnMenu = true,
            Status = "active",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        },
        new Category
        {
            Id = CatOfficeId,
            Code = "NH04",
            Name = "Phòng Làm Việc",
            Slug = "phong-lam-viec",
            Description = "Bàn làm việc đẳng cấp từ gỗ óc chó Bắc Mỹ với khay đi dây điện âm thẩm mỹ cao.",
            ImageUrl = "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80",
            Icon = "Briefcase",
            Space = "Làm việc",
            DisplayOrder = 4,
            ProductCount = 19,
            FeaturedProduct = "Bàn Giám Đốc Executive Walnut, Kệ Sách Zen",
            ShowOnHome = true,
            ShowOnMenu = true,
            Status = "active",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        },
        new Category
        {
            Id = CatDecorId,
            Code = "NH05",
            Name = "Tủ, Kệ & Hệ Vách",
            Slug = "tu-ke-he-vach",
            Description = "Hệ tủ kệ trang trí kết hợp cánh kính Eurolux và mây mắt cáo đan thủ công.",
            ImageUrl = "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80",
            Icon = "Lamp",
            Space = "Lưu trữ",
            DisplayOrder = 5,
            ProductCount = 31,
            FeaturedProduct = "Tủ Rượu Cánh Kính Khói, Kệ TV Mây Đan",
            ShowOnHome = true,
            ShowOnMenu = true,
            Status = "active",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        },
        new Category
        {
            Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
            Code = "NH06",
            Name = "Đèn Sàn & Phụ Kiện Trang Trí",
            Slug = "den-san-phu-kien",
            Description = "Ánh sáng ấm áp từ đèn gỗ giấy Washi và những khối đôn gỗ nu tự nhiên độc bản.",
            ImageUrl = "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80",
            Icon = "Sparkles",
            Space = "Trang trí",
            DisplayOrder = 6,
            ProductCount = 24,
            FeaturedProduct = "Đèn Sàn Andon Washi, Đôn Gỗ Nu Nghệ Thuật",
            ShowOnHome = false,
            ShowOnMenu = true,
            Status = "active",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        },
        new Category
        {
            Id = Guid.Parse("77777777-7777-7777-7777-777777777777"),
            Code = "NH07",
            Name = "Dự Án May Đo Độc Bản",
            Slug = "du-an-may-do",
            Description = "Dịch vụ thiết kế và chế tác riêng theo bản vẽ kiến trúc sư cho biệt thự & penthouse.",
            ImageUrl = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
            Icon = "Crown",
            Space = "May đo",
            DisplayOrder = 7,
            ProductCount = 15,
            FeaturedProduct = "Nội thất Penthouse Serenity, Biệt thự Thảo Điền",
            ShowOnHome = true,
            ShowOnMenu = true,
            Status = "active",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        }
    ];

    public static List<Product> GetProducts() =>
    [
        new Product
        {
            Id = Guid.Parse("a0000001-0000-0000-0000-000000000001"),
            Name = "Sofa Băng Japandi Mây Tự Nhiên Ashwood",
            Slug = "sofa-bang-japandi-may-tu-nhien-ashwood",
            Sku = "SF-JPN-01",
            CategoryId = CatLivingRoomId,
            Space = "LivingRoom",
            Price = 18500000m,
            OriginalPrice = 22000000m,
            DiscountPercent = 15,
            Status = ProductStatus.Active,
            MainImageUrl = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
            Images = [
                "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80"
            ],
            Dimensions = "D2100 x R850 x C780 mm",
            Material = "Gỗ Tần Bì (Ashwood) kết hợp đan mây mắt cáo thủ công, đệm mút cao cấp bọc vải nỉ thô",
            WoodType = "Gỗ Tần Bì tự nhiên Bắc Mỹ",
            Rating = 5.0m,
            ReviewCount = 24,
            IsFeatured = true,
            IsNew = true,
            InStock = 15,
            ShortDescription = "Sự giao thoa hoàn hảo giữa nghệ thuật đan mây truyền thống và khung gỗ sồi Bắc Âu.",
            Description = "Sofa Japandi Ashwood mang đến cảm giác thư thái tuyệt đối với đệm bọc vải organic thoáng khí, kết hợp mây đan tỉ mỉ tạo điểm nhấn ấm áp cho mọi không gian sống đương đại."
        },
        new Product
        {
            Id = Guid.Parse("a0000002-0000-0000-0000-000000000002"),
            Name = "Bàn Trà Noguchi Gỗ Sồi Tự Nhiên Mặt Kính Lượn",
            Slug = "ban-tra-noguchi-go-soi-mat-kinh",
            Sku = "CT-NGU-02",
            CategoryId = CatLivingRoomId,
            Space = "LivingRoom",
            Price = 7200000m,
            OriginalPrice = 8500000m,
            DiscountPercent = 15,
            Status = ProductStatus.Active,
            MainImageUrl = "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800&auto=format&fit=crop&q=80",
            Images = ["https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800&auto=format&fit=crop&q=80"],
            Dimensions = "D1280 x R930 x C400 mm",
            Material = "Chân gỗ Sồi tự nhiên, mặt kính cường lực 15mm uốn cong nghệ thuật",
            WoodType = "Gỗ Sồi Trắng (White Oak)",
            Rating = 4.9m,
            ReviewCount = 18,
            IsFeatured = true,
            IsNew = false,
            InStock = 20,
            ShortDescription = "Kiệt tác bàn trà uốn lượn điêu khắc biểu tượng cho triết lý Wabi-Sabi.",
            Description = "Thiết kế bàn trà độc đáo với 2 khối gỗ uốn nâng đỡ phiến kính cường lực dày 15mm, tạo chiều sâu thị giác rộng mở cho phòng khách."
        },
        new Product
        {
            Id = Guid.Parse("a0000003-0000-0000-0000-000000000003"),
            Name = "Bàn Ăn Gỗ Óc Chó Nguyên Tấm Walnut Slab",
            Slug = "ban-an-go-oc-cho-nguyen-tam-walnut-slab",
            Sku = "DT-WLN-03",
            CategoryId = CatDiningRoomId,
            Space = "DiningRoom",
            Price = 32000000m,
            OriginalPrice = 36000000m,
            DiscountPercent = 11,
            Status = ProductStatus.Active,
            MainImageUrl = "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&auto=format&fit=crop&q=80",
            Images = ["https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&auto=format&fit=crop&q=80"],
            Dimensions = "D2000 x R900 x C750 mm",
            Material = "Gỗ Óc Chó (Walnut) Bắc Mỹ sấy FAS nhập khẩu, phủ dầu lau thực vật tự nhiên",
            WoodType = "Gỗ Óc Chó Bắc Mỹ",
            Rating = 5.0m,
            ReviewCount = 31,
            IsFeatured = true,
            IsNew = true,
            InStock = 8,
            ShortDescription = "Vân gỗ trầm ấm đẳng cấp tạo điểm nhấn sum vầy cho phòng ăn sang trọng.",
            Description = "Mỗi mặt bàn là một tuyệt tác độc bản từ thân cây gỗ óc chó già tuổi, giữ trọn vẹn đường nét vân lượn tự nhiên nguyên bản."
        },
        new Product
        {
            Id = Guid.Parse("a0000004-0000-0000-0000-000000000004"),
            Name = "Ghế Ăn Wishbone Y-Chair Hans Wegner Dây Cói",
            Slug = "ghe-an-wishbone-y-chair-hans-wegner",
            Sku = "DC-WSB-04",
            CategoryId = CatDiningRoomId,
            Space = "DiningRoom",
            Price = 2850000m,
            OriginalPrice = 3400000m,
            DiscountPercent = 16,
            Status = ProductStatus.Active,
            MainImageUrl = "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&auto=format&fit=crop&q=80",
            Images = ["https://images.unsplash.com/photo-1503602642458-232111445657?w=800&auto=format&fit=crop&q=80"],
            Dimensions = "D550 x R510 x C750 mm (Mặt ngồi 450mm)",
            Material = "Khung gỗ Tần bì đan cói tự nhiên Đan Mạch thủ công 100m dây",
            WoodType = "Gỗ Tần Bì",
            Rating = 4.8m,
            ReviewCount = 42,
            IsFeatured = true,
            IsNew = false,
            InStock = 40,
            ShortDescription = "Thiết kế kinh điển Đan Mạch với lưng tựa chữ Y uốn nhiệt mềm mại.",
            Description = "Dòng ghế ăn huyền thoại mang cảm giác ngồi êm ái thoáng nhẹ, đan thủ công từ sợi cói tự nhiên siêu bền."
        },
        new Product
        {
            Id = Guid.Parse("a0000005-0000-0000-0000-000000000005"),
            Name = "Giường Ngủ Tatami Zen Tối Giản Gỗ Sồi",
            Slug = "giuong-ngu-tatami-zen-toi-gian",
            Sku = "BD-TTM-05",
            CategoryId = CatBedroomId,
            Space = "Bedroom",
            Price = 24500000m,
            OriginalPrice = 28000000m,
            DiscountPercent = 12,
            Status = ProductStatus.Active,
            MainImageUrl = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80",
            Images = ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80"],
            Dimensions = "D2000 x R1800 x C300 mm",
            Material = "Gỗ Sồi Trắng khối đặc kết hợp chiếu cói Tatami Nhật Bản",
            WoodType = "Gỗ Sồi Trắng",
            Rating = 5.0m,
            ReviewCount = 15,
            IsFeatured = true,
            IsNew = true,
            InStock = 10,
            ShortDescription = "Trải nghiệm giấc ngủ tĩnh tại hòa quyện hương thơm gỗ sồi và chiếu cỏ igusa.",
            Description = "Khung giường dáng bệt vững chãi, khớp mộng truyền thống không dùng đinh kim loại, nâng đỡ cơ thể tối ưu."
        }
    ];

    public static User GetAdminUser() => new()
    {
        Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
        FullName = "Komorebi Admin",
        Email = "admin@komorebi.vn",
        PhoneNumber = "0909123456",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123456"),
        Role = "Admin",
        AvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
        IsActive = true,
        CreatedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow
    };

    public static StoreSetting GetStoreSetting() => new()
    {
        Id = Guid.Parse("88888888-8888-8888-8888-888888888888"),
        StoreName = "KOMOREBI WOOD & LIVING",
        Hotline = "1900 6868",
        Email = "contact@komorebi.vn",
        Address = "284 Nguyễn Tri Phương, Phường 4, Quận 10, TP. Hồ Chí Minh",
        LogoUrl = "/logo.svg",
        HeroBannerUrl = "/hero-interior.jpg",
        BankName = "MB Bank",
        BankAccountName = "CONG TY TNHH NOI THAT KOMOREBI",
        BankAccountNumber = "999988886666",
        VietQrCodeUrl = "",
        SocialLinksJson = "{\"facebook\":\"https://facebook.com/komorebi\",\"instagram\":\"https://instagram.com/komorebi\",\"tiktok\":\"https://tiktok.com/@komorebi\"}",
        UpdatedAt = DateTimeOffset.UtcNow
    };

    public static List<Branch> GetBranches() =>
    [
        new Branch
        {
            Id = Guid.Parse("b1111111-1111-1111-1111-111111111111"),
            Code = "SR-TD01",
            Name = "Showroom Flagship Thảo Điền",
            Type = "showroom",
            TypeLabel = "Showroom Trưng Bày & Bán Lẻ",
            Address = "Số 48 Quốc Hương, Phường Thảo Điền, TP. Thủ Đức, TP.HCM",
            Region = "TP.HCM - Đông",
            ManagerName = "Trần Đăng Khoa",
            ManagerPhone = "0988 765 432",
            ManagerEmail = "khoa.td@d2luxury.vn",
            Area = 950m,
            StaffCount = 18,
            WarehouseCount = 1,
            ActiveOrdersCount = 12,
            EstablishedDate = "20/11/2021",
            Status = "active",
            IsHeadquarter = true,
            Description = "Không gian trưng bày nội thất cao cấp trải nghiệm thực tế cho biệt thự & penthouse.",
            CreatedAt = DateTime.UtcNow
        },
        new Branch
        {
            Id = Guid.Parse("b2222222-2222-2222-2222-222222222222"),
            Code = "SR-Q10",
            Name = "Showroom Trung Tâm Ba Tháng Hai",
            Type = "showroom",
            TypeLabel = "Showroom Trưng Bày",
            Address = "Số 285 Đường Ba Tháng Hai, Phường 10, Quận 10, TP.HCM",
            Region = "TP.HCM - Trung tâm",
            ManagerName = "Phạm Thị Mỹ Linh",
            ManagerPhone = "0934 556 778",
            ManagerEmail = "linh.ptm@d2luxury.vn",
            Area = 600m,
            StaffCount = 12,
            WarehouseCount = 1,
            ActiveOrdersCount = 8,
            EstablishedDate = "01/08/2023",
            Status = "active",
            IsHeadquarter = false,
            Description = "Showroom bán lẻ trung tâm tiếp đón khách cá nhân và đối tác thiết kế.",
            CreatedAt = DateTime.UtcNow
        },
        new Branch
        {
            Id = Guid.Parse("b3333333-3333-3333-3333-333333333333"),
            Code = "KHO-BC01",
            Name = "Tổng Kho Phân Phối & Giao Vận Bình Chánh",
            Type = "hybrid",
            TypeLabel = "Tổng Kho Trung Chuyển & Giao Vận",
            Address = "Lô C3-C5, Đường số 6, KCN Lê Minh Xuân, Bình Chánh, TP.HCM",
            Region = "TP.HCM - Tây Nam",
            ManagerName = "Nguyễn Văn Nam",
            ManagerPhone = "0912 345 678",
            ManagerEmail = "nam.nv@d2luxury.vn",
            Area = 3200m,
            StaffCount = 26,
            WarehouseCount = 2,
            ActiveOrdersCount = 15,
            EstablishedDate = "15/03/2020",
            Status = "active",
            IsHeadquarter = false,
            Description = "Trung tâm lưu kho thành phẩm nguyên kiện, kiểm tra chất lượng và điều phối xe tải giao lắp.",
            CreatedAt = DateTime.UtcNow
        },
        new Branch
        {
            Id = Guid.Parse("b4444444-4444-4444-4444-444444444444"),
            Code = "SR-ECO",
            Name = "Showroom Trải Nghiệm Ecopark Hà Nội",
            Type = "showroom",
            TypeLabel = "Showroom Trưng Bày",
            Address = "Khu Đô Thị Ecopark Grand, Huyện Văn Giang, Hưng Yên",
            Region = "Hà Nội & Miền Bắc",
            ManagerName = "Vũ Hoàng Minh",
            ManagerPhone = "0919 223 344",
            ManagerEmail = "minh.vh@d2luxury.vn",
            Area = 720m,
            StaffCount = 14,
            WarehouseCount = 1,
            ActiveOrdersCount = 9,
            EstablishedDate = "10/05/2024",
            Status = "active",
            IsHeadquarter = false,
            Description = "Chi nhánh phục vụ thị trường biệt thự sinh thái & chung cư cao cấp miền Bắc.",
            CreatedAt = DateTime.UtcNow
        }
    ];

    public static List<Warehouse> GetWarehouses() =>
    [
        new Warehouse
        {
            Id = Guid.Parse("c1111111-1111-1111-1111-111111111111"),
            Code = "SR-TD01",
            Name = "Showroom Flagship Thảo Điền",
            Type = "finished",
            TypeLabel = "Showroom Trưng Bày & Bán Lẻ",
            Branch = "Showroom Thảo Điền - TP. Thủ Đức",
            Province = "TP. Hồ Chí Minh",
            District = "TP. Thủ Đức",
            StreetAddress = "48 Quốc Hương, P. Thảo Điền",
            Address = "48 Quốc Hương, Phường Thảo Điền, TP. Thủ Đức, TP.HCM",
            ManagerName = "Trần Đăng Khoa",
            ManagerPhone = "0988 765 432",
            CapacityMax = 120m,
            CapacityCurrent = 45m,
            CapacityUnit = "sản phẩm",
            OccupancyPercent = 38m,
            HumidityControl = "Điều hòa 24/7",
            Status = "active",
            IsDefault = true,
            Description = "Không gian trải nghiệm nội thất Japandi & Scandinavian cao cấp dành cho biệt thự.",
            TotalValue = 1850000000m,
            CreatedAt = DateTime.UtcNow
        },
        new Warehouse
        {
            Id = Guid.Parse("c2222222-2222-2222-2222-222222222222"),
            Code = "SR-Q10",
            Name = "Showroom Trung Tâm Quận 10",
            Type = "finished",
            TypeLabel = "Showroom Trưng Bày & Bán Lẻ",
            Branch = "Showroom Ba Tháng Hai - Quận 10",
            Province = "TP. Hồ Chí Minh",
            District = "Quận 10",
            StreetAddress = "285 Đường Ba Tháng Hai, Phường 10",
            Address = "285 Đường Ba Tháng Hai, Phường 10, Quận 10, TP.HCM",
            ManagerName = "Phạm Thị Mỹ Linh",
            ManagerPhone = "0934 556 778",
            CapacityMax = 80m,
            CapacityCurrent = 32m,
            CapacityUnit = "sản phẩm",
            OccupancyPercent = 40m,
            HumidityControl = "Điều hòa 24/7",
            Status = "active",
            IsDefault = false,
            Description = "Showroom đón tiếp khách hàng khu vực trung tâm và KTS đối tác.",
            TotalValue = 920000000m,
            CreatedAt = DateTime.UtcNow
        },
        new Warehouse
        {
            Id = Guid.Parse("c3333333-3333-3333-3333-333333333333"),
            Code = "KHO-BC01",
            Name = "Tổng Kho Phân Phối & Giao Vận Bình Chánh",
            Type = "transit",
            TypeLabel = "Tổng Kho Trung Chuyển & Giao Vận",
            Branch = "Tổng Kho Bình Chánh",
            Province = "TP. Hồ Chí Minh",
            District = "Bình Chánh",
            StreetAddress = "Lô C3-C5, KCN Lê Minh Xuân",
            Address = "Lô C3-C5, Đường số 6, KCN Lê Minh Xuân, Bình Chánh, TP.HCM",
            ManagerName = "Nguyễn Văn Nam",
            ManagerPhone = "0912 345 678",
            CapacityMax = 500m,
            CapacityCurrent = 148m,
            CapacityUnit = "sản phẩm",
            OccupancyPercent = 30m,
            HumidityControl = "Thông gió & Chống ẩm",
            Status = "active",
            IsDefault = false,
            Description = "Trung tâm đóng gói, lưu trữ hàng nguyên kiện và điều phối xe tải giao hàng.",
            TotalValue = 3450000000m,
            CreatedAt = DateTime.UtcNow
        },
        new Warehouse
        {
            Id = Guid.Parse("c4444444-4444-4444-4444-444444444444"),
            Code = "SR-ECO",
            Name = "Showroom Trải Nghiệm Ecopark Hà Nội",
            Type = "finished",
            TypeLabel = "Showroom Trưng Bày",
            Branch = "Showroom Ecopark - Hà Nội",
            Province = "Hưng Yên",
            District = "Huyện Văn Giang",
            StreetAddress = "Khu Đô Thị Ecopark Grand",
            Address = "Khu Đô Thị Ecopark, Huyện Văn Giang, Hưng Yên",
            ManagerName = "Vũ Hoàng Minh",
            ManagerPhone = "0919 223 344",
            CapacityMax = 90m,
            CapacityCurrent = 28m,
            CapacityUnit = "sản phẩm",
            OccupancyPercent = 31m,
            HumidityControl = "Điều hòa 24/7",
            Status = "active",
            IsDefault = false,
            Description = "Cơ sở phục vụ khách hàng khu vực Hà Nội và các tỉnh lân cận.",
            TotalValue = 1200000000m,
            CreatedAt = DateTime.UtcNow
        }
    ];

    public static List<UnitOfMeasure> GetUnitOfMeasures() =>
    [
        new UnitOfMeasure { Id = Guid.Parse("11111111-1111-1111-1111-111111110001"), Code = "BO", Name = "Bộ", Description = "Đơn vị tính bộ (Sofa phòng khách, Bộ bàn ghế ăn, Giường ngủ)", IsDefault = true, Status = "active" },
        new UnitOfMeasure { Id = Guid.Parse("11111111-1111-1111-1111-111111110002"), Code = "CHIEC", Name = "Chiếc", Description = "Đơn vị tính chiếc lẻ (Ghế đơn, Kệ tivi, Tủ console, Đèn decor)", IsDefault = false, Status = "active" },
        new UnitOfMeasure { Id = Guid.Parse("11111111-1111-1111-1111-111111110003"), Code = "CAI", Name = "Cái", Description = "Đơn vị tính cái (Phụ kiện ray trượt Blum, Tay nắm đồng, Bản lề)", IsDefault = false, Status = "active" },
        new UnitOfMeasure { Id = Guid.Parse("11111111-1111-1111-1111-111111110004"), Code = "M3", Name = "m³ (Khối)", Description = "Đo thể tích gỗ xẻ sấy nguyên khối (Gỗ Óc chó FAS, Sồi trắng, Tần bì)", IsDefault = false, Status = "active" },
        new UnitOfMeasure { Id = Guid.Parse("11111111-1111-1111-1111-111111110005"), Code = "M2", Name = "m² (Mét vuông)", Description = "Đo diện tích vật tư (Da bò Ý Nappa, Mặt đá Marble, Vách ốp tiêu âm)", IsDefault = false, Status = "active" },
        new UnitOfMeasure { Id = Guid.Parse("11111111-1111-1111-1111-111111110006"), Code = "MD", Name = "md (Mét dài)", Description = "Đo chiều dài (Len chân tường, Phào chỉ gỗ óc chó, Nẹp chỉ đồng, Ray nhôm)", IsDefault = false, Status = "active" },
        new UnitOfMeasure { Id = Guid.Parse("11111111-1111-1111-1111-111111110007"), Code = "KG", Name = "kg (Kilogram)", Description = "Đo khối lượng kim khí đúc, ốc vít, keo dán ghép mộng Titebond", IsDefault = false, Status = "active" },
        new UnitOfMeasure { Id = Guid.Parse("11111111-1111-1111-1111-111111110008"), Code = "HOP", Name = "Hộp / Lon", Description = "Quy cách đóng gói dầu lau hữu cơ Osmo Đức, sáp bóng cao cấp", IsDefault = false, Status = "active" },
        new UnitOfMeasure { Id = Guid.Parse("11111111-1111-1111-1111-111111110009"), Code = "SET", Name = "Set / Combo", Description = "Gói combo đồ trang trí và nội thất may đo theo không gian", IsDefault = false, Status = "active" }
    ];

    public static List<Employee> GetEmployees() =>
    [
        new Employee
        {
            Id = Guid.Parse("e1111111-1111-1111-1111-111111110001"),
            Code = "NV01",
            Name = "Trần Minh Hoàng",
            Phone = "0912 345 678",
            IdNumber = "079094012345",
            Gender = "Nam",
            Birthday = "1988-05-15",
            Email = "hoang.tran@d2luxury.vn",
            Address = "284 Nguyễn Tri Phương, Quận 10, TP. Hồ Chí Minh",
            Department = "Ban Giám Đốc & Quản Trị",
            Title = "Giám đốc Điều hành (CEO)",
            Branch = "Showroom Quận 10 (HQ)",
            Login = "hoang.tran",
            Username = "hoang.tran",
            Role = "Admin",
            Status = "working",
            WorkingDate = "2020-01-01",
            Area = "TP. Hồ Chí Minh",
            Ward = "Phường 14",
            AddressDetail = "284 Nguyễn Tri Phương",
            Debt = 0,
            Note = "Sáng lập viên & Quản lý điều hành toàn chuỗi D2 LUXURY",
            Facebook = "https://facebook.com/hoangtran.d2",
            Zalo = "0912345678",
            SkillsJson = "[\"Quản trị điều hành\",\"KTS Master\",\"Đàm phán Hợp đồng\"]",
            CreatedAt = DateTime.UtcNow
        },
        new Employee
        {
            Id = Guid.Parse("e2222222-2222-2222-2222-222222220002"),
            Code = "NV02",
            Name = "Lê Hoàng Phúc",
            Phone = "0938 123 456",
            IdNumber = "079096023456",
            Gender = "Nam",
            Birthday = "1993-08-20",
            Email = "phuc.le@d2luxury.vn",
            Address = "15 Đường số 8, Phường An Phú, TP. Thủ Đức",
            Department = "Showroom Kinh Doanh",
            Title = "Quản lý Showroom / Sales Lead",
            Branch = "Showroom Quận 10 (HQ)",
            Login = "phuc.le",
            Username = "phuc.le",
            Role = "Sales",
            Status = "working",
            WorkingDate = "2021-03-15",
            Area = "TP. Hồ Chí Minh",
            Ward = "Phường An Phú",
            AddressDetail = "15 Đường số 8",
            Debt = 0,
            Note = "Phụ trách tư vấn gói nội thất biệt thự và chăm sóc VIP",
            Facebook = "https://facebook.com/phucle.luxury",
            Zalo = "0938123456",
            SkillsJson = "[\"Tư vấn Luxury\",\"Chốt Deal Biệt Thự\",\"VietQR & POS\"]",
            CreatedAt = DateTime.UtcNow
        },
        new Employee
        {
            Id = Guid.Parse("e3333333-3333-3333-3333-333333330003"),
            Code = "NV03",
            Name = "Nguyễn Văn Tuấn",
            Phone = "0909 678 910",
            IdNumber = "079085034567",
            Gender = "Nam",
            Birthday = "1985-11-12",
            Email = "tuan.nguyen@d2luxury.vn",
            Address = "Lô B2, KCN Tân Bình, Tây Thạnh, Tân Phú",
            Department = "Xưởng Sản Xuất Gỗ Mộc",
            Title = "Thợ Mộc Chính & KCS Trưởng",
            Branch = "Xưởng Sản Xuất Mộc Gia - Tân Bình",
            Login = "tuan.nguyen",
            Username = "tuan.nguyen",
            Role = "Staff",
            Status = "working",
            WorkingDate = "2019-06-01",
            Area = "TP. Hồ Chí Minh",
            Ward = "Phường Tây Thạnh",
            AddressDetail = "Lô B2 KCN Tân Bình",
            Debt = 0,
            Note = "Nghệ nhân mộc truyền thống hơn 15 năm kinh nghiệm mộng gỗ tự nhiên",
            Facebook = "",
            Zalo = "0909678910",
            SkillsJson = "[\"Gia công Mộng Gỗ\",\"KCS Chất lượng\",\"Sơn Osmo Lau Hữu Cơ\"]",
            CreatedAt = DateTime.UtcNow
        },
        new Employee
        {
            Id = Guid.Parse("e4444444-4444-4444-4444-444444440004"),
            Code = "NV04",
            Name = "Phạm Thu Hương",
            Phone = "0987 654 321",
            IdNumber = "079095045678",
            Gender = "Nữ",
            Birthday = "1995-02-28",
            Email = "huong.pham@d2luxury.vn",
            Address = "45 Lê Văn Sỹ, Phường 13, Quận 3, TP. HCM",
            Department = "Phòng Kế Toán & Tài Chính",
            Title = "Kế toán Dự án & Chi phí",
            Branch = "Showroom Quận 10 (HQ)",
            Login = "huong.pham",
            Username = "huong.pham",
            Role = "Staff",
            Status = "working",
            WorkingDate = "2022-02-10",
            Area = "TP. Hồ Chí Minh",
            Ward = "Phường 13",
            AddressDetail = "45 Lê Văn Sỹ",
            Debt = 0,
            Note = "Phụ trách theo dõi công nợ, xuất hóa đơn VAT và quản lý dòng tiền",
            Facebook = "",
            Zalo = "0987654321",
            SkillsJson = "[\"Kế toán Dự Án\",\"Quản lý Công nợ\",\"Hóa đơn Điện tử\"]",
            CreatedAt = DateTime.UtcNow
        },
        new Employee
        {
            Id = Guid.Parse("e5555555-5555-5555-5555-555555550005"),
            Code = "NV05",
            Name = "Hoàng Thảo My",
            Phone = "0977 889 900",
            IdNumber = "079097056789",
            Gender = "Nữ",
            Birthday = "1997-09-05",
            Email = "my.hoang@d2luxury.vn",
            Address = "88 Nguyễn Thị Thập, Tân Phú, Quận 7, TP. HCM",
            Department = "Phòng Tư Vấn & Thiết Kế 3D",
            Title = "Kiến trúc sư Nội thất 3D",
            Branch = "Showroom Quận 10 (HQ)",
            Login = "my.hoang",
            Username = "my.hoang",
            Role = "Staff",
            Status = "working",
            WorkingDate = "2022-08-01",
            Area = "TP. Hồ Chí Minh",
            Ward = "Phường Tân Phú",
            AddressDetail = "88 Nguyễn Thị Thập",
            Debt = 0,
            Note = "Chuyên thiết kế phối cảnh không gian Japandi và may đo theo yêu cầu",
            Facebook = "",
            Zalo = "0977889900",
            SkillsJson = "[\"3Ds Max & Corona\",\"Phong cách Japandi\",\"Phối màu & Vật liệu\"]",
            CreatedAt = DateTime.UtcNow
        }
    ];

    public static List<Role> GetRoles()
    {
        var allPerms = PermissionCatalog.GetAllPermissionKeys();

        return
        [
            new Role
            {
                Id = Guid.Parse("a1111111-1111-1111-1111-111111111111"),
                Code = "SUPER_ADMIN",
                Name = "Quản trị viên tối cao",
                Description = "Toàn quyền quản trị hệ thống, cấu hình RBAC và quản lý dữ liệu toàn diện.",
                IsSystem = true,
                Status = "active",
                Permissions = allPerms,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            }
        ];
    }
}
