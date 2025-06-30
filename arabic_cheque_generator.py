import os
import json
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel, validator
from typing import Dict, Tuple, Optional
import arabic_reshaper
from bidi.algorithm import get_display
from num2words import num2words
import shutil
import fitz  # PyMuPDF
from pathlib import Path

# Create a router instead of a FastAPI app
router = APIRouter(prefix="/arabic-cheque", tags=["Arabic Cheque"])

# Get the directory where this file is located
BASE_DIR = Path(__file__).parent

# Create required directories with permission checks
def ensure_directories():
    """Ensure all required directories exist and are writable"""
    dirs_to_create = ["uploads", "storage", "fonts"]
    for dir_name in dirs_to_create:
        dir_path = BASE_DIR / dir_name if dir_name == "fonts" else Path(dir_name)
        try:
            os.makedirs(dir_path, exist_ok=True)
            if not os.access(dir_path, os.W_OK):
                raise RuntimeError(f"Directory {dir_path} is not writable")
        except Exception as e:
            print(f"Error creating/checking directory {dir_name}: {e}")
            raise

ensure_directories()

# Track font registration status
FONTS_REGISTERED = False
FONT_REGISTRATION_ERROR = None

# Register Arabic fonts with better error handling
try:
    font_path_amiri = BASE_DIR / "fonts" / "Amiri-Bold.ttf"
    font_path_noto = BASE_DIR / "fonts" / "NotoSansArabic-Regular.ttf"
    
    if font_path_amiri.exists():
        pdfmetrics.registerFont(TTFont('Amiri', str(font_path_amiri)))
        FONTS_REGISTERED = True
        print("Successfully registered Amiri font")
    else:
        raise FileNotFoundError(f"Amiri font not found at {font_path_amiri}")
        
    if font_path_noto.exists():
        pdfmetrics.registerFont(TTFont('NotoSansArabic', str(font_path_noto)))
        print("Successfully registered NotoSansArabic font")
    
except Exception as e:
    FONT_REGISTRATION_ERROR = str(e)
    print(f"Critical Warning: Could not register Arabic fonts: {e}")
    print("Arabic text will not display correctly!")

# Validate PyPDF2 is available
try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False
    print("Warning: PyPDF2 not installed. Company table with template preview may not work correctly.")


class ChequePrintPayload(BaseModel):
    field_positions: Dict[str, Dict[str, float]]
    field_visibility: Dict[str, bool]
    font_language: str = "ar"
    debug_mode: bool = False
    font_size: int = 16  # Add font size with default
    
    @validator('font_size')
    def validate_font_size(cls, v):
        """Clamp font size to reasonable range"""
        return max(8, min(36, v))
    
    @validator('field_positions')
    def validate_field_positions(cls, v):
        """Ensure positions have valid x,y coordinates"""
        for field_name, pos in v.items():
            if not isinstance(pos, dict) or 'x' not in pos or 'y' not in pos:
                raise ValueError(f"Invalid position format for field {field_name}")
            # Clamp to page boundaries
            pos['x'] = max(0, min(595, pos['x']))
            pos['y'] = max(0, min(842, pos['y']))
        return v


class ArabicChequeGenerator:
    FIELD_DEFS = {
        "cheque_number": (100, 100),
        "amount_number": (200, 100),
        "amount_words": (100, 150),
        "beneficiary_name": (100, 200),
        "issue_date": (400, 100),
        "note_1": (200, 150),
        "note_2": (200, 150),
        "note_3": (200, 150),
        "note_4": (200, 150)
    }

    def __init__(self):
        self.default_positions = self.FIELD_DEFS.copy()
        self.font_path = "fonts/Amiri-Bold.ttf"
        self.arabic_font = "Amiri"  # Font name for ReportLab
        # Check if font is actually registered
        if not FONTS_REGISTERED:
            self.arabic_font = "Helvetica"  # Fallback if Arabic fonts not available
            print(f"Warning: Using fallback font {self.arabic_font} because Arabic fonts are not registered")

    def reshape_arabic(self, text):
        reshaped = arabic_reshaper.reshape(text)
        return get_display(reshaped)
    
    def process_arabic_text(self, text):
        """Process Arabic text for proper display"""
        return self.reshape_arabic(str(text))

    def to_arabic_digits(self, text: str) -> str:
        return text.translate(str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩"))
    
    def convert_date_to_arabic(self, date) -> str:
        """Convert date to Arabic format"""
        from datetime import datetime
        if isinstance(date, str):
            try:
                date = datetime.strptime(date, "%Y-%m-%d")
            except:
                date = datetime.now()
        elif not isinstance(date, datetime):
            date = datetime.now()
        
        # Format: YYYY-MM-DD in Arabic numbers
        date_str = date.strftime("%Y-%m-%d")
        return self.to_arabic_digits(date_str)
    
    def format_amount_numbers(self, amount) -> str:
        """Format amount with Arabic digits"""
        try:
            amount_float = float(amount)
            formatted = f"{amount_float:,.2f}"
            return self.to_arabic_digits(formatted)
        except:
            return self.to_arabic_digits(str(amount))

    def create_overlay_pdf(self, cheque_data: Dict, field_positions: Dict[str, Tuple[int, int]],
                            field_visibility: Dict[str, bool], debug_mode: bool = False, font_size: int = 16) -> bytes:
        from helpers.pdf.draw_company_table import draw_company_table
        
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        
        # Only add white background if not in debug mode
        # In debug mode, we want transparent background for overlay
        if not debug_mode:
            # Add white background
            c.setFillColorRGB(1, 1, 1)
            c.rect(0, 0, A4[0], A4[1], fill=1)
        
        # Draw company table if enabled
        if field_visibility.get("company_table", False):
            # Register the font for the table
            try:
                c.setFont("Amiri", 10)
            except:
                pass
            
            # Get company table position from field_positions or use default
            table_position = field_positions.get("company_table", (50, 750))
            table_x = table_position[0] if isinstance(table_position, (tuple, list)) else 50
            table_y = table_position[1] if isinstance(table_position, (tuple, list)) else 750
            
            table_y_end = draw_company_table(c, int(table_x), int(table_y), cheque_data, field_visibility, self)
        
        # Ensure black color for text
        c.setFillColorRGB(0, 0, 0)
        
        # Use Arabic font for text
        try:
            c.setFont("Amiri", font_size)
        except:
            # Fallback to Helvetica if Arabic font not available
            c.setFont("Helvetica", font_size)
            print("Warning: Arabic font not available, using Helvetica")

        for field_key, (x, y) in field_positions.items():
            if not field_visibility.get(field_key, True):
                continue
            value = cheque_data.get(field_key, "")
            
            # Convert numbers to Arabic digits for amount and date fields
            if "amount" in field_key or "date" in field_key or field_key == "cheque_number":
                value = self.to_arabic_digits(str(value))
            
            # Add Egyptian pounds suffix to amount_words
            if field_key == "amount_words" and value:
                value = f"{value} جنيه مصري فقط لا غير"
            
            # Reshape Arabic text for proper display
            value = self.reshape_arabic(str(value))
            
            # Save current state
            c.saveState()
            
            # Ensure text color is black
            c.setFillColorRGB(0, 0, 0)
            
            # Draw the text (right-aligned for Arabic)
            c.drawRightString(x, y, value)
            
            # Restore state
            c.restoreState()

            if debug_mode:
                c.saveState()
                c.setFillColorRGB(1, 0, 0)
                c.circle(x, y, 5, fill=1)
                c.setFont("Helvetica", 8)
                c.setFillColorRGB(1, 0, 0)
                c.drawString(x + 5, y + 5,
                             f"{field_key} ({int(x)},{int(y)})")
                c.restoreState()
                # Restore font for next iteration
                try:
                    c.setFont("Amiri", font_size)
                except:
                    c.setFont("Helvetica", font_size)

        if debug_mode:
            c.saveState()
            c.setFont("Helvetica-Bold", 20)
            c.setFillColorRGB(1, 0, 0)
            c.drawCentredString(300, 800, "DEBUG MODE")
            c.restoreState()

        c.save()
        buffer.seek(0)
        return buffer.read()

    def create_overlay_with_template(self, cheque_data: Dict, field_positions: Dict[str, Tuple[int, int]],
                                    field_visibility: Dict[str, bool], debug_mode: bool = False, font_size: int = 16) -> bytes:
        """Create PDF with text overlaid directly on template using PyMuPDF"""
        from helpers.pdf.draw_company_table import draw_company_table
        
        template_path = "uploads/cheque_template.pdf"
        
        if not os.path.exists(template_path):
            # Fall back to overlay-only if no template
            return self.create_overlay_pdf(cheque_data, field_positions, field_visibility, debug_mode, font_size)
        
        # If company table is enabled, we need to use ReportLab approach
        if field_visibility.get("company_table", False):
            # Create overlay with ReportLab including table
            overlay_pdf = self.create_overlay_pdf(cheque_data, field_positions, field_visibility, debug_mode, font_size)
            
            # Merge with template using PyPDF2
            if not PYPDF2_AVAILABLE:
                print("Warning: PyPDF2 not available, falling back to overlay-only PDF")
                return overlay_pdf
                
            try:
                from PyPDF2 import PdfReader, PdfWriter
                
                # Create buffers
                overlay_buffer = BytesIO(overlay_pdf)
                
                # Open PDFs
                template_pdf = PdfReader(template_path)
                overlay_pdf_reader = PdfReader(overlay_buffer)
                
                # Create output
                output = PdfWriter()
                
                # Get first page and merge
                template_page = template_pdf.pages[0]
                template_page.merge_page(overlay_pdf_reader.pages[0])
                output.add_page(template_page)
                
                # Write to buffer
                output_buffer = BytesIO()
                output.write(output_buffer)
                output_buffer.seek(0)
                
                return output_buffer.read()
            except Exception as e:
                print(f"Error merging with template: {e}")
                return overlay_pdf
        
        try:
            # Open the template PDF
            doc = fitz.open(template_path)
            page = doc[0]
            
            # Get the Amiri font path
            font_path = "fonts/Amiri-Bold.ttf"
            
            # Add overlay text
            for field_key, (x, y) in field_positions.items():
                if not field_visibility.get(field_key, True):
                    continue
                    
                value = cheque_data.get(field_key, "")
                
                # Convert numbers to Arabic digits
                if "amount" in field_key or "date" in field_key or field_key == "cheque_number":
                    value = self.to_arabic_digits(str(value))
                
                # Add Egyptian pounds suffix to amount_words
                if field_key == "amount_words" and value:
                    value = f"{value} جنيه مصري فقط لا غير"
                
                # Reshape Arabic text
                value = self.reshape_arabic(str(value))
                
                # Convert ReportLab coordinates to PyMuPDF coordinates
                # ReportLab: origin at bottom-left, y increases upward
                # PyMuPDF: origin at top-left, y increases downward
                page_height = page.rect.height
                pymupdf_y = page_height - y
                
                # Create a wider text box for Arabic text
                text_rect = fitz.Rect(x - 300, pymupdf_y - 20, x, pymupdf_y + 5)
                
                try:
                    # Try to insert with custom font
                    rc = page.insert_textbox(
                        text_rect,
                        value,
                        fontname="helv",  # Will use embedded font
                        fontfile=font_path,
                        fontsize=font_size,
                        align=fitz.TEXT_ALIGN_RIGHT,
                        color=(0, 0, 0)
                    )
                except:
                    # Fallback to built-in font
                    rc = page.insert_textbox(
                        text_rect,
                        value,
                        fontsize=font_size,
                        align=fitz.TEXT_ALIGN_RIGHT,
                        color=(0, 0, 0)
                    )
                
                if debug_mode:
                    # Add debug circle
                    page.draw_circle(fitz.Point(x, pymupdf_y), 5, color=(1, 0, 0), fill=(1, 0, 0))
                    # Add debug label
                    label_rect = fitz.Rect(x + 5, pymupdf_y - 10, x + 150, pymupdf_y + 10)
                    page.insert_textbox(
                        label_rect,
                        f"{field_key} ({int(x)},{int(y)})",
                        fontsize=8,
                        color=(1, 0, 0)
                    )
            
            if debug_mode:
                # Add debug header
                header_rect = fitz.Rect(200, 50, 400, 100)
                page.insert_textbox(
                    header_rect,
                    "DEBUG MODE",
                    fontsize=20,
                    align=fitz.TEXT_ALIGN_CENTER,
                    color=(1, 0, 0)
                )
            
            # Get PDF bytes
            pdf_bytes = doc.tobytes()
            doc.close()
            
            return pdf_bytes
            
        except Exception as e:
            print(f"Error creating overlay with template: {e}")
            # Fall back to overlay-only
            return self.create_overlay_pdf(cheque_data, field_positions, field_visibility, debug_mode, font_size)


@router.post("/cheques/{id}/print-arabic-sqlite")
def print_arabic_cheque(id: int, payload: ChequePrintPayload):
    cheque_data = {
        "cheque_number": "123456",
        "amount_number": "25000",
        "amount_words": num2words(25000, lang='ar'),
        "beneficiary_name": "شركة التجربة",
        "issue_date": "2025-06-17",
        # Additional fields for company table
        "expense_number": "EXP-2025-001",
        "category_path": "مصروفات عامة > مواد خام",
        "expense_description": "شراء مواد خام للإنتاج",
        "issued_to": "شركة التجربة للتوريدات",
        "date": "2025-06-17",
        "safe_name": "الخزنة الرئيسية",
        "bank_name": "البنك الأهلي",
        "reference_number": "REF-2025-001",
        "account_code": "ACC-4010",
        "server_date": "2025-06-17"
    }
    
    # Convert position format from {field: {x, y}} to {field: (x, y)}
    # Also handle coordinate transformation
    field_positions_tuples = {}
    page_height = 842  # A4 height in points
    
    for field_key, position in payload.field_positions.items():
        if isinstance(position, dict) and 'x' in position and 'y' in position:
            # The frontend sends coordinates with origin at top-left
            # ReportLab expects origin at bottom-left
            x = position['x']
            y = position['y']  # Already transformed in frontend
            
            # Convert UI coords (origin top-left) to PDF coords (origin bottom-left)
            pdf_y = page_height - y
            field_positions_tuples[field_key] = (x, pdf_y)
            
            if payload.debug_mode:
                print(f"Field {field_key} UI({x},{y}) -> PDF({x},{pdf_y})")
    
    generator = ArabicChequeGenerator()
    # Use create_overlay_pdf to generate text-only overlay
    overlay = generator.create_overlay_pdf(cheque_data, field_positions_tuples,
                                           payload.field_visibility, payload.debug_mode,
                                           payload.font_size)
    
    # Store chosen font_size in storage/cheque_settings.json
    os.makedirs("storage", exist_ok=True)
    with open("storage/cheque_settings.json", "w") as f:
        json.dump({"font_size": payload.font_size}, f)
    
    return Response(
        content=overlay, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=cheque_{id}_arabic.pdf"}
    )


@router.get("/cheque-field-positions")
def get_field_positions():
    """Get field positions - returns format like {"field_name": {"x": 100, "y": 200}}"""
    if not os.path.exists("storage/cheque_field_positions.json"):
        raise HTTPException(status_code=404, detail="Field positions not found")
    
    with open("storage/cheque_field_positions.json") as f:
        saved_positions = json.load(f)
    
    # Convert from storage format to frontend format
    positions_to_return = {}
    for field_key, position in saved_positions.items():
        if isinstance(position, list) and len(position) >= 2:
            positions_to_return[field_key] = {"x": position[0], "y": position[1]}
    
    return positions_to_return


@router.post("/cheque-field-positions")
def save_field_positions(data: Dict[str, Dict[str, float]]):
    """Save field positions - expects format like {"field_name": {"x": 100, "y": 200}}"""
    os.makedirs("storage", exist_ok=True)
    
    # Convert the frontend format to the storage format
    positions_to_save = {}
    for field_key, position in data.items():
        if isinstance(position, dict) and 'x' in position and 'y' in position:
            positions_to_save[field_key] = [position['x'], position['y']]
    
    with open("storage/cheque_field_positions.json", "w") as f:
        json.dump(positions_to_save, f)
    return {"message": "Saved successfully"}


@router.post("/upload-cheque-template")
async def upload_cheque_template(file: UploadFile = File(...)):
    """Upload a PDF template for cheque generation"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Check file size (limit to 10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_FILE_SIZE/1024/1024}MB")
    
    # Reset file position after reading
    await file.seek(0)
    
    # Validate it's a valid PDF
    try:
        # Quick PDF validation
        if not contents.startswith(b'%PDF'):
            raise ValueError("Invalid PDF file")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid PDF file: {str(e)}")
    
    # Save to uploads directory
    os.makedirs("uploads", exist_ok=True)
    template_path = "uploads/cheque_template.pdf"
    
    with open(template_path, "wb") as buffer:
        buffer.write(contents)
    
    return {"success": True, "message": "Template uploaded successfully", "path": template_path}


@router.get("/system-status")
def get_system_status():
    """Check system configuration and dependencies"""
    return {
        "fonts_registered": FONTS_REGISTERED,
        "font_error": FONT_REGISTRATION_ERROR,
        "pypdf2_available": PYPDF2_AVAILABLE,
        "directories": {
            "uploads": os.path.exists("uploads") and os.access("uploads", os.W_OK),
            "storage": os.path.exists("storage") and os.access("storage", os.W_OK),
            "fonts": os.path.exists(BASE_DIR / "fonts")
        }
    }


@router.get("/cheque-template-status")
def get_template_status():
    """Check if template exists and get file info"""
    template_path = "uploads/cheque_template.pdf"
    if os.path.exists(template_path):
        stat = os.stat(template_path)
        return {
            "template_exists": True,
            "template_path": f"/uploads/cheque_template.pdf",
            "file_info": {
                "size": stat.st_size,
                "modified": stat.st_mtime
            }
        }
    else:
        return {
            "template_exists": False,
            "template_path": None,
            "file_info": None
        }


@router.get("/cheque-template-preview")
def get_template_preview():
    """Convert the uploaded PDF template to an image for preview"""
    template_path = "uploads/cheque_template.pdf"
    
    if not os.path.exists(template_path):
        raise HTTPException(status_code=404, detail="Template not found")
    
    try:
        # Open the PDF
        pdf_document = fitz.open(template_path)
        
        # Get the first page
        page = pdf_document[0]
        
        # Render page to an image (1x scale to match PDF coordinates)
        mat = fitz.Matrix(1, 1)  # 1x zoom for exact coordinate mapping
        pix = page.get_pixmap(matrix=mat)
        
        # Convert to PNG bytes
        img_data = pix.pil_tobytes(format="PNG")
        
        # Close the document
        pdf_document.close()
        
        return Response(content=img_data, media_type="image/png")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error converting PDF to image: {str(e)}")


@router.get("/test-coordinates")
def test_coordinates():
    """Generate a PDF with reference marks to test coordinate mapping"""
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from io import BytesIO
    
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    
    # Add white background
    c.setFillColorRGB(1, 1, 1)
    c.rect(0, 0, A4[0], A4[1], fill=1)
    
    # Draw grid lines every 100 points
    c.setStrokeColorRGB(0.8, 0.8, 0.8)
    c.setLineWidth(0.5)
    
    # Vertical lines
    for x in range(0, int(A4[0]) + 1, 100):
        c.line(x, 0, x, A4[1])
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica", 8)
        c.drawString(x + 2, 10, str(x))
        c.drawString(x + 2, A4[1] - 20, str(x))
    
    # Horizontal lines
    for y in range(0, int(A4[1]) + 1, 100):
        c.line(0, y, A4[0], y)
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica", 8)
        c.drawString(10, y + 2, str(y))
        c.drawString(A4[0] - 40, y + 2, str(y))
    
    # Draw reference points
    reference_points = [
        (100, 100, "Bottom-Left"),
        (495, 100, "Bottom-Right"),
        (100, 742, "Top-Left"),
        (495, 742, "Top-Right"),
        (297, 421, "Center"),
    ]
    
    c.setFillColorRGB(1, 0, 0)
    for x, y, label in reference_points:
        c.circle(x, y, 5, fill=1)
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica", 10)
        c.drawString(x + 10, y + 5, f"{label} ({x},{y})")
    
    # Add page info
    c.setFont("Helvetica", 12)
    c.drawString(50, 50, f"A4 Page: {A4[0]:.0f} x {A4[1]:.0f} points")
    c.drawString(50, 30, "Origin (0,0) is at bottom-left corner")
    
    c.save()
    buffer.seek(0)
    return Response(content=buffer.read(), media_type="application/pdf")


@router.post("/cheques/{id}/preview-with-template")
def preview_cheque_with_template(id: int, payload: ChequePrintPayload):
    """Generate a preview PDF with template background"""
    cheque_data = {
        "cheque_number": "123456",
        "amount_number": "25000",
        "amount_words": num2words(25000, lang='ar'),
        "beneficiary_name": "شركة التجربة",
        "issue_date": "2025-06-17",
        # Additional fields for company table
        "expense_number": "EXP-2025-001",
        "category_path": "مصروفات عامة > مواد خام",
        "expense_description": "شراء مواد خام للإنتاج",
        "issued_to": "شركة التجربة للتوريدات",
        "date": "2025-06-17",
        "safe_name": "الخزنة الرئيسية",
        "bank_name": "البنك الأهلي",
        "reference_number": "REF-2025-001",
        "account_code": "ACC-4010",
        "server_date": "2025-06-17"
    }
    
    # Convert position format from {field: {x, y}} to {field: (x, y)}
    field_positions_tuples = {}
    for field_key, position in payload.field_positions.items():
        if isinstance(position, dict) and 'x' in position and 'y' in position:
            x = position['x']
            y = position['y']
            field_positions_tuples[field_key] = (x, y)
    
    generator = ArabicChequeGenerator()
    
    # Check if template exists
    template_path = "uploads/cheque_template.pdf"
    if os.path.exists(template_path):
        # Use the method that overlays directly on template
        result = generator.create_overlay_with_template(cheque_data, field_positions_tuples,
                                                       payload.field_visibility, payload.debug_mode,
                                                       payload.font_size)
        return Response(
            content=result, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename=cheque_{id}_preview.pdf"}
        )
    else:
        # Fall back to overlay only
        overlay = generator.create_overlay_pdf(cheque_data, field_positions_tuples,
                                             payload.field_visibility, payload.debug_mode,
                                             payload.font_size)
        return Response(
            content=overlay, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename=cheque_{id}_preview.pdf"}
        )


@router.get("/cheque-settings")
def get_cheque_settings():
    """Return persisted cheque settings such as font size"""
    try:
        with open("storage/cheque_settings.json") as f:
            data = json.load(f)
            return {"font_size": data.get("font_size", 16)}
    except Exception:
        return {"font_size": 16}


class ChequeSettingsPayload(BaseModel):
    font_size: int


@router.post("/cheque-settings")
def save_cheque_settings(payload: ChequeSettingsPayload):
    """Persist cheque settings (currently only font size)"""
    os.makedirs("storage", exist_ok=True)
    with open("storage/cheque_settings.json", "w") as f:
        json.dump({"font_size": payload.font_size}, f)
    return {"message": "Settings saved"}


# ---------------------------------------------------------------------------
# Compatibility helper for legacy imports
# ---------------------------------------------------------------------------

def generate_arabic_cheque(cheque_data: Dict) -> bytes:
    """Legacy wrapper kept for backward-compatibility.

    Existing modules (e.g. purchase_order_api) expect a top-level function
    `generate_arabic_cheque(cheque_data)` that returns ready-to-print PDF bytes.

    This shim instantiates `ArabicChequeGenerator`, fills in default positions
    and visibility flags (all True) and returns the overlay PDF.  It does **not**
    merge with a background template; those code-paths currently consume only
    the overlay.  Extend if needed.
    """

    generator = ArabicChequeGenerator()

    # Get debug mode early to use in logs
    debug_mode = cheque_data.get("debug_mode", False)

    # Try to load saved positions from storage
    field_positions: Dict[str, Tuple[int, int]] = generator.default_positions.copy()
    
    try:
        if os.path.exists("storage/cheque_field_positions.json"):
            with open("storage/cheque_field_positions.json") as f:
                saved_positions = json.load(f)
                # Saved positions are already in PDF coordinate space (origin bottom-left)
                for field_key, position in saved_positions.items():
                    if isinstance(position, list) and len(position) >= 2:
                        x = position[0]
                        y = position[1]
                        # Convert UI coords (origin top-left) to PDF coords (origin bottom-left)
                        page_height = 842
                        pdf_y = page_height - y
                        field_positions[field_key] = (x, pdf_y)
                        if debug_mode:
                            print(f"Field {field_key} UI({x},{y}) -> PDF({x},{pdf_y})")
    except Exception as e:
        print(f"Warning: Could not load saved positions: {e}")

    # Get field visibility from cheque_data if provided, otherwise all visible
    field_visibility: Dict[str, bool] = cheque_data.get("field_visibility", {})
    if not field_visibility:
        # Default: all fields visible including company table
        field_visibility = {key: True for key in field_positions.keys()}
        field_visibility["company_table"] = True
        field_visibility["amount_numbers"] = True
        field_visibility["issued_to"] = True
        field_visibility["date"] = True
        field_visibility["note_1"] = True
        field_visibility["note_2"] = True
        field_visibility["note_3"] = True
        field_visibility["expense.id"] = True

    
    # Get font size from cheque_data if provided
    if "font_size" in cheque_data:
        font_size = cheque_data["font_size"]
    else:
        # try load last used font size
        try:
            with open("storage/cheque_settings.json") as f:
                font_size = json.load(f).get("font_size", 16)
        except Exception:
            font_size = 16

    # Add amount_words if not present but amount_number is
    if "amount_words" not in cheque_data and "amount_number" in cheque_data:
        try:
            amount = float(cheque_data["amount_number"])
            # Generate amount in words without suffix - it will be added during rendering
            cheque_data["amount_words"] = num2words(amount, lang='ar')
        except:
            pass

    # Log the data being passed to help debug
    if debug_mode:
        print(f"Cheque data keys: {list(cheque_data.keys())}")
        print(f"Field visibility: {field_visibility}")

    return generator.create_overlay_pdf(
        cheque_data=cheque_data,
        field_positions=field_positions,
        field_visibility=field_visibility,
        debug_mode=debug_mode,
        font_size=font_size
    )
