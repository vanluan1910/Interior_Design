import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import viVN from "antd/locale/vi_VN";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "D2 LUXURY DESIGN | Nội Thất Gỗ Tự Nhiên Cao Cấp",
  description: "Nội thất gỗ tự nhiên cao cấp phong cách Japandi & Wabi-Sabi. 100% gỗ sồi & óc chó Bắc Mỹ tuyển chọn từ rừng canh tác bền vững FSC.",
  keywords: ["nội thất gỗ", "D2 Luxury Design", "Mộc Gia", "gỗ óc chó", "gỗ sồi", "Japandi", "Wabi-Sabi", "artisan woodcraft"],
  authors: [{ name: "D2 Luxury Design" }],
  openGraph: {
    title: "D2 LUXURY DESIGN | Nội Thất Gỗ Tự Nhiên Cao Cấp",
    description: "Nội thất gỗ tự nhiên cao cấp phong cách Japandi & Wabi-Sabi.",
    url: "https://d2luxury.vn",
    siteName: "D2 Luxury Design",
    locale: "vi_VN",
    type: "website",
  },
};

import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface font-sans text-on-surface antialiased selection:bg-primary-fixed-dim selection:text-on-primary-fixed">
        <AntdRegistry>
          <ConfigProvider
            locale={viVN}
            theme={{
              token: {
                colorPrimary: "#5d371f",
                colorLink: "#5d371f",
                colorLinkHover: "#784e34",
                colorSuccess: "#3f4332",
                colorWarning: "#c5a880",
                colorError: "#ba1a1a",
                borderRadius: 0,
                fontFamily: "var(--font-be-vietnam-pro), 'Be Vietnam Pro', sans-serif",
                colorBgBase: "#fff8f5",
                colorTextBase: "#1f1b19",
              },
              components: {
                Button: {
                  colorPrimary: "#5d371f",
                  algorithm: true,
                  borderRadius: 0,
                },
                Modal: {
                  borderRadiusLG: 0,
                  contentBg: "#fff8f5",
                  headerBg: "#fff8f5",
                },
                Drawer: {
                  colorBgElevated: "#fff8f5",
                },
                Slider: {
                  colorPrimary: "#5d371f",
                  colorPrimaryBorder: "#784e34",
                  dotActiveBorderColor: "#5d371f",
                },
                Checkbox: {
                  colorPrimary: "#5d371f",
                  borderRadiusSM: 0,
                },
                Select: {
                  borderRadius: 0,
                },
                Input: {
                  borderRadius: 0,
                },
                DatePicker: {
                  borderRadius: 0,
                },
                Radio: {
                  borderRadius: 0,
                },
                Tag: {
                  borderRadiusSM: 0,
                },
              },
            }}
          >
            <App>
              <AuthProvider>
                <CartProvider>
                  {children}
                </CartProvider>
              </AuthProvider>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
