"""Updated Purchase Order Routes using HTML Generator

Example of how to integrate the new simplified HTML purchase order generator
into your FastAPI routes, replacing the complex PDF approach.
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse, FileResponse
from html_purchase_order import generate_purchase_order_html, save_purchase_order_html
import tempfile
import os
from typing import Optional

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])

@router.get("/{po_id}/html")
async def get_purchase_order_html(
    po_id: int,
    language: str = Query("ar", description="Language: 'ar' for Arabic, 'en' for English")
):
    """
    Generate and return HTML purchase order
    Much simpler than PDF - works perfectly with Arabic text
    """
    try:
        # Fetch purchase order data from your database
        # This is just example data - replace with your actual database query
        po_data = await fetch_purchase_order_from_db(po_id)
        
        if not po_data:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        # Generate HTML
        html_content = generate_purchase_order_html(po_data, language)
        
        # Return as HTML response that opens directly in browser
        return HTMLResponse(
            content=html_content,
            status_code=200,
            headers={
                "Content-Type": "text/html; charset=utf-8",
                "Content-Disposition": f"inline; filename=purchase_order_{po_id}_{language}.html"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating purchase order: {str(e)}")

@router.get("/{po_id}/download")
async def download_purchase_order_html(
    po_id: int,
    language: str = Query("ar", description="Language: 'ar' for Arabic, 'en' for English")
):
    """
    Download HTML purchase order as file
    User can then save as PDF from their browser if needed
    """
    try:
        # Fetch purchase order data
        po_data = await fetch_purchase_order_from_db(po_id)
        
        if not po_data:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        # Create temporary file
        filename = f"purchase_order_{po_id}_{language}.html"
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8')
        
        # Generate and save HTML
        save_purchase_order_html(po_data, temp_file.name, language)
        temp_file.close()
        
        # Return file for download
        return FileResponse(
            path=temp_file.name,
            filename=filename,
            media_type="text/html",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating purchase order: {str(e)}")

async def fetch_purchase_order_from_db(po_id: int):
    """
    Replace this with your actual database query
    This is just example data structure
    """
    # Example data - replace with your actual database query
    sample_data = {
        "id": po_id,
        "order_date": "2025-01-25T10:30:00Z",
        "expected_date": "2025-02-01T00:00:00Z",
        "status": "pending",
        "payment_status": "unpaid",
        "total_amount": 15750.50,
        "supplier": {
            "name": "مخبز النور للحلويات",
            "contact_name": "أحمد محمد",
            "phone": "+20 12 345 6789",
            "email": "contact@alnour-bakery.com",
            "address": "شارع التحرير، القاهرة، مصر"
        },
        "warehouse": {
            "name": "المستودع الرئيسي",
            "location": "القاهرة"
        },
        "items": [
            {
                "item_name": "دقيق فاخر نوع أول",
                "quantity_ordered": 50.0,
                "unit": "كيس",
                "unit_price": 85.00,
                "total_price": 4250.00
            },
            {
                "item_name": "سكر أبيض ناعم",
                "quantity_ordered": 25.0,
                "unit": "كيس",
                "unit_price": 45.00,
                "total_price": 1125.00
            }
        ],
        "company_info": {
            "name": "استوديو كيك KBS",
            "address": "شارع الجمهورية، المعادي، القاهرة",
            "phone": "+20 11 234 5678",
            "email": "orders@kbscakestudio.com"
        },
        "notes": "يرجى التأكد من جودة المنتجات وفحصها قبل التسليم."
    }
    
    return sample_data

# Alternative: Simple endpoint that opens in browser directly
@router.get("/{po_id}/view")
async def view_purchase_order(
    po_id: int,
    lang: str = Query("ar", description="Language code")
):
    """
    Simple endpoint that returns HTML for direct browser viewing
    Perfect for embedding in your frontend or opening in new tab
    """
    po_data = await fetch_purchase_order_from_db(po_id)
    
    if not po_data:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    html_content = generate_purchase_order_html(po_data, lang)
    
    return HTMLResponse(content=html_content) 