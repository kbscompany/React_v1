# 📋 Cheque Field Mapping Analysis & Debug Guide

## 🔍 Current Field Definitions

### Frontend Field Labels (FIELD_DEFS)
```typescript
const FIELD_DEFS: ChequeField[] = [
  { key: 'cheque_number', label: 'رقم الشيك' },
  { key: 'amount_number', label: 'المبلغ بالأرقام' },
  { key: 'amount_words', label: 'المبلغ كتابة' },
  { key: 'beneficiary_name', label: 'اسم المستفيد' },
  { key: 'issue_date', label: 'تاريخ الإصدار' },
  { key: 'due_date', label: 'تاريخ الاستحقاق' },
  { key: 'description', label: 'وصف الشيك' },
  { key: 'payee_notice', label: 'يصرف للمستفيد الأول' },
  { key: 'recipient', label: 'المستلم' },
  { key: 'receipt_date', label: 'تاريخ الاستلام' },
  { key: 'note_1', label: 'محرر الشيك' },
  { key: 'note_4', label: 'رقم المرايا' },
  { key: 'company_table', label: 'جدول معلومات الشركة' }
];
```

## 🗂 Database Fields to Print Fields Mapping

### ChequeManagement.tsx Field Mapping (Current Implementation)
```typescript
const chequeData: Record<string, string> = {
  cheque_number: cheque.cheque_number || '',
  amount_number: amount.toFixed(2),
  amount_words: convertToArabicWords(amount),
  beneficiary_name: cheque.issued_to || '',        // ⚠️ ISSUE: issued_to -> beneficiary_name
  issue_date: formatted_issue_date,
  due_date: formatted_due_date,
  description: cheque.description || 'بدون وصف',   // ✅ CORRECT
  payee_notice: 'ادفعوا بموجب هذا الشيك',
  recipient: cheque.issued_to || '',               // ⚠️ DUPLICATE: same as beneficiary_name
  receipt_date: new Date().toLocaleDateString('ar-EG'),
  note_1: safeName,                               // ⚠️ ISSUE: safeName in note_1 field
  note_4: bankName,                               // ⚠️ ISSUE: bankName in note_4 field
  safe_name: safeName,
  bank_name: bankName
};
```

### Backend API Field Mapping (main.py)
```python
cheque_data = {
    "beneficiary_name": cheque_row[5] or "غير محدد",  # Maps to issued_to from DB
    "issued_to": cheque_row[5] or "غير محدد",         # Also maps to issued_to 
    "amount_number": amount,
    "cheque_number": cheque_row[1] or "",
    "date": date_str,
    "issue_date": date_str,
    "due_date": due_date_str,
    "expense_description": cheque_row[6] or f"شيك رقم {cheque_row[1]}",  # ⚠️ ISSUE: description from DB
    "description": cheque_row[6] or "",              # ✅ CORRECT mapping
    "safe_name": cheque_row[7] or "",
    "bank_name": cheque_row[8] or "",
}
```

## 🚨 Identified Issues

### Issue 1: Field Name Confusion
- **Database Field**: `issued_to` (who the cheque is issued to)
- **Print Field**: `beneficiary_name` (اسم المستفيد)
- **Problem**: These are the SAME data but different field names

### Issue 2: Duplicate Text
- **recipient**: Gets `cheque.issued_to`
- **beneficiary_name**: Also gets `cheque.issued_to` 
- **Result**: Same person name appears in two different positions

### Issue 3: Description vs Expense Description
- **description**: Actual cheque description
- **expense_description**: Sometimes used interchangeably
- **Problem**: May cause description to appear in wrong place

### Issue 4: Note Fields Misuse
- **note_1**: Currently shows Safe Name instead of intended content
- **note_4**: Currently shows Bank Name instead of "رقم المرايا"

## 🛠 Recommended Field Mapping

### Corrected Mapping
```typescript
const chequeData: Record<string, string> = {
  // Basic cheque info
  cheque_number: cheque.cheque_number || '',
  amount_number: amount.toFixed(2),
  amount_words: convertToArabicWords(amount),
  
  // Person/Entity fields (FIX: Use only ONE field for issued_to)
  beneficiary_name: cheque.issued_to || '',        // اسم المستفيد
  recipient: 'مدير الشؤون المالية',                // المستلم (should be receiver, not payer)
  
  // Date fields
  issue_date: formatted_issue_date,
  due_date: formatted_due_date,
  receipt_date: new Date().toLocaleDateString('ar-EG'),
  
  // Description (FIX: Keep only actual cheque description)
  description: cheque.description || 'بدون وصف',
  
  // Notice fields
  payee_notice: 'يصرف للمستفيد الأول',
  
  // Note fields (FIX: Use for intended purpose)
  note_1: 'محرر الشيك: إدارة الشؤون المالية',    // Who created the cheque
  note_4: `MR-${cheque.id}-${new Date().getFullYear()}`, // Reference number
  
  // Company info (for company table)
  safe_name: safeName,
  bank_name: bankName
};
```

## 📝 Field Definitions Translation

| Field Key | English | Arabic | Current Use | Recommended Use |
|-----------|---------|--------|-------------|-----------------|
| `beneficiary_name` | Beneficiary Name | اسم المستفيد | ✅ issued_to | ✅ issued_to |
| `recipient` | Recipient | المستلم | ❌ issued_to (duplicate) | ✅ Who receives/handles |
| `description` | Description | وصف الشيك | ✅ cheque.description | ✅ cheque.description |
| `note_1` | Note 1 | محرر الشيك | ❌ Safe name | ✅ Who created cheque |
| `note_4` | Note 4 | رقم المرايا | ❌ Bank name | ✅ Reference number |
| `payee_notice` | Payee Notice | يصرف للمستفيد الأول | ✅ Standard text | ✅ Standard text |

## 🔧 Quick Debug Checklist

### To Identify Field Issues:
1. **Check Print Preview**: Look for duplicate names
2. **Verify Description**: Is the right text in the description field?
3. **Check Note Fields**: Are they showing safe/bank names instead of proper notes?
4. **Validate issued_to**: Should only appear once as beneficiary_name

### Debug Commands:
```typescript
// Add to ChequeManagement.tsx for debugging:
console.log('🔍 Field Mapping Debug:');
console.log('cheque.issued_to:', cheque.issued_to);
console.log('cheque.description:', cheque.description);
console.log('Generated beneficiary_name:', chequeData.beneficiary_name);
console.log('Generated recipient:', chequeData.recipient);
console.log('Generated description:', chequeData.description);
console.log('Generated note_1:', chequeData.note_1);
console.log('Generated note_4:', chequeData.note_4);
```

## ✅ Validation Steps

1. **Print Test Cheque**: Use sample data to verify field positions
2. **Check Each Field**: Ensure each field shows expected content
3. **Verify No Duplicates**: Same text shouldn't appear in multiple fields
4. **Test All Scenarios**: Different cheque types (supplier payment, general, etc.)

---

*This document should help you identify exactly which fields are mixed up and what content is appearing where during cheque printing.* 