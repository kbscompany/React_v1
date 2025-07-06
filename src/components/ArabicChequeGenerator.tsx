import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';

interface FieldPosition {
  x: number;
  y: number;
}

interface ChequeField {
  key: string;
  label: string;
}

const FIELD_DEFS: ChequeField[] = [
  { key: 'cheque_number', label: 'رقم الشيك' },
  { key: 'amount_number', label: 'المبلغ بالأرقام' },
  { key: 'amount_words', label: 'المبلغ كتابة' },
  { key: 'beneficiary_name', label: 'اسم المستفيد' },
  { key: 'issue_date', label: 'تاريخ الإصدار' },
  { key: 'company_table', label: 'جدول معلومات الشركة' },
  { key: 'note_1', label: 'محرر الشيك' }
];

const ArabicChequeGenerator = () => {
  const API_BASE_URL = 'http://localhost:8000';

  // Template status returned by backend {template_exists, template_path, file_info?}
  const [templateStatus, setTemplateStatus] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [positions, setPositions] = useState({});
  const [visibility, setVisibility] = useState({});
  const [debugMode, setDebugMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const overlayRef = useRef(null);

  // Track dragging state
  const [dragging, setDragging] = useState(null);

  // PDF template preview dimensions
  const [pageWidth, setPageWidth] = useState(595); // points → px (1:1 scale)
  const [pageHeight, setPageHeight] = useState(842);

  // Track if we have a template preview available
  const [hasTemplatePreview, setHasTemplatePreview] = useState(false);
  
  // Track actual image dimensions for scaling
  const [imageScale, setImageScale] = useState({ x: 1, y: 1 });
  
  // Print preview state
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printPreviewUrl, setPrintPreviewUrl] = useState('');

  // Track system status
  const [systemStatus, setSystemStatus] = useState(null);

  // Handle manual coordinate changes
  const handleManualCoordinateChange = (fieldKey: string, coordinate: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setPositions(prev => ({
        ...prev,
        [fieldKey]: {
          ...prev[fieldKey],
          [coordinate]: numValue
        }
      }));
    }
  };

  // Handle global mouse move while dragging (this was missing!)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging || !overlayRef.current) return;
      const rect = overlayRef.current.getBoundingClientRect();
      let newX = e.clientX - rect.left - dragging.offsetX;
      let newY = e.clientY - rect.top - dragging.offsetY;
      
      // Allow positioning beyond margins - remove clamping restrictions
      // Users can now position text anywhere, including outside normal page boundaries
      
      setPositions(prev => ({
        ...prev,
        [dragging.key]: { x: newX, y: newY }
      }));
    };

    const handleTouchMove = (e) => {
      if (!dragging || !overlayRef.current) return;
      e.preventDefault(); // Prevent scrolling
      const touch = e.touches[0];
      const rect = overlayRef.current.getBoundingClientRect();
      let newX = touch.clientX - rect.left - dragging.offsetX;
      let newY = touch.clientY - rect.top - dragging.offsetY;
      
      // Allow positioning beyond margins - remove clamping restrictions
      
      setPositions(prev => ({
        ...prev,
        [dragging.key]: { x: newX, y: newY }
      }));
    };

    const handleMouseUp = () => setDragging(null);
    const handleTouchEnd = () => setDragging(null);

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragging, pageWidth, pageHeight]);

  useEffect(() => {
    // Check system status
    axios.get(`${API_BASE_URL}/arabic-cheque/system-status`).then(res => {
      setSystemStatus(res.data);
      // Alert if fonts are not registered
      if (!res.data.fonts_registered) {
        console.error('Arabic fonts not registered:', res.data.font_error);
        alert('تحذير: الخطوط العربية غير مسجلة. قد لا يظهر النص العربي بشكل صحيح.');
      }
    }).catch(err => {
      console.error('Failed to check system status:', err);
    });

    axios.get(`${API_BASE_URL}/arabic-cheque/cheque-field-positions`).then(res => {
      setPositions(res.data);
    }).catch(() => {
      // If no saved positions, use defaults
      const defaultPositions = {};
      FIELD_DEFS.forEach(field => {
        defaultPositions[field.key] = { x: 100, y: 100 + (FIELD_DEFS.indexOf(field) * 50) };
      });
      setPositions(defaultPositions);
    });

    // Load template status once
    axios.get(`${API_BASE_URL}/arabic-cheque/cheque-template-status`).then(res => {
      setTemplateStatus(res.data);
      setHasTemplatePreview(res.data.template_exists);
    }).catch(() => setTemplateStatus(null));

    const defaultVisibility = {};
    FIELD_DEFS.forEach(field => {
      defaultVisibility[field.key] = true;
    });
    setVisibility(defaultVisibility);

    // inside useEffect after loading positions and template status
    axios.get(`${API_BASE_URL}/arabic-cheque/cheque-settings`).then(res => {
      if (res.data && res.data.font_size) {
        setFontSize(res.data.font_size);
      }
    }).catch(() => {});
  }, []);

  const handlePrint = (preview = false) => {
    // Transform coordinates from UI to PDF
    const transformedPositions = {};
    for (const [key, pos] of Object.entries(positions)) {
      if (pos && typeof pos === 'object' && 'x' in pos && 'y' in pos) {
        // The UI uses the same dimensions as PDF (595x842)
        // But Y-axis is inverted: UI has origin at top-left, PDF at bottom-left
        const posX = (pos as any).x;
        const posY = (pos as any).y;
        transformedPositions[key] = {
          x: posX,
          y: pageHeight - posY  // Invert Y coordinate
        };
      }
    }
    
    // Use different endpoint for preview with template
    const endpoint = preview 
      ? `${API_BASE_URL}/arabic-cheque/cheques/1/preview-with-template`
      : `${API_BASE_URL}/arabic-cheque/cheques/1/print-arabic-sqlite`;
    
    axios.post(endpoint, {
      field_positions: transformedPositions,
      field_visibility: visibility,
      font_language: 'ar',
      debug_mode: debugMode,
      font_size: fontSize  // Pass font size to backend
    }, { responseType: 'blob' }).then(res => {
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      if (preview) {
        // Show preview in modal
        setPrintPreviewUrl(url);
        setShowPrintPreview(true);
      } else {
        // Open in new window
        window.open(url);
      }
    });
  };

  const saveDefaults = () => {
    axios.post(`${API_BASE_URL}/arabic-cheque/cheque-field-positions`, positions).then(() => {
      // also save font size
      axios.post(`${API_BASE_URL}/arabic-cheque/cheque-settings`, { font_size: fontSize });
      alert('Saved successfully');
    });
  };

  const handleTemplateUpload = async () => {
    if (!templateFile) {
      alert('يرجى اختيار ملف القالب');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', templateFile);

      const response = await axios.post(`${API_BASE_URL}/arabic-cheque/upload-cheque-template`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('تم رفع قالب الشيك بنجاح');
      setTemplateFile(null);
      // Reload template status
      const statusRes = await axios.get(`${API_BASE_URL}/arabic-cheque/cheque-template-status`);
      setTemplateStatus(statusRes.data);
      setHasTemplatePreview(statusRes.data.template_exists);
    } catch (error) {
      let errorMessage = 'فشل في رفع قالب الشيك';
      if (error.response) {
        if (error.response.status === 413) {
          errorMessage = 'حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.detail || 'الملف غير صالح';
        } else {
          errorMessage = error.response.data.detail || errorMessage;
        }
      }
      alert(errorMessage);
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetToDefaults = () => {
    const defaultPositions = {};
    FIELD_DEFS.forEach((field, index) => {
      defaultPositions[field.key] = { x: 100, y: 100 + (index * 50) };
    });
    setPositions(defaultPositions);
  };

  return (
    <div dir="rtl" className="p-4">
      <h2 className="text-xl font-bold mb-4">مولد الشيك العربي</h2>

      {/* Template Upload Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">📄 رفع قالب الشيك</h3>
        {templateStatus?.template_exists ? (
          <div className="flex items-center text-green-600 mb-4">
            <span className="text-2xl ml-2">✅</span>
            <p className="font-medium">قالب الشيك متوفر</p>
          </div>
        ) : (
          <div className="flex items-center text-red-600 mb-4">
            <span className="text-2xl ml-2">❌</span>
            <p className="font-medium">لم يتم رفع قالب الشيك بعد</p>
          </div>
        )}
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleTemplateUpload}
            disabled={!templateFile || isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? 'جاري الرفع...' : 'رفع'}
          </button>
        </div>
      </div>

      {/* Field Position Controls with Manual Input */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">⚙️ تحكم في مواضع الحقول</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {FIELD_DEFS.map(field => (
            <div key={field.key} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={visibility[field.key] || false}
                  onChange={(e) => setVisibility(prev => ({ ...prev, [field.key]: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label className="font-medium text-gray-700">{field.label}</label>
              </div>
              
              {field.key === 'company_table' ? (
                <span className="text-gray-500 text-sm">(جدول ثابت - أعلى الصفحة)</span>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">X (أفقي)</label>
                    <input
                      type="number"
                      value={Math.round(positions[field.key]?.x ?? 0)}
                      onChange={(e) => handleManualCoordinateChange(field.key, 'x', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      step="1"
                      placeholder="X"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Y (عمودي)</label>
                    <input
                      type="number"
                      value={Math.round(positions[field.key]?.y ?? 0)}
                      onChange={(e) => handleManualCoordinateChange(field.key, 'y', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      step="1"
                      placeholder="Y"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>نصائح للاستخدام:</strong> يمكنك الآن إدخال إحداثيات دقيقة يدوياً أو سحب الحقول في المعاينة أدناه. 
            يمكن استخدام قيم سالبة أو قيم أكبر من حدود الصفحة لوضع النص خارج الهوامش العادية.
          </p>
        </div>
      </div>

      {/* PDF preview with overlay */}
      <div className="relative mb-6 border-2 border-gray-300" style={{ width: pageWidth, height: pageHeight }} ref={overlayRef}>
        {/* Background template - using image preview */}
        {hasTemplatePreview ? (
          <div className="absolute inset-0">
            <img 
              src={`${API_BASE_URL}/arabic-cheque/cheque-template-preview`}
              alt="قالب الشيك"
              className="w-full h-full"
              style={{ width: pageWidth, height: pageHeight, objectFit: 'fill' }}
              onLoad={(e) => {
                // Image is loaded, positions should align with PDF coordinates
                console.log('Template image loaded');
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gray-100 border-2 border-dashed border-gray-400 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 mb-2">معاينة قالب الشيك</p>
              <p className="text-sm text-gray-500">قم بتحميل ملف PDF أولاً</p>
            </div>
          </div>
        )}

        {/* Draggable overlay fields */}
        {FIELD_DEFS.filter(field => field.key !== 'company_table').map(field => (
          visibility[field.key] && (
            <div
              key={field.key}
              className="absolute z-20 bg-yellow-200 bg-opacity-90 text-xs px-2 py-1 border-2 border-red-500 cursor-move select-none shadow-lg"
              style={{
                left: positions[field.key]?.x ?? 0,
                top: positions[field.key]?.y ?? 0,
              }}
              onMouseDown={e => {
                if (!overlayRef.current) return;
                const rect = overlayRef.current.getBoundingClientRect();
                const offsetX = e.clientX - rect.left - (positions[field.key]?.x ?? 0);
                const offsetY = e.clientY - rect.top - (positions[field.key]?.y ?? 0);
                setDragging({ key: field.key, offsetX, offsetY });
              }}
              onTouchStart={e => {
                if (!overlayRef.current) return;
                e.preventDefault(); // Prevent scrolling
                const touch = e.touches[0];
                const rect = overlayRef.current.getBoundingClientRect();
                const offsetX = touch.clientX - rect.left - (positions[field.key]?.x ?? 0);
                const offsetY = touch.clientY - rect.top - (positions[field.key]?.y ?? 0);
                setDragging({ key: field.key, offsetX, offsetY });
              }}
            >
              {debugMode ? `${field.label} (${Math.round(positions[field.key]?.x ?? 0)}, ${Math.round(positions[field.key]?.y ?? 0)})` : field.label}
            </div>
          )
        ))}
      </div>

      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2">
          <span>حجم الخط:</span>
          <input
            type="range"
            min="10"
            max="30"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="w-32"
          />
          <span className="w-8 text-center">{fontSize}</span>
        </label>
      </div>

      <div className="flex gap-4">
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded"
          onClick={() => handlePrint(true)}
        >
          معاينة الطباعة
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => handlePrint(false)}
        >
          طباعة الشيك بالعربية
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={saveDefaults}
        >
          حفظ كإعداد افتراضي
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded"
          onClick={resetToDefaults}
        >
          إعادة تعيين الإعدادات
        </button>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={debugMode}
            onChange={() => setDebugMode(!debugMode)}
          />
          وضع التصحيح
        </label>
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-[90%] h-[90%] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">معاينة الطباعة</h3>
                <p className="text-sm text-gray-600">معاينة النص المدمج مع قالب الشيك</p>
              </div>
              <button
                onClick={() => {
                  setShowPrintPreview(false);
                  if (printPreviewUrl) {
                    URL.revokeObjectURL(printPreviewUrl);
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 relative">
              {/* Show merged preview */}
              <iframe
                src={printPreviewUrl}
                className="w-full h-full border-2 border-gray-300"
                title="معاينة الطباعة"
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>
            <div className="mt-4 flex gap-4 justify-center">
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded"
                onClick={() => {
                  window.open(printPreviewUrl);
                  setShowPrintPreview(false);
                }}
              >
                طباعة
              </button>
              <button
                className="bg-gray-600 text-white px-6 py-2 rounded"
                onClick={() => {
                  setShowPrintPreview(false);
                  if (printPreviewUrl) {
                    URL.revokeObjectURL(printPreviewUrl);
                  }
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArabicChequeGenerator;
