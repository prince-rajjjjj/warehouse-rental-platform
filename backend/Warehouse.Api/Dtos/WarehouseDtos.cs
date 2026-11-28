using System.ComponentModel.DataAnnotations;
using Warehouse.Api.Models;

namespace Warehouse.Api.Dtos;

public class WarehouseRequest
{
    [Required, StringLength(200, MinimumLength = 5)]
    public string Title { get; set; } = string.Empty;

    [Required, StringLength(4000, MinimumLength = 20)]
    public string Description { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string City { get; set; } = string.Empty;

    [Required, StringLength(500)]
    public string Address { get; set; } = string.Empty;

    [Range(-90, 90)]
    public double? Latitude { get; set; }

    [Range(-180, 180)]
    public double? Longitude { get; set; }

    [Range(1, 10_000_000)]
    public int SizeSqFt { get; set; }

    [Range(typeof(decimal), "1", "100000000")]
    public decimal PricePerMonth { get; set; }

    public WarehouseType Type { get; set; } = WarehouseType.Dry;

    [StringLength(1000)]
    public string? Amenities { get; set; }
}

public class WarehouseDto
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
    public ListingStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public List<ImageDto> Images { get; set; } = new();
}

public class ImageDto
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}