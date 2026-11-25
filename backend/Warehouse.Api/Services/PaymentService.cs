using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Warehouse.Api.Data;
using Warehouse.Api.Dtos;
using Warehouse.Api.Models;

namespace Warehouse.Api.Services;

public class PaymentResult<T>
{
    public T? Data { get; init; }
    public int StatusCode { get; init; }
    public string? Error { get; init; }
    public bool Success => Error is null;

    public static PaymentResult<T> Ok(T data) => new() { Data = data, StatusCode = 200 };
    public static PaymentResult<T> Fail(int code, string message) => new() { StatusCode = code, Error = message };
}

public class PaymentService
{
    private readonly AppDbContext _db;
    private readonly HttpClient _http;
    private readonly ILogger<PaymentService> _logger;
    private readonly string _keyId;
    private readonly string _keySecret;

    public PaymentService(AppDbContext db, HttpClient http, IConfiguration config, ILogger<PaymentService> logger)
    {
        _db = db;
        _http = http;
        _logger = logger;
        _keyId = config["Razorpay:KeyId"] ?? "";
        _keySecret = config["Razorpay:KeySecret"] ?? "";
    }

    public async Task<PaymentResult<OrderDto>> CreateOrderAsync(int renterId, int bookingId)
    {
        if (_keyId == "" || _keySecret == "")
            return PaymentResult<OrderDto>.Fail(500, "Payments are not configured.");

        var booking = await _db.Bookings
            .Include(b => b.WarehouseListing)
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.RenterId == renterId);

        if (booking is null)
            return PaymentResult<OrderDto>.Fail(404, "Booking not found.");

        if (booking.Status != BookingStatus.PendingPayment)
            return PaymentResult<OrderDto>.Fail(409, "This booking is not waiting for payment.");

        if (booking.HoldExpiresAt is null || booking.HoldExpiresAt <= DateTime.UtcNow)
            return PaymentResult<OrderDto>.Fail(409, "The hold on these dates has expired. Please book again.");

        var amountInPaise = (long)Math.Round(booking.TotalAmount * 100m, MidpointRounding.AwayFromZero);

        // Reuse an unpaid order if one exists, so repeated clicks don't create many orders.
        var payment = await _db.Payments
            .FirstOrDefaultAsync(p => p.BookingId == booking.Id && p.Status == PaymentStatus.Created);

        if (payment is null)
        {
            var orderId = await CreateRazorpayOrderAsync(amountInPaise, $"booking_{booking.Id}");
            if (orderId is null)
                return PaymentResult<OrderDto>.Fail(502, "Could not start the payment. Please try again.");

            payment = new Payment
            {
                BookingId = booking.Id,
                RazorpayOrderId = orderId,
                Amount = booking.TotalAmount,
                Status = PaymentStatus.Created
            };
            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();
        }

        return PaymentResult<OrderDto>.Ok(new OrderDto
        {
            BookingId = booking.Id,
            OrderId = payment.RazorpayOrderId,
            AmountInPaise = amountInPaise,
            Currency = "INR",
            KeyId = _keyId,
            Description = booking.WarehouseListing.Title
        });
    }

    public async Task<PaymentResult<string>> VerifyAsync(int renterId, VerifyPaymentRequest req)
    {
        var booking = await _db.Bookings
            .FirstOrDefaultAsync(b => b.Id == req.BookingId && b.RenterId == renterId);

        if (booking is null)
            return PaymentResult<string>.Fail(404, "Booking not found.");

        if (booking.Status == BookingStatus.Confirmed)
            return PaymentResult<string>.Ok("Confirmed");   // already done, safe to repeat

        // The order id must be one WE created for this booking.
        var payment = await _db.Payments
            .FirstOrDefaultAsync(p => p.BookingId == booking.Id && p.RazorpayOrderId == req.RazorpayOrderId);

        if (payment is null)
            return PaymentResult<string>.Fail(400, "Unknown payment order.");

        var expected = ComputeSignature(payment.RazorpayOrderId, req.RazorpayPaymentId);
        if (!SignaturesMatch(expected, req.RazorpaySignature))
            return PaymentResult<string>.Fail(400, "Payment verification failed.");

        // From here on the money really was paid.
        payment.RazorpayPaymentId = req.RazorpayPaymentId;
        payment.Status = PaymentStatus.Paid;

        if (booking.Status != BookingStatus.PendingPayment)
        {
            await _db.SaveChangesAsync();
            return PaymentResult<string>.Fail(409,
                "Payment received, but this booking is no longer active. Please contact support for a refund.");
        }

        var now = DateTime.UtcNow;
        if (booking.HoldExpiresAt is null || booking.HoldExpiresAt <= now)
        {
            // The hold ran out while the renter was paying. Confirm only if nobody else took the dates.
            var taken = await _db.Bookings.AnyAsync(b =>
                b.Id != booking.Id
                && b.WarehouseListingId == booking.WarehouseListingId
                && (b.Status == BookingStatus.Confirmed
                    || b.Status == BookingStatus.Pending
                    || (b.Status == BookingStatus.PendingPayment && b.HoldExpiresAt > now))
                && b.StartDate < booking.EndDate
                && b.EndDate > booking.StartDate);

            if (taken)
            {
                booking.Status = BookingStatus.Cancelled;
                booking.HoldExpiresAt = null;
                await _db.SaveChangesAsync();
                return PaymentResult<string>.Fail(409,
                    "Your payment was received, but these dates were taken in the meantime. Please contact support for a refund.");
            }
        }

        booking.Status = BookingStatus.Confirmed;
        booking.HoldExpiresAt = null;
        await _db.SaveChangesAsync();
        return PaymentResult<string>.Ok("Confirmed");
    }

    private async Task<string?> CreateRazorpayOrderAsync(long amountInPaise, string receipt)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.razorpay.com/v1/orders");

        var basic = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_keyId}:{_keySecret}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", basic);
        request.Content = JsonContent.Create(new { amount = amountInPaise, currency = "INR", receipt });

        using var response = await _http.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Razorpay order creation failed: {Status} {Body}", (int)response.StatusCode, body);
            return null;
        }

        using var doc = JsonDocument.Parse(body);
        return doc.RootElement.GetProperty("id").GetString();
    }

    // Razorpay's rule: HMAC-SHA256 of "orderId|paymentId", using the secret key.
    private string ComputeSignature(string orderId, string paymentId)
    {
        var key = Encoding.UTF8.GetBytes(_keySecret);
        var data = Encoding.UTF8.GetBytes($"{orderId}|{paymentId}");
        return Convert.ToHexString(HMACSHA256.HashData(key, data)).ToLowerInvariant();
    }

    private static bool SignaturesMatch(string expected, string actual)
    {
        var a = Encoding.UTF8.GetBytes(expected);
        var b = Encoding.UTF8.GetBytes(actual.ToLowerInvariant());
        return a.Length == b.Length && CryptographicOperations.FixedTimeEquals(a, b);
    }
}