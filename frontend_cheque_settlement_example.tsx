/**
 * Example React TypeScript component for Cheque Settlement with tolerance feature
 * 
 * This component demonstrates:
 * 1. Auto-selection of recommended settlement cheque (but changeable via dropdown)
 * 2. Editable settlement amount with automatic overspent amount pre-filled
 * 3. Tolerance checking (up to 10 LE difference allowed)
 * 
 * Dependencies:
 * - Shadcn UI components (Button, Input, Select, Card, Alert, Badge)
 * - Lucide React icons
 * - Tailwind CSS for styling
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, DollarSign } from 'lucide-react';

interface AvailableSettlementCheque {
  id: number;
  cheque_number: string;
  amount: number;
  bank_account_name: string;
  bank_name: string;
  is_recommended: boolean;
  difference_amount: number;
}

interface OverspentCheque {
  id: number;
  cheque_number: string;
  amount: number;
  overspent_amount: number;
  total_expenses: number;
}

interface ChequeSettlementProps {
  overspentCheque: OverspentCheque;
  onSettlementComplete?: () => void;
}

export function ChequeSettlement({ overspentCheque, onSettlementComplete }: ChequeSettlementProps) {
  const [availableCheques, setAvailableCheques] = useState<AvailableSettlementCheque[]>([]);
  const [selectedChequeId, setSelectedChequeId] = useState<number | null>(null);
  const [settlementAmount, setSettlementAmount] = useState<number>(overspentCheque.overspent_amount);
  const [tolerance] = useState<number>(10); // 10 LE tolerance
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Fetch available cheques for settlement
  useEffect(() => {
    fetchAvailableCheques();
  }, [overspentCheque.id]);

  const fetchAvailableCheques = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/cheques/${overspentCheque.id}/available-for-settlement`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch available cheques');
      
      const data = await response.json();
      setAvailableCheques(data);
      
      // Auto-select first recommended cheque
      const firstRecommended = data.find((c: AvailableSettlementCheque) => c.is_recommended);
      if (firstRecommended) {
        setSelectedChequeId(firstRecommended.id);
      }
    } catch (err) {
      setError('Failed to load available cheques');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettlement = async () => {
    if (!selectedChequeId) {
      setError('Please select a settlement cheque');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/cheques/manual-settlement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          overspent_cheque_id: overspentCheque.id,
          settlement_cheque_id: selectedChequeId,
          settlement_amount: settlementAmount,
          tolerance_amount: tolerance,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Settlement failed');
      }

      setSuccess(true);
      if (onSettlementComplete) {
        onSettlementComplete();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete settlement');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCheque = availableCheques.find(c => c.id === selectedChequeId);
  const difference = selectedCheque ? Math.abs(settlementAmount - overspentCheque.overspent_amount) : 0;
  const isWithinTolerance = difference <= tolerance;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Cheque Settlement</CardTitle>
        <CardDescription>
          Settle overspent cheque {overspentCheque.cheque_number} 
          (Overspent by {overspentCheque.overspent_amount.toFixed(2)} LE)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overspent Cheque Summary */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Overspent Cheque</p>
              <p className="text-lg font-bold text-red-900">{overspentCheque.cheque_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-red-600">Amount: {overspentCheque.amount.toFixed(2)} LE</p>
              <p className="text-sm text-red-600">Expenses: {overspentCheque.total_expenses.toFixed(2)} LE</p>
              <p className="font-bold text-red-800">Overspent: {overspentCheque.overspent_amount.toFixed(2)} LE</p>
            </div>
          </div>
        </div>

        {/* Settlement Cheque Selection */}
        <div className="space-y-2">
          <Label htmlFor="settlement-cheque">Select Settlement Cheque</Label>
          <Select
            value={selectedChequeId?.toString()}
            onValueChange={(value) => setSelectedChequeId(parseInt(value))}
            disabled={isLoading}
          >
            <SelectTrigger id="settlement-cheque">
              <SelectValue placeholder="Choose a cheque for settlement" />
            </SelectTrigger>
            <SelectContent>
              {availableCheques.map((cheque) => (
                <SelectItem key={cheque.id} value={cheque.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{cheque.cheque_number}</span>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-sm text-gray-500">
                        {cheque.amount.toFixed(2)} LE
                      </span>
                      {cheque.is_recommended && (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Cheque Details */}
        {selectedCheque && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Selected Cheque</p>
                <p className="text-lg font-bold text-green-900">{selectedCheque.cheque_number}</p>
                <p className="text-sm text-green-600">{selectedCheque.bank_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600">Available Amount</p>
                <p className="text-lg font-bold text-green-800">{selectedCheque.amount.toFixed(2)} LE</p>
              </div>
            </div>
          </div>
        )}

        {/* Settlement Amount */}
        <div className="space-y-2">
          <Label htmlFor="settlement-amount">Settlement Amount (LE)</Label>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <Input
              id="settlement-amount"
              type="number"
              step="0.01"
              value={settlementAmount}
              onChange={(e) => setSettlementAmount(parseFloat(e.target.value) || 0)}
              disabled={isLoading}
            />
          </div>
          <p className="text-sm text-gray-500">
            Original overspent amount: {overspentCheque.overspent_amount.toFixed(2)} LE
            {difference > 0 && (
              <span className={isWithinTolerance ? 'text-green-600' : 'text-red-600'}>
                {' '}(Difference: {difference.toFixed(2)} LE)
              </span>
            )}
          </p>
        </div>

        {/* Tolerance Alert */}
        {difference > 0 && (
          <Alert variant={isWithinTolerance ? 'default' : 'destructive'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isWithinTolerance
                ? `Settlement amount difference (${difference.toFixed(2)} LE) is within the allowed tolerance of ${tolerance} LE.`
                : `Settlement amount difference (${difference.toFixed(2)} LE) exceeds the allowed tolerance of ${tolerance} LE.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Input
            id="notes"
            placeholder="Add any notes about this settlement..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Settlement completed successfully!</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSettlement}
          disabled={isLoading || !selectedChequeId || !isWithinTolerance || success}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Complete Settlement'}
        </Button>
      </CardContent>
    </Card>
  );
} 