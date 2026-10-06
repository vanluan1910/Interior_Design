using InteriorDesign.Application.Features.Categories;
using InteriorDesign.Integration.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteriorDesign.Api.Controllers;

[Route("api/categories")]
public sealed class CategoriesController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new GetCategoriesQuery(), cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCategoryById(Guid id, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new GetCategoryByIdQuery(id), cancellationToken));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new CreateCategoryCommand(request), cancellationToken));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateCategoryRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new UpdateCategoryCommand(id, request), cancellationToken));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCategory(Guid id, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new DeleteCategoryCommand(id), cancellationToken));
}
