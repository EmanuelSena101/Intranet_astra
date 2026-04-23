using Microsoft.AspNetCore.Authentication;
using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Astra.Intranet.Api.Bilhetagem;
using Astra.Intranet.Api.DocWeb;
using Astra.Intranet.Api.Health;
using Astra.Intranet.Api.Shared.OpenEdge;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<OpenEdgeOptions>(
    builder.Configuration.GetSection(OpenEdgeOptions.SectionName));
builder.Services.Configure<DatabaseHealthCheckOptions>(
    builder.Configuration.GetSection(DatabaseHealthCheckOptions.SectionName));
builder.Services.Configure<AuthOptions>(
    builder.Configuration.GetSection(AuthOptions.SectionName));
builder.Services.Configure<BilhetagemOptions>(
    builder.Configuration.GetSection(BilhetagemOptions.SectionName));
builder.Services.Configure<DocWebOptions>(
    builder.Configuration.GetSection(DocWebOptions.SectionName));

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<IOpenEdgeConnectionFactory, OpenEdgeConnectionFactory>();
builder.Services.AddSingleton<DatabaseHealthCheck>();

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
builder.Services.AddSingleton<OpenEdgeBilhetagemDiagnosticsService>();
builder.Services.AddSingleton<IBilhetagemDirectoryService, BilhetagemDirectoryService>();
builder.Services.AddSingleton<MockBilhetagemCallsService>();
builder.Services.AddSingleton<OpenEdgeBilhetagemCallsService>();
builder.Services.AddSingleton<IBilhetagemCallsService, BilhetagemCallsService>();
builder.Services.AddSingleton<MockDocWebDocumentService>();
builder.Services.AddSingleton<IDocWebDocumentService, MockDocWebDocumentService>();

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
    IOptions<BilhetagemOptions> options,
    IBilhetagemDirectoryService directoryService,
    IBilhetagemCallsService callsService,
    OpenEdgeBilhetagemDirectoryService openEdgeDirectoryService,
    OpenEdgeBilhetagemCallsService openEdgeCallsService) =>
{
    if (!HasModuleAccess(user, "Bilhetagem"))
    {
        return Results.Forbid();
    }

    if (!IsAdministrator(user))
    {
        return Results.Forbid();
    }

    var bilhetagemOptions = options.Value;

    return Results.Ok(new
    {
        module = "Bilhetagem",
        status = "available",
        directory = new
        {
            provider = bilhetagemOptions.Directory.Provider,
            source = directoryService.SourceName,
            openEdgeConfigured = openEdgeDirectoryService.IsConfigured,
            tableName = bilhetagemOptions.Directory.TableName
        },
        calls = new
        {
            provider = bilhetagemOptions.Calls.Provider,
            source = callsService.SourceName,
            openEdgeConfigured = openEdgeCallsService.IsConfigured,
            callsTableName = bilhetagemOptions.Calls.CallsTableName,
            directoryTableName = bilhetagemOptions.Calls.DirectoryTableName,
            usersTableName = bilhetagemOptions.Calls.UsersTableName
        }
    });
});

bilhetagem.MapGet("/diagnostics", async (
    ClaimsPrincipal user,
    OpenEdgeBilhetagemDiagnosticsService diagnosticsService,
    CancellationToken cancellationToken) =>
{
    if (!HasModuleAccess(user, "Bilhetagem"))
    {
        return Results.Forbid();
    }

    if (!IsAdministrator(user))
    {
        return Results.Forbid();
    }

    var diagnostics = await diagnosticsService.DiagnoseAsync(cancellationToken);
    return Results.Ok(diagnostics);
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

    try
    {
        var result = await service.SearchAsync(parsedMode, query, cancellationToken);
        return Results.Ok(result);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(
            title: "Diretorio telefonico indisponivel",
            detail: exception.Message,
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
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

    try
    {
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
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(
            title: "Diretorio telefonico indisponivel",
            detail: exception.Message,
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
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

    try
    {
        var report = await service.GenerateReportAsync(filter!, cancellationToken);
        return Results.Ok(report);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(
            title: "Relatorio de ligacoes indisponivel",
            detail: exception.Message,
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

var docWeb = app.MapGroup("/api/docweb").RequireAuthorization();

docWeb.MapGet("/bootstrap", (
    ClaimsPrincipal user,
    IOptions<DocWebOptions> options,
    IDocWebDocumentService service) =>
{
    if (!HasModuleAccess(user, "DocWeb"))
    {
        return Results.Forbid();
    }

    if (!IsAdministrator(user))
    {
        return Results.Forbid();
    }

    var snapshot = service.GetSnapshot();

    return Results.Ok(new
    {
        module = "DocWeb",
        status = "available",
        provider = options.Value.Provider,
        source = service.SourceName,
        totalDocuments = snapshot.TotalDocuments,
        publishedDocuments = snapshot.PublishedDocuments,
        cancelledDocuments = snapshot.CancelledDocuments
    });
});

docWeb.MapGet("/documents", async (
    string? query,
    string? status,
    string? visibility,
    ClaimsPrincipal user,
    IDocWebDocumentService service,
    CancellationToken cancellationToken) =>
{
    if (!HasModuleAccess(user, "DocWeb"))
    {
        return Results.Forbid();
    }

    if (!TryParseDocWebStatusFilter(status, out var parsedStatus))
    {
        return Results.BadRequest(new
        {
            error = "Status invalido. Use 'active', 'cancelled' ou 'all'."
        });
    }

    if (!TryParseDocWebVisibilityFilter(visibility, out var parsedVisibility))
    {
        return Results.BadRequest(new
        {
            error = "Filtro de publicacao invalido. Use 'all', 'published' ou 'internal'."
        });
    }

    var result = await service.SearchAsync(
        new DocWebDocumentSearchFilter(query, parsedStatus, parsedVisibility),
        cancellationToken);

    return Results.Ok(result);
});

docWeb.MapPost("/documents", async (
    DocWebDocumentUpsertRequest request,
    ClaimsPrincipal user,
    IDocWebDocumentService service,
    CancellationToken cancellationToken) =>
{
    if (!HasModuleAccess(user, "DocWeb"))
    {
        return Results.Forbid();
    }

    var validationError = ValidateDocWebDocumentRequest(request);

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
        DocWebDocumentUpsertStatus.Created => Results.Created(
            $"/api/docweb/documents?query={Uri.EscapeDataString(result.Document.DocumentNumber)}",
            result),
        _ => Results.Ok(result)
    };
});

app.MapGet("/api/health/database", async (
    DatabaseHealthCheck healthCheck,
    CancellationToken cancellationToken) =>
{
    var result = await healthCheck.CheckAsync(cancellationToken);

    return result.Status switch
    {
        "ok" => Results.Json(new
        {
            status = "ok",
            dataSource = result.DataSource,
            database = result.Database,
            elapsedMs = result.ElapsedMs,
            slow = result.Slow
        }, statusCode: StatusCodes.Status200OK),
        "mock" => Results.Json(new
        {
            status = "ok",
            dataSource = "mock",
            database = (string?)null,
            elapsedMs = 0,
            slow = false
        }, statusCode: StatusCodes.Status200OK),
        _ => Results.Json(new
        {
            status = "error",
            dataSource = result.DataSource,
            database = result.Database,
            elapsedMs = result.ElapsedMs,
            message = result.Message,
            code = result.Code
        }, statusCode: StatusCodes.Status503ServiceUnavailable)
    };
});

app.Run();

static bool HasModuleAccess(ClaimsPrincipal user, string module) =>
    user.FindAll("module").Any(claim =>
        string.Equals(claim.Value, module, StringComparison.OrdinalIgnoreCase));

static bool IsAdministrator(ClaimsPrincipal user) =>
    user.FindAll(ClaimTypes.Role).Any(claim =>
        string.Equals(claim.Value, "Admin", StringComparison.OrdinalIgnoreCase));

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

static bool TryParseDocWebStatusFilter(string? value, out DocWebDocumentStatusFilter status)
{
    if (string.IsNullOrWhiteSpace(value) || string.Equals(value, "active", StringComparison.OrdinalIgnoreCase))
    {
        status = DocWebDocumentStatusFilter.Active;
        return true;
    }

    if (string.Equals(value, "cancelled", StringComparison.OrdinalIgnoreCase))
    {
        status = DocWebDocumentStatusFilter.Cancelled;
        return true;
    }

    if (string.Equals(value, "all", StringComparison.OrdinalIgnoreCase))
    {
        status = DocWebDocumentStatusFilter.All;
        return true;
    }

    status = default;
    return false;
}

static bool TryParseDocWebVisibilityFilter(string? value, out DocWebDocumentVisibilityFilter visibility)
{
    if (string.IsNullOrWhiteSpace(value) || string.Equals(value, "all", StringComparison.OrdinalIgnoreCase))
    {
        visibility = DocWebDocumentVisibilityFilter.All;
        return true;
    }

    if (string.Equals(value, "published", StringComparison.OrdinalIgnoreCase))
    {
        visibility = DocWebDocumentVisibilityFilter.Published;
        return true;
    }

    if (string.Equals(value, "internal", StringComparison.OrdinalIgnoreCase))
    {
        visibility = DocWebDocumentVisibilityFilter.Internal;
        return true;
    }

    visibility = default;
    return false;
}

static string? ValidateDocWebDocumentRequest(DocWebDocumentUpsertRequest request)
{
    if (string.IsNullOrWhiteSpace(request.DocumentNumber))
    {
        return "Numero do documento obrigatorio.";
    }

    if (string.IsNullOrWhiteSpace(request.SectorCode))
    {
        return "Setor obrigatorio.";
    }

    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return "Titulo obrigatorio.";
    }

    if (string.IsNullOrWhiteSpace(request.FileName))
    {
        return "Arquivo obrigatorio.";
    }

    if (request.FileSizeKilobytes < 0)
    {
        return "Tamanho do arquivo invalido.";
    }

    if (!string.IsNullOrWhiteSpace(request.ExpirationDate) &&
        !DateOnly.TryParseExact(
            request.ExpirationDate,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out _))
    {
        return "Data de expiracao invalida.";
    }

    if ((request.RepresentativeCodes ?? []).Any(code => code <= 0))
    {
        return "Representantes invalidos.";
    }

    return null;
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

// Expõe a classe Program gerada implicitamente pelos top-level statements para
// que WebApplicationFactory<Program> em testes de integração consiga carregá-la.
public partial class Program;
