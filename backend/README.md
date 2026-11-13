# Vision Backend - .NET Core API

## Database Configuration

### Hosted MSSQL Database
- **Provider**: Site4Now.net
- **Server**: sql8005.site4now.net
- **Database**: db_a4843b_projectmanagement

### Configuration Files

#### Development Environment
The database credentials are configured in `appsettings.Development.json` which is **NOT committed to git** for security.

**Connection String Format:**
```
Server=sql8005.site4now.net,1433;Database=db_a4843b_projectmanagement;User Id=db_a4843b_projectmanagement_admin;Password=***;TrustServerCertificate=True;MultipleActiveResultSets=True
```

#### Environment Variables (Recommended for Production)
You can also use environment variables:

```bash
DB_SERVER=sql8005.site4now.net
DB_NAME=db_a4843b_projectmanagement
DB_USER=db_a4843b_projectmanagement_admin
DB_PASSWORD=your-password-here
```

### Security Best Practices

1. **Local Development**: 
   - Credentials are in `appsettings.Development.json`
   - This file is git-ignored and never committed
   
2. **Production Deployment**:
   - Use environment variables or Azure Key Vault
   - Never hardcode credentials in appsettings.json (production)
   - Use connection string encryption

3. **User Secrets (Alternative for Development)**:
   ```bash
   cd Vision.API
   dotnet user-secrets init
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=..."
   dotnet user-secrets set "Jwt:Secret" "your-jwt-secret"
   ```

## JWT Configuration

### Secret Key
- **Development**: Set in `appsettings.Development.json`
- **Production**: Use environment variable `JWT_SECRET`
- **Minimum Length**: 256 bits (32 characters) for HS256 algorithm

### Token Expiration
- **Access Token**: 15 minutes
- **Refresh Token**: 7 days

## CORS Configuration

Allowed origins are configured in `appsettings.json`:
- Development: `http://localhost:5173` (Vite dev server)
- Production: Add your production frontend URL

## Running the Application

### Prerequisites
- .NET 8.0 SDK
- SQL Server access (hosted at Site4Now)

### First Run
1. Restore packages:
   ```bash
   dotnet restore
   ```

2. Apply database migrations:
   ```bash
   dotnet ef database update --project Vision.Data --startup-project Vision.API
   ```

3. Run the API:
   ```bash
   cd Vision.API
   dotnet run
   ```

4. Access Swagger UI:
   - https://localhost:5001/swagger
   - http://localhost:5000/swagger

### Development
```bash
cd Vision.API
dotnet watch run
```

## Project Structure

```
backend/
├── Vision.API/          # ASP.NET Core Web API
│   ├── Controllers/     # API endpoints
│   ├── Models/          # API models
│   ├── Middleware/      # Custom middleware
│   └── appsettings.*.json
├── Vision.Business/     # Business Logic Layer
│   ├── Services/        # Business services
│   ├── DTOs/            # Data transfer objects
│   ├── Validators/      # FluentValidation rules
│   └── Exceptions/      # Custom exceptions
├── Vision.Data/         # Data Access Layer
│   ├── Entities/        # EF Core entities
│   ├── Repositories/    # Repository pattern
│   └── Migrations/      # EF Core migrations
└── Vision.Tests/        # Unit & Integration tests
```

## Database Connection Testing

Test the connection:
```bash
cd Vision.API
dotnet ef dbcontext info --project ../Vision.Data
```

## Troubleshooting

### Connection Issues
1. Verify server name: `sql8005.site4now.net`
2. Check firewall allows port 1433
3. Ensure credentials are correct
4. Enable `TrustServerCertificate=True` for SSL issues

### Migration Issues
```bash
# View pending migrations
dotnet ef migrations list --project Vision.Data --startup-project Vision.API

# Remove last migration
dotnet ef migrations remove --project Vision.Data --startup-project Vision.API

# Apply specific migration
dotnet ef database update <MigrationName> --project Vision.Data --startup-project Vision.API
```

## Security Notes

⚠️ **IMPORTANT**: 
- The `.env` and `appsettings.Development.json` files contain sensitive credentials
- These files are git-ignored and should NEVER be committed
- For production, use Azure Key Vault, AWS Secrets Manager, or environment variables
- Rotate database password regularly
- Use strong JWT secrets (minimum 256 bits)

## Support

For database access issues, contact Site4Now support:
- Portal: https://www.site4now.net
- Database: db_a4843b_projectmanagement
