import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UserPlus, ChevronLeft, Clock, Phone, FileText } from 'lucide-react';
import { createVisitor } from '../services/dataService';
import { CustomDatePicker, CustomTimePicker } from './CustomPickers';
import { useAuth } from '../contexts/AuthContext';

export const InviteVisitor: React.FC = () => {
  const { userProfile } = useAuth();
  const [step, setStep] = useState<'form' | 'qr'>('form');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; qrCode: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!visitorName.trim() || !arrivalDate || !arrivalTime) {
      setApiError('Visitor name, arrival date and time are required.');
      return;
    }
    setIsLoading(true);
    try {
      const expectedArrival = new Date(`${arrivalDate}T${arrivalTime}:00`).toISOString();
      const expectedDeparture = departureDate && departureTime
        ? new Date(`${departureDate}T${departureTime}:00`).toISOString()
        : undefined;
      const created = await createVisitor({
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim() || undefined,
        purpose: purpose.trim() || undefined,
        expectedArrival,
        expectedDeparture,
        unit: userProfile?.unit ?? '',
      });
      setResult(created);
      setStep('qr');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to create visitor invite. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setVisitorName('');
    setVisitorPhone('');
    setPurpose('');
    setArrivalDate('');
    setArrivalTime('');
    setDepartureDate('');
    setDepartureTime('');
    setResult(null);
  };

  return (
    <div className="pb-12">
      <div className="bg-nadayu-panel rounded-2xl p-8 flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-nadayu-accent rounded-2xl flex items-center justify-center flex-shrink-0">
          <UserPlus size={28} className="text-nadayu-panel" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Invite Visitor</h2>
          <p className="mt-1 text-sm text-nadayu-muted">Register a visitor and share a QR code for gate entry.</p>
        </div>
      </div>

      {step === 'form' ? (
        <div className="max-w-lg mx-auto bg-white rounded-2xl p-6 border border-nadayu-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">Visitor Name</label>
              <input type="text" value={visitorName} onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border rounded-xl focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none font-medium text-gray-900 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider flex items-center gap-1"><Phone size={12} /> Phone (optional)</label>
              <input type="tel" value={visitorPhone} onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="e.g. 012-345 6789"
                className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border rounded-xl focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none font-medium text-gray-900 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider flex items-center gap-1"><FileText size={12} /> Purpose (optional)</label>
              <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Family visit, delivery"
                className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border rounded-xl focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none font-medium text-gray-900 transition-all" />
            </div>
            <div className="flex gap-3">
              <div className="space-y-2 flex-1">
                <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">Expected Arrival Date</label>
                <CustomDatePicker required value={arrivalDate} onChange={setArrivalDate} />
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">Time</label>
                <CustomTimePicker required value={arrivalTime} onChange={setArrivalTime} />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="space-y-2 flex-1">
                <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> Expected Departure (optional)</label>
                <CustomDatePicker value={departureDate} onChange={setDepartureDate} />
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">Time</label>
                <CustomTimePicker value={departureTime} onChange={setDepartureTime} />
              </div>
            </div>
            {apiError && <p className="text-sm text-red-500 text-center px-4 py-2 rounded-xl bg-red-50">{apiError}</p>}
            <button type="submit" disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 bg-nadayu-panel hover:brightness-110">
              {isLoading ? 'Creating...' : 'Generate Visitor QR'}
            </button>
          </form>
        </div>
      ) : (
        <div className="max-w-md mx-auto pt-4">
          <button onClick={resetForm} className="mb-6 flex items-center text-nadayu-muted hover:text-nadayu-panel transition-colors font-semibold text-sm gap-1">
            <ChevronLeft size={16} /> Invite Another Visitor
          </button>
          <div className="bg-white rounded-2xl overflow-hidden border border-nadayu-border">
            <div className="p-6 text-center bg-nadayu-panel">
              <h3 className="font-bold text-2xl tracking-widest mb-1 text-white">VISITOR PASS</h3>
              <p className="text-xs uppercase tracking-widest text-gray-500">Nadayu28 Residences</p>
            </div>
            <div className="p-6 text-center">
              <div className="border-2 border-dashed border-nadayu-border inline-block mb-5 p-4 rounded-2xl">
                <div className="bg-white p-2 rounded-lg">
                  {result?.qrCode && <QRCodeSVG value={result.qrCode} size={160} bgColor="#ffffff" fgColor="#0F172A" level="M" />}
                </div>
              </div>
              <div className="space-y-3 text-left bg-nadayu-cream p-5 rounded-2xl border border-nadayu-border mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-nadayu-muted text-xs font-semibold uppercase">Visitor</span>
                  <span className="text-gray-900 font-bold">{visitorName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-nadayu-muted text-xs font-semibold uppercase">Expected</span>
                  <span className="text-gray-900 font-semibold text-sm">{arrivalDate} {arrivalTime}</span>
                </div>
              </div>
              <p className="text-xs text-nadayu-muted text-center">Share this QR code with your visitor for gate entry</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
