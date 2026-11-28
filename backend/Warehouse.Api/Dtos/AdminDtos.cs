using Warehouse.Api.Models;

namespace Warehouse.Api.Dtos;

public class AdminWarehouseDto : WarehouseDto
{
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public bool ListingNeedsReview { get; set; }
    public List<ImageDto> PendingImages { get; set; } = new();
}

public class AdminUserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsBlocked { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BlockRequest
{
    public bool IsBlocked { get; set; }
}

public class AdminStatsDto
{
    public int TotalUsers { get; set; }
    public int Owners { get; set; }
    public int Renters { get; set; }
    public int PendingListings { get; set; }
    public int ApprovedListings { get; set; }
    public int RejectedListings { get; set; }
    public int TotalBookings { get; set; }
}