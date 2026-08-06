"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";

type Tool = "hoe" | "seed" | "water" | "hand" | "rod" | "axe";
type TileState = "grass" | "soil" | "crop";
type Scene = "farm" | "town" | "cultureDistrict" | "residentialDistrict" | "eastNeighbor" | "southNeighbor" | "northNeighbor";
type NeighborScene = "eastNeighbor" | "southNeighbor" | "northNeighbor";
type ResidentHomeOwner = "白医生" | "阿麦" | "周镇长" | "沈馆长" | "诊所助手" | "许老师";
type BuildingId = "farmhouse" | "supermarket" | "townhall" | "clinic" | "cafe" | "workshop" | "library" | "museum" | "school";
type CropType = "radish" | "strawberry" | "corn" | "watermelon" | "tomato" | "potato" | "pumpkin" | "blueberry";
type StorableResource = CropType | "fish";
type VillageId = "qinghe" | "maple";
type Facing = "down" | "up" | "left" | "right";
type FestivalId = "seeds" | "fishing" | "spring" | "coffee" | "craft";
type SeedField = "seeds" | "strawberrySeeds" | "cornSeeds" | "watermelonSeeds" | "tomatoSeeds" | "potatoSeeds" | "pumpkinSeeds" | "blueberrySeeds";
type CraftType = "chest" | "fence" | "scarecrow" | "lamp" | "bench" | "sign";
type CraftRotation = 0 | 45 | 90;
type PlacedCraft = { id: string; type: CraftType; x: number; y: number; rotation: CraftRotation };
type PlantedTree = { id: string; x: number; y: number; stage: number };
type FencePlacementSlot = { id: string; x: number; y: number; rotation: 0 | 90 };
type ForestItem = "branch" | "pinecone" | "pineNut";
type CarriedItem = { kind: "resource"; id: StorableResource } | { kind: "material"; id: "wood" | "stone" } | { kind: "forest"; id: ForestItem } | { kind: "seed"; id: CropType } | { kind: "herb" } | { kind: "book"; id: number } | { kind: "artifact"; id: number };

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
  day: number;
  season: number;
  hour: number;
  coins: number;
  energy: number;
  seeds: number;
  strawberrySeeds: number;
  cornSeeds: number;
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
  wood: number;
  stone: number;
  herbs: number;
  branches: number;
  pinecones: number;
  pineNuts: number;
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
  watermelon: { name: "西瓜", short: "瓜", seedField: "watermelonSeeds", seedPrice: 120 },
  tomato: { name: "番茄", short: "番", seedField: "tomatoSeeds", seedPrice: 75 },
  potato: { name: "土豆", short: "薯", seedField: "potatoSeeds", seedPrice: 70 },
  pumpkin: { name: "南瓜", short: "南", seedField: "pumpkinSeeds", seedPrice: 130 },
  blueberry: { name: "蓝莓", short: "蓝", seedField: "blueberrySeeds", seedPrice: 100 },
};

const CROP_TYPES = Object.keys(CROP_INFO) as CropType[];

const RESOURCE_INFO: Record<StorableResource, { name: string; energy: number; price: number }> = {
  radish: { name: "萝卜", energy: 8, price: 65 },
  strawberry: { name: "草莓", energy: 12, price: 90 },
  corn: { name: "玉米", energy: 10, price: 80 },
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
  节日公告: "本季有种子分享日、钓鱼节、春日集市、咖啡日和山谷手作日，节日里的种子、咖啡与体验都免费。",
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
const CRAFT_RECIPES: Record<CraftType, { name: string; short: string; description: string; wood: number; stone: number }> = {
  chest: { name: "木箱", short: "箱", description: "摆放后可以存放收获", wood: 8, stone: 0 },
  fence: { name: "木栅栏", short: "栏", description: "8 段围栏能挡住偷吃作物的小动物", wood: 4, stone: 0 },
  scarecrow: { name: "稻草人", short: "田", description: "一个大幅减少乌鸦，两个完全赶走乌鸦", wood: 12, stone: 0 },
  lamp: { name: "农场灯柱", short: "灯", description: "摆在农场，天黑后自动亮起", wood: 6, stone: 4 },
  bench: { name: "休息长椅", short: "椅", description: "装饰农场，坐下可恢复少量体力", wood: 10, stone: 2 },
  sign: { name: "方向木牌", short: "牌", description: "可以横放、竖放或斜放的农场路牌", wood: 5, stone: 1 },
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
  安安: "安安：我在黑板上画了稻草人，老师说它能保护田里的种子。",
};

const VILLAGE_INFO: Record<VillageId, { name: string; farm: string; description: string }> = {
  qinghe: { name: "青禾村", farm: "青禾农场", description: "绿野、溪流与温暖的木屋" },
  maple: { name: "枫叶村", farm: "枫叶农场", description: "红枫、山路与安静的坡地" },
};

const FESTIVAL_SCHEDULE: { day: number; id: FestivalId; name: string; place: string; description: string }[] = [
  { day: 3, id: "seeds", name: "种子分享日", place: "青禾超市", description: "免费领取水果和蔬菜种子大礼包" },
  { day: 6, id: "fishing", name: "钓鱼节", place: "农场钓鱼池", description: "带上鱼竿参加山谷钓鱼比赛" },
  { day: 13, id: "spring", name: "春日集市", place: "中心广场", description: "果酱、木工作品和山谷音乐" },
  { day: 20, id: "coffee", name: "咖啡日", place: "麦香咖啡", description: "品尝咖啡和刚出炉的点心" },
  { day: 27, id: "craft", name: "山谷手作日", place: "木匠工坊", description: "居民一起展示亲手制作的作品" },
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
  day: 1,
  season: 0,
  hour: 7,
  coins: 280,
  energy: 100,
  seeds: 8,
  strawberrySeeds: 0,
  cornSeeds: 0,
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
  inventory: { radish: 0, strawberry: 0, corn: 0, watermelon: 0, tomato: 0, potato: 0, pumpkin: 0, blueberry: 0, fish: 0 },
  chestStorage: { radish: 0, strawberry: 0, corn: 0, watermelon: 0, tomato: 0, potato: 0, pumpkin: 0, blueberry: 0, fish: 0 },
  wood: 0,
  stone: 0,
  herbs: 0,
  branches: 0,
  pinecones: 0,
  pineNuts: 0,
  treeStates: [true, true, true, true],
  plantedTrees: [],
  rockStates: [true, true, true, true, true, true],
  crafted: { chest: 0, fence: 0, scarecrow: 0, lamp: 0, bench: 0, sign: 0 },
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
});

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
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [chestOpen, setChestOpen] = useState(false);
  const [stoveLit, setStoveLit] = useState(false);
  const [neighborInterior, setNeighborInterior] = useState<NeighborScene | null>(null);
  const [residentHome, setResidentHome] = useState<ResidentHomeOwner | null>(null);
  const [festivalDisplay, setFestivalDisplay] = useState<"wood" | null>(null);
  const [festivalMusicPlaying, setFestivalMusicPlaying] = useState(false);
  const [heldItem, setHeldItem] = useState<CarriedItem | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
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
  const walkTimerRef = useRef<number | null>(null);
  const lastMoveAtRef = useRef(0);
  const longPressTriggeredRef = useRef(false);
  const fishingWaitTimerRef = useRef<number | null>(null);
  const fishingBiteTimerRef = useRef<number | null>(null);
  const fishingMarkerTimerRef = useRef<number | null>(null);
  const fishingMarkerDirectionRef = useRef(1);
  const fishingBaitUsedRef = useRef(false);
  const multiplayerStatusRef = useRef({ player, game });
  const splitLeftRef = useRef<HTMLIFrameElement | null>(null);
  const splitRightRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const splitVillage = new URLSearchParams(window.location.search).get("splitVillage");
    const isEmbedded = splitVillage === "qinghe" || splitVillage === "maple";
    const village = splitVillage === "maple" ? "maple" : "qinghe";
    const storageKey = village === "maple" && isEmbedded ? "qinghe-farm-save-maple" : "qinghe-farm-save";
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
            watermelonSeeds: parsed.watermelonSeeds ?? 0,
            tomatoSeeds: parsed.tomatoSeeds ?? 0,
            potatoSeeds: parsed.potatoSeeds ?? 0,
            pumpkinSeeds: parsed.pumpkinSeeds ?? 0,
            blueberrySeeds: parsed.blueberrySeeds ?? 0,
            bait: parsed.bait ?? 0,
            fishCaught: parsed.fishCaught ?? 0,
            inventory: { ...defaults.inventory, ...(parsed.inventory ?? { radish: parsed.harvested ?? 0, fish: parsed.fishCaught ?? 0 }) },
            chestStorage: { ...defaults.chestStorage, ...(parsed.chestStorage ?? {}) },
            wood: parsed.wood ?? 0,
            stone: parsed.stone ?? 0,
            herbs: parsed.herbs ?? 0,
            branches: parsed.branches ?? 0,
            pinecones: parsed.pinecones ?? 0,
            pineNuts: parsed.pineNuts ?? 0,
            groundSupplies: defaults.groundSupplies.map((defaultVisible, index) => parsed.groundSupplies?.[index] ?? defaultVisible),
            treeStates: parsed.treeStates?.length === 4 ? parsed.treeStates : defaults.treeStates,
            plantedTrees: parsed.plantedTrees ?? [],
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
          });
        }
      } catch {
        localStorage.removeItem("qinghe-farm-save");
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

  useEffect(() => () => {
    if (eatTimerRef.current) window.clearTimeout(eatTimerRef.current);
    if (walkTimerRef.current) window.clearTimeout(walkTimerRef.current);
    if (fishingWaitTimerRef.current) window.clearTimeout(fishingWaitTimerRef.current);
    if (fishingBiteTimerRef.current) window.clearTimeout(fishingBiteTimerRef.current);
    if (fishingMarkerTimerRef.current) window.clearInterval(fishingMarkerTimerRef.current);
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

  const move = useCallback((dx: number, dy: number) => {
    if (craftingOpen || chestOpen) return;
    const now = Date.now();
    if (now - lastMoveAtRef.current < 230) return;
    lastMoveAtRef.current = now;
    showWalking(dx, dy);
    if (neighborInterior || residentHome) {
      setIndoorPlayer((current) => ({
        x: Math.max(20, Math.min(80, current.x + dx * 5)),
        y: Math.max(62, Math.min(76, current.y + dy * 4)),
      }));
      setMessage("在居民家里的木地板上走动。 ");
      return;
    }
    if (activeBuilding) {
      setIndoorPlayer((current) => ({
        x: Math.max(26, Math.min(76, current.x + dx * 5)),
        y: Math.max(65, Math.min(74, current.y + dy * 4)),
      }));
      setMessage("小禾在屋里的木地板上走动。");
      return;
    }

    if (scene === "farm" && dx > 0 && player.x === 11) {
      setScene("town");
      setPlayer({ x: 0, y: 5 });
      setMessage("欢迎来到青禾镇！超市在左上方，走到门口就能进去。");
      return;
    }

    if (scene === "town" && dx < 0 && player.x === 0) {
      setScene("farm");
      setPlayer({ x: 11, y: 5 });
      setMessage("回到农场啦。今天还想种些什么？");
      return;
    }

    if (scene === "town" && dx > 0 && player.x === 11) {
      setScene("eastNeighbor");
      setPlayer({ x: 0, y: 5 });
      setMessage("来到林婶的果园小屋，林婶正在门口散步。 ");
      return;
    }
    if (scene === "town" && dy > 0 && player.y === 7) {
      setScene("southNeighbor");
      setPlayer({ x: 6, y: 0 });
      setMessage("来到鲁师傅的山脚院子，木料堆得整整齐齐。 ");
      return;
    }
    if (scene === "town" && dy < 0 && player.y === 0) {
      setScene("cultureDistrict");
      setPlayer({ x: 6, y: 7 });
      setMessage("来到清河文化街，镇公所在左边，青禾博物馆在右边。继续向上可以去北林书屋。 ");
      return;
    }
    if (scene === "cultureDistrict" && dy < 0 && player.y === 0) {
      setScene("northNeighbor");
      setPlayer({ x: 6, y: 7 });
      setMessage("穿过文化街后面的林间小路，来到叶老师的北林书屋。 ");
      return;
    }
    if (scene === "cultureDistrict" && dy > 0 && player.y === 7) {
      setScene("town");
      setPlayer({ x: 6, y: 0 });
      setMessage("沿着石板路回到青禾镇中心街。 ");
      return;
    }
    if (scene === "cultureDistrict" && dx > 0 && player.x === 11) {
      setScene("residentialDistrict");
      setPlayer({ x: 0, y: 5 });
      setMessage("沿着文化街右侧的小路来到青禾住宅坡，每位居民都有自己的院地和房子。 ");
      return;
    }
    if (scene === "residentialDistrict" && dx < 0 && player.x === 0) {
      setScene("cultureDistrict");
      setPlayer({ x: 11, y: 5 });
      setMessage("从青禾住宅坡回到清河文化街。 ");
      return;
    }
    if (scene === "eastNeighbor" && dx > 0 && player.x === 11 && worldVillage === "qinghe") {
      const friend = onlinePlayers.find((onlinePlayer) => onlinePlayer.deviceId !== multiplayerSession?.deviceId && onlinePlayer.online && onlinePlayer.currentVillage === "maple");
      setWorldVillage("maple");
      setScene(friend?.scene ?? "farm");
      setPlayer(friend ? { x: Math.max(0, Math.min(11, friend.x - 1)), y: friend.y } : { x: 0, y: 5 });
      setMessage(friend ? `沿着右边山路到了枫叶村，一进村就看见了${friend.playerName}！` : "沿着右边山路走到了枫叶村！朋友来到同一个场景后就会出现。 ");
      return;
    }
    if (scene === "farm" && dx < 0 && player.x === 0 && worldVillage === "maple") {
      const friend = onlinePlayers.find((onlinePlayer) => onlinePlayer.deviceId !== multiplayerSession?.deviceId && onlinePlayer.online && onlinePlayer.currentVillage === "qinghe");
      setWorldVillage("qinghe");
      setScene(friend?.scene ?? "farm");
      setPlayer(friend ? { x: Math.max(0, Math.min(11, friend.x + 1)), y: friend.y } : { x: 11, y: 5 });
      setMessage(friend ? `沿着左边山路到了青禾村，一进村就看见了${friend.playerName}！` : "沿着左边山路到了青禾村。朋友来到同一个场景后就会出现。 ");
      return;
    }
    if (scene === "eastNeighbor" && dx < 0 && player.x === 0) {
      setScene("town"); setPlayer({ x: 11, y: 5 }); setMessage("回到青禾镇中心街。"); return;
    }
    if (scene === "southNeighbor" && dy < 0 && player.y === 0) {
      setScene("town"); setPlayer({ x: 6, y: 7 }); setMessage("回到青禾镇中心街。"); return;
    }
    if (scene === "northNeighbor" && dy > 0 && player.y === 7) {
      setScene("cultureDistrict"); setPlayer({ x: 6, y: 0 }); setMessage("从北林书屋回到清河文化街。 "); return;
    }

    const next = {
      x: Math.max(0, Math.min(11, player.x + dx)),
      y: Math.max(0, Math.min(7, player.y + dy)),
    };
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
  }, [activeBuilding, chestOpen, craftingOpen, game.day, game.npcHealedDays, multiplayerSession?.deviceId, neighborInterior, onlinePlayers, player, residentHome, scene, showWalking, worldVillage]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (splitScreen && !embeddedMode) {
        if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault();
        if (["w", "a", "s", "d"].includes(key)) splitLeftRef.current?.contentWindow?.postMessage({ type: "split-move", key }, window.location.origin);
        if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) splitRightRef.current?.contentWindow?.postMessage({ type: "split-move", key }, window.location.origin);
        return;
      }
      if (key === "escape" && builderOpen) {
        setBuilderOpen(false);
        setMessage("收起鲁师傅的扩建委托。 ");
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
      if (key === "escape" && chestOpen) {
        setChestOpen(false);
        setMessage("关上木箱。");
        return;
      }
      if (key === "escape" && craftingOpen) {
        setCraftingOpen(false);
        setMessage("收起制作手册。");
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
  }, [activeBuilding, builderOpen, chestOpen, craftingOpen, embeddedMode, move, neighborInterior, residentHome, splitScreen]);

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
    setMessage("山谷乐队开始演奏啦，居民们跟着节拍跳起舞来！");
    try {
      const context = new window.AudioContext();
      const melody = [523, 659, 784, 659, 587, 698, 880, 784, 659, 523];
      melody.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startsAt = context.currentTime + index * .23;
        oscillator.type = index % 3 === 0 ? "triangle" : "square";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.035, startsAt);
        gain.gain.exponentialRampToValueAtTime(.001, startsAt + .2);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(startsAt);
        oscillator.stop(startsAt + .21);
      });
      window.setTimeout(() => { setFestivalMusicPlaying(false); void context.close(); }, 2_600);
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
      branches: current.branches + 2,
      pinecones: current.pinecones + 1,
      pineNuts: current.pineNuts + 2,
      treeStates: current.treeStates.map((tree, treeIndex) => treeIndex === index ? false : tree),
      daily: { ...current.daily, chopped: current.daily.chopped + 1 },
    }));
    setMessage(`砍下树木，获得 ${game.toolUpgrades.axe ? 6 : 4} 块木头、2 根树枝、1 个松果和 2 颗松子！松果能重新种树，松子可以吃。`);
    playTone(330);
  };

  const chopPlantedTree = (tree: PlantedTree) => {
    if (tree.stage < 3) {
      setMessage(`这棵松树还在生长，现在是第 ${tree.stage + 1} 阶段，再等 ${3 - tree.stage} 天就会长成大树。`);
      playTone(420);
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
      branches: current.branches + 2,
      pinecones: current.pinecones + 1,
      pineNuts: current.pineNuts + 2,
      plantedTrees: current.plantedTrees.filter((plantedTree) => plantedTree.id !== tree.id),
      daily: { ...current.daily, chopped: current.daily.chopped + 1 },
    }));
    setMessage("长大的松树被砍下，获得木头、树枝、松果和松子。它空出的位置还能再种松果。 ");
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
    if (game.wood < recipe.wood || game.stone < recipe.stone) {
      setMessage(`制作${recipe.name}需要 ${recipe.wood} 木头${recipe.stone ? `和 ${recipe.stone} 石材` : ""}，材料还不够。`);
      playTone(220);
      return;
    }

    setGame((current) => ({
      ...current,
      wood: current.wood - recipe.wood,
      stone: current.stone - recipe.stone,
      crafted: { ...current.crafted, [item]: current.crafted[item] + 1 },
    }));
    setMessage(`制作完成：${recipe.name}！已经放进下方背包，选中后再点击农场位置摆放。`);
    playTone(700);
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

  const forestItemCount = (item: ForestItem) => item === "branch" ? game.branches : item === "pinecone" ? game.pinecones : game.pineNuts;
  const forestItemName = (item: ForestItem) => item === "branch" ? "树枝" : item === "pinecone" ? "松果" : "松子";

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

  const carriedItemName = heldItem ? heldItem.kind === "material" ? (heldItem.id === "wood" ? "木头" : "石材") : heldItem.kind === "forest" ? forestItemName(heldItem.id) : heldItem.kind === "resource" ? RESOURCE_INFO[heldItem.id].name : heldItem.kind === "seed" ? `${CROP_INFO[heldItem.id].name}种子包` : heldItem.kind === "herb" ? "药材" : heldItem.kind === "book" ? LOST_BOOKS[heldItem.id].title : RARE_ARTIFACTS[heldItem.id].title : "";
  const carriedItemShort = heldItem ? heldItem.kind === "material" ? (heldItem.id === "wood" ? "木" : "石") : heldItem.kind === "forest" ? (heldItem.id === "branch" ? "枝" : heldItem.id === "pinecone" ? "果" : "子") : heldItem.kind === "resource" ? (heldItem.id === "fish" ? "鱼" : CROP_INFO[heldItem.id].short) : heldItem.kind === "seed" ? CROP_INFO[heldItem.id].short : heldItem.kind === "herb" ? "药" : heldItem.kind === "book" ? LOST_BOOKS[heldItem.id].short : RARE_ARTIFACTS[heldItem.id].short : "";
  const carriedItemClass = heldItem ? heldItem.kind === "material" ? heldItem.id : heldItem.kind === "forest" ? heldItem.id : heldItem.kind === "resource" ? heldItem.id : heldItem.kind === "seed" ? `${heldItem.id}-seeds` : heldItem.kind === "herb" ? "herb" : heldItem.kind === "book" ? "book" : "artifact" : "";
  const renderCarriedItem = () => heldItem ? <span className={`held-overhead held-${carriedItemClass}`} title={carriedItemName}>{carriedItemShort}</span> : null;

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
        const field = heldItem.id === "branch" ? "branches" : heldItem.id === "pinecone" ? "pinecones" : "pineNuts";
        next = { ...current, [field]: Math.max(0, current[field] - 1) };
      } else if (heldItem.kind === "seed") {
        const field = CROP_INFO[heldItem.id].seedField;
        next = { ...current, [field]: Math.max(0, current[field] - 1) };
      } else if (heldItem.kind === "herb") next = { ...current, herbs: Math.max(0, current.herbs - 1) };
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

  const interactWithPerson = (person: string, fallback: string) => {
    if (giveHeldItem(person)) return;
    if (NPC_SICK_DAYS[person]?.includes(game.day) && game.npcHealedDays[person] !== game.day) {
      setMessage(`${person}今天有些不舒服，露出了伤心的表情：“我休息一天，明天应该就会好起来。”`);
      playTone(300);
      return;
    }
    setMessage(PERSON_DIALOGUES[person] ?? fallback);
    playTone(520);
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
    const installed = item === "house" ? ["暖光灯", "自动水箱", "料理台"][houseLevel] : item === "field" ? "8 格新农田" : item === "storage" ? "自动售卖加价 10% 的仓库" : item === "greenhouse" ? "每天自动照料作物的温室" : item === "pond" ? "每次多钓 1 条鱼的大鱼塘" : item === "stoneWall" ? "阻挡小动物的农场石墙" : "更宽敞的农场地盘";
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
    if (game.crafted.fence <= 1) setSelectedCraftItem(null);
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
      if (count === 1) setSelectedResource(null);
      setMessage(`把 1 个${name}放进木箱。现在箱内共有 ${Object.values(game.chestStorage).reduce((sum, value) => sum + value, 0) + 1} 件物品。`);
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

  const actOnTile = (index: number) => {
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
        if (tile.state !== "grass") {
          feedback = "这里已经开垦过了。";
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

  const buyItem = (item: SeedField | "water" | "snack" | "soup" | "bait" | "sapling" | "rockGrowth") => {
    const seedCrop = CROP_TYPES.find((crop) => CROP_INFO[crop].seedField === item);
    const details = seedCrop ? {
      price: game.day === 3 ? 0 : CROP_INFO[seedCrop].seedPrice,
      success: `${game.day === 3 ? "种子分享日免费领到" : "买到"} 5 颗${CROP_INFO[seedCrop].name}种子！在种子工具上再次点击即可切换。`,
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
    const price = supply.kind === "seed" && game.day === 3 ? 0 : GROUND_SUPPLY_PRICES[supplyId];
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
    setActiveBuilding(null);
    setInspectedItem(null);
    setPlayer(building.exit);
    setMessage(`离开${building.name}，回到${activeBuilding === "townhall" || activeBuilding === "museum" ? "清河文化街" : "中心街"}。`);
  };

  const returnToFarm = () => {
    cancelFishing();
    setActiveBuilding(null);
    setInspectedItem(null);
    setCraftingOpen(false);
    setChestOpen(false);
    setBuilderOpen(false);
    setNeighborInterior(null);
    setResidentHome(null);
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
    setCraftingOpen(false);
    setChestOpen(false);
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
      if (game.day === 20) {
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
      setMessage("本季公告：第 3 天种子分享日在超市；第 6 天钓鱼节在鱼塘；第 13 天春日集市在广场；第 20 天咖啡日；第 27 天手作日。节日物品和体验免费！");
      playTone(520);
    } else if (building === "workshop") {
      setFestivalDisplay("wood");
      setMessage("免费参观鲁师傅的手工作品：鸟屋、小木马和山谷木雕都摆在展示台上。 ");
      playTone(440);
    } else if (building === "school") {
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
    const nextDayNumber = game.day === 28 ? 1 : game.day + 1;
    const nextSeason = game.day === 28 ? (game.season + 1) % SEASONS.length : game.season;
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
    const visitorMessage = farmVisitor === "crow"
      ? placedScarecrows === 1 ? " 一只乌鸦还是偶尔飞来吃掉了 1 株幼苗；再放一个稻草人就能完全防住。" : " 一群乌鸦飞进农田，吃掉了 1 株幼苗；放稻草人可以保护作物。"
      : farmVisitor === "animal"
        ? " 一只小动物跑进农田吃掉了 1 株幼苗；围满 8 段栅栏或修建石墙就能挡住它。"
        : "";
    const morningMessageBase = becameSick
      ? "早上七点醒来，小禾看起来没什么精神，嘴角变成了伤心的样子。"
      : remainsSick
        ? "早上七点了，小禾的表情仍然有些伤心。"
        : `早上七点了！${game.day === 28 ? `新的${SEASONS[nextSeason]}开始了。` : ""}浇过水的作物长大了，松果树苗也长高了一点。`;
    const morningMessage = `${expiringTools.length ? `${morningMessageBase} ${expiringTools.join("和")}的一周使用期到了，已经恢复成普通工具。` : morningMessageBase}${visitorMessage}`;
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
      return {
        ...current,
        day: nextDayNumber,
        season: nextSeason,
        hour: 7,
        daily: { ...makeNewGame().daily, day: nextDayNumber },
        energy: remainsSick ? 65 : 100,
        sick: remainsSick,
        diagnosed: false,
        lastIllnessDay: becameSick ? nextDayNumber : current.lastIllnessDay,
        water: current.toolUpgrades.water ? 18 : 12,
        toolUpgrades,
        toolUpgradeDays,
        farmVisitor,
        treeStates,
        plantedTrees: current.plantedTrees.map((tree) => ({ ...tree, stage: Math.min(3, tree.stage + 1) })),
        rockStates,
        groundBooks,
        groundArtifacts,
        groundSupplies,
        tiles: current.tiles.map((tile, index) => index === eatenCropIndex
          ? { state: "soil", stage: 0, watered: false }
          : tile.state === "crop"
            ? { ...tile, stage: tile.watered || current.upgrades.greenhouse ? Math.min(3, tile.stage + 1) : tile.stage, watered: false }
            : tile),
      };
    });
    setMessage(morningMessage);
    playTone(540);
  };

  const sleepAtHome = () => {
    nextDay();
    setActiveBuilding(null);
    setPlayer(BUILDING_INFO.farmhouse.exit);
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
    setSelectedResource(null);
    setSelectedCraftItem(null);
    setPlantingPinecone(false);
    setResidentHome(null);
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
      setWorldVillage(result.village);
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
    setWorldVillage("qinghe");
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
  const activeVillage = worldVillage;
  const activeVillageInfo = VILLAGE_INFO[activeVillage];
  const partner = onlinePlayers.find((onlinePlayer) => onlinePlayer.deviceId !== multiplayerSession?.deviceId);
  const dailyWoodcraftIndex = (game.day - 1) % DAILY_WOODCRAFTS.length;
  const dailyWoodcraft = DAILY_WOODCRAFTS[dailyWoodcraftIndex];
  const inspectedArtifactIndex = RARE_ARTIFACTS.findIndex((artifact) => artifact.title === inspectedItem);
  const currentFestival = FESTIVAL_SCHEDULE.find((festival) => festival.day === game.day) ?? null;
  const nextFestival = FESTIVAL_SCHEDULE.find((festival) => festival.day >= game.day) ?? FESTIVAL_SCHEDULE[0];
  const daysUntilFestival = nextFestival.day >= game.day ? nextFestival.day - game.day : 28 - game.day + nextFestival.day;
  const displayName = multiplayerSession?.playerName ?? "小禾";
  const sceneLabel = scene === "farm" ? activeVillageInfo.farm : scene === "town" ? `${activeVillageInfo.name} · 中心街` : scene === "cultureDistrict" ? `${activeVillageInfo.name} · 清河文化街` : scene === "residentialDistrict" ? `${activeVillageInfo.name} · 青禾住宅坡` : scene === "eastNeighbor" ? "东郊 · 林婶的果园小屋" : scene === "southNeighbor" ? "南坡 · 鲁师傅的院子" : "北林 · 叶老师的书屋";
  const isNpcSick = (name: string) => (NPC_SICK_DAYS[name]?.includes(game.day) ?? false) && game.npcHealedDays[name] !== game.day;
  const doctorIsRestingAtHome = isNpcSick("白医生");
  const activeBuildingOwner = activeBuilding === "clinic" && doctorIsRestingAtHome ? "红衣助手" : activeBuilding ? BUILDING_INFO[activeBuilding].owner : "";
  const activeBuildingGreeting = activeBuilding === "clinic" && doctorIsRestingAtHome
    ? "白医生今天生病了，正在自己的家里休息。我穿红色制服来诊所代班，检查和开药都可以正常进行。"
    : activeBuilding ? BUILDING_INFO[activeBuilding].greeting : "";
  const residentHomeInfo = residentHome ? RESIDENT_HOMES.find((home) => home.owner === residentHome) ?? null : null;
  const residentHomeGreeting = residentHome === "白医生" && doctorIsRestingAtHome
    ? "我今天生病了，所以留在自己的家里休息。谢谢你来看我，诊所由穿红色制服的助手代班。"
    : residentHomeInfo?.greeting ?? "";

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
    } else {
      setScene("town"); setPlayer({ x: 3, y: 6 }); setActiveBuilding("workshop"); setMessage("山谷手作日开始啦！居民们正在展示亲手制作的作品。 ");
    }
  };

  const walkToPointer = (event: MouseEvent<HTMLDivElement>) => {
    if (activeBuilding || neighborInterior || residentHome || craftingOpen || chestOpen || multiplayerOpen || builderOpen || festivalDisplay) return;
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
      const plantedTree: PlantedTree = { id: `pine-tree-${Date.now()}`, x: treeX, y: treeY, stage: 0 };
      setGame((current) => ({ ...current, pinecones: Math.max(0, current.pinecones - 1), plantedTrees: [...current.plantedTrees, plantedTree] }));
      if (game.pinecones <= 1) setPlantingPinecone(false);
      setMessage("松果种进绿色草地里了！现在是一棵小树苗，每睡一天都会长大一点。 ");
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
      const placed: PlacedCraft = { id: `${selectedCraftItem}-${Date.now()}`, type: selectedCraftItem, x: Math.max(5, Math.min(94, percentX)), y: Math.max(18, Math.min(86, percentY)), rotation: craftRotation };
      setGame((current) => ({ ...current, crafted: { ...current.crafted, [selectedCraftItem]: Math.max(0, current.crafted[selectedCraftItem] - 1) }, placedCrafts: [...current.placedCrafts, placed] }));
      if (game.crafted[selectedCraftItem] <= 1) setSelectedCraftItem(null);
      setMessage(`${CRAFT_RECIPES[selectedCraftItem].name}已经摆放到农场！${selectedCraftItem === "fence" ? "继续摆满 8 段围栏，小动物就进不来了。" : selectedCraftItem === "scarecrow" ? "摆两个稻草人后，乌鸦就不会再来。" : ""}`);
      playTone(720);
      return;
    }
    const destination = { x: Math.max(0, Math.min(11, Math.round((percentX - 4) / 7.7))), y: Math.max(0, Math.min(7, Math.round((percentY - 8) / 10.5))) };
    showWalking(destination.x - player.x, destination.y - player.y);
    setPlayer(destination);
    setMessage("小禾走到了你点击的位置。 ");
  };

  const walkInsidePointer = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
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
      <header className="topbar">
        <div className="brand-lockup">
          <button className="brand-mark" onClick={() => setBrandMenuOpen((open) => !open)} aria-label="打开青禾谷菜单" aria-expanded={brandMenuOpen}><i /><i /><i /></button>
          <div><strong>青禾谷</strong><span>GREENFIELD VALLEY</span></div>
          {brandMenuOpen && <div className="brand-menu"><span>青禾谷村庄菜单</span><strong>想做什么？</strong><button onClick={() => { setMapOpen(true); setBrandMenuOpen(false); }}><i className="mini-map-icon" /><b>打开小地图</b><small>查看场景和建筑</small></button><button className="brand-craft-entry" onClick={() => { setCraftingOpen(true); setBrandMenuOpen(false); setMessage("打开制作手册，选择想做的东西。"); }}><i className="mini-craft-icon">⚒</i><b>打开制作</b><small>使用木头和石材做东西</small></button></div>}
        </div>
        <div className="day-card">
          <span className={`season-dot season-dot-${game.season}`}>{SEASON_SHORT[game.season]}</span>
          <div><strong>{SEASONS[game.season]}第 {game.day} 天 · {WEEKDAYS[(game.day - 1) % 7]}</strong><span>{String(clockHour).padStart(2, "0")}:{String(clockMinute).padStart(2, "0")}</span></div>
        </div>
        <div className="top-stats">
          <div className={`weather ${isNight ? "night-weather" : ""}`}><span className={isNight ? "moon-icon" : "sun-icon"} />{isNight ? "月夜" : "晴朗"} <small>{isNight ? "12°C" : "18°C"}</small></div>
          <div className="coins"><span>●</span>{game.coins.toLocaleString()}</div>
          <button className="multiplayer-button" onClick={() => setSplitScreen(true)}>双人模式</button>
          <button className="cloud-transfer-button" onClick={transferSaveToWeb} disabled={transferringSave}>{transferringSave ? "转移中…" : "转移到网页版"}</button>
          <button className="round-button home-button" onClick={returnToFarm} aria-label="回到农场" title="回到农场">⌂</button>
          <button className="round-button" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "关闭音效" : "打开音效"}>{soundOn ? "♪" : "×"}</button>
          <button className="round-button" onClick={resetGame} aria-label="重新开始">↻</button>
        </div>
      </header>

      {mapOpen && <div className="map-overlay" role="presentation">
        <section className="village-map-panel" role="dialog" aria-modal="true" aria-labelledby="village-map-title">
          <header><div><span>按照游戏实际道路绘制</span><h2 id="village-map-title">青禾谷实际地图</h2></div><button onClick={() => setMapOpen(false)} aria-label="关闭地图">×</button></header>
          <div className="village-map-canvas">
            <i className="map-river" /><i className="actual-route route-farm-town" /><i className="actual-route route-town-east" /><i className="actual-route route-east-maple" /><i className="actual-route route-town-culture" /><i className="actual-route route-culture-north" /><i className="actual-route route-culture-residential" /><i className="actual-route route-town-south" /><i className="map-tree-cluster tree-cluster-one" /><i className="map-tree-cluster tree-cluster-two" />
            <button className={`map-place map-farm ${activeVillage === "qinghe" && scene === "farm" ? "you-are-here" : ""}`} onClick={() => { setWorldVillage("qinghe"); travelFromMap("farm", { x: 8, y: 5 }, "青禾农场"); }}><i className="map-scene-picture picture-farm"><em /><em /><em /></i><b>青禾农场</b><span>农舍 · 农田 · 鱼塘</span></button>
            <button className={`map-place map-town ${activeVillage === "qinghe" && scene === "town" ? "you-are-here" : ""}`} onClick={() => { setWorldVillage("qinghe"); travelFromMap("town", { x: 5, y: 5 }, "中心街"); }}><i className="map-scene-picture picture-town"><em /><em /><em /></i><b>中心街</b><span>商店和居民建筑</span></button>
            <button className={`map-place map-culture ${activeVillage === "qinghe" && scene === "cultureDistrict" ? "you-are-here" : ""}`} onClick={() => { setWorldVillage("qinghe"); travelFromMap("cultureDistrict", { x: 6, y: 7 }, "清河文化街"); }}><i className="map-scene-picture picture-culture"><em /><em /><em /></i><b>清河文化街</b><span>镇公所 · 学校 · 博物馆</span></button>
            <button className={`map-place map-east ${activeVillage === "qinghe" && scene === "eastNeighbor" ? "you-are-here" : ""}`} onClick={() => { setWorldVillage("qinghe"); travelFromMap("eastNeighbor", { x: 3, y: 5 }, "林婶的果园小屋"); }}><i className="map-scene-picture picture-orchard"><em /><em /><em /></i><b>东郊果园</b><span>林婶家</span></button>
            <button className={`map-place map-maple ${activeVillage === "maple" ? "you-are-here" : ""}`} onClick={() => { setWorldVillage("maple"); travelFromMap("farm", { x: 1, y: 5 }, "枫叶村"); }}><i className="map-scene-picture picture-maple"><em /><em /><em /></i><b>枫叶村</b><span>从东郊继续向右</span></button>
            <button className={`map-place map-south ${activeVillage === "qinghe" && scene === "southNeighbor" ? "you-are-here" : ""}`} onClick={() => { setWorldVillage("qinghe"); travelFromMap("southNeighbor", { x: 6, y: 3 }, "鲁师傅的院子"); }}><i className="map-scene-picture picture-workshop"><em /><em /><em /></i><b>南坡院子</b><span>鲁师傅家</span></button>
            <button className={`map-place map-north ${activeVillage === "qinghe" && scene === "northNeighbor" ? "you-are-here" : ""}`} onClick={() => { setWorldVillage("qinghe"); travelFromMap("northNeighbor", { x: 6, y: 5 }, "叶老师的书屋"); }}><i className="map-scene-picture picture-library"><em /><em /><em /></i><b>北林书屋</b><span>叶老师家</span></button>
            <button className={`map-place map-residential ${activeVillage === "qinghe" && scene === "residentialDistrict" ? "you-are-here" : ""}`} onClick={() => { setWorldVillage("qinghe"); travelFromMap("residentialDistrict", { x: 2, y: 5 }, "青禾住宅坡"); }}><i className="map-scene-picture picture-residential"><em /><em /><em /></i><b>青禾住宅坡</b><span>白医生 · 阿麦 · 周镇长 · 沈馆长 · 助手 · 许老师</span></button>
            <div className="map-legend"><span><i />你现在的位置</span><small>点击地图上的场景图可以直接前往</small></div>
          </div>
          <footer><span>中心街向上到文化街；文化街向上去北林，向右就到每位居民都有独立院地的青禾住宅坡。</span><button onClick={() => setMapOpen(false)}>收起地图</button></footer>
        </section>
      </div>}

      <section className="game-layout">
        <aside className="side-panel">
          <div className="portrait-card">
            <div className="portrait"><img src={game.sick ? "/xiaohe-sick-sprite.png" : "/xiaohe-sprite.png"} alt="小禾" draggable={false} /></div>
            <div><span>新手农夫</span><strong>{displayName}</strong></div>
          </div>
          {multiplayerSession && <div className="multiplayer-status-card"><div><span>双人村庄</span><button onClick={() => setMultiplayerOpen(true)}>查看</button></div><strong>{activeVillageInfo.name} · {multiplayerSession.roomCode}</strong><small>{partner ? `${partner.online ? "● 在线" : "○ 离线"} ${partner.playerName}住在${VILLAGE_INFO[partner.village].name}` : "等待另一位玩家加入"}</small></div>}
          <button className={`festival-card ${currentFestival ? "festival-open" : ""}`} onClick={() => { if (currentFestival) goToFestival(); else setMessage(`下一场是${nextFestival.name}，第 ${nextFestival.day} 天${WEEKDAYS[(nextFestival.day - 1) % 7]}在${nextFestival.place}举行，还有 ${daysUntilFestival} 天。`); }}><span>{currentFestival ? "今日活动" : "下一场活动"}</span><strong>{(currentFestival ?? nextFestival).name}</strong><small>{currentFestival ? `正在${currentFestival.place}举行 · 点击前往` : `第 ${nextFestival.day} 天${WEEKDAYS[(nextFestival.day - 1) % 7]} · 还有 ${daysUntilFestival} 天`}</small></button>
          <div className="meter-block">
            <div className="meter-label"><span>体力</span><b>{game.energy}/100</b></div>
            <div className="meter"><i style={{ width: `${game.energy}%` }} /></div>
          </div>
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
              <button className={heldItem?.kind === "forest" && heldItem.id === "branch" ? "resource-item held-material" : "resource-item"} onDoubleClick={() => pickUpForestItem("branch")} title="砍树掉落，双击拿起"><span className="harvest-icon branch-icon">枝</span><p>树枝<strong>{game.branches}</strong><small>双击拿起</small></p></button>
              <button className={heldItem?.kind === "forest" && heldItem.id === "pineNut" ? "resource-item held-material" : "resource-item"} onClick={clickPineNut} onDoubleClick={doubleClickPineNut} title="单击吃掉恢复体力，双击拿起"><span className="harvest-icon pine-nut-icon">子</span><p>松子<strong>{game.pineNuts}</strong><small>单击吃 · 双击拿</small></p></button>
              <button className={heldItem?.kind === "herb" ? "resource-item herb-record held-material" : "resource-item herb-record"} onClick={clickHerb} onDoubleClick={pickUpHerb} aria-label={`药材 ${game.herbs} 份，生病时单击使用，双击拿起送人`} title="生病时单击使用，双击拿起送人"><span className="harvest-icon herb-icon">药</span><p>药材<strong>{game.herbs}</strong><small>{game.sick ? "单击用 · 双击拿" : "双击拿起"}</small></p></button>
              {game.bookBag.map((bookId) => <button key={`bag-book-${bookId}`} className={heldItem?.kind === "book" && heldItem.id === bookId ? "resource-item held-material" : "resource-item"} onClick={() => setMessage(`${LOST_BOOKS[bookId].title}：${LOST_BOOKS[bookId].content}`)} onDoubleClick={() => carryLostBook(bookId)} title="点击阅读，双击拿起来送给叶老师"><span className="harvest-icon book-icon">书</span><p>{LOST_BOOKS[bookId].title}<strong>1</strong><small>双击拿起</small></p></button>)}
              {game.artifactBag.map((artifactId) => <button key={`bag-artifact-${artifactId}`} className={heldItem?.kind === "artifact" && heldItem.id === artifactId ? "resource-item held-material" : "resource-item"} onClick={() => setMessage(`${RARE_ARTIFACTS[artifactId].title}：${RARE_ARTIFACTS[artifactId].description}`)} onDoubleClick={() => carryArtifact(artifactId)} title="点击查看，双击拿起来送到博物馆"><span className={`harvest-icon artifact-icon artifact-icon-${artifactId + 1}`}>{RARE_ARTIFACTS[artifactId].short}</span><p>{RARE_ARTIFACTS[artifactId].title}<strong>1</strong><small>双击拿起</small></p></button>)}
            </div>
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
          <button className="sleep-button" onClick={nextDay}><span>☾</span><div><strong>结束今天</strong><small>回家睡一觉</small></div><b>›</b></button>
        </aside>

        <section className="world-card" aria-label={`${sceneLabel}游戏区域`}>
          <div className={`world ${scene === "farm" ? "farm-world" : scene === "town" ? "town-world" : scene === "cultureDistrict" ? "culture-world" : scene === "residentialDistrict" ? "residential-world" : "neighbor-world"} ${activeVillage}-village season-${game.season} ${twilightLevel > 0 ? "twilight-world" : ""}`} style={{ "--twilight": twilightLevel } as CSSProperties} onClick={walkToPointer}>
            <div className="location-chip"><span>{scene === "farm" ? "⌂" : scene === "cultureDistrict" ? "▣" : scene === "residentialDistrict" ? "屋" : "◆"}</span>{sceneLabel}</div>
            <div className="cloud cloud-one" /><div className="cloud cloud-two" />
            <div className="mountain mountain-one" /><div className="mountain mountain-two" />
            {twilightLevel > 0 && <div className="night-sky" aria-hidden="true"><span className="moon" /><i /><i /><i /><i /><i /><i /></div>}
            {twilightLevel > 0 && <div className="twilight-layer" aria-hidden="true" />}
            <div className={`outdoor-lamps outdoor-lamps-${scene}`} aria-hidden="true"><i /><i /><i /><i /></div>
            {selectedCraftItem && scene === "farm" && <div className="placement-controls" onClick={(event) => event.stopPropagation()}><strong>正在摆放：{CRAFT_RECIPES[selectedCraftItem].name}</strong>{(selectedCraftItem === "sign" || selectedCraftItem === "bench") && <div><button className={craftRotation === 0 ? "selected" : ""} onClick={() => setCraftRotation(0)}>横着</button><button className={craftRotation === 90 ? "selected" : ""} onClick={() => setCraftRotation(90)}>竖着</button><button className={craftRotation === 45 ? "selected" : ""} onClick={() => setCraftRotation(45)}>斜着</button></div>}<span>{selectedCraftItem === "fence" ? "点击农田四周的绿色位置，围栏会自动对齐" : "选好方向后，点击农场空地"}</span><button className="cancel-placement" onClick={() => setSelectedCraftItem(null)}>取消</button></div>}

            {scene === "farm" ? (
              <>
                <div className="path path-one" /><div className="path path-two" />
                <button className={`pond ${isFishing ? "fishing" : ""} ${currentFestival?.id === "fishing" ? "fishing-festival-pond" : ""}`} onClick={castLine} aria-label="在钓鱼池钓鱼">
                  <i /><i /><i /><b className="fishing-float" />{fishingPhase === "bite" && <strong className="bite-question">?</strong>}<span className="pond-label">{fishingPhase === "waiting" ? "等待鱼儿咬钩…" : fishingPhase === "bite" ? "快点！点击问号" : currentFestival?.id === "fishing" ? "钓鱼节会场 · 鱼获 +2" : "钓鱼池"}</span>
                </button>
                {fishingPhase === "reeling" && <div className="fishing-challenge" onClick={(event) => event.stopPropagation()}><header><span>提竿小游戏</span><b>{fishingScore}/3</b></header><p>等红色游标进入绿色区域时，点击提竿！</p><div className="fishing-timing-bar"><i className={game.toolUpgrades.rod ? "lucky-zone" : ""} /><b style={{ left: `${fishingMarker}%` }} /></div><button onClick={attemptReel}>提竿！</button><small>{game.toolUpgrades.rod ? "幸运鱼竿：咬钩更快，成功区域更宽" : "连续命中 3 次才能把鱼钓上来"}</small></div>}
                {currentFestival?.id === "fishing" && <div className="festival-crowd fishing-festival-crowd" aria-label="参加钓鱼节的居民">{FESTIVAL_GUESTS.map((name, index) => <button key={name} className={`crowd-person crowd-${index + 1} ${isNpcSick(name) ? "sick-npc" : ""}`} onClick={() => interactWithPerson(name, `${name}：钓鱼节开始啦，鱼塘边来了好多村民！`)}><i /><b /><span>{name}</span></button>)}</div>}
                <button className={`house ${game.upgrades.house ? "expanded-house" : ""} house-level-${game.upgrades.house} ${isNight ? "night-house" : ""} ${isNight && stoveLit ? "fire-lit-house" : ""}`} onClick={() => { setActiveBuilding("farmhouse"); setMessage(`走进${displayName}的农舍，屋里暖洋洋的。`); }} aria-label={`进入${displayName}的农舍`}><span className="roof" /><span className={`chimney ${stoveLit ? "smoking" : ""}`}>{stoveLit && <><i /><i /><i /></>}</span><span className="wall" /><span className="door" /><span className="window" /><span className="sign">{displayName}的农舍{game.upgrades.house ? ` · 扩建 ${game.upgrades.house} 级` : ""} · 点击进入</span></button>
                {game.rockStates.map((standing, index) => <button key={`rock-${index}`} className={`farm-rock rock-${index + 1} ${standing ? "" : "broken"}`} onClick={() => breakRock(index)} aria-label={standing ? `敲碎第 ${index + 1} 块石头` : `第 ${index + 1} 处碎石`} />)}
                {game.treeStates.map((standing, index) => (
                  <button key={index} className={`tree tree-${["a", "b", "c", "d"][index]} ${standing ? "" : "stump"}`} onClick={() => chopTree(index)} aria-label={standing ? `砍伐第 ${index + 1} 棵树` : `第 ${index + 1} 个树桩`} />
                ))}
                {game.plantedTrees.map((tree) => <button key={tree.id} className={`planted-pine-tree pine-stage-${tree.stage}`} style={{ left: `${tree.x}%`, top: `${tree.y}%` }} onClick={() => chopPlantedTree(tree)} aria-label={tree.stage >= 3 ? "松果种出的成熟松树" : `正在生长的松树苗，第 ${tree.stage + 1} 阶段`}><i /><i /><b /><span>{tree.stage >= 3 ? "大树" : "树苗"}</span></button>)}
                <div className="flowers flowers-a">✿ · ✿</div><div className="flowers flowers-b">· ✿ ·</div>
                {selectedCraftItem === "fence" && FENCE_PLACEMENT_SLOTS.map((slot) => { const occupied = game.placedCrafts.some((craft) => craft.type === "fence" && Math.abs(craft.x - slot.x) < 1 && Math.abs(craft.y - slot.y) < 1); return <button key={slot.id} className={`fence-placement-slot ${slot.rotation === 90 ? "slot-vertical" : "slot-horizontal"} ${occupied ? "occupied" : ""}`} style={{ left: `${slot.x}%`, top: `${slot.y}%` }} onClick={(event) => { event.stopPropagation(); placeFenceInSlot(slot); }} disabled={occupied} aria-label={occupied ? "这里已经放有围栏" : "点击在绿色位置放置木围栏"}><i /><span>{occupied ? "已放" : "+"}</span></button>; })}
                {game.placedCrafts.map((craft) => <button key={craft.id} className={`placed-craft placed-${craft.type} ${craft.type === "fence" && craft.rotation === 90 ? "fence-vertical" : ""} ${craft.type === "lamp" && isNight ? "placed-lamp-lit" : ""}`} style={{ left: `${craft.x}%`, top: `${craft.y}%`, transform: `translate(-50%,-50%) rotate(${craft.rotation}deg)` }} onClick={(event) => { event.stopPropagation(); usePlacedCraft(craft); }} aria-label={`${CRAFT_RECIPES[craft.type].name}，${selected === "axe" ? "点击拆除" : "点击使用或查看"}`}><i /><i /><i /><b>{craft.type === "chest" ? Object.values(game.chestStorage).reduce((sum, count) => sum + count, 0) : ""}</b></button>)}
                {game.farmVisitor === "crow" && <div className="farm-visitor crow-visitor" aria-label="乌鸦飞进农田"><i /><i /><span>嘎！</span></div>}
                {game.farmVisitor === "animal" && <div className="farm-visitor animal-visitor" aria-label="小动物跑进农田"><i /><b /><span>偷吃幼苗</span></div>}
                {game.upgrades.stoneWall > 0 && <div className="farm-stone-wall" aria-label="鲁师傅修建的农场石墙"><i /><i /><i /><i /></div>}

                <div className={`field ${game.tiles.length > 32 ? "expanded-field" : ""}`} aria-label={`${game.tiles.length} 格农田`}>
                  {game.tiles.map((tile, index) => (
                    <button
                      key={index}
                      className={`farm-tile ${tile.state} ${tile.cropType ?? "radish"} ${tile.watered ? "watered" : ""}`}
                      onClick={() => actOnTile(index)}
                      aria-label={`农田 ${index + 1}，${tile.state === "grass" ? "未开垦" : tile.state === "soil" ? "已松土" : `作物第 ${tile.stage} 阶段`}`}
                    >
                      {tile.state === "crop" && <span className={`crop-stage stage-${tile.stage}`}><i /><i /><b /></span>}
                    </button>
                  ))}
                </div>

                <button className="edge-gate farm-exit" onClick={() => { setScene("town"); setPlayer({ x: 0, y: 5 }); setMessage(`欢迎来到${activeVillageInfo.name}！超市在左上方。`); }} aria-label={`前往${activeVillageInfo.name}`}>
                  <span>{activeVillageInfo.name}</span><b>→</b><small>继续向右走</small>
                </button>
                {activeVillage === "maple" && <button className="edge-gate village-crossing crossing-left" onClick={() => { const friend = partner?.online && partner.currentVillage === "qinghe" ? partner : null; setWorldVillage("qinghe"); setScene(friend?.scene ?? "farm"); setPlayer(friend ? { x: Math.max(0, Math.min(11, friend.x + 1)), y: friend.y } : { x: 11, y: 5 }); setMessage(friend ? `到了青禾村，马上看见了${friend.playerName}！` : "沿着左边山路到了青禾村。 "); }}><b>←</b><span>前往青禾村</span><small>{partner?.online && partner.currentVillage === "qinghe" ? `去见${partner.playerName}` : "一直向左走"}</small></button>}
              </>
            ) : scene === "town" ? (
              <>
                <div className="town-road road-horizontal" /><div className="town-road road-vertical" />
                <div className="town-square"><span>✦</span><i /><i /><i /></div>
                {currentFestival?.id === "spring" && <><div className="saturday-market" aria-label="周六春日集市"><strong>春日集市</strong><button onClick={tasteFestivalJam}>草莓果酱<small>恢复 25 体力</small></button><button onClick={() => { setFestivalDisplay("wood"); setMessage("鲁师傅把精雕细刻的木工作品摆到了展示台上。 "); }}>木工作品<small>点击看展品</small></button><button className={festivalMusicPlaying ? "music-playing" : ""} onClick={playValleyMusic}>山谷音乐<small>{festivalMusicPlaying ? "正在演奏♪" : "点击播放"}</small></button></div><div className="festival-crowd" aria-label="参加春日集市的居民">{FESTIVAL_GUESTS.map((name, index) => <button key={name} className={`crowd-person crowd-${index + 1} ${isNpcSick(name) ? "sick-npc" : ""}`} onClick={() => interactWithPerson(name, `${name}：春日集市真热闹，大家都来到中心广场啦！`)}><i /><b /><span>{name}</span></button>)}</div></>}
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
                <div className="culture-sign"><strong>清河文化街</strong><span>镇公所 · 青禾学校 · 青禾博物馆</span></div>
                <button className="edge-gate culture-north-gate" onClick={() => { setScene("northNeighbor"); setPlayer({ x: 6, y: 7 }); setMessage("穿过文化街后面的林间小路，来到叶老师的北林书屋。 "); }}><span>北林书屋</span><b>↑</b><small>在文化街后面</small></button>
                <button className="edge-gate culture-residential-gate" onClick={() => { setScene("residentialDistrict"); setPlayer({ x: 0, y: 5 }); setMessage("来到青禾住宅坡，每位居民都有自己的院地和房子。 "); }}><span>青禾住宅坡</span><b>→</b><small>居民们各自的家</small></button>
                <button className="edge-gate culture-return" onClick={() => { setScene("town"); setPlayer({ x: 6, y: 0 }); setMessage("沿着石板路回到青禾镇中心街。 "); }}><b>↓</b><span>返回中心街</span><small>一直向下走</small></button>
              </>
            ) : scene === "residentialDistrict" ? (
              <>
                <div className="residential-main-path" />
                <div className="residential-plots" aria-label="青禾住宅坡的居民院地">
                  {RESIDENT_HOMES.map((home, index) => <article className={`resident-plot resident-plot-${index + 1}`} key={home.owner}><span className="plot-fence" /><i className="plot-tree" /><button className="resident-house" onClick={() => { setResidentHome(home.owner); setIndoorPlayer({ x: 33, y: 70 }); setMessage(`走进${home.home}，${home.owner}住在这里。`); }} aria-label={`进入${home.home}`}><span className="resident-roof" /><span className="resident-wall" /><span className="resident-door" /><span className="resident-window" /><strong>{home.home}<small>点击进入</small></strong></button><button className={`residential-resident ${isNpcSick(home.owner) ? "sick-npc" : ""} ${home.owner === "诊所助手" ? "red-uniform-resident" : ""}`} onClick={() => interactWithPerson(home.owner, `${home.owner}：${home.greeting}`)} aria-label={heldItem ? `把${carriedItemName}送给${home.owner}` : `和${home.owner}交谈`}><i /><b /><span>{home.owner}</span></button></article>)}
                </div>
                <button className="edge-gate residential-return" onClick={() => { setScene("cultureDistrict"); setPlayer({ x: 11, y: 5 }); setMessage("从住宅坡回到清河文化街。 "); }}><b>←</b><span>返回文化街</span><small>沿着小路向左</small></button>
              </>
            ) : (
              <>
                <div className="neighbor-path" />
                <button className={`neighbor-house ${scene}`} onClick={() => { setNeighborInterior(scene as NeighborScene); setIndoorPlayer({ x: 31, y: 70 }); setMessage(`进入${scene === "eastNeighbor" ? "林婶的果园小屋" : scene === "southNeighbor" ? "鲁师傅的山脚院子" : "叶老师的林间书屋"}。`); }}><span className="neighbor-roof" /><span className="neighbor-wall" /><span className="neighbor-door" /><span className="neighbor-window" /><strong>{scene === "eastNeighbor" ? "林婶的果园小屋" : scene === "southNeighbor" ? "鲁师傅的山脚院子" : "叶老师的林间书屋"}<small>点击进入</small></strong></button>
                <button className={`npc-villager npc-${scene} ${isNpcSick(scene === "eastNeighbor" ? "林婶" : scene === "southNeighbor" ? "鲁师傅" : "叶老师") ? "sick-npc" : ""}`} onClick={() => talkToNeighbor(scene as NeighborScene)} aria-label="和居民人机说话或送礼"><i className="npc-hair" /><i className="npc-head" /><i className="npc-body" /><span>{scene === "eastNeighbor" ? "林婶" : scene === "southNeighbor" ? "鲁师傅" : "叶老师"}<small>{heldItem ? `点击送出${carriedItemName}` : "点击交谈"}</small></span></button>
                <div className="neighbor-decor"><i /><i /><i /></div>
                <button className={`edge-gate neighbor-return return-${scene}`} onClick={() => { if (scene === "northNeighbor") { setScene("cultureDistrict"); setPlayer({ x: 6, y: 0 }); setMessage("从北林书屋回到清河文化街。 "); } else { setScene("town"); setPlayer(scene === "eastNeighbor" ? { x: 11, y: 5 } : { x: 6, y: 7 }); setMessage("回到青禾镇中心街。"); } }}><b>{scene === "eastNeighbor" ? "←" : scene === "southNeighbor" ? "↑" : "↓"}</b><span>{scene === "northNeighbor" ? "返回文化街" : "返回青禾镇"}</span><small>{scene === "northNeighbor" ? "北林在文化街后面" : "走到边缘也能返回"}</small></button>
                {scene === "eastNeighbor" && activeVillage === "qinghe" && <button className="edge-gate village-crossing crossing-right" onClick={() => { const friend = partner?.online && partner.currentVillage === "maple" ? partner : null; setWorldVillage("maple"); setScene(friend?.scene ?? "farm"); setPlayer(friend ? { x: Math.max(0, Math.min(11, friend.x - 1)), y: friend.y } : { x: 0, y: 5 }); setMessage(friend ? `到了枫叶村，马上看见了${friend.playerName}！` : "沿着右边山路走到了枫叶村！"); }}><span>前往枫叶村</span><b>→</b><small>{partner?.online && partner.currentVillage === "maple" ? `去见${partner.playerName}` : "一直向右走"}</small></button>}
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

            <div className={`player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${4 + player.x * 7.7}%`, top: `${8 + player.y * 10.5}%` }} aria-label={`玩家角色，面朝${facing === "left" ? "左" : facing === "right" ? "右" : facing === "up" ? "上" : "前"}`}>
              {renderCarriedItem()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} />
            </div>
            {partner?.online && partner.currentVillage === activeVillage && partner.scene === scene && <div className="online-partner" style={{ left: `${4 + partner.x * 7.7}%`, top: `${8 + partner.y * 10.5}%` }} aria-label={`${partner.playerName}也在这里`}><span>{partner.playerName}<small>朋友</small></span><i className="player-shadow" /><img src={partner.sick ? "/xiaohe-sick-sprite.png" : "/xiaohe-sprite.png"} alt="" draggable={false} /></div>}
            {partner?.online && partner.currentVillage === activeVillage && partner.scene !== scene && <button className="friend-locator" onClick={(event) => { event.stopPropagation(); setActiveBuilding(null); setNeighborInterior(null); setResidentHome(null); setScene(partner.scene); setPlayer({ x: Math.max(0, Math.min(11, partner.x + (partner.x < 11 ? 1 : -1))), y: partner.y }); setMessage(`找到${partner.playerName}了！现在你们在同一个地方。`); }}><span>● {partner.playerName}也在{activeVillageInfo.name}</span><strong>点击去找朋友</strong><small>{partner.scene === "farm" ? activeVillageInfo.farm : partner.scene === "town" ? "中心街" : partner.scene === "cultureDistrict" ? "清河文化街" : partner.scene === "residentialDistrict" ? "青禾住宅坡" : partner.scene === "eastNeighbor" ? "东郊" : partner.scene === "southNeighbor" ? "南坡" : "北林"}</small></button>}

            <div className="speech-bubble"><span>{scene === "farm" ? "☀" : "◆"}</span>{message}</div>
            <div className="movement-help"><span>WASD / 方向键</span>移动</div>

            {festivalDisplay === "wood" && (
              <div className="shop-overlay festival-exhibit-overlay" role="presentation">
                <section className="festival-exhibit" role="dialog" aria-modal="true" aria-labelledby="wood-exhibit-title"><header><div><span>木匠工坊 · 每日轮换展览</span><h2 id="wood-exhibit-title">鲁师傅的木工作品</h2></div><button onClick={() => setFestivalDisplay(null)}>×</button></header><div className={`wood-exhibit-stage daily-craft-${dailyWoodcraftIndex}`}><div className="woodcraft-window"><img src="/woodcraft-showcase.png" alt={dailyWoodcraft.name} draggable={false} /></div><div className="daily-craft-copy"><small>第 {game.day} 天 · 今日展品</small><strong>{dailyWoodcraft.name}</strong><p>{dailyWoodcraft.description}</p></div></div><p>鲁师傅每天早上都会换一件木雕。每件作品都用青禾谷的木材手工打磨，可以每天来看看。</p><footer><button onClick={() => setFestivalDisplay(null)}>看完今日展品</button></footer></section>
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
                    <button className={`neighbor-indoor-npc ${isNpcSick(neighborInterior === "eastNeighbor" ? "林婶" : neighborInterior === "southNeighbor" ? "鲁师傅" : "叶老师") ? "sick-npc" : ""}`} onClick={() => talkToNeighbor(neighborInterior)}><i className="npc-hair" /><i className="npc-face" /><i className="npc-body" /><span>{neighborInterior === "eastNeighbor" ? "林婶" : neighborInterior === "southNeighbor" ? "鲁师傅" : "叶老师"}</span></button>
                    <button className="house-door neighbor-home-door" onClick={() => { setNeighborInterior(null); setBuilderOpen(false); setMessage("从居民家的门口出来了。 "); }}><span>出口</span></button>
                    <div className={`player indoor-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }}>{renderCarriedItem()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
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
                    <button className={`neighbor-indoor-npc resident-home-npc ${isNpcSick(residentHome) ? "sick-npc" : ""} ${residentHome === "诊所助手" ? "home-relief-assistant" : ""}`} onClick={() => interactWithPerson(residentHome, `${residentHome}：${residentHomeGreeting}`)} aria-label={heldItem ? `把${carriedItemName}送给${residentHome}` : `和${residentHome}交谈`}><i className="npc-hair" /><i className="npc-face" /><i className="npc-body" /><span>{residentHome}</span></button>
                    <button className="house-door neighbor-home-door" onClick={() => { setResidentHome(null); setMessage("从居民自己的房子里出来了。 "); }}><span>出口</span></button>
                    <div className={`player indoor-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }}>{renderCarriedItem()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
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
              <div className="shop-overlay" role="presentation">
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

            {craftingOpen && (
              <div className="shop-overlay" role="presentation">
                <section className="craft-panel" role="dialog" aria-modal="true" aria-labelledby="craft-title">
                  <header><div><span>农场手作</span><h2 id="craft-title">制作手册</h2></div><div className="wood-wallet"><small>现有材料</small><strong>{game.wood} 木 · {game.stone} 石</strong></div><button onClick={() => setCraftingOpen(false)} aria-label="关闭制作菜单">×</button></header>
                  <div className="craft-intro"><span>⚒</span><p><strong>把木头和石材变成农场设施</strong>石头每天会更新；攒够材料还能扩建房屋和地盘。</p></div>
                  <div className="recipe-grid">
                    {(Object.keys(CRAFT_RECIPES) as CraftType[]).map((item) => { const recipe = CRAFT_RECIPES[item]; return <article className="recipe-card" key={item}><span className={`recipe-icon ${item}-recipe`}>{recipe.short}</span><div><strong>{recipe.name}</strong><small>{recipe.description}</small><em>背包里 {game.crafted[item]} 个 · 已摆 {game.placedCrafts.filter((placed) => placed.type === item).length} 个</em></div><button onClick={() => craftItem(item)}><span>木</span>{recipe.wood}{recipe.stone > 0 && <> · <span>石</span>{recipe.stone}</>}</button></article>; })}
                  </div>
                  <footer><span>{message}</span><button onClick={() => setCraftingOpen(false)}>收起手册</button></footer>
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

            {activeBuilding === "farmhouse" && (
              <div className="shop-overlay interior-farmhouse" role="presentation">
                <section className="service-panel farmhouse-panel" role="dialog" aria-modal="true" aria-labelledby="farmhouse-title">
                  <header><div><span>{activeVillageInfo.farm}室内</span><h2 id="farmhouse-title">{displayName}的农舍</h2></div><button onClick={leaveBuilding} aria-label={`离开${displayName}的农舍`}>×</button></header>
                  <div className={`interior-room farmhouse-room ${game.upgrades.house ? "expanded-farmhouse-room" : ""} farmhouse-level-${game.upgrades.house} ${isNight ? "night-room" : ""} ${isNight && stoveLit ? "stove-lit-room" : ""} ${isNight && game.equipment.lampOn ? "lamp-lit-room" : ""}`} onClick={walkInsidePointer}>
                    <div className="room-window"><i /><i /></div>
                    <button className="house-bed" onClick={sleepAtHome} aria-label="点击床睡到第二天"><i /><b /><span>点击睡觉</span></button>
                    <div className="house-table"><i /><i /></div>
                    <button className={`house-stove ${stoveLit ? "lit" : ""}`} onClick={() => { setStoveLit((lit) => !lit); setMessage(stoveLit ? "把炉火熄灭了。" : "炉灶点着了，屋里暖和起来！"); playTone(stoveLit ? 300 : 660); }} aria-pressed={stoveLit} aria-label={stoveLit ? "熄灭炉灶" : "点燃炉灶"}><i /><b /><span /></button>
                    {game.upgrades.house >= 1 && <button className={`house-equipment house-lamp ${game.equipment.lampOn ? "active" : ""}`} onClick={() => { setGame((current) => ({ ...current, equipment: { ...current.equipment, lampOn: !current.equipment.lampOn } })); setMessage(game.equipment.lampOn ? "关掉了暖光灯。" : "暖光灯亮起来，夜晚的房间变得明亮了！"); }}><i />暖光灯</button>}
                    {game.upgrades.house >= 2 && <button className="house-equipment house-water-tank" onClick={() => { setGame((current) => ({ ...current, water: current.toolUpgrades.water ? 18 : 12 })); setMessage("自动水箱把洒水壶补满了！"); playTone(620); }}><i />自动水箱</button>}
                    {game.upgrades.house >= 3 && <button className="house-equipment house-kitchen" onClick={() => { setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 20) })); setMessage("在料理台吃了一份热饭，恢复 20 点体力！"); playTone(740); }}><i />料理台</button>}
                    <div className="house-rug" />
                    <button className="house-door" onClick={leaveBuilding} aria-label="点击出口离开农舍"><span>出口</span></button>
                    <div className={`player indoor-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }} aria-label="小禾站在农舍里">{renderCarriedItem()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
                  </div>
                  <div className="service-dialogue"><strong>回到家啦</strong><p>床铺得软软的，炉灶还留着余温。可以休息到明天，也可以从门口回农场。</p></div>
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
                  <div className="shopkeeper"><button className={`shopkeeper-face ${isNpcSick("林婶") ? "sick-npc" : ""}`} onClick={() => interactWithPerson("林婶", "林婶：欢迎呀，小禾！今天想带点什么回农场？")} aria-label={heldItem ? `把${carriedItemName}送给林婶` : "和林婶交谈"}><i /><b /></button><p><strong>林婶</strong>{heldItem ? `小禾正举着${carriedItemName}，点击林婶就能送给她。` : isNpcSick("林婶") ? "今天有点不舒服，正在柜台后休息。" : game.day === 3 ? "种子分享日快乐！今天所有水果和蔬菜种子都免费。" : "欢迎呀，小禾！今天想带点什么回农场？"}</p><div className={`player indoor-player indoor-shop-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: "0" }}>{renderCarriedItem()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div></div>
                  {game.day === 3 && <><div className="free-seed-festival"><strong>种子分享日 · 全部免费</strong><span>西瓜、番茄、土豆、南瓜、蓝莓等 8 种种子</span><button onClick={takeFreeSeedBundle}>免费领取 8 种种子大礼包</button></div><div className="shop-festival-guests" aria-label="参加种子分享日的居民">{FESTIVAL_GUESTS.map((name, index) => <button key={name} className={isNpcSick(name) ? "sick-npc" : ""} onClick={() => interactWithPerson(name, `${name}：种子分享日真热闹，大家都领到了喜欢的种子！`)}><i /><b /><span>{name}</span></button>)}</div></>}
                  <div className="product-grid">
                    {CROP_TYPES.map((crop) => <article className="product-card" key={crop}><span className={`product-icon ${crop}-seeds`}>{CROP_INFO[crop].short}</span><div><strong>{CROP_INFO[crop].name}种子包</strong><small>内含 5 颗种子</small></div><button className={game.day === 3 ? "free-shop-button" : ""} onClick={() => buyItem(CROP_INFO[crop].seedField)}>{game.day === 3 ? "免费" : <><span>●</span>{CROP_INFO[crop].seedPrice}</>}</button></article>)}
                    <article className="product-card"><span className="product-icon water-drop">水</span><div><strong>水壶补给</strong><small>立刻补满 12 格水</small></div><button onClick={() => buyItem("water")}><span>●</span>25</button></article>
                    <article className="product-card"><span className="product-icon berry-bread">食</span><div><strong>莓果面包</strong><small>恢复 25 点体力</small></div><button onClick={() => buyItem("snack")}><span>●</span>45</button></article>
                    <article className="product-card"><span className="product-icon soup-bowl">汤</span><div><strong>农家蔬菜汤</strong><small>恢复 50 点体力</small></div><button onClick={() => buyItem("soup")}><span>●</span>75</button></article>
                    <article className="product-card"><span className="product-icon bait-box">饵</span><div><strong>幸运鱼饵盒</strong><small>5 份鱼饵，钓鱼收获翻倍</small></div><button onClick={() => buyItem("bait")}><span>●</span>50</button></article>
                    <article className="product-card"><span className="product-icon sapling-bag">苗</span><div><strong>青绿树苗包</strong><small>让所有树桩重新长成树</small></div><button onClick={() => buyItem("sapling")}><span>●</span>80</button></article>
                    <article className="product-card"><span className="product-icon rock-growth-bag">石</span><div><strong>石头生长包</strong><small>让农场全部 6 块石头重新长出来</small></div><button onClick={() => buyItem("rockGrowth")}><span>●</span>95</button></article>
                  </div>
                  <div className="salvage-shelf-title"><div><strong>山谷拾遗货架</strong><small>地上可能掉落的东西，这里也能找到</small></div><span>种子 · 食物 · 工具 · 药材 · 书 · 稀奇物品</span></div>
                  <div className="product-grid salvage-product-grid">
                    {GROUND_SUPPLIES.map((supply, supplyId) => <article className={`product-card salvage-product supply-${supply.kind}`} key={`shop-ground-${supply.name}`}><span className="product-icon salvage-icon">{supply.short}</span><div><strong>{supply.name}</strong><small>{supply.description}</small></div><button className={supply.kind === "seed" && game.day === 3 ? "free-shop-button" : ""} onClick={() => buyGroundSupply(supplyId)}>{supply.kind === "seed" && game.day === 3 ? "免费" : <><span>●</span>{GROUND_SUPPLY_PRICES[supplyId]}</>}</button></article>)}
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
                    {activeBuilding === "school" && <><div className="school-blackboard"><strong>{isSchoolDay ? "今日课堂" : "课程表"}</strong><span>{isSchoolDay ? ["A B C · 英语", "阅读与写字 · 语文", "加减乘除 · 数学", "种植与浇水 · 农场知识"][Math.floor((game.day - 1) / 2) % 4] : "周一 · 周三 · 周五 · 周日上课"}</span><i /></div><div className="school-desks" aria-label={isSchoolDay ? "同学们坐在课桌前听课" : "今天空着的课桌椅"}>{SCHOOL_STUDENTS.map((student, index) => <button key={student} className={`classroom-seat seat-${index + 1} ${isSchoolDay ? "student-seated" : "empty-seat"}`} disabled={!isSchoolDay} onClick={(event) => { event.stopPropagation(); interactWithPerson(student, `${student}：我正在认真听许老师讲课，今天学到了很多新知识！`); }} aria-label={isSchoolDay ? `${student}坐在课桌前听课` : "空课桌"}><i /><b /><span>{isSchoolDay ? student : "空座位"}</span></button>)}</div></>}
                    <button className={`npc-character ${activeBuilding === "clinic" && doctorIsRestingAtHome ? "clinic-relief-assistant" : isNpcSick(BUILDING_INFO[activeBuilding].owner) ? "sick-npc" : ""}`} onClick={() => interactWithPerson(activeBuildingOwner, `${activeBuildingOwner}：${activeBuildingGreeting}`)} aria-label={heldItem ? `把${carriedItemName}送给${activeBuildingOwner}` : `和${activeBuildingOwner}交谈`}><span className="npc-hair" /><span className="npc-face" /><span className="npc-body" /></button>
                    {activeBuilding === "clinic" && doctorIsRestingAtHome && <div className="clinic-relief-note"><strong>助手代班</strong><span>白医生在自己家休息</span></div>}
                    {((activeBuilding === "cafe" && currentFestival?.id === "coffee") || (activeBuilding === "workshop" && currentFestival?.id === "craft")) && <div className={`festival-indoor-guests guests-${activeBuilding}`} aria-label={`参加${currentFestival.name}的居民`}>{FESTIVAL_GUESTS.map((name, index) => <button key={name} className={`indoor-guest guest-${index + 1} ${isNpcSick(name) ? "sick-npc" : ""}`} onClick={() => interactWithPerson(name, `${name}：${currentFestival.name}真热闹，屋里坐满了村民！`)}><i /><b /><span>{name}</span></button>)}</div>}
                    <div className="interior-counter" />
                    <div className="interior-sign">{activeBuilding === "townhall" ? "公告" : activeBuilding === "clinic" ? "健康" : activeBuilding === "cafe" ? "今日菜单" : activeBuilding === "workshop" ? "制作台" : activeBuilding === "museum" ? "山谷馆藏" : activeBuilding === "school" ? "今日课堂" : "农事图鉴"}</div>
                    <div className={`room-specials special-${activeBuilding}`}>
                      {BUILDING_ITEMS[activeBuilding].map((item) => <button type="button" key={item} onClick={() => inspectBuildingItem(item)}>{item}</button>)}
                      {activeBuilding === "library" && game.libraryBooks.map((bookId) => <button type="button" className="recovered-book" key={`library-book-${bookId}`} onClick={() => inspectBuildingItem(LOST_BOOKS[bookId].title)}>{LOST_BOOKS[bookId].title}</button>)}
                      {activeBuilding === "museum" && game.museumArtifacts.map((artifactId) => <button type="button" className={`museum-case artifact-case-${artifactId + 1}`} key={`museum-artifact-${artifactId}`} onClick={() => inspectBuildingItem(RARE_ARTIFACTS[artifactId].title)}><span className="museum-artifact-thumb"><img src="/museum-artifacts.png" alt="" draggable={false} /></span>{RARE_ARTIFACTS[artifactId].title}</button>)}
                    </div>
                    <div className={`player indoor-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }} aria-label="小禾站在房子里面">{renderCarriedItem()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
                  </div>
                  <div className={`service-dialogue ${activeBuilding === "clinic" && doctorIsRestingAtHome ? "relief-dialogue" : ""}`}><strong>{activeBuildingOwner}</strong><p>{activeBuildingGreeting}</p></div>
                  {inspectedItem && (
                    <div className={`inspection-card ${inspectedArtifactIndex >= 0 ? "artifact-inspection-card" : ""}`}>{inspectedArtifactIndex >= 0 && <div className={`artifact-inspection-image artifact-preview-${inspectedArtifactIndex + 1}`}><img src="/museum-artifacts.png" alt={inspectedItem} draggable={false} /></div>}<div><strong>{inspectedItem}</strong><p>{inspectedItem === "药品柜" ? (!game.diagnosed ? `要先接受${activeBuildingOwner}的免费检查，才能查看药品。` : game.sick ? `里面放着${activeBuildingOwner}刚配好的处方药，价格 50 金币。` : "检查结果不需要用药。") : inspectedItem === "健康档案" && !game.diagnosed ? "还没有检查结果，档案暂时是空白的。" : LOST_BOOKS.find((book) => book.title === inspectedItem)?.content ?? RARE_ARTIFACTS.find((artifact) => artifact.title === inspectedItem)?.description ?? ITEM_DESCRIPTIONS[inspectedItem]}</p></div><button onClick={() => setInspectedItem(null)}>收起</button></div>
                  )}
                  <div className="service-actions">
                    <button onClick={() => useBuildingService(activeBuilding)}>{activeBuilding === "clinic" ? (!game.diagnosed ? `接受${activeBuildingOwner}的免费检查` : game.sick ? `购买${activeBuildingOwner}开的药 · 50 金币` : "检查结果：没有生病") : activeBuilding === "cafe" ? (currentFestival?.id === "coffee" ? "免费领取咖啡和点心" : "购买咖啡套餐 · 35 金币") : activeBuilding === "townhall" ? "查看公告栏" : activeBuilding === "workshop" ? "免费参观手工作品" : activeBuilding === "museum" ? heldItem?.kind === "artifact" ? `捐赠${carriedItemName}` : `查看馆藏 · ${game.museumArtifacts.length}/3` : activeBuilding === "school" ? ([0, 2, 4, 6].includes((game.day - 1) % 7) ? "开始听今天的课 · 奖励 50 金币" : "今天停课 · 参观教室") : "翻阅农事图鉴"}</button>
                    <button className="exit-action" onClick={leaveBuilding}>从门口出去</button>
                  </div>
                  <footer><span>{message}</span><small>按 Esc 也可以离开</small></footer>
                </section>
              </div>
            )}
          </div>

          <div className="toolbar" aria-label="农具栏">
            <div className="inventory-note"><strong>{scene === "farm" ? "背包" : "小镇背包"}</strong><span>{scene === "farm" ? "选择工具，再点击田地" : "超市可以买到农场补给"}</span></div>
            {(Object.keys(TOOL_INFO) as Tool[]).map((tool) => (
              <button key={tool} className={selected === tool && !selectedResource ? "tool-button selected" : "tool-button"} onClick={() => chooseTool(tool)} aria-pressed={selected === tool && !selectedResource}>
                <kbd>{TOOL_INFO[tool].key}</kbd><PixelIcon type={tool} /><span>{tool === "seed" ? `${CROP_INFO[selectedCrop].name}种子` : tool === "water" && game.toolUpgrades.water ? "大号洒水壶" : tool === "axe" && game.toolUpgrades.axe ? `精铁斧头 · ${game.toolUpgradeDays.axe}天` : tool === "rod" && game.toolUpgrades.rod ? `幸运鱼竿 · ${game.toolUpgradeDays.rod}天` : TOOL_INFO[tool].name}</span>
                {tool === "seed" && <b>{game[CROP_INFO[selectedCrop].seedField]}</b>}
                {tool === "water" && <b>{game.water}</b>}
                {tool === "rod" && <b>{game.inventory.fish}</b>}
                {tool === "axe" && <b>{game.wood}</b>}
              </button>
            ))}
            <div className="crafted-backpack" aria-label="制作物和松果背包"><button className={plantingPinecone ? "crafted-bag-item pinecone-bag-item selected" : "crafted-bag-item pinecone-bag-item"} onClick={clickPinecone} onDoubleClick={doubleClickPinecone} disabled={game.pinecones <= 0} aria-label={`松果 ${game.pinecones} 个，点击选择种树，双击拿起`}><span>果</span><small>松果·种树</small><b>{game.pinecones}</b></button>{(Object.keys(CRAFT_RECIPES) as CraftType[]).map((item) => <button key={`crafted-bag-${item}`} className={selectedCraftItem === item ? "crafted-bag-item selected" : "crafted-bag-item"} onClick={() => chooseCraftForPlacement(item)} disabled={game.crafted[item] <= 0} aria-label={`${CRAFT_RECIPES[item].name} ${game.crafted[item]} 个，点击选择摆放`}><span>{CRAFT_RECIPES[item].short}</span><small>{CRAFT_RECIPES[item].name}</small><b>{game.crafted[item]}</b></button>)}</div>
            <div className="selected-hint"><span>{scene === "farm" ? "当前" : "所在地点"}</span><strong>{scene === "farm" ? plantingPinecone ? "拿着松果 · 点击树桩种树" : selectedResource ? `拿着${RESOURCE_INFO[selectedResource].name}` : selected === "rod" ? `鱼竿 · 鱼饵 ${game.bait}` : selected === "seed" ? `${CROP_INFO[selectedCrop].name}种子` : TOOL_INFO[selected].name : sceneLabel}</strong></div>
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
