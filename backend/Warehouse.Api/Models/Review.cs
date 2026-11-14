namespace Warehouse.Api.Models;

public class Review
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public int WarehouseListingId { get; set; }
    public WarehouseListing WarehouseListing { get; set; } = null!;
    public int RenterId { get; set; }
    public User Renter { get; set; } = null!;

    public int Rating { get; set; }   // 1 to 5
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}