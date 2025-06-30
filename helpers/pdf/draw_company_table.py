from datetime import datetime
from typing import Dict, Any

def draw_company_table(c, x_start: int, y_start: int, cheque_data: Dict[str, Any], field_visibility: Dict[str, bool], processor) -> int:
    """
    Draws the top company copy table onto the canvas.
    Expects `processor` to provide: 
    - .process_arabic_text(text)
    - .convert_date_to_arabic(date)
    - .format_amount_numbers(amount)
    - .arabic_font
    """
    current_date = datetime.now()
    table_width = 500
    row_height = 30
    col_widths = [80, 120, 120, 180]

    category_path = cheque_data.get('category_path', cheque_data.get('department', 'غير محدد'))
    category_parts = category_path.split(' > ') if ' > ' in category_path else [category_path]
    root_category = category_parts[0]
    final_category = category_parts[-1]

    table_data = [
        [processor.process_arabic_text("رقم المصروف"),
         processor.process_arabic_text("الفئة الرئيسية"),
         processor.process_arabic_text("الفئة الفرعية"),
         processor.process_arabic_text("وصف المصروف")],
        [cheque_data.get('expense_number', cheque_data.get('cheque_number', 'N/A')),
         processor.process_arabic_text(root_category),
         processor.process_arabic_text(final_category),
         processor.process_arabic_text(cheque_data.get('expense_description', 'بدون وصف'))],
        ["" if not field_visibility.get("amount_numbers", True) else f"المبلغ: {processor.format_amount_numbers(cheque_data.get('amount_number', 0))}",
         "" if not field_visibility.get("issued_to", True) else f"المستفيد: {cheque_data.get('issued_to', 'غير محدد')}",
         "" if not field_visibility.get("date", True) else f"التاريخ: {processor.convert_date_to_arabic(cheque_data.get('date', current_date))}",
         f"الخزنة: {cheque_data.get('safe_name', 'غير محدد')} | البنك: {cheque_data.get('bank_name', 'غير محدد')}"],
        [f"رقم مرجعي: {cheque_data.get('reference_number', 'N/A')}",
         f"رمز الحساب: {cheque_data.get('account_code', 'N/A')}",
         f"تاريخ التسجيل: {processor.convert_date_to_arabic(cheque_data.get('server_date', current_date))}",
         f"تاريخ الطباعة: {processor.convert_date_to_arabic(current_date)} | يصرف للمستفيد الأول"]
    ]

    y_current = y_start

    for row_idx, row in enumerate(table_data):
        x_current = x_start
        c.setFont(processor.arabic_font, 10 if row_idx == 0 else 9)
        for col_idx, cell_text in enumerate(row):
            c.setStrokeColorRGB(0, 0, 0)
            c.setFillColorRGB(0.9, 0.9, 0.9) if row_idx == 0 else c.setFillColorRGB(1, 1, 1)
            c.rect(x_current, y_current - row_height, col_widths[col_idx], row_height, fill=1, stroke=1)

            text_x = x_current + col_widths[col_idx] - 5
            text_y = y_current - row_height / 2 - 3

            # Reset text color to black
            c.setFillColorRGB(0, 0, 0)

            if any('\u0600' <= char <= '\u06FF' for char in str(cell_text)):
                cell_text = processor.process_arabic_text(cell_text)

            if len(cell_text) > 25:
                parts = cell_text.split(' ')
                c.setFont(processor.arabic_font, 8)
                c.drawRightString(text_x, text_y + 4, ' '.join(parts[:2]))
                c.drawRightString(text_x, text_y - 4, ' '.join(parts[2:]))
            else:
                c.drawRightString(text_x, text_y, cell_text)

            x_current += col_widths[col_idx]
        y_current -= row_height

    return y_current - 10 