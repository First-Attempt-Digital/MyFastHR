import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, X, CornerDownLeft } from 'lucide-react';
import api from '../../utils/api';

const DeleteSecurityModal = ({ isOpen, onClose, onConfirm, url, title = "Security Verification", message = "Please enter the 6-digit numeric delete security key to complete this deletion." }) => {
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    useEffect(() => {
        if (isOpen) {
            setPin(['', '', '', '', '', '']);
            setError('');
            setLoading(false);
            // Focus first input box after animation
            setTimeout(() => {
                inputRefs[0]?.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (index, value) => {
        // Only allow numbers
        if (value !== '' && !/^[0-9]$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        setError('');

        // Move focus to next input if filled
        if (value !== '' && index < 5) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Move back to previous input on backspace if empty
        if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pastedData)) {
            const digits = pastedData.split('');
            setPin(digits);
            inputRefs[5].current.focus();
        }
    };

    const handleKeypadClick = (num) => {
        const firstEmptyIndex = pin.findIndex(val => val === '');
        if (firstEmptyIndex !== -1) {
            const newPin = [...pin];
            newPin[firstEmptyIndex] = num.toString();
            setPin(newPin);
            setError('');
            if (firstEmptyIndex < 5) {
                inputRefs[firstEmptyIndex + 1].current.focus();
            }
        }
    };

    const handleKeypadBackspace = () => {
        // Find last non-empty index
        let lastFilledIndex = -1;
        for (let i = 5; i >= 0; i--) {
            if (pin[i] !== '') {
                lastFilledIndex = i;
                break;
            }
        }

        if (lastFilledIndex !== -1) {
            const newPin = [...pin];
            newPin[lastFilledIndex] = '';
            setPin(newPin);
            inputRefs[lastFilledIndex].current.focus();
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const fullPin = pin.join('');
        if (fullPin.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await api.post('/settings/delete-key/verify', { key: fullPin, url });

            if (res.success) {
                // Success! Execute the confirm callback
                await onConfirm(fullPin);
                onClose();
            } else {
                setError(res.message || 'Verification failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid delete security key');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white border-2 border-black rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b-2 border-black bg-rose-50/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 rounded-xl text-rose-600">
                            <ShieldAlert size={24} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight text-slate-900">{title}</h3>
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-100 px-2 py-0.5 rounded-full">Required Authorization</span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 rounded-xl text-slate-400 hover:text-black hover:bg-slate-50 transition-colors"
                    >
                        <X size={18} className="stroke-[2.5]" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <p className="text-sm font-bold text-slate-500 leading-relaxed text-center">
                        {message}
                    </p>

                    {/* Numeric Pin Entry Box */}
                    <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center space-y-4">
                        <div className="flex items-center justify-center gap-2">
                            {pin.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={inputRefs[index]}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    disabled={loading}
                                    className={`w-12 h-14 text-center text-xl font-black rounded-xl border-2 transition-all ${
                                        error 
                                        ? 'border-rose-500 bg-rose-50/50 ring-4 ring-rose-500/10' 
                                        : digit 
                                            ? 'border-black ring-4 ring-black/5 bg-slate-50' 
                                            : 'border-slate-200 hover:border-slate-300 focus:border-black focus:ring-4 focus:ring-black/5'
                                    }`}
                                    autoComplete="off"
                                />
                            ))}
                        </div>

                        {error && (
                            <p className="text-xs font-black text-rose-500 uppercase tracking-wider text-center animate-bounce">
                                ⚠️ {error}
                            </p>
                        )}

                        {/* Interactive Keypad */}
                        <div className="w-full max-w-[280px] grid grid-cols-3 gap-2 pt-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleKeypadClick(num)}
                                    disabled={loading}
                                    className="h-12 text-lg font-black rounded-xl bg-slate-50 hover:bg-slate-100 hover:text-black text-slate-800 transition-colors flex items-center justify-center border border-slate-100 active:scale-95"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={handleKeypadBackspace}
                                disabled={loading}
                                className="h-12 text-sm font-black rounded-xl bg-slate-50 hover:bg-slate-100 text-rose-500 hover:text-rose-600 transition-colors flex items-center justify-center border border-slate-100 active:scale-95"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={() => handleKeypadClick(0)}
                                disabled={loading}
                                className="h-12 text-lg font-black rounded-xl bg-slate-50 hover:bg-slate-100 hover:text-black text-slate-800 transition-colors flex items-center justify-center border border-slate-100 active:scale-95"
                            >
                                0
                            </button>
                            <button
                                type="submit"
                                disabled={loading || pin.some(val => val === '')}
                                className={`h-12 rounded-xl text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 active:scale-95 ${
                                    pin.some(val => val === '') 
                                    ? 'bg-slate-300 cursor-not-allowed' 
                                    : 'bg-black hover:bg-slate-900 shadow-lg'
                                }`}
                            >
                                <CornerDownLeft size={14} className="stroke-[3]" />
                                Go
                            </button>
                        </div>
                    </form>

                    <div className="text-center pt-2 border-t border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Forgot your security code? Contact admin to request a reset link.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteSecurityModal;
