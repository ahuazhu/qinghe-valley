"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";

type Tool = "hoe" | "seed" | "water" | "hand" | "rod" | "axe";
type TileState = "grass" | "soil" | "crop";
type Scene = "farm" | "westFriendFarm" | "mysteryRoad" | "town" | "cultureDistrict" | "residentialDistrict" | "eastNeighbor" | "southNeighbor" | "northNeighbor";
type NeighborScene = "eastNeighbor" | "southNeighbor" | "northNeighbor";
type ResidentHomeOwner = "白医生" | "阿麦" | "周镇长" | "沈馆长" | "诊所助手" | "许老师";
type BuildingId = "farmhouse" | "supermarket" | "townhall" | "clinic" | "cafe" | "workshop" | "library" | "museum" | "school";
type CropType = "radish" | "strawberry" | "corn" | "pineapple" | "watermelon" | "tomato" | "potato" | "pumpkin" | "blueberry";
type StorableResource = CropType | "fish";
type VillageId = "qinghe" | "maple";
type Facing = "down" | "up" | "left" | "right";
type Weather = "sunny" | "cloudy" | "rain" | "thunder";
type MallItem = "redCoat" | "blueOutfit" | "umbrella" | "seedBox";
type FestivalId = "seeds" | "fishing" | "spring" | "coffee" | "craft" | "springFestival" | "lantern" | "dragonBoat" | "midAutumn";
type SeedField = "seeds" | "strawberrySeeds" | "cornSeeds" | "pineappleSeeds" | "watermelonSeeds" | "tomatoSeeds" | "potatoSeeds" | "pumpkinSeeds" | "blueberrySeeds";
type CraftType = "chest" | "fence" | "gate" | "scarecrow" | "lamp" | "bench" | "sign" | "matches" | "blanket";
type CraftRotation = 0 | 45 | 90;
type PlacedCraft = { id: string; type: CraftType; x: number; y: number; rotation: CraftRotation };
type PlantedTree = { id: string; x: number; y: number; stage: number; watered: boolean };
type FencePlacementSlot = { id: string; x: number; y: number; rotation: 0 | 90 };
type ForestItem = "pinecone" | "pineNut";
type PetType = "cat" | "dog" | "chick" | "duck" | "rabbit" | "hamster";
type PetRecord = { id: string; type: PetType; sex: "男生" | "女生"; bornDay: number; bornYear: number };
type CarriedItem = { kind: "resource"; id: StorableResource } | { kind: "material"; id: "wood" | "stone" } | { kind: "forest"; id: ForestItem } | { kind: "seed"; id: CropType } | { kind: "herb" } | { kind: "resin" } | { kind: "matches" } | { kind: "product"; id: "egg" | "milk" | "wool" } | { kind: "petGift"; id: "feather" | "softFur" | "bone" } | { kind: "book"; id: number } | { kind: "artifact"; id: number };
type ShippingItemGroup = "resource" | "seed" | "craft" | "single";
type ShippingSingleField = "wood" | "stone" | "herbs" | "pinecones" | "pineNuts" | "resin" | "eggs" | "milk" | "wool" | "feathers" | "softFur" | "petBones" | "cookies" | "crabs" | "shrimp";
type ShippingCatalogItem = { id: string; name: string; short: string; price: number; group: ShippingItemGroup; key: string };

type OnlinePlayer = {
  deviceId: string;
  playerName: string;
  village: VillageId;
  currentVillage: VillageId;
  scene: Scene;
  x: number;
  y: number;
  day: number;
  hour: number;
  energy: number;
  sick: boolean;
  online: boolean;
};

type MultiplayerSession = {
  roomCode: string;
  deviceId: string;
  playerName: string;
  village: VillageId;
};

type FarmTile = {
  state: TileState;
  stage: number;
  watered: boolean;
  cropType?: CropType;
};

type GameState = {
  year: number;
  day: number;
  season: number;
  hour: number;
  coins: number;
  energy: number;
  seeds: number;
  strawberrySeeds: number;
  cornSeeds: number;
  pineappleSeeds: number;
  watermelonSeeds: number;
  tomatoSeeds: number;
  potatoSeeds: number;
  pumpkinSeeds: number;
  blueberrySeeds: number;
  water: number;
  bait: number;
  tiles: FarmTile[];
  planted: number;
  wateredCount: number;
  harvested: number;
  fishCaught: number;
  inventory: Record<StorableResource, number>;
  chestStorage: Record<StorableResource, number>;
  shippingBin: Record<string, number>;
  wood: number;
  stone: number;
  herbs: number;
  pinecones: number;
  pineNuts: number;
  resin: number;
  treeStates: boolean[];
  plantedTrees: PlantedTree[];
  rockStates: boolean[];
  crafted: Record<CraftType, number>;
  placedCrafts: PlacedCraft[];
  farmVisitor: "crow" | "animal" | null;
  upgrades: { house: number; land: number; field: number; storage: number; greenhouse: number; pond: number; stoneWall: number };
  builderSupplies: { wood: number; stone: number };
  equipment: { lampOn: boolean };
  daily: { day: number; planted: number; watered: number; harvested: number; fish: number; chopped: number; sold: number; rewardClaimed: boolean };
  sick: boolean;
  diagnosed: boolean;
  lastIllnessDay: number;
  groundBooks: boolean[];
  bookBag: number[];
  libraryBooks: number[];
  groundArtifacts: boolean[];
  artifactBag: number[];
  museumArtifacts: number[];
  groundSupplies: boolean[];
  toolUpgrades: { water: boolean; axe: boolean; rod: boolean };
  toolUpgradeDays: { axe: number; rod: number };
  npcHealedDays: Record<string, number>;
  lastSchoolAttendance: string;
  seasonExcursionCompleted: boolean;
  animalPen: boolean;
  chickens: number;
  cows: number;
  sheep: number;
  eggs: number;
  milk: number;
  wool: number;
  feathers: number;
  softFur: number;
  petFood: number;
  petBones: number;
  cookies: number;
  crabs: number;
  shrimp: number;
  ananBeachTrips: string[];
  lastAnanCookieDay: string;
  lastEggDay: number;
  lastMilkDay: number;
  lastWoolDay: number;
  rainExposure: number;
  pets: PetRecord[];
  lastPetBirthYears: Partial<Record<PetType, number>>;
  sickPetIds: string[];
  lastPetIllnessAbsoluteDay: number;
  missingPetId: string | null;
  birthdayCakeYear: number;
  driverLicense: boolean;
  ownsCar: boolean;
  weather: Weather;
  mallItems: Record<MallItem, number>;
  equippedOutfit: "default" | "redCoat" | "blueOutfit";
  umbrellaOpen: boolean;
};

const TOOL_INFO: Record<Tool, { icon: string; name: string; key: string }> = {
  hoe: { icon: "⌁", name: "锄头", key: "1" },
  seed: { icon: "●", name: "萝卜种子", key: "2" },
  water: { icon: "◒", name: "洒水壶", key: "3" },
  hand: { icon: "✦", name: "收获", key: "4" },
  rod: { icon: "⌁", name: "鱼竿", key: "5" },
  axe: { icon: "⌂", name: "斧头", key: "6" },
};

const CROP_INFO: Record<CropType, { name: string; short: string; seedField: SeedField; seedPrice: number }> = {
  radish: { name: "萝卜", short: "萝", seedField: "seeds", seedPrice: 60 },
  strawberry: { name: "草莓", short: "莓", seedField: "strawberrySeeds", seedPrice: 90 },
  corn: { name: "玉米", short: "玉", seedField: "cornSeeds", seedPrice: 110 },
  pineapple: { name: "菠萝", short: "菠", seedField: "pineappleSeeds", seedPrice: 135 },
  watermelon: { name: "西瓜", short: "瓜", seedField: "watermelonSeeds", seedPrice: 120 },
  tomato: { name: "番茄", short: "番", seedField: "tomatoSeeds", seedPrice: 75 },
  potato: { name: "土豆", short: "薯", seedField: "potatoSeeds", seedPrice: 70 },
  pumpkin: { name: "南瓜", short: "南", seedField: "pumpkinSeeds", seedPrice: 130 },
  blueberry: { name: "蓝莓", short: "蓝", seedField: "blueberrySeeds", seedPrice: 100 },
};

const CROP_TYPES = Object.keys(CROP_INFO) as CropType[];

const BEACH_CRABS = [
  { x: 22, y: 67 }, { x: 36, y: 58 }, { x: 49, y: 72 },
  { x: 63, y: 61 }, { x: 77, y: 76 }, { x: 86, y: 55 },
  { x: 30, y: 78 }, { x: 58, y: 54 }, { x: 73, y: 68 },
];

const RESOURCE_INFO: Record<StorableResource, { name: string; energy: number; price: number }> = {
  radish: { name: "萝卜", energy: 8, price: 65 },
  strawberry: { name: "草莓", energy: 12, price: 90 },
  corn: { name: "玉米", energy: 10, price: 80 },
  pineapple: { name: "菠萝", energy: 16, price: 125 },
  watermelon: { name: "西瓜", energy: 18, price: 115 },
  tomato: { name: "番茄", energy: 10, price: 78 },
  potato: { name: "土豆", energy: 8, price: 72 },
  pumpkin: { name: "南瓜", energy: 16, price: 125 },
  blueberry: { name: "蓝莓", energy: 12, price: 98 },
  fish: { name: "鱼", energy: 15, price: 36 },
};

const BUILDING_INFO: Record<BuildingId, { name: string; owner: string; greeting: string; exit: { x: number; y: number } }> = {
  farmhouse: { name: "小禾农舍", owner: "温暖的家", greeting: "这里可以休息、整理一天的收获，再从门口回到农场。", exit: { x: 9, y: 3 } },
  supermarket: { name: "青禾超市", owner: "林婶", greeting: "种子、食品和日用品都在这里。", exit: { x: 3, y: 4 } },
  townhall: { name: "镇公所", owner: "周镇长", greeting: "镇上的公告、活动和居民委托都记在这里。", exit: { x: 3, y: 4 } },
  clinic: { name: "青禾诊所", owner: "白医生", greeting: "别让自己太累，健康也是农场生活的一部分。", exit: { x: 9, y: 4 } },
  cafe: { name: "麦香咖啡", owner: "阿麦", greeting: "刚出炉的面包和热咖啡最能恢复精神。", exit: { x: 10, y: 5 } },
  workshop: { name: "木匠工坊", owner: "鲁师傅", greeting: "等你攒够材料，我可以帮你扩建农舍。", exit: { x: 3, y: 5 } },
  library: { name: "山谷图书馆", owner: "叶老师", greeting: "这里收藏着作物、矿石和青禾谷的故事。", exit: { x: 8, y: 5 } },
  museum: { name: "青禾博物馆", owner: "沈馆长", greeting: "欢迎来看看山谷的稀奇发现。捡到珍贵物品，可以交给我放进展柜。", exit: { x: 8, y: 4 } },
  school: { name: "青禾学校", owner: "许老师", greeting: "上课日可以来听英语、语文、数学和农场知识课。认真听完一节课会获得 50 金币。", exit: { x: 6, y: 6 } },
};

const BUILDING_ITEMS: Record<BuildingId, string[]> = {
  farmhouse: [],
  supermarket: [],
  townhall: ["居民委托板", "小镇地图", "节日公告"],
  clinic: ["诊疗床", "药品柜", "健康档案"],
  cafe: ["面包展示柜", "咖啡机", "靠窗小桌"],
  workshop: ["木工台", "工具墙", "木料架"],
  library: ["作物图鉴", "故事书架", "阅读桌"],
  museum: ["珍品展柜", "鉴定台", "捐赠记录"],
  school: ["字母黑板", "语文课本", "数学算盘", "农场课堂"],
};

const ITEM_DESCRIPTIONS: Record<string, string> = {
  居民委托板: "上面贴着浇水、钓鱼和收集木材的居民委托，每天都会换新纸条。",
  小镇地图: "地图标出了农场、超市、诊所、咖啡馆、工坊和图书馆的位置。",
  节日公告: "青禾谷一年四季都有活动：春节、元宵节、端午节、中秋节，还有种子分享日、钓鱼节、春日集市、咖啡日和山谷手作日。",
  诊疗床: "铺着干净白床单的诊疗床，体力耗尽时白医生会让小禾先躺下休息。",
  健康档案: "记录着小禾的体力与最近生病日期，白医生提醒她不要过度劳累。",
  面包展示柜: "玻璃柜里有莓果面包、蜂蜜吐司和刚烤好的玉米小饼。",
  咖啡机: "铜色咖啡机正在冒热气，空气里有温暖的烘焙香味。",
  靠窗小桌: "桌上摆着小花瓶，可以坐下来看看青禾镇的街景。",
  木工台: "台面有尺子、木锤和刨花，鲁师傅会在这里制作家具。",
  工具墙: "墙上整齐挂着锯子、锤子与木工尺，每件工具都有固定位置。",
  木料架: "架子上码着松木、橡木和几块等待加工的漂亮木板。",
  作物图鉴: "图鉴记载：萝卜、草莓和玉米每天浇水，睡觉后就会成长。",
  故事书架: "书架里收藏着青禾谷的传说、居民故事和山林探险笔记。",
  阅读桌: "桌上有柔和的台灯和书签，可以安静地翻阅一本书。",
  珍品展柜: "防尘玻璃展柜会收藏小禾捐赠的稀奇物品，每件藏品都有自己的说明牌。",
  鉴定台: "沈馆长会在这里清理泥土、观察纹路，确认稀奇物品的来历。",
  捐赠记录: "记录着捐赠者、发现日期和发现地点。小禾捐赠的物品都会永久留名。",
  字母黑板: "黑板上写着 A、B、C 和简单的英文单词，许老师会带大家朗读。",
  语文课本: "课本里有山谷故事、词语和短文，读完还能认识新的汉字。",
  数学算盘: "用算盘练习加减法，也会学习怎样计算种子成本和收获收入。",
  农场课堂: "课堂会讲播种、浇水、季节、动物保护和农场经营知识。",
};

const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const SEASONS = ["春天", "夏天", "秋天", "冬天"];
const SEASON_SHORT = ["春", "夏", "秋", "冬"];
const WEATHER_INFO: Record<Weather, { name: string; temperature: string }> = {
  sunny: { name: "晴朗", temperature: "18°C" },
  cloudy: { name: "阴天", temperature: "16°C" },
  rain: { name: "下雨", temperature: "14°C" },
  thunder: { name: "雷雨", temperature: "13°C" },
};

const weatherForDate = (year: number, season: number, day: number): Weather => {
  const pattern: Weather[] = ["sunny", "cloudy", "rain", "sunny", "sunny", "thunder", "cloudy", "rain", "sunny"];
  return pattern[(year * 5 + season * 3 + day) % pattern.length];
};

const LOST_BOOKS = [
  { title: "《青禾溪的萤火》", short: "萤", content: "夏夜里，小禾沿着青禾溪寻找迟归的萤火虫。她发现溪边的灯光不是星星掉进水里，而是一群萤火虫在为迷路的小鹿照亮回家的石桥。" },
  { title: "《风车坡的种子信》", short: "风", content: "老风车每转一圈，就会把一封种子写的信送往山谷。信里记着播种的日期、雨水的气味，还有农夫对下一次丰收的愿望。" },
  { title: "《枫叶村的月亮面包》", short: "月", content: "阿麦曾在满月夜烤出一炉月亮形状的面包。香味越过山路飘到枫叶村，两个村庄的居民提着灯，在桥中央分享了第一块热面包。" },
];

const RARE_ARTIFACTS = [
  { title: "琥珀叶片", short: "珀", description: "透明的蜂蜜色琥珀里封存着一片远古小叶子，迎着光会闪出温暖的金色。" },
  { title: "星纹石片", short: "星", description: "深蓝石片上有天然形成的银白纹路，看起来像青禾谷夜空中的一小片星河。" },
  { title: "古铜风铃", short: "铃", description: "小巧的古铜铃上刻着溪水和麦穗，轻轻摇动时会发出很久以前的清亮声音。" },
];

const GROUND_SUPPLIES = [
  { name: "草莓种子小包", short: "莓", kind: "seed", field: "strawberrySeeds", amount: 3, description: "里面有 3 颗草莓种子，捡起后会直接放进种子袋。" },
  { name: "野莓饭团", short: "食", kind: "food", amount: 30, description: "用野莓和米做成的饭团，捡起食用后可以恢复 30 点体力。" },
  { name: "大号洒水壶", short: "水", kind: "tool", tool: "water", description: "容量更大的洒水壶，捡起后每天可以装 18 格水。" },
  { name: "精铁斧头", short: "斧", kind: "tool", tool: "axe", description: "更加锋利的斧头，可使用 7 天；砍树获得 6 块木头，敲石头也能获得 6 块石材。" },
  { name: "幸运鱼竿", short: "竿", kind: "tool", tool: "rod", description: "带幸运银钩的鱼竿，捡起后可使用 7 天，钓鱼更快且每次多获得 1 条鱼。" },
  { name: "西瓜种子小包", short: "瓜", kind: "seed", field: "watermelonSeeds", amount: 3, description: "里面有 3 颗西瓜种子，捡起后会直接放进种子袋。" },
  { name: "溪边艾草", short: "艾", kind: "herb", amount: 2, description: "带着清香的新鲜艾草，捡起后会收进药材袋。" },
  { name: "金银花", short: "药", kind: "herb", amount: 2, description: "山坡上掉落的金银花，可以收进药材袋，之后拿给白医生查看。" },
] as const;

const GROUND_SUPPLY_PRICES = [45, 55, 160, 220, 220, 50, 60, 60] as const;
const PET_CATALOG: Array<{ id: PetType; name: string; personality: string; food: string; water: string; price: number }> = [
  { id: "cat", name: "三花猫", personality: "亲人、爱晒太阳，也喜欢追会动的小东西", food: "1 小碗猫粮", water: "1 小碗清水", price: 260 },
  { id: "dog", name: "柴犬", personality: "热情、勇敢，会跟着主人在农场巡逻", food: "2 小碗狗粮", water: "2 小碗清水", price: 320 },
  { id: "chick", name: "绒毛小鸡", personality: "好奇、胆子小，喜欢跟同伴挤在一起", food: "1 小把谷粒", water: "半小碗清水", price: 120 },
  { id: "duck", name: "小鸭", personality: "活泼、爱玩水，走路时会摇摇摆摆", food: "1 小把鸭粮", water: "1 小盆清水", price: 150 },
  { id: "rabbit", name: "垂耳兔", personality: "温柔、安静，开心时会轻轻蹦跳", food: "1 份青草和胡萝卜", water: "1 小碗清水", price: 220 },
  { id: "hamster", name: "仓鼠", personality: "机灵、喜欢囤食物，夜里最有精神", food: "半小勺杂粮", water: "半小瓶清水", price: 90 },
];
const CRAFT_RECIPES: Record<CraftType, { name: string; short: string; description: string; wood: number; stone: number; resin?: number; wool?: number }> = {
  chest: { name: "木箱", short: "箱", description: "摆放后可以存放收获", wood: 8, stone: 0 },
  fence: { name: "木栅栏", short: "栏", description: "8 段围栏能挡住偷吃作物的小动物", wood: 4, stone: 0 },
  gate: { name: "木围栏门", short: "门", description: "装在围栏中间，点击可以开门或关门", wood: 7, stone: 1 },
  scarecrow: { name: "稻草人", short: "田", description: "一个大幅减少乌鸦，两个完全赶走乌鸦", wood: 12, stone: 0 },
  lamp: { name: "农场灯柱", short: "灯", description: "摆在农场，天黑后自动亮起", wood: 6, stone: 4 },
  bench: { name: "休息长椅", short: "椅", description: "装饰农场，坐下可恢复少量体力", wood: 10, stone: 2 },
  sign: { name: "方向木牌", short: "牌", description: "可以横放、竖放或斜放的农场路牌", wood: 5, stone: 1 },
  matches: { name: "火柴", short: "火", description: "进入山洞或帐篷后，可以点亮火光", wood: 3, stone: 0, resin: 2 },
  blanket: { name: "羊毛毯", short: "毯", description: "用绵羊的羊毛编织，点击背包中的毛毯恢复 30 点体力", wood: 0, stone: 0, wool: 3 },
};

const SHIPPING_CATALOG: ShippingCatalogItem[] = [
  ...(Object.keys(RESOURCE_INFO) as StorableResource[]).map((resource) => ({ id: `resource:${resource}`, name: RESOURCE_INFO[resource].name, short: resource === "fish" ? "鱼" : CROP_INFO[resource].short, price: RESOURCE_INFO[resource].price, group: "resource" as const, key: resource })),
  ...CROP_TYPES.map((crop) => ({ id: `seed:${crop}`, name: `${CROP_INFO[crop].name}种子`, short: CROP_INFO[crop].short, price: Math.max(12, Math.round(CROP_INFO[crop].seedPrice * .45)), group: "seed" as const, key: crop })),
  ...(Object.keys(CRAFT_RECIPES) as CraftType[]).map((craft) => ({ id: `craft:${craft}`, name: CRAFT_RECIPES[craft].name, short: CRAFT_RECIPES[craft].short, price: Math.max(25, CRAFT_RECIPES[craft].wood * 12 + CRAFT_RECIPES[craft].stone * 15 + (CRAFT_RECIPES[craft].resin ?? 0) * 22 + (CRAFT_RECIPES[craft].wool ?? 0) * 32), group: "craft" as const, key: craft })),
  { id: "single:wood", name: "木头", short: "木", price: 12, group: "single", key: "wood" },
  { id: "single:stone", name: "石材", short: "石", price: 15, group: "single", key: "stone" },
  { id: "single:herbs", name: "药材", short: "药", price: 38, group: "single", key: "herbs" },
  { id: "single:pinecones", name: "松果", short: "果", price: 20, group: "single", key: "pinecones" },
  { id: "single:pineNuts", name: "松子", short: "子", price: 16, group: "single", key: "pineNuts" },
  { id: "single:resin", name: "树脂", short: "脂", price: 32, group: "single", key: "resin" },
  { id: "single:eggs", name: "鸡蛋", short: "蛋", price: 55, group: "single", key: "eggs" },
  { id: "single:milk", name: "牛奶", short: "奶", price: 82, group: "single", key: "milk" },
  { id: "single:wool", name: "羊毛", short: "毛", price: 96, group: "single", key: "wool" },
  { id: "single:feathers", name: "宠物羽毛", short: "羽", price: 28, group: "single", key: "feathers" },
  { id: "single:softFur", name: "兔子软毛", short: "绒", price: 48, group: "single", key: "softFur" },
  { id: "single:petBones", name: "宠物找到的骨头", short: "骨", price: 34, group: "single", key: "petBones" },
  { id: "single:cookies", name: "安安的饼干", short: "饼", price: 95, group: "single", key: "cookies" },
  { id: "single:crabs", name: "海边螃蟹", short: "蟹", price: 78, group: "single", key: "crabs" },
  { id: "single:shrimp", name: "海边小虾", short: "虾", price: 72, group: "single", key: "shrimp" },
];

const shippingItemCount = (state: GameState, item: ShippingCatalogItem) => {
  if (item.group === "resource") return state.inventory[item.key as StorableResource];
  if (item.group === "seed") return state[CROP_INFO[item.key as CropType].seedField];
  if (item.group === "craft") return state.crafted[item.key as CraftType];
  return state[item.key as ShippingSingleField];
};

const FENCE_PLACEMENT_SLOTS: FencePlacementSlot[] = [
  ...[24, 34, 44, 54, 64].flatMap((x, index) => [
    { id: `top-${index}`, x, y: 40, rotation: 0 as const },
    { id: `bottom-${index}`, x, y: 89, rotation: 0 as const },
  ]),
  ...[51, 62, 73, 84].flatMap((y, index) => [
    { id: `left-${index}`, x: 18, y, rotation: 90 as const },
    { id: `right-${index}`, x: 74, y, rotation: 90 as const },
  ]),
];

const SCHOOL_STUDENTS = ["小玲", "豆豆", "小满", "阿禾", "小树", "安安"];
const PERSON_DIALOGUES: Record<string, string> = {
  林婶: "林婶：我最喜欢清晨去果园看草莓，红透的那一颗总是最甜。",
  鲁师傅: "鲁师傅：好木料要顺着纹路慢慢打磨，急不得，做出来才结实。",
  叶老师: "叶老师：今天读到一个关于山风的故事，下次我讲给你听。",
  白医生: "白医生：农活重要，按时吃饭和休息也一样重要，别把体力用光了。",
  阿麦: "阿麦：刚烤好的面包要配一点山谷咖啡，香气会飘到街口。",
  周镇长: "周镇长：镇上的新路和节日都安排好了，公告栏会提前告诉大家。",
  沈馆长: "沈馆长：每件旧物都有自己的故事，我会把发现的地点也认真记下来。",
  诊所助手: "诊所助手：我每天都整理药柜，白医生休息时也能放心把诊所交给我。",
  红衣助手: "红衣助手：今天由我照看诊所，需要检查或拿药都可以来找我。",
  许老师: "许老师：学会读书、计算和观察天气，也能让农场经营得更好。",
  小玲: "小玲：我最喜欢语文课，想把青禾谷的花写进小作文里。",
  豆豆: "豆豆：数学课算鱼获特别有趣，我已经会算今天钓了几条鱼。",
  小满: "小满：我喜欢四季课，夏天的西瓜和秋天的南瓜都很好看。",
  阿禾: "阿禾：英语里的 seed 是种子，我把这个单词记得最牢。",
  小树: "小树：农场知识课说，松果种下后要等几天才会长成大树。",
  安安: "安安：我住在农场西边，喜欢爬山、认路和在帐篷里看星星。有空一起去山洞探险吧！",
};
const PERSON_CLOTHES: Record<string, string> = {
  林婶: "#b85c55", 鲁师傅: "#8a6848", 叶老师: "#77618e", 白医生: "#e8eee7", 阿麦: "#d68a45", 周镇长: "#526f91", 沈馆长: "#39766f", 诊所助手: "#c74646", 红衣助手: "#c74646", 许老师: "#4f7d66",
  小玲: "#dc7081", 豆豆: "#5f83b5", 小满: "#e29b45", 阿禾: "#6e9d58", 小树: "#8169a0", 安安: "#4d9c9a",
  小桃: "#d9798b", 阿木: "#6f8d58", 小文: "#6d79a9", 小麦: "#d8a144", 小程: "#5e88a5", 小岚: "#499184", 小晴: "#9a6fa6",
};
const BIRTHDAY_GUESTS = Object.keys(PERSON_DIALOGUES);
const NPC_HAIR_COLORS = ["#4a3328", "#6b432d", "#342f35", "#765230", "#3e4b46", "#6d3d46"];
const NPC_SKIN_COLORS = ["#efbd95", "#e7ad82", "#d99b72", "#f2c7a1"];
const personClothesStyle = (name: string) => {
  const nameCode = [...name].reduce((total, letter) => total + (letter.codePointAt(0) ?? 0), 0);
  return { "--npc-clothes": PERSON_CLOTHES[name] ?? "#6b8b68", "--npc-hair": NPC_HAIR_COLORS[nameCode % NPC_HAIR_COLORS.length], "--npc-skin": NPC_SKIN_COLORS[nameCode % NPC_SKIN_COLORS.length] } as CSSProperties;
};

const VILLAGE_INFO: Record<VillageId, { name: string; farm: string; description: string }> = {
  qinghe: { name: "青禾村", farm: "青禾农场", description: "绿野、溪流与温暖的木屋" },
  maple: { name: "枫叶村", farm: "枫叶农场", description: "红枫、山路与安静的坡地" },
};

const FESTIVAL_SCHEDULE: { season: number; day: number; id: FestivalId; name: string; place: string; description: string }[] = [
  { season: 0, day: 3, id: "seeds", name: "种子分享日", place: "青禾超市", description: "免费领取水果和蔬菜种子大礼包" },
  { season: 0, day: 13, id: "spring", name: "春日集市", place: "中心广场", description: "果酱、木工作品和山谷音乐" },
  { season: 0, day: 15, id: "lantern", name: "元宵灯会", place: "中心广场", description: "看花灯、猜灯谜，免费品尝汤圆" },
  { season: 1, day: 5, id: "dragonBoat", name: "端午龙舟节", place: "中心广场", description: "看龙舟鼓阵，免费品尝粽子" },
  { season: 1, day: 12, id: "fishing", name: "钓鱼节", place: "农场钓鱼池", description: "带上鱼竿参加山谷钓鱼比赛" },
  { season: 2, day: 15, id: "midAutumn", name: "中秋赏月会", place: "中心广场", description: "挂灯笼、赏圆月，大家一起吃月饼" },
  { season: 2, day: 20, id: "coffee", name: "咖啡日", place: "麦香咖啡", description: "品尝咖啡和刚出炉的点心" },
  { season: 3, day: 27, id: "craft", name: "山谷手作日", place: "木匠工坊", description: "居民一起展示亲手制作的作品" },
  { season: 3, day: 28, id: "springFestival", name: "春节庆典", place: "中心广场", description: "贴春联、挂灯笼，一起吃年糕迎接新春" },
];

const TRADITIONAL_FESTIVALS: Partial<Record<FestivalId, { treat: string; symbol: string; greeting: string }>> = {
  springFestival: { treat: "年糕", symbol: "春", greeting: "新年快乐！广场挂满红灯笼，大家正在一起迎接新春。" },
  lantern: { treat: "汤圆", symbol: "灯", greeting: "元宵灯会亮起来啦！猜完灯谜可以免费吃一碗汤圆。" },
  dragonBoat: { treat: "粽子", symbol: "舟", greeting: "龙舟鼓声响起来啦！大家正在看龙舟、吃粽子。" },
  midAutumn: { treat: "月饼", symbol: "月", greeting: "中秋月亮又圆又亮，大家在广场赏月、分享月饼。" },
};

const DRIVING_QUESTIONS = [
  { question: "看到红灯应该怎么做？", answers: ["停下来等待", "加速冲过去"], correct: 0 },
  { question: "前方正在施工时应该怎么做？", answers: ["绕过围栏继续开", "减速并听从工人指挥"], correct: 1 },
  { question: "开车前第一件事是什么？", answers: ["系好安全带", "马上踩油门"], correct: 0 },
];

const FESTIVAL_GUESTS = ["林婶", "鲁师傅", "叶老师", "白医生", "阿麦", "周镇长"];
const NPC_SICK_DAYS: Record<string, number[]> = {
  林婶: [8],
  鲁师傅: [11],
  叶老师: [17],
  白医生: [23],
  阿麦: [26],
  周镇长: [5],
  沈馆长: [15],
  诊所助手: [14],
  许老师: [21],
};
const RELIEF_WORKERS: Record<string, { name: string; greeting: string }> = {
  林婶: { name: "小桃", greeting: "林婶今天在家休息，我来替她照看超市。平时我就和林婶住在果园小屋里。" },
  鲁师傅: { name: "阿木", greeting: "鲁师傅今天在家休息，我来替他照看工坊。平时我们一起住在山脚院子里。" },
  叶老师: { name: "小文", greeting: "叶老师今天在家休息，我来替他管理图书馆。平时我们一起住在北林书屋。" },
  白医生: { name: "诊所助手", greeting: "白医生今天在家休息，我穿上红色制服来诊所代班。平时我和白医生住在同一个青草小院。" },
  阿麦: { name: "小麦", greeting: "阿麦今天在家休息，我来替他准备咖啡和点心。平时我们一起住在麦香小屋。" },
  周镇长: { name: "小程", greeting: "周镇长今天在家休息，我来替他处理镇务。平时我们一起住在石榴院。" },
  沈馆长: { name: "小岚", greeting: "沈馆长今天在家休息，我来替他照看展柜。平时我们一起住在藏品小宅。" },
  许老师: { name: "小晴", greeting: "许老师今天在家休息，我来替她给大家上课。平时我们一起住在书香小院。" },
};
const RESIDENT_HOMES: { owner: ResidentHomeOwner; home: string; greeting: string; items: string[] }[] = [
  { owner: "白医生", home: "白医生的青草小院", greeting: "下班后我会回到自己的小院。生病时也会留在家里休息。", items: ["医药书架", "草药茶桌", "白色床铺"] },
  { owner: "阿麦", home: "阿麦的麦香小屋", greeting: "欢迎来家里坐坐，厨房里总有刚烤好的面包香。", items: ["面包烤炉", "咖啡豆柜", "格子床铺"] },
  { owner: "周镇长", home: "周镇长的石榴院", greeting: "这里是我整理镇务之外休息的小院，院里的石榴树年年开花。", items: ["镇务书桌", "纪念相框", "深蓝床铺"] },
  { owner: "沈馆长", home: "沈馆长的藏品小宅", greeting: "我把复制品放在家里研究，真正的珍品仍会留在博物馆展柜。", items: ["放大镜桌", "标本柜", "棕色床铺"] },
  { owner: "诊所助手", home: "诊所助手的红瓦小屋", greeting: "平时我住在这里，白医生需要休息时，我就穿上红色制服去诊所代班。", items: ["红色制服", "护理笔记", "暖黄床铺"] },
  { owner: "许老师", home: "许老师的书香小院", greeting: "放学后我会回到这里备课，书架上放着下一节农场知识课的笔记。", items: ["备课书桌", "字母卡片", "绿色床铺"] },
];
type ReturnGift = { kind: "seed"; field: SeedField; amount: number; name: string } | { kind: "material"; field: "wood" | "stone"; amount: number; name: string } | { kind: "energy"; amount: number; name: string } | { kind: "coins"; amount: number; name: string };
const PERSON_RETURN_GIFTS: Record<string, ReturnGift> = {
  林婶: { kind: "seed", field: "strawberrySeeds", amount: 2, name: "2 颗草莓种子" },
  鲁师傅: { kind: "material", field: "wood", amount: 2, name: "2 块打磨好的木头" },
  叶老师: { kind: "seed", field: "blueberrySeeds", amount: 2, name: "2 颗蓝莓种子" },
  白医生: { kind: "energy", amount: 15, name: "恢复体力的草药茶" },
  阿麦: { kind: "energy", amount: 20, name: "一杯热咖啡" },
  周镇长: { kind: "coins", amount: 25, name: "25 枚感谢金币" },
  诊所助手: { kind: "energy", amount: 12, name: "一杯护理草药茶" },
  许老师: { kind: "coins", amount: 30, name: "30 枚学习奖励金币" },
};

const DAILY_WOODCRAFTS = [
  { name: "花纹鸟屋", description: "带斜屋顶、圆门和小栖木，木板上刻着花朵与麦穗。" },
  { name: "摇摇小木马", description: "马鬃、缰绳和弧形摇板都经过细细雕刻，可以看出四条腿。" },
  { name: "山谷守护鹿", description: "一只温柔的鹿站在松树旁，底座刻着青禾谷的叶片纹样。" },
];

const makeTiles = (count = 32): FarmTile[] =>
  Array.from({ length: count }, () => ({ state: "grass", stage: 0, watered: false }));

const makeNewGame = (): GameState => ({
  year: 1,
  day: 1,
  season: 0,
  hour: 7,
  coins: 280,
  energy: 100,
  seeds: 8,
  strawberrySeeds: 0,
  cornSeeds: 0,
  pineappleSeeds: 0,
  watermelonSeeds: 0,
  tomatoSeeds: 0,
  potatoSeeds: 0,
  pumpkinSeeds: 0,
  blueberrySeeds: 0,
  water: 12,
  bait: 0,
  tiles: makeTiles(),
  planted: 0,
  wateredCount: 0,
  harvested: 0,
  fishCaught: 0,
  inventory: { radish: 0, strawberry: 0, corn: 0, pineapple: 0, watermelon: 0, tomato: 0, potato: 0, pumpkin: 0, blueberry: 0, fish: 0 },
  chestStorage: { radish: 0, strawberry: 0, corn: 0, pineapple: 0, watermelon: 0, tomato: 0, potato: 0, pumpkin: 0, blueberry: 0, fish: 0 },
  shippingBin: {},
  wood: 0,
  stone: 0,
  herbs: 0,
  pinecones: 0,
  pineNuts: 0,
  resin: 0,
  treeStates: [true, true, true, true],
  plantedTrees: [],
  rockStates: [true, true, true, true, true, true],
  crafted: { chest: 0, fence: 0, gate: 0, scarecrow: 0, lamp: 0, bench: 0, sign: 0, matches: 0, blanket: 0 },
  placedCrafts: [],
  farmVisitor: null,
  upgrades: { house: 0, land: 0, field: 0, storage: 0, greenhouse: 0, pond: 0, stoneWall: 0 },
  builderSupplies: { wood: 0, stone: 0 },
  equipment: { lampOn: false },
  daily: { day: 1, planted: 0, watered: 0, harvested: 0, fish: 0, chopped: 0, sold: 0, rewardClaimed: false },
  sick: false,
  diagnosed: false,
  lastIllnessDay: 0,
  groundBooks: [true, false, false],
  bookBag: [],
  libraryBooks: [],
  groundArtifacts: [true, false, false],
  artifactBag: [],
  museumArtifacts: [],
  groundSupplies: [true, false, false, false, false, false, true, false],
  toolUpgrades: { water: false, axe: false, rod: false },
  toolUpgradeDays: { axe: 0, rod: 0 },
  npcHealedDays: {},
  lastSchoolAttendance: "",
  seasonExcursionCompleted: false,
  animalPen: false,
  chickens: 0,
  cows: 0,
  sheep: 0,
  eggs: 0,
  milk: 0,
  wool: 0,
  feathers: 0,
  softFur: 0,
  petFood: 0,
  petBones: 0,
  cookies: 0,
  crabs: 0,
  shrimp: 0,
  ananBeachTrips: [],
  lastAnanCookieDay: "",
  lastEggDay: 0,
  lastMilkDay: 0,
  lastWoolDay: 0,
  rainExposure: 0,
  pets: [],
  lastPetBirthYears: {},
  sickPetIds: [],
  lastPetIllnessAbsoluteDay: 0,
  missingPetId: null,
  birthdayCakeYear: 0,
  driverLicense: false,
  ownsCar: false,
  weather: "sunny",
  mallItems: { redCoat: 0, blueOutfit: 0, umbrella: 0, seedBox: 0 },
  equippedOutfit: "default",
  umbrellaOpen: false,
});

const villageSaveKey = (village: VillageId) => village === "maple" ? "qinghe-farm-save-maple" : "qinghe-farm-save";

const restoreVillageGame = (saved: string | null): GameState => {
  const defaults = makeNewGame();
  if (!saved) return defaults;
  try {
    const parsed = JSON.parse(saved) as Partial<GameState>;
    if (!parsed.tiles || parsed.tiles.length < 32) return defaults;
    return {
      ...defaults,
      ...parsed,
      inventory: { ...defaults.inventory, ...(parsed.inventory ?? {}) },
      chestStorage: { ...defaults.chestStorage, ...(parsed.chestStorage ?? {}) },
      shippingBin: { ...defaults.shippingBin, ...(parsed.shippingBin ?? {}) },
      treeStates: parsed.treeStates?.length === 4 ? parsed.treeStates : defaults.treeStates,
      plantedTrees: (parsed.plantedTrees ?? []).map((tree) => ({ ...tree, watered: tree.watered ?? false })),
      rockStates: defaults.rockStates.map((standing, index) => parsed.rockStates?.[index] ?? standing),
      crafted: { ...defaults.crafted, ...(parsed.crafted ?? {}) },
      placedCrafts: parsed.placedCrafts ?? [],
      upgrades: { ...defaults.upgrades, ...(parsed.upgrades ?? {}) },
      builderSupplies: { ...defaults.builderSupplies, ...(parsed.builderSupplies ?? {}) },
      equipment: { ...defaults.equipment, ...(parsed.equipment ?? {}) },
      daily: parsed.daily?.day === parsed.day ? { ...defaults.daily, ...parsed.daily } : { ...defaults.daily, day: parsed.day ?? 1 },
      groundBooks: defaults.groundBooks.map((visible, index) => parsed.groundBooks?.[index] ?? visible),
      groundArtifacts: defaults.groundArtifacts.map((visible, index) => parsed.groundArtifacts?.[index] ?? visible),
      groundSupplies: defaults.groundSupplies.map((visible, index) => parsed.groundSupplies?.[index] ?? visible),
      toolUpgrades: { ...defaults.toolUpgrades, ...(parsed.toolUpgrades ?? {}) },
      toolUpgradeDays: {
        axe: parsed.toolUpgradeDays?.axe ?? (parsed.toolUpgrades?.axe ? 7 : 0),
        rod: parsed.toolUpgradeDays?.rod ?? (parsed.toolUpgrades?.rod ? 7 : 0),
      },
      npcHealedDays: parsed.npcHealedDays ?? {},
      lastSchoolAttendance: parsed.lastSchoolAttendance ?? "",
      seasonExcursionCompleted: parsed.seasonExcursionCompleted ?? false,
      cows: parsed.cows ?? 0,
      sheep: parsed.sheep ?? 0,
      mallItems: { ...defaults.mallItems, ...(parsed.mallItems ?? {}) },
    };
  } catch {
    return defaults;
  }
};

function PixelIcon({ type }: { type: Tool }) {
  return <span className={`tool-symbol tool-${type}`}>{TOOL_INFO[type].icon}</span>;
}

function PlayerSprite({ facing, sick }: { facing: Facing; sick: boolean }) {
  if (facing === "left" || facing === "right") {
    return <><img className="side-sprite side-walk-frame side-walk-a" src="/xiaohe-walk-right-a.png" alt="" draggable={false} /><img className="side-sprite side-walk-frame side-walk-b" src="/xiaohe-walk-right-b.png" alt="" draggable={false} /></>;
  }
  if (facing === "up") {
    return <><img className="vertical-walk-frame vertical-walk-a" src="/xiaohe-walk-up-a.png" alt="" draggable={false} /><img className="vertical-walk-frame vertical-walk-b" src="/xiaohe-walk-up-b.png" alt="" draggable={false} /></>;
  }
  if (!sick) {
    return <><img className="vertical-walk-frame vertical-walk-a" src="/xiaohe-walk-down-a.png" alt="" draggable={false} /><img className="vertical-walk-frame vertical-walk-b" src="/xiaohe-walk-down-b.png" alt="" draggable={false} /></>;
  }
  return <img className="front-sprite" src="/xiaohe-sick-sprite.png" alt="" draggable={false} />;
}

export default function FarmGame() {
  const [game, setGame] = useState<GameState>(makeNewGame);
  const [selected, setSelected] = useState<Tool>("hoe");
  const [selectedCrop, setSelectedCrop] = useState<CropType>("radish");
  const [player, setPlayer] = useState({ x: 6, y: 5 });
  const [indoorPlayer, setIndoorPlayer] = useState({ x: 34, y: 69 });
  const [facing, setFacing] = useState<Facing>("down");
  const [isWalking, setIsWalking] = useState(false);
  const [scene, setScene] = useState<Scene>("farm");
  const [activeBuilding, setActiveBuilding] = useState<BuildingId | null>(null);
  const [isFishing, setIsFishing] = useState(false);
  const [fishingPhase, setFishingPhase] = useState<"idle" | "waiting" | "bite" | "reeling">("idle");
  const [fishingMarker, setFishingMarker] = useState(4);
  const [fishingScore, setFishingScore] = useState(0);
  const [craftingOpen, setCraftingOpen] = useState(false);
  const [selectedCraftItem, setSelectedCraftItem] = useState<CraftType | null>(null);
  const [plantingPinecone, setPlantingPinecone] = useState(false);
  const [craftRotation, setCraftRotation] = useState<CraftRotation>(0);
  const [farmGateOpen, setFarmGateOpen] = useState(false);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [chestOpen, setChestOpen] = useState(false);
  const [shippingBinOpen, setShippingBinOpen] = useState(false);
  const [shippingReport, setShippingReport] = useState<{ itemCount: number; earnings: number } | null>(null);
  const [chestDepositStreak, setChestDepositStreak] = useState<{ resource: StorableResource; count: number } | null>(null);
  const [bulkChestPrompt, setBulkChestPrompt] = useState<StorableResource | null>(null);
  const [stoveLit, setStoveLit] = useState(false);
  const [neighborInterior, setNeighborInterior] = useState<NeighborScene | null>(null);
  const [residentHome, setResidentHome] = useState<ResidentHomeOwner | null>(null);
  const [friendHomeOpen, setFriendHomeOpen] = useState(false);
  const [playingWithAnan, setPlayingWithAnan] = useState(false);
  const [ananBeachOpen, setAnanBeachOpen] = useState(false);
  const [ananBeachTraveling, setAnanBeachTraveling] = useState(false);
  const [beachPlayer, setBeachPlayer] = useState({ x: 48, y: 72 });
  const [beachCrabs, setBeachCrabs] = useState(() => BEACH_CRABS.map(() => true));
  const [divingAtSea, setDivingAtSea] = useState(false);
  const [sailingWithAnan, setSailingWithAnan] = useState(false);
  const [seaCreatures, setSeaCreatures] = useState(() => BEACH_CRABS.map(() => true));
  const [festivalDisplay, setFestivalDisplay] = useState<"wood" | null>(null);
  const [amusementOpen, setAmusementOpen] = useState(false);
  const [busTraveling, setBusTraveling] = useState(false);
  const [festivalMusicPlaying, setFestivalMusicPlaying] = useState(false);
  const [festivalTreatDay, setFestivalTreatDay] = useState("");
  const [heldItem, setHeldItem] = useState<CarriedItem | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [ranchOpen, setRanchOpen] = useState(false);
  const [farmInterior, setFarmInterior] = useState<"cave" | "camp" | null>(null);
  const [drivingSchoolOpen, setDrivingSchoolOpen] = useState(false);
  const [drivingQuizStep, setDrivingQuizStep] = useState(0);
  const [drivingPracticeStep, setDrivingPracticeStep] = useState(0);
  const [carTraveling, setCarTraveling] = useState(false);
  const [carRouteTarget, setCarRouteTarget] = useState<"district" | "farm">("district");
  const [carRouteStep, setCarRouteStep] = useState(0);
  const [carHeading, setCarHeading] = useState<"forward" | "left" | "right" | "back">("forward");
  const [carStopped, setCarStopped] = useState(false);
  const [trafficLight, setTrafficLight] = useState<"red" | "green">("green");
  const [mallOpen, setMallOpen] = useState(false);
  const [mallFloor, setMallFloor] = useState<1 | 2 | 3>(1);
  const [petShopOpen, setPetShopOpen] = useState(false);
  const [petHospitalOpen, setPetHospitalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<PetType>("cat");
  const [selectedPetSex, setSelectedPetSex] = useState<"男生" | "女生">("女生");
  const [bedtimePhase, setBedtimePhase] = useState<"walkingHome" | "tuckedIn" | "waking" | null>(null);
  const [interiorFireLit, setInteriorFireLit] = useState(false);
  const [selectedResource, setSelectedResource] = useState<StorableResource | null>(null);
  const [inspectedItem, setInspectedItem] = useState<string | null>(null);
  const [message, setMessage] = useState("先用锄头开垦一块土地吧！");
  const [soundOn, setSoundOn] = useState(true);
  const [ready, setReady] = useState(false);
  const [transferringSave, setTransferringSave] = useState(false);
  const [splitScreen, setSplitScreen] = useState(false);
  const [embeddedMode, setEmbeddedMode] = useState(false);
  const [worldVillage, setWorldVillage] = useState<VillageId>("qinghe");
  const [saveStorageKey, setSaveStorageKey] = useState("qinghe-farm-save");
  const [multiplayerOpen, setMultiplayerOpen] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [playerNameInput, setPlayerNameInput] = useState("小禾");
  const [preferredVillage, setPreferredVillage] = useState<VillageId>("qinghe");
  const [multiplayerSession, setMultiplayerSession] = useState<MultiplayerSession | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [multiplayerError, setMultiplayerError] = useState("");
  const [joiningMultiplayer, setJoiningMultiplayer] = useState(false);
  const eatTimerRef = useRef<number | null>(null);
  const herbClickTimerRef = useRef<number | null>(null);
  const forestClickTimerRef = useRef<number | null>(null);
  const matchesClickTimerRef = useRef<number | null>(null);
  const woolClickTimerRef = useRef<number | null>(null);
  const walkTimerRef = useRef<number | null>(null);
  const farmActionTimerRef = useRef<number | null>(null);
  const excursionTimerRef = useRef<number | null>(null);
  const lastMoveAtRef = useRef(0);
  const longPressTriggeredRef = useRef(false);
  const fishingWaitTimerRef = useRef<number | null>(null);
  const fishingBiteTimerRef = useRef<number | null>(null);
  const fishingMarkerTimerRef = useRef<number | null>(null);
  const fishingMarkerDirectionRef = useRef(1);
  const fishingBaitUsedRef = useRef(false);
  const beachRespawnTimersRef = useRef<number[]>([]);
  const bedtimeTimersRef = useRef<number[]>([]);
  const multiplayerStatusRef = useRef({ player, game });
  const splitLeftRef = useRef<HTMLIFrameElement | null>(null);
  const splitRightRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const splitVillage = new URLSearchParams(window.location.search).get("splitVillage");
    const isEmbedded = splitVillage === "qinghe" || splitVillage === "maple";
    const village = splitVillage === "maple" ? "maple" : "qinghe";
    const storageKey = villageSaveKey(village);
    setEmbeddedMode(isEmbedded);
    if (isEmbedded) setWorldVillage(village);
    setSaveStorageKey(storageKey);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GameState;
        if (parsed.tiles?.length >= 32) {
          const defaults = makeNewGame();
          setGame({
            ...defaults,
            ...parsed,
            season: parsed.season ?? 0,
            strawberrySeeds: parsed.strawberrySeeds ?? 0,
            cornSeeds: parsed.cornSeeds ?? 0,
            pineappleSeeds: parsed.pineappleSeeds ?? 0,
            watermelonSeeds: parsed.watermelonSeeds ?? 0,
            tomatoSeeds: parsed.tomatoSeeds ?? 0,
            potatoSeeds: parsed.potatoSeeds ?? 0,
            pumpkinSeeds: parsed.pumpkinSeeds ?? 0,
            blueberrySeeds: parsed.blueberrySeeds ?? 0,
            bait: parsed.bait ?? 0,
            fishCaught: parsed.fishCaught ?? 0,
            inventory: { ...defaults.inventory, ...(parsed.inventory ?? { radish: parsed.harvested ?? 0, fish: parsed.fishCaught ?? 0 }) },
            chestStorage: { ...defaults.chestStorage, ...(parsed.chestStorage ?? {}) },
            shippingBin: { ...defaults.shippingBin, ...(parsed.shippingBin ?? {}) },
            wood: parsed.wood ?? 0,
            stone: parsed.stone ?? 0,
            herbs: parsed.herbs ?? 0,
            pinecones: parsed.pinecones ?? 0,
            pineNuts: parsed.pineNuts ?? 0,
            resin: parsed.resin ?? 0,
            cows: parsed.cows ?? 0,
            sheep: parsed.sheep ?? 0,
            groundSupplies: defaults.groundSupplies.map((defaultVisible, index) => parsed.groundSupplies?.[index] ?? defaultVisible),
            treeStates: parsed.treeStates?.length === 4 ? parsed.treeStates : defaults.treeStates,
            plantedTrees: (parsed.plantedTrees ?? []).map((tree) => ({ ...tree, watered: tree.watered ?? false })),
            rockStates: defaults.rockStates.map((defaultStanding, index) => parsed.rockStates?.[index] ?? defaultStanding),
            crafted: { ...defaults.crafted, ...(parsed.crafted ?? {}) },
            placedCrafts: parsed.placedCrafts ?? [],
            farmVisitor: parsed.farmVisitor ?? null,
            upgrades: { ...defaults.upgrades, ...(parsed.upgrades ?? {}) },
            builderSupplies: { ...defaults.builderSupplies, ...(parsed.builderSupplies ?? {}) },
            equipment: { ...defaults.equipment, ...(parsed.equipment ?? {}) },
            toolUpgrades: { ...defaults.toolUpgrades, ...(parsed.toolUpgrades ?? {}) },
            toolUpgradeDays: {
              axe: parsed.toolUpgradeDays?.axe ?? (parsed.toolUpgrades?.axe ? 7 : 0),
              rod: parsed.toolUpgradeDays?.rod ?? (parsed.toolUpgrades?.rod ? 7 : 0),
            },
            daily: parsed.daily?.day === parsed.day ? { ...defaults.daily, ...parsed.daily } : { ...defaults.daily, day: parsed.day ?? 1 },
            sick: parsed.sick ?? false,
            diagnosed: parsed.diagnosed ?? false,
            lastIllnessDay: parsed.lastIllnessDay ?? 0,
            npcHealedDays: parsed.npcHealedDays ?? {},
            lastSchoolAttendance: parsed.lastSchoolAttendance ?? "",
            mallItems: { ...defaults.mallItems, ...(parsed.mallItems ?? {}) },
          });
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    const savedSession = isEmbedded ? null : localStorage.getItem("qinghe-multiplayer-session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession) as MultiplayerSession;
        if (parsed.roomCode && parsed.deviceId && (parsed.village === "qinghe" || parsed.village === "maple")) {
          setMultiplayerSession(parsed);
          setRoomCodeInput(parsed.roomCode);
          setPlayerNameInput(parsed.playerName || "小禾");
          setPreferredVillage(parsed.village);
          setWorldVillage(parsed.village);
          const accountKey = villageSaveKey(parsed.village);
          setSaveStorageKey(accountKey);
          setGame(restoreVillageGame(localStorage.getItem(accountKey)));
        }
      } catch {
        localStorage.removeItem("qinghe-multiplayer-session");
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(saveStorageKey, JSON.stringify(game));
  }, [game, ready, saveStorageKey]);

  const switchVillage = useCallback((nextVillage: VillageId) => {
    if (nextVillage === worldVillage) return;
    localStorage.setItem(villageSaveKey(worldVillage), JSON.stringify(game));
    const nextKey = villageSaveKey(nextVillage);
    const nextGame = restoreVillageGame(localStorage.getItem(nextKey));
    setSaveStorageKey(nextKey);
    setGame(nextGame);
    setWorldVillage(nextVillage);
    setSelected("hoe");
    setSelectedResource(null);
    setSelectedCraftItem(null);
    setPlantingPinecone(false);
    setFarmGateOpen(false);
    setHeldItem(null);
    setChestOpen(false);
    setShippingBinOpen(false);
    setCraftingOpen(false);
    setRanchOpen(false);
    setFarmInterior(null);
    setInteriorFireLit(false);
    setActiveBuilding(null);
    setNeighborInterior(null);
    setResidentHome(null);
    setFriendHomeOpen(false);
  }, [game, worldVillage]);

  useEffect(() => {
    if (!ready || scene !== "farm" || game.farmVisitor) return;
    const youngCropIndex = game.tiles.findIndex((tile) => tile.state === "crop" && tile.stage <= 1);
    if (youngCropIndex < 0) return;
    const distanceFromField = Math.hypot(player.x - 6, player.y - 5);
    if (distanceFromField < 5) return;
    const fenceCount = game.placedCrafts.filter((craft) => craft.type === "fence").length;
    const scarecrowCount = game.placedCrafts.filter((craft) => craft.type === "scarecrow").length;
    if ((fenceCount >= 8 && !farmGateOpen) || scarecrowCount >= 1 || game.upgrades.stoneWall > 0) return;
    setGame((current) => ({
      ...current,
      farmVisitor: "animal",
      tiles: current.tiles.map((tile, index) => index === youngCropIndex ? { state: "soil", stage: 0, watered: false } : tile),
    }));
    setMessage("小禾离农田超过五格，一只小动物马上跑进来偷吃了 1 株幼苗！围好 8 段围栏、放稻草人或修石墙就能保护它们。 ");
    playTone(220);
  }, [farmGateOpen, game.farmVisitor, game.placedCrafts, game.tiles, game.upgrades.stoneWall, player.x, player.y, ready, scene]);

  useEffect(() => {
    multiplayerStatusRef.current = { player, game };
  }, [game, player]);

  useEffect(() => {
    if (!ready) return;
    const token = new URLSearchParams(window.location.search).get("save");
    if (!token) return;
    let cancelled = false;
    void fetch(`/api/cloud-save?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json() as { save?: GameState; error?: string };
        if (!response.ok || !data.save) throw new Error(data.error || "存档读取失败");
        if (cancelled || data.save.tiles?.length < 32) return;
        const defaults = makeNewGame();
        setGame({
          ...defaults,
          ...data.save,
          inventory: { ...defaults.inventory, ...(data.save.inventory ?? {}) },
          chestStorage: { ...defaults.chestStorage, ...(data.save.chestStorage ?? {}) },
          shippingBin: { ...defaults.shippingBin, ...(data.save.shippingBin ?? {}) },
          plantedTrees: (data.save.plantedTrees ?? []).map((tree) => ({ ...tree, watered: tree.watered ?? false })),
          crafted: { ...defaults.crafted, ...(data.save.crafted ?? {}) },
          upgrades: { ...defaults.upgrades, ...(data.save.upgrades ?? {}) },
          builderSupplies: { ...defaults.builderSupplies, ...(data.save.builderSupplies ?? {}) },
          equipment: { ...defaults.equipment, ...(data.save.equipment ?? {}) },
          toolUpgrades: { ...defaults.toolUpgrades, ...(data.save.toolUpgrades ?? {}) },
          toolUpgradeDays: {
            axe: data.save.toolUpgradeDays?.axe ?? (data.save.toolUpgrades?.axe ? 7 : 0),
            rod: data.save.toolUpgradeDays?.rod ?? (data.save.toolUpgrades?.rod ? 7 : 0),
          },
          diagnosed: data.save.diagnosed ?? false,
          daily: { ...defaults.daily, ...(data.save.daily ?? {}) },
        });
        setMessage("旧游戏的农田、金币、种子和物品已经全部转入网页版！");
        window.history.replaceState({}, "", window.location.pathname);
      })
      .catch((error: unknown) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "存档读取失败");
      });
    return () => { cancelled = true; };
  }, [ready]);

  useEffect(() => {
    if (!ready || game.energy > 0 || game.sick) return;
    setGame((current) => ({ ...current, sick: true, diagnosed: false, lastIllnessDay: current.day }));
    setMessage("小禾累得没有精神，嘴角悄悄垂了下来。 ");
  }, [game.energy, game.sick, ready]);

  useEffect(() => {
    if (!ready) return;
    const clock = window.setInterval(() => {
      setGame((current) => current.hour >= 23 ? current : { ...current, hour: current.hour + 1 });
    }, 60_000);
    return () => window.clearInterval(clock);
  }, [ready]);

  useEffect(() => {
    const rainy = game.weather === "rain" || game.weather === "thunder";
    const indoors = Boolean(activeBuilding || neighborInterior || residentHome || friendHomeOpen || farmInterior || mallOpen || petShopOpen || petHospitalOpen || ananBeachOpen);
    if (!ready) return;
    if (!rainy || indoors || game.umbrellaOpen) {
      if (game.rainExposure > 0) setGame((current) => ({ ...current, rainExposure: 0 }));
      return;
    }
    if (game.sick) return;
    const rainTimer = window.setInterval(() => {
      setGame((current) => {
        const rainExposure = current.rainExposure + 5;
        if (rainExposure < 60 || current.sick) return { ...current, rainExposure };
        setMessage("小禾在雨里淋得太久，冷得发抖，嘴角也变成了伤心的样子。快去诊所检查或回家休息吧。");
        playTone(210);
        return { ...current, rainExposure, sick: true, diagnosed: false, lastIllnessDay: current.day };
      });
    }, 5_000);
    return () => window.clearInterval(rainTimer);
  }, [activeBuilding, ananBeachOpen, farmInterior, friendHomeOpen, game.rainExposure, game.sick, game.umbrellaOpen, game.weather, mallOpen, neighborInterior, petHospitalOpen, petShopOpen, ready, residentHome]);

  useEffect(() => {
    if (!carTraveling || carStopped || ![0, 3, 5].includes(carRouteStep)) return;
    const driveTimer = window.setTimeout(() => {
      if (carRouteStep === 0) {
        setCarRouteStep(1);
        setTrafficLight("red");
        setMessage("前方红灯亮了，及时按下刹车停车。 ");
        return;
      }
      if (carRouteStep === 3) {
        setCarRouteStep(4);
        setMessage("公路在前方出现第二个九十度弯口，请看道路形状转向。 ");
        return;
      }
      setCarTraveling(false);
      setCarStopped(false);
      if (carRouteTarget === "district") {
        setScene("mysteryRoad"); setPlayer({ x: 6, y: 5 }); setMessage("你安全驾驶汽车到达了远方新区！三层青禾大商场就在前方。 ");
      } else {
        setScene("westFriendFarm"); setPlayer({ x: 6, y: 4 }); setMessage("你安全驾驶汽车回到了安安的小农场。 ");
      }
      playTone(900);
    }, carRouteStep === 5 ? 1_350 : 1_700);
    return () => window.clearTimeout(driveTimer);
  }, [carRouteStep, carRouteTarget, carStopped, carTraveling]);

  useEffect(() => () => {
    if (eatTimerRef.current) window.clearTimeout(eatTimerRef.current);
    if (walkTimerRef.current) window.clearTimeout(walkTimerRef.current);
    if (matchesClickTimerRef.current) window.clearTimeout(matchesClickTimerRef.current);
    if (woolClickTimerRef.current) window.clearTimeout(woolClickTimerRef.current);
    if (farmActionTimerRef.current) window.clearTimeout(farmActionTimerRef.current);
    if (excursionTimerRef.current) window.clearTimeout(excursionTimerRef.current);
    if (fishingWaitTimerRef.current) window.clearTimeout(fishingWaitTimerRef.current);
    if (fishingBiteTimerRef.current) window.clearTimeout(fishingBiteTimerRef.current);
    if (fishingMarkerTimerRef.current) window.clearInterval(fishingMarkerTimerRef.current);
    beachRespawnTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    beachRespawnTimersRef.current = [];
    bedtimeTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    bedtimeTimersRef.current = [];
  }, []);

  useEffect(() => {
    if (fishingPhase !== "reeling") return;
    fishingMarkerDirectionRef.current = 1;
    setFishingMarker(4);
    fishingMarkerTimerRef.current = window.setInterval(() => {
      setFishingMarker((current) => {
        const speed = game.toolUpgrades.rod ? 4 : 6;
        let next = current + fishingMarkerDirectionRef.current * speed;
        if (next >= 96) { next = 96; fishingMarkerDirectionRef.current = -1; }
        if (next <= 4) { next = 4; fishingMarkerDirectionRef.current = 1; }
        return next;
      });
    }, 70);
    return () => {
      if (fishingMarkerTimerRef.current) window.clearInterval(fishingMarkerTimerRef.current);
      fishingMarkerTimerRef.current = null;
    };
  }, [fishingPhase, game.toolUpgrades.rod]);

  const showWalking = useCallback((dx: number, dy: number) => {
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) setFacing(dx < 0 ? "left" : "right");
    else if (dy !== 0) setFacing(dy < 0 ? "up" : "down");
    setIsWalking(true);
    if (walkTimerRef.current) window.clearTimeout(walkTimerRef.current);
    walkTimerRef.current = window.setTimeout(() => setIsWalking(false), 520);
  }, []);

  const crossSceneBoundary = useCallback((destination: { x: number; y: number }, dx: number, dy: number) => {
    if (scene === "farm" && worldVillage === "maple" && dx < 0 && destination.x === 0) {
      const friend = onlinePlayers.find((onlinePlayer) => onlinePlayer.deviceId !== multiplayerSession?.deviceId && onlinePlayer.online && onlinePlayer.currentVillage === "qinghe");
      switchVillage("qinghe");
      setScene(friend?.scene ?? "farm");
      setPlayer(friend ? { x: Math.max(0, Math.min(11, friend.x + 1)), y: friend.y } : { x: 11, y: 5 });
      setMessage(friend ? `沿着左边山路到了青禾村，一进村就看见了${friend.playerName}！` : "沿着左边山路到了青禾村。朋友来到同一个场景后就会出现。 ");
      return true;
    }
    if (scene === "farm" && worldVillage === "qinghe" && dx < 0 && destination.x === 0) {
      setScene("westFriendFarm"); setPlayer({ x: 11, y: 5 }); setMessage("沿着农场左边的草路，来到安安的小农场。 "); return true;
    }
    if (scene === "westFriendFarm" && dx > 0 && destination.x === 11) {
      setScene("farm"); setPlayer({ x: 0, y: 5 }); setMessage("从安安的小农场回到青禾农场。 "); return true;
    }
    if (scene === "farm" && dx > 0 && destination.x === 11) {
      setScene("town"); setPlayer({ x: 0, y: 5 }); setMessage(`欢迎来到${VILLAGE_INFO[worldVillage].name}！走到道路边缘就能继续前往其他地方。`); return true;
    }
    if (scene === "town" && dx < 0 && destination.x === 0) {
      setScene("farm"); setPlayer({ x: 11, y: 5 }); setMessage("回到农场啦。今天还想种些什么？"); return true;
    }
    if (scene === "town" && dx > 0 && destination.x === 11) {
      setScene("eastNeighbor"); setPlayer({ x: 0, y: 5 }); setMessage("来到林婶的果园小屋，林婶正在门口散步。 "); return true;
    }
    if (scene === "town" && dy > 0 && destination.y === 7) {
      setScene("southNeighbor"); setPlayer({ x: 6, y: 0 }); setMessage("来到鲁师傅的山脚院子，木料堆得整整齐齐。 "); return true;
    }
    if (scene === "town" && dy < 0 && destination.y === 0) {
      setScene("cultureDistrict"); setPlayer({ x: 6, y: 7 }); setMessage("来到清河文化街，镇公所在左边，青禾博物馆在右边。 "); return true;
    }
    if (scene === "cultureDistrict" && dy < 0 && destination.y === 0) {
      setScene("northNeighbor"); setPlayer({ x: 6, y: 7 }); setMessage("穿过文化街后面的林间小路，来到叶老师的北林书屋。 "); return true;
    }
    if (scene === "cultureDistrict" && dy > 0 && destination.y === 7) {
      setScene("town"); setPlayer({ x: 6, y: 0 }); setMessage("沿着石板路回到青禾镇中心街。 "); return true;
    }
    if (scene === "cultureDistrict" && dx > 0 && destination.x === 11) {
      setScene("residentialDistrict"); setPlayer({ x: 0, y: 5 }); setMessage("沿着文化街右侧的小路来到青禾住宅坡。 "); return true;
    }
    if (scene === "residentialDistrict" && dx < 0 && destination.x === 0) {
      setScene("cultureDistrict"); setPlayer({ x: 11, y: 5 }); setMessage("从青禾住宅坡回到清河文化街。 "); return true;
    }
    if (scene === "eastNeighbor" && worldVillage === "qinghe" && dx > 0 && destination.x === 11) {
      const friend = onlinePlayers.find((onlinePlayer) => onlinePlayer.deviceId !== multiplayerSession?.deviceId && onlinePlayer.online && onlinePlayer.currentVillage === "maple");
      switchVillage("maple");
      setScene(friend?.scene ?? "farm");
      setPlayer(friend ? { x: Math.max(0, Math.min(11, friend.x - 1)), y: friend.y } : { x: 0, y: 5 });
      setMessage(friend ? `沿着右边山路到了枫叶村，一进村就看见了${friend.playerName}！` : "沿着右边山路走到了枫叶村！");
      return true;
    }
    if (scene === "eastNeighbor" && dx < 0 && destination.x === 0) {
      setScene("town"); setPlayer({ x: 11, y: 5 }); setMessage("回到青禾镇中心街。"); return true;
    }
    if (scene === "southNeighbor" && dy < 0 && destination.y === 0) {
      setScene("town"); setPlayer({ x: 6, y: 7 }); setMessage("回到青禾镇中心街。"); return true;
    }
    if (scene === "northNeighbor" && dy > 0 && destination.y === 7) {
      setScene("cultureDistrict"); setPlayer({ x: 6, y: 0 }); setMessage("从北林书屋回到清河文化街。 "); return true;
    }
    return false;
  }, [multiplayerSession?.deviceId, onlinePlayers, scene, switchVillage, worldVillage]);

  const move = useCallback((dx: number, dy: number) => {
    if (ananBeachTraveling || bulkChestPrompt || drivingSchoolOpen || carTraveling || mallOpen || petShopOpen || petHospitalOpen || bedtimePhase) return;
    if (ananBeachOpen) {
      showWalking(dx, dy);
      setBeachPlayer((current) => ({
        x: Math.max(7, Math.min(93, current.x + dx * 4)),
        y: Math.max(divingAtSea ? 22 : 30, Math.min(86, current.y + dy * 4)),
      }));
      setMessage(divingAtSea ? "穿着潜水服在水下游动，靠近小鱼小虾后可以抓起。 " : "在海滩上自由走动，也可以走进浅海游泳。 ");
      return;
    }
    if (craftingOpen || chestOpen || shippingBinOpen || ranchOpen || farmInterior) return;
    const now = Date.now();
    if (now - lastMoveAtRef.current < 230) return;
    lastMoveAtRef.current = now;
    showWalking(dx, dy);
    if (neighborInterior || residentHome || friendHomeOpen) {
      setIndoorPlayer((current) => ({
        x: Math.max(20, Math.min(80, current.x + dx * 5)),
        y: Math.max(62, Math.min(76, current.y + dy * 4)),
      }));
      setMessage("在居民家里的木地板上走动。 ");
      return;
    }
    if (activeBuilding) {
      if (bedtimePhase === "waking") setBedtimePhase(null);
      setIndoorPlayer((current) => ({
        x: Math.max(26, Math.min(76, current.x + dx * 5)),
        y: Math.max(65, Math.min(74, current.y + dy * 4)),
      }));
      setMessage("小禾在屋里的木地板上走动。");
      return;
    }

    const next = {
      x: Math.max(0, Math.min(11, player.x + dx)),
      y: Math.max(0, Math.min(7, player.y + dy)),
    };
    if (scene === "farm") {
      const fenceCount = game.placedCrafts.filter((craft) => craft.type === "fence").length;
      const hasGate = game.placedCrafts.some((craft) => craft.type === "gate");
      const isInsideField = (position: { x: number; y: number }) => position.x >= 2 && position.x <= 9 && position.y >= 4;
      const crossingFence = isInsideField(player) !== isInsideField(next);
      const crossingAtGate = hasGate && farmGateOpen && next.x >= 5 && next.x <= 6 && ((player.y === 3 && next.y === 4) || (player.y === 4 && next.y === 3));
      if (fenceCount >= 8 && crossingFence && !crossingAtGate) {
        setMessage(hasGate ? "木围栏挡住了路。点击围栏中间的门把它打开，再从门口进出。 " : "完整的木围栏也会挡住小禾。先制作一扇木围栏门，装到围栏中间吧。 ");
        return;
      }
    }
    if (crossSceneBoundary(next, dx, dy)) return;
    setPlayer(next);

    if (scene === "town" || scene === "cultureDistrict") {
      let entrance: BuildingId | null = null;
      if (scene === "cultureDistrict") {
        if (next.x >= 1 && next.x <= 3 && next.y <= 4) entrance = "townhall";
        else if (next.x >= 5 && next.x <= 7 && next.y <= 4) entrance = "school";
        else if (next.x >= 9 && next.x <= 11 && next.y <= 4 && worldVillage === "qinghe") entrance = "museum";
      } else {
        if (next.x >= 2 && next.x <= 4 && next.y <= 3) entrance = "supermarket";
        else if (next.x >= 9 && next.y <= 3) entrance = "clinic";
        else if (next.x >= 2 && next.x <= 4 && next.y >= 6) entrance = "workshop";
        else if (next.x >= 7 && next.x <= 9 && next.y >= 6) entrance = "library";
        else if (next.x >= 10 && next.y >= 6) entrance = "cafe";
      }

      if (entrance) {
        setActiveBuilding(entrance);
        const doctorIsResting = entrance === "clinic" && NPC_SICK_DAYS["白医生"]?.includes(game.day) && game.npcHealedDays["白医生"] !== game.day;
        setMessage(doctorIsResting ? "进入青禾诊所。白医生生病了，正在自己的家里休息，红衣助手今天代班。" : `进入${BUILDING_INFO[entrance].name}。`);
      }
    }
  }, [activeBuilding, ananBeachOpen, ananBeachTraveling, bedtimePhase, bulkChestPrompt, carTraveling, chestOpen, shippingBinOpen, craftingOpen, crossSceneBoundary, divingAtSea, drivingSchoolOpen, farmGateOpen, farmInterior, friendHomeOpen, game.day, game.npcHealedDays, game.placedCrafts, mallOpen, neighborInterior, petHospitalOpen, petShopOpen, player, ranchOpen, residentHome, scene, showWalking, worldVillage]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (splitScreen && !embeddedMode) {
        if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault();
        if (["w", "a", "s", "d"].includes(key)) splitLeftRef.current?.contentWindow?.postMessage({ type: "split-move", key }, window.location.origin);
        if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) splitRightRef.current?.contentWindow?.postMessage({ type: "split-move", key }, window.location.origin);
        return;
      }
      if (key === "escape" && bulkChestPrompt) {
        setBulkChestPrompt(null);
        setChestDepositStreak(null);
        setMessage("暂时不把剩下的物品全部放入收纳箱。 ");
        return;
      }
      if (key === "escape" && (ananBeachOpen || ananBeachTraveling)) {
        setAnanBeachOpen(false);
        setAnanBeachTraveling(false);
        setDivingAtSea(false);
        setMessage("和安安坐巴士回到了青禾农场。 ");
        return;
      }
      if (key === "escape" && builderOpen) {
        setBuilderOpen(false);
        setMessage("收起鲁师傅的扩建委托。 ");
        return;
      }
      if (key === "escape" && ranchOpen) {
        setRanchOpen(false);
        setMessage("离开青禾动物牧场。 ");
        return;
      }
      if (key === "escape" && farmInterior) {
        setFarmInterior(null);
        setInteriorFireLit(false);
        setMessage(farmInterior === "cave" ? "从山洞回到大农场。" : "掀开帐篷门帘回到露营地。");
        return;
      }
      if (key === "escape" && neighborInterior) {
        setNeighborInterior(null);
        setMessage("从居民家的门口出来了。 ");
        return;
      }
      if (key === "escape" && residentHome) {
        setResidentHome(null);
        setMessage("从居民自己的房子里出来了。 ");
        return;
      }
      if (key === "escape" && friendHomeOpen) {
        setFriendHomeOpen(false);
        setMessage("从安安的林边小屋出来了。 ");
        return;
      }
      if (key === "escape" && chestOpen) {
        setChestOpen(false);
        setMessage("关上木箱。");
        return;
      }
      if (key === "escape" && shippingBinOpen) {
        setShippingBinOpen(false);
        setMessage("关上大号出货箱，放进去的东西会在睡觉后售卖。 ");
        return;
      }
      if (key === "escape" && craftingOpen) {
        setCraftingOpen(false);
        setMessage("收起制作手册。");
        return;
      }
      if (key === "escape" && petShopOpen) {
        setPetShopOpen(false);
        setMessage("离开青禾宠物之家，回到远方新区。 ");
        return;
      }
      if (key === "escape" && petHospitalOpen) {
        setPetHospitalOpen(false);
        setMessage("离开宠物医院，回到远方新区。 ");
        return;
      }
      if (key === "escape" && activeBuilding) {
        const building = BUILDING_INFO[activeBuilding];
        setActiveBuilding(null);
        setPlayer(building.exit);
        setMessage(`离开${building.name}，回到${activeBuilding === "townhall" || activeBuilding === "museum" ? "文化街" : "中心街"}。`);
        return;
      }
      if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
      }
      if (key === "w" || key === "arrowup") move(0, -1);
      if (key === "s" || key === "arrowdown") move(0, 1);
      if (key === "a" || key === "arrowleft") move(-1, 0);
      if (key === "d" || key === "arrowright") move(1, 0);
      if (["1", "2", "3", "4", "5", "6"].includes(key)) setSelectedResource(null);
      if (key === "1") setSelected("hoe");
      if (key === "2") setSelected("seed");
      if (key === "3") setSelected("water");
      if (key === "4") setSelected("hand");
      if (key === "5") setSelected("rod");
      if (key === "6") setSelected("axe");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeBuilding, ananBeachOpen, ananBeachTraveling, builderOpen, bulkChestPrompt, chestOpen, shippingBinOpen, craftingOpen, embeddedMode, farmInterior, friendHomeOpen, move, neighborInterior, petHospitalOpen, petShopOpen, ranchOpen, residentHome, splitScreen]);

  useEffect(() => {
    if (!embeddedMode) return;
    const handleSplitMove = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== "split-move") return;
      const key = String(event.data.key).toLowerCase();
      if (key === "w" || key === "arrowup") move(0, -1);
      if (key === "s" || key === "arrowdown") move(0, 1);
      if (key === "a" || key === "arrowleft") move(-1, 0);
      if (key === "d" || key === "arrowright") move(1, 0);
    };
    window.addEventListener("message", handleSplitMove);
    return () => window.removeEventListener("message", handleSplitMove);
  }, [embeddedMode, move]);

  const playTone = (frequency = 420) => {
    if (!soundOn) return;
    try {
      const AudioContextClass = window.AudioContext;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.08);
    } catch {
      // Sound is an optional enhancement.
    }
  };

  const tasteFestivalJam = () => {
    setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 25) }));
    setMessage("尝了一勺林婶的草莓果酱，甜甜的，恢复 25 点体力！");
    playTone(760);
  };

  const playValleyMusic = () => {
    if (festivalMusicPlaying || !soundOn) {
      if (!soundOn) setMessage("先打开右上角的音效，再来听山谷音乐吧。 ");
      return;
    }
    setFestivalMusicPlaying(true);
    setMessage("山谷乐队开始演奏一首完整的小曲啦，居民们跟着节拍跳起舞来！");
    try {
      const context = new window.AudioContext();
      const beat = .29;
      const melody: Array<number | null> = [
        523, 659, 784, 659, 587, 698, 784, null,
        659, 784, 880, 784, 698, 659, 587, null,
        523, 587, 659, 784, 880, 784, 659, 587,
        523, 659, 698, 784, 659, 587, 523, null,
        659, 784, 880, 988, 880, 784, 698, 659,
        587, 698, 784, 659, 587, 523, 523, null,
      ];
      const master = context.createGain();
      master.gain.value = .72;
      master.connect(context.destination);
      melody.forEach((frequency, index) => {
        if (!frequency) return;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startsAt = context.currentTime + .08 + index * beat;
        oscillator.type = "triangle";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.001, startsAt);
        gain.gain.exponentialRampToValueAtTime(.055, startsAt + .025);
        gain.gain.exponentialRampToValueAtTime(.001, startsAt + beat * .86);
        oscillator.connect(gain).connect(master);
        oscillator.start(startsAt);
        oscillator.stop(startsAt + beat * .9);
      });
      const bassNotes = [131, 147, 165, 131, 147, 175, 165, 131, 165, 147, 131, 131];
      bassNotes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startsAt = context.currentTime + .08 + index * beat * 4;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.035, startsAt);
        gain.gain.exponentialRampToValueAtTime(.001, startsAt + beat * 3.4);
        oscillator.connect(gain).connect(master);
        oscillator.start(startsAt);
        oscillator.stop(startsAt + beat * 3.5);
      });
      const duration = melody.length * beat * 1_000 + 350;
      window.setTimeout(() => { setFestivalMusicPlaying(false); void context.close(); }, duration);
    } catch {
      setFestivalMusicPlaying(false);
    }
  };

  const cancelFishing = () => {
    if (fishingWaitTimerRef.current) window.clearTimeout(fishingWaitTimerRef.current);
    if (fishingBiteTimerRef.current) window.clearTimeout(fishingBiteTimerRef.current);
    fishingWaitTimerRef.current = null;
    fishingBiteTimerRef.current = null;
    setFishingPhase("idle");
    setFishingScore(0);
    setIsFishing(false);
  };

  const finishFishingCatch = () => {
    const catches = ["银鳞鲫", "春溪鳟", "花尾鲤", "小泥鳅"];
    const caught = catches[Math.floor(Math.random() * catches.length)];
    const fishingFestivalBonus = currentFestival?.id === "fishing" ? 2 : 0;
    const luckyRodBonus = game.toolUpgrades.rod ? 1 : 0;
    const expandedPondBonus = game.upgrades.pond ? 1 : 0;
    const amount = (fishingBaitUsedRef.current ? 2 : 1) + fishingFestivalBonus + luckyRodBonus + expandedPondBonus;
    setGame((current) => ({ ...current, fishCaught: current.fishCaught + amount, inventory: { ...current.inventory, fish: current.inventory.fish + amount }, daily: { ...current.daily, fish: current.daily.fish + amount } }));
    setMessage(`成功钓到${caught}！鱼获 +${amount}${fishingBaitUsedRef.current ? "，鱼饵让基础鱼获翻倍" : ""}${fishingFestivalBonus ? "，钓鱼节额外奖励 2 条" : ""}${luckyRodBonus ? "，幸运鱼竿再加 1 条" : ""}${expandedPondBonus ? "，扩建鱼塘再加 1 条" : ""}，已经放进背包。`);
    setFishingPhase("idle");
    setFishingScore(0);
    setIsFishing(false);
    playTone(820);
  };

  const attemptReel = () => {
    const zoneStart = game.toolUpgrades.rod ? 38 : 47;
    const zoneEnd = game.toolUpgrades.rod ? 79 : 70;
    if (fishingMarker >= zoneStart && fishingMarker <= zoneEnd) {
      const nextScore = fishingScore + 1;
      if (nextScore >= 3) finishFishingCatch();
      else {
        setFishingScore(nextScore);
        setMessage(`提竿时机正确！还要命中 ${3 - nextScore} 次绿色区域。`);
        playTone(690 + nextScore * 60);
      }
    } else {
      setFishingScore((score) => Math.max(0, score - 1));
      setMessage("提竿早了或晚了！等游标进入绿色区域再点。 ");
      playTone(240);
    }
  };

  const castLine = () => {
    if (selected !== "rod") {
      setMessage("先在工具栏选择鱼竿，再点击钓鱼池。");
      playTone(260);
      return;
    }
    if (fishingPhase === "waiting") {
      setMessage("浮标还没有动，先耐心等问号出现。 ");
      return;
    }
    if (fishingPhase === "bite") {
      if (fishingBiteTimerRef.current) window.clearTimeout(fishingBiteTimerRef.current);
      setFishingPhase("reeling");
      setFishingScore(0);
      setMessage("鱼咬钩了！等游标进入绿色区域时点击“提竿”，连续成功 3 次。 ");
      playTone(880);
      return;
    }
    if (fishingPhase === "reeling") {
      attemptReel();
      return;
    }
    if (game.energy < 5) {
      setMessage("体力不够了，明天再来钓鱼吧。");
      playTone(220);
      return;
    }

    setIsFishing(true);
    const baitUsed = game.bait > 0;
    fishingBaitUsedRef.current = baitUsed;
    setFishingPhase("waiting");
    setMessage("浮标落入水中……先耐心等鱼儿咬钩。");
    setGame((current) => ({ ...current, bait: baitUsed ? current.bait - 1 : current.bait, energy: current.energy - 5 }));
    playTone(390);
    const waitTime = game.toolUpgrades.rod ? 700 + Math.random() * 700 : 1_700 + Math.random() * 1_500;
    fishingWaitTimerRef.current = window.setTimeout(() => {
      setFishingPhase("bite");
      setMessage("？ 鱼咬钩了！赶紧点击钓鱼池！");
      playTone(940);
      fishingBiteTimerRef.current = window.setTimeout(() => {
        setFishingPhase("idle");
        setIsFishing(false);
        setMessage("慢了一步，鱼把鱼钩吐出来游走了。重新抛竿再试试。 ");
        playTone(210);
      }, game.toolUpgrades.rod ? 2_200 : 1_650);
    }, waitTime);
  };

  const chopTree = (index: number) => {
    if (selected !== "axe") {
      setMessage(game.treeStates[index] ? "先选择斧头，再点击树木砍伐。" : "这里只剩树桩了。松果可以种在旁边任意绿色草地上。 ");
      playTone(250);
      return;
    }
    if (!game.treeStates[index]) {
      setMessage("这里只剩树桩了，过一天会有树重新长出来。");
      return;
    }
    if (game.energy < 4) {
      setMessage("体力不够，明天再来砍树吧。");
      playTone(220);
      return;
    }

    setGame((current) => ({
      ...current,
      energy: current.energy - 4,
      wood: current.wood + (current.toolUpgrades.axe ? 6 : 4),
      pinecones: current.pinecones + 1,
      pineNuts: current.pineNuts + 2,
      resin: current.resin + 2,
      treeStates: current.treeStates.map((tree, treeIndex) => treeIndex === index ? false : tree),
      daily: { ...current.daily, chopped: current.daily.chopped + 1 },
    }));
    setMessage(`砍下树木，获得 ${game.toolUpgrades.axe ? 6 : 4} 块木头、1 个松果、2 颗松子和 2 滴树脂！树脂可以用来制作火柴。`);
    playTone(330);
  };

  const chopPlantedTree = (tree: PlantedTree) => {
    if (tree.stage < 3) {
      if (selected !== "water") {
        setMessage(`这棵松树还在生长，现在是第 ${tree.stage + 1} 阶段。选择洒水壶给它浇水，睡到明天才会长大。`);
        playTone(420);
        return;
      }
      if (game.water <= 0) {
        setMessage("水壶空了，明早会自动装满，再来给松树苗浇水吧。 ");
        playTone(220);
        return;
      }
      if (tree.watered) {
        setMessage("这棵松树苗今天已经喝饱水了，睡到明天就会长大一点。 ");
        return;
      }
      setGame((current) => ({
        ...current,
        water: current.water - 1,
        energy: Math.max(0, current.energy - 1),
        wateredCount: current.wateredCount + 1,
        daily: { ...current.daily, watered: current.daily.watered + 1 },
        plantedTrees: current.plantedTrees.map((plantedTree) => plantedTree.id === tree.id ? { ...plantedTree, watered: true } : plantedTree),
      }));
      setMessage("给松树苗浇好水了！叶片上亮着水珠，睡到明天就会长高。 ");
      playTone(620);
      return;
    }
    if (selected !== "axe") {
      setMessage("这棵松果树已经长大了，选择斧头后可以砍伐。 ");
      return;
    }
    if (game.energy < 4) {
      setMessage("体力不够，明天再来砍这棵树吧。 ");
      return;
    }
    setGame((current) => ({
      ...current,
      energy: current.energy - 4,
      wood: current.wood + (current.toolUpgrades.axe ? 6 : 4),
      pinecones: current.pinecones + 1,
      pineNuts: current.pineNuts + 2,
      resin: current.resin + 2,
      plantedTrees: current.plantedTrees.filter((plantedTree) => plantedTree.id !== tree.id),
      daily: { ...current.daily, chopped: current.daily.chopped + 1 },
    }));
    setMessage("长大的松树被砍下，获得木头、松果、松子和 2 滴绿色树脂。它空出的位置还能再种松果。 ");
    playTone(330);
  };

  const breakRock = (index: number) => {
    if (selected !== "axe") {
      setMessage("先选择斧头，再点击农舍门口的石头。");
      playTone(250);
      return;
    }
    if (!game.rockStates[index]) {
      setMessage("石头已经敲碎了，睡一觉后会有新石头出现。");
      return;
    }
    if (game.energy < 4) {
      setMessage("体力不够，明天再来敲石头吧。");
      playTone(220);
      return;
    }
    setGame((current) => ({
      ...current,
      energy: current.energy - 4,
      stone: current.stone + (current.toolUpgrades.axe ? 6 : 3),
      rockStates: current.rockStates.map((rock, rockIndex) => rockIndex === index ? false : rock),
    }));
    setMessage(`敲碎石头，获得 ${game.toolUpgrades.axe ? 6 : 3} 块石材！${game.toolUpgrades.axe ? "精铁斧头让石材收获翻倍。" : "木头和石材可以用来扩建。"}`);
    playTone(290);
  };

  const craftItem = (item: CraftType) => {
    const recipe = CRAFT_RECIPES[item];
    const resinCost = recipe.resin ?? 0;
    const woolCost = recipe.wool ?? 0;
    if (game.wood < recipe.wood || game.stone < recipe.stone || game.resin < resinCost || game.wool < woolCost) {
      setMessage(`制作${recipe.name}需要${recipe.wood ? ` ${recipe.wood} 木头` : ""}${recipe.stone ? `、${recipe.stone} 石材` : ""}${resinCost ? `、${resinCost} 滴树脂` : ""}${woolCost ? ` ${woolCost} 团羊毛` : ""}，材料还不够。`);
      playTone(220);
      return;
    }

    setGame((current) => ({
      ...current,
      wood: current.wood - recipe.wood,
      stone: current.stone - recipe.stone,
      resin: current.resin - resinCost,
      wool: current.wool - woolCost,
      crafted: { ...current.crafted, [item]: current.crafted[item] + 1 },
    }));
    setMessage(`制作完成：${recipe.name}！已经放进下方背包。${item === "matches" ? "进入山洞或帐篷后可以点燃。" : item === "blanket" ? "点击背包里的羊毛毯就能盖着休息。" : "选中后再点击农场位置摆放。"}`);
    playTone(700);
  };

  const buildAnimalPen = () => {
    if (game.animalPen) {
      setMessage("动物围栏已经建在农场旁边了。 ");
      return;
    }
    if (game.wood < 12 || game.stone < 4) {
      setMessage("建动物围栏需要 12 块木头和 4 块石材。 ");
      playTone(220);
      return;
    }
    setGame((current) => ({ ...current, wood: current.wood - 12, stone: current.stone - 4, animalPen: true }));
    setMessage("动物围栏建好了！现在可以去牧场买鸡、奶牛和绵羊。 ");
    playTone(760);
  };

  const buyFarmAnimal = (animal: "chicken" | "cow" | "sheep") => {
    if (!game.animalPen) {
      setMessage("先在牧场委托建一个动物围栏，动物才有安全的家。 ");
      playTone(220);
      return;
    }
    const price = animal === "chicken" ? 180 : animal === "cow" ? 350 : 300;
    const animalName = animal === "chicken" ? "小鸡" : animal === "cow" ? "奶牛" : "绵羊";
    if (game.coins < price) {
      setMessage(`金币不够，买${animalName}需要 ${price} 金币。`);
      playTone(220);
      return;
    }
    const field = animal === "chicken" ? "chickens" : animal === "cow" ? "cows" : "sheep";
    setGame((current) => ({ ...current, coins: current.coins - price, [field]: current[field] + 1 }));
    setMessage(`买到一只${animalName}，它已经住进农场旁的围栏。`);
    playTone(820);
  };

  const collectAnimalProduct = (animal: "chicken" | "cow" | "sheep") => {
    if (animal === "chicken") {
      if (game.chickens <= 0) { setMessage("围栏里还没有鸡，可以去牧场购买。 "); return; }
      if (game.lastEggDay === game.day) { setMessage("今天的鸡蛋已经收过了，明早再来吧。 "); return; }
      setGame((current) => ({ ...current, eggs: current.eggs + current.chickens, lastEggDay: current.day }));
      setMessage(`从鸡窝收到了 ${game.chickens} 枚鸡蛋！`);
    } else if (animal === "cow") {
      if (game.cows <= 0) { setMessage("围栏里还没有牛，可以去牧场购买。 "); return; }
      if (game.lastMilkDay === game.day) { setMessage("今天已经挤过牛奶了，明早再来吧。 "); return; }
      setGame((current) => ({ ...current, milk: current.milk + current.cows, lastMilkDay: current.day }));
      setMessage(`给每头牛挤奶，得到 ${game.cows} 瓶新鲜牛奶！`);
    } else {
      if (game.sheep <= 0) { setMessage("围栏里还没有绵羊，可以去牧场购买。 "); return; }
      if (game.lastWoolDay === game.day) { setMessage("今天已经给绵羊梳过毛了，明早再来吧。 "); return; }
      setGame((current) => ({ ...current, wool: current.wool + current.sheep, lastWoolDay: current.day }));
      setMessage(`给绵羊梳理毛发，收到了 ${game.sheep} 团柔软羊毛！羊毛可以卖、送人，3 团还能做成保暖毛毯。`);
    }
    playTone(760);
  };

  const pickUpMaterial = (material: "wood" | "stone") => {
    if (game[material] <= 0) {
      setMessage(material === "wood" ? "现在没有木头可以拿起来。" : "现在没有石材可以拿起来。 ");
      return;
    }
    setHeldItem({ kind: "material", id: material });
    setSelectedResource(null);
    setMessage(`双击拿起了${material === "wood" ? "木头" : "石材"}，它现在举在小禾头顶。点击任意居民就能送给对方。`);
    playTone(540);
  };

  const forestItemCount = (item: ForestItem) => item === "pinecone" ? game.pinecones : game.pineNuts;
  const forestItemName = (item: ForestItem) => item === "pinecone" ? "松果" : "松子";

  const pickUpForestItem = (item: ForestItem) => {
    if (forestItemCount(item) <= 0) {
      setMessage(`现在没有${forestItemName(item)}可以拿起来。`);
      return;
    }
    setHeldItem({ kind: "forest", id: item });
    setSelectedResource(null);
    setPlantingPinecone(false);
    setMessage(`双击拿起了${forestItemName(item)}，它现在举在小禾头顶，可以送给居民。`);
    playTone(560);
  };

  const choosePinecone = () => {
    if (game.pinecones <= 0) {
      setMessage("背包里还没有松果。砍树后会掉落松果。");
      return;
    }
    setPlantingPinecone((selectedNow) => !selectedNow);
    setSelectedCraftItem(null);
    setHeldItem(null);
    setMessage(plantingPinecone ? "已经收起松果。" : "拿出松果了！现在点击农场任意绿色草地，就会种下一棵小树苗。 ");
    playTone(620);
  };

  const eatPineNut = () => {
    if (game.pineNuts <= 0) {
      setMessage("现在没有松子可以吃。砍树后会掉落松子。");
      return;
    }
    setGame((current) => ({ ...current, pineNuts: current.pineNuts - 1, energy: Math.min(100, current.energy + 8) }));
    setMessage("吃了一颗香香的松子，恢复 8 点体力！");
    playTone(760);
  };

  const clickPineNut = () => {
    if (forestClickTimerRef.current) window.clearTimeout(forestClickTimerRef.current);
    forestClickTimerRef.current = window.setTimeout(eatPineNut, 220);
  };

  const doubleClickPineNut = () => {
    if (forestClickTimerRef.current) window.clearTimeout(forestClickTimerRef.current);
    pickUpForestItem("pineNut");
  };

  const clickPinecone = () => {
    if (forestClickTimerRef.current) window.clearTimeout(forestClickTimerRef.current);
    forestClickTimerRef.current = window.setTimeout(choosePinecone, 220);
  };

  const doubleClickPinecone = () => {
    if (forestClickTimerRef.current) window.clearTimeout(forestClickTimerRef.current);
    pickUpForestItem("pinecone");
  };

  const pickUpResource = (resource: StorableResource) => {
    const name = RESOURCE_INFO[resource].name;
    if (game.inventory[resource] <= 0) {
      setMessage(`背包里还没有${name}可以拿起来。`);
      playTone(220);
      return;
    }
    setHeldItem({ kind: "resource", id: resource });
    setSelectedResource(null);
    setMessage(`双击拿起了${name}，它现在举在小禾头顶。点击任意居民就能送给对方。`);
    playTone(560);
  };

  const pickUpSeed = (crop: CropType) => {
    const field = CROP_INFO[crop].seedField;
    if (game[field] <= 0) {
      setMessage(`种子袋里没有${CROP_INFO[crop].name}种子。`);
      playTone(220);
      return;
    }
    setHeldItem({ kind: "seed", id: crop });
    setSelectedResource(null);
    setMessage(`双击拿起了${CROP_INFO[crop].name}种子包，点击任意居民就能送给对方。`);
    playTone(560);
  };

  const carryLostBook = (bookId: number, fromGround = false) => {
    const book = LOST_BOOKS[bookId];
    if (!book) return;
    if (fromGround && !game.groundBooks[bookId]) return;
    setGame((current) => ({
      ...current,
      groundBooks: fromGround ? current.groundBooks.map((visible, index) => index === bookId ? false : visible) : current.groundBooks,
      bookBag: current.bookBag.includes(bookId) ? current.bookBag : [...current.bookBag, bookId],
    }));
    setHeldItem({ kind: "book", id: bookId });
    setSelectedResource(null);
    setMessage(`捡起了${book.title}，书里写着：${book.content} 现在它被小禾举在头顶，可以送给叶老师。`);
    playTone(640);
  };

  const carryArtifact = (artifactId: number, fromGround = false) => {
    const artifact = RARE_ARTIFACTS[artifactId];
    if (!artifact) return;
    if (fromGround && !game.groundArtifacts[artifactId]) return;
    setGame((current) => ({
      ...current,
      groundArtifacts: fromGround ? current.groundArtifacts.map((visible, index) => index === artifactId ? false : visible) : current.groundArtifacts,
      artifactBag: current.artifactBag.includes(artifactId) ? current.artifactBag : [...current.artifactBag, artifactId],
    }));
    setHeldItem({ kind: "artifact", id: artifactId });
    setSelectedResource(null);
    setMessage(`捡起了稀奇物品“${artifact.title}”：${artifact.description} 它现在举在头顶，可以送到青禾博物馆。`);
    playTone(900);
  };

  const pickUpAnimalProduct = (product: "egg" | "milk" | "wool") => {
    const field = product === "egg" ? "eggs" : product === "milk" ? "milk" : "wool";
    if (game[field] <= 0) {
      setMessage(product === "egg" ? "现在还没有鸡蛋，点击围栏里的鸡收取。" : product === "milk" ? "现在还没有牛奶，点击围栏里的牛挤奶。 " : "现在还没有羊毛，点击围栏里的绵羊梳毛。 ");
      return;
    }
    setHeldItem({ kind: "product", id: product });
    setSelectedResource(null);
    setMessage(`双击拿起了${product === "egg" ? "鸡蛋" : product === "milk" ? "牛奶" : "羊毛"}，现在能看到它真实的像素样子，也可以送给居民。`);
    playTone(620);
  };

  const pickUpPetGift = (gift: "feather" | "softFur" | "bone") => {
    const field = gift === "feather" ? "feathers" : gift === "softFur" ? "softFur" : "petBones";
    if (game[field] <= 0) { setMessage(gift === "feather" ? "今天还没有宠物留下羽毛。" : gift === "softFur" ? "今天还没有兔子留下软毛。" : "小鸡还没有从远处叼回小骨头。"); return; }
    setHeldItem({ kind: "petGift", id: gift });
    setSelectedResource(null);
    setMessage(`双击拿起了${gift === "feather" ? "宠物羽毛" : gift === "softFur" ? "兔子软毛" : "探险小骨头"}，可以卖掉、收藏或送给居民。`);
    playTone(610);
  };

  const pickUpResin = () => {
    if (game.resin <= 0) {
      setMessage("现在还没有树脂，砍倒一棵树就会掉落绿色树脂。 ");
      return;
    }
    setHeldItem({ kind: "resin" });
    setSelectedResource(null);
    setMessage("双击拿起了绿色树脂，小水滴现在举在小禾头顶，也可以送给居民。 ");
    playTone(600);
  };

  const pickUpMatches = () => {
    if (matchesClickTimerRef.current) window.clearTimeout(matchesClickTimerRef.current);
    if (game.crafted.matches <= 0) {
      setMessage("背包里还没有火柴，可以用 3 块木头和 2 滴树脂制作。 ");
      return;
    }
    setHeldItem({ kind: "matches" });
    setSelectedCraftItem(null);
    setMessage("双击拿起了像素火柴盒。进入山洞或帐篷后，单击火柴就能点亮。 ");
    playTone(660);
  };

  const igniteWithMatches = () => {
    if (game.crafted.matches <= 0) {
      setMessage("没有火柴了。需要 3 块木头和 2 滴树脂才能再制作一盒。 ");
      playTone(220);
      return;
    }
    if (!farmInterior) {
      setMessage("先进入山洞或帐篷，再使用火柴点亮里面。 ");
      return;
    }
    if (interiorFireLit) {
      setMessage(farmInterior === "cave" ? "山洞里的火把正在稳定燃烧。" : "帐篷里的露营灯已经亮着了。 ");
      return;
    }
    setGame((current) => ({ ...current, crafted: { ...current.crafted, matches: Math.max(0, current.crafted.matches - 1) } }));
    setHeldItem(null);
    setInteriorFireLit(true);
    setMessage(farmInterior === "cave" ? "擦亮火柴，岩壁上的水晶、矿脉和石阶都显现出来了！" : "擦亮火柴，点燃了安全的露营灯，帐篷里暖和又明亮。 ");
    playTone(820);
  };

  const clickMatches = () => {
    if (matchesClickTimerRef.current) window.clearTimeout(matchesClickTimerRef.current);
    matchesClickTimerRef.current = window.setTimeout(igniteWithMatches, 220);
  };

  const pickUpGroundSupply = (supplyId: number) => {
    const supply = GROUND_SUPPLIES[supplyId];
    if (!supply || !game.groundSupplies[supplyId]) return;
    setGame((current) => {
      const next = { ...current, groundSupplies: current.groundSupplies.map((visible, index) => index === supplyId ? false : visible) };
      if (supply.kind === "seed") return { ...next, [supply.field]: current[supply.field] + supply.amount };
      if (supply.kind === "food") return { ...next, energy: Math.min(100, current.energy + supply.amount) };
      if (supply.kind === "herb") return { ...next, herbs: current.herbs + supply.amount };
      if (supply.tool === "water" && current.toolUpgrades.water) return { ...next, coins: current.coins + 20 };
      return {
        ...next,
        water: supply.tool === "water" ? 18 : current.water,
        toolUpgrades: { ...current.toolUpgrades, [supply.tool]: true },
        toolUpgradeDays: supply.tool === "water" ? current.toolUpgradeDays : { ...current.toolUpgradeDays, [supply.tool]: 7 },
      };
    });
    const alreadyOwned = supply.kind === "tool" && supply.tool === "water" && game.toolUpgrades.water;
    const temporaryTool = supply.kind === "tool" && supply.tool !== "water";
    setMessage(alreadyOwned ? `捡起了${supply.name}，工具已经升级过，于是换成了 20 枚金币。` : temporaryTool ? `捡起了${supply.name}！从今天起可使用 7 天，再次捡到可以重新续满 7 天。` : `捡起了${supply.name}！${supply.description}`);
    playTone(supply.kind === "tool" ? 920 : supply.kind === "food" ? 760 : supply.kind === "herb" ? 820 : 660);
  };

  const carriedItemName = heldItem ? heldItem.kind === "material" ? (heldItem.id === "wood" ? "木头" : "石材") : heldItem.kind === "forest" ? forestItemName(heldItem.id) : heldItem.kind === "resource" ? RESOURCE_INFO[heldItem.id].name : heldItem.kind === "seed" ? `${CROP_INFO[heldItem.id].name}种子包` : heldItem.kind === "herb" ? "药材" : heldItem.kind === "resin" ? "树脂" : heldItem.kind === "matches" ? "火柴" : heldItem.kind === "product" ? (heldItem.id === "egg" ? "鸡蛋" : heldItem.id === "milk" ? "牛奶" : "羊毛") : heldItem.kind === "petGift" ? (heldItem.id === "feather" ? "宠物羽毛" : heldItem.id === "softFur" ? "兔子软毛" : "探险小骨头") : heldItem.kind === "book" ? LOST_BOOKS[heldItem.id].title : RARE_ARTIFACTS[heldItem.id].title : "";
  const carriedItemClass = heldItem ? heldItem.kind === "material" ? heldItem.id : heldItem.kind === "forest" ? heldItem.id : heldItem.kind === "resource" ? heldItem.id : heldItem.kind === "seed" ? `${heldItem.id}-seeds` : heldItem.kind === "herb" ? "herb" : heldItem.kind === "resin" ? "resin" : heldItem.kind === "matches" ? "matches" : heldItem.kind === "product" ? heldItem.id : heldItem.kind === "petGift" ? heldItem.id : heldItem.kind === "book" ? "book" : "artifact" : "";
  const renderCarriedItem = () => heldItem ? <span className={`held-overhead held-${carriedItemClass}`} title={carriedItemName} aria-label={`举着${carriedItemName}`}><i className="held-pixel-object" aria-hidden="true" /><span className="held-item-name">{carriedItemName}</span></span> : null;
  const renderWearables = () => <>{game.equippedOutfit !== "default" && <span className={`worn-outfit worn-${game.equippedOutfit}`} aria-label={game.equippedOutfit === "redCoat" ? "穿着红色节日外套" : "穿着蓝色旅行套装"} />}{game.umbrellaOpen && <span className="player-umbrella" aria-label="撑着彩色雨伞"><i /></span>}</>;

  const giveHeldItem = (person: string) => {
    if (!heldItem) return false;
    if (heldItem.kind === "herb" && NPC_SICK_DAYS[person]?.includes(game.day) && game.npcHealedDays[person] !== game.day) {
      const healingGift = PERSON_RETURN_GIFTS[person] ?? { kind: "coins" as const, amount: 30, name: "30 枚感谢金币" };
      setGame((current) => {
        const healed = {
          ...current,
          herbs: Math.max(0, current.herbs - 1),
          npcHealedDays: { ...current.npcHealedDays, [person]: current.day },
        };
        if (healingGift.kind === "seed" || healingGift.kind === "material") return { ...healed, [healingGift.field]: healed[healingGift.field] + healingGift.amount };
        if (healingGift.kind === "energy") return { ...healed, energy: Math.min(100, healed.energy + healingGift.amount) };
        return { ...healed, coins: healed.coins + healingGift.amount };
      });
      setHeldItem(null);
      setMessage(`${person}用了小禾送来的药材，很快恢复了健康，伤心的表情也变回了笑脸，还回送了${healingGift.name}！`);
      playTone(920);
      return true;
    }
    if (heldItem.kind === "material" && person === "鲁师傅") {
      const amount = game[heldItem.id];
      setGame((current) => ({
        ...current,
        [heldItem.id]: 0,
        builderSupplies: { ...current.builderSupplies, [heldItem.id]: current.builderSupplies[heldItem.id] + amount },
      }));
      setMessage(`鲁师傅收下了 ${amount} 块${carriedItemName}，放进了扩建材料堆。`);
      setHeldItem(null);
      setBuilderOpen(true);
      playTone(650);
      return true;
    }
    if (heldItem.kind === "book" && person === "叶老师") {
      const book = LOST_BOOKS[heldItem.id];
      setGame((current) => ({
        ...current,
        bookBag: current.bookBag.filter((bookId) => bookId !== heldItem.id),
        libraryBooks: current.libraryBooks.includes(heldItem.id) ? current.libraryBooks : [...current.libraryBooks, heldItem.id],
      }));
      setMessage(`叶老师收下了${book.title}：“谢谢你找回来！我已经把它编入山谷图书馆，现在随时都能打开阅读。”`);
      setHeldItem(null);
      playTone(820);
      return true;
    }
    if (heldItem.kind === "artifact" && person === "沈馆长") {
      const artifact = RARE_ARTIFACTS[heldItem.id];
      setGame((current) => ({
        ...current,
        artifactBag: current.artifactBag.filter((artifactId) => artifactId !== heldItem.id),
        museumArtifacts: current.museumArtifacts.includes(heldItem.id) ? current.museumArtifacts : [...current.museumArtifacts, heldItem.id],
      }));
      setMessage(`沈馆长收下了“${artifact.title}”：“太珍贵了！我已经把它放进博物馆展柜，并写上了小禾的名字。”`);
      setHeldItem(null);
      playTone(940);
      return true;
    }
    if (heldItem.kind === "artifact") {
      setMessage(`${person}仔细看了看${carriedItemName}：“这像是珍贵藏品，快送到青禾博物馆给沈馆长吧！”`);
      playTone(420);
      return true;
    }
    const returnGift = Math.random() < .45 ? PERSON_RETURN_GIFTS[person] : null;
    setGame((current) => {
      let next: GameState;
      if (heldItem.kind === "resource") next = { ...current, inventory: { ...current.inventory, [heldItem.id]: Math.max(0, current.inventory[heldItem.id] - 1) } };
      else if (heldItem.kind === "material") next = { ...current, [heldItem.id]: Math.max(0, current[heldItem.id] - 1) };
      else if (heldItem.kind === "forest") {
        const field = heldItem.id === "pinecone" ? "pinecones" : "pineNuts";
        next = { ...current, [field]: Math.max(0, current[field] - 1) };
      } else if (heldItem.kind === "seed") {
        const field = CROP_INFO[heldItem.id].seedField;
        next = { ...current, [field]: Math.max(0, current[field] - 1) };
      } else if (heldItem.kind === "herb") next = { ...current, herbs: Math.max(0, current.herbs - 1) };
      else if (heldItem.kind === "resin") next = { ...current, resin: Math.max(0, current.resin - 1) };
      else if (heldItem.kind === "matches") next = { ...current, crafted: { ...current.crafted, matches: Math.max(0, current.crafted.matches - 1) } };
      else if (heldItem.kind === "product") {
        const field = heldItem.id === "egg" ? "eggs" : heldItem.id === "milk" ? "milk" : "wool";
        next = { ...current, [field]: Math.max(0, current[field] - 1) };
      }
      else if (heldItem.kind === "petGift") {
        const field = heldItem.id === "feather" ? "feathers" : heldItem.id === "softFur" ? "softFur" : "petBones";
        next = { ...current, [field]: Math.max(0, current[field] - 1) };
      }
      else next = { ...current, bookBag: current.bookBag.filter((bookId) => bookId !== heldItem.id) };
      if (!returnGift) return next;
      if (returnGift.kind === "seed" || returnGift.kind === "material") return { ...next, [returnGift.field]: next[returnGift.field] + returnGift.amount };
      if (returnGift.kind === "energy") return { ...next, energy: Math.min(100, next.energy + returnGift.amount) };
      return { ...next, coins: next.coins + returnGift.amount };
    });
    setMessage(returnGift ? `${person}收下了${carriedItemName}，又回送了${returnGift.name}！` : `${person}收下了小禾送的${carriedItemName}，开心地说：“谢谢你，我会好好珍惜！”`);
    setHeldItem(null);
    playTone(760);
    return true;
  };

  const startAnanBeachTrip = () => {
    const tripKey = `${game.year}-${game.season}`;
    setGame((current) => ({
      ...current,
      energy: Math.min(100, current.energy + 10),
      ananBeachTrips: current.ananBeachTrips.includes(tripKey) ? current.ananBeachTrips : [...current.ananBeachTrips, tripKey],
    }));
    setFriendHomeOpen(false);
    setActiveBuilding(null);
    setFarmInterior(null);
    setAnanBeachTraveling(true);
    setBeachPlayer({ x: 48, y: 72 });
    setBeachCrabs(BEACH_CRABS.map(() => true));
    setSeaCreatures(BEACH_CRABS.map(() => true));
    setDivingAtSea(false);
    setSailingWithAnan(false);
    setMessage("安安背上雨水桶和小船，拉着小禾坐上去海边的巴士。出发旅行恢复了 10 点体力！ ");
    playTone(860);
    window.setTimeout(() => {
      setAnanBeachTraveling(false);
      setAnanBeachOpen(true);
      setMessage("到海边啦！安安送给你一个螃蟹夹子。靠近螃蟹后点击下面的“抓起”。 ");
    }, 1_800);
  };

  const catchBeachCrab = (targetIndex?: number) => {
    let nearest = targetIndex ?? -1;
    let nearestDistance = Number.POSITIVE_INFINITY;
    if (nearest >= 0 && beachCrabs[nearest]) {
      nearestDistance = Math.hypot(BEACH_CRABS[nearest].x - beachPlayer.x, BEACH_CRABS[nearest].y - beachPlayer.y);
    } else {
      nearest = -1;
      BEACH_CRABS.forEach((crab, index) => {
        if (!beachCrabs[index]) return;
        const distance = Math.hypot(crab.x - beachPlayer.x, crab.y - beachPlayer.y);
        if (distance < nearestDistance) { nearest = index; nearestDistance = distance; }
      });
    }
    if (nearest < 0) {
      setMessage("沙滩上的螃蟹已经全部抓起来了。 ");
      playTone(420);
      return;
    }
    if (nearestDistance > 24) {
      const crab = BEACH_CRABS[nearest];
      setBeachPlayer({ x: Math.max(7, crab.x - 7), y: crab.y });
      setMessage("小禾已经走到螃蟹旁边了，现在点击下面的“抓起”就能抓到它。 ");
      playTone(250);
      return;
    }
    setBeachCrabs((current) => current.map((visible, index) => index === nearest ? false : visible));
    setGame((current) => ({ ...current, crabs: current.crabs + 1 }));
    const caughtIndex = nearest;
    const respawnTimer = window.setTimeout(() => {
      setBeachCrabs((current) => current.map((visible, index) => index === caughtIndex ? true : visible));
      setMessage("一只新的小螃蟹从沙滩边横着跑出来了！ ");
    }, 4_000 + Math.round(Math.random() * 2_000));
    beachRespawnTimersRef.current.push(respawnTimer);
    setMessage("夹住一只横着跑的小螃蟹！它已经装进背包。等一小会儿，还会有新的螃蟹跑出来。 ");
    playTone(880);
  };

  const fishAtSea = () => {
    if (selected !== "rod") {
      setMessage("先在下方工具栏选择鱼竿，才能在海上钓鱼。 ");
      playTone(240);
      return;
    }
    setGame((current) => ({ ...current, fishCaught: current.fishCaught + 1, inventory: { ...current.inventory, fish: current.inventory.fish + 1 }, daily: { ...current.daily, fish: current.daily.fish + 1 } }));
    setMessage("在小船旁等了一会儿，海面浮标一沉，钓到了一条海鱼！ ");
    playTone(900);
  };

  const catchSeaCreature = () => {
    let nearest = -1;
    let nearestDistance = Number.POSITIVE_INFINITY;
    BEACH_CRABS.forEach((creature, index) => {
      if (!seaCreatures[index]) return;
      const seaY = Math.max(26, creature.y - 18);
      const distance = Math.hypot(creature.x - beachPlayer.x, seaY - beachPlayer.y);
      if (distance < nearestDistance) { nearest = index; nearestDistance = distance; }
    });
    if (nearest < 0 || nearestDistance > 16) {
      setMessage("潜水夹还够不到小鱼小虾。游到它们旁边，再点击抓起。 ");
      playTone(250);
      return;
    }
    const caughtKind = nearest % 3;
    const caughtFish = caughtKind === 0;
    const caughtShrimp = caughtKind === 1;
    setSeaCreatures((current) => current.map((visible, index) => index === nearest ? false : visible));
    setGame((current) => caughtFish
      ? { ...current, fishCaught: current.fishCaught + 1, inventory: { ...current.inventory, fish: current.inventory.fish + 1 } }
      : caughtShrimp ? { ...current, shrimp: current.shrimp + 1 } : { ...current, crabs: current.crabs + 1 });
    const caughtIndex = nearest;
    const respawnTimer = window.setTimeout(() => {
      setSeaCreatures((current) => current.map((visible, index) => index === caughtIndex ? true : visible));
      setMessage(caughtFish ? "一条新的小鱼从海草后游出来了！ " : caughtShrimp ? "一只新的小虾从珊瑚旁游出来了！ " : "一只新的小海蟹从礁石后爬出来了！ ");
    }, 4_000 + Math.round(Math.random() * 2_000));
    beachRespawnTimersRef.current.push(respawnTimer);
    setMessage(caughtFish ? "在水下抓到一条闪亮的小海鱼，放进背包啦！等一会儿还会游来新的。 " : caughtShrimp ? "用潜水夹抓到一只小虾，放进背包啦！等一会儿还会游来新的。 " : "抓到一只小海蟹，放进背包啦！等一会儿还会爬来新的。 ");
    playTone(900);
  };

  const eatCrab = () => {
    if (game.crabs <= 0) {
      setMessage("背包里还没有螃蟹，去海边靠近螃蟹后用夹子抓一只吧。 ");
      return;
    }
    setGame((current) => ({ ...current, crabs: current.crabs - 1, energy: Math.min(100, current.energy + 20) }));
    setMessage("吃了一只海边螃蟹，恢复了 20 点体力！ ");
    playTone(790);
  };

  const eatShrimp = () => {
    if (game.shrimp <= 0) {
      setMessage("背包里还没有小虾，穿上潜水服去水下找找吧。 ");
      return;
    }
    setGame((current) => ({ ...current, shrimp: current.shrimp - 1, energy: Math.min(100, current.energy + 12) }));
    setMessage("吃掉一只海边小虾，恢复了 12 点体力！ ");
    playTone(780);
  };

  const interactWithPerson = (person: string, fallback: string) => {
    if (giveHeldItem(person)) return;
    if (NPC_SICK_DAYS[person]?.includes(game.day) && game.npcHealedDays[person] !== game.day) {
      setMessage(`${person}今天有些不舒服，露出了伤心的表情：“我休息一天，明天应该就会好起来。”`);
      playTone(300);
      return;
    }
    if (person === "安安" && !game.ananBeachTrips.includes(`${game.year}-${game.season}`)) {
      startAnanBeachTrip();
      return;
    }
    if (person === "安安" && Math.random() < .3) {
      setGame((current) => ({ ...current, cookies: current.cookies + 1 }));
      setMessage("安安从小布包里拿出一块星星饼干送给小禾：“这是我烤的，分给你一块！”饼干已经放进背包。 ");
      playTone(880);
      return;
    }
    if (person === "安安" && Math.random() < .58) {
      setPlayingWithAnan(true);
      setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 5) }));
      setMessage("安安笑着拉住小禾，两个人追着跑、拍拍手，又绕着桌子嬉戏了一会儿！开心玩耍恢复了 5 点体力。 ");
      playTone(820);
      window.setTimeout(() => setPlayingWithAnan(false), 1_600);
      return;
    }
    setMessage(PERSON_DIALOGUES[person] ?? fallback);
    playTone(520);
  };

  const eatAnanCookie = () => {
    if (game.cookies <= 0) {
      setMessage("背包里还没有饼干。有时和安安说话，她会和你分享。 ");
      playTone(260);
      return;
    }
    setGame((current) => ({ ...current, cookies: current.cookies - 1, energy: Math.min(100, current.energy + 18) }));
    setMessage("吃掉了安安分享的星星饼干，香香脆脆，恢复了 18 点体力！ ");
    playTone(820);
  };

  const receiveAnanCookie = () => {
    const cookieDayKey = `${game.year}-${game.season}-${game.day}`;
    if (game.lastAnanCookieDay === cookieDayKey) {
      setMessage("安安：今天的星星饼干已经分给你啦，明天再来一起吃！ ");
      playTone(420);
      return;
    }
    setGame((current) => ({ ...current, cookies: current.cookies + 1, lastAnanCookieDay: cookieDayKey }));
    setMessage("安安把一块星星饼干放进小禾的背包。每天来安安家可以分享 1 块，吃掉恢复 18 点体力！ ");
    playTone(880);
  };

  const talkToNeighbor = (neighbor: NeighborScene) => {
    const person = neighbor === "eastNeighbor" ? "林婶" : neighbor === "southNeighbor" ? "鲁师傅" : "叶老师";
    if (giveHeldItem(person)) return;
    if (NPC_SICK_DAYS[person]?.includes(game.day) && game.npcHealedDays[person] !== game.day) {
      setMessage(`${person}今天生病了，嘴角垂了下来：“我先在家休息一天，明天再和你聊天。”`);
      playTone(300);
      return;
    }
    if (neighbor !== "southNeighbor") {
      setMessage(neighbor === "eastNeighbor" ? "林婶：你好呀！周六记得来尝我的草莓果酱。" : "叶老师：天气好的时候，我喜欢在林子里散步读书。 ");
      return;
    }
    setBuilderOpen(true);
    setMessage("鲁师傅：把木头和石材双击拿起来，再交给我，我就能帮你制作和扩建；其他礼物我也会好好收下。 ");
  };

  const commissionBuilder = (item: "house" | "land" | "field" | "storage" | "greenhouse" | "pond" | "stoneWall") => {
    const houseLevel = game.upgrades.house;
    const recipes = {
      house: { name: "扩大农舍", wood: 20 + houseLevel * 10, stone: 12 + houseLevel * 8 },
      land: { name: "扩大地盘", wood: 12, stone: 18 },
      field: { name: "扩大土地", wood: 10, stone: 10 },
      storage: { name: "扩建售卖仓库", wood: 18, stone: 12 },
      greenhouse: { name: "修建玻璃温室", wood: 28, stone: 22 },
      pond: { name: "扩大钓鱼池", wood: 16, stone: 24 },
      stoneWall: { name: "修建农场石墙", wood: 8, stone: 32 },
    } as const;
    const recipe = recipes[item];
    if ((item === "house" && houseLevel >= 3) || (item !== "house" && game.upgrades[item] >= 1)) {
      setMessage(`${recipe.name}已经完成了。`);
      return;
    }
    if (game.builderSupplies.wood < recipe.wood || game.builderSupplies.stone < recipe.stone) {
      setMessage(`鲁师傅：${recipe.name}需要 ${recipe.wood} 木头${recipe.stone ? `和 ${recipe.stone} 石材` : ""}，材料还不够。`);
      playTone(220);
      return;
    }
    setGame((current) => ({
      ...current,
      builderSupplies: { wood: current.builderSupplies.wood - recipe.wood, stone: current.builderSupplies.stone - recipe.stone },
      upgrades: { ...current.upgrades, [item]: item === "house" ? current.upgrades.house + 1 : 1 },
      tiles: item === "field" ? [...current.tiles, ...makeTiles(8)] : current.tiles,
    }));
    const installed = item === "house" ? ["暖光灯", "自动水箱", "料理台"][houseLevel] : item === "field" ? "8 格新农田" : item === "storage" ? "自动售卖加价 10% 的仓库" : item === "greenhouse" ? "隔日自动洒水、人工浇水时加速两阶段的温室" : item === "pond" ? "每次多钓 1 条鱼的大鱼塘" : item === "stoneWall" ? "阻挡小动物的农场石墙" : "更宽敞的农场地盘";
    setMessage(`鲁师傅完成了${recipe.name}，并安装了${installed}！`);
    playTone(820);
  };

  const dismantleItem = (item: "chest" | "fence" | "scarecrow") => {
    const items = {
      chest: { name: "木箱", refund: 4, use: "木箱用来收纳农具和收获。" },
      fence: { name: "木栅栏", refund: 2, use: "木栅栏可以整理农场边界。" },
      scarecrow: { name: "稻草人", refund: 6, use: "稻草人会守护田里的作物。" },
    };
    const details = items[item];
    if (item === "chest" && Object.values(game.chestStorage).some((count) => count > 0)) {
      setMessage("木箱里还有东西，要先取空才能拆除。");
      return;
    }
    if (selected !== "axe") {
      setMessage(`${details.use}选择斧头后点击可拆除。`);
      return;
    }
    if (game.energy < 2) {
      setMessage("体力不够，明天再来拆木制品吧。");
      playTone(220);
      return;
    }

    setGame((current) => ({
      ...current,
      energy: current.energy - 2,
      wood: current.wood + details.refund,
      crafted: { ...current.crafted, [item]: Math.max(0, current.crafted[item] - 1) },
    }));
    setMessage(`拆除一个${details.name}，回收 ${details.refund} 块木头。`);
    playTone(360);
  };

  const chooseCraftForPlacement = (item: CraftType) => {
    if (game.crafted[item] <= 0) {
      setMessage(`背包里还没有${CRAFT_RECIPES[item].name}，先在制作手册里制作。`);
      return;
    }
    if (item === "matches") {
      igniteWithMatches();
      return;
    }
    if (item === "blanket") {
      setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 30), crafted: { ...current.crafted, blanket: Math.max(0, current.crafted.blanket - 1) } }));
      setMessage("盖上自己制作的柔软羊毛毯休息了一会儿，恢复 30 点体力！");
      playTone(780);
      return;
    }
    setSelectedCraftItem(item);
    setPlantingPinecone(false);
    setSelectedResource(null);
    if (item !== "fence" && item !== "sign" && item !== "bench") setCraftRotation(0);
    setMessage(`已选中${CRAFT_RECIPES[item].name}。${item === "fence" || item === "sign" || item === "bench" ? "先选方向，再点击农场空地摆放。" : "点击农场空地摆放。"}`);
    playTone(560);
  };

  const placeFenceInSlot = (slot: FencePlacementSlot) => {
    if (game.crafted.fence <= 0) {
      setSelectedCraftItem(null);
      setMessage("背包里的木围栏已经用完了，可以再打开制作手册制作。 ");
      return;
    }
    const occupied = game.placedCrafts.some((craft) => craft.type === "fence" && Math.abs(craft.x - slot.x) < 1 && Math.abs(craft.y - slot.y) < 1);
    if (occupied) {
      setMessage("这里已经放好一段木围栏了，请选择另一块绿色位置。 ");
      return;
    }
    const placed: PlacedCraft = { id: `fence-${slot.id}-${Date.now()}`, type: "fence", x: slot.x, y: slot.y, rotation: slot.rotation };
    setGame((current) => ({ ...current, crafted: { ...current.crafted, fence: Math.max(0, current.crafted.fence - 1) }, placedCrafts: [...current.placedCrafts, placed] }));
    setSelectedCraftItem(null);
    const fenceCount = game.placedCrafts.filter((craft) => craft.type === "fence").length + 1;
    setMessage(`木围栏整齐地放好了！现在已经围上 ${fenceCount} 段；继续点击绿色位置可以把农田围完整。`);
    playTone(720);
  };

  const dismantlePlacedCraft = (craft: PlacedCraft) => {
    if (craft.type === "chest" && Object.values(game.chestStorage).some((count) => count > 0)) {
      setMessage("木箱里还有东西，要先取空才能拆除。 ");
      return;
    }
    if (selected !== "axe") {
      setMessage(`${CRAFT_RECIPES[craft.type].name}已经摆在农场里。选择斧头后点击可以拆除。`);
      return;
    }
    const recipe = CRAFT_RECIPES[craft.type];
    setGame((current) => ({
      ...current,
      energy: Math.max(0, current.energy - 2),
      wood: current.wood + Math.max(1, Math.floor(recipe.wood / 2)),
      stone: current.stone + Math.floor(recipe.stone / 2),
      resin: current.resin + Math.floor((recipe.resin ?? 0) / 2),
      placedCrafts: current.placedCrafts.filter((placed) => placed.id !== craft.id),
    }));
    setMessage(`拆除了${recipe.name}，回收了一部分木头和石材。`);
    playTone(360);
  };

  const usePlacedCraft = (craft: PlacedCraft) => {
    if (selected === "axe") {
      dismantlePlacedCraft(craft);
      return;
    }
    if (craft.type === "chest") {
      useChest();
      return;
    }
    if (craft.type === "gate") {
      setFarmGateOpen((open) => !open);
      setMessage(farmGateOpen ? "把木围栏门关好了，小禾和小动物现在都不能从这里穿过。 " : "木围栏门打开了，小禾可以从门口进出；离开太远时要小心小动物钻进来。 ");
      playTone(farmGateOpen ? 420 : 680);
      return;
    }
    if (craft.type === "bench") {
      setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 8) }));
      setMessage("在农场长椅上休息了一会儿，恢复 8 点体力。 ");
      playTone(620);
      return;
    }
    const placedScarecrows = game.placedCrafts.filter((placed) => placed.type === "scarecrow").length;
    const placedFences = game.placedCrafts.filter((placed) => placed.type === "fence").length;
    setMessage(craft.type === "scarecrow" ? `农场里有 ${placedScarecrows} 个稻草人：${placedScarecrows >= 2 ? "乌鸦不会再来。" : "乌鸦出现次数已经大幅减少。"}` : craft.type === "fence" ? `已经摆放 ${placedFences} 段围栏；摆满 8 段后，小动物就进不来了。` : `${CRAFT_RECIPES[craft.type].name}已经安放在这里。`);
  };

  const selectResource = (resource: StorableResource) => {
    const details = RESOURCE_INFO[resource];
    if (game.inventory[resource] <= 0) {
      setMessage(`背包里还没有${details.name}。`);
      playTone(220);
      return;
    }
    setSelectedResource(resource);
    setMessage(`已拿起${details.name}，现在点击农场里的木箱放进去。`);
    playTone(560);
  };

  const eatResource = (resource: StorableResource) => {
    const details = RESOURCE_INFO[resource];
    if (game.inventory[resource] <= 0) {
      setMessage(`背包里没有${details.name}可以吃。`);
      playTone(220);
      return;
    }
    if (game.energy >= 100) {
      setMessage("体力已经满满的，先把食物留着吧！");
      playTone(520);
      return;
    }
    setGame((current) => ({
      ...current,
      energy: Math.min(100, current.energy + details.energy),
      inventory: { ...current.inventory, [resource]: current.inventory[resource] - 1 },
    }));
    setSelectedResource(null);
    setMessage(`吃掉 1 个${details.name}，恢复 ${details.energy} 点体力！`);
    playTone(740);
  };

  const startEating = (resource: StorableResource) => {
    if (eatTimerRef.current) window.clearTimeout(eatTimerRef.current);
    longPressTriggeredRef.current = false;
    eatTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      eatResource(resource);
      eatTimerRef.current = null;
    }, 600);
  };

  const stopEating = () => {
    if (eatTimerRef.current) {
      window.clearTimeout(eatTimerRef.current);
      eatTimerRef.current = null;
    }
  };

  const clickResource = (resource: StorableResource) => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    selectResource(resource);
  };

  const useHerb = () => {
    if (game.herbs <= 0) {
      setMessage("药材袋还是空的，去农场或小镇地上找找艾草和金银花吧。 ");
      playTone(220);
      return;
    }
    if (!game.sick) {
      setMessage("小禾现在没有生病，先把药材留在袋子里，不会浪费。 ");
      playTone(420);
      return;
    }
    setGame((current) => ({
      ...current,
      herbs: current.herbs - 1,
      sick: false,
      diagnosed: false,
      energy: Math.min(100, current.energy + 25),
    }));
    setMessage("使用了 1 份药材，小禾恢复了健康，体力也增加了 25 点！");
    playTone(820);
  };

  const clickHerb = () => {
    if (herbClickTimerRef.current) window.clearTimeout(herbClickTimerRef.current);
    herbClickTimerRef.current = window.setTimeout(() => {
      useHerb();
      herbClickTimerRef.current = null;
    }, 260);
  };

  const pickUpHerb = () => {
    if (herbClickTimerRef.current) {
      window.clearTimeout(herbClickTimerRef.current);
      herbClickTimerRef.current = null;
    }
    if (game.herbs <= 0) {
      setMessage("药材袋还是空的，暂时没有东西可以拿起。 ");
      playTone(220);
      return;
    }
    setHeldItem({ kind: "herb" });
    setSelectedResource(null);
    setMessage("双击拿起了 1 份药材，现在药材举在小禾头顶，可以送给居民。 ");
    playTone(720);
  };

  const useChest = () => {
    if (selectedResource) {
      const name = RESOURCE_INFO[selectedResource].name;
      const count = game.inventory[selectedResource];
      if (count <= 0) {
        setSelectedResource(null);
        setMessage(`背包里没有更多${name}了。`);
        return;
      }
      setGame((current) => ({
        ...current,
        inventory: { ...current.inventory, [selectedResource]: current.inventory[selectedResource] - 1 },
        chestStorage: { ...current.chestStorage, [selectedResource]: current.chestStorage[selectedResource] + 1 },
      }));
      const nextStreakCount = chestDepositStreak?.resource === selectedResource ? chestDepositStreak.count + 1 : 1;
      setChestDepositStreak({ resource: selectedResource, count: nextStreakCount });
      if (nextStreakCount >= 5 && count > 1) setBulkChestPrompt(selectedResource);
      if (count === 1) setSelectedResource(null);
      setMessage(nextStreakCount >= 5 && count > 1 ? `已经连续放入 5 个${name}。要不要把背包里剩下的${name}全部放进收纳箱？` : `把 1 个${name}放进木箱。现在箱内共有 ${Object.values(game.chestStorage).reduce((sum, value) => sum + value, 0) + 1} 件物品。`);
      playTone(680);
      return;
    }
    if (selected === "axe") {
      dismantleItem("chest");
      return;
    }
    setChestOpen(true);
    setMessage(`打开木箱：萝卜 ${game.chestStorage.radish}、草莓 ${game.chestStorage.strawberry}、玉米 ${game.chestStorage.corn}、鱼 ${game.chestStorage.fish}。`);
    playTone(500);
  };

  const storeAllPromptedResource = () => {
    if (!bulkChestPrompt) return;
    const resource = bulkChestPrompt;
    const amount = game.inventory[resource];
    const name = RESOURCE_INFO[resource].name;
    if (amount <= 0) {
      setBulkChestPrompt(null);
      setChestDepositStreak(null);
      setMessage(`背包里的${name}已经全部放好了。`);
      return;
    }
    setGame((current) => ({
      ...current,
      inventory: { ...current.inventory, [resource]: 0 },
      chestStorage: { ...current.chestStorage, [resource]: current.chestStorage[resource] + current.inventory[resource] },
    }));
    setBulkChestPrompt(null);
    setChestDepositStreak(null);
    setSelectedResource(null);
    setMessage(`把剩下的 ${amount} 个${name}全部放进了收纳箱。`);
    playTone(820);
  };

  const takeFromChest = (resource: StorableResource) => {
    const name = RESOURCE_INFO[resource].name;
    if (game.chestStorage[resource] <= 0) {
      setMessage(`木箱里没有${name}。`);
      playTone(220);
      return;
    }
    setGame((current) => ({
      ...current,
      inventory: { ...current.inventory, [resource]: current.inventory[resource] + 1 },
      chestStorage: { ...current.chestStorage, [resource]: current.chestStorage[resource] - 1 },
    }));
    setMessage(`从木箱取出 1 个${name}。`);
    playTone(620);
  };

  const putInShippingBin = (item: ShippingCatalogItem) => {
    if (shippingItemCount(game, item) <= 0) {
      setMessage(`背包里没有可以放入出货箱的${item.name}。`);
      playTone(220);
      return;
    }
    setGame((current) => {
      if (shippingItemCount(current, item) <= 0) return current;
      let next = current;
      if (item.group === "resource") {
        const resource = item.key as StorableResource;
        next = { ...current, inventory: { ...current.inventory, [resource]: current.inventory[resource] - 1 } };
      } else if (item.group === "seed") {
        const field = CROP_INFO[item.key as CropType].seedField;
        next = { ...current, [field]: Math.max(0, current[field] - 1) };
      } else if (item.group === "craft") {
        const craft = item.key as CraftType;
        next = { ...current, crafted: { ...current.crafted, [craft]: current.crafted[craft] - 1 } };
      } else {
        const field = item.key as ShippingSingleField;
        next = { ...current, [field]: Math.max(0, current[field] - 1) };
      }
      return { ...next, shippingBin: { ...current.shippingBin, [item.id]: (current.shippingBin[item.id] ?? 0) + 1 } };
    });
    setMessage(`把 1 个${item.name}放进大号出货箱。睡到第二天后会自动卖出。`);
    playTone(700);
  };

  const takeFromShippingBin = (item: ShippingCatalogItem) => {
    if ((game.shippingBin[item.id] ?? 0) <= 0) return;
    setGame((current) => {
      const inBin = current.shippingBin[item.id] ?? 0;
      if (inBin <= 0) return current;
      let next = current;
      if (item.group === "resource") {
        const resource = item.key as StorableResource;
        next = { ...current, inventory: { ...current.inventory, [resource]: current.inventory[resource] + 1 } };
      } else if (item.group === "seed") {
        const field = CROP_INFO[item.key as CropType].seedField;
        next = { ...current, [field]: current[field] + 1 };
      } else if (item.group === "craft") {
        const craft = item.key as CraftType;
        next = { ...current, crafted: { ...current.crafted, [craft]: current.crafted[craft] + 1 } };
      } else {
        const field = item.key as ShippingSingleField;
        next = { ...current, [field]: current[field] + 1 };
      }
      return { ...next, shippingBin: { ...current.shippingBin, [item.id]: inBin - 1 } };
    });
    setMessage(`从出货箱取回 1 个${item.name}。`);
    playTone(560);
  };

  const sellBackpack = () => {
    const resources = Object.keys(RESOURCE_INFO) as StorableResource[];
    const itemCount = resources.reduce((sum, resource) => sum + game.inventory[resource], 0);
    const baseEarnings = resources.reduce((sum, resource) => sum + game.inventory[resource] * RESOURCE_INFO[resource].price, 0);
    const earnings = Math.round(baseEarnings * (game.upgrades.storage ? 1.1 : 1));
    if (itemCount <= 0) {
      setMessage("背包里没有可以售卖的鱼或作物，木头会一直保留。 ");
      playTone(220);
      return;
    }
    setGame((current) => ({
      ...current,
      coins: current.coins + earnings,
      inventory: Object.fromEntries((Object.keys(RESOURCE_INFO) as StorableResource[]).map((resource) => [resource, 0])) as Record<StorableResource, number>,
      daily: { ...current.daily, sold: current.daily.sold + itemCount },
    }));
    setSelectedResource(null);
    if (heldItem?.kind === "resource") setHeldItem(null);
    setMessage(`自动售卖 ${itemCount} 件鱼和作物，赚到 ${earnings} 金币！${game.upgrades.storage ? "扩建仓库额外加价 10%。" : ""}木头没有清空。`);
    playTone(820);
  };

  const performTileAction = (index: number) => {
    let feedback = "";
    let tone = 360;

    setGame((current) => {
      const tile = current.tiles[index];
      const next = { ...current, tiles: current.tiles.map((item) => ({ ...item })) };
      const target = next.tiles[index];

      if (current.energy <= 0) {
        feedback = "体力用完了，回家睡一觉吧。";
        return current;
      }

      if (selected === "hoe") {
        if (tile.state === "crop") {
          const cropType = tile.cropType ?? "radish";
          const cropDetails = CROP_INFO[cropType];
          target.state = "soil";
          target.stage = 0;
          target.watered = false;
          target.cropType = undefined;
          next[cropDetails.seedField] += 1;
          next.energy = Math.max(0, current.energy - 2);
          feedback = `用锄头小心挖掉了${cropDetails.name}${tile.stage >= 3 ? "植株" : "幼苗"}，1 颗${cropDetails.name}种子已经退回原来的种子袋。土地仍然保持松软。`;
          tone = 520;
          return next;
        }
        if (tile.state === "soil") {
          feedback = "这里已经松好土了，可以直接播种。";
          return current;
        }
        target.state = "soil";
        next.energy = Math.max(0, current.energy - 3);
        feedback = "土地松好了，现在播下种子。";
      } else if (selected === "seed") {
        const cropDetails = CROP_INFO[selectedCrop];
        if (current[cropDetails.seedField] <= 0) {
          feedback = `${cropDetails.name}种子用完啦，可以去超市购买。`;
          return current;
        }
        if (tile.state !== "soil") {
          feedback = "种子只能播在松好的土地里。";
          return current;
        }
        target.state = "crop";
        target.stage = 0;
        target.watered = false;
        target.cropType = selectedCrop;
        next[cropDetails.seedField] -= 1;
        next.energy = Math.max(0, current.energy - 2);
        next.planted += 1;
        next.daily = { ...current.daily, planted: current.daily.planted + 1 };
        feedback = `${cropDetails.name}种子睡进土里了。记得浇水！`;
        tone = 480;
      } else if (selected === "water") {
        if (current.water <= 0) {
          feedback = "水壶空了，明早会自动装满。";
          return current;
        }
        if (tile.state !== "crop") {
          feedback = "这里还没有作物需要浇水。";
          return current;
        }
        if (tile.watered) {
          feedback = "这株作物今天已经喝饱啦。";
          return current;
        }
        target.watered = true;
        next.water -= 1;
        next.energy = Math.max(0, current.energy - 1);
        next.wateredCount += 1;
        next.daily = { ...current.daily, watered: current.daily.watered + 1 };
        feedback = "水珠闪闪，明早它会长大一点。";
        tone = 620;
      } else if (selected === "hand") {
        if (tile.state !== "crop" || tile.stage < 3) {
          feedback = "还没成熟，再耐心照料几天吧。";
          return current;
        }
        target.state = "soil";
        target.stage = 0;
        target.watered = false;
        const cropType = tile.cropType ?? "radish";
        const cropDetails = CROP_INFO[cropType];
        target.cropType = undefined;
        next[cropDetails.seedField] += 2;
        next.energy = Math.max(0, current.energy - 1);
        next.harvested += 1;
        next.daily = { ...current.daily, harvested: current.daily.harvested + 1 };
        next.inventory = { ...current.inventory, [cropType]: current.inventory[cropType] + 1 };
        feedback = `收获 1 个${cropDetails.name}！已经放进背包，并获得 2 颗同类种子。`;
        tone = 760;
      } else {
        feedback = selected === "rod" ? "鱼竿要在左侧的钓鱼池使用。" : "斧头要对着农场里的树木使用。";
        return current;
      }
      next.hour = Math.min(24, current.hour + 1);
      return next;
    });

    window.setTimeout(() => {
      if (feedback) setMessage(feedback);
      playTone(tone);
    }, 0);
  };

  const actOnTile = (index: number, event: MouseEvent<HTMLButtonElement>) => {
    if (selected !== "seed" && selected !== "water") {
      performTileAction(index);
      return;
    }

    const world = event.currentTarget.closest(".world") as HTMLElement | null;
    if (!world) {
      performTileAction(index);
      return;
    }
    const worldBounds = world.getBoundingClientRect();
    const tileBounds = event.currentTarget.getBoundingClientRect();
    const centerX = ((tileBounds.left + tileBounds.width / 2 - worldBounds.left) / worldBounds.width) * 100;
    const centerY = ((tileBounds.top + tileBounds.height / 2 - worldBounds.top) / worldBounds.height) * 100;
    const destination = {
      x: Math.max(0, Math.min(11, Math.round((centerX - 4) / 7.7))),
      y: Math.max(0, Math.min(7, Math.round((centerY - 8) / 10.5))),
    };
    const isNearTile = Math.hypot(player.x - destination.x, player.y - destination.y) <= 1.5;
    if (isNearTile) {
      performTileAction(index);
      return;
    }

    const fenceCount = game.placedCrafts.filter((craft) => craft.type === "fence").length;
    const hasGate = game.placedCrafts.some((craft) => craft.type === "gate");
    const playerInsideField = player.x >= 2 && player.x <= 9 && player.y >= 4;
    if (fenceCount >= 8 && !playerInsideField && (!hasGate || !farmGateOpen)) {
      setMessage(hasGate ? "围栏挡住了路，先点击中间的围栏门把它打开，再去播种或浇水。" : "围栏挡住了路，先制作一扇木围栏门才能进入农田。 ");
      playTone(220);
      return;
    }

    if (farmActionTimerRef.current) window.clearTimeout(farmActionTimerRef.current);
    showWalking(destination.x - player.x, destination.y - player.y);
    setPlayer(destination);
    setMessage(selected === "seed" ? "小禾正走到这块田旁边，到了再播种……" : "小禾正提着水壶走到这株作物旁边……");
    farmActionTimerRef.current = window.setTimeout(() => {
      performTileAction(index);
      farmActionTimerRef.current = null;
    }, 560);
  };

  const buyItem = (item: SeedField | "water" | "snack" | "soup" | "bait" | "sapling" | "rockGrowth") => {
    const seedCrop = CROP_TYPES.find((crop) => CROP_INFO[crop].seedField === item);
    const details = seedCrop ? {
      price: game.season === 0 && game.day === 3 ? 0 : CROP_INFO[seedCrop].seedPrice,
      success: `${game.season === 0 && game.day === 3 ? "种子分享日免费领到" : "买到"} 5 颗${CROP_INFO[seedCrop].name}种子！在种子工具上再次点击即可切换。`,
      tone: 700,
    } : ({
      water: { price: 25, success: "水壶重新装满了！", tone: 580 },
      snack: { price: 45, success: "吃下莓果面包，恢复 25 点体力！", tone: 720 },
      soup: { price: 75, success: "喝下热腾腾的蔬菜汤，恢复 50 点体力！", tone: 760 },
      bait: { price: 50, success: "买到 5 份幸运鱼饵，下次钓鱼收获翻倍！", tone: 700 },
      sapling: { price: 80, success: "树苗种下了，农场里的树桩重新长成树！", tone: 620 },
      rockGrowth: { price: 95, success: "石头生长包撒到农场里，所有石头都重新长出来了！", tone: 500 },
    } as const)[item as "water" | "snack" | "soup" | "bait" | "sapling" | "rockGrowth"];

    if (game.coins < details.price) {
      setMessage("金币不够，再去收获一些作物吧。");
      playTone(220);
      return;
    }

    setGame((current) => {
      const next = {
        ...current,
        coins: current.coins - details.price,
        water: item === "water" ? (current.toolUpgrades.water ? 18 : 12) : current.water,
        bait: item === "bait" ? current.bait + 5 : current.bait,
        treeStates: item === "sapling" ? current.treeStates.map(() => true) : current.treeStates,
        rockStates: item === "rockGrowth" ? current.rockStates.map(() => true) : current.rockStates,
        energy: item === "snack" ? Math.min(100, current.energy + 25) : item === "soup" ? Math.min(100, current.energy + 50) : current.energy,
      };
      if (seedCrop) next[CROP_INFO[seedCrop].seedField] = current[CROP_INFO[seedCrop].seedField] + 5;
      return next;
    });
    setMessage(details.success);
    playTone(details.tone);
  };

  const buyGroundSupply = (supplyId: number) => {
    const supply = GROUND_SUPPLIES[supplyId];
    if (!supply) return;
    const price = supply.kind === "seed" && game.season === 0 && game.day === 3 ? 0 : GROUND_SUPPLY_PRICES[supplyId];
    if (game.coins < price) {
      setMessage(`${supply.name}需要 ${price} 金币，钱包里的钱还不够。`);
      playTone(220);
      return;
    }
    setGame((current) => {
      const next = { ...current, coins: current.coins - price };
      if (supply.kind === "seed") return { ...next, [supply.field]: current[supply.field] + supply.amount };
      if (supply.kind === "food") return { ...next, energy: Math.min(100, current.energy + supply.amount) };
      if (supply.kind === "herb") return { ...next, herbs: current.herbs + supply.amount };
      if (supply.tool === "water" && current.toolUpgrades.water) return { ...next, coins: next.coins + 20 };
      return {
        ...next,
        water: supply.tool === "water" ? 18 : current.water,
        toolUpgrades: { ...current.toolUpgrades, [supply.tool]: true },
        toolUpgradeDays: supply.tool === "water" ? current.toolUpgradeDays : { ...current.toolUpgradeDays, [supply.tool]: 7 },
      };
    });
    const alreadyOwned = supply.kind === "tool" && supply.tool === "water" && game.toolUpgrades.water;
    setMessage(alreadyOwned ? `买下${supply.name}，因为水壶已经升级，林婶退回了 20 金币。` : `${price ? `花费 ${price} 金币买到` : "种子分享日免费领到"}${supply.name}！${supply.description}`);
    playTone(supply.kind === "tool" ? 920 : supply.kind === "food" ? 760 : supply.kind === "herb" ? 820 : 660);
  };

  const buyGroundCollectible = (kind: "book" | "artifact", itemId: number) => {
    const price = kind === "book" ? 120 : 180;
    const alreadyOwned = kind === "book"
      ? game.bookBag.includes(itemId) || game.libraryBooks.includes(itemId)
      : game.artifactBag.includes(itemId) || game.museumArtifacts.includes(itemId);
    if (alreadyOwned) {
      setMessage(kind === "book" ? "这本书已经收藏过了，不需要重复购买。" : "这件稀奇物品已经收藏过了，不需要重复购买。 ");
      return;
    }
    if (game.coins < price) {
      setMessage(`这件商品需要 ${price} 金币，钱包里的钱还不够。`);
      playTone(220);
      return;
    }
    setGame((current) => kind === "book"
      ? { ...current, coins: current.coins - price, bookBag: [...current.bookBag, itemId] }
      : { ...current, coins: current.coins - price, artifactBag: [...current.artifactBag, itemId] });
    setMessage(kind === "book" ? `买到${LOST_BOOKS[itemId].title}，已经放进书袋，可以阅读或送给叶老师。` : `买到稀奇物品“${RARE_ARTIFACTS[itemId].title}”，已经放进背包，可以送到博物馆。`);
    playTone(kind === "book" ? 640 : 900);
  };

  const takeFreeSeedBundle = () => {
    if (game.day !== 3) {
      setMessage("种子大礼包会在第 3 天的种子分享日免费发放。 ");
      return;
    }
    setGame((current) => {
      const next = { ...current };
      CROP_TYPES.forEach((crop) => { next[CROP_INFO[crop].seedField] = current[CROP_INFO[crop].seedField] + 10; });
      return next;
    });
    setMessage("免费领到种子大礼包：8 种水果蔬菜种子各 10 颗！");
    playTone(820);
  };

  const leaveBuilding = () => {
    if (!activeBuilding) return;
    const building = BUILDING_INFO[activeBuilding];
    if (excursionTimerRef.current) window.clearTimeout(excursionTimerRef.current);
    excursionTimerRef.current = null;
    setAmusementOpen(false);
    setBusTraveling(false);
    setActiveBuilding(null);
    setInspectedItem(null);
    setPlayer(building.exit);
    setMessage(`离开${building.name}，回到${activeBuilding === "townhall" || activeBuilding === "museum" ? "清河文化街" : "中心街"}。`);
  };

  const returnToFarm = () => {
    cancelFishing();
    if (excursionTimerRef.current) window.clearTimeout(excursionTimerRef.current);
    excursionTimerRef.current = null;
    setBusTraveling(false);
    setAmusementOpen(false);
    setActiveBuilding(null);
    setInspectedItem(null);
    setCraftingOpen(false);
    setChestOpen(false);
    setShippingBinOpen(false);
    setShippingReport(null);
    setBuilderOpen(false);
    setNeighborInterior(null);
    setResidentHome(null);
    setFriendHomeOpen(false);
    setHeldItem(null);
    setScene("farm");
    setPlayer({ x: 10, y: 5 });
    setMessage("已经安全回到农场，原来的进度都还在。");
  };

  const travelFromMap = (destination: Scene, position: { x: number; y: number }, destinationName: string) => {
    cancelFishing();
    setActiveBuilding(null);
    setNeighborInterior(null);
    setResidentHome(null);
    setFriendHomeOpen(false);
    setCraftingOpen(false);
    setChestOpen(false);
    setShippingBinOpen(false);
    setMapOpen(false);
    setBrandMenuOpen(false);
    setScene(destination);
    setPlayer(position);
    setMessage(`打开小地图，来到了${destinationName}。`);
    playTone(620);
  };

  const useBuildingService = (building: Exclude<BuildingId, "supermarket" | "farmhouse">) => {
    if (building === "clinic") {
      const caregiver = NPC_SICK_DAYS["白医生"]?.includes(game.day) && game.npcHealedDays["白医生"] !== game.day ? "诊所助手" : "白医生";
      if (!game.diagnosed) {
        setGame((current) => ({ ...current, diagnosed: true }));
        setMessage(game.sick ? `${caregiver}完成检查：小禾确实生病了，我来开一份处方药。` : `${caregiver}完成检查：没有生病，不需要开药。 `);
        playTone(680);
        return;
      }
      if (!game.sick) {
        setMessage("检查已经完成，没有需要服用的药。 ");
        return;
      }
      if (game.coins < 50) {
        setMessage("处方药需要 50 金币。先卖些作物或鱼获再来吧。");
        playTone(220);
        return;
      }
      setGame((current) => ({ ...current, coins: current.coins - 50, sick: false, diagnosed: false, energy: Math.max(80, current.energy) }));
      setMessage(`${caregiver}开了处方药。支付 50 金币后服下药，小禾恢复健康了！`);
      playTone(680);
    } else if (building === "cafe") {
      if (currentFestival?.id === "coffee") {
        setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 35) }));
        setMessage("咖啡日特别招待！免费品尝山谷咖啡和点心，恢复 35 点体力。 ");
        playTone(780);
        return;
      }
      if (game.coins < 35) {
        setMessage("一份咖啡套餐需要 35 金币。");
        playTone(220);
        return;
      }
      setGame((current) => ({ ...current, coins: current.coins - 35, energy: Math.min(100, current.energy + 25) }));
      setMessage("享用麦香咖啡套餐，恢复 25 点体力！");
      playTone(720);
    } else if (building === "townhall") {
      const seasonFestivals = FESTIVAL_SCHEDULE.filter((festival) => festival.season === game.season).map((festival) => `第${festival.day}天${festival.name}`).join("、");
      setMessage(`${SEASONS[game.season]}节日公告：${seasonFestivals}。春节、元宵、端午和中秋的广场都会挂起装饰，居民们也会来到现场。`);
      playTone(520);
    } else if (building === "workshop") {
      setFestivalDisplay("wood");
      setMessage("免费参观鲁师傅的手工作品：鸟屋、小木马和山谷木雕都摆在展示台上。 ");
      playTone(440);
    } else if (building === "school") {
      if (isExcursionAvailable) {
        setBusTraveling(true);
        setAmusementOpen(false);
        setGame((current) => ({ ...current, hour: Math.min(24, current.hour + 1) }));
        setMessage(`${game.season === 0 ? "春游" : "秋游"}出发啦！许老师和同学们一起坐上学校大巴。`);
        playTone(880);
        excursionTimerRef.current = window.setTimeout(() => {
          setBusTraveling(false);
          setAmusementOpen(true);
          excursionTimerRef.current = null;
          setMessage("大巴开了一会儿，终于到达青禾游乐园啦！ ");
          playTone(940);
        }, 3_200);
        return;
      }
      const weekdayIndex = (game.day - 1) % 7;
      const schoolDay = [0, 2, 4, 6].includes(weekdayIndex);
      const attendanceKey = `${game.season}-${game.day}`;
      if (!schoolDay) {
        setMessage(`今天是${WEEKDAYS[weekdayIndex]}，没有课程。学校在周一、周三、周五和周日上课。`);
        playTone(260);
        return;
      }
      if (game.lastSchoolAttendance === attendanceKey) {
        setMessage("今天的课已经听完，50 金币学习奖励也领过了，下一次上课日再来吧。 ");
        return;
      }
      const lessons = [
        "英语课：跟着许老师朗读 A、B、C，并学会了 FARM、SEED 和 WATER。",
        "语文课：阅读《青禾谷的四季》，学习描写春夏秋冬的词语。",
        "数学课：练习种子成本和收获收入的加减法，还用算盘算出了利润。",
        "农场知识课：学习用稻草人防乌鸦、用围栏挡小动物，以及不同季节的照料方法。",
      ];
      const lesson = lessons[(game.day + game.season) % lessons.length];
      setGame((current) => ({ ...current, coins: current.coins + 50, hour: Math.min(24, current.hour + 2), lastSchoolAttendance: attendanceKey }));
      setMessage(`${lesson} 认真听完一天课程，获得 50 金币学习奖励！`);
      playTone(860);
    } else if (building === "museum") {
      if (heldItem?.kind === "artifact") {
        giveHeldItem("沈馆长");
        return;
      }
      setMessage(game.museumArtifacts.length ? `沈馆长：博物馆已经收藏了 ${game.museumArtifacts.length} 件小禾捐赠的稀奇物品，点击展柜可以仔细查看。` : "沈馆长：展柜还空着。偶尔留意农场和青禾镇的地面，双击稀奇物品就能捡来捐赠。 ");
      playTone(620);
    } else {
      setMessage("农事图鉴：萝卜连续浇水三天即可成熟，晴天也不能偷懒哦。");
      playTone(600);
    }
  };

  const inspectBuildingItem = (item: string) => {
    setInspectedItem(item);
    const lostBook = LOST_BOOKS.find((book) => book.title === item);
    const artifact = RARE_ARTIFACTS.find((rareItem) => rareItem.title === item);
    const caregiver = NPC_SICK_DAYS["白医生"]?.includes(game.day) && game.npcHealedDays["白医生"] !== game.day ? "红衣助手" : "白医生";
    if (item === "药品柜") {
      setMessage(!game.diagnosed ? `${caregiver}：要先接受免费检查，检查以后才能查看处方药。` : game.sick ? `药品柜里有${caregiver}刚配好的处方药，需要支付 50 金币。` : "检查结果不需要用药，药品柜暂时不能打开。 ");
    } else if (item === "健康档案" && !game.diagnosed) {
      setMessage(`健康档案还是空白的，要先让${caregiver}做免费检查。 `);
    } else if (lostBook) {
      setMessage(`打开${lostBook.title}：${lostBook.content}`);
    } else if (artifact) {
      setMessage(`查看博物馆藏品“${artifact.title}”：${artifact.description}`);
    } else {
      setMessage(`打开查看“${item}”：${ITEM_DESCRIPTIONS[item]}`);
    }
    playTone(560);
  };

  const nextDay = () => {
    cancelFishing();
    const shippedItemCount = SHIPPING_CATALOG.reduce((sum, item) => sum + (game.shippingBin[item.id] ?? 0), 0);
    const shippedBaseEarnings = SHIPPING_CATALOG.reduce((sum, item) => sum + (game.shippingBin[item.id] ?? 0) * item.price, 0);
    const shippedEarnings = Math.round(shippedBaseEarnings * (game.upgrades.storage ? 1.1 : 1));
    const nextDayNumber = game.day === 28 ? 1 : game.day + 1;
    const nextSeason = game.day === 28 ? (game.season + 1) % SEASONS.length : game.season;
    const nextYear = game.day === 28 && game.season === SEASONS.length - 1 ? game.year + 1 : game.year;
    const nextWeather = weatherForDate(nextYear, nextSeason, nextDayNumber);
    const rainyMorning = nextWeather === "rain" || nextWeather === "thunder";
    const expiringTools = [
      game.toolUpgrades.axe && game.toolUpgradeDays.axe <= 1 ? "精铁斧头" : "",
      game.toolUpgrades.rod && game.toolUpgradeDays.rod <= 1 ? "幸运鱼竿" : "",
    ].filter(Boolean);
    const daysSinceIllness = game.lastIllnessDay === 0
      ? nextDayNumber
      : (nextDayNumber - game.lastIllnessDay + 28) % 28;
    const becameSick = !game.sick && (game.energy <= 0 || (daysSinceIllness >= 6 && nextDayNumber % 6 === 0));
    const remainsSick = game.sick || becameSick;
    const plantedCropIndexes = game.tiles.map((tile, index) => tile.state === "crop" ? index : -1).filter((index) => index >= 0);
    const placedScarecrows = game.placedCrafts.filter((craft) => craft.type === "scarecrow").length;
    const placedFences = game.placedCrafts.filter((craft) => craft.type === "fence").length;
    const animalProtected = placedFences >= 8 || Boolean(game.upgrades.stoneWall);
    let farmVisitor: "crow" | "animal" | null = null;
    if (plantedCropIndexes.length && nextDayNumber % 4 === 0 && !animalProtected) farmVisitor = "animal";
    else if (plantedCropIndexes.length && placedScarecrows < 2 && nextDayNumber % 3 === 0 && (placedScarecrows === 0 || nextDayNumber % 9 === 0)) farmVisitor = "crow";
    const eatenCropIndex = farmVisitor ? plantedCropIndexes[0] : -1;
    const lightningCropIndex = game.weather === "thunder" && plantedCropIndexes.length && Math.random() < .28
      ? (plantedCropIndexes.find((index) => index !== eatenCropIndex) ?? -1)
      : -1;
    const visitorMessage = farmVisitor === "crow"
      ? placedScarecrows === 1 ? " 一只乌鸦还是偶尔飞来吃掉了 1 株幼苗；再放一个稻草人就能完全防住。" : " 一群乌鸦飞进农田，吃掉了 1 株幼苗；放稻草人可以保护作物。"
      : farmVisitor === "animal"
        ? " 一只小动物跑进农田吃掉了 1 株幼苗；围满 8 段栅栏或修建石墙就能挡住它。"
        : "";
    const lightningMessage = lightningCropIndex >= 0 ? " 昨夜一道雷落进田里，劈坏了 1 株作物；雷雨天的这种情况并不常见。" : "";
    const petBirthTypes = nextYear > game.year ? PET_CATALOG.filter((pet) => {
      const sameType = game.pets.filter((ownedPet) => ownedPet.type === pet.id);
      const hasPair = sameType.some((ownedPet) => ownedPet.sex === "男生") && sameType.some((ownedPet) => ownedPet.sex === "女生");
      const familyStartYear = game.lastPetBirthYears[pet.id] ?? Math.max(0, ...sameType.map((ownedPet) => ownedPet.bornYear ?? game.year));
      return hasPair && nextYear - familyStartYear >= 5;
    }) : [];
    const petBirthMessage = petBirthTypes.length ? ` 农舍旁传来小小的叫声：${petBirthTypes.map((pet) => pet.name).join("、")}家庭生活满五年，生下了一只小宝宝！` : "";
    const nextAbsoluteDay = (nextYear - 1) * 112 + nextSeason * 28 + nextDayNumber;
    const allPetsFed = game.pets.length > 0 && game.petFood >= game.pets.length;
    const featherGain = allPetsFed && nextAbsoluteDay % 2 === 0 ? game.pets.filter((pet) => pet.type === "chick" || pet.type === "duck").length : 0;
    const softFurGain = allPetsFed && nextAbsoluteDay % 3 === 0 ? game.pets.filter((pet) => pet.type === "rabbit").length : 0;
    const petFishGain = allPetsFed && nextAbsoluteDay % 4 === 0 ? game.pets.filter((pet) => pet.type === "cat").length : 0;
    const petCoinGain = allPetsFed && nextAbsoluteDay % 5 === 0 ? game.pets.filter((pet) => pet.type === "dog").length * 12 : 0;
    const petSeedGain = allPetsFed && nextAbsoluteDay % 4 === 1 ? game.pets.filter((pet) => pet.type === "hamster").length : 0;
    const healthyPetCandidates = game.pets.filter((pet) => !game.sickPetIds.includes(pet.id) && pet.id !== game.missingPetId);
    const newlySickPet = healthyPetCandidates.length && nextAbsoluteDay - game.lastPetIllnessAbsoluteDay >= 8 && nextAbsoluteDay % 11 === 0 ? healthyPetCandidates[nextAbsoluteDay % healthyPetCandidates.length] : null;
    const wanderCandidates = game.pets.filter((pet) => (pet.type === "rabbit" || pet.type === "dog") && !game.sickPetIds.includes(pet.id));
    const newlyMissingPet = !game.missingPetId && wanderCandidates.length && nextAbsoluteDay % 31 === 0 ? wanderCandidates[nextAbsoluteDay % wanderCandidates.length] : null;
    const exploringChick = game.pets.some((pet) => pet.type === "chick") && nextAbsoluteDay % 23 === 0;
    const chickTreasure = exploringChick ? (["bone", "wood", "food"] as const)[nextAbsoluteDay % 3] : null;
    const petCareMessage = !game.pets.length ? "" : !allPetsFed ? ` 宠物粮不够了：${game.pets.length} 只宠物每晚需要 ${game.pets.length} 份粮，可以去远方新区商场买平价宠物粮。` : ` 宠物们睡前吃掉了 ${game.pets.length} 份粮。${featherGain ? `留下 ${featherGain} 根羽毛；` : ""}${softFurGain ? `兔子留下 ${softFurGain} 团软毛；` : ""}${petFishGain ? `猫带回 ${petFishGain} 条鱼；` : ""}${petCoinGain ? `狗找到 ${petCoinGain} 金币；` : ""}${petSeedGain ? `仓鼠翻出 ${petSeedGain} 颗萝卜种子；` : ""}`;
    const petHealthMessage = newlySickPet ? ` ${PET_CATALOG.find((pet) => pet.id === newlySickPet.type)?.name}今天生病了，颜色变灰、眼睛垂下来。可以用药材治疗或带去新区宠物医院。` : "";
    const rarePetMessage = newlyMissingPet ? ` 很少见的小意外发生了：${PET_CATALOG.find((pet) => pet.id === newlyMissingPet.type)?.name}跑进青禾山洞里躲着吃东西，去山洞找到它并抱回来吧。` : chickTreasure ? ` 小鸡隔了很久出去探险，今天叼回了${chickTreasure === "bone" ? "一块小骨头" : chickTreasure === "wood" ? "两块木头" : "三份宠物粮"}！` : "";
    const morningMessageBase = becameSick
      ? "早上七点醒来，小禾看起来没什么精神，嘴角变成了伤心的样子。"
      : remainsSick
        ? "早上七点了，小禾的表情仍然有些伤心。"
        : `早上七点了！${game.day === 28 ? `新的${SEASONS[nextSeason]}开始了。` : ""}浇过水的作物和松果树苗都长大了一点。`;
    const birthdayMessage = nextSeason === 0 && nextDayNumber === 19 ? ` 今天是第 ${nextYear} 年春天第十九天，也是小禾的二月十九日生日！大家已经带着蛋糕来到农舍，回家就能开生日派对。` : "";
    const shippingMessage = shippedItemCount > 0 ? ` 昨晚大号出货箱卖出了 ${shippedItemCount} 件东西，赚到 ${shippedEarnings} 金币！` : "";
    const weatherMessage = nextWeather === "sunny" ? " 今天阳光很好。" : nextWeather === "cloudy" ? " 今天是阴天，云层把太阳遮住了。" : nextWeather === "rain" ? " 今天下雨，农田和树苗会自动浇水。" : " 今天有雷雨，天空偶尔会打雷闪电，出门记得撑伞。";
    const morningMessage = `${expiringTools.length ? `${morningMessageBase} ${expiringTools.join("和")}的一周使用期到了，已经恢复成普通工具。` : morningMessageBase}${weatherMessage}${shippingMessage}${visitorMessage}${lightningMessage}${petBirthMessage}${petCareMessage}${petHealthMessage}${rarePetMessage}${birthdayMessage}`;
    setShippingReport(shippedItemCount > 0 ? { itemCount: shippedItemCount, earnings: shippedEarnings } : null);
    setGame((current) => {
      const treeStates = [...current.treeStates];
      const emptySpot = treeStates.indexOf(false);
      if (emptySpot >= 0) treeStates[emptySpot] = true;
      const rockStates = [...current.rockStates];
      const emptyRock = rockStates.indexOf(false);
      if (emptyRock >= 0) rockStates[emptyRock] = true;
      const groundBooks = [...current.groundBooks];
      if (nextDayNumber % 3 === 0) {
        const bookId = (Math.floor(nextDayNumber / 3) - 1) % LOST_BOOKS.length;
        if (!current.bookBag.includes(bookId) && !current.libraryBooks.includes(bookId)) groundBooks[bookId] = true;
      }
      const groundArtifacts = [...current.groundArtifacts];
      if (nextDayNumber % 4 === 0) {
        const artifactId = Math.floor(nextDayNumber / 4) % RARE_ARTIFACTS.length;
        if (!current.artifactBag.includes(artifactId) && !current.museumArtifacts.includes(artifactId)) groundArtifacts[artifactId] = true;
      }
      const groundSupplies = [...current.groundSupplies];
      if (nextDayNumber % 2 === 0) {
        let supplyId = Math.floor(nextDayNumber / 2) % GROUND_SUPPLIES.length;
        const supply = GROUND_SUPPLIES[supplyId];
        if (supply.kind === "tool" && current.toolUpgrades[supply.tool]) supplyId = [0, 1, 5][nextDayNumber % 3];
        groundSupplies[supplyId] = true;
      }
      const toolUpgradeDays = {
        axe: current.toolUpgrades.axe ? Math.max(0, current.toolUpgradeDays.axe - 1) : 0,
        rod: current.toolUpgrades.rod ? Math.max(0, current.toolUpgradeDays.rod - 1) : 0,
      };
      const toolUpgrades = {
        ...current.toolUpgrades,
        axe: toolUpgradeDays.axe > 0,
        rod: toolUpgradeDays.rod > 0,
      };
      const greenhouseAutoDay = Boolean(current.upgrades.greenhouse) && current.day % 2 === 0;
      const lastPetBirthYears = { ...current.lastPetBirthYears };
      const pets = [...current.pets];
      petBirthTypes.forEach((pet, index) => {
        pets.push({ id: `${pet.id}-baby-${nextYear}-${index}`, type: pet.id, sex: (nextYear + index) % 2 ? "女生" : "男生", bornDay: nextDayNumber, bornYear: nextYear });
        lastPetBirthYears[pet.id] = nextYear;
      });
      return {
        ...current,
        year: nextYear,
        day: nextDayNumber,
        season: nextSeason,
        weather: nextWeather,
        seasonExcursionCompleted: game.day === 28 ? false : current.seasonExcursionCompleted,
        hour: 7,
        shippingBin: {},
        daily: { ...makeNewGame().daily, day: nextDayNumber },
        energy: remainsSick ? 65 : 100,
        sick: remainsSick,
        diagnosed: false,
        rainExposure: 0,
        lastIllnessDay: becameSick ? nextDayNumber : current.lastIllnessDay,
        water: current.toolUpgrades.water ? 18 : 12,
        toolUpgrades,
        toolUpgradeDays,
        pets,
        lastPetBirthYears,
        petFood: allPetsFed ? Math.max(0, current.petFood - current.pets.length) + (chickTreasure === "food" ? 3 : 0) : current.petFood + (chickTreasure === "food" ? 3 : 0),
        feathers: current.feathers + featherGain,
        softFur: current.softFur + softFurGain,
        petBones: current.petBones + (chickTreasure === "bone" ? 1 : 0),
        wood: current.wood + (chickTreasure === "wood" ? 2 : 0),
        seeds: current.seeds + petSeedGain,
        inventory: { ...current.inventory, fish: current.inventory.fish + petFishGain },
        coins: current.coins + shippedEarnings + petCoinGain,
        sickPetIds: newlySickPet && !current.sickPetIds.includes(newlySickPet.id) ? [...current.sickPetIds, newlySickPet.id] : current.sickPetIds,
        lastPetIllnessAbsoluteDay: newlySickPet ? nextAbsoluteDay : current.lastPetIllnessAbsoluteDay,
        missingPetId: newlyMissingPet?.id ?? current.missingPetId,
        farmVisitor,
        treeStates,
        plantedTrees: current.plantedTrees.map((tree) => ({ ...tree, stage: tree.watered ? Math.min(3, tree.stage + 1) : tree.stage, watered: rainyMorning })),
        rockStates,
        groundBooks,
        groundArtifacts,
        groundSupplies,
        tiles: current.tiles.map((tile, index) => index === eatenCropIndex || index === lightningCropIndex
          ? { state: "soil", stage: 0, watered: false }
          : tile.state === "crop"
            ? { ...tile, stage: Math.min(3, tile.stage + (tile.watered ? (current.upgrades.greenhouse ? 2 : 1) : greenhouseAutoDay ? 1 : 0)), watered: rainyMorning }
            : tile),
      };
    });
    setMessage(morningMessage);
    playTone(540);
  };

  const sleepAtHome = () => {
    if (bedtimePhase) return;
    setIndoorPlayer({ x: 12, y: 70 });
    setBedtimePhase("tuckedIn");
    setMessage("小禾躺到床上，被子自动盖好了。晚安……");
    playTone(420);
    const sleepTimer = window.setTimeout(() => {
      nextDay();
      setScene("farm");
      setActiveBuilding("farmhouse");
      setIndoorPlayer({ x: 12, y: 70 });
      setBedtimePhase("waking");
    }, 1_250);
    bedtimeTimersRef.current.push(sleepTimer);
  };

  const endDayFromAnywhere = () => {
    if (bedtimePhase) return;
    setCraftingOpen(false); setChestOpen(false); setShippingBinOpen(false); setMapOpen(false); setBuilderOpen(false); setRanchOpen(false); setMallOpen(false); setPetShopOpen(false); setPetHospitalOpen(false);
    setNeighborInterior(null); setResidentHome(null); setFriendHomeOpen(false); setFarmInterior(null); setActiveBuilding(null);
    setScene("farm");
    setPlayer({ x: 8, y: 4 });
    setBedtimePhase("walkingHome");
    setMessage("天晚了。你不用操作，小禾正在自己沿路走回农舍。 ");
    playTone(380);
    const enterTimer = window.setTimeout(() => {
      setActiveBuilding("farmhouse");
      setIndoorPlayer({ x: 12, y: 70 });
      setBedtimePhase("tuckedIn");
      setMessage("小禾走进房间、爬上床，被子自动盖好了。晚安……");
    }, 1_350);
    const wakeTimer = window.setTimeout(() => {
      nextDay();
      setActiveBuilding("farmhouse");
      setIndoorPlayer({ x: 12, y: 70 });
      setBedtimePhase("waking");
    }, 2_650);
    bedtimeTimersRef.current.push(enterTimer, wakeTimer);
  };

  const eatBirthdayCake = () => {
    if (game.birthdayCakeYear === game.year) {
      setMessage("今年的生日蛋糕已经和大家一起吃完了，明年春天第十九天还会再举办派对。 ");
      return;
    }
    setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 40), birthdayCakeYear: current.year }));
    setMessage("小禾和大家一起切开草莓生日蛋糕，吃下一大块，恢复了 40 点体力！大家一起说：生日快乐！ ");
    playTone(940);
  };

  const resetGame = () => {
    if (!window.confirm("要清空当前进度，重新开始吗？")) return;
    const fresh = makeNewGame();
    setGame(fresh);
    setSelected("hoe");
    setSelectedCrop("radish");
    setPlayer({ x: 6, y: 5 });
    setIndoorPlayer({ x: 34, y: 69 });
    setScene("farm");
    setActiveBuilding(null);
    cancelFishing();
    setCraftingOpen(false);
    setChestOpen(false);
    setShippingBinOpen(false);
    setShippingReport(null);
    setSelectedResource(null);
    setSelectedCraftItem(null);
    setPlantingPinecone(false);
    setResidentHome(null);
    setFriendHomeOpen(false);
    setMessage("新的农场生活开始了！");
    localStorage.setItem(saveStorageKey, JSON.stringify(fresh));
  };

  const chooseTool = (tool: Tool) => {
    setSelectedResource(null);
    setPlantingPinecone(false);
    if (tool === "seed" && selected === "seed") {
      const nextCrop = CROP_TYPES[(CROP_TYPES.indexOf(selectedCrop) + 1) % CROP_TYPES.length];
      setSelectedCrop(nextCrop);
      setMessage(`已切换为${CROP_INFO[nextCrop].name}种子，再点一次可以继续切换。`);
      playTone(560);
      return;
    }
    setSelected(tool);
  };

  const transferSaveToWeb = async () => {
    if (transferringSave) return;
    setTransferringSave(true);
    setMessage("正在把当前游戏进度转移到正式网页……");
    try {
      const endpoint = window.location.hostname === "localhost"
        ? "https://qinghe-valley.ahuazhu.chatgpt.site/api/cloud-save"
        : "/api/cloud-save";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ save: game }),
      });
      const result = await response.json() as { transferUrl?: string; error?: string };
      if (!response.ok || !result.transferUrl) throw new Error(result.error || "存档转移失败");
      setMessage("存档上传成功，正在打开正式网页版……");
      window.location.href = result.transferUrl;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "存档转移失败，请稍后再试。");
      setTransferringSave(false);
    }
  };

  const getDeviceId = () => {
    const existing = localStorage.getItem("qinghe-device-id");
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem("qinghe-device-id", created);
    return created;
  };

  const connectMultiplayer = async (roomCode: string, village: VillageId) => {
    const normalizedCode = roomCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,8}$/.test(normalizedCode)) {
      setMultiplayerError("房间码要有 4 到 8 个字母或数字");
      return;
    }
    setJoiningMultiplayer(true);
    setMultiplayerError("");
    const deviceId = multiplayerSession?.deviceId ?? getDeviceId();
    const playerName = playerNameInput.trim().slice(0, 12) || "小禾";
    try {
      const response = await fetch("/api/multiplayer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roomCode: normalizedCode,
          deviceId,
          playerName,
          village,
          x: player.x,
          y: player.y,
          day: game.day,
          hour: game.hour,
          energy: game.energy,
          sick: game.sick,
        }),
      });
      const result = await response.json() as { village?: VillageId; players?: OnlinePlayer[]; error?: string };
      if (!response.ok || !result.village || !result.players) throw new Error(result.error || "加入房间失败");
      const session = { roomCode: normalizedCode, deviceId, playerName, village: result.village };
      setMultiplayerSession(session);
      setOnlinePlayers(result.players);
      setRoomCodeInput(normalizedCode);
      setPreferredVillage(result.village);
      switchVillage(result.village);
      localStorage.setItem("qinghe-multiplayer-session", JSON.stringify(session));
      setMessage(`已经住进${VILLAGE_INFO[result.village].name}，房间码是 ${normalizedCode}。`);
      setMultiplayerOpen(false);
    } catch (error) {
      setMultiplayerError(error instanceof Error ? error.message : "加入房间失败");
    } finally {
      setJoiningMultiplayer(false);
    }
  };

  const createMultiplayerRoom = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    setRoomCodeInput(code);
    void connectMultiplayer(code, preferredVillage);
  };

  const leaveMultiplayer = async () => {
    const session = multiplayerSession;
    setMultiplayerSession(null);
    switchVillage("qinghe");
    setOnlinePlayers([]);
    setMultiplayerError("");
    localStorage.removeItem("qinghe-multiplayer-session");
    if (session) {
      try {
        await fetch("/api/multiplayer", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ roomCode: session.roomCode, deviceId: session.deviceId }),
        });
      } catch {
        // Leaving locally still succeeds if the network is unavailable.
      }
    }
    setMessage("已经退出双人联机，当前农场存档仍然保留。 ");
  };

  useEffect(() => {
    if (!ready || !multiplayerSession) return;
    let cancelled = false;
    const synchronize = async () => {
      const { player: latestPlayer, game: latestGame } = multiplayerStatusRef.current;
      try {
        const response = await fetch("/api/multiplayer", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...multiplayerSession,
            x: latestPlayer.x,
            y: latestPlayer.y,
            day: latestGame.day,
            hour: latestGame.hour,
            energy: latestGame.energy,
            sick: latestGame.sick,
            currentVillage: worldVillage,
            scene,
          }),
        });
        const result = await response.json() as { players?: OnlinePlayer[] };
        if (!cancelled && response.ok && result.players) setOnlinePlayers(result.players);
      } catch {
        // The next heartbeat will reconnect automatically.
      }
    };
    void synchronize();
    const heartbeat = window.setInterval(synchronize, 3_000);
    return () => {
      cancelled = true;
      window.clearInterval(heartbeat);
    };
  }, [multiplayerSession, ready, scene, worldVillage]);

  const tasks = useMemo(
    () => {
      const goalSet = (game.day - 1) % 3;
      if (goalSet === 1) return [
        { label: "钓到 1 条鱼", done: game.daily.fish >= 1 },
        { label: "砍倒 1 棵树", done: game.daily.chopped >= 1 },
        { label: "自动售卖 1 件物品", done: game.daily.sold >= 1 },
      ];
      if (goalSet === 2) return [
        { label: "播下 2 颗种子", done: game.daily.planted >= 2 },
        { label: "给 2 株作物浇水", done: game.daily.watered >= 2 },
        { label: "收获 2 个作物", done: game.daily.harvested >= 2 },
      ];
      return [
        { label: "播下 1 颗种子", done: game.daily.planted >= 1 },
        { label: "给作物浇 1 次水", done: game.daily.watered >= 1 },
        { label: "收获 1 个作物", done: game.daily.harvested >= 1 },
      ];
    },
    [game.daily, game.day],
  );

  const completed = tasks.filter((task) => task.done).length;

  useEffect(() => {
    if (!ready || completed < 3 || game.daily.rewardClaimed) return;
    setGame((current) => current.daily.rewardClaimed
      ? current
      : { ...current, coins: current.coins + 100, daily: { ...current.daily, rewardClaimed: true } });
    setMessage("今日三个小目标全部完成！奖励 100 金币已经放进钱包。");
    playTone(880);
  }, [completed, game.daily.rewardClaimed, ready]);

  const twilightLevel = game.hour >= 16
    ? Math.min(1, (game.hour - 16) / 4)
    : game.hour < 5
      ? 1
      : game.hour < 7
        ? 1 - (game.hour - 5) / 2
        : 0;
  const isNight = twilightLevel >= 0.5;
  const isSchoolDay = [0, 2, 4, 6].includes((game.day - 1) % 7);
  const clockHour = Math.floor(game.hour) % 24;
  const clockMinute = Math.round((game.hour - Math.floor(game.hour)) * 60) % 60;
  const weatherInfo = WEATHER_INFO[game.weather];
  const activeVillage = worldVillage;
  const activeVillageInfo = VILLAGE_INFO[activeVillage];
  const partner = onlinePlayers.find((onlinePlayer) => onlinePlayer.deviceId !== multiplayerSession?.deviceId);
  const dailyWoodcraftIndex = (game.day - 1) % DAILY_WOODCRAFTS.length;
  const dailyWoodcraft = DAILY_WOODCRAFTS[dailyWoodcraftIndex];
  const inspectedArtifactIndex = RARE_ARTIFACTS.findIndex((artifact) => artifact.title === inspectedItem);
  const currentFestival = FESTIVAL_SCHEDULE.find((festival) => festival.season === game.season && festival.day === game.day) ?? null;
  const calendarPosition = game.season * 28 + game.day;
  const nextFestival = FESTIVAL_SCHEDULE.find((festival) => festival.season * 28 + festival.day >= calendarPosition) ?? FESTIVAL_SCHEDULE[0];
  const nextFestivalPosition = nextFestival.season * 28 + nextFestival.day;
  const daysUntilFestival = nextFestivalPosition >= calendarPosition ? nextFestivalPosition - calendarPosition : 112 - calendarPosition + nextFestivalPosition;
  const displayName = multiplayerSession?.playerName ?? "小禾";
  const isBirthday = game.season === 0 && game.day === 19;
  const calendarMonth = [2, 5, 8, 11][game.season];
  const sceneLabel = scene === "farm" ? activeVillageInfo.farm : scene === "westFriendFarm" ? "西边 · 安安的小农场" : scene === "mysteryRoad" ? "远方新区 · 青禾大商场" : scene === "town" ? `${activeVillageInfo.name} · 中心街` : scene === "cultureDistrict" ? `${activeVillageInfo.name} · 清河文化街` : scene === "residentialDistrict" ? `${activeVillageInfo.name} · 青禾住宅坡` : scene === "eastNeighbor" ? "东郊 · 林婶的果园小屋" : scene === "southNeighbor" ? "南坡 · 鲁师傅的院子" : "北林 · 叶老师的书屋";
  const wildFriendVisit: "cave" | "camp" | null = game.day % 5 === 0 ? "cave" : game.day % 5 === 2 ? "camp" : null;
  const currentAnanTripKey = `${game.year}-${game.season}`;
  const wildFriendAtPlayerHome = game.day % 5 === 3 || (!game.ananBeachTrips.includes(currentAnanTripKey) && game.day >= 22);
  const isNpcSick = (name: string) => (NPC_SICK_DAYS[name]?.includes(game.day) ?? false) && game.npcHealedDays[name] !== game.day;
  const doctorIsRestingAtHome = isNpcSick("白医生");
  const originalBuildingOwner = activeBuilding ? BUILDING_INFO[activeBuilding].owner : "";
  const activeReliefWorker = originalBuildingOwner && isNpcSick(originalBuildingOwner) ? RELIEF_WORKERS[originalBuildingOwner] : null;
  const activeBuildingOwner = activeReliefWorker?.name ?? originalBuildingOwner;
  const activeBuildingGreeting = activeReliefWorker?.greeting ?? (activeBuilding ? BUILDING_INFO[activeBuilding].greeting : "");
  const supermarketReliefWorker = isNpcSick("林婶") ? RELIEF_WORKERS["林婶"] : null;
  const supermarketClerk = supermarketReliefWorker?.name ?? "林婶";
  const isExcursionAvailable = (game.season === 0 || game.season === 2) && !game.seasonExcursionCompleted;
  const excursionName = game.season === 0 ? "春游" : "秋游";
  const residentHomeInfo = residentHome ? RESIDENT_HOMES.find((home) => home.owner === residentHome) ?? null : null;
  const residentHomeGreeting = residentHome === "白医生" && doctorIsRestingAtHome
    ? "我今天生病了，所以留在自己的家里休息。谢谢你来看我，诊所由穿红色制服的助手代班。"
    : residentHomeInfo?.greeting ?? "";

  const finishExcursion = () => {
    if (excursionTimerRef.current) window.clearTimeout(excursionTimerRef.current);
    excursionTimerRef.current = null;
    setAmusementOpen(false);
    setBusTraveling(false);
    setGame((current) => ({ ...current, seasonExcursionCompleted: true, hour: Math.min(24, current.hour + 1) }));
    setMessage(`${excursionName}结束了，老师和同学们坐大巴回到学校。下面已经恢复成正常的开始听课。`);
    playTone(760);
  };

  const goToFestival = () => {
    const festival = currentFestival ?? nextFestival;
    setActiveBuilding(null);
    if (festival.id === "seeds") {
      setScene("town"); setPlayer({ x: 3, y: 4 }); setActiveBuilding("supermarket"); setMessage("种子分享日开始啦！水果和蔬菜种子都能免费领取。 ");
    } else if (festival.id === "fishing") {
      setScene("farm"); setPlayer({ x: 1, y: 3 }); setMessage("来到钓鱼节会场！选择鱼竿并点击钓鱼池参加比赛。 ");
    } else if (festival.id === "spring") {
      setScene("town"); setPlayer({ x: 5, y: 5 }); setMessage("春日集市开场啦！点击广场上的摊位参加活动。 ");
    } else if (festival.id === "coffee") {
      setScene("town"); setPlayer({ x: 10, y: 6 }); setActiveBuilding("cafe"); setMessage("咖啡日开始啦！阿麦准备了咖啡和新鲜点心。 ");
    } else if (festival.id === "craft") {
      setScene("town"); setPlayer({ x: 3, y: 6 }); setActiveBuilding("workshop"); setMessage("山谷手作日开始啦！居民们正在展示亲手制作的作品。 ");
    } else {
      setScene("town"); setPlayer({ x: 5, y: 5 }); setMessage(TRADITIONAL_FESTIVALS[festival.id]?.greeting ?? `${festival.name}开始啦！`);
    }
  };

  const claimTraditionalTreat = () => {
    if (!currentFestival) return;
    const festivalInfo = TRADITIONAL_FESTIVALS[currentFestival.id];
    if (!festivalInfo) return;
    const claimKey = `${game.year}-${game.season}-${game.day}-${currentFestival.id}`;
    if (festivalTreatDay === claimKey) {
      setMessage(`今天已经领过${festivalInfo.treat}啦，去和广场上的居民们聊聊天吧。`);
      return;
    }
    setFestivalTreatDay(claimKey);
    setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 20) }));
    setMessage(`免费领取了${festivalInfo.treat}，恢复 20 点体力！`);
    playTone(820);
  };

  const answerDrivingQuestion = (answerIndex: number) => {
    const question = DRIVING_QUESTIONS[drivingQuizStep];
    if (answerIndex !== question.correct) {
      setDrivingQuizStep(0);
      setMessage("这道题答错了，从第一题重新练习吧。安全驾驶最重要！");
      playTone(210);
      return;
    }
    if (drivingQuizStep < DRIVING_QUESTIONS.length - 1) {
      setDrivingQuizStep((current) => current + 1);
      setMessage("答对了，继续下一道汽车常识题。 ");
      playTone(620);
      return;
    }
    setDrivingQuizStep(DRIVING_QUESTIONS.length);
    setDrivingPracticeStep(0);
    setMessage("理论考试通过！接下来驾驶练习车完成转向、绕桩和停车。 ");
    playTone(760);
  };

  const doDrivingPractice = (step: number) => {
    if (step !== drivingPracticeStep) {
      setDrivingPracticeStep(0);
      setMessage("顺序不对：先左转，再右转绕桩，最后停车。重新来一次吧。 ");
      playTone(210);
      return;
    }
    if (step < 2) {
      setDrivingPracticeStep(step + 1);
      setMessage(step === 0 ? "左转完成，接着向右绕过路桩。 " : "成功绕桩，最后把车停进停车框。 ");
      playTone(600 + step * 80);
      return;
    }
    setGame((current) => ({ ...current, driverLicense: true }));
    setMessage("驾驶考试通过！你获得了青禾谷驾照，现在可以买汽车了。 ");
    playTone(920);
  };

  const buyOrDriveCar = () => {
    if (game.season === 0) {
      setMessage("道路还在春季规划中，告示牌写着：夏季施工，秋季通车。先去驾校考驾照吧。 ");
      return;
    }
    if (game.season === 1) {
      setMessage("夏季正在封路施工，工人们正在钻地孔、铺路面。等到秋天道路就会成型。 ");
      return;
    }
    if (!game.driverLicense) {
      setMessage("还没有驾照。先进入旁边的青禾驾校，通过理论和驾驶考试。 ");
      return;
    }
    if (!game.ownsCar) {
      if (game.coins < 3000) {
        setMessage(`购买汽车需要 3000 金币，现在有 ${game.coins} 金币。`);
        playTone(210);
        return;
      }
      setGame((current) => ({ ...current, coins: current.coins - 3000, ownsCar: true }));
      setMessage("购买了橙色小汽车！再点击汽车就能驶向远方新区。 ");
      playTone(880);
      return;
    }
    setCarTraveling(true);
    setCarRouteTarget("district");
    setCarRouteStep(0);
    setCarHeading("forward");
    setCarStopped(false);
    setTrafficLight("green");
    setMessage("汽车发动后会自动前进。遇到红灯按刹车，看到道路九十度转弯时按左转或右转。 ");
  };

  const driveCar = (action: "forward" | "brake" | "left" | "right" | "uturn") => {
    if (!carTraveling) return;
    if (action === "uturn") {
      setCarHeading("back");
      setCarTraveling(false);
      setCarStopped(false);
      const returnScene = carRouteTarget === "district" ? "westFriendFarm" : "mysteryRoad";
      setScene(returnScene);
      setPlayer({ x: 6, y: 5 });
      setMessage(carRouteTarget === "district" ? "小禾在安全位置掉头，回到了安安的小农场。 " : "小禾掉头回到了远方新区。 ");
      playTone(420);
      return;
    }
    if (action === "brake") {
      setCarStopped(true);
      setMessage(carRouteStep === 1 && trafficLight === "red" ? "在停止线前安全刹住了！等绿灯亮起会自动继续到转弯处。 " : "汽车已经刹停。按前进即可继续行驶。 ");
      playTone(340);
      if (carRouteStep === 1 && trafficLight === "red") {
        const lightTimer = window.setTimeout(() => {
          setTrafficLight("green"); setCarRouteStep(2); setCarStopped(false); setMessage("绿灯亮了，汽车继续前进，前方道路即将九十度转弯。 "); playTone(620);
        }, 1_050);
        bedtimeTimersRef.current.push(lightTimer);
      }
      return;
    }
    if (action === "forward") {
      if (carRouteStep === 1 && trafficLight === "red") {
        setMessage("红灯不能继续前进，请按刹车停在停止线前。 "); playTone(210); return;
      }
      if (carRouteStep === 2 || carRouteStep === 4) {
        setMessage("道路已经九十度转弯，直行会离开路面，请按正确方向转弯。 "); playTone(210); return;
      }
      setCarStopped(false); setCarHeading("forward"); setMessage("松开刹车，汽车继续自动前进。 "); playTone(520); return;
    }
    const expected = carRouteTarget === "district"
      ? (carRouteStep === 2 ? "right" : carRouteStep === 4 ? "left" : null)
      : (carRouteStep === 2 ? "left" : carRouteStep === 4 ? "right" : null);
    setCarHeading(action);
    if (action !== expected) {
      setMessage(`车轮转向了${action === "left" ? "左边" : "右边"}，但道路弯向另一侧，请看清路面再转。`); playTone(220);
      return;
    }
    setCarStopped(false);
    setCarRouteStep(carRouteStep + 1);
    const straightTimer = window.setTimeout(() => setCarHeading("forward"), 480);
    bedtimeTimersRef.current.push(straightTimer);
    setMessage("顺着道路完成九十度转弯，汽车继续沿车道自动前进。 ");
    playTone(690);
  };

  const buyMallItem = (name: string, price: number, energy = 0, item?: MallItem) => {
    if (game.coins < price) {
      setMessage(`${name}需要 ${price} 金币，现在的钱不够。`);
      playTone(210);
      return;
    }
    setGame((current) => ({
      ...current,
      coins: current.coins - price,
      energy: Math.min(100, current.energy + energy),
      mallItems: item ? { ...current.mallItems, [item]: current.mallItems[item] + 1 } : current.mallItems,
    }));
    setMessage(energy ? `买下${name}并品尝了，恢复 ${energy} 点体力。` : `买下了${name}，已经放进左边的商场物品背包。`);
    playTone(720);
  };

  const useWoolBlanket = () => {
    setCraftingOpen(true);
    setMessage(`已经打开制作手册。找到“羊毛毯”，使用 3 团羊毛制作；现在有 ${game.wool} 团羊毛。`);
    playTone(560);
  };

  const clickWool = () => {
    if (woolClickTimerRef.current) window.clearTimeout(woolClickTimerRef.current);
    woolClickTimerRef.current = window.setTimeout(useWoolBlanket, 230);
  };

  const doubleClickWool = () => {
    if (woolClickTimerRef.current) window.clearTimeout(woolClickTimerRef.current);
    pickUpAnimalProduct("wool");
  };

  const buyPet = () => {
    const pet = PET_CATALOG.find((entry) => entry.id === selectedPet)!;
    if (game.coins < pet.price) {
      setMessage(`领养${pet.name}需要 ${pet.price} 金币，现在的钱不够。`);
      playTone(210);
      return;
    }
    const petRecord: PetRecord = { id: `${pet.id}-${Date.now()}`, type: pet.id, sex: selectedPetSex, bornDay: game.day, bornYear: game.year };
    setGame((current) => ({ ...current, coins: current.coins - pet.price, pets: [...current.pets, petRecord] }));
    setMessage(`领养了${selectedPetSex}${pet.name}！它已经住进农舍旁的小宠物院。养到同种的一男一女，之后有机会生小宝宝。`);
    playTone(880);
  };

  const buyPetFood = () => {
    const price = 25;
    if (game.coins < price) { setMessage("宠物粮小袋需要 25 金币，现在的钱不够。 "); playTone(210); return; }
    setGame((current) => ({ ...current, coins: current.coins - price, petFood: current.petFood + 10 }));
    setMessage("买到一袋平价宠物粮，共 10 份，已经放进资源记录。每天睡觉前会自动喂给跟随的小宠物。 ");
    playTone(720);
  };

  const healPetWithHerb = (pet: PetRecord) => {
    const petName = PET_CATALOG.find((entry) => entry.id === pet.type)?.name ?? "小宠物";
    if (!game.sickPetIds.includes(pet.id)) { setMessage(`${petName}精神很好，正在小禾脚边开心地跑动。`); return; }
    if (game.herbs <= 0) { setMessage(`${petName}很不舒服，但背包里没有药材。可以开车带它去远方新区的宠物医院。`); playTone(210); return; }
    setGame((current) => ({ ...current, herbs: current.herbs - 1, sickPetIds: current.sickPetIds.filter((id) => id !== pet.id) }));
    setMessage(`给${petName}用了一份药材，它的颜色恢复了，眼睛也重新亮起来！`);
    playTone(870);
  };

  const treatPetAtHospital = (petId: string) => {
    const pet = game.pets.find((ownedPet) => ownedPet.id === petId);
    if (!pet) return;
    if (game.coins < 35) { setMessage("宠物检查和配药一共需要 35 金币，现在的钱不够。也可以用自己采到的药材治疗。 "); playTone(210); return; }
    const petName = PET_CATALOG.find((entry) => entry.id === pet.type)?.name ?? "小宠物";
    setGame((current) => ({ ...current, coins: current.coins - 35, sickPetIds: current.sickPetIds.filter((id) => id !== petId) }));
    setMessage(`宠物医生检查了${petName}并喂下药，已经恢复健康！`);
    playTone(900);
  };

  const followingPets = game.pets.filter((pet) => pet.id !== game.missingPetId);
  const renderPetFollowers = () => followingPets.length ? <span className="pet-followers" aria-label={`${followingPets.length}只宠物跟着小禾`}>
    {followingPets.slice(0, 4).map((pet, index) => <button key={pet.id} className={`following-pet pet-${pet.type} follower-${index + 1} ${game.sickPetIds.includes(pet.id) ? "sick-pet" : ""}`} onClick={(event) => { event.stopPropagation(); healPetWithHerb(pet); }} aria-label={`${PET_CATALOG.find((entry) => entry.id === pet.type)?.name}${game.sickPetIds.includes(pet.id) ? "生病了，点击使用药材" : "正在跟随"}`}><i /><b /></button>)}
    {followingPets.length > 4 && <em>+{followingPets.length - 4}</em>}
  </span> : null;

  const wearMallOutfit = (outfit: "redCoat" | "blueOutfit") => {
    if (game.mallItems[outfit] <= 0) return;
    const removing = game.equippedOutfit === outfit;
    setGame((current) => ({ ...current, equippedOutfit: removing ? "default" : outfit }));
    setMessage(removing ? "换回了原来的农夫服装。" : `换上了${outfit === "redCoat" ? "红色节日外套" : "蓝色旅行套装"}！`);
    playTone(680);
  };

  const toggleUmbrella = () => {
    if (game.mallItems.umbrella <= 0) return;
    setGame((current) => ({ ...current, umbrellaOpen: !current.umbrellaOpen }));
    setMessage(game.umbrellaOpen ? "把彩色雨伞收起来了。" : game.weather === "rain" || game.weather === "thunder" ? "撑开彩色雨伞，雨水不会打湿小禾了。" : "撑开彩色雨伞，现在虽然没有下雨，也可以遮阳。 ");
    playTone(640);
  };

  const openMallSeedBox = () => {
    if (game.mallItems.seedBox <= 0) return;
    setGame((current) => ({ ...current, mallItems: { ...current.mallItems, seedBox: current.mallItems.seedBox - 1 }, seeds: current.seeds + 5, strawberrySeeds: current.strawberrySeeds + 5, cornSeeds: current.cornSeeds + 5, watermelonSeeds: current.watermelonSeeds + 5 }));
    setMessage("打开家庭种子礼盒，获得萝卜、草莓、玉米和西瓜种子各 5 颗！");
    playTone(820);
  };

  const walkToPointer = (event: MouseEvent<HTMLDivElement>) => {
    if (activeBuilding || neighborInterior || residentHome || friendHomeOpen || craftingOpen || chestOpen || shippingBinOpen || multiplayerOpen || builderOpen || ranchOpen || farmInterior || festivalDisplay || bulkChestPrompt || ananBeachOpen || ananBeachTraveling || drivingSchoolOpen || carTraveling || mallOpen || petShopOpen || petHospitalOpen || bedtimePhase) return;
    if ((event.target as HTMLElement).closest("button, input, .shop-overlay")) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const percentX = ((event.clientX - bounds.left) / bounds.width) * 100;
    const percentY = ((event.clientY - bounds.top) / bounds.height) * 100;
    if (plantingPinecone) {
      if (scene !== "farm") {
        setMessage("松果要种在自己的农场草地上，先回农场吧。 ");
        return;
      }
      if ((event.target as HTMLElement).closest(".field, .path")) {
        setMessage("这里不是绿色草地，请点击农田旁边的绿色位置。 ");
        return;
      }
      if (game.pinecones <= 0) {
        setPlantingPinecone(false);
        setMessage("背包里的松果已经用完了。 ");
        return;
      }
      const treeX = Math.max(6, Math.min(93, percentX));
      const treeY = Math.max(24, Math.min(88, percentY));
      if (game.plantedTrees.some((tree) => Math.hypot(tree.x - treeX, tree.y - treeY) < 7)) {
        setMessage("这里离另一棵树太近了，换一块绿色草地吧。 ");
        return;
      }
      const plantedTree: PlantedTree = { id: `pine-tree-${Date.now()}`, x: treeX, y: treeY, stage: 0, watered: false };
      setGame((current) => ({ ...current, pinecones: Math.max(0, current.pinecones - 1), plantedTrees: [...current.plantedTrees, plantedTree] }));
      if (game.pinecones <= 1) setPlantingPinecone(false);
      setMessage("松果种进绿色草地里了！现在是一棵小树苗，记得用洒水壶浇水，睡到明天才会长大。 ");
      playTone(720);
      return;
    }
    if (selectedCraftItem) {
      if (scene !== "farm") {
        setMessage("制作物只能摆在自己的农场，先回农场再摆放。 ");
        return;
      }
      if (game.crafted[selectedCraftItem] <= 0) {
        setSelectedCraftItem(null);
        setMessage("背包里已经没有这个制作物了。 ");
        return;
      }
      if (selectedCraftItem === "fence") {
        setMessage("请点击农田四周整齐的绿色位置来放木围栏。 ");
        return;
      }
      if (selectedCraftItem === "gate") {
        const oldGate = game.placedCrafts.find((craft) => craft.type === "gate");
        if (oldGate) {
          setSelectedCraftItem(null);
          setMessage("农田围栏中间已经装有一扇木门了，点击它就能开关。 ");
          return;
        }
        const gate: PlacedCraft = { id: `gate-${Date.now()}`, type: "gate", x: 49, y: 40, rotation: 0 };
        setGame((current) => ({ ...current, crafted: { ...current.crafted, gate: Math.max(0, current.crafted.gate - 1) }, placedCrafts: [...current.placedCrafts, gate] }));
        setSelectedCraftItem(null);
        setFarmGateOpen(false);
        setMessage("木围栏门已经自动装在农田上方围栏的中间。点击门就能打开或关上。 ");
        playTone(760);
        return;
      }
      if (selectedCraftItem === "matches") {
        igniteWithMatches();
        setSelectedCraftItem(null);
        return;
      }
      const placed: PlacedCraft = { id: `${selectedCraftItem}-${Date.now()}`, type: selectedCraftItem, x: Math.max(5, Math.min(94, percentX)), y: Math.max(18, Math.min(86, percentY)), rotation: craftRotation };
      setGame((current) => ({ ...current, crafted: { ...current.crafted, [selectedCraftItem]: Math.max(0, current.crafted[selectedCraftItem] - 1) }, placedCrafts: [...current.placedCrafts, placed] }));
      if (game.crafted[selectedCraftItem] <= 1) setSelectedCraftItem(null);
      setMessage(`${CRAFT_RECIPES[selectedCraftItem].name}已经摆放到农场！${selectedCraftItem === "scarecrow" ? "摆两个稻草人后，乌鸦就不会再来。" : ""}`);
      playTone(720);
      return;
    }
    const destination = { x: Math.max(0, Math.min(11, Math.round((percentX - 4) / 7.7))), y: Math.max(0, Math.min(7, Math.round((percentY - 8) / 10.5))) };
    if (scene === "farm") {
      const fenceCount = game.placedCrafts.filter((craft) => craft.type === "fence").length;
      const hasGate = game.placedCrafts.some((craft) => craft.type === "gate");
      const isInsideField = (position: { x: number; y: number }) => position.x >= 2 && position.x <= 9 && position.y >= 4;
      if (fenceCount >= 8 && isInsideField(player) !== isInsideField(destination)) {
        const canUseGate = hasGate && farmGateOpen && destination.x >= 5 && destination.x <= 6;
        if (!canUseGate) {
          setMessage(hasGate ? "木围栏挡住了路。先点击中间的围栏门把它打开。 " : "围栏挡住了路，制作一扇木围栏门才能进出。 ");
          return;
        }
      }
    }
    showWalking(destination.x - player.x, destination.y - player.y);
    const pointerDx = destination.x - player.x;
    const pointerDy = destination.y - player.y;
    if (crossSceneBoundary(destination, Math.abs(pointerDx) >= Math.abs(pointerDy) ? pointerDx : 0, Math.abs(pointerDy) > Math.abs(pointerDx) ? pointerDy : 0)) return;
    setPlayer(destination);
    setMessage("小禾走到了你点击的位置。 ");
  };

  const walkInsidePointer = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    if (bedtimePhase === "tuckedIn") return;
    if (bedtimePhase === "waking") setBedtimePhase(null);
    const bounds = event.currentTarget.getBoundingClientRect();
    const destination = { x: Math.max(20, Math.min(80, ((event.clientX - bounds.left) / bounds.width) * 100)), y: Math.max(62, Math.min(76, ((event.clientY - bounds.top) / bounds.height) * 100)) };
    showWalking(destination.x - indoorPlayer.x, destination.y - indoorPlayer.y);
    setIndoorPlayer(destination);
    setMessage("小禾走到了屋里点击的位置。 ");
  };

  if (splitScreen && !embeddedMode) {
    return (
      <main className="split-game-shell">
        <header className="split-topbar"><div><strong>青禾谷 · 双人模式</strong><span>同一屏幕一起玩</span></div><div className="split-controls-hint"><span>玩家一：WASD</span><span>玩家二：方向键</span></div><button onClick={() => setSplitScreen(false)}>退出双人模式</button></header>
        <section className="split-worlds">
          <article><div className="split-village-label qinghe-label"><strong>玩家一 · 青禾村</strong><span>WASD 移动，也可以点屏幕按钮</span></div><iframe ref={splitLeftRef} src="/?splitVillage=qinghe" title="玩家一的青禾村" /></article>
          <div className="split-divider" aria-hidden="true"><span>双人</span></div>
          <article><div className="split-village-label maple-label"><strong>玩家二 · 枫叶村</strong><span>方向键移动，也可以点屏幕按钮</span></div><iframe ref={splitRightRef} src="/?splitVillage=maple" title="玩家二的枫叶村" /></article>
        </section>
      </main>
    );
  }

  return (
    <main className={`game-shell ${embeddedMode ? "embedded-game" : ""}`}>
      {mallOpen && mallFloor === 1 && <button className="mall-pet-food-kiosk" onClick={buyPetFood}><i /><span><b>宠物补给柜</b><small>平价宠物粮 · 25 金币 / 10份</small></span></button>}
      {petHospitalOpen && <div className="pet-hospital-overlay" role="dialog" aria-modal="true" aria-label="远方新区宠物医院"><section className="pet-hospital-panel"><header><div><span>远方新区动物健康中心</span><h2>青禾宠物医院</h2></div><div className="pet-wallet">● {game.coins.toLocaleString()}</div><button onClick={() => setPetHospitalOpen(false)}>×</button></header><div className="pet-hospital-room"><aside><button className="pet-vet"><i /><b /></button><strong>宠物医生苏苏</strong><small>检查 · 配药 · 恢复健康</small><span className="vet-counter" /></aside><div className="pet-patient-list">{game.pets.length === 0 ? <p>小禾还没有领养宠物，可以先去旁边的宠物之家看看。</p> : game.pets.map((pet) => { const sick = game.sickPetIds.includes(pet.id); const petName = PET_CATALOG.find((entry) => entry.id === pet.type)?.name; return <article key={`patient-${pet.id}`} className={sick ? "sick-patient" : ""}><div className={`pet-patient-art pet-${pet.type} ${sick ? "sick-pet" : ""}`}><i /><b /></div><span><strong>{petName} · {pet.sex}</strong><small>{sick ? "颜色发灰 · 眼睛下垂 · 很不舒服" : "精神很好 · 不需要治疗"}</small></span><button disabled={!sick} onClick={() => treatPetAtHospital(pet.id)}>{sick ? "检查配药 · 35金币" : "健康"}</button></article>; })}</div></div><footer><span>{message}</span><button onClick={() => setPetHospitalOpen(false)}>离开宠物医院</button></footer></section></div>}
      <header className="topbar">
        <div className="brand-lockup">
          <button className="brand-mark" onClick={() => setBrandMenuOpen((open) => !open)} aria-label="打开青禾谷菜单" aria-expanded={brandMenuOpen}><i /><i /><i /></button>
          <div><strong>青禾谷</strong><span>GREENFIELD VALLEY</span></div>
          <div key={game.coins} className="coins top-coins coin-value-updated" aria-label={`现有 ${game.coins} 金币`}><span>●</span><b>{game.coins.toLocaleString()}</b></div>
          {brandMenuOpen && <div className="brand-menu"><span>青禾谷村庄菜单</span><strong>想做什么？</strong><button onClick={() => { setMapOpen(true); setBrandMenuOpen(false); }}><i className="mini-map-icon" /><b>打开小地图</b><small>查看场景和建筑</small></button><button className="brand-craft-entry" onClick={() => { setCraftingOpen(true); setBrandMenuOpen(false); setMessage("打开制作手册，选择想做的东西。"); }}><i className="mini-craft-icon">⚒</i><b>打开制作</b><small>使用木头和石材做东西</small></button></div>}
        </div>
        <div className="day-card">
          <span className={`season-dot season-dot-${game.season}`}>{SEASON_SHORT[game.season]}</span>
          <div><strong>第 {game.year} 年 · {SEASONS[game.season]}第 {game.day} 天 · {WEEKDAYS[(game.day - 1) % 7]}</strong><span>{calendarMonth}月{game.day}日 · {String(clockHour).padStart(2, "0")}:{String(clockMinute).padStart(2, "0")}</span></div>
        </div>
        <div className="top-stats">
          <div className={`weather weather-${game.weather} ${isNight ? "night-weather" : ""}`}><span className={isNight && game.weather === "sunny" ? "moon-icon" : `weather-icon weather-icon-${game.weather}`} />{isNight && game.weather === "sunny" ? "月夜" : isNight ? `${weatherInfo.name}夜` : weatherInfo.name} <small>{isNight ? `${Number.parseInt(weatherInfo.temperature) - 3}°C` : weatherInfo.temperature}</small></div>
          <button className="multiplayer-button" onClick={() => setSplitScreen(true)}>双人模式</button>
          <button className="cloud-transfer-button" onClick={transferSaveToWeb} disabled={transferringSave}>{transferringSave ? "转移中…" : "转移到网页版"}</button>
          <button className="round-button home-button" onClick={returnToFarm} aria-label="回到农场" title="回到农场">⌂</button>
          <button className="round-button" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "关闭音效" : "打开音效"}>{soundOn ? "♪" : "×"}</button>
          <button className="round-button" onClick={resetGame} aria-label="重新开始">↻</button>
        </div>
      </header>

      {shippingReport && <div className="shipping-report-toast" role="dialog" aria-modal="true" aria-label="昨晚出货收入"><span>清晨出货通知</span><strong>昨晚卖出 {shippingReport.itemCount} 件东西</strong><b>+ {shippingReport.earnings.toLocaleString()} 金币</b><button onClick={() => setShippingReport(null)}>知道了</button></div>}

      {mapOpen && <div className="map-overlay" role="presentation">
        <section className="village-map-panel" role="dialog" aria-modal="true" aria-labelledby="village-map-title">
          <header><div><span>按照游戏实际道路绘制</span><h2 id="village-map-title">青禾谷实际地图</h2></div><button onClick={() => setMapOpen(false)} aria-label="关闭地图">×</button></header>
          <div className="village-map-canvas">
            <i className="map-river" /><i className="actual-route route-wild-farm" /><i className="actual-route route-farm-town" /><i className="actual-route route-town-east" /><i className="actual-route route-east-maple" /><i className="actual-route route-town-culture" /><i className="actual-route route-culture-north" /><i className="actual-route route-culture-residential" /><i className="actual-route route-town-south" /><i className="map-tree-cluster tree-cluster-one" /><i className="map-tree-cluster tree-cluster-two" />
            <button className={`map-place map-farm ${activeVillage === "qinghe" && scene === "farm" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("farm", { x: 8, y: 5 }, "青禾农场"); }}><i className="map-scene-picture picture-farm"><em /><em /><em /></i><b>青禾农场</b><span>农舍 · 农田 · 鱼塘</span></button>
            <button className={`map-place map-wild-farm ${activeVillage === "qinghe" && scene === "westFriendFarm" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("westFriendFarm", { x: 8, y: 5 }, "安安的小农场"); }}><i className="map-scene-picture picture-wild-farm"><em /><em /><em /></i><b>安安的小农场</b><span>青禾农场左边 · 野外朋友</span></button>
            <button className={`map-place map-town ${activeVillage === "qinghe" && scene === "town" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("town", { x: 5, y: 5 }, "中心街"); }}><i className="map-scene-picture picture-town"><em /><em /><em /></i><b>中心街</b><span>商店和居民建筑</span></button>
            <button className={`map-place map-culture ${activeVillage === "qinghe" && scene === "cultureDistrict" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("cultureDistrict", { x: 6, y: 7 }, "清河文化街"); }}><i className="map-scene-picture picture-culture"><em /><em /><em /></i><b>清河文化街</b><span>镇公所 · 学校 · 博物馆</span></button>
            <button className={`map-place map-east ${activeVillage === "qinghe" && scene === "eastNeighbor" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("eastNeighbor", { x: 3, y: 5 }, "林婶的果园小屋"); }}><i className="map-scene-picture picture-orchard"><em /><em /><em /></i><b>东郊果园</b><span>林婶家</span></button>
            <button className={`map-place map-maple ${activeVillage === "maple" ? "you-are-here" : ""}`} onClick={() => { switchVillage("maple"); travelFromMap("farm", { x: 1, y: 5 }, "枫叶村"); }}><i className="map-scene-picture picture-maple"><em /><em /><em /></i><b>枫叶村</b><span>从东郊继续向右</span></button>
            <button className={`map-place map-south ${activeVillage === "qinghe" && scene === "southNeighbor" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("southNeighbor", { x: 6, y: 3 }, "鲁师傅的院子"); }}><i className="map-scene-picture picture-workshop"><em /><em /><em /></i><b>南坡院子</b><span>鲁师傅家</span></button>
            <button className={`map-place map-north ${activeVillage === "qinghe" && scene === "northNeighbor" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("northNeighbor", { x: 6, y: 5 }, "叶老师的书屋"); }}><i className="map-scene-picture picture-library"><em /><em /><em /></i><b>北林书屋</b><span>叶老师家</span></button>
            <button className={`map-place map-residential ${activeVillage === "qinghe" && scene === "residentialDistrict" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("residentialDistrict", { x: 2, y: 5 }, "青禾住宅坡"); }}><i className="map-scene-picture picture-residential"><em /><em /><em /></i><b>青禾住宅坡</b><span>白医生 · 阿麦 · 周镇长 · 沈馆长 · 助手 · 许老师</span></button>
            <div className="map-legend"><span><i />你现在的位置</span><small>点击地图上的场景图可以直接前往</small></div>
          </div>
          <footer><span>青禾农场一直向左到安安的小农场；中心街向上到文化街，文化街向上去北林。</span><button onClick={() => setMapOpen(false)}>收起地图</button></footer>
        </section>
      </div>}

      {drivingSchoolOpen && <div className="driving-school-overlay" role="dialog" aria-modal="true" aria-label="青禾驾驶学校"><section className="driving-school-panel"><header><div><span>青禾谷安全驾驶中心</span><h2>青禾驾驶学校</h2></div><button onClick={() => setDrivingSchoolOpen(false)} aria-label="离开驾校">×</button></header>{game.driverLicense ? <div className="license-earned"><i>驾</i><strong>青禾谷驾驶证</strong><span>持证人：{displayName}</span><p>理论考试和驾驶练习都已通过。秋天道路通车后，就可以买车出发了。</p><button onClick={() => { setGame((current) => ({ ...current, driverLicense: false })); setDrivingQuizStep(0); setDrivingPracticeStep(0); setMessage("开始重新练习驾照考试。 "); }}>重新练习考试</button></div> : drivingQuizStep < DRIVING_QUESTIONS.length ? <div className="driving-theory"><span>理论考试 · 第 {drivingQuizStep + 1}/{DRIVING_QUESTIONS.length} 题</span><strong>{DRIVING_QUESTIONS[drivingQuizStep].question}</strong><div>{DRIVING_QUESTIONS[drivingQuizStep].answers.map((answer, index) => <button key={answer} onClick={() => answerDrivingQuestion(index)}>{answer}</button>)}</div><small>答错会从第一题重新开始，认真想一想。</small></div> : <div className="driving-practice"><span>驾驶练习 · 小汽车绕桩</span><div className={`practice-road practice-step-${drivingPracticeStep}`}><i className="practice-car" /><b /><b /><b /></div><strong>{drivingPracticeStep === 0 ? "第一步：向左转" : drivingPracticeStep === 1 ? "第二步：向右绕桩" : drivingPracticeStep === 2 ? "第三步：停进停车框" : "练习完成"}</strong><div><button onClick={() => doDrivingPractice(0)}>← 左转</button><button onClick={() => doDrivingPractice(1)}>右转 →</button><button onClick={() => doDrivingPractice(2)}>▣ 停车</button></div></div>}<footer><span>{game.driverLicense ? "已经取得驾照" : "先通过理论，再完成驾驶练习"}</span><button onClick={() => setDrivingSchoolOpen(false)}>离开驾校</button></footer></section></div>}

      {mallOpen && <div className="mall-overlay" role="dialog" aria-modal="true" aria-label="青禾大商场"><section className="mall-panel three-floor-mall"><header><div><span>远方新区购物中心 · {mallFloor} 楼</span><h2>青禾大商场</h2></div><div className="mall-wallet">● {game.coins.toLocaleString()}</div><button onClick={() => setMallOpen(false)} aria-label="离开商场">×</button></header><div className="mall-building-interior"><aside className="mall-elevator" aria-label="商场电梯"><strong>电梯</strong>{([1, 2, 3] as const).map((floor) => <button key={floor} className={mallFloor === floor ? "active" : ""} onClick={() => { setMallFloor(floor); setMessage(`电梯到达 ${floor} 楼，门打开了。`); playTone(540 + floor * 60); }}>{floor}F</button>)}<i /><small>点击楼层</small></aside><div className={`mall-floor mall-floor-${mallFloor}`}><div className="mall-floor-sign"><b>{mallFloor}F</b><span>{mallFloor === 1 ? "美食与生鲜" : mallFloor === 2 ? "服装与旅行用品" : "家居、园艺与户外"}</span></div><div className="mall-aisles">{mallFloor === 1 ? <><article><h3>麦香烘焙店</h3><button onClick={() => buyMallItem("奶油蛋糕", 80, 30)}><i className="mall-cake" /><span><b>奶油蛋糕</b><small>80 金币 · 体力 +30</small></span></button><button onClick={() => buyMallItem("热牛角包", 38, 12)}><i className="mall-cake bread" /><span><b>热牛角包</b><small>38 金币 · 体力 +12</small></span></button></article><article><h3>田园生鲜店</h3><button onClick={() => buyMallItem("水果便当", 55, 20)}><i className="mall-lunch" /><span><b>水果便当</b><small>55 金币 · 体力 +20</small></span></button><button onClick={() => buyMallItem("暖汤套餐", 68, 25)}><i className="mall-lunch soup" /><span><b>暖汤套餐</b><small>68 金币 · 体力 +25</small></span></button></article><article><h3>山谷咖啡角</h3><button onClick={() => buyMallItem("热拿铁", 35, 10)}><i className="mall-coffee" /><span><b>热拿铁</b><small>35 金币 · 体力 +10</small></span></button></article></> : mallFloor === 2 ? <><article><h3>四季衣橱</h3><button onClick={() => buyMallItem("红色节日外套", 260, 0, "redCoat")}><i className="mall-coat red-coat" /><span><b>红色节日外套</b><small>260 金币 · 可穿着</small></span></button><button onClick={() => buyMallItem("蓝色旅行套装", 320, 0, "blueOutfit")}><i className="mall-coat blue-coat" /><span><b>蓝色旅行套装</b><small>320 金币 · 可穿着</small></span></button></article><article><h3>雨天旅行铺</h3><button onClick={() => buyMallItem("彩色雨伞", 120, 0, "umbrella")}><i className="mall-umbrella" /><span><b>彩色雨伞</b><small>120 金币 · 撑伞不会淋病</small></span></button></article><article><h3>配饰小店</h3><button onClick={() => buyMallItem("柔软围巾", 75, 8)}><i className="mall-scarf" /><span><b>柔软围巾</b><small>75 金币 · 休息体力 +8</small></span></button></article></> : <><article><h3>阳台园艺店</h3><button onClick={() => buyMallItem("家庭种子礼盒", 180, 0, "seedBox")}><i className="mall-seed-box" /><span><b>家庭种子礼盒</b><small>180 金币 · 可打开</small></span></button></article><article><h3>温暖家居店</h3><button onClick={() => buyMallItem("柔软靠垫", 90, 15)}><i className="mall-cushion" /><span><b>柔软靠垫</b><small>90 金币 · 体力 +15</small></span></button></article><article><h3>山野户外店</h3><button onClick={() => buyMallItem("登山补给包", 70, 25)}><i className="mall-hiking" /><span><b>登山补给包</b><small>70 金币 · 体力 +25</small></span></button></article></>}</div></div></div><footer><span>乘电梯可以到三层不同商店，衣服、雨伞和礼盒会进入背包。</span><button onClick={() => setMallOpen(false)}>走出商场</button></footer></section></div>}

      {petShopOpen && <div className="pet-shop-overlay" role="dialog" aria-modal="true" aria-label="青禾宠物店"><section className="pet-shop-panel"><header><div><span>清河文化街</span><h2>青禾宠物之家</h2></div><div className="pet-wallet">● {game.coins.toLocaleString()}</div><button onClick={() => setPetShopOpen(false)} aria-label="离开宠物店">×</button></header><div className="pet-shop-scene"><aside className="pet-counter"><button style={personClothesStyle("小桃")} className="pet-clerk" onClick={() => setMessage("店员小桃：慢慢看吧，点击玻璃房里的宠物，就能了解它的性格和照料方法。 ")}><i /><b /></button><strong>店员小桃</strong><small>领养咨询 · 日常照料</small><span className="counter-desk"><i /></span></aside><div className="pet-glass-room" aria-label="宠物们会在玻璃活动区跑动和嬉戏">{PET_CATALOG.map((pet, index) => <button key={pet.id} className={`shop-pet pet-${pet.id} pet-motion-${index + 1} ${selectedPet === pet.id ? "selected" : ""}`} onClick={() => { setSelectedPet(pet.id); setMessage(`正在查看${pet.name}的信息。`); }} aria-label={`查看${pet.name}信息`}><i /><b /><span>{pet.name}</span></button>)}<i className="glass-shine" /><span className="pet-toy toy-ball" /><span className="pet-toy toy-tunnel" /></div></div>{(() => { const pet = PET_CATALOG.find((entry) => entry.id === selectedPet)!; const ownedMale = game.pets.filter((owned) => owned.type === pet.id && owned.sex === "男生").length; const ownedFemale = game.pets.filter((owned) => owned.type === pet.id && owned.sex === "女生").length; return <div className="pet-information"><div className={`pet-profile-art pet-${pet.id}`}><i /><b /></div><div><span>宠物资料</span><h3>{pet.name}</h3><p><b>性格：</b>{pet.personality}</p><p><b>每天吃：</b>{pet.food}　<b>每天喝：</b>{pet.water}</p><small>家里已有：男生 {ownedMale} 只 · 女生 {ownedFemale} 只。同种一男一女生活满五年，会生一只宝宝。</small></div><div className="pet-adopt-controls"><span>选择性别</span><div><button className={selectedPetSex === "男生" ? "active" : ""} onClick={() => setSelectedPetSex("男生")}>男生</button><button className={selectedPetSex === "女生" ? "active" : ""} onClick={() => setSelectedPetSex("女生")}>女生</button></div><button onClick={buyPet}>领养 · ● {pet.price}</button></div></div>; })()}<footer><span>{message}</span><button onClick={() => setPetShopOpen(false)}>离开宠物店</button></footer></section></div>}

      {carTraveling && <div className={`car-travel-overlay ${carStopped ? "car-stopped" : "car-moving"}`} role="dialog" aria-modal="true" aria-label="自己驾驶汽车"><div className="travel-sky"><i /><i /></div><div className={`travel-road route-step-${carRouteStep} turn-${carRouteTarget === "district" ? carRouteStep === 2 ? "right" : "left" : carRouteStep === 2 ? "left" : "right"}`}><div className="road-landscape"><i /><i /><i /><i /></div><span className={`travel-car car-heading-${carHeading}`}><i /><i /></span><div className="road-intersection" /><div className="road-branch" />{carRouteStep === 1 && <div className={`traffic-light traffic-${trafficLight}`} aria-label={`${trafficLight === "red" ? "红" : "绿"}灯`}><i /><b /><em /><span /></div>}<div className="road-stop-line" /></div><strong>{carStopped ? "车辆已经刹停" : "车辆正在自动前进"} · 路程 {Math.min(carRouteStep, 5)}/5</strong><small className="driving-dashboard">观察红绿灯和道路真实弯向，不再显示“下一步动作”。</small><div className="car-driving-controls"><button onClick={() => driveCar("left")}>↶<span>左转</span></button><button className="brake-control" onClick={() => driveCar("brake")}>■<span>刹车</span></button><button className="forward-control" onClick={() => driveCar("forward")}>↑<span>前进</span></button><button onClick={() => driveCar("right")}>↷<span>右转</span></button><button className="uturn-control" onClick={() => driveCar("uturn")}>↩<span>掉头返回</span></button></div></div>}

      {bedtimePhase === "walkingHome" && <div className="bedtime-journey" role="status" aria-label="小禾自动回家睡觉"><div className="bedtime-sky"><i /></div><div className="bedtime-path"><span className="bedtime-walker"><PlayerSprite facing="right" sick={game.sick} /></span><i className="bedtime-house" /></div><strong>小禾正在自己走回农舍…</strong></div>}

      {bulkChestPrompt && (
        <div className="bulk-chest-prompt" role="dialog" aria-modal="true" aria-label={`是否把所有${RESOURCE_INFO[bulkChestPrompt].name}放进收纳箱`}>
          <span>已经连续放入 5 个</span>
          <strong>是否把所有{RESOURCE_INFO[bulkChestPrompt].name}都放到收纳箱里面去？</strong>
          <small>背包里还剩 {game.inventory[bulkChestPrompt]} 个{RESOURCE_INFO[bulkChestPrompt].name}</small>
          <div><button onClick={storeAllPromptedResource}>把所有{RESOURCE_INFO[bulkChestPrompt].name}放入</button><button onClick={() => { setBulkChestPrompt(null); setChestDepositStreak(null); setMessage(`暂时保留剩下的${RESOURCE_INFO[bulkChestPrompt].name}。`); }}>暂时不要</button></div>
        </div>
      )}

      <section className="game-layout">
        <aside className="side-panel">
          <div className="portrait-card">
            <div className="portrait"><img src={game.sick ? "/xiaohe-sick-sprite.png" : "/xiaohe-sprite.png"} alt="小禾" draggable={false} /></div>
            <div><span>新手农夫</span><strong>{displayName}</strong></div>
          </div>
          {multiplayerSession && <div className="multiplayer-status-card"><div><span>双人村庄</span><button onClick={() => setMultiplayerOpen(true)}>查看</button></div><strong>{activeVillageInfo.name} · {multiplayerSession.roomCode}</strong><small>{partner ? `${partner.online ? "● 在线" : "○ 离线"} ${partner.playerName}住在${VILLAGE_INFO[partner.village].name}` : "等待另一位玩家加入"}</small></div>}
          {isBirthday && <button className="birthday-card" onClick={() => { setScene("farm"); setActiveBuilding("farmhouse"); setIndoorPlayer({ x: 34, y: 70 }); setMessage(`今天是${displayName}的生日！大家已经来到农舍，点击生日蛋糕可以一起分享。`); }}><span>二月十九日 · 今日活动</span><strong>{displayName}的生日派对</strong><small>大家都在农舍 · 点击回家庆祝</small></button>}
          <button className={`festival-card ${currentFestival ? "festival-open" : ""}`} onClick={() => { if (currentFestival) goToFestival(); else setMessage(`下一场是${nextFestival.name}，${SEASONS[nextFestival.season]}第 ${nextFestival.day} 天${WEEKDAYS[(nextFestival.day - 1) % 7]}在${nextFestival.place}举行，还有 ${daysUntilFestival} 天。`); }}><span>{currentFestival ? "今日活动" : "下一场活动"}</span><strong>{(currentFestival ?? nextFestival).name}</strong><small>{currentFestival ? `正在${currentFestival.place}举行 · 点击前往` : `${SEASONS[nextFestival.season]}第 ${nextFestival.day} 天${WEEKDAYS[(nextFestival.day - 1) % 7]} · 还有 ${daysUntilFestival} 天`}</small></button>
          <div className="meter-block">
            <div className="meter-label"><span>体力</span><b>{game.energy}/100</b></div>
            <div className="meter"><i style={{ width: `${game.energy}%` }} /></div>
          </div>
          <button className="sleep-button sleep-under-energy" onClick={endDayFromAnywhere} disabled={Boolean(bedtimePhase)}><span>☾</span><div><strong>结束今天</strong><small>自动走回家上床</small></div><b>›</b></button>
          <div className="harvest-log">
            <div className="section-title"><span>资源记录</span><button className="auto-sell-button" onClick={sellBackpack}>自动售卖</button></div>
            <div className="seed-record">
              <div><strong>种子袋</strong><small>领取后会显示在这里 · 点击选择播种</small></div>
              <div className="seed-record-list">
                {CROP_TYPES.filter((crop) => game[CROP_INFO[crop].seedField] > 0).map((crop) => <button key={crop} className={heldItem?.kind === "seed" && heldItem.id === crop ? "selected" : selected === "seed" && selectedCrop === crop ? "selected" : ""} onClick={() => { setSelected("seed"); setSelectedCrop(crop); setSelectedResource(null); setMessage(`拿出${CROP_INFO[crop].name}种子，现在有 ${game[CROP_INFO[crop].seedField]} 颗，可以去松好的土地播种；双击可以举到头顶送人。`); playTone(560); }} onDoubleClick={() => pickUpSeed(crop)} title="双击拿起种子包送给居民"><span className={`${crop}-icon`}>{CROP_INFO[crop].short}</span><strong>{game[CROP_INFO[crop].seedField]}</strong><small>{CROP_INFO[crop].name}种子</small></button>)}
              </div>
            </div>
            <div className="harvest-subtitle">已经收获的水果、蔬菜和鱼</div>
            <div className="harvest-items">
              {(Object.keys(RESOURCE_INFO) as StorableResource[]).map((resource) => <button key={resource} className={heldItem?.kind === "resource" && heldItem.id === resource ? "resource-item held-material" : selectedResource === resource ? "resource-item selected" : "resource-item"} onClick={() => clickResource(resource)} onDoubleClick={() => pickUpResource(resource)} onPointerDown={() => startEating(resource)} onPointerUp={stopEating} onPointerCancel={stopEating} onPointerLeave={stopEating} onContextMenu={(event) => event.preventDefault()} aria-pressed={selectedResource === resource} aria-label={`${RESOURCE_INFO[resource].name} ${game.inventory[resource]} 个，双击拿起送人，长按食用`} title="双击拿起送人，长按吃掉"><span className={`harvest-icon ${resource}-icon`}>{resource === "fish" ? "鱼" : CROP_INFO[resource].short}</span><p>{resource === "fish" ? "鱼获" : CROP_INFO[resource].name}<strong>{game.inventory[resource]}</strong><small>双击拿起</small></p></button>)}
              <button className={heldItem?.kind === "material" && heldItem.id === "wood" ? "resource-item held-material" : "resource-item"} onDoubleClick={() => pickUpMaterial("wood")} title="双击拿起木头"><span className="harvest-icon wood-icon">木</span><p>木头<strong>{game.wood}</strong><small>双击拿起</small></p></button>
              <button className={heldItem?.kind === "material" && heldItem.id === "stone" ? "resource-item held-material" : "resource-item"} onDoubleClick={() => pickUpMaterial("stone")} title="双击拿起石材"><span className="harvest-icon stone-icon">石</span><p>石材<strong>{game.stone}</strong><small>双击拿起</small></p></button>
              <button className={heldItem?.kind === "forest" && heldItem.id === "pineNut" ? "resource-item held-material" : "resource-item"} onClick={clickPineNut} onDoubleClick={doubleClickPineNut} title="单击吃掉恢复体力，双击拿起"><span className="harvest-icon pine-nut-icon">子</span><p>松子<strong>{game.pineNuts}</strong><small>单击吃 · 双击拿</small></p></button>
              <button className={heldItem?.kind === "herb" ? "resource-item herb-record held-material" : "resource-item herb-record"} onClick={clickHerb} onDoubleClick={pickUpHerb} aria-label={`药材 ${game.herbs} 份，生病时单击使用，双击拿起送人`} title="生病时单击使用，双击拿起送人"><span className="harvest-icon herb-icon">药</span><p>药材<strong>{game.herbs}</strong><small>{game.sick ? "单击用 · 双击拿" : "双击拿起"}</small></p></button>
              <button className={heldItem?.kind === "resin" ? "resource-item resin-record held-material" : "resource-item resin-record"} onDoubleClick={pickUpResin} title="双击拿起绿色树脂"><span className="harvest-icon resin-icon" /><p>树脂<strong>{game.resin}</strong><small>双击拿起 · 做火柴</small></p></button>
              <button className={heldItem?.kind === "product" && heldItem.id === "egg" ? "resource-item animal-product-item held-material" : "resource-item animal-product-item"} onClick={() => setMessage(`农场鸡蛋共有 ${game.eggs} 枚。每只鸡每天产 1 枚，双击可以拿起来。`)} onDoubleClick={() => pickUpAnimalProduct("egg")} title="双击拿起鸡蛋"><span className="harvest-icon egg-icon" /><p>鸡蛋<strong>{game.eggs}</strong><small>双击拿起</small></p></button>
              <button className={heldItem?.kind === "product" && heldItem.id === "milk" ? "resource-item animal-product-item held-material" : "resource-item animal-product-item"} onClick={() => setMessage(`新鲜牛奶共有 ${game.milk} 瓶。每头奶牛每天产 1 瓶，双击可以拿起来。`)} onDoubleClick={() => pickUpAnimalProduct("milk")} title="双击拿起牛奶"><span className="harvest-icon milk-icon" /><p>牛奶<strong>{game.milk}</strong><small>双击拿起</small></p></button>
              <button className={heldItem?.kind === "product" && heldItem.id === "wool" ? "resource-item animal-product-item held-material" : "resource-item animal-product-item"} onClick={clickWool} onDoubleClick={doubleClickWool} title="单击打开制作手册，双击拿起羊毛"><span className="harvest-icon wool-icon" /><p>羊毛<strong>{game.wool}</strong><small>单击打开制作 · 双击拿起</small></p></button>
              <button className={heldItem?.kind === "petGift" && heldItem.id === "feather" ? "resource-item animal-product-item held-material" : "resource-item animal-product-item"} onClick={() => setMessage(`小鸡和小鸭留下的羽毛共有 ${game.feathers} 根，双击可以拿起。`)} onDoubleClick={() => pickUpPetGift("feather")}><span className="harvest-icon feather-icon" /><p>羽毛<strong>{game.feathers}</strong><small>宠物每日可能赠送</small></p></button>
              <button className={heldItem?.kind === "petGift" && heldItem.id === "softFur" ? "resource-item animal-product-item held-material" : "resource-item animal-product-item"} onClick={() => setMessage(`兔子梳下的柔软绒毛共有 ${game.softFur} 团，双击可以拿起。`)} onDoubleClick={() => pickUpPetGift("softFur")}><span className="harvest-icon soft-fur-icon" /><p>兔子软毛<strong>{game.softFur}</strong><small>宠物每日可能赠送</small></p></button>
              <button className="resource-item animal-product-item" onClick={() => setMessage(`宠物粮还剩 ${game.petFood} 份。每只跟随宠物睡前自动吃 1 份，可以去远方新区大商场购买。`)}><span className="harvest-icon pet-food-icon" /><p>宠物粮<strong>{game.petFood}</strong><small>每晚自动喂食</small></p></button>
              <button className={heldItem?.kind === "petGift" && heldItem.id === "bone" ? "resource-item animal-product-item held-material" : "resource-item animal-product-item"} onClick={() => setMessage(`小鸡很久才会探险一次，已经带回 ${game.petBones} 块小骨头，双击可以拿起。`)} onDoubleClick={() => pickUpPetGift("bone")}><span className="harvest-icon pet-bone-icon" /><p>小骨头<strong>{game.petBones}</strong><small>稀有探险收获 · 双击拿起</small></p></button>
              <button className="resource-item anan-cookie-item" onClick={eatAnanCookie} title="点击食用，恢复 18 点体力"><span className="harvest-icon cookie-icon" /><p>安安的饼干<strong>{game.cookies}</strong><small>单击食用</small></p></button>
              <button className="resource-item beach-food-item" onClick={eatCrab} title="点击食用，恢复 20 点体力"><span className="harvest-icon crab-icon" /><p>海边螃蟹<strong>{game.crabs}</strong><small>单击食用</small></p></button>
              <button className="resource-item beach-food-item" onClick={eatShrimp} title="点击食用，恢复 12 点体力"><span className="harvest-icon shrimp-icon" /><p>海边小虾<strong>{game.shrimp}</strong><small>单击食用</small></p></button>
              {game.bookBag.map((bookId) => <button key={`bag-book-${bookId}`} className={heldItem?.kind === "book" && heldItem.id === bookId ? "resource-item held-material" : "resource-item"} onClick={() => setMessage(`${LOST_BOOKS[bookId].title}：${LOST_BOOKS[bookId].content}`)} onDoubleClick={() => carryLostBook(bookId)} title="点击阅读，双击拿起来送给叶老师"><span className="harvest-icon book-icon">书</span><p>{LOST_BOOKS[bookId].title}<strong>1</strong><small>双击拿起</small></p></button>)}
              {game.artifactBag.map((artifactId) => <button key={`bag-artifact-${artifactId}`} className={heldItem?.kind === "artifact" && heldItem.id === artifactId ? "resource-item held-material" : "resource-item"} onClick={() => setMessage(`${RARE_ARTIFACTS[artifactId].title}：${RARE_ARTIFACTS[artifactId].description}`)} onDoubleClick={() => carryArtifact(artifactId)} title="点击查看，双击拿起来送到博物馆"><span className={`harvest-icon artifact-icon artifact-icon-${artifactId + 1}`}>{RARE_ARTIFACTS[artifactId].short}</span><p>{RARE_ARTIFACTS[artifactId].title}<strong>1</strong><small>双击拿起</small></p></button>)}
            </div>
            {Object.values(game.mallItems).some((count) => count > 0) && <div className="mall-item-backpack"><div><strong>衣服与雨伞</strong><small>雨伞放在这里 · 点击即可撑开或收起</small></div><section>{game.mallItems.umbrella > 0 && <button className={`umbrella-bag-button ${game.umbrellaOpen ? "wearing" : ""}`} onClick={toggleUmbrella}><i className="bag-umbrella" /><span>彩色雨伞<b>{game.mallItems.umbrella}</b><small>{game.umbrellaOpen ? "正在撑着 · 点击收起" : "点击撑开雨伞"}</small></span></button>}{game.mallItems.redCoat > 0 && <button className={game.equippedOutfit === "redCoat" ? "wearing" : ""} onClick={() => wearMallOutfit("redCoat")}><i className="bag-coat red" /><span>红色外套<b>{game.mallItems.redCoat}</b><small>{game.equippedOutfit === "redCoat" ? "正在穿 · 点击脱下" : "点击穿着"}</small></span></button>}{game.mallItems.blueOutfit > 0 && <button className={game.equippedOutfit === "blueOutfit" ? "wearing" : ""} onClick={() => wearMallOutfit("blueOutfit")}><i className="bag-coat blue" /><span>蓝色旅行装<b>{game.mallItems.blueOutfit}</b><small>{game.equippedOutfit === "blueOutfit" ? "正在穿 · 点击脱下" : "点击穿着"}</small></span></button>}{game.mallItems.seedBox > 0 && <button onClick={openMallSeedBox}><i className="bag-seed-box" /><span>种子礼盒<b>{game.mallItems.seedBox}</b><small>点击打开</small></span></button>}</section></div>}
          </div>
          <div className="task-card">
            <div className="section-title"><span>今日小目标</span><b>{game.daily.rewardClaimed ? "已奖 100" : `${completed}/3`}</b></div>
            <div className="task-list">
              {tasks.map((task) => (
                <div className={task.done ? "task done" : "task"} key={task.label}>
                  <span>{task.done ? "✓" : ""}</span><p>{task.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="tip-card"><span>?</span><p><strong>{scene === "farm" ? "农场小贴士" : scene === "cultureDistrict" ? "文化街指南" : scene === "residentialDistrict" ? "住宅坡指南" : "小镇指南"}</strong>{scene === "farm" ? "钓鱼要等待问号，再完成提竿小游戏。幸运鱼竿会更快咬钩。" : scene === "cultureDistrict" ? "镇公所在左边，博物馆在右边；向右去住宅坡，向上去北林。" : scene === "residentialDistrict" ? "这里每块院地都属于一位居民，点击房门就能进去拜访。" : "中心街向上先到文化街，北林书屋在文化街后面。"}</p></div>
        </aside>

        <section className="world-card" aria-label={`${sceneLabel}游戏区域`}>
          <div className={`world ${scene === "farm" ? "farm-world" : scene === "westFriendFarm" ? "friend-farm-world" : scene === "mysteryRoad" ? "mystery-road-world" : scene === "town" ? "town-world" : scene === "cultureDistrict" ? "culture-world" : scene === "residentialDistrict" ? "residential-world" : "neighbor-world"} ${activeVillage}-village season-${game.season} weather-world-${game.weather} ${twilightLevel > 0 ? "twilight-world" : ""} ${activeBuilding || neighborInterior || residentHome || friendHomeOpen || mallOpen ? "interior-open" : ""} ${playingWithAnan ? "playing-with-anan" : ""}`} style={{ "--twilight": twilightLevel } as CSSProperties} onClick={walkToPointer}>
            <div className="location-chip"><span>{scene === "farm" ? "⌂" : scene === "westFriendFarm" ? "♣" : scene === "mysteryRoad" ? "▤" : scene === "cultureDistrict" ? "▣" : scene === "residentialDistrict" ? "屋" : "◆"}</span>{sceneLabel}</div>
            <div className="cloud cloud-one" /><div className="cloud cloud-two" />
            <div className="mountain mountain-one" /><div className="mountain mountain-two" />
            {(game.weather === "rain" || game.weather === "thunder") && <div className="rain-weather-layer" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>}
            {game.weather === "thunder" && <div className="lightning-weather-layer" aria-hidden="true"><i /></div>}
            {twilightLevel > 0 && <div className="night-sky" aria-hidden="true"><span className="moon" /><i /><i /><i /><i /><i /><i /></div>}
            {twilightLevel > 0 && <div className="twilight-layer" aria-hidden="true" />}
            {scene !== "farm" && <div className={`outdoor-lamps outdoor-lamps-${scene}`} aria-hidden="true"><i /><i /><i /><i /></div>}
            {selectedCraftItem && scene === "farm" && <div className="placement-controls" onClick={(event) => event.stopPropagation()}><strong>正在摆放：{CRAFT_RECIPES[selectedCraftItem].name}</strong>{(selectedCraftItem === "sign" || selectedCraftItem === "bench") && <div><button className={craftRotation === 0 ? "selected" : ""} onClick={() => setCraftRotation(0)}>横着</button><button className={craftRotation === 90 ? "selected" : ""} onClick={() => setCraftRotation(90)}>竖着</button><button className={craftRotation === 45 ? "selected" : ""} onClick={() => setCraftRotation(45)}>斜着</button></div>}<span>{selectedCraftItem === "fence" ? "点击农田四周的绿色位置，围栏会自动对齐" : "选好方向后，点击农场空地"}</span><button className="cancel-placement" onClick={() => setSelectedCraftItem(null)}>取消</button></div>}

            {scene === "farm" ? (
              <div className="farm-camera-layer" style={{ "--farm-camera-x": `${(6 - player.x) * 2.7}%`, "--farm-camera-y": `${(4 - player.y) * 1.8}%` } as CSSProperties}>
                <div className="farm-southwest-extension" aria-hidden="true"><i /><i /><i /><b /></div>
                <div className="outdoor-lamps outdoor-lamps-farm farm-fixed-lamps" aria-hidden="true"><i /><i /><i /><i /></div>
                <div className="path path-one" /><div className="path path-two" />
                <button className={`pond ${isFishing ? "fishing" : ""} ${currentFestival?.id === "fishing" ? "fishing-festival-pond" : ""}`} onClick={castLine} aria-label="在钓鱼池钓鱼">
                  <i /><i /><i /><b className="fishing-float" />{fishingPhase === "bite" && <strong className="bite-question">?</strong>}<span className="pond-label">{fishingPhase === "waiting" ? "等待鱼儿咬钩…" : fishingPhase === "bite" ? "快点！点击问号" : currentFestival?.id === "fishing" ? "钓鱼节会场 · 鱼获 +2" : "钓鱼池"}</span>
                </button>
                {fishingPhase === "reeling" && <div className="fishing-challenge" onClick={(event) => event.stopPropagation()}><header><span>提竿小游戏</span><b>{fishingScore}/3</b></header><p>等红色游标进入绿色区域时，点击提竿！</p><div className="fishing-timing-bar"><i className={game.toolUpgrades.rod ? "lucky-zone" : ""} /><b style={{ left: `${fishingMarker}%` }} /></div><button onClick={attemptReel}>提竿！</button><small>{game.toolUpgrades.rod ? "幸运鱼竿：咬钩更快，成功区域更宽" : "连续命中 3 次才能把鱼钓上来"}</small></div>}
                {currentFestival?.id === "fishing" && <div className="festival-crowd fishing-festival-crowd" aria-label="参加钓鱼节并不断挥竿钓鱼的居民">{FESTIVAL_GUESTS.map((name, index) => <button key={name} style={personClothesStyle(name)} className={`crowd-person crowd-${index + 1} fishing-villager fishing-villager-${index + 1} ${name === "安安" ? "anan-character" : ""} ${isNpcSick(name) ? "sick-npc" : ""}`} onClick={() => interactWithPerson(name, `${name}：我刚把一条鱼提起来收进口袋，现在重新抛竿比赛！`)}><i />{name === "安安" && <em className="anan-pigtails" />}<b /><em className="festival-fishing-rod" /><u className="festival-caught-fish" /><span>{name}<small>等待鱼儿咬钩</small></span></button>)}</div>}
                {isBirthday && <div className="birthday-farm-friends" aria-label="在生日当天跑到菜地和农场玩耍的朋友">{BIRTHDAY_GUESTS.slice(0, 6).map((name, index) => <button key={`farm-party-${name}`} style={personClothesStyle(name)} className={`birthday-field-friend field-friend-${index + 1} ${name === "安安" ? "anan-character" : ""}`} onClick={() => interactWithPerson(name, `${name}：我们从农舍跑到菜地边玩啦，一会儿再回去吃生日蛋糕！`)}><i />{name === "安安" && <em className="anan-pigtails" />}<b /><span>{name}</span></button>)}</div>}
                <button className={`house ${game.upgrades.house ? "expanded-house" : ""} house-level-${game.upgrades.house} ${isNight ? "night-house" : ""} ${isNight && stoveLit ? "fire-lit-house" : ""}`} onClick={() => { setActiveBuilding("farmhouse"); setMessage(`走进${displayName}的农舍，屋里暖洋洋的。`); }} aria-label={`进入${displayName}的农舍`}><span className="roof" /><span className={`chimney ${stoveLit ? "smoking" : ""}`}>{stoveLit && <><i /><i /><i /></>}</span><span className="wall" /><span className="door" /><span className="window" /><span className="sign">{displayName}的农舍{game.upgrades.house ? ` · 扩建 ${game.upgrades.house} 级` : ""} · 点击进入</span></button>
                <button className={`crafted-object crafted-chest home-storage-chest ${selectedResource ? "ready-to-store" : ""}`} onClick={() => { if (selected === "axe") { setMessage("这是农舍旁边固定的收纳木箱，不会被斧头拆掉。 "); return; } useChest(); }} aria-label={`农舍旁的木箱，内有 ${Object.values(game.chestStorage).reduce((sum, count) => sum + count, 0)} 件物品`}><i /><b>{Object.values(game.chestStorage).reduce((sum, count) => sum + count, 0)}</b></button>
                <button className="home-shipping-bin" onClick={() => { setShippingBinOpen(true); setMessage("打开大号出货箱。单击物品放进去，睡到第二天就会卖掉换成金币。 "); }} aria-label={`农舍旁的大号出货箱，已有 ${Object.values(game.shippingBin).reduce((sum, count) => sum + count, 0)} 件待售物品`}><i /><i /><b>{Object.values(game.shippingBin).reduce((sum, count) => sum + count, 0)}</b><span>大号出货箱</span></button>
                {game.rockStates.map((standing, index) => <button key={`rock-${index}`} className={`farm-rock rock-${index + 1} ${standing ? "" : "broken"}`} onClick={() => breakRock(index)} aria-label={standing ? `敲碎第 ${index + 1} 块石头` : `第 ${index + 1} 处碎石`} />)}
                {game.treeStates.map((standing, index) => (
                  <button key={index} className={`tree tree-${["a", "b", "c", "d"][index]} ${standing ? "" : "stump"}`} onClick={() => chopTree(index)} aria-label={standing ? `砍伐第 ${index + 1} 棵树` : `第 ${index + 1} 个树桩`} />
                ))}
                {game.plantedTrees.map((tree) => <button key={tree.id} className={`planted-pine-tree pine-stage-${tree.stage} ${tree.watered ? "watered" : ""}`} style={{ left: `${tree.x}%`, top: `${tree.y}%` }} onClick={() => chopPlantedTree(tree)} aria-label={tree.stage >= 3 ? "松果种出的成熟松树" : `正在生长的松树苗，第 ${tree.stage + 1} 阶段，${tree.watered ? "今天已经浇水" : "今天还没浇水"}`}><i /><i /><b /><span>{tree.stage >= 3 ? "大树" : tree.watered ? "已浇水" : "需要浇水"}</span></button>)}
                <div className="flowers flowers-a">✿ · ✿</div><div className="flowers flowers-b">· ✿ ·</div>
                {selectedCraftItem === "fence" && FENCE_PLACEMENT_SLOTS.map((slot) => { const occupied = game.placedCrafts.some((craft) => craft.type === "fence" && Math.abs(craft.x - slot.x) < 1 && Math.abs(craft.y - slot.y) < 1); return <button key={slot.id} className={`fence-placement-slot ${slot.rotation === 90 ? "slot-vertical" : "slot-horizontal"} ${occupied ? "occupied" : ""}`} style={{ left: `${slot.x}%`, top: `${slot.y}%` }} onClick={(event) => { event.stopPropagation(); placeFenceInSlot(slot); }} disabled={occupied} aria-label={occupied ? "这里已经放有围栏" : "点击在绿色位置放置木围栏"}><i /><span>{occupied ? "已放" : "+"}</span></button>; })}
                {game.placedCrafts.map((craft) => <button key={craft.id} className={`placed-craft placed-${craft.type} ${craft.type === "fence" && craft.rotation === 90 ? "fence-vertical" : ""} ${craft.type === "gate" && farmGateOpen ? "gate-open" : ""} ${craft.type === "lamp" && isNight ? "placed-lamp-lit" : ""}`} style={{ left: `${craft.x}%`, top: `${craft.y}%`, transform: `translate(-50%,-50%) rotate(${craft.rotation}deg)` }} onClick={(event) => { event.stopPropagation(); usePlacedCraft(craft); }} aria-label={`${CRAFT_RECIPES[craft.type].name}，${craft.type === "gate" ? (farmGateOpen ? "现在打开，点击关门" : "现在关闭，点击开门") : selected === "axe" ? "点击拆除" : "点击使用或查看"}`}><i /><i /><i /><b>{craft.type === "chest" ? Object.values(game.chestStorage).reduce((sum, count) => sum + count, 0) : ""}</b></button>)}
                {game.farmVisitor === "crow" && <div className="farm-visitor crow-visitor" aria-label="乌鸦飞进农田"><i /><i /><span>嘎！</span></div>}
                {game.farmVisitor === "animal" && <div className="farm-visitor animal-visitor" aria-label="小动物跑进农田"><i /><b /><span>偷吃幼苗</span></div>}
                {game.upgrades.stoneWall > 0 && <div className="farm-stone-wall" aria-label="鲁师傅修建的农场石墙"><i /><i /><i /><i /></div>}

                <button className={`farm-cave ${isNight ? "night-active" : ""}`} onClick={() => { setFarmInterior("cave"); setInteriorFireLit(false); setMessage("走进青禾山洞，里面很暗，可以使用火柴照明。 "); }} aria-label="进入青禾山洞"><i /><b /><em /><span>青禾山洞<small>点击进入探险</small></span></button>
                <button className={`farm-camp ${isNight ? "night-active" : ""}`} onClick={() => { setFarmInterior("camp"); setInteriorFireLit(false); setMessage("掀开门帘进入溪边帐篷，可以使用火柴点亮露营灯。 "); }} aria-label="进入溪边帐篷"><i /><i /><b /><em /><span>溪边露营地 · 点击进入</span></button>
                <button className="animal-ranch" onClick={() => { setRanchOpen(true); setMessage("来到青禾动物牧场，这里可以买鸡和奶牛，也能委托修建动物围栏。 "); }} aria-label="进入青禾动物牧场"><i className="ranch-roof" /><i className="ranch-wall" /><i className="ranch-door" /><b>青禾动物牧场</b><small>鸡 · 奶牛 · 围栏</small></button>
                {game.animalPen && <div className="animal-pen" aria-label={`动物围栏，${game.chickens}只鸡，${game.cows}头奶牛，${game.sheep}只绵羊`}><span className="pen-rail rail-top" /><span className="pen-rail rail-bottom" /><span className="pen-post post-one" /><span className="pen-post post-two" /><span className="pen-post post-three" /><span className="pen-post post-four" />{Array.from({ length: game.chickens }).map((_, index) => <button key={`chicken-${index}`} className={`farm-animal chicken chicken-${index + 1}`} onClick={() => collectAnimalProduct("chicken")} aria-label="小鸡，点击收鸡蛋"><i /><b /><em /></button>)}{Array.from({ length: game.cows }).map((_, index) => <button key={`cow-${index}`} className={`farm-animal cow cow-${index + 1}`} onClick={() => collectAnimalProduct("cow")} aria-label="奶牛，点击挤牛奶"><i /><b /><em /></button>)}{Array.from({ length: game.sheep }).map((_, index) => <button key={`sheep-${index}`} className={`farm-animal sheep sheep-${index + 1}`} onClick={() => collectAnimalProduct("sheep")} aria-label="绵羊，点击收羊毛"><i /><b /><em /></button>)}<strong>{game.chickens || game.cows || game.sheep ? `鸡 ${game.chickens} · 牛 ${game.cows} · 羊 ${game.sheep}` : "动物围栏已建好"}</strong><small>每天可收鸡蛋、牛奶和羊毛</small></div>}

                <div className={`field ${game.tiles.length > 32 ? "expanded-field" : ""}`} aria-label={`${game.tiles.length} 格农田`}>
                  {game.tiles.map((tile, index) => (
                    <button
                      key={index}
                      className={`farm-tile ${tile.state} ${tile.cropType ?? "radish"} ${tile.watered ? "watered" : ""}`}
                      onClick={(event) => actOnTile(index, event)}
                      aria-label={`农田 ${index + 1}，${tile.state === "grass" ? "未开垦" : tile.state === "soil" ? "已松土" : `作物第 ${tile.stage} 阶段`}`}
                    >
                      {tile.state === "crop" && <span className={`crop-stage stage-${tile.stage}`}><i /><i /><b /></span>}
                    </button>
                  ))}
                </div>

                <button className="edge-gate farm-exit" onClick={() => { setScene("town"); setPlayer({ x: 0, y: 5 }); setMessage(`欢迎来到${activeVillageInfo.name}！超市在左上方。`); }} aria-label={`前往${activeVillageInfo.name}`}>
                  <span>{activeVillageInfo.name}</span><b>→</b><small>继续向右走</small>
                </button>
                {activeVillage === "qinghe" && <button className="edge-gate wild-farm-crossing" onClick={() => { setScene("westFriendFarm"); setPlayer({ x: 11, y: 5 }); setMessage("沿着左边草路来到安安的小农场。 "); }}><b>←</b><span>安安的小农场</span><small>一直向左走</small></button>}
                {activeVillage === "maple" && <button className="edge-gate village-crossing crossing-left" onClick={() => { const friend = partner?.online && partner.currentVillage === "qinghe" ? partner : null; switchVillage("qinghe"); setScene(friend?.scene ?? "farm"); setPlayer(friend ? { x: Math.max(0, Math.min(11, friend.x + 1)), y: friend.y } : { x: 11, y: 5 }); setMessage(friend ? `到了青禾村，马上看见了${friend.playerName}！` : "沿着左边山路到了青禾村。 "); }}><b>←</b><span>前往青禾村</span><small>{partner?.online && partner.currentVillage === "qinghe" ? `去见${partner.playerName}` : "一直向左走"}</small></button>}
              </div>
            ) : scene === "westFriendFarm" ? (
              <>
                <div className="friend-farm-path" />
                <div className="friend-mini-field" aria-label="安安的十二格小农田">{Array.from({ length: 12 }).map((_, index) => <i key={`friend-plot-${index}`} className={index % 3 === 0 ? "friend-plot-grown" : ""} />)}</div>
                <div className="friend-wild-garden"><i /><i /><i /><b>野菜和香草</b></div>
                <div className="friend-water-barrel"><i /><b>雨水桶</b></div>
                <button className="friend-farm-shelter" onClick={(event) => { event.stopPropagation(); setFriendHomeOpen(true); setIndoorPlayer({ x: 34, y: 70 }); setMessage("走进安安的林边小屋，屋里摆着登山装备和野外收藏。 "); }} aria-label="进入安安的林边小屋"><i className="friend-shelter-roof" /><i className="friend-shelter-wall" /><i className="friend-shelter-door" /><strong>安安的林边小屋<small>点击进入拜访</small></strong></button>
                {wildFriendVisit || wildFriendAtPlayerHome ? <button className="friend-away-note" onClick={() => setMessage(wildFriendAtPlayerHome ? `安安今天去${displayName}的农舍找你了，回自己家就能见到她。` : `安安今天去了${wildFriendVisit === "cave" ? "青禾山洞" : "溪边帐篷"}。`)}>安安出去玩了<small>今天在{wildFriendAtPlayerHome ? `${displayName}的农舍` : wildFriendVisit === "cave" ? "山洞" : "帐篷"}</small></button> : <button style={personClothesStyle("安安")} className="wild-friend-npc anan-character" onClick={() => interactWithPerson("安安", PERSON_DIALOGUES["安安"])} aria-label={heldItem ? `把${carriedItemName}送给安安` : "和朋友安安聊天"}><i /><em className="anan-pigtails" /><b /><span>安安<small>{heldItem ? `送出${carriedItemName}` : "你的野外朋友"}</small></span></button>}
                <div className="friend-farm-trees"><i /><i /><i /></div>
                <div className={`seasonal-road road-season-${game.season}`} aria-label={game.season === 0 ? "春季道路规划区" : game.season === 1 ? "夏季道路施工区" : "已经通车的新公路"}><i className="road-surface" /><span>{game.season === 0 ? "道路规划中 · 夏季施工" : game.season === 1 ? "封路施工 · 秋季通车" : "远方新区公路 · 已通车"}</span>{game.season === 1 && <div className="road-workers"><b /><b /><b /><em /><em /></div>}</div>
                <button className="driving-school-building" onClick={(event) => { event.stopPropagation(); setDrivingSchoolOpen(true); setDrivingQuizStep(game.driverLicense ? DRIVING_QUESTIONS.length : 0); setDrivingPracticeStep(game.driverLicense ? 3 : 0); setMessage(game.driverLicense ? "来到青禾驾校复习安全驾驶。 " : "进入青禾驾校，先参加汽车常识考试。 "); }}><i /><b>青禾驾驶学校</b><small>{game.driverLicense ? "已取得驾照 · 可以复习" : "理论考试 · 驾驶练习"}</small></button>
                <button className={`road-car ${game.ownsCar ? "owned-car" : ""} ${game.season === 1 ? "road-closed" : ""}`} onClick={(event) => { event.stopPropagation(); buyOrDriveCar(); }}><i /><i /><b>{game.season === 0 ? "查看道路规划" : game.season === 1 ? "查看施工进度" : !game.driverLicense ? "先考驾照" : game.ownsCar ? "驾驶汽车去远方" : "购买汽车 · 3000金币"}</b></button>
                <button className="edge-gate friend-farm-return" onClick={() => { setScene("farm"); setPlayer({ x: 0, y: 5 }); setMessage("从安安的小农场回到青禾农场。 "); }}><span>返回青禾农场</span><b>→</b><small>一直向右走</small></button>
              </>
            ) : scene === "mysteryRoad" ? (
              <>
                <div className="new-district-road"><i /><i /><i /></div>
                <div className="new-district-sign"><strong>远方新区</strong><span>更多地方正在等待建设</span></div>
                <button className="district-pet-building district-pet-shop" onClick={(event) => { event.stopPropagation(); setPetShopOpen(true); setSelectedPet("cat"); setMessage("走进远方新区的宠物之家，玻璃活动区里的小动物正在跑动和嬉戏。 "); }}><i /><b /><strong>宠物之家</strong><small>领养猫狗与各种小宠物</small></button>
                <button className="district-pet-building district-pet-hospital" onClick={(event) => { event.stopPropagation(); setPetHospitalOpen(true); setMessage(game.sickPetIds.length ? "宠物医生正在等候，可以给不舒服的小宠物检查和配药。 " : "走进宠物医院，目前跟随的小宠物都很健康。 "); }}><i /><b /><strong>宠物医院</strong><small>检查 · 治疗 · 配药</small></button>
                <button className="grand-mall-building" onClick={(event) => { event.stopPropagation(); setMallFloor(1); setMallOpen(true); setMessage("走进三层青禾大商场，一楼是食品店，乘电梯还能去二楼和三楼。 "); }} aria-label="进入青禾大商场"><i className="mall-roof" /><i className="mall-body" /><i className="mall-door" /><i className="mall-windows" /><strong>青禾大商场</strong><small>三层商场 · 电梯换楼层</small></button>
                <div className="district-plots"><i /><i /><i /><span>待建设区域</span></div>
                <button className="return-car" onClick={(event) => { event.stopPropagation(); setCarTraveling(true); setCarRouteTarget("farm"); setCarRouteStep(0); setCarHeading("forward"); setCarStopped(false); setTrafficLight("green"); setMessage("汽车自动前进。遇到红灯按刹车，看到路面弯向哪边就按哪边转向。 "); }}><i /><b>自己开车返回</b><small>自动前进 · 刹车 · 转弯</small></button>
              </>
            ) : scene === "town" ? (
              <>
                <div className="town-road road-horizontal" /><div className="town-road road-vertical" />
                <div className="town-square"><span>✦</span><i /><i /><i /></div>
                {currentFestival?.id === "spring" && <><div className="saturday-market" aria-label="周六春日集市"><strong>春日集市</strong><button onClick={tasteFestivalJam}>草莓果酱<small>恢复 25 体力</small></button><button onClick={() => { setFestivalDisplay("wood"); setMessage("鲁师傅把精雕细刻的木工作品摆到了展示台上。 "); }}>木工作品<small>点击看展品</small></button><button className={festivalMusicPlaying ? "music-playing" : ""} onClick={playValleyMusic}>山谷音乐<small>{festivalMusicPlaying ? "正在演奏♪" : "点击播放"}</small></button></div><div className="festival-crowd" aria-label="参加春日集市的居民">{FESTIVAL_GUESTS.map((name, index) => <button key={name} style={personClothesStyle(name)} className={`crowd-person crowd-${index + 1} ${isNpcSick(name) ? "sick-npc" : ""}`} onClick={() => interactWithPerson(name, `${name}：春日集市真热闹，大家都来到中心广场啦！`)}><i /><b /><span>{name}</span></button>)}</div></>}
                {currentFestival && TRADITIONAL_FESTIVALS[currentFestival.id] && <><div className={`traditional-festival festival-${currentFestival.id}`}><i>{TRADITIONAL_FESTIVALS[currentFestival.id]?.symbol}</i><strong>{currentFestival.name}</strong><span>{currentFestival.description}</span><button onClick={claimTraditionalTreat}>免费领取{TRADITIONAL_FESTIVALS[currentFestival.id]?.treat}<small>恢复 20 体力</small></button></div><div className="festival-crowd traditional-festival-crowd" aria-label={`参加${currentFestival.name}的居民`}>{[...FESTIVAL_GUESTS, "安安"].map((name, index) => <button key={`traditional-${name}`} style={personClothesStyle(name)} className={`crowd-person crowd-${(index % 6) + 1} traditional-guest-${index + 1} ${name === "安安" ? "anan-character" : ""}`} onClick={() => interactWithPerson(name, `${name}：${currentFestival.name}真热闹，大家都在广场上走走看看！`)}><i />{name === "安安" && <em className="anan-pigtails" />}<b /><span>{name}</span></button>)}</div></>}
                <div className="street-lamp lamp-one" /><div className="street-lamp lamp-two" /><div className="street-lamp lamp-three" />

                <button className="town-building supermarket" onClick={() => setActiveBuilding("supermarket")} aria-label="进入青禾超市">
                  <span className="building-roof" /><span className="building-body" /><span className="shop-awning" /><span className="building-door" /><span className="building-windows" /><strong>青禾超市</strong><small>种子 · 食品 · 日用品</small>
                </button>
                <button className="town-building clinic" onClick={() => { setActiveBuilding("clinic"); setMessage(doctorIsRestingAtHome ? "进入青禾诊所。白医生正在自己的家里休息，红衣助手今天代班。" : "进入青禾诊所，白医生正在整理健康档案。 "); }} aria-label="进入青禾诊所"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>青禾诊所</strong><b>＋</b></button>
                <button className="town-building cafe" onClick={() => setActiveBuilding("cafe")} aria-label="进入麦香咖啡"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>麦香咖啡</strong></button>
                <button className="town-building workshop" onClick={() => setActiveBuilding("workshop")} aria-label="进入木匠工坊"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>木匠工坊</strong></button>
                <button className="town-building library" onClick={() => setActiveBuilding("library")} aria-label="进入山谷图书馆"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>山谷图书馆</strong></button>
                <button className="culture-gate" onClick={() => { setScene("cultureDistrict"); setPlayer({ x: 6, y: 7 }); setMessage("来到清河文化街，镇公所在左边，青禾博物馆在右边。 "); }}><span>清河文化街</span><strong>镇公所 · 博物馆</strong><b>↑</b><small>从最上方中间进入</small></button>

                <button className="edge-gate town-exit" onClick={() => { setScene("farm"); setPlayer({ x: 11, y: 5 }); setMessage("回到农场啦。"); }} aria-label={`返回${activeVillageInfo.farm}`}>
                  <b>←</b><span>{activeVillageInfo.farm}</span><small>继续向左走</small>
                </button>
                <div className="door-prompt"><span>↑</span>走到任意建筑门口即可进入</div>
              </>
            ) : scene === "cultureDistrict" ? (
              <>
                <div className="culture-road culture-road-main" /><div className="culture-road culture-road-branch" />
                <div className="culture-garden"><i /><i /><i /><strong>文化街花园</strong></div>
                <div className="culture-lamp culture-lamp-one" /><div className="culture-lamp culture-lamp-two" />
                <button className="town-building townhall culture-townhall" onClick={() => { setActiveBuilding("townhall"); setMessage("进入镇公所，周镇长正在整理公告栏。 "); }} aria-label="进入镇公所"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>镇公所</strong><small>公告 · 活动 · 居民委托</small></button>
                <button className="town-building school culture-school" onClick={() => { setActiveBuilding("school"); setMessage(`进入青禾学校。今天是${WEEKDAYS[(game.day - 1) % 7]}，${[0, 2, 4, 6].includes((game.day - 1) % 7) ? "可以听课并领取 50 金币学习奖励。" : "今天没有课程，可以参观教室。"}`); }} aria-label="进入青禾学校"><span className="building-roof" /><span className="school-bell" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>青禾学校</strong><small>英语 · 语文 · 数学 · 农场知识</small></button>
                {activeVillage === "qinghe" && <button className="town-building museum culture-museum" onClick={() => { setActiveBuilding("museum"); setMessage("进入青禾博物馆。沈馆长正在整理展柜。 "); }} aria-label="进入青禾博物馆"><span className="building-roof" /><span className="museum-dome" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>青禾博物馆</strong><small>稀奇物品收藏</small></button>}
                <button className="town-building culture-pet-shop" onClick={(event) => { event.stopPropagation(); setPetShopOpen(true); setSelectedPet("cat"); setMessage("走进青禾宠物之家，右边玻璃活动区里的小动物正在跑动和嬉戏。 "); }} aria-label="进入青禾宠物店"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>宠物之家</strong><small>猫狗 · 小鸡小鸭 · 小宠物</small></button>
                <div className="culture-sign"><strong>清河文化街</strong><span>镇公所 · 青禾学校 · 青禾博物馆</span></div>
                <button className="edge-gate culture-north-gate" onClick={() => { setScene("northNeighbor"); setPlayer({ x: 6, y: 7 }); setMessage("穿过文化街后面的林间小路，来到叶老师的北林书屋。 "); }}><span>北林书屋</span><b>↑</b><small>在文化街后面</small></button>
                <button className="edge-gate culture-residential-gate" onClick={() => { setScene("residentialDistrict"); setPlayer({ x: 0, y: 5 }); setMessage("来到青禾住宅坡，每位居民都有自己的院地和房子。 "); }}><span>青禾住宅坡</span><b>→</b><small>居民们各自的家</small></button>
                <button className="edge-gate culture-return" onClick={() => { setScene("town"); setPlayer({ x: 6, y: 0 }); setMessage("沿着石板路回到青禾镇中心街。 "); }}><b>↓</b><span>返回中心街</span><small>一直向下走</small></button>
              </>
            ) : scene === "residentialDistrict" ? (
              <>
                <div className="residential-main-path" />
                <div className="residential-plots" aria-label="青禾住宅坡的居民院地">
                  {RESIDENT_HOMES.map((home, index) => <article className={`resident-plot resident-plot-${index + 1}`} key={home.owner}><span className="plot-fence" /><i className="plot-tree" /><button className="resident-house" onClick={() => { setResidentHome(home.owner); setIndoorPlayer({ x: 33, y: 70 }); setMessage(`走进${home.home}，${home.owner}住在这里。`); }} aria-label={`进入${home.home}`}><span className="resident-roof" /><span className="resident-wall" /><span className="resident-door" /><span className="resident-window" /><strong>{home.home}<small>点击进入</small></strong></button><button style={personClothesStyle(home.owner)} className={`residential-resident ${isNpcSick(home.owner) ? "sick-npc" : ""} ${home.owner === "诊所助手" ? "red-uniform-resident" : ""}`} onClick={() => interactWithPerson(home.owner, `${home.owner}：${home.greeting}`)} aria-label={heldItem ? `把${carriedItemName}送给${home.owner}` : `和${home.owner}交谈`}><i /><b /><span>{home.owner}</span></button></article>)}
                </div>
                <button className="edge-gate residential-return" onClick={() => { setScene("cultureDistrict"); setPlayer({ x: 11, y: 5 }); setMessage("从住宅坡回到清河文化街。 "); }}><b>←</b><span>返回文化街</span><small>沿着小路向左</small></button>
              </>
            ) : (
              <>
                <div className="neighbor-path" />
                <button className={`neighbor-house ${scene}`} onClick={() => { setNeighborInterior(scene as NeighborScene); setIndoorPlayer({ x: 31, y: 70 }); setMessage(`进入${scene === "eastNeighbor" ? "林婶的果园小屋" : scene === "southNeighbor" ? "鲁师傅的山脚院子" : "叶老师的林间书屋"}。`); }}><span className="neighbor-roof" /><span className="neighbor-wall" /><span className="neighbor-door" /><span className="neighbor-window" /><strong>{scene === "eastNeighbor" ? "林婶的果园小屋" : scene === "southNeighbor" ? "鲁师傅的山脚院子" : "叶老师的林间书屋"}<small>点击进入</small></strong></button>
                <button style={personClothesStyle(scene === "eastNeighbor" ? "林婶" : scene === "southNeighbor" ? "鲁师傅" : "叶老师")} className={`npc-villager npc-${scene} ${isNpcSick(scene === "eastNeighbor" ? "林婶" : scene === "southNeighbor" ? "鲁师傅" : "叶老师") ? "sick-npc" : ""}`} onClick={() => talkToNeighbor(scene as NeighborScene)} aria-label="和居民人机说话或送礼"><i className="npc-hair" /><i className="npc-head" /><i className="npc-body" /><span>{scene === "eastNeighbor" ? "林婶" : scene === "southNeighbor" ? "鲁师傅" : "叶老师"}<small>{heldItem ? `点击送出${carriedItemName}` : "点击交谈"}</small></span></button>
                <div className="neighbor-decor"><i /><i /><i /></div>
                <button className={`edge-gate neighbor-return return-${scene}`} onClick={() => { if (scene === "northNeighbor") { setScene("cultureDistrict"); setPlayer({ x: 6, y: 0 }); setMessage("从北林书屋回到清河文化街。 "); } else { setScene("town"); setPlayer(scene === "eastNeighbor" ? { x: 11, y: 5 } : { x: 6, y: 7 }); setMessage("回到青禾镇中心街。"); } }}><b>{scene === "eastNeighbor" ? "←" : scene === "southNeighbor" ? "↑" : "↓"}</b><span>{scene === "northNeighbor" ? "返回文化街" : "返回青禾镇"}</span><small>{scene === "northNeighbor" ? "北林在文化街后面" : "走到边缘也能返回"}</small></button>
                {scene === "eastNeighbor" && activeVillage === "qinghe" && <button className="edge-gate village-crossing crossing-right" onClick={() => { const friend = partner?.online && partner.currentVillage === "maple" ? partner : null; switchVillage("maple"); setScene(friend?.scene ?? "farm"); setPlayer(friend ? { x: Math.max(0, Math.min(11, friend.x - 1)), y: friend.y } : { x: 0, y: 5 }); setMessage(friend ? `到了枫叶村，马上看见了${friend.playerName}！` : "沿着右边山路走到了枫叶村！"); }}><span>前往枫叶村</span><b>→</b><small>{partner?.online && partner.currentVillage === "maple" ? `去见${partner.playerName}` : "一直向右走"}</small></button>}
              </>
            )}

            {(scene === "farm" || scene === "town") && game.groundBooks.map((visible, bookId) => {
              const bookScene: Scene = bookId === 1 ? "town" : "farm";
              if (!visible || scene !== bookScene) return null;
              const book = LOST_BOOKS[bookId];
              return <button key={`ground-book-${bookId}`} className={`ground-book ground-book-${bookId + 1}`} onClick={(event) => { event.stopPropagation(); setMessage(`发现${book.title}。翻开一看：${book.content} 双击可以捡起来。`); playTone(480); }} onDoubleClick={(event) => { event.stopPropagation(); carryLostBook(bookId, true); }} aria-label={`遗失的书${book.title}，双击捡起`}><i /><span>{book.title}<small>双击捡起</small></span></button>;
            })}
            {activeVillage === "qinghe" && (scene === "farm" || scene === "town") && game.groundArtifacts.map((visible, artifactId) => {
              const artifactScene: Scene = artifactId === 1 ? "town" : "farm";
              if (!visible || scene !== artifactScene) return null;
              const artifact = RARE_ARTIFACTS[artifactId];
              return <button key={`ground-artifact-${artifactId}`} className={`ground-artifact ground-artifact-${artifactId + 1}`} onClick={(event) => { event.stopPropagation(); setMessage(`发现稀奇物品“${artifact.title}”：${artifact.description} 双击可以捡起来送到博物馆。`); playTone(760); }} onDoubleClick={(event) => { event.stopPropagation(); carryArtifact(artifactId, true); }} aria-label={`稀奇物品${artifact.title}，双击捡起`}><i>{artifact.short}</i><span>{artifact.title}<small>双击捡起 · 送博物馆</small></span></button>;
            })}
            {(scene === "farm" || scene === "town") && game.groundSupplies.map((visible, supplyId) => {
              const supplyScene: Scene = supplyId === 1 || supplyId === 3 || supplyId === 5 || supplyId === 7 ? "town" : "farm";
              if (!visible || scene !== supplyScene) return null;
              const supply = GROUND_SUPPLIES[supplyId];
              return <button key={`ground-supply-${supplyId}`} className={`ground-supply supply-${supply.kind} ground-supply-${supplyId + 1}`} onClick={(event) => { event.stopPropagation(); setMessage(`地上掉着${supply.name}：${supply.description} 双击可以捡起来。`); playTone(540); }} onDoubleClick={(event) => { event.stopPropagation(); pickUpGroundSupply(supplyId); }} aria-label={`${supply.name}，双击捡起`}><i>{supply.short}</i><span>{supply.name}<small>双击捡起</small></span></button>;
            })}

            {!ananBeachOpen && !ananBeachTraveling && <div className={`player facing-${facing} ${isWalking ? "walking" : ""} ${scene === "farm" ? "farm-centered-player" : ""}`} style={{ left: scene === "farm" ? "50%" : `${4 + player.x * 7.7}%`, top: scene === "farm" ? "55%" : `${8 + player.y * 10.5}%` }} aria-label={`玩家角色，面朝${facing === "left" ? "左" : facing === "right" ? "右" : facing === "up" ? "上" : "前"}`}>
              {renderCarriedItem()}{renderWearables()}{renderPetFollowers()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} />
            </div>}
            {partner?.online && partner.currentVillage === activeVillage && partner.scene === scene && <div className="online-partner" style={{ left: `${4 + partner.x * 7.7}%`, top: `${8 + partner.y * 10.5}%` }} aria-label={`${partner.playerName}也在这里`}><span>{partner.playerName}<small>朋友</small></span><i className="player-shadow" /><img src={partner.sick ? "/xiaohe-sick-sprite.png" : "/xiaohe-sprite.png"} alt="" draggable={false} /></div>}
            {partner?.online && partner.currentVillage === activeVillage && partner.scene !== scene && <button className="friend-locator" onClick={(event) => { event.stopPropagation(); setActiveBuilding(null); setNeighborInterior(null); setResidentHome(null); setScene(partner.scene); setPlayer({ x: Math.max(0, Math.min(11, partner.x + (partner.x < 11 ? 1 : -1))), y: partner.y }); setMessage(`找到${partner.playerName}了！现在你们在同一个地方。`); }}><span>● {partner.playerName}也在{activeVillageInfo.name}</span><strong>点击去找朋友</strong><small>{partner.scene === "farm" ? activeVillageInfo.farm : partner.scene === "westFriendFarm" ? "安安的小农场" : partner.scene === "town" ? "中心街" : partner.scene === "cultureDistrict" ? "清河文化街" : partner.scene === "residentialDistrict" ? "青禾住宅坡" : partner.scene === "eastNeighbor" ? "东郊" : partner.scene === "southNeighbor" ? "南坡" : "北林"}</small></button>}

            <div className="speech-bubble"><span>{scene === "farm" ? "☀" : "◆"}</span>{message}</div>
            <div className="movement-help"><span>WASD / 方向键</span>移动</div>

            {festivalDisplay === "wood" && (
              <div className="shop-overlay festival-exhibit-overlay" role="presentation">
                <section className="festival-exhibit" role="dialog" aria-modal="true" aria-labelledby="wood-exhibit-title"><header><div><span>木匠工坊 · 每日轮换展览</span><h2 id="wood-exhibit-title">鲁师傅的木工作品</h2></div><button onClick={() => setFestivalDisplay(null)}>×</button></header><div className={`wood-exhibit-stage daily-craft-${dailyWoodcraftIndex}`}><div className="woodcraft-window"><img src="/woodcraft-showcase.png" alt={dailyWoodcraft.name} draggable={false} /></div><div className="daily-craft-copy"><small>第 {game.day} 天 · 今日展品</small><strong>{dailyWoodcraft.name}</strong><p>{dailyWoodcraft.description}</p></div></div><p>鲁师傅每天早上都会换一件木雕。每件作品都用青禾谷的木材手工打磨，可以每天来看看。</p><footer><button onClick={() => setFestivalDisplay(null)}>看完今日展品</button></footer></section>
              </div>
            )}

            {friendHomeOpen && (
              <div className="shop-overlay neighbor-home-interior anan-home-interior" role="presentation">
                <section className="service-panel neighbor-home-panel anan-home-panel" role="dialog" aria-modal="true" aria-labelledby="anan-home-title">
                  <header><div><span>青禾农场西边 · 朋友的家</span><h2 id="anan-home-title">安安的林边小屋</h2></div><button onClick={() => { setFriendHomeOpen(false); setMessage("从安安的林边小屋出来了。 "); }} aria-label="离开安安的家">×</button></header>
                  <div className="interior-room neighbor-room anan-home-room" onClick={walkInsidePointer}>
                    <div className="room-window"><i /><i /></div><div className="room-rug" />
                    <div className="anan-home-gear"><i /><i /><i /><span>登山包 · 绳索 · 地图</span></div>
                    <button className="neighbor-bed anan-bed" onClick={() => setMessage("这是安安的床，床头放着一本写满山洞路线的探险笔记。 ")}><i /><b /><span>安安的床</span></button>
                    <div className="neighbor-home-items anan-home-items">{["山谷地图", "水晶收藏", "露营相册"].map((item) => <button key={item} onClick={() => setMessage(item === "山谷地图" ? "地图上画着安安走过的山路、帐篷营地和青禾山洞。" : item === "水晶收藏" ? "架子上放着安安从山洞带回来的彩色小水晶。" : "相册里有安安和小禾一起在野外玩的照片。 ")}><i />{item}</button>)}</div>
                    {!wildFriendVisit && !wildFriendAtPlayerHome ? <button style={personClothesStyle("安安")} className="neighbor-indoor-npc anan-home-npc anan-character" onClick={() => interactWithPerson("安安", "安安：欢迎来我家！我们可以看看地图，再决定今天去哪里探险。 ")} aria-label={heldItem ? `把${carriedItemName}送给安安` : "和安安聊天"}><i className="npc-hair" /><i className="npc-face" /><em className="anan-pigtails" /><i className="npc-body" /><span>安安</span></button> : <button className="anan-indoor-away-note" onClick={() => setMessage(wildFriendAtPlayerHome ? `纸条上写着：我去${displayName}家找你啦！——安安` : `纸条上写着：我去${wildFriendVisit === "cave" ? "山洞" : "帐篷"}玩一会儿，晚点回来！——安安`)}><i />安安留下的纸条<small>点击查看去向</small></button>}
                    <button className="house-door neighbor-home-door" onClick={() => { setFriendHomeOpen(false); setMessage("从安安的林边小屋出来了。 "); }}><span>出口</span></button>
                    <div className={`player indoor-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }}>{renderCarriedItem()}{renderWearables()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
                  </div>
                  <div className="service-dialogue"><strong>{wildFriendVisit || wildFriendAtPlayerHome ? "安安出门了" : "安安"}</strong><p>{wildFriendAtPlayerHome ? `安安今天去${displayName}的农舍找你。她在桌上留了一张纸条。` : wildFriendVisit ? `安安今天去了${wildFriendVisit === "cave" ? "青禾山洞" : "溪边帐篷"}，小屋里留下了她的去向。` : "欢迎来我家！屋里有登山装备、地图、水晶收藏和安安自己的床。"}</p></div>
                  <div className="service-actions"><button onClick={() => wildFriendVisit || wildFriendAtPlayerHome ? setMessage("安安不在家，但她把今天的去向写在纸条上了。 ") : interactWithPerson("安安", "安安：下次我也会直接去你家找你，我们可以从农舍一起出发。 ")}>{wildFriendVisit || wildFriendAtPlayerHome ? "查看安安留下的纸条" : heldItem ? `把${carriedItemName}送给安安` : "和安安聊天"}</button>{!wildFriendVisit && !wildFriendAtPlayerHome && <button onClick={receiveAnanCookie}>和安安分享饼干 · 每天 1 块</button>}{!wildFriendVisit && !wildFriendAtPlayerHome && <button onClick={startAnanBeachTrip}>{game.ananBeachTrips.includes(currentAnanTripKey) ? "和安安再去海边" : "和安安第一次去海边"}</button>}<button className="exit-action" onClick={() => { setFriendHomeOpen(false); setMessage("从安安的林边小屋出来了。 "); }}>从门口出去</button></div>
                  <footer><span>{message}</span><small>屋里可以移动 · 按 Esc 出去</small></footer>
                </section>
              </div>
            )}

            {neighborInterior && (
              <div className={`shop-overlay neighbor-home-interior home-${neighborInterior}`} role="presentation">
                <section className="service-panel neighbor-home-panel" role="dialog" aria-modal="true" aria-labelledby="neighbor-home-title">
                  <header><div><span>居民的家</span><h2 id="neighbor-home-title">{neighborInterior === "eastNeighbor" ? "林婶的果园小屋" : neighborInterior === "southNeighbor" ? "鲁师傅的山脚院子" : "叶老师的林间书屋"}</h2></div><button onClick={() => { setNeighborInterior(null); setBuilderOpen(false); setMessage("从居民家的门口出来了。 "); }}>×</button></header>
                  <div className="interior-room neighbor-room" onClick={walkInsidePointer}>
                    <div className="room-window"><i /><i /></div><div className="room-rug" />
                    <div className={`neighbor-home-furniture furniture-${neighborInterior}`}><i /><i /><i /></div>
                    <button className={`neighbor-bed bed-${neighborInterior}`} onClick={() => setMessage(`这是${neighborInterior === "eastNeighbor" ? "林婶" : neighborInterior === "southNeighbor" ? "鲁师傅" : "叶老师"}的床，铺得整整齐齐。`)}><i /><b /><span>{neighborInterior === "eastNeighbor" ? "林婶" : neighborInterior === "southNeighbor" ? "鲁师傅" : "叶老师"}的床</span></button>
                    <div className={`neighbor-home-items items-${neighborInterior}`}>
                      {(neighborInterior === "eastNeighbor" ? ["草莓果酱", "草莓篮", "果酱架"] : neighborInterior === "southNeighbor" ? ["木料堆", "工具墙", "木工台"] : ["故事书架", "农事图书", "阅读桌"]).map((item) => <button key={item} onClick={() => setMessage(item === "草莓果酱" ? "林婶的草莓果酱装在玻璃罐里，闻起来甜甜的。" : item === "木料堆" ? "鲁师傅家里堆着许多松木、橡木和等待加工的木板。" : item === "故事书架" ? "叶老师的书架摆满了青禾谷故事、农事图鉴和冒险书。" : `仔细查看了${item}。`)}><i />{item}</button>)}
                    </div>
                    <button style={personClothesStyle(neighborInterior === "eastNeighbor" ? "林婶" : neighborInterior === "southNeighbor" ? "鲁师傅" : "叶老师")} className={`neighbor-indoor-npc ${isNpcSick(neighborInterior === "eastNeighbor" ? "林婶" : neighborInterior === "southNeighbor" ? "鲁师傅" : "叶老师") ? "sick-npc" : ""}`} onClick={() => talkToNeighbor(neighborInterior)}><i className="npc-hair" /><i className="npc-face" /><i className="npc-body" /><span>{neighborInterior === "eastNeighbor" ? "林婶" : neighborInterior === "southNeighbor" ? "鲁师傅" : "叶老师"}</span></button>
                    <button className="house-door neighbor-home-door" onClick={() => { setNeighborInterior(null); setBuilderOpen(false); setMessage("从居民家的门口出来了。 "); }}><span>出口</span></button>
                    <div className={`player indoor-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }}>{renderCarriedItem()}{renderWearables()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
                  </div>
                  <div className="service-dialogue"><strong>{neighborInterior === "eastNeighbor" ? "林婶" : neighborInterior === "southNeighbor" ? "鲁师傅" : "叶老师"}</strong><p>{neighborInterior === "eastNeighbor" ? "欢迎来我家！桌上放着果酱和刚摘下来的草莓。" : neighborInterior === "southNeighbor" ? "把木头和石材交给我，我能帮你制作东西、扩建农舍和地盘。" : "欢迎来到林间书屋，书架上的故事都可以慢慢看。"}</p></div>
                  <div className="service-actions"><button onClick={() => talkToNeighbor(neighborInterior)}>{heldItem ? `把${carriedItemName}送给${neighborInterior === "eastNeighbor" ? "林婶" : neighborInterior === "southNeighbor" ? "鲁师傅" : "叶老师"}` : neighborInterior === "southNeighbor" ? "打开鲁师傅的委托单" : "和主人聊天"}</button><button className="exit-action" onClick={() => { setNeighborInterior(null); setBuilderOpen(false); setMessage("从居民家的门口出来了。 "); }}>从门口出去</button></div>
                  <footer><span>{message}</span><small>屋里可以移动 · 按 Esc 出去</small></footer>
                </section>
              </div>
            )}

            {residentHomeInfo && residentHome && (
              <div className="shop-overlay resident-home-interior" role="presentation">
                <section className="service-panel resident-home-panel" role="dialog" aria-modal="true" aria-labelledby="resident-home-title">
                  <header><div><span>青禾住宅坡 · 私人住宅</span><h2 id="resident-home-title">{residentHomeInfo.home}</h2></div><button onClick={() => { setResidentHome(null); setMessage("从居民自己的房子里出来了。 "); }}>×</button></header>
                  <div className="interior-room resident-home-room" onClick={walkInsidePointer}>
                    <div className="room-window"><i /><i /></div><div className="room-rug" />
                    <div className="resident-home-cabinet"><i /><i /><i /></div>
                    <button className="neighbor-bed resident-private-bed" onClick={() => setMessage(`这是${residentHome}自己的床，只有房子的主人会在这里休息。`)}><i /><b /><span>{residentHome}的床</span></button>
                    <div className="resident-home-items">{residentHomeInfo.items.map((item) => <button key={item} onClick={() => setMessage(`在${residentHome}家里仔细看了${item}。`)}><i />{item}</button>)}</div>
                    <button style={personClothesStyle(residentHome)} className={`neighbor-indoor-npc resident-home-npc ${isNpcSick(residentHome) ? "sick-npc" : ""} ${residentHome === "诊所助手" ? "home-relief-assistant" : ""}`} onClick={() => interactWithPerson(residentHome, `${residentHome}：${residentHomeGreeting}`)} aria-label={heldItem ? `把${carriedItemName}送给${residentHome}` : `和${residentHome}交谈`}><i className="npc-hair" /><i className="npc-face" /><i className="npc-body" /><span>{residentHome}</span></button>
                    <button className="house-door neighbor-home-door" onClick={() => { setResidentHome(null); setMessage("从居民自己的房子里出来了。 "); }}><span>出口</span></button>
                    <div className={`player indoor-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }}>{renderCarriedItem()}{renderWearables()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
                  </div>
                  <div className={`service-dialogue ${residentHome === "白医生" && doctorIsRestingAtHome ? "relief-dialogue" : ""}`}><strong>{residentHome}</strong><p>{residentHomeGreeting}</p></div>
                  <div className="service-actions"><button onClick={() => interactWithPerson(residentHome, `${residentHome}：${residentHomeGreeting}`)}>{heldItem ? `把${carriedItemName}送给${residentHome}` : "和房子的主人聊天"}</button><button className="exit-action" onClick={() => { setResidentHome(null); setMessage("从居民自己的房子里出来了。 "); }}>从门口出去</button></div>
                  <footer><span>{message}</span><small>屋里可以移动 · 按 Esc 出去</small></footer>
                </section>
              </div>
            )}

            {builderOpen && (
              <div className={`shop-overlay builder-overlay ${neighborInterior ? "nested-house-overlay" : ""}`} role="presentation"><section className="builder-panel" role="dialog" aria-modal="true" aria-labelledby="builder-title"><header><div><span>鲁师傅的扩建委托</span><h2 id="builder-title">选择扩建项目</h2></div><button onClick={() => setBuilderOpen(false)}>×</button></header><div className="builder-supplies"><span>已经交给鲁师傅</span><strong>{game.builderSupplies.wood} 木头 · {game.builderSupplies.stone} 石材</strong><small>回到资源栏双击木头或石材，再点击鲁师傅，可以继续交材料。</small></div><div className="builder-grid"><button onClick={() => commissionBuilder("land")} disabled={Boolean(game.upgrades.land)}><b>扩大地盘</b><span>{game.upgrades.land ? "已经完成" : "12 木 · 18 石"}</span></button><button onClick={() => commissionBuilder("house")} disabled={game.upgrades.house >= 3}><b>扩大农舍</b><span>{game.upgrades.house >= 3 ? "三级扩建已经完成" : `${20 + game.upgrades.house * 10} 木 · ${12 + game.upgrades.house * 8} 石 · 安装${["暖光灯", "自动水箱", "料理台"][game.upgrades.house]}`}</span></button><button onClick={() => commissionBuilder("field")} disabled={Boolean(game.upgrades.field)}><b>扩大土地</b><span>{game.upgrades.field ? "已经增加 8 格土地" : "10 木 · 10 石 · 增加 8 格"}</span></button><button onClick={() => commissionBuilder("storage")} disabled={Boolean(game.upgrades.storage)}><b>扩建售卖仓库</b><span>{game.upgrades.storage ? "售卖价已经提高 10%" : "18 木 · 12 石 · 售价 +10%"}</span></button><button onClick={() => commissionBuilder("greenhouse")} disabled={Boolean(game.upgrades.greenhouse)}><b>修建玻璃温室</b><span>{game.upgrades.greenhouse ? "每天会自动照料作物" : "28 木 · 22 石 · 作物自动生长"}</span></button><button onClick={() => commissionBuilder("pond")} disabled={Boolean(game.upgrades.pond)}><b>扩大钓鱼池</b><span>{game.upgrades.pond ? "每次钓鱼额外 +1" : "16 木 · 24 石 · 鱼获 +1"}</span></button><button onClick={() => commissionBuilder("stoneWall")} disabled={Boolean(game.upgrades.stoneWall)}><b>修建农场石墙</b><span>{game.upgrades.stoneWall ? "小动物无法进入" : "8 木 · 32 石 · 永久防动物"}</span></button></div><footer><span>{message}</span><button onClick={() => setBuilderOpen(false)}>收起扩建委托</button></footer></section></div>
            )}

            {multiplayerOpen && (
              <div className="shop-overlay crafting-overlay" role="presentation">
                <section className="multiplayer-panel" role="dialog" aria-modal="true" aria-labelledby="multiplayer-title">
                  <header><div><span>两个设备 · 两个村庄</span><h2 id="multiplayer-title">双人联机</h2></div><button onClick={() => setMultiplayerOpen(false)} aria-label="关闭双人联机">×</button></header>
                  {multiplayerSession ? (
                    <>
                      <div className="room-code-display"><span>把这个房间码告诉另一位玩家</span><strong>{multiplayerSession.roomCode}</strong><small>对方打开同一个网页，点“双人联机”，输入房间码并选择另一个村庄。</small></div>
                      <div className="player-village-list">
                        <article><b className="online-dot" /><div><span>我 · {multiplayerSession.playerName}</span><strong>{activeVillageInfo.name}</strong><small>{activeVillageInfo.description}</small></div></article>
                        <article className={partner?.online ? "partner-online" : ""}><b /><div><span>{partner ? `${partner.playerName} · ${partner.online ? "在线" : "暂时离线"}` : "等待第二位玩家"}</span><strong>{partner ? VILLAGE_INFO[partner.village].name : "另一个村庄还空着"}</strong><small>{partner ? `第 ${partner.day} 天 · 体力 ${partner.energy}/100` : "请对方输入上面的房间码"}</small></div></article>
                      </div>
                      <footer><span>两个人各自保存自己的农田、物品、金币和房子。</span><button className="leave-room-button" onClick={() => void leaveMultiplayer()}>退出联机</button><button onClick={() => setMultiplayerOpen(false)}>继续游戏</button></footer>
                    </>
                  ) : (
                    <>
                      <div className="multiplayer-form">
                        <label><span>你的名字</span><input value={playerNameInput} maxLength={12} onChange={(event) => setPlayerNameInput(event.target.value)} placeholder="小禾" /></label>
                        <div className="village-choice"><span>选择居住的村庄</span>{(["qinghe", "maple"] as VillageId[]).map((village) => <button key={village} className={preferredVillage === village ? "selected" : ""} onClick={() => setPreferredVillage(village)}><strong>{VILLAGE_INFO[village].name}</strong><small>{VILLAGE_INFO[village].description}</small></button>)}</div>
                        <button className="create-room-button" disabled={joiningMultiplayer} onClick={createMultiplayerRoom}>{joiningMultiplayer ? "正在连接…" : "创建新房间"}</button>
                        <div className="join-divider"><span>或者加入朋友的房间</span></div>
                        <div className="join-room-row"><input value={roomCodeInput} maxLength={8} onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())} placeholder="输入房间码" /><button disabled={joiningMultiplayer} onClick={() => void connectMultiplayer(roomCodeInput, preferredVillage)}>加入房间</button></div>
                        {multiplayerError && <p className="multiplayer-error">{multiplayerError}</p>}
                      </div>
                      <footer><span>第一位建议选青禾村，第二位选枫叶村；同一个村庄不能住两个人。</span><button onClick={() => setMultiplayerOpen(false)}>暂不联机</button></footer>
                    </>
                  )}
                </section>
              </div>
            )}

            {farmInterior && (
              <div className="shop-overlay farm-special-overlay" role="presentation">
                <section className={`farm-special-panel ${farmInterior}-interior-panel ${interiorFireLit ? "interior-fire-lit" : ""}`} role="dialog" aria-modal="true" aria-labelledby="farm-special-title">
                  <header><div><span>{farmInterior === "cave" ? "青禾农场西侧" : "溪边露营地"}</span><h2 id="farm-special-title">{farmInterior === "cave" ? "青禾山洞内部" : "双顶帐篷内部"}</h2></div><button onClick={() => { setFarmInterior(null); setInteriorFireLit(false); }} aria-label="离开这里">×</button></header>
                  <div className="farm-special-scene">
                    {farmInterior === "cave" ? <><i className="cave-rock cave-rock-one" /><i className="cave-rock cave-rock-two" /><i className="cave-crystal cave-crystal-one" /><i className="cave-crystal cave-crystal-two" /><span className="cave-path" /><b className="cave-fire" /></> : <><i className="camp-bed" /><i className="camp-bag" /><i className="camp-table" /><span className="camp-lantern" /><b className="camp-window" /></>}
                    {wildFriendVisit === farmInterior && <button style={personClothesStyle("安安")} className="wild-friend-visitor anan-character" onClick={() => interactWithPerson("安安", farmInterior === "cave" ? "安安：这里的水晶真漂亮！我们点亮火柴，再一起找找通往深处的小路吧。" : "安安：今晚风很轻，我们可以在帐篷里讲山谷探险的故事。") }><i /><em className="anan-pigtails" /><b /><span>安安<small>来陪你玩</small></span></button>}
                    {farmInterior === "cave" && game.missingPetId && (() => { const lostPet = game.pets.find((pet) => pet.id === game.missingPetId); if (!lostPet) return null; const petName = PET_CATALOG.find((pet) => pet.id === lostPet.type)?.name; return <button className={`lost-pet-in-cave pet-${lostPet.type}`} onClick={() => { setGame((current) => ({ ...current, missingPetId: null })); setMessage(`在岩石后面找到了${petName}，小禾把它轻轻抱起来带回家，它又会跟着你了！`); playTone(900); }}><i /><b /><span>{petName}躲在洞里<small>点击抱回家</small></span></button>; })()}
                    <div className={`player indoor-player farm-special-player facing-${facing} ${isWalking ? "walking" : ""}`}><span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
                    {!interiorFireLit && <div className="special-darkness"><span>{farmInterior === "cave" ? "山洞里很暗" : "帐篷里还没点灯"}</span></div>}
                  </div>
                  <div className="farm-special-actions"><button onClick={igniteWithMatches} disabled={interiorFireLit}>{interiorFireLit ? "火光已经点亮" : `使用火柴照明 · 剩 ${game.crafted.matches}`}</button><button onClick={() => { setFarmInterior(null); setInteriorFireLit(false); setMessage(farmInterior === "cave" ? "从山洞回到大农场。" : "从帐篷回到露营地。 "); }}>从入口出去</button></div>
                </section>
              </div>
            )}

            {craftingOpen && (
              <div className="shop-overlay crafting-book-overlay" role="presentation" onClick={() => { setCraftingOpen(false); setMessage("收起制作手册，可以继续走路了。"); }}>
                <section className="craft-panel" role="dialog" aria-modal="true" aria-labelledby="craft-title" onClick={(event) => event.stopPropagation()}>
                  <header className="craft-sticky-header"><div><span>农场手作</span><h2 id="craft-title">制作手册</h2></div><div className="wood-wallet"><small>现有材料</small><strong>{game.wood} 木 · {game.stone} 石 · {game.resin} 树脂 · {game.wool} 羊毛</strong></div><button className="craft-close-button" onClick={() => setCraftingOpen(false)} aria-label="关闭制作菜单">×</button></header>
                  <div className="craft-intro"><span>⚒</span><p><strong>把木头、石材、树脂和羊毛做成实用物品</strong>火柴需要 3 木和 2 树脂；羊毛毯需要 3 团羊毛。</p></div>
                  <div className="recipe-grid">
                    {(Object.keys(CRAFT_RECIPES) as CraftType[]).map((item) => { const recipe = CRAFT_RECIPES[item]; return <article className="recipe-card" key={item}><span className={`recipe-icon ${item}-recipe`}>{recipe.short}</span><div><strong>{recipe.name}</strong><small>{recipe.description}</small><em>背包里 {game.crafted[item]} 个{item !== "matches" && item !== "blanket" && ` · 已摆 ${game.placedCrafts.filter((placed) => placed.type === item).length} 个`}</em></div><button onClick={() => craftItem(item)}>{recipe.wood > 0 && <><span>木</span>{recipe.wood}</>}{recipe.stone > 0 && <> · <span>石</span>{recipe.stone}</>}{(recipe.resin ?? 0) > 0 && <> · <span>脂</span>{recipe.resin}</>}{(recipe.wool ?? 0) > 0 && <><span>毛</span>{recipe.wool}</>}</button></article>; })}
                  </div>
                  <footer><span>{message}</span><button onClick={() => setCraftingOpen(false)}>收起手册</button></footer>
                </section>
              </div>
            )}

            {ranchOpen && (
              <div className="shop-overlay ranch-overlay" role="presentation">
                <section className="ranch-panel" role="dialog" aria-modal="true" aria-labelledby="ranch-title">
                  <header><div><span>青禾农场北坡</span><h2 id="ranch-title">青禾动物牧场</h2></div><div className="ranch-wallet"><small>现有金币</small><strong>● {game.coins}</strong></div><button onClick={() => setRanchOpen(false)} aria-label="离开动物牧场">×</button></header>
                  <div className="ranch-scene"><div className="pixel-rancher" style={personClothesStyle("小桃")}><i /><b /><em /></div><div><strong>牧场管理员小桃</strong><p>先给动物建好围栏，再把鸡、奶牛和绵羊带回农场。它们每天都能产出不同物品。</p></div></div>
                  <div className="ranch-products"><article><span className="ranch-product-icon pen-icon">栏</span><div><strong>动物木围栏</strong><small>12 木 · 4 石 · 建在农田旁边</small></div><button onClick={buildAnimalPen} disabled={game.animalPen}>{game.animalPen ? "已经建好" : "委托修建"}</button></article><article><span className="ranch-product-icon chicken-icon">鸡</span><div><strong>小鸡</strong><small>每只每天产 1 枚鸡蛋</small></div><button onClick={() => buyFarmAnimal("chicken")} disabled={!game.animalPen}>● 180</button></article><article><span className="ranch-product-icon cow-icon">牛</span><div><strong>奶牛</strong><small>每头每天产 1 瓶牛奶</small></div><button onClick={() => buyFarmAnimal("cow")} disabled={!game.animalPen}>● 350</button></article><article><span className="ranch-product-icon sheep-icon">羊</span><div><strong>绵羊</strong><small>每天梳出 1 团羊毛 · 可做毛毯</small></div><button onClick={() => buyFarmAnimal("sheep")} disabled={!game.animalPen}>● 300</button></article></div>
                  <footer><span>{message}</span><button onClick={() => setRanchOpen(false)}>回到大农场</button></footer>
                </section>
              </div>
            )}

            {chestOpen && (
              <div className="shop-overlay" role="presentation">
                <section className="shop-panel chest-storage-panel" role="dialog" aria-modal="true" aria-labelledby="chest-title">
                  <header><div><span>农场收纳</span><h2 id="chest-title">木箱</h2></div><div className="shop-wallet"><small>箱内物品</small><strong>{Object.values(game.chestStorage).reduce((sum, value) => sum + value, 0)} 个</strong></div><button onClick={() => setChestOpen(false)} aria-label="关上木箱">×</button></header>
                  <div className="shopkeeper chest-intro"><span className="chest-mini">箱</span><p><strong>小禾的木箱</strong>存进去的鱼和各种作物会一直保存在这里，想用时可以再取出来。</p></div>
                  <div className="product-grid chest-grid">
                    {(Object.keys(RESOURCE_INFO) as StorableResource[]).map((resource) => <article className="product-card" key={resource}><span className={`product-icon ${resource}-icon`}>{resource === "fish" ? "鱼" : CROP_INFO[resource].short}</span><div><strong>{RESOURCE_INFO[resource].name}</strong><small>箱内有 {game.chestStorage[resource]} 个</small></div><button disabled={game.chestStorage[resource] <= 0} onClick={() => takeFromChest(resource)}>取出 1 个</button></article>)}
                  </div>
                  <footer><span>{message}</span><button onClick={() => setChestOpen(false)}>关上木箱</button></footer>
                </section>
              </div>
            )}

            {shippingBinOpen && (
              <div className="shop-overlay shipping-bin-overlay" role="presentation">
                <section className="shop-panel shipping-bin-panel" role="dialog" aria-modal="true" aria-labelledby="shipping-bin-title">
                  <header><div><span>农舍旁的大号箱子</span><h2 id="shipping-bin-title">大号出货箱</h2></div><div className="shop-wallet"><small>睡觉后预计收入</small><strong>● {Math.round(SHIPPING_CATALOG.reduce((sum, item) => sum + (game.shippingBin[item.id] ?? 0) * item.price, 0) * (game.upgrades.storage ? 1.1 : 1)).toLocaleString()}</strong></div><button onClick={() => setShippingBinOpen(false)} aria-label="关上大号出货箱">×</button></header>
                  <div className="shopkeeper shipping-bin-intro"><span className="shipping-bin-mini"><i /></span><p><strong>单击“放入 1 个”</strong>就会把物品放进箱子。睡到第二天，它们会自动卖掉并通知赚了多少金币。锄头、水壶、收获、鱼竿等基础工具不能放入。</p></div>
                  <div className="shipping-bin-grid">
                    {SHIPPING_CATALOG.map((item) => { const available = shippingItemCount(game, item); const inBin = game.shippingBin[item.id] ?? 0; return <article className="shipping-item-card" key={item.id}><span>{item.short}</span><div><strong>{item.name}</strong><small>背包 {available} · 待售 {inBin} · 每个 {item.price} 金币</small></div><button disabled={available <= 0} onClick={() => putInShippingBin(item)}>放入 1 个</button><button className="shipping-take-back" disabled={inBin <= 0} onClick={() => takeFromShippingBin(item)}>取回</button></article>; })}
                  </div>
                  <footer><span>{message}</span><button onClick={() => setShippingBinOpen(false)}>关上箱子，等到明早售卖</button></footer>
                </section>
              </div>
            )}

            {activeBuilding === "farmhouse" && (
              <div className="shop-overlay interior-farmhouse" role="presentation">
                <section className="service-panel farmhouse-panel" role="dialog" aria-modal="true" aria-labelledby="farmhouse-title">
                  <header><div><span>{activeVillageInfo.farm}室内</span><h2 id="farmhouse-title">{displayName}的农舍</h2></div><button onClick={leaveBuilding} aria-label={`离开${displayName}的农舍`}>×</button></header>
                  <div className={`interior-room farmhouse-room ${game.upgrades.house ? "expanded-farmhouse-room" : ""} farmhouse-level-${game.upgrades.house} ${isNight ? "night-room" : ""} ${isNight && stoveLit ? "stove-lit-room" : ""} ${isNight && game.equipment.lampOn ? "lamp-lit-room" : ""} ${bedtimePhase === "tuckedIn" || bedtimePhase === "waking" ? "bedtime-sleeping" : ""}`} onClick={walkInsidePointer}>
                    <div className="room-window"><i /><i /></div>
                    {isBirthday && <><div className="birthday-banner">二月十九日 · {displayName}生日快乐！</div><div className="birthday-loft" aria-label="生日派对时可以跑上去的小阁楼"><i /><b /><span>小阁楼</span></div><div className="birthday-house-guests" aria-label="会在农舍里跑动、看窗户、跳床和玩耍的所有朋友">{BIRTHDAY_GUESTS.map((name, index) => <button key={`birthday-${name}`} style={personClothesStyle(name)} className={`birthday-guest birthday-guest-${index + 1} birthday-behavior-${index % 5} ${name === "安安" ? "anan-character" : ""}`} onClick={() => interactWithPerson(name, `${name}：生日快乐！我们刚才在屋里跑来跑去、看窗外，还轮流在床上跳呢！`)} aria-label={`和参加生日派对的${name}聊天`}><i />{name === "安安" && <em className="anan-pigtails" />}<b /><span>{name}</span></button>)}</div><button className={`birthday-cake ${game.birthdayCakeYear === game.year ? "cake-eaten" : ""}`} onClick={eatBirthdayCake} aria-label="分享生日蛋糕恢复体力"><i /><b /><em /><span>{game.birthdayCakeYear === game.year ? "蛋糕已经分享完" : "点击吃生日蛋糕 · 恢复40体力"}</span></button></>}
                    <button className="house-bed" onClick={sleepAtHome} aria-label="点击床睡到第二天"><i /><b /><span>点击睡觉</span></button>
                    {(bedtimePhase === "tuckedIn" || bedtimePhase === "waking") && <div className={`sleeping-player-in-bed ${bedtimePhase}`} aria-label={bedtimePhase === "waking" ? "小禾第二天在床上醒来" : "小禾盖着被子睡觉"}><i className="sleep-head" /><b className="sleep-blanket" /><span>{bedtimePhase === "waking" ? "早上七点 · 点击房间起床" : "盖好被子睡觉中…"}</span></div>}
                    {(bedtimePhase === "tuckedIn" || bedtimePhase === "waking") && followingPets.length > 0 && <div className="sleeping-pet-cages" aria-label="睡觉时宠物们回到农舍里的小窝"><strong>宠物们的睡觉小窝</strong>{followingPets.slice(0, 6).map((pet) => <span key={`sleep-${pet.id}`} className={`sleep-pet-cage pet-${pet.type} ${game.sickPetIds.includes(pet.id) ? "sick-pet" : ""}`}><i /><b /><em /></span>)}</div>}
                    <div className="house-table"><i /><i /></div>
                    <button className={`house-stove ${stoveLit ? "lit" : ""}`} onClick={() => { setStoveLit((lit) => !lit); setMessage(stoveLit ? "把炉火熄灭了。" : "炉灶点着了，屋里暖和起来！"); playTone(stoveLit ? 300 : 660); }} aria-pressed={stoveLit} aria-label={stoveLit ? "熄灭炉灶" : "点燃炉灶"}><i /><b /><span /></button>
                    {game.upgrades.house >= 1 && <button className={`house-equipment house-lamp ${game.equipment.lampOn ? "active" : ""}`} onClick={() => { setGame((current) => ({ ...current, equipment: { ...current.equipment, lampOn: !current.equipment.lampOn } })); setMessage(game.equipment.lampOn ? "关掉了暖光灯。" : "暖光灯亮起来，夜晚的房间变得明亮了！"); }}><i />暖光灯</button>}
                    {game.upgrades.house >= 2 && <button className="house-equipment house-water-tank" onClick={() => { setGame((current) => ({ ...current, water: current.toolUpgrades.water ? 18 : 12 })); setMessage("自动水箱把洒水壶补满了！"); playTone(620); }}><i />自动水箱</button>}
                    {game.upgrades.house >= 3 && <button className="house-equipment house-kitchen" onClick={() => { setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 20) })); setMessage("在料理台吃了一份热饭，恢复 20 点体力！"); playTone(740); }}><i />料理台</button>}
                    {wildFriendAtPlayerHome && <button style={personClothesStyle("安安")} className="neighbor-indoor-npc anan-farmhouse-visitor anan-character" onClick={() => interactWithPerson("安安", `安安：我直接跑来${displayName}家找你啦！今天一起去农场、帐篷或者山洞玩吧。`)} aria-label={heldItem ? `把${carriedItemName}送给安安` : "和来家里找你的安安聊天"}><i className="npc-hair" /><i className="npc-face" /><em className="anan-pigtails" /><i className="npc-body" /><span>安安<small>来找你玩</small></span></button>}
                    <div className="house-rug" />
                    <button className="house-door" onClick={leaveBuilding} aria-label="点击出口离开农舍"><span>出口</span></button>
                    <div className={`player indoor-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }} aria-label="小禾站在农舍里">{renderCarriedItem()}{renderWearables()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
                  </div>
                  <div className="service-dialogue"><strong>{isBirthday ? `${displayName}的生日派对` : wildFriendAtPlayerHome ? "安安来找你啦" : "回到家啦"}</strong><p>{isBirthday ? "每一年的春天第十九天，大家都会来到农舍庆祝二月十九日生日。点击朋友可以聊天，点击蛋糕能恢复体力。" : wildFriendAtPlayerHome ? "安安有时会从西边的小农场直接跑来你家。点击她可以聊天，也可以把头顶举着的礼物送给她。" : "床铺得软软的，炉灶还留着余温。可以休息到明天，也可以从门口回农场。"}</p></div>
                  <div className="service-actions">
                    <button onClick={sleepAtHome}>在床上睡到明天</button>
                    <button className="exit-action" onClick={leaveBuilding}>从门口出去</button>
                  </div>
                  <footer><span>{message}</span><small>按 Esc 也可以出去</small></footer>
                </section>
              </div>
            )}

            {activeBuilding === "supermarket" && (
              <div className="shop-overlay" role="presentation">
                <section className="shop-panel" role="dialog" aria-modal="true" aria-labelledby="shop-title">
                  <header><div><span>青禾镇杂货</span><h2 id="shop-title">青禾超市</h2></div><div className="shop-wallet"><small>你的金币</small><strong>● {game.coins}</strong></div><button onClick={leaveBuilding} aria-label="离开商店">×</button></header>
                  <div className="shopkeeper"><button style={personClothesStyle(supermarketClerk)} className={`shopkeeper-face ${supermarketReliefWorker ? "relief-worker" : ""}`} onClick={() => interactWithPerson(supermarketClerk, `${supermarketClerk}：${supermarketReliefWorker?.greeting ?? "欢迎呀，小禾！今天想带点什么回农场？"}`)} aria-label={heldItem ? `把${carriedItemName}送给${supermarketClerk}` : `和${supermarketClerk}交谈`}><i /><b /></button><p><strong>{supermarketClerk}{supermarketReliefWorker ? " · 今日代班" : ""}</strong>{heldItem ? `小禾正举着${carriedItemName}，点击${supermarketClerk}就能送给他。` : supermarketReliefWorker?.greeting ?? (currentFestival?.id === "seeds" ? "种子分享日快乐！今天所有水果和蔬菜种子都免费。" : "欢迎呀，小禾！今天想带点什么回农场？")}</p><div className={`player indoor-player indoor-shop-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: "0" }}>{renderCarriedItem()}{renderWearables()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div></div>
                  {currentFestival?.id === "seeds" && <><div className="free-seed-festival"><strong>种子分享日 · 全部免费</strong><span>西瓜、番茄、土豆、南瓜、蓝莓等 8 种种子</span><button onClick={takeFreeSeedBundle}>免费领取 8 种种子大礼包</button></div><div className="shop-festival-guests" aria-label="参加种子分享日的居民">{FESTIVAL_GUESTS.map((name, index) => <button key={name} style={personClothesStyle(name)} className={`${name === "安安" ? "anan-character" : ""} ${isNpcSick(name) ? "sick-npc" : ""}`} onClick={() => interactWithPerson(name, `${name}：种子分享日真热闹，大家都领到了喜欢的种子！`)}><i />{name === "安安" && <em className="anan-pigtails" />}<b /><span>{name}</span></button>)}</div></>}
                  <div className="product-grid">
                    {CROP_TYPES.map((crop) => <article className="product-card" key={crop}><span className={`product-icon ${crop}-seeds`}>{CROP_INFO[crop].short}</span><div><strong>{CROP_INFO[crop].name}种子包</strong><small>内含 5 颗种子</small></div><button className={currentFestival?.id === "seeds" ? "free-shop-button" : ""} onClick={() => buyItem(CROP_INFO[crop].seedField)}>{currentFestival?.id === "seeds" ? "免费" : <><span>●</span>{CROP_INFO[crop].seedPrice}</>}</button></article>)}
                    <article className="product-card"><span className="product-icon water-drop">水</span><div><strong>水壶补给</strong><small>立刻补满 12 格水</small></div><button onClick={() => buyItem("water")}><span>●</span>25</button></article>
                    <article className="product-card"><span className="product-icon berry-bread">食</span><div><strong>莓果面包</strong><small>恢复 25 点体力</small></div><button onClick={() => buyItem("snack")}><span>●</span>45</button></article>
                    <article className="product-card"><span className="product-icon soup-bowl">汤</span><div><strong>农家蔬菜汤</strong><small>恢复 50 点体力</small></div><button onClick={() => buyItem("soup")}><span>●</span>75</button></article>
                    <article className="product-card"><span className="product-icon bait-box">饵</span><div><strong>幸运鱼饵盒</strong><small>5 份鱼饵，钓鱼收获翻倍</small></div><button onClick={() => buyItem("bait")}><span>●</span>50</button></article>
                    <article className="product-card"><span className="product-icon sapling-bag">苗</span><div><strong>青绿树苗包</strong><small>让所有树桩重新长成树</small></div><button onClick={() => buyItem("sapling")}><span>●</span>80</button></article>
                    <article className="product-card"><span className="product-icon rock-growth-bag">石</span><div><strong>石头生长包</strong><small>让农场全部 6 块石头重新长出来</small></div><button onClick={() => buyItem("rockGrowth")}><span>●</span>95</button></article>
                  </div>
                  <div className="salvage-shelf-title"><div><strong>山谷拾遗货架</strong><small>地上可能掉落的东西，这里也能找到</small></div><span>种子 · 食物 · 工具 · 药材 · 书 · 稀奇物品</span></div>
                  <div className="product-grid salvage-product-grid">
                    {GROUND_SUPPLIES.map((supply, supplyId) => <article className={`product-card salvage-product supply-${supply.kind}`} key={`shop-ground-${supply.name}`}><span className="product-icon salvage-icon">{supply.short}</span><div><strong>{supply.name}</strong><small>{supply.description}</small></div><button className={supply.kind === "seed" && currentFestival?.id === "seeds" ? "free-shop-button" : ""} onClick={() => buyGroundSupply(supplyId)}>{supply.kind === "seed" && currentFestival?.id === "seeds" ? "免费" : <><span>●</span>{GROUND_SUPPLY_PRICES[supplyId]}</>}</button></article>)}
                    {LOST_BOOKS.map((book, bookId) => { const owned = game.bookBag.includes(bookId) || game.libraryBooks.includes(bookId); return <article className="product-card salvage-product supply-book" key={`shop-book-${book.title}`}><span className="product-icon salvage-icon">{book.short}</span><div><strong>{book.title}</strong><small>可以打开阅读，也可以送给叶老师收藏</small></div><button disabled={owned} onClick={() => buyGroundCollectible("book", bookId)}>{owned ? "已拥有" : <><span>●</span>120</>}</button></article>; })}
                    {RARE_ARTIFACTS.map((artifact, artifactId) => { const owned = game.artifactBag.includes(artifactId) || game.museumArtifacts.includes(artifactId); return <article className="product-card salvage-product supply-artifact" key={`shop-artifact-${artifact.title}`}><span className="product-icon salvage-icon">{artifact.short}</span><div><strong>{artifact.title}</strong><small>{artifact.description}</small></div><button disabled={owned} onClick={() => buyGroundCollectible("artifact", artifactId)}>{owned ? "已收藏" : <><span>●</span>180</>}</button></article>; })}
                  </div>
                  <footer><span>{message}　按 Esc 也可以离开</span><button onClick={leaveBuilding}>从门口出去</button></footer>
                </section>
              </div>
            )}

            {activeBuilding && activeBuilding !== "supermarket" && activeBuilding !== "farmhouse" && (
              <div className={`shop-overlay interior-${activeBuilding}`} role="presentation">
                <section className="service-panel" role="dialog" aria-modal="true" aria-labelledby="building-title">
                  <header>
                    <div><span>青禾镇室内</span><h2 id="building-title">{BUILDING_INFO[activeBuilding].name}</h2></div>
                    <button onClick={leaveBuilding} aria-label={`离开${BUILDING_INFO[activeBuilding].name}`}>×</button>
                  </header>
                  <div className={`interior-room ${activeBuilding === "school" ? "school-classroom" : ""}`} onClick={walkInsidePointer}>
                    <div className="room-window"><i /><i /></div>
                    <div className="room-rug" />
                    <div className="room-furniture"><i /><i /><i /></div>
                    {activeBuilding === "school" && <><div className="school-blackboard"><strong>{isExcursionAvailable ? `今日${excursionName}` : isSchoolDay ? "今日课堂" : "课程表"}</strong><span>{isExcursionAvailable ? `第一次到校可与同学一起去${excursionName}` : isSchoolDay ? ["A B C · 英语", "阅读与写字 · 语文", "加减乘除 · 数学", "种植与浇水 · 农场知识"][Math.floor((game.day - 1) / 2) % 4] : "周一 · 周三 · 周五 · 周日上课"}</span><i /></div>{isExcursionAvailable && <button className="school-bus" onClick={() => useBuildingService("school")}><i /><b /><span>{excursionName}大巴</span><small>与老师同学一起上车</small></button>}<div className="school-desks" aria-label={isSchoolDay ? "同学们坐在课桌前听课" : "今天空着的课桌椅"}>{SCHOOL_STUDENTS.map((student, index) => <button key={student} style={personClothesStyle(student)} className={`classroom-seat seat-${index + 1} ${isSchoolDay ? "student-seated" : "empty-seat"} ${student === "安安" ? "anan-character" : ""}`} disabled={!isSchoolDay} onClick={(event) => { event.stopPropagation(); interactWithPerson(student, `${student}：我正在认真听许老师讲课，今天学到了很多新知识！`); }} aria-label={isSchoolDay ? `${student}坐在课桌前听课` : "空课桌"}><i />{student === "安安" && <strong className="anan-pigtails" />}<em /><b /><span>{isSchoolDay ? student : "空座位"}</span></button>)}</div></>}
                    <button style={personClothesStyle(activeBuildingOwner)} className={`npc-character ${activeReliefWorker ? "clinic-relief-assistant relief-worker" : ""}`} onClick={() => interactWithPerson(activeBuildingOwner, `${activeBuildingOwner}：${activeBuildingGreeting}`)} aria-label={heldItem ? `把${carriedItemName}送给${activeBuildingOwner}` : `和${activeBuildingOwner}交谈`}><span className="npc-hair" /><span className="npc-face" /><span className="npc-body" /></button>
                    {activeReliefWorker && <div className="clinic-relief-note"><strong>{activeReliefWorker.name}代班</strong><span>{originalBuildingOwner}在家休息 · 两人平时住在一起</span></div>}
                    {((activeBuilding === "cafe" && currentFestival?.id === "coffee") || (activeBuilding === "workshop" && currentFestival?.id === "craft")) && <div className={`festival-indoor-guests guests-${activeBuilding}`} aria-label={`参加${currentFestival.name}的居民`}>{FESTIVAL_GUESTS.map((name, index) => <button key={name} style={personClothesStyle(name)} className={`indoor-guest guest-${index + 1} ${name === "安安" ? "anan-character" : ""} ${isNpcSick(name) ? "sick-npc" : ""}`} onClick={() => interactWithPerson(name, `${name}：${currentFestival.name}真热闹，屋里坐满了村民！`)}><i />{name === "安安" && <em className="anan-pigtails" />}<b /><span>{name}</span></button>)}</div>}
                    <div className="interior-counter" />
                    <div className="interior-sign">{activeBuilding === "townhall" ? "公告" : activeBuilding === "clinic" ? "健康" : activeBuilding === "cafe" ? "今日菜单" : activeBuilding === "workshop" ? "制作台" : activeBuilding === "museum" ? "山谷馆藏" : activeBuilding === "school" ? "今日课堂" : "农事图鉴"}</div>
                    <div className={`room-specials special-${activeBuilding}`}>
                      {BUILDING_ITEMS[activeBuilding].map((item) => <button type="button" key={item} onClick={() => inspectBuildingItem(item)}>{item}</button>)}
                      {activeBuilding === "library" && game.libraryBooks.map((bookId) => <button type="button" className="recovered-book" key={`library-book-${bookId}`} onClick={() => inspectBuildingItem(LOST_BOOKS[bookId].title)}>{LOST_BOOKS[bookId].title}</button>)}
                      {activeBuilding === "museum" && game.museumArtifacts.map((artifactId) => <button type="button" className={`museum-case artifact-case-${artifactId + 1}`} key={`museum-artifact-${artifactId}`} onClick={() => inspectBuildingItem(RARE_ARTIFACTS[artifactId].title)}><span className="museum-artifact-thumb"><img src="/museum-artifacts.png" alt="" draggable={false} /></span>{RARE_ARTIFACTS[artifactId].title}</button>)}
                    </div>
                    <div className={`player indoor-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }} aria-label="小禾站在房子里面">{renderCarriedItem()}{renderWearables()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
                  </div>
                  <div className={`service-dialogue ${activeReliefWorker ? "relief-dialogue" : ""}`}><strong>{activeBuildingOwner}{activeReliefWorker ? " · 代班" : ""}</strong><p>{activeBuildingGreeting}</p></div>
                  {inspectedItem && (
                    <div className={`inspection-card ${inspectedArtifactIndex >= 0 ? "artifact-inspection-card" : ""}`}>{inspectedArtifactIndex >= 0 && <div className={`artifact-inspection-image artifact-preview-${inspectedArtifactIndex + 1}`}><img src="/museum-artifacts.png" alt={inspectedItem} draggable={false} /></div>}<div><strong>{inspectedItem}</strong><p>{inspectedItem === "药品柜" ? (!game.diagnosed ? `要先接受${activeBuildingOwner}的免费检查，才能查看药品。` : game.sick ? `里面放着${activeBuildingOwner}刚配好的处方药，价格 50 金币。` : "检查结果不需要用药。") : inspectedItem === "健康档案" && !game.diagnosed ? "还没有检查结果，档案暂时是空白的。" : LOST_BOOKS.find((book) => book.title === inspectedItem)?.content ?? RARE_ARTIFACTS.find((artifact) => artifact.title === inspectedItem)?.description ?? ITEM_DESCRIPTIONS[inspectedItem]}</p></div><button onClick={() => setInspectedItem(null)}>收起</button></div>
                  )}
                  <div className="service-actions">
                    <button onClick={() => useBuildingService(activeBuilding)}>{activeBuilding === "clinic" ? (!game.diagnosed ? `接受${activeBuildingOwner}的免费检查` : game.sick ? `购买${activeBuildingOwner}开的药 · 50 金币` : "检查结果：没有生病") : activeBuilding === "cafe" ? (currentFestival?.id === "coffee" ? "免费领取咖啡和点心" : "购买咖啡套餐 · 35 金币") : activeBuilding === "townhall" ? "查看公告栏" : activeBuilding === "workshop" ? "免费参观手工作品" : activeBuilding === "museum" ? heldItem?.kind === "artifact" ? `捐赠${carriedItemName}` : `查看馆藏 · ${game.museumArtifacts.length}/3` : activeBuilding === "school" ? isExcursionAvailable ? `与同学一起去${excursionName}` : ([0, 2, 4, 6].includes((game.day - 1) % 7) ? "开始听今天的课 · 奖励 50 金币" : "今天停课 · 参观教室") : "翻阅农事图鉴"}</button>
                    <button className="exit-action" onClick={leaveBuilding}>从门口出去</button>
                  </div>
                  <footer><span>{message}</span><small>按 Esc 也可以离开</small></footer>
                </section>
              </div>
            )}

            {busTraveling && (
              <div className="shop-overlay bus-trip-overlay" role="presentation">
                <section className="bus-trip-panel" role="dialog" aria-modal="true" aria-labelledby="bus-trip-title">
                  <header><span>青禾学校 · {excursionName}</span><h2 id="bus-trip-title">大巴正在前往游乐园</h2><small>沿着山谷公路再等一会儿……</small></header>
                  <div className="bus-interior"><div className="bus-driver"><i /><span>司机</span></div><div className="bus-teacher" style={personClothesStyle(activeBuildingOwner || "许老师")}><i /><span>{activeBuildingOwner || "许老师"}</span></div><div className="bus-seats">{SCHOOL_STUDENTS.map((student) => <div key={`bus-${student}`} style={personClothesStyle(student)} className={student === "安安" ? "anan-character" : ""}><i />{student === "安安" && <em className="anan-pigtails" />}<b /><span>{student}</span></div>)}</div><div className="bus-player"><PlayerSprite facing="down" sick={game.sick} /><span>{displayName}</span></div><div className="moving-road"><i /><i /><i /></div></div>
                  <footer><span>老师、同学们和小禾都已经坐好，大巴正在慢慢开往青禾游乐园。</span></footer>
                </section>
              </div>
            )}

            {amusementOpen && (
              <div className="shop-overlay amusement-overlay" role="presentation">
                <section className="amusement-panel" role="dialog" aria-modal="true" aria-labelledby="amusement-title">
                  <header><div><span>青禾学校{excursionName}</span><h2 id="amusement-title">青禾游乐园</h2></div><button onClick={finishExcursion}>×</button></header>
                  <div className="amusement-scene"><div className="ferris-wheel"><i /><i /><i /><i /></div><div className="carousel"><i /><i /><i /></div><div className="park-bus"><i /><b /><span>青禾学校</span></div><div className="park-students">{SCHOOL_STUDENTS.map((student) => <span key={student}>{student}</span>)}</div><button className="park-extra park-fountain" onClick={() => { setMessage("彩色喷泉随着音乐一高一低，同学们在旁边拍了合照。 "); playTone(700); }}><i /><b />音乐喷泉</button><button className="park-extra park-train" onClick={() => { setMessage("小火车绕着游乐园开了一圈，经过花园、摩天轮和点心屋。 "); playTone(620); }}><i /><i /><b />山谷小火车</button><button className="park-extra park-bumper" onClick={() => { setMessage("和同学们玩了碰碰车，大家笑得停不下来！ "); playTone(840); }}><i /><i /><b />碰碰车</button><button className="park-extra park-balloons" onClick={() => { setMessage("气球摊送给大家彩色气球，秋游和春游都变得更热闹了。 "); playTone(780); }}><i /><i /><i /><b />气球摊</button><button className="park-extra park-snacks" onClick={() => { setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 12) })); setMessage("在点心屋吃了棉花糖和小饼干，恢复 12 点体力！ "); playTone(760); }}><i /><b />游园点心屋</button></div>
                  <div className="amusement-actions"><button onClick={() => { setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 10) })); setMessage("坐了一圈摩天轮，从高处看见了整个青禾谷，恢复 10 点体力！"); playTone(820); }}>乘坐摩天轮</button><button onClick={() => { setMessage("旋转木马慢慢转起来，同学们开心地挥手。 "); playTone(760); }}>玩旋转木马</button><button onClick={finishExcursion}>坐大巴回学校</button></div>
                </section>
              </div>
            )}

            {ananBeachTraveling && (
              <div className="shop-overlay anan-beach-travel-overlay" role="presentation">
                <section className="anan-beach-travel-panel" role="dialog" aria-modal="true" aria-label="和安安前往海边">
                  <header><span>每季一次 · 安安的海边邀请</span><h2>先坐巴士，再乘小船出海</h2><small>安安带着雨水桶、小船和潜水服，海风越来越近了……</small></header>
                  <div className="anan-coast-journey"><div className="coast-bus"><i /><i /><b>青禾海岸线</b></div><div className="drifting-boat"><i /><b /><span>安安和小禾</span></div>{(game.day + game.season) % 2 === 0 && <div className="passing-ship"><i /><i /><b>远洋号</b></div>}<div className="trip-luggage"><i /><b /><span>雨水桶 · 螃蟹夹 · 潜水服</span></div></div>
                  <footer>小船在海浪上轻轻漂荡，偶尔还能遇见一艘更大的船。</footer>
                </section>
              </div>
            )}

            {ananBeachOpen && (
              <div className="shop-overlay anan-beach-overlay" role="presentation">
                <section className={`anan-beach-panel ${divingAtSea ? "underwater-mode" : "shore-mode"}`} role="dialog" aria-modal="true" aria-labelledby="anan-beach-title" data-testid="anan-beach-panel">
                  <header><div><span>安安的每季海边旅行</span><h2 id="anan-beach-title">{divingAtSea ? "穿上潜水服 · 海底探索" : sailingWithAnan ? "安安的小船 · 海上漂流" : "青禾海岸 · 沙滩与浅海"}</h2></div><button onClick={() => { setAnanBeachOpen(false); setDivingAtSea(false); setSailingWithAnan(false); setMessage("和安安坐巴士回到了青禾农场。 "); }}>×</button></header>
                  <div className="anan-beach-scene" data-testid="anan-beach-scene" onClick={(event) => { if ((event.target as HTMLElement).closest("button")) return; if (sailingWithAnan && !divingAtSea) { setMessage("小禾正在安安的小船上。点击上方“潜水跳下去”，或者让小船开回沙滩。 "); return; } const bounds = event.currentTarget.getBoundingClientRect(); const nextBeachY = Math.max(divingAtSea ? 22 : 30, Math.min(86, ((event.clientY - bounds.top) / bounds.height) * 100)); setBeachPlayer({ x: Math.max(7, Math.min(93, ((event.clientX - bounds.left) / bounds.width) * 100)), y: nextBeachY }); setMessage(divingAtSea ? "小禾穿着潜水服游到了你点击的位置。 " : nextBeachY < 61 ? "小禾走进海水里游泳啦！ " : "小禾走到了海滩上你点击的位置。 "); }}>
                    <div className="anan-beach-quick-actions" aria-label="海边抓取和下水操作">
                      <button className="crab-catch-action" data-testid="beach-catch-button" disabled={sailingWithAnan && !divingAtSea} onClick={() => divingAtSea ? catchSeaCreature() : catchBeachCrab()}><b>{sailingWithAnan && !divingAtSea ? "先跳下船" : "抓起"}</b><small>靠近螃蟹或小鱼小虾</small></button>
                      {!divingAtSea && !sailingWithAnan && <button data-testid="beach-swim-button" onClick={() => { const goingSwimming = beachPlayer.y >= 61; setBeachPlayer({ x: 48, y: goingSwimming ? 45 : 72 }); setMessage(goingSwimming ? "小禾走进海水里游泳啦！ " : "小禾从浅海游回了沙滩。 "); }}><b>{beachPlayer.y >= 61 ? "走进海水" : "游回沙滩"}</b><small>点击直接切换</small></button>}
                      <button className="beach-dive-action" data-testid="beach-dive-button" onClick={() => { if (divingAtSea) { setDivingAtSea(false); setBeachPlayer({ x: sailingWithAnan ? 48 : 48, y: sailingWithAnan ? 45 : 72 }); setMessage(sailingWithAnan ? "小禾抓住船边，重新爬上安安的小船啦！ " : "脱下潜水服回到沙滩。 "); } else { setDivingAtSea(true); setBeachPlayer({ x: 48, y: 48 }); setMessage(sailingWithAnan ? "小禾从安安的小船上跳进海里，穿着潜水服去抓小虾和小海蟹！ " : "安安把潜水服递给小禾。穿好后直接潜进海里啦！ "); } }}><b>{divingAtSea ? (sailingWithAnan ? "上船" : "返回沙滩") : (sailingWithAnan ? "潜水跳下去" : "穿潜水服")}</b><small>{divingAtSea ? (sailingWithAnan ? "回到安安身边" : "回到岸上") : "下海探索"}</small></button>
                    </div>
                    <div className="beach-sky" /><div className="beach-sea"><i /><i /><i /></div><div className="beach-sand" />
                    {!divingAtSea && <><div className={`beach-small-boat ${sailingWithAnan ? "boat-sailing-with-anan" : ""}`}><i /><b /><em className="boat-second-passenger" /><span>{sailingWithAnan ? "安安和小禾在海上" : "安安的小船"}</span></div>{(game.day + game.season) % 2 === 0 && <div className="beach-big-ship"><i /><i /><b>远处的大船</b></div>}<div className="anan-beach-bucket"><i /><b /><span>雨水桶</span></div>{!sailingWithAnan && <button style={personClothesStyle("安安")} className="anan-beach-friend anan-character" onClick={() => interactWithPerson("安安", "安安：海风好舒服！我们可以抓螃蟹、游泳，也可以坐小船去海上。 ")}><i /><em className="anan-pigtails" /><b /><span>安安</span></button>}{!sailingWithAnan && BEACH_CRABS.map((crab, index) => beachCrabs[index] && <button key={`beach-crab-${index}`} className={`beach-crab crab-${index + 1}`} style={{ left: `${crab.x}%`, top: `${crab.y}%` }} onClick={(event) => { event.stopPropagation(); catchBeachCrab(index); }} aria-label={`第 ${index + 1} 只沙滩螃蟹，靠近后点击抓起`}><i /><i /><b /></button>)}</>}
                    {divingAtSea && <><div className="underwater-rays"><i /><i /><i /></div><div className="coral coral-one"><i /><i /><i /></div><div className="coral coral-two"><i /><i /></div>{BEACH_CRABS.map((creature, index) => { const creatureKind = index % 3; const creatureName = creatureKind === 0 ? "小海鱼" : creatureKind === 1 ? "小虾" : "小海蟹"; return seaCreatures[index] && <button key={`sea-creature-${index}`} className={`sea-creature ${creatureKind === 0 ? "tiny-fish" : creatureKind === 1 ? "tiny-shrimp" : "tiny-sea-crab"}`} style={{ left: `${creature.x}%`, top: `${Math.max(26, creature.y - 18)}%` }} onClick={(event) => { event.stopPropagation(); const seaY = Math.max(26, creature.y - 18); setBeachPlayer({ x: Math.max(7, creature.x - 7), y: seaY }); setMessage(`小禾已经游到${creatureName}旁边了，现在点击上方“抓起”！`); }} aria-label={`${creatureName}，靠近后点击抓起`}><i /><b /></button>; })}</>}
                    {!(sailingWithAnan && !divingAtSea) && <div className={`beach-player facing-${facing} ${isWalking ? "walking" : ""} ${divingAtSea ? "diving-player" : beachPlayer.y < 61 ? "swimming-player" : ""}`} data-testid="beach-player" style={{ left: `${beachPlayer.x}%`, top: `${beachPlayer.y}%` }}><span className="player-shadow" /><PlayerSprite facing={facing} sick={game.sick} />{divingAtSea && <i className="diving-mask" />}</div>}
                  </div>
                  <div className="anan-beach-actions"><button data-testid="beach-boat-button" onClick={() => { if (divingAtSea) { setMessage("先点击上方“上船”，再让小船开动。 "); return; } setSailingWithAnan((current) => !current); setBeachPlayer({ x: 48, y: sailingWithAnan ? 72 : 45 }); setMessage(sailingWithAnan ? "安安把小船开回沙滩，小禾跳回岸上啦！ " : "小禾坐上安安的小船，两个人一起向海上漂去啦！现在可以点上方“潜水跳下去”。 "); }}>{sailingWithAnan ? "小船开回沙滩" : "乘坐安安的小船"}</button><button onClick={fishAtSea}>在小船旁海钓</button><button onClick={() => { setAnanBeachOpen(false); setDivingAtSea(false); setSailingWithAnan(false); setMessage("和安安坐巴士回到了青禾农场。 "); }}>坐巴士回家</button></div>
                  <footer><span>{message}</span><small>键盘、方向按钮或点击画面都能移动</small></footer>
                </section>
              </div>
            )}
          </div>

          <div className="toolbar" aria-label="农具栏">
            <div className="inventory-note"><strong>{scene === "farm" ? "背包" : "小镇背包"}</strong><span>{scene === "farm" ? "选择工具，再点击田地" : "超市可以买到农场补给"}</span></div>
            <div className="toolbar-content">
              <div className="toolbar-primary-row">
                {(Object.keys(TOOL_INFO) as Tool[]).map((tool) => (
                  <button key={tool} className={selected === tool && !selectedResource ? "tool-button selected" : "tool-button"} onClick={() => chooseTool(tool)} aria-pressed={selected === tool && !selectedResource}>
                    <kbd>{TOOL_INFO[tool].key}</kbd><PixelIcon type={tool} /><span>{tool === "seed" ? `${CROP_INFO[selectedCrop].name}种子` : tool === "water" && game.toolUpgrades.water ? "大号洒水壶" : tool === "axe" && game.toolUpgrades.axe ? `精铁斧头 · ${game.toolUpgradeDays.axe}天` : tool === "rod" && game.toolUpgrades.rod ? `幸运鱼竿 · ${game.toolUpgradeDays.rod}天` : TOOL_INFO[tool].name}</span>
                    {tool === "seed" && <b>{game[CROP_INFO[selectedCrop].seedField]}</b>}
                    {tool === "water" && <b>{game.water}</b>}
                    {tool === "rod" && <b>{game.inventory.fish}</b>}
                    {tool === "axe" && <b>{game.wood}</b>}
                  </button>
                ))}
                <div className="selected-hint"><span>{scene === "farm" ? "当前" : "所在地点"}</span><strong>{scene === "farm" ? plantingPinecone ? "拿着松果 · 点击树桩种树" : selectedResource ? `拿着${RESOURCE_INFO[selectedResource].name}` : selected === "rod" ? `鱼竿 · 鱼饵 ${game.bait}` : selected === "seed" ? `${CROP_INFO[selectedCrop].name}种子` : TOOL_INFO[selected].name : sceneLabel}</strong></div>
              </div>
              <div className="crafted-backpack" aria-label="制作物和松果背包"><button className={plantingPinecone ? "crafted-bag-item pinecone-bag-item selected" : "crafted-bag-item pinecone-bag-item"} onClick={clickPinecone} onDoubleClick={doubleClickPinecone} disabled={game.pinecones <= 0} aria-label={`松果 ${game.pinecones} 个，点击选择种树，双击拿起`}><span>果</span><small>松果·种树</small><b>{game.pinecones}</b></button>{(Object.keys(CRAFT_RECIPES) as CraftType[]).map((item) => <button key={`crafted-bag-${item}`} className={`${selectedCraftItem === item ? "crafted-bag-item selected" : "crafted-bag-item"} ${item === "matches" ? "matches-bag-item" : item === "blanket" ? "blanket-bag-item" : ""}`} onClick={item === "matches" ? clickMatches : () => chooseCraftForPlacement(item)} onDoubleClick={item === "matches" ? pickUpMatches : undefined} disabled={game.crafted[item] <= 0} aria-label={`${CRAFT_RECIPES[item].name} ${game.crafted[item]} 个，${item === "matches" ? "点击使用，双击拿起" : item === "blanket" ? "点击盖上休息并恢复体力" : "点击选择摆放"}`}><span>{CRAFT_RECIPES[item].short}</span><small>{CRAFT_RECIPES[item].name}</small><b>{game.crafted[item]}</b></button>)}</div>
            </div>
          </div>
        </section>
      </section>

      <div className="mobile-controls" aria-label="移动控制">
        <button onClick={() => move(-1, 0)} aria-label="向左">←</button>
        <div><button onClick={() => move(0, -1)} aria-label="向上">↑</button><button onClick={() => move(0, 1)} aria-label="向下">↓</button></div>
        <button onClick={() => move(1, 0)} aria-label="向右">→</button>
      </div>
    </main>
  );
}
