using InteriorDesign.Application.Features.Orders;
using InteriorDesign.Integration.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteriorDesign.Api.Controllers;

[Route("api/orders")]
public sealed class OrdersController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var response = await Sender.Send(new GetOrdersQuery(page, pageSize, search, status), cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOrderById(Guid id, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new GetOrderByIdQuery(id), cancellationToken));

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new CreateOrderCommand(request), cancellationToken));

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new UpdateOrderStatusCommand(id, request), cancellationToken));

    [HttpPatch("{id:guid}/payment-status")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> UpdatePaymentStatus(Guid id, [FromBody] UpdatePaymentStatusRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new UpdatePaymentStatusCommand(id, request), cancellationToken));
}
