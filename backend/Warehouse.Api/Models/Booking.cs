namespace Warehouse.Api.Models;

public class Booking
{
    public int Id { get; set; }
    public int WarehouseListingId { get; set; }
    public WarehouseListing WarehouseListing { get; set; } = null!;
    public int RenterId { get; set; }
    public User Renter { get; set; } = null!;

    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal TotalAmount { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.PendingPayment;
    public DateTime? HoldExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Payment> Payments { get; set; } = new();
    public Review? Review { get; set; }
}