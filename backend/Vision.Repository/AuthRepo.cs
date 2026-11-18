#pragma warning disable CS1998, CS0168, CS8602

using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Vision.Data;
using Vision.Data.Entities;

namespace Vision.Repository;

public class AuthRepo : IAuthRepo
{
    private readonly string _connectionString;

    public AuthRepo(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        try
        {
            SqlParameter[] param = new SqlParameter[2];
            param[0] = new SqlParameter("@Action", "GET_BY_EMAIL");
            param[1] = new SqlParameter("@GmailAddress", email?.Trim());

            DataTable dt = DataAccess.GetDataTable("sp_ManageUsers", CommandType.StoredProcedure, param, _connectionString);
            User? user = null;

            if (dt.Rows.Count > 0)
            {
                foreach (DataRow d in dt.Rows)
                {
                    user = new User();
                    user.ID = !string.IsNullOrEmpty(d["ID"].ToString()) ? Convert.ToInt32(d["ID"]) : 0;
                    user.FullName = !string.IsNullOrEmpty(d["FullName"].ToString()) ? Convert.ToString(d["FullName"]).Trim() : "";
                    user.GmailAddress = !string.IsNullOrEmpty(d["GmailAddress"].ToString()) ? Convert.ToString(d["GmailAddress"]).Trim() : "";
                    user.Password = !string.IsNullOrEmpty(d["Password"].ToString()) ? Convert.ToString(d["Password"]).Trim() : "";
                    user.CreatedDateTime = !string.IsNullOrEmpty(d["CreatedDateTime"].ToString()) ? Convert.ToDateTime(d["CreatedDateTime"]) : null;
                    user.JobTitle = !string.IsNullOrEmpty(d["JobTitle"].ToString()) ? Convert.ToString(d["JobTitle"]).Trim() : "";
                    user.Department = !string.IsNullOrEmpty(d["Department"].ToString()) ? Convert.ToString(d["Department"]).Trim() : "";
                }
            }

            return user;
        }
        catch (Exception ex)
        {
            throw;
        }
    }

    public async Task<User?> GetUserByIdAsync(int id)
    {
        try
        {
            SqlParameter[] param = new SqlParameter[2];
            param[0] = new SqlParameter("@Action", "GET_BY_ID");
            param[1] = new SqlParameter("@ID", id);

            DataTable dt = DataAccess.GetDataTable("sp_ManageUsers", CommandType.StoredProcedure, param, _connectionString);
            User? user = null;

            if (dt.Rows.Count > 0)
            {
                foreach (DataRow d in dt.Rows)
                {
                    user = new User();
                    user.ID = !string.IsNullOrEmpty(d["ID"].ToString()) ? Convert.ToInt32(d["ID"]) : 0;
                    user.FullName = !string.IsNullOrEmpty(d["FullName"].ToString()) ? Convert.ToString(d["FullName"]).Trim() : "";
                    user.GmailAddress = !string.IsNullOrEmpty(d["GmailAddress"].ToString()) ? Convert.ToString(d["GmailAddress"]).Trim() : "";
                    user.Password = !string.IsNullOrEmpty(d["Password"].ToString()) ? Convert.ToString(d["Password"]).Trim() : "";
                    user.CreatedDateTime = !string.IsNullOrEmpty(d["CreatedDateTime"].ToString()) ? Convert.ToDateTime(d["CreatedDateTime"]) : null;
                    user.JobTitle = !string.IsNullOrEmpty(d["JobTitle"].ToString()) ? Convert.ToString(d["JobTitle"]).Trim() : "";
                    user.Department = !string.IsNullOrEmpty(d["Department"].ToString()) ? Convert.ToString(d["Department"]).Trim() : "";
                }
            }

            return user;
        }
        catch (Exception ex)
        {
            throw;
        }
    }

    public async Task<List<User>> GetAllUsersAsync()
    {
        try
        {
            SqlParameter[] param = new SqlParameter[1];
            param[0] = new SqlParameter("@Action", "GET_ALL");

            DataTable dt = DataAccess.GetDataTable("sp_ManageUsers", CommandType.StoredProcedure, param, _connectionString);
            List<User> userList = new List<User>();

            if (dt.Rows.Count > 0)
            {
                foreach (DataRow d in dt.Rows)
                {
                    User user = new User();
                    user.ID = !string.IsNullOrEmpty(d["ID"].ToString()) ? Convert.ToInt32(d["ID"]) : 0;
                    user.FullName = !string.IsNullOrEmpty(d["FullName"].ToString()) ? Convert.ToString(d["FullName"]).Trim() : "";
                    user.GmailAddress = !string.IsNullOrEmpty(d["GmailAddress"].ToString()) ? Convert.ToString(d["GmailAddress"]).Trim() : "";
                    user.Password = !string.IsNullOrEmpty(d["Password"].ToString()) ? Convert.ToString(d["Password"]).Trim() : "";
                    user.CreatedDateTime = !string.IsNullOrEmpty(d["CreatedDateTime"].ToString()) ? Convert.ToDateTime(d["CreatedDateTime"]) : null;
                    user.JobTitle = !string.IsNullOrEmpty(d["JobTitle"].ToString()) ? Convert.ToString(d["JobTitle"]).Trim() : "";
                    user.Department = !string.IsNullOrEmpty(d["Department"].ToString()) ? Convert.ToString(d["Department"]).Trim() : "";
                    userList.Add(user);
                }
            }

            return userList;
        }
        catch (Exception ex)
        {
            throw;
        }
    }

    public async Task<User> CreateUserAsync(User user)
    {
        try
        {
            SqlParameter[] param = new SqlParameter[7];
            param[0] = new SqlParameter("@Action", "INSERT");
            param[1] = new SqlParameter("@FullName", (object?)user.FullName ?? DBNull.Value);
            param[2] = new SqlParameter("@GmailAddress", (object?)user.GmailAddress ?? DBNull.Value);
            param[3] = new SqlParameter("@Password", (object?)user.Password ?? DBNull.Value);
            param[4] = new SqlParameter("@CreatedDateTime", (object?)user.CreatedDateTime ?? DateTime.UtcNow);
            param[5] = new SqlParameter("@JobTitle", (object?)user.JobTitle ?? DBNull.Value);
            param[6] = new SqlParameter("@Department", (object?)user.Department ?? DBNull.Value);

            DataTable dt = DataAccess.GetDataTable("sp_ManageUsers", CommandType.StoredProcedure, param, _connectionString);
            User? createdUser = null;

            if (dt.Rows.Count > 0)
            {
                foreach (DataRow d in dt.Rows)
                {
                    createdUser = new User();
                    createdUser.ID = !string.IsNullOrEmpty(d["ID"].ToString()) ? Convert.ToInt32(d["ID"]) : 0;
                    createdUser.FullName = !string.IsNullOrEmpty(d["FullName"].ToString()) ? Convert.ToString(d["FullName"]).Trim() : "";
                    createdUser.GmailAddress = !string.IsNullOrEmpty(d["GmailAddress"].ToString()) ? Convert.ToString(d["GmailAddress"]).Trim() : "";
                    createdUser.Password = !string.IsNullOrEmpty(d["Password"].ToString()) ? Convert.ToString(d["Password"]).Trim() : "";
                    createdUser.CreatedDateTime = !string.IsNullOrEmpty(d["CreatedDateTime"].ToString()) ? Convert.ToDateTime(d["CreatedDateTime"]) : null;
                    createdUser.JobTitle = !string.IsNullOrEmpty(d["JobTitle"].ToString()) ? Convert.ToString(d["JobTitle"]).Trim() : "";
                    createdUser.Department = !string.IsNullOrEmpty(d["Department"].ToString()) ? Convert.ToString(d["Department"]).Trim() : "";
                }
            }

            return createdUser ?? user;
        }
        catch (Exception ex)
        {
            throw;
        }
    }

    public async Task<bool> UserExistsAsync(string email)
    {
        try
        {
            SqlParameter[] param = new SqlParameter[2];
            param[0] = new SqlParameter("@Action", "EXISTS");
            param[1] = new SqlParameter("@GmailAddress", (object?)email.Trim() ?? DBNull.Value);

            DataTable dt = DataAccess.GetDataTable("sp_ManageUsers", CommandType.StoredProcedure, param, _connectionString);

            if (dt.Rows.Count > 0)
            {
                DataRow d = dt.Rows[0];
                return !string.IsNullOrEmpty(d["Exists"].ToString()) && Convert.ToBoolean(d["Exists"]);
            }

            return false;
        }
        catch (Exception ex)
        {
            throw;
        }
    }
}
