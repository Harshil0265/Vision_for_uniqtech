using Vision.Data.Entities;

namespace Vision.Repository;

public interface IAuthRepo
{
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> GetUserByIdAsync(int id);
    Task<List<User>> GetAllUsersAsync();
    Task<User> CreateUserAsync(User user);
    Task<bool> UserExistsAsync(string email);
}
