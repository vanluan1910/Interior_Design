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

    public static List<Category> GetCategories() =>
    [
        new Category
        {
            Id = CatLivingRoomId,
            Name = "Phòng Khách",
            Slug = "living-room",
            Description = "Không gian phòng khách phong cách Japandi mộc mạc và sang trọng",
            Icon = "Armchair",
            Space = "LivingRoom",
            DisplayOrder = 1,
            IsActive = true
        },
        new Category
        {
            Id = CatDiningRoomId,
            Name = "Phòng Bếp & Ăn",
            Slug = "dining-room",
            Description = "Bàn ghế ăn gỗ tự nhiên và phụ kiện phòng ăn cao cấp",
            Icon = "Utensils",
            Space = "DiningRoom",
            DisplayOrder = 2,
            IsActive = true
        },
        new Category
        {
            Id = CatBedroomId,
            Name = "Phòng Ngủ",
            Slug = "bedroom",
            Description = "Giường ngủ, tủ đầu giường phong cách tối giản thanh lịch",
            Icon = "Bed",
            Space = "Bedroom",
            DisplayOrder = 3,
            IsActive = true
        },
        new Category
        {
            Id = CatOfficeId,
            Name = "Phòng Làm Việc",
            Slug = "study-office",
            Description = "Bàn làm việc, ghế đọc sách công thái học tinh tế",
            Icon = "Briefcase",
            Space = "Office",
            DisplayOrder = 4,
            IsActive = true
        },
        new Category
        {
            Id = CatDecorId,
            Name = "Đèn & Trang Trí",
            Slug = "decor-lighting",
            Description = "Đèn giấy Washi, gốm thủ công nghệ thuật",
            Icon = "Lamp",
            Space = "Decor",
            DisplayOrder = 5,
            IsActive = true
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
}
