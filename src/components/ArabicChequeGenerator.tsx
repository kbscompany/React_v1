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
  { key: 'due_date', label: 'تاريخ الاستحقاق' },
  { key: 'description', label: 'وصف الشيك' },
  { key: 'payee_notice', label: 'يصرف للمستفيد الأول' },
  { key: 'recipient', label: 'المستلم' },
  { key: 'receipt_date', label: 'تاريخ الاستلام' },
  { key: 'company_table', label: 'جدول معلومات الشركة' },
  { key: 'note_1', label: 'محرر الشيك' },
  { key: 'note_4', label: 'رقم المرايا' },
];

// Browser coordinate system constants (top-left origin)
const BROWSER_PAGE_WIDTH = 595;  // Standard A4 width in points
const BROWSER_PAGE_HEIGHT = 842; // Standard A4 height in points

const ArabicChequeGenerator = () => {
  const API_BASE_URL = 'http://100.29.4.72:8000';

  // Template status returned by backend {template_exists, template_path, file_info?}
  const [templateStatus, setTemplateStatus] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // All positions stored in browser coordinates (top-left origin, y=0 at top)
  const [positions, setPositions] = useState<Record<string, FieldPosition>>({});
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [debugMode, setDebugMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Track dragging state
  const [dragging, setDragging] = useState<{
    key: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Track if we have a template preview available
  const [hasTemplatePreview, setHasTemplatePreview] = useState(false);
  
  // Print preview state
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printPreviewUrl, setPrintPreviewUrl] = useState('');

  // HTML printing state
  const [showPrintMethodModal, setShowPrintMethodModal] = useState(false);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [pendingPrintPreview, setPendingPrintPreview] = useState(false);

  // Track system status
  const [systemStatus, setSystemStatus] = useState(null);

  // Handle manual coordinate changes - coordinates stay in browser space
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

  // Handle global mouse move while dragging - all coordinates in browser space
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging || !overlayRef.current) return;
      const rect = overlayRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragging.offsetX;
      const newY = e.clientY - rect.top - dragging.offsetY;
      
      // No coordinate transformation needed - all in browser space
      setPositions(prev => ({
        ...prev,
        [dragging.key]: { x: newX, y: newY }
      }));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragging || !overlayRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = overlayRef.current.getBoundingClientRect();
      const newX = touch.clientX - rect.left - dragging.offsetX;
      const newY = touch.clientY - rect.top - dragging.offsetY;
      
      // No coordinate transformation needed - all in browser space
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
  }, [dragging]);

  useEffect(() => {
    // Check system status
    axios.get(`${API_BASE_URL}/arabic-cheque/system-status`).then(res => {
      setSystemStatus(res.data);
      if (!res.data.fonts_registered) {
        console.error('Arabic fonts not registered:', res.data.font_error);
        alert('تحذير: الخطوط العربية غير مسجلة. قد لا يظهر النص العربي بشكل صحيح.');
      }
    }).catch(err => {
      console.error('Failed to check system status:', err);
    });

    // Load saved positions - they are already in browser coordinate space
    axios.get(`${API_BASE_URL}/arabic-cheque/cheque-field-positions`).then(res => {
      setPositions(res.data);
    }).catch(() => {
      // If no saved positions, use defaults in browser coordinate space
      const defaultPositions: Record<string, FieldPosition> = {};
      FIELD_DEFS.forEach((field, index) => {
        defaultPositions[field.key] = { 
          x: 100, 
          y: 100 + (index * 50) // Browser coordinates: y increases downward
        };
      });
      setPositions(defaultPositions);
    });

    // Load template status
    axios.get(`${API_BASE_URL}/arabic-cheque/cheque-template-status`).then(res => {
      setTemplateStatus(res.data);
      setHasTemplatePreview(res.data.template_exists);
    }).catch(() => setTemplateStatus(null));

    // Set default visibility
    const defaultVisibility: Record<string, boolean> = {};
    FIELD_DEFS.forEach(field => {
      defaultVisibility[field.key] = true;
    });
    setVisibility(defaultVisibility);

    // Load font size settings
    axios.get(`${API_BASE_URL}/arabic-cheque/cheque-settings`).then(res => {
      if (res.data && res.data.font_size) {
        setFontSize(res.data.font_size);
      }
    }).catch(() => {});
  }, []);

  // Generate sample cheque data for display
  const generateSampleChequeData = () => {
    const sampleData = {
      cheque_number: '123456',
      amount_number: '1,500.00',
      amount_words: 'ألف وخمسمائة ريال فقط لا غير',
      beneficiary_name: 'شركة الأعمال التجارية المحدودة',
      issue_date: new Date().toLocaleDateString('ar-SA'),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA'),
      description: 'دفعة مقابل خدمات استشارية',
      payee_notice: 'يصرف للمستفيد الأول فقط',
      recipient: 'مدير الشؤون المالية',
      receipt_date: new Date().toLocaleDateString('ar-SA'),
      note_1: 'محرر الشيك: إدارة الشؤون المالية',
      note_4: 'رقم المرايا: MR-2024-001'
    };
    return sampleData;
  };

  // HTML printing function - uses consistent coordinate conversion
  const handleHtmlPrint = (preview = false) => {
    const chequeData = generateSampleChequeData();
    
    // Convert browser coordinates to CSS centimeters for HTML printing
    const pxToCm = (px: number) => (px * 0.026458).toFixed(2);

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>طباعة الشيك - HTML</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', 'Tahoma', sans-serif;
            direction: rtl;
            background: white;
        }

        .cheque-container {
            position: relative;
            width: 21cm;
            height: 29.7cm;
            background: white;
            ${hasTemplatePreview ? `
                background-image: url('${API_BASE_URL}/arabic-cheque/cheque-template-preview');
                background-size: 21cm 29.7cm;
                background-repeat: no-repeat;
                background-position: center;
            ` : ''}
        }

        .cheque-field {
            position: absolute;
            font-size: ${fontSize}pt;
            color: #000;
            white-space: nowrap;
            font-weight: bold;
        }

        .company-table {
            position: absolute;
            top: 3.5cm;  // ← Changed from 0.5cm to 1.5cm (moves down 1cm)
            right: 0.5cm;
            left: 0.5cm;
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid #333;
            padding: 10px;
        }

        .company-table table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12pt;
        }

        .company-table th,
        .company-table td {
            border: 1px solid #333;
            padding: 5px;
            text-align: center;
        }

        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            
            .no-print {
                display: none !important;
            }
        }
    </style>
</head>
<body>
    <div class="cheque-container">
        ${visibility.company_table ? `
        <div class="company-table">
            <table>
                <tr>
                    <th colspan="3">استوديو كيكات كى بى اس - معلومات الشركة</th>
                </tr>
                <tr>
                    <td>اسم الشركة</td>
                    <td>رقم الهاتف</td>
                    <td>العنوان</td>
                </tr>
                <tr>
                    <td>استوديو كيكات كى بى اس</td>
                    <td>+966 XX XXX XXXX</td>
                    <td>الرياض، المملكة العربية السعودية</td>
                </tr>
            </table>
        </div>
        ` : ''}

        ${FIELD_DEFS.filter(field => field.key !== 'company_table' && visibility[field.key]).map(field => {
          const pos = positions[field.key];
          if (!pos) return '';
          
          // Convert browser coordinates directly to CSS centimeters
          const leftCm = pxToCm(pos.x);
          const topCm = pxToCm(pos.y);
          
          return `
            <div class="cheque-field" style="left: ${leftCm}cm; top: ${topCm}cm;">
                ${chequeData[field.key as keyof typeof chequeData] || field.label}
            </div>
          `;
        }).join('')}
    </div>

    <div class="no-print" style="position: fixed; top: 10px; left: 10px; background: #333; color: white; padding: 10px; border-radius: 5px; z-index: 1000;">
        <button onclick="window.print()" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 5px; cursor: pointer;">
            طباعة
        </button>
        <button onclick="window.close()" style="background: #f44336; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 5px; cursor: pointer;">
            إغلاق
        </button>
    </div>
</body>
</html>`;

    if (preview) {
      setShowHtmlPreview(true);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPrintPreviewUrl(url);
    } else {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
      }
    }
  };

  const handlePrintWithOptions = (preview = false) => {
    setPendingPrintPreview(preview);
    setShowPrintMethodModal(true);
  };

  // PDF print function - send browser coordinates as-is to backend
  const handlePdfPrint = (preview = false) => {
    const endpoint = preview 
      ? `${API_BASE_URL}/arabic-cheque/cheques/1/preview-with-template`
      : `${API_BASE_URL}/arabic-cheque/cheques/1/print-arabic-sqlite`;
    
    // Send positions in browser coordinate space - backend will handle conversion
    axios.post(endpoint, {
      field_positions: positions, // Browser coordinates - no transformation
      field_visibility: visibility,
      font_language: 'ar',
      debug_mode: debugMode,
      font_size: fontSize
    }, { responseType: 'blob' }).then(res => {
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      if (preview) {
        setPrintPreviewUrl(url);
        setShowPrintPreview(true);
      } else {
        window.open(url);
      }
    });
  };

  const saveDefaults = () => {
    // Save positions in browser coordinate space
    axios.post(`${API_BASE_URL}/arabic-cheque/cheque-field-positions`, positions).then(() => {
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
      const statusRes = await axios.get(`${API_BASE_URL}/arabic-cheque/cheque-template-status`);
      setTemplateStatus(statusRes.data);
      setHasTemplatePreview(statusRes.data.template_exists);
    } catch (error: any) {
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
    // Reset to default browser coordinates
    const defaultPositions: Record<string, FieldPosition> = {};
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
            💡 <strong>نصائح للاستخدام:</strong> جميع الإحداثيات في نظام المتصفح (أعلى-يسار). 
            يمكنك إدخال إحداثيات دقيقة يدوياً أو سحب الحقول في المعاينة أدناه.
          </p>
        </div>
      </div>

      {/* PDF preview with overlay - all in browser coordinate space */}
      <div className="relative mb-6 border-2 border-gray-300" style={{ width: BROWSER_PAGE_WIDTH, height: BROWSER_PAGE_HEIGHT }} ref={overlayRef}>
        {/* Background template */}
        {hasTemplatePreview ? (
          <div className="absolute inset-0">
            <img 
              src={`${API_BASE_URL}/arabic-cheque/cheque-template-preview`}
              alt="قالب الشيك"
              className="w-full h-full"
              style={{ width: BROWSER_PAGE_WIDTH, height: BROWSER_PAGE_HEIGHT, objectFit: 'fill' }}
              onLoad={() => {
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

        {/* Draggable overlay fields - all in browser coordinates */}
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
                e.preventDefault();
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
          onClick={() => handlePrintWithOptions(true)}
        >
          معاينة الطباعة
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => handlePrintWithOptions(false)}
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

      {/* Print Method Selection Modal */}
      {showPrintMethodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90%]">
            <h3 className="text-xl font-semibold mb-4 text-center">اختر طريقة الطباعة</h3>
            <p className="text-gray-600 mb-6 text-center">يمكنك الآن الاختيار بين طباعة PDF أو طباعة HTML مباشرة</p>
            
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => {
                  setShowPrintMethodModal(false);
                  handlePdfPrint(pendingPrintPreview);
                }}
                className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <div className="text-right">
                  <div className="font-semibold text-blue-700">طباعة PDF</div>
                  <div className="text-sm text-gray-600">النسخة التقليدية - جودة عالية</div>
                </div>
                <div className="text-3xl text-blue-600">📄</div>
              </button>
              
              <button
                onClick={() => {
                  setShowPrintMethodModal(false);
                  handleHtmlPrint(pendingPrintPreview);
                }}
                className="flex items-center justify-between p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors"
              >
                <div className="text-right">
                  <div className="font-semibold text-green-700">طباعة HTML</div>
                  <div className="text-sm text-gray-600">مباشرة من المتصفح - سريعة وسهلة</div>
                </div>
                <div className="text-3xl text-green-600">🌐</div>
              </button>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowPrintMethodModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HTML Preview Modal */}
      {showHtmlPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-[90%] h-[90%] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">معاينة طباعة HTML</h3>
                <p className="text-sm text-gray-600">معاينة الشيك بتنسيق HTML للطباعة المباشرة</p>
              </div>
              <button
                onClick={() => {
                  setShowHtmlPreview(false);
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
              <iframe
                src={printPreviewUrl}
                className="w-full h-full border-2 border-gray-300"
                title="معاينة طباعة HTML"
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>
            <div className="mt-4 flex gap-4 justify-center">
              <button
                className="bg-green-600 text-white px-6 py-2 rounded"
                onClick={() => {
                  const printWindow = window.open(printPreviewUrl);
                  if (printWindow) {
                    printWindow.onload = () => {
                      printWindow.print();
                    };
                  }
                  setShowHtmlPreview(false);
                }}
              >
                طباعة HTML
              </button>
              <button
                className="bg-gray-600 text-white px-6 py-2 rounded"
                onClick={() => {
                  setShowHtmlPreview(false);
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

      {/* PDF Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-[90%] h-[90%] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">معاينة طباعة PDF</h3>
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
              <iframe
                src={printPreviewUrl}
                className="w-full h-full border-2 border-gray-300"
                title="معاينة طباعة PDF"
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
                طباعة PDF
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
