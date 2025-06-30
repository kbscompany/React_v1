# Cheque Settlement Feature with Tolerance

## Overview

This feature implements an enhanced cheque settlement system that allows for:
1. **Automatic pre-selection** of settlement cheques (but changeable via dropdown)
2. **Automatic amount retrieval** (but editable)
3. **Tolerance for differences** up to 10 LE between cheques

## Backend Implementation

### New API Endpoints

#### 1. Get Available Settlement Cheques
```
GET /cheques/{cheque_id}/available-for-settlement
```

Returns a list of available cheques for settling an overspent cheque, sorted by recommendation:
- Cheques with sufficient balance are marked as recommended
- Cheques within the 10 LE tolerance are also marked as recommended
- Results are sorted by recommendation status and difference amount

**Response Example:**
```json
[
  {
    "id": 2,
    "cheque_number": "CHQ002",
    "amount": 100.00,
    "bank_account_name": "Main Account",
    "bank_name": "Test Bank",
    "is_recommended": true,
    "difference_amount": 0.00
  },
  {
    "id": 3,
    "cheque_number": "CHQ003",
    "amount": 105.00,
    "bank_account_name": "Main Account",
    "bank_name": "Test Bank",
    "is_recommended": true,
    "difference_amount": 5.00
  }
]
```

#### 2. Perform Manual Settlement
```
POST /cheques/manual-settlement
```

Performs manual settlement with tolerance checking.

**Request Body:**
```json
{
  "overspent_cheque_id": 1,
  "settlement_cheque_id": 2,
  "settlement_amount": 10.00,
  "tolerance_amount": 10.00,
  "notes": "Manual settlement with tolerance"
}
```

**Features:**
- Validates cheques are in the same safe
- Checks user permissions
- Enforces tolerance limits
- Updates safe balance
- Creates audit logs

### Database Schema Updates

Two new schemas were added:
1. `ManualChequeSettlement` - For settlement requests
2. `AvailableSettlementCheque` - For available cheque responses

## Frontend Integration

The React component (`frontend_cheque_settlement_example.tsx`) demonstrates:

### Key Features

1. **Auto-selection**: First recommended cheque is automatically pre-selected
2. **Dropdown Selection**: User can change the settlement cheque from dropdown
3. **Amount Editing**: Settlement amount is pre-filled but editable
4. **Real-time Validation**: Shows difference and tolerance status
5. **Visual Feedback**: Color-coded alerts for tolerance status

### UI Components

- **Overspent Cheque Summary**: Red-highlighted card showing overspent details
- **Settlement Cheque Dropdown**: Shows all available cheques with recommendations
- **Selected Cheque Details**: Green-highlighted card with selected cheque info
- **Settlement Amount Input**: Editable field with difference calculation
- **Tolerance Alert**: Dynamic alert showing if within allowed tolerance
- **Submit Button**: Disabled if tolerance exceeded

## Usage Example

1. **Cheque becomes overspent**: When expenses exceed cheque amount
2. **System fetches available cheques**: Automatically loads settlement options
3. **Pre-selection occurs**: First recommended cheque is selected
4. **User can adjust**:
   - Change settlement cheque from dropdown
   - Modify settlement amount if needed
5. **Validation**: System checks if difference is within 10 LE tolerance
6. **Settlement**: On submit, cheques are marked as settled and safe balance updated

## Testing

Run the test script to see the feature in action:
```bash
python test_cheque_settlement_with_tolerance.py
```

The test demonstrates:
- Creating overspent scenario
- Fetching available cheques
- Performing settlement with tolerance
- Verifying settlement history

## Business Logic

### Tolerance Rules
- Default tolerance: 10 LE
- If settlement amount differs from overspent amount by ≤10 LE, settlement is allowed
- Differences are tracked in audit logs

### Cheque Status Flow
```
created → assigned → active → overspent → settled
```

### Safe Balance Updates
- When settled, the settlement amount is added back to safe balance
- This allows for reconciliation even with small differences

## Security

- User must have `can_create_expense` permission for the safe
- Admin users have full access
- All actions are logged in audit trail

## Benefits

1. **Flexibility**: Allows settling with slight differences
2. **Efficiency**: Auto-selection speeds up process
3. **Accuracy**: Editable amounts handle edge cases
4. **Transparency**: Full audit trail of settlements
5. **User-Friendly**: Clear visual feedback and recommendations 