namespace Warehouse.Api.Models;

public class BlockedDate
{
    public int Id { get; set; }
    public int WarehouseListingId { get; set; }
    public WarehouseListing WarehouseListing { get; set; } = null!;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
}