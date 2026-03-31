import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { submitReport, getToken } from '../lib/api';

export interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetType: 'TRIP' | 'USER' | 'MESSAGE';
    targetId: string;
}

const REASONS = [
    'Inappropriate Content',
    'Spam or Scam',
    'Harassment or Bullying',
    'Violence or Hate Speech',
    'Other'
];

export default function ReportModal({ isOpen, onClose, targetType, targetId }: ReportModalProps) {
    const [reason, setReason] = useState<string>('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!reason) {
            setError('Please select a reason.');
            return;
        }

        const token = getToken();
        if (!token) {
            setError('You must be logged in to submit a report.');
            return;
        }

        try {
            setIsSubmitting(true);
            await submitReport({ targetType, targetId, reason, description }, token);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setReason('');
                setDescription('');
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
                {/* Header */}
                <div className="bg-red-500/10 p-6 flex flex-col items-center border-b border-red-100">
                    <button 
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-3">
                        <ShieldAlert size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Report Issue</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Please provide details so we can investigate.
                    </p>
                </div>

                {/* Body */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-6 animate-in zoom-in duration-300">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-500 mx-auto mb-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Report Submitted</h3>
                            <p className="text-sm text-gray-500 mt-1">Thank you for helping keep our community safe.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                                    {error}
                                </div>
                            )}
                            
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 block gap-1">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    className="w-full border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    disabled={isSubmitting}
                                >
                                    <option value="" disabled>Select a reason...</option>
                                    {REASONS.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 block">
                                    Additional details (Optional)
                                </label>
                                <textarea 
                                    className="w-full border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none resize-none"
                                    rows={4}
                                    placeholder="Please provide any extra context to help us understand the issue..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={isSubmitting}
                                ></textarea>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex justify-center items-center"
                                >
                                    {isSubmitting ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        'Submit Report'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
