'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { App, Input, Checkbox, Modal } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  PhoneOutlined,
  ArrowRightOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api/authApi';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '574041873334-uq8grv9b945tm2e3esgosbt9bantcphh.apps.googleusercontent.com';

function AuthPageContent() {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';

  const { login, register, loginWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginErrors, setLoginErrors] = useState<{ identifier?: string; password?: string }>({});

  // Forgot password OTP Modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1: input phone/email, 2: input OTP & new password
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [otpSentNotice, setOtpSentNotice] = useState<string>('');

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpCountdown]);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
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

    try {
      setIsSubmitting(true);
      const success = await login(loginIdentifier, loginPassword);
      if (success) {
        message.success('Đăng nhập thành công! Chào mừng quý khách trở lại.');
        router.push('/');
      }
    } catch (err: any) {
      message.error(err?.message || 'Đăng nhập thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
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

    try {
      setIsSubmitting(true);
      await register({
        name: regName,
        phone: regPhone,
        email: regEmail,
        password: regPassword,
      });

      message.success('Đăng ký tài khoản gia chủ thành công! Vui lòng đăng nhập.');
      setLoginIdentifier(regPhone.trim() || regEmail.trim());
      setLoginPassword('');
      setRegName('');
      setRegPhone('');
      setRegEmail('');
      setRegPassword('');
      setRegErrors({});
      setActiveTab('login');
    } catch (err: any) {
      message.error(err?.message || 'Đăng ký tài khoản thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Request OTP for Forgot Password
  const handleRequestOtp = async () => {
    if (!forgotIdentifier.trim()) {
      message.warning('Vui lòng nhập Số điện thoại hoặc Email đã đăng ký.');
      return;
    }
    try {
      setIsSendingOtp(true);
      setForgotError(null);
      const msg = await authApi.forgotPassword(forgotIdentifier.trim());
      setOtpSentNotice(msg || 'Mã xác thực OTP đã được gửi.');
      message.success(msg || 'Mã xác thực OTP đã được gửi!');
      setForgotStep(2);
      setOtpCountdown(60);
    } catch (err: any) {
      setForgotError(err?.message || 'Không tìm thấy tài khoản với thông tin này.');
      message.error(err?.message || 'Không thể gửi mã OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Reset Password with OTP
  const handleResetPassword = async () => {
    if (!forgotOtp.trim()) {
      message.warning('Vui lòng nhập mã xác thực OTP.');
      return;
    }
    if (!forgotNewPassword) {
      message.warning('Vui lòng nhập mật khẩu mới.');
      return;
    }
    const passErr = validatePasswordRule(forgotNewPassword);
    if (passErr) {
      message.warning(passErr);
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      message.warning('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setIsResettingPassword(true);
      setForgotError(null);
      await authApi.resetPasswordWithOtp({
        identifier: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword,
      });
      message.success('Đặt lại mật khẩu thành công! Quý khách có thể đăng nhập ngay bằng mật khẩu mới.');
      setLoginIdentifier(forgotIdentifier.trim());
      setLoginPassword('');
      setIsForgotModalOpen(false);
      setForgotStep(1);
      setForgotIdentifier('');
      setForgotOtp('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setOtpCountdown(0);
    } catch (err: any) {
      setForgotError(err?.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
      message.error(err?.message || 'Đặt lại mật khẩu thất bại.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Official Google OAuth Login via SDK (uses Origin postMessage, avoids redirect_uri_mismatch)
  const triggerGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsSubmitting(true);
        // Fetch user profile from Google with access token
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();

        if (profile && (profile.email || profile.sub)) {
          const b64Payload = btoa(unescape(encodeURIComponent(JSON.stringify(profile))));
          const credentialToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${b64Payload}.signature`;
          const success = await loginWithGoogle(credentialToken);
          if (success) {
            message.success('Đăng nhập bằng Google thành công! Chào mừng quý khách.');
            router.push('/');
          } else {
            message.error('Không thể xác thực tài khoản Google.');
          }
        } else {
          message.error('Không lấy được thông tin từ Google.');
        }
      } catch (err: any) {
        message.error(err?.message || 'Đăng nhập Google thất bại.');
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: (errorResponse) => {
      console.error('Google login error:', errorResponse);
      message.error('Đăng nhập bằng tài khoản Google không thành công.');
    },
  });

  // Open Google Login popup strictly centered on screen
  const handleGoogleLoginCentered = () => {
    if (typeof window === 'undefined') return;

    const width = 500;
    const height = 620;

    const screenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    const screenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

    const winWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
    const winHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;

    const left = Math.round(screenLeft + (winWidth - width) / 2);
    const top = Math.round(screenTop + (winHeight - height) / 2);

    const originalWindowOpen = window.open;

    // Intercept Google SDK's window.open call to inject exact center coordinates
    window.open = function (url?: string | URL, target?: string, features?: string) {
      window.open = originalWindowOpen;
      const centeredFeatures = `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=no,resizable=yes`;
      return originalWindowOpen.call(window, url, target, centeredFeatures);
    };

    try {
      triggerGoogleAuth();
    } catch (err) {
      window.open = originalWindowOpen;
      console.error(err);
    }

    // Safety fallback to restore window.open
    setTimeout(() => {
      window.open = originalWindowOpen;
    }, 1500);
  };

  // Handle Google OAuth Success (credential fallback)
  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse?.credential) {
      try {
        setIsSubmitting(true);
        const success = await loginWithGoogle(credentialResponse.credential);
        if (success) {
          message.success('Đăng nhập bằng Google thành công! Chào mừng quý khách.');
          router.push('/');
        } else {
          message.error('Không thể xác thực tài khoản Google.');
        }
      } catch (err: any) {
        message.error(err?.message || 'Đăng nhập Google thất bại.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleError = () => {
    message.error('Đăng nhập bằng tài khoản Google không thành công.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f5] text-[#1f1b19] font-body-md selection:bg-[#ffdbc8] selection:text-[#311301] relative overflow-x-hidden">
      {/* Header */}
      <Header cartCount={0} onOpenBooking={() => { }} />

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
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">

            {/* LEFT COLUMN: Clean Sharp Auth Card */}
            <div className="lg:col-span-6 xl:col-span-6 w-full max-w-xl lg:max-w-none mx-auto bg-white/95 backdrop-blur-md rounded-none shadow-[0_24px_70px_rgba(40,24,14,0.14)] p-5 sm:p-7 border border-[#e8ded8] transition-all">

              {/* Prominent Brand Identity Header */}
              <div className="flex items-center gap-3 pb-3 mb-3.5 border-b border-[#eae1dd]">
                <img
                  src="/logo.png"
                  alt="Logo D2 LUXURY"
                  className="h-10 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-base sm:text-lg font-normal text-[#5d371f] tracking-wide leading-none">
                      D2 LUXURY
                    </span>
                    <span className="px-2 py-0.5 bg-[#f5ece8] border border-[#eae1dd] text-[#5d371f] text-[10px] font-normal rounded-none">
                      Nghệ nhân
                    </span>
                  </div>
                  <span className="text-[11px] text-[#83746c] font-normal tracking-wide mt-0.5 truncate">
                    Nội thất gỗ tự nhiên &amp; may đo
                  </span>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center justify-between p-1 bg-[#f5ece8] rounded-none mb-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setLoginErrors({});
                  }}
                  className={`flex-1 py-2 text-center text-xs sm:text-sm font-normal rounded-none transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'login'
                      ? 'bg-[#5d371f] text-white shadow-sm'
                      : 'text-[#83746c] hover:text-[#5d371f]'
                    }`}
                >
                  <span className="material-symbols-outlined text-[17px]">home</span>
                  <span>Đăng nhập gia chủ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setRegErrors({});
                  }}
                  className={`flex-1 py-2 text-center text-xs sm:text-sm font-normal rounded-none transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'register'
                      ? 'bg-[#5d371f] text-white shadow-sm'
                      : 'text-[#83746c] hover:text-[#5d371f]'
                    }`}
                >
                  <span className="material-symbols-outlined text-[17px]">person</span>
                  <span>Đăng ký thành viên</span>
                </button>
              </div>

              {/* TAB 1: LOGIN PANEL */}
              {activeTab === 'login' && (
                <div className="flex flex-col animate-in fade-in-50 duration-200">
                  <div className="mb-3.5">
                    <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#1f1b19] tracking-tight">
                      Chào mừng quay trở lại
                    </h2>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3 text-xs" noValidate>
                    {/* Phone / Email */}
                    <div className="flex flex-col gap-1">
                      <label className="font-normal text-[#1f1b19] text-xs">
                        Số điện thoại hoặc Email *
                      </label>
                      <Input
                        size="large"
                        value={loginIdentifier}
                        onChange={(e) => {
                          setLoginIdentifier(e.target.value);
                          if (loginErrors.identifier) {
                            setLoginErrors((prev) => ({ ...prev, identifier: undefined }));
                          }
                        }}
                        placeholder="vanluan1910@d2luxury.vn hoặc 0918345678"
                        prefix={<MailOutlined className="text-[#83746c] mr-1.5" />}
                        status={loginErrors.identifier ? 'error' : ''}
                        className="!bg-[#faf6f4] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-normal hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2 !px-3"
                      />
                      {loginErrors.identifier && (
                        <p className="text-red-500 text-[11px] font-normal flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          <span>{loginErrors.identifier}</span>
                        </p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="font-normal text-[#1f1b19] text-xs">
                          Mật khẩu *
                        </label>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setForgotIdentifier(loginIdentifier.trim());
                            setForgotOtp('');
                            setForgotNewPassword('');
                            setForgotConfirmPassword('');
                            setForgotStep(1);
                            setForgotError(null);
                            setIsForgotModalOpen(true);
                          }}
                          className="text-xs text-[#83746c] hover:text-[#5d371f] transition-colors cursor-pointer"
                        >
                          Quên mật khẩu?
                        </a>
                      </div>
                      <Input.Password
                        size="large"
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (loginErrors.password) {
                            setLoginErrors((prev) => ({ ...prev, password: undefined }));
                          }
                        }}
                        placeholder="••••••••••••"
                        prefix={<LockOutlined className="text-[#83746c] mr-1.5" />}
                        status={loginErrors.password ? 'error' : ''}
                        className="!bg-[#faf6f4] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-normal hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2 !px-3"
                      />
                      {loginErrors.password ? (
                        <p className="text-red-500 text-[11px] font-normal flex items-center gap-1 mt-0.5">
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
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="text-[#51443d] text-xs select-none font-normal"
                      >
                        Ghi nhớ đăng nhập trên thiết bị này
                      </Checkbox>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 sm:py-3 px-5 rounded-none bg-[#5d371f] text-white hover:bg-[#784e34] font-normal text-xs sm:text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2 mt-0.5 cursor-pointer disabled:opacity-70"
                    >
                      <span>Đăng nhập ngay</span>
                      <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                    </button>

                    {/* Real Google Login */}
                    <div className="mt-2.5">
                      <div className="relative flex items-center justify-center my-1.5">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full h-px bg-[#eae1dd]"></div>
                        </div>
                        <span className="relative px-2.5 bg-white text-[11px] font-normal text-[#83746c]">
                          Hoặc đăng nhập nhanh bằng
                        </span>
                      </div>

                      <div className="w-full">
                        <button
                          type="button"
                          onClick={handleGoogleLoginCentered}
                          className="w-full py-2.5 px-3 rounded-none bg-white hover:bg-[#faf6f4] border border-[#d8c8bf] hover:border-[#5d371f] text-[#2c221e] font-normal text-xs transition-all duration-200 shadow-sm flex items-center justify-center gap-2.5 cursor-pointer group active:scale-[0.99]"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span className="group-hover:text-[#5d371f] transition-colors">
                            Đăng nhập bằng tài khoản Google
                          </span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: REGISTER PANEL */}
              {activeTab === 'register' && (
                <div className="flex flex-col animate-in fade-in-50 duration-200">
                  <div className="mb-3.5">
                    <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#1f1b19] tracking-tight">
                      Đăng ký thành viên
                    </h2>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-2.5 text-xs" noValidate>
                    {/* Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="flex flex-col gap-1">
                        <label className="font-normal text-[#1f1b19] text-xs">
                          Họ và tên gia chủ *
                        </label>
                        <Input
                          size="large"
                          value={regName}
                          onChange={(e) => {
                            setRegName(e.target.value);
                            if (regErrors.name) {
                              setRegErrors((prev) => ({ ...prev, name: undefined }));
                            }
                          }}
                          placeholder="Trần Minh Hoàng"
                          prefix={<UserOutlined className="text-[#83746c] mr-1.5" />}
                          status={regErrors.name ? 'error' : ''}
                          className="!bg-[#faf6f4] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-normal hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2 !px-3"
                        />
                        {regErrors.name && (
                          <p className="text-red-500 text-[11px] font-normal flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            <span>{regErrors.name}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-normal text-[#1f1b19] text-xs">
                          Số điện thoại kích hoạt *
                        </label>
                        <Input
                          size="large"
                          type="tel"
                          value={regPhone}
                          onChange={(e) => {
                            setRegPhone(e.target.value);
                            if (regErrors.phone) {
                              setRegErrors((prev) => ({ ...prev, phone: undefined }));
                            }
                          }}
                          placeholder="0912 345 678"
                          prefix={<PhoneOutlined className="text-[#83746c] mr-1.5" />}
                          status={regErrors.phone ? 'error' : ''}
                          className="!bg-[#faf6f4] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-normal hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2 !px-3"
                        />
                        {regErrors.phone && (
                          <p className="text-red-500 text-[11px] font-normal flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            <span>{regErrors.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email & Password on 2 columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="flex flex-col gap-1">
                        <label className="font-normal text-[#1f1b19] text-xs">
                          Email liên hệ
                        </label>
                        <Input
                          size="large"
                          type="email"
                          value={regEmail}
                          onChange={(e) => {
                            setRegEmail(e.target.value);
                            if (regErrors.email) {
                              setRegErrors((prev) => ({ ...prev, email: undefined }));
                            }
                          }}
                          placeholder="hoang.tran@gmail.com"
                          prefix={<MailOutlined className="text-[#83746c] mr-1.5" />}
                          status={regErrors.email ? 'error' : ''}
                          className="!bg-[#faf6f4] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-normal hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2 !px-3"
                        />
                        {regErrors.email && (
                          <p className="text-red-500 text-[11px] font-normal flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            <span>{regErrors.email}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-normal text-[#1f1b19] text-xs">
                          Tạo mật khẩu bảo vệ *
                        </label>
                        <Input.Password
                          size="large"
                          value={regPassword}
                          onChange={(e) => {
                            setRegPassword(e.target.value);
                            if (regErrors.password) {
                              setRegErrors((prev) => ({ ...prev, password: undefined }));
                            }
                          }}
                          placeholder="Ví dụ: Matkhau123"
                          prefix={<LockOutlined className="text-[#83746c] mr-1.5" />}
                          status={regErrors.password ? 'error' : ''}
                          className="!bg-[#faf6f4] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-normal hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2 !px-3"
                        />
                        {regErrors.password && (
                          <p className="text-red-500 text-[11px] font-normal flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            <span>{regErrors.password}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-[#83746c] text-[10px]">
                      * Mật khẩu tối thiểu 6 ký tự, chữ cái đầu tiên viết hoa (Ví dụ: Matkhau123)
                    </p>

                    {/* Terms */}
                    <div className="flex flex-col gap-1 pt-1 border-t border-[#eae1dd]">
                      <Checkbox
                        checked={agreeTerms}
                        onChange={(e) => {
                          setAgreeTerms(e.target.checked);
                          if (regErrors.agreeTerms) {
                            setRegErrors((prev) => ({ ...prev, agreeTerms: undefined }));
                          }
                        }}
                        className="text-[11px] text-[#51443d] select-none font-normal"
                      >
                        Tôi đồng ý với <a href="#" className="text-[#5d371f] underline font-normal">Điều khoản dịch vụ</a> và <a href="#" className="text-[#5d371f] underline font-normal">Chính sách bảo mật nghệ nhân</a> của D2 LUXURY.
                      </Checkbox>
                      {regErrors.agreeTerms && (
                        <p className="text-red-500 text-[11px] font-normal flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          <span>{regErrors.agreeTerms}</span>
                        </p>
                      )}
                    </div>

                    {/* Register Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 sm:py-3 px-5 rounded-none bg-[#5d371f] hover:bg-[#784e34] text-white font-normal text-xs sm:text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2 mt-0.5 cursor-pointer disabled:opacity-70"
                    >
                      <span>Đăng ký thành viên</span>
                      <span className="material-symbols-outlined text-[17px]">verified</span>
                    </button>

                    {/* Real Google Register */}
                    <div className="mt-2.5">
                      <div className="relative flex items-center justify-center my-1.5">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full h-px bg-[#eae1dd]"></div>
                        </div>
                        <span className="relative px-2.5 bg-white text-[11px] font-normal text-[#83746c]">
                          Hoặc đăng ký nhanh bằng
                        </span>
                      </div>

                      <div className="w-full">
                        <button
                          type="button"
                          onClick={handleGoogleLoginCentered}
                          className="w-full py-2.5 px-3 rounded-none bg-white hover:bg-[#faf6f4] border border-[#d8c8bf] hover:border-[#5d371f] text-[#2c221e] font-normal text-xs transition-all duration-200 shadow-sm flex items-center justify-center gap-2.5 cursor-pointer group active:scale-[0.99]"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span className="group-hover:text-[#5d371f] transition-colors">
                            Đăng ký nhanh bằng tài khoản Google
                          </span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Brand Craft Story Overlay */}
            <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-6 lg:pl-8">
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
                    <span className="text-xs font-normal text-[#5d371f] tracking-wide">
                      D2 LUXURY DESIGN
                    </span>
                    <span className="text-[11px] text-[#51443d] font-normal">
                      Tinh hoa gỗ tự nhiên &amp; kiến trúc may đo
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-normal text-[#5d371f] tracking-wider uppercase">
                    Tinh thần chế tác
                  </span>
                  <div className="w-12 h-[1px] bg-[#5d371f]/50"></div>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1f1b19] leading-[1.15] mb-4 tracking-tight">
                  Nơi Mỗi Thớ Gỗ<br />Kể Câu Chuyện Không Gian
                </h1>

                <p className="text-xs sm:text-sm text-[#51443d] leading-relaxed max-w-xl font-normal">
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
                    <h4 className="font-normal text-xs text-[#1f1b19]">Gỗ tự nhiên</h4>
                    <p className="text-[11px] text-[#51443d] font-normal">chất lượng cao</p>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-start gap-3">
                  <div className="w-10 h-10 rounded-none bg-white/90 backdrop-blur shadow-sm border border-white flex items-center justify-center text-[#5d371f] shrink-0">
                    <span className="material-symbols-outlined text-[20px]">handyman</span>
                  </div>
                  <div>
                    <h4 className="font-normal text-xs text-[#1f1b19]">Thiết kế theo</h4>
                    <p className="text-[11px] text-[#51443d] font-normal">yêu cầu riêng</p>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-start gap-3">
                  <div className="w-10 h-10 rounded-none bg-white/90 backdrop-blur shadow-sm border border-white flex items-center justify-center text-[#5d371f] shrink-0">
                    <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  </div>
                  <div>
                    <h4 className="font-normal text-xs text-[#1f1b19]">Bảo hành dài hạn</h4>
                    <p className="text-[11px] text-[#51443d] font-normal">&amp; đồng hành trọn đời</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Forgot Password Modal with OTP */}
      <Modal
        open={isForgotModalOpen}
        onCancel={() => setIsForgotModalOpen(false)}
        footer={null}
        centered
        destroyOnHidden
        width={480}
        className="custom-auth-modal"
        styles={{
          body: {
            padding: '24px 20px',
            backgroundColor: '#fff8f5',
          },
        }}
      >
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#eae1dd]">
            <div className="w-10 h-10 bg-[#f5ece8] border border-[#eae1dd] text-[#5d371f] flex items-center justify-center shrink-0">
              <KeyOutlined className="text-xl" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-normal text-[#1f1b19] leading-tight">
                Đặt Lại Mật Khẩu Gia Chủ
              </h3>
              <p className="text-[11px] text-[#83746c] mt-0.5 font-normal">
                Xác thực danh tính qua mã OTP bảo mật 6 chữ số
              </p>
            </div>
          </div>

          {/* Error callout if any */}
          {forgotError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0 text-red-600">error</span>
              <span className="leading-snug">{forgotError}</span>
            </div>
          )}

          {/* STEP 1: Input Identifier & Request OTP */}
          {forgotStep === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-[#51443d] leading-relaxed font-normal">
                Vui lòng nhập Số điện thoại hoặc Email đã đăng ký tài khoản để nhận mã xác thực OTP khôi phục.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="font-normal text-[#1f1b19] text-xs uppercase tracking-wider">
                  Số điện thoại hoặc Email *
                </label>
                <Input
                  size="large"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="0918 345 678 hoặc email@domain.com"
                  prefix={<MailOutlined className="text-[#83746c] mr-1.5" />}
                  className="!bg-white !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-normal hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3.5"
                  onPressEnter={handleRequestOtp}
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={isSendingOtp}
                  className="w-full py-3 px-4 bg-[#5d371f] hover:bg-[#784e34] text-white font-normal text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSendingOtp ? (
                    <span>Đang khởi tạo OTP...</span>
                  ) : (
                    <>
                      <span>Gửi mã xác thực OTP</span>
                      <ArrowRightOutlined />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Input OTP & New Password */}
          {forgotStep === 2 && (
            <div className="flex flex-col gap-3.5">
              <div className="bg-[#f5ece8] border border-[#eae1dd] p-3 text-xs text-[#51443d] flex flex-col gap-1.5 font-normal">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[#83746c] block text-[10px]">Tài khoản xác thực:</span>
                    <span className="font-normal text-[#1f1b19] font-data-mono">{forgotIdentifier}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotError(null);
                    }}
                    className="text-xs text-[#5d371f] hover:underline font-normal cursor-pointer"
                  >
                    Đổi SĐT/Email
                  </button>
                </div>
                {otpSentNotice && (
                  <p className="text-[11px] text-[#5d371f] font-normal border-t border-[#eae1dd] pt-1.5 mt-0.5 leading-snug">
                    ✉️ {otpSentNotice}
                  </p>
                )}
              </div>

              {/* OTP Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-normal text-[#1f1b19] text-xs uppercase tracking-wider">
                    Mã OTP (6 chữ số) *
                  </label>
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={otpCountdown > 0 || isSendingOtp}
                    className="text-xs text-[#5d371f] hover:underline font-normal cursor-pointer disabled:text-[#83746c] disabled:no-underline"
                  >
                    {otpCountdown > 0 ? `Gửi lại mã (${otpCountdown}s)` : 'Gửi lại mã OTP'}
                  </button>
                </div>
                <Input
                  size="large"
                  maxLength={6}
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập 6 số OTP (Ví dụ: 892401)"
                  prefix={<SafetyCertificateOutlined className="text-[#83746c] mr-1.5" />}
                  className="!bg-white !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-data-mono text-center font-normal tracking-widest text-lg hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3.5"
                />
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="font-normal text-[#1f1b19] text-xs uppercase tracking-wider">
                  Mật khẩu mới *
                </label>
                <Input.Password
                  size="large"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="Ví dụ: Matkhau123 (tối thiểu 6 ký tự, chữ đầu hoa)"
                  prefix={<LockOutlined className="text-[#83746c] mr-1.5" />}
                  className="!bg-white !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-normal hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3.5"
                />
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="font-normal text-[#1f1b19] text-xs uppercase tracking-wider">
                  Xác nhận mật khẩu mới *
                </label>
                <Input.Password
                  size="large"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  prefix={<LockOutlined className="text-[#83746c] mr-1.5" />}
                  className="!bg-white !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-normal hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3.5"
                  onPressEnter={handleResetPassword}
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                  className="w-full py-3 px-4 bg-[#5d371f] hover:bg-[#784e34] text-white font-normal text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isResettingPassword ? (
                    <span>Đang cập nhật mật khẩu...</span>
                  ) : (
                    <>
                      <CheckCircleOutlined />
                      <span>Xác nhận đổi mật khẩu</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function AuthPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App>
        <Suspense fallback={<div className="min-h-screen bg-[#fff8f5]" />}>
          <AuthPageContent />
        </Suspense>
      </App>
    </GoogleOAuthProvider>
  );
}
