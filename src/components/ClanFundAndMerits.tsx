import React, { useState } from 'react';
import { 
  Award, 
  Sparkles, 
  Coins, 
  Building2, 
  GraduationCap, 
  Heart, 
  CheckCircle, 
  PartyPopper,
  Filter,
  PlusCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClanScholarship, ClanFundRecord, ClanInfo } from '../types';

interface ClanFundAndMeritsProps {
  scholarships: ClanScholarship[];
  fundRecords: ClanFundRecord[];
  clanInfo: ClanInfo;
}

export const ClanFundAndMerits: React.FC<ClanFundAndMeritsProps> = ({
  scholarships,
  fundRecords,
  clanInfo,
}) => {
  const [activeTab, setActiveTab] = useState<'scholarship' | 'fund'>('scholarship');
  const [congratsMap, setCongratsMap] = useState<Record<string, number>>({});

  const totalFund = fundRecords.reduce((acc, cur) => acc + cur.amount, 0);
  const scholarshipTotal = scholarships.reduce((acc, cur) => acc + cur.rewardAmount, 0);

  const handleCongratulate = (id: string) => {
    setCongratsMap(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));

    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-16">
      
      {/* Header Banner */}
      <div className="bg-[#24140e] text-amber-50 border-b border-amber-900/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 font-serif-clan">
              <span>Khoa Bảng Gia Tộc & Công Đức Tiên Tổ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-clan text-white mt-1">
              Bảng Vàng Khuyến Học & Quỹ Dòng Họ
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-1">
              Tôn vinh con cháu hiếu học thành tài và ghi nhận công đức bà con đóng góp tu bổ từ đường.
            </p>
          </div>

          <div className="bg-stone-900/90 rounded-2xl p-1 border border-amber-900/50 flex items-center text-xs">
            <button
              onClick={() => setActiveTab('scholarship')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                activeTab === 'scholarship' ? 'bg-amber-700 text-white shadow-sm' : 'text-stone-300 hover:text-white'
              }`}
            >
              🎓 Bảng Vàng Khuyến Học
            </button>
            <button
              onClick={() => setActiveTab('fund')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                activeTab === 'fund' ? 'bg-amber-700 text-white shadow-sm' : 'text-stone-300 hover:text-white'
              }`}
            >
              💰 Quỹ Công Đức Dòng Họ
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl font-bold font-serif-clan text-stone-900">{scholarships.length} Cháu</div>
              <div className="text-xs font-semibold text-stone-600">Được Tuyên Dương Khuyến Học</div>
              <div className="text-[11px] text-amber-800 font-medium mt-0.5">Tổng thưởng: {formatCurrency(scholarshipTotal)}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Coins className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl font-bold font-serif-clan text-stone-900">{formatCurrency(totalFund)}</div>
              <div className="text-xs font-semibold text-stone-600">Tổng Quỹ Công Đức & Tu Bổ</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Minh bạch 100% các khoản thu chi</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-800 flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl font-bold font-serif-clan text-stone-900">Từ Đường Họ</div>
              <div className="text-xs font-semibold text-stone-600">Đã Hoàn Thành Đại Tu</div>
              <div className="text-[11px] text-stone-500 mt-0.5">Khuôn viên khang trang, tôn nghiêm</div>
            </div>
          </div>
        </div>

        {/* TAB 1: SCHOLARSHIPS / BẢNG VÀNG KHUYẾN HỌC */}
        {activeTab === 'scholarship' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-800 text-amber-50 rounded-3xl p-6 sm:p-8 shadow-lg text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold font-serif-clan text-white drop-shadow">
                📜 BẢNG VÀNG DANH DỰ KHUYẾN HỌC {clanInfo.clanSurname.toUpperCase()} TỘC
              </h2>
              <p className="text-xs sm:text-sm text-amber-100 max-w-2xl mx-auto font-serif-clan">
                "Hiền tài là nguyên khí của quốc gia, con cháu đỗ đạt là phúc đức của dòng họ."
                Tuyên dương các tấm gương con cháu vượt khó vươn lên, thủ khoa và học sinh sinh viên xuất sắc.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scholarships.map((sch) => {
                const count = congratsMap[sch.id] || 0;
                return (
                  <div
                    key={sch.id}
                    className="bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/10 rounded-bl-full pointer-events-none"></div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Năm Khen Thưởng: {sch.awardYear}
                        </span>
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                          Thưởng: {formatCurrency(sch.rewardAmount)}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold font-serif-clan text-stone-900 group-hover:text-amber-800 transition-colors">
                          {sch.studentName}
                        </h3>
                        <div className="text-xs text-stone-600 mt-0.5">
                          Con ông/bà: <strong>{sch.parentName}</strong> ({sch.branch} • Đời thứ {sch.generation})
                        </div>
                        <div className="text-xs font-medium text-amber-800 mt-1">
                          Trường: {sch.schoolOrUniversity}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-stone-800 font-medium">
                        🏆 Thành tích: <span className="font-bold text-amber-900">{sch.achievement}</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <button
                        onClick={() => handleCongratulate(sch.id)}
                        className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all hover:scale-105 active:scale-95"
                      >
                        <PartyPopper className="w-4 h-4 text-yellow-300" />
                        <span>Chúc Mừng ({count})</span>
                      </button>

                      <span className="text-[11px] text-stone-500">
                        {count > 0 ? `Đã có ${count} lời chúc` : 'Hãy gửi lời chúc mừng'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CLAN FUND RECORDS */}
        {activeTab === 'fund' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-serif-clan text-stone-900">
                Sổ Vàng Công Đức & Đóng Góp Xây Dựng
              </h3>
              <span className="text-xs text-stone-500">
                Tổng cộng {fundRecords.length} lượt công đức
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-900 text-amber-200 text-xs font-serif-clan uppercase">
                    <tr>
                      <th className="p-4">Người Đóng Góp / Gia Đình</th>
                      <th className="p-4">Ngành Chi / Đời</th>
                      <th className="p-4">Mục Đích Công Đức</th>
                      <th className="p-4">Số Tiền (VNĐ)</th>
                      <th className="p-4">Ngày Ghi Nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {fundRecords.map((item) => (
                      <tr key={item.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="p-4 font-bold text-stone-900 font-serif-clan text-sm">
                          {item.contributorName}
                        </td>
                        <td className="p-4 font-medium text-stone-600">
                          {item.branch} (Đời {item.generation})
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            item.category === 'khuyen_hoc' ? 'bg-blue-100 text-blue-800' :
                            item.category === 'tu_bo_tu_duong' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.purpose}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-amber-900 text-sm">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="p-4 text-stone-500">
                          {item.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
