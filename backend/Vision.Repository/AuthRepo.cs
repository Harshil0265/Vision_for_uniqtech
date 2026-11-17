using Microsoft.EntityFrameworkCore;
using Vision.Data;
using Vision.Data.Entities;

namespace Vision.Repository;

public class AuthRepo : IAuthRepo
{
    private readonly VisionDbContext _context;

    public AuthRepo(VisionDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return await _context.Users
            .FirstOrDefaultAsync(u => u.GmailAddress != null && u.GmailAddress.ToLower() == normalized);
    }

    public async Task<User?> GetUserByIdAsync(int id)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.ID == id);
    }

    public async Task<List<User>> GetAllUsersAsync()
    {
        return await _context.Users
            .AsNoTracking()
            .OrderBy(u => u.ID)
            .ToListAsync();
    }

    public async Task<User> CreateUserAsync(User user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<bool> UserExistsAsync(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.GmailAddress != null && u.GmailAddress.ToLower() == normalized);
    }
}
