using System.ComponentModel.DataAnnotations;

namespace Warehouse.Api.Dtos;

public class CreateOrderRequest
{
    [Range(1, int.MaxValue)]
    public int BookingId { get; set; }
}

public class OrderDto
{
    public int BookingId { get; set; }
    public string OrderId { get; set; } = string.Empty;
    public long AmountInPaise { get; set; }
    public string Currency { get; set; } = "INR";
    public string KeyId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class VerifyPaymentRequest
{
    [Range(1, int.MaxValue)]
    public int BookingId { get; set; }

    [Required] public string RazorpayOrderId { get; set; } = string.Empty;
    [Required] public string RazorpayPaymentId { get; set; } = string.Empty;
    [Required] public string RazorpaySignature { get; set; } = string.Empty;
}