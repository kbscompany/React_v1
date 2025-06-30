from typing import Dict, Optional

# Translation dictionary
translations: Dict[str, Dict[str, str]] = {
    # Headers and titles
    "📦 Update Warehouse Stock": {
        "ar": "📦 تحديث مخزون المخزن",
        "en": "📦 Update Warehouse Stock"
    },
    "🏢 Select Warehouse to Update": {
        "ar": "🏢 اختر المخزن للتحديث",
        "en": "🏢 Select Warehouse to Update"
    },
    "📊 Filter Stock Movements": {
        "ar": "📊 تصفية حركات المخزون",
        "en": "📊 Filter Stock Movements"
    },
    "📤 Download Warehouse Stock Template": {
        "ar": "📤 تحميل قالب إكسل لتحديث الكميات",
        "en": "📤 Download Warehouse Stock Template"
    },
    "📥 Upload Updated Stock File": {
        "ar": "📥 رفع ملف محدث",
        "en": "📥 Upload Updated Stock File"
    },
    "🔧 Manually Update Ingredients": {
        "ar": "🔧 تحديث المكونات يدويًا",
        "en": "🔧 Manually Update Ingredients"
    },
    
    # Labels
    "All": {
        "ar": "الكل",
        "en": "All"
    },
    "Filter by Ingredient": {
        "ar": "🔍 تصفية حسب المكون",
        "en": "🔍 Filter by Ingredient"
    },
    "Filter by Category": {
        "ar": "📂 تصفية حسب الفئة",
        "en": "📂 Filter by Category"
    },
    "Filter by Reason": {
        "ar": "📝 تصفية حسب السبب",
        "en": "📝 Filter by Reason"
    },
    "Search items": {
        "ar": "🔍 بحث عن مكون",
        "en": "🔍 Search items"
    },
    "Current Stock": {
        "ar": "📊 المخزون الحالي",
        "en": "📊 Current Stock"
    },
    "Update Method": {
        "ar": "طريقة التحديث",
        "en": "Update Method"
    },
    "By Base Unit": {
        "ar": "بالوحدة الأساسية",
        "en": "By Base Unit"
    },
    "By Package": {
        "ar": "بالحزمة",
        "en": "By Package"
    },
    "New Stock Quantity": {
        "ar": "الكمية الجديدة في المخزون",
        "en": "New Stock Quantity"
    },
    "Reason": {
        "ar": "السبب",
        "en": "Reason"
    },
    "Category": {
        "ar": "الفئة",
        "en": "Category"
    },
    "Change": {
        "ar": "التغيير",
        "en": "Change"
    },
    "Package Type": {
        "ar": "نوع الحزمة",
        "en": "Package Type"
    },
    "Qty per Package": {
        "ar": "الكمية لكل حزمة",
        "en": "Qty per Package"
    },
    "Weight per Item": {
        "ar": "الوزن لكل وحدة",
        "en": "Weight per Item"
    },
    "Operation Type": {
        "ar": "نوع العملية",
        "en": "Operation Type"
    },
    "Set New Quantity": {
        "ar": "تعيين كمية جديدة",
        "en": "Set New Quantity"
    },
    "Add to Stock": {
        "ar": "إضافة للمخزون",
        "en": "Add to Stock"
    },
    "Remove from Stock": {
        "ar": "خصم من المخزون",
        "en": "Remove from Stock"
    },
    "Number of Packages": {
        "ar": "عدد الحزم",
        "en": "Number of Packages"
    },
    "Apply Update": {
        "ar": "📂 تنفيذ التحديث",
        "en": "📂 Apply Update"
    },
    "Add to Waste": {
        "ar": "🗑️ إضافة للهدر",
        "en": "🗑️ Add to Waste"
    },
    
    # Reasons
    "Manual Update": {
        "ar": "تحديث يدوي",
        "en": "Manual Update"
    },
    "Spoilage": {
        "ar": "تلف",
        "en": "Spoilage"
    },
    "Restock": {
        "ar": "إعادة تخزين",
        "en": "Restock"
    },
    "Adjustment": {
        "ar": "تعديل",
        "en": "Adjustment"
    },
    "Excel Upload": {
        "ar": "رفع إكسل",
        "en": "Excel Upload"
    },
    
    # Messages
    "No matching items found.": {
        "ar": "🚫 لا يوجد مكونات مطابقة.",
        "en": "🚫 No matching items found."
    },
    "Stock update applied successfully": {
        "ar": "✅ تم تطبيق التحديث بنجاح",
        "en": "✅ Stock update applied successfully"
    },
    "Please enter number of packages": {
        "ar": "❌ يرجى إدخال عدد الحزم",
        "en": "❌ Please enter number of packages"
    },
    "No changes detected": {
        "ar": "⚠️ لم يتم إجراء أي تعديل",
        "en": "⚠️ No changes detected"
    }
}

def translate(key: str, lang: str = "en") -> str:
    """Translate a key to the specified language"""
    if key in translations:
        return translations[key].get(lang, key)
    return key

def get_available_languages() -> list:
    """Get list of available language codes"""
    return ["ar", "en"] 