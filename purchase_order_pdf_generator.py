"""Purchase Order PDF Generator

Generates professional PDF documents for purchase orders with supplier details,
item lists, and totals.
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
import os
import io
import glob
from typing import Dict, Any, List

# Arabic text processing
try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    ARABIC_SUPPORT = True
except ImportError:
    ARABIC_SUPPORT = False
    print("⚠️ Arabic text processing libraries not available")

# Register fonts for better Unicode support
FONTS_DIR = os.path.join(os.path.dirname(__file__), "fonts")
AMIRI_AVAILABLE = False

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

def register_fonts():
    """Register custom fonts for the PDF"""
    global AMIRI_AVAILABLE
    AMIRI_AVAILABLE = False
    
    try:
        # First, check if fonts directory exists
        if not os.path.exists(FONTS_DIR):
            print(f"⚠️ Fonts directory not found: {FONTS_DIR}")
            return
        
        # Try to register Amiri fonts with better error handling
        amiri_bold_path = os.path.join(FONTS_DIR, "Amiri-Bold.ttf")
        if os.path.exists(amiri_bold_path):
            try:
                # Check file size to ensure it's valid
                file_size = os.path.getsize(amiri_bold_path)
                if file_size > 1000:  # Font should be larger than 1KB
                    # Register with explicit encoding
                    pdfmetrics.registerFont(TTFont('Amiri-Bold', amiri_bold_path, validate=True))
                    pdfmetrics.registerFont(TTFont('Amiri-Regular', amiri_bold_path, validate=True))
                    AMIRI_AVAILABLE = True
                    print(f"✅ Successfully registered Amiri fonts (size: {file_size:,} bytes)")
                else:
                    print(f"❌ Font file too small: {file_size} bytes")
            except Exception as e:
                print(f"❌ Failed to register Amiri fonts: {e}")
                AMIRI_AVAILABLE = False
        else:
            print(f"❌ Amiri-Bold.ttf not found at {amiri_bold_path}")
        
        # Register fallback fonts
        noto_path = os.path.join(FONTS_DIR, "NotoSansArabic-Regular.ttf")
        if os.path.exists(noto_path):
            try:
                file_size = os.path.getsize(noto_path)
                if file_size > 1000:
                    pdfmetrics.registerFont(TTFont('NotoSansArabic', noto_path, validate=True))
                    print(f"✅ Registered NotoSansArabic as fallback (size: {file_size:,} bytes)")
            except Exception as e:
                print(f"⚠️ Could not register NotoSansArabic: {e}")
        
        # Test the registered fonts
        registered = pdfmetrics.getRegisteredFontNames()
        print(f"Available fonts after registration: {[f for f in registered if 'Amiri' in f or 'Noto' in f]}")
                
    except Exception as e:
        print(f"❌ Font registration failed: {e}")
        AMIRI_AVAILABLE = False

def get_arabic_font(bold=False):
    """Get the best available Arabic font"""
    try:
        registered_fonts = pdfmetrics.getRegisteredFontNames()
        
        if bold:
            if 'Amiri-Bold' in registered_fonts:
                return 'Amiri-Bold'
            elif 'NotoSansArabic' in registered_fonts:
                return 'NotoSansArabic'
            else:
                # Use DejaVu fonts if available (better Unicode support)
                return 'DejaVuSans-Bold' if 'DejaVuSans-Bold' in registered_fonts else 'Helvetica-Bold'
        else:
            if 'Amiri-Regular' in registered_fonts:
                return 'Amiri-Regular'
            elif 'Amiri-Bold' in registered_fonts:
                return 'Amiri-Bold'
            elif 'NotoSansArabic' in registered_fonts:
                return 'NotoSansArabic'
            else:
                return 'DejaVuSans' if 'DejaVuSans' in registered_fonts else 'Helvetica'
    except:
        return 'Helvetica-Bold' if bold else 'Helvetica'

def ensure_unicode_text(text):
    """Ensure text is properly encoded for PDF generation"""
    if isinstance(text, str):
        # Make sure we have proper Unicode string
        return text.encode('utf-8').decode('utf-8')
    return str(text)

def process_arabic_text(text):
    """Process Arabic text for proper display in PDF"""
    if not isinstance(text, str):
        text = str(text)
    
    # Check if text contains Arabic characters
    has_arabic = any('\u0600' <= char <= '\u06FF' for char in text)
    
    if has_arabic and ARABIC_SUPPORT:
        try:
            # Reshape Arabic text to connect letters properly
            reshaped_text = arabic_reshaper.reshape(text)
            # Apply bidirectional algorithm for proper display
            display_text = get_display(reshaped_text)
            return display_text
        except Exception as e:
            print(f"⚠️ Arabic text processing failed for '{text}': {e}")
            return ensure_unicode_text(text)
    else:
        return ensure_unicode_text(text)

def generate_purchase_order_pdf(po_data: Dict[str, Any], language: str = 'ar') -> bytes:
    """
    Generate a PDF for a purchase order
    
    Args:
        po_data: Dictionary containing purchase order details with structure:
            {
                "id": int,
                "order_date": str,
                "expected_date": str,
                "status": str,
                "payment_status": str,
                "total_amount": float,
                "supplier": {
                    "name": str,
                    "contact_name": str,
                    "phone": str,
                    "email": str,
                    "address": str
                },
                "warehouse": {
                    "name": str,
                    "location": str
                },
                "items": [
                    {
                        "item_name": str,
                        "quantity_ordered": float,
                        "unit": str,
                        "unit_price": float,
                        "total_price": float
                    }
                ],
                "company_info": {
                    "name": str,
                    "address": str,
                    "phone": str,
                    "email": str,
                    "logo_path": str (optional)
                }
            }
    
    Returns:
        bytes: PDF content
    """
    # Register fonts
    register_fonts()
    
    # Create PDF buffer
    buffer = io.BytesIO()
    
    # Create document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.5*inch,
        leftMargin=0.5*inch,
        topMargin=0.75*inch,
        bottomMargin=0.5*inch
    )
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'  # Default font, will be updated for Arabic
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#333333'),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Amiri-Regular'  # Default font, will be updated for Arabic
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#444444'),
        spaceAfter=6,
        fontName='Amiri-Regular'  # Default font, will be updated for Arabic
    )
    
    # Header section
    header_data = []
    
    # Company info (if provided) - with fallback for Arabic
    company_info = po_data.get('company_info', {})
    if company_info:
        company_name = company_info.get('name', 'Your Company Name')
        company_address = company_info.get('address', '')
        company_phone = company_info.get('phone', '')
        company_email = company_info.get('email', '')
    else:
        # Default company info for Arabic context
        if language == 'ar':
            company_name = process_arabic_text("استوديو كيك KBS")
            company_address = process_arabic_text("العنوان: شارع الرئيسي، المدينة")
            company_phone = "+123 456 7890"
            company_email = "orders@kbscakestudio.com"
        else:
            company_name = "KBS Cake Studio"
            company_address = "Main Street, City"
            company_phone = "+123 456 7890"
            company_email = "orders@kbscakestudio.com"
    
    # Add company header
    elements.append(Paragraph(company_name, title_style))
    if company_address:
        elements.append(Paragraph(company_address, normal_style))
    if company_phone or company_email:
        if language == 'ar':
            contact_info = f"هاتف: {company_phone}" if company_phone else ""
            if company_email:
                contact_info += f" | بريد إلكتروني: {company_email}" if contact_info else f"بريد إلكتروني: {company_email}"
        else:
            contact_info = f"Tel: {company_phone}" if company_phone else ""
            if company_email:
                contact_info += f" | Email: {company_email}" if contact_info else f"Email: {company_email}"
        elements.append(Paragraph(contact_info, normal_style))
    
    elements.append(Spacer(1, 0.3*inch))
    
    # Purchase Order Title
    if language == 'ar':
        po_title = process_arabic_text(f"أمر شراء رقم #{po_data['id']}")
        # Use best available Arabic fonts
        title_style.fontName = get_arabic_font(bold=True)
        heading_style.fontName = get_arabic_font(bold=True)
        normal_style.fontName = get_arabic_font(bold=False)
        print(f"✅ Applied Arabic fonts: title={title_style.fontName}, heading={heading_style.fontName}, normal={normal_style.fontName}")
        print(f"✅ Processed title text: '{po_title}'")
    else:
        po_title = f"PURCHASE ORDER #{po_data['id']}"
    
    elements.append(Paragraph(po_title, title_style))
    
    # Order Info Section
    if language == 'ar':
        order_info_data = [
            [process_arabic_text('تاريخ الطلب:'), datetime.fromisoformat(po_data['order_date'].replace('Z', '+00:00')).strftime('%Y/%m/%d')],
            [process_arabic_text('التاريخ المتوقع:'), datetime.fromisoformat(po_data.get('expected_date', po_data['order_date']).replace('Z', '+00:00')).strftime('%Y/%m/%d') if po_data.get('expected_date') else process_arabic_text('غير محدد')],
            [process_arabic_text('الحالة:'), process_arabic_text(translate_status(po_data['status'], 'ar'))],
            [process_arabic_text('حالة الدفع:'), process_arabic_text(translate_payment_status(po_data.get('payment_status', 'unpaid'), 'ar'))],
        ]
        
        if po_data.get('warehouse'):
            order_info_data.append([process_arabic_text('التسليم إلى:'), f"{po_data['warehouse']['name']} - {po_data['warehouse'].get('location', '')}"])
    else:
        order_info_data = [
            ['Order Date:', datetime.fromisoformat(po_data['order_date'].replace('Z', '+00:00')).strftime('%B %d, %Y')],
            ['Expected Date:', datetime.fromisoformat(po_data.get('expected_date', po_data['order_date']).replace('Z', '+00:00')).strftime('%B %d, %Y') if po_data.get('expected_date') else 'N/A'],
            ['Status:', po_data['status']],
            ['Payment Status:', po_data.get('payment_status', 'Unpaid').title()],
        ]
        
        if po_data.get('warehouse'):
            order_info_data.append(['Deliver To:', f"{po_data['warehouse']['name']} - {po_data['warehouse'].get('location', '')}"])
    
    order_info_table = Table(order_info_data, colWidths=[2*inch, 4*inch])
    
    if language == 'ar':
        order_info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), get_arabic_font(bold=False)),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), get_arabic_font(bold=True)),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#555555')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
    else:
        order_info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Amiri-Regular'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), 'Amiri-Bold'),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#555555')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
    
    elements.append(order_info_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Supplier Information
    if language == 'ar':
        elements.append(Paragraph(process_arabic_text("معلومات المورد"), heading_style))
        
        supplier = po_data['supplier']
        supplier_data = [
            [process_arabic_text('المورد:'), supplier['name']],
            [process_arabic_text('جهة الاتصال:'), supplier.get('contact_name', process_arabic_text('غير محدد'))],
            [process_arabic_text('الهاتف:'), supplier.get('phone', process_arabic_text('غير محدد'))],
            [process_arabic_text('البريد الإلكتروني:'), supplier.get('email', process_arabic_text('غير محدد'))],
            [process_arabic_text('العنوان:'), supplier.get('address', process_arabic_text('غير محدد'))],
        ]
    else:
        elements.append(Paragraph("SUPPLIER INFORMATION", heading_style))
        
        supplier = po_data['supplier']
        supplier_data = [
            ['Supplier:', supplier['name']],
            ['Contact:', supplier.get('contact_name', 'N/A')],
            ['Phone:', supplier.get('phone', 'N/A')],
            ['Email:', supplier.get('email', 'N/A')],
            ['Address:', supplier.get('address', 'N/A')],
        ]
    
    supplier_table = Table(supplier_data, colWidths=[1.5*inch, 4.5*inch])
    
    if language == 'ar':
        supplier_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), get_arabic_font(bold=False)),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), get_arabic_font(bold=True)),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#555555')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8f9fa')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dee2e6')),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
    else:
        supplier_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Amiri-Regular'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), 'Amiri-Regular'),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#555555')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8f9fa')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dee2e6')),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
    
    elements.append(supplier_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Items Table
    if language == 'ar':
        elements.append(Paragraph(process_arabic_text("بنود الطلب"), heading_style))
        
        # Table headers
        items_data = [[
            process_arabic_text('الإجمالي'),
            process_arabic_text('سعر الوحدة'),
            process_arabic_text('الوحدة'),
            process_arabic_text('الكمية'),
            process_arabic_text('وصف الصنف'),
            '#'
        ]]
    else:
        elements.append(Paragraph("ORDER ITEMS", heading_style))
        
        # Table headers
        items_data = [['#', 'Item Description', 'Quantity', 'Unit', 'Unit Price', 'Total']]
    
    # Add items
    for idx, item in enumerate(po_data['items'], 1):
        if language == 'ar':
            items_data.append([
                f"{item['total_price']:,.2f} ج.م",
                f"{item['unit_price']:,.2f} ج.م",
                item.get('unit', process_arabic_text('وحدة')),
                f"{item['quantity_ordered']:,.2f}",
                process_arabic_text(item['item_name']),
                str(idx)
            ])
        else:
            items_data.append([
                str(idx),
                item['item_name'],
                f"{item['quantity_ordered']:,.2f}",
                item.get('unit', 'unit'),
                f"${item['unit_price']:,.2f}",
                f"${item['total_price']:,.2f}"
            ])
    
    # Create items table
    items_table = Table(items_data, colWidths=[0.5*inch, 2.5*inch, 1*inch, 0.75*inch, 1*inch, 1.25*inch])
    
    # Different styles for Arabic
    if language == 'ar':
        items_table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#007bff')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), get_arabic_font(bold=True)),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Data rows
            ('FONTNAME', (0, 1), (-1, -1), get_arabic_font(bold=False)),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (0, 1), (1, -1), 'RIGHT'),   # Prices (first two columns in Arabic layout)
            ('ALIGN', (2, 1), (3, -1), 'CENTER'),  # Unit and Quantity
            ('ALIGN', (4, 1), (4, -1), 'RIGHT'),   # Item name
            ('ALIGN', (5, 1), (5, -1), 'CENTER'),  # Item number
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dee2e6')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            
            # Alternating row colors
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
        ]))
    else:
        items_table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#007bff')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Amiri-Regular'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Data rows
            ('FONTNAME', (0, 1), (-1, -1), 'Amiri-Regular'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # Item number
            ('ALIGN', (2, 1), (2, -1), 'CENTER'),  # Quantity
            ('ALIGN', (3, 1), (3, -1), 'CENTER'),  # Unit
            ('ALIGN', (4, 1), (5, -1), 'RIGHT'),   # Prices
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dee2e6')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            
            # Alternating row colors
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
        ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Total Section
    if language == 'ar':
        total_data = [
            [f"{po_data['total_amount']:,.2f} ج.م", process_arabic_text('المجموع الفرعي:'), '', '', '', ''],
            ['0.00 ج.م', process_arabic_text('الضريبة:'), '', '', '', ''],
            [f"{po_data['total_amount']:,.2f} ج.م", process_arabic_text('الإجمالي:'), '', '', '', ''],
        ]
    else:
        total_data = [
            ['', '', '', '', 'Subtotal:', f"${po_data['total_amount']:,.2f}"],
            ['', '', '', '', 'Tax:', '$0.00'],
            ['', '', '', '', 'TOTAL:', f"${po_data['total_amount']:,.2f}"],
        ]
    
    total_table = Table(total_data, colWidths=[0.5*inch, 2.5*inch, 1*inch, 0.75*inch, 1*inch, 1.25*inch])
    
    if language == 'ar':
        total_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (1, -1), get_arabic_font(bold=True)),
            ('FONTSIZE', (0, 0), (1, -1), 11),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            
            # Total row
            ('FONTNAME', (0, 2), (1, 2), get_arabic_font(bold=True)),
            ('FONTSIZE', (0, 2), (1, 2), 14),
            ('BACKGROUND', (0, 2), (1, 2), colors.HexColor('#28a745')),
            ('TEXTCOLOR', (0, 2), (1, 2), colors.white),
            ('LINEABOVE', (0, 2), (1, 2), 2, colors.HexColor('#28a745')),
            ('BOTTOMPADDING', (0, 2), (1, 2), 10),
            ('TOPPADDING', (0, 2), (1, 2), 10),
        ]))
    else:
        total_table.setStyle(TableStyle([
            ('FONTNAME', (4, 0), (4, -1), 'Amiri-Bold'),
            ('FONTNAME', (5, 0), (5, -1), 'Amiri-Regular'),
            ('FONTSIZE', (4, 0), (5, -1), 11),
            ('ALIGN', (4, 0), (5, -1), 'RIGHT'),
            
            # Total row
            ('FONTNAME', (4, 2), (5, 2), 'Amiri-Bold'),
            ('FONTSIZE', (4, 2), (5, 2), 14),
            ('BACKGROUND', (4, 2), (5, 2), colors.HexColor('#28a745')),
            ('TEXTCOLOR', (4, 2), (5, 2), colors.white),
            ('LINEABOVE', (4, 2), (5, 2), 2, colors.HexColor('#28a745')),
            ('BOTTOMPADDING', (4, 2), (5, 2), 10),
            ('TOPPADDING', (4, 2), (5, 2), 10),
        ]))
    
    elements.append(total_table)
    
    # Notes section (if any)
    if po_data.get('notes'):
        elements.append(Spacer(1, 0.3*inch))
        if language == 'ar':
            elements.append(Paragraph(process_arabic_text("ملاحظات"), heading_style))
        else:
            elements.append(Paragraph("NOTES", heading_style))
        
        notes_text = process_arabic_text(po_data['notes']) if language == 'ar' else po_data['notes']
        elements.append(Paragraph(notes_text, normal_style))
    
    # Terms and conditions
    elements.append(Spacer(1, 0.5*inch))
    terms_style = ParagraphStyle(
        'Terms',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#666666'),
        alignment=TA_CENTER
    )
    
    if language == 'ar':
        # Use best available Arabic font for terms
        terms_style.fontName = get_arabic_font(bold=False)
        terms_text = process_arabic_text("""
        أمر الشراء هذا يخضع للشروط والأحكام الخاصة باتفاقية الشراء.
        يرجى تسليم البضائع إلى المستودع المحدد في التاريخ المتوقع.
        """)
    else:
        terms_text = """
        This purchase order is subject to the terms and conditions of the purchasing agreement.
        Please deliver items to the specified warehouse by the expected date.
        """
    elements.append(Paragraph(terms_text, terms_style))
    
    # Build PDF
    doc.build(elements)
    
    # Get PDF content
    pdf_content = buffer.getvalue()
    buffer.close()
    
    return pdf_content


def generate_simple_purchase_order(po_data: Dict[str, Any]) -> bytes:
    """
    Generate a simplified purchase order PDF without company info
    """
    # Simplified version without company info
    simplified_data = po_data.copy()
    simplified_data.pop('company_info', None)
    
    return generate_purchase_order_pdf(simplified_data, language='ar') 