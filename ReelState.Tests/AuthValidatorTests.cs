using FluentValidation.TestHelper;
using ReelState.Server.Models.DTOs;
using ReelState.Server.Validators;

public class RegisterDtoValidatorTests
{
    private readonly RegisterDtoValidator _validator = new();

    private static RegisterDto Valid() => new()
    {
        Email = "user@example.com",
        Password = "Password1",
        FirstName = "Mouez",
        LastName = "Belkahla"
    };

    [Fact]
    public void Valid_request_passes()
    {
        var result = _validator.TestValidate(Valid());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    public void Invalid_email_fails(string email)
    {
        var dto = Valid();
        dto.Email = email;
        _validator.TestValidate(dto).ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Email_longer_than_256_fails()
    {
        var dto = Valid();
        dto.Email = new string('a', 251) + "@x.com";
        _validator.TestValidate(dto).ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Theory]
    [InlineData("")]
    [InlineData("Pass1")]
    [InlineData("password1")]
    [InlineData("PASSWORD1")]
    [InlineData("Passwordd")]
    public void Weak_password_fails(string password)
    {
        var dto = Valid();
        dto.Password = password;
        _validator.TestValidate(dto).ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void Password_without_symbol_is_allowed()
    {
        var dto = Valid();
        dto.Password = "Abcdefg1";
        _validator.TestValidate(dto).ShouldNotHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void Empty_names_fail()
    {
        var dto = Valid();
        dto.FirstName = "";
        dto.LastName = "";
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.FirstName);
        result.ShouldHaveValidationErrorFor(x => x.LastName);
    }

    [Fact]
    public void Name_longer_than_50_fails()
    {
        var dto = Valid();
        dto.FirstName = new string('a', 51);
        _validator.TestValidate(dto).ShouldHaveValidationErrorFor(x => x.FirstName);
    }
}

public class LoginDtoValidatorTests
{
    private readonly LoginDtoValidator _validator = new();

    [Fact]
    public void Valid_login_passes()
    {
        var dto = new LoginDto { Email = "user@example.com", Password = "anything" };
        _validator.TestValidate(dto).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Empty_email_and_password_fail()
    {
        var dto = new LoginDto { Email = "", Password = "" };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.Email);
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void Password_longer_than_128_fails()
    {
        var dto = new LoginDto { Email = "user@example.com", Password = new string('a', 129) };
        _validator.TestValidate(dto).ShouldHaveValidationErrorFor(x => x.Password);
    }
}

public class OtherValidatorTests
{
    [Fact]
    public void Google_token_is_required()
    {
        var v = new GoogleAuthDtoValidator();
        v.TestValidate(new GoogleAuthDto { IdToken = "" }).ShouldHaveValidationErrorFor(x => x.IdToken);
        v.TestValidate(new GoogleAuthDto { IdToken = "abc" }).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Token_request_needs_both_tokens()
    {
        var v = new TokenRequestDtoValidator();
        var result = v.TestValidate(new TokenRequestDto { Token = "", RefreshToken = "" });
        result.ShouldHaveValidationErrorFor(x => x.Token);
        result.ShouldHaveValidationErrorFor(x => x.RefreshToken);
    }

    [Fact]
    public void Comment_text_is_required_and_limited_to_1000()
    {
        var v = new CommentCreateDtoValidator();
        v.TestValidate(new CommentCreateDto { PropertyId = "p1", Text = "" })
            .ShouldHaveValidationErrorFor(x => x.Text);
        v.TestValidate(new CommentCreateDto { PropertyId = "p1", Text = new string('a', 1001) })
            .ShouldHaveValidationErrorFor(x => x.Text);
        v.TestValidate(new CommentCreateDto { PropertyId = "p1", Text = "Nice place" })
            .ShouldNotHaveAnyValidationErrors();
    }
}
