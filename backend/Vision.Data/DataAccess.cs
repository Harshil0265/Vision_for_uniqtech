using System.Data;
using Microsoft.Data.SqlClient;

namespace Vision.Data;

public static class DataAccess
{
    public static DataTable GetDataTable(string procedureName, CommandType commandType, SqlParameter[]? parameters, string connectionString)
    {
        var dt = new DataTable();
        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(procedureName, conn)
        {
            CommandType = commandType
        };

        if (parameters != null && parameters.Length > 0)
        {
            cmd.Parameters.AddRange(parameters);
        }

        using var adapter = new SqlDataAdapter(cmd);
        adapter.Fill(dt);
        return dt;
    }

    public static async Task<DataTable> GetDataTableAsync(string procedureName, CommandType commandType, SqlParameter[]? parameters, string connectionString)
    {
        var dt = new DataTable();
        using var conn = new SqlConnection(connectionString);
        using var cmd = new SqlCommand(procedureName, conn)
        {
            CommandType = commandType
        };

        if (parameters != null && parameters.Length > 0)
        {
            cmd.Parameters.AddRange(parameters);
        }

        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();
        dt.Load(reader);
        return dt;
    }
}
