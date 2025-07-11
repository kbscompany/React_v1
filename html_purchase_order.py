"""HTML Purchase Order Generator

Simple, clean HTML generation for purchase orders with proper Arabic support.
No complex dependencies - just HTML, CSS, and natural text handling.
"""

from datetime import datetime
from typing import Dict, Any
import webbrowser
import tempfile
import os

def generate_purchase_order_html(po_data: Dict[str, Any], language: str = 'ar') -> str:
    """Generate clean HTML for purchase order"""
    
    # Basic setup
    is_arabic = language == 'ar'
    direction = "rtl" if is_arabic else "ltr"
    text_align = "right" if is_arabic else "left"
    
    # Company info
    company_info = po_data.get('company_info', {})
    company_name = company_info.get('name', "استوديو كيك KBS" if is_arabic else "KBS Cake Studio")
    company_address = company_info.get('address', "")
    company_phone = company_info.get('phone', "+123 456 7890")
    company_email = company_info.get('email', "orders@kbscakestudio.com")
    
    # Format dates
    order_date = datetime.fromisoformat(po_data['order_date'].replace('Z', '+00:00')).strftime('%Y/%m/%d')
    expected_date_str = po_data.get('expected_date', po_data['order_date'])
    expected_date = datetime.fromisoformat(expected_date_str.replace('Z', '+00:00')).strftime('%Y/%m/%d') if expected_date_str else ('غير محدد' if is_arabic else 'N/A')
    
    # Translations
    labels = {
        'ar': {
            'title': f"أمر شراء رقم #{po_data['id']}",
            'order_info': 'معلومات الطلب',
            'supplier_info': 'معلومات المورد',
            'order_items': 'بنود الطلب',
            'order_date': 'تاريخ الطلب:',
            'expected_date': 'التاريخ المتوقع:',
            'status': 'الحالة:',
            'payment_status': 'حالة الدفع:',
            'deliver_to': 'التسليم إلى:',
            'supplier': 'المورد:',
            'contact': 'جهة الاتصال:',
            'phone': 'الهاتف:',
            'email': 'البريد الإلكتروني:',
            'address': 'العنوان:',
            'total_col': 'الإجمالي',
            'unit_price_col': 'سعر الوحدة',
            'unit_col': 'الوحدة',
            'quantity_col': 'الكمية',
            'item_col': 'وصف الصنف',
            'number_col': '#',
            'subtotal': 'المجموع الفرعي:',
            'tax': 'الضريبة:',
            'total': 'الإجمالي:',
            'print': 'طباعة',
            'terms': 'أمر الشراء هذا يخضع للشروط والأحكام الخاصة باتفاقية الشراء. يرجى تسليم البضائع إلى المستودع المحدد في التاريخ المتوقع.',
            'na': 'غير محدد'
        },
        'en': {
            'title': f"PURCHASE ORDER #{po_data['id']}",
            'order_info': 'Order Information',
            'supplier_info': 'Supplier Information',
            'order_items': 'Order Items',
            'order_date': 'Order Date:',
            'expected_date': 'Expected Date:',
            'status': 'Status:',
            'payment_status': 'Payment Status:',
            'deliver_to': 'Deliver To:',
            'supplier': 'Supplier:',
            'contact': 'Contact:',
            'phone': 'Phone:',
            'email': 'Email:',
            'address': 'Address:',
            'number_col': '#',
            'item_col': 'Item Description',
            'quantity_col': 'Quantity',
            'unit_col': 'Unit',
            'unit_price_col': 'Unit Price',
            'total_col': 'Total',
            'subtotal': 'Subtotal:',
            'tax': 'Tax:',
            'total': 'TOTAL:',
            'print': 'Print',
            'terms': 'This purchase order is subject to the terms and conditions of the purchasing agreement. Please deliver items to the specified warehouse by the expected date.',
            'na': 'N/A'
        }
    }
    
    t = labels[language]
    currency = "ج.م" if is_arabic else "$"
    
    # Generate HTML
    html = f"""<!DOCTYPE html>
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
            padding: 10px;
            line-height: 1.4;
            color: #333;
            background: #f5f5f5;
            font-size: 12px;
        }}
        
        .container {{
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 15px;
            border-radius: 6px;
            box-shadow: 0 1px 5px rgba(0,0,0,0.1);
        }}
        
        .header {{
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }}
        
        .company-name {{
            font-size: 20px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 5px 0;
        }}
        
        .company-details {{
            font-size: 11px;
            color: #666;
            margin: 3px 0;
        }}
        
        .po-title {{
            font-size: 16px;
            font-weight: 700;
            color: #007bff;
            text-align: center;
            margin: 10px 0;
        }}
        
        .info-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 15px 0;
        }}
        
        .info-box {{
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            border-{('right' if is_arabic else 'left')}: 3px solid #007bff;
        }}
        
        .info-title {{
            font-size: 13px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 3px;
        }}
        
        .info-row {{
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
            padding: 2px 0;
            font-size: 11px;
        }}
        
        .info-label {{
            font-weight: 600;
            color: #555;
            flex: 0 0 40%;
        }}
        
        .info-value {{
            color: #333;
            flex: 1;
            text-align: {text_align};
        }}
        
        .section-title {{
            font-size: 14px;
            font-weight: 600;
            color: #333;
            margin: 15px 0 8px 0;
            padding-bottom: 3px;
            border-bottom: 2px solid #007bff;
        }}
        
        .items-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            box-shadow: 0 1px 4px rgba(0,0,0,0.1);
            border-radius: 6px;
            overflow: hidden;
        }}
        
        .items-table th {{
            background: #007bff;
            color: white;
            padding: 8px 6px;
            text-align: center;
            font-weight: 600;
            font-size: 11px;
        }}
        
        .items-table td {{
            padding: 6px;
            border-bottom: 1px solid #dee2e6;
            text-align: {text_align};
            font-size: 11px;
        }}
        
        /* Column-specific alignment */
        .items-table td:nth-child(1) {{ text-align: center; }}   /* Number */
        .items-table td:nth-child(2) {{ text-align: {'right' if is_arabic else 'left'}; }}   /* Item name */
        .items-table td:nth-child(3) {{ text-align: center; }}   /* Quantity */
        .items-table td:nth-child(4) {{ text-align: center; }}   /* Unit */
        .items-table td:nth-child(5) {{ text-align: {'right' if is_arabic else 'right'}; }}  /* Unit Price */
        .items-table td:nth-child(6) {{ text-align: {'right' if is_arabic else 'right'}; }}  /* Total */
        
        .items-table tbody tr:nth-child(even) {{
            background: #f8f9fa;
        }}
        
        .items-table tbody tr:hover {{
            background: #e3f2fd;
        }}
        
        .total-section {{
            margin: 15px 0;
            display: flex;
            justify-content: {'flex-start' if is_arabic else 'flex-end'};
        }}
        
        .total-table {{
            border-collapse: collapse;
            min-width: 250px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.1);
            border-radius: 6px;
            overflow: hidden;
        }}
        
        .total-table td {{
            padding: 6px 12px;
            border-bottom: 1px solid #dee2e6;
            font-size: 11px;
        }}
        
        .total-label {{
            background: #f8f9fa;
            font-weight: 600;
            text-align: {text_align};
            width: 60%;
        }}
        
        .total-amount {{
            text-align: {'left' if is_arabic else 'right'};
            font-weight: 600;
            width: 40%;
        }}
        
        .grand-total {{
            background: #28a745 !important;
            color: white !important;
            font-size: 13px;
            font-weight: 700;
        }}
        
        .terms {{
            margin-top: 20px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 6px;
            font-size: 10px;
            color: #666;
            text-align: center;
            line-height: 1.5;
        }}
        
        .print-btn {{
            position: fixed;
            top: 20px;
            {('left' if is_arabic else 'right')}: 20px;
            background: #007bff;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0,123,255,0.3);
            z-index: 1000;
        }}
        
        .print-btn:hover {{
            background: #0056b3;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,123,255,0.4);
        }}
        
        @media print {{
            .print-btn {{ display: none; }}
            body {{ background: white; padding: 0; font-size: 10px; }}
            .container {{ box-shadow: none; margin: 0; padding: 5px; }}
            .header {{ 
                margin-bottom: 8px; 
                padding-bottom: 6px; 
            }}
            .company-name {{ 
                font-size: 18px; 
            }}
            .po-title {{ 
                font-size: 14px; 
                margin: 6px 0; 
            }}
            .info-grid {{ 
                margin: 8px 0; 
                gap: 10px; 
            }}
            .info-box {{ 
                padding: 8px; 
            }}
            .info-title {{ 
                font-size: 11px; 
                margin-bottom: 5px; 
            }}
            .info-row {{ 
                margin: 2px 0; 
                font-size: 9px; 
            }}
            .section-title {{ 
                font-size: 12px; 
                margin: 8px 0 5px 0; 
            }}
            .items-table {{ 
                margin: 8px 0; 
            }}
            .items-table th {{ 
                padding: 4px 3px; 
                font-size: 9px; 
            }}
            .items-table td {{ 
                padding: 3px; 
                font-size: 9px; 
            }}
            .total-section {{ 
                margin: 8px 0; 
            }}
            .total-table td {{ 
                padding: 3px 8px; 
                font-size: 9px; 
            }}
            .grand-total {{ 
                font-size: 11px; 
            }}
            .terms {{ 
                margin-top: 10px; 
                padding: 6px; 
                font-size: 8px; 
            }}
        }}
        
        @media (max-width: 768px) {{
            .info-grid {{ grid-template-columns: 1fr; gap: 20px; }}
            .container {{ padding: 20px; }}
            .items-table {{ font-size: 12px; }}
            .items-table th, .items-table td {{ padding: 8px 6px; }}
        }}
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">{t['print']}</button>
    
    <div class="container">
        <div class="header">
            <h1 class="company-name">{company_name}</h1>
            {f'<p class="company-details">{company_address}</p>' if company_address else ''}
            <p class="company-details">{company_phone} | {company_email}</p>
        </div>
        
        <h2 class="po-title">{t['title']}</h2>
        
        <div class="info-grid">
            <div class="info-box">
                <h3 class="info-title">{t['order_info']}</h3>
                <div class="info-row">
                    <span class="info-label">{t['order_date']}</span>
                    <span class="info-value">{order_date}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">{t['expected_date']}</span>
                    <span class="info-value">{expected_date}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">{t['status']}</span>
                    <span class="info-value">{po_data['status']}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">{t['payment_status']}</span>
                    <span class="info-value">{po_data.get('payment_status', 'unpaid')}</span>
                </div>"""
    
    # Add warehouse info if available
    if po_data.get('warehouse'):
        warehouse = po_data['warehouse']
        warehouse_info = f"{warehouse['name']} - {warehouse.get('location', '')}"
        html += f"""
                <div class="info-row">
                    <span class="info-label">{t['deliver_to']}</span>
                    <span class="info-value">{warehouse_info}</span>
                </div>"""
    
    # Supplier information
    supplier = po_data['supplier']
    html += f"""
            </div>
            
            <div class="info-box">
                <h3 class="info-title">{t['supplier_info']}</h3>
                <div class="info-row">
                    <span class="info-label">{t['supplier']}</span>
                    <span class="info-value">{supplier['name']}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">{t['contact']}</span>
                    <span class="info-value">{supplier.get('contact_name', t['na'])}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">{t['phone']}</span>
                    <span class="info-value">{supplier.get('phone', t['na'])}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">{t['email']}</span>
                    <span class="info-value">{supplier.get('email', t['na'])}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">{t['address']}</span>
                    <span class="info-value">{supplier.get('address', t['na'])}</span>
                </div>
            </div>
        </div>
        
        <h3 class="section-title">{t['order_items']}</h3>
        <table class="items-table">
            <thead>
                <tr>"""
    
    # Table headers - Arabic should be RTL order
    if is_arabic:
        html += f"""
                    <th>{t['number_col']}</th>
                    <th>{t['item_col']}</th>
                    <th>{t['quantity_col']}</th>
                    <th>{t['unit_col']}</th>
                    <th>{t['unit_price_col']}</th>
                    <th>{t['total_col']}</th>"""
    else:
        html += f"""
                    <th>{t['number_col']}</th>
                    <th>{t['item_col']}</th>
                    <th>{t['quantity_col']}</th>
                    <th>{t['unit_col']}</th>
                    <th>{t['unit_price_col']}</th>
                    <th>{t['total_col']}</th>"""
    
    html += """
                </tr>
            </thead>
            <tbody>"""
    
    # Table rows - match the header order
    for idx, item in enumerate(po_data['items'], 1):
        if is_arabic:
            html += f"""
                <tr>
                    <td>{idx}</td>
                    <td>{item['item_name']}</td>
                    <td>{item['quantity_ordered']:,.2f}</td>
                    <td>{item.get('unit', 'وحدة')}</td>
                    <td>{item['unit_price']:,.2f} {currency}</td>
                    <td>{item['total_price']:,.2f} {currency}</td>
                </tr>"""
        else:
            html += f"""
                <tr>
                    <td>{idx}</td>
                    <td>{item['item_name']}</td>
                    <td>{item['quantity_ordered']:,.2f}</td>
                    <td>{item.get('unit', 'unit')}</td>
                    <td>{currency}{item['unit_price']:,.2f}</td>
                    <td>{currency}{item['total_price']:,.2f}</td>
                </tr>"""
    
    # Totals section
    html += f"""
            </tbody>
        </table>
        
        <div class="total-section">
            <table class="total-table">
                <tr>
                    <td class="total-label">{t['subtotal']}</td>
                    <td class="total-amount">{po_data['total_amount']:,.2f} {currency}</td>
                </tr>
                <tr>
                    <td class="total-label">{t['tax']}</td>
                    <td class="total-amount">0.00 {currency}</td>
                </tr>
                <tr class="grand-total">
                    <td class="total-label">{t['total']}</td>
                    <td class="total-amount">{po_data['total_amount']:,.2f} {currency}</td>
                </tr>
            </table>
        </div>"""
    
    # Notes section
    if po_data.get('notes'):
        html += f"""
        <h3 class="section-title">{'ملاحظات' if is_arabic else 'Notes'}</h3>
        <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 20px 0;">
            {po_data['notes']}
        </div>"""
    
    # Terms and footer
    html += f"""
        <div class="terms">
            {t['terms']}
        </div>
    </div>
</body>
</html>"""
    
    return html

def open_purchase_order_in_browser(po_data: Dict[str, Any], language: str = 'ar'):
    """Generate HTML and open in browser"""
    html_content = generate_purchase_order_html(po_data, language)
    
    # Create temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
        f.write(html_content)
        temp_file = f.name
    
    # Open in browser
    webbrowser.open(f'file://{os.path.abspath(temp_file)}')
    print(f"✅ Purchase order opened in browser: {temp_file}")
    
    return temp_file

def save_purchase_order_html(po_data: Dict[str, Any], filename: str, language: str = 'ar'):
    """Save HTML to file"""
    html_content = generate_purchase_order_html(po_data, language)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"✅ Purchase order saved: {filename}")
    return filename 