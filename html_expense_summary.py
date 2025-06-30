"""HTML Expense Summary Generator

Generates professional HTML documents for expense summaries with support for:
- Multiple expense selection
- Date range filtering
- Cheque-based grouping
- Arabic and English support
- Print-ready styling
"""

from datetime import datetime
from typing import Dict, Any, List
import webbrowser
import tempfile
import os

def generate_expense_summary_html(
    expenses: List[Dict[str, Any]], 
    summary_info: Dict[str, Any],
    language: str = 'ar'
) -> str:
    """
    Generate HTML for expense summary
    
    Args:
        expenses: List of expense dictionaries
        summary_info: Summary information (total amount, date range, etc.)
        language: 'ar' for Arabic, 'en' for English
    
    Returns:
        str: HTML content
    """
    
    # Basic setup
    is_arabic = language == 'ar'
    direction = "rtl" if is_arabic else "ltr"
    text_align = "right" if is_arabic else "left"
    
    # Translations
    labels = {
        'ar': {
            'title': 'ملخص المصروفات',
            'expense_summary': 'ملخص المصروفات',
            'date_range': 'الفترة الزمنية:',
            'total_expenses': 'إجمالي المصروفات:',
            'total_amount': 'إجمالي المبلغ:',
            'expense_count': 'عدد المصروفات:',
            'expense_details': 'تفاصيل المصروفات',
            'expense_id': 'رقم المصروف',
            'date': 'التاريخ',
            'description': 'الوصف',
            'category': 'الفئة',
            'amount': 'المبلغ',
            'status': 'الحالة',
            'cheque_number': 'رقم الشيك',
            'safe_name': 'الخزينة',
            'notes': 'ملاحظات',
            'generated_on': 'تم إنشاؤه في:',
            'print': 'طباعة',
            'approved': 'موافق عليه',
            'pending': 'في الانتظار',
            'rejected': 'مرفوض',
            'na': 'غير محدد',
            'total': 'الإجمالي:',
            'expense_report': 'تقرير المصروفات',
            'report_summary': 'ملخص التقرير',
            'by_cheque': 'حسب الشيك:',
            'from_to': 'من {from_date} إلى {to_date}'
        },
        'en': {
            'title': 'Expense Summary',
            'expense_summary': 'Expense Summary',
            'date_range': 'Date Range:',
            'total_expenses': 'Total Expenses:',
            'total_amount': 'Total Amount:',
            'expense_count': 'Number of Expenses:',
            'expense_details': 'Expense Details',
            'expense_id': 'Expense ID',
            'date': 'Date',
            'description': 'Description',
            'category': 'Category',
            'amount': 'Amount',
            'status': 'Status',
            'cheque_number': 'Cheque Number',
            'safe_name': 'Safe',
            'notes': 'Notes',
            'generated_on': 'Generated on:',
            'print': 'Print',
            'approved': 'Approved',
            'pending': 'Pending',
            'rejected': 'Rejected',
            'na': 'N/A',
            'total': 'Total:',
            'expense_report': 'Expense Report',
            'report_summary': 'Report Summary',
            'by_cheque': 'By Cheque:',
            'from_to': 'From {from_date} to {to_date}'
        }
    }
    
    t = labels[language]
    currency = "ج.م" if is_arabic else "$"
    
    # Calculate totals
    total_amount = sum(expense.get('amount', 0) for expense in expenses)
    expense_count = len(expenses)
    
    # Format dates
    current_date = datetime.now().strftime('%Y/%m/%d %H:%M')
    
    # Build HTML
    html = f'''<!DOCTYPE html>
<html dir="{direction}" lang="{language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{t['title']}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        
        * {{ box-sizing: border-box; }}
        
        body {{
            font-family: {'Cairo, sans-serif' if is_arabic else 'Arial, sans-serif'};
            direction: {direction};
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }}
        
        .container {{
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        
        .header {{
            text-align: center;
            border-bottom: 3px solid #28a745;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        
        .title {{
            font-size: 32px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 10px 0;
        }}
        
        .subtitle {{
            font-size: 16px;
            color: #666;
            margin: 5px 0;
        }}
        
        .summary-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }}
        
        .summary-card {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-{('right' if is_arabic else 'left')}: 4px solid #28a745;
            text-align: center;
        }}
        
        .summary-label {{
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
        }}
        
        .summary-value {{
            font-size: 24px;
            font-weight: 700;
            color: #28a745;
        }}
        
        .section-title {{
            font-size: 20px;
            font-weight: 600;
            color: #333;
            margin: 40px 0 20px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #28a745;
        }}
        
        .expenses-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }}
        
        .expenses-table th {{
            background: #28a745;
            color: white;
            padding: 15px 10px;
            text-align: center;
            font-weight: 600;
            font-size: 14px;
        }}
        
        .expenses-table td {{
            padding: 12px 10px;
            border-bottom: 1px solid #dee2e6;
            text-align: {text_align};
            font-size: 13px;
        }}
        
        .expenses-table tbody tr:nth-child(even) {{
            background: #f8f9fa;
        }}
        
        .expenses-table tbody tr:hover {{
            background: #e8f5e8;
        }}
        
        .status-badge {{
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }}
        
        .status-approved {{
            background: #d4edda;
            color: #155724;
        }}
        
        .status-pending {{
            background: #fff3cd;
            color: #856404;
        }}
        
        .status-rejected {{
            background: #f8d7da;
            color: #721c24;
        }}
        
        .total-row {{
            background: #28a745 !important;
            color: white !important;
            font-weight: 700;
            font-size: 16px;
        }}
        
        .amount-cell {{
            text-align: {'left' if is_arabic else 'right'};
            font-weight: 600;
            font-family: monospace;
        }}
        
        .id-cell {{
            text-align: center;
            font-family: monospace;
            font-weight: 600;
        }}
        
        .date-cell {{
            text-align: center;
            font-family: monospace;
        }}
        
        .print-btn {{
            position: fixed;
            top: 20px;
            {('left' if is_arabic else 'right')}: 20px;
            background: #28a745;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(40,167,69,0.3);
            z-index: 1000;
        }}
        
        .print-btn:hover {{
            background: #218838;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(40,167,69,0.4);
        }}
        
        .metadata {{
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            font-size: 12px;
            color: #666;
            text-align: center;
        }}
        
        @media print {{
            .print-btn {{ display: none; }}
            body {{ 
                background: white !important; 
                padding: 0 !important; 
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }}
            .container {{ 
                box-shadow: none !important; 
                margin: 0 !important; 
                padding: 15px !important; 
                max-width: none !important;
            }}
            
            /* Keep summary grid horizontal in print */
            .summary-grid {{
                display: grid !important;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
                gap: 15px !important;
                margin: 20px 0 !important;
                page-break-inside: avoid !important;
            }}
            
            .summary-card {{
                background: #f8f9fa !important;
                padding: 15px !important;
                border-radius: 6px !important;
                border-{('right' if is_arabic else 'left')}: 3px solid #28a745 !important;
                text-align: center !important;
                page-break-inside: avoid !important;
            }}
            
            .summary-label {{
                font-size: 12px !important;
                color: #666 !important;
                margin-bottom: 6px !important;
            }}
            
            .summary-value {{
                font-size: 18px !important;
                font-weight: 700 !important;
                color: #28a745 !important;
            }}
            
            /* Table print styles */
            .expenses-table {{ 
                page-break-inside: avoid !important;
                width: 100% !important;
                border-collapse: collapse !important;
                margin: 15px 0 !important;
            }}
            
            .expenses-table th {{
                background: #28a745 !important;
                color: white !important;
                padding: 8px 6px !important;
                text-align: center !important;
                font-weight: 600 !important;
                font-size: 11px !important;
                border: 1px solid #dee2e6 !important;
            }}
            
            .expenses-table td {{
                padding: 6px 4px !important;
                border: 1px solid #dee2e6 !important;
                text-align: {text_align} !important;
                font-size: 10px !important;
                vertical-align: top !important;
            }}
            
            .status-badge {{
                padding: 2px 4px !important;
                border-radius: 3px !important;
                font-size: 9px !important;
                font-weight: 600 !important;
            }}
            
            .total-row {{
                background: #28a745 !important;
                color: white !important;
                font-weight: 700 !important;
                font-size: 12px !important;
            }}
            
            .amount-cell {{
                text-align: {'left' if is_arabic else 'right'} !important;
                font-weight: 600 !important;
                font-family: monospace !important;
            }}
            
            .id-cell {{
                text-align: center !important;
                font-family: monospace !important;
                font-weight: 600 !important;
            }}
            
            .date-cell {{
                text-align: center !important;
                font-family: monospace !important;
            }}
            
            /* Header adjustments for print */
            .title {{
                font-size: 24px !important;
                margin: 0 0 8px 0 !important;
            }}
            
            .subtitle {{
                font-size: 12px !important;
                margin: 3px 0 !important;
            }}
            
            .section-title {{
                font-size: 16px !important;
                margin: 25px 0 15px 0 !important;
                padding-bottom: 6px !important;
            }}
            
            .metadata {{
                margin-top: 25px !important;
                padding: 15px !important;
                font-size: 10px !important;
            }}
        }}
        
        @media (max-width: 768px) {{
            .summary-grid {{ grid-template-columns: 1fr; gap: 15px; }}
            .container {{ padding: 20px; }}
            .expenses-table {{ font-size: 11px; }}
            .expenses-table th, .expenses-table td {{ padding: 8px 5px; }}
        }}
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">{t['print']}</button>
    
    <div class="container">
        <div class="header">
            <h1 class="title">{t['expense_report']}</h1>
            <p class="subtitle">{t['generated_on']} {current_date}</p>
            {f'<p class="subtitle">{summary_info.get("description", "")}</p>' if summary_info.get("description") else ''}
        </div>
        
        <h2 class="section-title">{t['report_summary']}</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-label">{t['expense_count']}</div>
                <div class="summary-value">{expense_count:,}</div>
            </div>
            
            <div class="summary-card">
                <div class="summary-label">{t['total_amount']}</div>
                <div class="summary-value">{total_amount:,.2f} {currency}</div>
            </div>
            
'''
    
    # Add optional summary cards
    if summary_info.get("date_range"):
        html += f'''
            <div class="summary-card">
                <div class="summary-label">{t['date_range']}</div>
                <div class="summary-value" style="font-size: 16px;">{summary_info.get("date_range", t["na"])}</div>
            </div>'''
    
    if summary_info.get("cheque_info"):
        html += f'''
            <div class="summary-card">
                <div class="summary-label">{t['by_cheque']}</div>
                <div class="summary-value" style="font-size: 16px;">{summary_info.get("cheque_info", t["na"])}</div>
            </div>'''
    
    html += f'''
        </div>
        
        <h2 class="section-title">{t['expense_details']}</h2>
        <table class="expenses-table">
            <thead>
                <tr>
                    <th>{t['expense_id']}</th>
                    <th>{t['date']}</th>
                    <th>{t['description']}</th>
                    <th>{t['category']}</th>
                    <th>{t['cheque_number']}</th>
                    <th>{t['safe_name']}</th>
                    <th>{t['status']}</th>
                    <th>{t['amount']}</th>
                </tr>
            </thead>
            <tbody>'''
    
    # Add expense rows
    for expense in expenses:
        # Format expense date
        expense_date = 'N/A'
        if expense.get('expense_date'):
            try:
                if isinstance(expense['expense_date'], str):
                    expense_date = datetime.fromisoformat(expense['expense_date'].replace('Z', '+00:00')).strftime('%Y/%m/%d')
                else:
                    expense_date = expense['expense_date'].strftime('%Y/%m/%d')
            except:
                expense_date = str(expense['expense_date'])
        
        # Get status styling
        status = expense.get('status', 'pending').lower()
        status_class = f'status-{status}' if status in ['approved', 'pending', 'rejected'] else 'status-pending'
        
        # Translate status
        status_text = t.get(status, expense.get('status', 'pending').title())
        
        html += f'''
                <tr>
                    <td class="id-cell">#{expense.get('id', 'N/A')}</td>
                    <td class="date-cell">{expense_date}</td>
                    <td>{expense.get('description', t['na'])}</td>
                    <td>{expense.get('category_name', t['na'])}</td>
                    <td class="id-cell">{expense.get('cheque_number', t['na'])}</td>
                    <td>{expense.get('safe_name', t['na'])}</td>
                    <td style="text-align: center;">
                        <span class="status-badge {status_class}">{status_text}</span>
                    </td>
                    <td class="amount-cell">{expense.get('amount', 0):,.2f} {currency}</td>
                </tr>'''
    
    # Add total row
    html += f'''
                <tr class="total-row">
                    <td colspan="7" style="text-align: {'left' if is_arabic else 'right'}; font-size: 16px;">
                        {t['total']}
                    </td>
                    <td class="amount-cell" style="font-size: 18px;">
                        {total_amount:,.2f} {currency}
                    </td>
                </tr>'''
    
    # Close table and add metadata
    html += f'''
            </tbody>
        </table>
        
        <div class="metadata">
            <p>{t['generated_on']} {current_date}</p>
            <p>KBS Cake Studio - Expense Management System</p>
        </div>
    </div>
</body>
</html>'''
    
    return html

def open_expense_summary_in_browser(
    expenses: List[Dict[str, Any]], 
    summary_info: Dict[str, Any] = None,
    language: str = 'ar'
):
    """Generate HTML expense summary and open in browser"""
    if summary_info is None:
        summary_info = {}
        
    html_content = generate_expense_summary_html(expenses, summary_info, language)
    
    # Create temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
        f.write(html_content)
        temp_file = f.name
    
    # Open in browser
    webbrowser.open(f'file://{os.path.abspath(temp_file)}')
    print(f"✅ Expense summary opened in browser: {temp_file}")
    
    return temp_file

def save_expense_summary_html(
    expenses: List[Dict[str, Any]], 
    filename: str,
    summary_info: Dict[str, Any] = None,
    language: str = 'ar'
):
    """Save HTML expense summary to file"""
    if summary_info is None:
        summary_info = {}
        
    html_content = generate_expense_summary_html(expenses, summary_info, language)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"✅ Expense summary saved: {filename}")
    return filename 