namespace Warehouse.Api.Models;

public class WarehouseListing
{
    public int Id { get; set; }
    public int OwnerId { get; set; }
    public User Owner { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public int SizeSqFt { get; set; }
    public decimal PricePerMonth { get; set; }
    public WarehouseType Type { get; set; } = WarehouseType.Dry;
    public string? Amenities { get; set; }   // comma-separated for now
    public ListingStatus Status { get; set; } = ListingStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<WarehouseImage> Images { get; set; } = new();
    public List<BlockedDate> BlockedDates { get; set; } = new();
    public List<Booking> Bookings { get; set; } = new();
    public List<Review> Reviews { get; set; } = new();
}