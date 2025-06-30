# Early Settlement Feature Documentation

## Overview

The Early Settlement feature allows users to settle cheques early by providing deposit information from their bank. This is useful when a cheque has been cashed/deposited at the bank before all planned expenses have been made.

## Key Features

- 🏦 **Bank Deposit Integration**: Submit bank deposit numbers and amounts
- 📸 **File Upload Support**: Attach deposit screenshots, bank statements, or documents
- ✅ **Admin Approval Workflow**: Secure approval process for early settlements
- 🔐 **Permission Control**: Role-based access with safe assignment validation
- 📊 **Balance Management**: Automatic safe balance updates upon approval
- 📋 **Audit Trail**: Complete logging of all early settlement activities

## Database Schema

### Early Settlements Table (`early_settlements`)
```sql
- id: Primary key
- cheque_id: Foreign key to cheques table
- deposit_number: Bank deposit reference number
- deposit_amount: Amount deposited at the bank
- deposit_date: Date of bank deposit
- bank_deposit_reference: Additional bank reference (optional)
- notes: User notes and admin approval notes
- status: pending/approved/rejected
- settlement_date: Date when processed
- created_by: User who created the settlement
- approved_by: Admin who approved/rejected
- created_at/updated_at: Timestamps
```

### Early Settlement Files Table (`early_settlement_files`)
```sql
- id: Primary key
- early_settlement_id: Foreign key to early_settlements
- filename: Unique filename on disk
- original_filename: User's original filename
- file_path: Path to file on server
- file_size: File size in bytes
- mime_type: File MIME type
- file_type: deposit_screenshot/bank_statement/other
- uploaded_by: User who uploaded the file
- uploaded_at: Upload timestamp
```

## API Endpoints

### 1. Check Eligibility
**GET** `/cheques/{cheque_id}/eligible-for-early-settlement`

Checks if a cheque is eligible for early settlement.

**Requirements:**
- Cheque must be assigned to a safe
- Cheque must not be already settled
- Cheque must not be cancelled
- No pending early settlement exists

**Response:**
```json
{
  "eligible": true,
  "cheque": {...},
  "reasons": {
    "not_assigned": false,
    "already_settled": false,
    "cancelled": false,
    "pending_settlement": false
  }
}
```

### 2. Create Early Settlement
**POST** `/early-settlements`

Creates a new early settlement request.

**Request Body:**
```json
{
  "cheque_id": 1,
  "deposit_number": "DEP123456",
  "deposit_amount": 5000.00,
  "deposit_date": "2024-01-15T10:30:00",
  "bank_deposit_reference": "REF789",
  "notes": "Early deposit due to urgent need"
}
```

### 3. Upload Attachment
**POST** `/early-settlements/{settlement_id}/upload`

Uploads a file attachment (deposit screenshot, bank statement).

**Form Data:**
- `file`: The file to upload
- `file_type`: deposit_screenshot/bank_statement/other

**Supported File Types:**
- Images: JPG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX
- Maximum size: 10MB

### 4. List Early Settlements
**GET** `/early-settlements`

Gets all early settlements with filtering options.

**Query Parameters:**
- `safe_id`: Filter by safe
- `cheque_id`: Filter by cheque
- `status`: Filter by status (pending/approved/rejected)
- `skip`: Pagination offset
- `limit`: Maximum results

### 5. Approve/Reject Settlement
**PUT** `/early-settlements/{settlement_id}/approve`

Approves or rejects an early settlement (Admin only).

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Approved after verifying bank deposit"
}
```

**When Approved:**
- Cheque is marked as settled
- Safe balance is increased by deposit amount
- Settlement date is recorded

### 6. Get Settlement Files
**GET** `/early-settlements/{settlement_id}/files`

Returns all files attached to an early settlement.

### 7. Download File
**GET** `/early-settlement-files/{file_id}/download`

Downloads a specific file attachment.

### 8. Delete File
**DELETE** `/early-settlement-files/{file_id}`

Deletes a file attachment (only for pending settlements).

## Simple Testing Endpoints (No Authentication)

For testing purposes, simplified endpoints are available:

### Get Early Settlements
**GET** `/early-settlements-simple`

Returns all early settlements without authentication.

### Create Early Settlement
**POST** `/early-settlements-simple`

```json
{
  "cheque_id": 1,
  "deposit_number": "DEP123456",
  "deposit_amount": 5000.00,
  "deposit_date": "2024-01-15T10:30:00",
  "notes": "Test settlement"
}
```

### Approve Settlement
**PUT** `/early-settlements-simple/{settlement_id}/approve`

```json
{
  "status": "approved",
  "notes": "Test approval"
}
```

## Usage Workflow

### 1. User Creates Early Settlement Request
```python
# Check eligibility first
response = requests.get(f"/cheques/{cheque_id}/eligible-for-early-settlement")

# Create settlement request
settlement_data = {
    "cheque_id": 1,
    "deposit_number": "DEP123456",
    "deposit_amount": 5000.00,
    "deposit_date": "2024-01-15T10:30:00",
    "notes": "Early settlement due to bank deposit"
}
response = requests.post("/early-settlements", json=settlement_data)
```

### 2. Upload Deposit Screenshot
```python
# Upload file
files = {'file': open('deposit_screenshot.jpg', 'rb')}
data = {'file_type': 'deposit_screenshot'}
response = requests.post(f"/early-settlements/{settlement_id}/upload", 
                        files=files, data=data)
```

### 3. Admin Reviews and Approves
```python
# Review settlements
response = requests.get("/early-settlements?status=pending")

# Approve settlement
approval_data = {
    "status": "approved",
    "notes": "Verified bank deposit - approved"
}
response = requests.put(f"/early-settlements/{settlement_id}/approve", 
                       json=approval_data)
```

## Security & Permissions

### User Permissions
- **View**: Users need `can_view` permission for the safe
- **Create**: Users need `can_create_expense` permission for the safe
- **Upload**: File uploaders or users with safe access can upload
- **Delete**: Only file uploaders and authorized users can delete files

### Admin Only Actions
- Approve/reject early settlements
- Access all settlements regardless of safe assignments

### File Security
- Files stored in dedicated directory: `uploads/early_settlement_files/`
- Unique filenames to prevent conflicts
- File type validation for security
- Size limits to prevent abuse
- Access control for downloads

## Integration with Existing System

### Cheque Model Updates
- Added `early_settlements` relationship
- Existing settlement logic preserved
- No breaking changes to current functionality

### Safe Balance Management
- Automatic balance updates upon approval
- Consistent with existing expense system
- Audit trail maintained

### Status Management
When early settlement is approved:
1. Cheque status → "settled"
2. Cheque `is_settled` → True
3. Settlement date recorded
4. Safe balance increased by deposit amount

## Error Handling

Common error scenarios and responses:

### Cheque Not Eligible
```json
{
  "status_code": 400,
  "detail": "Cheque must be assigned to a safe for early settlement"
}
```

### Permission Denied
```json
{
  "status_code": 403,
  "detail": "Access to create early settlements for this safe not permitted"
}
```

### Invalid File Type
```json
{
  "status_code": 400,
  "detail": "Invalid file type. Allowed types: JPG, PNG, GIF, WebP, PDF, DOC, DOCX"
}
```

### File Size Exceeded
```json
{
  "status_code": 400,
  "detail": "File size exceeds 10MB limit"
}
```

## Testing Examples

### Complete Early Settlement Flow
```python
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

# 1. Create early settlement
settlement_data = {
    "cheque_id": 1,
    "deposit_number": "DEP123456",
    "deposit_amount": 5000.00,
    "deposit_date": datetime.now().isoformat(),
    "notes": "Bank deposit completed early"
}

response = requests.post(f"{BASE_URL}/early-settlements-simple", 
                        json=settlement_data)
settlement = response.json()
settlement_id = settlement["settlement"]["id"]

# 2. List settlements
response = requests.get(f"{BASE_URL}/early-settlements-simple")
settlements = response.json()

# 3. Approve settlement
approval_data = {
    "status": "approved",
    "notes": "Verified and approved"
}
response = requests.put(f"{BASE_URL}/early-settlements-simple/{settlement_id}/approve",
                       json=approval_data)
```

## Monitoring and Maintenance

### Key Metrics to Monitor
- Number of early settlements per day/week
- Approval vs rejection rates
- Average processing time
- File upload success rates
- Safe balance accuracy after settlements

### Maintenance Tasks
- Regular cleanup of old files
- Monitor disk space for uploads
- Review and update file size limits
- Audit permission assignments
- Backup file attachments

## Future Enhancements

### Potential Improvements
1. **Email Notifications**: Notify admins of pending settlements
2. **Bulk Approval**: Process multiple settlements at once
3. **Integration**: Connect with bank APIs for automatic verification
4. **Reporting**: Generate settlement reports and analytics
5. **Mobile Support**: Optimize file uploads for mobile devices
6. **OCR**: Automatic extraction of deposit details from images

### Configuration Options
- Configurable file size limits
- Customizable approval workflows
- Integration with external banking systems
- Advanced permission granularity

---

## Summary

The Early Settlement feature provides a secure, user-friendly way to handle early cheque settlements with proper documentation and approval workflows. It integrates seamlessly with the existing system while maintaining security and audit requirements.

**Key Benefits:**
- ✅ Simplified early settlement process
- ✅ Proper documentation with file attachments
- ✅ Secure approval workflow
- ✅ Automatic balance management
- ✅ Complete audit trail
- ✅ Role-based access control 