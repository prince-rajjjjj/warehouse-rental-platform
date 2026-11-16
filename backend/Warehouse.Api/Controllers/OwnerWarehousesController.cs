using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.Api.Data;
using Warehouse.Api.Dtos;
using Warehouse.Api.Models;

namespace Warehouse.Api.Controllers;

[ApiController]
[Route("owner/warehouses")]
[Authorize(Roles = "Owner")]
public class OwnerWarehousesController : ControllerBase
{
    private readonly AppDbContext _db;

    public OwnerWarehousesController(AppDbContext db) => _db = db;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<WarehouseDto>>> GetMine()
    {
        var items = await _db.WarehouseListings
            .AsNoTracking()
            .Include(w => w.Images)
            .Where(w => w.OwnerId == CurrentUserId)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return Ok(items.Select(ToDto).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<WarehouseDto>> GetOne(int id)
    {
        var w = await _db.WarehouseListings
            .AsNoTracking()
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Id == id && x.OwnerId == CurrentUserId);

        return w is null ? NotFound() : Ok(ToDto(w));
    }

    [HttpPost]
    public async Task<ActionResult<WarehouseDto>> Create(WarehouseRequest req)
    {
        var w = new WarehouseListing
        {
            OwnerId = CurrentUserId,
            Status = ListingStatus.Pending
        };
        Apply(w, req);

        _db.WarehouseListings.Add(w);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOne), new { id = w.Id }, ToDto(w));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<WarehouseDto>> Update(int id, WarehouseRequest req)
    {
        var w = await _db.WarehouseListings
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Id == id && x.OwnerId == CurrentUserId);

        if (w is null) return NotFound();

        Apply(w, req);
        w.Status = ListingStatus.Pending;   // an edited listing is reviewed again

        await _db.SaveChangesAsync();
        return Ok(ToDto(w));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var w = await _db.WarehouseListings
            .FirstOrDefaultAsync(x => x.Id == id && x.OwnerId == CurrentUserId);

        if (w is null) return NotFound();

        if (await _db.Bookings.AnyAsync(b => b.WarehouseListingId == id))
            return Conflict(new { message = "This warehouse has bookings, so it can't be deleted." });

        _db.WarehouseListings.Remove(w);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static void Apply(WarehouseListing w, WarehouseRequest r)
    {
        w.Title = r.Title.Trim();
        w.Description = r.Description.Trim();
        w.City = r.City.Trim();
        w.Address = r.Address.Trim();
        w.Latitude = r.Latitude;
        w.Longitude = r.Longitude;
        w.SizeSqFt = r.SizeSqFt;
        w.PricePerMonth = r.PricePerMonth;
        w.Type = r.Type;
        w.Amenities = string.IsNullOrWhiteSpace(r.Amenities) ? null : r.Amenities.Trim();
    }

    private static WarehouseDto ToDto(WarehouseListing w) => new()
    {
        Id = w.Id,
        Title = w.Title,
        Description = w.Description,
        City = w.City,
        Address = w.Address,
        Latitude = w.Latitude,
        Longitude = w.Longitude,
        SizeSqFt = w.SizeSqFt,
        PricePerMonth = w.PricePerMonth,
        Type = w.Type,
        Amenities = w.Amenities,
        Status = w.Status,
        CreatedAt = w.CreatedAt,
        ImageUrls = w.Images.Select(i => i.Url).ToList()
    };
}