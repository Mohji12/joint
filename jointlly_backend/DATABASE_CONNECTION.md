# Database Connection Guide

## AWS RDS MySQL Connection Details

The application is configured to connect to AWS RDS MySQL database.

### Connection Credentials

- **Endpoint**: `critical-classes.cnq64ucw4hew.ap-south-1.rds.amazonaws.com`
- **Port**: `3306`
- **Database**: `jointly`
- **Username**: `admin`
- **Password**: `Critical#2025`

### Environment Configuration

Create a `.env` file in the project root with the following:

```env
# Database - AWS RDS MySQL
DATABASE_URL=mysql+aiomysql://admin:Critical%232025@critical-classes.cnq64ucw4hew.ap-south-1.rds.amazonaws.com:3306/jointly

# JWT Authentication
JWT_SECRET_KEY=your-secret-key-min-32-chars-long-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=120
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Application
APP_NAME=Jointly Real Estate Platform
APP_VERSION=1.0.0
DEBUG=True
ENVIRONMENT=development

# Server
HOST=0.0.0.0
PORT=8000
```

### Important Notes

1. **Password URL Encoding**: The password contains special characters (`#`), which must be URL-encoded in the connection string:
   - `#` becomes `%23`
   - So `Critical#2025` becomes `Critical%232025`

2. **Database URL Format**: 
   ```
   mysql+aiomysql://username:password@host:port/database
   ```

3. **Installing Dependencies**: Make sure to install MySQL drivers:
   ```bash
   pip install -r requirements.txt
   ```
   
   This will install:
   - `aiomysql` - For async MySQL connections
   - `pymysql` - For synchronous connections (Alembic migrations)

### Setting Up the Database

1. **Create the database** (if not already created):
   ```sql
   CREATE DATABASE IF NOT EXISTS jointly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Run the schema**:
   - Option 1: Use MySQL Workbench to execute `database_schema.sql`
   - Option 2: Use Alembic migrations (recommended for production)

3. **Run Alembic migrations** (if using migrations):
   ```bash
   alembic upgrade head
   ```

### Testing the Connection

You can test the connection by running the application:

```bash
uvicorn app.main:app --reload
```

If the connection is successful, the application will start without database errors.

### Security Notes

⚠️ **Important**: 
- Never commit the `.env` file to version control
- The `.env` file is already in `.gitignore`
- Change the JWT secret key in production
- Use environment-specific credentials for different environments (dev/staging/prod)

### Troubleshooting

1. **Connection Timeout**: 
   - Check if your IP is whitelisted in AWS RDS security groups
   - Verify the endpoint and port are correct

2. **Authentication Failed**:
   - Verify username and password
   - Check password URL encoding (special characters)

3. **Database Not Found**:
   - Ensure the database `jointly` exists
   - Check database name spelling

4. **SSL Connection Issues**:
   - AWS RDS may require SSL. Add `?ssl=true` to the connection string if needed:
   ```
   DATABASE_URL=mysql+aiomysql://admin:Critical%232025@critical-classes.cnq64ucw4hew.ap-south-1.rds.amazonaws.com:3306/jointly?ssl=true
   ```
