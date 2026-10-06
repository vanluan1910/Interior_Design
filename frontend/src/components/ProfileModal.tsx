'use client';

import React, { useState, useEffect } from 'react';
import { Modal, App } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  CrownOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  onGoToAdmin?: () => void;
}

export default function ProfileModal({ open, onClose, onGoToAdmin }: ProfileModalProps) {
  const { message } = App.useApp();
  const { user, isAdmin, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setBio(user.bio || '');
    }
  }, [user, open]);

  const handleSave = () => {
    if (!name.trim()) {
      message.warning('Họ và tên không được để trống.');
      return;
    }
    updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      bio: bio.trim(),
    });
    setIsEditing(false);
    message.success('Đã cập nhật thông tin cá nhân thành công!');
  };

  if (!user) return null;

  return (
    <Modal
      open={open}
      onCancel={() => {
        setIsEditing(false);
        onClose();
      }}
      footer={null}
      width={580}
      centered
      styles={{
        body: {
          padding: '0',
          backgroundColor: '#fff8f5',
          borderRadius: '0px',
        },
      }}
    >
      <div className="flex flex-col">
        {/* Modal Top Header Banner */}
        <div className="bg-[#241c18] text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5d371f]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover ring-2 ring-[#d5c3ba] shadow-md"
                />
                {isAdmin ? (
                  <span className="absolute -bottom-1.5 -right-1.5 bg-[#5d371f] text-white text-[10px] font-bold px-1.5 py-0.5 border border-[#fff8f5] shadow-sm flex items-center gap-0.5">
                    <CrownOutlined className="text-[10px] text-[#ffdbb5]" /> Admin
                  </span>
                ) : (
                  <span className="absolute -bottom-1.5 -right-1.5 bg-[#3f4332] text-white text-[10px] font-bold px-1.5 py-0.5 border border-[#fff8f5] shadow-sm">
                    VIP
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#fff8f5]">
                    {user.name}
                  </h3>
                </div>
                <span className="text-xs text-[#d5c3ba] font-data-mono mt-0.5">
                  {user.email}
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] bg-[#5d371f]/60 text-[#ffdbb5] px-2 py-0.5 font-medium border border-[#5d371f]">
                    <SafetyCertificateOutlined /> {isAdmin ? 'Quản trị viên Cấp cao' : 'Thành viên Thượng lưu'}
                  </span>
                  <span className="text-[11px] text-[#a89b93] font-data-mono">
                    Gia nhập: {user.joinDate || '2024'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              type="button"
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              {isEditing ? (
                <>
                  <CloseOutlined className="text-xs" /> Hủy
                </>
              ) : (
                <>
                  <EditOutlined className="text-xs" /> Chỉnh sửa
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 sm:p-7 flex flex-col gap-5">
          {isEditing ? (
            /* Editing Form */
            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#1f1b19] flex items-center gap-1.5">
                  <UserOutlined className="text-[#5d371f]" /> Họ &amp; Tên
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f]"
                  placeholder="Nhập họ và tên..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#1f1b19] flex items-center gap-1.5">
                  <PhoneOutlined className="text-[#5d371f]" /> Số điện thoại
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f]"
                  placeholder="Nhập số điện thoại..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#1f1b19] flex items-center gap-1.5">
                  <HomeOutlined className="text-[#5d371f]" /> Địa chỉ công tác / Nhà riêng
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f]"
                  placeholder="Nhập địa chỉ..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#1f1b19]">
                  Giới thiệu / Ghi chú đặc quyền
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="px-3.5 py-2 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f]"
                  placeholder="Đôi dòng giới thiệu..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#eae1dd]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-[#eae1dd] text-[#51443d] font-semibold hover:bg-[#f5ece8] cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 bg-[#5d371f] text-white font-semibold hover:bg-[#784e34] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <CheckOutlined /> Lưu thay đổi
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-white border border-[#eae1dd] p-3.5 flex flex-col gap-1">
                  <span className="text-[11px] text-[#83746c] flex items-center gap-1">
                    <PhoneOutlined className="text-[#5d371f]" /> Số điện thoại liên hệ
                  </span>
                  <p className="font-semibold text-sm text-[#1f1b19] font-data-mono">
                    {user.phone || 'Chưa cập nhật'}
                  </p>
                </div>

                <div className="bg-white border border-[#eae1dd] p-3.5 flex flex-col gap-1">
                  <span className="text-[11px] text-[#83746c] flex items-center gap-1">
                    <MailOutlined className="text-[#5d371f]" /> Email xác thực
                  </span>
                  <p className="font-semibold text-sm text-[#1f1b19] font-data-mono truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#eae1dd] p-3.5 flex flex-col gap-1">
                <span className="text-[11px] text-[#83746c] flex items-center gap-1">
                  <HomeOutlined className="text-[#5d371f]" /> Địa chỉ giao nhận mặc định
                </span>
                <p className="font-semibold text-xs text-[#1f1b19] leading-relaxed">
                  {user.address || 'Chưa thiết lập địa chỉ'}
                </p>
              </div>

              {user.bio && (
                <div className="bg-[#fbf2ee] border border-[#eae1dd] p-3.5 flex flex-col gap-1">
                  <span className="text-[11px] text-[#83746c] font-medium">Ghi chú cá nhân</span>
                  <p className="text-xs text-[#51443d] leading-relaxed italic">
                    &ldquo;{user.bio}&rdquo;
                  </p>
                </div>
              )}

              {/* Quick Actions if Admin */}
              {isAdmin && (
                <div className="mt-1 p-4 bg-[#f5ece8] border border-[#eae1dd] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#5d371f]">Bạn có quyền Quản trị tối cao</h4>
                    <p className="text-[11px] text-[#83746c]">Truy cập hệ thống quản lý đơn hàng &amp; danh mục D2 LUXURY</p>
                  </div>
                  {onGoToAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onGoToAdmin();
                      }}
                      className="px-3.5 py-1.5 bg-[#5d371f] hover:bg-[#784e34] text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      Mở Trang Quản Trị →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
