using System.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Warehouse.Api.Data;
using Warehouse.Api.Models;

namespace Warehouse.Api.Services;

public class BookingResult
{
    public Booking? Booking { get; init; }
    public int StatusCode { get; init; }
    public string? Error { get; init; }

    public static BookingResult Ok(Booking b) => new() { Booking = b, StatusCode = 201 };
    public static BookingResult Fail(int code, string message) => new() { StatusCode = code, Error = message };
}

public class BookingService
{
    public static readonly TimeSpan HoldDuration = TimeSpan.FromMinutes(15);

    private readonly AppDbContext _db;

    public BookingService(AppDbContext db) => _db = db;

    public async Task<BookingResult> CreateAsync(int renterId, int warehouseId, DateOnly start, DateOnly end)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (start < today)
            return BookingResult.Fail(400, "The start date can't be in the past.");

        if (end <= start)
            return BookingResult.Fail(400, "The end date must be after the start date.");

        var days = BookingRules.Days(start, end);
        if (days < BookingRules.MinDays)
            return BookingResult.Fail(400, $"The minimum booking is {BookingRules.MinDays} days.");
        if (days > BookingRules.MaxDays)
            return BookingResult.Fail(400, $"The maximum booking is {BookingRules.MaxDays} days.");

        try
        {
            await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            var warehouse = await _db.WarehouseListings
                .AsNoTracking()
                .FirstOrDefaultAsync(w => w.Id == warehouseId && w.Status == ListingStatus.Approved);

            if (warehouse is null)
                return BookingResult.Fail(404, "This warehouse was not found.");

            var now = DateTime.UtcNow;

            var hasBookingConflict = await _db.Bookings.AnyAsync(b =>
                b.WarehouseListingId == warehouseId
                && (b.Status == BookingStatus.Confirmed
                    || b.Status == BookingStatus.Pending
                    || (b.Status == BookingStatus.PendingPayment && b.HoldExpiresAt > now))
                && b.StartDate < end
                && b.EndDate > start);

            if (hasBookingConflict)
                return BookingResult.Fail(409, "These dates are no longer available.");

            // Blocked dates are inclusive on both ends.
            var isBlocked = await _db.BlockedDates.AnyAsync(d =>
                d.WarehouseListingId == warehouseId
                && d.StartDate < end
                && d.EndDate >= start);

            if (isBlocked)
                return BookingResult.Fail(409, "The owner has blocked some of these dates.");

            var booking = new Booking
            {
                WarehouseListingId = warehouseId,
                RenterId = renterId,
                StartDate = start,
                EndDate = end,
                TotalAmount = BookingRules.CalculateTotal(warehouse.PricePerMonth, days),
                Status = BookingStatus.PendingPayment,
                HoldExpiresAt = now.Add(HoldDuration)
            };

            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return BookingResult.Ok(booking);
        }
        catch (Exception ex) when (IsSerializationFailure(ex))
        {
            return BookingResult.Fail(409, "Someone else just booked these dates. Please try again.");
        }
    }

    // PostgreSQL error 40001 = the transaction lost a race with another one.
    private static bool IsSerializationFailure(Exception ex) =>
        (ex is PostgresException pg && pg.SqlState == "40001")
        || (ex.InnerException is PostgresException inner && inner.SqlState == "40001");
}