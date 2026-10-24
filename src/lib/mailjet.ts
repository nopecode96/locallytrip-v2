import Mailjet from 'node-mailjet';

export interface MailjetSendResult {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  mock?: boolean;
  message?: string;
}

export interface MailjetSendOptions {
  siteUrl?: string;
  forceMock?: boolean;
  sandboxMode?: boolean;
}

export interface TransactionEmailDetails {
  currency?: string;
  experienceTitle?: string;
  paymentMethod?: string;
  bookingDate?: string;
  siteUrl?: string;
  forceMock?: boolean;
  sandboxMode?: boolean;
}

/**
 * Helper to obtain the absolute base URL for email assets & deep links.
 * Prioritizes NEXT_PUBLIC_APP_URL, then NEXT_PUBLIC_SITE_URL, with local fallback.
 */
function getAbsoluteBaseUrl(overrideUrl?: string): string {
  const url =
    overrideUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3001';
  return url.replace(/\/$/, '');
}

/**
 * Mendapatkan instance client Mailjet menggunakan environment variables.
 * Mengembalikan null jika kredensial belum dikonfigurasi atau masih placeholder.
 */
export function getMailjetClient() {
  const apiKey = process.env.MAILJET_API_KEY || '';
  const apiSecret = process.env.MAILJET_SECRET_KEY || '';

  if (
    !apiKey ||
    !apiSecret ||
    apiKey === 'your_mailjet_api_key_here' ||
    apiSecret === 'your_mailjet_secret_key_here'
  ) {
    return null;
  }

  return Mailjet.apiConnect(apiKey, apiSecret);
}

/**
 * 1. Template HTML Responsif & Dwibahasa (Bilingual: English + Indonesian)
 *    untuk Email Verifikasi / OTP Registrasi Akun
 */
export function generateVerificationHtml(
  toName: string,
  token: string,
  siteUrl?: string
): string {
  const safeName = toName || 'Traveler';
  const baseUrl = getAbsoluteBaseUrl(siteUrl);
  const verifyUrlEn = `${baseUrl}/en/auth/verify?token=${encodeURIComponent(token)}`;
  const verifyUrlId = `${baseUrl}/id/auth/verify?token=${encodeURIComponent(token)}`;
  const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || baseUrl}/images/logo.png`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Locallytrip Account / Verifikasi Akun Locallytrip Anda</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 32px 12px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .brand-header { padding: 32px 24px 20px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #f1f5f9; }
    .brand-logo { max-width: 170px; height: auto; display: block; margin: 0 auto; }
    .content { padding: 36px 32px; }
    .lang-badge { display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0d9488; background-color: #ccfbf1; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; }
    .greeting { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 12px; line-height: 1.3; }
    .body-text { font-size: 14.5px; line-height: 1.65; color: #475569; margin-bottom: 20px; }
    .otp-card { background: #f5f3ff; border: 2px dashed #8b5cf6; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #6d28d9; margin-bottom: 6px; }
    .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #5b21b6; font-family: 'Courier New', Courier, monospace; margin: 0; }
    .cta-container { text-align: center; margin: 24px 0; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #7c3aed 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3); }
    .airdrop-card { background: #fefce8; border: 1px solid #fde047; border-radius: 12px; padding: 14px 18px; margin: 20px 0; }
    .airdrop-text { font-size: 13px; color: #854d0e; margin: 0; line-height: 1.5; }
    .section-divider { border: 0; border-top: 2px dashed #cbd5e1; margin: 40px 0; }
    .disclaimer { font-size: 12px; color: #94a3b8; line-height: 1.6; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
    .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.6; }
    .footer a { color: #0d9488; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Platform Logo Header -->
      <div class="brand-header">
        <img src="${logoUrl}" alt="Locallytrip Logo" class="brand-logo" width="170" />
      </div>

      <div class="content">
        <!-- ==================== 1. ENGLISH SECTION ==================== -->
        <div>
          <span class="lang-badge">English Version</span>
          <div class="greeting">Welcome to Locallytrip, ${safeName}! 👋</div>
          <p class="body-text">
            Thank you for signing up for <strong>Locallytrip</strong>, where travelers connect with verified local hosts worldwide.
            Please verify your email address to secure your account and instantly unlock your <strong>Welcome Reward (+1,000 LTP Credits & +500 XP)</strong>.
          </p>

          <div class="otp-card">
            <div class="otp-label">One-Time Verification Code (OTP)</div>
            <div class="otp-code">${token}</div>
          </div>

          <div class="cta-container">
            <a href="${verifyUrlEn}" class="cta-btn">Verify My Account</a>
          </div>

          <div class="airdrop-card">
            <p class="airdrop-text">
              🎁 <strong>Starter Perk:</strong> Once verified, your wallet is automatically credited with <strong>1,000 LTP Credits & 500 XP</strong> for exclusive travel discounts and brand perks!
            </p>
          </div>

          <p style="font-size: 12px; color: #94a3b8; margin: 12px 0 0;">
            This verification code is valid for <strong>15 minutes</strong>. If you did not create this account, please disregard this email.
          </p>
        </div>

        <!-- ==================== HORIZONTAL DIVIDER ==================== -->
        <hr class="section-divider" />

        <!-- ==================== 2. INDONESIAN SECTION ==================== -->
        <div>
          <span class="lang-badge" style="color: #7c3aed; background-color: #ede9fe;">Versi Bahasa Indonesia</span>
          <div class="greeting">Halo, ${safeName}! Selamat Datang di Locallytrip! 👋</div>
          <p class="body-text">
            Terima kasih telah bergabung di <strong>Locallytrip</strong>, platform penjelajahan bersama local host terpercaya.
            Silakan verifikasi email Anda untuk mengamankan akun dan langsung mengklaim <strong>Welcome Reward (+1.000 Kredit LTP & +500 XP)</strong>.
          </p>

          <div class="otp-card">
            <div class="otp-label">Kode Verifikasi Satu Kali (OTP)</div>
            <div class="otp-code">${token}</div>
          </div>

          <div class="cta-container">
            <a href="${verifyUrlId}" class="cta-btn">Verifikasi Akun Saya</a>
          </div>

          <div class="airdrop-card">
            <p class="airdrop-text">
              🎁 <strong>Bonus Pemula:</strong> Setelah diverifikasi, dompet Anda otomatis menerima <strong>1.000 Kredit LTP & 500 XP</strong> untuk diskon tur dan voucher mitra brand!
            </p>
          </div>

          <p style="font-size: 12px; color: #94a3b8; margin: 12px 0 0;">
            Kode verifikasi ini berlaku selama <strong>15 menit</strong>. Jangan bagikan kode ini kepada siapa pun demi keamanan akun Anda.
          </p>
        </div>

        <div class="disclaimer">
          🔒 <strong>Security Notice / Pemberitahuan Keamanan:</strong> Locallytrip will never ask for your password via email. / Tim Locallytrip tidak akan pernah meminta kata sandi Anda melalui email.
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 6px;">© 2026 Locallytrip Platform. Connecting travelers with authentic local experiences.</p>
        <p style="margin: 0;">Need assistance? / Butuh bantuan? <a href="mailto:support@locallytrip.com">support@locallytrip.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 2. Template HTML Responsif & Dwibahasa (Bilingual: English + Indonesian)
 *    untuk Email Sambutan Komunitas & Airdrop (Welcome Email)
 */
export function generateWelcomeHtml(
  toName: string,
  siteUrl?: string
): string {
  const safeName = toName || 'Traveler';
  const baseUrl = getAbsoluteBaseUrl(siteUrl);
  const perksUrlEn = `${baseUrl}/en/community/perks`;
  const perksUrlId = `${baseUrl}/id/community/perks`;
  const exploreUrlEn = `${baseUrl}/en/experiences`;
  const exploreUrlId = `${baseUrl}/id/experiences`;
  const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || baseUrl}/images/logo.png`;
  const heroBannerUrl = `${process.env.NEXT_PUBLIC_APP_URL || baseUrl}/images/rewards/hero-earning-traveler.png`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Locallytrip! 🎒 Unlock Your First Airdrop & Perks!</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 32px 12px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .brand-header { padding: 28px 24px 16px; text-align: center; background-color: #ffffff; }
    .brand-logo { max-width: 170px; height: auto; display: block; margin: 0 auto; }
    .hero-banner { width: 100%; max-width: 536px; height: auto; border-radius: 16px; display: block; margin: 0 auto 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .content { padding: 32px; }
    .lang-badge { display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0d9488; background-color: #ccfbf1; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; }
    .greeting { font-size: 21px; font-weight: 800; color: #0f172a; margin-bottom: 12px; line-height: 1.3; }
    .body-text { font-size: 14.5px; line-height: 1.65; color: #475569; margin-bottom: 20px; }
    .airdrop-banner { background: linear-gradient(135deg, #fefce8 0%, #fef08a 100%); border: 2px solid #fde047; border-radius: 16px; padding: 20px; margin: 20px 0; text-align: center; }
    .airdrop-badge { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #854d0e; }
    .airdrop-value { font-size: 28px; font-weight: 900; color: #713f12; margin: 6px 0; }
    .airdrop-note { font-size: 13px; color: #854d0e; margin: 0; line-height: 1.5; }
    .feature-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin: 16px 0; }
    .feature-title { font-size: 14.5px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    .feature-text { font-size: 13px; color: #64748b; line-height: 1.6; margin: 0; }
    .cta-container { text-align: center; margin: 24px 0; }
    .cta-btn-primary { display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #7c3aed 100%); color: #ffffff !important; text-decoration: none; padding: 14px 30px; border-radius: 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.3px; margin: 4px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.28); }
    .cta-btn-secondary { display: inline-block; background: #ffffff; color: #0d9488 !important; text-decoration: none; padding: 13px 26px; border-radius: 12px; font-size: 14px; font-weight: 700; border: 1.5px solid #0d9488; margin: 4px; }
    .section-divider { border: 0; border-top: 2px dashed #cbd5e1; margin: 40px 0; }
    .quote-box { border-left: 4px solid #0d9488; padding-left: 14px; margin: 20px 0; font-style: italic; color: #64748b; font-size: 13px; line-height: 1.6; }
    .signature { margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 13.5px; color: #334155; }
    .signature-name { font-weight: 800; color: #0f172a; margin-top: 4px; }
    .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.6; }
    .footer a { color: #0d9488; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Platform Logo Header -->
      <div class="brand-header">
        <img src="${logoUrl}" alt="Locallytrip Logo" class="brand-logo" width="170" />
      </div>

      <!-- Welcoming Hero Banner -->
      <div style="padding: 0 32px;">
        <img src="${heroBannerUrl}" alt="Welcome to Locallytrip Community" class="hero-banner" width="536" />
      </div>

      <div class="content">
        <!-- ==================== 1. ENGLISH SECTION ==================== -->
        <div>
          <span class="lang-badge">English Version</span>
          <div class="greeting">Welcome to Locallytrip, ${safeName}! 🎒✨</div>
          <p class="body-text">
            Your email has been officially verified! We are delighted to welcome you into our global community of passionate travelers and dedicated local hosts.
          </p>

          <div class="airdrop-banner">
            <div class="airdrop-badge">🎁 Welcome Reward Unlocked</div>
            <div class="airdrop-value">+1,000 LTP Credits & +500 XP</div>
            <p class="airdrop-note">
              Credited directly to your Rewards Wallet. Spend your credits on local tour bookings and exclusive brand discounts!
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-title">🎟️ Travel Perks Marketplace</div>
            <p class="feature-text">
              Redeem your LTP Credits for glamping vouchers, dining discounts, and top outdoor gear offers (like EIGER) from our partner brands.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-title">🧭 Authentic Local Experiences & Meetups</div>
            <p class="feature-text">
              Immerse yourself in authentic city tours led by passionate locals, or join fellow backpackers at weekly <strong>Community Meetups</strong>.
            </p>
          </div>

          <div class="cta-container">
            <a href="${perksUrlEn}" class="cta-btn-primary">Explore Travel Perks ➔</a>
            <a href="${exploreUrlEn}" class="cta-btn-secondary">Discover Tours</a>
          </div>

          <div class="quote-box">
            "Travel is not just about visiting new places, but connecting deeply with authentic local cultures and people."
          </div>
        </div>

        <!-- ==================== HORIZONTAL DIVIDER ==================== -->
        <hr class="section-divider" />

        <!-- ==================== 2. INDONESIAN SECTION ==================== -->
        <div>
          <span class="lang-badge" style="color: #7c3aed; background-color: #ede9fe;">Versi Bahasa Indonesia</span>
          <div class="greeting">Halo, ${safeName}! Selamat Datang di Komunitas Locallytrip! 🎒✨</div>
          <p class="body-text">
            Email Anda telah berhasil diverifikasi! Kami sangat gembira menyambut Anda menjadi bagian dari keluarga besar penjelajah dan local host autentik di Locallytrip.
          </p>

          <div class="airdrop-banner">
            <div class="airdrop-badge">🎁 Welcome Reward Terbuka</div>
            <div class="airdrop-value">+1.000 Kredit LTP & +500 XP</div>
            <p class="airdrop-note">
              Saldo reward telah otomatis masuk ke Dompet Hadiah Anda. Gunakan untuk diskon tur dan penukaran voucher mitra!
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-title">🎟️ Katalog Hadiah Travel Perks Marketplace</div>
            <p class="feature-text">
              Tukarkan koin LTP Anda untuk voucher staycation glamping, diskon perlengkapan outdoor EIGER, serta voucher kuliner pilihan dari jaringan mitra brand kami.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-title">🧭 Cerita Lokal & Teman Jalan Baru</div>
            <p class="feature-text">
              Ikuti tur hidden gems yang dipandu langsung oleh local host berdedikasi atau buat agenda jalan bareng di <strong>Community Meetups</strong>.
            </p>
          </div>

          <div class="cta-container">
            <a href="${perksUrlId}" class="cta-btn-primary">Jelajahi Hadiah Perks ➔</a>
            <a href="${exploreUrlId}" class="cta-btn-secondary">Eksplorasi Tur Lokal</a>
          </div>

          <div class="quote-box">
            "Perjalanan terbaik bukan tentang seberapa jauh kita melangkah, melainkan seberapa dalam kita terhubung dengan kearifan masyarakat lokal."
          </div>
        </div>

        <div class="signature">
          Warm regards & happy exploring, / Salam hangat & selamat berpetualang,<br>
          <div class="signature-name">Nope & Locallytrip Community Team</div>
          <span style="font-size: 12px; color: #94a3b8;"><a href="mailto:hello@locallytrip.com" style="color: #0d9488; text-decoration: none;">hello@locallytrip.com</a></span>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 6px;">© 2026 Locallytrip Platform. Menghubungkan traveler dengan kearifan lokal dunia.</p>
        <p style="margin: 0;">Have meetup ideas or partnership questions? / Punya ide kolaborasi? <a href="mailto:hello@locallytrip.com">hello@locallytrip.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 3. Template HTML Responsif & Dwibahasa (Bilingual: English + Indonesian)
 *    untuk Email Konfirmasi Transaksi / Pembayaran Berhasil
 */
export function generateTransactionHtml(
  toName: string,
  transactionId: string,
  amount: number | string,
  details: TransactionEmailDetails = {}
): string {
  const safeName = toName || 'Traveler';
  const baseUrl = getAbsoluteBaseUrl(details.siteUrl);
  const currency = details.currency || 'USD';
  const experienceTitle = details.experienceTitle || 'Authentic Local Tour Experience';
  const paymentMethod = details.paymentMethod || 'Online Payment Gateway';
  const bookingDate = details.bookingDate || new Date().toLocaleDateString('en-US', { dateStyle: 'long' });
  const dashboardUrlEn = `${baseUrl}/en/dashboard?tab=my-trips`;
  const dashboardUrlId = `${baseUrl}/id/dashboard?tab=my-trips`;
  const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || baseUrl}/images/logo.png`;

  const formattedAmount =
    typeof amount === 'number'
      ? `${currency} ${amount.toLocaleString('en-US')}`
      : `${currency} ${amount}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Locallytrip Transaction Confirmation: ${transactionId} ✅</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 32px 12px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .brand-header { padding: 28px 24px 16px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #f1f5f9; }
    .brand-logo { max-width: 170px; height: auto; display: block; margin: 0 auto; }
    .status-banner { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 24px 32px; text-align: center; color: #ffffff; }
    .status-icon { display: inline-block; background: rgba(255,255,255,0.22); width: 44px; height: 44px; line-height: 44px; border-radius: 50%; font-size: 22px; margin-bottom: 8px; }
    .status-title { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.3px; }
    .status-sub { margin: 4px 0 0; font-size: 13.5px; opacity: 0.95; }
    .content { padding: 32px; }
    .lang-badge { display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #059669; background-color: #d1fae5; padding: 4px 10px; border-radius: 9999px; margin-bottom: 14px; }
    .greeting { font-size: 19px; font-weight: 800; color: #0f172a; margin-bottom: 10px; line-height: 1.3; }
    .body-text { font-size: 14.5px; line-height: 1.65; color: #475569; margin-bottom: 20px; }
    .receipt-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 20px 0; }
    .receipt-header { font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    .receipt-table { width: 100%; border-collapse: collapse; }
    .receipt-table td { padding: 6px 0; font-size: 13.5px; }
    .label-col { color: #64748b; font-weight: 500; }
    .value-col { text-align: right; color: #0f172a; font-weight: 600; }
    .paid-badge { display: inline-block; background-color: #d1fae5; color: #065f46; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 9999px; }
    .total-row { border-top: 2px dashed #cbd5e1; }
    .total-row td { padding-top: 12px; font-weight: 800; }
    .total-label { color: #1e293b; font-size: 15px; }
    .total-amount { color: #059669; font-size: 18px; text-align: right; }
    .cta-container { text-align: center; margin: 24px 0; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.28); }
    .section-divider { border: 0; border-top: 2px dashed #cbd5e1; margin: 40px 0; }
    .info-card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #1e40af; line-height: 1.5; }
    .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.6; }
    .footer a { color: #059669; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Platform Logo Header -->
      <div class="brand-header">
        <img src="${logoUrl}" alt="Locallytrip Logo" class="brand-logo" width="170" />
      </div>

      <!-- Payment Status Header -->
      <div class="status-banner">
        <div class="status-icon">✓</div>
        <div class="status-title">Payment Confirmed! / Pembayaran Berhasil!</div>
        <div class="status-sub">Your adventure ticket is officially secured.</div>
      </div>

      <div class="content">
        <!-- ==================== 1. ENGLISH SECTION ==================== -->
        <div>
          <span class="lang-badge">English Version</span>
          <div class="greeting">Hello, ${safeName}! 🎉</div>
          <p class="body-text">
            Thank you for booking with <strong>Locallytrip</strong>! We have received your payment, and your reservation is now officially confirmed. Here is your transaction receipt:
          </p>

          <div class="receipt-box">
            <div class="receipt-header">Official Transaction Receipt</div>
            <table class="receipt-table">
              <tr>
                <td class="label-col">Order Reference / ID:</td>
                <td class="value-col" style="font-family: monospace;">#${transactionId}</td>
              </tr>
              <tr>
                <td class="label-col">Experience / Tour:</td>
                <td class="value-col">${experienceTitle}</td>
              </tr>
              <tr>
                <td class="label-col">Booking Date:</td>
                <td class="value-col">${bookingDate}</td>
              </tr>
              <tr>
                <td class="label-col">Payment Method:</td>
                <td class="value-col">${paymentMethod}</td>
              </tr>
              <tr>
                <td class="label-col">Payment Status:</td>
                <td class="value-col"><span class="paid-badge">PAID / CONFIRMED</span></td>
              </tr>
              <tr class="total-row">
                <td class="total-label">Total Amount Paid:</td>
                <td class="total-amount">${formattedAmount}</td>
              </tr>
            </table>
          </div>

          <div class="cta-container">
            <a href="${dashboardUrlEn}" class="cta-btn">View Order Details</a>
          </div>

          <div class="info-card">
            💡 <strong>Travel Tip:</strong> You can contact your Local Host directly and view meetup point instructions inside your Locallytrip Dashboard under <em>My Trips</em>.
          </div>
        </div>

        <!-- ==================== HORIZONTAL DIVIDER ==================== -->
        <hr class="section-divider" />

        <!-- ==================== 2. INDONESIAN SECTION ==================== -->
        <div>
          <span class="lang-badge" style="color: #0d9488; background-color: #ccfbf1;">Versi Bahasa Indonesia</span>
          <div class="greeting">Halo, ${safeName}! 🎉</div>
          <p class="body-text">
            Terima kasih telah memesan melalui <strong>Locallytrip</strong>! Kami telah berhasil menerima pembayaran Anda, dan reservasi tur Anda kini telah resmi terkonfirmasi. Berikut tanda terima transaksi Anda:
          </p>

          <div class="receipt-box">
            <div class="receipt-header">Rincian Transaksi Resmi</div>
            <table class="receipt-table">
              <tr>
                <td class="label-col">No. Referensi Pesanan:</td>
                <td class="value-col" style="font-family: monospace;">#${transactionId}</td>
              </tr>
              <tr>
                <td class="label-col">Pengalaman Tur:</td>
                <td class="value-col">${experienceTitle}</td>
              </tr>
              <tr>
                <td class="label-col">Tanggal Pemesanan:</td>
                <td class="value-col">${bookingDate}</td>
              </tr>
              <tr>
                <td class="label-col">Metode Pembayaran:</td>
                <td class="value-col">${paymentMethod}</td>
              </tr>
              <tr>
                <td class="label-col">Status Pembayaran:</td>
                <td class="value-col"><span class="paid-badge">LUNAS / CONFIRMED</span></td>
              </tr>
              <tr class="total-row">
                <td class="total-label">Total Terbayar:</td>
                <td class="total-amount">${formattedAmount}</td>
              </tr>
            </table>
          </div>

          <div class="cta-container">
            <a href="${dashboardUrlId}" class="cta-btn">Lihat Detail Pesanan</a>
          </div>

          <div class="info-card">
            💡 <strong>Tips Perjalanan:</strong> Anda dapat berkomunikasi langsung dengan Local Host dan melihat panduan titik temu di menu <em>Tiket & Perjalanan Saya</em> pada dashboard.
          </div>
        </div>

        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
          Please retain this email as your official proof of payment. / Simpan email ini sebagai tanda bukti pembayaran transaksi resmi Locallytrip.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 6px;">© 2026 Locallytrip Platform. Seluruh hak cipta dilindungi.</p>
        <p style="margin: 0;">Questions about your booking? / Pertanyaan seputar pesanan? <a href="mailto:support@locallytrip.com">support@locallytrip.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Mengirim Email Verifikasi Registrasi / OTP via Mailjet API v3.1
 * Menggunakan template dwibahasa (Bilingual) berstandar UI tinggi.
 */
export async function sendVerificationEmail(
  toEmail: string,
  toName: string,
  token: string,
  options: MailjetSendOptions = {}
): Promise<MailjetSendResult> {
  const senderEmail = process.env.MAILJET_SENDER_EMAIL || 'noreply@locallytrip.com';
  const senderName = 'Locallytrip Support';
  const client = getMailjetClient();

  if (!client || options.forceMock) {
    console.log(`[Mailjet:Mock] sendVerificationEmail to "${toEmail}" (${toName}) with token: ${token}`);
    return {
      success: true,
      status: 200,
      mock: true,
      message: 'Email verifikasi berhasil dikirim (Mock Mode: Kredensial Mailjet belum aktif/uji coba).',
      data: {
        toEmail,
        toName,
        token,
        timestamp: new Date().toISOString(),
      },
    };
  }

  try {
    const htmlPart = generateVerificationHtml(toName, token, options.siteUrl);
    const textPart = `Welcome to Locallytrip / Selamat datang di Locallytrip, ${toName || 'Traveler'}!\n\nYour Verification Code (OTP) / Kode Verifikasi Anda: ${token}\n\nVerify online / Verifikasi online: ${getAbsoluteBaseUrl(options.siteUrl)}/en/auth/verify?token=${token}\n\nSalam / Regards,\nLocallytrip Team`;

    const requestPayload: any = {
      Messages: [
        {
          From: {
            Email: senderEmail,
            Name: senderName,
          },
          To: [
            {
              Email: toEmail,
              Name: toName || toEmail,
            },
          ],
          Subject: 'Verify Your Locallytrip Account / Verifikasi Akun Locallytrip Anda 🔒',
          TextPart: textPart,
          HTMLPart: htmlPart,
        },
      ],
    };

    if (options.sandboxMode) {
      requestPayload.SandboxMode = true;
    }

    const response: any = await client.post('send', { version: 'v3.1' }).request(requestPayload);

    return {
      success: true,
      status: response?.status || response?.response?.status || 200,
      data: response?.body,
    };
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    const errorMessage = error.message || 'Gagal mengirim email verifikasi via Mailjet.';

    console.error(`[Mailjet:Error] Gagal mengirim email ke ${toEmail} [Status ${statusCode}]:`, errorMessage);

    return {
      success: false,
      status: statusCode,
      error: errorMessage,
    };
  }
}

/**
 * Mengirim Email Sambutan Komunitas (Welcome Email) via Mailjet API v3.1
 * Menggunakan MAILJET_CAMPAIGN_EMAIL sebagai pengirim dan template dwibahasa (Bilingual).
 */
export async function sendWelcomeEmail(
  toEmail: string,
  toName: string,
  options: MailjetSendOptions = {}
): Promise<MailjetSendResult> {
  const campaignEmail = process.env.MAILJET_CAMPAIGN_EMAIL || 'hello@locallytrip.com';
  const campaignName = process.env.MAILJET_CAMPAIGN_NAME || 'Nope & Tim Locallytrip';
  const client = getMailjetClient();

  if (!client || options.forceMock) {
    console.log(`[Mailjet:Mock] sendWelcomeEmail to "${toEmail}" (${toName}) via campaign sender: ${campaignEmail}`);
    return {
      success: true,
      status: 200,
      mock: true,
      message: 'Email sambutan komunitas berhasil dikirim (Mock Mode: Kredensial Mailjet belum aktif/uji coba).',
      data: {
        toEmail,
        toName,
        senderEmail: campaignEmail,
        senderName: campaignName,
        timestamp: new Date().toISOString(),
      },
    };
  }

  try {
    const htmlPart = generateWelcomeHtml(toName, options.siteUrl);
    const baseUrl = getAbsoluteBaseUrl(options.siteUrl);
    const textPart = `Welcome to Locallytrip! / Selamat datang di Locallytrip, ${toName || 'Traveler'}!\n\nYour email has been verified and you have unlocked +1,000 LTP Coins & +500 XP Welcome Airdrop!\n\nExplore Travel Perks: ${baseUrl}/en/community/perks\nJelajahi Hadiah Perks: ${baseUrl}/id/community/perks\n\nWarm regards / Salam hangat,\n${campaignName}\n${campaignEmail}`;

    const requestPayload: any = {
      Messages: [
        {
          From: {
            Email: campaignEmail,
            Name: campaignName,
          },
          To: [
            {
              Email: toEmail,
              Name: toName || toEmail,
            },
          ],
          Subject: 'Welcome to Locallytrip! 🎒 Unlock Your First Airdrop & Perks!',
          TextPart: textPart,
          HTMLPart: htmlPart,
        },
      ],
    };

    if (options.sandboxMode) {
      requestPayload.SandboxMode = true;
    }

    const response: any = await client.post('send', { version: 'v3.1' }).request(requestPayload);

    return {
      success: true,
      status: response?.status || response?.response?.status || 200,
      data: response?.body,
    };
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    const errorMessage = error.message || 'Gagal mengirim welcome email via Mailjet.';

    console.error(`[Mailjet:Error] Gagal mengirim welcome email ke ${toEmail} [Status ${statusCode}]:`, errorMessage);

    return {
      success: false,
      status: statusCode,
      error: errorMessage,
    };
  }
}

/**
 * Mengirim Email Konfirmasi Transaksi / Pembayaran Sukses via Mailjet API v3.1
 * Menggunakan template dwibahasa (Bilingual) berstandar UI invoice tinggi.
 */
export async function sendTransactionEmail(
  toEmail: string,
  toName: string,
  transactionId: string,
  amount: number | string,
  details: TransactionEmailDetails = {}
): Promise<MailjetSendResult> {
  const senderEmail = process.env.MAILJET_SENDER_EMAIL || 'noreply@locallytrip.com';
  const senderName = 'Locallytrip Booking';
  const client = getMailjetClient();

  if (!client || details.forceMock) {
    console.log(
      `[Mailjet:Mock] sendTransactionEmail to "${toEmail}" for Tx #${transactionId} (${amount} ${details.currency || 'USD'})`
    );
    return {
      success: true,
      status: 200,
      mock: true,
      message: 'Email konfirmasi transaksi berhasil dikirim (Mock Mode: Kredensial Mailjet belum aktif/uji coba).',
      data: {
        toEmail,
        toName,
        transactionId,
        amount,
        currency: details.currency || 'USD',
        timestamp: new Date().toISOString(),
      },
    };
  }

  try {
    const htmlPart = generateTransactionHtml(toName, transactionId, amount, details);
    const textPart = `Locallytrip Transaction Confirmation: ${transactionId} ✅\n\nHello / Halo ${toName || 'Traveler'},\n\nPayment confirmed for Order #${transactionId} (${details.currency || 'USD'} ${amount}).\n\nView details: ${getAbsoluteBaseUrl(details.siteUrl)}/en/dashboard?tab=my-trips\n\nLocallytrip Team`;

    const requestPayload: any = {
      Messages: [
        {
          From: {
            Email: senderEmail,
            Name: senderName,
          },
          To: [
            {
              Email: toEmail,
              Name: toName || toEmail,
            },
          ],
          Subject: `Locallytrip Transaction Confirmation: ${transactionId} ✅`,
          TextPart: textPart,
          HTMLPart: htmlPart,
        },
      ],
    };

    if (details.sandboxMode) {
      requestPayload.SandboxMode = true;
    }

    const response: any = await client.post('send', { version: 'v3.1' }).request(requestPayload);

    return {
      success: true,
      status: response?.status || response?.response?.status || 200,
      data: response?.body,
    };
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    const errorMessage = error.message || 'Gagal mengirim email transaksi via Mailjet.';

    console.error(`[Mailjet:Error] Gagal mengirim invoice ke ${toEmail} [Status ${statusCode}]:`, errorMessage);

    return {
      success: false,
      status: statusCode,
      error: errorMessage,
    };
  }
}
