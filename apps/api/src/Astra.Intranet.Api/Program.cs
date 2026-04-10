using Microsoft.AspNetCore.Authentication;
using System.Data.Odbc;
using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Astra.Intranet.Api.Bilhetagem;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<OpenEdgeOptions>(
    builder.Configuration.GetSection(OpenEdgeOptions.SectionName));
builder.Services.Configure<AuthOptions>(
    builder.Configuration.GetSection(AuthOptions.SectionName));
builder.Services.Configure<BilhetagemOptions>(
    builder.Configuration.GetSection(BilhetagemOptions.SectionName));

var allowedOrigins = builder.Configuration
    .GetSection("Frontend:AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:3000", "http://localhost:8080"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "astra_intranet_auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.SlidingExpiration = true;
        options.LoginPath = "/login";
        options.Events = new CookieAuthenticationEvents
        {
            OnRedirectToLogin = context =>
            {
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                }

                context.Response.Redirect(context.RedirectUri);
                return Task.CompletedTask;
            },
            OnRedirectToAccessDenied = context =>
            {
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                }

                context.Response.Redirect(context.RedirectUri);
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddSingleton<IAuthService, ConfiguredAuthService>();
builder.Services.AddSingleton<MockBilhetagemDirectoryService>();
builder.Services.AddSingleton<OpenEdgeBilhetagemDirectoryService>();
builder.Services.AddSingleton<IBilhetagemDirectoryService, BilhetagemDirectoryService>();
builder.Services.AddSingleton<IBilhetagemCallsService, MockBilhetagemCallsService>();

var app = builder.Build();

app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();

var includedModules = new[]
{
    "ReqFunc",
    "Autorizacao",
    "HoraExtra",
    "FichaAcomp",
    "InstNormativa",
    "Atendimento",
    "Reativacao",
    "FAC",
    "DocWeb",
    "Bilhetagem"
};

app.MapGet("/healthz", () => Results.Ok(new
{
    status = "ok",
    service = "api",
    utc = DateTimeOffset.UtcNow
}));

app.MapGet("/api/bootstrap", () => Results.Ok(new
{
    app = "astra-intranet-modern",
    stack = new
    {
        web = "nextjs",
        api = ".net",
        worker = ".net"
    },
    auth = new
    {
        mode = "cookie",
        devUsers = true
    },
    includedModules
}));

app.MapPost("/api/auth/login", async (
    LoginRequest request,
    IAuthService authService,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    var authenticatedUser = await authService.AuthenticateAsync(request, cancellationToken);

    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, authenticatedUser.UserId),
        new(ClaimTypes.Name, authenticatedUser.DisplayName),
        new("username", authenticatedUser.Username)
    };

    claims.AddRange(authenticatedUser.Roles.Select(role => new Claim(ClaimTypes.Role, role)));
    claims.AddRange(authenticatedUser.Modules.Select(module => new Claim("module", module)));

    var principal = new ClaimsPrincipal(
        new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme));

    await httpContext.SignInAsync(
        CookieAuthenticationDefaults.AuthenticationScheme,
        principal);

    return Results.Ok(ToCurrentUserResponse(authenticatedUser));
})
.AllowAnonymous();

app.MapPost("/api/auth/logout", async (HttpContext httpContext) =>
{
    await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.Ok(new { status = "signed-out" });
});

app.MapGet("/api/auth/me", [Authorize] (ClaimsPrincipal user) =>
{
    return Results.Ok(ToCurrentUserResponseFromPrincipal(user));
});

app.MapGet("/api/modules", [Authorize] (ClaimsPrincipal user) =>
{
    var modules = user.FindAll("module").Select(claim => claim.Value).Order().ToArray();

    return Results.Ok(new
    {
        modules
    });
});

var bilhetagem = app.MapGroup("/api/bilhetagem").RequireAuthorization();

bilhetagem.MapGet("/bootstrap", (
    ClaimsPrincipal user,
    IBilhetagemDirectoryService directoryService,
    IBilhetagemCallsService callsService) =>
{
    if (!HasModuleAccess(user, "Bilhetagem"))
    {
        return Results.Forbid();
    }

    return Results.Ok(new
    {
        module = "Bilhetagem",
        status = "pilot",
        directorySource = directoryService.SourceName,
        callsSource = callsService.SourceName,
        screens = new[]
        {
            "bl_info.htm",
            "bl_busca_numero.htm",
            "bl_cad_descricao.htm",
            "bl_ligacoes.htm",
            "bl_ligacoes_res.htm",
            "bl_ligacoes_det.htm"
        },
        firstDeliverables = new[]
        {
            "Pesquisa por numero",
            "Pesquisa por descricao",
            "Cadastro de descricao",
            "Filtros da listagem principal",
            "Relatorio resumido",
            "Relatorio detalhado"
        }
    });
});

bilhetagem.MapGet("/phone-book/search", async (
    string mode,
    string query,
    ClaimsPrincipal user,
    IBilhetagemDirectoryService service,
    CancellationToken cancellationToken) =>
{
    if (!HasModuleAccess(user, "Bilhetagem"))
    {
        return Results.Forbid();
    }

    if (string.IsNullOrWhiteSpace(query))
    {
        return Results.BadRequest(new
        {
            error = "Query obrigatoria."
        });
    }

    if (!TryParseSearchMode(mode, out var parsedMode))
    {
        return Results.BadRequest(new
        {
            error = "Modo de busca invalido. Use 'number' ou 'description'."
        });
    }

    var result = await service.SearchAsync(parsedMode, query, cancellationToken);
    return Results.Ok(result);
});

bilhetagem.MapPost("/phone-book/entries", async (
    BilhetagemDirectoryUpsertRequest request,
    ClaimsPrincipal user,
    IBilhetagemDirectoryService service,
    CancellationToken cancellationToken) =>
{
    if (!HasModuleAccess(user, "Bilhetagem"))
    {
        return Results.Forbid();
    }

    var validationError = ValidateDirectoryRequest(request);

    if (validationError is not null)
    {
        return Results.BadRequest(new
        {
            error = validationError
        });
    }

    var result = await service.UpsertAsync(request, cancellationToken);

    return result.Status switch
    {
        BilhetagemDirectoryUpsertStatus.Created => Results.Created(
            $"/api/bilhetagem/phone-book/search?mode=number&query={Uri.EscapeDataString(result.Entry.Number)}",
            result),
        BilhetagemDirectoryUpsertStatus.Updated => Results.Ok(result),
        BilhetagemDirectoryUpsertStatus.Conflict => Results.Conflict(result),
        _ => Results.Ok(result)
    };
});

bilhetagem.MapPost("/calls/report", async (
    BilhetagemCallReportRequest request,
    ClaimsPrincipal user,
    IBilhetagemCallsService service,
    CancellationToken cancellationToken) =>
{
    if (!HasModuleAccess(user, "Bilhetagem"))
    {
        return Results.Forbid();
    }

    if (!TryBuildCallReportFilter(request, out var filter, out var validationError))
    {
        return Results.BadRequest(new
        {
            error = validationError
        });
    }

    var report = await service.GenerateReportAsync(filter!, cancellationToken);
    return Results.Ok(report);
});

app.MapGet("/api/health/database", async (
    IOptions<OpenEdgeOptions> options,
    CancellationToken cancellationToken) =>
{
    var connectionString = options.Value.BuildConnectionString();

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Ok(new
        {
            status = "not-configured",
            provider = "openedge-odbc"
        });
    }

    try
    {
        using var connection = new OdbcConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        return Results.Ok(new
        {
            status = "ok",
            provider = "openedge-odbc",
            dataSource = connection.DataSource,
            database = connection.Database
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(
            title: "OpenEdge connection failed",
            detail: ex.Message,
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

app.Run();

static bool HasModuleAccess(ClaimsPrincipal user, string module) =>
    user.FindAll("module").Any(claim =>
        string.Equals(claim.Value, module, StringComparison.OrdinalIgnoreCase));

static bool TryParseSearchMode(string mode, out BilhetagemSearchMode parsedMode)
{
    if (string.Equals(mode, "number", StringComparison.OrdinalIgnoreCase))
    {
        parsedMode = BilhetagemSearchMode.Number;
        return true;
    }

    if (string.Equals(mode, "description", StringComparison.OrdinalIgnoreCase))
    {
        parsedMode = BilhetagemSearchMode.Description;
        return true;
    }

    parsedMode = default;
    return false;
}

static string? ValidateDirectoryRequest(BilhetagemDirectoryUpsertRequest request)
{
    if (string.IsNullOrWhiteSpace(request.Telephone))
    {
        return "Telefone obrigatorio.";
    }

    if (string.IsNullOrWhiteSpace(request.Description))
    {
        return "Descricao obrigatoria.";
    }

    return null;
}

static bool TryBuildCallReportFilter(
    BilhetagemCallReportRequest request,
    out BilhetagemCallReportFilter? filter,
    out string? validationError)
{
    filter = null;
    validationError = null;

    if (!TryParseCallDirection(request.Direction, out var direction))
    {
        validationError = "Direcao invalida. Use 'received', 'performed' ou 'both'.";
        return false;
    }

    if (!TryParseCallScope(request.Scope, out var scope))
    {
        validationError = "Escopo invalido. Use 'internal', 'external' ou 'both'.";
        return false;
    }

    if (!TryParseCallTargetType(request.TargetType, out var targetType))
    {
        validationError = "Tipo de alvo invalido. Use 'extension' ou 'number'.";
        return false;
    }

    if (!TryParseCallView(request.View, out var view))
    {
        validationError = "Visualizacao invalida. Use 'summary' ou 'detailed'.";
        return false;
    }

    if (!DateOnly.TryParseExact(
            request.StartDate,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out var startDate))
    {
        validationError = "Data inicial invalida.";
        return false;
    }

    if (!DateOnly.TryParseExact(
            request.EndDate,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out var endDate))
    {
        validationError = "Data final invalida.";
        return false;
    }

    if (endDate < startDate)
    {
        validationError = "A data final deve ser maior ou igual a data inicial.";
        return false;
    }

    string? extensionStart = null;
    string? extensionEnd = null;
    string? number = null;

    if (targetType == BilhetagemCallTargetType.Extension)
    {
        extensionStart = NormalizeDigits(request.ExtensionStart);
        extensionEnd = NormalizeDigits(request.ExtensionEnd);

        if (string.IsNullOrWhiteSpace(extensionStart))
        {
            extensionStart = "0000";
        }

        if (string.IsNullOrWhiteSpace(extensionEnd))
        {
            extensionEnd = "9999";
        }

        if (!int.TryParse(extensionStart, out var numericStart) ||
            !int.TryParse(extensionEnd, out var numericEnd))
        {
            validationError = "Faixa de ramal invalida.";
            return false;
        }

        if (numericEnd < numericStart)
        {
            validationError = "O ramal final deve ser maior ou igual ao ramal inicial.";
            return false;
        }

        extensionStart = numericStart.ToString("0000");
        extensionEnd = numericEnd.ToString("0000");
    }
    else
    {
        number = NormalizeDigits(request.Number);

        if (string.IsNullOrWhiteSpace(number))
        {
            validationError = "Numero obrigatorio para pesquisa por numero.";
            return false;
        }
    }

    filter = new BilhetagemCallReportFilter(
        direction,
        scope,
        targetType,
        view,
        startDate,
        endDate,
        extensionStart,
        extensionEnd,
        number);

    return true;
}

static bool TryParseCallDirection(string value, out BilhetagemCallDirection direction)
{
    if (string.Equals(value, "received", StringComparison.OrdinalIgnoreCase))
    {
        direction = BilhetagemCallDirection.Received;
        return true;
    }

    if (string.Equals(value, "performed", StringComparison.OrdinalIgnoreCase))
    {
        direction = BilhetagemCallDirection.Performed;
        return true;
    }

    if (string.Equals(value, "both", StringComparison.OrdinalIgnoreCase))
    {
        direction = BilhetagemCallDirection.Both;
        return true;
    }

    direction = default;
    return false;
}

static bool TryParseCallScope(string value, out BilhetagemCallScope scope)
{
    if (string.Equals(value, "internal", StringComparison.OrdinalIgnoreCase))
    {
        scope = BilhetagemCallScope.Internal;
        return true;
    }

    if (string.Equals(value, "external", StringComparison.OrdinalIgnoreCase))
    {
        scope = BilhetagemCallScope.External;
        return true;
    }

    if (string.Equals(value, "both", StringComparison.OrdinalIgnoreCase))
    {
        scope = BilhetagemCallScope.Both;
        return true;
    }

    scope = default;
    return false;
}

static bool TryParseCallTargetType(string value, out BilhetagemCallTargetType targetType)
{
    if (string.Equals(value, "extension", StringComparison.OrdinalIgnoreCase))
    {
        targetType = BilhetagemCallTargetType.Extension;
        return true;
    }

    if (string.Equals(value, "number", StringComparison.OrdinalIgnoreCase))
    {
        targetType = BilhetagemCallTargetType.Number;
        return true;
    }

    targetType = default;
    return false;
}

static bool TryParseCallView(string value, out BilhetagemCallView view)
{
    if (string.Equals(value, "summary", StringComparison.OrdinalIgnoreCase))
    {
        view = BilhetagemCallView.Summary;
        return true;
    }

    if (string.Equals(value, "detailed", StringComparison.OrdinalIgnoreCase))
    {
        view = BilhetagemCallView.Detailed;
        return true;
    }

    view = default;
    return false;
}

static string? NormalizeDigits(string? value)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return null;
    }

    var digits = new string(value.Where(char.IsDigit).ToArray());
    return string.IsNullOrWhiteSpace(digits) ? null : digits;
}

static CurrentUserResponse ToCurrentUserResponse(AuthenticatedUser user) =>
    new(
        user.UserId,
        user.Username,
        user.DisplayName,
        user.Roles.ToArray(),
        user.Modules.Order().ToArray());

static CurrentUserResponse ToCurrentUserResponseFromPrincipal(ClaimsPrincipal user) =>
    new(
        user.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty,
        user.FindFirstValue("username") ?? string.Empty,
        user.FindFirstValue(ClaimTypes.Name) ?? string.Empty,
        user.FindAll(ClaimTypes.Role).Select(claim => claim.Value).Order().ToArray(),
        user.FindAll("module").Select(claim => claim.Value).Order().ToArray());

sealed record LoginRequest(string Username, string Password);

sealed record CurrentUserResponse(
    string UserId,
    string Username,
    string DisplayName,
    string[] Roles,
    string[] Modules);

sealed record AuthenticatedUser(
    string UserId,
    string Username,
    string DisplayName,
    IReadOnlyCollection<string> Roles,
    IReadOnlyCollection<string> Modules);

interface IAuthService
{
    Task<AuthenticatedUser?> AuthenticateAsync(LoginRequest request, CancellationToken cancellationToken);
}

sealed class ConfiguredAuthService(IOptions<AuthOptions> options) : IAuthService
{
    private readonly AuthOptions _options = options.Value;

    public Task<AuthenticatedUser?> AuthenticateAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Task.FromResult<AuthenticatedUser?>(null);
        }

        var user = _options.Users.FirstOrDefault(candidate =>
            string.Equals(candidate.Username, request.Username, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(candidate.Password, request.Password, StringComparison.Ordinal));

        if (user is null)
        {
            return Task.FromResult<AuthenticatedUser?>(null);
        }

        return Task.FromResult<AuthenticatedUser?>(
            new AuthenticatedUser(
                user.UserId,
                user.Username,
                user.DisplayName,
                user.Roles,
                user.Modules));
    }
}

sealed class AuthOptions
{
    public const string SectionName = "Auth";

    public List<AuthUserOption> Users { get; init; } =
    [
        new()
        {
            UserId = "dev-admin",
            Username = "admin",
            Password = "admin123",
            DisplayName = "Administrador de Migracao",
            Roles = ["Admin"],
            Modules =
            [
                "ReqFunc",
                "Autorizacao",
                "HoraExtra",
                "FichaAcomp",
                "InstNormativa",
                "Atendimento",
                "Reativacao",
                "FAC",
                "DocWeb",
                "Bilhetagem"
            ]
        },
        new()
        {
            UserId = "dev-bilhetagem",
            Username = "bilhetagem",
            Password = "bilhetagem123",
            DisplayName = "Operador Bilhetagem",
            Roles = ["Operador"],
            Modules = ["Bilhetagem", "DocWeb"]
        }
    ];
}

sealed class AuthUserOption
{
    public string UserId { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string[] Roles { get; init; } = [];
    public string[] Modules { get; init; } = [];
}

public sealed class OpenEdgeOptions
{
    public const string SectionName = "OpenEdge";

    public string? ConnectionString { get; set; }
    public string? Dsn { get; set; }
    public string? Host { get; set; }
    public int? Port { get; set; }
    public string? Database { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }

    public string? BuildConnectionString()
    {
        if (!string.IsNullOrWhiteSpace(ConnectionString))
        {
            return ConnectionString;
        }

        if (!string.IsNullOrWhiteSpace(Dsn))
        {
            return $"DSN={Dsn};UID={Username};PWD={Password};";
        }

        if (string.IsNullOrWhiteSpace(Host) || string.IsNullOrWhiteSpace(Database))
        {
            return null;
        }

        return $"HostName={Host};PortNumber={Port ?? 0};DatabaseName={Database};DefaultSchema=PUB;UID={Username};PWD={Password};";
    }
}
