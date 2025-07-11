import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, SIMPLE_API_URL } from '../config/api';
import { roleManager, PERMISSIONS } from '../lib/roleManager';
import { Search, Eye, Clock, CheckCircle, AlertCircle, X, Plus, Receipt, BookOpen, Settings, FileText, Printer, Upload, Send } from 'lucide-react';
import IssueChequeModal from './IssueChequeModal';
import { PX_TO_CM } from '../utils/px-to-cm';

interface BankAccount {
  id: number;
  account_name: string;
  bank_name: string;
  account_number: string;
  balance: number;
}

interface Safe {
  id: number;
  name: string;
  current_balance: number;
}

interface Cheque {
  id: number;
  cheque_number: string;
  bank_account_id: number;
  bank_account?: string; // Bank account info from API (e.g., "Account Name (Bank Name)")
  amount: string | number;
  issue_date: string;
  due_date?: string;
  description: string;
  issued_to?: string;
  status: string;
  safe_id: number | null;
  safe_name?: string; // Safe name from API
  is_settled: boolean;
  settlement_date?: string;
  total_expenses: string | number;
  remaining_amount: string | number;
  overspent_amount: string | number;
  settled_by_cheque_id: number | null;
  is_supplier_payment?: boolean;
  supplier_invoice_uploaded?: boolean;
  is_overspent?: boolean;
  attachments?: Array<{
    filename: string;
    original_filename: string;
    file_size: number;
    file_path: string;
    cheque_id?: number;
  }>;
  has_attachments?: boolean;
  is_printed?: boolean;
  printed_at?: string;
  print_count?: number;
}

interface EarlySettlementForm {
  deposit_number: string;
  deposit_amount: number;
  deposit_date: string;
  bank_deposit_reference: string;
  notes: string;
}

interface User {
  id: number;
  username: string;
  role: {
    id: number;
    name: string;
  };
}

interface ChequeManagementProps {
  user: User;
}

const ChequeManagement: React.FC<ChequeManagementProps> = ({ user }) => {
  const { t } = useTranslation();
  
  // Internal tab state
  const [activeTab, setActiveTab] = useState('cheques');
  
  // Existing state
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [safes, setSafes] = useState<Safe[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSafe, setSelectedSafe] = useState<number | null>(null);
  
  // Filtering and pagination state for settled cheques
  const [filterForm, setFilterForm] = useState({
    cheque_number: '',
    start_date: '',
    end_date: ''
  });
  const [settledChequesPage, setSettledChequesPage] = useState(0);
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<any[]>([]);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc'
  });
  
  // New cheque creation state
  const [chequeForm, setChequeForm] = useState({
    cheque_number: '',
    bank_account_id: '',
    amount: '',
    description: '',
    issue_date: new Date().toISOString().split('T')[0]
  });
  const [batchForm, setBatchForm] = useState({
    bank_account_id: '',
    start_number: '',
    end_number: '',
    prefix: '',
    description: ''
  });
  const [showChequeModal, setShowChequeModal] = useState(false);
  
  // Cheque recipe book state
  const [chequeTemplates, setChequeTemplates] = useState([
    { id: 1, name: 'Supplier Payment', description: 'Standard supplier payment template', bank_account_id: 1, default_amount: 0 },
    { id: 2, name: 'Utility Bill', description: 'Utility bill payment template', bank_account_id: 1, default_amount: 500 },
    { id: 3, name: 'Rent Payment', description: 'Monthly rent payment template', bank_account_id: 2, default_amount: 5000 },
    { id: 4, name: 'Employee Bonus', description: 'Employee bonus payment template', bank_account_id: 1, default_amount: 1000 }
  ]);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [earlySettlementModalOpen, setEarlySettlementModalOpen] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
  const [selectedChequeForEarlySettlement, setSelectedChequeForEarlySettlement] = useState<Cheque | null>(null);
  const [availableChequesForSettlement, setAvailableChequesForSettlement] = useState<Cheque[]>([]);
  const [earlySettlementForm, setEarlySettlementForm] = useState<EarlySettlementForm>({
    deposit_number: '',
    deposit_amount: 0,
    deposit_date: new Date().toISOString().split('T')[0],
    bank_deposit_reference: '',
    notes: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmittingEarlySettlement, setIsSubmittingEarlySettlement] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedChequeForCancel, setSelectedChequeForCancel] = useState<Cheque | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Add state for printing
  const [printingChequeId, setPrintingChequeId] = useState<number | null>(null);
  const [printOptionsModal, setPrintOptionsModal] = useState<{ isOpen: boolean; cheque: Cheque | null }>({ isOpen: false, cheque: null });

  // Add state for invoice upload
  const [invoiceUploadModalOpen, setInvoiceUploadModalOpen] = useState(false);
  const [selectedChequeForInvoice, setSelectedChequeForInvoice] = useState<Cheque | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);

  // Add state for Issue to Safe modal
  const [showIssueChequeModal, setShowIssueChequeModal] = useState(false);

  // Add state for detailed view modal
  const [detailViewModalOpen, setDetailViewModalOpen] = useState(false);
  const [selectedChequeForDetail, setSelectedChequeForDetail] = useState<Cheque | null>(null);

  // Helper function to safely convert to number
  const toNumber = (value: string | number): number => {
    return typeof value === 'string' ? parseFloat(value) || 0 : value;
  };

  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort cheques based on current sort config
  const sortedCheques = React.useMemo(() => {
    if (!sortConfig.key) return cheques;

    return [...cheques].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Cheque];
      const bValue = b[sortConfig.key as keyof Cheque];

      // Handle different data types
      if (sortConfig.key === 'amount' || sortConfig.key === 'total_expenses' || sortConfig.key === 'remaining_amount') {
        const aNum = toNumber(aValue as string | number);
        const bNum = toNumber(bValue as string | number);
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      if (sortConfig.key === 'issue_date' || sortConfig.key === 'settlement_date') {
        const aDate = new Date(aValue as string).getTime();
        const bDate = new Date(bValue as string).getTime();
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // String comparison
      const aStr = (aValue as string || '').toLowerCase();
      const bStr = (bValue as string || '').toLowerCase();
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [cheques, sortConfig]);

  // Get sort icon for column headers
  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-gray-400 ml-1">↕️</span>;
    }
    return sortConfig.direction === 'asc' ? 
      <span className="text-blue-600 ml-1">↑</span> : 
      <span className="text-blue-600 ml-1">↓</span>;
  };

  useEffect(() => {
    // Don't fetch data if attachment modal is open to prevent state reset
    if (!attachmentModalOpen) {
      fetchData();
      fetchBankAccounts();
    }
  }, [selectedSafe, activeTab, settledChequesPage, attachmentModalOpen]);



  const fetchBankAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${SIMPLE_API_URL}/bank-accounts-simple`, { headers });
      
      // Handle different API response formats safely
      const bankAccountsData = response.data;
      if (Array.isArray(bankAccountsData)) {
        setBankAccounts(bankAccountsData);
      } else if (bankAccountsData && Array.isArray(bankAccountsData.data)) {
        setBankAccounts(bankAccountsData.data);
      } else {
        console.warn('Unexpected bank accounts response format:', bankAccountsData);
        setBankAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setBankAccounts([]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch safes with cache busting
      console.log('🔍 Fetching safes from:', `${SIMPLE_API_URL}/safes-simple`);
      const safesResponse = await axios.get(`${SIMPLE_API_URL}/safes-simple?t=${Date.now()}`);
      
      // Handle different API response formats safely
      const safesData = safesResponse.data;
      console.log('📦 Safes API response:', safesData);
      console.log('📊 Is array?', Array.isArray(safesData));
      console.log('📊 Has data property?', safesData && Array.isArray(safesData.data));
      
      if (Array.isArray(safesData)) {
        console.log('✅ Setting safes directly (array format):', safesData.length, 'safes');
        setSafes(safesData);
      } else if (safesData && Array.isArray(safesData.data)) {
        console.log('✅ Setting safes from data property:', safesData.data.length, 'safes');
        setSafes(safesData.data);
      } else {
        console.warn('❌ Unexpected safes response format:', safesData);
        setSafes([]);
      }

      // Fetch cheques for selected safe or all cheques with cache busting
      if (selectedSafe) {
        // Build query parameters based on active tab and filters
        let queryParams = [`t=${Date.now()}`];
        
        if (activeTab === 'settled-cheques') {
          queryParams.push('status_filter=settled');
          queryParams.push(`limit=10`);
          queryParams.push(`offset=${settledChequesPage * 10}`);
          
          if (filterForm.cheque_number) {
            queryParams.push(`cheque_number=${encodeURIComponent(filterForm.cheque_number)}`);
          }
          if (filterForm.start_date) {
            queryParams.push(`start_date=${filterForm.start_date}`);
          }
          if (filterForm.end_date) {
            queryParams.push(`end_date=${filterForm.end_date}`);
          }
        } else {
          queryParams.push('status_filter=active');
        }
        
        const queryString = queryParams.join('&');
        const chequesResponse = await axios.get(`${API_BASE_URL}/safes/${selectedSafe}/cheques?${queryString}`);
        
        // Handle different API response formats safely
        const chequesData = chequesResponse.data;
        console.log('🔍 DEBUG: Raw cheques response:', chequesData);
        
        if (Array.isArray(chequesData)) {
          console.log('✅ DEBUG: Cheques data is array, first cheque:', chequesData[0]);
          console.log('📅 DEBUG: First cheque due_date:', chequesData[0]?.due_date);
          console.log('🔍 DEBUG: All cheques with due_date info:', chequesData.map(c => ({
            id: c.id,
            cheque_number: c.cheque_number,
            due_date: c.due_date,
            due_date_type: typeof c.due_date,
            due_date_value: c.due_date
          })));
          setCheques(chequesData);
        } else if (chequesData && Array.isArray(chequesData.data)) {
          console.log('✅ DEBUG: Cheques data has data property, first cheque:', chequesData.data[0]);
          console.log('📅 DEBUG: First cheque due_date:', chequesData.data[0]?.due_date);
          setCheques(chequesData.data);
        } else {
          console.warn('Unexpected cheques response format:', chequesData);
          setCheques([]);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Ensure we always have valid arrays even on error
      setSafes([]);
      setCheques([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableChequesForSettlement = async (safeId: number) => {
    try {
      // Fetch unassigned cheques for settlement (not cheques from the same safe) with cache busting
      const response = await axios.get(`${SIMPLE_API_URL}/cheques-unassigned-simple?t=${Date.now()}`);
      
      // Handle different API response formats safely
      let unassignedCheques: Cheque[] = [];
      if (Array.isArray(response.data)) {
        unassignedCheques = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        unassignedCheques = response.data.data;
      } else {
        console.warn('Unexpected unassigned cheques response format:', response.data);
        setAvailableChequesForSettlement([]);
        return;
      }
      
      // Filter for truly available cheques (not settled and with valid statuses)
      const availableCheques = unassignedCheques.filter((cheque: Cheque) => 
        !cheque.is_settled && 
        ['pending', 'open', 'active'].includes(cheque.status) &&
        toNumber(cheque.amount) === 0  // Only blank cheques can be used for settlement
      );
      setAvailableChequesForSettlement(availableCheques);
      
      // Debug log to help troubleshoot
      console.log('Total unassigned cheques:', unassignedCheques.length);
      console.log('Available for settlement:', availableCheques.length);
      console.log('Sample cheques:', unassignedCheques.slice(0, 3));
    } catch (error) {
      console.error('Error fetching available unassigned cheques:', error);
      // Ensure we always have a valid array even on error
      setAvailableChequesForSettlement([]);
    }
  };

  const handleSettleCheque = async (chequeId: number, settlingChequeId: number, settlingChequeNumber: string) => {
    try {
      if (!selectedCheque) return;
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Use the simple manual settlement endpoint (no authentication required)
      const response = await axios.post(`${SIMPLE_API_URL}/cheques/manual-settlement-simple`, {
        overspent_cheque_id: chequeId,
        settlement_cheque_id: settlingChequeId,
        settlement_amount: toNumber(selectedCheque.overspent_amount),
        tolerance_amount: 10.0, // 10 LE tolerance
        notes: t('chequeManagement.settlement.manualNotes')
      });
      
      // Refresh data
      await fetchData();
      setSettleModalOpen(false);
      setSelectedCheque(null);
      
      // Show detailed success message with server response
      const settlementAmount = toNumber(selectedCheque.overspent_amount);
      const serverMessage = response.data?.details || t('chequeManagement.messages.settlementSuccess', {
        chequeNumber: selectedCheque.cheque_number,
        settlingChequeNumber: settlingChequeNumber
      });
      
      alert(`✅ ${t('chequeManagement.messages.settlementCompleted')}\n\n` +
            `${serverMessage}\n\n` +
            `📊 ${t('chequeManagement.messages.summary')}:\n` +
            `• ${t('chequeManagement.messages.overspentCheque')}: ${selectedCheque.cheque_number}\n` +
            `• ${t('chequeManagement.messages.settlementCheque')}: ${settlingChequeNumber}\n` +
            `• ${t('chequeManagement.messages.settlementAmount')}: $${settlementAmount.toFixed(2)}\n\n` +
            `🎉 ${t('chequeManagement.messages.settlementSuccessMessage')}`);
    } catch (error) {
      console.error('Error settling cheque:', error);
      
      // Enhanced error message
      let errorMessage = t('chequeManagement.messages.settlementFailed');
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage += error.response.data.detail;
      } else {
        errorMessage += t('chequeManagement.messages.pleaseTryAgain');
      }
      alert('❌ ' + t('chequeManagement.messages.settlementFailedTitle') + '\n\n' + errorMessage);
    }
  };

  const openEarlySettlementModal = (cheque: Cheque) => {
    setSelectedChequeForEarlySettlement(cheque);
    setEarlySettlementForm({
      deposit_number: '',
      deposit_amount: toNumber(cheque.amount),
      deposit_date: new Date().toISOString().split('T')[0],
      bank_deposit_reference: '',
      notes: t('chequeManagement.earlySettlement.defaultNotes', { chequeNumber: cheque.cheque_number })
    });
    setSelectedFiles([]);
    setEarlySettlementModalOpen(true);
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray: File[] = Array.from(files);
      // Validate file types and sizes
      const validFiles = fileArray.filter((file) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!validTypes.includes(file.type)) {
          alert(t('chequeManagement.fileUpload.invalidFileType', { fileName: file.name }));
          return false;
        }
        if (file.size > maxSize) {
          alert(t('chequeManagement.fileUpload.fileTooLarge', { fileName: file.name }));
          return false;
        }
        return true;
      });
      setSelectedFiles(validFiles);
    }
  };

  const submitEarlySettlement = async () => {
    if (!selectedChequeForEarlySettlement) return;

    if (earlySettlementForm.deposit_amount <= 0) {
      alert(t('chequeManagement.validation.depositAmount'));
      return;
    }

    if (selectedFiles.length === 0) {
      alert('Please upload at least one file (deposit screenshot or bank statement)');
      return;
    }

    try {
      setIsSubmittingEarlySettlement(true);

      // Create FormData for multipart request with files
      const formData = new FormData();
      formData.append('cheque_id', selectedChequeForEarlySettlement.id.toString());
      formData.append('deposit_number', earlySettlementForm.deposit_number || '');
      formData.append('deposit_amount', earlySettlementForm.deposit_amount.toString());
      formData.append('deposit_date', earlySettlementForm.deposit_date);
      formData.append('bank_deposit_reference', earlySettlementForm.bank_deposit_reference || '');
      formData.append('notes', earlySettlementForm.notes || '');
      
      // Add all files
      selectedFiles.forEach((file: File) => {
        formData.append('files', file);
      });

      const response = await axios.post(`${API_BASE_URL}/early-settlements-simple`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const settlement = response.data.settlement;

      // Refresh data
      await fetchData();

      // Close modal and show success
      setEarlySettlementModalOpen(false);
      setSelectedChequeForEarlySettlement(null);

      // Show a professional success message
      const successMsg = t('chequeManagement.earlySettlement.successMessage', {
        chequeNumber: selectedChequeForEarlySettlement.cheque_number,
        depositNumber: earlySettlementForm.deposit_number,
        amount: earlySettlementForm.deposit_amount.toFixed(2),
        fileCount: selectedFiles.length
      });
      setSuccessMessage(successMsg);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);

    } catch (error) {
      console.error('Error creating early settlement:', error);
      let errorMessage = t('chequeManagement.messages.earlySettlementFailed');
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage += error.response.data.detail;
      } else {
        errorMessage += t('chequeManagement.messages.pleaseTryAgain');
      }
      alert('❌ ' + t('chequeManagement.messages.earlySettlementFailedTitle') + '\n\n' + errorMessage);
    } finally {
      setIsSubmittingEarlySettlement(false);
    }
  };

  const openCancelModal = (cheque: Cheque) => {
    setSelectedChequeForCancel(cheque);
    setCancellationReason('');
    setCancelModalOpen(true);
  };

  const openInvoiceUploadModal = (cheque: Cheque) => {
    setSelectedChequeForInvoice(cheque);
    setInvoiceFile(null);
    setInvoiceUploadModalOpen(true);
  };

  const handleInvoiceFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or image file (JPEG, PNG, GIF, WebP)');
        return;
      }
      if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
      }
      setInvoiceFile(file);
    }
  };

  const handleInvoiceUpload = async () => {
    if (!selectedChequeForInvoice || !invoiceFile) return;

    try {
      setIsUploadingInvoice(true);

      const formData = new FormData();
      formData.append('file', invoiceFile);

      // Get auth token
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`
      };

      // Upload invoice for the cheque
      await axios.post(
        `${API_BASE_URL}/cheques/${selectedChequeForInvoice.id}/upload-supplier-invoice`,
        formData,
        { headers }
      );

      // Refresh data
      await fetchData();

      // Close modal and show success
      setInvoiceUploadModalOpen(false);
      setSelectedChequeForInvoice(null);
      setInvoiceFile(null);

      // Show success message
      const successMsg = `Invoice uploaded successfully for cheque #${selectedChequeForInvoice.cheque_number}. The cheque is now fully settled.`;
      setSuccessMessage(successMsg);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);

    } catch (error) {
      console.error('Error uploading invoice:', error);
      let errorMessage = 'Failed to upload invoice. ';
      
      if (error.response?.data?.detail) {
        errorMessage += error.response.data.detail;
      } else {
        errorMessage += 'Please try again or contact support.';
      }
      
      alert('❌ Upload Failed\n\n' + errorMessage);
    } finally {
      setIsUploadingInvoice(false);
    }
  };

  const handleCancelCheque = async () => {
    if (!selectedChequeForCancel) return;

    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      await axios.post(`${API_BASE_URL}/cheques/${selectedChequeForCancel.id}/cancel`, {
        reason: cancellationReason
      }, { headers });

      // Refresh data
      await fetchData();

      // Close modal and show success
      setCancelModalOpen(false);
      setSelectedChequeForCancel(null);
      setCancellationReason('');

      // Show success message
      const successMsg = `Cheque ${selectedChequeForCancel.cheque_number} has been cancelled successfully.`;
      setSuccessMessage(successMsg);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);

    } catch (error) {
      console.error('Error cancelling cheque:', error);
      let errorMessage = 'Failed to cancel cheque. ';
      
      if (error.response?.status === 403) {
        errorMessage += 'You do not have permission to cancel cheques.';
      } else if (error.response?.data?.detail) {
        errorMessage += error.response.data.detail;
      } else {
        errorMessage += 'Please try again or contact support.';
      }
      
      alert('❌ Cancellation Failed\n\n' + errorMessage);
    }
  };

  // Open print options modal instead of direct printing
  const openPrintOptionsModal = (cheque: Cheque) => {
    setPrintOptionsModal({ isOpen: true, cheque });
  };

  // HTML Print functionality using saved field positions
  const handleHtmlPrint = async (cheque: Cheque, preview = false) => {
    if (!cheque) return;

    try {
      // Load saved field positions and settings from backend
      const [positionsResponse, settingsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/arabic-cheque/cheque-field-positions`),
        axios.get(`${API_BASE_URL}/arabic-cheque/cheque-settings`)
      ]);

      const savedPositions = positionsResponse.data || {};
      const savedSettings = settingsResponse.data || {};
      const fontSize = savedSettings.font_size || 16;

      // Field definitions (same as ChequePrintManager)
      const FIELD_DEFS = [
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
        { key: 'note_1', label: 'محرر الشيك' },
        { key: 'note_4', label: 'ملاحظة 4' },
        { key: 'company_table', label: 'جدول معلومات الشركة' },
        // Additional fields that might be in positions
        { key: 'safe_name', label: 'اسم الخزنة' },
        { key: 'bank_name', label: 'اسم البنك' }
      ];

      // Generate cheque data - using exact field mappings
      const amount = typeof cheque.amount === 'string' ? parseFloat(cheque.amount) : cheque.amount;
      
      // Extract safe name from cheque object
      const safeName = cheque.safe_name || safes.find(s => s.id === cheque.safe_id)?.name || 'غير محدد';
      
      // Debug log to check cheque structure
      console.log('🏦 Full cheque object:', cheque);
      console.log('🔍 Available fields in cheque:', Object.keys(cheque));
      
      // Parse bank info from bank_account field (format: "Account Name (Bank Name)")
      let bankName = '';
      let accountName = '';
      if (cheque.bank_account) {
        const bankMatch = cheque.bank_account.match(/^(.+?)\s*\((.+?)\)$/);
        if (bankMatch) {
          accountName = bankMatch[1].trim();
          bankName = bankMatch[2].trim();
        } else {
          bankName = cheque.bank_account;
        }
      }

      const chequeData: Record<string, string> = {
        cheque_number: cheque.cheque_number || '',
        amount_number: amount.toFixed(2),
        amount_words: convertToArabicWords(amount),
        beneficiary_name: cheque.issued_to || '',
        issue_date: cheque.issue_date ? new Date(cheque.issue_date).toLocaleDateString('ar-EG') : '',
        due_date: cheque.due_date ? new Date(cheque.due_date).toLocaleDateString('ar-EG') : '',
        description: cheque.description || 'بدون وصف',  // Ensure we only use actual cheque description
        payee_notice: 'يصرف للمستفيد الأول',  // FIXED: Match backend text
        recipient: 'مدير الشؤون المالية',  // FIXED: Use role instead of duplicate name
        receipt_date: new Date().toLocaleDateString('ar-EG'),
        note_1: 'محرر الشيك: إدارة الشؤون المالية',  // FIXED: Proper content instead of safe name
        note_4: `MR-${cheque.id}-${new Date().getFullYear()}`,  // FIXED: Reference number instead of bank name
        company_table: '', // Not used in field rendering
        safe_name: safeName,
        bank_name: bankName
      };

      // Debug logging
      console.log('📍 Loaded positions:', savedPositions);
      console.log('📄 Cheque data being printed:', cheque);
      console.log('🔍 Raw cheque.description:', cheque.description);
      console.log('🔍 Raw cheque.due_date:', cheque.due_date);
      console.log('🎨 Generated cheque fields:', chequeData);
      console.log('📝 Final description field:', chequeData.description);
      console.log('📅 Final due_date field:', chequeData.due_date);
      console.log('🏦 Bank info:', { bankName, accountName, safeName });

      // Use unified pixel-to-cm conversion
      const scaleX = PX_TO_CM;
      const scaleY = PX_TO_CM;

      // Check if we have a template background
      let backgroundStyle = '';
      try {
        const templateResponse = await axios.get(`${API_BASE_URL}/cheque-template-status`);
        if (templateResponse.data.template_exists) {
          backgroundStyle = `
            background-image: url('${API_BASE_URL}/cheque-template-preview');
            background-size: 21cm 29.7cm;
            background-repeat: no-repeat;
            background-position: center;
          `;
        }
      } catch (e) {
        // Template not available, continue without background
      }

      const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>طباعة شيك ${cheque.cheque_number}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        html, body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        body { 
            font-family: 'Arial', sans-serif; 
            direction: rtl;
            background: white;
        }
        .cheque-container {
            width: 21cm;
            height: 29.7cm;
            position: relative;
            margin: 0;
            background-color: white;
            page-break-after: avoid;
            page-break-inside: avoid;
            ${backgroundStyle}
        }
        .cheque-field {
            position: absolute;
            font-size: ${fontSize}pt;
            color: #000;
            white-space: nowrap;
            font-weight: bold;
            direction: rtl;
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
            html, body {
                width: 210mm;
                height: 297mm;
            }
            body { 
                print-color-adjust: exact; 
                -webkit-print-color-adjust: exact;
                margin: 0;
            }
            .no-print { 
                display: none !important; 
            }
            .cheque-container {
                page-break-after: avoid;
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="cheque-container">
        ${savedPositions.company_table ? `
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

        ${FIELD_DEFS.filter(field => {
          // Render all fields that have positions saved (except company_table)
          return field.key !== 'company_table' && savedPositions[field.key];
        }).map(field => {
          const pos = savedPositions[field.key];
          if (!pos || (!pos.x && pos.x !== 0) || (!pos.y && pos.y !== 0)) {
            console.warn(`⚠️ Invalid position for field ${field.key}:`, pos);
            return '';
          }
          
          const leftCm = (pos.x * scaleX).toFixed(2);
          const topCm = (pos.y * scaleY).toFixed(2);
          const fieldValue = chequeData[field.key] || '';
          
          // Log each field being rendered
          console.log(`📝 Rendering field ${field.key}: "${fieldValue}" at (${leftCm}cm, ${topCm}cm)`);
          
          // Only show actual data, not field labels
          return `<div class="cheque-field" style="left: ${leftCm}cm; top: ${topCm}cm;">${fieldValue}</div>`;
        }).join('\n        ')}
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
        // Show in modal (could be implemented later)
        alert('HTML Preview coming soon!');
      } else {
        // Open HTML in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          
          // Auto-trigger print after delay
          setTimeout(() => {
            printWindow.print();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error loading field positions for HTML print:', error);
      alert('Error loading field positions. Please check your field configuration in Cheque Printing settings.');
    }
  };

  const convertToArabicWords = (amount: number): string => {
    // Enhanced Arabic number conversion
    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
    
    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);
    
    // For now, return a simple format
    return `${integerPart.toLocaleString('ar-SA')} ريال سعودي`;
  };

  // Add print cheque handler with proper error handling and debugging (PDF version)
  const handlePrintCheque = async (cheque: Cheque) => {
    console.log('🖨️ Starting print process for cheque:', cheque);
    
    if (!cheque || !cheque.id) {
      console.error('❌ Invalid cheque data:', cheque);
      alert('Invalid cheque data');
      return;
    }

    // Check if cheque has necessary data for printing
    if (!cheque.amount || toNumber(cheque.amount) === 0) {
      console.warn('⚠️ Cheque has no amount:', cheque.amount);
      const confirmed = window.confirm(
        `This cheque (#${cheque.cheque_number}) has no amount specified. Do you still want to print it?`
      );
      if (!confirmed) {
        console.log('❌ User cancelled printing due to no amount');
        return;
      }
    }

    setPrintingChequeId(cheque.id);
    
    try {
      // Get auth token
      const token = localStorage.getItem('token');
      console.log('🔑 Auth token present:', !!token);
      
      // Prepare the API endpoint
      const endpoint = `${API_BASE_URL}/cheques/${cheque.id}/print-arabic`;
      console.log('🌐 Calling print endpoint:', endpoint);
      
      // Call the print API endpoint
      const response = await axios.post(
        endpoint,
        {}, // Empty body
        {
          responseType: 'blob',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('✅ Received response, blob size:', response.data.size);

      // Create blob URL and open in new tab
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      console.log('📄 Created blob URL:', url);
      
      // Open PDF in new tab
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        console.warn('⚠️ Popup blocked, providing direct download');
        // If popup blocked, provide direct download
        const link = document.createElement('a');
        link.href = url;
        link.download = `cheque_${cheque.cheque_number}_arabic.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.log('✅ Opened PDF in new window');
      }
      
      // Clean up URL after some delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        console.log('🧹 Cleaned up blob URL');
      }, 60000);

      // Update the cheque's print status in the backend
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.patch(`${API_BASE_URL}/cheques/${cheque.id}/mark-printed`, {}, { headers });
        console.log('✅ Marked cheque as printed in backend');
        
        // Update local state to reflect the print status
        setCheques(prevCheques => 
          prevCheques.map(c => 
            c.id === cheque.id 
              ? { 
                  ...c, 
                  is_printed: true, 
                  printed_at: new Date().toISOString(),
                  print_count: (c.print_count || 0) + 1
                }
              : c
          )
        );
      } catch (printUpdateError) {
        console.warn('⚠️ Failed to update print status in backend:', printUpdateError);
        // Continue even if backend update fails, as the print operation was successful
      }

      // Show success message
      const printStatus = cheque.is_printed ? 'reprinted' : 'printed';
      setSuccessMessage(`Cheque #${cheque.cheque_number} has been ${printStatus} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error: any) {
      console.error('❌ Error printing cheque:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      
      let errorMessage = 'Failed to print cheque. ';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. The server took too long to respond. Please try again.';
      } else if (error.response?.status === 404) {
        if (error.response.data?.detail?.includes('template')) {
          errorMessage = 'Cheque template not found. Please upload a template first using the Arabic Cheque Generator.';
        } else {
          errorMessage = 'Cheque not found in the system.';
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please check if the Arabic fonts are properly installed.';
      } else if (error.response?.data?.detail) {
        errorMessage += error.response.data.detail;
      } else if (!error.response) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage += 'Please try again or contact support.';
      }
      
      alert(errorMessage);
    } finally {
      setPrintingChequeId(null);
      console.log('🏁 Print process completed');
    }
  };

  // Cheque creation functions
  const handleCreateCheque = async () => {
    // Batch cheque creation only
    if (!batchForm.bank_account_id || !batchForm.start_number || !batchForm.end_number) {
      alert('Please fill in all required fields');
      return;
    }

    const startNum = parseInt(batchForm.start_number);
    const endNum = parseInt(batchForm.end_number);

    if (startNum >= endNum) {
      alert('Start number must be less than end number');
      return;
    }

    if (endNum - startNum > 1000) {
      alert('Cannot create more than 1000 cheques at once');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const payload = {
        bank_account_id: parseInt(batchForm.bank_account_id),
        start_number: startNum,
        end_number: endNum,
        prefix: batchForm.prefix || '',
        description: batchForm.description || ''
      };

      await axios.post(`${SIMPLE_API_URL}/cheques/create-range-simple`, payload, { headers });
      resetChequeForms();
      fetchData();
      alert(`Successfully created ${endNum - startNum + 1} cheques!`);
    } catch (error: any) {
      console.error('Error creating cheque batch:', error);
      alert(`Failed to create cheque batch: ${error.response?.data?.detail || error.message}`);
    }
  };

  const resetChequeForms = () => {
    setChequeForm({
      cheque_number: '',
      bank_account_id: '',
      amount: '',
      description: '',
      issue_date: new Date().toISOString().split('T')[0]
    });
    setBatchForm({
      bank_account_id: '',
      start_number: '',
      end_number: '',
      prefix: '',
      description: ''
    });
  };

  const handleUseTemplate = (template: any) => {
    setChequeForm({
      cheque_number: '',
      bank_account_id: template.bank_account_id.toString(),
      amount: template.default_amount.toString(),
      description: template.description,
      issue_date: new Date().toISOString().split('T')[0]
    });
    setShowChequeModal(true);
  };

  // Initialize roleManager with user prop data
  const [userInitialized, setUserInitialized] = useState(false);
  
  useEffect(() => {
    if (user && user.role) {
      console.log('🔧 ChequeManagement: Initializing roleManager with user prop:', user);
      console.log('🔧 User role object:', user.role);
      console.log('🔧 User role name:', user.role.name);
      
      // Create user object with role as string (role.name) for roleManager
      const userForRoleManager = {
        ...user,
        role: user.role.name  // Extract role name from role object
      };
      
      console.log('🔧 User data for roleManager:', userForRoleManager);
      roleManager.setUser(userForRoleManager);
      setUserInitialized(true);
      console.log('🔧 Role manager initialized with prop data, userInitialized set to true');
    } else {
      console.log('🔧 No user prop or user role missing:', user);
    }
  }, [user]);

  // Calculate permissions dynamically after user is initialized
  const canCancelCheques = userInitialized ? roleManager.hasPermission(PERMISSIONS.CANCEL_CHEQUE) : false;
  
  // Debug: Log permission check results with actual values
  console.log('🔧 ChequeManagement Debug:');
  console.log('  userInitialized:', userInitialized);
  console.log('  currentRole:', roleManager.getCurrentRole());
  console.log('  canCancelCheques:', canCancelCheques);
  console.log('  allPermissions count:', roleManager.getCurrentPermissions().length);
  console.log('  first 3 permissions:', roleManager.getCurrentPermissions().slice(0, 3));
  console.log('  user prop role:', user?.role?.name);

  const getStatusBadge = (cheque: Cheque) => {
    // Check status field first for most accurate status
    if (cheque.status === 'settled') {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{t('chequeManagement.status.settled')}</span>;
    }
    if (cheque.status === 'settled_pending_invoice') {
      return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Settled - Pending Invoice</span>;
    }
    if (cheque.status === 'cancelled') {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Cancelled</span>;
    }
    // Check is_settled flag as fallback
    if (cheque.is_settled) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{t('chequeManagement.status.settled')}</span>;
    }
    // Check for overspent
    if (toNumber(cheque.overspent_amount) > 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">{t('chequeManagement.status.overspent')}</span>;
    }
    // Check for fully used
    if (toNumber(cheque.total_expenses) === toNumber(cheque.amount)) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{t('chequeManagement.status.fullyUsed')}</span>;
    }
    // Check for partially used
    if (toNumber(cheque.total_expenses) > 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">{t('chequeManagement.status.partiallyUsed')}</span>;
    }
    // Default to available
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">{t('chequeManagement.status.available')}</span>;
  };

  // Function to open detail view modal
  const openDetailViewModal = (cheque: Cheque) => {
    setSelectedChequeForDetail(cheque);
    setDetailViewModalOpen(true);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">{t('chequeManagement.title')}</h2>
      
      {/* Internal Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('cheques')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'cheques'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Receipt className="w-4 h-4 inline mr-2" />
          Cheques
        </button>
        <button
          onClick={() => setActiveTab('issue-cheque')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'issue-cheque'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          {t('chequeManagement.tabs.issueCheque')}
        </button>
        <button
          onClick={() => setActiveTab('issue-to-safe')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'issue-to-safe'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Send className="w-4 h-4 inline mr-2" />
          {t('chequeManagement.tabs.issueToSafe')}
        </button>

        <button
          onClick={() => setActiveTab('settled-cheques')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'settled-cheques'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle className="w-4 h-4 inline mr-2" />
          {t('chequeManagement.tabs.settledCheques')}
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'cheques' && (
        <div>
          {/* Existing Active Cheques Content */}
      

      
      {/* Success Notification */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg border border-green-600">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">{t('chequeManagement.success.title')}</h3>
                <p className="mt-1 text-sm text-green-200">{successMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setSuccessMessage(null)}
                    className="inline-flex bg-green-500 rounded-md p-1.5 text-green-300 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-500 focus:ring-green-300"
                  >
                    <span className="sr-only">{t('chequeManagement.buttons.dismiss')}</span>
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safe Selection */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('chequeManagement.selectSafe')}
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems:'center' }}>
            <select
              value={selectedSafe || ''}
              onChange={(e) => setSelectedSafe(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('chequeManagement.selectSafePlaceholder')}</option>
              {safes.map((safe) => (
                <option key={safe.id} value={safe.id}>
                  {safe.name} ({t('chequeManagement.balance')}: ${safe.current_balance})
                </option>
              ))}
            </select>
            {/* Safe rename moved to Finance > Safes tab */}
          </div>
        </div>
        
        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="ml-4 px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? t('chequeManagement.buttons.refreshing') : t('chequeManagement.buttons.refreshData')}
        </button>
      </div>

      {/* Cheques List */}
      {selectedSafe && (
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-4">
              <button
                onClick={() => {
                  setActiveTab('cheques');
                  setSettledChequesPage(0);
                  fetchData();
                }}
                className={`${
                  activeTab === 'cheques'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {t('chequeManagement.tabs.cheques')}
              </button>
              <button
                onClick={() => {
                  setActiveTab('issue-cheque');
                  setSettledChequesPage(0);
                  fetchData();
                }}
                className={`${
                  activeTab === 'issue-cheque'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {t('chequeManagement.tabs.issueCheque')}
              </button>

              <button
                onClick={() => {
                  setActiveTab('settled-cheques');
                  setSettledChequesPage(0);
                  fetchData();
                }}
                className={`${
                  activeTab === 'settled-cheques'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {t('chequeManagement.tabs.settledCheques')}
              </button>
            </nav>
          </div>

          {/* Filters for Settled Cheques */}
          {activeTab === 'settled-cheques' && (
            <div className="p-4 bg-gray-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cheque Number
                  </label>
                  <input
                    type="text"
                    value={filterForm.cheque_number}
                    onChange={(e) => setFilterForm(prev => ({ ...prev, cheque_number: e.target.value }))}
                    placeholder="Search by cheque number..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filterForm.start_date}
                    onChange={(e) => setFilterForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filterForm.end_date}
                    onChange={(e) => setFilterForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSettledChequesPage(0);
                      fetchData();
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Search
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    setFilterForm({ cheque_number: '', start_date: '', end_date: '' });
                    setSettledChequesPage(0);
                    fetchData();
                  }}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">
              {activeTab === 'cheques' 
                ? t('chequeManagement.chequesInSafe') 
                : activeTab === 'issue-cheque'
                  ? t('chequeManagement.chequesToIssue')
                  : activeTab === 'issue-to-safe'
                    ? t('chequeManagement.issueToSafeTitle')
                : 'Settled Cheques (Latest 10)'}
            </h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">{t('chequeManagement.loadingCheques')}</div>
          ) : cheques.length === 0 ? (
            <div className="p-8 text-center text-gray-500">{t('chequeManagement.noChequesFound')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('cheque_number')}
                    >
                      <div className="flex items-center">
                        {t('chequeManagement.table.chequeNumber')}
                        {getSortIcon('cheque_number')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('bank_account')}
                    >
                      <div className="flex items-center">
                        {t('chequeManagement.chequesList.headers.bankAccount')}
                        {getSortIcon('bank_account')}
                      </div>
                    </th>
                    {activeTab === 'settled-cheques' && (
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('issued_to')}
                      >
                        <div className="flex items-center">
                          {t('chequeManagement.chequesList.headers.issuedTo')}
                          {getSortIcon('issued_to')}
                        </div>
                      </th>
                    )}
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center">
                        {t('chequeManagement.table.amount')}
                        {getSortIcon('amount')}
                      </div>
                    </th>
                    {activeTab === 'cheques' && (
                      <>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort('total_expenses')}
                        >
                          <div className="flex items-center">
                            {t('chequeManagement.table.used')}
                            {getSortIcon('total_expenses')}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort('remaining_amount')}
                        >
                          <div className="flex items-center">
                            {t('chequeManagement.table.remaining')}
                            {getSortIcon('remaining_amount')}
                          </div>
                        </th>
                      </>
                    )}
                    {activeTab === 'settled-cheques' && (
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('settlement_date')}
                      >
                        <div className="flex items-center">
                          Settlement Date
                          {getSortIcon('settlement_date')}
                        </div>
                      </th>
                    )}
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        {t('chequeManagement.table.status')}
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('issue_date')}
                    >
                      <div className="flex items-center">
                        Issue Date
                        {getSortIcon('issue_date')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('due_date')}
                    >
                      <div className="flex items-center">
                        Due Date
                        {getSortIcon('due_date')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('description')}
                    >
                      <div className="flex items-center">
                        {t('chequeManagement.table.description')}
                        {getSortIcon('description')}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Print Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('chequeManagement.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeTab === 'cheques' 
                    ? sortedCheques
                        .filter(cheque => cheque.status !== 'settled' && !cheque.is_settled && cheque.status !== 'cancelled')
                        .map((cheque) => (
                        <tr key={cheque.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{cheque.cheque_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{cheque.bank_account || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">${toNumber(cheque.amount).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm">
                            ${toNumber(cheque.total_expenses).toFixed(2)}
                            {toNumber(cheque.overspent_amount) > 0 && (
                              <span className="text-red-600 text-xs ml-1">
                                (+${toNumber(cheque.overspent_amount).toFixed(2)})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            ${toNumber(cheque.remaining_amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(cheque)}</td>
                          <td className="px-4 py-3 text-sm">
                            {cheque.issue_date ? new Date(cheque.issue_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {cheque.due_date ? new Date(cheque.due_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {cheque.description}
                            {cheque.is_settled && cheque.settled_by_cheque_id && (
                              <div className="text-xs text-green-600 mt-1 p-2 bg-green-50 rounded">
                                ✅ <strong>{t('chequeManagement.settlement.settledSuccessfully')}</strong><br/>
                                {t('chequeManagement.settlement.settlementChequeId')}: {cheque.settled_by_cheque_id}<br/>
                                <span className="text-gray-600">{t('chequeManagement.settlement.refreshToSeeDetails')}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {cheque.is_printed ? (
                              <div className="flex flex-col">
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                  ✅ Printed
                                </span>
                                {cheque.print_count && cheque.print_count > 1 && (
                                  <span className="text-xs text-gray-500 mt-1">
                                    {cheque.print_count} times
                                  </span>
                                )}
                                {cheque.printed_at && (
                                  <span className="text-xs text-gray-500 mt-1">
                                    {new Date(cheque.printed_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                Not Printed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {/* Invoice Upload Button - for supplier payments pending invoice */}
                              {cheque.status === 'settled_pending_invoice' && cheque.is_supplier_payment && !cheque.supplier_invoice_uploaded && (
                                <button
                                  onClick={() => openInvoiceUploadModal(cheque)}
                                  className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 flex items-center gap-1"
                                  title="Upload supplier invoice"
                                >
                                  <Upload className="w-3 h-3" />
                                  Upload Invoice
                                </button>
                              )}
                              
                              {/* Early Settlement Button - available for assigned, non-settled, non-overspent cheques */}
                              {selectedSafe && !cheque.is_settled && cheque.status !== 'settled_pending_invoice' && !cheque.is_overspent && toNumber(cheque.overspent_amount) <= 0 && (
                                <button
                                  onClick={() => openEarlySettlementModal(cheque)}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                  title={t('chequeManagement.buttons.earlySettlementTooltip')}
                                >
                                  {t('chequeManagement.buttons.earlySettlement')}
                                </button>
                              )}
                              
                              {/* Overspent Settlement Button - Use is_overspent flag instead of overspent_amount */}
                              {(cheque.is_overspent || toNumber(cheque.overspent_amount) > 0) && !cheque.is_settled && (
                                <button
                                  onClick={() => {
                                    setSelectedCheque(cheque);
                                    fetchAvailableChequesForSettlement(selectedSafe!);
                                    setSettleModalOpen(true);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                  {t('chequeManagement.buttons.settle')}
                                </button>
                              )}

                              {/* Cancel Button - available for non-settled, non-cancelled cheques with proper permissions */}
                              {!cheque.is_settled && cheque.status !== 'cancelled' && canCancelCheques && toNumber(cheque.total_expenses) === 0 && (
                                <button
                                  onClick={() => openCancelModal(cheque)}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                  title="Cancel this cheque"
                                >
                                  🚫 Cancel
                                </button>
                              )}

                              {/* View Details Button - available for all cheques */}
                              <button
                                onClick={() => openDetailViewModal(cheque)}
                                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 flex items-center gap-1"
                                title="View all cheque details"
                              >
                                <Eye className="w-3 h-3" />
                                View Details
                              </button>

                              {/* Print Cheque Button - available for all cheques */}
                              <button
                                onClick={() => openPrintOptionsModal(cheque)}
                                disabled={printingChequeId === cheque.id}
                                className={`px-3 py-1 text-white text-sm rounded disabled:opacity-50 flex items-center gap-1 ${
                                  cheque.is_printed 
                                    ? 'bg-orange-600 hover:bg-orange-700' 
                                    : 'bg-purple-600 hover:bg-purple-700'
                                }`}
                                title={cheque.is_printed ? "Choose print format for reprint" : "Choose print format"}
                              >
                                {printingChequeId === cheque.id ? (
                                  <>
                                    <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                                    {cheque.is_printed ? 'Reprinting...' : t('chequeManagement.buttons.printing')}
                                  </>
                                ) : (
                                  <>
                                    <Printer className="w-3 h-3" />
                                    {cheque.is_printed ? 'Print' : t('chequeManagement.buttons.print')}
                                  </>
                                )}
                              </button>
                              
                              {cheque.is_settled && (
                                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded">
                                  {t('chequeManagement.status.settled')}
                                </span>
                              )}

                              {cheque.status === 'cancelled' && (
                                <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded">
                                  Cancelled
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    : activeTab === 'issue-cheque'
                      ? sortedCheques.map((cheque) => (
                          <tr key={cheque.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{cheque.cheque_number}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{cheque.bank_account || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">${toNumber(cheque.amount).toFixed(2)}</td>
                            <td className="px-4 py-3">{getStatusBadge(cheque)}</td>
                            <td className="px-4 py-3 text-sm">
                              {cheque.issue_date ? new Date(cheque.issue_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {cheque.due_date ? new Date(cheque.due_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{cheque.description}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                {cheque.has_attachments && (
                                  <button
                                    onClick={() => {
                                      const attachmentsWithChequeId = (cheque.attachments || []).map(att => ({
                                        ...att,
                                        cheque_id: cheque.id
                                      }));
                                      setSelectedAttachments(attachmentsWithChequeId);
                                      setAttachmentModalOpen(true);
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                                    title="View settlement attachments"
                                  >
                                    📎 View Attachments ({cheque.attachments?.length || 0})
                                  </button>
                                )}
                                <button
                                  onClick={() => openPrintOptionsModal(cheque)}
                                  disabled={printingChequeId === cheque.id}
                                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                                  title="Choose print format"
                                >
                                  {printingChequeId === cheque.id ? (
                                    <>
                                      <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                                      {t('chequeManagement.buttons.printing')}
                                    </>
                                  ) : (
                                    <>
                                      <Printer className="w-3 h-3" />
                                      {t('chequeManagement.buttons.print')}
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))

                    : sortedCheques.map((cheque) => (
                        <tr key={cheque.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{cheque.cheque_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{cheque.bank_account || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{cheque.issued_to || '-'}</td>
                          <td className="px-4 py-3 text-sm">${toNumber(cheque.amount).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm">
                            {cheque.settlement_date ? new Date(cheque.settlement_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(cheque)}</td>
                              <td className="px-4 py-3 text-sm">
                                {cheque.issue_date ? new Date(cheque.issue_date).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {cheque.due_date ? new Date(cheque.due_date).toLocaleDateString() : '-'}
                              </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{cheque.description}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {cheque.has_attachments && (
                                <button
                                  onClick={() => {
                                    const attachmentsWithChequeId = (cheque.attachments || []).map(att => ({
                                      ...att,
                                      cheque_id: cheque.id
                                    }));
                                    setSelectedAttachments(attachmentsWithChequeId);
                                    setAttachmentModalOpen(true);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                                  title="View settlement attachments"
                                >
                                  📎 View Attachments ({cheque.attachments?.length || 0})
                                </button>
                              )}
                              <button
                                onClick={() => handlePrintCheque(cheque)}
                                disabled={printingChequeId === cheque.id}
                                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                                title="Print cheque in Arabic format"
                              >
                                {printingChequeId === cheque.id ? (
                                  <>
                                    <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                                    {t('chequeManagement.buttons.printing')}
                                  </>
                                ) : (
                                  <>
                                    <Printer className="w-3 h-3" />
                                    {t('chequeManagement.buttons.print')}
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
              {activeTab === 'cheques' && sortedCheques.filter(cheque => cheque.status !== 'settled' && !cheque.is_settled && cheque.status !== 'cancelled').length === 0 && sortedCheques.length > 0 && (
                <div className="p-8 text-center text-gray-500">
                  All cheques in this safe are either settled or cancelled. Check the "Settled Cheques" tab to view settled cheques.
                </div>
              )}
              {activeTab === 'issue-cheque' && sortedCheques.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No cheques to issue. Please create a new cheque.
                </div>
              )}
            </div>
          )}

          {/* Pagination for Settled Cheques */}
          {activeTab === 'settled-cheques' && sortedCheques.length >= 10 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {settledChequesPage * 10 + 1}-{Math.min((settledChequesPage + 1) * 10, settledChequesPage * 10 + sortedCheques.length)} of latest settled cheques
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSettledChequesPage(Math.max(0, settledChequesPage - 1));
                    setTimeout(() => fetchData(), 100);
                  }}
                  disabled={settledChequesPage === 0}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">Page {settledChequesPage + 1}</span>
                <button
                  onClick={() => {
                    setSettledChequesPage(settledChequesPage + 1);
                    setTimeout(() => fetchData(), 100);
                  }}
                  disabled={sortedCheques.length < 10}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attachment Modal */}
      {attachmentModalOpen && console.log('🎯 MODAL IS RENDERING! attachmentModalOpen:', attachmentModalOpen, 'attachments:', selectedAttachments.length)}
      {attachmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', maxWidth: '1024px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-blue-600">Settlement Attachments ({selectedAttachments.length} files)</h3>
              <button
                onClick={() => {
                  setAttachmentModalOpen(false);
                  setSelectedAttachments([]);
                  setViewingAttachment(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {selectedAttachments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No attachments found for this settlement.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedAttachments.map((attachment, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {attachment.original_filename}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Extract cheque_id from filename pattern: settlement_123_uuid.ext
                            const chequeId = attachment.filename.split('_')[1];
                            const url = `${API_BASE_URL}/cheques/${chequeId}/settlement-attachments/${attachment.filename}`;
                            setViewingAttachment(url);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          👁️ View
                        </button>
                        <button
                          onClick={() => {
                            // Extract cheque_id from filename pattern: settlement_123_uuid.ext
                            const chequeId = attachment.filename.split('_')[1];
                            const url = `${API_BASE_URL}/cheques/${chequeId}/settlement-attachments/${attachment.filename}`;
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = attachment.original_filename;
                            link.click();
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          📥 Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* File Viewer */}
                {viewingAttachment && (
                  <div className="mt-6 border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium">File Preview</h4>
                      <button
                        onClick={() => setViewingAttachment(null)}
                        className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                      >
                        Close Preview
                      </button>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      {viewingAttachment.toLowerCase().includes('.pdf') ? (
                        <iframe
                          src={viewingAttachment}
                          className="w-full h-96"
                          title="PDF Preview"
                        />
                      ) : (
                        <img
                          src={viewingAttachment}
                          alt="Settlement attachment"
                          className="max-w-full h-auto mx-auto"
                          style={{ maxHeight: '400px' }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Section - When no safe is selected */}
      {!selectedSafe && safes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                {t('chequeManagement.helpSection.title')}
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>{t('chequeManagement.helpSection.introduction')}</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>{t('chequeManagement.helpSection.step1')}</li>
                  <li>{t('chequeManagement.helpSection.step2')}</li>
                  <li>{t('chequeManagement.helpSection.step3')}</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Safes Available */}
      {!selectedSafe && safes.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                {t('chequeManagement.noSafesAvailable.title')}
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{t('chequeManagement.noSafesAvailable.message')}</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{t('chequeManagement.noSafesAvailable.createSafes')}</li>
                  <li>{t('chequeManagement.noSafesAvailable.contactAdmin')}</li>
                </ul>
                <button
                  onClick={() => fetchData()}
                  className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  {t('chequeManagement.noSafesAvailable.refreshData')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Early Settlement Modal */}
      {earlySettlementModalOpen && selectedChequeForEarlySettlement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-green-600">{t('chequeManagement.earlySettlement.title')}</h3>
            
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-800">
                {t('chequeManagement.earlySettlement.chequeNumber')} #{selectedChequeForEarlySettlement.cheque_number}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {t('chequeManagement.earlySettlement.amount')}: ${toNumber(selectedChequeForEarlySettlement.amount).toFixed(2)}
              </p>
            </div>

            <div className="space-y-4">
              {/* Deposit Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.earlySettlement.depositNumber')} *
                </label>
                <input
                  type="text"
                  value={earlySettlementForm.deposit_number}
                  onChange={(e) => setEarlySettlementForm(prev => ({
                    ...prev,
                    deposit_number: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t('chequeManagement.earlySettlement.depositNumberPlaceholder')}
                  required
                />
              </div>

              {/* Deposit Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.earlySettlement.depositAmount')} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={earlySettlementForm.deposit_amount}
                  onChange={(e) => setEarlySettlementForm(prev => ({
                    ...prev,
                    deposit_amount: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {/* Deposit Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.earlySettlement.depositDate')} *
                </label>
                <input
                  type="date"
                  value={earlySettlementForm.deposit_date}
                  onChange={(e) => setEarlySettlementForm(prev => ({
                    ...prev,
                    deposit_date: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {/* Bank Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.earlySettlement.bankReference')}
                </label>
                <input
                  type="text"
                  value={earlySettlementForm.bank_deposit_reference}
                  onChange={(e) => setEarlySettlementForm(prev => ({
                    ...prev,
                    bank_deposit_reference: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t('chequeManagement.earlySettlement.bankReferencePlaceholder')}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.earlySettlement.notes')}
                </label>
                <textarea
                  value={earlySettlementForm.notes}
                  onChange={(e) => setEarlySettlementForm(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder={t('chequeManagement.earlySettlement.notesPlaceholder')}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.fileUpload.title')}
                </label>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                  onChange={handleFileSelection}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: JPG, PNG, GIF, WebP, PDF (Max 10MB each)
                </p>
                {selectedFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">{t('chequeManagement.fileUpload.selectedFiles')}:</p>
                    <ul className="text-xs text-gray-600">
                      {selectedFiles.map((file, index) => (
                        <li key={index}>• {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEarlySettlementModalOpen(false);
                  setSelectedChequeForEarlySettlement(null);
                  setSelectedFiles([]);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isSubmittingEarlySettlement}
              >
                {t('chequeManagement.buttons.cancel')}
              </button>
              <button
                onClick={submitEarlySettlement}
                disabled={isSubmittingEarlySettlement || !earlySettlementForm.deposit_number.trim() || earlySettlementForm.deposit_amount <= 0}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmittingEarlySettlement ? t('chequeManagement.buttons.creatingSettlement') : t('chequeManagement.buttons.createEarlySettlement')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settle Modal */}
      {settleModalOpen && selectedCheque && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-red-600">🔧 Settle Overspent Cheque</h3>
            
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800">
                Cheque #{selectedCheque.cheque_number} is overspent by ${toNumber(selectedCheque.overspent_amount).toFixed(2)}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Amount: ${toNumber(selectedCheque.amount).toFixed(2)} • Expenses: ${toNumber(selectedCheque.total_expenses).toFixed(2)} • Overspent: ${toNumber(selectedCheque.overspent_amount).toFixed(2)}
              </p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-700 font-medium">
                📋 Select an unassigned cheque to settle this overspent amount:
              </p>
              <p className="text-xs text-gray-500 mt-1">
                The selected cheque will receive the exact overspent amount (${toNumber(selectedCheque.overspent_amount).toFixed(2)}) as its value.
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableChequesForSettlement.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  ❌ No unassigned cheques available for settlement
                </p>
              ) : (
                availableChequesForSettlement.map((cheque) => (
                  <div
                    key={cheque.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSettleCheque(selectedCheque.id, cheque.id, cheque.cheque_number)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium text-blue-600">#{cheque.cheque_number}</p>
                        <p className="text-sm text-gray-600">{cheque.description || 'No description'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Status: {cheque.status} • Current Amount: ${toNumber(cheque.amount).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          ✨ Will receive: ${toNumber(selectedCheque?.overspent_amount || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Click to settle
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSettleModalOpen(false);
                  setSelectedCheque(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Cheque Modal */}
      {cancelModalOpen && selectedChequeForCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-red-600">🚫 Cancel Cheque</h3>
            
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800">
                Are you sure you want to cancel cheque #{selectedChequeForCancel.cheque_number}?
              </p>
              <p className="text-xs text-red-600 mt-1">
                Amount: ${toNumber(selectedChequeForCancel.amount).toFixed(2)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                <strong>Warning:</strong> This action cannot be undone. The cheque will be marked as cancelled and removed from the safe balance.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation *
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Please provide a reason for cancelling this cheque..."
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setCancelModalOpen(false);
                  setSelectedChequeForCancel(null);
                  setCancellationReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Keep Cheque
              </button>
              <button
                onClick={handleCancelCheque}
                disabled={!cancellationReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Cancel Cheque
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Upload Modal */}
      {invoiceUploadModalOpen && selectedChequeForInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-orange-600">📄 Upload Supplier Invoice</h3>
            
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm font-semibold text-orange-800">
                Upload invoice for cheque #{selectedChequeForInvoice.cheque_number}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Amount: ${toNumber(selectedChequeForInvoice.amount).toFixed(2)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {selectedChequeForInvoice.description}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Invoice File *
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleInvoiceFileSelection}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, JPEG, PNG, GIF, WebP (Max 10MB)
              </p>
              {invoiceFile && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700">
                    Selected: <strong>{invoiceFile.name}</strong> ({(invoiceFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setInvoiceUploadModalOpen(false);
                  setSelectedChequeForInvoice(null);
                  setInvoiceFile(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isUploadingInvoice}
              >
                Cancel
              </button>
              <button
                onClick={handleInvoiceUpload}
                disabled={!invoiceFile || isUploadingInvoice}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isUploadingInvoice ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Settled Cheques Tab */}
      {activeTab === 'settled-cheques' && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{t('chequeManagement.tabs.settledCheques')}</h3>
            <p className="text-sm text-gray-600">View all cheques that have been settled, including early settlements and supplier payments.</p>
          </div>

          {/* Search and Filter Controls for Settled Cheques */}
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Safe (Optional)
                </label>
                <select
                  value={selectedSafe || ''}
                  onChange={(e) => setSelectedSafe(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Safes</option>
                  {safes.map((safe) => (
                    <option key={safe.id} value={safe.id}>
                      {safe.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cheque Number
                </label>
                <input
                  type="text"
                  value={filterForm.cheque_number}
                  onChange={(e) => setFilterForm(prev => ({ ...prev, cheque_number: e.target.value }))}
                  placeholder="Search by cheque number..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={filterForm.start_date}
                  onChange={(e) => setFilterForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={filterForm.end_date}
                  onChange={(e) => setFilterForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex flex-col justify-end">
                <button
                  onClick={() => {
                    setSettledChequesPage(0);
                    fetchData();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-2"
                >
                  Search
                </button>
                <button
                  onClick={() => fetchData()}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  {loading ? 'Refresh' : 'Refresh'}
                </button>
              </div>
            </div>
            
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setFilterForm({ cheque_number: '', start_date: '', end_date: '' });
                  setSettledChequesPage(0);
                  fetchData();
                }}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>



          {/* Settled Cheques List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Settled Cheques History</h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">Loading settled cheques...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('cheque_number')}
                      >
                        <div className="flex items-center">
                          {t('chequeManagement.table.chequeNumber')}
                          {getSortIcon('cheque_number')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('bank_account')}
                      >
                        <div className="flex items-center">
                          {t('chequeManagement.chequesList.headers.bankAccount')}
                          {getSortIcon('bank_account')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center">
                          {t('chequeManagement.table.amount')}
                          {getSortIcon('amount')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('total_expenses')}
                      >
                        <div className="flex items-center">
                          Total Used
                          {getSortIcon('total_expenses')}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('chequeManagement.table.settlementType')}
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('description')}
                      >
                        <div className="flex items-center">
                          {t('chequeManagement.table.description')}
                          {getSortIcon('description')}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('chequeManagement.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedCheques
                      .filter(cheque => cheque.status === 'settled' || cheque.is_settled)
                      .map((cheque) => (
                        <tr key={cheque.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{cheque.cheque_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{cheque.bank_account || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">${toNumber(cheque.amount).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm">${toNumber(cheque.total_expenses).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            {/* Determine settlement type based on various indicators */}
                            {cheque.is_supplier_payment && cheque.supplier_invoice_uploaded ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                {t('chequeManagement.settlementTypes.supplierPayment')}
                              </span>
                            ) : cheque.settled_by_cheque_id ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                {t('chequeManagement.settlementTypes.overspentSettlement')}
                              </span>
                            ) : cheque.description?.toLowerCase().includes('settlement for overspent') || 
                              cheque.description?.toLowerCase().includes('overspent') ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                {t('chequeManagement.settlementTypes.overspentSettlement')}
                              </span>
                            ) : cheque.description?.toLowerCase().includes('early settlement') ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                {t('chequeManagement.settlementTypes.earlySettlement')}
                              </span>
                            ) : toNumber(cheque.total_expenses) > toNumber(cheque.amount) ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                {t('chequeManagement.settlementTypes.overspentSettlement')}
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                {t('chequeManagement.settlementTypes.standardSettlement')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {cheque.description}
                            {cheque.settled_by_cheque_id && (
                              <div className="text-xs text-purple-600 mt-1">
                                Settled by cheque #{cheque.settled_by_cheque_id}
                              </div>
                            )}
                            {/* Show overspent info if this was an overspent cheque */}
                            {toNumber(cheque.total_expenses) > toNumber(cheque.amount) && (
                              <div className="text-xs text-red-600 mt-1">
                                Overspent by ${(toNumber(cheque.total_expenses) - toNumber(cheque.amount)).toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {/* View Attachments Button - for settled cheques with attachments */}
                              {cheque.has_attachments && (
                                <button
                                  onClick={() => {
                                    const attachmentsWithChequeId = (cheque.attachments || []).map(att => ({
                                      ...att,
                                      cheque_id: cheque.id
                                    }));
                                    setSelectedAttachments(attachmentsWithChequeId);
                                    setAttachmentModalOpen(true);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                                  title="View settlement attachments"
                                >
                                  📎 View Attachments ({cheque.attachments?.length || 0})
                                </button>
                              )}
                              
                              {/* Print Button */}
                              <button
                                onClick={() => openPrintOptionsModal(cheque)}
                                disabled={printingChequeId === cheque.id}
                                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                                title="Choose print format"
                              >
                                {printingChequeId === cheque.id ? (
                                  <>
                                    <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                                    {t('chequeManagement.buttons.printing')}
                                  </>
                                ) : (
                                  <>
                                    <Printer className="w-3 h-3" />
                                    {t('chequeManagement.buttons.print')}
                                  </>
                                )}
                              </button>
                              
                              {/* Settled Badge */}
                              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                Settled
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {sortedCheques.filter(cheque => cheque.status === 'settled' || cheque.is_settled).length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No settled cheques found{selectedSafe ? ' for this safe' : ''}.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Cheque Batch Tab */}
      {activeTab === 'issue-cheque' && (
        <div>
          <h3 className="text-lg font-bold mb-4">Create Cheque Batch</h3>
          


          {/* Batch Creation Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-semibold mb-4">Create Batch of Cheques</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
              Create multiple blank cheques in a range. Details will be added when issuing to safes.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account *
                  </label>
                  <select
                    value={batchForm.bank_account_id}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, bank_account_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Bank Account</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_name} - {account.bank_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prefix (Optional)
                  </label>
                  <input
                    type="text"
                    value={batchForm.prefix}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, prefix: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CHQ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Number *
                  </label>
                  <input
                    type="number"
                    value={batchForm.start_number}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, start_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Number *
                  </label>
                  <input
                    type="number"
                    value={batchForm.end_number}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, end_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={batchForm.description}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Batch description"
                  />
                </div>
              </div>

              {batchForm.start_number && batchForm.end_number && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    This will create <strong>{parseInt(batchForm.end_number) - parseInt(batchForm.start_number) + 1}</strong> cheques
                    {batchForm.prefix && (
                      <span> with prefix "<strong>{batchForm.prefix}</strong>"</span>
                    )}
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCreateCheque}
                  disabled={!batchForm.bank_account_id || !batchForm.start_number || !batchForm.end_number}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Batch
                </button>
              </div>
            </div>
        </div>
      )}

      {/* Issue to Safe Tab */}
      {activeTab === 'issue-to-safe' && (
        <div>
          <h3 className="text-lg font-bold mb-4">Issue Cheque to Safe</h3>
          <p className="text-gray-600 mb-6">Issue a specific cheque with an amount to a safe for tracking expenses.</p>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800">Issue Cheque to Safe</h4>
                  <p className="text-sm text-green-700">
                    Select a blank cheque and assign it to a safe with a specific amount and recipient details.
                  </p>
                </div>
                </div>
            </div>

            <div className="text-center">
                <button
                onClick={() => setShowIssueChequeModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                >
                <Send className="w-5 h-5" />
                Issue Cheque to Safe
                </button>
          </div>
          
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">💡 How to Issue Cheques to Safe</h4>
            <ul className="text-sm text-gray-600 space-y-1">
                <li>• Select an unassigned blank cheque from the list</li>
                <li>• Choose which safe to assign the cheque to</li>
                <li>• Set the cheque amount and recipient details</li>
                <li>• The cheque will be tracked for expenses within that safe</li>
            </ul>
            </div>
          </div>
        </div>
      )}



      {/* Cheque Creation Modal (when triggered from templates) */}
      {showChequeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Cheque from Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Account *
                </label>
                <select
                  value={chequeForm.bank_account_id}
                  onChange={(e) => setChequeForm(prev => ({ ...prev, bank_account_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Bank Account</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_name} - {account.bank_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cheque Number *
                </label>
                <input
                  type="text"
                  value={chequeForm.cheque_number}
                  onChange={(e) => setChequeForm(prev => ({ ...prev, cheque_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={chequeForm.amount}
                  onChange={(e) => setChequeForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={chequeForm.description}
                  onChange={(e) => setChequeForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowChequeModal(false);
                  resetChequeForms();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCheque}
                disabled={!chequeForm.cheque_number || !chequeForm.bank_account_id}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create Cheque
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Modal */}
      {attachmentModalOpen && console.log('🎯 MODAL IS RENDERING! attachmentModalOpen:', attachmentModalOpen, 'attachments:', selectedAttachments.length)}
      {attachmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', maxWidth: '1024px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-blue-600">Settlement Attachments ({selectedAttachments.length} files)</h3>
              <button
                onClick={() => {
                  setAttachmentModalOpen(false);
                  setSelectedAttachments([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {selectedAttachments.map((attachment, idx) => (
                <div key={idx} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{attachment.original_filename || attachment.filename}</p>
                    <p className="text-sm text-gray-600">
                      Size: {(attachment.file_size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`${API_BASE_URL}/cheques/${attachment.cheque_id || 0}/settlement-attachments/${attachment.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      View
                    </a>
                    <a
                      href={`${API_BASE_URL}/cheques/${attachment.cheque_id || 0}/settlement-attachments/${attachment.filename}`}
                      download={attachment.original_filename || attachment.filename}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Print Options Modal */}
      {printOptionsModal.isOpen && printOptionsModal.cheque && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Choose Print Format</h3>
              <button
                onClick={() => setPrintOptionsModal({ isOpen: false, cheque: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">
                Cheque #{printOptionsModal.cheque.cheque_number}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Amount: ${typeof printOptionsModal.cheque.amount === 'string' ? parseFloat(printOptionsModal.cheque.amount).toFixed(2) : printOptionsModal.cheque.amount.toFixed(2)}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={async () => {
                  setPrintOptionsModal({ isOpen: false, cheque: null });
                  await handleHtmlPrint(printOptionsModal.cheque, false);
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-3"
              >
                <span className="text-lg">🌐</span>
                <div className="text-left">
                  <div className="font-medium">HTML Print</div>
                  <div className="text-xs text-blue-100">Modern web-based printing with responsive design</div>
                </div>
              </button>
              
              <button
                onClick={async () => {
                  setPrintOptionsModal({ isOpen: false, cheque: null });
                  await handlePrintCheque(printOptionsModal.cheque);
                }}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-3"
              >
                <span className="text-lg">📄</span>
                <div className="text-left">
                  <div className="font-medium">PDF Print</div>
                  <div className="text-xs text-purple-100">Traditional PDF format with Arabic fonts</div>
                </div>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setPrintOptionsModal({ isOpen: false, cheque: null })}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Cheque Modal */}
      {showIssueChequeModal && (
        <IssueChequeModal
          isOpen={showIssueChequeModal}
          onClose={() => setShowIssueChequeModal(false)}
          onIssued={async () => {
            setShowIssueChequeModal(false);
            // Refresh data to show the newly issued cheque in the list immediately
            console.log('🔄 Refreshing data after cheque issued to safe...');
            await fetchData();
            // Switch to the cheques tab if we're not already there to show the issued cheque
            if (activeTab !== 'cheques') {
              setActiveTab('cheques');
            }
            setSuccessMessage('Cheque issued successfully to safe! It now appears in the cheques list.');
            setTimeout(() => setSuccessMessage(null), 4000);
          }}
        />
      )}

      {/* Detailed View Modal */}
      {detailViewModalOpen && selectedChequeForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-green-600">{t('chequeManagement.detailedView.title')}</h3>
            
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-800">
                {t('chequeManagement.detailedView.chequeNumber')} #{selectedChequeForDetail.cheque_number}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {t('chequeManagement.detailedView.amount')}: ${toNumber(selectedChequeForDetail.amount).toFixed(2)}
              </p>
            </div>

            <div className="space-y-4">
              {/* Issue Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.issueDate')}
                </label>
                <input
                  type="text"
                  value={selectedChequeForDetail.issue_date}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.dueDate')}
                </label>
                <input
                  type="text"
                  value={selectedChequeForDetail.due_date}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.description')}
                </label>
                <textarea
                  value={selectedChequeForDetail.description}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>

              {/* Issued To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.issuedTo')}
                </label>
                <input
                  type="text"
                  value={selectedChequeForDetail.issued_to}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Bank Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.bankAccount')}
                </label>
                <input
                  type="text"
                  value={selectedChequeForDetail.bank_account}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.amount')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={toNumber(selectedChequeForDetail.amount)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Total Expenses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.totalExpenses')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={toNumber(selectedChequeForDetail.total_expenses)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.status')}
                </label>
                <input
                  type="text"
                  value={selectedChequeForDetail.status}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Safe Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.safeName')}
                </label>
                <input
                  type="text"
                  value={selectedChequeForDetail.safe_name}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Settled By Cheque ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.settledByChequeId')}
                </label>
                <input
                  type="number"
                  value={selectedChequeForDetail.settled_by_cheque_id}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Is Settled */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.isSettled')}
                </label>
                <input
                  type="checkbox"
                  checked={selectedChequeForDetail.is_settled}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Settlement Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.settlementDate')}
                </label>
                <input
                  type="text"
                  value={selectedChequeForDetail.settlement_date}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Is Supplier Payment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.isSupplierPayment')}
                </label>
                <input
                  type="checkbox"
                  checked={selectedChequeForDetail.is_supplier_payment}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Supplier Invoice Uploaded */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.supplierInvoiceUploaded')}
                </label>
                <input
                  type="checkbox"
                  checked={selectedChequeForDetail.supplier_invoice_uploaded}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Is Overspent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.isOverspent')}
                </label>
                <input
                  type="checkbox"
                  checked={selectedChequeForDetail.is_overspent}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Overspent Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.overspentAmount')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={toNumber(selectedChequeForDetail.overspent_amount)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Settled By Cheque ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.settledByChequeId')}
                </label>
                <input
                  type="number"
                  value={selectedChequeForDetail.settled_by_cheque_id}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Has Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.hasAttachments')}
                </label>
                <input
                  type="checkbox"
                  checked={selectedChequeForDetail.has_attachments}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Print Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.printCount')}
                </label>
                <input
                  type="number"
                  value={selectedChequeForDetail.print_count}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Printed At */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chequeManagement.detailedView.printedAt')}
                </label>
                <input
                  type="text"
                  value={selectedChequeForDetail.printed_at}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setDetailViewModalOpen(false);
                  setSelectedChequeForDetail(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChequeManagement; 