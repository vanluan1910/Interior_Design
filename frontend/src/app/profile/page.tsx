'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { App, message, Modal } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  RightOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  LogoutOutlined,
  LockOutlined,
  ShoppingOutlined,
  EnvironmentOutlined,
  CarOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { VIETNAM_PROVINCES } from '@/data/vietnamAddresses';

interface AddressItem {
  id: string;
  isDefault: boolean;
  title: string;
  address: string;
  note: string;
  recipient: string;
  phone: string;
  tag: string;
}

const INITIAL_ADDRESSES: AddressItem[] = [
  {
    id: 'addr_01',
    isDefault: true,
    title: 'Căn hộ Penthouse A18.04',
    address: 'Tháp Maldives, Đảo Kim Cương, Phường Bình Trưng Tây, TP. Thủ Đức, TP. Hồ Chí Minh',
    note: 'Lưu ý: Thang máy vận chuyển hàng 2.4m, hẹn bàn giao cuối tuần.',
    recipient: 'Nguyễn Hoàng Minh',
    phone: '0918 345 678',
    tag: 'Căn hộ chính',
  },
  {
    id: 'addr_02',
    isDefault: false,
    title: 'Biệt thự Đơn lập Gamuda Gardens',
    address: 'Khu đô thị Gamuda City, Phường Trần Phú, Quận Hoàng Mai, Hà Nội',
    note: 'Xe tải xưởng mộc 3.5 tấn có thể tiếp cận trực tiếp sân trước.',
    recipient: 'Minh (KTS)',
    phone: '0918 345 678',
    tag: 'Nhà vườn nghỉ dưỡng',
  },
];

function ProfilePageContent() {
  const { message } = App.useApp();
  const router = useRouter();
  const { user, isAdmin, updateProfile, logout } = useAuth();
  const { cartCount } = useCart();

  // Active navigation tab on left menu
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders' | 'security'>('profile');

  // Form states for profile
  const [fullName, setFullName] = useState(user?.name || 'Nguyễn Hoàng Minh');
  const [dob, setDob] = useState('14/08/1988');
  const [phone, setPhone] = useState(user?.phone || '0918 345 678');
  const [email, setEmail] = useState(user?.email || 'minh.nguyen@archistudio.vn');
  const [bio, setBio] = useState(user?.bio || 'Gia chủ yêu thích phong cách Japandi & Wabi-Sabi tinh tế, trân trọng chất mộc mạc nguyên bản của gỗ óc chó Bắc Mỹ.');

  // Addresses state
  const [addresses, setAddresses] = useState<AddressItem[]>(INITIAL_ADDRESSES);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNote, setNewNote] = useState('');

  // Dynamic districts for Add Address modal
  const newDistricts = useMemo(() => {
    if (!newCity) return [];
    const found = VIETNAM_PROVINCES.find((p) => p.name === newCity);
    return found ? found.districts : [];
  }, [newCity]);

  const handleNewCityChange = (cityName: string) => {
    setNewCity(cityName);
    setNewDistrict('');
  };

  // Password change modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Save profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      message.warning('Vui lòng nhập Họ và tên.');
      return;
    }
    updateProfile({
      name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      bio: bio.trim(),
    });
    message.success('Đã lưu thông tin gia chủ thành công!');
  };

  // Set default address
  const handleSetDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
    message.success('Đã đặt làm địa chỉ bàn giao mặc định!');
  };

  // Add new address
  const handleAddAddress = () => {
    if (!newTitle.trim()) {
      message.warning('Vui lòng nhập tên gợi nhớ công trình.');
      return;
    }
    if (!newRecipient.trim()) {
      message.warning('Vui lòng nhập họ và tên người nhận.');
      return;
    }
    if (!newPhone.trim()) {
      message.warning('Vui lòng nhập số điện thoại người nhận.');
      return;
    }
    if (!newCity) {
      message.warning('Vui lòng chọn Tỉnh / Thành phố.');
      return;
    }
    if (!newDistrict) {
      message.warning('Vui lòng chọn Quận / Huyện.');
      return;
    }
    if (!newAddress.trim()) {
      message.warning('Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường, căn hộ...).');
      return;
    }

    const fullFormattedAddress = `${newAddress.trim()}, ${newDistrict}, ${newCity}`;

    const item: AddressItem = {
      id: `addr_${Date.now()}`,
      isDefault: addresses.length === 0,
      title: newTitle.trim(),
      address: fullFormattedAddress,
      note: newNote.trim() || 'Không có ghi chú thêm.',
      recipient: newRecipient.trim(),
      phone: newPhone.trim(),
      tag: 'Công trình mới',
    };

    setAddresses([...addresses, item]);
    setIsAddAddressOpen(false);
    setNewTitle('');
    setNewRecipient('');
    setNewPhone('');
    setNewCity('');
    setNewDistrict('');
    setNewAddress('');
    setNewNote('');
    message.success('Đã thêm địa chỉ công trình mới thành công!');
  };

  // Delete address
  const handleDeleteAddress = (id: string) => {
    if (addresses.length <= 1) {
      message.warning('Cần giữ ít nhất 1 địa chỉ nhận hàng.');
      return;
    }
    setAddresses(addresses.filter((a) => a.id !== id));
    message.success('Đã xóa địa chỉ!');
  };

  // Handle Password Change
  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      message.warning('Vui lòng điền đầy đủ các trường mật khẩu.');
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    setIsPasswordModalOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    message.success('Đã cập nhật mật khẩu mới thành công!');
  };

  const handleLogout = () => {
    logout();
    message.info('Đã đăng xuất tài khoản.');
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f5] text-[#1f1b19] font-body-md selection:bg-[#ffdbc8] selection:text-[#311301]">
      {/* Header */}
      <Header cartCount={cartCount} onOpenBooking={() => {}} />

      <main className="w-full pt-20 flex-1">
        {/* Subtle Atmospheric Background Accents */}
        <div className="relative w-full overflow-hidden pb-16">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#ffdbc8]/20 blur-3xl pointer-events-none" />
          <div className="absolute top-96 -left-32 w-80 h-80 rounded-full bg-[#efe6e3]/50 blur-2xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-[#83746c] mb-6">
              <Link href="/" className="hover:text-[#5d371f] transition-colors">
                Trang chủ
              </Link>
              <span className="material-symbols-outlined text-[14px] text-[#d5c3ba]">chevron_right</span>
              <span className="hover:text-[#5d371f] transition-colors cursor-pointer">
                Tài khoản của tôi
              </span>
              <span className="material-symbols-outlined text-[14px] text-[#d5c3ba]">chevron_right</span>
              <span className="text-[#5d371f] font-bold">Thông tin cá nhân</span>
            </nav>

            {/* Main Layout 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Profile Summary & Sidebar Menu */}
              <aside className="lg:col-span-4 flex flex-col gap-6">
                {/* User Summary Card */}
                <div className="bg-white border border-[#eae1dd] p-6 shadow-sm flex flex-col">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        className="w-16 h-16 object-cover ring-2 ring-[#d5c3ba] shadow-sm"
                        src={
                          user?.avatar ||
                          'https://lh3.googleusercontent.com/aida-public/AB6AXuCat_S6E8qhOpd0scj-6rD4LfY-vo8Z8BklqUwqxMQ7KmIIIgjWnFYxUX5fCgoVlCAAL_D8yl8U9ygJ0mEVG7YKDvo7gJ6zFOVjaKRNG_Cg0c2N5V8m5uiyP19HNH0NrH3dQdUC9VFMfNIe6EMKef3NZFvNCfCOWMVw2Q1X0zJcbXJvCdsvo8d1fnvyZGmzP2qJA0aHtNnpovE1Pk7M0kbgrh3_ATbB9f5cnwRYJTPAtz9HlOwVQrbq'
                        }
                        alt="Ảnh đại diện gia chủ"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#5d371f] text-[#ffdbb5] flex items-center justify-center border border-white">
                        <span className="material-symbols-outlined text-[12px]">workspace_premium</span>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-serif text-lg font-bold text-[#1f1b19] truncate">
                        {fullName}
                      </h3>
                      <span className="text-[10px] uppercase tracking-wider text-[#5d371f] font-bold mt-0.5">
                        {isAdmin ? 'Quản Trị Viên Cấp Cao' : 'Gia Chủ Hạng Tinh Hoa'}
                      </span>
                      <span className="font-data-mono text-[11px] text-[#83746c] mt-0.5">
                        Mã KH: #{user?.id ? user.id.replace('usr_', 'MG-') : 'MG-88910'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#eae1dd] flex flex-col gap-2 text-xs">
                    <div className="flex items-center gap-2.5 text-[#51443d]">
                      <span className="material-symbols-outlined text-[18px] text-[#83746c]">mail</span>
                      <span className="truncate font-data-mono">{email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[#51443d]">
                      <span className="material-symbols-outlined text-[18px] text-[#83746c]">call</span>
                      <span className="font-data-mono">{phone}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[#51443d]">
                      <span className="material-symbols-outlined text-[18px] text-[#83746c]">verified_user</span>
                      <span className="text-[#3f4332] font-semibold">Tài khoản đã xác thực quyền lợi FSC</span>
                    </div>

                    <div className="mt-2 pt-3 border-t border-[#eae1dd] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('section-doi-mat-khau');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            setIsPasswordModalOpen(true);
                          }
                        }}
                        className="text-xs text-[#5d371f] hover:underline font-semibold cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        <span>Đổi mật khẩu</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              </aside>

              {/* RIGHT COLUMN: Main Content Blocks */}
              <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
                {/* SECTION 1: Form Thông tin cá nhân */}
                {(activeTab === 'profile' || activeTab === 'addresses' || activeTab === 'orders') && (
                  <section className="bg-white border border-[#eae1dd] p-6 sm:p-7 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#eae1dd]">
                      <div>
                        <h2 className="font-serif text-lg sm:text-xl font-bold text-[#5d371f]">
                          Thông Tin Gia Chủ &amp; Liên Hệ
                        </h2>
                      </div>
                      <span className="font-data-mono text-[11px] text-[#83746c] flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-[14px]">schedule</span> Cập nhật: Hôm nay
                      </span>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div className="flex flex-col gap-1.5">
                          <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                            Họ và tên gia chủ *
                          </label>
                          <div className="relative">
                            <input
                              className="w-full px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f] transition-colors"
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Nhập họ và tên..."
                            />
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#83746c] text-[18px]">
                              badge
                            </span>
                          </div>
                        </div>

                        {/* Date of Birth */}
                        <div className="flex flex-col gap-1.5">
                          <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                            Ngày sinh
                          </label>
                          <div className="relative">
                            <input
                              className="w-full px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f] transition-colors"
                              type="text"
                              value={dob}
                              onChange={(e) => setDob(e.target.value)}
                              placeholder="DD/MM/YYYY"
                            />
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#83746c] text-[18px]">
                              calendar_month
                            </span>
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                              Số điện thoại *
                            </label>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#3f4332] bg-[#e1e5ce] px-2 py-0.5">
                              <CheckCircleFilled className="text-[10px]" /> Đã xác thực
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              className="w-full px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-data-mono font-medium focus:outline-none focus:border-[#5d371f] transition-colors"
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="0918 345 678"
                            />
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#83746c] text-[18px]">
                              smartphone
                            </span>
                          </div>
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                              Hòm thư điện tử *
                            </label>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#3f4332] bg-[#e1e5ce] px-2 py-0.5">
                              <CheckCircleFilled className="text-[10px]" /> Đã xác thực
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              className="w-full px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f] transition-colors"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="email@example.com"
                            />
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#83746c] text-[18px]">
                              alternate_email
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bio / Ghi chú gia chủ */}
                      <div className="flex flex-col gap-1.5 pt-1">
                        <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                          Ghi chú gu thẩm mỹ &amp; phong cách kiến trúc
                        </label>
                        <textarea
                          rows={2}
                          className="w-full px-3.5 py-2 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f] transition-colors leading-relaxed"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Ví dụ: Căn hộ phong cách Japandi tối giản, ưu tiên bàn ghế bo cong hữu cơ..."
                        />
                      </div>

                      {/* Form Action Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eae1dd]">
                        <button
                          type="button"
                          onClick={() => {
                            setFullName(user?.name || '');
                            setPhone(user?.phone || '');
                            setEmail(user?.email || '');
                            setBio(user?.bio || '');
                            message.info('Đã hoàn tác thay đổi.');
                          }}
                          className="px-4 py-2 text-[#51443d] hover:bg-[#f5ece8] font-semibold transition-colors cursor-pointer"
                        >
                          Hoàn tác
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-[#5d371f] text-white hover:bg-[#784e34] font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <SaveOutlined /> Lưu thay đổi
                        </button>
                      </div>
                    </form>
                  </section>
                )}

                {/* SECTION 2: Sổ Địa Chỉ Công Trình */}
                <section className="bg-white border border-[#eae1dd] p-6 sm:p-7 shadow-sm">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#eae1dd]">
                    <div>
                      <h2 className="font-serif text-lg sm:text-xl font-bold text-[#5d371f]">
                        Sổ Địa Chỉ Công Trình &amp; Giao Hàng Mặc Định
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddAddressOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#fbf2ee] hover:bg-[#5d371f] hover:text-white border border-[#eae1dd] text-[#5d371f] font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <PlusOutlined /> Thêm địa chỉ mới
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 border flex flex-col justify-between shadow-sm transition-all ${
                          addr.isDefault
                            ? 'bg-[#fbf2ee] border-[#5d371f]'
                            : 'bg-white border-[#eae1dd] hover:border-[#5d371f]/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${
                                addr.isDefault
                                  ? 'bg-[#5d371f] text-white'
                                  : 'bg-[#f5ece8] text-[#51443d]'
                              }`}
                            >
                              {addr.isDefault ? 'Địa chỉ mặc định' : addr.tag}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {!addr.isDefault && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                  className="text-[11px] text-[#5d371f] hover:underline font-semibold cursor-pointer"
                                >
                                  Đặt mặc định
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="p-1 text-[#83746c] hover:text-red-600 transition-colors cursor-pointer"
                                title="Xóa địa chỉ"
                              >
                                <DeleteOutlined />
                              </button>
                            </div>
                          </div>

                          <h4 className="font-bold text-sm text-[#1f1b19]">{addr.title}</h4>
                          <p className="text-xs text-[#51443d] mt-1 leading-relaxed">
                            {addr.address}
                          </p>
                          <div className="mt-2.5 p-2 bg-white/80 border border-[#eae1dd] text-[11px] text-[#83746c] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-[#5d371f]">info</span>
                            <span>{addr.note}</span>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-[#eae1dd]/60 flex items-center justify-between font-data-mono text-xs text-[#83746c]">
                          <span>Người nhận: <strong>{addr.recipient}</strong></span>
                          <span>{addr.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* SECTION 3: Đơn Hàng Gần Nhất */}
                <section className="bg-white border border-[#eae1dd] p-6 sm:p-7 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#eae1dd]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-[#f5ece8] text-[#5d371f] flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[22px]">construction</span>
                      </div>
                      <div>
                        <h2 className="font-serif text-lg sm:text-xl font-bold text-[#5d371f]">
                          Đơn Hàng Gần Nhất
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Active Order Card */}
                  <div className="bg-[#fbf2ee] border border-[#eae1dd] p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#eae1dd]">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-data-mono font-bold text-sm text-[#5d371f]">
                            #MG-2024-89240
                          </span>
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-[#83746c] uppercase tracking-wider block">
                          Tổng giá trị hợp đồng may đo
                        </span>
                        <span className="font-serif text-lg font-bold text-[#5d371f] font-data-mono">
                          148.500.000₫
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 w-full sm:w-auto">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQRsgCBkXk2ENFvYz1MIvU_LUcCG4-zF_TKp8yQCWu2qEXucWTkueS1S9rYlrjYAVmEdiu9vVFawmJ5igwK_qHnmxyyKsofyqVlCXuNphzYECqgVniDeVda96x74jNeCfJ-TT1q3XRvC44hrCcfeviKISqf9x1ybDmzEVo-mO56aOxr--k0fKaPXeeIQ-Vl8f_ebRuZZp3AKyfwnZ3gOad9HgP40QyVwfe6DwrQNzZoeKtQDjz03yc"
                          alt="Sofa Kyoto"
                          className="w-16 h-16 object-cover border border-[#eae1dd] shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-[#1f1b19] truncate">
                            Sofa Gỗ Óc Chó Kyoto (3 chỗ) + Bàn Trà Nami
                          </h5>
                          <p className="text-[11px] text-[#51443d] mt-0.5">
                            Quy cách: Gỗ Walnut nhập khẩu hạng 1, hoàn thiện dầu thực vật hữu cơ Osmo Đức
                          </p>
                        </div>
                      </div>

                      <Link
                        href="/products/sofa-kyoto-01"
                        className="w-full sm:w-auto text-center px-4 py-2 bg-white hover:bg-[#5d371f] hover:text-white border border-[#eae1dd] text-[#5d371f] font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1"
                      >
                        Chi tiết sản phẩm <ArrowRightOutlined />
                      </Link>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#eae1dd]/60 flex items-center gap-2 text-xs text-[#51443d]">
                      <span className="material-symbols-outlined text-[#5d371f] text-[18px]">verified</span>
                      <span>Bảo hành kết cấu mộng gỗ 5 năm • Bảo trì lớp dầu dưỡng gỗ miễn phí định kỳ hàng năm</span>
                    </div>
                  </div>
                </section>

                {/* SECTION 4: Đổi Mật Khẩu & Bảo Mật */}
                <section id="section-doi-mat-khau" className="bg-white border border-[#eae1dd] p-6 sm:p-7 shadow-sm scroll-mt-24">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-[#eae1dd]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-[#f5ece8] text-[#5d371f] flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                      </div>
                      <div>
                        <h2 className="font-serif text-lg sm:text-xl font-bold text-[#5d371f]">
                          Đổi Mật Khẩu &amp; Bảo Mật Tài Khoản
                        </h2>
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleChangePassword();
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                          Mật khẩu hiện tại *
                        </label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="••••••••"
                          className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f] transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                          Mật khẩu mới *
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự..."
                          className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f] transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                          Xác nhận mật khẩu mới *
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới..."
                          className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#fbf2ee] border border-[#eae1dd] flex items-start gap-2.5 text-xs text-[#51443d]">
                      <span className="material-symbols-outlined text-[#5d371f] text-[18px] shrink-0 mt-0.5">
                        shield
                      </span>
                      <span>
                        <strong className="font-semibold text-[#1f1b19]">Lời khuyên bảo mật:</strong> Sử dụng mật khẩu kết hợp chữ in hoa, chữ thường, số và ký tự đặc biệt để bảo vệ tài khoản tốt nhất.
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#eae1dd] flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setOldPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="px-4 py-2 border border-[#eae1dd] text-[#51443d] hover:bg-[#f5ece8] font-semibold transition-colors cursor-pointer"
                      >
                        Làm lại
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#5d371f] hover:bg-[#784e34] text-white font-semibold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        <span>Cập Nhật Mật Khẩu</span>
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modal: Add New Address */}
      <Modal
        open={isAddAddressOpen}
        onCancel={() => setIsAddAddressOpen(false)}
        footer={null}
        width={500}
        centered
        styles={{
          body: {
            padding: '28px',
            backgroundColor: '#fff8f5',
          },
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="border-b border-[#eae1dd] pb-3">
            <h3 className="font-serif text-lg font-bold text-[#1f1b19]">
              Thêm Địa Chỉ Công Trình / Nhận Hàng
            </h3>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#1f1b19]">Tên gợi nhớ công trình *</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="VD: Căn hộ Duplex Thảo Điền, Biệt thự Ecopark..."
                className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#1f1b19]">Người nhận *</label>
                <input
                  type="text"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="Họ và tên..."
                  className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#1f1b19]">Số điện thoại *</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0918 345 678"
                  className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Province Select */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#1f1b19]">Tỉnh / Thành phố *</label>
                <select
                  value={newCity}
                  onChange={(e) => handleNewCityChange(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f] transition-colors cursor-pointer"
                >
                  <option value="">-- Chọn Tỉnh / Thành phố --</option>
                  {VIETNAM_PROVINCES.map((prov, idx) => (
                    <option key={`${prov.code}-${idx}`} value={prov.name}>
                      {prov.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Select */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#1f1b19]">Quận / Huyện *</label>
                  {!newCity && (
                    <span className="text-[10px] text-[#83746c] italic">(Chọn Tỉnh trước)</span>
                  )}
                </div>
                <select
                  value={newDistrict}
                  disabled={!newCity}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  className={`px-3.5 py-2.5 border border-[#eae1dd] font-medium transition-colors ${
                    !newCity
                      ? 'bg-[#f3ece8] text-[#a89b93] cursor-not-allowed opacity-80'
                      : 'bg-[#fbf2ee] text-[#1f1b19] focus:outline-none focus:border-[#5d371f] cursor-pointer'
                  }`}
                >
                  {!newCity ? (
                    <option value="">-- Chọn Tỉnh/Thành trước --</option>
                  ) : (
                    <>
                      <option value="">-- Chọn Quận / Huyện --</option>
                      {newDistricts.map((d, idx) => (
                        <option key={`${d.code}-${idx}`} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#1f1b19]">Địa chỉ chi tiết *</label>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Số nhà, tên đường, tòa tháp, căn hộ..."
                className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#1f1b19]">Lưu ý đặc thù vận chuyển</label>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="VD: Thang máy tải hàng 2.4m, hẹn bàn giao cuối tuần..."
                className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#eae1dd]">
            <button
              type="button"
              onClick={() => setIsAddAddressOpen(false)}
              className="px-4 py-2 border border-[#eae1dd] font-semibold text-xs text-[#51443d] hover:bg-[#f5ece8] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleAddAddress}
              className="px-5 py-2 bg-[#5d371f] hover:bg-[#784e34] text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Lưu Địa Chỉ
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Change Password */}
      <Modal
        open={isPasswordModalOpen}
        onCancel={() => setIsPasswordModalOpen(false)}
        footer={null}
        width={450}
        centered
        styles={{
          body: {
            padding: '28px',
            backgroundColor: '#fff8f5',
          },
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="border-b border-[#eae1dd] pb-3">
            <h3 className="font-serif text-lg font-bold text-[#1f1b19]">
              Đổi Mật Khẩu &amp; Bảo Mật
            </h3>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#1f1b19]">Mật khẩu hiện tại *</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#1f1b19]">Mật khẩu mới *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự..."
                className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#1f1b19]">Xác nhận mật khẩu mới *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#eae1dd]">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 border border-[#eae1dd] font-semibold text-xs text-[#51443d] hover:bg-[#f5ece8] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleChangePassword}
              className="px-5 py-2 bg-[#5d371f] hover:bg-[#784e34] text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Cập Nhật Mật Khẩu
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <App>
      <ProfilePageContent />
    </App>
  );
}
