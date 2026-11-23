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
[Route("bookings")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly BookingService _bookings;

    public BookingsController(AppDbContext db, BookingService bookings)
    {
        _db = db;
        _bookings = bookings;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    [Authorize(Roles = "Renter")]
    public async Task<ActionResult<BookingDto>> Create(CreateBookingRequest req)
    {
        var result = await _bookings.CreateAsync(CurrentUserId, req.WarehouseId, req.StartDate, req.EndDate);

        if (result.Booking is null)
            return StatusCode(result.StatusCode, new { message = result.Error });

        var booking = await _db.Bookings
            .AsNoTracking()
            .Include(b => b.WarehouseListing)
            .Include(b => b.Renter)
            .FirstAsync(b => b.Id == result.Booking.Id);

        return CreatedAtAction(nameof(GetOne), new { id = booking.Id }, ToDto(booking));
    }

    [HttpGet("my")]
    [Authorize(Roles = "Renter")]
    public async Task<ActionResult<List<BookingDto>>> GetMine()
    {
        var items = await _db.Bookings
            .AsNoTracking()
            .Include(b => b.WarehouseListing)
            .Where(b => b.RenterId == CurrentUserId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return Ok(items.Select(ToDto).ToList());
    }

    [HttpGet("/owner/bookings")]
    [Authorize(Roles = "Owner")]
    public async Task<ActionResult<List<BookingDto>>> GetForOwner()
    {
        var items = await _db.Bookings
            .AsNoTracking()
            .Include(b => b.WarehouseListing)
            .Include(b => b.Renter)
            .Where(b => b.WarehouseListing.OwnerId == CurrentUserId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return Ok(items.Select(ToDto).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BookingDto>> GetOne(int id)
    {
        var b = await _db.Bookings
            .AsNoTracking()
            .Include(x => x.WarehouseListing)
            .Include(x => x.Renter)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (b is null) return NotFound();

        var allowed = b.RenterId == CurrentUserId
                      || b.WarehouseListing.OwnerId == CurrentUserId
                      || User.IsInRole("Admin");

        // Same answer as "doesn't exist", so ids can't be probed.
        return allowed ? Ok(ToDto(b)) : NotFound();
    }

    [HttpPost("{id:int}/cancel")]
    [Authorize(Roles = "Renter")]
    public async Task<IActionResult> Cancel(int id)
    {
        var b = await _db.Bookings.FirstOrDefaultAsync(x => x.Id == id && x.RenterId == CurrentUserId);
        if (b is null) return NotFound();

        if (b.Status != BookingStatus.PendingPayment)
            return Conflict(new { message = "Only bookings that are waiting for payment can be cancelled." });

        b.Status = BookingStatus.Cancelled;
        b.HoldExpiresAt = null;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static BookingDto ToDto(Booking b)
    {
        var expired = b.Status == BookingStatus.PendingPayment
                      && b.HoldExpiresAt is not null
                      && b.HoldExpiresAt <= DateTime.UtcNow;

        return new BookingDto
        {
            Id = b.Id,
            WarehouseId = b.WarehouseListingId,
            WarehouseTitle = b.WarehouseListing.Title,
            WarehouseCity = b.WarehouseListing.City,
            RenterName = b.Renter?.Name,
            StartDate = b.StartDate,
            EndDate = b.EndDate,
            Days = BookingRules.Days(b.StartDate, b.EndDate),
            TotalAmount = b.TotalAmount,
            Status = expired ? "Expired" : b.Status.ToString(),
            HoldExpiresAt = b.HoldExpiresAt,
            CreatedAt = b.CreatedAt
        };
    }
}