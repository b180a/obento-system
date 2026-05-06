import "./globals.css";

export const metadata = {
  title: "obento",
  description: "学校向けお弁当注文システム",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
