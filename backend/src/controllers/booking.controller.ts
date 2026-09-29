import { Request, Response } from 'express';
import { BookingRequest } from '../types';

export const createBooking = (req: Request, res: Response) => {
  const body: BookingRequest = req.body;

  if (!body.fullName || !body.phone) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp họ tên và số điện thoại liên hệ.',
    });
  }

  const bookingId = `BK-${Date.now()}`;

  res.status(201).json({
    success: true,
    message: 'Đặt lịch tư vấn thành công. Chuyên viên D2 LUXURY sẽ liên hệ trong 15 phút.',
    data: {
      bookingId,
      ...body,
      createdAt: new Date().toISOString(),
    },
  });
};
