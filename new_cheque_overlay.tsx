import React, { useEffect, useState, useRef } from 'react';
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
  { key: 'issue_date', label: 'تاريخ الإصدار' }
];

const ArabicChequeGenerator: React.FC = () => {
  const [positions, setPositions] = useState<Record<string, FieldPosition>>({});
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.get('/cheque-field-positions').then(res => {
      setPositions(res.data);
    });
    const defaultVisibility: Record<string, boolean> = {};
    FIELD_DEFS.forEach(field => {
      defaultVisibility[field.key] = true;
    });
    setVisibility(defaultVisibility);
  }, []);

  const handleDrag = (e: React.MouseEvent, key: string) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    const newX = e.clientX - rect.left;
    const newY = e.clientY - rect.top;
    setPositions(prev => ({
      ...prev,
      [key]: { x: newX, y: newY }
    }));
  };

  const handlePrint = () => {
    axios.post(`/cheques/1/print-arabic-sqlite`, {
      field_positions: positions,
      field_visibility: visibility,
      font_language: 'ar',
      debug_mode: debugMode
    }, { responseType: 'blob' }).then(res => {
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    });
  };

  const saveDefaults = () => {
    axios.post('/cheque-field-positions', positions).then(() => {
      alert('Saved successfully');
    });
  };

  return (
    <div dir="rtl" className="p-4">
      <h2 className="text-xl font-bold mb-4">مولد الشيك العربي</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {FIELD_DEFS.map(field => (
          <div key={field.key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={visibility[field.key] || false}
              onChange={(e) => setVisibility(prev => ({ ...prev, [field.key]: e.target.checked }))}
            />
            <label>{field.label}</label>
            <span>({positions[field.key]?.x ?? 0}, {positions[field.key]?.y ?? 0})</span>
          </div>
        ))}
      </div>

      <div
        ref={overlayRef}
        className="relative border border-dashed border-gray-400 h-[500px] bg-gray-100 mb-6"
      >
        {FIELD_DEFS.map(field => (
          visibility[field.key] && (
            <div
              key={field.key}
              className="absolute bg-white text-xs px-2 py-1 border cursor-move select-none shadow"
              style={{
                left: positions[field.key]?.x ?? 0,
                top: positions[field.key]?.y ?? 0,
              }}
              onDoubleClick={(e) => handleDrag(e, field.key)}
            >
              {debugMode ? `${field.label} (${positions[field.key]?.x}, ${positions[field.key]?.y})` : field.label}
            </div>
          )
        ))}
      </div>

      <div className="flex gap-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handlePrint}
        >
          طباعة الشيك بالعربية
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={saveDefaults}
        >
          حفظ كإعداد افتراضي
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
    </div>
  );
};

export default ArabicChequeGenerator;
