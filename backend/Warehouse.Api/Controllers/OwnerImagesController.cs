using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.Api.Data;
using Warehouse.Api.Dtos;
using Warehouse.Api.Models;
using Warehouse.Api.Services;

namespace Warehouse.Api.Controllers;

[ApiController]
[Route("owner/warehouses/{warehouseId:int}/images")]
[Authorize(Roles = "Owner")]
public class OwnerImagesController : ControllerBase
{
    private const int MaxImages = 8;

    private readonly AppDbContext _db;
    private readonly ImageStorageService _storage;

    public OwnerImagesController(AppDbContext db, ImageStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<ImageDto>> Upload(int warehouseId, IFormFile file)
    {
        var owns = await _db.WarehouseListings
            .AnyAsync(w => w.Id == warehouseId && w.OwnerId == CurrentUserId);
        if (!owns) return NotFound();

        var count = await _db.WarehouseImages.CountAsync(i => i.WarehouseListingId == warehouseId);
        if (count >= MaxImages)
            return Conflict(new { message = $"A warehouse can have at most {MaxImages} photos." });

        var saved = await _storage.SaveAsync(file);
        if (!saved.Success)
            return BadRequest(new { message = saved.Error });

        var image = new WarehouseImage
        {
            WarehouseListingId = warehouseId,
            Url = saved.Url!,
            Status = ImageStatus.Draft
        };
        _db.WarehouseImages.Add(image);
        await _db.SaveChangesAsync();

        return Ok(new ImageDto { Id = image.Id, Url = image.Url, Status = image.Status.ToString() });
    }

    [HttpDelete("{imageId:int}")]
    public async Task<IActionResult> Delete(int warehouseId, int imageId)
    {
        var image = await _db.WarehouseImages
            .Include(i => i.WarehouseListing)
            .FirstOrDefaultAsync(i => i.Id == imageId
                && i.WarehouseListingId == warehouseId
                && i.WarehouseListing.OwnerId == CurrentUserId);

        if (image is null) return NotFound();

        _db.WarehouseImages.Remove(image);
        await _db.SaveChangesAsync();
        _storage.Delete(image.Url);

        return NoContent();
    }
}