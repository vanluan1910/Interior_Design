using InteriorDesign.Application.Features.Products;
using InteriorDesign.Integration.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteriorDesign.Api.Controllers;

[Route("api/products")]
public sealed class ProductsController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? space = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var response = await Sender.Send(new GetProductsQuery(page, pageSize, search, space, categoryId, status), cancellationToken);
        return Ok(response);
    }

    [HttpGet("featured")]
    public async Task<IActionResult> GetFeaturedProducts([FromQuery] int limit = 8, CancellationToken cancellationToken = default)
    {
        var response = await Sender.Send(new GetFeaturedProductsQuery(limit), cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProductById(Guid id, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new GetProductByIdQuery(id), cancellationToken));

    [HttpGet("slug/{slug}")]
    public async Task<IActionResult> GetProductBySlug(string slug, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new GetProductBySlugQuery(slug), cancellationToken));

    [HttpPost]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new CreateProductCommand(request), cancellationToken));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new UpdateProductCommand(id, request), cancellationToken));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteProduct(Guid id, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new DeleteProductCommand(id), cancellationToken));
}
