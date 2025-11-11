import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, Mail, Lock } from 'lucide-react';
import { signup } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export const SignUp: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showVerificationMessage, setShowVerificationMessage] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const navigate = useNavigate();

    const validateForm = () => {
        if (!email || !password || !confirmPassword) {
            setError('All fields are required');
            return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            return false;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            await signup(email, password);
            setShowOtpInput(true);
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'Failed to create account. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setIsVerifying(true);

        try {
            const response = await fetch('https://g31hjitjqk.execute-api.us-east-1.amazonaws.com/prod/auth/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    code: otp
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Verification failed');
            }

            setShowVerificationMessage(true);
            setShowOtpInput(false);

            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to verify code. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setIsLoading(true);

        try {
            await signup(email, password);
            setError('Verification code resent!');
            setTimeout(() => setError(''), 3000);
        } catch (err: any) {
            setError('Failed to resend code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a1a] flex-col items-center justify-center p-12 relative overflow-hidden">
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}></div>

                <div className="max-w-lg relative z-10">
                    <div className="mb-16">
                        <div className="inline-flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                                <svg className="w-9 h-9 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h1 className="text-5xl font-bold text-white tracking-tight">PrayogAI</h1>
                        </div>
                        <p className="text-lg text-gray-400 leading-relaxed">
                            Join thousands of businesses using AI to transform their customer support experience.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-[#2a2a2a] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-800 shadow-lg hover:bg-[#333333] transition-colors duration-300">
                                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div className="text-sm text-gray-300 font-medium">Secure</div>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 bg-[#2a2a2a] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-800 shadow-lg hover:bg-[#333333] transition-colors duration-300">
                                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="text-sm text-gray-300 font-medium">Fast Setup</div>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 bg-[#2a2a2a] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-800 shadow-lg hover:bg-[#333333] transition-colors duration-300">
                                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                            </div>
                            <div className="text-sm text-gray-300 font-medium">Easy to Use</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Forms (White Background) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="max-w-md w-full">
                    <AnimatePresence mode="wait">
                        {showVerificationMessage ? (
                            <motion.div
                                key="verification-message"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white p-12 text-center rounded-2xl shadow-lg border border-gray-100"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 mx-auto flex items-center justify-center shadow-2xl mb-8"
                                >
                                    <CheckCircle2 className="w-12 h-12 text-white" />
                                </motion.div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-3xl font-bold gradient-text mb-4"
                                >
                                    Account Verified!
                                </motion.h2>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-gray-600 font-medium mb-2"
                                >
                                    Your account has been successfully verified
                                </motion.p>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-gray-900 font-bold text-lg mb-6"
                                >
                                    {email}
                                </motion.p>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="text-sm text-gray-500 font-medium"
                                >
                                    Redirecting to login page...
                                </motion.p>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    className="mt-8"
                                >
                                    <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 3, ease: "linear" }}
                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                                        />
                                    </div>
                                </motion.div>
                            </motion.div>
                        ) : showOtpInput ? (
                            <motion.div
                                key="otp-input"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100"
                            >
                                <div className="mb-10">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
                                    <p className="text-gray-600 text-sm">
                                        We've sent a 6-digit code to <span className="font-bold text-gray-900">{email}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOtp} className="space-y-6">
                                    <div>
                                        <label htmlFor="otp" className="block text-sm font-semibold mb-3 text-gray-700">
                                            Verification Code
                                        </label>
                                        <input
                                            id="otp"
                                            name="otp"
                                            type="text"
                                            required
                                            maxLength={6}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 text-center text-2xl tracking-widest font-bold"
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                setOtp(value);
                                            }}
                                        />
                                        <p className="text-xs text-gray-500 mt-2 font-medium text-center">
                                            Enter the 6-digit code from your email
                                        </p>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex items-center gap-3 p-4 backdrop-blur-sm border rounded-2xl shadow-lg ${
                                                error.includes('resent') 
                                                    ? 'bg-green-50/80 border-green-200/50' 
                                                    : 'bg-red-50/80 border-red-200/50'
                                            }`}
                                        >
                                            <svg className={`w-5 h-5 flex-shrink-0 ${error.includes('resent') ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className={`text-sm font-medium ${error.includes('resent') ? 'text-green-600' : 'text-red-600'}`}>{error}</span>
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isVerifying || otp.length !== 6}
                                        className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {isVerifying ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify Email'
                                        )}
                                    </button>

                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">
                                            Didn't receive the code?{' '}
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                disabled={isLoading}
                                                className="font-semibold text-gray-900 hover:text-gray-700 transition-colors duration-300 disabled:opacity-50"
                                            >
                                                {isLoading ? 'Sending...' : 'Resend'}
                                            </button>
                                        </p>
                                    </div>
                                </form>

                                <div className="mt-8 text-center">
                                    <button
                                        onClick={() => {
                                            setShowOtpInput(false);
                                            setOtp('');
                                            setError('');
                                        }}
                                        className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                                    >
                                        ← Back to sign up
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="signup-form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100"
                            >
                                <div className="mb-8">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                                    <p className="text-gray-600 text-sm">Start building your AI chatbot today</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold mb-3 text-gray-700">
                                            Email address
                                        </label>
                                        <div className="relative">
                                            <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                autoComplete="email"
                                                className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400"
                                                placeholder="you@company.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-semibold mb-3 text-gray-700">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                autoComplete="new-password"
                                                className="w-full px-4 py-3 pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 font-medium">Must be at least 8 characters</p>
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-3 text-gray-700">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                required
                                                autoComplete="new-password"
                                                className="w-full px-4 py-3 pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-3 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl shadow-lg"
                                        >
                                            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-sm text-red-600 font-medium">{error}</span>
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Creating Account...
                                            </>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </button>
                                </form>

                                <div className="mt-8 text-center">
                                    <p className="text-sm text-gray-600">
                                        Already have an account?{' '}
                                        <a href="/login" className="font-semibold text-gray-900 hover:text-gray-700 transition-colors duration-300">
                                            Sign in
                                        </a>
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
