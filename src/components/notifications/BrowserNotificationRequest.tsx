"use client";

import { useEffect } from 'react';

export default function BrowserNotificationRequest() {
  useEffect(() => {
    // Meminta izin notifikasi browser jika didukung dan belum ditanyakan
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        // Tunda 5 detik agar tidak mengganggu saat pertama kali halaman dimuat
        const timer = setTimeout(() => {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              console.log('Browser notification permission granted.');
              // Di masa depan, di sini Anda mendaftarkan ServiceWorker Push Manager
            }
          });
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  return null; // Komponen ini berjalan di background, tidak merender UI tambahan
}
