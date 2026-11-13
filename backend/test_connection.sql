-- Simple test script
CREATE TABLE TestConnection (
    Id INT PRIMARY KEY IDENTITY(1,1),
    TestMessage NVARCHAR(100)
);

INSERT INTO TestConnection (TestMessage) VALUES ('Connection works!');

SELECT * FROM TestConnection;

DROP TABLE TestConnection;
