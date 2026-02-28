
export const CATEGORIES = [
  "全部", "民间文学", "传统音乐", "传统舞蹈", "传统戏剧", 
  "曲艺", "体育杂技", "传统美术", "传统技艺", "传统医药", "民俗"
];

// 标准行政区划名称，确保与 GeoJSON 100% 匹配
const PROVINCES = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省', '吉林省', '黑龙江省', 
  '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', 
  '湖北省', '湖南省', '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省', '贵州省', 
  '云南省', '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区',
  '香港特别行政区', '澳门特别行政区', '台湾省'
];

const generateDatabase = () => {
  const db: Record<string, any> = {};
  
  CATEGORIES.forEach(cat => {
    // 为每个省份生成随机的项目数量，确保“全部”类别数据量最大
    const provinceData = PROVINCES.map(p => ({
      name: p,
      value: cat === "全部" 
        ? Math.floor(Math.random() * 260) + 80 
        : Math.floor(Math.random() * 50) + 5
    }));

    // 类别构成占比
    const categoryDistribution = CATEGORIES.slice(1).map(c => ({
      name: c,
      value: Math.floor(Math.random() * 400) + 100
    }));

    // 雷达图多维度评分
    const radarData = [
      Math.floor(Math.random() * 50) + 50, // 保护力度
      Math.floor(Math.random() * 50) + 40, // 流行广度
      Math.floor(Math.random() * 50) + 50, // 历史底蕴
      Math.floor(Math.random() * 50) + 30, // 数字化率
      Math.floor(Math.random() * 50) + 40  // 传承规模
    ];

    db[cat] = {
      provinceData,
      categoryDistribution,
      radarData,
      total: provinceData.reduce((acc, curr) => acc + curr.value, 0)
    };
  });
  
  return db;
};

export const database = generateDatabase();

export const discoveryItems = [
  { name: "苗族古歌", loc: "贵州省", type: "民间文学", date: "2024-05-12", desc: "苗族百科全书式英雄史诗。" },
  { name: "昆曲", loc: "江苏省", type: "传统戏剧", date: "2024-05-10", desc: "百戏之祖，雅部之冠。" },
  { name: "宣纸制作技艺", loc: "安徽省", type: "传统技艺", date: "2024-05-08", desc: "纸寿千年，墨韵万变。" },
  { name: "格萨尔", loc: "西藏自治区", type: "民间文学", date: "2024-05-05", desc: "活态史诗，英雄赞歌。" },
  { name: "龙泉青瓷", loc: "浙江省", type: "传统技艺", date: "2024-05-01", desc: "青如玉、明如镜、声如磬。" },
  { name: "中医针灸", loc: "北京市", type: "传统医药", date: "2024-04-28", desc: "经络之学，东方智慧。" },
  { name: "剪纸", loc: "陕西省", type: "传统美术", date: "2024-04-25", desc: "指尖艺术，民俗印记。" }
];
