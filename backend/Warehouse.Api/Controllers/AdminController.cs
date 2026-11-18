using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.Api.Data;
using Warehouse.Api.Dtos;
using Warehouse.Api.Models;

namespace Warehouse.Api.Controllers;

[ApiController]
[Route("admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db) => _db = db;

    [HttpGet("warehouses/pending")]
    public async Task<ActionResult<List<AdminWarehouseDto>>> GetPending()
    {
        var items = await _db.WarehouseListings
            .AsNoTracking()
            .Where(w => w.Status == ListingStatus.Pending)
            .OrderBy(w => w.CreatedAt)
            .Select(w => new AdminWarehouseDto
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
                ImageUrls = w.Images.Select(i => i.Url).ToList(),
                OwnerName = w.Owner.Name,
                OwnerEmail = w.Owner.Email
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("warehouses/{id:int}/approve")]
    public Task<IActionResult> Approve(int id) => SetStatus(id, ListingStatus.Approved);

    [HttpPost("warehouses/{id:int}/reject")]
    public Task<IActionResult> Reject(int id) => SetStatus(id, ListingStatus.Rejected);

    [HttpGet("users")]
    public async Task<ActionResult<List<AdminUserDto>>> GetUsers()
    {
        var users = await _db.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role,
                IsBlocked = u.IsBlocked,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPut("users/{id:int}/block")]
    public async Task<IActionResult> Block(int id, BlockRequest req)
    {
        var currentId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == currentId)
            return BadRequest(new { message = "You can't block yourself." });

        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        if (user.Role == UserRole.Admin)
            return BadRequest(new { message = "Admin accounts can't be blocked." });

        user.IsBlocked = req.IsBlocked;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsDto>> Stats()
    {
        var stats = new AdminStatsDto
        {
            TotalUsers = await _db.Users.CountAsync(),
            Owners = await _db.Users.CountAsync(u => u.Role == UserRole.Owner),
            Renters = await _db.Users.CountAsync(u => u.Role == UserRole.Renter),
            PendingListings = await _db.WarehouseListings.CountAsync(w => w.Status == ListingStatus.Pending),
            ApprovedListings = await _db.WarehouseListings.CountAsync(w => w.Status == ListingStatus.Approved),
            RejectedListings = await _db.WarehouseListings.CountAsync(w => w.Status == ListingStatus.Rejected),
            TotalBookings = await _db.Bookings.CountAsync()
        };
        return Ok(stats);
    }

    private async Task<IActionResult> SetStatus(int id, ListingStatus status)
    {
        var w = await _db.WarehouseListings.FirstOrDefaultAsync(x => x.Id == id);
        if (w is null) return NotFound();

        w.Status = status;
        await _db.SaveChangesAsync();
        return Ok(new { id = w.Id, status = w.Status.ToString() });
    }
}