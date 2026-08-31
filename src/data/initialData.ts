import { ClanMember, ClanInfo, MemorialEvent, ClanNewsEvent, ClanFundRecord, ClanScholarship } from '../types';

export const INITIAL_CLAN_INFO: ClanInfo = {
  name: "GIA PHẢ NỘI TỘC - LÊ KHẮC TỘC",
  clanSurname: "Lê Khắc",
  subTitle: "Uống nước nhớ nguồn - Kết nối muôn đời",
  ancestorName: "Cụ Thủy Tổ Lê Khắc Mạn",
  ancestralHallLocation: "Từ đường dòng họ Lê Khắc, Thôn An Phú, Xã Đồng Tiến, Hưng Yên (và Nhà thờ Chi nhánh Hà Nội, TP.HCM)",
  zaloGroupUrl: "https://zalo.me/g/lekhactoc146",
  zaloQrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=https://zalo.me/g/lekhactoc146",
  contactLeaderName: "Ông Lê Khắc Tuấn",
  contactLeaderPhone: "0912 345 678",
  contactLeaderRole: "Trưởng Ban Trị Sự & Tộc Trưởng",
  welcomeLetter: {
    title: "Lời Hiệu Triệu Dòng Tộc từ Ban Trị Sự & Trưởng Tộc",
    author: "Tộc Trưởng Lê Khắc Tuấn",
    role: "Đại diện Hội đồng Gia tộc Lê Khắc",
    dateText: "Xuân Bính Ngọ 2026",
    paragraphs: [
      "Kính thưa toàn thể các bậc cao niên, các bậc thúc bá, cô dì, dâu rể và toàn thể con cháu nội ngoại dòng họ Lê Khắc trên khắp mọi miền Tổ quốc và ở nước ngoài.",
      "Cây có cội mới trổ cành xanh lá, nước có nguồn mới biển rộng sông sâu. Trải qua hơn bảy thế hệ từ ngày Cụ Thủy Tổ Lê Khắc Mạn khai chi lập nghiệp, dòng tộc ta luôn giữ trọn nền nếp gia phong: trọng hiếu đễ, chuộng văn tự, tương thân tương ái và một lòng hướng về cội nguồn tiên tổ.",
      "Hệ thống Gia phả Điện tử trực tuyến này được Ban Trị Sự dày công số hóa nhằm giúp con cháu dù ở nơi đâu cũng có thể dễ dàng tra cứu huyết thống, ghi nhớ ngày giỗ chạp, gắn kết tình thân và cập nhật kịp thời thông tin các thành viên mới sinh, dâu rể vào cây phả hệ gia tộc.",
      "Kính chúc toàn thể bà con gia quyến vạn sự an khang, gia đạo hưng long, con cháu đỗ đạt rạng danh dòng tộc!"
    ]
  },
  totalGenerations: 7,
  totalMembersCount: 158,
  totalLivingCount: 104,
  totalBranchesCount: 4
};

export const INITIAL_MEMBERS: ClanMember[] = [
  // ===================== ĐỜI 1 =====================
  {
    id: "p1",
    fullName: "Lê Khắc Mạn",
    gender: "male",
    generation: 1,
    branch: "Thủy Tổ",
    title: "Cụ Thủy Tổ",
    birthYear: 1865,
    deathYear: 1938,
    isAlive: false,
    lunarDeathDate: "10/03 Âm lịch",
    parentId: null,
    spouse: "Cụ Bà Nguyễn Thị Diệu",
    spouseList: [
      { name: "Cụ Bà Nguyễn Thị Diệu", birthYear: 1868, deathYear: 1942, isAlive: false, lunarDeathDate: "18/07 Âm lịch", restingPlace: "Lăng Mộ Tổ Cụ Khởi Nghiệp" }
    ],
    address: "Nguyên quán Làng An Phú, Tổng Kim Động",
    restingPlace: "Khu Lăng Mộ Thủy Tổ họ Lê Khắc, Đồi Phúc An",
    bio: "Cụ Thủy Tổ khởi dựng cơ nghiệp dòng họ Lê Khắc, đức độ bao dung, khai hoang lập ấp, răn dạy con cháu cần cù hiếu nghĩa.",
    achievements: ["Khai chi lập tộc", "Tiền hiền khai khẩn"],
    orderInFamily: 1
  },

  // ===================== ĐỜI 2 =====================
  {
    id: "p2_1",
    fullName: "Lê Khắc Trợ",
    gender: "male",
    generation: 2,
    branch: "Chi Trưởng",
    title: "Cụ Trưởng Chi",
    birthYear: 1892,
    deathYear: 1968,
    isAlive: false,
    lunarDeathDate: "15/05 Âm lịch",
    parentId: "p1",
    motherName: "Cụ Bà Nguyễn Thị Diệu",
    spouse: "Cụ Bà Nguyễn Thị Lựu",
    spouseList: [
      { name: "Cụ Bà Nguyễn Thị Lựu", birthYear: 1895, deathYear: 1972, isAlive: false, lunarDeathDate: "02/11 Âm lịch", restingPlace: "Nghĩa trang họ Chi Trưởng" }
    ],
    restingPlace: "Khu lăng mộ Chi Trưởng họ Lê Khắc",
    bio: "Người kế tục phụng dưỡng từ đường, đức trọng tài cao, duy trì hương hỏa họ tộc.",
    orderInFamily: 1
  },
  {
    id: "p2_2",
    fullName: "Lê Khắc Nhuận",
    gender: "male",
    generation: 2,
    branch: "Chi Hai",
    title: "Cụ Chi Đệ Nhị",
    birthYear: 1896,
    deathYear: 1974,
    isAlive: false,
    lunarDeathDate: "20/08 Âm lịch",
    parentId: "p1",
    motherName: "Cụ Bà Nguyễn Thị Diệu",
    spouse: "Cụ Bà Trần Thị Mừng",
    spouseList: [
      { name: "Cụ Bà Trần Thị Mừng", birthYear: 1899, deathYear: 1980, isAlive: false, lunarDeathDate: "08/04 Âm lịch" }
    ],
    restingPlace: "Nghĩa trang Đồi Vàng",
    bio: "Cụ ông Chi Hai, mở mang điền trang, đóng góp lớn tu bổ nhà thờ họ.",
    orderInFamily: 2
  },
  {
    id: "p2_3",
    fullName: "Lê Khắc Hối",
    gender: "male",
    generation: 2,
    branch: "Chi Ba",
    title: "Cụ Chi Đệ Tam",
    birthYear: 1901,
    deathYear: 1982,
    isAlive: false,
    lunarDeathDate: "06/02 Âm lịch",
    parentId: "p1",
    motherName: "Cụ Bà Nguyễn Thị Diệu",
    spouse: "Cụ Bà Vũ Thị Thảo",
    spouseList: [
      { name: "Cụ Bà Vũ Thị Thảo", birthYear: 1904, deathYear: 1986, isAlive: false, lunarDeathDate: "14/09 Âm lịch" }
    ],
    restingPlace: "Nghĩa trang Đồng Cát",
    bio: "Cụ ông Chi Ba, giỏi nho y, cứu giúp nhiều bà con trong làng xóm họ tộc.",
    orderInFamily: 3
  },
  {
    id: "p2_4",
    fullName: "Lê Thị Nhàn",
    gender: "female",
    generation: 2,
    branch: "Chi Ngoại",
    title: "Bà Cô Tổ",
    birthYear: 1905,
    deathYear: 1989,
    isAlive: false,
    lunarDeathDate: "22/12 Âm lịch",
    parentId: "p1",
    motherName: "Cụ Bà Nguyễn Thị Diệu",
    spouse: "Cụ Ông Hoàng Văn Đạt",
    bio: "Con gái út cụ Thủy Tổ, thùy mị nết na, gả sang dòng họ Hoàng Văn làng bên.",
    orderInFamily: 4
  },

  // ===================== ĐỜI 3 =====================
  // Nhánh Chi Trưởng (con cụ Lê Khắc Trợ)
  {
    id: "p3_1",
    fullName: "Lê Khắc Thống",
    gender: "male",
    generation: 3,
    branch: "Chi Trưởng",
    title: "Cụ Ông Đời 3 (Trưởng)",
    birthYear: 1920,
    deathYear: 1995,
    isAlive: false,
    lunarDeathDate: "12/04 Âm lịch",
    parentId: "p2_1",
    motherName: "Cụ Bà Nguyễn Thị Lựu",
    spouse: "Bà Nguyễn Thị Mai",
    restingPlace: "Nghĩa trang Quê nhà",
    bio: "Cụ Thống tính tình cương trực, tham gia kháng chiến chống Pháp, giữ chức vụ xã đội trưởng.",
    orderInFamily: 1
  },
  {
    id: "p3_2",
    fullName: "Lê Khắc Doãn",
    gender: "male",
    generation: 3,
    branch: "Chi Trưởng",
    title: "Cụ Ông Đời 3",
    birthYear: 1924,
    deathYear: 2002,
    isAlive: false,
    lunarDeathDate: "19/09 Âm lịch",
    parentId: "p2_1",
    motherName: "Cụ Bà Nguyễn Thị Lựu",
    spouse: "Bà Trần Thị Lành",
    restingPlace: "Nghĩa trang Quê nhà",
    bio: "Nhà giáo ưu tú của huyện, có công đào tạo nhiều thế hệ con cháu thành đạt.",
    orderInFamily: 2
  },
  {
    id: "p3_3",
    fullName: "Lê Thị Bích",
    gender: "female",
    generation: 3,
    branch: "Chi Trưởng",
    title: "Bà Đời 3",
    birthYear: 1928,
    deathYear: 2010,
    isAlive: false,
    lunarDeathDate: "05/06 Âm lịch",
    parentId: "p2_1",
    motherName: "Cụ Bà Nguyễn Thị Lựu",
    spouse: "Ông Phạm Văn Hùng",
    orderInFamily: 3
  },

  // Nhánh Chi Hai (con cụ Lê Khắc Nhuận)
  {
    id: "p3_4",
    fullName: "Lê Khắc Luật",
    gender: "male",
    generation: 3,
    branch: "Chi Hai",
    title: "Cụ Ông Chi 2",
    birthYear: 1923,
    deathYear: 1998,
    isAlive: false,
    lunarDeathDate: "27/03 Âm lịch",
    parentId: "p2_2",
    motherName: "Cụ Bà Trần Thị Mừng",
    spouse: "Bà Đặng Thị Hạnh",
    restingPlace: "Nghĩa trang Đồi Vàng",
    orderInFamily: 1
  },
  {
    id: "p3_5",
    fullName: "Lê Khắc Trí",
    gender: "male",
    generation: 3,
    branch: "Chi Hai",
    title: "Cụ Ông Chi 2",
    birthYear: 1927,
    deathYear: 2005,
    isAlive: false,
    lunarDeathDate: "11/10 Âm lịch",
    parentId: "p2_2",
    motherName: "Cụ Bà Trần Thị Mừng",
    spouse: "Bà Phạm Thị Hòa",
    orderInFamily: 2
  },
  {
    id: "p3_6",
    fullName: "Lê Khắc Uyển",
    gender: "male",
    generation: 3,
    branch: "Chi Hai",
    title: "Cụ Ông Chi 2",
    birthYear: 1931,
    deathYear: 2012,
    isAlive: false,
    lunarDeathDate: "04/01 Âm lịch",
    parentId: "p2_2",
    motherName: "Cụ Bà Trần Thị Mừng",
    spouse: "Bà Bùi Thị Nhàn",
    orderInFamily: 3
  },
  {
    id: "p3_7",
    fullName: "Lê Thị Lan",
    gender: "female",
    generation: 3,
    branch: "Chi Hai",
    title: "Bà Đời 3",
    birthYear: 1935,
    deathYear: 2018,
    isAlive: false,
    parentId: "p2_2",
    motherName: "Cụ Bà Trần Thị Mừng",
    spouse: "Ông Ngô Văn Tình",
    orderInFamily: 4
  },

  // Nhánh Chi Ba (con cụ Lê Khắc Hối)
  {
    id: "p3_8",
    fullName: "Lê Khắc Xuyên",
    gender: "male",
    generation: 3,
    branch: "Chi Ba",
    title: "Cụ Ông Chi 3",
    birthYear: 1926,
    deathYear: 2001,
    isAlive: false,
    lunarDeathDate: "16/08 Âm lịch",
    parentId: "p2_3",
    motherName: "Cụ Bà Vũ Thị Thảo",
    spouse: "Bà Đỗ Thị Tuyết",
    orderInFamily: 1
  },
  {
    id: "p3_9",
    fullName: "Lê Khắc Thuần",
    gender: "male",
    generation: 3,
    branch: "Chi Ba",
    title: "Cụ Ông Chi 3",
    birthYear: 1930,
    deathYear: 2015,
    isAlive: false,
    lunarDeathDate: "23/07 Âm lịch",
    parentId: "p2_3",
    motherName: "Cụ Bà Vũ Thị Thảo",
    spouse: "Bà Ngô Thị Nga",
    orderInFamily: 2
  },
  {
    id: "p3_10",
    fullName: "Lê Khắc Kiệm",
    gender: "male",
    generation: 3,
    branch: "Chi Ba",
    title: "Cụ Ông Chi 3",
    birthYear: 1934,
    deathYear: 2019,
    isAlive: false,
    lunarDeathDate: "09/12 Âm lịch",
    parentId: "p2_3",
    motherName: "Cụ Bà Vũ Thị Thảo",
    spouse: "Bà Dương Thị Thu",
    orderInFamily: 3
  },

  // ===================== ĐỜI 4 =====================
  // Con cụ Lê Khắc Thống
  {
    id: "p4_1",
    fullName: "Lê Khắc Hiền",
    gender: "male",
    generation: 4,
    branch: "Chi Trưởng",
    title: "Ông Cả Chi Trưởng",
    birthYear: 1948,
    isAlive: true,
    parentId: "p3_1",
    motherName: "Bà Nguyễn Thị Mai",
    spouse: "Bà Vũ Thị Oanh",
    phone: "0903 112 233",
    address: "Hà Nội",
    occupation: "Cán bộ hưu trí Bưu Điện",
    bio: "Trưởng ban cố vấn dòng họ, am hiểu phả ký và nghi lễ tế tự.",
    orderInFamily: 1
  },
  {
    id: "p4_2",
    fullName: "Lê Khắc Tương",
    gender: "male",
    generation: 4,
    branch: "Chi Trưởng",
    title: "Ông Đời 4",
    birthYear: 1952,
    isAlive: true,
    parentId: "p3_1",
    motherName: "Bà Nguyễn Thị Mai",
    spouse: "Bà Đinh Thị Yến",
    phone: "0913 224 455",
    address: "Hưng Yên",
    occupation: "Hưu trí / Quản lý Từ đường",
    orderInFamily: 2
  },
  {
    id: "p4_3",
    fullName: "Lê Thị Huệ",
    gender: "female",
    generation: 4,
    branch: "Chi Trưởng",
    birthYear: 1956,
    isAlive: true,
    parentId: "p3_1",
    motherName: "Bà Nguyễn Thị Mai",
    spouse: "Ông Nguyễn Văn Thanh",
    address: "Hải Phòng",
    orderInFamily: 3
  },

  // Con cụ Lê Khắc Doãn
  {
    id: "p4_4",
    fullName: "Lê Khắc Luận",
    gender: "male",
    generation: 4,
    branch: "Chi Trưởng",
    birthYear: 1950,
    deathYear: 2021,
    isAlive: false,
    lunarDeathDate: "18/06 Âm lịch",
    parentId: "p3_2",
    motherName: "Bà Trần Thị Lành",
    spouse: "Bà Hoàng Thị Cúc",
    orderInFamily: 1
  },
  {
    id: "p4_5",
    fullName: "Lê Khắc Căn",
    gender: "male",
    generation: 4,
    branch: "Chi Trưởng",
    birthYear: 1954,
    isAlive: true,
    parentId: "p3_2",
    motherName: "Bà Trần Thị Lành",
    spouse: "Bà Bùi Thị Thoa",
    phone: "0988 556 677",
    address: "Bắc Ninh",
    orderInFamily: 2
  },

  // Con cụ Lê Khắc Luật (Chi Hai)
  {
    id: "p4_6",
    fullName: "Lê Khắc Tài",
    gender: "male",
    generation: 4,
    branch: "Chi Hai",
    title: "Trưởng Chi Hai",
    birthYear: 1950,
    isAlive: true,
    parentId: "p3_4",
    motherName: "Bà Đặng Thị Hạnh",
    spouse: "Bà Nguyễn Thị Xuân",
    phone: "0912 889 900",
    address: "Hà Nội",
    occupation: "Kỹ sư Cầu Đường (Hưu trí)",
    orderInFamily: 1
  },
  {
    id: "p4_7",
    fullName: "Lê Khắc Kính",
    gender: "male",
    generation: 4,
    branch: "Chi Hai",
    birthYear: 1955,
    isAlive: true,
    parentId: "p3_4",
    motherName: "Bà Đặng Thị Hạnh",
    spouse: "Bà Phạm Thị Dung",
    phone: "0977 443 322",
    address: "Hưng Yên",
    orderInFamily: 2
  },
  {
    id: "p4_8",
    fullName: "Lê Khắc Diệm",
    gender: "male",
    generation: 4,
    branch: "Chi Hai",
    birthYear: 1960,
    isAlive: true,
    parentId: "p3_4",
    motherName: "Bà Đặng Thị Hạnh",
    spouse: "Bà Vũ Thị Hà",
    phone: "0904 667 788",
    address: "TP. Hồ Chí Minh",
    orderInFamily: 3
  },

  // Con cụ Lê Khắc Trí (Chi Hai)
  {
    id: "p4_9",
    fullName: "Lê Khắc Quyết",
    gender: "male",
    generation: 4,
    branch: "Chi Hai",
    birthYear: 1953,
    isAlive: true,
    parentId: "p3_5",
    motherName: "Bà Phạm Thị Hòa",
    spouse: "Bà Trần Thị Thủy",
    phone: "0934 556 778",
    address: "Đà Nẵng",
    orderInFamily: 1
  },
  {
    id: "p4_10",
    fullName: "Lê Khắc Phùng",
    gender: "male",
    generation: 4,
    branch: "Chi Hai",
    birthYear: 1958,
    isAlive: true,
    parentId: "p3_5",
    motherName: "Bà Phạm Thị Hòa",
    spouse: "Bà Phan Thị Ánh",
    phone: "0915 667 889",
    address: "Hà Nội",
    orderInFamily: 2
  },

  // Con cụ Lê Khắc Uyển (Chi Hai)
  {
    id: "p4_11",
    fullName: "Lê Khắc Lợi",
    gender: "male",
    generation: 4,
    branch: "Chi Hai",
    birthYear: 1957,
    isAlive: true,
    parentId: "p3_6",
    motherName: "Bà Bùi Thị Nhàn",
    spouse: "Bà Lương Thị Mai",
    phone: "0982 334 556",
    address: "Thái Nguyên",
    orderInFamily: 1
  },

  // Con cụ Lê Khắc Xuyên (Chi Ba)
  {
    id: "p4_12",
    fullName: "Lê Khắc Quang",
    gender: "male",
    generation: 4,
    branch: "Chi Ba",
    title: "Trưởng Chi Ba",
    birthYear: 1952,
    isAlive: true,
    parentId: "p3_8",
    motherName: "Bà Đỗ Thị Tuyết",
    spouse: "Bà Tạ Thị Linh",
    phone: "0918 998 877",
    address: "Hưng Yên",
    orderInFamily: 1
  },
  {
    id: "p4_13",
    fullName: "Lê Khắc Vinh",
    gender: "male",
    generation: 4,
    branch: "Chi Ba",
    birthYear: 1956,
    isAlive: true,
    parentId: "p3_8",
    motherName: "Bà Đỗ Thị Tuyết",
    spouse: "Bà Trịnh Thị Loan",
    phone: "0908 123 456",
    address: "Vũng Tàu",
    orderInFamily: 2
  },

  // Con cụ Lê Khắc Thuần (Chi Ba)
  {
    id: "p4_14",
    fullName: "Lê Khắc Toàn",
    gender: "male",
    generation: 4,
    branch: "Chi Ba",
    birthYear: 1958,
    isAlive: true,
    parentId: "p3_9",
    motherName: "Bà Ngô Thị Nga",
    spouse: "Bà Nguyễn Thị Hạnh",
    phone: "0945 678 910",
    address: "Hà Nội",
    orderInFamily: 1
  },

  // ===================== ĐỜI 5 (THẾ HỆ ĐƯƠNG ĐẠI) =====================
  // Con ông Lê Khắc Hiền (Chi Trưởng)
  {
    id: "p5_1",
    fullName: "Lê Khắc Tuấn",
    gender: "male",
    generation: 5,
    branch: "Chi Trưởng",
    title: "Tộc Trưởng Hiện Tại",
    birthYear: 1974,
    isAlive: true,
    parentId: "p4_1",
    motherName: "Bà Vũ Thị Oanh",
    spouse: "Bà Hoàng Thị Minh Châu",
    phone: "0912 345 678",
    email: "tuan.lekhac@gmail.com",
    address: "Quận Cầu Giấy, Hà Nội",
    occupation: "Giám đốc Doanh nghiệp Xây dựng",
    bio: "Đương kim Tộc trưởng họ Lê Khắc, nhiệt tâm đóng góp công đức và số hóa tộc phả gia phả số.",
    achievements: ["Trưởng Ban Trị Sự", "Bằng khen Doanh nhân tiêu biểu"],
    orderInFamily: 1
  },
  {
    id: "p5_2",
    fullName: "Lê Khắc Huỳnh",
    gender: "male",
    generation: 5,
    branch: "Chi Trưởng",
    birthYear: 1978,
    isAlive: true,
    parentId: "p4_1",
    motherName: "Bà Vũ Thị Oanh",
    spouse: "Bà Trần Kim Chi",
    phone: "0983 456 789",
    address: "Hà Nội",
    occupation: "Tiến sĩ - Giảng viên Đại học Bách Khoa",
    achievements: ["Tiến sĩ Công nghệ Thông tin", "Học bổng Tiến sĩ Kyoto"],
    orderInFamily: 2
  },
  {
    id: "p5_3",
    fullName: "Lê Thị Hương",
    gender: "female",
    generation: 5,
    branch: "Chi Trưởng",
    birthYear: 1982,
    isAlive: true,
    parentId: "p4_1",
    motherName: "Bà Vũ Thị Oanh",
    spouse: "Ông Vũ Quốc Bảo",
    phone: "0976 543 210",
    address: "Hà Nội",
    occupation: "Bác sĩ Bệnh viện Bạch Mai",
    orderInFamily: 3
  },

  // Con ông Lê Khắc Tương (Chi Trưởng)
  {
    id: "p5_4",
    fullName: "Lê Khắc Chung",
    gender: "male",
    generation: 5,
    branch: "Chi Trưởng",
    birthYear: 1979,
    isAlive: true,
    parentId: "p4_2",
    motherName: "Bà Đinh Thị Yến",
    spouse: "Bà Ngô Thu Thảo",
    phone: "0915 234 567",
    address: "Hưng Yên",
    occupation: "Cán bộ Địa chính",
    orderInFamily: 1
  },
  {
    id: "p5_5",
    fullName: "Lê Khắc Hải",
    gender: "male",
    generation: 5,
    branch: "Chi Trưởng",
    birthYear: 1984,
    isAlive: true,
    parentId: "p4_2",
    motherName: "Bà Đinh Thị Yến",
    spouse: "Bà Đỗ Thùy Trang",
    phone: "0989 321 654",
    address: "Đà Nẵng",
    occupation: "Kỹ sư Tự động hóa",
    orderInFamily: 2
  },

  // Con ông Lê Khắc Căn (Chi Trưởng)
  {
    id: "p5_6",
    fullName: "Lê Khắc Tiến",
    gender: "male",
    generation: 5,
    branch: "Chi Trưởng",
    birthYear: 1981,
    isAlive: true,
    parentId: "p4_5",
    motherName: "Bà Bùi Thị Thoa",
    spouse: "Bà Phạm Thanh Hà",
    phone: "0903 887 766",
    address: "Bắc Ninh",
    occupation: "Kinh doanh tự do",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Tài (Chi Hai)
  {
    id: "p5_7",
    fullName: "Lê Khắc Toàn",
    gender: "male",
    generation: 5,
    branch: "Chi Hai",
    title: "Phó Ban Trị Sự",
    birthYear: 1976,
    isAlive: true,
    parentId: "p4_6",
    motherName: "Bà Nguyễn Thị Xuân",
    spouse: "Bà Nguyễn Thị Diệu Linh",
    phone: "0913 998 811",
    address: "Hà Nội",
    occupation: "Luật sư",
    orderInFamily: 1
  },
  {
    id: "p5_8",
    fullName: "Lê Khắc Dũng",
    gender: "male",
    generation: 5,
    branch: "Chi Hai",
    birthYear: 1980,
    isAlive: true,
    parentId: "p4_6",
    motherName: "Bà Nguyễn Thị Xuân",
    spouse: "Bà Lê Mỹ Hạnh",
    phone: "0978 112 244",
    address: "TP. Hồ Chí Minh",
    occupation: "Giám đốc Tài chính",
    orderInFamily: 2
  },

  // Con ông Lê Khắc Kính (Chi Hai)
  {
    id: "p5_9",
    fullName: "Lê Khắc Sơn",
    gender: "male",
    generation: 5,
    branch: "Chi Hai",
    birthYear: 1983,
    isAlive: true,
    parentId: "p4_7",
    motherName: "Bà Phạm Thị Dung",
    spouse: "Bà Bùi Thùy Dung",
    phone: "0909 554 433",
    address: "Hưng Yên",
    occupation: "Kiến trúc sư",
    orderInFamily: 1
  },
  {
    id: "p5_10",
    fullName: "Lê Khắc Hùng",
    gender: "male",
    generation: 5,
    branch: "Chi Hai",
    birthYear: 1987,
    isAlive: true,
    parentId: "p4_7",
    motherName: "Bà Phạm Thị Dung",
    spouse: "Bà Hoàng Yến",
    phone: "0918 776 655",
    address: "Hà Nội",
    occupation: "Chuyên viên Ngân hàng Vietcombank",
    orderInFamily: 2
  },

  // Con ông Lê Khắc Diệm (Chi Hai)
  {
    id: "p5_11",
    fullName: "Lê Khắc Thành",
    gender: "male",
    generation: 5,
    branch: "Chi Hai",
    birthYear: 1988,
    isAlive: true,
    parentId: "p4_8",
    motherName: "Bà Vũ Thị Hà",
    spouse: "Bà Dương Ngọc Mai",
    phone: "0938 111 222",
    address: "Quận 1, TP. Hồ Chí Minh",
    occupation: "Lập trình viên Senior",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Quyết (Chi Hai)
  {
    id: "p5_12",
    fullName: "Lê Khắc Nam",
    gender: "male",
    generation: 5,
    branch: "Chi Hai",
    birthYear: 1982,
    isAlive: true,
    parentId: "p4_9",
    motherName: "Bà Trần Thị Thủy",
    spouse: "Bà Phan Thị Hồng",
    phone: "0944 332 211",
    address: "Đà Nẵng",
    occupation: "Quản lý Khách sạn",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Phùng (Chi Hai)
  {
    id: "p5_13",
    fullName: "Lê Khắc Cường",
    gender: "male",
    generation: 5,
    branch: "Chi Hai",
    birthYear: 1985,
    isAlive: true,
    parentId: "p4_10",
    motherName: "Bà Phan Thị Ánh",
    spouse: "Bà Trần Hải Yến",
    phone: "0902 445 566",
    address: "Hà Nội",
    occupation: "Kỹ sư Viễn thông",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Lợi (Chi Hai)
  {
    id: "p5_14",
    fullName: "Lê Khắc Bảo",
    gender: "male",
    generation: 5,
    branch: "Chi Hai",
    birthYear: 1986,
    isAlive: true,
    parentId: "p4_11",
    motherName: "Bà Lương Thị Mai",
    spouse: "Bà Đặng Quỳnh Nga",
    phone: "0987 665 544",
    address: "Thái Nguyên",
    occupation: "Bác sĩ Đa khoa",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Quang (Chi Ba)
  {
    id: "p5_15",
    fullName: "Lê Khắc Trung",
    gender: "male",
    generation: 5,
    branch: "Chi Ba",
    birthYear: 1980,
    isAlive: true,
    parentId: "p4_12",
    motherName: "Bà Tạ Thị Linh",
    spouse: "Bà Nguyễn Minh Huệ",
    phone: "0916 554 433",
    address: "Hưng Yên",
    occupation: "Kinh doanh Nông sản Xuất khẩu",
    orderInFamily: 1
  },
  {
    id: "p5_16",
    fullName: "Lê Khắc Trọng",
    gender: "male",
    generation: 5,
    branch: "Chi Ba",
    birthYear: 1984,
    isAlive: true,
    parentId: "p4_12",
    motherName: "Bà Tạ Thị Linh",
    spouse: "Bà Đào Thu Cúc",
    phone: "0973 221 100",
    address: "Hà Nội",
    occupation: "Thạc sĩ Tài chính",
    orderInFamily: 2
  },

  // Con ông Lê Khắc Vinh (Chi Ba)
  {
    id: "p5_17",
    fullName: "Lê Khắc Phong",
    gender: "male",
    generation: 5,
    branch: "Chi Ba",
    birthYear: 1985,
    isAlive: true,
    parentId: "p4_13",
    motherName: "Bà Trịnh Thị Loan",
    spouse: "Bà Võ Thị Kim Oanh",
    phone: "0909 333 444",
    address: "Vũng Tàu",
    occupation: "Kỹ sư Dầu khí PTSC",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Toàn (Chi Ba)
  {
    id: "p5_18",
    fullName: "Lê Khắc Đạt",
    gender: "male",
    generation: 5,
    branch: "Chi Ba",
    birthYear: 1987,
    isAlive: true,
    parentId: "p4_14",
    motherName: "Bà Nguyễn Thị Hạnh",
    spouse: "Bà Vũ Mai Lan",
    phone: "0948 223 344",
    address: "Hà Nội",
    occupation: "Thiết kế Sáng tạo",
    orderInFamily: 1
  },

  // ===================== ĐỜI 6 (THẾ HỆ TRẺ & HỌC VỊ) =====================
  // Con ông Lê Khắc Tuấn (Tộc trưởng)
  {
    id: "p6_1",
    fullName: "Lê Khắc Minh Khang",
    gender: "male",
    generation: 6,
    branch: "Chi Trưởng",
    title: "Cháu Đích Tôn",
    birthYear: 2002,
    isAlive: true,
    parentId: "p5_1",
    motherName: "Bà Hoàng Thị Minh Châu",
    phone: "0968 112 233",
    address: "Hà Nội / Du học sinh Melbourne",
    occupation: "Sinh viên ĐH Quốc Gia Australia (ANU)",
    achievements: ["Thủ khoa THPT Chuyên Sư Phạm", "Học bổng Toàn phần Melbourne"],
    orderInFamily: 1
  },
  {
    id: "p6_2",
    fullName: "Lê Khắc Bảo Trâm",
    gender: "female",
    generation: 6,
    branch: "Chi Trưởng",
    birthYear: 2007,
    isAlive: true,
    parentId: "p5_1",
    motherName: "Bà Hoàng Thị Minh Châu",
    address: "Hà Nội",
    occupation: "Học sinh THPT Chuyên Hà Nội - Amsterdam",
    achievements: ["Giải Nhì Học sinh Giỏi Tiếng Anh Quốc Gia 2025"],
    orderInFamily: 2
  },

  // Con ông Lê Khắc Huỳnh (Chi Trưởng)
  {
    id: "p6_3",
    fullName: "Lê Khắc Gia Huy",
    gender: "male",
    generation: 6,
    branch: "Chi Trưởng",
    birthYear: 2006,
    isAlive: true,
    parentId: "p5_2",
    motherName: "Bà Trần Kim Chi",
    address: "Hà Nội",
    occupation: "Sinh viên Khoa CNTT - ĐH Bách Khoa Hà Nội",
    achievements: ["Huy chương Vàng Olympic Tin học Trẻ"],
    orderInFamily: 1
  },
  {
    id: "p6_4",
    fullName: "Lê Khắc Tuệ An",
    gender: "female",
    generation: 6,
    branch: "Chi Trưởng",
    birthYear: 2012,
    isAlive: true,
    parentId: "p5_2",
    motherName: "Bà Trần Kim Chi",
    address: "Hà Nội",
    occupation: "Học sinh THCS Cầu Giấy",
    orderInFamily: 2
  },

  // Con ông Lê Khắc Chung (Chi Trưởng)
  {
    id: "p6_5",
    fullName: "Lê Khắc Hoàng Bách",
    gender: "male",
    generation: 6,
    branch: "Chi Trưởng",
    birthYear: 2008,
    isAlive: true,
    parentId: "p5_4",
    motherName: "Bà Ngô Thu Thảo",
    address: "Hưng Yên",
    occupation: "Học sinh THPT Chuyên Hưng Yên",
    orderInFamily: 1
  },
  {
    id: "p6_6",
    fullName: "Lê Khắc Minh Châu",
    gender: "female",
    generation: 6,
    branch: "Chi Trưởng",
    birthYear: 2014,
    isAlive: true,
    parentId: "p5_4",
    motherName: "Bà Ngô Thu Thảo",
    address: "Hưng Yên",
    orderInFamily: 2
  },

  // Con ông Lê Khắc Hải (Chi Trưởng)
  {
    id: "p6_7",
    fullName: "Lê Khắc Bảo Long",
    gender: "male",
    generation: 6,
    branch: "Chi Trưởng",
    birthYear: 2015,
    isAlive: true,
    parentId: "p5_5",
    motherName: "Bà Đỗ Thùy Trang",
    address: "Đà Nẵng",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Tiến (Chi Trưởng)
  {
    id: "p6_8",
    fullName: "Lê Khắc Tuấn Kiệt",
    gender: "male",
    generation: 6,
    branch: "Chi Trưởng",
    birthYear: 2010,
    isAlive: true,
    parentId: "p5_6",
    motherName: "Bà Phạm Thanh Hà",
    address: "Bắc Ninh",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Toàn (Chi Hai)
  {
    id: "p6_9",
    fullName: "Lê Khắc Quang Minh",
    gender: "male",
    generation: 6,
    branch: "Chi Hai",
    birthYear: 2004,
    isAlive: true,
    parentId: "p5_7",
    motherName: "Bà Nguyễn Thị Diệu Linh",
    phone: "0967 889 900",
    address: "Hà Nội",
    occupation: "Sinh viên ĐH Ngoại Thương",
    achievements: ["Thủ khoa Khối A1 tỉnh Hưng Yên 2022"],
    orderInFamily: 1
  },
  {
    id: "p6_10",
    fullName: "Lê Khắc Thục Quyên",
    gender: "female",
    generation: 6,
    branch: "Chi Hai",
    birthYear: 2009,
    isAlive: true,
    parentId: "p5_7",
    motherName: "Bà Nguyễn Thị Diệu Linh",
    address: "Hà Nội",
    orderInFamily: 2
  },

  // Con ông Lê Khắc Dũng (Chi Hai)
  {
    id: "p6_11",
    fullName: "Lê Khắc Đức Duy",
    gender: "male",
    generation: 6,
    branch: "Chi Hai",
    birthYear: 2011,
    isAlive: true,
    parentId: "p5_8",
    motherName: "Bà Lê Mỹ Hạnh",
    address: "TP. Hồ Chí Minh",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Sơn (Chi Hai)
  {
    id: "p6_12",
    fullName: "Lê Khắc Nhật Minh",
    gender: "male",
    generation: 6,
    branch: "Chi Hai",
    birthYear: 2013,
    isAlive: true,
    parentId: "p5_9",
    motherName: "Bà Bùi Thùy Dung",
    address: "Hưng Yên",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Hùng (Chi Hai)
  {
    id: "p6_13",
    fullName: "Lê Khắc Thiên Ân",
    gender: "male",
    generation: 6,
    branch: "Chi Hai",
    birthYear: 2018,
    isAlive: true,
    parentId: "p5_10",
    motherName: "Bà Hoàng Yến",
    address: "Hà Nội",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Thành (Chi Hai)
  {
    id: "p6_14",
    fullName: "Lê Khắc Gia Bảo",
    gender: "male",
    generation: 6,
    branch: "Chi Hai",
    birthYear: 2020,
    isAlive: true,
    parentId: "p5_11",
    motherName: "Bà Dương Ngọc Mai",
    address: "TP. Hồ Chí Minh",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Nam (Chi Hai)
  {
    id: "p6_15",
    fullName: "Lê Khắc Anh Thư",
    gender: "female",
    generation: 6,
    branch: "Chi Hai",
    birthYear: 2012,
    isAlive: true,
    parentId: "p5_12",
    motherName: "Bà Phan Thị Hồng",
    address: "Đà Nẵng",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Cường (Chi Hai)
  {
    id: "p6_16",
    fullName: "Lê Khắc Minh Đức",
    gender: "male",
    generation: 6,
    branch: "Chi Hai",
    birthYear: 2016,
    isAlive: true,
    parentId: "p5_13",
    motherName: "Bà Trần Hải Yến",
    address: "Hà Nội",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Bảo (Chi Hai)
  {
    id: "p6_17",
    fullName: "Lê Khắc Khánh An",
    gender: "female",
    generation: 6,
    branch: "Chi Hai",
    birthYear: 2017,
    isAlive: true,
    parentId: "p5_14",
    motherName: "Bà Đặng Quỳnh Nga",
    address: "Thái Nguyên",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Trung (Chi Ba)
  {
    id: "p6_18",
    fullName: "Lê Khắc Hải Đăng",
    gender: "male",
    generation: 6,
    branch: "Chi Ba",
    birthYear: 2009,
    isAlive: true,
    parentId: "p5_15",
    motherName: "Bà Nguyễn Minh Huệ",
    address: "Hưng Yên",
    orderInFamily: 1
  },
  {
    id: "p6_19",
    fullName: "Lê Khắc Thảo Linh",
    gender: "female",
    generation: 6,
    branch: "Chi Ba",
    birthYear: 2015,
    isAlive: true,
    parentId: "p5_15",
    motherName: "Bà Nguyễn Minh Huệ",
    address: "Hưng Yên",
    orderInFamily: 2
  },

  // Con ông Lê Khắc Trọng (Chi Ba)
  {
    id: "p6_20",
    fullName: "Lê Khắc Minh Triết",
    gender: "male",
    generation: 6,
    branch: "Chi Ba",
    birthYear: 2014,
    isAlive: true,
    parentId: "p5_16",
    motherName: "Bà Đào Thu Cúc",
    address: "Hà Nội",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Phong (Chi Ba)
  {
    id: "p6_21",
    fullName: "Lê Khắc Hoàng Nam",
    gender: "male",
    generation: 6,
    branch: "Chi Ba",
    birthYear: 2016,
    isAlive: true,
    parentId: "p5_17",
    motherName: "Bà Võ Thị Kim Oanh",
    address: "Vũng Tàu",
    orderInFamily: 1
  },

  // Con ông Lê Khắc Đạt (Chi Ba)
  {
    id: "p6_22",
    fullName: "Lê Khắc Bảo An",
    gender: "female",
    generation: 6,
    branch: "Chi Ba",
    birthYear: 2019,
    isAlive: true,
    parentId: "p5_18",
    motherName: "Bà Vũ Mai Lan",
    address: "Hà Nội",
    orderInFamily: 1
  },

  // ===================== ĐỜI 7 (CHÁU THẾ HỆ THỨ 7) =====================
  {
    id: "p7_1",
    fullName: "Lê Khắc An Phúc",
    gender: "male",
    generation: 7,
    branch: "Chi Trưởng",
    title: "Chắt Đích Tôn",
    birthYear: 2025,
    isAlive: true,
    parentId: "p6_1",
    address: "Hà Nội",
    bio: "Thành viên thế hệ thứ 7 bé nhất của dòng họ, phúc lộc song toàn.",
    orderInFamily: 1
  }
];

export const INITIAL_MEMORIAL_EVENTS: MemorialEvent[] = [
  {
    id: "mem_1",
    title: "Đại Lễ Giỗ Cụ Thủy Tổ Lê Khắc Mạn (Giỗ Họ Toàn Tộc)",
    lunarDate: "10/03 Âm lịch",
    solarDateEstimated: "26/04/2026",
    targetPersonName: "Cụ Thủy Tổ Lê Khắc Mạn",
    generation: 1,
    branch: "Toàn Tộc",
    location: "Nhà thờ Tổ Từ Đường Lê Khắc, Thôn An Phú, Xã Đồng Tiến, Hưng Yên",
    hostPerson: "Tộc trưởng Lê Khắc Tuấn & Ban Trị Sự",
    role: "Chủ tế dòng họ",
    description: "Lễ Giỗ Thủy Tổ - sự kiện trọng đại nhất năm của họ tộc. Con cháu khắp nơi tề tựu dâng hương, báo công và liên hoan gia tộc.",
    ritualNotes: "Trang phục áo the khăn xếp truyền thống, đội tế nam quan và tế nữ quan thực hiện nghi lễ Tam hiến.",
    isMajorAnniversary: true
  },
  {
    id: "mem_2",
    title: "Lễ Giỗ Cụ Bà Thủy Tổ Nguyễn Thị Diệu",
    lunarDate: "18/07 Âm lịch",
    solarDateEstimated: "29/08/2026",
    targetPersonName: "Cụ Bà Nguyễn Thị Diệu",
    generation: 1,
    branch: "Toàn Tộc",
    location: "Khu Lăng Mộ Tổ & Từ Đường dòng họ",
    hostPerson: "Hội đồng Gia tộc",
    role: "Chủ hương",
    description: "Ngày kỵ nhật Cụ Bà Khởi Nghiệp, con cháu dâng lễ chay và mâm quả cúng tạ ơn đức sinh thành."
  },
  {
    id: "mem_3",
    title: "Lễ Giỗ Cụ Trưởng Chi Đời 2 Lê Khắc Trợ",
    lunarDate: "15/05 Âm lịch",
    solarDateEstimated: "19/06/2026",
    targetPersonName: "Cụ Lê Khắc Trợ",
    generation: 2,
    branch: "Chi Trưởng",
    location: "Nhà thờ Chi Trưởng họ Lê Khắc",
    hostPerson: "Ông Lê Khắc Hiền & Ông Lê Khắc Tuấn",
    role: "Trưởng Chi chủ tế",
    description: "Giỗ cụ Trưởng Chi Đời 2, họp mặt con cháu Chi Trưởng để bàn việc tu bổ phòng thờ chi họ."
  },
  {
    id: "mem_4",
    title: "Lễ Giỗ Cụ Chi Đệ Nhị Lê Khắc Nhuận",
    lunarDate: "20/08 Âm lịch",
    solarDateEstimated: "30/09/2026",
    targetPersonName: "Cụ Lê Khắc Nhuận",
    generation: 2,
    branch: "Chi Hai",
    location: "Nhà thờ Chi Hai họ Lê Khắc",
    hostPerson: "Ông Lê Khắc Tài (Trưởng Chi 2)",
    role: "Chủ tế Chi Hai",
    description: "Ngày kỵ nhật Cụ Chi Hai, con cháu Chi 2 ở Hà Nội và các tỉnh về dâng hương."
  },
  {
    id: "mem_5",
    title: "Lễ Giỗ Cụ Chi Đệ Tam Lê Khắc Hối",
    lunarDate: "06/02 Âm lịch",
    solarDateEstimated: "24/03/2026",
    targetPersonName: "Cụ Lê Khắc Hối",
    generation: 2,
    branch: "Chi Ba",
    location: "Nhà thờ Chi Ba",
    hostPerson: "Ông Lê Khắc Quang (Trưởng Chi 3)",
    role: "Chủ tế Chi Ba",
    description: "Lễ giỗ cụ Chi 3, kết hợp dâng lễ tạ ơn cụ cứu giúp người cơ nhỡ."
  }
];

export const INITIAL_CLAN_NEWS: ClanNewsEvent[] = [
  {
    id: "news_1",
    title: "Thông Báo: Đại Lễ Giỗ Tổ và Họp Mặt Toàn Tộc Xuân Bính Ngọ 2026",
    date: "20/02/2026",
    category: "le_hoi",
    isPinned: true,
    summary: "Đại lễ Giỗ Cụ Thủy Tổ sẽ diễn ra trang trọng vào sáng ngày 10/3 Âm lịch tại Từ Đường. Kính mời toàn thể con cháu sắp xếp về dự lễ.",
    content: "Ban Trị Sự trân trọng thông báo lịch trình Đại Lễ Giỗ Tổ: 07h30 đón tiếp bà con con cháu; 08h30 Nghi thức Dâng Hương Tế Lễ Đại Chúng; 09h30 Lễ Vinh Danh Con Cháu Đỗ Đạt & Trao Học Bổng Khuyến Học; 11h00 Thụ lộc gia tộc tại khuôn viên Nhà thờ.",
    location: "Từ đường họ Lê Khắc, Hưng Yên"
  },
  {
    id: "news_2",
    title: "Báo Cáo Tiến Độ: Hoàn Thành Trùng Tu Hậu Cung & Tôn Tạo Lăng Mộ",
    date: "10/01/2026",
    category: "tu_bo",
    summary: "Công trình nâng cấp sân từ đường lát đá hoa cương và chống dột mái hậu cung đã hoàn tất trước Tết Nguyên Đán với tổng kinh phí 280 triệu đồng từ tiền công đức.",
    content: "Nhờ sự chung tay đóng góp của bà con nội ngoại, công trình đại tu hậu cung và lăng mộ cụ Thủy Tổ đã hoàn thành khang trang, tôn nghiêm, đảm bảo an toàn cho các kỳ tế lễ mưa bão.",
    location: "Khuôn viên Từ đường & Nghĩa trang dòng họ"
  },
  {
    id: "news_3",
    title: "Lễ Mừng Thọ Các Bậc Cao Niên & Trao Quà Tết Bính Ngọ",
    date: "05/02/2026",
    category: "chuc_tho",
    summary: "Ban Trị Sự đã đến tư gia trao khánh mừng thọ cho 6 cụ cao niên tròn 80, 85 và 90 tuổi trong dòng họ.",
    content: "Tôn vinh và mừng thọ các cụ cao niên là truyền thống đạo lý tốt đẹp của họ Lê Khắc. Kính chúc các cụ bách niên giai lão, đại thọ vô biên, làm bóng mát chở che cho cháu con.",
    location: "Tư gia các cụ cao niên"
  }
];

export const INITIAL_FUND_RECORDS: ClanFundRecord[] = [
  {
    id: "fund_1",
    contributorName: "Gia đình Ông Lê Khắc Tuấn (Tộc trưởng)",
    generation: 5,
    branch: "Chi Trưởng",
    amount: 50000000,
    date: "15/01/2026",
    category: "tu_bo_tu_duong",
    purpose: "Cung tiến tu bổ mái Hậu Cung và xây dựng hệ thống Gia Phả Số",
    note: "Đã chuyển vào tài khoản Quỹ Dòng Họ"
  },
  {
    id: "fund_2",
    contributorName: "Doanh nhân Lê Khắc Toàn & Con cháu Chi 2 tại Hà Nội",
    generation: 5,
    branch: "Chi Hai",
    amount: 30000000,
    date: "20/01/2026",
    category: "khuyen_hoc",
    purpose: "Tài trợ Quỹ Khuyến Học Lê Khắc năm 2026",
    note: "Dành riêng khen thưởng các cháu thi đại học và học sinh giỏi"
  },
  {
    id: "fund_3",
    contributorName: "Tiến sĩ Lê Khắc Huỳnh (ĐH Bách Khoa)",
    generation: 5,
    branch: "Chi Trưởng",
    amount: 15000000,
    date: "25/01/2026",
    category: "khuyen_hoc",
    purpose: "Học bổng tài năng trẻ Lê Khắc",
    note: "Khuyến khích các cháu ngành Khoa học Kỹ thuật"
  },
  {
    id: "fund_4",
    contributorName: "Bà con Con Cháu Chi Ba (Đại diện: Ông Lê Khắc Quang)",
    generation: 4,
    branch: "Chi Ba",
    amount: 25000000,
    date: "28/01/2026",
    category: "ngay_gio_to",
    purpose: "Đóng góp cỗ bàn và sắm sửa đồ tế khí chuẩn bị Giỗ Tổ 10/3",
    note: "Tiền mặt nộp Thủ quỹ"
  }
];

export const INITIAL_SCHOLARSHIPS: ClanScholarship[] = [
  {
    id: "sch_1",
    studentName: "Lê Khắc Minh Khang",
    generation: 6,
    branch: "Chi Trưởng",
    parentName: "Lê Khắc Tuấn & Hoàng Thị Minh Châu",
    schoolOrUniversity: "Đại học Quốc Gia Australia (ANU)",
    achievement: "Thủ khoa Tốt nghiệp THPT Chuyên Sư Phạm - Học bổng Toàn phần Melbourne",
    awardYear: 2024,
    rewardAmount: 10000000
  },
  {
    id: "sch_2",
    studentName: "Lê Khắc Gia Huy",
    generation: 6,
    branch: "Chi Trưởng",
    parentName: "Lê Khắc Huỳnh & Trần Kim Chi",
    schoolOrUniversity: "Đại học Bách Khoa Hà Nội",
    achievement: "Huy chương Vàng Olympic Tin học Trẻ Toàn Quốc & Điểm tuyển sinh 29.25",
    awardYear: 2025,
    rewardAmount: 8000000
  },
  {
    id: "sch_3",
    studentName: "Lê Khắc Bảo Trâm",
    generation: 6,
    branch: "Chi Trưởng",
    parentName: "Lê Khắc Tuấn & Hoàng Thị Minh Châu",
    schoolOrUniversity: "THPT Chuyên Hà Nội - Amsterdam",
    achievement: "Giải Nhì Học sinh Giỏi Tiếng Anh Quốc Gia Lớp 12",
    awardYear: 2025,
    rewardAmount: 5000000
  },
  {
    id: "sch_4",
    studentName: "Lê Khắc Quang Minh",
    generation: 6,
    branch: "Chi Hai",
    parentName: "Lê Khắc Toàn & Nguyễn Thị Diệu Linh",
    schoolOrUniversity: "Đại học Ngoại Thương",
    achievement: "Thủ khoa Khối A1 tỉnh Hưng Yên - Sinh viên 5 Tốt cấp Thành phố",
    awardYear: 2023,
    rewardAmount: 7000000
  }
];
