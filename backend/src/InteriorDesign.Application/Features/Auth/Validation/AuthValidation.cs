using FluentValidation;
using InteriorDesign.Integration.Requests;

namespace InteriorDesign.Application.Features.Auth.Validation;

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Vui lòng nhập Email hoặc Số điện thoại để đăng nhập.");
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Vui lòng nhập mật khẩu.")
            .MinimumLength(6).WithMessage("Mật khẩu tối thiểu 6 ký tự.");
    }
}

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Vui lòng nhập họ và tên.")
            .MaximumLength(150).WithMessage("Họ và tên không vượt quá 150 ký tự.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Địa chỉ email không đúng định dạng.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.Email) || !string.IsNullOrWhiteSpace(x.PhoneNumber))
            .WithMessage("Vui lòng cung cấp Email hoặc Số điện thoại để tạo tài khoản.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Vui lòng nhập mật khẩu.")
            .MinimumLength(6).WithMessage("Mật khẩu tối thiểu 6 ký tự.");
    }
}

