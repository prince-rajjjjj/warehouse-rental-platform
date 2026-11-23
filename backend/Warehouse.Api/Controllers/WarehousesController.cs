using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.Api.Data;
using Warehouse.Api.Dtos;
using Warehouse.Api.Models;

namespace Warehouse.Api.Controllers;

[ApiController]
[Route("warehouses")]
public class WarehousesController : ControllerBase
{
    private readonly AppDbContext _db;

    public WarehousesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<PagedResult<PublicWarehouseDto>>> Search(
        [FromQuery] WarehouseSearchQuery q)
    {
        var query = _db.WarehouseListings
            .AsNoTracking()
            .Where(w => w.Status == ListingStatus.Approved);

        if (!string.IsNullOrWhiteSpace(q.City))
        {
            var pattern = $"%{EscapeLike(q.City.Trim())}%";
            query = query.Where(w => EF.Functions.ILike(w.City, pattern));
        }

        if (q.MinSize.HasValue) query = query.Where(w => w.SizeSqFt >= q.MinSize.Value);
        if (q.MaxSize.HasValue) query = query.Where(w => w.SizeSqFt <= q.MaxSize.Value);
        if (q.MinPrice.HasValue) query = query.Where(w => w.PricePerMonth >= q.MinPrice.Value);
        if (q.MaxPrice.HasValue) query = query.Where(w => w.PricePerMonth <= q.MaxPrice.Value);
        if (q.Type.HasValue) query = query.Where(w => w.Type == q.Type.Value);

        query = q.Sort switch
        {
            "priceAsc" => query.OrderBy(w => w.PricePerMonth).ThenBy(w => w.Id),
            "priceDesc" => query.OrderByDescending(w => w.PricePerMonth).ThenBy(w => w.Id),
            "sizeDesc" => query.OrderByDescending(w => w.SizeSqFt).ThenBy(w => w.Id),
            _ => query.OrderByDescending(w => w.CreatedAt).ThenBy(w => w.Id)
        };

        var total = await query.CountAsync();

        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(w => new PublicWarehouseDto
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
                OwnerName = w.Owner.Name,
                AverageRating = w.Reviews.Average(r => (double?)r.Rating),
                ReviewCount = w.Reviews.Count,
                ImageUrls = w.Images.Select(i => i.Url).ToList()
            })
            .ToListAsync();

        return Ok(new PagedResult<PublicWarehouseDto>
        {
            Items = items,
            Page = q.Page,
            PageSize = q.PageSize,
            TotalCount = total
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PublicWarehouseDto>> GetOne(int id)
    {
        var dto = await _db.WarehouseListings
            .AsNoTracking()
            .Where(w => w.Id == id && w.Status == ListingStatus.Approved)
            .Select(w => new PublicWarehouseDto
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
                OwnerName = w.Owner.Name,
                AverageRating = w.Reviews.Average(r => (double?)r.Rating),
                ReviewCount = w.Reviews.Count,
                ImageUrls = w.Images.Select(i => i.Url).ToList()
            })
            .FirstOrDefaultAsync();

        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpGet("{id:int}/availability")]
    public async Task<ActionResult<List<UnavailableRange>>> Availability(int id)
    {
        var exists = await _db.WarehouseListings
            .AnyAsync(w => w.Id == id && w.Status == ListingStatus.Approved);
        if (!exists) return NotFound();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var now = DateTime.UtcNow;

        var booked = await _db.Bookings
            .AsNoTracking()
            .Where(b => b.WarehouseListingId == id
                && b.EndDate > today
                && (b.Status == BookingStatus.Confirmed
                    || b.Status == BookingStatus.Pending
                    || (b.Status == BookingStatus.PendingPayment && b.HoldExpiresAt > now)))
            .Select(b => new { b.StartDate, b.EndDate })
            .ToListAsync();

        var blocked = await _db.BlockedDates
            .AsNoTracking()
            .Where(d => d.WarehouseListingId == id && d.EndDate >= today)
            .Select(d => new { d.StartDate, d.EndDate })
            .ToListAsync();

        var ranges = booked
            .Select(b => new UnavailableRange { Start = b.StartDate, End = b.EndDate })
            .Concat(blocked.Select(d => new UnavailableRange { Start = d.StartDate, End = d.EndDate.AddDays(1) }))
            .OrderBy(r => r.Start)
            .ToList();

        return Ok(ranges);
    }

    // Stops "%" and "_" typed by a user from acting as wildcards.
    private static string EscapeLike(string s) =>
        s.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
}