# Super Admin Features Documentation

## Overview
This document describes the powerful super admin features for resetting safes and deleting cheques. These features are designed for testing purposes and system maintenance.

⚠️ **WARNING: These are DESTRUCTIVE operations that cannot be undone. Use with extreme caution!**

## Features Added

### 1. Reset Specific Safe
Resets a single safe by removing all cheques and resetting the balance to zero.

**Authenticated Endpoint:**
```
POST /admin/reset-safe/{safe_id}
```

**Simple Endpoint (No Auth):**
```
POST /admin-simple/reset-safe/{safe_id}
```

**What it does:**
- Removes all cheques from the specified safe
- Deletes all expenses associated with those cheques
- Resets all cheques to unassigned state
- Sets safe balance to $0.00
- Creates audit log (authenticated version only)

**Example Response:**
```json
{
  "success": true,
  "message": "Safe 'Main Safe' has been reset",
  "details": {
    "safe_name": "Main Safe",
    "cheques_removed": 5,
    "expenses_deleted": 12,
    "previous_balance": 1500.00,
    "new_balance": 0.00
  }
}
```

### 2. Reset All Safes
Resets ALL safes in the system by removing all cheques and resetting all balances.

**Authenticated Endpoint:**
```
POST /admin/reset-all-safes?confirm=true
```

**Simple Endpoint (No Auth):**
```
POST /admin-simple/reset-all-safes?confirm=true
```

**What it does:**
- Resets ALL safes in the system
- Removes all cheques from all safes
- Deletes all expenses in the system
- Resets all cheques to unassigned state
- Sets all safe balances to $0.00
- Creates audit log (authenticated version only)

**Example Response:**
```json
{
  "success": true,
  "message": "ALL 6 safes have been reset",
  "warning": "This action cannot be undone",
  "details": {
    "safes_reset": 6,
    "cheques_unassigned": 25,
    "expenses_deleted": 48,
    "total_balance_reset": 5750.00
  }
}
```

### 3. Delete All Cheques
Completely deletes ALL cheques and related data from the system.

**Authenticated Endpoint:**
```
DELETE /admin/delete-cheques?confirm=true
```

**Simple Endpoint (No Auth):**
```
DELETE /admin-simple/delete-all-cheques?confirm=true
```

**What it does:**
- Deletes ALL cheques from the database
- Deletes ALL expenses from the database
- Deletes ALL early settlements from the database
- Resets all safe balances to $0.00
- Creates audit log (authenticated version only)

**Example Response:**
```json
{
  "success": true,
  "message": "ALL cheques and related data have been deleted",
  "warning": "This action cannot be undone",
  "details": {
    "cheques_deleted": 25,
    "expenses_deleted": 48,
    "settlements_deleted": 3
  }
}
```

## Safety Features

### 1. Confirmation Required
All destructive operations require `confirm=true` parameter:
```
POST /admin-simple/reset-all-safes?confirm=true
DELETE /admin-simple/delete-all-cheques?confirm=true
```

Without confirmation, you'll get:
```json
{
  "detail": "This is a destructive operation. Add ?confirm=true to proceed"
}
```

### 2. Authentication (Production Endpoints)
The authenticated endpoints require:
- Valid user authentication
- Admin role permissions
- Proper authorization headers

### 3. Audit Logging
All authenticated operations create detailed audit logs with:
- User ID who performed the action
- Timestamp of the operation
- Before and after values
- Detailed description of what was changed

## Usage Examples

### Testing Scenario 1: Reset a Single Safe
```bash
# Reset safe ID 1
curl -X POST "http://localhost:8001/admin-simple/reset-safe/1"
```

### Testing Scenario 2: Clean All Safes
```bash
# Reset all safes (requires confirmation)
curl -X POST "http://localhost:8001/admin-simple/reset-all-safes?confirm=true"
```

### Testing Scenario 3: Complete System Reset
```bash
# Delete everything (DANGEROUS!)
curl -X DELETE "http://localhost:8001/admin-simple/delete-all-cheques?confirm=true"
```

### Production Usage (Authenticated)
```bash
# Get authentication token first
TOKEN=$(curl -X POST "http://localhost:8001/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" | jq -r '.access_token')

# Reset safe with authentication
curl -X POST "http://localhost:8001/admin/reset-safe/1" \
  -H "Authorization: Bearer $TOKEN"
```

## Use Cases

### 1. Testing Environment Reset
- Quickly reset test data between test runs
- Clean up after integration tests
- Prepare fresh environment for demos

### 2. Development Workflow
- Reset development database to clean state
- Remove test cheques and expenses
- Start fresh with new test scenarios

### 3. System Maintenance
- Clean up corrupted data
- Reset after data migration issues
- Emergency system cleanup

## Error Handling

### Common Errors:

**404 - Safe Not Found:**
```json
{
  "detail": "Safe not found"
}
```

**400 - Missing Confirmation:**
```json
{
  "detail": "This is a destructive operation. Add ?confirm=true to proceed"
}
```

**403 - Insufficient Permissions:**
```json
{
  "detail": "Super Admin access required"
}
```

**500 - Database Error:**
```json
{
  "detail": "Error resetting safe: [specific error message]"
}
```

## Best Practices

### 1. Always Backup First
```bash
# Backup database before using these features
mysqldump -u username -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Use in Controlled Environment
- Never use in production without proper authorization
- Test in development environment first
- Have rollback plan ready

### 3. Verify Results
```bash
# Check system state after operations
curl "http://localhost:8001/safes-simple"
curl "http://localhost:8001/cheques-unassigned-simple"
```

### 4. Monitor Audit Logs
```sql
-- Check recent admin actions
SELECT * FROM audit_logs 
WHERE action IN ('RESET_SAFE', 'DELETE_ALL_CHEQUES', 'RESET_ALL_SAFES') 
ORDER BY created_at DESC 
LIMIT 10;
```

## Security Considerations

### 1. Access Control
- Simple endpoints have no authentication (testing only)
- Production endpoints require admin role
- Consider IP restrictions for admin endpoints

### 2. Rate Limiting
- Consider implementing rate limiting for these endpoints
- Add additional confirmation steps for production

### 3. Monitoring
- Log all admin operations
- Set up alerts for destructive operations
- Monitor for unusual admin activity

## Testing the Features

Run the test suite:
```bash
python test_super_admin_features.py
```

This will test:
- Endpoint availability
- Reset specific safe functionality
- Reset all safes functionality
- Delete all cheques functionality
- Confirmation requirement validation
- System state verification

## Troubleshooting

### Server Not Responding
```bash
# Check if server is running
curl "http://localhost:8001/test"
```

### Database Connection Issues
```bash
# Check database connectivity
python -c "from database import get_db; print('DB OK' if next(get_db()) else 'DB Error')"
```

### Permission Issues
```bash
# Verify admin user exists
python -c "from database import get_db; import models; db=next(get_db()); print(db.query(models.User).filter(models.User.role.has(name='Admin')).count(), 'admin users')"
```

## Conclusion

These super admin features provide powerful tools for system maintenance and testing. Use them responsibly and always with proper backups and authorization.

Remember: **With great power comes great responsibility!** 🕷️ 