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
            .Where(w => w.Status == ListingStatus.Pending
                        || w.Images.Any(i => i.Status == ImageStatus.Pending))
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
                ImageUrls = w.Images
                    .Where(i => i.Status == ImageStatus.Approved)
                    .Select(i => i.Url).ToList(),
                PendingImages = w.Images
                    .Where(i => i.Status == ImageStatus.Pending)
                    .Select(i => new ImageDto { Id = i.Id, Url = i.Url, Status = "Pending" }).ToList(),
                ListingNeedsReview = w.Status == ListingStatus.Pending,
                OwnerName = w.Owner.Name,
                OwnerEmail = w.Owner.Email
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("warehouses/{id:int}/approve")]
    public Task<IActionResult> Approve(int id) => Decide(id, approve: true);

    [HttpPost("warehouses/{id:int}/reject")]
    public Task<IActionResult> Reject(int id) => Decide(id, approve: false);

    [HttpPost("images/{imageId:int}/reject")]
    public async Task<IActionResult> RejectImage(int imageId)
    {
        var img = await _db.WarehouseImages.FirstOrDefaultAsync(i => i.Id == imageId);
        if (img is null) return NotFound();

        if (img.Status != ImageStatus.Pending)
            return Conflict(new { message = "This photo is not waiting for review." });

        img.Status = ImageStatus.Rejected;
        await _db.SaveChangesAsync();
        return NoContent();
    }

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

    private async Task<IActionResult> Decide(int id, bool approve)
    {
        var w = await _db.WarehouseListings
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (w is null) return NotFound();

        var pendingImages = w.Images.Where(i => i.Status == ImageStatus.Pending).ToList();

        if (w.Status != ListingStatus.Pending && pendingImages.Count == 0)
            return Conflict(new { message = "There is nothing to review for this warehouse." });

        // The decision covers every photo waiting for review.
        foreach (var img in pendingImages)
            img.Status = approve ? ImageStatus.Approved : ImageStatus.Rejected;

        // The listing itself changes only if the listing was waiting for review.
        if (w.Status == ListingStatus.Pending)
            w.Status = approve ? ListingStatus.Approved : ListingStatus.Rejected;

        await _db.SaveChangesAsync();
        return Ok(new { id = w.Id, status = w.Status.ToString() });
    }
}