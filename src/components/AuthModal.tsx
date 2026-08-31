import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Fingerprint,
  MailCheck,
  ArrowRight
} from 'lucide-react';
import { sendEmailMagicLink, signInWithGoogleService } from '../services/supabaseService';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setErrorMessage(null);

    try {
      const res = await signInWithGoogleService();
      if (!res.success) {
        setErrorMessage(res.error || 'Không thể đăng nhập bằng tài khoản Google. Vui lòng thử lại hoặc dùng Email link.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối khi đăng nhập Google.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }

    setLoadingEmail(true);
    setErrorMessage(null);

    try {
      const res = await sendEmailMagicLink(email);
      if (res.success) {
        setLinkSent(true);
      } else {
        setErrorMessage(res.error || 'Không thể gửi link đăng nhập. Vui lòng kiểm tra lại cấu hình Supabase.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi gửi email.');
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-stone-300 shadow-2xl max-w-md w-full overflow-hidden relative text-stone-900 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1c0e09] via-[#36130b] to-[#1c0e09] text-amber-50 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif-clan text-white">
                Đăng Nhập Thành Viên
              </h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Xác thực bảo mật để xem và quản lý Gia Phả
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Primary Action: Google Login */}
          <div className="space-y-2">
            <label className="block font-bold text-stone-800 text-xs">
              Lựa chọn đăng nhập chính (Khuyên dùng):
            </label>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loadingGoogle || loadingEmail}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-bold border-2 border-stone-300 hover:border-amber-600 flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 text-sm group"
            >
              {loadingGoogle ? (
                <RefreshCw className="w-5 h-5 animate-spin text-amber-700" />
              ) : (
                /* Google Official G Multi-Color SVG Icon */
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span className="group-hover:text-amber-900 transition-colors">
                {loadingGoogle ? 'Đang chuyển hướng Google...' : 'Đăng Nhập Bằng Google'}
              </span>
            </button>
            <p className="text-[11px] text-stone-500 text-center">
              Đăng nhập tức thì chỉ với 1 chạm, không cần chờ nhận email.
            </p>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-3 text-stone-400 font-bold text-[10px] tracking-wider uppercase">
              Hoặc Đăng Nhập Bằng Email Link
            </span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          {/* Secondary Action: Email Magic Link */}
          {!linkSent ? (
            <form onSubmit={handleSendMagicLink} className="space-y-3.5 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div>
                <label className="block font-bold text-stone-800 mb-1.5">
                  Nhập địa chỉ Email của bạn:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="conchau.le@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-stone-300 focus:border-amber-600 focus:outline-none text-xs text-stone-900 font-medium"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                  Hệ thống sẽ gửi link đăng nhập trực tiếp đến email của bạn (không cần mật khẩu).
                </p>
              </div>

              <button
                type="submit"
                disabled={loadingEmail || loadingGoogle}
                className="w-full py-2.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer text-xs"
              >
                {loadingEmail ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 text-amber-300" />
                )}
                <span>{loadingEmail ? 'Đang gửi link...' : 'Gửi Link Đăng Nhập Qua Email'}</span>
              </button>
            </form>
          ) : (
            /* Magic Link Sent Notice (No OTP input field) */
            <div className="p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-300/80 text-amber-950 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <MailCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-stone-900">
                    Đã gửi link đăng nhập thành công!
                  </h4>
                  <p className="text-xs text-stone-700 font-medium leading-relaxed">
                    Đã gửi link đăng nhập tới email <strong className="text-amber-900 font-bold underline">{email}</strong> của bạn, vui lòng mở email và bấm vào link để vào ứng dụng.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-amber-200/70 text-[11px] text-stone-600 space-y-1">
                <p className="font-semibold text-amber-900 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Hướng dẫn đăng nhập:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 pl-1 text-stone-600 leading-relaxed">
                  <li>Mở ứng dụng Email hoặc Gmail trên máy của bạn.</li>
                  <li>Tìm thư mới nhất từ hệ thống dòng họ (kiểm tra cả mục <strong>Spam/Rác/Quảng cáo</strong> nếu chưa thấy).</li>
                  <li>Bấm vào nút <strong>"Log In" / "Xác nhận đăng nhập"</strong> trong thư để tự động mở ứng dụng.</li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setLinkSent(false);
                    setErrorMessage(null);
                  }}
                  className="text-amber-800 hover:text-amber-950 font-bold hover:underline cursor-pointer"
                >
                  ← Đổi email khác
                </button>

                <button
                  type="button"
                  onClick={handleSendMagicLink}
                  disabled={loadingEmail}
                  className="flex items-center gap-1 text-amber-900 font-bold hover:underline cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingEmail ? 'animate-spin' : ''}`} />
                  <span>Gửi lại link</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 text-center text-stone-500 text-[11px]">
          Bảo mật bởi Supabase Authentication & Row Level Security (RLS)
        </div>
      </div>
    </div>
  );
};

