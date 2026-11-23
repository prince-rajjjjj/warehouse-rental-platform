using System.ComponentModel.DataAnnotations;

namespace Warehouse.Api.Dtos;

public class CreateBookingRequest
{
    [Range(1, int.MaxValue)]
    public int WarehouseId { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }
}

public class BookingDto
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseTitle { get; set; } = string.Empty;
    public string WarehouseCity { get; set; } = string.Empty;
    public string? RenterName { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int Days { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? HoldExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UnavailableRange
{
    public DateOnly Start { get; set; }
    public DateOnly End { get; set; }   // exclusive
}