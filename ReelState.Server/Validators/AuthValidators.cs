using FluentValidation;
using ReelState.Server.Models.DTOs;

namespace ReelState.Server.Validators;

public class LoginDtoValidator : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MaximumLength(128);
    }
}

public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);

        // Mirrors the Identity options configured in Program.cs
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Z]").WithMessage("Password must contain an uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain a lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain a digit.");

        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(50);
    }
}

public class GoogleAuthDtoValidator : AbstractValidator<GoogleAuthDto>
{
    public GoogleAuthDtoValidator() => RuleFor(x => x.IdToken).NotEmpty();
}

public class TokenRequestDtoValidator : AbstractValidator<TokenRequestDto>
{
    public TokenRequestDtoValidator()
    {
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public class CommentCreateDtoValidator : AbstractValidator<CommentCreateDto>
{
    public CommentCreateDtoValidator()
    {
        RuleFor(x => x.PropertyId).NotEmpty();
        RuleFor(x => x.Text).NotEmpty().MaximumLength(1000);
    }
}
