namespace InteriorDesign.Integration.Responses;

public sealed record HomeResponseDto(
    HomeHeroDto Hero,
    List<HomeSpaceDto> LivingSpaces,
    List<HomeProductDto> FeaturedProducts,
    List<HomeCommitmentDto> Commitments,
    HomeCraftsmanshipDto Craftsmanship,
    List<HomeShowroomDto> Showrooms,
    HomeCompanyDto CompanyInfo,
    List<HomeTestimonialDto> Testimonials
);

public sealed record HomeHeroDto(
    string Tagline,
    string Title,
    string Subtitle,
    string PrimaryCtaText,
    string PrimaryCtaLink,
    string SecondaryCtaText,
    string SecondaryCtaLink,
    string BackgroundImageUrl,
    List<HomeStatDto> Stats
);

public sealed record HomeStatDto(
    string Label,
    string Value,
    string? Suffix
);

public sealed record HomeSpaceDto(
    string Key,
    string Name,
    string Tagline,
    string Description,
    string ImageUrl,
    string CountText,
    string CodeLabel,
    int ColSpan,
    string LinkUrl,
    Guid? Id = null
);

public sealed record HomeProductDto(
    Guid Id,
    string Name,
    string Slug,
    string Sku,
    string Category,
    string CategoryName,
    decimal Price,
    decimal? OriginalPrice,
    string Image,
    string WoodType,
    string Dimensions,
    string Tag,
    decimal Rating,
    int ReviewCount,
    bool InStock
);

public sealed record HomeCommitmentDto(
    string Icon,
    string Title,
    string Description
);

public sealed record HomeCraftsmanshipDto(
    string Badge,
    string Title,
    string Description,
    string ImageUrl,
    List<string> Highlights
);

public sealed record HomeShowroomDto(
    Guid Id,
    string Name,
    string Address,
    string Phone,
    string OpeningHours,
    string? ImageUrl,
    bool IsHeadquarter
);

public sealed record HomeCompanyDto(
    string BrandName,
    string Slogan,
    string Hotline,
    string Email,
    string Address,
    string LogoUrl,
    string Website
);

public sealed record HomeTestimonialDto(
    string CustomerName,
    string ProjectLocation,
    string Quote,
    int Rating,
    string? AvatarUrl
);

public sealed record SpaceDetailCategoryDto(
    Guid Id,
    string Code,
    string Name,
    string Slug,
    string? Image,
    int ProductCount
);

public sealed record SpaceDetailResponseDto(
    HomeSpaceDto Space,
    List<SpaceDetailCategoryDto> Categories,
    List<string> Materials,
    List<HomeProductDto> FeaturedProducts,
    List<HomeProductDto> Products,
    int TotalItems,
    int Page,
    int PageSize,
    int TotalPages
);

