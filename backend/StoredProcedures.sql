-- ==============================================================================
-- Stored Procedures for User Authentication & Management
-- Database: db_a4843b_projectmanagment
-- ==============================================================================

USE [db_a4843b_projectmanagment];
GO

-- ==============================================================================
-- CONSOLIDATED STORED PROCEDURE: sp_ManageUsers
-- Handles: GET_BY_EMAIL, GET_BY_ID, GET_ALL, INSERT, EXISTS
-- ==============================================================================
CREATE OR ALTER PROCEDURE sp_ManageUsers
    @Action NVARCHAR(50),
    @ID INT = NULL,
    @FullName NVARCHAR(100) = NULL,
    @GmailAddress NVARCHAR(100) = NULL,
    @Password NVARCHAR(50) = NULL,
    @CreatedDateTime DATETIME = NULL,
    @JobTitle NVARCHAR(50) = NULL,
    @Department NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Get User by Email
    IF @Action = 'GET_BY_EMAIL'
    BEGIN
        SELECT ID, FullName, GmailAddress, Password, CreatedDateTime, JobTitle, Department
        FROM Users
        WHERE LOWER(GmailAddress) = LOWER(LTRIM(RTRIM(@GmailAddress)));
    END

    -- 2. Get User by ID
    ELSE IF @Action = 'GET_BY_ID'
    BEGIN
        SELECT ID, FullName, GmailAddress, Password, CreatedDateTime, JobTitle, Department
        FROM Users
        WHERE ID = @ID;
    END

    -- 3. Get All Users
    ELSE IF @Action = 'GET_ALL'
    BEGIN
        SELECT ID, FullName, GmailAddress, Password, CreatedDateTime, JobTitle, Department
        FROM Users
        ORDER BY ID ASC;
    END

    -- 4. Insert / Sign Up User
    ELSE IF @Action = 'INSERT'
    BEGIN
        INSERT INTO Users (FullName, GmailAddress, Password, CreatedDateTime, JobTitle, Department)
        VALUES (@FullName, LOWER(LTRIM(RTRIM(@GmailAddress))), @Password, @CreatedDateTime, @JobTitle, @Department);

        DECLARE @NewID INT = SCOPE_IDENTITY();

        SELECT ID, FullName, GmailAddress, Password, CreatedDateTime, JobTitle, Department
        FROM Users
        WHERE ID = @NewID;
    END

    -- 5. Check If User Exists
    ELSE IF @Action = 'EXISTS'
    BEGIN
        IF EXISTS (SELECT 1 FROM Users WHERE LOWER(GmailAddress) = LOWER(LTRIM(RTRIM(@GmailAddress))))
            SELECT CAST(1 AS BIT) AS [Exists];
        ELSE
            SELECT CAST(0 AS BIT) AS [Exists];
    END
END;
GO

-- ==============================================================================
-- INDIVIDUAL STORED PROCEDURES (Available as standalone if needed)
-- ==============================================================================

-- 1. Get User by Email
CREATE OR ALTER PROCEDURE sp_GetUserByEmail
    @GmailAddress NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ID, FullName, GmailAddress, Password, CreatedDateTime, JobTitle, Department
    FROM Users
    WHERE LOWER(GmailAddress) = LOWER(LTRIM(RTRIM(@GmailAddress)));
END;
GO

-- 2. Get User by ID
CREATE OR ALTER PROCEDURE sp_GetUserById
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ID, FullName, GmailAddress, Password, CreatedDateTime, JobTitle, Department
    FROM Users
    WHERE ID = @ID;
END;
GO

-- 3. Get All Users
CREATE OR ALTER PROCEDURE sp_GetAllUsers
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ID, FullName, GmailAddress, Password, CreatedDateTime, JobTitle, Department
    FROM Users
    ORDER BY ID ASC;
END;
GO

-- 4. Create User (Insert and return inserted row)
CREATE OR ALTER PROCEDURE sp_CreateUser
    @FullName NVARCHAR(100),
    @GmailAddress NVARCHAR(100),
    @Password NVARCHAR(50),
    @CreatedDateTime DATETIME,
    @JobTitle NVARCHAR(50),
    @Department NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Users (FullName, GmailAddress, Password, CreatedDateTime, JobTitle, Department)
    VALUES (@FullName, LOWER(LTRIM(RTRIM(@GmailAddress))), @Password, @CreatedDateTime, @JobTitle, @Department);

    DECLARE @NewID INT = SCOPE_IDENTITY();

    SELECT ID, FullName, GmailAddress, Password, CreatedDateTime, JobTitle, Department
    FROM Users
    WHERE ID = @NewID;
END;
GO

-- 5. Check if User Exists by Email
CREATE OR ALTER PROCEDURE sp_CheckUserExists
    @GmailAddress NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM Users WHERE LOWER(GmailAddress) = LOWER(LTRIM(RTRIM(@GmailAddress))))
        SELECT CAST(1 AS BIT) AS [Exists];
    ELSE
        SELECT CAST(0 AS BIT) AS [Exists];
END;
GO
