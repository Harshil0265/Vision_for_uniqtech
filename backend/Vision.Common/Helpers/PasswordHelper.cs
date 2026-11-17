using System.Security.Cryptography;
using System.Text;

namespace Vision.Common.Helpers;

public static class PasswordHelper
{
    public static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    public static bool VerifyPassword(string inputPassword, string? storedPassword)
    {
        if (string.IsNullOrEmpty(storedPassword) || string.IsNullOrEmpty(inputPassword))
            return false;

        var inputHashed = HashPassword(inputPassword);
        if (string.Equals(inputHashed, storedPassword, StringComparison.Ordinal))
            return true;

        if (string.Equals(inputPassword, storedPassword, StringComparison.Ordinal))
            return true;

        return false;
    }
}
