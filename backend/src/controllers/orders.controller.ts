import { Request, Response } from 'express';
import { OrderRequest } from '../types';

export const createOrder = (req: Request, res: Response) => {
  const body: OrderRequest = req.body;

  if (!body.customerName || !body.phone || !body.items || body.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Thông tin đơn hàng không hợp lệ.',
    });
  }

  const orderId = `ORD-${Date.now()}`;

  res.status(201).json({
    success: true,
    message: 'Đặt hàng tư vấn thành công! Nhân viên chăm sóc sẽ hỗ trợ bạn ngay.',
    data: {
      orderId,
      ...body,
      status: 'pending_confirmation',
      createdAt: new Date().toISOString(),
    },
  });
};
