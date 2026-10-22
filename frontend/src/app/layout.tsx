import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import viVN from "antd/locale/vi_VN";
import "./globals.css";

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
import FloatingContactButtons from "@/components/FloatingContactButtons";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface font-sans text-on-surface antialiased selection:bg-primary-fixed-dim selection:text-on-primary-fixed overflow-x-hidden min-h-screen">
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
                fontSize: 14,
                fontFamily: "'Be Vietnam Pro', var(--font-be-vietnam-pro), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                colorBgBase: "#fff8f5",
                colorTextBase: "#1f1b19",
                borderRadius: 0,
                borderRadiusLG: 0,
                borderRadiusSM: 0,
                borderRadiusXS: 0,
              },
              components: {
                Button: {
                  colorPrimary: "#5d371f",
                  algorithm: true,
                  borderRadius: 0,
                },
                Card: {
                  headerFontSize: 16,
                  borderRadiusLG: 0,
                },
                Table: {
                  headerBg: "#f8fafc",
                  headerColor: "rgba(15, 23, 42, 0.9)",
                  fontSize: 13.5,
                  borderColor: "#e2e8f0",
                },
                Menu: {
                  fontSize: 14,
                },
                Tabs: {
                  itemActiveColor: "#5d371f",
                  itemHoverColor: "#784e34",
                  itemSelectedColor: "#5d371f",
                  inkBarColor: "#5d371f",
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
                  <SmoothScrollProvider>
                    {children}
                  </SmoothScrollProvider>
                  <FloatingContactButtons />
                </CartProvider>
              </AuthProvider>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
