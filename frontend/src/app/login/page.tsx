'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { App } from 'antd';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';

function AuthPageContent() {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';

  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('vanluan1910@d2luxury.vn');
  const [loginPassword, setLoginPassword] = useState('Admin@123456');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginErrors, setLoginErrors] = useState<{ identifier?: string; password?: string }>({});

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [regErrors, setRegErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
    agreeTerms?: string;
  }>({});

  // Helper validation rule: Password >= 6 characters and first character uppercase
  const validatePasswordRule = (val: string): string | null => {
    if (!val) return 'Vui lòng nhập mật khẩu.';
    if (val.length < 6) return 'Mật khẩu phải từ 6 ký tự trở lên.';
    const firstChar = val.charAt(0);
    // Regex matches uppercase letters including Vietnamese accented letters
    if (!/^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ]/.test(firstChar)) {
      return 'Chữ cái đầu tiên của mật khẩu phải viết hoa (Ví dụ: Matkhau123).';
    }
    return null;
  };

  // Helper: Phone validation (Vietnamese phone standard: 10 digits starting with 03, 05, 07, 08, 09)
  const validatePhone = (val: string): string | null => {
    const clean = val.trim().replace(/[\s()-]/g, '');
    if (!clean) return 'Vui lòng nhập số điện thoại kích hoạt.';
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(clean)) {
      return 'Số điện thoại không hợp lệ (gồm 10 số, ví dụ: 0912345678).';
    }
    return null;
  };

  // Helper: Email validation
  const validateEmail = (val: string): string | null => {
    const clean = val.trim();
    if (!clean) return null; // Optional if not required
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      return 'Định dạng Email không hợp lệ (Ví dụ: gia_chu@gmail.com).';
    }
    return null;
  };

  // Update tab if query changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'register') {
      setActiveTab('register');
    } else if (tabParam === 'login') {
      setActiveTab('login');
    }
  }, [searchParams]);

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { identifier?: string; password?: string } = {};

    if (!loginIdentifier.trim()) {
      errors.identifier = 'Vui lòng nhập Số điện thoại hoặc Email.';
    } else if (loginIdentifier.includes('@')) {
      const emailErr = validateEmail(loginIdentifier);
      if (emailErr) errors.identifier = emailErr;
    }

    const passErr = validatePasswordRule(loginPassword);
    if (passErr) {
      errors.password = passErr;
    }

    setLoginErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      message.warning(firstError);
      return;
    }

    const success = login(loginIdentifier, loginPassword);
    if (success) {
      message.success('Đăng nhập thành công! Chào mừng quý khách trở lại.');
      router.push('/');
    }
  };

  // Handle Register
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: {
      name?: string;
      phone?: string;
      email?: string;
      password?: string;
      agreeTerms?: string;
    } = {};

    if (!regName.trim()) {
      errors.name = 'Vui lòng nhập họ và tên gia chủ.';
    } else if (regName.trim().length < 2) {
      errors.name = 'Họ và tên phải có tối thiểu 2 ký tự.';
    }

    const phoneErr = validatePhone(regPhone);
    if (phoneErr) errors.phone = phoneErr;

    if (regEmail.trim()) {
      const emailErr = validateEmail(regEmail);
      if (emailErr) errors.email = emailErr;
    }

    const passErr = validatePasswordRule(regPassword);
    if (passErr) errors.password = passErr;

    if (!agreeTerms) {
      errors.agreeTerms = 'Vui lòng đồng ý với Điều khoản dịch vụ & Chính sách bảo mật.';
    }

    setRegErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      message.warning(firstError);
      return;
    }

    register({
      name: regName,
      phone: regPhone,
      email: regEmail,
      password: regPassword,
    });

    message.success('Đăng ký tài khoản gia chủ thành công!');
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f5] text-[#1f1b19] font-body-md selection:bg-[#ffdbc8] selection:text-[#311301] relative overflow-x-hidden">
      {/* Header */}
      <Header cartCount={0} onOpenBooking={() => {}} />

      {/* Main Container with Full Background Photo */}
      <main className="w-full flex-1 pt-20 relative flex items-center justify-center min-h-[calc(100vh-80px)]">
        {/* Cinematic Japandi Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/login-bg.jpg"
            alt="D2 LUXURY Japandi Architectural Space"
            className="w-full h-full object-cover object-center scale-[1.01]"
          />
          {/* Layered Lighting & Contrast Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#fff8f5]/92 via-[#fff8f5]/65 to-[#1f1b19]/25 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fff8f5]/70 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Content Area */}
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT COLUMN: Clean Sharp Auth Card */}
            <div className="lg:col-span-6 xl:col-span-5 bg-white/95 backdrop-blur-md rounded-none shadow-[0_24px_70px_rgba(40,24,14,0.14)] p-6 sm:p-9 border border-[#e8ded8] transition-all">
              
              {/* Prominent Brand Identity Header */}
              <div className="flex items-center gap-3.5 pb-5 mb-5 border-b border-[#eae1dd]">
                <img
                  src="/logo.png"
                  alt="Logo D2 LUXURY"
                  className="h-12 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg sm:text-xl font-bold text-[#5d371f] tracking-wide leading-none">
                      D2 LUXURY
                    </span>
                    <span className="px-2 py-0.5 bg-[#f5ece8] border border-[#eae1dd] text-[#5d371f] text-[10px] font-semibold rounded-none">
                      Nghệ nhân
                    </span>
                  </div>
                  <span className="text-[11px] text-[#83746c] font-medium tracking-wide mt-1 truncate">
                    Nội thất gỗ tự nhiên &amp; may đo
                  </span>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center justify-between p-1 bg-[#f5ece8] rounded-none mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setLoginErrors({});
                  }}
                  className={`flex-1 py-2.5 text-center text-xs sm:text-sm font-semibold rounded-none transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === 'login'
                      ? 'bg-[#5d371f] text-white shadow-sm'
                      : 'text-[#83746c] hover:text-[#5d371f]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">home</span>
                  <span>Đăng nhập gia chủ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setRegErrors({});
                  }}
                  className={`flex-1 py-2.5 text-center text-xs sm:text-sm font-semibold rounded-none transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === 'register'
                      ? 'bg-[#5d371f] text-white shadow-sm'
                      : 'text-[#83746c] hover:text-[#5d371f]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  <span>Đăng ký thành viên</span>
                </button>
              </div>

              {/* TAB 1: LOGIN PANEL */}
              {activeTab === 'login' && (
                <div className="flex flex-col animate-in fade-in-50 duration-200">
                  <div className="mb-5">
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1f1b19] tracking-tight mb-1.5">
                      Chào mừng quay trở lại
                    </h2>
                    <p className="text-xs text-[#83746c] leading-relaxed">
                      Đăng nhập để theo dõi tiến độ gia công, lịch bảo hành và các ưu đãi dành riêng cho quý gia chủ.
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4 text-xs" noValidate>
                    {/* Phone / Email */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-[#1f1b19] text-xs">
                        Số điện thoại hoặc Email *
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#83746c] text-[18px]">
                          mail
                        </span>
                        <input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => {
                            setLoginIdentifier(e.target.value);
                            if (loginErrors.identifier) {
                              setLoginErrors((prev) => ({ ...prev, identifier: undefined }));
                            }
                          }}
                          placeholder="vanluan1910@d2luxury.vn hoặc 0918345678"
                          className={`w-full pl-11 pr-4 py-3 rounded-none bg-[#faf6f4] border text-[#1f1b19] font-medium focus:outline-none transition-colors ${
                            loginErrors.identifier
                              ? 'border-red-500 focus:border-red-600 bg-red-50/20'
                              : 'border-[#eae1dd] focus:border-[#5d371f] focus:bg-white'
                          }`}
                        />
                      </div>
                      {loginErrors.identifier && (
                        <p className="text-red-500 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          <span>{loginErrors.identifier}</span>
                        </p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-[#1f1b19] text-xs">
                          Mật khẩu *
                        </label>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            message.info('Vui lòng liên hệ hotline 1900 8922 hoặc trợ lý xưởng mộc để thiết lập lại mật khẩu.');
                          }}
                          className="text-xs text-[#83746c] hover:text-[#5d371f] transition-colors"
                        >
                          Quên mật khẩu?
                        </a>
                      </div>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#83746c] text-[18px]">
                          lock
                        </span>
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            if (loginErrors.password) {
                              setLoginErrors((prev) => ({ ...prev, password: undefined }));
                            }
                          }}
                          placeholder="••••••••••••"
                          className={`w-full pl-11 pr-11 py-3 rounded-none bg-[#faf6f4] border text-[#1f1b19] font-medium focus:outline-none transition-colors ${
                            loginErrors.password
                              ? 'border-red-500 focus:border-red-600 bg-red-50/20'
                              : 'border-[#eae1dd] focus:border-[#5d371f] focus:bg-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#83746c] hover:text-[#5d371f] transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showLoginPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      {loginErrors.password ? (
                        <p className="text-red-500 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          <span>{loginErrors.password}</span>
                        </p>
                      ) : (
                        <p className="text-[#83746c] text-[10px]">
                          * Mật khẩu tối thiểu 6 ký tự, chữ cái đầu tiên viết hoa (Ví dụ: Matkhau123)
                        </p>
                      )}
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded-none accent-[#5d371f] cursor-pointer"
                        />
                        <span className="text-[#51443d] text-xs">Ghi nhớ đăng nhập trên thiết bị này</span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-none bg-[#5d371f] text-white hover:bg-[#784e34] font-bold text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2 mt-1 cursor-pointer"
                    >
                      <span>Đăng nhập ngay</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>

                    {/* Quick Google Login */}
                    <div className="mt-4">
                      <div className="relative flex items-center justify-center my-3">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full h-px bg-[#eae1dd]"></div>
                        </div>
                        <span className="relative px-3 bg-white text-[11px] font-medium text-[#83746c]">
                          Hoặc đăng nhập nhanh bằng
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            login('khachhang@gmail.com');
                            message.success('Đã liên kết và đăng nhập bằng tài khoản Google!');
                            router.push('/');
                          }}
                          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-[#faf6f4] hover:bg-[#f5ece8] border border-[#eae1dd] rounded-none text-[#1f1b19] text-xs font-semibold transition-all cursor-pointer shadow-sm"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path d="M12 5c1.56 0 2.97.56 4.07 1.48l3.05-3.05C17.26 1.7 14.81 1 12 1 7.42 1 3.53 3.61 1.67 7.43l3.66 2.84C6.21 7.23 8.86 5 12 5z" fill="#EA4335"></path>
                            <path d="M23.49 12.28c0-.79-.07-1.54-.19-2.28H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-1.99 3.72-4.93 3.72-8.68z" fill="#4285F4"></path>
                            <path d="M5.33 14.73A6.974 6.974 0 0 1 5 12c0-.96.16-1.89.44-2.73L1.78 6.43A11.966 11.966 0 0 0 0 12c0 1.92.45 3.74 1.25 5.37l4.08-2.64z" fill="#FBBC05"></path>
                            <path d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.08.72-2.45 1.16-4.23 1.16-3.14 0-5.79-2.23-6.67-5.27L1.57 16.05C3.41 19.92 7.37 23 12 23z" fill="#34A853"></path>
                          </svg>
                          <span>Đăng nhập với Google</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: REGISTER PANEL */}
              {activeTab === 'register' && (
                <div className="flex flex-col animate-in fade-in-50 duration-200">
                  <div className="mb-5">
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1f1b19] tracking-tight mb-1.5">
                      Đăng ký thành viên
                    </h2>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4 text-xs" noValidate>
                    {/* Name & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-[#1f1b19] text-xs">
                          Họ và tên gia chủ *
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#83746c] text-[18px]">
                            person
                          </span>
                          <input
                            type="text"
                            value={regName}
                            onChange={(e) => {
                              setRegName(e.target.value);
                              if (regErrors.name) {
                                setRegErrors((prev) => ({ ...prev, name: undefined }));
                              }
                            }}
                            placeholder="Trần Minh Hoàng"
                            className={`w-full pl-11 pr-4 py-3 rounded-none bg-[#faf6f4] border text-[#1f1b19] font-medium focus:outline-none transition-colors ${
                              regErrors.name
                                ? 'border-red-500 focus:border-red-600 bg-red-50/20'
                                : 'border-[#eae1dd] focus:border-[#5d371f] focus:bg-white'
                            }`}
                          />
                        </div>
                        {regErrors.name && (
                          <p className="text-red-500 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            <span>{regErrors.name}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-[#1f1b19] text-xs">
                          Số điện thoại kích hoạt *
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#83746c] text-[18px]">
                            call
                          </span>
                          <input
                            type="tel"
                            value={regPhone}
                            onChange={(e) => {
                              setRegPhone(e.target.value);
                              if (regErrors.phone) {
                                setRegErrors((prev) => ({ ...prev, phone: undefined }));
                              }
                            }}
                            placeholder="0912 345 678"
                            className={`w-full pl-11 pr-4 py-3 rounded-none bg-[#faf6f4] border text-[#1f1b19] font-medium focus:outline-none transition-colors ${
                              regErrors.phone
                                ? 'border-red-500 focus:border-red-600 bg-red-50/20'
                                : 'border-[#eae1dd] focus:border-[#5d371f] focus:bg-white'
                            }`}
                          />
                        </div>
                        {regErrors.phone && (
                          <p className="text-red-500 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            <span>{regErrors.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-[#1f1b19] text-xs">
                        Email liên hệ
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#83746c] text-[18px]">
                          mail
                        </span>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => {
                            setRegEmail(e.target.value);
                            if (regErrors.email) {
                              setRegErrors((prev) => ({ ...prev, email: undefined }));
                            }
                          }}
                          placeholder="hoang.tran@gmail.com"
                          className={`w-full pl-11 pr-4 py-3 rounded-none bg-[#faf6f4] border text-[#1f1b19] font-medium focus:outline-none transition-colors ${
                            regErrors.email
                              ? 'border-red-500 focus:border-red-600 bg-red-50/20'
                              : 'border-[#eae1dd] focus:border-[#5d371f] focus:bg-white'
                          }`}
                        />
                      </div>
                      {regErrors.email && (
                        <p className="text-red-500 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          <span>{regErrors.email}</span>
                        </p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-[#1f1b19] text-xs">
                        Tạo mật khẩu bảo vệ *
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#83746c] text-[18px]">
                          lock_reset
                        </span>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => {
                            setRegPassword(e.target.value);
                            if (regErrors.password) {
                              setRegErrors((prev) => ({ ...prev, password: undefined }));
                            }
                          }}
                          placeholder="Ví dụ: Matkhau123 (tối thiểu 6 ký tự, chữ đầu viết hoa)"
                          className={`w-full pl-11 pr-11 py-3 rounded-none bg-[#faf6f4] border text-[#1f1b19] font-medium focus:outline-none transition-colors ${
                            regErrors.password
                              ? 'border-red-500 focus:border-red-600 bg-red-50/20'
                              : 'border-[#eae1dd] focus:border-[#5d371f] focus:bg-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#83746c] hover:text-[#5d371f] transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showRegPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      {regErrors.password ? (
                        <p className="text-red-500 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          <span>{regErrors.password}</span>
                        </p>
                      ) : (
                        <p className="text-[#83746c] text-[10px]">
                          * Mật khẩu tối thiểu 6 ký tự, chữ cái đầu tiên viết hoa (Ví dụ: Matkhau123)
                        </p>
                      )}
                    </div>

                    {/* Terms */}
                    <div className="flex flex-col gap-1.5 pt-1 border-t border-[#eae1dd]">
                      <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] text-[#51443d]">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => {
                            setAgreeTerms(e.target.checked);
                            if (regErrors.agreeTerms) {
                              setRegErrors((prev) => ({ ...prev, agreeTerms: undefined }));
                            }
                          }}
                          className="w-4 h-4 mt-0.5 rounded-none accent-[#5d371f] cursor-pointer shrink-0"
                        />
                        <span>
                          Tôi đồng ý với <a href="#" className="text-[#5d371f] underline font-semibold">Điều khoản dịch vụ</a> và <a href="#" className="text-[#5d371f] underline font-semibold">Chính sách bảo mật nghệ nhân</a> của D2 LUXURY.
                        </span>
                      </label>
                      {regErrors.agreeTerms && (
                        <p className="text-red-500 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          <span>{regErrors.agreeTerms}</span>
                        </p>
                      )}
                    </div>

                    {/* Register Button */}
                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-none bg-[#5d371f] hover:bg-[#784e34] text-white font-bold text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2 mt-2 cursor-pointer"
                    >
                      <span>Đăng ký thành viên</span>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                    </button>

                    {/* Quick Google Register */}
                    <div className="mt-4">
                      <div className="relative flex items-center justify-center my-3">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full h-px bg-[#eae1dd]"></div>
                        </div>
                        <span className="relative px-3 bg-white text-[11px] font-medium text-[#83746c]">
                          Hoặc đăng ký nhanh bằng
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            register({
                              name: 'Gia Chủ Google',
                              phone: '0912 345 678',
                              email: 'khachhang.google@gmail.com',
                            });
                            message.success('Đăng ký và liên kết thành công với tài khoản Google!');
                            router.push('/');
                          }}
                          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-[#faf6f4] hover:bg-[#f5ece8] border border-[#eae1dd] rounded-none text-[#1f1b19] text-xs font-semibold transition-all cursor-pointer shadow-sm"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path d="M12 5c1.56 0 2.97.56 4.07 1.48l3.05-3.05C17.26 1.7 14.81 1 12 1 7.42 1 3.53 3.61 1.67 7.43l3.66 2.84C6.21 7.23 8.86 5 12 5z" fill="#EA4335"></path>
                            <path d="M23.49 12.28c0-.79-.07-1.54-.19-2.28H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-1.99 3.72-4.93 3.72-8.68z" fill="#4285F4"></path>
                            <path d="M5.33 14.73A6.974 6.974 0 0 1 5 12c0-.96.16-1.89.44-2.73L1.78 6.43A11.966 11.966 0 0 0 0 12c0 1.92.45 3.74 1.25 5.37l4.08-2.64z" fill="#FBBC05"></path>
                            <path d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.08.72-2.45 1.16-4.23 1.16-3.14 0-5.79-2.23-6.67-5.27L1.57 16.05C3.41 19.92 7.37 23 12 23z" fill="#34A853"></path>
                          </svg>
                          <span>Đăng ký với Google</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Brand Craft Story Overlay */}
            <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-6 lg:pl-6">
              <div>
                {/* Brand Badge */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-none p-2 shadow-md border border-white/80 flex items-center justify-center">
                    <img
                      src="/logo.png"
                      alt="D2 LUXURY"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#5d371f] tracking-wide">
                      D2 LUXURY DESIGN
                    </span>
                    <span className="text-[11px] text-[#51443d] font-semibold">
                      Tinh hoa gỗ tự nhiên &amp; kiến trúc may đo
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold text-[#5d371f] tracking-wider">
                    Tinh thần chế tác
                  </span>
                  <div className="w-12 h-[1px] bg-[#5d371f]/50"></div>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1f1b19] leading-[1.15] mb-4 tracking-tight">
                  Nơi Mỗi Thớ Gỗ<br />Kể Câu Chuyện Không Gian
                </h1>

                <p className="text-xs sm:text-sm text-[#51443d] leading-relaxed max-w-xl">
                  Chúng tôi không chỉ sản xuất bàn ghế. D2 LUXURY kiến tạo những điểm tựa tĩnh tại cho tổ ấm qua sự hòa trộn giữa kỹ nghệ mộc truyền thống và công năng hiện đại.
                </p>
              </div>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="flex items-center sm:flex-col sm:items-start gap-3">
                  <div className="w-10 h-10 rounded-none bg-white/90 backdrop-blur shadow-sm border border-white flex items-center justify-center text-[#5d371f] shrink-0">
                    <span className="material-symbols-outlined text-[20px]">eco</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#1f1b19]">Gỗ tự nhiên</h4>
                    <p className="text-[11px] text-[#51443d]">chất lượng cao</p>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-start gap-3">
                  <div className="w-10 h-10 rounded-none bg-white/90 backdrop-blur shadow-sm border border-white flex items-center justify-center text-[#5d371f] shrink-0">
                    <span className="material-symbols-outlined text-[20px]">handyman</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#1f1b19]">Thiết kế theo</h4>
                    <p className="text-[11px] text-[#51443d]">yêu cầu riêng</p>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-start gap-3">
                  <div className="w-10 h-10 rounded-none bg-white/90 backdrop-blur shadow-sm border border-white flex items-center justify-center text-[#5d371f] shrink-0">
                    <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#1f1b19]">Bảo hành dài hạn</h4>
                    <p className="text-[11px] text-[#51443d]">&amp; đồng hành trọn đời</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default function AuthPage() {
  return (
    <App>
      <Suspense fallback={<div className="min-h-screen bg-[#fff8f5]" />}>
        <AuthPageContent />
      </Suspense>
    </App>
  );
}
