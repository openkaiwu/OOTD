import type { CategoryId, Garment, SeasonId } from "./types";

interface DemoGarmentSeed {
  id: string;
  name: string;
  image: string;
  categoryId: CategoryId;
  colorName: string;
  colorHex: string;
  materialId: string;
  seasonIds: SeasonId[];
  styleIds: string[];
  sceneIds: string[];
  tags: string[];
  favorite?: boolean;
  wearCount?: number;
  daysSinceWorn?: number;
}

const A = "/static/demo-wardrobe";
const O = "/static/wardrobe";
const IMG = {
  whiteShirt: A + "/white-shirt.jpg",
  madrasShirt: A + "/madras-shirt.jpg",
  greenShirt: A + "/green-shirt.jpg",
  miniSkirt: A + "/mini-skirt.jpg",
  blueJeans: A + "/blue-jeans.jpg",
  cyclingPants: A + "/cycling-pants.jpg",
  trainingPants: A + "/training-pants.jpg",
  fieldJacket: A + "/field-jacket.jpg",
  leatherCoat: A + "/leather-coat.jpg",
  jacketScarf: A + "/jacket-scarf.jpg",
  blackDress: A + "/black-dress.jpg",
  blueDress: A + "/blue-dress.jpg",
  redDress: A + "/red-dress.jpg",
  lilacDress: A + "/lilac-dress.jpg",
  roseDress: A + "/rose-dress.jpg",
  whiteSneakers: A + "/white-sneakers.jpg",
  asicsShoes: A + "/asics-shoes.jpg",
  runningShoes: A + "/running-shoes.jpg",
  blackHandbag: A + "/black-handbag.jpg",
  brownHandbag: A + "/brown-handbag.jpg",
  whiteDress: O + "/white-dress.png",
  lilacCardigan: O + "/lilac-cardigan.png",
  creamSandals: O + "/cream-sandals.png",
  lilacBag: O + "/lilac-bag.png",
};

/** 100 件女士时尚衣橱演示素材：覆盖春夏秋冬四季与衬衫、连衣裙、短裙、高跟鞋、平底鞋等品类。 */
const DEMO_GARMENT_SEEDS: DemoGarmentSeed[] = [
  // ---- 上衣（短袖/无袖）×16 ----
  { id: "demo_top_01", name: "法式泡泡袖碎花衬衫", image: IMG.madrasShirt, categoryId: "top-short", colorName: "多色", colorHex: "#8D79A8", materialId: "雪纺", seasonIds: ["spring", "summer"], styleIds: ["sweet", "retro"], sceneIds: ["date", "shopping"], tags: ["泡泡袖", "碎花"], favorite: true, wearCount: 6, daysSinceWorn: 4 },
  { id: "demo_top_02", name: "雾蓝缎面吊带上衣", image: IMG.blueDress, categoryId: "top-short", colorName: "蓝色", colorHex: "#AFC9DD", materialId: "丝绸", seasonIds: ["summer"], styleIds: ["elegant", "formal"], sceneIds: ["date", "party"], tags: ["缎面", "吊带"], wearCount: 2, daysSinceWorn: 22 },
  { id: "demo_top_03", name: "蔷薇粉方领泡泡袖衬衫", image: IMG.whiteShirt, categoryId: "top-short", colorName: "粉色", colorHex: "#E5A9B9", materialId: "棉", seasonIds: ["spring", "summer"], styleIds: ["sweet", "elegant"], sceneIds: ["date", "coffee"], tags: ["方领", "法式"], favorite: true, wearCount: 7, daysSinceWorn: 3 },
  { id: "demo_top_04", name: "奶油白木耳边短袖衬衫", image: IMG.whiteShirt, categoryId: "top-short", colorName: "白色", colorHex: "#F5F2EA", materialId: "棉", seasonIds: ["spring", "summer"], styleIds: ["sweet", "minimal"], sceneIds: ["weekend", "coffee"], tags: ["木耳边", "短袖"], wearCount: 4, daysSinceWorn: 9 },
  { id: "demo_top_05", name: "薰衣草紫蝴蝶结吊带", image: IMG.lilacDress, categoryId: "top-short", colorName: "紫色", colorHex: "#9B7BE9", materialId: "雪纺", seasonIds: ["summer"], styleIds: ["fairy", "elegant"], sceneIds: ["date", "festival"], tags: ["蝴蝶结", "香芋紫"], wearCount: 1, daysSinceWorn: 35 },
  { id: "demo_top_06", name: "黑色方领修身针织背心", image: IMG.blackDress, categoryId: "top-short", colorName: "黑色", colorHex: "#26242A", materialId: "针织", seasonIds: ["summer"], styleIds: ["minimal", "street"], sceneIds: ["party", "weekend"], tags: ["方领", "内搭"], wearCount: 5, daysSinceWorn: 7 },
  { id: "demo_top_07", name: "蜜桃粉垂感缎面短袖", image: IMG.roseDress, categoryId: "top-short", colorName: "粉色", colorHex: "#D8A5AE", materialId: "丝绸", seasonIds: ["spring", "summer"], styleIds: ["elegant", "minimal"], sceneIds: ["commute", "coffee"], tags: ["垂感", "缎面"], favorite: true, wearCount: 8, daysSinceWorn: 2 },
  { id: "demo_top_08", name: "白色蕾丝镂空短袖衬衫", image: IMG.whiteShirt, categoryId: "top-short", colorName: "白色", colorHex: "#F4F2EE", materialId: "棉", seasonIds: ["spring", "summer"], styleIds: ["sweet", "fairy"], sceneIds: ["date", "beach"], tags: ["蕾丝", "镂空"], wearCount: 3, daysSinceWorn: 14 },
  { id: "demo_top_09", name: "孔雀绿真丝吊带背心", image: IMG.greenShirt, categoryId: "top-short", colorName: "绿色", colorHex: "#1F6E5C", materialId: "丝绸", seasonIds: ["summer"], styleIds: ["elegant", "formal"], sceneIds: ["party", "festival"], tags: ["真丝", "吊带"], wearCount: 2, daysSinceWorn: 26 },
  { id: "demo_top_10", name: "樱桃红爱心领T恤", image: IMG.redDress, categoryId: "top-short", colorName: "红色", colorHex: "#C73A46", materialId: "棉", seasonIds: ["spring", "summer"], styleIds: ["casual", "street"], sceneIds: ["weekend", "shopping"], tags: ["基础款", "亮色"], wearCount: 9, daysSinceWorn: 1 },
  { id: "demo_top_11", name: "蓝白条纹海魂风衬衫", image: IMG.madrasShirt, categoryId: "top-short", colorName: "蓝色", colorHex: "#82B5DE", materialId: "棉", seasonIds: ["spring", "summer"], styleIds: ["casual", "street"], sceneIds: ["beach", "weekend"], tags: ["条纹", "度假"], wearCount: 4, daysSinceWorn: 11 },
  { id: "demo_top_12", name: "香草黄方领短袖衬衫", image: IMG.whiteShirt, categoryId: "top-short", colorName: "黄色", colorHex: "#F1C84A", materialId: "棉", seasonIds: ["spring", "summer"], styleIds: ["sweet", "casual"], sceneIds: ["date", "weekend"], tags: ["方领", "奶油黄"], wearCount: 2, daysSinceWorn: 18 },
  { id: "demo_top_13", name: "薄荷绿褶皱吊带上衣", image: IMG.greenShirt, categoryId: "top-short", colorName: "绿色", colorHex: "#788774", materialId: "雪纺", seasonIds: ["summer"], styleIds: ["minimal", "casual"], sceneIds: ["coffee", "shopping"], tags: ["褶皱", "薄荷绿"], favorite: true, wearCount: 3, daysSinceWorn: 6 },
  { id: "demo_top_14", name: "灰紫罗纹修身背心", image: IMG.lilacDress, categoryId: "top-short", colorName: "紫色", colorHex: "#B993C8", materialId: "针织", seasonIds: ["spring", "summer"], styleIds: ["minimal", "street"], sceneIds: ["weekend", "sport"], tags: ["罗纹", "内搭"], wearCount: 6, daysSinceWorn: 5 },
  { id: "demo_top_15", name: "奶咖色蝴蝶结缎面上衣", image: IMG.roseDress, categoryId: "top-short", colorName: "米色", colorHex: "#CBB8A0", materialId: "丝绸", seasonIds: ["spring", "autumn"], styleIds: ["elegant", "retro"], sceneIds: ["coffee", "office"], tags: ["蝴蝶结", "通勤"], wearCount: 5, daysSinceWorn: 8 },
  { id: "demo_top_16", name: "酒红丝绒方领上衣", image: IMG.redDress, categoryId: "top-short", colorName: "红色", colorHex: "#8C2838", materialId: "聚酯纤维", seasonIds: ["autumn", "winter"], styleIds: ["retro", "elegant"], sceneIds: ["party", "festival"], tags: ["丝绒", "复古"], favorite: true, wearCount: 2, daysSinceWorn: 30 },

  // ---- 女式衬衫与针织（长袖）×12 ----
  { id: "demo_toplong_01", name: "白色廓形通勤衬衫", image: IMG.whiteShirt, categoryId: "top-long", colorName: "白色", colorHex: "#F4F2EE", materialId: "棉", seasonIds: ["spring", "autumn"], styleIds: ["business", "minimal"], sceneIds: ["commute", "office", "interview"], tags: ["廓形", "通勤"], favorite: true, wearCount: 12, daysSinceWorn: 2 },
  { id: "demo_toplong_02", name: "蓝条纹系带长袖衬衫", image: IMG.madrasShirt, categoryId: "top-long", colorName: "蓝色", colorHex: "#82B5DE", materialId: "棉", seasonIds: ["spring", "autumn"], styleIds: ["casual", "business"], sceneIds: ["weekend", "office"], tags: ["系带", "条纹"], wearCount: 6, daysSinceWorn: 10 },
  { id: "demo_toplong_03", name: "鼠尾草绿收腰长袖衬衫", image: IMG.greenShirt, categoryId: "top-long", colorName: "绿色", colorHex: "#788774", materialId: "棉", seasonIds: ["spring", "autumn"], styleIds: ["casual", "minimal"], sceneIds: ["weekend", "coffee"], tags: ["收腰", "绿衬衫"], wearCount: 4, daysSinceWorn: 15 },
  { id: "demo_toplong_04", name: "燕麦色麻花针织毛衣", image: IMG.roseDress, categoryId: "top-long", colorName: "米色", colorHex: "#C8B2A2", materialId: "针织", seasonIds: ["autumn", "winter"], styleIds: ["minimal", "elegant"], sceneIds: ["coffee", "date"], tags: ["麻花", "毛衣"], favorite: true, wearCount: 10, daysSinceWorn: 3 },
  { id: "demo_toplong_05", name: "象牙白木耳边长袖衬衫", image: IMG.whiteShirt, categoryId: "top-long", colorName: "白色", colorHex: "#F5F2EA", materialId: "棉", seasonIds: ["spring", "autumn"], styleIds: ["sweet", "elegant"], sceneIds: ["date", "office"], tags: ["木耳边", "法式"], wearCount: 5, daysSinceWorn: 9 },
  { id: "demo_toplong_06", name: "黑色飘带垂感衬衫", image: IMG.blackDress, categoryId: "top-long", colorName: "黑色", colorHex: "#26242A", materialId: "聚酯纤维", seasonIds: ["spring", "autumn"], styleIds: ["formal", "business"], sceneIds: ["interview", "office"], tags: ["飘带", "通勤"], wearCount: 8, daysSinceWorn: 4 },
  { id: "demo_toplong_07", name: "蜜橘色麻花圆领毛衣", image: IMG.roseDress, categoryId: "top-long", colorName: "橙色", colorHex: "#E88A3D", materialId: "针织", seasonIds: ["autumn", "winter"], styleIds: ["sweet", "casual"], sceneIds: ["weekend", "shopping"], tags: ["麻花", "亮色"], wearCount: 6, daysSinceWorn: 12 },
  { id: "demo_toplong_08", name: "雾霾蓝高领针织衫", image: IMG.blueDress, categoryId: "top-long", colorName: "蓝色", colorHex: "#AFC9DD", materialId: "针织", seasonIds: ["autumn", "winter"], styleIds: ["minimal", "elegant"], sceneIds: ["commute", "coffee"], tags: ["高领", "打底"], favorite: true, wearCount: 11, daysSinceWorn: 1 },
  { id: "demo_toplong_09", name: "芥末黄灯芯绒衬衫", image: IMG.madrasShirt, categoryId: "top-long", colorName: "黄色", colorHex: "#D9A62E", materialId: "棉", seasonIds: ["autumn", "winter"], styleIds: ["retro", "casual"], sceneIds: ["weekend", "coffee"], tags: ["灯芯绒", "复古"], wearCount: 3, daysSinceWorn: 20 },
  { id: "demo_toplong_10", name: "浆果紫罗纹长袖上衣", image: IMG.lilacDress, categoryId: "top-long", colorName: "紫色", colorHex: "#7A4AD6", materialId: "针织", seasonIds: ["autumn", "winter"], styleIds: ["elegant", "minimal"], sceneIds: ["date", "party"], tags: ["罗纹", "浆果色"], wearCount: 4, daysSinceWorn: 13 },
  { id: "demo_toplong_11", name: "复古波点雪纺长袖衬衫", image: IMG.whiteShirt, categoryId: "top-long", colorName: "多色", colorHex: "#8D79A8", materialId: "雪纺", seasonIds: ["spring", "autumn"], styleIds: ["retro", "sweet"], sceneIds: ["date", "coffee"], tags: ["波点", "雪纺"], favorite: true, wearCount: 7, daysSinceWorn: 5 },
  { id: "demo_toplong_12", name: "奶白色羊绒开衫式上衣", image: IMG.roseDress, categoryId: "top-long", colorName: "白色", colorHex: "#EEE8DC", materialId: "羊毛", seasonIds: ["spring", "winter"], styleIds: ["minimal", "elegant"], sceneIds: ["office", "commute"], tags: ["羊绒", "温柔"], wearCount: 9, daysSinceWorn: 6 },

  // ---- 连衣裙 ×16 ----
  { id: "demo_dress", name: "白色蕾丝浪漫长裙", image: IMG.whiteDress, categoryId: "dress", colorName: "白色", colorHex: "#F5F5F5", materialId: "雪纺", seasonIds: ["spring", "summer"], styleIds: ["elegant", "sweet"], sceneIds: ["date", "beach"], tags: ["蕾丝", "仙女风"], favorite: true, wearCount: 4, daysSinceWorn: 13 },
  { id: "demo_dress_02", name: "樱桃红垂褶派对短裙", image: IMG.redDress, categoryId: "dress", colorName: "红色", colorHex: "#C52F3E", materialId: "聚酯纤维", seasonIds: ["summer"], styleIds: ["sweet", "street"], sceneIds: ["party", "festival"], tags: ["垂褶", "亮色"], wearCount: 2, daysSinceWorn: 29 },
  { id: "demo_dress_03", name: "宝蓝围巾领丝缎裙", image: IMG.blueDress, categoryId: "dress", colorName: "蓝色", colorHex: "#1267A4", materialId: "丝绸", seasonIds: ["spring", "summer"], styleIds: ["elegant", "formal"], sceneIds: ["date", "party"], tags: ["丝缎", "晚宴"], favorite: true, wearCount: 3, daysSinceWorn: 18 },
  { id: "demo_dress_04", name: "黑色低腰复古长袖裙", image: IMG.blackDress, categoryId: "dress", colorName: "黑色", colorHex: "#242126", materialId: "聚酯纤维", seasonIds: ["spring", "autumn", "winter"], styleIds: ["retro", "formal"], sceneIds: ["coffee", "party"], tags: ["复古", "长袖"], wearCount: 1, daysSinceWorn: 46 },
  { id: "demo_dress_05", name: "燕麦色直筒针织连衣裙", image: IMG.roseDress, categoryId: "dress", colorName: "米色", colorHex: "#C8B2A2", materialId: "针织", seasonIds: ["spring", "autumn"], styleIds: ["minimal", "elegant"], sceneIds: ["commute", "coffee"], tags: ["针织", "直筒"], wearCount: 5, daysSinceWorn: 8 },
  { id: "demo_dress_06", name: "阳光黄收腰衬衫长裙", image: IMG.lilacDress, categoryId: "dress", colorName: "黄色", colorHex: "#F2C438", materialId: "棉", seasonIds: ["spring", "summer"], styleIds: ["elegant", "resort"], sceneIds: ["date", "beach"], tags: ["衬衫裙", "收腰"], favorite: true, wearCount: 2, daysSinceWorn: 10 },
  { id: "demo_dress_07", name: "薰衣草紫吊带碎花长裙", image: IMG.lilacDress, categoryId: "dress", colorName: "紫色", colorHex: "#9B7BE9", materialId: "雪纺", seasonIds: ["summer"], styleIds: ["fairy", "resort"], sceneIds: ["beach", "date"], tags: ["碎花", "吊带"], wearCount: 3, daysSinceWorn: 16 },
  { id: "demo_dress_08", name: "赫本风小黑裙", image: IMG.blackDress, categoryId: "dress", colorName: "黑色", colorHex: "#232126", materialId: "聚酯纤维", seasonIds: ["spring", "autumn"], styleIds: ["formal", "elegant"], sceneIds: ["party", "ceremony"], tags: ["小黑裙", "赫本风"], favorite: true, wearCount: 6, daysSinceWorn: 7 },
  { id: "demo_dress_09", name: "奶油白法式茶歇裙", image: IMG.roseDress, categoryId: "dress", colorName: "白色", colorHex: "#F5F2EA", materialId: "雪纺", seasonIds: ["spring", "summer"], styleIds: ["retro", "sweet"], sceneIds: ["date", "coffee"], tags: ["茶歇裙", "V领"], wearCount: 4, daysSinceWorn: 12 },
  { id: "demo_dress_10", name: "雾蓝缎面鱼尾礼服裙", image: IMG.blueDress, categoryId: "dress", colorName: "蓝色", colorHex: "#7FA8CE", materialId: "丝绸", seasonIds: ["spring", "autumn"], styleIds: ["formal", "elegant"], sceneIds: ["ceremony", "wedding"], tags: ["鱼尾", "礼服"], wearCount: 1, daysSinceWorn: 52 },
  { id: "demo_dress_11", name: "玫瑰粉轻纱公主蓬蓬裙", image: IMG.redDress, categoryId: "dress", colorName: "粉色", colorHex: "#E5A9B9", materialId: "雪纺", seasonIds: ["summer"], styleIds: ["fairy", "sweet"], sceneIds: ["festival", "performance"], tags: ["蓬蓬裙", "轻纱"], wearCount: 2, daysSinceWorn: 33 },
  { id: "demo_dress_12", name: "墨绿丝绒旗袍式连衣裙", image: IMG.greenShirt, categoryId: "dress", colorName: "绿色", colorHex: "#1F4E3D", materialId: "聚酯纤维", seasonIds: ["autumn", "winter"], styleIds: ["retro", "elegant"], sceneIds: ["wedding", "ceremony"], tags: ["旗袍", "丝绒"], favorite: true, wearCount: 2, daysSinceWorn: 24 },
  { id: "demo_dress_13", name: "波点泡泡袖度假短裙", image: IMG.madrasShirt, categoryId: "dress", colorName: "多色", colorHex: "#8D79A8", materialId: "棉", seasonIds: ["summer"], styleIds: ["resort", "casual"], sceneIds: ["beach", "weekend"], tags: ["波点", "泡泡袖"], wearCount: 3, daysSinceWorn: 21 },
  { id: "demo_dress_14", name: "灰蓝条纹衬衫连衣裙", image: IMG.whiteShirt, categoryId: "dress", colorName: "蓝色", colorHex: "#8CA3C0", materialId: "棉", seasonIds: ["spring", "summer"], styleIds: ["minimal", "casual"], sceneIds: ["weekend", "office"], tags: ["衬衫裙", "条纹"], wearCount: 6, daysSinceWorn: 9 },
  { id: "demo_dress_15", name: "焦糖棕灯芯绒背带裙", image: IMG.roseDress, categoryId: "dress", colorName: "棕色", colorHex: "#9A6038", materialId: "棉", seasonIds: ["autumn", "winter"], styleIds: ["retro", "casual"], sceneIds: ["weekend", "coffee"], tags: ["背带裙", "灯芯绒"], wearCount: 4, daysSinceWorn: 17 },
  { id: "demo_dress_16", name: "银灰亮片派对连衣裙", image: IMG.blackDress, categoryId: "dress", colorName: "灰色", colorHex: "#8E8E92", materialId: "聚酯纤维", seasonIds: ["autumn", "winter"], styleIds: ["street", "retro"], sceneIds: ["festival", "party"], tags: ["亮片", "派对"], wearCount: 1, daysSinceWorn: 40 },

  // ---- 半身裙/短裙 ×12 ----
  { id: "demo_skirt_01", name: "浅蓝牛仔A字短裙", image: IMG.miniSkirt, categoryId: "skirt", colorName: "蓝色", colorHex: "#7899B8", materialId: "牛仔", seasonIds: ["spring", "summer"], styleIds: ["casual", "sweet"], sceneIds: ["date", "shopping"], tags: ["A字", "短裙"], wearCount: 6, daysSinceWorn: 7 },
  { id: "demo_skirt_02", name: "玫瑰米低腰百褶中裙", image: IMG.roseDress, categoryId: "skirt", colorName: "米色", colorHex: "#D1BBAE", materialId: "聚酯纤维", seasonIds: ["spring", "autumn"], styleIds: ["elegant", "retro"], sceneIds: ["commute", "coffee"], tags: ["百褶", "中长款"], favorite: true, wearCount: 5, daysSinceWorn: 10 },
  { id: "demo_skirt_03", name: "宝蓝斜裁丝缎半身裙", image: IMG.blueDress, categoryId: "skirt", colorName: "蓝色", colorHex: "#1466A0", materialId: "丝绸", seasonIds: ["spring", "summer"], styleIds: ["elegant", "formal"], sceneIds: ["date", "party"], tags: ["丝缎", "斜裁"], wearCount: 2, daysSinceWorn: 21 },
  { id: "demo_skirt_04", name: "淡紫透视叠层长裙", image: IMG.lilacDress, categoryId: "skirt", colorName: "紫色", colorHex: "#B993C8", materialId: "雪纺", seasonIds: ["spring", "summer"], styleIds: ["fairy", "sweet"], sceneIds: ["date", "beach"], tags: ["飘逸", "长裙"], wearCount: 1, daysSinceWorn: 34 },
  { id: "demo_skirt_05", name: "黑色修身直筒中长裙", image: IMG.blackDress, categoryId: "skirt", colorName: "黑色", colorHex: "#232126", materialId: "聚酯纤维", seasonIds: ["spring", "autumn", "winter"], styleIds: ["minimal", "formal"], sceneIds: ["office", "interview"], tags: ["中长款", "百搭"], wearCount: 7, daysSinceWorn: 6 },
  { id: "demo_skirt_06", name: "云朵白泡泡摆短裙", image: IMG.miniSkirt, categoryId: "skirt", colorName: "白色", colorHex: "#F5F2EB", materialId: "棉", seasonIds: ["spring", "summer"], styleIds: ["sweet", "street"], sceneIds: ["date", "shopping"], tags: ["泡泡摆", "短裙"], favorite: true, wearCount: 2, daysSinceWorn: 13 },
  { id: "demo_skirt_07", name: "樱桃红高腰A字短裙", image: IMG.redDress, categoryId: "skirt", colorName: "红色", colorHex: "#C52F3E", materialId: "聚酯纤维", seasonIds: ["spring", "autumn"], styleIds: ["sweet", "retro"], sceneIds: ["date", "weekend"], tags: ["高腰", "A字"], wearCount: 5, daysSinceWorn: 8 },
  { id: "demo_skirt_08", name: "灰色伞状复古半身长裙", image: IMG.blackDress, categoryId: "skirt", colorName: "灰色", colorHex: "#8E8E92", materialId: "聚酯纤维", seasonIds: ["spring", "autumn"], styleIds: ["elegant", "retro"], sceneIds: ["coffee", "ceremony"], tags: ["伞状", "复古"], wearCount: 3, daysSinceWorn: 19 },
  { id: "demo_skirt_09", name: "芥末黄百褶短裙", image: IMG.madrasShirt, categoryId: "skirt", colorName: "黄色", colorHex: "#D9A62E", materialId: "聚酯纤维", seasonIds: ["spring", "autumn"], styleIds: ["casual", "street"], sceneIds: ["weekend", "shopping"], tags: ["百褶", "短裙"], wearCount: 4, daysSinceWorn: 11 },
  { id: "demo_skirt_10", name: "奶咖色鱼尾中长裙", image: IMG.roseDress, categoryId: "skirt", colorName: "米色", colorHex: "#CBB8A0", materialId: "聚酯纤维", seasonIds: ["spring", "autumn"], styleIds: ["elegant", "minimal"], sceneIds: ["office", "date"], tags: ["鱼尾", "中长"], wearCount: 3, daysSinceWorn: 15 },
  { id: "demo_skirt_11", name: "雾霾蓝牛仔半身长裙", image: IMG.blueJeans, categoryId: "skirt", colorName: "蓝色", colorHex: "#8CA3C0", materialId: "牛仔", seasonIds: ["spring", "autumn"], styleIds: ["casual", "minimal"], sceneIds: ["weekend", "shopping"], tags: ["牛仔", "中长款"], favorite: true, wearCount: 6, daysSinceWorn: 5 },
  { id: "demo_skirt_12", name: "白色蕾丝蛋糕短裙", image: IMG.miniSkirt, categoryId: "skirt", colorName: "白色", colorHex: "#F5F2EA", materialId: "棉", seasonIds: ["summer"], styleIds: ["fairy", "sweet"], sceneIds: ["date", "festival"], tags: ["蕾丝", "蛋糕裙"], wearCount: 1, daysSinceWorn: 37 },

  // ---- 女士裤装 ×12 ----
  { id: "demo_pants_01", name: "深蓝高腰直筒牛仔裤", image: IMG.blueJeans, categoryId: "pants", colorName: "蓝色", colorHex: "#35557D", materialId: "牛仔", seasonIds: ["spring", "autumn", "winter"], styleIds: ["casual", "street"], sceneIds: ["weekend", "shopping"], tags: ["高腰", "直筒"], favorite: true, wearCount: 14, daysSinceWorn: 2 },
  { id: "demo_pants_02", name: "黑色修身西装烟管裤", image: IMG.leatherCoat, categoryId: "pants", colorName: "黑色", colorHex: "#1F2024", materialId: "羊毛", seasonIds: ["spring", "autumn", "winter"], styleIds: ["business", "formal"], sceneIds: ["commute", "office", "interview"], tags: ["烟管裤", "通勤"], wearCount: 9, daysSinceWorn: 4 },
  { id: "demo_pants_03", name: "奶油白垂感阔腿裤", image: IMG.cyclingPants, categoryId: "pants", colorName: "白色", colorHex: "#EEE8DC", materialId: "聚酯纤维", seasonIds: ["spring", "summer", "autumn"], styleIds: ["minimal", "elegant"], sceneIds: ["commute", "coffee"], tags: ["垂感", "阔腿"], favorite: true, wearCount: 8, daysSinceWorn: 5 },
  { id: "demo_pants_04", name: "浅粉高腰微喇牛仔裤", image: IMG.blueJeans, categoryId: "pants", colorName: "粉色", colorHex: "#D8A5AE", materialId: "牛仔", seasonIds: ["spring", "autumn"], styleIds: ["casual", "sweet"], sceneIds: ["date", "weekend"], tags: ["微喇", "高腰"], wearCount: 5, daysSinceWorn: 9 },
  { id: "demo_pants_05", name: "灰紫纸袋腰西装裤", image: IMG.lilacDress, categoryId: "pants", colorName: "紫色", colorHex: "#B993C8", materialId: "聚酯纤维", seasonIds: ["spring", "autumn"], styleIds: ["elegant", "business"], sceneIds: ["office", "commute"], tags: ["纸袋腰", "通勤"], wearCount: 6, daysSinceWorn: 7 },
  { id: "demo_pants_06", name: "复古格纹阔腿裤", image: IMG.madrasShirt, categoryId: "pants", colorName: "多色", colorHex: "#8D79A8", materialId: "羊毛", seasonIds: ["autumn", "winter"], styleIds: ["retro", "casual"], sceneIds: ["coffee", "weekend"], tags: ["格纹", "阔腿"], wearCount: 4, daysSinceWorn: 14 },
  { id: "demo_pants_07", name: "黑色皮质直筒裤", image: IMG.leatherCoat, categoryId: "pants", colorName: "黑色", colorHex: "#252326", materialId: "皮革", seasonIds: ["autumn", "winter"], styleIds: ["street", "retro"], sceneIds: ["party", "shopping"], tags: ["皮质", "直筒"], wearCount: 3, daysSinceWorn: 23 },
  { id: "demo_pants_08", name: "卡其束脚工装裤", image: IMG.trainingPants, categoryId: "pants", colorName: "棕色", colorHex: "#8A765D", materialId: "棉", seasonIds: ["spring", "autumn"], styleIds: ["casual", "sporty"], sceneIds: ["hiking", "weekend"], tags: ["工装", "束脚"], wearCount: 4, daysSinceWorn: 16 },
  { id: "demo_pants_09", name: "云灰运动瑜伽裤", image: IMG.cyclingPants, categoryId: "pants", colorName: "灰色", colorHex: "#9AA09C", materialId: "聚酯纤维", seasonIds: ["spring", "summer", "autumn"], styleIds: ["sporty", "casual"], sceneIds: ["sport", "hiking"], tags: ["瑜伽", "速干"], wearCount: 12, daysSinceWorn: 2 },
  { id: "demo_pants_10", name: "象牙白西装短裤", image: IMG.cyclingPants, categoryId: "pants", colorName: "白色", colorHex: "#F5F2EA", materialId: "聚酯纤维", seasonIds: ["summer"], styleIds: ["minimal", "business"], sceneIds: ["office", "weekend"], tags: ["短裤", "西装"], wearCount: 3, daysSinceWorn: 25 },
  { id: "demo_pants_11", name: "酒红天鹅绒喇叭裤", image: IMG.trainingPants, categoryId: "pants", colorName: "红色", colorHex: "#8C2838", materialId: "聚酯纤维", seasonIds: ["autumn", "winter"], styleIds: ["retro", "elegant"], sceneIds: ["party", "festival"], tags: ["天鹅绒", "喇叭"], wearCount: 2, daysSinceWorn: 31 },
  { id: "demo_pants_12", name: "薄荷绿高腰雪纺阔腿裤", image: IMG.greenShirt, categoryId: "pants", colorName: "绿色", colorHex: "#8FBFA8", materialId: "雪纺", seasonIds: ["spring", "summer"], styleIds: ["minimal", "resort"], sceneIds: ["beach", "shopping"], tags: ["雪纺", "度假"], wearCount: 2, daysSinceWorn: 28 },

  // ---- 外套 ×12 ----
  { id: "demo_cardigan", name: "薰衣草紫针织开衫", image: IMG.lilacCardigan, categoryId: "outerwear", colorName: "紫色", colorHex: "#9B7BE9", materialId: "针织", seasonIds: ["spring", "autumn"], styleIds: ["minimal", "elegant"], sceneIds: ["commute", "date", "coffee"], tags: ["开衫", "叠穿"], favorite: true, wearCount: 10, daysSinceWorn: 2 },
  { id: "demo_outer_02", name: "奶白色小香风外套", image: IMG.jacketScarf, categoryId: "outerwear", colorName: "白色", colorHex: "#F5F2EA", materialId: "聚酯纤维", seasonIds: ["spring", "autumn"], styleIds: ["elegant", "formal"], sceneIds: ["office", "date"], tags: ["小香风", "粗花呢"], favorite: true, wearCount: 6, daysSinceWorn: 6 },
  { id: "demo_outer_03", name: "驼色羊绒大衣", image: IMG.leatherCoat, categoryId: "outerwear", colorName: "米色", colorHex: "#C8B2A2", materialId: "羊毛", seasonIds: ["autumn", "winter"], styleIds: ["elegant", "minimal"], sceneIds: ["commute", "office"], tags: ["大衣", "羊绒"], wearCount: 8, daysSinceWorn: 5 },
  { id: "demo_outer_04", name: "黑色皮质机车夹克", image: IMG.leatherCoat, categoryId: "outerwear", colorName: "黑色", colorHex: "#252326", materialId: "皮革", seasonIds: ["autumn", "winter"], styleIds: ["street", "retro"], sceneIds: ["party", "weekend"], tags: ["机车", "皮质"], wearCount: 5, daysSinceWorn: 12 },
  { id: "demo_outer_05", name: "橄榄绿工装夹克", image: IMG.fieldJacket, categoryId: "outerwear", colorName: "绿色", colorHex: "#77745F", materialId: "棉", seasonIds: ["spring", "autumn"], styleIds: ["street", "casual"], sceneIds: ["weekend", "hiking"], tags: ["工装", "防风"], wearCount: 6, daysSinceWorn: 11 },
  { id: "demo_outer_06", name: "黑灰格纹西装外套", image: IMG.jacketScarf, categoryId: "outerwear", colorName: "灰色", colorHex: "#8E8E92", materialId: "羊毛", seasonIds: ["spring", "autumn"], styleIds: ["business", "formal"], sceneIds: ["office", "interview"], tags: ["格纹", "西装"], wearCount: 7, daysSinceWorn: 8 },
  { id: "demo_outer_07", name: "焦糖棕麂皮飞行夹克", image: IMG.leatherCoat, categoryId: "outerwear", colorName: "棕色", colorHex: "#6E4936", materialId: "皮革", seasonIds: ["autumn", "winter"], styleIds: ["retro", "street"], sceneIds: ["shopping", "coffee"], tags: ["麂皮", "飞行夹克"], favorite: true, wearCount: 3, daysSinceWorn: 18 },
  { id: "demo_outer_08", name: "雾粉色针织开衫", image: IMG.lilacCardigan, categoryId: "outerwear", colorName: "粉色", colorHex: "#E5A9B9", materialId: "针织", seasonIds: ["spring", "autumn"], styleIds: ["sweet", "minimal"], sceneIds: ["date", "coffee"], tags: ["开衫", "温柔"], wearCount: 5, daysSinceWorn: 9 },
  { id: "demo_outer_09", name: "米白色束腰风衣", image: IMG.jacketScarf, categoryId: "outerwear", colorName: "白色", colorHex: "#EEE8DC", materialId: "聚酯纤维", seasonIds: ["spring", "autumn"], styleIds: ["minimal", "elegant"], sceneIds: ["commute", "weekend"], tags: ["风衣", "束腰"], favorite: true, wearCount: 9, daysSinceWorn: 3 },
  { id: "demo_outer_10", name: "浆果紫羊毛短大衣", image: IMG.lilacDress, categoryId: "outerwear", colorName: "紫色", colorHex: "#7A4AD6", materialId: "羊毛", seasonIds: ["winter"], styleIds: ["elegant", "formal"], sceneIds: ["office", "ceremony"], tags: ["短大衣", "羊毛"], wearCount: 4, daysSinceWorn: 20 },
  { id: "demo_outer_11", name: "浅蓝短款牛仔外套", image: IMG.blueJeans, categoryId: "outerwear", colorName: "蓝色", colorHex: "#7899B8", materialId: "牛仔", seasonIds: ["spring", "autumn"], styleIds: ["casual", "street"], sceneIds: ["weekend", "shopping"], tags: ["牛仔", "短款"], wearCount: 8, daysSinceWorn: 7 },
  { id: "demo_outer_12", name: "蜜橘色泰迪熊外套", image: IMG.roseDress, categoryId: "outerwear", colorName: "橙色", colorHex: "#E88A3D", materialId: "聚酯纤维", seasonIds: ["winter"], styleIds: ["sweet", "casual"], sceneIds: ["weekend", "shopping"], tags: ["泰迪熊", "毛绒"], favorite: true, wearCount: 5, daysSinceWorn: 13 },

  // ---- 鞋 ×16（高跟鞋 6、平底鞋 5、凉鞋/运动 5）----
  { id: "demo_shoes", name: "奶油色编织坡跟凉鞋", image: IMG.creamSandals, categoryId: "shoes", colorName: "米色", colorHex: "#D8C9A8", materialId: "皮革", seasonIds: ["spring", "summer"], styleIds: ["casual", "elegant"], sceneIds: ["date", "beach"], tags: ["坡跟", "编织"], favorite: true, wearCount: 12, daysSinceWorn: 3 },
  { id: "demo_shoes_01", name: "黑色细跟高跟鞋", image: IMG.creamSandals, categoryId: "shoes", colorName: "黑色", colorHex: "#26242A", materialId: "皮革", seasonIds: ["spring", "summer", "autumn"], styleIds: ["elegant", "formal"], sceneIds: ["office", "party"], tags: ["高跟鞋", "细跟"], wearCount: 8, daysSinceWorn: 6 },
  { id: "demo_shoes_02", name: "裸粉色尖头细跟高跟鞋", image: IMG.creamSandals, categoryId: "shoes", colorName: "粉色", colorHex: "#E5C0B8", materialId: "皮革", seasonIds: ["spring", "summer"], styleIds: ["elegant", "minimal"], sceneIds: ["commute", "date"], tags: ["高跟鞋", "尖头"], favorite: true, wearCount: 6, daysSinceWorn: 9 },
  { id: "demo_shoes_03", name: "樱桃红漆皮玛丽珍高跟鞋", image: IMG.creamSandals, categoryId: "shoes", colorName: "红色", colorHex: "#B92F3D", materialId: "皮革", seasonIds: ["spring", "autumn"], styleIds: ["sweet", "retro"], sceneIds: ["date", "party"], tags: ["高跟鞋", "玛丽珍"], wearCount: 4, daysSinceWorn: 15 },
  { id: "demo_shoes_04", name: "银色亮片一字带高跟凉鞋", image: IMG.creamSandals, categoryId: "shoes", colorName: "灰色", colorHex: "#C9C9CD", materialId: "聚酯纤维", seasonIds: ["summer"], styleIds: ["street", "retro"], sceneIds: ["festival", "party"], tags: ["高跟鞋", "亮片"], wearCount: 2, daysSinceWorn: 27 },
  { id: "demo_shoes_05", name: "象牙白方头粗跟短靴", image: IMG.creamSandals, categoryId: "shoes", colorName: "白色", colorHex: "#EEE6D8", materialId: "皮革", seasonIds: ["autumn", "winter"], styleIds: ["elegant", "street"], sceneIds: ["office", "weekend"], tags: ["粗跟", "短靴"], wearCount: 5, daysSinceWorn: 11 },
  { id: "demo_shoes_06", name: "黑色尖头平底鞋", image: IMG.creamSandals, categoryId: "shoes", colorName: "黑色", colorHex: "#26242A", materialId: "皮革", seasonIds: ["spring", "summer", "autumn"], styleIds: ["minimal", "business"], sceneIds: ["commute", "office"], tags: ["平底鞋", "尖头"], favorite: true, wearCount: 13, daysSinceWorn: 1 },
  { id: "demo_shoes_07", name: "芭蕾粉绑带平底鞋", image: IMG.creamSandals, categoryId: "shoes", colorName: "粉色", colorHex: "#E5A9B9", materialId: "皮革", seasonIds: ["spring", "summer"], styleIds: ["sweet", "elegant"], sceneIds: ["date", "coffee"], tags: ["平底鞋", "绑带"], wearCount: 7, daysSinceWorn: 5 },
  { id: "demo_shoes_08", name: "焦糖棕乐福平底鞋", image: IMG.creamSandals, categoryId: "shoes", colorName: "棕色", colorHex: "#9A6038", materialId: "皮革", seasonIds: ["spring", "autumn"], styleIds: ["casual", "business"], sceneIds: ["office", "weekend"], tags: ["平底鞋", "乐福"], wearCount: 9, daysSinceWorn: 4 },
  { id: "demo_shoes_09", name: "雾霾蓝平底穆勒鞋", image: IMG.creamSandals, categoryId: "shoes", colorName: "蓝色", colorHex: "#AFC9DD", materialId: "皮革", seasonIds: ["spring", "summer"], styleIds: ["minimal", "casual"], sceneIds: ["coffee", "shopping"], tags: ["平底鞋", "穆勒"], wearCount: 5, daysSinceWorn: 8 },
  { id: "demo_shoes_10", name: "白色厚底帆布鞋", image: IMG.whiteSneakers, categoryId: "shoes", colorName: "白色", colorHex: "#F3F1E9", materialId: "棉", seasonIds: ["spring", "summer", "autumn"], styleIds: ["casual", "street"], sceneIds: ["weekend", "shopping"], tags: ["厚底", "帆布"], favorite: true, wearCount: 11, daysSinceWorn: 2 },
  { id: "demo_shoes_11", name: "银灰复古德训鞋", image: IMG.asicsShoes, categoryId: "shoes", colorName: "灰色", colorHex: "#77777A", materialId: "其他", seasonIds: ["spring", "summer", "autumn"], styleIds: ["sporty", "street"], sceneIds: ["shopping", "weekend"], tags: ["德训", "复古"], wearCount: 10, daysSinceWorn: 3 },
  { id: "demo_shoes_12", name: "黑色绑带罗马凉鞋", image: IMG.creamSandals, categoryId: "shoes", colorName: "黑色", colorHex: "#29292D", materialId: "皮革", seasonIds: ["summer"], styleIds: ["street", "retro"], sceneIds: ["weekend", "beach"], tags: ["凉鞋", "绑带"], wearCount: 3, daysSinceWorn: 24 },
  { id: "demo_shoes_13", name: "米色方头粗跟高跟鞋", image: IMG.creamSandals, categoryId: "shoes", colorName: "米色", colorHex: "#D8C9A8", materialId: "皮革", seasonIds: ["spring", "autumn", "winter"], styleIds: ["elegant", "business"], sceneIds: ["office", "date"], tags: ["高跟鞋", "粗跟"], wearCount: 6, daysSinceWorn: 7 },
  { id: "demo_shoes_14", name: "荧光粉厚底老爹鞋", image: IMG.runningShoes, categoryId: "shoes", colorName: "粉色", colorHex: "#E86A8A", materialId: "其他", seasonIds: ["spring", "summer"], styleIds: ["sporty", "street"], sceneIds: ["sport", "weekend"], tags: ["老爹鞋", "厚底"], wearCount: 6, daysSinceWorn: 10 },
  { id: "demo_shoes_15", name: "白色芭蕾风平底单鞋", image: IMG.creamSandals, categoryId: "shoes", colorName: "白色", colorHex: "#F5F2EA", materialId: "皮革", seasonIds: ["spring", "summer"], styleIds: ["elegant", "minimal"], sceneIds: ["office", "date"], tags: ["平底鞋", "芭蕾风"], favorite: true, wearCount: 8, daysSinceWorn: 4 },

  // ---- 女士包袋配饰 ×4 ----
  { id: "demo_bag", name: "淡紫色腋下包", image: IMG.lilacBag, categoryId: "accessory", colorName: "紫色", colorHex: "#9B7BE9", materialId: "皮革", seasonIds: ["spring", "summer", "autumn"], styleIds: ["elegant", "minimal"], sceneIds: ["date", "coffee"], tags: ["腋下包", "小包"], favorite: true, wearCount: 8, daysSinceWorn: 4 },
  { id: "demo_accessory_02", name: "黑色链条单肩包", image: IMG.blackHandbag, categoryId: "accessory", colorName: "黑色", colorHex: "#2A2522", materialId: "皮革", seasonIds: ["spring", "autumn", "winter"], styleIds: ["business", "elegant"], sceneIds: ["commute", "office"], tags: ["链条包", "通勤"], wearCount: 10, daysSinceWorn: 3 },
  { id: "demo_accessory_03", name: "焦糖棕松弛流浪包", image: IMG.brownHandbag, categoryId: "accessory", colorName: "棕色", colorHex: "#9A6038", materialId: "皮革", seasonIds: ["spring", "autumn", "winter"], styleIds: ["retro", "elegant"], sceneIds: ["coffee", "commute"], tags: ["流浪包", "复古"], favorite: true, wearCount: 6, daysSinceWorn: 12 },
  { id: "demo_accessory_04", name: "奶白色编织托特包", image: IMG.brownHandbag, categoryId: "accessory", colorName: "白色", colorHex: "#F5F2EA", materialId: "皮革", seasonIds: ["spring", "summer", "autumn"], styleIds: ["casual", "resort"], sceneIds: ["shopping", "beach"], tags: ["托特包", "编织"], wearCount: 5, daysSinceWorn: 14 },
];

export function createDemoGarments(now = Date.now()): Garment[] {
  return DEMO_GARMENT_SEEDS.map((seed, index) => {
    const createdAt = now - index * 3_600_000;
    return {
      id: seed.id,
      name: seed.name,
      imagePath: seed.image,
      thumbnailPath: seed.image,
      categoryId: seed.categoryId,
      colorName: seed.colorName,
      colorHex: seed.colorHex,
      materialId: seed.materialId,
      seasonIds: seed.seasonIds,
      styleIds: seed.styleIds,
      sceneIds: seed.sceneIds,
      tags: [...seed.tags, "模拟数据", "女士流行款"],
      favorite: seed.favorite ?? false,
      availability: "active",
      wearCount: seed.wearCount ?? 0,
      lastWornAt: seed.daysSinceWorn === undefined ? undefined : now - seed.daysSinceWorn * 86_400_000,
      createdAt,
      updatedAt: createdAt,
      schemaVersion: 2,
    };
  });
}
