namespace Warehouse.Api.Models;

public class WarehouseImage
{
    public int Id { get; set; }
    public int WarehouseListingId { get; set; }
    public WarehouseListing WarehouseListing { get; set; } = null!;
    public string Url { get; set; } = string.Empty;
    public ImageStatus Status { get; set; } = ImageStatus.Draft;
}