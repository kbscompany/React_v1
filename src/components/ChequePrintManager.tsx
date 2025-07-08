import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Cheque {
  id: number;
  cheque_number: string;
  amount: number;
  issue_date: string;
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

const ChequePrintManager: React.FC = () => {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [templateStatus, setTemplateStatus] = useState<TemplateStatus | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedSafe, setSelectedSafe] = useState<string>('');

  // API base URL
  const API_BASE_URL = 'http://100.29.4.72:8000';

  useEffect(() => {
    checkTemplateStatus();
    loadCheques();
  }, [selectedSafe]);

  const checkTemplateStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cheque-template-status`);
      setTemplateStatus(response.data);
    } catch (error) {
      console.error('Error checking template status:', error);
    }
  };

  const loadCheques = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params: any = { status: 'issued' };
      if (selectedSafe) {
        params.safe_id = parseInt(selectedSafe);
      }

      const response = await axios.get(`${API_BASE_URL}/cheques/printable`, { params });
      setCheques(response.data.cheques || []);
    } catch (error: any) {
      setError('فشل في تحميل الشيكات: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
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

      const response = await axios.post(`${API_BASE_URL}/upload-cheque-template`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('تم رفع قالب الشيك بنجاح');
      setTemplateFile(null);
      await checkTemplateStatus();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'فشل في رفع قالب الشيك');
    } finally {
      setIsUploading(false);
    }
  };

  const printArabicCheque = async (cheque: Cheque) => {
    if (!templateStatus?.template_exists) {
      setError('يرجى رفع قالب الشيك أولاً');
      return;
    }

    setPrinting(cheque.id);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/cheques/${cheque.id}/print-arabic`, {}, {
        responseType: 'blob'
      });

      // Create blob URL and open in new tab
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Open PDF in new tab
      const newWindow = window.open(url, '_blank');
      
      // Auto-trigger print dialog after a short delay
      if (newWindow) {
        setTimeout(() => {
          newWindow.print();
        }, 1000);
      }

      setSuccess(`تم طباعة الشيك رقم ${cheque.cheque_number} بنجاح`);
      
      // Clean up URL after use
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);

    } catch (error: any) {
      setError('فشل في طباعة الشيك: ' + (error.response?.data?.detail || error.message));
    } finally {
      setPrinting(null);
    }
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
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg" dir="rtl">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        🖨️ طباعة الشيكات العربية
      </h1>

      {/* Template Status Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">📄 حالة قالب الشيك</h2>
        
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

        {/* Template Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رفع قالب شيك جديد (PDF)
          </label>
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
      </div>

      {/* Filter Section */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-4 space-x-reverse">
          <label className="text-sm font-medium text-gray-700">تصفية حسب الخزنة:</label>
          <select
            value={selectedSafe}
            onChange={(e) => setSelectedSafe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع الخزائن</option>
            <option value="1">الخزنة الرئيسية</option>
            <option value="2">خزنة المشروع</option>
          </select>
          <button
            onClick={loadCheques}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'جاري التحميل...' : 'تحديث'}
          </button>
        </div>
      </div>

      {/* Error and Success Messages */}
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

      {/* Cheques Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            الشيكات المتاحة للطباعة ({cheques.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">جاري تحميل الشيكات...</p>
          </div>
        ) : cheques.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            لا توجد شيكات متاحة للطباعة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الشيك
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستفيد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الخزنة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الوصف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cheques.map((cheque) => (
                  <tr key={cheque.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cheque.cheque_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(cheque.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cheque.issued_to || 'غير محدد'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cheque.issue_date ? formatDate(cheque.issue_date) : 'غير محدد'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cheque.safe_name || 'غير محدد'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {cheque.description || 'بدون وصف'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => printArabicCheque(cheque)}
                        disabled={printing === cheque.id || !templateStatus?.template_exists}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {printing === cheque.id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            جاري الطباعة...
                          </>
                        ) : (
                          <>
                            🖨️ طباعة عربي
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📋 تعليمات الاستخدام:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• تأكد من رفع قالب الشيك (ملف PDF) أولاً</li>
          <li>• اختر الشيك المطلوب طباعته من القائمة</li>
          <li>• انقر على "طباعة عربي" لإنشاء الشيك</li>
          <li>• سيتم فتح الشيك في تبويب جديد مع تشغيل الطباعة تلقائياً</li>
          <li>• يتم تحويل البيانات تلقائياً إلى اللغة العربية والأرقام العربية</li>
        </ul>
      </div>
    </div>
  );
};

export default ChequePrintManager; 