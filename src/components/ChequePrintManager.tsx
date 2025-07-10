import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { extractResponseData, extractErrorMessage } from '../lib/apiUtils';
import { PX_TO_CM } from '../utils/px-to-cm';

interface FieldPosition {
  x: number;
  y: number;
}

interface ChequeField {
  key: string;
  label: string;
}

interface Cheque {
  id: number;
  cheque_number: string;
  amount: number;
  issue_date: string;
  due_date?: string;  // Added due_date field
  description: string;
  issued_to: string;
  safe_name: string;
  bank_name: string;
  status: string;
}

interface TemplateStatus {
  template_exists: boolean;
  template_path: string;
  file_info?: {
    size: number;
    modified: string;
  };
}

interface Safe {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  current_balance: number;
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

const ChequePrintManager: React.FC = () => {
  const API_BASE_URL = 'http://100.29.4.72:8000';

  // Template status returned by backend {template_exists, template_path, file_info?}
  const [templateStatus, setTemplateStatus] = useState<TemplateStatus | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
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

  // HTML printing state (main focus)
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [pendingPrintPreview, setPendingPrintPreview] = useState(false);

  // Track system status
  const [systemStatus, setSystemStatus] = useState(null);

  // Real cheque data management
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
  const [selectedSafe, setSelectedSafe] = useState<string>('');
  const [safes, setSafes] = useState<Safe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

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

  // Handle global mouse move while dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging || !overlayRef.current) return;
      const rect = overlayRef.current.getBoundingClientRect();
      let newX = e.clientX - rect.left - dragging.offsetX;
      let newY = e.clientY - rect.top - dragging.offsetY;
      
      setPositions(prev => ({
        ...prev,
        [dragging.key]: { x: newX, y: newY }
      }));
    };

    const handleTouchMove = (e) => {
      if (!dragging || !overlayRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = overlayRef.current.getBoundingClientRect();
      let newX = touch.clientX - rect.left - dragging.offsetX;
      let newY = touch.clientY - rect.top - dragging.offsetY;
      
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
    axios.get(`${API_BASE_URL}/cheque-template-status`).then(res => {
      setTemplateStatus(res.data);
      setHasTemplatePreview(res.data.template_exists);
    }).catch(() => setTemplateStatus(null));

    // Load field positions
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

    // Load cheque settings
    axios.get(`${API_BASE_URL}/arabic-cheque/cheque-settings`).then(res => {
      if (res.data && res.data.font_size) {
        setFontSize(res.data.font_size);
      }
    }).catch(() => {});

    const defaultVisibility = {};
    FIELD_DEFS.forEach(field => {
      defaultVisibility[field.key] = true;
    });
    setVisibility(defaultVisibility);

    // Load real cheques and safes
    loadCheques();
    fetchSafes();
  }, [selectedSafe]);

  const loadCheques = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (selectedSafe) {
        // Use the same approach as ChequeManagement - fetch cheques for specific safe
        const response = await axios.get(`${API_BASE_URL}/safes/${selectedSafe}/cheques?status_filter=active&t=${Date.now()}`);
        
        // Handle different API response formats
        const chequesData = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setCheques(chequesData);
        
        // Auto-select first cheque if available
        if (chequesData && chequesData.length > 0) {
          setSelectedCheque(chequesData[0]);
        }
        
        console.log('✅ Loaded cheques for safe', selectedSafe, ':', chequesData);
      } else {
        // If no safe selected, try to get all printable cheques
        const response = await axios.get(`${API_BASE_URL}/cheques/printable?status=issued`);
        const chequesData = response.data.cheques || [];
        setCheques(chequesData);
        
        if (chequesData.length > 0) {
          setSelectedCheque(chequesData[0]);
        }
        
        console.log('✅ Loaded all printable cheques:', chequesData);
      }
    } catch (error: any) {
      console.error('❌ Failed to load cheques:', error);
      setError('فشل في تحميل الشيكات: ' + (error.response?.data?.detail || error.message));
      setCheques([]); // Ensure cheques is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchSafes = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_BASE_URL}/safes-simple`, { headers });
      const safesData = extractResponseData(response.data);
      console.log('🏦 Safes loaded:', safesData);
      setSafes(safesData);
    } catch (error: any) {
      console.error('Error fetching safes:', error);
      const errorMessage = extractErrorMessage(error);
      console.error('Safes error:', errorMessage);
    }
  };

  // Generate cheque data for display (real or sample)
  const generateChequeData = () => {
    if (selectedCheque) {
      // Use real cheque data
      return {
        cheque_number: selectedCheque.cheque_number,
        amount_number: formatCurrency(selectedCheque.amount),
        amount_words: convertToArabicWords(selectedCheque.amount),
        beneficiary_name: selectedCheque.issued_to || 'غير محدد',
        issue_date: selectedCheque.issue_date ? formatDate(selectedCheque.issue_date) : new Date().toLocaleDateString('ar-SA'),
        due_date: selectedCheque.due_date ? formatDate(selectedCheque.due_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA'),
        description: selectedCheque.description || 'بدون وصف',
        payee_notice: 'يصرف للمستفيد الأول فقط',
        recipient: 'مدير الشؤون المالية',
        receipt_date: new Date().toLocaleDateString('ar-SA'),
        note_1: 'محرر الشيك: إدارة الشؤون المالية',
        note_4: 'رقم المرايا: MR-2024-001'
      };
    } else {
      // Use sample data when no cheque selected
      return {
        cheque_number: '123456',
        amount_number: '1,500.00',
        amount_words: 'ألف وخمسمائة ريال فقط لا غير',
        beneficiary_name: 'شركة الأعمال التجارية المحدودة',
        issue_date: new Date().toLocaleDateString('ar-SA'),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA'),
        description: 'دفعة مقابل خدمات استشارية',
        payee_notice: 'يصرف للمستفيد الأول',  // FIXED: Match backend and ChequeManagement
        recipient: 'مدير الشؤون المالية',  // FIXED: Use role instead of duplicate name
        receipt_date: new Date().toLocaleDateString('ar-SA'),
        note_1: 'محرر الشيك: إدارة الشؤون المالية',  // FIXED: Proper content
        note_4: 'رقم المرايا: MR-2024-001'  // FIXED: Reference number format
      };
    }
  };

  // Convert amount to Arabic words
  const convertToArabicWords = (amount: number): string => {
    const thousands = Math.floor(amount / 1000);
    const hundreds = Math.floor((amount % 1000) / 100);
    const remainder = amount % 100;
    
    let result = '';
    if (thousands > 0) result += `${thousands} ألف `;
    if (hundreds > 0) result += `${hundreds} مائة `;
    if (remainder > 0) result += `${remainder}`;
    result += ' ريال فقط لا غير';
    
    return result;
  };

  // HTML printing function (main focus)
  const handleHtmlPrint = (preview = false) => {
    const chequeData = generateChequeData();
    
    // Use unified pixel-to-cm conversion
    const scaleX = PX_TO_CM;
    const scaleY = PX_TO_CM;

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>طباعة الشيك HTML - ${chequeData.cheque_number}</title>
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
            overflow: hidden;
            ${hasTemplatePreview ? `
                background-image: url('${API_BASE_URL}/cheque-template-preview');
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
            top: 0.5cm;
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
          
          const leftCm = (pos.x * scaleX).toFixed(2);
          const topCm = (pos.y * scaleY).toFixed(2);
          
          return `
            <div class="cheque-field" style="left: ${leftCm}cm; top: ${topCm}cm;">
                ${chequeData[field.key] || field.label}
            </div>
          `;
        }).join('')}
    </div>

    <div class="no-print" style="position: fixed; top: 10px; left: 10px; background: #333; color: white; padding: 10px; border-radius: 5px; z-index: 1000;">
        <button onclick="window.print()" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 5px; cursor: pointer;">
            طباعة HTML
        </button>
        <button onclick="window.close()" style="background: #f44336; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 5px; cursor: pointer;">
            إغلاق
        </button>
    </div>
</body>
</html>`;

    if (preview) {
      // Show HTML preview in modal
      setShowHtmlPreview(true);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPrintPreviewUrl(url);
    } else {
      // Open HTML in new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Auto-trigger print after delay
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
  };

  const saveDefaults = () => {
    axios.post(`${API_BASE_URL}/arabic-cheque/cheque-field-positions`, positions).then(() => {
      axios.post(`${API_BASE_URL}/arabic-cheque/cheque-settings`, { font_size: fontSize });
      setSuccess('تم حفظ الإعدادات بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      setError('فشل في حفظ الإعدادات');
      setTimeout(() => setError(''), 3000);
    });
  };

  const handleTemplateUpload = async () => {
    if (!templateFile) {
      setError('يرجى اختيار ملف القالب');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', templateFile);

      await axios.post(`${API_BASE_URL}/upload-cheque-template`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('تم رفع قالب الشيك بنجاح');
      setTemplateFile(null);
      
      // Reload template status
      const statusRes = await axios.get(`${API_BASE_URL}/cheque-template-status`);
      setTemplateStatus(statusRes.data);
      setHasTemplatePreview(statusRes.data.template_exists);
      setTimeout(() => setSuccess(''), 3000);
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
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  };

  return (
    <div dir="rtl" className="p-4">
      <h2 className="text-xl font-bold mb-4">🌐 طباعة الشيكات HTML</h2>

      {/* Success/Error Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          ✅ {success}
        </div>
      )}

      {/* Cheque Selection Section */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">📋 اختيار الشيك للطباعة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تصفية حسب الخزنة:
            </label>
            <select
              value={selectedSafe}
              onChange={(e) => setSelectedSafe(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الخزائن</option>
              {safes.map(safe => (
                <option key={safe.id} value={safe.id.toString()}>
                  {safe.name} ({safe.is_active ? 'نشطة' : 'غير نشطة'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختيار الشيك:
            </label>
            <select
              value={selectedCheque?.id || ''}
              onChange={(e) => {
                const cheque = cheques.find(c => c.id === parseInt(e.target.value));
                setSelectedCheque(cheque || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                {loading ? 'جاري التحميل...' : 
                 cheques.length === 0 ? 'لا توجد شيكات متاحة' : 
                 'اختر شيك...'}
              </option>
              {cheques.map(cheque => (
                <option key={cheque.id} value={cheque.id}>
                  {cheque.cheque_number} - {formatCurrency(cheque.amount)} - {cheque.issued_to || 'غير محدد'}
                </option>
              ))}
            </select>
            {/* Debug Info */}
            <div className="mt-2 text-sm text-gray-600">
              {selectedSafe ? (
                <p>خزنة محددة: {safes.find(s => s.id.toString() === selectedSafe)?.name} | عدد الشيكات: {cheques.length}</p>
              ) : (
                <p>لم يتم تحديد خزنة | عدد الشيكات الإجمالي: {cheques.length}</p>
              )}
              {loading && <p className="text-blue-500">🔄 جاري تحميل الشيكات...</p>}
              {!loading && selectedSafe && cheques.length === 0 && (
                <p className="text-red-500">⚠️ لا توجد شيكات متاحة للطباعة في هذه الخزنة</p>
              )}
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadCheques}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'جاري التحميل...' : 'تحديث الشيكات'}
            </button>
          </div>
        </div>
        
        {selectedCheque && (
          <div className="mt-4 p-3 bg-white rounded border">
            <p className="text-sm"><strong>الشيك المحدد:</strong> {selectedCheque.cheque_number}</p>
            <p className="text-sm"><strong>المبلغ:</strong> {formatCurrency(selectedCheque.amount)}</p>
            <p className="text-sm"><strong>المستفيد:</strong> {selectedCheque.issued_to || 'غير محدد'}</p>
            <p className="text-sm"><strong>الوصف:</strong> {selectedCheque.description || 'بدون وصف'}</p>
          </div>
        )}
      </div>

      {/* Template Upload Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">📄 رفع قالب الشيك</h3>
        {templateStatus?.template_exists ? (
          <div className="flex items-center text-green-600 mb-4">
            <span className="text-2xl ml-2">✅</span>
            <div>
              <p className="font-medium">قالب الشيك متوفر</p>
              {templateStatus.file_info && (
                <p className="text-sm text-gray-600">
                  الحجم: {formatFileSize(templateStatus.file_info.size)} | 
                  آخر تعديل: {new Date(templateStatus.file_info.modified).toLocaleDateString('ar-EG')}
                </p>
              )}
            </div>
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
            💡 <strong>نصائح للاستخدام:</strong> يمكنك إدخال إحداثيات دقيقة يدوياً أو سحب الحقول في المعاينة أدناه. 
            يركز هذا النظام على الطباعة بتقنية HTML للحصول على أفضل جودة طباعة مباشرة من المتصفح.
          </p>
        </div>
      </div>

      {/* PDF preview with overlay */}
      <div className="relative mb-6 border-2 border-gray-300" style={{ width: pageWidth, height: pageHeight }} ref={overlayRef}>
        {/* Background template */}
        {hasTemplatePreview ? (
          <div className="absolute inset-0">
            <img 
              src={`${API_BASE_URL}/cheque-template-preview`}
              alt="قالب الشيك"
              className="w-full h-full"
              style={{ width: pageWidth, height: pageHeight, objectFit: 'fill' }}
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

      <div className="flex gap-4 flex-wrap">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => handleHtmlPrint(true)}
        >
          🌐 معاينة HTML
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => handleHtmlPrint(false)}
        >
          🖨️ طباعة HTML مباشرة
        </button>
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded"
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

      {/* HTML Preview Modal */}
      {showHtmlPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-[90%] h-[90%] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">معاينة طباعة HTML</h3>
                <p className="text-sm text-gray-600">معاينة الشيك بتنسيق HTML للطباعة المباشرة من المتصفح</p>
                {selectedCheque && (
                  <p className="text-sm text-blue-600">شيك رقم: {selectedCheque.cheque_number} - {formatCurrency(selectedCheque.amount)}</p>
                )}
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
                🖨️ طباعة HTML
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

      {/* Instructions */}
      <div className="mt-8 p-4 bg-green-50 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">🌐 مميزات طباعة HTML:</h3>
        <ul className="text-green-700 text-sm space-y-1">
          <li>• طباعة مباشرة من المتصفح بجودة عالية</li>
          <li>• سرعة في التحميل والطباعة</li>
          <li>• توافق أفضل مع جميع الطابعات</li>
          <li>• إمكانية مراجعة النتيجة قبل الطباعة</li>
          <li>• استخدام بيانات الشيكات الحقيقية من النظام</li>
          <li>• تصميم مرن وقابل للتخصيص</li>
        </ul>
      </div>
    </div>
  );
};

export default ChequePrintManager; 