using System.ComponentModel.DataAnnotations;
using Warehouse.Api.Models;

namespace Warehouse.Api.Dtos;

public class WarehouseSearchQuery
{
    [StringLength(100)]
    public string? City { get; set; }

    [Range(0, 10_000_000)]
    public int? MinSize { get; set; }

    [Range(0, 10_000_000)]
    public int? MaxSize { get; set; }

    [Range(typeof(decimal), "0", "100000000")]
    public decimal? MinPrice { get; set; }

    [Range(typeof(decimal), "0", "100000000")]
    public decimal? MaxPrice { get; set; }

    public WarehouseType? Type { get; set; }

    // newest (default), priceAsc, priceDesc, sizeDesc
    public string? Sort { get; set; }

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 50)]
    public int PageSize { get; set; } = 12;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public class PublicWarehouseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public int SizeSqFt { get; set; }
    public decimal PricePerMonth { get; set; }
    public WarehouseType Type { get; set; }
    public string? Amenities { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public double? AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public List<string> ImageUrls { get; set; } = new();
}