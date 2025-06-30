"""Purchase Order HTML Generator

Generates professional HTML documents for purchase orders with supplier details,
item lists, and totals. Much simpler than PDF generation and handles Arabic text naturally.
"""

from datetime import datetime
from typing import Dict, Any
import os
import webbrowser
import tempfile

def translate_status(status: str, lang: str) -> str:
    """Translate status to specified language"""
    translations = {
        'ar': {
            'pending': 'معلق',
            'draft': 'مسودة',
            'received': 'مستلم',
            'cancelled': 'ملغي',
            'paid': 'مدفوع'
        },
        'en': {
            'pending': 'Pending',
            'draft': 'Draft', 
            'received': 'Received',
            'cancelled': 'Cancelled',
            'paid': 'Paid'
        }
    }
    return translations.get(lang, {}).get(status.lower(), status)

def translate_payment_status(status: str, lang: str) -> str:
    """Translate payment status to specified language"""
    translations = {
        'ar': {
            'unpaid': 'غير مدفوع',
            'paid': 'مدفوع'
        },
        'en': {
            'unpaid': 'Unpaid',
            'paid': 'Paid'
        }
    }
    return translations.get(lang, {}).get(status.lower(), status.title())

def generate_purchase_order_html(po_data: Dict[str, Any], language: str = 'ar') -> str:
    """
    Generate an HTML purchase order that can be opened in browser and printed
    
    Args:
        po_data: Dictionary containing purchase order details
        language: 'ar' for Arabic, 'en' for English
    
    Returns:
        str: HTML content
    """
    
    # Determine text direction and alignment
    text_dir = "rtl" if language == 'ar' else "ltr"
    text_align = "right" if language == 'ar' else "left"
    
    # Company info with fallbacks
    company_info = po_data.get('company_info', {})
    if company_info:
        company_name = company_info.get('name', 'Your Company Name')
        company_address = company_info.get('address', '')
        company_phone = company_info.get('phone', '')
        company_email = company_info.get('email', '')
    else:
        if language == 'ar':
            company_name = "استوديو كيك KBS"
            company_address = "العنوان: شارع الرئيسي، المدينة"
            company_phone = "+123 456 7890"
            company_email = "orders@kbscakestudio.com"
        else:
            company_name = "KBS Cake Studio"
            company_address = "Main Street, City"
            company_phone = "+123 456 7890"
            company_email = "orders@kbscakestudio.com"
    
    # Format dates
    order_date = datetime.fromisoformat(po_data['order_date'].replace('Z', '+00:00')).strftime('%Y/%m/%d')
    expected_date = datetime.fromisoformat(po_data.get('expected_date', po_data['order_date']).replace('Z', '+00:00')).strftime('%Y/%m/%d') if po_data.get('expected_date') else ('غير محدد' if language == 'ar' else 'N/A')
    
    # Start building HTML
    html = f"""
<!DOCTYPE html>
<html dir="{text_dir}" lang="{language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{"أمر شراء" if language == 'ar' else "Purchase Order"} #{po_data['id']}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap');
        
        body {{
            font-family: {'Cairo, Amiri' if language == 'ar' else 'Arial, sans-serif'};
            direction: {text_dir};
            margin: 20px;
            line-height: 1.6;
            color: #333;
        }}
        
        .container {{
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }}
        
        .header {{
            text-align: center;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        
        .company-name {{
            font-size: 28px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0;
        }}
        
        .company-details {{
            font-size: 14px;
            color: #666;
            margin: 10px 0;
        }}
        
        .po-title {{
            font-size: 24px;
            font-weight: 700;
            color: #007bff;
            text-align: center;
            margin: 20px 0;
        }}
        
        .info-section {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 30px 0;
        }}
        
        .info-box {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
        }}
        
        .info-title {{
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 5px;
        }}
        
        .info-row {{
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
        }}
        
        .info-label {{
            font-weight: 600;
            color: #555;
        }}
        
        .info-value {{
            color: #333;
        }}
        
        .items-section {{
            margin: 30px 0;
        }}
        
        .section-title {{
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 2px solid #007bff;
        }}
        
        .items-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        
        .items-table th {{
            background: #007bff;
            color: white;
            padding: 12px;
            text-align: center;
            font-weight: 600;
        }}
        
        .items-table td {{
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
            text-align: {text_align};
        }}
        
        .items-table tr:nth-child(even) {{
            background: #f8f9fa;
        }}
        
        .items-table tr:hover {{
            background: #e3f2fd;
        }}
        
        .total-section {{
            margin: 30px 0;
            text-align: {'left' if language == 'ar' else 'right'};
        }}
        
        .total-table {{
            {'float: left' if language == 'ar' else 'float: right'};
            border-collapse: collapse;
            min-width: 300px;
        }}
        
        .total-table td {{
            padding: 10px 15px;
            border: 1px solid #dee2e6;
        }}
        
        .total-label {{
            background: #f8f9fa;
            font-weight: 600;
            text-align: {'left' if language == 'ar' else 'right'};
        }}
        
        .total-amount {{
            text-align: {'right' if language == 'ar' else 'left'};
            font-weight: 600;
        }}
        
        .grand-total {{
            background: #28a745 !important;
            color: white !important;
            font-size: 16px;
            font-weight: 700;
        }}
        
        .terms {{
            margin-top: 50px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            font-size: 12px;
            color: #666;
            text-align: center;
        }}
        
        .print-button {{
            position: fixed;
            top: 20px;
            {'left' if language == 'ar' else 'right'}: 20px;
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
        }}
        
        .print-button:hover {{
            background: #0056b3;
        }}
        
        @media print {{
            .print-button {{
                display: none;
            }}
            .container {{
                box-shadow: none;
                margin: 0;
                padding: 0;
            }}
            body {{
                margin: 0;
            }}
        }}
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">{'طباعة' if language == 'ar' else 'Print'}</button>
    
    <div class="container">
        <div class="header">
            <h1 class="company-name">{company_name}</h1>
            {f'<p class="company-details">{company_address}</p>' if company_address else ''}
            {f'<p class="company-details">{"هاتف:" if language == "ar" else "Tel:"} {company_phone} | {"بريد إلكتروني:" if language == "ar" else "Email:"} {company_email}</p>' if company_phone or company_email else ''}
        </div>
        
        <h2 class="po-title">
            {'أمر شراء رقم' if language == 'ar' else 'PURCHASE ORDER'} #{po_data['id']}
        </h2>
        
        <div class="info-section">
            <div class="info-box">
                <h3 class="info-title">{'معلومات الطلب' if language == 'ar' else 'Order Information'}</h3>
                <div class="info-row">
                    <span class="info-label">{'تاريخ الطلب:' if language == 'ar' else 'Order Date:'}</span>
                    <span class="info-value">{order_date}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">{'التاريخ المتوقع:' if language == 'ar' else 'Expected Date:'}</span>
                    <span class="info-value">{expected_date}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">{'الحالة:' if language == 'ar' else 'Status:'}</span>
                    <span class="info-value">{translate_status(po_data['status'], language)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">{'حالة الدفع:' if language == 'ar' else 'Payment Status:'}</span>
                    <span class="info-value">{translate_payment_status(po_data.get('payment_status', 'unpaid'), language)}</span>
                </div>
                {f'''<div class="info-row">
                    <span class="info-label">{'التسليم إلى:' if language == 'ar' else 'Deliver To:'}</span>
                    <span class="info-value">{po_data['warehouse']['name']} - {po_data['warehouse'].get('location', '')}</span>
                </div>''' if po_data.get('warehouse') else ''}
            </div>
            
            <div class="info-box">
                <h3 class="info-title">{'معلومات المورد' if language == 'ar' else 'Supplier Information'}</h3>
                <div class="info-row">
                    <span class="info-label">{'المورد:' if language == 'ar' else 'Supplier:'}</span>
                    <span class="info-value">{po_data['supplier']['name']}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">{'جهة الاتصال:' if language == 'ar' else 'Contact:'}</span>
                    <span class="info-value">{po_data['supplier'].get('contact_name', 'غير محدد' if language == 'ar' else 'N/A')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">{'الهاتف:' if language == 'ar' else 'Phone:'}</span>
                    <span class="info-value">{po_data['supplier'].get('phone', 'غير محدد' if language == 'ar' else 'N/A')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">{'البريد الإلكتروني:' if language == 'ar' else 'Email:'}</span>
                    <span class="info-value">{po_data['supplier'].get('email', 'غير محدد' if language == 'ar' else 'N/A')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">{'العنوان:' if language == 'ar' else 'Address:'}</span>
                    <span class="info-value">{po_data['supplier'].get('address', 'غير محدد' if language == 'ar' else 'N/A')}</span>
                </div>
            </div>
        </div>
        
        <div class="items-section">
            <h3 class="section-title">{'بنود الطلب' if language == 'ar' else 'Order Items'}</h3>
            <table class="items-table">
                <thead>
                    <tr>
"""
    
    # Add table headers based on language
    if language == 'ar':
        html += """
                        <th>الإجمالي</th>
                        <th>سعر الوحدة</th>
                        <th>الوحدة</th>
                        <th>الكمية</th>
                        <th>وصف الصنف</th>
                        <th>#</th>
"""
    else:
        html += """
                        <th>#</th>
                        <th>Item Description</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Unit Price</th>
                        <th>Total</th>
"""
    
    html += """
                    </tr>
                </thead>
                <tbody>
"""
    
    # Add items
    for idx, item in enumerate(po_data['items'], 1):
        if language == 'ar':
            html += f"""
                    <tr>
                        <td>{item['total_price']:,.2f} ج.م</td>
                        <td>{item['unit_price']:,.2f} ج.م</td>
                        <td>{item.get('unit', 'وحدة')}</td>
                        <td>{item['quantity_ordered']:,.2f}</td>
                        <td>{item['item_name']}</td>
                        <td>{idx}</td>
                    </tr>
"""
        else:
            html += f"""
                    <tr>
                        <td>{idx}</td>
                        <td>{item['item_name']}</td>
                        <td>{item['quantity_ordered']:,.2f}</td>
                        <td>{item.get('unit', 'unit')}</td>
                        <td>${item['unit_price']:,.2f}</td>
                        <td>${item['total_price']:,.2f}</td>
                    </tr>
"""
    
    # Close items table and add totals
    currency = "ج.م" if language == 'ar' else "$"
    html += f"""
                </tbody>
            </table>
        </div>
        
        <div class="total-section">
            <table class="total-table">
                <tr>
                    <td class="total-label">{'المجموع الفرعي:' if language == 'ar' else 'Subtotal:'}</td>
                    <td class="total-amount">{po_data['total_amount']:,.2f} {currency}</td>
                </tr>
                <tr>
                    <td class="total-label">{'الضريبة:' if language == 'ar' else 'Tax:'}</td>
                    <td class="total-amount">0.00 {currency}</td>
                </tr>
                <tr class="grand-total">
                    <td class="total-label">{'الإجمالي:' if language == 'ar' else 'TOTAL:'}</td>
                    <td class="total-amount">{po_data['total_amount']:,.2f} {currency}</td>
                </tr>
            </table>
            <div style="clear: both;"></div>
        </div>
"""
    
    # Add notes if provided
    if po_data.get('notes'):
        html += f"""
        <div class="items-section">
            <h3 class="section-title">{'ملاحظات' if language == 'ar' else 'Notes'}</h3>
            <div style="padding: 15px; background: #f8f9fa; border-radius: 8px;">
                {po_data['notes']}
            </div>
        </div>
"""
    
    # Add terms and close HTML
    terms_text = """
        أمر الشراء هذا يخضع للشروط والأحكام الخاصة باتفاقية الشراء.
        يرجى تسليم البضائع إلى المستودع المحدد في التاريخ المتوقع.
    """ if language == 'ar' else """
        This purchase order is subject to the terms and conditions of the purchasing agreement.
        Please deliver items to the specified warehouse by the expected date.
    """
    
    html += f"""
        <div class="terms">
            {terms_text}
        </div>
    </div>
</body>
</html>
"""
    
    return html

def open_purchase_order_in_browser(po_data: Dict[str, Any], language: str = 'ar'):
    """
    Generate HTML purchase order and open it in the default browser
    """
    html_content = generate_purchase_order_html(po_data, language)
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
        f.write(html_content)
        temp_file = f.name
    
    # Open in browser
    webbrowser.open(f'file://{temp_file}')
    
    return temp_file

def save_purchase_order_html(po_data: Dict[str, Any], filename: str, language: str = 'ar'):
    """
    Generate and save HTML purchase order to file
    """
    html_content = generate_purchase_order_html(po_data, language)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return filename 