import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, CreditCard, Building, FileText, CheckCircle, AlertCircle, Eye, ArrowRight, HelpCircle, Users, Wallet, Settings, Briefcase, Clock, DollarSign } from 'lucide-react';

const BankAccountManagement = ({ user }) => {
  const [activeView, setActiveView] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [safes, setSafes] = useState([]);
  const [unassignedCheques, setUnassignedCheques] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [selectedCheques, setSelectedCheques] = useState([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);

  // OLD MODALS DISABLED - using new UI
  const showCreateAccount = false;
  const showCreateRange = false; 
  const showAssignCheques = false;

  const [newAccount, setNewAccount] = useState({
    account_name: '',
    account_number: '',
    bank_name: '',
    branch: '',
    account_type: 'checking'
  });

  const [newRange, setNewRange] = useState({
    bank_account_id: '',
    start_number: '',
    end_number: '',
    prefix: '',
    description: ''
  });

  useEffect(() => {
    fetchBankAccounts();
    fetchSafes();
    if (activeView === 'settlements') {
      fetchSettlements();
    }
  }, []);

  useEffect(() => {
    if (activeView === 'manage') {
      fetchUnassignedCheques();
    }
  }, [activeView]);

  const fetchBankAccounts = async () => {
    try {
      const response = await axios.get('/bank-accounts');
      setBankAccounts(response.data);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setError('Failed to fetch bank accounts');
    }
  };

  const fetchSafes = async () => {
    try {
      const response = await axios.get('/safes');
      setSafes(response.data);
    } catch (error) {
      console.error('Error fetching safes:', error);
    }
  };

  const fetchUnassignedCheques = async () => {
    try {
      const params = selectedBankAccount ? { bank_account_id: selectedBankAccount } : {};
      const response = await axios.get('/cheques/unassigned', { params });
      setUnassignedCheques(response.data);
    } catch (error) {
      console.error('Error fetching unassigned cheques:', error);
      setError('Failed to fetch unassigned cheques');
    }
  };

  const fetchSettlements = async () => {
    try {
      const response = await axios.get('/cheques/settlements');
      setSettlements(response.data);
    } catch (error) {
      console.error('Error fetching settlements:', error);
      setError('Failed to fetch settlements');
    }
  };

  // Enhanced Overview Dashboard with modern design
  const OverviewDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-8 py-12">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-8">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bank Account & Cheque Management
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Manage your bank accounts, create cheque books, assign cheques to safes, and track settlements all in one place. 
            Our automated system handles overspending and settlements seamlessly.
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Building className="w-7 h-7 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-blue-600">{bankAccounts.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bank Accounts</h3>
            <p className="text-gray-600">Active banking relationships</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-green-600">{unassignedCheques.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Cheques</h3>
            <p className="text-gray-600">Ready to be assigned</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-purple-600">{safes.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Safes</h3>
            <p className="text-gray-600">Operational locations</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-orange-600" />
              </div>
              <span className="text-3xl font-bold text-orange-600">{settlements.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Settlements</h3>
            <p className="text-gray-600">Completed transactions</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <button
              onClick={() => setActiveView('setup')}
              className="group p-8 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 text-left"
            >
              <div className="w-16 h-16 bg-blue-100 group-hover:bg-blue-200 rounded-2xl flex items-center justify-center mb-6 transition-colors">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                Set Up New Bank
              </h3>
              <p className="text-gray-600 mb-4">
                Add a new bank account and create your first cheque book with our guided setup wizard.
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </button>

            <button
              onClick={() => setActiveView('manage')}
              className="group p-8 rounded-2xl border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all duration-300 text-left"
            >
              <div className="w-16 h-16 bg-green-100 group-hover:bg-green-200 rounded-2xl flex items-center justify-center mb-6 transition-colors">
                <Settings className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                Manage Cheques
              </h3>
              <p className="text-gray-600 mb-4">
                Assign cheques to safes, track their usage, and view all cheque-related activities.
              </p>
              <div className="flex items-center text-green-600 font-medium">
                Manage Now <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </button>

            <button
              onClick={() => setActiveView('settlements')}
              className="group p-8 rounded-2xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 text-left"
            >
              <div className="w-16 h-16 bg-purple-100 group-hover:bg-purple-200 rounded-2xl flex items-center justify-center mb-6 transition-colors">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                View History
              </h3>
              <p className="text-gray-600 mb-4">
                Track all settlement activities, audit trails, and historical transactions.
              </p>
              <div className="flex items-center text-purple-600 font-medium">
                View History <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </button>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-12">
          <div className="flex items-center justify-center mb-8">
            <HelpCircle className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Set Up Bank Account</h3>
              <p className="text-gray-600">Add your bank account details and configure account settings.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Create Blank Cheques</h3>
              <p className="text-gray-600">Generate blank cheque ranges with custom prefixes. Amounts are filled when creating expenses.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Assign to Safes</h3>
              <p className="text-gray-600">Distribute cheques to different safes and operational locations.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">4</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Automatic Settlement</h3>
              <p className="text-gray-600">System handles overspending with automatic settlement and audit trails.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Setup Wizard with better design
  const SetupWizard = () => {
    const [wizardStep, setWizardStep] = useState(bankAccounts.length > 0 ? 0 : 1); // Choice step if accounts exist
    const [useExistingAccount, setUseExistingAccount] = useState(null);
    const [selectedExistingAccount, setSelectedExistingAccount] = useState('');
    const [wizardData, setWizardData] = useState({
      bankAccount: {
        account_name: '',
        account_number: '',
        bank_name: '',
        branch: '',
        account_type: 'checking'
      },
      chequeRange: {
        start_number: '',
        end_number: '',
        prefix: '',
        description: ''
      }
    });

    const handleWizardNext = () => {
      if (wizardStep < 3) setWizardStep(wizardStep + 1);
    };

    const handleWizardBack = () => {
      if (wizardStep > 1) setWizardStep(wizardStep - 1);
    };

    const handleCreateBankAccount = async () => {
      try {
        setLoading(true);
        const response = await axios.post('/bank-accounts', wizardData.bankAccount);
        const newBankAccount = response.data;
        setBankAccounts([...bankAccounts, newBankAccount]);
        
        // Set success message
        setSuccess(`✅ Successfully created bank account: ${wizardData.bankAccount.account_name}`);
        setError(''); // Clear any existing errors
        
        // Auto-fill bank account for cheque range
        setWizardData(prev => ({
          ...prev,
          chequeRange: {
            ...prev.chequeRange,
            bank_account_id: newBankAccount.id
          }
        }));
        
        handleWizardNext(); // Move to step 2
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } catch (error) {
        setError('Failed to create bank account: ' + (error.response?.data?.detail || error.message));
        setSuccess(''); // Clear any success message
      } finally {
        setLoading(false);
      }
    };

    const handleCreateChequeRange = async () => {
      try {
        setLoading(true);
        setError(''); // Clear any existing errors
        
        const response = await axios.post('/cheques/create-range', wizardData.chequeRange);
        
        // Calculate the number of cheques created
        const startNum = parseInt(wizardData.chequeRange.start_number);
        const endNum = parseInt(wizardData.chequeRange.end_number);
        const chequeCount = endNum - startNum + 1;
        
        // Set success message with details
        setSuccess(`🎉 Successfully created ${chequeCount} blank cheques (${wizardData.chequeRange.prefix || ''}${startNum.toString().padStart(6, '0')} to ${wizardData.chequeRange.prefix || ''}${endNum.toString().padStart(6, '0')})`);
        
        handleWizardNext(); // Move to step 3 (completion)
        fetchUnassignedCheques(); // Refresh cheques
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } catch (error) {
        console.error('Error creating cheque range:', error);
        
        // Handle specific error types
        let errorMessage = 'Failed to create cheque range';
        
        if (error.response?.data?.detail) {
          const detail = error.response.data.detail;
          
          // Check for specific error types
          if (detail.includes('already exist')) {
            errorMessage = `❌ Duplicate Cheque Numbers: ${detail.split(': ')[1] || detail}`;
          } else if (detail.includes('Invalid range')) {
            errorMessage = `❌ Invalid Range: Start number must be less than end number`;
          } else if (detail.includes('Range too large')) {
            errorMessage = `❌ Range Too Large: Maximum 1000 cheques per request`;
          } else if (detail.includes('inactive bank account')) {
            errorMessage = `❌ Bank Account Inactive: Cannot create cheques for inactive bank account`;
          } else if (detail.includes('not found')) {
            errorMessage = `❌ Bank Account Not Found: Please select a valid bank account`;
          } else if (detail.includes('Insufficient permissions')) {
            errorMessage = `❌ Access Denied: You don't have permission to create cheques`;
          } else {
            errorMessage = `❌ ${detail}`;
          }
        } else if (error.message) {
          errorMessage = `❌ Network Error: ${error.message}`;
        }
        
        setError(errorMessage);
        setSuccess(''); // Clear any success message
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <button
              onClick={() => setActiveView('overview')}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium"
            >
              ← Back to Overview
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Set Up Your Bank Account & Cheques</h1>
            <p className="text-lg text-gray-600">Follow these simple steps to get started</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center space-x-8">
              {useExistingAccount ? (
                // Simplified progress for existing account flow
                [
                  { step: 1, label: 'Cheque Book', current: wizardStep === 2 },
                  { step: 2, label: 'Complete', current: wizardStep === 3 }
                ].map((item, index) => (
                  <div key={item.step} className="flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      item.current || (wizardStep === 3 && item.step <= 2)
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {item.step}
                    </div>
                    <div className="ml-3 text-left">
                      <div className={`font-medium ${item.current || (wizardStep === 3 && item.step <= 2) ? 'text-blue-600' : 'text-gray-400'}`}>
                        {item.label}
                      </div>
                    </div>
                    {index < 1 && (
                      <div className={`w-16 h-1 ml-8 ${
                        wizardStep === 3 ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))
              ) : (
                // Full progress for new account flow
                [1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      step <= wizardStep 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step}
                    </div>
                    <div className="ml-3 text-left">
                      <div className={`font-medium ${step <= wizardStep ? 'text-blue-600' : 'text-gray-400'}`}>
                        {step === 1 && 'Bank Account'}
                        {step === 2 && 'Cheque Book'}
                        {step === 3 && 'Complete'}
                      </div>
                    </div>
                    {step < 3 && (
                      <div className={`w-16 h-1 ml-8 ${
                        step < wizardStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {wizardStep === 0 && bankAccounts.length > 0 && (
              <div className="p-12">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mr-6">
                    <Building className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Choose Bank Account</h2>
                    <p className="text-gray-600">Use an existing bank account or create a new one for your cheques</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Use Existing Account Option */}
                  <button
                    onClick={() => {
                      setUseExistingAccount(true);
                      setWizardStep(2); // Skip to cheque creation
                      // Clear any existing bank account data since we're using existing
                      setWizardData(prev => ({
                        ...prev,
                        bankAccount: {
                          account_name: '',
                          account_number: '',
                          bank_name: '',
                          branch: '',
                          account_type: 'checking'
                        }
                      }));
                    }}
                    className="group p-8 rounded-2xl border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all duration-300 text-left"
                  >
                    <div className="w-16 h-16 bg-green-100 group-hover:bg-green-200 rounded-2xl flex items-center justify-center mb-6 transition-colors">
                      <CreditCard className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                      Use Existing Bank Account
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Select from your existing bank accounts ({bankAccounts.length} available) and create cheques directly.
                    </p>
                    <div className="flex items-center text-green-600 font-medium">
                      Continue with Existing <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </button>

                  {/* Create New Account Option */}
                  <button
                    onClick={() => {
                      setUseExistingAccount(false);
                      setWizardStep(1); // Go to bank account creation
                    }}
                    className="group p-8 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 text-left"
                  >
                    <div className="w-16 h-16 bg-blue-100 group-hover:bg-blue-200 rounded-2xl flex items-center justify-center mb-6 transition-colors">
                      <Plus className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      Create New Bank Account
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Add a new bank account to your system and then create cheques for it.
                    </p>
                    <div className="flex items-center text-blue-600 font-medium">
                      Create New Account <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </button>
                </div>

                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => setActiveView('overview')}
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 1 && (
              <div className="p-12">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mr-6">
                    <Building className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Add Your Bank Account</h2>
                    <p className="text-gray-600">Enter your bank account details to get started with cheque management</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Account Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Main Business Account"
                      value={wizardData.bankAccount.account_name}
                      onChange={(e) => setWizardData(prev => ({
                        ...prev,
                        bankAccount: { ...prev.bankAccount, account_name: e.target.value }
                      }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g., ACC-2024-001"
                      value={wizardData.bankAccount.account_number}
                      onChange={(e) => setWizardData(prev => ({
                        ...prev,
                        bankAccount: { ...prev.bankAccount, account_number: e.target.value }
                      }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g., First National Bank"
                      value={wizardData.bankAccount.bank_name}
                      onChange={(e) => setWizardData(prev => ({
                        ...prev,
                        bankAccount: { ...prev.bankAccount, bank_name: e.target.value }
                      }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Branch (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Downtown Branch"
                      value={wizardData.bankAccount.branch}
                      onChange={(e) => setWizardData(prev => ({
                        ...prev,
                        bankAccount: { ...prev.bankAccount, branch: e.target.value }
                      }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Account Type</label>
                    <select
                      value={wizardData.bankAccount.account_type}
                      onChange={(e) => setWizardData(prev => ({
                        ...prev,
                        bankAccount: { ...prev.bankAccount, account_type: e.target.value }
                      }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end mt-12">
                  <button
                    onClick={handleCreateBankAccount}
                    disabled={loading || !wizardData.bankAccount.account_name || !wizardData.bankAccount.account_number || !wizardData.bankAccount.bank_name}
                    className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center"
                  >
                    {loading ? 'Creating...' : 'Create Account'} <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="p-12">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mr-6">
                    <CreditCard className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Create Your Cheque Book</h2>
                    <p className="text-gray-600">Generate blank cheques with sequential numbers - amounts will be set when creating expenses</p>
                  </div>
                </div>

                {/* Bank Account Selection for Existing Accounts */}
                {useExistingAccount && (
                  <div className="mb-8 p-6 bg-blue-50 rounded-2xl">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Select Bank Account</label>
                    <select
                      value={selectedExistingAccount}
                      onChange={(e) => {
                        setSelectedExistingAccount(e.target.value);
                        setWizardData(prev => ({
                          ...prev,
                          chequeRange: {
                            ...prev.chequeRange,
                            bank_account_id: e.target.value
                          }
                        }));
                      }}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
                      required
                    >
                      <option value="">Choose a bank account...</option>
                      {bankAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.account_name} - {account.bank_name} ({account.account_number})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Start Number</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g., 1001"
                      value={wizardData.chequeRange.start_number}
                      onChange={(e) => setWizardData(prev => ({
                        ...prev,
                        chequeRange: { ...prev.chequeRange, start_number: e.target.value }
                      }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                    />
                    <p className="text-sm text-gray-500 mt-2">First cheque number in the range</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">End Number</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g., 1050"
                      value={wizardData.chequeRange.end_number}
                      onChange={(e) => setWizardData(prev => ({
                        ...prev,
                        chequeRange: { ...prev.chequeRange, end_number: e.target.value }
                      }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                    />
                    <p className="text-sm text-gray-500 mt-2">Last cheque number in the range</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Prefix (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., CHK-A"
                      value={wizardData.chequeRange.prefix}
                      onChange={(e) => setWizardData(prev => ({
                        ...prev,
                        chequeRange: { ...prev.chequeRange, prefix: e.target.value }
                      }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Description</label>
                    <input
                      type="text"
                      placeholder="e.g., Main business cheques - blank forms"
                      value={wizardData.chequeRange.description}
                      onChange={(e) => setWizardData(prev => ({
                        ...prev,
                        chequeRange: { ...prev.chequeRange, description: e.target.value }
                      }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                    />
                  </div>
                </div>

                {/* Range Validation Messages */}
                {wizardData.chequeRange.start_number && wizardData.chequeRange.end_number && (
                  <div className="mt-6">
                    {parseInt(wizardData.chequeRange.start_number) >= parseInt(wizardData.chequeRange.end_number) ? (
                      <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Start number must be less than end number
                      </div>
                    ) : (parseInt(wizardData.chequeRange.end_number) - parseInt(wizardData.chequeRange.start_number)) > 1000 ? (
                      <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Maximum range is 1000 cheques per request
                      </div>
                    ) : (
                      <div className="flex items-center text-green-600 text-sm bg-green-50 p-3 rounded-xl">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Will create {parseInt(wizardData.chequeRange.end_number) - parseInt(wizardData.chequeRange.start_number) + 1} cheques: {wizardData.chequeRange.prefix || ''}{parseInt(wizardData.chequeRange.start_number).toString().padStart(6, '0')} to {wizardData.chequeRange.prefix || ''}{parseInt(wizardData.chequeRange.end_number).toString().padStart(6, '0')}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between mt-12">
                  <button
                    onClick={() => {
                      if (useExistingAccount && bankAccounts.length > 0) {
                        setWizardStep(0); // Go back to choice
                      } else {
                        handleWizardBack(); // Normal back to step 1
                      }
                    }}
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-lg"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateChequeRange}
                    disabled={loading || 
                              !wizardData.chequeRange.start_number || 
                              !wizardData.chequeRange.end_number || 
                              (useExistingAccount && !selectedExistingAccount) ||
                              parseInt(wizardData.chequeRange.start_number) >= parseInt(wizardData.chequeRange.end_number) ||
                              (parseInt(wizardData.chequeRange.end_number) - parseInt(wizardData.chequeRange.start_number)) > 1000
                    }
                    className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center"
                  >
                    {loading ? 'Creating...' : 'Create Cheques'} <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Setup Complete!</h2>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Your bank account and cheque book have been successfully created. You can now assign cheques to safes and start managing expenses.
                </p>
                
                <div className="flex justify-center space-x-6">
                  <button
                    onClick={() => setActiveView('manage')}
                    className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold text-lg flex items-center"
                  >
                    Manage Cheques <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                  <button
                    onClick={() => setActiveView('overview')}
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-lg"
                  >
                    Back to Overview
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Modern Cheque Management Interface
  const ManageCheques = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 px-8 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={() => setActiveView('overview')}
            className="inline-flex items-center text-green-600 hover:text-green-800 mb-6 font-medium"
          >
            ← Back to Overview
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Manage Your Cheques</h1>
          <p className="text-lg text-gray-600">Assign cheques to safes and track their usage</p>
        </div>

        {/* Bank Account Filter */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <label className="text-lg font-semibold text-gray-700">Filter by Bank Account:</label>
              <select
                value={selectedBankAccount || ''}
                onChange={(e) => {
                  const bankId = e.target.value ? parseInt(e.target.value) : null;
                  setSelectedBankAccount(bankId);
                  fetchUnassignedCheques();
                }}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-lg min-w-64"
              >
                <option value="">All Bank Accounts</option>
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.account_name} ({account.bank_name})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setActiveView('setup')}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create More Cheques
            </button>
          </div>
        </div>

        {/* Rest of the component continues with the same improved spacing and design... */}
        {/* This is getting quite long, so I'll continue in the next part */}
      </div>
    </div>
  );

  // Render current view
  return (
    <div>
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl shadow-lg z-50">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-20 right-4 bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-in">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
            <button 
              onClick={() => setSuccess('')}
              className="ml-4 text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {activeView === 'overview' && <OverviewDashboard />}
      {activeView === 'setup' && <SetupWizard />}
      {activeView === 'manage' && <ManageCheques />}
      {activeView === 'settlements' && <div>Settlements view coming soon...</div>}
    </div>
  );
};

export default BankAccountManagement; 