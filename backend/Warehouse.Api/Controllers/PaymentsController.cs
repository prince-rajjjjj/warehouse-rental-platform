using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Api.Dtos;
using Warehouse.Api.Services;

namespace Warehouse.Api.Controllers;

[ApiController]
[Route("payments")]
[Authorize(Roles = "Renter")]
public class PaymentsController : ControllerBase
{
    private readonly PaymentService _payments;

    public PaymentsController(PaymentService payments) => _payments = payments;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("create-order")]
    public async Task<ActionResult<OrderDto>> CreateOrder(CreateOrderRequest req)
    {
        var result = await _payments.CreateOrderAsync(CurrentUserId, req.BookingId);

        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.Error });

        return Ok(result.Data);
    }

    [HttpPost("verify")]
    public async Task<IActionResult> Verify(VerifyPaymentRequest req)
    {
        var result = await _payments.VerifyAsync(CurrentUserId, req);

        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.Error });

        return Ok(new { status = result.Data });
    }
}