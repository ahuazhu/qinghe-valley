"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";

type Tool = "hoe" | "seed" | "water" | "hand" | "rod" | "axe" | "pickaxe";
type TileState = "grass" | "soil" | "crop";
type Scene = "farm" | "westFriendFarm" | "mysteryRoad" | "town" | "cultureDistrict" | "residentialDistrict" | "eastNeighbor" | "southNeighbor" | "northNeighbor";
type NeighborScene = "eastNeighbor" | "southNeighbor" | "northNeighbor";
type ResidentHomeOwner = "白医生" | "阿麦" | "周镇长" | "沈馆长" | "诊所助手" | "许老师" | "小玲" | "豆豆" | "小满" | "阿禾" | "小芽" | "小石";
type BuildingId = "farmhouse" | "supermarket" | "townhall" | "clinic" | "cafe" | "workshop" | "library" | "museum" | "school";
type CropType = "radish" | "strawberry" | "corn" | "pineapple" | "watermelon" | "tomato" | "potato" | "pumpkin" | "blueberry";
type StorableResource = CropType | "fish";
type VillageId = "qinghe" | "maple";
type Facing = "down" | "up" | "left" | "right";
type Weather = "sunny" | "cloudy" | "rain" | "thunder";
type CropQuality = "normal" | "silver" | "gold";
type CropQualityRecord = Record<CropType, { normal: number; silver: number; gold: number }>;
type CropQualityStock = Record<CropType, { silver: number; gold: number }>;
type CookingFood = "crabs" | "shrimp";
type CookingStep = "chop" | "heat" | "plate";
type GuideTopicId = "start" | "farming" | "fishing" | "tools" | "town" | "friends" | "home" | "animals" | "weather" | "festival" | "multiplayer" | "save";
type HiddenTripId = "hillsideTea" | "riverKitchen" | "oldBookCafe" | "forestPlayground";
type TripHandsOnMode = "move" | "drag" | "gesture";
type TripHandsOnState = { index: number; mode: TripHandsOnMode; progress: number; mistakes: number; heldPart: string | null; x: number; y: number; facing: Facing };
type ResidentSchedule = { key: string; label: string; scene: Scene; invite?: HiddenTripId };
type MallItem = "redCoat" | "blueOutfit" | "umbrella" | "seedBox" | "animalRaincoat";
type FarmAnimalType = "chicken" | "cow" | "sheep";
type UrgentEventKind = "fire" | "theft" | "injury" | "assembly";
type IllnessId = "valleyCold" | "rainFlu" | "windChill" | "pollenFever" | "caveChill" | "overwork" | "nightCough" | "riverDamp";
type TreatmentMethod = "selfCare" | "clinicOnly" | "baths" | "remedy";
type FestivalId = "seeds" | "fishing" | "spring" | "coffee" | "craft" | "springFestival" | "lantern" | "dragonBoat" | "midAutumn" | "medical" | "kite" | "flower" | "water" | "firefly" | "harvest" | "leafMusic" | "firstSnow" | "hotSoup";
type WorkshopSeedId = "strawberry" | "watermelon" | "corn" | "pumpkin";
type WorkshopSeason = "春" | "夏" | "秋" | "冬";
type SnowBuildState = { playerX: number; bodyX: number; bodySize: number; bodyPlaced: boolean; headX: number; headSize: number; headRolled: boolean; headStacked: boolean };
type WaterFestivalState = { installedPipes: boolean[]; heldPipe: number | null; bucketFill: number[]; playerX: number; hits: number; soaked: number };
type BirthdayCeremonyState = { person: string; own: boolean; step: 0 | 1 | 2; songTaps: number; blowTaps: number; cutProgress: number };
type AgeSkillId = "trail" | "shelter" | "hybrid" | "echo" | "clone" | "teleport";
type AgeTrainingState = { skill: AgeSkillId; progress: number; mistakes: number };
type TrailDirection = "up" | "down" | "left" | "right";
type TrailExpeditionState = { routeIndex: number; step: number; mistakes: number };
type HybridLabState = { parents: CropType[]; balance: number; pollination: number; mistakes: number };
type EchoSurveyState = { hits: number; misses: number };
type CloneWorkKind = "water" | "fertilize" | "plant" | "mineDiamond" | "chopWood" | "breakStone" | "gatherHerbs" | "fish" | "helpResident";
type CloneMissionState = { kind: CloneWorkKind; label: string; destination: string; icon: string };
type SeedField = "seeds" | "strawberrySeeds" | "cornSeeds" | "pineappleSeeds" | "watermelonSeeds" | "tomatoSeeds" | "potatoSeeds" | "pumpkinSeeds" | "blueberrySeeds";
type CraftType = "chest" | "fence" | "gate" | "scarecrow" | "lamp" | "bench" | "sign" | "table" | "floorLamp" | "television" | "sofa" | "bookshelf" | "dresser" | "nightstand" | "matches" | "blanket";
type CraftRotation = 0 | 45 | 90;
type PlacedCraft = { id: string; type: CraftType; x: number; y: number; rotation: CraftRotation };
type PlantedTree = { id: string; x: number; y: number; stage: number; watered: boolean };
type FencePlacementSlot = { id: string; x: number; y: number; rotation: 0 | 90 };
type ForestItem = "pinecone" | "pineNut";
type PetType = "cat" | "dog" | "chick" | "duck" | "rabbit" | "hamster";
type PetRecord = { id: string; type: PetType; sex: "男生" | "女生"; bornDay: number; bornSeason: number; bornYear: number };
type BabyCareState = { petId: string; stage: 0 | 1 | 2 | 3; feedHits: number; brushProgress: number; mistakes: number };
type PetContestCue = "left" | "right" | "rush";
type PetContestState = { ownPetId: string; rival: string; round: 0 | 1 | 2; playerScore: number; rivalScore: number; exchanges: number; boutWins: number; boutLosses: number; cue: PetContestCue; finished: boolean };
type CarriedItem = { kind: "resource"; id: StorableResource } | { kind: "material"; id: "wood" | "stone" } | { kind: "forest"; id: ForestItem } | { kind: "seed"; id: CropType } | { kind: "herb" } | { kind: "resin" } | { kind: "matches" } | { kind: "product"; id: "egg" | "milk" | "wool" } | { kind: "petGift"; id: "feather" | "softFur" | "bone" } | { kind: "book"; id: number } | { kind: "artifact"; id: number };
type ShippingItemGroup = "resource" | "seed" | "craft" | "single";
type ShippingSingleField = "wood" | "stone" | "diamonds" | "herbs" | "pinecones" | "pineNuts" | "resin" | "eggs" | "milk" | "wool" | "feathers" | "softFur" | "petBones" | "cookies" | "crabs" | "shrimp" | "cookedCrabs" | "cookedShrimp" | "drinks" | "oldSocks" | "puddleHoes";
type ShippingCatalogItem = { id: string; name: string; short: string; price: number; group: ShippingItemGroup; key: string };
type AtticResource = "wood" | "stone" | "diamonds" | "herbs" | "resin" | "pinecones" | "pineNuts" | "eggs" | "milk" | "wool";
type ResidentQuestId = "orchardCrate" | "clinicParcel" | "roadSigns" | "workshopMeasure" | "springWater" | "museumRubbing" | "libraryPages" | "schoolSpecimen" | "ananTrail";
type ResidentQuest = { id: ResidentQuestId; giver: string; title: string; location: string; village: VillageId; scene: Scene; detail: string; action: string; icon: string; reward: number };
type WishMaterial = "wood" | "stone" | "resin" | "herbs" | "pinecones" | "pineNuts" | "diamonds";
type ResidentWorkJob = "water" | "plantFruit" | "fertilize" | "mineDiamond" | "chopWood" | "gatherHerbs";
type ResidentWorkOrder = { person: string; job: ResidentWorkJob; absoluteDay: number; amount: number; result: string };
type ResidentWishProgress = { startedDay: number; firstBaseline: number; secondBaseline: number; completed: boolean };
type ResidentWishWorkshopState = { person: string; placed: WishMaterial[]; assemblyProgress: number; mistakes: number };
type ResidentWishDefinition = {
  title: string;
  story: string;
  firstLabel: string;
  firstNeed: number;
  firstMetric: (state: GameState) => number;
  firstAbsolute?: boolean;
  secondLabel: string;
  secondNeed: number;
  secondMetric: (state: GameState) => number;
  secondAbsolute?: boolean;
  finalPlace: string;
  finalProduct: string;
  finalCost: Partial<Record<WishMaterial, number>>;
};

const QINGHE_WEST_PATH_END = -12;
const QINGHE_WEST_EXIT = -13;

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
  care?: number;
  hybrid?: boolean;
};

type GameState = {
  year: number;
  playerAge: number;
  birthdayGrowthYear: number;
  ageSkillsLearned: AgeSkillId[];
  lastAgeAbilityDays: Partial<Record<AgeSkillId, string>>;
  hybridSeedCharges: number;
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
  diamonds: number;
  herbs: number;
  pinecones: number;
  pineNuts: number;
  resin: number;
  treeStates: boolean[];
  plantedTrees: PlantedTree[];
  rockStates: boolean[];
  caveDiamondStates: boolean[];
  caveDiamondSpots: number[];
  crafted: Record<CraftType, number>;
  placedCrafts: PlacedCraft[];
  farmVisitor: "crow" | "animal" | null;
  farmHelperToday: string | null;
  upgrades: { house: number; land: number; field: number; storage: number; greenhouse: number; pond: number; stoneWall: number; secondFloor: number; upstairsKitchen: number; upstairsBathroom: number };
  builderSupplies: { wood: number; stone: number };
  equipment: { lampOn: boolean };
  daily: { day: number; planted: number; watered: number; harvested: number; fish: number; chopped: number; sold: number; rewardClaimed: boolean };
  sick: boolean;
  diagnosed: boolean;
  medicalTrained: boolean;
  illness: IllnessId | null;
  learnedTreatments: IllnessId[];
  treatmentBaths: Partial<Record<IllnessId, number>>;
  lastIllnessDay: number;
  groundBooks: boolean[];
  bookBag: number[];
  libraryBooks: number[];
  groundArtifacts: boolean[];
  artifactBag: number[];
  museumArtifacts: number[];
  groundSupplies: boolean[];
  toolUpgrades: { water: boolean; axe: boolean; rod: boolean; pickaxe: boolean };
  toolUpgradeDays: { axe: number; rod: number; pickaxe: number };
  npcHealedDays: Record<string, number>;
  lastSchoolAttendance: string;
  seasonExcursionCompleted: boolean;
  animalPen: boolean;
  chickens: number;
  cows: number;
  sheep: number;
  animalRainExposure: number;
  animalRaincoatAssignments: string[];
  sickFarmAnimalIds: string[];
  lastAnimalPuddleFindDay: number;
  puddleHoes: number;
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
  cookedCrabs: number;
  cookedShrimp: number;
  drinks: number;
  oldSocks: number;
  ananBeachTrips: string[];
  lastAnanCookieDay: string;
  lastEggDay: number;
  lastMilkDay: number;
  lastWoolDay: number;
  rainExposure: number;
  pets: PetRecord[];
  lastPetBirthYears: Partial<Record<PetType, number>>;
  lastBabyCareDays: Record<string, string>;
  babyCareStreaks: Record<string, number>;
  petContestWins: number;
  petBonds: Record<string, number>;
  sickPetIds: string[];
  lastPetIllnessAbsoluteDay: number;
  missingPetId: string | null;
  lastDreamAbsoluteDay: number;
  lastDreamVariant: number;
  birthdayCakeYear: number;
  driverLicense: boolean;
  ownsCar: boolean;
  weather: Weather;
  urgentEvent: UrgentEventKind | null;
  urgentEventDay: number;
  urgentEventResolved: boolean;
  mallItems: Record<MallItem, number>;
  equippedOutfit: "default" | "redCoat" | "blueOutfit" | "pajamas";
  umbrellaOpen: boolean;
  showeredBeforeBed: boolean;
  showerBuff: boolean;
  lanternRiddlesSolved: string[];
  festivalActivitiesCompleted: string[];
  atticStorage: Record<AtticResource, number>;
  atticChestPlaced: boolean;
  atticPlacedCrafts: PlacedCraft[];
  firstFloorNightstandPlaced: boolean;
  friendship: Record<string, number>;
  lastTalkedDays: Record<string, string>;
  forestQuestStage: number;
  forestQuestProgressDay: number;
  forestQuestEpisode: number;
  forestQuestNextAbsoluteDay: number;
  residentQuestCompletions: string[];
  residentTripDays: string[];
  residentWishes: Record<string, ResidentWishProgress>;
  wishPlantingRecords: Record<string, number>;
  residentWorkOrders: ResidentWorkOrder[];
  cropQualityHarvests: CropQualityRecord;
  cropQualityStock: CropQualityStock;
  chestCropQualityStock: CropQualityStock;
  shippingCropQualityStock: CropQualityStock;
  watchedTvEpisodes: number[];
  journalEntries: string[];
  recipesDiscovered: string[];
};

type FestivalPreview = {
  festivalId: FestivalId;
  season: number;
  day: number;
  returnScene: Scene;
  returnPlayer: { x: number; y: number };
  returnActiveBuilding: BuildingId | null;
  returnGame: GameState;
};

const farmAnimalId = (animal: FarmAnimalType, index: number) => `farm-${animal}-${index}`;
const farmAnimalName = (animal: FarmAnimalType) => animal === "chicken" ? "小鸡" : animal === "cow" ? "奶牛" : "绵羊";

const TOOL_INFO: Record<Tool, { icon: string; name: string; key: string }> = {
  hoe: { icon: "⌁", name: "锄头", key: "1" },
  seed: { icon: "●", name: "萝卜种子", key: "2" },
  water: { icon: "◒", name: "洒水壶", key: "3" },
  hand: { icon: "✦", name: "收获", key: "4" },
  rod: { icon: "⌁", name: "鱼竿", key: "5" },
  axe: { icon: "⌂", name: "斧头", key: "6" },
  pickaxe: { icon: "⚒", name: "镐子", key: "7" },
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
const isCropResource = (resource: StorableResource): resource is CropType => resource !== "fish";

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
const DREAM_STORIES = [
  "农舍轻轻漂过云层，田地在脚下变成了一座会旋转的小岛……",
  "河水倒着流向天空，小鱼排成星座，慢慢游进月亮里面……",
  "发光的巨大作物长得比村庄还高，小房子像积木一样散落四周……",
  "屋顶带着整间农舍飞走了，云朵却落在草地上开出一片白花……",
  "蓝色河流从星空垂下来，鱼儿乘着水花一层一层往上跳……",
  "村庄缩进了一颗闪亮种子里，轻轻摇动就会传出钟声……",
  "许多农舍围着月亮慢慢转圈，烟囱里冒出的却是彩色星星……",
  "鱼塘飘到半空，水面朝下，却没有一滴水落到地面……",
  "作物长出柔软的云朵叶子，整片田地像呼吸一样一起起伏……",
  "一条看不见尽头的楼梯穿过农舍窗户，通向会唱歌的云端……",
  "天空变成安静的深海，发光的小鱼从屋顶上方成群游过……",
  "一条巨大的羊毛毯铺过山谷，树木和房子都在毯子上轻轻漂动……",
  "树林里的每一棵树都长着钟表，风吹过时，时间发出叮叮当当的声音……",
  "一架彩色楼梯从鱼塘伸进夜空，每走一级，脚下就开出一朵星星花……",
  "鸡、牛和羊变得像山一样高，却小心翼翼地围着一颗小种子散步……",
  "所有道路都变成柔软的丝带，带着小禾从一扇门飘进另一扇门……",
  "月亮落进了水壶里，浇出的每一滴水都会变成一只会飞的小鱼……",
  "整片农场被装进透明玻璃球，玻璃球外面是无边无际的紫色大海……",
  "树木拔起树根排成队伍，慢慢走过田野，寻找新的地方晒太阳……",
  "安静的云朵变成一群绵羊，在天空牧场里留下长长的银色羊毛……",
  "山洞深处开着一扇亮晶晶的小门，门后面竟然还是同一个山洞……",
  "一辆没有车轮的巴士沿着银河前进，每个站台都漂着一座小花园……",
  "田里的每棵作物都举着一盏灯，远远看去像一座倒过来的星空……",
  "海水退到天边后，沙滩下面露出一座会缓慢呼吸的蓝色村庄……",
] as const;
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
  { name: "金铁镐子", short: "镐", kind: "tool", tool: "pickaxe", description: "坚硬又闪亮的高级镐子，可使用 7 天；每处钻石矿能挖到 3 颗钻石。" },
] as const;

const GROUND_SUPPLY_PRICES = [45, 55, 160, 220, 220, 50, 60, 60, 650] as const;
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
  table: { name: "实木餐桌", short: "桌", description: "摆在二楼，坐下来吃东西会恢复更多体力", wood: 14, stone: 2 },
  floorLamp: { name: "室内落地灯", short: "光", description: "只摆在屋里，点击可照亮二楼", wood: 8, stone: 3, resin: 1 },
  television: { name: "像素电视机", short: "视", description: "摆在二楼，点击查看今日新闻和明天天气", wood: 12, stone: 6, resin: 1 },
  sofa: { name: "软垫沙发", short: "沙", description: "只摆在屋里，坐下可恢复 12 点体力", wood: 16, stone: 0, wool: 2 },
  bookshelf: { name: "矮木书柜", short: "书", description: "只摆在屋里，可以阅读农场与山谷故事", wood: 12, stone: 0 },
  dresser: { name: "衣物斗柜", short: "柜", description: "只摆在屋里，点击可以整理和更换衣服", wood: 15, stone: 0 },
  nightstand: { name: "床边小柜", short: "几", description: "只摆在屋里，放杯热水可恢复少量体力", wood: 7, stone: 0 },
  matches: { name: "火柴", short: "火", description: "进入山洞或帐篷后，可以点亮火光", wood: 3, stone: 0, resin: 2 },
  blanket: { name: "羊毛毯", short: "毯", description: "用绵羊的羊毛编织，点击背包中的毛毯恢复 30 点体力", wood: 0, stone: 0, wool: 3 },
};

const SHIPPING_CATALOG: ShippingCatalogItem[] = [
  ...(Object.keys(RESOURCE_INFO) as StorableResource[]).map((resource) => ({ id: `resource:${resource}`, name: RESOURCE_INFO[resource].name, short: resource === "fish" ? "鱼" : CROP_INFO[resource].short, price: RESOURCE_INFO[resource].price, group: "resource" as const, key: resource })),
  ...CROP_TYPES.map((crop) => ({ id: `seed:${crop}`, name: `${CROP_INFO[crop].name}种子`, short: CROP_INFO[crop].short, price: Math.max(12, Math.round(CROP_INFO[crop].seedPrice * .45)), group: "seed" as const, key: crop })),
  ...(Object.keys(CRAFT_RECIPES) as CraftType[]).map((craft) => ({ id: `craft:${craft}`, name: CRAFT_RECIPES[craft].name, short: CRAFT_RECIPES[craft].short, price: Math.max(25, CRAFT_RECIPES[craft].wood * 12 + CRAFT_RECIPES[craft].stone * 15 + (CRAFT_RECIPES[craft].resin ?? 0) * 22 + (CRAFT_RECIPES[craft].wool ?? 0) * 32), group: "craft" as const, key: craft })),
  { id: "single:wood", name: "木头", short: "木", price: 12, group: "single", key: "wood" },
  { id: "single:stone", name: "石材", short: "石", price: 15, group: "single", key: "stone" },
  { id: "single:diamonds", name: "山洞钻石", short: "◆", price: 2800, group: "single", key: "diamonds" },
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
  { id: "single:cookedCrabs", name: "熟螃蟹", short: "烤", price: 145, group: "single", key: "cookedCrabs" },
  { id: "single:cookedShrimp", name: "熟小虾", short: "炒", price: 132, group: "single", key: "cookedShrimp" },
  { id: "single:drinks", name: "漂流饮料", short: "饮", price: 42, group: "single", key: "drinks" },
  { id: "single:oldSocks", name: "旧袜子", short: "袜", price: 18, group: "single", key: "oldSocks" },
  { id: "single:puddleHoes", name: "水坑旧锄头", short: "锄", price: 75, group: "single", key: "puddleHoes" },
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

const SCHOOL_STUDENTS = ["小玲", "豆豆", "小满", "阿禾", "安安"];
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
  小芽: "小芽：我在窗台养了三盆嫩芽，每天都会记下它们长高了多少。",
  小石: "小石：我喜欢沿着溪边找圆石头，也愿意帮朋友给农田浇水。",
  安安: "安安：我住在农场西边，喜欢爬山、认路和在帐篷里看星星。有空一起去山洞探险吧！",
};
const YOUNG_FRIENDS = ["小玲", "豆豆", "小满", "阿禾", "小芽", "小石"] as const;
const SCHEDULED_RESIDENTS = ["林婶", "鲁师傅", "叶老师", "白医生", "阿麦", "周镇长", "沈馆长", "许老师", ...YOUNG_FRIENDS] as const;
const PERSON_CLOTHES: Record<string, string> = {
  林婶: "#b85c55", 鲁师傅: "#8a6848", 叶老师: "#77618e", 白医生: "#e8eee7", 阿麦: "#d68a45", 周镇长: "#526f91", 沈馆长: "#39766f", 诊所助手: "#c74646", 红衣助手: "#c74646", 许老师: "#4f7d66",
  小玲: "#dc7081", 豆豆: "#5f83b5", 小满: "#e29b45", 阿禾: "#6e9d58", 小芽: "#bf71a1", 小石: "#4e8b9b", 安安: "#4d9c9a",
  小桃: "#d9798b", 阿木: "#6f8d58", 小文: "#6d79a9", 小麦: "#d8a144", 小程: "#5e88a5", 小岚: "#499184", 小晴: "#9a6fa6",
};
const FOREST_STORY_TITLES = ["褪色的老松树", "迷路的萤火种", "雨后倒下的鸟屋", "沉睡的森林小溪"] as const;
const ILLNESSES: Record<IllnessId, { name: string; cause: string; method: TreatmentMethod; lesson: string; advice: string; recipe?: { herbs: number; pineapple: number; pineNuts: number } }> = {
  valleyCold: { name: "山谷感冒", cause: "换季受凉后出现的普通病症", method: "selfCare", lesson: "保暖观察与草药热敷", advice: "按顺序观察症状、消毒器具、调好温热草药并充分休息。" },
  rainFlu: { name: "雨雾流感", cause: "在连绵雨雾中淋得太久", method: "clinicOnly", lesson: "雨雾流感的隔离与处方", advice: "这种病不能自行处理，完成检查后必须使用诊所的专用处方药。" },
  windChill: { name: "风寒失温症", cause: "寒风和湿衣让身体长时间发冷", method: "baths", lesson: "安全复温与连续观察", advice: "连续三个晚上洗热水澡并好好睡觉；每次都要在卫生间完成。" },
  pollenFever: { name: "田野花粉热", cause: "春季花粉和干草刺激", method: "selfCare", lesson: "清洁呼吸与花粉隔离", advice: "先清洁脸和手，再完成温热护理与安静休息。" },
  caveChill: { name: "岩洞寒气症", cause: "在潮冷山洞里停留过久", method: "remedy", lesson: "岩洞寒气调和饮", advice: "医生只能告诉配方：菠萝 1 个、松子 2 颗、药材 2 份；材料要自己收集并亲手调制。", recipe: { herbs: 2, pineapple: 1, pineNuts: 2 } },
  overwork: { name: "过劳虚脱", cause: "体力耗尽后仍然继续劳动", method: "clinicOnly", lesson: "过劳评估与处方补液", advice: "必须由诊所处理，不能靠自行配药硬撑过去。" },
  nightCough: { name: "星夜咳嗽", cause: "夜深后在冷空气里停留过久", method: "remedy", lesson: "松香暖饮调制", advice: "医生只能告诉配方：菠萝 1 个、松子 2 颗、药材 1 份；回去后自己按步骤调制。", recipe: { herbs: 1, pineapple: 1, pineNuts: 2 } },
  riverDamp: { name: "河湾湿寒症", cause: "在潮湿河岸和冷水里活动太久", method: "baths", lesson: "湿寒恢复与热浴记录", advice: "连续三个晚上洗热水澡，每次洗完都要休息到第二天。" },
};
const ILLNESS_IDS = Object.keys(ILLNESSES) as IllnessId[];
const HIDDEN_TRIPS: Record<HiddenTripId, { name: string; description: string; action: string; reward: string }> = {
  hillsideTea: { name: "山腰果茶亭", description: "藏在果园后山的小茶亭没有公路和路牌，只能跟着熟悉山路的居民步行到达。", action: "一起尝果茶和松饼", reward: "果茶很暖，恢复了 18 点体力" },
  riverKitchen: { name: "河湾夜面摊", description: "面摊在河湾木桥的另一面，平时没有船接送，只有受邀时才能跟着居民乘小船过去。", action: "坐下来吃一碗热面", reward: "热面暖暖的，恢复了 22 点体力" },
  oldBookCafe: { name: "旧书巷茶馆", description: "茶馆藏在文化街旧书库后面，入口每天都会换，只有叶老师知道今天从哪扇门进去。", action: "一起读书吃点心", reward: "安静休息了一会儿，恢复了 16 点体力" },
  forestPlayground: { name: "林梢秘密游乐地", description: "这块林间空地没有画在地图上，需要跟着安安或鲁师傅穿过一段小树林。", action: "一起荡木秋千和追蝴蝶", reward: "开心玩耍，恢复了 20 点体力" },
};
const CAFE_DAILY_CHAT_TOPICS = [
  "今天的面包刚出炉，我吃完早餐就去忙自己的工作。",
  "昨晚山谷里起了风，今天走路时能闻到松树和泥土的味道。",
  "我在想周末的节日要准备什么，等会儿想去公告栏再看一遍。",
  "今天的咖啡有一点坚果香，阿麦说每天烘的豆子都会不太一样。",
  "上午忙完以后，我准备到河边走走，看看有没有新开的花。",
  "最近镇上的人都在交换农场经验，我也记下了一个新的浇水办法。",
];
const CAFE_TRAVEL_DESTINATIONS: Record<string, HiddenTripId> = {
  林婶: "hillsideTea", 鲁师傅: "forestPlayground", 叶老师: "oldBookCafe", 白医生: "riverKitchen", 周镇长: "hillsideTea", 沈馆长: "oldBookCafe", 许老师: "forestPlayground",
};
const HIDDEN_TRIP_ACTIVITIES: Record<HiddenTripId, Array<{ name: string; detail: string; icon: string; x: number; y: number }>> = {
  hillsideTea: [
    { name: "采一篮山莓", detail: "走到灌木旁，亲手挑下成熟山莓", icon: "莓", x: 18, y: 58 },
    { name: "亲手冲果茶", detail: "把山莓放进壶里，再倒入热水", icon: "茶", x: 67, y: 47 },
    { name: "敲响山风铃", detail: "到亭檐下听一段山谷回声", icon: "铃", x: 82, y: 25 },
  ],
  riverKitchen: [
    { name: "乘小木船过湾", detail: "自己走到码头，和朋友划过河湾", icon: "舟", x: 18, y: 63 },
    { name: "给汤锅添柴", detail: "把木柴放进灶膛，让汤锅咕嘟起来", icon: "火", x: 67, y: 55 },
    { name: "端热面看河灯", detail: "把热面端到河边，一边吃一边看灯", icon: "面", x: 84, y: 30 },
  ],
  oldBookCafe: [
    { name: "寻找夹页旧书", detail: "在书架间找出藏着叶片的那一本", icon: "书", x: 17, y: 38 },
    { name: "盖山谷藏书章", detail: "把书摊平，对准空白处压下印章", icon: "印", x: 66, y: 55 },
    { name: "制作叶片书签", detail: "挑叶片、穿细绳，做一枚能带走的书签", icon: "叶", x: 83, y: 29 },
  ],
  forestPlayground: [
    { name: "走过林间独木桥", detail: "保持平衡，一步一步走到桥对面", icon: "桥", x: 16, y: 58 },
    { name: "荡高高木秋千", detail: "连续摆动，把秋千荡到树梢旁", icon: "荡", x: 66, y: 52 },
    { name: "追三只彩蝴蝶", detail: "在草丛间跑动，靠近三只不同的蝴蝶", icon: "蝶", x: 84, y: 27 },
  ],
};
const TRIP_HANDS_ON_DETAILS: Record<HiddenTripId, Array<{ mode: TripHandsOnMode; instruction: string; route?: Array<"up" | "down" | "left" | "right">; parts?: string[]; gesture: "horizontal" | "vertical" | "free" }>> = {
  hillsideTea: [
    { mode: "move", instruction: "看发亮的山莓方向，用方向键穿过灌木，靠近后会自动采进篮子。", route: ["right", "up", "right", "down", "right", "up"], gesture: "free" },
    { mode: "drag", instruction: "按配方次序把山莓、茶叶和热水拖进茶壶，放错会退回托盘。", parts: ["山莓", "茶叶", "热水"], gesture: "free" },
    { mode: "gesture", instruction: "按住风铃绳上下拉动，让三枚铃片依次响起来。", gesture: "vertical" },
  ],
  riverKitchen: [
    { mode: "move", instruction: "用方向键操纵小木船绕开浅滩，沿水面航标划到对岸。", route: ["right", "up", "right", "right", "down", "right"], gesture: "free" },
    { mode: "drag", instruction: "依次把火绒、细枝和木柴拖进灶膛，顺序不对火就点不稳。", parts: ["火绒", "细枝", "木柴"], gesture: "free" },
    { mode: "gesture", instruction: "按住热面托盘，沿着发亮的横向路线平稳送到河边桌上。", gesture: "horizontal" },
  ],
  oldBookCafe: [
    { mode: "move", instruction: "按书脊旁的叶片线索在书架之间移动，逐层找到夹页旧书。", route: ["up", "right", "down", "right", "up", "left"], gesture: "free" },
    { mode: "drag", instruction: "依次把印泥、藏书章和压纸板拖到摊开的书页中央。", parts: ["印泥", "藏书章", "压纸板"], gesture: "free" },
    { mode: "gesture", instruction: "按住细绳沿书签上的孔来回穿线，走完一整条叶脉。", gesture: "free" },
  ],
  forestPlayground: [
    { mode: "move", instruction: "看桥板的方向一步一步移动，踩错方向会退回上一块桥板。", route: ["right", "right", "up", "right", "down", "right"], gesture: "free" },
    { mode: "drag", instruction: "把座板、左绳和右绳依次拖到树枝下的接口，装成真正的秋千。", parts: ["座板", "左绳", "右绳"], gesture: "free" },
    { mode: "gesture", instruction: "按住捕蝶网在草丛里连续追动，网经过三只彩蝶才算找到它们。", gesture: "free" },
  ],
};
const TRIP_MOVE_CHECKPOINTS: Record<HiddenTripId, Array<{ x: number; y: number }>> = {
  hillsideTea: [{ x: 23, y: 67 }, { x: 31, y: 48 }, { x: 45, y: 39 }, { x: 58, y: 59 }, { x: 72, y: 45 }, { x: 84, y: 29 }],
  riverKitchen: [{ x: 22, y: 69 }, { x: 31, y: 48 }, { x: 45, y: 42 }, { x: 59, y: 53 }, { x: 72, y: 63 }, { x: 86, y: 39 }],
  oldBookCafe: [{ x: 22, y: 39 }, { x: 34, y: 64 }, { x: 47, y: 34 }, { x: 60, y: 59 }, { x: 73, y: 31 }, { x: 86, y: 51 }],
  forestPlayground: [{ x: 21, y: 66 }, { x: 34, y: 59 }, { x: 46, y: 47 }, { x: 59, y: 52 }, { x: 72, y: 42 }, { x: 86, y: 34 }],
};
const SCHOOL_LESSONS: Array<{ title: string; pages: [string, string, string, string] }> = [
  { title: "作物品质为什么不同", pages: ["同一种种子也会长出不同品质，因为土壤、水分和连续照料都会留下影响。", "只在最后一天浇水不能补回前面缺少的照料；每天稳定照料更容易出现银星和金星。", "下雨会给作物补水，但雷雨可能伤到田里的幼苗，所以不能只看见雨水的好处。", "金星作物放进大号售卖箱会明显加价，日记的收藏页会永久记录收获过的品质。"] },
  { title: "围栏、门与农田保护", pages: ["围栏不仅挡住小动物，也会挡住小禾，所以完整围栏中间必须留一扇门。", "点击围栏门可以打开或关闭；门关着时，小动物进不去，小禾也不能穿过去。", "一个稻草人会大幅减少乌鸦，两个稻草人能把乌鸦完全赶走。", "作物还是幼苗时最容易被偷吃，成熟以后就不会再被小动物当成嫩芽。"] },
  { title: "天气与健康规则", pages: ["雨天在室外停留太久会积累淋雨时间，小禾和脚边宠物都可能因此生病。", "撑开彩色雨伞可以保护小禾；黄色宠物雨衣保护的是跟随宠物，不是鸡、牛和羊。", "生病以后先去诊所接受免费检查，医生确认后才会开出处方药。", "睡前洗澡会让第二天工作时体力消耗得更慢，不能代替每天正常休息。"] },
  { title: "山谷时间和四季", pages: ["游戏里的半小时大约等于现实中的半分钟，浇水、播种本身不会让时间突然跳过一小时。", "每天早上七点醒来，傍晚开始慢慢变暗，路灯和已经打开的室内灯会逐渐显出光。", "每个季节有二十八天；第二十八天睡觉后进入下一个季节。", "作物、节日、春秋游和居民活动都会受到季节与星期影响。"] },
  { title: "钓鱼不是立刻收获", pages: ["鱼竿放进鱼塘以后要先等浮标，问号出现时才代表有东西咬钩。", "提竿太早什么也没有，提竿太晚鱼会逃走；之后还要让游标停进绿色区域。", "幸运鱼竿会缩短等待时间，但仍然不能跳过观察和收线。", "鱼钩也可能带回石头、袜子、饮料甚至钻石，这些意外都会进入真实资源记录。"] },
  { title: "居民为什么不总在家", pages: ["居民早上会吃饭，中午回店里工作，午饭时又会离开，下午和晚上还可能散步。", "日记里的居民好感页会写出他们现在正在做什么，可以按地点去找本人。", "好感足够时，居民可能邀请小禾去地图上没有的地方；只能当场跟上，不能自己开车前往。", "同一个居民每天第一次聊天和认真送礼都会增加好感，关系越好，邀请与帮助越多。"] },
  { title: "自动售卖与存放", pages: ["收纳箱会一直保留东西；大号售卖箱里的物品会在睡觉后卖掉，两种箱子不能混淆。", "连续放入五个同类物品时，可以选择一次放入背包里的全部同类物品。", "基础锄头、水壶、收获工具和普通鱼竿不能卖掉，避免小禾失去基本玩法。", "银星和金星作物的加价会计入第二天早上的收入通知。"] },
  { title: "山洞、钻石和火光", pages: ["山洞里太暗时需要先使用火柴点亮火把，钻石可能只从岩石后露出一点尖角。", "普通镐子和金铁镐子的收获量不同；高级工具有使用期限。", "钻石矿的位置会随日期变化，不能每天只点同一个地方。", "电视新闻提到矿脉变化时，新闻画面中的地点和山洞里真正发生的事情是一致的。"] },
  { title: "宠物和牧场动物不同", pages: ["鸡、牛和羊住在围栏农场，分别产鸡蛋、牛奶和羊毛。", "猫、狗、小鸡、小鸭、兔子和仓鼠属于跟随宠物，需要每天准备宠物粮。", "跟随宠物可能生病、走失或带回小礼物；牧场动物不使用这一套生病规则。", "同种宠物一男一女共同生活很久以后可能生宝宝，宠物店也可以接回宠物。"] },
  { title: "存档和两个村庄", pages: ["青禾村与枫叶村是两个独立账号，各自保存农田、背包、围栏和房屋进度。", "切换村庄前游戏会保存当前村庄，不会把青禾村的围栏复制到枫叶村。", "游戏正常游玩时会自动保存，睡觉和切换村庄也会保存。", "无痕浏览可能无法长期保留设备存档，换设备时要使用网页版转移功能。"] },
];
const GUIDE_TOPICS: Array<{ id: GuideTopicId; title: string; icon: string; summary: string; steps: string[]; tip: string }> = [
  { id: "start", title: "第一次进入游戏", icon: "走", summary: "用方向键、WASD 或点击地面移动小禾。走到场景最边缘，才会前往相邻地点。", steps: ["方向键或 WASD：一步一步走", "鼠标或手指点击地面：自动走过去", "左上角叶子菜单：打开说明、瞬移、制作和日记", "下方工具栏：选择当前要使用的工具"], tip: "游戏里半分钟约等于一小时；每天早上七点醒来。" },
  { id: "farming", title: "种地与作物品质", icon: "苗", summary: "锄地、播种、浇水、等待成长，成熟后再用手收获。", steps: ["先选锄头，走近土地后点击一格草地", "选择种子并点击松好的土", "每天走近作物，用洒水壶浇水", "长到第三阶段后选择收获", "连续照料会得到银星或金星品质，卖价更高"], tip: "下雨会自动浇水；保温室和手动浇水一起使用时成长更快。" },
  { id: "fishing", title: "钓鱼", icon: "鱼", summary: "拿出鱼竿走到鱼塘边，等待问号出现后及时提竿，再完成收线小游戏。", steps: ["在工具栏选择鱼竿", "走到鱼塘附近并点击水面", "等待浮标上方出现问号", "及时点击提竿", "控制游标停在绿色区域，把鱼拉上来"], tip: "幸运鱼竿咬钩更快，也可能钓到钻石、袜子或饮料。" },
  { id: "tools", title: "砍树、挖矿与制作", icon: "斧", summary: "斧头砍树和敲农场石头，镐子挖山洞钻石；材料会进入资源记录。", steps: ["选择斧头，再靠近树木或农场石头", "选择镐子并带火柴进入山洞", "点击左上角叶子，再打开制作", "材料足够时制作，成品进入背包", "选中家具后点击绿色位置摆放"], tip: "砍树会得到木头、树脂、松子和松果；松果可以重新种树。" },
  { id: "town", title: "小镇、商店与瞬移", icon: "镇", summary: "从农场右侧前往中心街，再走向文化街、住宅坡和居民家。", steps: ["走到道路最边缘切换地点", "点击建筑门进入室内", "超市购买种子和补给", "诊所检查身体并购买药物", "八岁学会本人瞬移后，可以点开目的地图直接到达"], tip: "远方新区需要驾照、汽车和修好的道路才能前往。" },
  { id: "friends", title: "居民、送礼与好感", icon: "心", summary: "居民每天有自己的行程。聊天和送喜欢的礼物会增加好感，解锁新的相处事件。", steps: ["点击居民进行当天第一次聊天", "双击物品把它举到头顶", "点击居民把礼物送出去", "打开山谷日记查看好感星级", "好感提高后，居民会来家里、回礼或邀请一起活动"], tip: "同一个人每天第一次聊天会增加好感；生日送礼效果最好。" },
  { id: "home", title: "农舍、睡觉与做饭", icon: "家", summary: "农舍可以睡觉、开灯、点火、摆家具；扩建厨房后能亲手做饭。", steps: ["点击农舍门进入家中", "点击床盖好被子并进入第二天", "二楼厨房先切食材，再控制火候并装盘", "熟食会进入资源记录，不会立刻吃掉", "睡前洗澡，第二天体力消耗更慢"], tip: "在餐桌前吃熟食会恢复更多体力。" },
  { id: "animals", title: "动物与宠物", icon: "宠", summary: "牧场动物每天产蛋、奶和羊毛；小宠物会跟随小禾，需要食物，也可能带回礼物。", steps: ["先建动物围栏，再去牧场购买鸡、牛、羊", "每天点击动物收取产品", "去远方新区宠物店领养宠物", "每天准备足够宠物粮", "雨天给跟随宠物穿黄色小雨衣"], tip: "鸡、牛、羊不使用宠物生病规则；生病的是跟在脚边的小宠物。" },
  { id: "weather", title: "时间、天气与健康", icon: "雨", summary: "天气每天变化，傍晚会慢慢天黑；淋雨太久或耗尽体力可能生病。", steps: ["查看顶端时间和天气", "下雨时打开背包里的雨伞", "夜晚路灯和屋内灯光会亮", "身体不舒服时去诊所免费检查", "药材可以治疗自己和生病居民"], tip: "雷雨偶尔会劈坏作物；及时休息和洗澡能保护健康。" },
  { id: "festival", title: "学校、节日与旅行", icon: "节", summary: "公告栏记录全年节日和生日。每个节日都有需要亲手完成的活动过程。", steps: ["到镇公所查看完整日历", "点击日期可以体验节日", "前往节日场地找到活动入口", "按照步骤完成磨咖啡、做河灯、划龙舟等活动", "右上角叉号退出体验并回到原来的日期"], tip: "春游和秋游从学校坐大巴出发；上课日听课可以获得金币。" },
  { id: "multiplayer", title: "双人模式", icon: "双", summary: "顶端的双人模式可以让两个人分别游玩青禾村和枫叶村。", steps: ["点击顶端双人模式", "建立或加入同一个房间", "玩家一使用 WASD，玩家二使用方向键", "青禾村一直向右可到枫叶村", "枫叶村一直向左可到青禾村并相遇"], tip: "两个村庄有各自独立的农田、围栏、背包和进度。" },
  { id: "save", title: "存档与网页版", icon: "存", summary: "游戏会自动保存当前村庄。不要使用浏览器的无痕模式，否则设备可能不会保留存档。", steps: ["正常游玩时会自动保存", "睡觉和切换村庄也会保存", "需要换设备时使用“转移到网页版”", "打开分享网址进入同一版本游戏", "重新开始按钮会清空当前进度，使用前要确认"], tip: "青禾村与枫叶村分开保存，切换村庄不会互相覆盖。" },
];
const BIRTHDAY_GUESTS = Object.keys(PERSON_DIALOGUES);
const RESIDENT_PET_NICKNAMES = ["团团", "栗子", "豆包", "雪球", "芝麻", "米粒", "跳跳", "卷卷", "布丁", "小麦", "星星", "云朵", "果果", "点点", "泡泡", "松松", "花生"];
const residentPetProfile = (name: string) => {
  const nameCode = [...name].reduce((total, letter) => total + (letter.codePointAt(0) ?? 0), 0);
  const index = Math.abs(nameCode + BIRTHDAY_GUESTS.indexOf(name) * 7);
  const pet = PET_CATALOG[index % PET_CATALOG.length];
  const strengths: Record<PetType, string> = { cat: "转身灵巧", dog: "推球有力", chick: "冲刺很快", duck: "脚步稳定", rabbit: "跳跃敏捷", hamster: "判断机灵" };
  return { ...pet, nickname: RESIDENT_PET_NICKNAMES[index % RESIDENT_PET_NICKNAMES.length], variant: index % 6, strength: strengths[pet.id] };
};
const NPC_HAIR_COLORS = ["#4a3328", "#6b432d", "#342f35", "#765230", "#3e4b46", "#6d3d46"];
const NPC_SKIN_COLORS = ["#efbd95", "#e7ad82", "#d99b72", "#f2c7a1"];
const NPC_OUTFIT_ACCENTS = ["#f0c768", "#d7e8ed", "#f0a4a0", "#b7d88b", "#d4b3e2", "#e9d39a", "#9fd0cf", "#e9a96f"];
const personClothesStyle = (name: string) => {
  const nameCode = [...name].reduce((total, letter) => total + (letter.codePointAt(0) ?? 0), 0);
  return { "--npc-clothes": PERSON_CLOTHES[name] ?? "#6b8b68", "--npc-accent": NPC_OUTFIT_ACCENTS[nameCode % NPC_OUTFIT_ACCENTS.length], "--npc-hair": NPC_HAIR_COLORS[nameCode % NPC_HAIR_COLORS.length], "--npc-skin": NPC_SKIN_COLORS[nameCode % NPC_SKIN_COLORS.length] } as CSSProperties;
};

const residentActivity = (name: string, hour: number, day: number, weather: Weather): ResidentSchedule => {
  const workday = (day - 1) % 7 < 5;
  const workplace: Scene = ["周镇长", "沈馆长", "许老师"].includes(name) ? "cultureDistrict" : "town";
  const home: Scene = name === "林婶" ? "eastNeighbor" : name === "鲁师傅" ? "southNeighbor" : name === "叶老师" ? "northNeighbor" : "residentialDistrict";
  const weekday = (day - 1) % 7;
  if ((YOUNG_FRIENDS as readonly string[]).includes(name)) {
    if (hour < 8) return { key: "home", label: "在自己的家里整理书包", scene: home };
    if (hour < 10) return { key: "breakfast", label: "在麦香咖啡吃早饭、等朋友", scene: "town" };
    if ([0, 2, 4, 6].includes(weekday) && hour < 15) return { key: "school", label: "在青禾学校坐在课桌前听课", scene: "cultureDistrict" };
    if (hour < 19) return { key: "play", label: weekday % 2 ? "在农场边玩，也愿意帮忙干农活" : "在文化街和同学一起玩", scene: weekday % 2 ? "farm" : "cultureDistrict" };
    return { key: "home", label: "回到自己的小屋休息", scene: home };
  }
  if (hour < 8) return { key: "breakfast", label: "在自己的家里准备出门", scene: home };
  if (hour < 10) return { key: "breakfast", label: name === "阿麦" ? "在麦香咖啡准备大家的早餐" : "在麦香咖啡吃早饭", scene: "town" };
  if (weather === "rain" || weather === "thunder") {
    if (hour >= 19) return { key: "home", label: "已经回家擦干雨水", scene: home };
    if (hour >= 13 && hour < 15) return { key: "lunch", label: "在麦香咖啡吃热汤午饭", scene: "town" };
    return { key: "rain", label: workday ? "撑伞在工作地点值班" : "在文化街屋檐下听雨", scene: workday ? workplace : "cultureDistrict" };
  }
  if (workday && hour < 13) return { key: "work", label: name === "许老师" ? "在学校给大家上课" : "在自己的店里工作", scene: workplace };
  if (hour < 15) return { key: "lunch", label: weekday % 2 ? "在文化街小饭桌吃午饭" : "在麦香咖啡吃午饭", scene: weekday % 2 ? "cultureDistrict" : "town" };
  if (workday && hour < 18) return { key: "work", label: "回到自己的店里继续工作", scene: workplace };
  if (hour < 21) {
    if (weekday === 1) return { key: "walk", label: "在东郊果园散步，可能邀请朋友去山腰茶亭", scene: "eastNeighbor", invite: name === "林婶" ? "hillsideTea" : undefined };
    if (weekday === 3) return { key: "walk", label: "在农场河边玩，可能坐船去河湾吃饭", scene: "farm", invite: name === "阿麦" || name === "白医生" ? "riverKitchen" : undefined };
    if (weekday === 5) return { key: "walk", label: "在文化街逛旧书摊", scene: "cultureDistrict", invite: name === "叶老师" ? "oldBookCafe" : name === "鲁师傅" ? "forestPlayground" : undefined };
    if (weekday === 6) return { key: "walk", label: "去安安的小农场一起玩", scene: "westFriendFarm", invite: name === "鲁师傅" ? "forestPlayground" : undefined };
    return { key: "walk", label: weekday === 2 ? "沿着青禾溪慢慢散步" : "在中心街买东西、和居民聊天", scene: weekday === 2 ? "farm" : "town" };
  }
  return { key: "home", label: "已经回家休息", scene: home };
};

const VILLAGE_INFO: Record<VillageId, { name: string; farm: string; description: string }> = {
  qinghe: { name: "青禾村", farm: "青禾农场", description: "绿野、溪流与温暖的木屋" },
  maple: { name: "枫叶村", farm: "枫叶农场", description: "红枫、山路与安静的坡地" },
};

const RESIDENT_QUESTS: ResidentQuest[] = [
  { id: "orchardCrate", giver: "林婶", title: "果园里滚走的果篮", location: "东郊果园", village: "qinghe", scene: "eastNeighbor", detail: "林婶的竹篮滚到果树后面，请到东郊找到它并把散落果子装回去。", action: "扶正竹篮并装回果子", icon: "篮", reward: 75 },
  { id: "clinicParcel", giver: "白医生", title: "诊所门前的护理包", location: "青禾中心街", village: "qinghe", scene: "town", detail: "送药车把护理包放错了门口，请在诊所外核对名字和封口。", action: "核对护理包标签", icon: "护", reward: 80 },
  { id: "roadSigns", giver: "周镇长", title: "文化街褪色的路牌", location: "清河文化街", village: "qinghe", scene: "cultureDistrict", detail: "雨水冲淡了文化街路牌，请逐字查看方向，免得来访居民走错路。", action: "擦净路牌并核对方向", icon: "牌", reward: 90 },
  { id: "workshopMeasure", giver: "鲁师傅", title: "山脚院子的木料尺寸", location: "南坡木匠院", village: "qinghe", scene: "southNeighbor", detail: "鲁师傅留下三块长短不同的木料，请到院里重新量好顺序。", action: "按长短整理木料", icon: "尺", reward: 85 },
  { id: "springWater", giver: "阿麦", title: "咖啡要用的清晨泉水", location: "青禾农场鱼塘边", village: "qinghe", scene: "farm", detail: "阿麦想试做一壶山泉咖啡，请在农场水边装一瓶清晨的水。", action: "在水边装满玻璃瓶", icon: "泉", reward: 70 },
  { id: "museumRubbing", giver: "沈馆长", title: "博物馆前的旧石纹", location: "清河文化街", village: "qinghe", scene: "cultureDistrict", detail: "博物馆台阶边露出一道旧纹样，请轻轻清理泥土并拓下完整轮廓。", action: "清泥并拓印石纹", icon: "纹", reward: 100 },
  { id: "libraryPages", giver: "叶老师", title: "北林飘散的书页", location: "北林书屋", village: "qinghe", scene: "northNeighbor", detail: "风把三页农事笔记吹到书屋外，请按照页码收回。", action: "按页码收好散页", icon: "页", reward: 80 },
  { id: "schoolSpecimen", giver: "许老师", title: "课堂缺少的种子标本", location: "清河文化街", village: "qinghe", scene: "cultureDistrict", detail: "学校标本盒少了一格，请查看花园边的种子并贴上正确名字。", action: "辨认并装好种子标本", icon: "种", reward: 95 },
  { id: "ananTrail", giver: "安安", title: "林边小路的新脚印", location: "安安的小农场", village: "qinghe", scene: "westFriendFarm", detail: "安安在小路上发现一串陌生脚印，请沿地面慢慢观察它通向哪里。", action: "沿着脚印调查小路", icon: "印", reward: 75 },
];

const starHarvestCount = (state: GameState, crops: CropType[] = CROP_TYPES) => crops.reduce((total, crop) => total + state.cropQualityHarvests[crop].silver + state.cropQualityHarvests[crop].gold, 0);
const goldHarvestCount = (state: GameState) => CROP_TYPES.reduce((total, crop) => total + state.cropQualityHarvests[crop].gold, 0);
const discoveredCropCount = (state: GameState) => CROP_TYPES.filter((crop) => Object.values(state.cropQualityHarvests[crop]).some((count) => count > 0)).length;
const natureDiscoveryCount = (state: GameState) => discoveredCropCount(state)
  + Math.min(3, state.museumArtifacts.length)
  + Math.min(2, state.libraryBooks.length)
  + (state.fishCaught > 0 ? 1 : 0)
  + (state.herbs > 0 ? 1 : 0)
  + (state.diamonds > 0 ? 1 : 0);
const sunnyFruitPlantings = (state: GameState) => ["strawberry", "blueberry", "watermelon", "pineapple"].reduce((total, crop) => total + (state.wishPlantingRecords[`weather:sunny:${crop}`] ?? 0), 0);
const suitableSeasonPlantings = (state: GameState) => [
  [0, "radish"], [0, "strawberry"], [0, "blueberry"],
  [1, "watermelon"], [1, "tomato"], [1, "pineapple"],
  [2, "corn"], [2, "pumpkin"], [2, "potato"],
  [3, "potato"], [3, "radish"], [3, "blueberry"],
].reduce((total, [season, crop]) => total + (state.wishPlantingRecords[`season:${season}:${crop}`] ?? 0), 0);

const WISH_MATERIAL_INFO: Record<WishMaterial, string> = { wood: "木头", stone: "石材", resin: "树脂", herbs: "药材", pinecones: "松果", pineNuts: "松子", diamonds: "钻石" };
const WISH_MATERIAL_ICONS: Record<WishMaterial, string> = { wood: "木", stone: "石", resin: "脂", herbs: "药", pinecones: "果", pineNuts: "仁", diamonds: "钻" };
const WISH_PRODUCT_VISUAL: Record<string, string> = {
  林婶: "tea", 鲁师傅: "house", 叶老师: "book", 白医生: "medicine", 阿麦: "menu", 周镇长: "bridge", 沈馆长: "museum", 许老师: "lesson", 安安: "adventure",
  诊所助手: "medicine", 小玲: "book", 豆豆: "pond", 小满: "seeds", 阿禾: "book", 小芽: "measure", 小石: "pond",
};

const RESIDENT_WISH_DEFINITIONS: Record<string, ResidentWishDefinition> = {
  林婶: { title: "四季果园茶会", story: "林婶想用晴天长出的星级水果办茶会，普通作物还不够甜。", firstLabel: "晴天播种草莓、蓝莓、西瓜或菠萝", firstNeed: 4, firstMetric: sunnyFruitPlantings, firstAbsolute: true, secondLabel: "收获银星或金星水果", secondNeed: 4, secondMetric: (state) => starHarvestCount(state, ["strawberry", "blueberry", "watermelon", "pineapple"]), secondAbsolute: true, finalPlace: "带齐配料去东郊果园找林婶煮茶", finalProduct: "四季星果茶宴", finalCost: { herbs: 2, pineNuts: 3, resin: 1 } },
  鲁师傅: { title: "会呼吸的木屋模型", story: "鲁师傅要做真正能开合通风窗的模型，材料必须结实，还要用树脂封住接缝。", firstLabel: "准备至少 24 块木头", firstNeed: 24, firstMetric: (state) => state.wood, firstAbsolute: true, secondLabel: "准备至少 12 块石材", secondNeed: 12, secondMetric: (state) => state.stone, secondAbsolute: true, finalPlace: "带齐材料去南坡院子，和鲁师傅拼装、打磨并开通风孔", finalProduct: "会呼吸的木屋模型", finalCost: { wood: 24, stone: 12, resin: 4 } },
  叶老师: { title: "山谷自然观察册", story: "观察册不能只画一种萝卜，要收集田野、水边、书页与博物馆里的不同发现。", firstLabel: "发现并收获不同农作物", firstNeed: 6, firstMetric: discoveredCropCount, firstAbsolute: true, secondLabel: "累计不同自然发现", secondNeed: 9, secondMetric: natureDiscoveryCount, secondAbsolute: true, finalPlace: "带材料到北林书屋分类、压叶并装订", finalProduct: "山谷自然观察册", finalCost: { pinecones: 2, resin: 2, herbs: 1 } },
  白医生: { title: "星级营养调理册", story: "白医生需要高品质食物和真正的药材记录，普通收获不能代替。", firstLabel: "收获银星或金星食物", firstNeed: 5, firstMetric: starHarvestCount, firstAbsolute: true, secondLabel: "准备至少 4 份药材", secondNeed: 4, secondMetric: (state) => state.herbs, secondAbsolute: true, finalPlace: "到诊所称量药材、研磨松子并完成调理配方", finalProduct: "星级营养药膳", finalCost: { herbs: 4, pineNuts: 3, resin: 1 } },
  阿麦: { title: "从季节到餐桌的菜单", story: "阿麦只接受在正确季节种下并精心照料的食材，还要亲手做成菜单样品。", firstLabel: "在适合季节播种指定作物", firstNeed: 6, firstMetric: suitableSeasonPlantings, firstAbsolute: true, secondLabel: "收获银星或金星食材", secondNeed: 4, secondMetric: starHarvestCount, secondAbsolute: true, finalPlace: "去麦香咖啡研磨、烹煮并摆好整桌菜单", finalProduct: "四季星级菜单", finalCost: { pineNuts: 4, herbs: 2, resin: 1 } },
  周镇长: { title: "真正能走通的新路线", story: "路线要经过居民验证，还要准备桥面木料、石基和防水树脂。", firstLabel: "完成不同居民委托", firstNeed: 4, firstMetric: (state) => state.residentQuestCompletions.length, firstAbsolute: true, secondLabel: "准备至少 15 块石材", secondNeed: 15, secondMetric: (state) => state.stone, secondAbsolute: true, finalPlace: "带材料到镇公所测量路线并拼出桥面模型", finalProduct: "青禾谷通行路线模型", finalCost: { wood: 12, stone: 15, resin: 3 } },
  沈馆长: { title: "水土与生活小展览", story: "展览必须有真正捐赠过的藏品和不同作物记录，不能拿同一样东西凑数。", firstLabel: "向博物馆捐赠不同藏品", firstNeed: 3, firstMetric: (state) => state.museumArtifacts.length, firstAbsolute: true, secondLabel: "发现不同成熟农作物", secondNeed: 5, secondMetric: discoveredCropCount, secondAbsolute: true, finalPlace: "到博物馆清理底座、固定藏品并写说明牌", finalProduct: "水土生活特别展", finalCost: { stone: 8, resin: 2, diamonds: 1 } },
  许老师: { title: "一堂真正的农场课", story: "课堂要展示适季播种和金星成果，学生必须看到完整成长证据。", firstLabel: "在适合季节播种指定作物", firstNeed: 6, firstMetric: suitableSeasonPlantings, firstAbsolute: true, secondLabel: "收获金星作物", secondNeed: 2, secondMetric: goldHarvestCount, secondAbsolute: true, finalPlace: "去学校摆标本、写黑板并亲自讲完整过程", finalProduct: "农场成长实验课", finalCost: { wood: 6, pinecones: 2, resin: 1 } },
  安安: { title: "林边秘密探险册", story: "安安要记录真正长起来的树和地图外的不同发现，还需要耐用的野外装订材料。", firstLabel: "种下并照料松果树苗", firstNeed: 3, firstMetric: (state) => state.plantedTrees.length, firstAbsolute: true, secondLabel: "累计不同自然发现", secondNeed: 8, secondMetric: natureDiscoveryCount, secondAbsolute: true, finalPlace: "到安安的小农场压地图、系绳并装订探险册", finalProduct: "林边秘密探险册", finalCost: { wood: 8, pinecones: 2, resin: 3 } },
  诊所助手: { title: "会自己归位的护理箱", story: "护理箱要装得下星级补给和多种药材，还要能经受反复开合。", firstLabel: "收获银星或金星食物", firstNeed: 3, firstMetric: starHarvestCount, firstAbsolute: true, secondLabel: "准备至少 4 份药材", secondNeed: 4, secondMetric: (state) => state.herbs, secondAbsolute: true, finalPlace: "到诊所按治疗顺序装盒并测试开合", finalProduct: "自动归位护理箱", finalCost: { wood: 10, herbs: 4, resin: 2 } },
  小玲: { title: "会开花的小作文", story: "作文要记录雨天和晴天都照料过的不同作物，还要压进真正的植物材料。", firstLabel: "发现并收获不同农作物", firstNeed: 5, firstMetric: discoveredCropCount, firstAbsolute: true, secondLabel: "收获银星或金星作物", secondNeed: 3, secondMetric: starHarvestCount, secondAbsolute: true, finalPlace: "找到小玲，压花、排页并写完结尾", finalProduct: "会开花的小作文", finalCost: { herbs: 2, pinecones: 1, resin: 1 } },
  豆豆: { title: "池塘里的数字秘密", story: "豆豆要把水中发现和居民调查放到同一张图上，样本不能只有鱼。", firstLabel: "钓到至少 6 件水中发现", firstNeed: 6, firstMetric: (state) => state.fishCaught, secondLabel: "完成不同居民委托", secondNeed: 3, secondMetric: (state) => state.residentQuestCompletions.length, secondAbsolute: true, finalPlace: "找到豆豆，分类鱼获并画成完整图表", finalProduct: "池塘数字调查图", finalCost: { wood: 4, stone: 4, resin: 1 } },
  小满: { title: "四季种子玻璃瓶", story: "瓶子里必须放入在合适季节种下的多种作物记录，不能用同一颗种子重复充数。", firstLabel: "在适合季节播种指定作物", firstNeed: 7, firstMetric: suitableSeasonPlantings, firstAbsolute: true, secondLabel: "发现并收获不同农作物", secondNeed: 6, secondMetric: discoveredCropCount, secondAbsolute: true, finalPlace: "找到小满，分层装瓶并系上四季标签", finalProduct: "四季种子玻璃瓶", finalCost: { herbs: 2, pineNuts: 4, resin: 2 } },
  阿禾: { title: "能摸到的农场单词书", story: "每个单词旁都要贴真实的不同发现，还要有高品质食物样本。", firstLabel: "累计不同自然发现", firstNeed: 8, firstMetric: natureDiscoveryCount, firstAbsolute: true, secondLabel: "收获银星或金星作物", secondNeed: 3, secondMetric: starHarvestCount, secondAbsolute: true, finalPlace: "找到阿禾，配对单词、实物和图画", finalProduct: "农场实物单词书", finalCost: { wood: 4, herbs: 1, resin: 2 } },
  小芽: { title: "幼苗天气身高尺", story: "身高尺要比较适季作物和星级作物的成长，观察记录必须跨过几天。", firstLabel: "在适合季节播种指定作物", firstNeed: 5, firstMetric: suitableSeasonPlantings, firstAbsolute: true, secondLabel: "收获银星或金星作物", secondNeed: 4, secondMetric: starHarvestCount, secondAbsolute: true, finalPlace: "找到小芽，对准幼苗逐格刻下高度", finalProduct: "幼苗天气身高尺", finalCost: { wood: 8, stone: 3, resin: 2 } },
  小石: { title: "溪石与水流路线", story: "小石要用真正的水中发现和坚固石材重现溪流路线。", firstLabel: "钓到至少 5 件水中发现", firstNeed: 5, firstMetric: (state) => state.fishCaught, secondLabel: "准备至少 12 块石材", secondNeed: 12, secondMetric: (state) => state.stone, secondAbsolute: true, finalPlace: "找到小石，逐块排列溪石并试水", finalProduct: "会流动的溪石路线", finalCost: { stone: 12, resin: 2, pinecones: 1 } },
};

const residentWishDefinition = (name: string): ResidentWishDefinition => RESIDENT_WISH_DEFINITIONS[name] ?? {
  title: `${name}的山谷纪念盒`,
  story: `${name}想保存一份亲自参与农场生活的纪念，不希望小禾只是点一下按钮就送来成品。`,
  firstLabel: "再播种 4 次共同观察的种子",
  firstNeed: 4,
  firstMetric: (state) => state.planted,
  secondLabel: "再完成 6 次浇水照料",
  secondNeed: 6,
  secondMetric: (state) => state.wateredCount,
  finalPlace: `找到${name}，一起把几天的记录装进纪念盒`,
  finalProduct: `${name}的山谷纪念盒`,
  finalCost: { wood: 6, stone: 3, resin: 1 },
};

const wishCostEntries = (definition: ResidentWishDefinition) => (Object.entries(definition.finalCost) as [WishMaterial, number][])
  .filter(([, amount]) => amount > 0);

const hasWishMaterials = (state: GameState, definition: ResidentWishDefinition) => wishCostEntries(definition)
  .every(([material, amount]) => state[material] >= amount);

const wishCostText = (definition: ResidentWishDefinition) => wishCostEntries(definition)
  .map(([material, amount]) => `${WISH_MATERIAL_INFO[material]} ${amount}`)
  .join("、");

const RESIDENT_WORK_OPTIONS: { job: ResidentWorkJob; icon: string; label: string; place: string }[] = [
  { job: "water", icon: "水", label: "给农作物浇水", place: "青禾农场" },
  { job: "plantFruit", icon: "苗", label: "帮我播种水果", place: "青禾农场" },
  { job: "fertilize", icon: "肥", label: "给作物施肥", place: "青禾农场" },
  { job: "mineDiamond", icon: "钻", label: "进山洞挖钻石", place: "青禾山洞" },
  { job: "chopWood", icon: "木", label: "砍树收集木材", place: "青禾农场" },
  { job: "gatherHerbs", icon: "药", label: "去野外采药材", place: "青禾农场" },
];

const residentWorkLabel = (job: ResidentWorkJob) => RESIDENT_WORK_OPTIONS.find((option) => option.job === job)?.label ?? "帮助农场";

const FESTIVAL_SCHEDULE: { season: number; day: number; id: FestivalId; name: string; place: string; description: string }[] = [
  { season: 0, day: 3, id: "seeds", name: "种子分享日", place: "青禾超市", description: "免费领取水果和蔬菜种子大礼包" },
  { season: 0, day: 8, id: "kite", name: "春风纸鸢会", place: "中心广场", description: "亲手装好纸鸢，迎着春风把它放上天空" },
  { season: 0, day: 13, id: "spring", name: "春日集市", place: "中心广场", description: "果酱、木工作品和山谷音乐" },
  { season: 0, day: 15, id: "lantern", name: "元宵灯会", place: "中心广场", description: "看花灯、猜灯谜，免费品尝汤圆" },
  { season: 0, day: 23, id: "flower", name: "百花观察节", place: "东郊果园", description: "辨认花朵、记录香气，为蜜蜂搭一座小花屋" },
  { season: 1, day: 5, id: "dragonBoat", name: "端午龙舟节", place: "中心广场", description: "看龙舟鼓阵，免费品尝粽子" },
  { season: 1, day: 12, id: "fishing", name: "钓鱼节", place: "农场钓鱼池", description: "带上鱼竿参加山谷钓鱼比赛" },
  { season: 1, day: 18, id: "water", name: "清凉戏水日", place: "中心广场", description: "接水、搭水道并参加山谷接力泼水赛" },
  { season: 1, day: 22, id: "medical", name: "青禾医疗节", place: "青禾诊所", description: "跟白医生完成诊断和照护训练，学会复杂的自我治疗" },
  { season: 1, day: 25, id: "firefly", name: "萤火虫之夜", place: "安安的小农场", description: "制作观察灯、沿林边寻找萤火虫并做好记录" },
  { season: 2, day: 7, id: "harvest", name: "金秋丰收赛", place: "青禾农场", description: "辨认成熟作物、装筐称重并完成丰收接力" },
  { season: 2, day: 15, id: "midAutumn", name: "中秋赏月会", place: "中心广场", description: "挂灯笼、赏圆月，大家一起吃月饼" },
  { season: 2, day: 20, id: "coffee", name: "咖啡日", place: "麦香咖啡", description: "品尝咖啡和刚出炉的点心" },
  { season: 2, day: 25, id: "leafMusic", name: "枫叶音乐节", place: "清河文化街", description: "收集落叶、调试乐器并合奏一首秋日曲子" },
  { season: 3, day: 6, id: "firstSnow", name: "初雪堆雪节", place: "中心广场", description: "滚雪球、搭雪人并给它围上温暖围巾" },
  { season: 3, day: 16, id: "hotSoup", name: "冬日热汤会", place: "麦香咖啡", description: "挑选食材、控制火候并与居民分享热汤" },
  { season: 3, day: 27, id: "craft", name: "山谷手作日", place: "木匠工坊", description: "居民一起展示亲手制作的作品" },
  { season: 3, day: 28, id: "springFestival", name: "春节庆典", place: "中心广场", description: "贴春联、挂灯笼，一起吃年糕迎接新春" },
];

const RESIDENT_BIRTHDAYS = [
  { name: "小禾", season: 0, day: 19 },
  ...BIRTHDAY_GUESTS.map((name, index) => ({
    name,
    season: index % SEASONS.length,
    day: 2 + ((index * 5 + 3) % 25),
  })),
];

type DailyNews = { kind: "festival" | "thunder" | "missingPet" | "cave" | "supermarket" | "school" | "anan" | UrgentEventKind; text: string; urgent: boolean };
type TvChannel = "news" | "sports" | "national" | "kids" | "farm";
type NewsBroadcast = { news: DailyNews; forecast: string; automatic: boolean; channel: TvChannel };
type TvStory = { title: string; beats: [string, string, string, string, string] };
const SPORTS_STORIES: [TvStory, TvStory] = [
  { title: "山谷篮球联赛 · 青禾队对枫叶队", beats: ["裁判吹哨，青禾队从后场发球。", "阿岚运球过半场，把球传给篮下的小波。", "枫叶队突然抢断，小禾追上去把球拍了回来！", "还剩三秒，小禾在三分线外起跳投篮。", "篮球擦过篮板落进篮筐，青禾队反超一分！"] },
  { title: "山谷足球杯 · 青禾队对枫叶队", beats: ["双方在中圈站好，青禾队开球。", "小波沿边线带球，把球斜传给前方的小禾。", "枫叶后卫伸脚抢断，小禾转身又把球追回来！", "小禾把球传进禁区，阿岚迎球射门。", "守门员扑错方向，足球滚进球门，青禾队得分！"] },
];
const KIDS_HEROES = ["松松", "莓莓", "小蓝", "鸭鸭", "小芽", "星星鱼", "小牛", "云朵列车长", "小兔", "安安", "小刺猬", "小海龟"];
const KIDS_FRIENDS = ["小青蛙", "啾啾鸟", "阿栗", "灯塔爷爷", "小虾米", "风车姐姐", "月亮猫", "邮差狗", "米粒鼠", "蒲公英精灵", "小鹿", "河狸木匠"];
const KIDS_PLACES = ["彩虹森林", "芦苇池塘", "会唱歌的菜园", "珊瑚湾", "山谷学校", "云朵车站", "旧仓库", "林边小屋", "月光山坡", "风铃小镇", "海边灯塔", "枫叶溪谷"];
const KIDS_DISCOVERIES = ["一只发光的松果", "一顶会飞的红帽子", "一颗会唱歌的萝卜", "一张被雨打湿的地图", "一枚星星形钥匙", "一辆停住的玩具火车", "一封没有名字的信", "一盒会自己响的音乐盒", "一个装着月光的玻璃瓶", "一只迷路的小纸船", "一面不会照出影子的镜子", "一串藏着鸟鸣的风铃", "一把生锈的小铲子", "一颗滚进石缝的蓝宝珠", "一本缺了最后一页的故事书", "一盏怎么也点不亮的小灯"];
const KIDS_REWARDS = ["彩虹徽章", "云朵车票", "金色羽毛", "星光贴纸", "勇气奖章", "一袋甜松子", "会发光的贝壳", "小小侦探证", "音乐种子", "蓝色蝴蝶结", "月亮饼干", "友谊风铃"];
const dailyKidsStory = (absoluteDay: number): TvStory => {
  const episode = Math.max(1, absoluteDay);
  const hero = KIDS_HEROES[(episode - 1) % KIDS_HEROES.length];
  const friend = KIDS_FRIENDS[Math.floor((episode - 1) / KIDS_HEROES.length) % KIDS_FRIENDS.length];
  const place = KIDS_PLACES[Math.floor((episode - 1) / (KIDS_HEROES.length * KIDS_FRIENDS.length)) % KIDS_PLACES.length];
  const discovery = KIDS_DISCOVERIES[(episode * 7 + Math.floor(episode / 5)) % KIDS_DISCOVERIES.length];
  const reward = KIDS_REWARDS[(episode * 5 + Math.floor(episode / 7)) % KIDS_REWARDS.length];
  const stories: TvStory[] = [
    { title: `第 ${episode} 集 · ${hero}和${place}的求救声`, beats: [`${hero}经过${place}时，听见石头后面传来轻轻的求救声。`, `${friend}赶来帮忙，他们找到${discovery}，上面留着通往山坡的记号。`, `两人沿着记号前进，发现一只小鸟被倒下的树枝困住了。`, `${hero}撑起树枝，${friend}把小鸟慢慢抱了出来。`, `小鸟重新飞回天空，并送给他们${reward}作为感谢。`] },
    { title: `第 ${episode} 集 · ${place}的神秘脚印`, beats: [`清晨，${hero}在${place}门口发现一排从没见过的小脚印。`, `${hero}请来${friend}，两人带着${discovery}沿脚印认真寻找。`, `脚印在小河边消失了，他们发现水面下藏着一条秘密石路。`, `走过石路后，他们找到了迷路一整夜的小动物。`, `大家把小动物送回家，村长奖励他们${reward}。`] },
    { title: `第 ${episode} 集 · 给${friend}的惊喜`, beats: [`${hero}得知${friend}今天过生日，决定悄悄准备一场惊喜。`, `${hero}来到${place}寻找装饰，却只发现${discovery}。`, `一阵大风吹乱准备好的彩带，蛋糕也差点从桌上滑下来。`, `${hero}叫来附近的小伙伴，一起重新挂好彩带并扶稳蛋糕。`, `${friend}推门时大家唱起生日歌，还把${reward}挂在了门上。`] },
    { title: `第 ${episode} 集 · ${hero}的远方旅行`, beats: [`${hero}在地图上看见${place}，背起小包第一次独自出发。`, `半路的桥被雨水冲坏，${friend}划着叶子小船赶来。`, `他们用${discovery}找到一条绕过山谷的新路，却遇到一片浓雾。`, `${hero}听着河水声辨认方向，终于带大家走出了雾林。`, `到达目的地时，车站送给他们一张${reward}作纪念。`] },
    { title: `第 ${episode} 集 · 修好${place}的大钟`, beats: [`${place}的大钟停住了，所有居民都不知道现在几点。`, `${hero}和${friend}爬进钟楼，在齿轮旁发现${discovery}。`, `他们试着转动齿轮，却发现最里面还卡着一根细树枝。`, `${hero}取出树枝，${friend}给齿轮抹上树脂，大钟重新转动。`, `整座山谷再次听见钟声，居民把${reward}送给了他们。`] },
    { title: `第 ${episode} 集 · ${place}的小小演出`, beats: [`${hero}答应在${place}演出，可上台前紧张得一句话也说不出。`, `${friend}拿来${discovery}，陪着${hero}在幕后重新练习。`, `演出开始后灯忽然熄灭，台下变得黑漆漆的。`, `${hero}没有逃走，而是带着观众一起拍手打节奏，${friend}趁机修好了灯。`, `灯光亮起，演出顺利完成，观众把${reward}抛上舞台。`] },
  ];
  return stories[episode % stories.length];
};
const NATIONAL_STORIES: TvStory[] = [
  { title: "山谷溪流与古桥", beats: ["摄制组从北林泉眼出发，沿着清澈溪流向南走。", "他们在石桥下发现百年前工匠留下的刻痕。", "大雨让水位上涨，护桥员赶来检查每一块桥石。", "村民一起清走漂来的树枝，溪水重新顺畅流过桥洞。", "夕阳照亮古桥，节目记录下它继续守护山谷的一天。"] },
  { title: "四季农耕纪录", beats: ["清晨，农夫先摸土壤，判断今天要浇多少水。", "中午大家给幼苗搭架，防止风把嫩茎吹倒。", "一只乌鸦靠近田地，稻草人和围栏保护了种子。", "傍晚成熟作物被装进木箱，送往中心街超市。", "夜里土地安静下来，新的嫩芽正在泥土中生长。"] },
  { title: "青禾谷传统节日", beats: ["老师带学生拜访做花灯的老手艺人。", "竹条先弯成骨架，再一张张贴上彩纸。", "孩子们在灯面写下谜语，把灯挂到中心广场。", "夜幕降临，村民提着完成的花灯沿河慢慢走。", "最后一盏河灯漂远，大家约好明年再见。"] },
  { title: "清晨列车穿过枫树林", beats: ["列车员在天亮前检查车灯、车门和每一节车厢。", "第一批乘客上车，列车缓缓离开青禾站。", "枫树林里有小鹿靠近铁轨，司机提前减速等待它离开。", "列车驶过河桥，车窗外的村庄一间间亮起灯。", "太阳升起时，列车准时抵达远方新区。"] },
];
const FARM_STORIES: [TvStory, TvStory] = [
  { title: "雨天宠物照顾课", beats: ["主持人先观察乌云和风向，确认今天会持续下雨。", "小宠物跟着主人出门，没穿雨衣的毛很快被淋湿。", "主人从背包拿出黄色宠物雨衣，逐只扣好扣子。", "穿好雨衣的小宠物在水坑里玩耍，身体仍然暖暖的。", "回到室内后擦干脚掌；鸡、牛、羊不受这套生病规则影响。"] },
  { title: "幼苗成长观察课", beats: ["主持人把种子放进松软土壤，再轻轻盖上一层土。", "洒水壶从根部慢慢浇水，泥土颜色变深。", "第二天嫩芽钻出地面，保温室让它多长了一个阶段。", "农夫放好稻草人与围栏，乌鸦和小动物不能靠近。", "成熟作物被完整收下，新的种植记录写进农场手册。"] },
];
const dailyNewsForState = (state: GameState): DailyNews => {
  const festival = FESTIVAL_SCHEDULE.find((entry) => entry.season === state.season && entry.day === state.day);
  if (state.urgentEvent && !state.urgentEventResolved) {
    if (state.urgentEvent === "fire") return { kind: "fire", urgent: true, text: "中心街木匠工坊旁突然起火！请今天立刻赶到现场，点击水桶扑灭火苗。" };
    if (state.urgentEvent === "theft") return { kind: "theft", urgent: true, text: "青禾超市的种子货箱被偷，散落货物出现在中心街！请今天找到货箱并交还林婶。" };
    if (state.urgentEvent === "assembly") return { kind: "assembly", urgent: true, text: "青禾谷发布重要集合通知：所有居民今天到青禾学校礼堂集合。请前往文化街学校，听完完整说明。" };
    return { kind: "injury", urgent: true, text: "中心街有居民摔倒受伤！请今天赶到诊所外，扶起伤者并送进健康诊所。" };
  }
  if (state.weather === "thunder") return { kind: "thunder", urgent: false, text: "今日有雷雨，农场可能落雷。避开空旷田地，农作物旁会真的出现闪电。" };
  if (state.missingPetId) return { kind: "missingPet", urgent: false, text: "一只小宠物跑进青禾山洞；带火柴进洞，就能在岩石后找到它。" };
  if (festival) return { kind: "festival", urgent: false, text: `${festival.name}今天在${festival.place}举行，现场摊位、居民和活动已经布置完成。` };
  const absoluteDay = (state.year - 1) * 112 + state.season * 28 + state.day;
  if (absoluteDay % 3 === 0) return { kind: "cave", urgent: false, text: "山洞勘探员发现钻石矿脉今天换了位置，勘探员本人已经进洞，岩石后会露出新的晶尖。" };
  if (absoluteDay % 4 === 1) return { kind: "supermarket", urgent: false, text: "青禾超市完成今日补货，种子、药材和地上可能发现的补给都可以到店查看。" };
  if (absoluteDay % 4 === 2) return { kind: "school", urgent: false, text: "青禾学校发布今日农场知识：浇过水的幼苗会成长，教室黑板上也能看到这一课。" };
  return { kind: "anan", urgent: false, text: "安安从林边小屋寄来消息，天气晴好时，她想在小屋旁邀请小禾一起玩。" };
};

const FESTIVAL_PROCESS_STEPS: Partial<Record<FestivalId, { title: string; intro: string; steps: { label: string; detail: string; icon: string }[] }>> = {
  lantern: { title: "元宵花灯工坊", intro: "从弯竹骨、糊彩纸到点灯猜谜，每一盏花灯都要亲手完成。", steps: [
    { label: "装好灯笼骨架", detail: "把竹圈、撑杆、中心扣和提绳拖到正确接口。", icon: "架" },
    { label: "糊纸挂上流苏", detail: "沿五条亮边来回刷胶，让彩纸和流苏牢牢贴住。", icon: "纸" },
    { label: "逐盏点亮灯芯", detail: "按住火折子，依次点亮四盏真实花灯。", icon: "火" },
    { label: "拖动谜底答题", detail: "读完每张谜面，从三个答案里挑出正确卡片拖到灯谜签。", icon: "谜" },
  ] },
  medical: { title: "青禾医疗节实习", intro: "这是青禾谷虚构的游戏医学训练。先取得基础资格，再到诊所逐种学习不同病症。", steps: [
    { label: "分辨症状卡", detail: "逐张观察精神、体温、呼吸和淋雨记录，不靠猜测下结论。", icon: "诊" },
    { label: "整理护理器具", detail: "选出干净毛巾、温度计、温水和记录本，排除脏器具。", icon: "具" },
    { label: "完成六处消毒", detail: "按顺序把桌面、杯口、勺子、手、药罐和毛巾处理干净。", icon: "净" },
    { label: "练习配比", detail: "按照病例卡加入正确份数，过量和漏放都不能继续。", icon: "配" },
    { label: "护理与复查", detail: "完成热敷、补水、记录和休息，再重新检查症状。", icon: "护" },
  ] },
  kite: { title: "春风纸鸢工坊", intro: "从竹骨到放线都要亲手完成。", steps: [{ label: "接好竹骨", detail: "把四根竹条交叉固定。", icon: "骨" }, { label: "贴牢彩纸", detail: "沿边缘慢慢压紧彩纸。", icon: "纸" }, { label: "迎风放线", detail: "看准风向，分六次慢慢放线。", icon: "风" }] },
  flower: { title: "百花观察实习", intro: "观察、记录，再给蜜蜂搭花屋。", steps: [{ label: "辨认花瓣", detail: "从颜色和花瓣形状辨认春花。", icon: "花" }, { label: "记录香气", detail: "完成三张气味观察卡。", icon: "记" }, { label: "搭好花屋", detail: "把木片和细草放进花屋。", icon: "蜂" }] },
  water: { title: "清凉戏水接力", intro: "先搭水道，再亲自完成接力。", steps: [{ label: "连接水管", detail: "把弯管接到正确方向。", icon: "管" }, { label: "装满水桶", detail: "分四次接满清水。", icon: "桶" }, { label: "完成接力", detail: "跟着队伍跑完六段水路。", icon: "水" }] },
  firefly: { title: "萤火虫夜间观察", intro: "不用手抓，安静记录林边的微光。", steps: [{ label: "装观察灯", detail: "装好柔和灯罩，避免惊扰萤火虫。", icon: "灯" }, { label: "寻找微光", detail: "沿三处草丛慢慢观察。", icon: "萤" }, { label: "完成记录", detail: "把出现时间和地点写进册子。", icon: "记" }] },
  harvest: { title: "金秋丰收接力", intro: "辨认成熟度、装筐并亲手称重。", steps: [{ label: "挑成熟作物", detail: "从幼苗中找出成熟作物。", icon: "熟" }, { label: "整齐装筐", detail: "按大小把作物装进筐里。", icon: "筐" }, { label: "称重接力", detail: "校准秤后把三筐送到终点。", icon: "秤" }] },
  leafMusic: { title: "枫叶音乐合奏", intro: "收集落叶、调音并完成合奏。", steps: [{ label: "挑选落叶", detail: "找到完整、干燥的不同叶片。", icon: "叶" }, { label: "调好乐器", detail: "逐根校准琴弦。", icon: "音" }, { label: "完成合奏", detail: "跟随六拍旋律合奏。", icon: "♪" }] },
  firstSnow: { title: "初雪堆雪会", intro: "小禾要在雪地里亲自奔跑推雪球，再把头部抬上去，不能用连续点击代替。", steps: [{ label: "跑着滚雪球", detail: "先推身体雪球，放稳后回到起点再推头部。", icon: "雪" }, { label: "抬起头部", detail: "把小雪球稳稳抬到大雪球正上方。", icon: "人" }, { label: "安装装饰", detail: "把眼睛、鼻子、树枝手和围巾放到各自位置。", icon: "巾" }] },
  hotSoup: { title: "冬日热汤厨房", intro: "挑食材、切配、控火，再和居民分享。", steps: [{ label: "挑选食材", detail: "选出新鲜蔬菜和香草。", icon: "菜" }, { label: "清洗切配", detail: "洗净后按纹理切好。", icon: "刀" }, { label: "控制火候", detail: "让温度保持在暖色区域。", icon: "火" }, { label: "盛汤分享", detail: "把热汤依次端给居民。", icon: "汤" }] },
  seeds: { title: "种子分享工坊", intro: "先清掉虫子和杂物，再辨认种子、按季节分类，最后用丝绸扎好礼包。", steps: [
    { label: "清理种子", detail: "用杀虫剂处理小虫，把混进种子里的杂物拖到废料盒。", icon: "净" },
    { label: "按季节分类", detail: "拿起种子会显示名字，再拖进春夏秋冬对应的篮子。", icon: "篮" },
    { label: "丝绸扎礼包", detail: "点击礼包，用丝绸在袋口扎出一个蝴蝶结。", icon: "结" },
  ] },
  spring: { title: "春日集市游园", intro: "沿着摊位慢慢逛完，不能一点就跳过。", steps: [
    { label: "品尝草莓酱", detail: "先闻香气，再用小木勺尝一口。", icon: "莓" },
    { label: "参观木雕", detail: "绕到展示台前，看清今天新换的木雕。", icon: "雕" },
    { label: "听完山谷音乐", detail: "和村民坐下来，把一段完整的曲子听完。", icon: "♪" },
  ] },
  coffee: { title: "咖啡日体验", intro: "从咖啡豆开始，亲手完成一杯山谷咖啡。", steps: [
    { label: "放入咖啡豆", detail: "点击豆子，让它们一颗颗落进磨豆机。", icon: "豆" },
    { label: "转动磨豆把手", detail: "连续转动侧面的把手，把豆子慢慢磨成粉。", icon: "磨" },
    { label: "接取热水", detail: "按下饮水机，看着水流进细嘴壶。", icon: "水" },
    { label: "绕圈冲泡", detail: "把装满热水的壶缓缓拖到滤杯上。", icon: "泡" },
    { label: "品尝咖啡点心", detail: "闻香、品尝，再和阿麦、安安一起吃点心。", icon: "杯" },
  ] },
  craft: { title: "山谷木雕工坊", intro: "先检查每块真实木板，再沿着木纹拖动刻刀。选错木板或逆着纹理刮，成品都会变难看。", steps: [
    { label: "检查木板", detail: "四块木板中有两块带裂痕，而且裂痕的位置不一样。", icon: "木" },
    { label: "顺纹雕刻", detail: "按住刻刀，沿木板横向纹理来回刮出作品。", icon: "刀" },
    { label: "查看成品", detail: "看清亲手雕出的木鸟，再把它摆到展示台。", icon: "雕" },
  ] },
  midAutumn: { title: "中秋河灯会", intro: "亲手做好河灯，再走到水边把它放下。", steps: [
    { label: "折好灯罩", detail: "把纸角对齐，折出一盏结实的小灯。", icon: "折" },
    { label: "点亮灯芯", detail: "避开风口，小心把灯芯点亮。", icon: "灯" },
    { label: "放入河中", detail: "蹲到岸边，让河灯顺着水慢慢漂走。", icon: "河" },
  ] },
  springFestival: { title: "春节舞狮会", intro: "先把舞狮准备好，再跟着队伍绕广场一圈。", steps: [
    { label: "系好红绸", detail: "把红绸和铃铛系到狮头上。", icon: "绸" },
    { label: "跟拍敲鼓", detail: "看准节拍，给舞狮队敲响大鼓。", icon: "鼓" },
    { label: "跟随舞狮巡游", detail: "和村民一起走完热闹的广场路线。", icon: "狮" },
  ] },
};

const WORKSHOP_SEEDS: Array<{ id: WorkshopSeedId; name: string; season: WorkshopSeason; hint: string }> = [
  { id: "strawberry", name: "草莓种子", season: "春", hint: "粉红小籽，适合春天" },
  { id: "watermelon", name: "西瓜种子", season: "夏", hint: "黑亮扁籽，喜欢夏日阳光" },
  { id: "corn", name: "玉米种子", season: "秋", hint: "金黄圆粒，秋天收获" },
  { id: "pumpkin", name: "南瓜种子", season: "冬", hint: "耐寒白籽，冬季温棚播种" },
];

const TRADITIONAL_FESTIVALS: Partial<Record<FestivalId, { treat: string; symbol: string; greeting: string }>> = {
  springFestival: { treat: "年糕", symbol: "春", greeting: "新年快乐！广场挂满红灯笼，大家正在一起迎接新春。" },
  lantern: { treat: "汤圆", symbol: "灯", greeting: "元宵灯会亮起来啦！猜完灯谜可以免费吃一碗汤圆。" },
  dragonBoat: { treat: "粽子", symbol: "舟", greeting: "龙舟鼓声响起来啦！大家正在看龙舟、吃粽子。" },
  midAutumn: { treat: "月饼", symbol: "月", greeting: "中秋月亮又圆又亮，大家在广场赏月、分享月饼。" },
};

const LANTERN_RIDDLES = [
  { question: "一位小姑娘，生在水中央，身穿粉红衫，坐在绿船上。", answers: ["荷花", "萝卜", "月亮"], correct: 0 },
  { question: "千条线，万条线，落到水里看不见。", answers: ["树根", "雨", "鱼线"], correct: 1 },
  { question: "有面没有口，有脚没有手，虽有四只脚，自己不会走。", answers: ["桌子", "小牛", "山洞"], correct: 0 },
] as const;

const AGE_SKILLS: Array<{ id: AgeSkillId; age: number; name: string; kind: string; description: string; benefit: string; required: number }> = [
  { id: "trail", age: 2, name: "灵巧采集", kind: "采集本领", description: "辨认六段不同方向的野外物资路线，练习怎样完整带回每一份发现。", benefit: "永久生效：双击捡地上的种子、药材或食物时，每次获得双份。", required: 6 },
  { id: "shelter", age: 3, name: "省力农具", kind: "农活本领", description: "辨认六件农具养护零件，按顺序装好一整套省力工具带。", benefit: "永久生效：锄地、播种、浇水、收获、砍树和挖矿都少消耗 1 点体力。", required: 6 },
  { id: "hybrid", age: 4, name: "丰收巧手", kind: "农场本领", description: "根据四季天气判断作物状态，完成四轮真正的丰收观察。", benefit: "永久生效：每次收获多得 1 份作物，并多返还 1 颗同类种子。", required: 4 },
  { id: "echo", age: 5, name: "听石寻晶", kind: "稀奇能力", description: "听岩石回声，在光点进入绿色区域的一瞬间完成四次定位。", benefit: "学会后找到 1 颗真正的钻石，并能听出隐藏矿脉。", required: 4 },
  { id: "clone", age: 7, name: "分身穿墙瞬移", kind: "七岁稀奇本领", description: "在五种不同障碍前辨认正确落点，让分身穿过墙壁并安全瞬移到工作地点。", benefit: "学会后可以随时召出一个分身，自己继续行动，分身会自动去农田、树林、山洞或居民家完成工作。", required: 5 },
  { id: "teleport", age: 8, name: "本人地图瞬移", kind: "八岁稀奇本领", description: "亲自完成五段目的地与落点辨认，学会让自己的身体安全到达地图位置。", benefit: "学会后原来的小地图入口会变成瞬移；点开地图，再点任意地点就能让本人直接到达。", required: 5 },
];
const AGE_TRAIL_ROUTE = ["right", "up", "right", "down", "right", "up"] as const;
const AGE_WORLD_TRAIL_ROUTES: readonly (readonly TrailDirection[])[] = [
  ["left", "left", "up", "right", "up"],
  ["right", "up", "up", "left", "up"],
  ["down", "left", "up", "left", "down"],
  ["up", "right", "down", "right", "up"],
];
const HYBRID_WEATHER_BALANCE: Record<Weather, number> = { sunny: 67, cloudy: 54, rain: 42, thunder: 34 };
const AGE_CAMP_PARTS = ["磨刀石", "结实木柄", "铁制卡扣", "润滑树脂", "擦拭软布", "省力工具带"] as const;
const AGE_HYBRID_ROUNDS = [
  { weather: "春日细雨", answers: ["草莓种子", "南瓜种子", "玉米种子"], correct: "草莓种子" },
  { weather: "夏日烈阳", answers: ["西瓜种子", "土豆种子", "蓝莓种子"], correct: "西瓜种子" },
  { weather: "秋日凉风", answers: ["胡萝卜种子", "玉米种子", "草莓种子"], correct: "玉米种子" },
  { weather: "冬日温棚", answers: ["南瓜种子", "西瓜种子", "番茄种子"], correct: "南瓜种子" },
] as const;
const AGE_CLONE_ROUTES = [
  { destination: "农田水渠", signal: "水滴门", answers: ["石纹门", "水滴门", "叶片门"] },
  { destination: "草莓苗圃", signal: "红莓门", answers: ["红莓门", "矿晶门", "木纹门"] },
  { destination: "青禾树林", signal: "木纹门", answers: ["水滴门", "星光门", "木纹门"] },
  { destination: "山洞矿脉", signal: "矿晶门", answers: ["叶片门", "矿晶门", "红莓门"] },
  { destination: "居民小院", signal: "星光门", answers: ["木纹门", "星光门", "水滴门"] },
] as const;
const CLONE_HELP_RESIDENTS = ["安安", "林婶", "鲁师傅", "白医生", "叶老师", "许老师", "阿麦", "周镇长", "沈馆长", "小玲", "豆豆", "小满", "阿禾"] as const;

const CAVE_DIAMOND_SPOTS = [
  { x: 18, y: 70, hidden: false }, { x: 29, y: 61, hidden: true }, { x: 39, y: 72, hidden: false },
  { x: 49, y: 59, hidden: false }, { x: 59, y: 70, hidden: true }, { x: 70, y: 62, hidden: false },
  { x: 79, y: 72, hidden: true }, { x: 37, y: 63, hidden: true }, { x: 67, y: 72, hidden: false },
] as const;

const ATTIC_RESOURCE_INFO: Record<AtticResource, { name: string; short: string }> = {
  wood: { name: "木头", short: "木" }, stone: { name: "石材", short: "石" }, diamonds: { name: "钻石", short: "◆" },
  herbs: { name: "药材", short: "药" }, resin: { name: "树脂", short: "脂" }, pinecones: { name: "松果", short: "果" },
  pineNuts: { name: "松子", short: "子" }, eggs: { name: "鸡蛋", short: "蛋" }, milk: { name: "牛奶", short: "奶" }, wool: { name: "羊毛", short: "毛" },
};

const ATTIC_PLACEMENT_SLOTS = [
  { x: 17, y: 47 }, { x: 33, y: 47 }, { x: 49, y: 47 }, { x: 65, y: 47 }, { x: 81, y: 47 },
  { x: 23, y: 72 }, { x: 41, y: 72 }, { x: 59, y: 72 }, { x: 77, y: 72 },
] as const;
const OUTDOOR_CRAFTS: CraftType[] = ["chest", "fence", "gate", "scarecrow", "lamp", "bench", "sign"];
const INDOOR_FURNITURE: CraftType[] = ["chest", "table", "floorLamp", "television", "sofa", "bookshelf", "dresser", "nightstand"];
const HANDCRAFTS: CraftType[] = ["matches", "blanket"];
const ATTIC_FURNITURE: CraftType[] = INDOOR_FURNITURE.filter((item) => item !== "nightstand");
const CRAFT_GROUPS: Array<{ title: string; note: string; items: CraftType[] }> = [
  { title: "室内家具", note: "做好后进入背包，只能摆进农舍二楼", items: INDOOR_FURNITURE },
  { title: "农场户外设施", note: "灯柱、长椅和方向牌都留在户外", items: OUTDOOR_CRAFTS.filter((item) => item !== "chest") },
  { title: "随身手作", note: "直接使用，不需要摆放", items: HANDCRAFTS },
];

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
  小玲: [9],
  豆豆: [18],
  小满: [24],
  阿禾: [12],
  小芽: [6],
  小石: [27],
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
  { owner: "小玲", home: "小玲的花窗小屋", greeting: "欢迎来我家！窗台上的花和语文作文本都可以看。", items: ["花朵作文", "彩笔盒", "粉色小床"] },
  { owner: "豆豆", home: "豆豆的蓝顶小屋", greeting: "我把每天的鱼获数量都写在小黑板上，算起来可有意思了。", items: ["数字黑板", "鱼形闹钟", "蓝色小床"] },
  { owner: "小满", home: "小满的四季小屋", greeting: "屋里每个架子代表一个季节，我正在收集四季的叶子。", items: ["四季叶册", "种子玻璃瓶", "橙色小床"] },
  { owner: "阿禾", home: "阿禾的绿芽小屋", greeting: "进来坐吧！我在墙上贴了很多农场英文单词。", items: ["单词卡墙", "嫩芽花盆", "绿色小床"] },
  { owner: "小芽", home: "小芽的紫花小屋", greeting: "我的窗台每天都有新芽冒出来，浇水时我可以叫上你。", items: ["幼苗尺", "紫花窗帘", "软绒小床"] },
  { owner: "小石", home: "小石的溪石小屋", greeting: "门口的圆石头不会挡路，我把最好看的几块摆在书架上了。", items: ["溪石收藏", "小水壶", "青蓝小床"] },
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
  小玲: { kind: "seed", field: "strawberrySeeds", amount: 2, name: "2 颗草莓种子" },
  豆豆: { kind: "seed", field: "cornSeeds", amount: 2, name: "2 颗玉米种子" },
  小满: { kind: "seed", field: "pumpkinSeeds", amount: 2, name: "2 颗南瓜种子" },
  阿禾: { kind: "seed", field: "seeds", amount: 3, name: "3 颗萝卜种子" },
  小芽: { kind: "seed", field: "tomatoSeeds", amount: 2, name: "2 颗番茄种子" },
  小石: { kind: "material", field: "stone", amount: 2, name: "2 块圆润石材" },
};

const DAILY_WOODCRAFTS = [
  { name: "花纹鸟屋", description: "带斜屋顶、圆门和小栖木，木板上刻着花朵与麦穗。" },
  { name: "摇摇小木马", description: "马鬃、缰绳和弧形摇板都经过细细雕刻，可以看出四条腿。" },
  { name: "山谷守护鹿", description: "一只温柔的鹿站在松树旁，底座刻着青禾谷的叶片纹样。" },
];

const makeCropQualityRecord = (): CropQualityRecord => Object.fromEntries(
  CROP_TYPES.map((crop) => [crop, { normal: 0, silver: 0, gold: 0 }]),
) as CropQualityRecord;

const makeCropQualityStock = (): CropQualityStock => Object.fromEntries(
  CROP_TYPES.map((crop) => [crop, { silver: 0, gold: 0 }]),
) as CropQualityStock;

const mergeCropQualityRecord = (saved?: Partial<CropQualityRecord>): CropQualityRecord => {
  const result = makeCropQualityRecord();
  CROP_TYPES.forEach((crop) => { result[crop] = { ...result[crop], ...(saved?.[crop] ?? {}) }; });
  return result;
};

const mergeCropQualityStock = (saved?: Partial<CropQualityStock>): CropQualityStock => {
  const result = makeCropQualityStock();
  CROP_TYPES.forEach((crop) => { result[crop] = { ...result[crop], ...(saved?.[crop] ?? {}) }; });
  return result;
};

const moveBestCropQuality = (stock: CropQualityStock, crop: CropType, amount: number) => {
  const next = mergeCropQualityStock(stock);
  const gold = Math.min(amount, next[crop].gold);
  const silver = Math.min(Math.max(0, amount - gold), next[crop].silver);
  next[crop] = { gold: next[crop].gold - gold, silver: next[crop].silver - silver };
  return { next, moved: { gold, silver } };
};

const addCropQuality = (stock: CropQualityStock, crop: CropType, quality: { silver: number; gold: number }) => {
  const next = mergeCropQualityStock(stock);
  next[crop] = { silver: next[crop].silver + quality.silver, gold: next[crop].gold + quality.gold };
  return next;
};

const cropQualityBonus = (stock: CropQualityStock) => CROP_TYPES.reduce((total, crop) => {
  const price = RESOURCE_INFO[crop].price;
  return total + stock[crop].silver * Math.round(price * .35) + stock[crop].gold * Math.round(price * .8);
}, 0);

const makeTiles = (count = 32): FarmTile[] =>
  Array.from({ length: count }, () => ({ state: "grass", stage: 0, watered: false, care: 0 }));

const makeNewGame = (): GameState => ({
  year: 1,
  playerAge: 1,
  birthdayGrowthYear: 0,
  ageSkillsLearned: [],
  lastAgeAbilityDays: {},
  hybridSeedCharges: 0,
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
  diamonds: 0,
  herbs: 0,
  pinecones: 0,
  pineNuts: 0,
  resin: 0,
  treeStates: [true, true, true, true],
  plantedTrees: [],
  rockStates: [true, true, true, true, true, true],
  caveDiamondStates: [true, true, true],
  caveDiamondSpots: [0, 3, 6],
  crafted: { chest: 0, fence: 0, gate: 0, scarecrow: 0, lamp: 0, bench: 0, sign: 0, table: 0, floorLamp: 0, television: 0, sofa: 0, bookshelf: 0, dresser: 0, nightstand: 0, matches: 0, blanket: 0 },
  placedCrafts: [],
  farmVisitor: null,
  farmHelperToday: null,
  upgrades: { house: 0, land: 0, field: 0, storage: 0, greenhouse: 0, pond: 0, stoneWall: 0, secondFloor: 0, upstairsKitchen: 0, upstairsBathroom: 0 },
  builderSupplies: { wood: 0, stone: 0 },
  equipment: { lampOn: false },
  daily: { day: 1, planted: 0, watered: 0, harvested: 0, fish: 0, chopped: 0, sold: 0, rewardClaimed: false },
  sick: false,
  diagnosed: false,
  medicalTrained: false,
  illness: null,
  learnedTreatments: [],
  treatmentBaths: {},
  lastIllnessDay: 0,
  groundBooks: [true, false, false],
  bookBag: [],
  libraryBooks: [],
  groundArtifacts: [true, false, false],
  artifactBag: [],
  museumArtifacts: [],
  groundSupplies: [true, false, false, false, false, false, true, false, false],
  toolUpgrades: { water: false, axe: false, rod: false, pickaxe: false },
  toolUpgradeDays: { axe: 0, rod: 0, pickaxe: 0 },
  npcHealedDays: {},
  lastSchoolAttendance: "",
  seasonExcursionCompleted: false,
  animalPen: false,
  chickens: 0,
  cows: 0,
  sheep: 0,
  animalRainExposure: 0,
  animalRaincoatAssignments: [],
  sickFarmAnimalIds: [],
  lastAnimalPuddleFindDay: 0,
  puddleHoes: 0,
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
  cookedCrabs: 0,
  cookedShrimp: 0,
  drinks: 0,
  oldSocks: 0,
  ananBeachTrips: [],
  lastAnanCookieDay: "",
  lastEggDay: 0,
  lastMilkDay: 0,
  lastWoolDay: 0,
  rainExposure: 0,
  pets: [],
  lastPetBirthYears: {},
  lastBabyCareDays: {},
  babyCareStreaks: {},
  petContestWins: 0,
  petBonds: {},
  sickPetIds: [],
  lastPetIllnessAbsoluteDay: 0,
  missingPetId: null,
  lastDreamAbsoluteDay: 0,
  lastDreamVariant: -1,
  birthdayCakeYear: 0,
  driverLicense: false,
  ownsCar: false,
  weather: "sunny",
  urgentEvent: null,
  urgentEventDay: 0,
  urgentEventResolved: false,
  mallItems: { redCoat: 0, blueOutfit: 0, umbrella: 0, seedBox: 0, animalRaincoat: 0 },
  equippedOutfit: "default",
  umbrellaOpen: false,
  showeredBeforeBed: false,
  showerBuff: false,
  lanternRiddlesSolved: [],
  festivalActivitiesCompleted: [],
  atticStorage: { wood: 0, stone: 0, diamonds: 0, herbs: 0, resin: 0, pinecones: 0, pineNuts: 0, eggs: 0, milk: 0, wool: 0 },
  atticChestPlaced: false,
  atticPlacedCrafts: [],
  firstFloorNightstandPlaced: false,
  friendship: {},
  lastTalkedDays: {},
  forestQuestStage: 0,
  forestQuestProgressDay: 0,
  forestQuestEpisode: 0,
  forestQuestNextAbsoluteDay: 0,
  residentQuestCompletions: [],
  residentTripDays: [],
  residentWishes: {},
  wishPlantingRecords: {},
  residentWorkOrders: [],
  cropQualityHarvests: makeCropQualityRecord(),
  cropQualityStock: makeCropQualityStock(),
  chestCropQualityStock: makeCropQualityStock(),
  shippingCropQualityStock: makeCropQualityStock(),
  watchedTvEpisodes: [],
  journalEntries: ["第一年春天，小禾搬进青禾农场，新的山谷生活开始了。"],
  recipesDiscovered: [],
});

const staminaCost = (state: GameState, base: number) => {
  const showerAdjusted = state.showerBuff ? Math.max(1, Math.ceil(base * .7)) : base;
  return state.ageSkillsLearned.includes("shelter") ? Math.max(0, showerAdjusted - 1) : showerAdjusted;
};

const villageSaveKey = (village: VillageId) => village === "maple" ? "qinghe-farm-save-maple" : "qinghe-farm-save";

const reconcilePetFamilies = (records: PetRecord[] | undefined, savedBirthYears: Partial<Record<PetType, number>> | undefined, currentYear: number, currentSeason: number, currentDay: number) => {
  const pets = (records ?? []).map((pet) => ({
    ...pet,
    bornYear: Number.isFinite(pet.bornYear) ? pet.bornYear : 1,
    bornSeason: Number.isFinite(pet.bornSeason) ? pet.bornSeason : 0,
    bornDay: Number.isFinite(pet.bornDay) ? pet.bornDay : 1,
  }));
  const lastPetBirthYears = { ...(savedBirthYears ?? {}) };
  PET_CATALOG.forEach((kind, index) => {
    const sameType = pets.filter((pet) => pet.type === kind.id);
    const newestExistingBaby = Math.max(0, ...sameType.filter((pet) => pet.id.includes("-baby-")).map((pet) => pet.bornYear));
    if (!lastPetBirthYears[kind.id] && newestExistingBaby > 0) lastPetBirthYears[kind.id] = newestExistingBaby;
    const hasPair = sameType.some((pet) => pet.sex === "男生") && sameType.some((pet) => pet.sex === "女生");
    const lastBirthYear = lastPetBirthYears[kind.id];
    const familyStartYear = Math.max(0, ...sameType.filter((pet) => !pet.id.includes("-baby-")).map((pet) => pet.bornYear));
    const yearsTogether = lastBirthYear ? currentYear - lastBirthYear : currentYear - familyStartYear + 1;
    if (!hasPair || yearsTogether < 5) return;
    pets.push({ id: `${kind.id}-baby-${currentYear}-restored-${index}`, type: kind.id, sex: (currentYear + index) % 2 ? "女生" : "男生", bornDay: currentDay, bornSeason: currentSeason, bornYear: currentYear });
    lastPetBirthYears[kind.id] = currentYear;
  });
  return { pets, lastPetBirthYears };
};

const restoreVillageGame = (saved: string | null): GameState => {
  const defaults = makeNewGame();
  if (!saved) return defaults;
  try {
    const parsed = JSON.parse(saved) as Partial<GameState>;
    if (!parsed.tiles || parsed.tiles.length < 32) return defaults;
    const petFamily = reconcilePetFamilies(parsed.pets, parsed.lastPetBirthYears, parsed.year ?? 1, parsed.season ?? 0, parsed.day ?? 1);
    return {
      ...defaults,
      ...parsed,
      playerAge: parsed.playerAge ?? Math.max(1, (parsed.year ?? 1) + ((parsed.birthdayCakeYear ?? 0) === (parsed.year ?? 1) ? 1 : 0)),
      birthdayGrowthYear: parsed.birthdayGrowthYear ?? parsed.birthdayCakeYear ?? 0,
      ageSkillsLearned: parsed.ageSkillsLearned ?? [],
      lastAgeAbilityDays: parsed.lastAgeAbilityDays ?? {},
      inventory: { ...defaults.inventory, ...(parsed.inventory ?? {}) },
      chestStorage: { ...defaults.chestStorage, ...(parsed.chestStorage ?? {}) },
      shippingBin: { ...defaults.shippingBin, ...(parsed.shippingBin ?? {}) },
      treeStates: parsed.treeStates?.length === 4 ? parsed.treeStates : defaults.treeStates,
      plantedTrees: (parsed.plantedTrees ?? []).map((tree) => ({ ...tree, watered: tree.watered ?? false })),
      rockStates: defaults.rockStates.map((standing, index) => parsed.rockStates?.[index] ?? standing),
      caveDiamondStates: defaults.caveDiamondStates.map((standing, index) => parsed.caveDiamondStates?.[index] ?? standing),
      caveDiamondSpots: parsed.caveDiamondSpots?.length === 3 ? parsed.caveDiamondSpots : defaults.caveDiamondSpots,
      crafted: { ...defaults.crafted, ...(parsed.crafted ?? {}) },
      placedCrafts: parsed.placedCrafts ?? [],
      farmHelperToday: parsed.farmHelperToday ?? null,
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
        pickaxe: parsed.toolUpgradeDays?.pickaxe ?? (parsed.toolUpgrades?.pickaxe ? 7 : 0),
      },
      npcHealedDays: parsed.npcHealedDays ?? {},
      lastSchoolAttendance: parsed.lastSchoolAttendance ?? "",
      seasonExcursionCompleted: parsed.seasonExcursionCompleted ?? false,
      cows: parsed.cows ?? 0,
      sheep: parsed.sheep ?? 0,
      animalRaincoatAssignments: parsed.animalRaincoatAssignments ?? [],
      sickFarmAnimalIds: parsed.sickFarmAnimalIds ?? [],
      pets: petFamily.pets,
      lastPetBirthYears: petFamily.lastPetBirthYears,
      lastBabyCareDays: parsed.lastBabyCareDays ?? {},
      babyCareStreaks: parsed.babyCareStreaks ?? {},
      mallItems: { ...defaults.mallItems, ...(parsed.mallItems ?? {}) },
      lanternRiddlesSolved: parsed.lanternRiddlesSolved ?? [],
      festivalActivitiesCompleted: parsed.festivalActivitiesCompleted ?? [],
      atticStorage: { ...defaults.atticStorage, ...(parsed.atticStorage ?? {}) },
      atticChestPlaced: parsed.atticChestPlaced ?? false,
      atticPlacedCrafts: parsed.atticPlacedCrafts ?? [],
      firstFloorNightstandPlaced: parsed.firstFloorNightstandPlaced ?? false,
      friendship: parsed.friendship ?? {},
      lastTalkedDays: parsed.lastTalkedDays ?? {},
      forestQuestEpisode: parsed.forestQuestEpisode ?? 0,
      forestQuestNextAbsoluteDay: parsed.forestQuestNextAbsoluteDay ?? 0,
      residentQuestCompletions: parsed.residentQuestCompletions ?? [],
      residentTripDays: parsed.residentTripDays ?? [],
      residentWishes: parsed.residentWishes ?? {},
      wishPlantingRecords: parsed.wishPlantingRecords ?? {},
      residentWorkOrders: parsed.residentWorkOrders ?? [],
      cropQualityHarvests: mergeCropQualityRecord(parsed.cropQualityHarvests),
      cropQualityStock: mergeCropQualityStock(parsed.cropQualityStock),
      chestCropQualityStock: mergeCropQualityStock(parsed.chestCropQualityStock),
      shippingCropQualityStock: mergeCropQualityStock(parsed.shippingCropQualityStock),
      watchedTvEpisodes: parsed.watchedTvEpisodes ?? [],
      journalEntries: parsed.journalEntries ?? defaults.journalEntries,
      recipesDiscovered: parsed.recipesDiscovered ?? [],
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
  const [farmEdgeTraveling, setFarmEdgeTraveling] = useState(false);
  const [scene, setScene] = useState<Scene>("farm");
  const [activeBuilding, setActiveBuilding] = useState<BuildingId | null>(null);
  const [isFishing, setIsFishing] = useState(false);
  const [fishingPhase, setFishingPhase] = useState<"idle" | "waiting" | "bite" | "reeling">("idle");
  const [fishingScore, setFishingScore] = useState(0);
  const [craftingOpen, setCraftingOpen] = useState(false);
  const [selectedCraftItem, setSelectedCraftItem] = useState<CraftType | null>(null);
  const [plantingPinecone, setPlantingPinecone] = useState(false);
  const [craftRotation, setCraftRotation] = useState<CraftRotation>(0);
  const [farmGateOpen, setFarmGateOpen] = useState(false);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideTopic, setGuideTopic] = useState<GuideTopicId>("start");
  const [guideReplay, setGuideReplay] = useState(0);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalTab, setJournalTab] = useState<"today" | "friends" | "collection" | "recipes">("today");
  const [residentInvitation, setResidentInvitation] = useState<{ person: string; trip: HiddenTripId; travelMode?: "walk" | "car" } | null>(null);
  const [residentOuting, setResidentOuting] = useState<{ person: string; trip: HiddenTripId; travelMode?: "walk" | "car" } | null>(null);
  const [outingPlayer, setOutingPlayer] = useState({ x: 47, y: 69 });
  const [outingActivitiesDone, setOutingActivitiesDone] = useState<number[]>([]);
  const [tripHandsOn, setTripHandsOn] = useState<TripHandsOnState | null>(null);
  const [residentSpeech, setResidentSpeech] = useState<{ person: string; text: string } | null>(null);
  const [residentWishWorkshop, setResidentWishWorkshop] = useState<ResidentWishWorkshopState | null>(null);
  const [heldWishMaterial, setHeldWishMaterial] = useState<WishMaterial | null>(null);
  const [heldWishSeal, setHeldWishSeal] = useState(false);
  const [birthdayCeremony, setBirthdayCeremony] = useState<BirthdayCeremonyState | null>(null);
  const [dismissedBirthdayPartyKey, setDismissedBirthdayPartyKey] = useState<string | null>(null);
  const [ageBookOpen, setAgeBookOpen] = useState(false);
  const [ageTraining, setAgeTraining] = useState<AgeTrainingState | null>(null);
  const [ageTrainingHeldPart, setAgeTrainingHeldPart] = useState<string | null>(null);
  const [ageEchoPulse, setAgeEchoPulse] = useState(6);
  const [trailExpedition, setTrailExpedition] = useState<TrailExpeditionState | null>(null);
  const [hybridLab, setHybridLab] = useState<HybridLabState | null>(null);
  const [hybridHeldSeed, setHybridHeldSeed] = useState<CropType | null>(null);
  const [echoSurvey, setEchoSurvey] = useState<EchoSurveyState | null>(null);
  const [cloneWorkOpen, setCloneWorkOpen] = useState(false);
  const [cloneMission, setCloneMission] = useState<CloneMissionState | null>(null);
  const [babyCare, setBabyCare] = useState<BabyCareState | null>(null);
  const [babyCareAim, setBabyCareAim] = useState(8);
  const [babyCareWater, setBabyCareWater] = useState(0);
  const [babyCareToyAim, setBabyCareToyAim] = useState(12);
  const [cafePlayerSitting, setCafePlayerSitting] = useState(false);
  const [careSession, setCareSession] = useState<{ mode: "training" | "treatment"; illness: IllnessId; step: number; progress: number; selected: string[]; herbParts: number; waterParts: number } | null>(null);
  const [medicalThermometerPicked, setMedicalThermometerPicked] = useState(false);
  const [careHeldItem, setCareHeldItem] = useState<string | null>(null);
  const [careMixValues, setCareMixValues] = useState({ medicine: 0, water: 0, warmth: 0 });
  const [careHoldProgress, setCareHoldProgress] = useState(0);
  const [careRecheckTemperature, setCareRecheckTemperature] = useState(35);
  const [schoolLesson, setSchoolLesson] = useState<{ title: string; pages: string[]; step: number; assembly: boolean; attendanceKey: string } | null>(null);
  const [townhallCalendarOpen, setTownhallCalendarOpen] = useState(false);
  const [festivalPreview, setFestivalPreview] = useState<FestivalPreview | null>(null);
  const [raincoatDressing, setRaincoatDressing] = useState(false);
  const [chestOpen, setChestOpen] = useState(false);
  const [shippingBinOpen, setShippingBinOpen] = useState(false);
  const [shippingReport, setShippingReport] = useState<{ itemCount: number; earnings: number } | null>(null);
  const [newsBroadcast, setNewsBroadcast] = useState<NewsBroadcast | null>(null);
  const [tvProgramStep, setTvProgramStep] = useState(0);
  const [chestDepositStreak, setChestDepositStreak] = useState<{ resource: StorableResource; count: number } | null>(null);
  const [bulkChestPrompt, setBulkChestPrompt] = useState<StorableResource | null>(null);
  const [shippingDepositStreak, setShippingDepositStreak] = useState<{ itemId: string; count: number } | null>(null);
  const [bulkShippingPrompt, setBulkShippingPrompt] = useState<string | null>(null);
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
  const [lanternRiddle, setLanternRiddle] = useState<number | null>(null);
  const [dragonBoatTraveling, setDragonBoatTraveling] = useState(false);
  const [dragonBoatOpen, setDragonBoatOpen] = useState(false);
  const [dragonBoatRole, setDragonBoatRole] = useState<"paddler" | "drummer" | null>(null);
  const [dragonBoatScore, setDragonBoatScore] = useState(0);
  const [dragonBoatOpponent, setDragonBoatOpponent] = useState(0);
  const [dragonBoatWinner, setDragonBoatWinner] = useState<"player" | "opponent" | null>(null);
  const [festivalProcess, setFestivalProcess] = useState<{ id: FestivalId; step: number } | null>(null);
  const [riverLanternFold, setRiverLanternFold] = useState(0);
  const [riverLanternWickPicked, setRiverLanternWickPicked] = useState(false);
  const [riverLanternPosition, setRiverLanternPosition] = useState<{ x: number; y: number } | null>(null);
  const [festivalActionCount, setFestivalActionCount] = useState(0);
  const [festivalDragging, setFestivalDragging] = useState(false);
  const [snowBuild, setSnowBuild] = useState<SnowBuildState>({ playerX: 5, bodyX: 14, bodySize: 24, bodyPlaced: false, headX: 14, headSize: 19, headRolled: false, headStacked: false });
  const [waterFestival, setWaterFestival] = useState<WaterFestivalState>({ installedPipes: [false, false, false, false], heldPipe: null, bucketFill: [0, 0, 0, 0], playerX: 10, hits: 0, soaked: 0 });
  const [craftWoodChoice, setCraftWoodChoice] = useState<number | null>(null);
  const [craftCarveProgress, setCraftCarveProgress] = useState(0);
  const [craftWrongCarves, setCraftWrongCarves] = useState(0);
  const [craftKnifeDragging, setCraftKnifeDragging] = useState(false);
  const [craftResultQuality, setCraftResultQuality] = useState<"good" | "poor" | null>(null);
  const [seedWorkshopBugs, setSeedWorkshopBugs] = useState([true, true]);
  const [seedWorkshopDebris, setSeedWorkshopDebris] = useState([true, true]);
  const [seedSprayerPicked, setSeedSprayerPicked] = useState(false);
  const [seedDebrisPicked, setSeedDebrisPicked] = useState<number | null>(null);
  const [seedWorkshopHeld, setSeedWorkshopHeld] = useState<WorkshopSeedId | null>(null);
  const [seedWorkshopSorted, setSeedWorkshopSorted] = useState<WorkshopSeedId[]>([]);
  const [seedGiftTied, setSeedGiftTied] = useState(false);
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
  const [petContestOpen, setPetContestOpen] = useState(false);
  const [selectedContestPet, setSelectedContestPet] = useState<string | null>(null);
  const [selectedContestRival, setSelectedContestRival] = useState("安安");
  const [petContest, setPetContest] = useState<PetContestState | null>(null);
  const [petContestAim, setPetContestAim] = useState(7);
  const [petContestPower, setPetContestPower] = useState(0);
  const [bedtimePhase, setBedtimePhase] = useState<"walkingHome" | "tuckedIn" | "waking" | null>(null);
  const [houseFloor, setHouseFloor] = useState<1 | 2>(1);
  const [stairTravel, setStairTravel] = useState<"up" | "down" | null>(null);
  const [upstairsRoom, setUpstairsRoom] = useState<"kitchen" | "bathroom" | null>(null);
  const [cookingGame, setCookingGame] = useState<{ food: CookingFood; step: CookingStep; chops: number; heatScore: number } | null>(null);
  const [cookingHeat, setCookingHeat] = useState(0);
  const [atticStorageOpen, setAtticStorageOpen] = useState(false);
  const [selectedAtticCraft, setSelectedAtticCraft] = useState<CraftType | null>(null);
  const [dreamScene, setDreamScene] = useState<number | null>(null);
  const [dreamPhase, setDreamPhase] = useState<"inside" | "outside">("inside");
  const [dreamSurreal, setDreamSurreal] = useState(false);
  const [dreamOddity, setDreamOddity] = useState(0);
  const [dreamOdditySteps, setDreamOdditySteps] = useState(0);
  const [dreamPlayer, setDreamPlayer] = useState({ x: 48, y: 62 });
  const [interiorFireLit, setInteriorFireLit] = useState(false);
  const [collectingForestCrystal, setCollectingForestCrystal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<StorableResource | null>(null);
  const [inspectedItem, setInspectedItem] = useState<string | null>(null);
  const [message, setMessage] = useState("先用锄头开垦一块土地吧！");
  const [soundOn, setSoundOn] = useState(true);
  const [speakingPerson, setSpeakingPerson] = useState<string | null>(null);
  const [workMenuPerson, setWorkMenuPerson] = useState<string | null>(null);
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
  const animalProductClickTimerRef = useRef<number | null>(null);
  const speechVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const speechRunRef = useRef(0);
  const walkTimerRef = useRef<number | null>(null);
  const farmEdgeTravelTimerRef = useRef<number | null>(null);
  const farmActionTimerRef = useRef<number | null>(null);
  const excursionTimerRef = useRef<number | null>(null);
  const lastMoveAtRef = useRef(0);
  const longPressTriggeredRef = useRef(false);
  const fishingWaitTimerRef = useRef<number | null>(null);
  const fishingBiteTimerRef = useRef<number | null>(null);
  const fishingMarkerTimerRef = useRef<number | null>(null);
  const fishingMarkerDirectionRef = useRef(1);
  const fishingMarkerValueRef = useRef(4);
  const fishingMarkerElementRef = useRef<HTMLElement | null>(null);
  const fishingBaitUsedRef = useRef(false);
  const craftKnifeLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const craftCarveProgressRef = useRef(0);
  const craftWrongCarvesRef = useRef(0);
  const festivalDragReadyRef = useRef(false);
  const festivalRiddleCorrectRef = useRef<boolean | null>(null);
  const ageEchoDirectionRef = useRef(1);
  const hybridBrushActiveRef = useRef(false);
  const hybridBrushLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const hybridBrushDistanceRef = useRef(0);
  const hybridBrushDoneRef = useRef(false);
  const ageCampDropLockRef = useRef(false);
  const wishWorkshopDropLockRef = useRef(false);
  const wishAssemblyActiveRef = useRef(false);
  const wishAssemblyLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const wishAssemblyDistanceRef = useRef(0);
  const tripDropLockRef = useRef(false);
  const tripGestureActiveRef = useRef(false);
  const tripGestureLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const tripGestureDistanceRef = useRef(0);
  const tripMoveHoldTimerRef = useRef<number | null>(null);
  const festivalActionCountRef = useRef(0);
  const festivalHoldTimerRef = useRef<number | null>(null);
  const festivalSweepActiveRef = useRef(false);
  const festivalSweepLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const festivalSweepDistanceRef = useRef(0);
  const coffeeGrindActiveRef = useRef(false);
  const coffeeGrindLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const coffeeGrindDistanceRef = useRef(0);
  const coffeeGrindTurnsRef = useRef(0);
  const coffeeWaterTimerRef = useRef<number | null>(null);
  const snowPushTimerRef = useRef<number | null>(null);
  const snowRollingFinishedRef = useRef(false);
  const waterFestivalRef = useRef<WaterFestivalState>({ installedPipes: [false, false, false, false], heldPipe: null, bucketFill: [0, 0, 0, 0], playerX: 10, hits: 0, soaked: 0 });
  const waterFillTimerRef = useRef<number | null>(null);
  const waterMoveTimerRef = useRef<number | null>(null);
  const waterPipeDropLockRef = useRef(false);
  const careGestureActiveRef = useRef(false);
  const careGestureLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const careGestureDistanceRef = useRef(0);
  const careHoldTimerRef = useRef<number | null>(null);
  const careHoldFinishTimerRef = useRef<number | null>(null);
  const cloneMissionTimerRef = useRef<number | null>(null);
  const babyCareAimDirectionRef = useRef(1);
  const babyCareToyDirectionRef = useRef(1);
  const babyCareWaterTimerRef = useRef<number | null>(null);
  const babyCareBrushLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const babyCareBrushDistanceRef = useRef(0);
  const petContestAimDirectionRef = useRef(1);
  const petContestPowerTimerRef = useRef<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const latestSaveRef = useRef<{ key: string; game: GameState } | null>(null);
  const beachRespawnTimersRef = useRef<number[]>([]);
  const bedtimeTimersRef = useRef<number[]>([]);
  const multiplayerStatusRef = useRef({ player, game });
  const splitLeftRef = useRef<HTMLIFrameElement | null>(null);
  const splitRightRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    festivalActionCountRef.current = festivalActionCount;
  }, [festivalActionCount]);

  useEffect(() => {
    waterFestivalRef.current = waterFestival;
  }, [waterFestival]);

  useEffect(() => {
    if (ageTraining?.skill !== "echo" && !echoSurvey) return;
    const timer = window.setInterval(() => {
      setAgeEchoPulse((current) => {
        if (current >= 94) ageEchoDirectionRef.current = -1;
        if (current <= 6) ageEchoDirectionRef.current = 1;
        return current + ageEchoDirectionRef.current * 4;
      });
    }, 65);
    return () => window.clearInterval(timer);
  }, [ageTraining?.skill, echoSurvey]);

  useEffect(() => {
    if (!babyCare || (babyCare.stage !== 0 && babyCare.stage !== 3)) return;
    const timer = window.setInterval(() => {
      if (babyCare.stage === 0) {
        setBabyCareAim((current) => {
          if (current >= 94) babyCareAimDirectionRef.current = -1;
          if (current <= 6) babyCareAimDirectionRef.current = 1;
          return current + babyCareAimDirectionRef.current * 4;
        });
      } else {
        setBabyCareToyAim((current) => {
          if (current >= 92) babyCareToyDirectionRef.current = -1;
          if (current <= 8) babyCareToyDirectionRef.current = 1;
          return current + babyCareToyDirectionRef.current * 5;
        });
      }
    }, babyCare.stage === 0 ? 58 : 52);
    return () => window.clearInterval(timer);
  }, [babyCare?.stage]);

  useEffect(() => {
    if (!petContest || petContest.finished || petContest.round !== 0) return;
    const timer = window.setInterval(() => {
      setPetContestAim((current) => {
        if (current >= 94) petContestAimDirectionRef.current = -1;
        if (current <= 6) petContestAimDirectionRef.current = 1;
        return current + petContestAimDirectionRef.current * 4;
      });
    }, 48);
    return () => window.clearInterval(timer);
  }, [petContest?.round, petContest?.finished]);

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
          const petFamily = reconcilePetFamilies(parsed.pets, parsed.lastPetBirthYears, parsed.year ?? 1, parsed.season ?? 0, parsed.day ?? 1);
          setGame({
            ...defaults,
            ...parsed,
            playerAge: parsed.playerAge ?? Math.max(1, (parsed.year ?? 1) + ((parsed.birthdayCakeYear ?? 0) === (parsed.year ?? 1) ? 1 : 0)),
            birthdayGrowthYear: parsed.birthdayGrowthYear ?? parsed.birthdayCakeYear ?? 0,
            ageSkillsLearned: parsed.ageSkillsLearned ?? [],
            lastAgeAbilityDays: parsed.lastAgeAbilityDays ?? {},
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
            diamonds: parsed.diamonds ?? 0,
            herbs: parsed.herbs ?? 0,
            pinecones: parsed.pinecones ?? 0,
            pineNuts: parsed.pineNuts ?? 0,
            resin: parsed.resin ?? 0,
            cows: parsed.cows ?? 0,
            sheep: parsed.sheep ?? 0,
            animalRaincoatAssignments: parsed.animalRaincoatAssignments ?? [],
            sickFarmAnimalIds: parsed.sickFarmAnimalIds ?? [],
            pets: petFamily.pets,
            lastPetBirthYears: petFamily.lastPetBirthYears,
            groundSupplies: defaults.groundSupplies.map((defaultVisible, index) => parsed.groundSupplies?.[index] ?? defaultVisible),
            treeStates: parsed.treeStates?.length === 4 ? parsed.treeStates : defaults.treeStates,
            plantedTrees: (parsed.plantedTrees ?? []).map((tree) => ({ ...tree, watered: tree.watered ?? false })),
            rockStates: defaults.rockStates.map((defaultStanding, index) => parsed.rockStates?.[index] ?? defaultStanding),
            caveDiamondStates: defaults.caveDiamondStates.map((defaultStanding, index) => parsed.caveDiamondStates?.[index] ?? defaultStanding),
            caveDiamondSpots: parsed.caveDiamondSpots?.length === 3 ? parsed.caveDiamondSpots : defaults.caveDiamondSpots,
            crafted: { ...defaults.crafted, ...(parsed.crafted ?? {}) },
            placedCrafts: parsed.placedCrafts ?? [],
            farmHelperToday: parsed.farmHelperToday ?? null,
            farmVisitor: parsed.farmVisitor ?? null,
            upgrades: { ...defaults.upgrades, ...(parsed.upgrades ?? {}) },
            builderSupplies: { ...defaults.builderSupplies, ...(parsed.builderSupplies ?? {}) },
            equipment: { ...defaults.equipment, ...(parsed.equipment ?? {}) },
            toolUpgrades: { ...defaults.toolUpgrades, ...(parsed.toolUpgrades ?? {}) },
            toolUpgradeDays: {
              axe: parsed.toolUpgradeDays?.axe ?? (parsed.toolUpgrades?.axe ? 7 : 0),
              rod: parsed.toolUpgradeDays?.rod ?? (parsed.toolUpgrades?.rod ? 7 : 0),
              pickaxe: parsed.toolUpgradeDays?.pickaxe ?? (parsed.toolUpgrades?.pickaxe ? 7 : 0),
            },
            daily: parsed.daily?.day === parsed.day ? { ...defaults.daily, ...parsed.daily } : { ...defaults.daily, day: parsed.day ?? 1 },
            sick: parsed.sick ?? false,
            diagnosed: parsed.diagnosed ?? false,
            medicalTrained: parsed.medicalTrained ?? false,
            illness: parsed.illness ?? null,
            learnedTreatments: parsed.learnedTreatments ?? [],
            treatmentBaths: parsed.treatmentBaths ?? {},
            lastIllnessDay: parsed.lastIllnessDay ?? 0,
            npcHealedDays: parsed.npcHealedDays ?? {},
            lastSchoolAttendance: parsed.lastSchoolAttendance ?? "",
            mallItems: { ...defaults.mallItems, ...(parsed.mallItems ?? {}) },
            lanternRiddlesSolved: parsed.lanternRiddlesSolved ?? [],
            festivalActivitiesCompleted: parsed.festivalActivitiesCompleted ?? [],
            atticStorage: { ...defaults.atticStorage, ...(parsed.atticStorage ?? {}) },
            atticChestPlaced: parsed.atticChestPlaced ?? false,
            atticPlacedCrafts: parsed.atticPlacedCrafts ?? [],
            firstFloorNightstandPlaced: parsed.firstFloorNightstandPlaced ?? false,
            friendship: parsed.friendship ?? {},
            lastTalkedDays: parsed.lastTalkedDays ?? {},
            forestQuestEpisode: parsed.forestQuestEpisode ?? 0,
            forestQuestNextAbsoluteDay: parsed.forestQuestNextAbsoluteDay ?? 0,
            residentQuestCompletions: parsed.residentQuestCompletions ?? [],
            residentTripDays: parsed.residentTripDays ?? [],
            residentWishes: parsed.residentWishes ?? {},
            wishPlantingRecords: parsed.wishPlantingRecords ?? {},
            residentWorkOrders: parsed.residentWorkOrders ?? [],
            cropQualityHarvests: mergeCropQualityRecord(parsed.cropQualityHarvests),
            cropQualityStock: mergeCropQualityStock(parsed.cropQualityStock),
            chestCropQualityStock: mergeCropQualityStock(parsed.chestCropQualityStock),
            shippingCropQualityStock: mergeCropQualityStock(parsed.shippingCropQualityStock),
            watchedTvEpisodes: parsed.watchedTvEpisodes ?? [],
            journalEntries: parsed.journalEntries ?? defaults.journalEntries,
            recipesDiscovered: parsed.recipesDiscovered ?? [],
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
    if (!ready || festivalPreview) return;
    latestSaveRef.current = { key: saveStorageKey, game };
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      const latest = latestSaveRef.current;
      if (latest) localStorage.setItem(latest.key, JSON.stringify(latest.game));
      saveTimerRef.current = null;
    }, 600);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    };
  }, [festivalPreview, game, ready, saveStorageKey]);

  useEffect(() => {
    const flushSave = () => {
      const latest = latestSaveRef.current;
      if (latest) localStorage.setItem(latest.key, JSON.stringify(latest.game));
    };
    window.addEventListener("pagehide", flushSave);
    return () => {
      window.removeEventListener("pagehide", flushSave);
      flushSave();
    };
  }, []);

  useEffect(() => {
    if (!ready || localStorage.getItem("qinghe-dream-preview-v90")) return;
    localStorage.setItem("qinghe-dream-preview-v90", "shown");
    const previousPreview = Number(localStorage.getItem("qinghe-last-preview-dream") ?? -1);
    const previewChoices = DREAM_STORIES.map((_, index) => index).filter((index) => index % 16 >= 8 && index !== previousPreview && index % 16 !== previousPreview % 16);
    const previewDream = previewChoices[Math.floor(Math.random() * previewChoices.length)] ?? 0;
    localStorage.setItem("qinghe-last-preview-dream", String(previewDream));
    setDreamScene(previewDream);
    setDreamPhase("inside");
    setDreamSurreal(false);
    setDreamOddity(0);
    setDreamOdditySteps(0);
    setDreamPlayer({ x: 48, y: 70 });
    setScene("farm");
    setActiveBuilding("farmhouse");
    setIndoorPlayer({ x: 12, y: 70 });
    setBedtimePhase("waking");
    setMessage("早上七点，小禾像平常一样在自己的床上睁开了眼睛。 ");
  }, [ready]);

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
            pickaxe: data.save.toolUpgradeDays?.pickaxe ?? (data.save.toolUpgrades?.pickaxe ? 7 : 0),
          },
          diagnosed: data.save.diagnosed ?? false,
          medicalTrained: data.save.medicalTrained ?? false,
          illness: data.save.illness ?? null,
          learnedTreatments: data.save.learnedTreatments ?? [],
          treatmentBaths: data.save.treatmentBaths ?? {},
          daily: { ...defaults.daily, ...(data.save.daily ?? {}) },
          caveDiamondStates: defaults.caveDiamondStates.map((standing, index) => data.save.caveDiamondStates?.[index] ?? standing),
          farmHelperToday: data.save.farmHelperToday ?? null,
          caveDiamondSpots: data.save.caveDiamondSpots?.length === 3 ? data.save.caveDiamondSpots : defaults.caveDiamondSpots,
          lanternRiddlesSolved: data.save.lanternRiddlesSolved ?? [],
          festivalActivitiesCompleted: data.save.festivalActivitiesCompleted ?? [],
          atticStorage: { ...defaults.atticStorage, ...(data.save.atticStorage ?? {}) },
          atticChestPlaced: data.save.atticChestPlaced ?? false,
          atticPlacedCrafts: data.save.atticPlacedCrafts ?? [],
          firstFloorNightstandPlaced: data.save.firstFloorNightstandPlaced ?? false,
          animalRaincoatAssignments: data.save.animalRaincoatAssignments ?? [],
          sickFarmAnimalIds: data.save.sickFarmAnimalIds ?? [],
          mallItems: { ...defaults.mallItems, ...(data.save.mallItems ?? {}) },
          friendship: data.save.friendship ?? {},
          lastTalkedDays: data.save.lastTalkedDays ?? {},
          forestQuestEpisode: data.save.forestQuestEpisode ?? 0,
          forestQuestNextAbsoluteDay: data.save.forestQuestNextAbsoluteDay ?? 0,
          residentQuestCompletions: data.save.residentQuestCompletions ?? [],
          residentTripDays: data.save.residentTripDays ?? [],
          residentWishes: data.save.residentWishes ?? {},
          wishPlantingRecords: data.save.wishPlantingRecords ?? {},
          residentWorkOrders: data.save.residentWorkOrders ?? [],
          cropQualityHarvests: mergeCropQualityRecord(data.save.cropQualityHarvests),
          cropQualityStock: mergeCropQualityStock(data.save.cropQualityStock),
          chestCropQualityStock: mergeCropQualityStock(data.save.chestCropQualityStock),
          shippingCropQualityStock: mergeCropQualityStock(data.save.shippingCropQualityStock),
          watchedTvEpisodes: data.save.watchedTvEpisodes ?? [],
          journalEntries: data.save.journalEntries ?? defaults.journalEntries,
          recipesDiscovered: data.save.recipesDiscovered ?? [],
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
    setGame((current) => ({ ...current, sick: true, diagnosed: false, illness: "overwork", lastIllnessDay: current.day }));
    setMessage("小禾累得没有精神，嘴角悄悄垂了下来。 ");
  }, [game.energy, game.sick, ready]);

  useEffect(() => {
    if (!newsBroadcast) return;
    setTvProgramStep(0);
    const storyTimer = newsBroadcast.channel === "news" ? null : window.setInterval(() => {
      setTvProgramStep((step) => Math.min(4, step + 1));
    }, 3_000);
    const broadcastTimer = window.setTimeout(() => {
      setNewsBroadcast(null);
      setMessage(newsBroadcast.automatic ? "紧急新闻播报结束。请根据大屏幕地点赶到现场帮忙。" : "本次电视节目播放结束，画面自动关闭了。 ");
    }, newsBroadcast.channel === "news" ? 9_000 : 16_500);
    return () => {
      window.clearTimeout(broadcastTimer);
      if (storyTimer) window.clearInterval(storyTimer);
    };
  }, [newsBroadcast?.automatic, newsBroadcast?.channel, newsBroadcast?.news.kind]);

  useEffect(() => {
    if (cookingGame?.step !== "heat") return;
    const heatTimer = window.setInterval(() => {
      setCookingHeat((value) => value >= 100 ? 0 : value + 2);
    }, 70);
    return () => window.clearInterval(heatTimer);
  }, [cookingGame?.step]);

  useEffect(() => {
    if (!newsBroadcast || newsBroadcast.channel !== "kids") return;
    const episode = (game.year - 1) * 112 + game.season * 28 + game.day;
    setGame((current) => current.watchedTvEpisodes.includes(episode) ? current : {
      ...current,
      watchedTvEpisodes: [...current.watchedTvEpisodes, episode].slice(-180),
      journalEntries: [`${SEASONS[current.season]}第${current.day}天：看了青苗少儿频道第 ${episode} 集动画。`, ...current.journalEntries].slice(0, 40),
    });
  }, [game.day, game.season, game.year, newsBroadcast?.channel]);

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
      setGame((current) => current.rainExposure > 0 ? { ...current, rainExposure: 0 } : current);
      return;
    }
    if (game.sick) return;
    const rainTimer = window.setInterval(() => {
      setGame((current) => {
        const rainExposure = current.rainExposure + 5;
        if (rainExposure < 60 || current.sick) return { ...current, rainExposure };
        setMessage("小禾在雨里淋得太久，冷得发抖，嘴角也变成了伤心的样子。快去诊所检查或回家休息吧。");
        playTone(210);
        const rainIllness: IllnessId = ((current.year - 1) * 112 + current.season * 28 + current.day) % 2 ? "rainFlu" : "windChill";
        return { ...current, rainExposure, sick: true, diagnosed: false, illness: rainIllness, lastIllnessDay: current.day };
      });
    }, 5_000);
    return () => window.clearInterval(rainTimer);
  }, [activeBuilding, ananBeachOpen, farmInterior, friendHomeOpen, game.sick, game.umbrellaOpen, game.weather, mallOpen, neighborInterior, petHospitalOpen, petShopOpen, ready, residentHome]);

  useEffect(() => {
    const rainy = game.weather === "rain" || game.weather === "thunder";
    const petsAreIndoors = Boolean(activeBuilding || neighborInterior || residentHome || friendHomeOpen || farmInterior || mallOpen || petShopOpen || petHospitalOpen || ananBeachOpen);
    if (!ready) return;
    if (!rainy || petsAreIndoors) {
      setGame((current) => current.animalRainExposure > 0 ? { ...current, animalRainExposure: 0 } : current);
      return;
    }
    const animalRainTimer = window.setInterval(() => {
      setGame((current) => {
        const petAnimals = current.pets
          .filter((pet) => pet.id !== current.missingPetId)
          .map((pet) => ({ id: pet.id, name: PET_CATALOG.find((entry) => entry.id === pet.type)?.name ?? "小宠物" }));
        if (!petAnimals.length) return current.animalRainExposure > 0 ? { ...current, animalRainExposure: 0 } : current;

        let animalRainExposure = current.animalRainExposure + 5;
        let next: GameState = { ...current, animalRainExposure };
        const absoluteDay = (current.year - 1) * 112 + current.season * 28 + current.day;
        const protectedPets = petAnimals.filter((pet) => current.animalRaincoatAssignments.includes(pet.id));

        if (animalRainExposure >= 30 && protectedPets.length > 0 && current.lastAnimalPuddleFindDay !== absoluteDay) {
          const finder = protectedPets[absoluteDay % protectedPets.length];
          const findType = (absoluteDay + protectedPets.length) % 6;
          const finds = ["三份食物", "一只奇怪的旧袜子", "一把旧锄头", "三颗种子", "一根幸运鱼竿", "一颗钻石"];
          next = {
            ...next,
            lastAnimalPuddleFindDay: absoluteDay,
            petFood: next.petFood + (findType === 0 ? 3 : 0),
            oldSocks: next.oldSocks + (findType === 1 ? 1 : 0),
            puddleHoes: next.puddleHoes + (findType === 2 ? 1 : 0),
            seeds: next.seeds + (findType === 3 ? 3 : 0),
            diamonds: next.diamonds + (findType === 5 ? 1 : 0),
            toolUpgrades: findType === 4 ? { ...next.toolUpgrades, rod: true } : next.toolUpgrades,
            toolUpgradeDays: findType === 4 ? { ...next.toolUpgradeDays, rod: Math.max(7, next.toolUpgradeDays.rod) } : next.toolUpgradeDays,
          };
          setMessage(`${finder.name}穿着黄雨衣在门外水坑里跳跳跳，竟然从水花里发现了${finds[findType]}！已经收进资源记录。`);
          playTone(880);
        }

        if (animalRainExposure >= 45) {
          const unprotectedHealthyPets = petAnimals.filter((pet) => !current.animalRaincoatAssignments.includes(pet.id) && !current.sickPetIds.includes(pet.id));
          animalRainExposure = 0;
          next = { ...next, animalRainExposure };
          if (unprotectedHealthyPets.length > 0) {
            const pet = unprotectedHealthyPets[Math.floor(Math.random() * unprotectedHealthyPets.length)];
            next = { ...next, sickPetIds: [...next.sickPetIds, pet.id] };
            setMessage(`${pet.name}跟在脚边淋雨太久，身体发冷生病了。给小宠物穿黄色小雨衣就不会因淋雨生病；现在可以用一份药材照顾它。`);
            playTone(210);
          }
        }
        return next;
      });
    }, 5_000);
    return () => window.clearInterval(animalRainTimer);
  }, [activeBuilding, ananBeachOpen, farmInterior, friendHomeOpen, game.weather, mallOpen, neighborInterior, petHospitalOpen, petShopOpen, ready, residentHome]);

  useEffect(() => {
    if (!ready) return;
    setGame((current) => {
      const petIds = new Set(current.pets.map((pet) => pet.id));
      const petRaincoats = current.animalRaincoatAssignments.filter((id) => petIds.has(id));
      if (petRaincoats.length === current.animalRaincoatAssignments.length && current.sickFarmAnimalIds.length === 0) return current;
      return { ...current, animalRaincoatAssignments: petRaincoats, sickFarmAnimalIds: [] };
    });
  }, [game.pets, ready]);

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
    if (farmEdgeTravelTimerRef.current) window.clearTimeout(farmEdgeTravelTimerRef.current);
    if (matchesClickTimerRef.current) window.clearTimeout(matchesClickTimerRef.current);
    if (woolClickTimerRef.current) window.clearTimeout(woolClickTimerRef.current);
    if (animalProductClickTimerRef.current) window.clearTimeout(animalProductClickTimerRef.current);
    if (farmActionTimerRef.current) window.clearTimeout(farmActionTimerRef.current);
    if (excursionTimerRef.current) window.clearTimeout(excursionTimerRef.current);
    if (fishingWaitTimerRef.current) window.clearTimeout(fishingWaitTimerRef.current);
    if (fishingBiteTimerRef.current) window.clearTimeout(fishingBiteTimerRef.current);
    if (fishingMarkerTimerRef.current) window.clearInterval(fishingMarkerTimerRef.current);
    if (tripMoveHoldTimerRef.current !== null) window.clearInterval(tripMoveHoldTimerRef.current);
    if (careHoldTimerRef.current !== null) window.clearInterval(careHoldTimerRef.current);
    if (careHoldFinishTimerRef.current !== null) window.clearTimeout(careHoldFinishTimerRef.current);
    if (cloneMissionTimerRef.current !== null) window.clearTimeout(cloneMissionTimerRef.current);
    if (babyCareWaterTimerRef.current !== null) window.clearInterval(babyCareWaterTimerRef.current);
    beachRespawnTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    beachRespawnTimersRef.current = [];
    bedtimeTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    bedtimeTimersRef.current = [];
  }, []);

  useEffect(() => {
    if (fishingPhase !== "reeling") return;
    fishingMarkerDirectionRef.current = 1;
    fishingMarkerValueRef.current = 4;
    if (fishingMarkerElementRef.current) fishingMarkerElementRef.current.style.left = "4%";
    fishingMarkerTimerRef.current = window.setInterval(() => {
      const speed = game.toolUpgrades.rod ? 4 : 6;
      let next = fishingMarkerValueRef.current + fishingMarkerDirectionRef.current * speed;
      if (next >= 96) { next = 96; fishingMarkerDirectionRef.current = -1; }
      if (next <= 4) { next = 4; fishingMarkerDirectionRef.current = 1; }
      fishingMarkerValueRef.current = next;
      if (fishingMarkerElementRef.current) fishingMarkerElementRef.current.style.left = `${next}%`;
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

  const walkToAnanFarmEdge = useCallback(() => {
    if (farmEdgeTraveling || scene !== "farm" || worldVillage !== "qinghe") return;
    if (farmEdgeTravelTimerRef.current) window.clearTimeout(farmEdgeTravelTimerRef.current);
    if (walkTimerRef.current) window.clearTimeout(walkTimerRef.current);
    setFacing("left");
    setIsWalking(true);
    setFarmEdgeTraveling(true);
    setPlayer({ x: QINGHE_WEST_PATH_END, y: 5 });
    setMessage("小禾正穿过动物区，沿着箭头走向农场真正的最左边缘…… ");
    farmEdgeTravelTimerRef.current = window.setTimeout(() => {
      setFarmEdgeTraveling(false);
      setIsWalking(false);
      setMessage("已经走到箭头尖指着的路口。现在再向左走一步，才会进入安安的小农场。 ");
      farmEdgeTravelTimerRef.current = null;
    }, 1_250);
  }, [farmEdgeTraveling, scene, worldVillage]);

  const crossSceneBoundary = useCallback((destination: { x: number; y: number }, dx: number, dy: number) => {
    if (scene === "farm" && worldVillage === "maple" && dx < 0 && destination.x === -6) {
      const friend = onlinePlayers.find((onlinePlayer) => onlinePlayer.deviceId !== multiplayerSession?.deviceId && onlinePlayer.online && onlinePlayer.currentVillage === "qinghe");
      switchVillage("qinghe");
      setScene(friend?.scene ?? "farm");
      setPlayer(friend ? { x: Math.max(0, Math.min(11, friend.x + 1)), y: friend.y } : { x: 11, y: 5 });
      setMessage(friend ? `沿着左边山路到了青禾村，一进村就看见了${friend.playerName}！` : "沿着左边山路到了青禾村。朋友来到同一个场景后就会出现。 ");
      return true;
    }
    if (scene === "farm" && worldVillage === "qinghe" && dx < 0 && destination.x === QINGHE_WEST_EXIT) {
      setScene("westFriendFarm"); setPlayer({ x: 11, y: 5 }); setMessage("沿着农场左边的草路，来到安安的小农场。 "); return true;
    }
    if (scene === "westFriendFarm" && dx > 0 && destination.x === 11) {
      setScene("farm"); setPlayer({ x: QINGHE_WEST_PATH_END, y: 5 }); setMessage("从安安的小农场回到青禾农场最左边缘。往右走可以回到农田。 "); return true;
    }
    if (scene === "farm" && dx > 0 && destination.x === 14) {
      setScene("town"); setPlayer({ x: 0, y: 5 }); setMessage(`欢迎来到${VILLAGE_INFO[worldVillage].name}！走到道路边缘就能继续前往其他地方。`); return true;
    }
    if (scene === "town" && dx < 0 && destination.x === 0) {
      setScene("farm"); setPlayer({ x: 13, y: 5 }); setMessage("回到农场最右边的草路啦。继续往里走才会到农田。 "); return true;
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

  const advanceOrdinaryDream = useCallback((nextX: number, nextY: number) => {
    if (dreamScene === null || dreamPhase !== "outside") return false;
    const dreamVariant = dreamScene % 16;
    if (dreamOddity >= 4) {
      const wakeTrigger = (
        (dreamVariant === 0 && nextX >= 10 && nextY >= 4)
        || (dreamVariant === 1 && nextX <= 3 && nextY <= 2)
        || (dreamVariant === 2 && nextX >= 5 && nextX <= 7 && nextY >= 6)
        || (dreamVariant === 3 && nextX >= 5 && nextX <= 7 && nextY <= 1)
        || (dreamVariant === 4 && nextX <= 3 && nextY <= 3)
        || (dreamVariant === 5 && nextX >= 8 && nextY <= 3)
        || (dreamVariant === 6 && nextX >= 5 && nextX <= 7 && nextY >= 4)
        || (dreamVariant === 7 && nextX <= 1 && nextY >= 4)
        || (dreamVariant === 8 && nextX <= 2 && nextY >= 5)
        || (dreamVariant === 9 && nextX >= 8 && nextY >= 5)
        || (dreamVariant === 10 && nextX >= 9 && nextY <= 3)
        || (dreamVariant === 11 && nextX >= 4 && nextX <= 7 && nextY <= 1)
        || (dreamVariant === 12 && nextX >= 9 && nextY >= 5)
        || (dreamVariant === 13 && nextX <= 2 && nextY <= 2)
        || (dreamVariant === 14 && nextX >= 5 && nextX <= 7 && nextY >= 6)
        || (dreamVariant === 15 && nextX >= 4 && nextX <= 8 && nextY >= 2 && nextY <= 5)
      );
      if (!wakeTrigger) return false;
      const wakeMessages = [
        "小禾终于追上黑影。黑影转过身的一瞬间，四周安静下来——小禾在自己的床上醒了。 ",
        "小禾追着倒着飞的小鸟跑了一圈，小鸟忽然排成笑脸，清脆的叫声把小禾从梦里叫醒了。 ",
        "小禾踩住那道不属于自己的长影子，影子像水一样散开，眼前变回了熟悉的被子。 ",
        "小禾接住最后一颗漂浮的彩灯，彩灯变成一把亮晶晶的糖果，笑着笑着就在床上醒了。 ",
        "小禾靠近冒泡的水纹，一群圆滚滚的小鱼把水花吹成彩虹，再抬头时梦已经醒了。 ",
        "小禾重新走到那扇不太对劲的家门前。推门的一刻，自己从真正的床上醒了过来。 ",
        "小禾站到田地中央，幼苗们一起跳完一支舞，还向小禾鞠躬。掌声响起时，小禾在被窝里醒了。 ",
        "小禾跟着苍白的小动物走到草地尽头，它钻进晨光里，小禾也在床上睁开了眼睛。 ",
        "小禾沿着越来越小的脚印走完最后一步，脚下变成柔软的被子，梦也结束了。 ",
        "小禾数完水面最后一颗星星，星光轻轻一闪，睁眼时已经是早晨。 ",
        "小禾对着会眨眼的窗户眨了三次眼，再睁开时看见了真正的农舍窗户。 ",
        "小禾追上那个偷偷散步的稻草人，它站回原位的瞬间，梦里的风停了。 ",
        "草地小火车载着小禾绕完一圈，终点站的门一开，小禾就在床上醒了。 ",
        "小禾接住飘下来的羊毛，天空中的小羊变成云朵，梦安静地结束了。 ",
        "小禾走到彩虹雨的尽头，最后一滴雨变成晨光，小禾从被窝里醒来。 ",
        "小禾站在两个月亮正中间，影子重新合成一个，眼前也变回熟悉的房间。 ",
      ];
      setDreamScene(null);
      setDreamPhase("inside");
      setDreamSurreal(false);
      setDreamOddity(0);
      setDreamOdditySteps(0);
      setScene("farm");
      setActiveBuilding("farmhouse");
      setIndoorPlayer({ x: 12, y: 70 });
      setBedtimePhase("waking");
      setMessage(wakeMessages[dreamVariant]);
      playTone(920);
      return true;
    }
    const secretTrigger = dreamOddity === 0 && scene === "farm" && (
      (dreamVariant === 0 && nextX >= 10)
      || (dreamVariant === 1 && nextY <= 1)
      || (dreamVariant === 2 && nextX <= 0)
      || (dreamVariant === 3 && nextY >= 6)
      || (dreamVariant === 4 && nextX <= 3 && nextY <= 3)
      || (dreamVariant === 5 && nextX >= 8 && nextY <= 3)
      || (dreamVariant === 6 && nextX >= 3 && nextX <= 8 && nextY >= 4)
      || (dreamVariant === 7 && nextX >= 5 && nextX <= 7 && nextY >= 2 && nextY <= 4)
      || (dreamVariant === 8 && nextX >= 9 && nextY <= 2)
      || (dreamVariant === 9 && nextX <= 3 && nextY >= 4)
      || (dreamVariant === 10 && nextX >= 8 && nextY >= 3 && nextY <= 5)
      || (dreamVariant === 11 && nextX >= 4 && nextX <= 7 && nextY <= 2)
      || (dreamVariant === 12 && nextX <= 4 && nextY >= 6)
      || (dreamVariant === 13 && nextX >= 7 && nextY >= 5)
      || (dreamVariant === 14 && nextX <= 2 && nextY <= 2)
      || (dreamVariant === 15 && nextX >= 4 && nextX <= 8 && nextY >= 2 && nextY <= 5)
    );
    if (secretTrigger) {
      setDreamOddity(1);
      setDreamOdditySteps(0);
      return false;
    }
    if (dreamOddity <= 0) return false;
    const nextOdditySteps = dreamOdditySteps + 1;
    if (nextOdditySteps < 7) {
      setDreamOdditySteps(nextOdditySteps);
      return false;
    }
    const nextOddity = Math.min(4, dreamOddity + 1);
    setDreamOddity(nextOddity);
    setDreamOdditySteps(0);
    if (nextOddity >= 4) {
      setDreamSurreal(true);
      setMessage("小禾终于确定：这个熟悉的世界确实有哪里不对。 ");
      playTone(820);
    }
    return false;
  }, [dreamOddity, dreamOdditySteps, dreamPhase, dreamScene, dreamSurreal, scene]);

  const move = useCallback((dx: number, dy: number) => {
    if (farmEdgeTraveling) return;
    if (bedtimePhase === "waking") {
      setBedtimePhase(null);
      setMessage("小禾掀开被子下床，可以继续走路了。 ");
    } else if (bedtimePhase) return;
    if (ananBeachTraveling || babyCare || careSession || hybridLab || echoSurvey || bulkChestPrompt || bulkShippingPrompt || cloneWorkOpen || newsBroadcast || guideOpen || journalOpen || cookingGame || drivingSchoolOpen || carTraveling || mallOpen || petShopOpen || petHospitalOpen || lanternRiddle !== null || festivalProcess || dragonBoatOpen || dragonBoatTraveling) return;
    if (ananBeachOpen) {
      showWalking(dx, dy);
      setBeachPlayer((current) => ({
        x: Math.max(7, Math.min(93, current.x + dx * 4)),
        y: Math.max(divingAtSea ? 22 : 30, Math.min(86, current.y + dy * 4)),
      }));
      setMessage(divingAtSea ? "穿着潜水服在水下游动，靠近小鱼小虾后可以抓起。 " : "在海滩上自由走动，也可以走进浅海游泳。 ");
      return;
    }
    if (craftingOpen || chestOpen || shippingBinOpen || ranchOpen) {
      setCraftingOpen(false);
      setChestOpen(false);
      setShippingBinOpen(false);
      setRanchOpen(false);
      setMessage("已经自动收起打开的窗口，小禾继续走路。 ");
    }
    const now = Date.now();
    if (now - lastMoveAtRef.current < 230) return;
    lastMoveAtRef.current = now;
    showWalking(dx, dy);
    if (trailExpedition && !activeBuilding && !farmInterior && !neighborInterior && !residentHome && !friendHomeOpen) {
      const route = AGE_WORLD_TRAIL_ROUTES[trailExpedition.routeIndex];
      const direction: TrailDirection = dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : "down";
      const expected = route[trailExpedition.step];
      if (direction === expected) {
        const nextStep = trailExpedition.step + 1;
        if (nextStep >= route.length) {
          setTrailExpedition(null);
          setGame((current) => {
            const hiddenSupply = current.groundSupplies.findIndex((visible) => !visible);
            const revealedSupplies = hiddenSupply < 0 ? current.groundSupplies : current.groundSupplies.map((visible, index) => index === hiddenSupply ? true : visible);
            const abilityDay = `${current.year}-${current.season}-${current.day}`;
            return {
              ...current,
              herbs: current.herbs + 2,
              pinecones: current.pinecones + 1,
              groundSupplies: revealedSupplies,
              lastAgeAbilityDays: { ...current.lastAgeAbilityDays, trail: abilityDay },
              journalEntries: [`${SEASONS[current.season]}第${current.day}天：使用林间循迹在主世界走完五段脚印，找到2份药材、1颗松果${hiddenSupply >= 0 ? "和一件隐藏补给" : ""}。`, ...current.journalEntries].slice(0, 40),
            };
          });
          setMessage("最后一枚脚印在草边消失了：找到 2 份药材、1 颗松果，并把沿途发现的补给留在地上。林间循迹今天完成！");
          playTone(960);
        } else {
          setTrailExpedition({ ...trailExpedition, step: nextStep });
          setMessage(`跟对了第 ${nextStep}/5 段脚印。下一枚脚印又出现在前方，继续亲自走过去。`);
          playTone(560 + nextStep * 50);
        }
      } else {
        setTrailExpedition({ ...trailExpedition, mistakes: trailExpedition.mistakes + 1 });
        setMessage("这边没有脚印。小禾仍然可以自由走动，但要转回发亮脚印指向的方向继续追踪。 ");
        playTone(230);
      }
    }
    if (farmInterior) {
      setIndoorPlayer((current) => ({
        x: Math.max(18, Math.min(82, current.x + dx * 5)),
        y: Math.max(58, Math.min(78, current.y + dy * 4)),
      }));
      setMessage(farmInterior === "cave" ? "小禾在山洞的小路上探索。 " : "小禾在帐篷里面走动。 ");
      return;
    }
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

    const canUseNorthEdge = scene === "town" || scene === "cultureDistrict" || scene === "southNeighbor";
    const farmWestLimit = worldVillage === "qinghe" ? QINGHE_WEST_EXIT : -6;
    const next = {
      x: Math.max(scene === "farm" ? farmWestLimit : 0, Math.min(scene === "farm" ? 14 : 11, player.x + dx)),
      y: Math.max(canUseNorthEdge ? 0 : 1, Math.min(7, player.y + dy)),
    };
    if (advanceOrdinaryDream(next.x, next.y)) return;
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
  }, [activeBuilding, advanceOrdinaryDream, ananBeachOpen, ananBeachTraveling, babyCare, bedtimePhase, bulkChestPrompt, bulkShippingPrompt, careSession, carTraveling, chestOpen, shippingBinOpen, cloneWorkOpen, cookingGame, craftingOpen, crossSceneBoundary, divingAtSea, dragonBoatOpen, dragonBoatTraveling, dreamOddity, dreamOdditySteps, dreamPhase, dreamPlayer, dreamScene, dreamSurreal, drivingSchoolOpen, echoSurvey, farmEdgeTraveling, farmGateOpen, farmInterior, festivalProcess, friendHomeOpen, game.day, game.npcHealedDays, game.placedCrafts, guideOpen, hybridLab, journalOpen, lanternRiddle, mallOpen, neighborInterior, newsBroadcast, petHospitalOpen, petShopOpen, player, ranchOpen, residentHome, scene, showWalking, trailExpedition, worldVillage]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (splitScreen && !embeddedMode) {
        if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault();
        if (["w", "a", "s", "d"].includes(key)) splitLeftRef.current?.contentWindow?.postMessage({ type: "split-move", key }, window.location.origin);
        if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) splitRightRef.current?.contentWindow?.postMessage({ type: "split-move", key }, window.location.origin);
        return;
      }
      if (key === "escape" && guideOpen) { setGuideOpen(false); return; }
      if (key === "escape" && journalOpen) { setJournalOpen(false); return; }
      if (key === "escape" && babyCare) {
        if (babyCareWaterTimerRef.current !== null) window.clearInterval(babyCareWaterTimerRef.current);
        babyCareWaterTimerRef.current = null;
        setBabyCare(null);
        setMessage("暂时离开宝宝照顾区，回到农舍；今天还可以重新照顾。 ");
        return;
      }
      if (key === "escape" && cloneWorkOpen) {
        setCloneWorkOpen(false);
        setMessage(cloneMission ? "收起了分身工作台，分身会继续完成已经安排的工作。 " : "收起了分身工作台，回到游戏。 ");
        return;
      }
      if (key === "escape" && careSession) {
        stopCareTimedHold(false);
        endCareGesture();
        setCareHeldItem(null);
        setMedicalThermometerPicked(false);
        setCareSession(null);
        setMessage("已经暂停治疗流程，回到游戏；疾病和已经学会的治疗方法都不会丢失。 ");
        return;
      }
      if (key === "escape" && trailExpedition) {
        setTrailExpedition(null);
        setMessage("暂时停止林间循迹。今天还可以从第一枚脚印重新开始。 ");
        return;
      }
      if (key === "escape" && hybridLab) {
        hybridBrushActiveRef.current = false;
        setHybridHeldSeed(null);
        setHybridLab(null);
        setMessage("收起四季育种台，种子没有消耗。 ");
        return;
      }
      if (key === "escape" && echoSurvey) {
        setEchoSurvey(null);
        setMessage("停止听石寻晶，本次没有消耗每日机会。 ");
        return;
      }
      if (key === "escape" && schoolLesson) {
        setSchoolLesson(null);
        setMessage("已经退出课堂，回到学校教室。下次可以重新开始这节课。 ");
        return;
      }
      if (key === "escape" && cookingGame) { setCookingGame(null); setMessage("暂时收起了烹饪台，食材还留在背包。 "); return; }
      if (key === "escape" && bulkChestPrompt) {
        setBulkChestPrompt(null);
        setChestDepositStreak(null);
        setMessage("暂时不把剩下的物品全部放入收纳箱。 ");
        return;
      }
      if (key === "escape" && bulkShippingPrompt) {
        setBulkShippingPrompt(null);
        setShippingDepositStreak(null);
        setMessage("暂时保留背包里剩下的同类物品。 ");
        return;
      }
      if (key === "escape" && newsBroadcast) {
        setNewsBroadcast(null);
        setMessage("关掉电视节目，回到游戏。 ");
        return;
      }
      if (key === "escape" && birthdayCeremony) {
        setBirthdayCeremony(null);
        setMessage("生日会页面已经关闭，回到农舍房间。再次点击蛋糕可以继续。 ");
        return;
      }
      if (key === "escape" && townhallCalendarOpen) {
        setTownhallCalendarOpen(false);
        setMessage("收起了镇公所的全年节日公告栏。 ");
        return;
      }
      if (key === "escape" && festivalProcess) {
        setFestivalProcess(null);
        setMessage("暂时离开节日活动，今天还可以回来继续参加。 ");
        return;
      }
      if (key === "escape" && (dragonBoatOpen || dragonBoatTraveling)) {
        setDragonBoatOpen(false);
        setDragonBoatTraveling(false);
        setDragonBoatRole(null);
        setMessage("乘节日大巴回到了中心广场。 ");
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
        setMessage("关上大号售卖箱，放进去的东西会在睡觉后售卖。 ");
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
      if (key === "escape" && dreamScene !== null) {
        setDreamScene(null);
        setDreamPhase("inside");
        setDreamSurreal(false);
        setDreamOddity(0);
        setDreamOdditySteps(0);
        setMessage("小禾从奇怪的梦里醒来，发现自己仍然盖着被子躺在床上。 ");
        return;
      }
      if (key === "escape" && activeBuilding) {
        const building = BUILDING_INFO[activeBuilding];
        if (activeBuilding === "farmhouse") {
          setBedtimePhase(null);
          setHouseFloor(1);
          setUpstairsRoom(null);
          setAtticStorageOpen(false);
          setSelectedAtticCraft(null);
        }
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
      if (["1", "2", "3", "4", "5", "6", "7"].includes(key)) setSelectedResource(null);
      if (key === "1") setSelected("hoe");
      if (key === "2") setSelected("seed");
      if (key === "3") setSelected("water");
      if (key === "4") setSelected("hand");
      if (key === "5") setSelected("rod");
      if (key === "6") setSelected("axe");
      if (key === "7") setSelected("pickaxe");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeBuilding, ananBeachOpen, ananBeachTraveling, babyCare, birthdayCeremony, builderOpen, bulkChestPrompt, bulkShippingPrompt, careSession, chestOpen, shippingBinOpen, cloneMission, cloneWorkOpen, cookingGame, craftingOpen, dragonBoatOpen, dragonBoatTraveling, dreamScene, echoSurvey, embeddedMode, farmInterior, festivalProcess, friendHomeOpen, guideOpen, hybridLab, journalOpen, move, neighborInterior, newsBroadcast, petHospitalOpen, petShopOpen, ranchOpen, residentHome, schoolLesson, splitScreen, townhallCalendarOpen, trailExpedition]);

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

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const naturalVoiceScore = (voice: SpeechSynthesisVoice) => {
      const name = voice.name.toLowerCase();
      let score = voice.localService ? 3 : 9;
      if (voice.lang.toLowerCase() === "zh-cn") score += 10;
      if (/natural|neural|premium|enhanced/.test(name)) score += 48;
      if (/google|microsoft|siri|xiaoxiao|xiaoyi|yunxi|yunyang|yunxia|tingting|mei-jia|sin-ji|li-mu/.test(name)) score += 34;
      if (/compact|basic|novelty|espeak|festival/.test(name)) score -= 60;
      return score;
    };
    const refreshVoices = () => {
      const sortedVoices = window.speechSynthesis.getVoices()
        .filter((voice) => voice.lang.toLowerCase().startsWith("zh"))
        .sort((first, second) => naturalVoiceScore(second) - naturalVoiceScore(first));
      const bestScore = sortedVoices[0] ? naturalVoiceScore(sortedVoices[0]) : 0;
      const naturalVoices = sortedVoices.filter((voice) => naturalVoiceScore(voice) >= bestScore - 8).slice(0, 3);
      speechVoicesRef.current = naturalVoices.length ? naturalVoices : sortedVoices.slice(0, 1);
    };
    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
  }, []);

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

  const voiceProfileFor = (person: string) => {
    const code = [...person].reduce((total, letter) => total + (letter.codePointAt(0) ?? 0), 0);
    const voices = speechVoicesRef.current;
    const younger = (YOUNG_FRIENDS as readonly string[]).includes(person) || person === "安安";
    return {
      voice: voices.length ? voices[code % voices.length] : null,
      rate: (younger ? .98 : .94) + (code % 3) * .01,
      pitch: (younger ? 1.025 : .985) + (code % 3) * .008,
    };
  };

  const speakResident = (person: string, text: string) => {
    if (!soundOn || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const quotedSpeech = [...text.matchAll(/“([^”]+)”/g)].map((match) => match[1]).join("，");
    const spokenText = (quotedSpeech || text.replace(new RegExp(`^${person}[：:]`), ""))
      .replace(/[“”]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
    if (!spokenText) return;
    try {
      const profile = voiceProfileFor(person);
      const runId = speechRunRef.current + 1;
      speechRunRef.current = runId;
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const naturalText = spokenText
        .replace(/，/g, "， ")
        .replace(/；/g, "； ")
        .replace(/([。！？])/g, "$1 ")
        .trim();
      const utterance = new SpeechSynthesisUtterance(naturalText);
      utterance.lang = profile.voice?.lang ?? "zh-CN";
      utterance.voice = profile.voice;
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;
      utterance.volume = .96;
      utterance.onstart = () => {
        if (speechRunRef.current === runId) setSpeakingPerson(person);
      };
      utterance.onend = () => {
        if (speechRunRef.current === runId) setSpeakingPerson((current) => current === person ? null : current);
      };
      utterance.onerror = () => {
        if (speechRunRef.current === runId) setSpeakingPerson((current) => current === person ? null : current);
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      // Voice playback is an enhancement; dialogue text remains visible.
    }
  };

  const playBirthdayChoirNote = (noteIndex: number) => {
    if (!soundOn) return;
    const melody = [523.25, 523.25, 587.33, 523.25];
    try {
      const context = new window.AudioContext();
      const now = context.currentTime;
      const master = context.createGain();
      master.gain.setValueAtTime(.0001, now);
      master.gain.exponentialRampToValueAtTime(.11, now + .035);
      master.gain.exponentialRampToValueAtTime(.0001, now + .58);
      master.connect(context.destination);
      [-13, -6, 0, 7, 12].forEach((detune, singerIndex) => {
        const oscillator = context.createOscillator();
        const singerGain = context.createGain();
        const warmth = context.createBiquadFilter();
        oscillator.type = singerIndex % 2 ? "sine" : "triangle";
        oscillator.frequency.value = melody[noteIndex % melody.length] * (singerIndex >= 3 ? 1.25 : singerIndex === 0 ? .75 : 1);
        oscillator.detune.value = detune;
        warmth.type = "bandpass";
        warmth.frequency.value = 720 + singerIndex * 115;
        warmth.Q.value = .65;
        singerGain.gain.value = .22;
        oscillator.connect(warmth).connect(singerGain).connect(master);
        oscillator.start(now + singerIndex * .008);
        oscillator.stop(now + .6);
      });
      window.setTimeout(() => void context.close(), 750);
    } catch {
      playTone(620 + noteIndex * 60);
    }
  };

  const speakBirthdayChorus = (person: string) => {
    if (!soundOn || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      const speakerNames = BIRTHDAY_GUESTS.filter((name) => name !== person).slice(0, 4);
      const wishes = [`${person}，祝你生日快乐！`, "生日快乐！", "祝你天天开心！", "大家一起唱起来！"];
      window.speechSynthesis.cancel();
      speakerNames.forEach((name, index) => {
        const profile = voiceProfileFor(name);
        const utterance = new SpeechSynthesisUtterance(wishes[index]);
        utterance.lang = profile.voice?.lang ?? "zh-CN";
        utterance.voice = profile.voice;
        utterance.rate = .94 + index * .012;
        utterance.pitch = profile.pitch;
        utterance.volume = .88;
        utterance.onstart = () => setSpeakingPerson(name);
        utterance.onend = () => setSpeakingPerson((current) => current === name ? null : current);
        window.speechSynthesis.speak(utterance);
      });
    } catch {
      // The layered Web Audio choir still plays when speech synthesis is unavailable.
    }
  };

  const toggleSound = () => {
    if (soundOn && typeof window !== "undefined" && "speechSynthesis" in window) {
      speechRunRef.current += 1;
      window.speechSynthesis.cancel();
      setSpeakingPerson(null);
    }
    setSoundOn((value) => !value);
  };

  useEffect(() => {
    if (!ready || !soundOn) return;
    const sceneNotes: Record<Scene, number[]> = {
      farm: [392, 523, 659], westFriendFarm: [440, 587, 698], mysteryRoad: [330, 440, 554], town: [523, 659, 784], cultureDistrict: [494, 622, 740], residentialDistrict: [349, 440, 523], eastNeighbor: [415, 523, 622], southNeighbor: [294, 392, 494], northNeighbor: [370, 494, 587],
    };
    const notes = game.weather === "thunder" ? [196, 147, 220] : game.weather === "rain" ? [330, 392, 330] : sceneNotes[scene];
    const timers = notes.map((note, index) => window.setTimeout(() => playTone(note), 90 + index * 150));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [game.weather, ready, scene, soundOn]);

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
    const surpriseRoll = Math.random();
    if (surpriseRoll < .01) {
      setGame((current) => ({ ...current, diamonds: current.diamonds + 1 }));
      setMessage("意外变成了大好事：鱼钩从池底带上来一颗闪亮钻石！已经放进资源记录。 ");
      setFishingPhase("idle"); setFishingScore(0); setIsFishing(false); playTone(1040);
      return;
    }
    if (surpriseRoll < .11) {
      setGame((current) => ({ ...current, stone: current.stone + 1 }));
      setMessage("鱼竿沉甸甸的，费了好大力气却钓上来一块石头！石材 +1，已经放进资源记录。 ");
      setFishingPhase("idle"); setFishingScore(0); setIsFishing(false); playTone(340);
      return;
    }
    if (surpriseRoll < .17) {
      setGame((current) => ({ ...current, drinks: current.drinks + 1 }));
      setMessage("钓上来一瓶被水冲来的山谷饮料！瓶子还没有打开，已经收进资源记录。 ");
      setFishingPhase("idle"); setFishingScore(0); setIsFishing(false); playTone(720);
      return;
    }
    if (surpriseRoll < .23) {
      setGame((current) => ({ ...current, oldSocks: current.oldSocks + 1 }));
      setMessage("这次不是鱼——竟然是一只湿漉漉的旧袜子！先收进奇怪物品记录。 ");
      setFishingPhase("idle"); setFishingScore(0); setIsFishing(false); playTone(230);
      return;
    }
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
    const fishingMarker = fishingMarkerValueRef.current;
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
    setGame((current) => ({ ...current, bait: baitUsed ? current.bait - 1 : current.bait, energy: current.energy - staminaCost(current, 5) }));
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
      energy: current.energy - staminaCost(current, 4),
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
        energy: Math.max(0, current.energy - staminaCost(current, 1)),
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
      energy: current.energy - staminaCost(current, 4),
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
      energy: current.energy - staminaCost(current, 4),
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
    setMessage(`制作完成：${recipe.name}！已经放进下方背包。${item === "matches" ? "进入山洞或帐篷后可以点燃。" : item === "blanket" ? "点击背包里的羊毛毯就能盖着休息。" : INDOOR_FURNITURE.includes(item) ? "进入农舍二楼后，从屋里的家具栏选择绿色方格摆放。" : "选中后再点击农场位置摆放。"}`);
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

  const eatAnimalProduct = (product: "egg" | "milk") => {
    const field = product === "egg" ? "eggs" : "milk";
    const name = product === "egg" ? "鸡蛋" : "牛奶";
    const energy = product === "egg" ? 12 : 20;
    if (game[field] <= 0) {
      setMessage(`现在没有${name}可以吃。`);
      return;
    }
    if (game.energy >= 100) {
      setMessage(`体力已经满了，先把${name}留在资源记录里。`);
      return;
    }
    setGame((current) => ({
      ...current,
      energy: Math.min(100, current.energy + energy),
      [field]: Math.max(0, current[field] - 1),
    }));
    setMessage(`吃了${name}，恢复 ${energy} 点体力。`);
    playTone(product === "egg" ? 650 : 720);
  };

  const clickAnimalProduct = (product: "egg" | "milk") => {
    if (animalProductClickTimerRef.current) window.clearTimeout(animalProductClickTimerRef.current);
    animalProductClickTimerRef.current = window.setTimeout(() => {
      eatAnimalProduct(product);
      animalProductClickTimerRef.current = null;
    }, 230);
  };

  const doubleClickAnimalProduct = (product: "egg" | "milk") => {
    if (animalProductClickTimerRef.current) {
      window.clearTimeout(animalProductClickTimerRef.current);
      animalProductClickTimerRef.current = null;
    }
    pickUpAnimalProduct(product);
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

  const mineCaveDiamond = (diamondIndex: number) => {
    const diamond = CAVE_DIAMOND_SPOTS[game.caveDiamondSpots[diamondIndex] ?? diamondIndex];
    if (!diamond || !game.caveDiamondStates[diamondIndex]) return;
    if (!interiorFireLit) {
      setMessage("山洞太暗了，先用火柴点亮火把，才能看清钻石矿。 ");
      playTone(210);
      return;
    }
    if (selected !== "pickaxe") {
      setMessage("这是坚硬的钻石矿，斧头挖不动。请先拿出镐子。 ");
      playTone(220);
      return;
    }
    const closeEnough = Math.abs(indoorPlayer.x - diamond.x) <= 19 && Math.abs(indoorPlayer.y - diamond.y) <= 13;
    if (!closeEnough) {
      setIndoorPlayer({ x: Math.max(20, Math.min(80, diamond.x - 10)), y: diamond.y });
      setMessage("小禾走到了钻石矿旁边，再点一次矿石就能挥动镐子。 ");
      showWalking(diamond.x - indoorPlayer.x, diamond.y - indoorPlayer.y);
      return;
    }
    const diamondAmount = game.toolUpgrades.pickaxe ? 3 : 1;
    setGame((current) => ({
      ...current,
      diamonds: current.diamonds + diamondAmount,
      energy: Math.max(0, current.energy - staminaCost(current, 4)),
      caveDiamondStates: current.caveDiamondStates.map((standing, index) => index === diamondIndex ? false : standing),
    }));
    setMessage(game.toolUpgrades.pickaxe ? "金铁镐子敲开整片矿脉，一次挖到 3 颗闪亮的钻石！钻石已经放进资源记录。 " : "镐子敲开岩层，挖到 1 颗闪亮的钻石！钻石已经放进资源记录。 ");
    playTone(980);
  };

  const pickUpGroundSupply = (supplyId: number) => {
    const supply = GROUND_SUPPLIES[supplyId];
    if (!supply || !game.groundSupplies[supplyId]) return;
    setGame((current) => {
      const pickupAmount = "amount" in supply ? supply.amount * (current.ageSkillsLearned.includes("trail") ? 2 : 1) : 0;
      const next = { ...current, groundSupplies: current.groundSupplies.map((visible, index) => index === supplyId ? false : visible) };
      if (supply.kind === "seed") return { ...next, [supply.field]: current[supply.field] + pickupAmount };
      if (supply.kind === "food") return { ...next, energy: Math.min(100, current.energy + pickupAmount) };
      if (supply.kind === "herb") return { ...next, herbs: current.herbs + pickupAmount };
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
    const doubled = game.ageSkillsLearned.includes("trail") && supply.kind !== "tool";
    setMessage(alreadyOwned ? `捡起了${supply.name}，工具已经升级过，于是换成了 20 枚金币。` : temporaryTool ? `捡起了${supply.name}！从今天起可使用 7 天，再次捡到可以重新续满 7 天。` : doubled ? `灵巧采集生效：捡起${supply.name}时把散落的另一份也找到了，获得双份！` : `捡起了${supply.name}！${supply.description}`);
    playTone(supply.kind === "tool" ? 920 : supply.kind === "food" ? 760 : supply.kind === "herb" ? 820 : 660);
  };

  const carriedItemName = heldItem ? heldItem.kind === "material" ? (heldItem.id === "wood" ? "木头" : "石材") : heldItem.kind === "forest" ? forestItemName(heldItem.id) : heldItem.kind === "resource" ? RESOURCE_INFO[heldItem.id].name : heldItem.kind === "seed" ? `${CROP_INFO[heldItem.id].name}种子包` : heldItem.kind === "herb" ? "药材" : heldItem.kind === "resin" ? "树脂" : heldItem.kind === "matches" ? "火柴" : heldItem.kind === "product" ? (heldItem.id === "egg" ? "鸡蛋" : heldItem.id === "milk" ? "牛奶" : "羊毛") : heldItem.kind === "petGift" ? (heldItem.id === "feather" ? "宠物羽毛" : heldItem.id === "softFur" ? "兔子软毛" : "探险小骨头") : heldItem.kind === "book" ? LOST_BOOKS[heldItem.id].title : RARE_ARTIFACTS[heldItem.id].title : "";
  const carriedItemClass = heldItem ? heldItem.kind === "material" ? heldItem.id : heldItem.kind === "forest" ? heldItem.id : heldItem.kind === "resource" ? heldItem.id : heldItem.kind === "seed" ? `${heldItem.id}-seeds` : heldItem.kind === "herb" ? "herb" : heldItem.kind === "resin" ? "resin" : heldItem.kind === "matches" ? "matches" : heldItem.kind === "product" ? heldItem.id : heldItem.kind === "petGift" ? heldItem.id : heldItem.kind === "book" ? "book" : "artifact" : "";
  const renderCarriedItem = () => heldItem ? <span className={`held-overhead held-${carriedItemClass}`} title={carriedItemName} aria-label={`举着${carriedItemName}`}><i className="held-pixel-object" aria-hidden="true" /><span className="held-item-name">{carriedItemName}</span></span> : null;
  const renderIndoorRoofRain = () => (game.weather === "rain" || game.weather === "thunder") ? <div className="indoor-roof-rain" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={`roof-rain-${index}`} />)}</div> : null;
  const renderWearables = () => <>{game.equippedOutfit !== "default" && <span className={`worn-outfit worn-${game.equippedOutfit}`} aria-label={game.equippedOutfit === "redCoat" ? "穿着红色节日外套" : game.equippedOutfit === "blueOutfit" ? "穿着蓝色旅行套装" : "穿着星月睡衣"} />}{game.umbrellaOpen && <span className="player-umbrella" aria-label="撑着彩色雨伞"><i /></span>}</>;

  const withFriendship = (state: GameState, person: string, points: number, journal?: string): GameState => ({
    ...state,
    friendship: { ...state.friendship, [person]: Math.min(100, (state.friendship[person] ?? 0) + points) },
    journalEntries: journal ? [journal, ...state.journalEntries.filter((entry) => entry !== journal)].slice(0, 40) : state.journalEntries,
  });

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
        const friendly = withFriendship(healed, person, 15, `${SEASONS[current.season]}第${current.day}天：小禾用药材帮助${person}恢复健康，好感大幅提升。`);
        if (healingGift.kind === "seed" || healingGift.kind === "material") return { ...friendly, [healingGift.field]: friendly[healingGift.field] + healingGift.amount };
        if (healingGift.kind === "energy") return { ...friendly, energy: Math.min(100, friendly.energy + healingGift.amount) };
        return { ...friendly, coins: friendly.coins + healingGift.amount };
      });
      setHeldItem(null);
      setMessage(`${person}用了小禾送来的药材，很快恢复了健康，伤心的表情也变回了笑脸，还回送了${healingGift.name}！`);
      playTone(920);
      return true;
    }
    if (heldItem.kind === "material" && person === "鲁师傅") {
      const amount = game[heldItem.id];
      setGame((current) => withFriendship({
        ...current,
        [heldItem.id]: 0,
        builderSupplies: { ...current.builderSupplies, [heldItem.id]: current.builderSupplies[heldItem.id] + amount },
      }, person, 8, `${SEASONS[current.season]}第${current.day}天：小禾把扩建材料交给了鲁师傅。`));
      setMessage(`鲁师傅收下了 ${amount} 块${carriedItemName}，放进了扩建材料堆。`);
      setHeldItem(null);
      setBuilderOpen(true);
      playTone(650);
      return true;
    }
    if (heldItem.kind === "book" && person === "叶老师") {
      const book = LOST_BOOKS[heldItem.id];
      setGame((current) => withFriendship({
        ...current,
        bookBag: current.bookBag.filter((bookId) => bookId !== heldItem.id),
        libraryBooks: current.libraryBooks.includes(heldItem.id) ? current.libraryBooks : [...current.libraryBooks, heldItem.id],
      }, person, 12, `${SEASONS[current.season]}第${current.day}天：找回的《${book.title.replace(/[《》]/g, "")}》进入了山谷图书馆。`));
      setMessage(`叶老师收下了${book.title}：“谢谢你找回来！我已经把它编入山谷图书馆，现在随时都能打开阅读。”`);
      setHeldItem(null);
      playTone(820);
      return true;
    }
    if (heldItem.kind === "artifact" && person === "沈馆长") {
      const artifact = RARE_ARTIFACTS[heldItem.id];
      setGame((current) => withFriendship({
        ...current,
        artifactBag: current.artifactBag.filter((artifactId) => artifactId !== heldItem.id),
        museumArtifacts: current.museumArtifacts.includes(heldItem.id) ? current.museumArtifacts : [...current.museumArtifacts, heldItem.id],
      }, person, 12, `${SEASONS[current.season]}第${current.day}天：${artifact.title}正式进入青禾博物馆收藏。`));
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
      if (heldItem.kind === "resource") {
        const qualityMove = isCropResource(heldItem.id) ? moveBestCropQuality(current.cropQualityStock, heldItem.id, 1) : null;
        next = { ...current, inventory: { ...current.inventory, [heldItem.id]: Math.max(0, current.inventory[heldItem.id] - 1) }, cropQualityStock: qualityMove?.next ?? current.cropQualityStock };
      }
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
      let gifted = next;
      if (returnGift?.kind === "seed" || returnGift?.kind === "material") gifted = { ...next, [returnGift.field]: next[returnGift.field] + returnGift.amount };
      else if (returnGift?.kind === "energy") gifted = { ...next, energy: Math.min(100, next.energy + returnGift.amount) };
      else if (returnGift?.kind === "coins") gifted = { ...next, coins: next.coins + returnGift.amount };
      return withFriendship(gifted, person, returnGift ? 10 : 8, `${SEASONS[current.season]}第${current.day}天：小禾送给${person}一份${carriedItemName}。`);
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

  const currentAbsoluteDay = () => (game.year - 1) * 112 + game.season * 28 + game.day;

  const petAgeDays = (pet: PetRecord) => Math.max(0, currentAbsoluteDay() - ((pet.bornYear - 1) * 112 + (pet.bornSeason ?? 0) * 28 + pet.bornDay));

  const isNurseryPet = (pet: PetRecord) => pet.id.includes("-baby-") && (petAgeDays(pet) < 28 || (game.babyCareStreaks[pet.id] ?? 0) < 4);

  const wishProgressNumbers = (state: GameState, person: string, progress: ResidentWishProgress) => {
    const definition = residentWishDefinition(person);
    const firstBaseline = definition.firstAbsolute ? 0 : progress.firstBaseline;
    const secondBaseline = definition.secondAbsolute ? 0 : progress.secondBaseline;
    return {
      first: Math.min(definition.firstNeed, Math.max(0, definition.firstMetric(state) - firstBaseline)),
      second: Math.min(definition.secondNeed, Math.max(0, definition.secondMetric(state) - secondBaseline)),
      days: Math.max(0, (state.year - 1) * 112 + state.season * 28 + state.day - progress.startedDay),
    };
  };

  const startResidentWish = (person: string) => {
    const existing = game.residentWishes[person];
    const definition = residentWishDefinition(person);
    if (existing?.completed) {
      setMessage(`${person}的愿望“${definition.title}”已经和你一起实现了。`);
      return;
    }
    if (existing) {
      setMessage(`${person}的愿望已经记在日记里了。它需要真实播种、浇水、收获或探索，还要经过至少两个游戏日。`);
      return;
    }
    setGame((current) => ({
      ...current,
      residentWishes: {
        ...current.residentWishes,
        [person]: {
          startedDay: (current.year - 1) * 112 + current.season * 28 + current.day,
          firstBaseline: definition.firstAbsolute ? 0 : definition.firstMetric(current),
          secondBaseline: definition.secondAbsolute ? 0 : definition.secondMetric(current),
          completed: false,
        },
      },
      journalEntries: [`${SEASONS[current.season]}第${current.day}天：认真听完了${person}的愿望“${definition.title}”，决定用几天时间慢慢帮忙。`, ...current.journalEntries].slice(0, 40),
    }));
    setMessage(`${person}把愿望告诉了你：“${definition.story}”已经记进日记，要亲自完成两段行动，并至少观察两个游戏日。`);
    speakResident(person, definition.story);
    playTone(780);
  };

  const finishResidentWish = (person: string) => {
    const progress = game.residentWishes[person];
    const definition = residentWishDefinition(person);
    if (!progress || progress.completed) {
      setMessage(progress?.completed ? `${person}的愿望“${definition.title}”已经完成了。` : `先和${person}认真聊聊，把愿望记进日记。`);
      return;
    }
    const numbers = wishProgressNumbers(game, person, progress);
    const unfinished = [
      numbers.first < definition.firstNeed ? `${definition.firstLabel}（${numbers.first}/${definition.firstNeed}）` : "",
      numbers.second < definition.secondNeed ? `${definition.secondLabel}（${numbers.second}/${definition.secondNeed}）` : "",
      numbers.days < 2 ? `共同观察还差 ${2 - numbers.days} 个游戏日` : "",
    ].filter(Boolean);
    if (unfinished.length) {
      const text = `现在还不能交付。还需要：${unfinished.join("；")}。`;
      setResidentSpeech({ person, text });
      setMessage(text);
      speakResident(person, text);
      return;
    }
    const missingMaterials = wishCostEntries(definition)
      .filter(([material, amount]) => game[material] < amount)
      .map(([material, amount]) => `${WISH_MATERIAL_INFO[material]}还差 ${amount - game[material]}`);
    if (missingMaterials.length) {
      const text = `调查已经完成了，不过制作“${definition.finalProduct}”还缺：${missingMaterials.join("、")}。准备齐再来找我。`;
      setResidentSpeech({ person, text });
      setMessage(text);
      speakResident(person, text);
      return;
    }
    setResidentWishWorkshop({ person, placed: [], assemblyProgress: 0, mistakes: 0 });
    setHeldWishMaterial(null);
    setHeldWishSeal(false);
    wishAssemblyDistanceRef.current = 0;
    wishAssemblyActiveRef.current = false;
    setResidentSpeech(null);
    setWorkMenuPerson(null);
    setMessage(`材料和调查都准备好了。现在要和${person}亲手制作“${definition.finalProduct}”：先逐包拖入材料，再沿工作台纹理来回加工。`);
    playTone(720);
  };

  const completeResidentWishWorkshop = () => {
    if (!residentWishWorkshop) return;
    const { person } = residentWishWorkshop;
    const definition = residentWishDefinition(person);
    if (!hasWishMaterials(game, definition)) {
      setResidentWishWorkshop(null);
      setHeldWishSeal(false);
      setMessage(`制作前材料发生了变化，已经安全退出，没有扣除任何东西。重新准备${wishCostText(definition)}后再找${person}。`);
      playTone(220);
      return;
    }
    setGame((current) => withFriendship({
      ...current,
      wood: current.wood - (definition.finalCost.wood ?? 0),
      stone: current.stone - (definition.finalCost.stone ?? 0),
      resin: current.resin - (definition.finalCost.resin ?? 0),
      herbs: current.herbs - (definition.finalCost.herbs ?? 0),
      pinecones: current.pinecones - (definition.finalCost.pinecones ?? 0),
      pineNuts: current.pineNuts - (definition.finalCost.pineNuts ?? 0),
      diamonds: current.diamonds - (definition.finalCost.diamonds ?? 0),
      coins: current.coins + 260,
      residentWishes: { ...current.residentWishes, [person]: { ...current.residentWishes[person], completed: true } },
      journalEntries: [`${SEASONS[current.season]}第${current.day}天：亲手把${wishCostText(definition)}逐包放上工作台，沿纹理加工并装上落款，和${person}完成了“${definition.finalProduct}”，获得 260 金币。`, ...current.journalEntries].slice(0, 40),
    }, person, 30));
    const text = `真的做好了！每份材料、加工痕迹和最后的落款都是我们一起完成的。谢谢你实现我的愿望。`;
    setResidentSpeech({ person, text });
    setResidentWishWorkshop(null);
    setHeldWishMaterial(null);
    setHeldWishSeal(false);
    setMessage(`“${definition.finalProduct}”制作完成！获得 260 金币，${person}好感 +30。`);
    speakResident(person, text);
    playTone(980);
  };

  const dropWishWorkshopMaterial = () => {
    if (wishWorkshopDropLockRef.current || !residentWishWorkshop || !heldWishMaterial) return;
    wishWorkshopDropLockRef.current = true;
    window.setTimeout(() => { wishWorkshopDropLockRef.current = false; }, 0);
    const definition = residentWishDefinition(residentWishWorkshop.person);
    const needed = wishCostEntries(definition).map(([material]) => material);
    if (!needed.includes(heldWishMaterial) || residentWishWorkshop.placed.includes(heldWishMaterial)) {
      setHeldWishMaterial(null);
      setMessage("这包材料已经放过，或不是这件成品需要的材料。它已经回到材料盘。 ");
      playTone(210);
      return;
    }
    const placed = [...residentWishWorkshop.placed, heldWishMaterial];
    setResidentWishWorkshop({ ...residentWishWorkshop, placed });
    setHeldWishMaterial(null);
    setMessage(placed.length === needed.length ? "材料全部按配方放好了。现在按住工作台，沿着发亮的横向木纹来回拖动，把接缝加工到 100%。" : `放入了一包材料（${placed.length}/${needed.length}）。继续把剩余材料拖到中央工作台。`);
    playTone(520 + placed.length * 55);
  };

  const startWishAssembly = (event: ReactPointerEvent<HTMLElement>) => {
    if (!residentWishWorkshop) return;
    const needed = wishCostEntries(residentWishDefinition(residentWishWorkshop.person)).length;
    if (residentWishWorkshop.placed.length < needed) {
      setMessage("材料还没放齐，先把左边剩余的材料包拖到中央工作台。 ");
      return;
    }
    wishAssemblyActiveRef.current = true;
    wishAssemblyLastPointRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveWishAssembly = (event: ReactPointerEvent<HTMLElement>) => {
    if (!wishAssemblyActiveRef.current || !residentWishWorkshop || residentWishWorkshop.assemblyProgress >= 100) return;
    const previous = wishAssemblyLastPointRef.current;
    wishAssemblyLastPointRef.current = { x: event.clientX, y: event.clientY };
    if (!previous) return;
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    const distance = Math.hypot(dx, dy);
    if (Math.abs(dx) < Math.abs(dy) * .7) return;
    wishAssemblyDistanceRef.current += distance;
    const nextProgress = Math.min(100, Math.round(wishAssemblyDistanceRef.current / 4));
    if (nextProgress === residentWishWorkshop.assemblyProgress) return;
    setResidentWishWorkshop({ ...residentWishWorkshop, assemblyProgress: nextProgress });
    if (nextProgress >= 100) {
      wishAssemblyActiveRef.current = false;
      setMessage("接缝已经沿纹理加工平整。最后按住右侧的落款牌，把它拖到成品正中的发光位置。 ");
      playTone(850);
    }
  };

  const stopWishAssembly = () => {
    wishAssemblyActiveRef.current = false;
    wishAssemblyLastPointRef.current = null;
  };

  const handleWishWorkshopPointerRelease = (event: ReactPointerEvent<HTMLElement>) => {
    if (!residentWishWorkshop) return;
    stopWishAssembly();
    const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    if (heldWishMaterial) {
      if (element?.closest("[data-wish-material-target]")) dropWishWorkshopMaterial();
      else {
        setResidentWishWorkshop({ ...residentWishWorkshop, mistakes: residentWishWorkshop.mistakes + 1 });
        setHeldWishMaterial(null);
        setMessage("材料没有放到工作台的发光区域，已经回到材料盘。 ");
        playTone(210);
      }
      return;
    }
    if (heldWishSeal) {
      if (element?.closest("[data-wish-seal-target]") && residentWishWorkshop.assemblyProgress >= 100) completeResidentWishWorkshop();
      else {
        setHeldWishSeal(false);
        setMessage("落款牌没有对准成品中央，已经回到右侧。再拖一次。 ");
        playTone(210);
      }
    }
  };

  const requestResidentWork = (person: string, job: ResidentWorkJob) => {
    const today = currentAbsoluteDay();
    if (game.residentWorkOrders.some((order) => order.person === person && order.absoluteDay === today)) {
      const text = `我今天已经帮过忙啦，明天还可以再来。`;
      setResidentSpeech({ person, text });
      setMessage(`${person}今天已经完成过一份工作。`);
      speakResident(person, text);
      setWorkMenuPerson(null);
      return;
    }

    let amount = 0;
    let result = "";
    let applyWork: ((state: GameState) => GameState) | null = null;

    if (job === "water") {
      const indexes = game.tiles.map((tile, index) => tile.state === "crop" && !tile.watered ? index : -1).filter((index) => index >= 0).slice(0, 10);
      if (!indexes.length) {
        setMessage("田里暂时没有缺水的作物，换一项工作吧。");
        return;
      }
      amount = indexes.length;
      result = `给 ${amount} 株作物浇了水`;
      applyWork = (state) => ({ ...state, tiles: state.tiles.map((tile, index) => indexes.includes(index) ? { ...tile, watered: true, care: (tile.care ?? 0) + 1 } : tile), wateredCount: state.wateredCount + amount, daily: { ...state.daily, watered: state.daily.watered + amount } });
    } else if (job === "plantFruit") {
      const seasonalFruits: CropType[][] = [["strawberry", "blueberry"], ["watermelon", "pineapple", "tomato"], ["pineapple", "pumpkin", "corn"], ["blueberry", "strawberry", "potato"]];
      const crop = seasonalFruits[game.season].find((candidate) => game[CROP_INFO[candidate].seedField] > 0);
      const soilIndexes = game.tiles.map((tile, index) => tile.state === "soil" ? index : -1).filter((index) => index >= 0);
      if (!crop || !soilIndexes.length) {
        setMessage(crop ? "田里没有松好且空着的土地，先用锄头整理几格吧。" : "背包里没有适合当前季节的水果种子，先去超市准备一些吧。");
        return;
      }
      const seedField = CROP_INFO[crop].seedField;
      const indexes = soilIndexes.slice(0, Math.min(4, game[seedField]));
      amount = indexes.length;
      result = `播下了 ${amount} 颗${CROP_INFO[crop].name}种子`;
      applyWork = (state) => {
        const next = {
          ...state,
          tiles: state.tiles.map((tile, index) => indexes.includes(index) ? { state: "crop" as TileState, stage: 0, watered: false, care: 0, cropType: crop } : tile),
          planted: state.planted + amount,
          daily: { ...state.daily, planted: state.daily.planted + amount },
          wishPlantingRecords: {
            ...state.wishPlantingRecords,
            [`weather:${state.weather}:${crop}`]: (state.wishPlantingRecords[`weather:${state.weather}:${crop}`] ?? 0) + amount,
            [`season:${state.season}:${crop}`]: (state.wishPlantingRecords[`season:${state.season}:${crop}`] ?? 0) + amount,
          },
        };
        next[seedField] = state[seedField] - amount;
        return next;
      };
    } else if (job === "fertilize") {
      const indexes = game.tiles.map((tile, index) => tile.state === "crop" ? index : -1).filter((index) => index >= 0).slice(0, 10);
      if (!indexes.length) {
        setMessage("田里暂时没有作物可以施肥，先播种再来拜托居民吧。");
        return;
      }
      amount = indexes.length;
      result = `给 ${amount} 株作物施了肥，品质更容易提高`;
      applyWork = (state) => ({ ...state, tiles: state.tiles.map((tile, index) => indexes.includes(index) ? { ...tile, care: (tile.care ?? 0) + 2 } : tile) });
    } else if (job === "mineDiamond") {
      const veinIndex = game.caveDiamondStates.findIndex(Boolean);
      if (veinIndex < 0) {
        setMessage("今天山洞里能看见的钻石矿已经挖完了，等新的矿脉出现再来吧。");
        return;
      }
      amount = 1;
      result = "在青禾山洞挖到 1 颗钻石和 2 块石材";
      applyWork = (state) => ({ ...state, diamonds: state.diamonds + 1, stone: state.stone + 2, caveDiamondStates: state.caveDiamondStates.map((standing, index) => index === veinIndex ? false : standing) });
    } else if (job === "chopWood") {
      const treeIndex = game.treeStates.findIndex(Boolean);
      if (treeIndex < 0) {
        setMessage("农场今天没有还能砍的树，等树重新生长后再来吧。");
        return;
      }
      amount = 6;
      result = "砍树收集了 6 块木头和 2 滴树脂";
      applyWork = (state) => ({ ...state, wood: state.wood + 6, resin: state.resin + 2, treeStates: state.treeStates.map((standing, index) => index === treeIndex ? false : standing) });
    } else {
      amount = 3;
      result = "从野外采回了 3 份药材";
      applyWork = (state) => ({ ...state, herbs: state.herbs + 3 });
    }

    if (!applyWork) return;
    setGame((current) => {
      const workedState = applyWork!(current);
      return withFriendship({
        ...workedState,
        residentWorkOrders: [...workedState.residentWorkOrders.filter((order) => order.absoluteDay >= today - 7), { person, job, absoluteDay: today, amount, result }].slice(-24),
        journalEntries: [`${SEASONS[workedState.season]}第${workedState.day}天：拜托${person}${residentWorkLabel(job)}，${result}。成果已经加入田地或资源记录。`, ...workedState.journalEntries].slice(0, 40),
      }, person, 2);
    });
    const place = RESIDENT_WORK_OPTIONS.find((option) => option.job === job)?.place ?? "农场";
    const text = `好呀，我这就去${place}。${result}，你过去就能看到我，成果也已经记进资源和田地了。`;
    setResidentSpeech({ person, text });
    setMessage(`${person}接受了工作：${result}。`);
    setWorkMenuPerson(null);
    speakResident(person, text);
    playTone(850);
  };

  const interactWithPerson = (person: string, fallback: string, preferFallback = false) => {
    setWorkMenuPerson(null);
    if (giveHeldItem(person)) return;
    const showSpeech = (text: string) => {
      const prefix = `${person}：`;
      setResidentSpeech({ person, text: text.startsWith(prefix) ? text.slice(prefix.length) : text });
      setMessage(text);
      speakResident(person, text);
    };
    const talkKey = `${game.year}-${game.season}-${game.day}`;
    if (game.lastTalkedDays[person] !== talkKey) {
      setGame((current) => withFriendship({ ...current, lastTalkedDays: { ...current.lastTalkedDays, [person]: talkKey } }, person, 2, `${SEASONS[current.season]}第${current.day}天：小禾和${person}聊了一会儿。`));
    }
    const activeWish = game.residentWishes[person];
    if (activeWish && !activeWish.completed) {
      const definition = residentWishDefinition(person);
      const wishNumbers = wishProgressNumbers(game, person, activeWish);
      if (wishNumbers.first >= definition.firstNeed && wishNumbers.second >= definition.secondNeed && wishNumbers.days >= 2) {
        const missingMaterials = wishCostEntries(definition)
          .filter(([material, amount]) => game[material] < amount)
          .map(([material, amount]) => `${WISH_MATERIAL_INFO[material]}还差 ${amount - game[material]}`);
        showSpeech(missingMaterials.length
          ? `${person}：前面的调查已经完成了！最后还缺${missingMaterials.join("、")}，带齐后再点“交付愿望材料”。`
          : `${person}：调查和材料都齐了！请点对话里的“交付愿望材料”，我们现在一起做${definition.finalProduct}。`);
        return;
      }
    }
    if (NPC_SICK_DAYS[person]?.includes(game.day) && game.npcHealedDays[person] !== game.day) {
      showSpeech(`${person}今天有些不舒服，露出了伤心的表情：“我休息一天，明天应该就会好起来。”`);
      playTone(300);
      return;
    }
    const birthday = RESIDENT_BIRTHDAYS.find((entry) => entry.name === person);
    if (birthday && birthday.season === game.season && birthday.day === game.day) {
      showSpeech(`${person}今天过生日，开心地说：“谢谢你记得我的生日！公告栏上也画了一颗小星星，今天见到大家真高兴。”`);
      playTone(920);
      return;
    }
    if (person === "安安" && !game.ananBeachTrips.includes(`${game.year}-${game.season}`)) {
      startAnanBeachTrip();
      return;
    }
    if (person === "安安" && Math.random() < .3) {
      setGame((current) => ({ ...current, cookies: current.cookies + 1 }));
      showSpeech("安安从小布包里拿出一块星星饼干送给小禾：“这是我烤的，分给你一块！”饼干已经放进背包。 ");
      playTone(880);
      return;
    }
    if (person === "安安" && Math.random() < .58) {
      setPlayingWithAnan(true);
      setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 5) }));
      showSpeech("安安笑着拉住小禾，两个人追着跑、拍拍手，又绕着桌子嬉戏了一会儿！开心玩耍恢复了 5 点体力。 ");
      playTone(820);
      window.setTimeout(() => setPlayingWithAnan(false), 1_600);
      return;
    }
    showSpeech(preferFallback ? fallback : PERSON_DIALOGUES[person] ?? fallback);
    playTone(520);
  };

  const talkWithCafeResident = (person: string, schedule: ResidentSchedule) => {
    const nameCode = [...person].reduce((total, letter) => total + (letter.codePointAt(0) ?? 0), 0);
    const trip = CAFE_TRAVEL_DESTINATIONS[person];
    const isBestFriend = (game.friendship[person] ?? 0) >= 100;
    const isTravelConversation = Boolean(trip) && (currentAbsoluteDay() + nameCode) % (isBestFriend ? 2 : 4) === 0;
    if (isTravelConversation && trip && !(NPC_SICK_DAYS[person]?.includes(game.day) && game.npcHealedDays[person] !== game.day)) {
      const travelText = `${person}：吃完${schedule.key === "breakfast" ? "早餐" : "午饭"}以后，我正好要开车去${HIDDEN_TRIPS[trip].name}。那里平时不能自己去，你愿意坐我的车一起去吗？`;
      interactWithPerson(person, travelText, true);
      setResidentInvitation({ person, trip, travelMode: "car" });
      return;
    }
    const topic = CAFE_DAILY_CHAT_TOPICS[(currentAbsoluteDay() + nameCode) % CAFE_DAILY_CHAT_TOPICS.length];
    interactWithPerson(person, `${person}：${topic}`, true);
  };

  const meetScheduledResident = (person: string, schedule: ResidentSchedule) => {
    const tripKey = `${game.year}-${game.season}-${game.day}-${person}-${schedule.invite ?? "none"}`;
    if (schedule.invite && (game.friendship[person] ?? 0) >= 20 && !game.residentTripDays.includes(tripKey)) {
      setResidentInvitation({ person, trip: schedule.invite, travelMode: "walk" });
      setMessage(`${person}：我正准备去一个地图上没有的地方。那里不能自己开车过去，如果你愿意，现在就跟紧我。`);
      playTone(780);
      return;
    }
    interactWithPerson(person, `${person}：${schedule.label}。今天在这里碰见你真巧。`);
  };

  const followResidentToHiddenPlace = () => {
    if (!residentInvitation) return;
    const tripKey = `${game.year}-${game.season}-${game.day}-${residentInvitation.person}-${residentInvitation.trip}`;
    setResidentOuting(residentInvitation);
    setOutingPlayer({ x: 47, y: 69 });
    setOutingActivitiesDone([]);
    setGame((current) => withFriendship({
      ...current,
      residentTripDays: current.residentTripDays.includes(tripKey) ? current.residentTripDays : [...current.residentTripDays, tripKey].slice(-80),
      journalEntries: [`${SEASONS[current.season]}第${current.day}天：${residentInvitation.travelMode === "car" ? `坐着${residentInvitation.person}的车` : `跟着${residentInvitation.person}走过地图上没有的小路`}，第一次看见了${HIDDEN_TRIPS[residentInvitation.trip].name}。`, ...current.journalEntries].slice(0, 40),
    }, residentInvitation.person, 6));
    setResidentInvitation(null);
    setMessage(residentInvitation.travelMode === "car" ? `小禾坐进${residentInvitation.person}的车，两个人沿着乡间道路开到了${HIDDEN_TRIPS[residentInvitation.trip].name}。` : `小禾没有打开地图，也没有开车，只是一直跟着${residentInvitation.person}穿过小路，来到了${HIDDEN_TRIPS[residentInvitation.trip].name}。`);
    playTone(900);
  };

  const stopTripMove = () => {
    if (tripMoveHoldTimerRef.current !== null) window.clearInterval(tripMoveHoldTimerRef.current);
    tripMoveHoldTimerRef.current = null;
  };

  const enjoyResidentOuting = () => {
    if (!residentOuting) return;
    if (outingActivitiesDone.length < HIDDEN_TRIP_ACTIVITIES[residentOuting.trip].length) {
      setMessage(`这次旅行还没有结束：已经体验 ${outingActivitiesDone.length}/3 项。先在场景里走到另外的玩法旁边，亲手把它们完成。`);
      playTone(360);
      return;
    }
    const trip = HIDDEN_TRIPS[residentOuting.trip];
    const person = residentOuting.person;
    const isBestFriend = (game.friendship[person] ?? 0) >= 100;
    setGame((current) => withFriendship({
      ...current,
      energy: Math.min(100, current.energy + (residentOuting.trip === "riverKitchen" ? 22 : residentOuting.trip === "forestPlayground" ? 20 : residentOuting.trip === "hillsideTea" ? 18 : 16)),
      coins: current.coins + (isBestFriend ? 120 : 0),
      journalEntries: [`${SEASONS[current.season]}第${current.day}天：和${person}把${HIDDEN_TRIPS[residentOuting.trip].name}的三项旅行体验全部完成。${isBestFriend ? "挚友还一起留下了专属旅行纪念。" : ""}`, ...current.journalEntries].slice(0, 40),
    }, person, 4));
    stopTripMove();
    setResidentOuting(null);
    setTripHandsOn(null);
    setOutingActivitiesDone([]);
    setMessage(`${person}和小禾完成了三项旅行玩法，再${trip.action}。${trip.reward}${isBestFriend ? "；挚友合作还获得了 120 金币的旅行纪念奖励" : ""}。`);
    playTone(860);
  };

  const playOutingActivity = (index: number) => {
    if (!residentOuting) return;
    const activity = HIDDEN_TRIP_ACTIVITIES[residentOuting.trip][index];
    if (!activity) return;
    if (outingActivitiesDone.includes(index)) {
      setMessage(`${activity.name}已经和${residentOuting.person}一起体验过了，再去找场景里的另一项玩法吧。`);
      return;
    }
    const distance = Math.hypot(outingPlayer.x - activity.x, outingPlayer.y - activity.y);
    if (distance > 13) {
      setOutingPlayer({ x: activity.x > 50 ? activity.x - 7 : activity.x + 7, y: Math.min(74, activity.y + 8) });
      setMessage(`小禾走到了“${activity.name}”旁边。再点一次会进入专门的实际操作场景，不会直接算完成。`);
      playTone(520);
      return;
    }
    const details = TRIP_HANDS_ON_DETAILS[residentOuting.trip][index];
    setTripHandsOn({ index, mode: details.mode, progress: 0, mistakes: 0, heldPart: null, x: 10, y: 75, facing: "right" });
    tripGestureDistanceRef.current = 0;
    tripGestureActiveRef.current = false;
    setMessage(`开始“${activity.name}”：${details.instruction}`);
    playTone(650);
  };

  const finishTripHandsOnActivity = (index: number) => {
    stopTripMove();
    if (!residentOuting || outingActivitiesDone.includes(index)) {
      setTripHandsOn(null);
      return;
    }
    const activity = HIDDEN_TRIP_ACTIVITIES[residentOuting.trip][index];
    const nextDone = [...outingActivitiesDone, index];
    setOutingActivitiesDone(nextDone);
    setTripHandsOn(null);
    setGame((current) => ({ ...current, energy: Math.min(100, current.energy + ((current.friendship[residentOuting.person] ?? 0) >= 100 ? 5 : 3)) }));
    setMessage(`亲手完成“${activity.name}”：${activity.detail}。旅行进度 ${nextDone.length}/3${nextDone.length === 3 ? "，三项都完成，可以和朋友一起收尾了！" : "。"}`);
    playTone(nextDone.length === 3 ? 920 : 760);
  };

  const moveTripHandsOn = (direction: "up" | "down" | "left" | "right") => {
    if (!residentOuting) return;
    const tripId = residentOuting.trip;
    const vector = direction === "left" ? { x: -1.6, y: 0 } : direction === "right" ? { x: 1.6, y: 0 } : direction === "up" ? { x: 0, y: -1.6 } : { x: 0, y: 1.6 };
    setTripHandsOn((current) => {
      if (!current || current.mode !== "move") return current;
      const x = Math.max(5, Math.min(95, current.x + vector.x));
      const y = Math.max(18, Math.min(82, current.y + vector.y));
      const checkpoints = TRIP_MOVE_CHECKPOINTS[tripId];
      const checkpoint = checkpoints[current.progress];
      if (!checkpoint || Math.hypot(x - checkpoint.x, y - checkpoint.y) > 6.5) return { ...current, x, y, facing: direction };
      const next = current.progress + 1;
      playTone(480 + next * 45);
      if (next >= checkpoints.length) {
        if (tripMoveHoldTimerRef.current !== null) window.clearInterval(tripMoveHoldTimerRef.current);
        tripMoveHoldTimerRef.current = null;
        window.setTimeout(() => finishTripHandsOnActivity(current.index), 80);
        return { ...current, x, y, facing: direction, progress: next };
      }
      setMessage(`小禾真正走到了第 ${next} 个地点，场景里的东西已经收集或经过。继续移动到下一处发亮目标。`);
      return { ...current, x, y, facing: direction, progress: next };
    });
  };

  const startTripMove = (direction: "up" | "down" | "left" | "right") => {
    stopTripMove();
    moveTripHandsOn(direction);
    tripMoveHoldTimerRef.current = window.setInterval(() => moveTripHandsOn(direction), 55);
  };

  const dropTripHandsOnPart = () => {
    if (tripDropLockRef.current || !tripHandsOn || !residentOuting || tripHandsOn.mode !== "drag" || !tripHandsOn.heldPart) return;
    tripDropLockRef.current = true;
    window.setTimeout(() => { tripDropLockRef.current = false; }, 0);
    const details = TRIP_HANDS_ON_DETAILS[residentOuting.trip][tripHandsOn.index];
    const parts = details.parts ?? [];
    const expected = parts[tripHandsOn.progress];
    if (tripHandsOn.heldPart !== expected) {
      setTripHandsOn({ ...tripHandsOn, heldPart: null, mistakes: tripHandsOn.mistakes + 1 });
      setMessage(`这一步需要“${expected}”，刚才的“${tripHandsOn.heldPart}”顺序不对，已经放回托盘。`);
      playTone(210);
      return;
    }
    const next = tripHandsOn.progress + 1;
    if (next >= parts.length) {
      finishTripHandsOnActivity(tripHandsOn.index);
      return;
    }
    setTripHandsOn({ ...tripHandsOn, progress: next, heldPart: null });
    setMessage(`“${expected}”已经装好（${next}/${parts.length}）。下一步需要“${parts[next]}”。`);
    playTone(590 + next * 70);
  };

  const startTripGesture = (event: ReactPointerEvent<HTMLElement>) => {
    if (!tripHandsOn || tripHandsOn.mode !== "gesture") return;
    tripGestureActiveRef.current = true;
    tripGestureLastPointRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveTripGesture = (event: ReactPointerEvent<HTMLElement>) => {
    if (!tripGestureActiveRef.current || !tripHandsOn || !residentOuting || tripHandsOn.mode !== "gesture") return;
    const previous = tripGestureLastPointRef.current;
    tripGestureLastPointRef.current = { x: event.clientX, y: event.clientY };
    if (!previous) return;
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    const details = TRIP_HANDS_ON_DETAILS[residentOuting.trip][tripHandsOn.index];
    const valid = details.gesture === "free" || (details.gesture === "horizontal" ? Math.abs(dx) >= Math.abs(dy) * 1.3 : Math.abs(dy) >= Math.abs(dx) * 1.3);
    if (!valid) return;
    tripGestureDistanceRef.current += Math.hypot(dx, dy);
    const next = Math.min(100, Math.round(tripGestureDistanceRef.current / 4.5));
    if (next === tripHandsOn.progress) return;
    if (next >= 100) {
      tripGestureActiveRef.current = false;
      finishTripHandsOnActivity(tripHandsOn.index);
      return;
    }
    setTripHandsOn({ ...tripHandsOn, progress: next });
  };

  const stopTripGesture = () => {
    tripGestureActiveRef.current = false;
    tripGestureLastPointRef.current = null;
  };

  const handleTripHandsOnPointerRelease = (event: ReactPointerEvent<HTMLElement>) => {
    stopTripMove();
    stopTripGesture();
    if (!tripHandsOn || tripHandsOn.mode !== "drag" || !tripHandsOn.heldPart) return;
    const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    if (element?.closest("[data-trip-part-target]")) dropTripHandsOnPart();
    else {
      setTripHandsOn({ ...tripHandsOn, heldPart: null, mistakes: tripHandsOn.mistakes + 1 });
      setMessage("零件没有放进发光目标，已经回到托盘。 ");
      playTone(210);
    }
  };

  const progressForestStoryWithAnan = () => {
    const absoluteDay = currentAbsoluteDay();
    if (game.forestQuestStage === 5) {
      const daysLeft = Math.max(0, game.forestQuestNextAbsoluteDay - absoluteDay);
      if (daysLeft > 0) {
        setMessage(`安安正在继续观察森林。再过 ${daysLeft} 个游戏日，她才会带来下一条真正的新线索。`);
        playTone(360);
        return;
      }
      const nextEpisode = (game.forestQuestEpisode + 1) % FOREST_STORY_TITLES.length;
      setGame((current) => ({
        ...current,
        forestQuestEpisode: nextEpisode,
        forestQuestStage: 0,
        forestQuestProgressDay: absoluteDay,
        journalEntries: [`安安送来一张只画着几个小记号的新纸条。新的森林故事“${FOREST_STORY_TITLES[nextEpisode]}”已经出现，但要亲自去观察才能知道发生了什么。`, ...current.journalEntries].slice(0, 40),
      }));
      setMessage(`安安跑来敲门：森林里好像又有一点不对劲。她没有直接说答案，只邀请小禾去看看“${FOREST_STORY_TITLES[nextEpisode]}”。`);
      playTone(840);
      return;
    }
    if (game.forestQuestEpisode === 1) {
      if (game.forestQuestStage === 0) {
        setGame((current) => withFriendship({ ...current, forestQuestStage: 1, forestQuestProgressDay: absoluteDay, journalEntries: ["夜里有一小团萤火在安安的田边绕圈，却怎么也找不到能落下的地方。安安把几颗暗淡的小种子放进玻璃瓶继续观察。", ...current.journalEntries].slice(0, 40) }, "安安", 3));
        setMessage("安安没有给出清单，只说萤火种闻到松子的香气时会发亮，药草的叶子也许能让光停得更久。可以慢慢试着带一些过去。 ");
        playTone(720);
        return;
      }
      if (game.forestQuestStage === 1) {
        if (game.pineNuts < 3 || game.herbs < 1) {
          setMessage(`玻璃瓶里的萤火种只亮了一下又暗了。背包里现在有松子 ${game.pineNuts}、药材 ${game.herbs}；安安说气味可能还不够。`);
          playTone(280);
          return;
        }
        setGame((current) => ({ ...current, pineNuts: current.pineNuts - 3, herbs: current.herbs - 1, forestQuestStage: 2, forestQuestProgressDay: absoluteDay, journalEntries: ["三颗松子和一片药草放在玻璃瓶旁，暗淡的种子开始一呼一吸地发光。现在只能等它自己选择落下的地方。", ...current.journalEntries].slice(0, 40) }));
        setMessage("萤火种开始发出很弱的绿光。安安把灯全关掉，让它安静待一夜，明天再观察。 ");
        playTone(820);
        return;
      }
      if (absoluteDay <= game.forestQuestProgressDay) {
        setMessage("玻璃瓶里的光还在轻轻移动，现在碰它可能会吓跑。睡到明天再来看。 ");
        return;
      }
      setGame((current) => withFriendship({ ...current, forestQuestStage: 5, forestQuestNextAbsoluteDay: absoluteDay + 5, coins: current.coins + 220, cornSeeds: current.cornSeeds + 4, journalEntries: ["萤火种自己飞到林间湿润的苔藓上，长成了一圈会发微光的小芽。第二段森林故事完成，安安会继续留意新的变化。", ...current.journalEntries].slice(0, 40) }, "安安", 12));
      setMessage("清晨，萤火种终于落进苔藓，长出一圈微光小芽！获得 220 金币和 4 颗玉米种子。下一段故事不会马上出现。 ");
      playTone(940);
      return;
    }
    if (game.forestQuestEpisode === 2) {
      if (game.forestQuestStage === 0) {
        setGame((current) => ({ ...current, forestQuestStage: 1, forestQuestProgressDay: absoluteDay, journalEntries: ["雨停以后，森林边缘传来细小的鸟叫。安安在草丛里发现了一块湿透的木板和几根散落的羽毛。", ...current.journalEntries].slice(0, 40) }));
        setMessage("安安把湿木板翻过来，发现它原来是小鸟屋的一面。要重新做得结实，也许需要足够的木头和能防水的树脂。 ");
        return;
      }
      if (game.forestQuestStage === 1) {
        if (game.wood < 12 || game.resin < 2) {
          setMessage(`鸟屋还缺结实材料。现在有木头 ${game.wood}/12、树脂 ${game.resin}/2；砍树时可以慢慢收集。`);
          return;
        }
        setGame((current) => ({ ...current, wood: current.wood - 12, resin: current.resin - 2, forestQuestStage: 2, forestQuestProgressDay: absoluteDay, journalEntries: ["鲁师傅教安安顺着木纹钉好鸟屋，又用树脂封住缝隙。鸟屋挂回树上以后，需要等待小鸟自己判断是否安全。", ...current.journalEntries].slice(0, 40) }));
        setMessage("鸟屋已经挂回树上，但不能把鸟强行放进去。安安决定离远一点，等到明天再看。 ");
        playTone(780);
        return;
      }
      if (absoluteDay <= game.forestQuestProgressDay) { setMessage("树梢很安静。现在靠太近，小鸟反而不会回来，明天再看。 "); return; }
      setGame((current) => withFriendship({ ...current, forestQuestStage: 5, forestQuestNextAbsoluteDay: absoluteDay + 6, coins: current.coins + 260, pinecones: current.pinecones + 2, journalEntries: ["两只小鸟在新鸟屋门口探头，最后一起钻了进去。第三段森林故事完成，新的线索还要等森林慢慢发生变化。", ...current.journalEntries].slice(0, 40) }, "安安", 12));
      setMessage("两只小鸟终于住进了修好的鸟屋！获得 260 金币和 2 颗松果。 ");
      playTone(940);
      return;
    }
    if (game.forestQuestEpisode === 3) {
      if (game.forestQuestStage === 0) {
        setGame((current) => ({ ...current, forestQuestStage: 1, forestQuestProgressDay: absoluteDay, journalEntries: ["安安发现森林深处的小溪只剩下湿湿的石痕。水没有凭空消失，而像是被什么东西堵在更深的泥土下面。", ...current.journalEntries].slice(0, 40) }));
        setMessage("小溪底下传来很轻的水声。安安觉得普通石头可以固定河岸，亮晶晶的矿石也许能照出堵塞的位置。 ");
        return;
      }
      if (game.forestQuestStage === 1) {
        if (game.stone < 8 || game.diamonds < 1 || game.herbs < 2) {
          setMessage(`小溪实验还缺材料。现在有石材 ${game.stone}/8、钻石 ${game.diamonds}/1、药材 ${game.herbs}/2。安安没有催促，可以慢慢找。`);
          return;
        }
        setGame((current) => ({ ...current, stone: current.stone - 8, diamonds: current.diamonds - 1, herbs: current.herbs - 2, forestQuestStage: 2, forestQuestProgressDay: absoluteDay, journalEntries: ["钻石在湿石缝里映出一条很细的蓝线。大家沿着蓝线清开泥土，再用石材固定河岸，药草被铺在新土上防止冲刷。", ...current.journalEntries].slice(0, 40) }));
        setMessage("蓝线已经出现，泥土也清开了，但地下的水需要一夜才能慢慢渗回来。 ");
        playTone(860);
        return;
      }
      if (absoluteDay <= game.forestQuestProgressDay) { setMessage("石缝正在一点点变湿，水还没有真正流动。明天再来观察。 "); return; }
      setGame((current) => withFriendship({ ...current, forestQuestStage: 5, forestQuestNextAbsoluteDay: absoluteDay + 7, coins: current.coins + 420, watermelonSeeds: current.watermelonSeeds + 5, journalEntries: ["森林小溪重新流动，水没有突然喷出来，而是先浸湿石缝、汇成水珠，最后才连成一条细流。第四段森林故事完成。", ...current.journalEntries].slice(0, 40) }, "安安", 15));
      setMessage("等了一夜，水珠终于连成小溪！获得 420 金币和 5 颗西瓜种子。以后森林故事会从新的变化重新开始。 ");
      playTone(980);
      return;
    }
    if (game.forestQuestStage === 0) {
      setGame((current) => withFriendship({
        ...current,
        forestQuestStage: 1,
        forestQuestProgressDay: absoluteDay,
        journalEntries: ["安安发现彩虹森林的老松树正在失去颜色，请小禾先带回两份新鲜药材。", ...current.journalEntries].slice(0, 40),
      }, "安安", 4));
      setMessage("安安：彩虹森林的老松树正在褪色。我们先找 2 份药材做树木药水吧！这是一个会持续好几天的故事任务。 ");
      playTone(760);
      return;
    }
    if (game.forestQuestStage === 1) {
      if (game.herbs < 2) {
        setMessage(`安安：药水需要 2 份药材，现在只有 ${game.herbs} 份。农场和小镇地面偶尔会长出艾草和金银花。`);
        playTone(260);
        return;
      }
      setGame((current) => ({
        ...current,
        herbs: current.herbs - 2,
        forestQuestStage: 2,
        forestQuestProgressDay: absoluteDay,
        journalEntries: ["药材已经交给安安。等到明天，再去青禾山洞寻找让树木重新发光的蓝晶水。", ...current.journalEntries].slice(0, 40),
      }));
      setMessage("安安把药材煮成绿色药水：明天我们去青禾山洞，找一滴蓝晶水。今晚先让药水慢慢沉淀。 ");
      playTone(820);
      return;
    }
    if (game.forestQuestStage === 2) {
      setMessage(absoluteDay <= game.forestQuestProgressDay ? "药水还在沉淀，睡到明天再带着火柴和镐子进山洞。" : "药水准备好了！去青禾农场的山洞深处，寻找发蓝光的晶石水滴。 ");
      return;
    }
    if (game.forestQuestStage === 3) {
      if (game.resin < 1 || game.pinecones < 1) {
        setMessage(`安安：修补树皮还需要 1 滴树脂和 1 颗松果。现在有树脂 ${game.resin}、松果 ${game.pinecones}。砍树会掉落它们。`);
        playTone(260);
        return;
      }
      setGame((current) => ({
        ...current,
        resin: current.resin - 1,
        pinecones: current.pinecones - 1,
        forestQuestStage: 4,
        forestQuestProgressDay: absoluteDay,
        journalEntries: ["药材、蓝晶水、树脂和松果已经调成森林药膏。等到明天，和安安一起把它涂到老松树上。", ...current.journalEntries].slice(0, 40),
      }));
      setMessage("安安把蓝晶水、树脂和松果搅成森林药膏。等到明天药膏凝固，就能治疗老松树了。 ");
      playTone(860);
      return;
    }
    if (game.forestQuestStage === 4) {
      if (absoluteDay <= game.forestQuestProgressDay) {
        setMessage("森林药膏还软软的，睡到明天再来治疗老松树。 ");
        return;
      }
      setGame((current) => withFriendship({
        ...current,
        forestQuestStage: 5,
        forestQuestProgressDay: absoluteDay,
        forestQuestNextAbsoluteDay: absoluteDay + 5,
        coins: current.coins + 300,
        strawberrySeeds: current.strawberrySeeds + 5,
        journalEntries: ["彩虹森林的老松树恢复了颜色，还长出一圈金色新芽。安安和小禾完成了第一次森林故事。", ...current.journalEntries].slice(0, 40),
      }, "安安", 20));
      setMessage("小禾和安安把药膏涂到树干上，老松树一层层恢复绿色，还长出金色新芽！获得 300 金币、5 颗草莓种子，安安好感大幅提升。 ");
      playTone(980);
      return;
    }
    setMessage("老松树已经恢复健康。安安：以后森林里出现新的故事，我们还要一起出发！ ");
    playTone(720);
  };

  const inspectForestCaveClue = () => {
    const absoluteDay = currentAbsoluteDay();
    if (game.forestQuestEpisode !== 0 || game.forestQuestStage !== 2) {
      setMessage("这滴蓝晶水不属于现在这段森林故事，所以不能收进药瓶；山洞里不该显示这条旧线索。刷新新版后它会消失。 ");
      playTone(230);
      return;
    }
    if (absoluteDay <= game.forestQuestProgressDay) {
      setMessage("安安做的药水还没有沉淀好，要睡到明天，蓝晶水才会显出光。 ");
      playTone(260);
      return;
    }
    if (!interiorFireLit) {
      setMessage("山洞太暗了。先用火柴点亮火把，才能看见蓝晶水。 ");
      playTone(220);
      return;
    }
    if (collectingForestCrystal) return;
    setCollectingForestCrystal(true);
    setMessage("小禾把空药瓶放到蓝晶下面，蓝色水滴正在沿着瓶口缓缓流进去……");
    playTone(720);
    window.setTimeout(() => {
      setGame((current) => ({
        ...current,
        forestQuestStage: 3,
        forestQuestProgressDay: absoluteDay,
        journalEntries: ["在山洞石缝里找到了蓝晶水。下一步回安安的小农场，再准备一滴树脂和一颗松果。", ...current.journalEntries].slice(0, 40),
      }));
      setCollectingForestCrystal(false);
      setMessage("蓝色水滴已经装满药瓶，蓝晶水收好了！回去找安安，还要准备 1 滴树脂和 1 颗松果。 ");
      playTone(960);
    }, 1100);
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

  const commissionBuilder = (item: "house" | "land" | "field" | "storage" | "greenhouse" | "pond" | "stoneWall" | "secondFloor" | "upstairsKitchen" | "upstairsBathroom") => {
    const houseLevel = game.upgrades.house;
    const recipes = {
      house: { name: "扩大农舍", wood: 20 + houseLevel * 10, stone: 12 + houseLevel * 8 },
      land: { name: "扩大地盘", wood: 12, stone: 18 },
      field: { name: "扩大土地", wood: 10, stone: 10 },
      storage: { name: "扩建售卖仓库", wood: 18, stone: 12 },
      greenhouse: { name: "修建玻璃温室", wood: 28, stone: 22 },
      pond: { name: "扩大钓鱼池", wood: 16, stone: 24 },
      stoneWall: { name: "修建农场石墙", wood: 8, stone: 32 },
      secondFloor: { name: "修建农舍二楼", wood: 80, stone: 60 },
      upstairsKitchen: { name: "修建二楼厨房", wood: 45, stone: 30 },
      upstairsBathroom: { name: "修建二楼卫生间", wood: 35, stone: 45 },
    } as const;
    const recipe = recipes[item];
    if ((item === "upstairsKitchen" || item === "upstairsBathroom") && !game.upgrades.secondFloor) {
      setMessage(`鲁师傅：要先完成农舍二楼，才能继续修建${item === "upstairsKitchen" ? "厨房" : "卫生间"}。`);
      playTone(220);
      return;
    }
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
    const installed = item === "house" ? ["暖光灯", "自动水箱", "料理台"][houseLevel] : item === "field" ? "8 格新农田" : item === "storage" ? "自动售卖加价 10% 的仓库" : item === "greenhouse" ? "隔日自动洒水、人工浇水时加速两阶段的温室" : item === "pond" ? "每次多钓 1 条鱼的大鱼塘" : item === "stoneWall" ? "阻挡小动物的农场石墙" : item === "secondFloor" ? "带楼梯的大块空旷二楼" : item === "upstairsKitchen" ? "可以做热饭的二楼厨房" : item === "upstairsBathroom" ? "可以洗去淋雨疲劳的二楼卫生间" : "更宽敞的农场地盘";
    setMessage(`鲁师傅完成了${recipe.name}，并安装了${installed}！`);
    playTone(820);
  };

  const placeFurnitureUpstairs = (slotIndex: number) => {
    if (!selectedAtticCraft) return;
    if (!ATTIC_FURNITURE.includes(selectedAtticCraft) || game.crafted[selectedAtticCraft] <= 0) {
      setSelectedAtticCraft(null);
      setMessage("背包里没有这件可以摆放的家具了。");
      return;
    }
    if (game.atticPlacedCrafts.some((craft) => craft.x === slotIndex)) {
      setMessage("这个位置已经摆了东西，请选择另一个绿色方格。");
      return;
    }
    if (selectedAtticCraft === "chest" && game.atticChestPlaced) {
      setMessage("二楼已经摆好一个专用收纳箱了。");
      return;
    }
    const furniture = selectedAtticCraft;
    setGame((current) => ({
      ...current,
      crafted: { ...current.crafted, [furniture]: Math.max(0, current.crafted[furniture] - 1) },
      atticChestPlaced: furniture === "chest" ? true : current.atticChestPlaced,
      atticPlacedCrafts: [...current.atticPlacedCrafts, { id: `upstairs-${Date.now()}-${slotIndex}`, type: furniture, x: slotIndex, y: 0, rotation: 0 }],
    }));
    setSelectedAtticCraft(null);
    setMessage(`${CRAFT_RECIPES[furniture].name}已经摆到二楼。绿色方格也收起来了。`);
    playTone(760);
  };

  const putInAtticStorage = (resource: AtticResource) => {
    if (game[resource] <= 0) {
      setMessage(`背包里没有${ATTIC_RESOURCE_INFO[resource].name}。`);
      return;
    }
    setGame((current) => ({
      ...current,
      [resource]: current[resource] - 1,
      atticStorage: { ...current.atticStorage, [resource]: current.atticStorage[resource] + 1 },
    }));
    setMessage(`把 1 个${ATTIC_RESOURCE_INFO[resource].name}放进二楼收纳箱。`);
  };

  const takeFromAtticStorage = (resource: AtticResource) => {
    if (game.atticStorage[resource] <= 0) return;
    setGame((current) => ({
      ...current,
      [resource]: current[resource] + 1,
      atticStorage: { ...current.atticStorage, [resource]: current.atticStorage[resource] - 1 },
    }));
    setMessage(`从二楼收纳箱取出 1 个${ATTIC_RESOURCE_INFO[resource].name}。`);
  };

  const startCookingSeafood = (food: CookingFood) => {
    const name = food === "crabs" ? "螃蟹" : "小虾";
    if (!game.upgrades.upstairsKitchen) {
      setMessage("二楼厨房还没有单独扩建完成。");
      return;
    }
    if (game[food] <= 0) {
      setMessage(`背包里没有可以烹饪的${name}。`);
      return;
    }
    setCookingGame({ food, step: "chop", chops: 0, heatScore: 0 });
    setCookingHeat(0);
    setMessage(`开始制作${food === "crabs" ? "香烤螃蟹" : "田园炒小虾"}：先在砧板上处理食材。`);
    playTone(650);
  };

  const chopCookingIngredient = () => {
    if (!cookingGame || cookingGame.step !== "chop") return;
    const chops = cookingGame.chops + 1;
    if (chops >= 4) {
      setCookingGame({ ...cookingGame, chops, step: "heat" });
      setCookingHeat(0);
      setMessage("食材已经处理好。现在观察火候游标，走进绿色区域时点击翻面！ ");
      playTone(720);
      return;
    }
    setCookingGame({ ...cookingGame, chops });
    setMessage(`沿着纹理切好了第 ${chops} 处，还需要 ${4 - chops} 刀。`);
    playTone(480 + chops * 50);
  };

  const stopCookingHeat = () => {
    if (!cookingGame || cookingGame.step !== "heat") return;
    const heatScore = cookingHeat >= 42 && cookingHeat <= 68 ? 2 : cookingHeat >= 28 && cookingHeat <= 82 ? 1 : 0;
    setCookingGame({ ...cookingGame, step: "plate", heatScore });
    setMessage(heatScore === 2 ? "翻面时机刚刚好，香味一下飘出来了！最后把料理装到合适的盘子里。 " : heatScore === 1 ? "火候还可以，料理已经熟了。最后选择盘子装盘。 " : "翻面太早或太晚，边缘有一点焦，不过还能通过认真装盘补救。 ");
    playTone(heatScore === 2 ? 880 : heatScore === 1 ? 680 : 320);
  };

  const finishCooking = (plate: "wood" | "white" | "deep") => {
    if (!cookingGame || cookingGame.step !== "plate") return;
    const { food, heatScore } = cookingGame;
    if (game[food] <= 0) {
      setCookingGame(null);
      setMessage("食材已经不在背包里了，这次烹饪只能先停下。 ");
      return;
    }
    const idealPlate = food === "crabs" ? "deep" : "white";
    const platingPoint = plate === idealPlate ? 1 : 0;
    const total = heatScore + platingPoint;
    const dish = food === "crabs" ? "熟螃蟹" : "熟小虾";
    const recipe = food === "crabs" ? "香草烤螃蟹" : "清香炒小虾";
    const cookedField = food === "crabs" ? "cookedCrabs" : "cookedShrimp";
    const quality = total >= 3 ? "完美料理" : total >= 2 ? "美味料理" : "家常料理";
    setGame((current) => ({
      ...current,
      [food]: current[food] - 1,
      [cookedField]: current[cookedField] + 1,
      recipesDiscovered: current.recipesDiscovered.includes(recipe) ? current.recipesDiscovered : [...current.recipesDiscovered, recipe],
      journalEntries: [`${SEASONS[current.season]}第${current.day}天：在二楼厨房做出了${quality}“${recipe}”。`, ...current.journalEntries].slice(0, 40),
    }));
    setCookingGame(null);
    setMessage(`${quality}完成！获得 1 份${dish}，没有立刻吃掉，已经放进资源记录。`);
    playTone(total >= 3 ? 980 : total >= 2 ? 820 : 620);
  };

  const eatCookedSeafood = (food: "cookedCrabs" | "cookedShrimp", atTable = false) => {
    const crab = food === "cookedCrabs";
    const name = crab ? "熟螃蟹" : "熟小虾";
    const recovery = (crab ? 38 : 32) + (atTable ? 10 : 0);
    if (game[food] <= 0) {
      setMessage(`资源记录里没有${name}，先去二楼厨房烹饪。`);
      return;
    }
    setGame((current) => ({ ...current, [food]: current[food] - 1, energy: Math.min(100, current.energy + recovery) }));
    setMessage(`${atTable ? "坐在餐桌前好好" : ""}吃掉 1 份${name}，恢复 ${recovery} 点体力。`);
    playTone(780);
  };

  const commissionFurniture = (furniture: CraftType) => {
    const recipe = CRAFT_RECIPES[furniture];
    if (game.builderSupplies.wood < recipe.wood || game.builderSupplies.stone < recipe.stone) {
      setMessage(`鲁师傅：制作${recipe.name}需要 ${recipe.wood} 木头和 ${recipe.stone} 石材，交给我的材料还不够。`);
      playTone(220);
      return;
    }
    setGame((current) => ({
      ...current,
      builderSupplies: { wood: current.builderSupplies.wood - recipe.wood, stone: current.builderSupplies.stone - recipe.stone },
      crafted: { ...current.crafted, [furniture]: current.crafted[furniture] + 1 },
    }));
    const use = furniture === "chest" ? "存放二楼物品" : furniture === "floorLamp" ? "点击开灯并照亮夜晚的二楼" : furniture === "television" ? "查看今日新闻和明天天气预报" : furniture === "sofa" ? "坐下恢复 12 点体力" : furniture === "bookshelf" ? "阅读农场故事" : furniture === "dresser" ? "整理和更换衣服" : furniture === "nightstand" ? "喝热水恢复体力" : "坐下来吃东西并恢复更多体力";
    setMessage(`鲁师傅做好了${recipe.name}，已经放进背包。摆到二楼后可以${use}。`);
    playTone(820);
  };

  const eatAtUpstairsTable = () => {
    if (game.cookedCrabs > 0) {
      eatCookedSeafood("cookedCrabs", true);
      return;
    }
    if (game.cookedShrimp > 0) {
      eatCookedSeafood("cookedShrimp", true);
      return;
    }
    if (game.cookies > 0) {
      setGame((current) => ({ ...current, cookies: current.cookies - 1, energy: Math.min(100, current.energy + 32) }));
      setMessage("坐在实木餐桌前慢慢吃完安安的饼干，恢复 32 点体力，比站着吃恢复得更多。 ");
      playTone(760);
      return;
    }
    if (game.eggs > 0) {
      setGame((current) => ({ ...current, eggs: current.eggs - 1, energy: Math.min(100, current.energy + 24) }));
      setMessage("坐在餐桌前吃掉一个鸡蛋，恢复 24 点体力。 ");
      playTone(720);
      return;
    }
    if (game.milk > 0) {
      setGame((current) => ({ ...current, milk: current.milk - 1, energy: Math.min(100, current.energy + 28) }));
      setMessage("坐在餐桌前喝下一杯牛奶，恢复 28 点体力。 ");
      playTone(730);
      return;
    }
    const crop = CROP_TYPES.find((item) => game.inventory[item] > 0);
    if (crop) {
      const recovery = RESOURCE_INFO[crop].energy + 10;
      setGame((current) => ({ ...current, inventory: { ...current.inventory, [crop]: current.inventory[crop] - 1 }, cropQualityStock: moveBestCropQuality(current.cropQualityStock, crop, 1).next, energy: Math.min(100, current.energy + recovery) }));
      setMessage(`坐在餐桌前好好吃了一个${CROP_INFO[crop].name}，恢复 ${recovery} 点体力。`);
      playTone(710);
      return;
    }
    setMessage("餐桌已经摆好了，不过背包里暂时没有饼干、鸡蛋、牛奶或农作物可以吃。 ");
  };

  const openNewsBroadcast = (news = dailyNewsForState(game), automatic = false) => {
    const tomorrowDay = game.day === 28 ? 1 : game.day + 1;
    const tomorrowSeason = game.day === 28 ? (game.season + 1) % SEASONS.length : game.season;
    const tomorrowYear = game.day === 28 && game.season === SEASONS.length - 1 ? game.year + 1 : game.year;
    const tomorrowWeather = weatherForDate(tomorrowYear, tomorrowSeason, tomorrowDay);
    setNewsBroadcast({ news, automatic, channel: "news", forecast: `明天是${SEASONS[tomorrowSeason]}第 ${tomorrowDay} 天，${WEATHER_INFO[tomorrowWeather].name}，气温约 ${WEATHER_INFO[tomorrowWeather].temperature}` });
    setMessage(automatic ? `紧急新闻正在大屏幕播出：${news.text}` : `电视正在播放今天的青禾新闻。`);
    playTone(news.urgent ? 940 : 680);
  };

  const resolveUrgentEvent = () => {
    if (!game.urgentEvent || game.urgentEventResolved) return;
    const eventKind = game.urgentEvent;
    setGame((current) => ({
      ...current,
      urgentEventResolved: true,
      coins: current.coins + (eventKind === "fire" ? 120 : eventKind === "injury" ? 90 : eventKind === "assembly" ? 80 : 60),
      seeds: current.seeds + (eventKind === "theft" ? 5 : 0),
      energy: Math.max(0, current.energy - 4),
    }));
    setMessage(eventKind === "assembly"
      ? "许老师讲完了重要集合内容，居民们确认了新的山谷安全规则。小禾认真听完，获得 80 金币学习奖励。"
      : eventKind === "fire"
      ? "小禾提起现场水桶，把火苗一处处浇灭了！鲁师傅确认没有余火，感谢你并奖励 120 金币。"
      : eventKind === "theft"
        ? "小禾捡起散落的种子货箱，沿着脚印交还给林婶！获得 60 金币和 5 颗萝卜种子。"
        : "小禾扶起受伤的居民，慢慢送进健康诊所。白医生接手治疗，并送给你 90 金币作为感谢。 ");
    playTone(960);
  };

  const useUpstairsFurniture = (craft: PlacedCraft) => {
    if (selected === "axe") {
      if (craft.type === "chest" && Object.values(game.atticStorage).some((count) => count > 0)) {
        setMessage("二楼收纳箱里还有东西，要先全部取出来才能拆除。 ");
        return;
      }
      const recipe = CRAFT_RECIPES[craft.type];
      const woodBack = Math.max(1, Math.floor(recipe.wood / 2));
      setGame((current) => ({
        ...current,
        energy: Math.max(0, current.energy - staminaCost(current, 2)),
        wood: current.wood + woodBack,
        stone: current.stone + Math.floor(recipe.stone / 2),
        atticChestPlaced: craft.type === "chest" ? false : current.atticChestPlaced,
        atticPlacedCrafts: current.atticPlacedCrafts.filter((placed) => placed.id !== craft.id),
      }));
      setMessage(`拆掉了${recipe.name}，木料重新变成 ${woodBack} 块木头，已经放回资源记录。`);
      playTone(360);
      return;
    }
    if (craft.type === "chest") {
      setAtticStorageOpen(true);
      setMessage("打开二楼专用收纳箱，可以单个放入或取出材料。 ");
      return;
    }
    if (craft.type === "floorLamp" || craft.type === "lamp") {
      setGame((current) => ({ ...current, equipment: { ...current.equipment, lampOn: !current.equipment.lampOn } }));
      setMessage(game.equipment.lampOn ? "关掉室内落地灯，家具仍留在原地。 " : "点亮室内落地灯，夜晚的整个二楼明亮起来。 ");
      playTone(game.equipment.lampOn ? 300 : 760);
      return;
    }
    if (craft.type === "television") {
      openNewsBroadcast();
      return;
    }
    if (craft.type === "sofa" || craft.type === "bench") {
      const recovery = craft.type === "sofa" ? 12 : 8;
      setGame((current) => ({ ...current, energy: Math.min(100, current.energy + recovery) }));
      setMessage(`在${CRAFT_RECIPES[craft.type].name}上坐下休息，恢复 ${recovery} 点体力。`);
      return;
    }
    if (craft.type === "table") {
      eatAtUpstairsTable();
      return;
    }
    if (craft.type === "bookshelf") {
      const stories = ["《四季播种手册》说：不同季节要挑选合适的种子。", "《溪流里的银鳞鱼》记着青禾谷的钓鱼故事。", "《安安的山路笔记》画着帐篷、山洞和通往海边的小路。"];
      setMessage(`从矮木书柜抽出一本书：${stories[game.day % stories.length]}`);
      return;
    }
    if (craft.type === "dresser") {
      const nextOutfit = game.mallItems.redCoat > 0 && game.equippedOutfit !== "redCoat" ? "redCoat" : game.mallItems.blueOutfit > 0 && game.equippedOutfit !== "blueOutfit" ? "blueOutfit" : "default";
      setGame((current) => ({ ...current, equippedOutfit: nextOutfit }));
      setMessage(nextOutfit === "default" ? "拉开斗柜，把衣服叠好并换回平常的农场服。" : `从斗柜取出${nextOutfit === "redCoat" ? "红色节日外套" : "蓝色旅行套装"}换上。`);
      return;
    }
    if (craft.type === "nightstand") {
      setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 5) }));
      setMessage("从床边小柜拿起温水慢慢喝完，恢复 5 点体力。 ");
      return;
    }
    setMessage(`${CRAFT_RECIPES[craft.type].name}稳稳地摆在屋里。`);
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
      energy: current.energy - staminaCost(current, 2),
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
    if (item === "nightstand") {
      if (activeBuilding !== "farmhouse" || houseFloor !== 1) {
        setMessage("床边小柜应该摆在床边。请先回到农舍一楼，再点击背包里的床边小柜。 ");
        playTone(480);
        return;
      }
      if (game.firstFloorNightstandPlaced) {
        setMessage("床边已经摆好一个小柜了。点击小柜可以喝温水恢复体力。 ");
        return;
      }
      setGame((current) => ({ ...current, crafted: { ...current.crafted, nightstand: Math.max(0, current.crafted.nightstand - 1) }, firstFloorNightstandPlaced: true }));
      setMessage("把床边小柜稳稳摆到一楼床头旁边了，杯子里装着温水。 ");
      playTone(740);
      return;
    }
    if (INDOOR_FURNITURE.includes(item)) {
      setSelectedCraftItem(null);
      if (activeBuilding !== "farmhouse" || houseFloor !== 2) {
        setMessage(`${CRAFT_RECIPES[item].name}是真正的室内家具。请先进入农舍二楼，再从屋里的家具栏选择摆放。`);
        playTone(520);
        return;
      }
      setSelectedAtticCraft(item);
      setMessage(`已从背包选中${CRAFT_RECIPES[item].name}。点击屋内出现的绿色方格摆放。`);
      playTone(620);
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
      energy: Math.max(0, current.energy - staminaCost(current, 2)),
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
      cropQualityStock: isCropResource(resource) ? moveBestCropQuality(current.cropQualityStock, resource, 1).next : current.cropQualityStock,
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
    if (!game.diagnosed || !game.illness) {
      setMessage("药材不能乱用。先去青禾诊所接受免费检查，知道具体病种以后再决定治疗方法。 ");
      playTone(260);
      return;
    }
    setMessage(`${ILLNESSES[game.illness].name}不能靠单点药材立刻治好。请按照诊所教过的专属流程处理。`);
    playTone(420);
  };

  const beginMedicalCourse = (illness: IllnessId) => {
    if (currentFestival?.id !== "medical" || activeBuilding !== "clinic") {
      setMessage("病种实习只在青禾医疗节当天的诊所开放，可以从镇公所公告栏进入体验。 ");
      return;
    }
    setMedicalThermometerPicked(false);
    setCareHeldItem(null);
    setCareMixValues({ medicine: 0, water: 0, warmth: 0 });
    setCareHoldProgress(0);
    setCareRecheckTemperature(35);
    setCareSession({ mode: "training", illness, step: 0, progress: 0, selected: [], herbParts: 0, waterParts: 0 });
    setMessage(`白医生拿出“${ILLNESSES[illness].name}”病例册。先观察三项症状，不能跳步骤。`);
    playTone(640);
  };

  const beginSelfTreatment = () => {
    if (!game.sick || !game.diagnosed || !game.illness) {
      setMessage("只有检查出具体病种以后，才会出现对应的自我治疗流程。 ");
      return;
    }
    const illness = ILLNESSES[game.illness];
    if (!game.learnedTreatments.includes(game.illness)) {
      setMessage(`还没有在医疗节学过“${illness.name}”的处理方法，不能凭感觉治疗。`);
      return;
    }
    if (illness.method === "clinicOnly") {
      setScene("town");
      setActiveBuilding("clinic");
      setMessage(`${illness.name}属于必须使用诊所处方药的病种，已经带小禾来到诊所，请找白医生开药。`);
      return;
    }
    if (illness.method === "baths") {
      const progress = game.treatmentBaths[game.illness] ?? 0;
      if (!game.upgrades.secondFloor || !game.upgrades.upstairsBathroom) {
        setMessage(`${illness.name}要连续洗三次热水澡，目前完成 ${progress}/3 次。家里还没有二楼卫生间，需要先请鲁师傅扩建，暂时也可以去诊所处理。`);
        return;
      }
      setScene("farm");
      setActiveBuilding("farmhouse");
      setHouseFloor(2);
      setUpstairsRoom("bathroom");
      setIndoorPlayer({ x: 27, y: 71 });
      setMessage(`${illness.name}要连续完成三次热浴并睡觉恢复，目前 ${progress}/3 次。已经来到卫生间，请使用浴缸与花洒。`);
      return;
    }
    const recipe = illness.recipe;
    if (recipe && (game.herbs < recipe.herbs || game.inventory.pineapple < recipe.pineapple || game.pineNuts < recipe.pineNuts)) {
      setMessage(`${illness.name}的游戏配方材料不足：需要菠萝 ${recipe.pineapple}、松子 ${recipe.pineNuts}、药材 ${recipe.herbs}。医生只能告诉方法，材料要自己收集。`);
      return;
    }
    if (!recipe && game.herbs < 1) {
      setMessage("这套护理需要 1 份药材，先去地上寻找或到超市购买。 ");
      return;
    }
    if (game.energy < 36) {
      setMessage("完整自我治疗会消耗 35 点体力。现在太虚弱，应该先去诊所，不要勉强。 ");
      return;
    }
    setMedicalThermometerPicked(false);
    setCareHeldItem(null);
    setCareMixValues({ medicine: 0, water: 0, warmth: 0 });
    setCareHoldProgress(0);
    setCareRecheckTemperature(35);
    setCareSession({ mode: "treatment", illness: game.illness, step: 0, progress: 0, selected: [], herbParts: 0, waterParts: 0 });
    setMessage(`开始处理${illness.name}。必须依次完成观察、备物、消毒、配制、护理和复查。`);
  };

  const openHealthTreatment = () => {
    if (!game.sick) {
      setMessage("小禾现在身体健康，不需要治疗。 ");
      return;
    }
    if (!game.diagnosed || !game.illness) {
      setScene("town");
      setActiveBuilding("clinic");
      setMessage("已经来到青禾诊所。请先点“接受免费检查”，确认具体病种后才能选择正确治疗方法。 ");
      return;
    }
    beginSelfTreatment();
  };

  const takeTherapeuticBath = () => {
    if (game.sick && game.diagnosed && game.illness && ILLNESSES[game.illness].method === "baths") {
      const illnessId = game.illness;
      const nextCount = Math.min(3, (game.treatmentBaths[illnessId] ?? 0) + 1);
      const cured = nextCount >= 3;
      setGame((current) => ({
        ...current,
        energy: Math.min(100, current.energy + 10),
        sick: cured ? false : current.sick,
        diagnosed: cured ? false : current.diagnosed,
        illness: cured ? null : current.illness,
        treatmentBaths: { ...current.treatmentBaths, [illnessId]: nextCount },
        rainExposure: 0,
        showeredBeforeBed: true,
      }));
      setMessage(cured ? `第 3 次热水澡完成，${ILLNESSES[illnessId].name}终于恢复了。` : `${ILLNESSES[illnessId].name}的连续热浴完成 ${nextCount}/3 次。今晚睡一觉，下一次再继续。`);
      playTone(cured ? 920 : 680);
      return;
    }
    setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 15), rainExposure: 0, showeredBeforeBed: true }));
    setMessage("洗了一个暖和的澡：恢复 15 点体力。睡觉后，明天农活体力消耗减少约三成。 ");
    playTone(720);
  };

  const completeCareSession = (session: NonNullable<typeof careSession>) => {
    if (session.mode === "training") {
      setGame((current) => ({
        ...current,
        medicalTrained: true,
        learnedTreatments: current.learnedTreatments.includes(session.illness) ? current.learnedTreatments : [...current.learnedTreatments, session.illness],
        journalEntries: [`${SEASONS[current.season]}第${current.day}天：在医疗节学会了${ILLNESSES[session.illness].name}的专属处理流程。`, ...current.journalEntries].slice(0, 40),
      }));
      setMessage(`病例实习完成：学会了${ILLNESSES[session.illness].name}的专属流程。其他病种仍要逐种学习。`);
      setCareSession(null);
      setCareHeldItem(null);
      playTone(940);
      return;
    }
    const illness = ILLNESSES[session.illness];
    const recipe = illness.recipe;
    setGame((current) => ({
      ...current,
      herbs: Math.max(0, current.herbs - (recipe?.herbs ?? 1)),
      pineNuts: Math.max(0, current.pineNuts - (recipe?.pineNuts ?? 0)),
      inventory: { ...current.inventory, pineapple: Math.max(0, current.inventory.pineapple - (recipe?.pineapple ?? 0)) },
      energy: Math.max(0, current.energy - 35),
      sick: false,
      diagnosed: false,
      illness: null,
      journalEntries: [`${SEASONS[current.season]}第${current.day}天：完整完成${illness.name}的六段自我治疗，消耗了 35 点体力。`, ...current.journalEntries].slice(0, 40),
    }));
    setCareSession(null);
    setCareHeldItem(null);
    setCareHoldProgress(0);
    setMessage(`${illness.name}的六段流程全部完成。小禾恢复健康，但治疗很累，消耗了 35 点体力。`);
    playTone(980);
  };

  const performCareAction = (token: string) => {
    if (!careSession || careSession.selected.includes(token)) return;
    const requiredByStep = [3, 4, 6, 5, 5, 3];
    const nextSelected = [...careSession.selected, token];
    const required = requiredByStep[careSession.step] ?? 1;
    if (nextSelected.length < required) {
      setCareSession({ ...careSession, progress: nextSelected.length, selected: nextSelected });
      setMessage(`${ILLNESSES[careSession.illness].name} · 当前步骤 ${nextSelected.length}/${required}，还不能跳到下一步。`);
      playTone(480 + nextSelected.length * 45);
      return;
    }
    if (careSession.step >= 5) {
      completeCareSession(careSession);
      return;
    }
    setCareSession({ ...careSession, step: careSession.step + 1, progress: 0, selected: [], herbParts: 0, waterParts: 0 });
    setCareHeldItem(null);
    setCareHoldProgress(0);
    if (careSession.step === 2) setCareMixValues({ medicine: 0, water: 0, warmth: 0 });
    if (careSession.step === 4) setCareRecheckTemperature(35);
    setMessage(`这一步完成，进入第 ${careSession.step + 2}/6 段。`);
    playTone(720);
  };

  const stopCareTimedHold = (cancelled = false) => {
    if (careHoldTimerRef.current !== null) window.clearInterval(careHoldTimerRef.current);
    if (careHoldFinishTimerRef.current !== null) window.clearTimeout(careHoldFinishTimerRef.current);
    const wasRunning = careHoldFinishTimerRef.current !== null;
    careHoldTimerRef.current = null;
    careHoldFinishTimerRef.current = null;
    if (cancelled && wasRunning) {
      setCareHoldProgress(0);
      setMessage("松手太早，护理动作还没完成。需要一直按住，等进度真正到满。 ");
      playTone(220);
    }
  };

  const beginCareTimedHold = (token: string, duration: number, label: string) => {
    if (!careSession || careSession.selected.includes(token) || careHoldFinishTimerRef.current !== null) return;
    stopCareTimedHold(false);
    const startedAt = Date.now();
    setCareHoldProgress(1);
    setMessage(`正在${label}。手不要松开，还要保持一会儿。`);
    careHoldTimerRef.current = window.setInterval(() => {
      setCareHoldProgress(Math.min(96, ((Date.now() - startedAt) / duration) * 100));
    }, 60);
    careHoldFinishTimerRef.current = window.setTimeout(() => {
      if (careHoldTimerRef.current !== null) window.clearInterval(careHoldTimerRef.current);
      careHoldTimerRef.current = null;
      careHoldFinishTimerRef.current = null;
      setCareHoldProgress(100);
      performCareAction(token);
      playTone(760);
    }, duration);
  };

  const beginCareGesture = (event: ReactPointerEvent<HTMLButtonElement>, instruction: string) => {
    if (!careSession) return;
    careGestureActiveRef.current = true;
    careGestureLastPointRef.current = { x: event.clientX, y: event.clientY };
    careGestureDistanceRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
    setMessage(instruction);
  };

  const moveCareGesture = (event: ReactPointerEvent<HTMLButtonElement>, token: string, neededDistance: number) => {
    if (!careSession || !careGestureActiveRef.current || !careGestureLastPointRef.current || careSession.selected.includes(token)) return;
    const last = careGestureLastPointRef.current;
    careGestureDistanceRef.current += Math.hypot(event.clientX - last.x, event.clientY - last.y);
    careGestureLastPointRef.current = { x: event.clientX, y: event.clientY };
    setCareHoldProgress(Math.min(96, (careGestureDistanceRef.current / neededDistance) * 100));
    if (careGestureDistanceRef.current < neededDistance) return;
    careGestureActiveRef.current = false;
    careGestureLastPointRef.current = null;
    careGestureDistanceRef.current = 0;
    setCareHoldProgress(100);
    performCareAction(token);
    playTone(720);
  };

  const endCareGesture = () => {
    if (careGestureActiveRef.current && careGestureDistanceRef.current > 0) {
      setMessage("移动距离还不够，检查或擦拭没有做完整。请从亮起的位置重新按住操作。 ");
      playTone(230);
    }
    careGestureActiveRef.current = false;
    careGestureLastPointRef.current = null;
    careGestureDistanceRef.current = 0;
    setCareHoldProgress(0);
  };

  const careMixTarget = careSession ? (() => {
    const index = ILLNESS_IDS.indexOf(careSession.illness);
    return {
      medicine: [2, 4, 1, 2, 3, 4, 3, 1][index] ?? 2,
      water: [3, 1, 4, 2, 2, 1, 3, 4][index] ?? 3,
      warmth: [2, 1, 4, 2, 3, 1, 3, 4][index] ?? 2,
    };
  })() : { medicine: 2, water: 3, warmth: 2 };

  const verifyCareMix = () => {
    if (!careSession || careSession.step !== 3 || careSession.selected.length > 0) return;
    if (careMixValues.medicine !== careMixTarget.medicine || careMixValues.water !== careMixTarget.water || careMixValues.warmth !== careMixTarget.warmth) {
      setMessage("配比没有通过检查：三项里至少有一项不符合病例卡。重新观察刻度和温度要求。 ");
      playTone(210);
      return;
    }
    setCareSession({ ...careSession, progress: 3, selected: ["药量刻度", "水量刻度", "温度刻度"] });
    setMessage("三项配比正确。现在还不能喝：按住木勺沿着碗边完整绕两圈，把药真正调匀。 ");
    playTone(700);
  };

  const lockCareRecheckTemperature = () => {
    if (!careSession || careSession.step !== 5 || careSession.selected.includes("复测体温")) return;
    if (careRecheckTemperature < 36.5 || careRecheckTemperature > 37.5) {
      setMessage("温度计游标不在正常刻度区。仔细看绿色范围，把游标调进去再记录。 ");
      playTone(210);
      return;
    }
    performCareAction("复测体温");
    setMessage("体温读数已经稳定在正常范围。下一步用听诊器沿胸口移动，确认呼吸。 ");
  };

  const placeMedicalThermometer = () => {
    if (!careSession || careSession.step !== 0) return;
    if (!medicalThermometerPicked) {
      setMessage("先从护理盘里拿起温度计，再把它拖到病人的脸旁。触屏可以先点温度计，再点病人的脸。 ");
      return;
    }
    if (careSession.selected.includes("测量体温")) return;
    setMedicalThermometerPicked(false);
    performCareAction("测量体温");
    setMessage("温度计已经放在病人的脸旁，停留片刻后读出了体温，并把结果写进病例卡。 ");
    playTone(760);
  };

  const pickCareItem = (item: string) => {
    setCareHeldItem(item);
    setMessage(`已经拿起“${item}”。把它拖到正确的器具盘、病人位置或调配容器。触屏可以再点目标。`);
    playTone(520);
  };

  const applyCareItem = (expected: string, token: string, keepHeld = false) => {
    if (!careSession) return;
    if (careHeldItem !== expected) {
      setMessage(careHeldItem ? `拿着的是“${careHeldItem}”，这里需要“${expected}”。先换对物品。` : `先拿起“${expected}”，再放到这里。`);
      playTone(240);
      return;
    }
    performCareAction(token);
    if (!keepHeld) setCareHeldItem(null);
  };

  const handleCarePointerRelease = (event: ReactPointerEvent<HTMLElement>) => {
    if (!careSession) return;
    const dropTarget = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-care-drop]");
    if (!dropTarget) {
      if (careHeldItem || medicalThermometerPicked) {
        setCareHeldItem(null);
        setMedicalThermometerPicked(false);
        setMessage("物品没有放到操作区。要按住实物拖动，移动到发光的虚线位置以后再松手，单点不会完成。 ");
        playTone(220);
      }
      return;
    }
    const dropKind = dropTarget.dataset.careDrop;
    if (dropKind === "thermometer") {
      placeMedicalThermometer();
      return;
    }
    if (dropKind === "generic") {
      const expected = dropTarget.dataset.careExpected;
      const token = dropTarget.dataset.careToken;
      if (expected && token) applyCareItem(expected, token, dropTarget.dataset.careKeep === "true");
      return;
    }
    if (dropKind === "tray") {
      const correctTools = ["干净毛巾", "温度计", "温水杯", "护理记录本"];
      if (!careHeldItem) return;
      if (!correctTools.includes(careHeldItem)) {
        setMessage(`${careHeldItem}不干净或有破损，不能放进护理盘。请把它拖回柜子，再选择安全器具。`);
        setCareHeldItem(null);
        playTone(210);
        return;
      }
      performCareAction(careHeldItem);
      setCareHeldItem(null);
      return;
    }
    if (dropKind === "treatment") {
      const treatmentItems: Record<TreatmentMethod, string[]> = {
        remedy: ["菠萝块", "松子一", "松子二", "药材", "温水"],
        clinicOnly: ["患者腕带", "处方单", "密封药瓶", "量杯", "用药时间卡"],
        baths: ["冷水阀", "热水阀", "浴温度计", "干毛巾", "洗浴记录卡"],
        selfCare: ["药材", "温水一", "温水二", "干净毛巾", "搅拌勺"],
      };
      if (!careHeldItem || !treatmentItems[ILLNESSES[careSession.illness].method].includes(careHeldItem)) {
        setMessage("要从当前病种的材料架上按住正确实物，再拖到中央容器里。 ");
        setCareHeldItem(null);
        playTone(220);
        return;
      }
      performCareAction(careHeldItem);
      setCareHeldItem(null);
    }
  };

  const renderDetailedCareStep = () => {
    if (!careSession || careSession.step === 0) return null;
    const illness = ILLNESSES[careSession.illness];
    const selected = careSession.selected;
    const careTool = (id: string, label: string, icon: string, className = "") => (
      <button
        key={id}
        type="button"
        draggable
        className={`care-physical-tool ${className} ${careHeldItem === id ? "held" : ""} ${selected.includes(id) ? "used" : ""}`}
        onDragStart={() => pickCareItem(id)}
        onPointerDown={() => pickCareItem(id)}
        disabled={selected.includes(id)}
      >
        <i aria-hidden="true">{icon}</i><span>{label}</span>
      </button>
    );

    if (careSession.step === 1) {
      const correctTools = ["干净毛巾", "温度计", "温水杯", "护理记录本"];
      const tools = [
        ["干净毛巾", "干净毛巾", "巾"], ["温度计", "玻璃温度计", "温"], ["温水杯", "带刻度温水杯", "杯"],
        ["护理记录本", "护理记录本", "本"], ["脏旧毛巾", "脏旧毛巾（不能用）", "旧"], ["破损玻璃杯", "有裂纹的杯子（不能用）", "裂"],
      ];
      const placeOnTray = () => {
        if (!careHeldItem) { setMessage("先从器械柜拿起一样物品，再放进不锈钢护理盘。 "); return; }
        if (!correctTools.includes(careHeldItem)) {
          setMessage(`${careHeldItem}不干净或有破损，不能放进护理盘。请换一件安全器具。`);
          playTone(210);
          setCareHeldItem(null);
          return;
        }
        performCareAction(careHeldItem);
        setCareHeldItem(null);
      };
      return <div className="care-preparation-room">
        <div className="care-cabinet"><strong>器械柜</strong><div>{tools.map(([id, label, icon]) => careTool(id, label, icon, correctTools.includes(id) ? "safe-tool" : "unsafe-tool"))}</div></div>
        <button type="button" data-care-drop="tray" className={`care-steel-tray ${careHeldItem ? "ready" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); placeOnTray(); }}>
          <i className="steel-tray-rim" /><strong>不锈钢护理盘</strong><span>{selected.length}/4</span>
          <div>{correctTools.filter((tool) => selected.includes(tool)).map((tool) => <b key={tool}>{tool}</b>)}</div>
          <small>把四样干净、完好的器具逐件拖到这里</small>
        </button>
      </div>;
    }

    if (careSession.step === 2) {
      const targets = [
        ["清洁双手", "双手", "hands"], ["擦净桌面", "操作桌", "table"], ["消毒杯口", "杯口", "cup"],
        ["消毒药勺", "药勺", "spoon"], ["清洁药罐", "药罐", "jar"], ["更换毛巾", "毛巾架", "towel"],
      ];
      const currentTarget = targets[Math.min(selected.length, targets.length - 1)];
      return <div className="care-disinfection-room">
        <div className="disinfection-supply"><div className="real-cotton-pad"><i /><b /></div><small>现在擦：<strong>{currentTarget?.[1]}</strong>。每一处都要按住棉片来回擦够距离，单点和短划都无效。</small></div>
        <div className="disinfection-stage">
          <i className="disinfection-patient"><b /><em /></i><i className="disinfection-table" />
          {targets.map(([token, label, kind], index) => <button key={token} type="button" className={`disinfection-target care-scrub-target target-${kind} ${selected.includes(token) ? "cleaned" : index === selected.length ? "current" : "locked"}`} disabled={index !== selected.length} onPointerDown={(event) => beginCareGesture(event, `按住消毒棉，在${label}上左右来回擦；中途松手会重新计算。`)} onPointerMove={(event) => moveCareGesture(event, token, 165)} onPointerUp={endCareGesture} onPointerCancel={endCareGesture}><i>{selected.includes(token) ? "✓" : index === selected.length ? "擦" : "·"}</i><span>{label}</span></button>)}
        </div>
        <div className="care-live-meter"><i style={{ width: `${careHoldProgress}%` }} /><span>当前擦拭距离 {Math.round(careHoldProgress)}%</span></div><strong className="disinfection-counter">已消毒 {selected.length}/6 处</strong>
      </div>;
    }

    if (careSession.step === 3) {
      const methodNames: Record<TreatmentMethod, string> = { remedy: "草药调和饮", clinicOnly: "处方护理液", baths: "恒温复温水", selfCare: "温热护理液" };
      return <div className={`care-treatment-lab care-dose-lab method-${illness.method}`}>
        <div className="treatment-recipe-note"><i>配</i><div><strong>{illness.name} · {methodNames[illness.method]}</strong><span>病例卡要求：药量 {careMixTarget.medicine} 格、水量 {careMixTarget.water} 格、温度 {careMixTarget.warmth} 格。三条刻度都必须准确，乱配不会通过。</span></div></div>
        {selected.length < 3 ? <>
          <div className="care-dose-controls">
            {(["medicine", "water", "warmth"] as const).map((kind) => <label key={kind}><strong>{kind === "medicine" ? "药材研磨量" : kind === "water" ? "刻度杯水量" : "温热程度"}</strong><span>{careMixValues[kind]} 格</span><input type="range" min="0" max="4" step="1" value={careMixValues[kind]} onChange={(event) => setCareMixValues((current) => ({ ...current, [kind]: Number(event.target.value) }))} /><i><b style={{ width: `${careMixValues[kind] * 25}%` }} /></i></label>)}
            <button type="button" className="care-dose-check" onClick={verifyCareMix}>核对三项配比</button>
          </div>
          <div className="care-dose-vessel"><i /><b /><em style={{ height: `${Math.max(careMixValues.medicine, careMixValues.water) * 18}%` }} /><span>量杯会随着刻度真实变化</span></div>
        </> : <div className="care-mixing-stage">
          <div className={`care-mixing-bowl mixed-${selected.length - 3}`}><i /><b /><em /></div>
          <button type="button" className="care-circular-spoon" onPointerDown={(event) => beginCareGesture(event, `按住木勺沿着碗边绕第 ${selected.length - 2}/2 圈，不能只左右拖一下。`)} onPointerMove={(event) => moveCareGesture(event, selected.length === 3 ? "完整搅拌第一圈" : "完整搅拌第二圈", 310)} onPointerUp={endCareGesture} onPointerCancel={endCareGesture}><i /><span>按住木勺，沿圆形碗边完整绕动</span></button>
          <div className="care-circle-guide"><i /><i /><i /><i /></div>
          <div className="care-live-meter"><i style={{ width: `${careHoldProgress}%` }} /><span>本圈移动轨迹 {Math.round(careHoldProgress)}%</span></div>
        </div>}
      </div>;
    }

    if (careSession.step === 4) {
      const procedures = [
        ["额头热敷", "温热毛巾", "巾", "forehead", 1500], ["分次补水", "让病人慢慢喝水", "杯", "mouth", 1100],
        ["调整坐姿", "扶住肩背调好靠枕", "枕", "back", 1300], ["身体保暖", "把薄毯平整盖好", "毯", "body", 1200], ["安静休息", "保持安静并观察呼吸", "时", "clock", 1900],
      ] as const;
      const current = procedures[Math.min(selected.length, procedures.length - 1)];
      return <div className="care-bedside-room timed-care-room">
        <div className="bedside-tool-cart"><strong>五段护理顺序</strong>{procedures.map(([token, label, icon], index) => <div key={token} className={selected.includes(token) ? "done" : index === selected.length ? "current" : "locked"}><i>{selected.includes(token) ? "✓" : icon}</i><span>{label}</span></div>)}</div>
        <div className="care-bed-scene"><i className="care-bed-patient"><b className="bed-patient-head" /><b className="bed-patient-body" /></i><i className="care-real-bed" />
          <button type="button" className={`bedside-care-hold target-${current[3]}`} onPointerDown={() => beginCareTimedHold(current[0], current[4], current[1])} onPointerUp={() => stopCareTimedHold(true)} onPointerLeave={() => stopCareTimedHold(true)} onPointerCancel={() => stopCareTimedHold(true)}><i>{current[2]}</i><strong>{current[1]}</strong><span>一直按住，不要松手</span><b><em style={{ width: `${careHoldProgress}%` }} /></b></button>
        </div>
        <small className="timed-care-tip">每一段需要的保持时间都不同；过早松手会从这一段重新开始，病人也会逐渐恢复脸色。</small>
      </div>;
    }

    return <div className="care-recheck-room difficult-recheck-room">
      <div className="recheck-instruments"><strong>复查不是把器具拖一遍</strong><p>先读温度计刻度，再沿胸口听诊，最后根据两项结果决定能否结束治疗。</p><div className="recheck-results">{selected.map((item) => <span key={item}>✓ {item}</span>)}</div></div>
      <div className="recheck-patient-stage"><i className="recheck-patient"><b /><em /></i>
        {!selected.includes("复测体温") && <div className="care-temperature-reader"><strong>移动温度计游标到绿色正常区</strong><input type="range" min="35" max="40" step="0.5" value={careRecheckTemperature} onChange={(event) => setCareRecheckTemperature(Number(event.target.value))} /><span>{careRecheckTemperature.toFixed(1)}℃</span><button type="button" onClick={lockCareRecheckTemperature}>锁定并记录读数</button></div>}
        {selected.includes("复测体温") && !selected.includes("复查呼吸") && <button type="button" className="care-recheck-stethoscope" onPointerDown={(event) => beginCareGesture(event, "按住听诊头，沿胸口从左到右、再从右到左移动完整一遍。 ")} onPointerMove={(event) => moveCareGesture(event, "复查呼吸", 240)} onPointerUp={endCareGesture} onPointerCancel={endCareGesture}><i /><strong>按住听诊器沿胸口来回移动</strong><span>{Math.round(careHoldProgress)}%</span></button>}
        {selected.includes("复查呼吸") && <div className="care-final-assessment"><strong>根据刚才的体温与呼吸选择结论</strong><button onClick={() => { setMessage("体温已经回到正常区，不能记录为仍在高热。 "); playTone(210); }}>仍在高热，需要立刻结束全部观察</button><button onClick={() => performCareAction("恢复记录正确")}>体温正常、呼吸平稳，可以完成恢复记录</button><button onClick={() => { setMessage("复查不能省略休息，也不能继续劳动。请选择符合两项读数的记录。 "); playTone(210); }}>马上继续干重活，不需要休息</button></div>}
      </div>
    </div>;
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
      setGame((current) => {
        const qualityMove = isCropResource(selectedResource) ? moveBestCropQuality(current.cropQualityStock, selectedResource, 1) : null;
        return {
          ...current,
          inventory: { ...current.inventory, [selectedResource]: current.inventory[selectedResource] - 1 },
          chestStorage: { ...current.chestStorage, [selectedResource]: current.chestStorage[selectedResource] + 1 },
          cropQualityStock: qualityMove?.next ?? current.cropQualityStock,
          chestCropQualityStock: qualityMove ? addCropQuality(current.chestCropQualityStock, selectedResource, qualityMove.moved) : current.chestCropQualityStock,
        };
      });
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
    setGame((current) => {
      const qualityMove = isCropResource(resource) ? moveBestCropQuality(current.cropQualityStock, resource, current.inventory[resource]) : null;
      return {
        ...current,
        inventory: { ...current.inventory, [resource]: 0 },
        chestStorage: { ...current.chestStorage, [resource]: current.chestStorage[resource] + current.inventory[resource] },
        cropQualityStock: qualityMove?.next ?? current.cropQualityStock,
        chestCropQualityStock: qualityMove ? addCropQuality(current.chestCropQualityStock, resource, qualityMove.moved) : current.chestCropQualityStock,
      };
    });
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
    setGame((current) => {
      const qualityMove = isCropResource(resource) ? moveBestCropQuality(current.chestCropQualityStock, resource, 1) : null;
      return {
        ...current,
        inventory: { ...current.inventory, [resource]: current.inventory[resource] + 1 },
        chestStorage: { ...current.chestStorage, [resource]: current.chestStorage[resource] - 1 },
        chestCropQualityStock: qualityMove?.next ?? current.chestCropQualityStock,
        cropQualityStock: qualityMove ? addCropQuality(current.cropQualityStock, resource, qualityMove.moved) : current.cropQualityStock,
      };
    });
    setMessage(`从木箱取出 1 个${name}。`);
    playTone(620);
  };

  const putInShippingBin = (item: ShippingCatalogItem) => {
    if (shippingItemCount(game, item) <= 0) {
      setMessage(`背包里没有可以放入大号售卖箱的${item.name}。`);
      playTone(220);
      return;
    }
    const availableBefore = shippingItemCount(game, item);
    setGame((current) => {
      if (shippingItemCount(current, item) <= 0) return current;
      let next = current;
      if (item.group === "resource") {
        const resource = item.key as StorableResource;
        const qualityMove = isCropResource(resource) ? moveBestCropQuality(current.cropQualityStock, resource, 1) : null;
        next = { ...current, inventory: { ...current.inventory, [resource]: current.inventory[resource] - 1 }, cropQualityStock: qualityMove?.next ?? current.cropQualityStock, shippingCropQualityStock: qualityMove ? addCropQuality(current.shippingCropQualityStock, resource, qualityMove.moved) : current.shippingCropQualityStock };
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
    const nextStreakCount = shippingDepositStreak?.itemId === item.id ? shippingDepositStreak.count + 1 : 1;
    setShippingDepositStreak({ itemId: item.id, count: nextStreakCount });
    if (nextStreakCount >= 5 && availableBefore > 1) setBulkShippingPrompt(item.id);
    setMessage(nextStreakCount >= 5 && availableBefore > 1
      ? `已经连续放入 5 个${item.name}。要不要把背包里剩下的${item.name}全部放进大号售卖箱？`
      : `把 1 个${item.name}放进大号售卖箱。睡到第二天后会自动卖出。`);
    playTone(700);
  };

  const putAllPromptedItemsInShippingBin = () => {
    if (!bulkShippingPrompt) return;
    const item = SHIPPING_CATALOG.find((entry) => entry.id === bulkShippingPrompt);
    if (!item) {
      setBulkShippingPrompt(null);
      setShippingDepositStreak(null);
      return;
    }
    const amount = shippingItemCount(game, item);
    if (amount <= 0) {
      setBulkShippingPrompt(null);
      setShippingDepositStreak(null);
      setMessage(`背包里的${item.name}已经全部放好了。`);
      return;
    }
    setGame((current) => {
      const currentAmount = shippingItemCount(current, item);
      let next = current;
      if (item.group === "resource") {
        const resource = item.key as StorableResource;
        const qualityMove = isCropResource(resource) ? moveBestCropQuality(current.cropQualityStock, resource, currentAmount) : null;
        next = { ...current, inventory: { ...current.inventory, [resource]: 0 }, cropQualityStock: qualityMove?.next ?? current.cropQualityStock, shippingCropQualityStock: qualityMove ? addCropQuality(current.shippingCropQualityStock, resource, qualityMove.moved) : current.shippingCropQualityStock };
      } else if (item.group === "seed") {
        const field = CROP_INFO[item.key as CropType].seedField;
        next = { ...current, [field]: 0 };
      } else if (item.group === "craft") {
        const craft = item.key as CraftType;
        next = { ...current, crafted: { ...current.crafted, [craft]: 0 } };
      } else {
        const field = item.key as ShippingSingleField;
        next = { ...current, [field]: 0 };
      }
      return { ...next, shippingBin: { ...current.shippingBin, [item.id]: (current.shippingBin[item.id] ?? 0) + currentAmount } };
    });
    setBulkShippingPrompt(null);
    setShippingDepositStreak(null);
    setMessage(`把剩下的 ${amount} 个${item.name}全部放进了大号售卖箱。`);
    playTone(840);
  };

  const takeFromShippingBin = (item: ShippingCatalogItem) => {
    if ((game.shippingBin[item.id] ?? 0) <= 0) return;
    setGame((current) => {
      const inBin = current.shippingBin[item.id] ?? 0;
      if (inBin <= 0) return current;
      let next = current;
      if (item.group === "resource") {
        const resource = item.key as StorableResource;
        const qualityMove = isCropResource(resource) ? moveBestCropQuality(current.shippingCropQualityStock, resource, 1) : null;
        next = { ...current, inventory: { ...current.inventory, [resource]: current.inventory[resource] + 1 }, shippingCropQualityStock: qualityMove?.next ?? current.shippingCropQualityStock, cropQualityStock: qualityMove ? addCropQuality(current.cropQualityStock, resource, qualityMove.moved) : current.cropQualityStock };
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
    setMessage(`从大号售卖箱取回 1 个${item.name}。`);
    playTone(560);
  };

  const sellBackpack = () => {
    const resources = Object.keys(RESOURCE_INFO) as StorableResource[];
    const itemCount = resources.reduce((sum, resource) => sum + game.inventory[resource], 0);
    const baseEarnings = resources.reduce((sum, resource) => sum + game.inventory[resource] * RESOURCE_INFO[resource].price, 0);
    const qualityBonus = cropQualityBonus(game.cropQualityStock);
    const earnings = Math.round((baseEarnings + qualityBonus) * (game.upgrades.storage ? 1.1 : 1));
    if (itemCount <= 0) {
      setMessage("背包里没有可以售卖的鱼或作物，木头会一直保留。 ");
      playTone(220);
      return;
    }
    setGame((current) => ({
      ...current,
      coins: current.coins + earnings,
      inventory: Object.fromEntries((Object.keys(RESOURCE_INFO) as StorableResource[]).map((resource) => [resource, 0])) as Record<StorableResource, number>,
      cropQualityStock: makeCropQualityStock(),
      daily: { ...current.daily, sold: current.daily.sold + itemCount },
    }));
    setSelectedResource(null);
    if (heldItem?.kind === "resource") setHeldItem(null);
    setMessage(`自动售卖 ${itemCount} 件鱼和作物，赚到 ${earnings} 金币！${qualityBonus ? `其中星级品质额外增加 ${qualityBonus} 金币。` : ""}${game.upgrades.storage ? "扩建仓库额外加价 10%。" : ""}木头没有清空。`);
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
          target.care = 0;
          target.hybrid = false;
          target.cropType = undefined;
          next[cropDetails.seedField] += 1;
          next.energy = Math.max(0, current.energy - staminaCost(current, 2));
          feedback = `用锄头小心挖掉了${cropDetails.name}${tile.stage >= 3 ? "植株" : "幼苗"}，1 颗${cropDetails.name}种子已经退回原来的种子袋。土地仍然保持松软。`;
          tone = 520;
          return next;
        }
        if (tile.state === "soil") {
          feedback = "这里已经松好土了，可以直接播种。";
          return current;
        }
        target.state = "soil";
        next.energy = Math.max(0, current.energy - staminaCost(current, 3));
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
        target.care = 0;
        target.hybrid = false;
        target.cropType = selectedCrop;
        next[cropDetails.seedField] -= 1;
        next.energy = Math.max(0, current.energy - staminaCost(current, 2));
        next.planted += 1;
        next.wishPlantingRecords = {
          ...current.wishPlantingRecords,
          [`weather:${current.weather}:${selectedCrop}`]: (current.wishPlantingRecords[`weather:${current.weather}:${selectedCrop}`] ?? 0) + 1,
          [`season:${current.season}:${selectedCrop}`]: (current.wishPlantingRecords[`season:${current.season}:${selectedCrop}`] ?? 0) + 1,
        };
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
        target.care = (tile.care ?? 0) + 1;
        next.water -= 1;
        next.energy = Math.max(0, current.energy - staminaCost(current, 1));
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
        target.hybrid = false;
        const cropType = tile.cropType ?? "radish";
        const cropDetails = CROP_INFO[cropType];
        const effectiveCare = (tile.care ?? 0) + (current.ageSkillsLearned.includes("hybrid") ? 1 : 0);
        const quality: CropQuality = effectiveCare >= 3 ? "gold" : effectiveCare >= 2 ? "silver" : "normal";
        const harvestAmount = current.ageSkillsLearned.includes("hybrid") ? 2 : 1;
        const returnedSeeds = current.ageSkillsLearned.includes("hybrid") ? 3 : 2;
        target.cropType = undefined;
        target.care = 0;
        next[cropDetails.seedField] += returnedSeeds;
        next.energy = Math.max(0, current.energy - staminaCost(current, 1));
        next.harvested += harvestAmount;
        next.daily = { ...current.daily, harvested: current.daily.harvested + harvestAmount };
        next.inventory = { ...current.inventory, [cropType]: current.inventory[cropType] + harvestAmount };
        next.cropQualityHarvests = mergeCropQualityRecord(current.cropQualityHarvests);
        next.cropQualityHarvests[cropType] = { ...next.cropQualityHarvests[cropType], [quality]: next.cropQualityHarvests[cropType][quality] + harvestAmount };
        if (quality !== "normal") next.cropQualityStock = addCropQuality(current.cropQualityStock, cropType, { silver: quality === "silver" ? harvestAmount : 0, gold: quality === "gold" ? harvestAmount : 0 });
        feedback = `收获 ${harvestAmount} 个${quality === "gold" ? "金星" : quality === "silver" ? "银星" : "普通"}${cropDetails.name}！${quality === "gold" ? "连续精心浇水，售价提高 80%。" : quality === "silver" ? "照料得很好，售价提高 35%。" : "继续每天浇水，就更容易得到星级品质。"}${current.ageSkillsLearned.includes("hybrid") ? "丰收巧手让作物和返还种子都多了 1 份。" : ""}并获得 ${returnedSeeds} 颗同类种子。`;
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

  const buyItem = (item: SeedField | "water" | "snack" | "soup" | "bait" | "sapling" | "rockGrowth" | "diamondGrowth") => {
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
      diamondGrowth: { price: 850, success: "钻石矿脉生长包已经在山洞里生效！三处新矿脉换了位置，去寻找露出的晶尖吧。", tone: 940 },
    } as const)[item as "water" | "snack" | "soup" | "bait" | "sapling" | "rockGrowth" | "diamondGrowth"];

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
        caveDiamondStates: item === "diamondGrowth" ? current.caveDiamondStates.map(() => true) : current.caveDiamondStates,
        caveDiamondSpots: item === "diamondGrowth" ? current.caveDiamondSpots.map((spot, index) => (spot + 2 + index * 2) % CAVE_DIAMOND_SPOTS.length) : current.caveDiamondSpots,
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
    const leavingDreamFarmhouse = dreamScene !== null && !dreamSurreal && activeBuilding === "farmhouse";
    if (excursionTimerRef.current) window.clearTimeout(excursionTimerRef.current);
    excursionTimerRef.current = null;
    setAmusementOpen(false);
    setBusTraveling(false);
    if (activeBuilding === "farmhouse") {
      setBedtimePhase(null);
      setHouseFloor(1);
      setStairTravel(null);
      setUpstairsRoom(null);
      setAtticStorageOpen(false);
      setSelectedAtticCraft(null);
    }
    setTownhallCalendarOpen(false);
    setCafePlayerSitting(false);
    setActiveBuilding(null);
    setInspectedItem(null);
    setPlayer(building.exit);
    if (leavingDreamFarmhouse) {
      setDreamPhase("outside");
      setMessage("小禾像平常一样走出农舍，回到了自己的农场。 ");
    } else {
      setMessage(`离开${building.name}，回到${activeBuilding === "townhall" || activeBuilding === "museum" ? "清河文化街" : activeBuilding === "farmhouse" ? "农场" : "中心街"}。`);
    }
  };

  const travelHouseStairs = (direction: "up" | "down") => {
    if (stairTravel || !game.upgrades.secondFloor) return;
    setUpstairsRoom(null);
    setAtticStorageOpen(false);
    setSelectedAtticCraft(null);
    setStairTravel(direction);
    setIsWalking(true);
    setFacing("up");
    const later = (delay: number, action: () => void) => {
      const timer = window.setTimeout(action, delay);
      bedtimeTimersRef.current.push(timer);
    };
    if (direction === "up") {
      setIndoorPlayer({ x: 15, y: 69 });
      setMessage("小禾先走到真正的木楼梯脚下。 ");
      later(360, () => { setIndoorPlayer({ x: 13, y: 50 }); setMessage("小禾正一阶一阶踩着木台阶往上走。 "); playTone(470); });
      later(760, () => { setIndoorPlayer({ x: 11, y: 31 }); playTone(560); });
      later(1_120, () => {
        setHouseFloor(2);
        setIndoorPlayer({ x: 14, y: 66 });
        setFacing("right");
        setIsWalking(false);
        setStairTravel(null);
        setMessage("小禾从二楼的楼梯口走出来，来到宽敞的二楼。 ");
        playTone(760);
      });
      return;
    }
    setIndoorPlayer({ x: 14, y: 66 });
    setMessage("小禾走到二楼楼梯口，开始沿着台阶下楼。 ");
    later(360, () => { setIndoorPlayer({ x: 12, y: 48 }); playTone(520); });
    later(760, () => {
      setHouseFloor(1);
      setIndoorPlayer({ x: 12, y: 32 });
      setMessage("小禾已经走到楼梯下半段，一楼的房间出现在眼前。 ");
      playTone(460);
    });
    later(1_120, () => {
      setIndoorPlayer({ x: 16, y: 69 });
      setFacing("right");
      setIsWalking(false);
      setStairTravel(null);
      setMessage("小禾从最后一级台阶走下来，回到农舍一楼。 ");
      playTone(700);
    });
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
    if (!game.ageSkillsLearned.includes("teleport")) {
      setMessage("这张图现在只能查看道路。小禾要到八岁并完成“本人地图瞬移”训练，才能点击地点直接瞬移。 ");
      playTone(230);
      return;
    }
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
    setMessage(`八岁本领发动：小禾本人沿着地图光点，瞬移到了${destinationName}。`);
    playTone(920);
  };

  const useBuildingService = (building: Exclude<BuildingId, "supermarket" | "farmhouse">) => {
    if (building === "clinic") {
      const caregiver = NPC_SICK_DAYS["白医生"]?.includes(game.day) && game.npcHealedDays["白医生"] !== game.day ? "诊所助手" : "白医生";
      if (!game.diagnosed) {
        const diagnosedIllness = game.illness ?? ILLNESS_IDS[absoluteGameDay % ILLNESS_IDS.length];
        setGame((current) => ({ ...current, diagnosed: true, illness: current.sick ? diagnosedIllness : null }));
        setMessage(game.sick ? `${caregiver}完成检查：诊断为“${ILLNESSES[diagnosedIllness].name}”。${ILLNESSES[diagnosedIllness].advice}` : `${caregiver}完成检查：没有生病，不需要开药。 `);
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
      const illnessName = game.illness ? ILLNESSES[game.illness].name : "这次病症";
      setGame((current) => ({ ...current, coins: current.coins - 50, sick: false, diagnosed: false, illness: null, energy: Math.max(80, current.energy) }));
      setMessage(`${caregiver}为${illnessName}开了专用处方药。支付 50 金币后按处方使用，小禾恢复健康了！`);
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
      setTownhallCalendarOpen(true);
      setMessage(`镇公所打开了第 ${game.year} 年全年节日公告：春夏秋冬的 ${FESTIVAL_SCHEDULE.length} 个节日全部写在里面。`);
      playTone(520);
    } else if (building === "workshop") {
      setFestivalDisplay("wood");
      setMessage("免费参观鲁师傅的手工作品：鸟屋、小木马和山谷木雕都摆在展示台上。 ");
      playTone(440);
    } else if (building === "school") {
      if (game.urgentEvent === "assembly" && !game.urgentEventResolved) {
        setSchoolLesson({
          title: "全谷紧急集合说明会",
          pages: [
            "周镇长：今天北林水位和山坡土壤同时出现变化，所有居民先到学校集合，不要单独进山。",
            "白医生：如果有人淋雨、受伤或体力耗尽，要先到诊所检查；不要把游戏药材随便混在一起。",
            "许老师在黑板画出安全路线：文化街向南回中心街，中心街向西回农场，只有通知解除后才能进北林。",
            "居民逐一确认听清。集合结束后，今天的紧急新闻会标记为已经处理，大家再按各自作息离开学校。",
          ],
          step: 0,
          assembly: true,
          attendanceKey: `assembly-${game.year}-${game.season}-${game.day}`,
        });
        setMessage("所有居民已经坐进礼堂。必须听完四段重要说明，紧急集合才算完成。 ");
        playTone(720);
        return;
      }
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
      const lesson = SCHOOL_LESSONS[absoluteGameDay % SCHOOL_LESSONS.length];
      setSchoolLesson({ title: lesson.title, pages: [...lesson.pages], step: 0, assembly: false, attendanceKey });
      setMessage(`许老师开始讲“${lesson.title}”。要一页一页听完四段真实规则，才算完成今天的课。`);
      playTone(700);
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

  const advanceSchoolLesson = () => {
    if (!schoolLesson) return;
    if (schoolLesson.step < schoolLesson.pages.length - 1) {
      const nextStep = schoolLesson.step + 1;
      setSchoolLesson({ ...schoolLesson, step: nextStep });
      setMessage(`许老师翻到第 ${nextStep + 1} 页，同学们继续认真听。`);
      playTone(610 + nextStep * 55);
      return;
    }
    setGame((current) => schoolLesson.assembly ? ({
      ...current,
      urgentEventResolved: true,
      coins: current.coins + 80,
      hour: Math.min(24, current.hour + 1),
      journalEntries: [`${SEASONS[current.season]}第${current.day}天：全谷居民在学校听完紧急集合说明。`, ...current.journalEntries].slice(0, 40),
    }) : ({
      ...current,
      coins: current.coins + 50,
      hour: Math.min(24, current.hour + 2),
      lastSchoolAttendance: schoolLesson.attendanceKey,
      journalEntries: [`${SEASONS[current.season]}第${current.day}天：在学校学完“${schoolLesson.title}”。`, ...current.journalEntries].slice(0, 40),
    }));
    setMessage(schoolLesson.assembly ? "四段重要说明全部听完，紧急集合完成，获得 80 金币帮助奖励。" : `“${schoolLesson.title}”四段课程全部听完，获得 50 金币学习奖励。`);
    setSchoolLesson(null);
    playTone(940);
  };

  const inspectBuildingItem = (item: string) => {
    if (item === "节日公告") {
      setTownhallCalendarOpen(true);
      setInspectedItem(null);
      setMessage(`打开全年节日公告栏：共 ${FESTIVAL_SCHEDULE.length} 个节日，每张公告都写着日期、地点和活动内容。`);
      playTone(620);
      return;
    }
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
    const shippedQualityBonus = cropQualityBonus(game.shippingCropQualityStock);
    const shippedEarnings = Math.round((shippedBaseEarnings + shippedQualityBonus) * (game.upgrades.storage ? 1.1 : 1));
    const nextDayNumber = game.day === 28 ? 1 : game.day + 1;
    const nextSeason = game.day === 28 ? (game.season + 1) % SEASONS.length : game.season;
    const nextYear = game.day === 28 && game.season === SEASONS.length - 1 ? game.year + 1 : game.year;
    const nextWeather = weatherForDate(nextYear, nextSeason, nextDayNumber);
    const rainyMorning = nextWeather === "rain" || nextWeather === "thunder";
    const expiringTools = [
      game.toolUpgrades.axe && game.toolUpgradeDays.axe <= 1 ? "精铁斧头" : "",
      game.toolUpgrades.rod && game.toolUpgradeDays.rod <= 1 ? "幸运鱼竿" : "",
      game.toolUpgrades.pickaxe && game.toolUpgradeDays.pickaxe <= 1 ? "金铁镐子" : "",
    ].filter(Boolean);
    const daysSinceIllness = game.lastIllnessDay === 0
      ? nextDayNumber
      : (nextDayNumber - game.lastIllnessDay + 28) % 28;
    const becameSick = !game.sick && (game.energy <= 0 || (daysSinceIllness >= 6 && nextDayNumber % 6 === 0));
    const remainsSick = game.sick || becameSick;
    const nextIllness: IllnessId | null = game.sick
      ? game.illness ?? "valleyCold"
      : becameSick
        ? game.energy <= 0 ? "overwork" : ILLNESS_IDS[((nextYear - 1) * 112 + nextSeason * 28 + nextDayNumber) % ILLNESS_IDS.length]
        : null;
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
    const petBirthTypes = PET_CATALOG.filter((pet) => {
      const sameType = game.pets.filter((ownedPet) => ownedPet.type === pet.id);
      const hasPair = sameType.some((ownedPet) => ownedPet.sex === "男生") && sameType.some((ownedPet) => ownedPet.sex === "女生");
      const lastBirthYear = game.lastPetBirthYears[pet.id];
      const familyStartYear = Math.max(0, ...sameType.filter((ownedPet) => !ownedPet.id.includes("-baby-")).map((ownedPet) => ownedPet.bornYear ?? 1));
      const yearsTogether = lastBirthYear ? nextYear - lastBirthYear : nextYear - familyStartYear + 1;
      return hasPair && yearsTogether >= 5;
    });
    const petBirthMessage = petBirthTypes.length ? ` 农舍旁传来小小的叫声：${petBirthTypes.map((pet) => pet.name).join("、")}家庭生活满五年，生下了一只小宝宝！` : "";
    const nextAbsoluteDay = (nextYear - 1) * 112 + nextSeason * 28 + nextDayNumber;
    const nextUrgentEvent: UrgentEventKind | null = nextAbsoluteDay % 31 === 9
      ? "assembly"
      : nextAbsoluteDay % 19 === 5
      ? "fire"
      : nextAbsoluteDay % 23 === 7
        ? "theft"
        : nextAbsoluteDay % 29 === 11
          ? "injury"
          : null;
    const missedUrgentMessage = game.urgentEvent && !game.urgentEventResolved ? " 昨天的紧急事件没有及时处理，救援人员已经接手，今天无法再领取帮助奖励。" : "";
    const dreamChoices = DREAM_STORIES.map((_, index) => index).filter((index) => index !== game.lastDreamVariant && index % 16 !== game.lastDreamVariant % 16);
    const dreamTonight = nextAbsoluteDay - game.lastDreamAbsoluteDay >= 5 && Math.random() < .14
      ? dreamChoices[Math.floor(Math.random() * dreamChoices.length)] ?? 0
      : null;
    const allPetsFed = game.pets.length > 0 && game.petFood >= game.pets.length;
    const featherGain = allPetsFed && nextAbsoluteDay % 2 === 0 ? game.pets.filter((pet) => pet.type === "chick" || pet.type === "duck").length : 0;
    const softFurGain = allPetsFed && nextAbsoluteDay % 3 === 0 ? game.pets.filter((pet) => pet.type === "rabbit").length : 0;
    const petFishGain = allPetsFed && nextAbsoluteDay % 4 === 0 ? game.pets.filter((pet) => pet.type === "cat").length : 0;
    const petCoinGain = allPetsFed && nextAbsoluteDay % 5 === 0 ? game.pets.filter((pet) => pet.type === "dog").length * 12 : 0;
    const petSeedGain = allPetsFed && nextAbsoluteDay % 4 === 1 ? game.pets.filter((pet) => pet.type === "hamster").length : 0;
    const healthyUnprotectedPets = game.pets.filter((pet) => !game.sickPetIds.includes(pet.id) && pet.id !== game.missingPetId && !game.animalRaincoatAssignments.includes(pet.id));
    const healthyRaincoatPets = game.pets.filter((pet) => !game.sickPetIds.includes(pet.id) && pet.id !== game.missingPetId && game.animalRaincoatAssignments.includes(pet.id));
    const healthyPetCandidates = healthyUnprotectedPets.length ? healthyUnprotectedPets : nextAbsoluteDay % 37 === 0 ? healthyRaincoatPets : [];
    const newlySickPet = healthyPetCandidates.length && nextAbsoluteDay - game.lastPetIllnessAbsoluteDay >= 8 && nextAbsoluteDay % 11 === 0 ? healthyPetCandidates[nextAbsoluteDay % healthyPetCandidates.length] : null;
    const wanderCandidates = game.pets.filter((pet) => (pet.type === "rabbit" || pet.type === "dog") && !game.sickPetIds.includes(pet.id));
    const newlyMissingPet = !game.missingPetId && wanderCandidates.length && nextAbsoluteDay % 31 === 0 ? wanderCandidates[nextAbsoluteDay % wanderCandidates.length] : null;
    const exploringChick = game.pets.some((pet) => pet.type === "chick") && nextAbsoluteDay % 23 === 0;
    const chickTreasure = exploringChick ? (["bone", "wood", "food"] as const)[nextAbsoluteDay % 3] : null;
    const petCareMessage = !game.pets.length ? "" : !allPetsFed ? ` 宠物粮不够了：${game.pets.length} 只宠物每晚需要 ${game.pets.length} 份粮，可以去远方新区商场买平价宠物粮。` : ` 宠物们睡前吃掉了 ${game.pets.length} 份粮。${featherGain ? `留下 ${featherGain} 根羽毛；` : ""}${softFurGain ? `兔子留下 ${softFurGain} 团软毛；` : ""}${petFishGain ? `猫带回 ${petFishGain} 条鱼；` : ""}${petCoinGain ? `狗找到 ${petCoinGain} 金币；` : ""}${petSeedGain ? `仓鼠翻出 ${petSeedGain} 颗萝卜种子；` : ""}`;
    const petHealthMessage = newlySickPet ? ` ${PET_CATALOG.find((pet) => pet.id === newlySickPet.type)?.name}今天生病了，颜色变灰、眼睛垂下来。可以用药材治疗或带去新区宠物医院。` : "";
    const rarePetMessage = newlyMissingPet ? ` 很少见的小意外发生了：${PET_CATALOG.find((pet) => pet.id === newlyMissingPet.type)?.name}跑进青禾山洞里躲着吃东西，去山洞找到它并抱回来吧。` : chickTreasure ? ` 小鸡隔了很久出去探险，今天叼回了${chickTreasure === "bone" ? "一块小骨头" : chickTreasure === "wood" ? "两块木头" : "三份宠物粮"}！` : "";
    const helperCandidates = [...YOUNG_FRIENDS];
    const farmHelperToday = helperCandidates[nextAbsoluteDay % helperCandidates.length];
    const helperPlantIndexes = farmHelperToday ? game.tiles.map((tile, index) => tile.state === "soil" ? index : -1).filter((index) => index >= 0).slice(0, Math.min(2, game.seeds)) : [];
    const helperWaterIndexes = farmHelperToday ? game.tiles.map((tile, index) => tile.state === "crop" && index !== eatenCropIndex && index !== lightningCropIndex ? index : -1).filter((index) => index >= 0).slice(0, 6) : [];
    const helperGiftSeeds = farmHelperToday && helperPlantIndexes.length === 0 && helperWaterIndexes.length === 0 ? 2 : 0;
    const farmHelperMessage = farmHelperToday ? helperWaterIndexes.length || helperPlantIndexes.length
      ? ` ${farmHelperToday}清早轮流来帮忙，给 ${helperWaterIndexes.length} 株作物浇水施肥${helperPlantIndexes.length ? `，还亲手播下了 ${helperPlantIndexes.length} 颗萝卜种子` : ""}。这些变化已经真实留在田里。`
      : ` ${farmHelperToday}清早来帮忙，但田里暂时没有能浇或能播的地，于是整理了农具，并留下 2 颗萝卜种子。`
      : "";
    const morningNews = dailyNewsForState({
      ...game,
      year: nextYear,
      season: nextSeason,
      day: nextDayNumber,
      weather: nextWeather,
      missingPetId: newlyMissingPet?.id ?? game.missingPetId,
      sickPetIds: newlySickPet ? [...game.sickPetIds, newlySickPet.id] : game.sickPetIds,
      urgentEvent: nextUrgentEvent,
      urgentEventDay: nextUrgentEvent ? nextAbsoluteDay : 0,
      urgentEventResolved: false,
    });
    const newsMessage = ` ${morningNews.urgent ? "紧急新闻" : "今日新闻"}：${morningNews.text}`;
    const morningMessageBase = becameSick
      ? "早上七点醒来，小禾看起来没什么精神，嘴角变成了伤心的样子。"
      : remainsSick
        ? "早上七点了，小禾的表情仍然有些伤心。"
        : `早上七点了！${game.day === 28 ? `新的${SEASONS[nextSeason]}开始了。` : ""}浇过水的作物和松果树苗都长大了一点。`;
    const birthdayMessage = nextSeason === 0 && nextDayNumber === 19 ? ` 今天是第 ${nextYear} 年春天第十九天，也是小禾的二月十九日生日！大家已经带着蛋糕来到农舍，回家就能开生日派对。` : "";
    const shippingMessage = shippedItemCount > 0 ? ` 昨晚大号售卖箱卖出了 ${shippedItemCount} 件东西，赚到 ${shippedEarnings} 金币！${shippedQualityBonus ? `星级作物多赚了 ${shippedQualityBonus} 金币。` : ""}` : "";
    const weatherMessage = nextWeather === "sunny" ? " 今天阳光很好。" : nextWeather === "cloudy" ? " 今天是阴天，云层把太阳遮住了。" : nextWeather === "rain" ? " 今天下雨，农田和树苗会自动浇水。" : " 今天有雷雨，天空偶尔会打雷闪电，出门记得撑伞。";
    const morningMessage = `${expiringTools.length ? `${morningMessageBase} ${expiringTools.join("和")}的一周使用期到了，已经恢复成普通工具。` : morningMessageBase}${weatherMessage}${newsMessage}${missedUrgentMessage}${shippingMessage}${visitorMessage}${lightningMessage}${farmHelperMessage}${petBirthMessage}${petCareMessage}${petHealthMessage}${rarePetMessage}${birthdayMessage}`;
    setShippingReport(shippedItemCount > 0 ? { itemCount: shippedItemCount, earnings: shippedEarnings } : null);
    setGame((current) => {
      const treeStates = [...current.treeStates];
      const emptySpot = treeStates.indexOf(false);
      if (emptySpot >= 0) treeStates[emptySpot] = true;
      const rockStates = [...current.rockStates];
      const emptyRock = rockStates.indexOf(false);
      if (emptyRock >= 0) rockStates[emptyRock] = true;
      const caveDiamondStates = [...current.caveDiamondStates];
      const emptyDiamondVein = caveDiamondStates.indexOf(false);
      if (emptyDiamondVein >= 0) caveDiamondStates[emptyDiamondVein] = true;
      const caveDiamondSpots = [0, 1, 2].map((index) => (nextAbsoluteDay * 2 + index * 5) % CAVE_DIAMOND_SPOTS.length);
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
        pickaxe: current.toolUpgrades.pickaxe ? Math.max(0, current.toolUpgradeDays.pickaxe - 1) : 0,
      };
      const toolUpgrades = {
        ...current.toolUpgrades,
        axe: toolUpgradeDays.axe > 0,
        rod: toolUpgradeDays.rod > 0,
        pickaxe: toolUpgradeDays.pickaxe > 0,
      };
      const greenhouseAutoDay = Boolean(current.upgrades.greenhouse) && current.day % 2 === 0;
      const lastPetBirthYears = { ...current.lastPetBirthYears };
      const pets = [...current.pets];
      petBirthTypes.forEach((pet, index) => {
        pets.push({ id: `${pet.id}-baby-${nextYear}-${index}`, type: pet.id, sex: (nextYear + index) % 2 ? "女生" : "男生", bornDay: nextDayNumber, bornSeason: nextSeason, bornYear: nextYear });
        lastPetBirthYears[pet.id] = nextYear;
      });
      return {
        ...current,
        year: nextYear,
        day: nextDayNumber,
        season: nextSeason,
        weather: nextWeather,
        urgentEvent: nextUrgentEvent,
        urgentEventDay: nextUrgentEvent ? nextAbsoluteDay : 0,
        urgentEventResolved: false,
        journalEntries: [`第${nextYear}年${SEASONS[nextSeason]}第${nextDayNumber}天：${nextWeather === "sunny" ? "晴朗" : nextWeather === "cloudy" ? "阴天" : nextWeather === "rain" ? "下雨" : "雷雨"}，小禾早上七点醒来。${shippedItemCount ? `售卖箱收入 ${shippedEarnings} 金币。` : ""}`, ...current.journalEntries].slice(0, 40),
        seasonExcursionCompleted: game.day === 28 ? false : current.seasonExcursionCompleted,
        hour: 7,
        shippingBin: {},
        shippingCropQualityStock: makeCropQualityStock(),
        daily: { ...makeNewGame().daily, day: nextDayNumber, planted: helperPlantIndexes.length, watered: helperWaterIndexes.length },
        planted: current.planted + helperPlantIndexes.length,
        wateredCount: current.wateredCount + helperWaterIndexes.length,
        energy: remainsSick ? 65 : 100,
        sick: remainsSick,
        diagnosed: false,
        illness: nextIllness,
        rainExposure: 0,
        animalRainExposure: 0,
        showerBuff: current.showeredBeforeBed,
        showeredBeforeBed: false,
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
        seeds: Math.max(0, current.seeds - helperPlantIndexes.length) + petSeedGain + helperGiftSeeds,
        inventory: { ...current.inventory, fish: current.inventory.fish + petFishGain },
        coins: current.coins + shippedEarnings + petCoinGain,
        sickPetIds: newlySickPet && !current.sickPetIds.includes(newlySickPet.id) ? [...current.sickPetIds, newlySickPet.id] : current.sickPetIds,
        lastPetIllnessAbsoluteDay: newlySickPet ? nextAbsoluteDay : current.lastPetIllnessAbsoluteDay,
        missingPetId: newlyMissingPet?.id ?? current.missingPetId,
        lastDreamAbsoluteDay: dreamTonight === null ? current.lastDreamAbsoluteDay : nextAbsoluteDay,
        lastDreamVariant: dreamTonight === null ? current.lastDreamVariant : dreamTonight,
        farmVisitor,
        farmHelperToday,
        treeStates,
        plantedTrees: current.plantedTrees.map((tree) => ({ ...tree, stage: tree.watered ? Math.min(3, tree.stage + 1) : tree.stage, watered: rainyMorning })),
        rockStates,
        caveDiamondStates,
        caveDiamondSpots,
        groundBooks,
        groundArtifacts,
        groundSupplies,
        tiles: current.tiles.map((tile, index) => {
          if (index === eatenCropIndex || index === lightningCropIndex) return { state: "soil", stage: 0, watered: false, care: 0 };
          if (helperPlantIndexes.includes(index)) return { state: "crop", stage: 0, watered: true, cropType: "radish", care: 1 };
          if (tile.state === "crop") {
            const helped = helperWaterIndexes.includes(index);
            return { ...tile, stage: Math.min(3, tile.stage + (tile.watered ? (current.upgrades.greenhouse ? 2 : 1) : greenhouseAutoDay ? 1 : 0)), watered: rainyMorning || helped, care: (tile.care ?? 0) + (rainyMorning || helped ? 1 : 0) };
          }
          return tile;
        }),
      };
    });
    setDreamScene(dreamTonight);
    if (dreamTonight !== null) {
      setDreamPhase("inside");
      setDreamSurreal(false);
      setDreamOddity(0);
      setDreamOdditySteps(0);
      setDreamPlayer({ x: 48, y: 70 });
    }
    if (dreamTonight === null && morningNews.urgent) setNewsBroadcast({ news: morningNews, automatic: true, channel: "news", forecast: "紧急事件需要在今天结束前赶到现场处理" });
    setMessage(dreamTonight === null ? morningMessage : "夜里，小禾做了一个非常不真实的梦……");
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
    setBedtimePhase("walkingHome");
    setIsWalking(true);
    setMessage("天晚了。场景不会换成小动画，小禾会从现在的位置一步步走回农舍。 ");
    playTone(380);
    const later = (delay: number, action: () => void) => {
      const timer = window.setTimeout(action, delay);
      bedtimeTimersRef.current.push(timer);
    };
    const tuckIntoBed = (delay: number) => {
      later(delay, () => {
        setScene("farm");
        setActiveBuilding("farmhouse");
        setHouseFloor(1);
        setUpstairsRoom(null);
        setIndoorPlayer({ x: 12, y: 70 });
        setFacing("left");
        setIsWalking(false);
        setBedtimePhase("tuckedIn");
        setMessage("小禾走到床边、爬上床，被子自动盖好了。晚安……");
      });
      later(delay + 1_250, () => {
        nextDay();
        setScene("farm");
        setActiveBuilding("farmhouse");
        setHouseFloor(1);
        setIndoorPlayer({ x: 12, y: 70 });
        setBedtimePhase("waking");
      });
    };

    if (activeBuilding === "farmhouse") {
      if (houseFloor === 2) {
        later(300, () => { setUpstairsRoom(null); setIndoorPlayer({ x: 18, y: 70 }); setFacing("left"); setMessage("小禾先从二楼房间走到楼梯口。 "); });
        later(850, () => { setHouseFloor(1); setIndoorPlayer({ x: 72, y: 70 }); setFacing("left"); setMessage("小禾沿楼梯回到一楼，正在走向床边。 "); });
        later(1_250, () => setIndoorPlayer({ x: 34, y: 70 }));
        tuckIntoBed(1_700);
      } else {
        later(350, () => { setIndoorPlayer({ x: 42, y: 70 }); setFacing("left"); });
        tuckIntoBed(950);
      }
      return;
    }

    const insideSomewhere = Boolean(activeBuilding || neighborInterior || residentHome || friendHomeOpen || farmInterior);
    let routeStart = 0;
    if (insideSomewhere) {
      setFacing("right");
      setIndoorPlayer((current) => ({ ...current, x: 78 }));
      setMessage("小禾正从当前房间走向出口。 ");
      later(650, () => {
        setNeighborInterior(null); setResidentHome(null); setFriendHomeOpen(false); setFarmInterior(null); setActiveBuilding(null);
        setMessage("小禾已经走出门，继续沿原来的道路回农舍。 ");
      });
      routeStart = 700;
    }

    if (scene !== "farm") {
      later(routeStart + 150, () => { setFacing("left"); setPlayer({ x: 2, y: 5 }); setMessage("小禾正在当前场景的道路上走向农场方向。 "); });
      later(routeStart + 750, () => { setPlayer({ x: 0, y: 5 }); });
      later(routeStart + 1_100, () => { setScene("farm"); setPlayer({ x: 1, y: 5 }); setFacing("right"); setMessage("小禾走回青禾农场，农舍就在前面。 "); });
      routeStart += 1_100;
    }
    later(routeStart + 300, () => { setPlayer({ x: 4, y: 5 }); setFacing("right"); });
    later(routeStart + 750, () => { setPlayer({ x: 8, y: 4 }); setMessage("小禾沿农场小路走到农舍门口。 "); });
    later(routeStart + 1_150, () => { setActiveBuilding("farmhouse"); setHouseFloor(1); setIndoorPlayer({ x: 72, y: 70 }); setFacing("left"); setMessage("小禾推门进屋，正在走向自己的床。 "); });
    tuckIntoBed(routeStart + 1_850);
  };

  const completeAgeTraining = (skillId: AgeSkillId) => {
    const skill = AGE_SKILLS.find((item) => item.id === skillId);
    if (!skill || game.ageSkillsLearned.includes(skillId)) {
      setAgeTraining(null);
      return;
    }
    setGame((current) => {
      if (current.ageSkillsLearned.includes(skillId)) return current;
      const next: GameState = {
        ...current,
        ageSkillsLearned: [...current.ageSkillsLearned, skillId],
        journalEntries: [`${SEASONS[current.season]}第${current.day}天：${current.playerAge}岁的小禾经过完整练习，学会了“${skill.name}”。`, ...current.journalEntries].slice(0, 40),
      };
      if (skillId === "trail") {
        next.herbs += 2;
        next.pinecones += 2;
      } else if (skillId === "shelter") {
        next.energy = 100;
        next.water = next.toolUpgrades.water ? 18 : 9;
      } else if (skillId === "hybrid") {
        next.strawberrySeeds += 1;
        next.watermelonSeeds += 1;
        next.cornSeeds += 1;
        next.pumpkinSeeds += 1;
      } else if (skillId === "echo") {
        next.diamonds += 1;
      }
      return next;
    });
    setAgeTraining(null);
    setAgeTrainingHeldPart(null);
    setMessage(`真正学会“${skill.name}”了！${skill.benefit}`);
    playTone(980);
  };

  const startWorldTrailExpedition = () => {
    if (!game.ageSkillsLearned.includes("trail")) {
      setMessage("先在两岁成长手册里完成林间循迹训练。 ");
      return;
    }
    if (activeBuilding || farmInterior || neighborInterior || residentHome || friendHomeOpen || ananBeachOpen) {
      setMessage("林间脚印只会出现在户外地面。先离开房间、山洞或海滩，再打开成长手册使用。 ");
      playTone(230);
      return;
    }
    const abilityDay = `${game.year}-${game.season}-${game.day}`;
    if (game.lastAgeAbilityDays.trail === abilityDay) {
      setMessage("今天的林间踪迹已经走完了。地面需要一夜时间才会留下新的脚印。 ");
      playTone(330);
      return;
    }
    const routeIndex = currentAbsoluteDay() % AGE_WORLD_TRAIL_ROUTES.length;
    setTrailExpedition({ routeIndex, step: 0, mistakes: 0 });
    setAgeBookOpen(false);
    setAgeTraining(null);
    setMessage("林间循迹已经在主世界开始：看屏幕上的五枚脚印，用方向键或平板方向键亲自走。走错不会传送，也不会直接完成。 ");
    playTone(760);
  };

  const deployLearnedShelter = () => {
    if (!game.ageSkillsLearned.includes("shelter")) {
      setMessage("先在三岁成长手册里完成独立搭营训练。 ");
      return;
    }
    if (activeBuilding || farmInterior || neighborInterior || residentHome || friendHomeOpen || ananBeachOpen || residentOuting) {
      setMessage("要先走到普通户外空地，才能真正展开随身帐篷。房间、山洞、旅行场地里不能硬塞帐篷。 ");
      playTone(230);
      return;
    }
    setAgeBookOpen(false);
    setAgeTraining(null);
    setFarmInterior("camp");
    setIndoorPlayer({ x: 32, y: 72 });
    setMessage("小禾在当前位置展开学会的帐篷，钻进门帘后可以在睡袋里睡到第二天；出去时仍会回到刚才的户外地点。 ");
    playTone(820);
  };

  const startWorldHybridLab = () => {
    if (!game.ageSkillsLearned.includes("hybrid")) {
      setMessage("先在四岁成长手册里完成四季育种观察训练。 ");
      return;
    }
    const abilityDay = `${game.year}-${game.season}-${game.day}`;
    if (game.lastAgeAbilityDays.hybrid === abilityDay) {
      setMessage(`今天的育种粉已经调好了，背包里还剩 ${game.hybridSeedCharges} 份。明天可以再做一批。`);
      playTone(330);
      return;
    }
    const available = CROP_TYPES.filter((crop) => game[CROP_INFO[crop].seedField] > 0);
    if (available.length < 2) {
      setMessage("四季育种需要两种不同的种子各 1 颗。先去超市买齐至少两种种子。 ");
      playTone(220);
      return;
    }
    hybridBrushDistanceRef.current = 0;
    hybridBrushDoneRef.current = false;
    setHybridHeldSeed(null);
    setHybridLab({ parents: [], balance: 50, pollination: 0, mistakes: 0 });
    setAgeBookOpen(false);
    setAgeTraining(null);
    setMessage("育种台摆好了：先把两种不同的种子分别放进亲本盆，再按当前天气调温，最后亲手来回授粉。 ");
    playTone(720);
  };

  const addHybridParent = (crop: CropType) => {
    if (!hybridLab) return;
    if (game[CROP_INFO[crop].seedField] <= 0) {
      setMessage(`${CROP_INFO[crop].name}种子已经没有了。`);
      return;
    }
    if (hybridLab.parents.includes(crop)) {
      setMessage("两个亲本必须是不同种子，才能产生新的育种粉。 ");
      setHybridLab({ ...hybridLab, mistakes: hybridLab.mistakes + 1 });
      playTone(210);
      return;
    }
    if (hybridLab.parents.length >= 2) {
      setMessage("两个亲本盆已经放满了。可以点盆里的种子取回，再重新选择。 ");
      return;
    }
    const nextParents = [...hybridLab.parents, crop];
    setHybridLab({ ...hybridLab, parents: nextParents });
    setHybridHeldSeed(null);
    setMessage(`把${CROP_INFO[crop].name}种子放进第 ${nextParents.length} 个亲本盆。${nextParents.length === 2 ? "现在根据天气调节温度刻度。" : "还需要另一种不同种子。"}`);
    playTone(560 + nextParents.length * 80);
  };

  const removeHybridParent = (crop: CropType) => {
    if (!hybridLab) return;
    setHybridLab({ ...hybridLab, parents: hybridLab.parents.filter((parent) => parent !== crop), pollination: 0 });
    hybridBrushDistanceRef.current = 0;
    setMessage(`把${CROP_INFO[crop].name}种子从亲本盆取回，没有消耗。`);
  };

  const beginHybridPollination = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!hybridLab || hybridLab.parents.length < 2) {
      setMessage("先把两种不同的种子放进两个亲本盆。 ");
      playTone(210);
      return;
    }
    const target = HYBRID_WEATHER_BALANCE[game.weather];
    if (Math.abs(hybridLab.balance - target) > 6) {
      setHybridLab({ ...hybridLab, mistakes: hybridLab.mistakes + 1, pollination: 0 });
      setMessage(`温度不合适，花粉没有黏住。观察${WEATHER_INFO[game.weather].name}天气，把刻度调到发亮区域再试。`);
      playTone(190);
      return;
    }
    hybridBrushActiveRef.current = true;
    hybridBrushLastPointRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setMessage("按住授粉刷，在两朵花之间来回移动；移动距离不够不会自动完成。 ");
  };

  const moveHybridPollination = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!hybridLab || !hybridBrushActiveRef.current || !hybridBrushLastPointRef.current || hybridBrushDoneRef.current) return;
    const previous = hybridBrushLastPointRef.current;
    const distance = Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
    hybridBrushLastPointRef.current = { x: event.clientX, y: event.clientY };
    if (distance > 70) return;
    hybridBrushDistanceRef.current += distance;
    const progress = Math.min(100, Math.round(hybridBrushDistanceRef.current / 2.4));
    setHybridLab({ ...hybridLab, pollination: progress });
    if (progress < 100) return;
    hybridBrushDoneRef.current = true;
    hybridBrushActiveRef.current = false;
    const [first, second] = hybridLab.parents;
    setHybridLab(null);
    setHybridHeldSeed(null);
    setGame((current) => {
      const firstField = CROP_INFO[first].seedField;
      const secondField = CROP_INFO[second].seedField;
      if (current[firstField] <= 0 || current[secondField] <= 0) return current;
      const abilityDay = `${current.year}-${current.season}-${current.day}`;
      return {
        ...current,
        [firstField]: current[firstField] - 1,
        [secondField]: current[secondField] - 1,
        hybridSeedCharges: current.hybridSeedCharges + 3,
        lastAgeAbilityDays: { ...current.lastAgeAbilityDays, hybrid: abilityDay },
        journalEntries: [`${SEASONS[current.season]}第${current.day}天：把${CROP_INFO[first].name}和${CROP_INFO[second].name}完成温度配比与往返授粉，制成3份四季育种粉。`, ...current.journalEntries].slice(0, 40),
      };
    });
    setMessage(`授粉完成！消耗 1 颗${CROP_INFO[first].name}种子和 1 颗${CROP_INFO[second].name}种子，制成 3 份四季育种粉。以后亲手播种时会自动给前三株作物使用。`);
    playTone(980);
  };

  const endHybridPollination = () => {
    hybridBrushActiveRef.current = false;
    hybridBrushLastPointRef.current = null;
  };

  const startWorldEchoSurvey = () => {
    if (!game.ageSkillsLearned.includes("echo")) {
      setMessage("先在五岁成长手册里完成听石寻晶训练。 ");
      return;
    }
    if (farmInterior !== "cave") {
      setMessage("听石寻晶要在真正的青禾山洞里使用。走进山洞并点亮火把后，再点击山洞下方的“听石寻晶”。 ");
      playTone(240);
      return;
    }
    if (!interiorFireLit) {
      setMessage("山洞太暗，先用火柴点亮火把，才能一边听回声一边确认岩壁位置。 ");
      playTone(220);
      return;
    }
    const abilityDay = `${game.year}-${game.season}-${game.day}`;
    if (game.lastAgeAbilityDays.echo === abilityDay) {
      setMessage("今天已经听出一条隐藏矿脉了。岩壁的回声要到明天才会重新变化。 ");
      playTone(330);
      return;
    }
    setAgeEchoPulse(6);
    ageEchoDirectionRef.current = 1;
    setEchoSurvey({ hits: 0, misses: 0 });
    setAgeBookOpen(false);
    setMessage("山洞安静下来。看光点来回移动，进入绿色回声区时亲手敲击；连续听准三处才能定位真正的隐藏矿脉。 ");
    playTone(680);
  };

  const strikeWorldEcho = () => {
    if (!echoSurvey) return;
    if (ageEchoPulse < 43 || ageEchoPulse > 57) {
      setEchoSurvey({ ...echoSurvey, misses: echoSurvey.misses + 1 });
      setMessage("只听见沉闷的石声——敲早了或敲晚了。等移动光点进入绿色回声区。 ");
      playTone(180);
      return;
    }
    const nextHits = echoSurvey.hits + 1;
    setAgeEchoPulse(6);
    ageEchoDirectionRef.current = 1;
    if (nextHits < 3) {
      setEchoSurvey({ ...echoSurvey, hits: nextHits });
      setMessage(`听准了第 ${nextHits}/3 层回声！岩壁深处还有一层更细的晶石声。`);
      playTone(620 + nextHits * 70);
      return;
    }
    setEchoSurvey(null);
    setSelected("pickaxe");
    setGame((current) => {
      const hiddenSpots = CAVE_DIAMOND_SPOTS.map((spot, index) => spot.hidden ? index : -1).filter((index) => index >= 0);
      const veinIndex = current.caveDiamondStates.findIndex((standing) => !standing);
      const targetVein = veinIndex >= 0 ? veinIndex : (current.year + current.day) % current.caveDiamondStates.length;
      const spotIndex = hiddenSpots[((current.year - 1) * 112 + current.season * 28 + current.day + current.diamonds) % hiddenSpots.length];
      return {
        ...current,
        energy: Math.max(0, current.energy - staminaCost(current, 5)),
        caveDiamondStates: current.caveDiamondStates.map((standing, index) => index === targetVein ? true : standing),
        caveDiamondSpots: current.caveDiamondSpots.map((spot, index) => index === targetVein ? spotIndex : spot),
        lastAgeAbilityDays: { ...current.lastAgeAbilityDays, echo: `${current.year}-${current.season}-${current.day}` },
        journalEntries: [`${SEASONS[current.season]}第${current.day}天：在山洞亲手听准三层回声，定位出一条藏在岩石后的钻石矿脉。`, ...current.journalEntries].slice(0, 40),
      };
    });
    setMessage("第三层清脆回声连成一条线：一处隐藏钻石矿已经在岩石后显出蓝色尖角！镐子已经拿好，要亲自走近矿脉再挖。 ");
    playTone(1020);
  };

  const beginAgeTraining = (skillId: AgeSkillId) => {
    const skill = AGE_SKILLS.find((item) => item.id === skillId)!;
    if (game.playerAge < skill.age) {
      setMessage(`小禾现在 ${game.playerAge} 岁，还不能做 ${skill.age} 岁才学的“${skill.name}”。要等春天第十九日过完生日、真正长大以后。`);
      playTone(220);
      return;
    }
    if (game.ageSkillsLearned.includes(skillId)) {
      if (skillId === "trail") {
        setAgeBookOpen(false);
        setMessage("灵巧采集正在永久生效：以后双击捡起地上的种子、药材和食物，都会一次获得双份。 ");
        playTone(720);
        return;
      }
      if (skillId === "shelter") {
        setAgeBookOpen(false);
        setMessage("省力农具正在永久生效：锄地、播种、浇水、收获、砍树和挖矿，每次都会少消耗 1 点体力。 ");
        playTone(720);
        return;
      }
      if (skillId === "hybrid") {
        setAgeBookOpen(false);
        setMessage("丰收巧手正在永久生效：成熟作物每次多收 1 份，还会多返还 1 颗同类种子。 ");
        playTone(760);
        return;
      }
      if (skillId === "echo") {
        startWorldEchoSurvey();
        return;
      }
      if (skillId === "clone") {
        setCloneWorkOpen(true);
        setMessage("打开分身工作台。选择一项工作，另一个小禾会穿墙瞬移过去自动完成。 ");
        playTone(820);
        return;
      }
      if (skillId === "teleport") {
        setAgeBookOpen(false);
        setMapOpen(true);
        setMessage("本人瞬移地图打开了：点击一个真实地点，小禾本人会立即瞬移过去。 ");
        playTone(920);
        return;
      }
      setMessage(`小禾已经学会“${skill.name}”了，这项能力已经永久记录在成长手册里。`);
      playTone(640);
      return;
    }
    setAgeTraining({ skill: skillId, progress: 0, mistakes: 0 });
    setAgeTrainingHeldPart(null);
    setAgeEchoPulse(6);
    ageEchoDirectionRef.current = 1;
    setMessage(`开始练习“${skill.name}”。这不是一键领取，要亲手完成全部 ${skill.required} 段。`);
    playTone(680);
  };

  const advanceAgeTraining = () => {
    if (!ageTraining) return;
    const skill = AGE_SKILLS.find((item) => item.id === ageTraining.skill)!;
    const next = ageTraining.progress + 1;
    if (next >= skill.required) {
      completeAgeTraining(ageTraining.skill);
      return;
    }
    setAgeTraining({ ...ageTraining, progress: next });
    setMessage(`“${skill.name}”已经完成 ${next}/${skill.required} 段，继续观察下一段。`);
    playTone(470 + next * 55);
  };

  const trainAgeClone = (signal: string) => {
    if (ageTraining?.skill !== "clone") return;
    const route = AGE_CLONE_ROUTES[ageTraining.progress];
    if (!route) return;
    if (signal !== route.signal) {
      setAgeTraining({ ...ageTraining, mistakes: ageTraining.mistakes + 1 });
      setMessage(`分身撞在了障碍前，${signal}不能通往${route.destination}。重新观察墙上的落点标记。`);
      playTone(220);
      return;
    }
    setMessage(`落点正确！分身穿过墙壁，瞬移到了${route.destination}。`);
    advanceAgeTraining();
  };

  const trainAgeTeleport = (signal: string) => {
    if (ageTraining?.skill !== "teleport") return;
    const route = AGE_CLONE_ROUTES[ageTraining.progress];
    if (!route) return;
    if (signal !== route.signal) {
      setAgeTraining({ ...ageTraining, mistakes: ageTraining.mistakes + 1 });
      setMessage(`${signal}不是通往${route.destination}的安全落点。本人不能冒险传送，重新核对目的地纹样。`);
      playTone(220);
      return;
    }
    setMessage(`目的地与落点完全一致！小禾本人安全瞬移到了${route.destination}。`);
    advanceAgeTraining();
  };

  const dispatchCloneWork = (kind: CloneWorkKind, crop?: CropType, person?: string) => {
    if (!game.ageSkillsLearned.includes("clone")) {
      setMessage("要先在七岁成长手册里完成“分身穿墙瞬移”的五段训练。 ");
      playTone(220);
      return;
    }
    if (cloneMission) {
      setMessage(`分身正在${cloneMission.destination}${cloneMission.label}，等她回来再安排下一件事。`);
      return;
    }
    const cropInfo = crop ? CROP_INFO[crop] : null;
    const noTarget = kind === "water" ? !game.tiles.some((tile) => tile.state === "crop" && !tile.watered)
      : kind === "fertilize" ? !game.tiles.some((tile) => tile.state === "crop")
      : kind === "plant" ? !cropInfo || game[cropInfo.seedField] <= 0 || !game.tiles.some((tile) => tile.state === "soil")
      : kind === "mineDiamond" ? !game.caveDiamondStates.some(Boolean)
      : kind === "chopWood" ? !game.treeStates.some(Boolean)
      : kind === "breakStone" ? !game.rockStates.some(Boolean)
      : false;
    if (noTarget) {
      const reason = kind === "water" ? "田里没有需要浇水的作物"
        : kind === "fertilize" ? "田里还没有作物可以施肥"
        : kind === "plant" ? `${cropInfo?.name ?? "这种作物"}种子不足，或者没有空着的松土地`
        : kind === "mineDiamond" ? "今天山洞里没有还没挖过的钻石矿"
        : kind === "chopWood" ? "农场上暂时没有可以砍的树"
        : "农场上暂时没有可以敲碎的石头";
      setMessage(`分身检查了工作地点：${reason}。`);
      playTone(260);
      return;
    }

    const mission: CloneMissionState = kind === "water" ? { kind, label: "给作物浇水", destination: "青禾农田", icon: "水" }
      : kind === "fertilize" ? { kind, label: "给作物施肥", destination: "青禾农田", icon: "肥" }
      : kind === "plant" ? { kind, label: `播种${cropInfo?.name}`, destination: "青禾农田", icon: cropInfo?.short ?? "苗" }
      : kind === "mineDiamond" ? { kind, label: "挖掘钻石", destination: "青禾山洞", icon: "◆" }
      : kind === "chopWood" ? { kind, label: "砍树收集木材", destination: "青禾树林", icon: "木" }
      : kind === "breakStone" ? { kind, label: "敲石收集石材", destination: "农场石坡", icon: "石" }
      : kind === "gatherHerbs" ? { kind, label: "寻找药材", destination: "溪边草地", icon: "药" }
      : kind === "fish" ? { kind, label: "在池边钓鱼", destination: "青禾鱼塘", icon: "鱼" }
      : { kind, label: `帮助${person}`, destination: `${person}家`, icon: "心" };

    setCloneMission(mission);
    setMessage(`另一个小禾已经出现，穿过障碍瞬移去${mission.destination}${mission.label}。你仍然可以继续做自己的事情。`);
    playTone(840);
    if (cloneMissionTimerRef.current !== null) window.clearTimeout(cloneMissionTimerRef.current);
    cloneMissionTimerRef.current = window.setTimeout(() => {
      setGame((current) => {
        let next: GameState = { ...current };
        if (kind === "water") {
          const targets = current.tiles.map((tile, index) => tile.state === "crop" && !tile.watered ? index : -1).filter((index) => index >= 0).slice(0, 8);
          next.tiles = current.tiles.map((tile, index) => targets.includes(index) ? { ...tile, watered: true, care: (tile.care ?? 0) + 1 } : tile);
          next.wateredCount = current.wateredCount + targets.length;
        } else if (kind === "fertilize") {
          const targets = current.tiles.map((tile, index) => tile.state === "crop" ? index : -1).filter((index) => index >= 0).slice(0, 8);
          next.tiles = current.tiles.map((tile, index) => targets.includes(index) ? { ...tile, care: (tile.care ?? 0) + 2 } : tile);
        } else if (kind === "plant" && cropInfo && crop) {
          const seedField = cropInfo.seedField;
          const targets = current.tiles.map((tile, index) => tile.state === "soil" ? index : -1).filter((index) => index >= 0).slice(0, Math.min(4, current[seedField]));
          next.tiles = current.tiles.map((tile, index) => targets.includes(index) ? { state: "crop", stage: 0, watered: false, cropType: crop, care: 0 } : tile);
          next[seedField] = current[seedField] - targets.length;
          next.planted = current.planted + targets.length;
        } else if (kind === "mineDiamond") {
          const index = current.caveDiamondStates.findIndex(Boolean);
          const caveDiamondStates = [...current.caveDiamondStates];
          if (index >= 0) caveDiamondStates[index] = false;
          next.caveDiamondStates = caveDiamondStates;
          next.diamonds = current.diamonds + (current.toolUpgrades.pickaxe ? 3 : 2);
        } else if (kind === "chopWood") {
          const index = current.treeStates.findIndex(Boolean);
          const treeStates = [...current.treeStates];
          if (index >= 0) treeStates[index] = false;
          next.treeStates = treeStates;
          next.wood = current.wood + 5;
          next.resin = current.resin + 1;
          next.pinecones = current.pinecones + 1;
          next.pineNuts = current.pineNuts + 2;
        } else if (kind === "breakStone") {
          const index = current.rockStates.findIndex(Boolean);
          const rockStates = [...current.rockStates];
          if (index >= 0) rockStates[index] = false;
          next.rockStates = rockStates;
          next.stone = current.stone + 4;
        } else if (kind === "gatherHerbs") {
          next.herbs = current.herbs + 3;
        } else if (kind === "fish") {
          next.inventory = { ...current.inventory, fish: current.inventory.fish + 2 };
          next.fishCaught = current.fishCaught + 2;
        } else if (kind === "helpResident" && person) {
          next.friendship = { ...current.friendship, [person]: Math.min(100, (current.friendship[person] ?? 0) + 15) };
        }
        next.journalEntries = [`${SEASONS[current.season]}第${current.day}天：分身穿墙瞬移到${mission.destination}，完成“${mission.label}”。`, ...current.journalEntries].slice(0, 40);
        return next;
      });
      setCloneMission(null);
      setMessage(`分身从${mission.destination}瞬移回来了，“${mission.label}”已经真实完成，成果已经留在田地、资源或好感度里。`);
      playTone(980);
      cloneMissionTimerRef.current = null;
    }, 1_350);
  };

  const trainAgeTrail = (direction: "up" | "down" | "left" | "right") => {
    if (ageTraining?.skill !== "trail") return;
    const expected = AGE_TRAIL_ROUTE[ageTraining.progress];
    if (direction !== expected) {
      setAgeTraining({ ...ageTraining, mistakes: ageTraining.mistakes + 1, progress: Math.max(0, ageTraining.progress - 1) });
      setMessage("走偏了，脚印在草地里变淡了一段。回到上一处脚印重新观察方向。 ");
      playTone(210);
      return;
    }
    advanceAgeTraining();
  };

  const dropAgeCampPart = () => {
    if (ageCampDropLockRef.current) return;
    if (ageTraining?.skill !== "shelter" || !ageTrainingHeldPart) {
      setMessage("先按住一件农具养护零件，把它拖到工具台发亮的接口上再松手。 ");
      return;
    }
    ageCampDropLockRef.current = true;
    window.setTimeout(() => { ageCampDropLockRef.current = false; }, 0);
    const expected = AGE_CAMP_PARTS[ageTraining.progress];
    if (ageTrainingHeldPart !== expected) {
      setAgeTraining({ ...ageTraining, mistakes: ageTraining.mistakes + 1 });
      setAgeTrainingHeldPart(null);
      setMessage(`这一步需要${expected}，刚才的养护零件不合适，已经放回工具盘。`);
      playTone(210);
      return;
    }
    setAgeTrainingHeldPart(null);
    advanceAgeTraining();
  };

  const handleAgeTrainingPointerRelease = (event: ReactPointerEvent<HTMLElement>) => {
    if (ageTraining?.skill !== "shelter" || !ageTrainingHeldPart) return;
    const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    if (element?.closest("[data-age-camp-target]")) dropAgeCampPart();
  };

  const trainAgeHybrid = (answer: string) => {
    if (ageTraining?.skill !== "hybrid") return;
    const round = AGE_HYBRID_ROUNDS[ageTraining.progress];
    if (answer !== round.correct) {
      setAgeTraining({ ...ageTraining, mistakes: ageTraining.mistakes + 1 });
      setMessage(`${answer}在“${round.weather}”观察皿里没有出现健康嫩芽。把它取出，再比较另外两种种子。`);
      playTone(210);
      return;
    }
    advanceAgeTraining();
  };

  const strikeAgeEcho = () => {
    if (ageTraining?.skill !== "echo") return;
    if (ageEchoPulse < 42 || ageEchoPulse > 58) {
      setAgeTraining({ ...ageTraining, mistakes: ageTraining.mistakes + 1 });
      setMessage("敲得太早或太晚，只听见普通石头的闷响。等光点进入中间绿色回声区再敲。 ");
      playTone(190);
      return;
    }
    setAgeEchoPulse(6);
    ageEchoDirectionRef.current = 1;
    advanceAgeTraining();
  };

  const eatBirthdayCake = () => {
    if (game.birthdayCakeYear === game.year) {
      setMessage("今年的生日蛋糕已经和大家一起吃完了，明年春天第十九天还会再举办派对。 ");
      return;
    }
    setBirthdayCeremony({ person: displayName, own: true, step: 0, songTaps: 0, blowTaps: 0, cutProgress: 0 });
    setMessage("生日仪式开始了！先跟着亮起的音符唱完四句生日歌。 ");
    playTone(720);
  };

  const celebrateResidentBirthday = (person: string) => {
    const partyKey = `resident-birthday-${game.year}-${game.season}-${game.day}-${person}`;
    if (game.lastTalkedDays[partyKey] === "joined") {
      setMessage(`${person}的生日蛋糕已经和大家分享过了。还可以和现场每个人聊天，或者举起礼物送给${person}。`);
      return;
    }
    setGame((current) => withFriendship({
      ...current,
      energy: Math.min(100, current.energy + 18),
      cookies: current.cookies + 1,
      lastTalkedDays: { ...current.lastTalkedDays, [partyKey]: "joined" },
      journalEntries: [`${SEASONS[current.season]}第${current.day}天：在中心广场真正参加了${person}的生日会，大家围着蛋糕唱歌，还分到一块生日曲奇。`, ...current.journalEntries].slice(0, 40),
    }, person, 10));
    setMessage(`大家围到蛋糕旁为${person}唱生日歌，${person}吹灭蜡烛并亲手分蛋糕。恢复 18 点体力，得到 1 块生日曲奇，${person}好感 +10！`);
    playTone(960);
  };

  const beginResidentBirthdayCeremony = (person: string) => {
    const partyKey = `resident-birthday-${game.year}-${game.season}-${game.day}-${person}`;
    if (game.lastTalkedDays[partyKey] === "joined") {
      setMessage(`${person}的生日蛋糕已经和大家分享过了。还可以和现场每个人聊天，或者举起礼物送给${person}。`);
      return;
    }
    setBirthdayCeremony({ person, own: false, step: 0, songTaps: 0, blowTaps: 0, cutProgress: 0 });
    setMessage(`大家围到了蛋糕旁。先按顺序唱完四句生日歌，再请${person}吹蜡烛。`);
    playTone(720);
  };

  const tapBirthdaySong = () => {
    if (!birthdayCeremony || birthdayCeremony.step !== 0) return;
    playBirthdayChoirNote(birthdayCeremony.songTaps);
    const nextTaps = birthdayCeremony.songTaps + 1;
    if (nextTaps >= 4) {
      setBirthdayCeremony({ ...birthdayCeremony, step: 1, songTaps: 4 });
      setMessage("四句生日歌唱完了！现在连续吹三次，把三根蜡烛一根根吹灭。 ");
      speakBirthdayChorus(birthdayCeremony.person);
      return;
    }
    setBirthdayCeremony({ ...birthdayCeremony, songTaps: nextTaps });
    setMessage(`唱完第 ${nextTaps} 句生日歌，还剩 ${4 - nextTaps} 句。`);
  };

  const blowBirthdayCandle = () => {
    if (!birthdayCeremony || birthdayCeremony.step !== 1) return;
    const nextBlows = birthdayCeremony.blowTaps + 1;
    if (nextBlows >= 3) {
      setBirthdayCeremony({ ...birthdayCeremony, step: 2, blowTaps: 3 });
      setMessage("三根蜡烛都灭了！按住蛋糕刀，从蛋糕左边慢慢拖到右边把蛋糕切开。 ");
      playTone(880);
      return;
    }
    setBirthdayCeremony({ ...birthdayCeremony, blowTaps: nextBlows });
    setMessage(`呼——吹灭了第 ${nextBlows} 根蜡烛，再吹 ${3 - nextBlows} 次。`);
    playTone(540);
  };

  const finishBirthdayCeremony = () => {
    if (!birthdayCeremony) return;
    const ceremony = birthdayCeremony;
    setBirthdayCeremony(null);
    if (ceremony.own) {
      const growsThisYear = game.birthdayGrowthYear !== game.year;
      const nextAge = growsThisYear ? game.playerAge + 1 : game.playerAge;
      const unlocked = AGE_SKILLS.filter((skill) => skill.age === nextAge).map((skill) => skill.name);
      setGame((current) => ({
        ...current,
        energy: Math.min(100, current.energy + 40),
        birthdayCakeYear: current.year,
        birthdayGrowthYear: growsThisYear ? current.year : current.birthdayGrowthYear,
        playerAge: growsThisYear ? current.playerAge + 1 : current.playerAge,
        journalEntries: growsThisYear ? [`春天第十九日：小禾过完生日，从 ${current.playerAge} 岁长到了 ${current.playerAge + 1} 岁。${unlocked.length ? `新的本领“${unlocked.join("、")}”已经可以开始学习。` : "成长手册记录了这一岁。"}`, ...current.journalEntries].slice(0, 40) : current.journalEntries,
      }));
      setAgeBookOpen(growsThisYear);
      setMessage(growsThisYear ? `蛋糕真的切开了！小禾长到 ${nextAge} 岁，恢复 40 点体力。${unlocked.length ? `成长手册出现了新本领“${unlocked.join("、")}”，还要完成真正的练习才能学会。` : "新的年龄已经写进成长手册。"}` : "蛋糕真的切开了！小禾和大家每人分到一块草莓蛋糕，恢复了 40 点体力。大家一起说：生日快乐！ ");
      playTone(980);
      return;
    }
    celebrateResidentBirthday(ceremony.person);
  };

  const updateBirthdayCut = (progress: number) => {
    if (!birthdayCeremony || birthdayCeremony.step !== 2 || progress <= birthdayCeremony.cutProgress) return;
    if (progress >= 88) {
      setBirthdayCeremony({ ...birthdayCeremony, cutProgress: 100 });
      window.setTimeout(finishBirthdayCeremony, 250);
      return;
    }
    setBirthdayCeremony({ ...birthdayCeremony, cutProgress: progress });
  };

  const dragBirthdayKnife = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!birthdayCeremony || birthdayCeremony.step !== 2) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateBirthdayCut(Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100)));
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
  const actualFestival = FESTIVAL_SCHEDULE.find((festival) => festival.season === game.season && festival.day === game.day) ?? null;
  const previewFestival = festivalPreview ? FESTIVAL_SCHEDULE.find((festival) => festival.id === festivalPreview.festivalId) ?? null : null;
  const currentFestival = previewFestival ?? actualFestival;
  const dailyNews = dailyNewsForState(game);
  const tvEpisodeDay = (game.year - 1) * 112 + game.season * 28 + game.day;
  const sportsStory = SPORTS_STORIES[tvEpisodeDay % SPORTS_STORIES.length];
  const kidsStory = dailyKidsStory(tvEpisodeDay);
  const nationalStory = NATIONAL_STORIES[tvEpisodeDay % NATIONAL_STORIES.length];
  const farmStory = FARM_STORIES[game.weather === "rain" || game.weather === "thunder" ? 0 : 1];
  const currentGuideTopic = GUIDE_TOPICS.find((topic) => topic.id === guideTopic) ?? GUIDE_TOPICS[0];
  const relationshipPeople = Object.keys(PERSON_DIALOGUES).filter((name) => !name.includes("助手") || name === "诊所助手");
  const speakingWishDefinition = residentSpeech ? residentWishDefinition(residentSpeech.person) : null;
  const speakingWishProgress = residentSpeech ? game.residentWishes[residentSpeech.person] : null;
  const speakingWishNumbers = residentSpeech && speakingWishProgress ? wishProgressNumbers(game, residentSpeech.person, speakingWishProgress) : null;
  const speakingWishObjectivesReady = Boolean(speakingWishDefinition && speakingWishProgress && speakingWishNumbers && !speakingWishProgress.completed
    && speakingWishNumbers.first >= speakingWishDefinition.firstNeed
    && speakingWishNumbers.second >= speakingWishDefinition.secondNeed
    && speakingWishNumbers.days >= 2);
  const speakingWishCanSubmit = Boolean(speakingWishObjectivesReady && speakingWishDefinition && hasWishMaterials(game, speakingWishDefinition));
  const qualityTotals = CROP_TYPES.reduce((totals, crop) => ({ normal: totals.normal + game.cropQualityHarvests[crop].normal, silver: totals.silver + game.cropQualityHarvests[crop].silver, gold: totals.gold + game.cropQualityHarvests[crop].gold }), { normal: 0, silver: 0, gold: 0 });
  const absoluteGameDay = (game.year - 1) * 112 + game.season * 28 + game.day;
  const currentResidentWorkers = game.residentWorkOrders.filter((order) => order.absoluteDay === absoluteGameDay && order.job !== "mineDiamond");
  const currentCaveWorkers = game.residentWorkOrders.filter((order) => order.absoluteDay === absoluteGameDay && order.job === "mineDiamond");
  const residentQuestCycle = Math.floor(Math.max(0, absoluteGameDay - 1) / 3);
  const activeResidentQuests = Array.from({ length: 3 }, (_, index) => RESIDENT_QUESTS[(residentQuestCycle * 3 + index) % RESIDENT_QUESTS.length]);
  const residentQuestKey = (quest: ResidentQuest) => `${residentQuestCycle}-${quest.id}`;
  const completedResidentQuestCount = activeResidentQuests.filter((quest) => game.residentQuestCompletions.includes(residentQuestKey(quest))).length;
  const residentQuestsHere = activeResidentQuests.filter((quest) => quest.village === activeVillage && quest.scene === scene && !game.residentQuestCompletions.includes(residentQuestKey(quest)));
  const completeResidentQuest = (quest: ResidentQuest) => {
    const completionKey = residentQuestKey(quest);
    if (game.residentQuestCompletions.includes(completionKey)) {
      setMessage(`${quest.giver}的“${quest.title}”已经完成了。`);
      return;
    }
    setGame((current) => withFriendship({
      ...current,
      coins: current.coins + quest.reward,
      residentQuestCompletions: [...current.residentQuestCompletions, completionKey].slice(-48),
      journalEntries: [`完成${quest.giver}发布的“${quest.title}”：${quest.action}。获得 ${quest.reward} 金币。`, ...current.journalEntries].slice(0, 40),
    }, quest.giver, 5));
    setMessage(`${quest.action}完成！${quest.giver}送来 ${quest.reward} 金币，并且和小禾更亲近了。`);
    playTone(920);
  };
  const forestStoryTitle = FOREST_STORY_TITLES[game.forestQuestEpisode] ?? FOREST_STORY_TITLES[0];
  const forestStoryDaysLeft = game.forestQuestStage === 5 ? Math.max(0, game.forestQuestNextAbsoluteDay - absoluteGameDay) : 0;
  const residentBoardDaysLeft = 3 - (absoluteGameDay % 3);
  const scheduledResidentsToday = SCHEDULED_RESIDENTS.map((name) => ({ name, schedule: residentActivity(name, game.hour, game.day, game.weather) }));
  const cafeResidents = scheduledResidentsToday.filter(({ name, schedule }) => name !== "阿麦" && schedule.scene === "town" && (schedule.key === "breakfast" || schedule.key === "lunch"));
  const roamingResidents = scheduledResidentsToday
    .filter(({ schedule }) => schedule.scene === scene && ["farm", "town", "cultureDistrict", "westFriendFarm"].includes(scene))
    .filter(({ schedule }) => !(scene === "town" && (schedule.key === "breakfast" || schedule.key === "lunch")));
  const displaySeason = festivalPreview?.season ?? game.season;
  const displayDay = festivalPreview?.day ?? game.day;
  const festivalProcessAtVenue = Boolean(currentFestival && FESTIVAL_PROCESS_STEPS[currentFestival.id] && (
    (currentFestival.id === "seeds" && activeBuilding === "supermarket") ||
    (currentFestival.id === "coffee" && activeBuilding === "cafe") ||
    (currentFestival.id === "craft" && activeBuilding === "workshop") ||
    (currentFestival.id === "medical" && activeBuilding === "clinic") ||
    (currentFestival.id === "hotSoup" && activeBuilding === "cafe") ||
    (["spring", "lantern", "midAutumn", "springFestival", "kite", "water", "firstSnow"].includes(currentFestival.id) && scene === "town" && !activeBuilding) ||
    (currentFestival.id === "flower" && scene === "eastNeighbor" && !activeBuilding) ||
    (currentFestival.id === "firefly" && scene === "westFriendFarm" && !activeBuilding) ||
    (currentFestival.id === "harvest" && scene === "farm" && !activeBuilding) ||
    (currentFestival.id === "leafMusic" && scene === "cultureDistrict" && !activeBuilding)
  ));
  const calendarPosition = game.season * 28 + game.day;
  const nextFestival = FESTIVAL_SCHEDULE.find((festival) => festival.season * 28 + festival.day >= calendarPosition) ?? FESTIVAL_SCHEDULE[0];
  const nextFestivalPosition = nextFestival.season * 28 + nextFestival.day;
  const daysUntilFestival = nextFestivalPosition >= calendarPosition ? nextFestivalPosition - calendarPosition : 112 - calendarPosition + nextFestivalPosition;
  const displayName = multiplayerSession?.playerName ?? "小禾";
  const isBirthday = !festivalPreview && game.season === 0 && game.day === 19;
  const currentBirthdayPartyKey = `${game.year}-${game.season}-${game.day}`;
  const showBirthdayParty = isBirthday && dismissedBirthdayPartyKey !== currentBirthdayPartyKey;
  const todayResidentBirthday = !festivalPreview ? RESIDENT_BIRTHDAYS.find((birthday) => birthday.name !== "小禾" && birthday.season === game.season && birthday.day === game.day) ?? null : null;
  const calendarMonth = [2, 5, 8, 11][displaySeason];
  const sceneLabel = scene === "farm" ? activeVillageInfo.farm : scene === "westFriendFarm" ? "西边 · 安安的小农场" : scene === "mysteryRoad" ? "远方新区 · 青禾大商场" : scene === "town" ? `${activeVillageInfo.name} · 中心街` : scene === "cultureDistrict" ? `${activeVillageInfo.name} · 清河文化街` : scene === "residentialDistrict" ? `${activeVillageInfo.name} · 青禾住宅坡` : scene === "eastNeighbor" ? "东郊 · 林婶的果园小屋" : scene === "southNeighbor" ? "南坡 · 鲁师傅的院子" : "北林 · 叶老师的书屋";
  const farmCameraX = Math.max(-8, Math.min(12, player.x));
  const farmPlayerScreenLeft = player.x < -8 ? Math.max(4, 50 - (Math.abs(player.x) - 8) * 11.5) : player.x > 12 ? Math.min(92, 50 + (player.x - 12) * 21) : 50;
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

  useEffect(() => {
    if (!dragonBoatOpen || !dragonBoatRole || dragonBoatWinner) return;
    const raceTimer = window.setInterval(() => {
      setDragonBoatOpponent((current) => {
        const next = Math.min(14, current + 1);
        if (next >= 14) {
          setDragonBoatWinner("opponent");
          setMessage("蓝队先到达终点了！这次没有获胜，可以坐大巴回去后下次再练习。 ");
          playTone(260);
        }
        return next;
      });
    }, 720);
    return () => window.clearInterval(raceTimer);
  }, [dragonBoatOpen, dragonBoatRole, dragonBoatWinner]);

  const startFestivalProcess = (festivalId: FestivalId) => {
    if (!FESTIVAL_PROCESS_STEPS[festivalId]) return;
    if (festivalId === "midAutumn") {
      setRiverLanternFold(0);
      setRiverLanternWickPicked(false);
      setRiverLanternPosition(null);
    }
    if (festivalId === "craft") {
      setCraftWoodChoice(null);
      setCraftCarveProgress(0);
      setCraftWrongCarves(0);
      setCraftKnifeDragging(false);
      setCraftResultQuality(null);
      craftCarveProgressRef.current = 0;
      craftWrongCarvesRef.current = 0;
      craftKnifeLastPointRef.current = null;
    }
    if (festivalId === "seeds") {
      setSeedWorkshopBugs([true, true]);
      setSeedWorkshopDebris([true, true]);
      setSeedSprayerPicked(false);
      setSeedDebrisPicked(null);
      setSeedWorkshopHeld(null);
      setSeedWorkshopSorted([]);
      setSeedGiftTied(false);
    }
    if (festivalId === "firstSnow") {
      if (snowPushTimerRef.current !== null) window.clearInterval(snowPushTimerRef.current);
      snowPushTimerRef.current = null;
      snowRollingFinishedRef.current = false;
      setSnowBuild({ playerX: 5, bodyX: 14, bodySize: 24, bodyPlaced: false, headX: 14, headSize: 19, headRolled: false, headStacked: false });
    }
    if (festivalId === "water") {
      if (waterFillTimerRef.current !== null) window.clearInterval(waterFillTimerRef.current);
      if (waterMoveTimerRef.current !== null) window.clearInterval(waterMoveTimerRef.current);
      waterFillTimerRef.current = null;
      waterMoveTimerRef.current = null;
      waterPipeDropLockRef.current = false;
      const resetWaterFestival = { installedPipes: [false, false, false, false], heldPipe: null, bucketFill: [0, 0, 0, 0], playerX: 10, hits: 0, soaked: 0 };
      waterFestivalRef.current = resetWaterFestival;
      setWaterFestival(resetWaterFestival);
    }
    festivalActionCountRef.current = 0;
    festivalRiddleCorrectRef.current = null;
    setFestivalActionCount(0);
    setFestivalDragging(false);
    setFestivalProcess({ id: festivalId, step: 0 });
    setMessage(`${FESTIVAL_PROCESS_STEPS[festivalId]?.title}开始了，要亲手完成每一个步骤。`);
    playTone(680);
  };

  const damagedCraftBoards = [game.day % 4, (game.day + 2) % 4];

  const chooseCraftWood = (index: number) => {
    const damaged = damagedCraftBoards.includes(index);
    setCraftWoodChoice(index);
    setCraftCarveProgress(0);
    setCraftWrongCarves(0);
    craftCarveProgressRef.current = 0;
    craftWrongCarvesRef.current = 0;
    setFestivalProcess({ id: "craft", step: 1 });
    setMessage(damaged ? "选中了带裂痕的木板。仍然可以雕刻，但裂口会留在成品上。请沿横向木纹拖动刻刀。" : "这块木板纹理完整，没有裂口。请按住刻刀，沿横向木纹来回刮。 ");
    playTone(damaged ? 330 : 720);
  };

  const beginCraftCarving = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    craftKnifeLastPointRef.current = { x: event.clientX, y: event.clientY };
    setCraftKnifeDragging(true);
    setMessage("刻刀已经贴住木板。沿着横向木纹左右拖动，不要上下乱刮。 ");
  };

  const moveCraftKnife = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!craftKnifeDragging || festivalProcess?.id !== "craft" || festivalProcess.step !== 1) return;
    const previous = craftKnifeLastPointRef.current;
    craftKnifeLastPointRef.current = { x: event.clientX, y: event.clientY };
    if (!previous) return;
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 4) return;
    const followsGrain = Math.abs(dx) >= Math.abs(dy) * 1.35;
    if (!followsGrain) {
      craftWrongCarvesRef.current += 1;
      setCraftWrongCarves(craftWrongCarvesRef.current);
      setMessage("这一刀偏离了横向木纹，成品上留下了一道歪痕。把刻刀左右拖动。 ");
      playTone(230);
      return;
    }
    const nextProgress = Math.min(100, craftCarveProgressRef.current + Math.max(3, Math.min(11, Math.abs(dx) / 2.6)));
    craftCarveProgressRef.current = nextProgress;
    setCraftCarveProgress(nextProgress);
    playTone(430 + Math.floor(nextProgress * 2));
    if (nextProgress < 100) return;
    setCraftKnifeDragging(false);
    craftKnifeLastPointRef.current = null;
    const poor = craftWoodChoice === null || damagedCraftBoards.includes(craftWoodChoice) || craftWrongCarvesRef.current >= 3;
    setCraftResultQuality(poor ? "poor" : "good");
    setFestivalProcess({ id: "craft", step: 2 });
    setMessage(poor ? "木鸟雕出来了，不过裂口或歪刀让翅膀有点歪，成品看起来笨笨的。" : "刻刀顺着木纹刮出一只清楚、圆润的小木鸟，羽翼和尾巴都很漂亮！");
    playTone(poor ? 430 : 960);
  };

  const endCraftCarving = () => {
    setCraftKnifeDragging(false);
    craftKnifeLastPointRef.current = null;
  };

  const spraySeedBug = (bugIndex: number) => {
    if (!seedSprayerPicked) {
      setMessage("桌上有一瓶绿色杀虫剂。先拿起杀虫剂，再点击种子旁的小虫。 ");
      return;
    }
    setSeedWorkshopBugs((current) => current.map((visible, index) => index === bugIndex ? false : visible));
    setMessage("轻轻喷了一下，小虫离开种子了。别忘了把杂物也拖进废料盒。 ");
    playTone(680);
  };

  const discardSeedDebris = () => {
    if (seedDebrisPicked === null) {
      setMessage("先拖动一块混进种子里的杂物，再放到废料盒里。也可以先点杂物、再点废料盒。 ");
      return;
    }
    const removed = seedDebrisPicked;
    setSeedWorkshopDebris((current) => current.map((visible, index) => index === removed ? false : visible));
    setSeedDebrisPicked(null);
    setMessage("杂物已经从种子堆里挑出来，放进了废料盒。 ");
    playTone(610);
  };

  const finishSeedCleaning = () => {
    if (seedWorkshopBugs.some(Boolean) || seedWorkshopDebris.some(Boolean)) {
      setMessage("种子还没清干净：检查有没有小虫或灰色杂物。 ");
      return;
    }
    setFestivalProcess({ id: "seeds", step: 1 });
    setSeedWorkshopHeld(null);
    setMessage("四种种子已经清理干净。现在从左边拿起种子，名字会显示出来，再拖进正确季节的篮子。 ");
    playTone(820);
  };

  const pickWorkshopSeed = (seedId: WorkshopSeedId) => {
    const seed = WORKSHOP_SEEDS.find((item) => item.id === seedId)!;
    setSeedWorkshopHeld(seedId);
    setMessage(`拿起的是${seed.name}：${seed.hint}。把它拖进“${seed.season}”篮子。`);
  };

  const sortWorkshopSeed = (season: WorkshopSeason) => {
    if (!seedWorkshopHeld) {
      setMessage("先从左边种子堆拿起一颗种子，拿起时会显示它的名字。 ");
      return;
    }
    const seed = WORKSHOP_SEEDS.find((item) => item.id === seedWorkshopHeld)!;
    if (seed.season !== season) {
      setMessage(`${seed.name}不适合放进“${season}”篮子。看看提示，再换一个季节。`);
      playTone(230);
      return;
    }
    const nextSorted = [...seedWorkshopSorted, seed.id];
    setSeedWorkshopSorted(nextSorted);
    setSeedWorkshopHeld(null);
    playTone(750 + nextSorted.length * 40);
    if (nextSorted.length >= WORKSHOP_SEEDS.length) {
      setFestivalProcess({ id: "seeds", step: 2 });
      setMessage("草莓、西瓜、玉米和南瓜种子都分进了正确篮子。点击礼包，用丝绸扎出蝴蝶结。 ");
    } else {
      setMessage(`${seed.name}已经放进“${season}”篮子。还剩 ${WORKSHOP_SEEDS.length - nextSorted.length} 种。`);
    }
  };

  const tieSeedGift = () => {
    if (!seedGiftTied) {
      setSeedGiftTied(true);
      setMessage("丝绸绕过袋口，扎成了一个红色蝴蝶结。礼包已经做好，可以收进背包了。 ");
      playTone(920);
      return;
    }
    advanceFestivalProcess();
  };

  const foldRiverLanternPaper = () => {
    if (festivalProcess?.id !== "midAutumn" || festivalProcess.step !== 0) return;
    const nextFold = Math.min(3, riverLanternFold + 1);
    setRiverLanternFold(nextFold);
    playTone(470 + nextFold * 80);
    if (nextFold >= 3) {
      setFestivalProcess({ id: "midAutumn", step: 1 });
      setMessage("纸张已经一折一折变成灯罩。现在把灯芯缓缓拖进灯罩中间。 ");
    } else {
      setMessage(`纸张完成第 ${nextFold} 折，还要继续点纸再折 ${3 - nextFold} 次。`);
    }
  };

  const installRiverLanternWick = () => {
    if (festivalProcess?.id !== "midAutumn" || festivalProcess.step !== 1) return;
    setRiverLanternWickPicked(false);
    setFestivalProcess({ id: "midAutumn", step: 2 });
    setMessage("灯芯已经缓缓放进灯罩并点亮。场景来到河边，请点击河面上想放灯的位置。 ");
    playTone(760);
  };

  const placeRiverLantern = (event: MouseEvent<HTMLButtonElement>) => {
    if (festivalProcess?.id !== "midAutumn" || festivalProcess.step !== 2 || riverLanternPosition) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = { x: ((event.clientX - bounds.left) / bounds.width) * 100, y: ((event.clientY - bounds.top) / bounds.height) * 100 };
    setRiverLanternPosition(position);
    setMessage("河灯落在你选的位置，灯光映在水面上，正在顺着河水缓缓漂动。 ");
    playTone(920);
    const finishTimer = window.setTimeout(advanceFestivalProcess, 1_100);
    bedtimeTimersRef.current.push(finishTimer);
  };

  const festivalActionRequirements: Partial<Record<FestivalId, number[]>> = {
    seeds: [4, 4, 1], spring: [3, 3, 6], coffee: [1, 6, 1, 1, 3], craft: [3, 6, 1], springFestival: [1, 8, 6],
    lantern: [4, 5, 4, 3],
    medical: [4, 4, 6, 5, 5], kite: [4, 4, 6], flower: [4, 3, 5], water: [4, 4, 3], firefly: [4, 3, 4], harvest: [4, 5, 4], leafMusic: [4, 5, 6], firstSnow: [6, 3, 5], hotSoup: [4, 5, 6, 5],
  };
  const festivalActionIcons: Partial<Record<FestivalId, string[][]>> = {
    lantern: [["圈", "撑", "扣", "绳"], ["纸", "胶", "边", "穗", "牌"], ["火", "火", "火", "火"], ["荷", "雨", "桌"]],
    seeds: [["莓", "瓜", "玉", "南"], ["春", "夏", "秋", "冬"], ["绳"]],
    spring: [["勺", "莓", "酱"], ["左", "中", "右"], ["♪", "♫", "♩", "♪", "♫", "♩"]],
    coffee: [["豆"], ["转", "转", "转", "转", "转", "转"], ["水"], ["壶"], ["闻", "尝", "点"]],
    craft: [["松", "橡", "枫"], ["磨", "磨", "磨", "磨", "磨", "磨"], ["刷"]],
    springFestival: [["绸"], ["咚", "咚", "锵", "咚", "锵", "咚", "咚", "锵"], ["↑", "→", "↓", "←", "↑", "→"]],
    medical: [["镜", "温", "听", "卡"], ["巾", "计", "水", "本"], ["桌", "杯", "勺", "手", "罐", "巾"], ["药", "药", "水", "草", "杯"], ["敷", "水", "记", "息", "查"]],
    kite: [["竹", "竹", "扣", "线"], ["刷", "刷", "压", "压"], ["跑", "跑", "跑", "放", "放", "放"]],
    flower: [["红", "黄", "蓝", "白"], ["香", "香", "香"], ["木", "草", "管", "叶", "绳"]],
    water: [["弯", "直", "接", "阀"], ["桶", "桶", "桶", "桶"], ["安", "麦", "玲"]],
    firefly: [["罩", "灯", "扣", "绳"], ["草", "草", "草"], ["时", "地", "亮", "记"]],
    harvest: [["瓜", "玉", "莓", "薯"], ["大", "中", "小", "叶", "筐"], ["推", "称", "跑", "交"]],
    leafMusic: [["枫", "银", "橡", "桦"], ["弦", "弦", "弦", "弦", "弦"], ["♪", "♫", "♩", "♪", "♫", "♩"]],
    firstSnow: [["雪", "雪", "雪", "雪", "雪", "雪"], ["抬", "稳", "放"], ["煤", "萝", "枝", "枝", "巾"]],
    hotSoup: [["菇", "菜", "薯", "草"], ["洗", "切", "切", "切", "盘"], ["火", "火", "火", "火", "火", "火"], ["汤", "汤", "汤", "汤", "汤"]],
  };
  const performFestivalDetailAction = () => {
    if (!festivalProcess || festivalProcess.id === "midAutumn") return;
    const required = festivalActionRequirements[festivalProcess.id]?.[festivalProcess.step] ?? 1;
    const next = festivalActionCountRef.current + 1;
    if (next >= required) {
      festivalActionCountRef.current = 0;
      setFestivalActionCount(0);
      setFestivalDragging(false);
      advanceFestivalProcess();
      return;
    }
    festivalActionCountRef.current = next;
    setFestivalActionCount(next);
    setMessage(`“${FESTIVAL_PROCESS_STEPS[festivalProcess.id]?.steps[festivalProcess.step].label}”正在进行：${next}/${required}。`);
    playTone(440 + next * 45);
  };

  const beginFestivalDrag = (hint: string) => {
    festivalDragReadyRef.current = true;
    setFestivalDragging(true);
    setMessage(hint);
  };

  const dropFestivalObject = (correct = true) => {
    if (!festivalDragReadyRef.current) {
      setMessage("要按住左边的实物拖动，不能只点目标位置。 ");
      return;
    }
    festivalDragReadyRef.current = false;
    setFestivalDragging(false);
    if (!correct) {
      setMessage("放错位置了，工作人员把实物送回起点。观察场景后再试一次。 ");
      playTone(190);
      return;
    }
    performFestivalDetailAction();
  };

  const updateWaterFestival = (updater: (current: WaterFestivalState) => WaterFestivalState) => {
    const next = updater(waterFestivalRef.current);
    waterFestivalRef.current = next;
    setWaterFestival(next);
    return next;
  };

  const selectWaterPipe = (index: number) => {
    if (waterFestivalRef.current.installedPipes[index]) return;
    updateWaterFestival((current) => ({ ...current, heldPipe: index }));
    setFestivalDragging(true);
    setMessage(`拿起了${["蓝色弯管", "长直管", "铜接头", "总水阀"][index]}，把它拖到形状相同的接口。`);
  };

  const installWaterPipe = (slot: number) => {
    if (waterPipeDropLockRef.current || festivalProcess?.id !== "water" || festivalProcess.step !== 0) return;
    const heldPipe = waterFestivalRef.current.heldPipe;
    if (heldPipe === null) {
      setMessage("先从下方材料架拿起一段水管，再放到接口上。 ");
      return;
    }
    if (heldPipe !== slot) {
      updateWaterFestival((current) => ({ ...current, heldPipe: null }));
      setFestivalDragging(false);
      festivalDragReadyRef.current = false;
      setMessage("管口形状对不上，水会漏出来。水管已经送回材料架，请换一个接口。 ");
      playTone(180);
      return;
    }
    waterPipeDropLockRef.current = true;
    updateWaterFestival((current) => ({ ...current, installedPipes: current.installedPipes.map((installed, index) => installed || index === slot), heldPipe: null }));
    setFestivalDragging(false);
    festivalDragReadyRef.current = false;
    performFestivalDetailAction();
    window.setTimeout(() => { waterPipeDropLockRef.current = false; }, 140);
  };

  const stopWaterFilling = () => {
    if (waterFillTimerRef.current !== null) window.clearInterval(waterFillTimerRef.current);
    waterFillTimerRef.current = null;
  };

  const beginWaterFilling = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (festivalProcess?.id !== "water" || festivalProcess.step !== 1 || waterFillTimerRef.current !== null) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const bucketIndex = festivalActionCountRef.current;
    setMessage(`水正在流进第 ${bucketIndex + 1} 只桶。要一直按住，水满了才会换下一只。`);
    waterFillTimerRef.current = window.setInterval(() => {
      let bucketCompleted = false;
      updateWaterFestival((current) => {
        const bucketFill = [...current.bucketFill];
        bucketFill[bucketIndex] = Math.min(100, bucketFill[bucketIndex] + 4);
        bucketCompleted = bucketFill[bucketIndex] >= 100;
        return { ...current, bucketFill };
      });
      if (!bucketCompleted) return;
      stopWaterFilling();
      playTone(720);
      window.setTimeout(() => performFestivalDetailAction(), 120);
    }, 45);
  };

  const stopWaterMoving = () => {
    if (waterMoveTimerRef.current !== null) window.clearInterval(waterMoveTimerRef.current);
    waterMoveTimerRef.current = null;
  };

  const beginWaterMoving = (direction: -1 | 1, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (festivalProcess?.id !== "water" || festivalProcess.step !== 2 || waterMoveTimerRef.current !== null) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setMessage(direction < 0 ? "小禾正在向左跑，松开方向键就会停下。" : "小禾正在向右跑，松开方向键就会停下。");
    waterMoveTimerRef.current = window.setInterval(() => {
      updateWaterFestival((current) => ({ ...current, playerX: Math.max(5, Math.min(93, current.playerX + direction * 1.5)) }));
    }, 45);
  };

  const splashWaterResident = () => {
    if (festivalProcess?.id !== "water" || festivalProcess.step !== 2) return;
    const targets = [30, 58, 82];
    const current = waterFestivalRef.current;
    const targetX = targets[Math.min(current.hits, targets.length - 1)];
    const distance = targetX - current.playerX;
    if (Math.abs(distance) > 9) {
      setMessage(distance < 0 ? "安安在左边，按住左方向跑近一些再泼水。" : "发光的队友还在右边，按住右方向跑近一些再泼水。 ");
      playTone(230);
      return;
    }
    const nextHit = current.hits + 1;
    updateWaterFestival((state) => ({ ...state, hits: nextHit, soaked: state.soaked + 1 }));
    setMessage(nextHit < targets.length ? `${["安安", "阿麦", "小玲"][nextHit - 1]}被泼中了，也笑着把一桶水泼回小禾！快去找下一位。` : "小玲被泼中了，三个人一起把水泼回来，水路接力完成！");
    playTone(650 + nextHit * 80);
    performFestivalDetailAction();
  };

  const handleFestivalPointerRelease = (event: ReactPointerEvent<HTMLElement>) => {
    const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    const waterPipeTarget = element?.closest<HTMLElement>("[data-water-pipe-slot]");
    if (waterPipeTarget?.dataset.waterPipeSlot !== undefined) {
      installWaterPipe(Number(waterPipeTarget.dataset.waterPipeSlot));
      return;
    }
    const target = element?.closest<HTMLElement>("[data-festival-drop]");
    const dropKind = target?.dataset.festivalDrop;
    if (dropKind === "lantern-riddle") {
      if (!festivalDragReadyRef.current) return;
      const correct = festivalRiddleCorrectRef.current === true;
      festivalRiddleCorrectRef.current = null;
      dropFestivalObject(correct);
      return;
    }
    if (dropKind === "coffee-beans" && festivalDragReadyRef.current) {
      festivalDragReadyRef.current = false;
      setFestivalDragging(false);
      playCoffeeMachineAnimation("beans");
      return;
    }
    if (dropKind === "coffee-filter" || dropKind === "coffee-taste" || dropKind === "lantern-fold") {
      if (!festivalDragReadyRef.current) return;
      if (dropKind === "lantern-fold") {
        festivalDragReadyRef.current = false;
        setFestivalDragging(false);
        foldRiverLanternPaper();
      } else {
        dropFestivalObject(true);
      }
      return;
    }
    if (dropKind === "snow-stack") {
      stackSnowHead();
      return;
    }
    if (dropKind === "snow-decoration") {
      placeSnowDecoration();
      return;
    }
    if (!festivalDragReadyRef.current) return;
    dropFestivalObject(dropKind === "correct");
  };

  const playCoffeeMachineAnimation = (kind: "beans" | "water") => {
    if (festivalProcess?.id !== "coffee" || festivalActionCount > 0) return;
    setFestivalActionCount(1);
    setMessage(kind === "beans" ? "咖啡豆正一颗颗滚进磨豆机的漏斗里……" : "按下饮水机，热水正沿着水流注入细嘴壶……");
    playTone(kind === "beans" ? 520 : 680);
    const timer = window.setTimeout(() => {
      setFestivalActionCount(0);
      advanceFestivalProcess();
    }, 1_150);
    bedtimeTimersRef.current.push(timer);
  };

  const beginCoffeeGrinding = (event: ReactPointerEvent<HTMLButtonElement>) => {
    coffeeGrindActiveRef.current = true;
    coffeeGrindLastPointRef.current = { x: event.clientX, y: event.clientY };
    coffeeGrindDistanceRef.current = 0;
    coffeeGrindTurnsRef.current = festivalActionCount;
    event.currentTarget.setPointerCapture(event.pointerId);
    setMessage("按住木把手绕着磨豆机画圆，手移动一整圈才算一次研磨。 ");
  };

  const moveCoffeeGrinder = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!coffeeGrindActiveRef.current || !coffeeGrindLastPointRef.current) return;
    const last = coffeeGrindLastPointRef.current;
    coffeeGrindDistanceRef.current += Math.hypot(event.clientX - last.x, event.clientY - last.y);
    coffeeGrindLastPointRef.current = { x: event.clientX, y: event.clientY };
    if (coffeeGrindDistanceRef.current < 92) return;
    coffeeGrindDistanceRef.current -= 92;
    const turns = Math.min(6, coffeeGrindTurnsRef.current + 1);
    coffeeGrindTurnsRef.current = turns;
    setFestivalActionCount(turns);
    playTone(360 + turns * 45);
    if (turns < 6) {
      setMessage(`咖啡豆被磨得更细了：${turns}/6 圈。继续按住把手绕圈。`);
      return;
    }
    coffeeGrindActiveRef.current = false;
    coffeeGrindLastPointRef.current = null;
    setMessage("六圈已经磨完，细咖啡粉落进了抽屉。 ");
    const timer = window.setTimeout(() => {
      setFestivalActionCount(0);
      advanceFestivalProcess();
    }, 520);
    bedtimeTimersRef.current.push(timer);
  };

  const endCoffeeGrinding = () => {
    coffeeGrindActiveRef.current = false;
    coffeeGrindLastPointRef.current = null;
  };

  const beginCoffeeWater = () => {
    if (coffeeWaterTimerRef.current !== null) return;
    setFestivalActionCount(1);
    setMessage("一直按住出水阀，热水正在流进细嘴壶；太早松手会接不满。 ");
    playTone(610);
    coffeeWaterTimerRef.current = window.setTimeout(() => {
      coffeeWaterTimerRef.current = null;
      setFestivalActionCount(0);
      setMessage("细嘴壶接满了热水，可以开始手冲。 ");
      advanceFestivalProcess();
    }, 1_450);
  };

  const cancelCoffeeWater = () => {
    if (coffeeWaterTimerRef.current === null) return;
    window.clearTimeout(coffeeWaterTimerRef.current);
    coffeeWaterTimerRef.current = null;
    setFestivalActionCount(0);
    setMessage("松手太早，水还没接满。请重新按住出水阀直到水壶满。 ");
    playTone(210);
  };

  const stopSnowPushing = () => {
    if (snowPushTimerRef.current !== null) window.clearInterval(snowPushTimerRef.current);
    snowPushTimerRef.current = null;
  };

  const beginSnowPushing = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (festivalProcess?.id !== "firstSnow" || festivalProcess.step !== 0 || snowPushTimerRef.current !== null || snowBuild.headRolled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setMessage(snowBuild.bodyPlaced ? "小禾正在弯腰推第二个雪球。一直按住前进，让它滚到大雪球旁边。 " : "小禾正在往前跑，身体顶着雪球向前滚。一直按住前进，不要一下一下点。 ");
    snowPushTimerRef.current = window.setInterval(() => {
      setSnowBuild((current) => {
        if (!current.bodyPlaced) {
          const bodyX = Math.min(72, current.bodyX + 1.25);
          const bodySize = Math.min(66, current.bodySize + .72);
          const playerX = Math.max(3, bodyX - 9);
          if (bodyX < 72) return { ...current, bodyX, bodySize, playerX };
          stopSnowPushing();
          playTone(620);
          setMessage("身体雪球已经滚大并停在雪地上。小禾回到起点，接着把较小的头部雪球推过去。 ");
          return { ...current, bodyX, bodySize, playerX: 5, bodyPlaced: true, headX: 14 };
        }
        if (current.headRolled) return current;
        const headX = Math.min(58, current.headX + 1.35);
        const headSize = Math.min(43, current.headSize + .5);
        const playerX = Math.max(3, headX - 9);
        if (headX < 58) return { ...current, headX, headSize, playerX };
        if (!snowRollingFinishedRef.current) {
          snowRollingFinishedRef.current = true;
          stopSnowPushing();
          playTone(760);
          const timer = window.setTimeout(() => {
            setFestivalProcess({ id: "firstSnow", step: 1 });
            setFestivalActionCount(0);
            setMessage("两个雪球都从雪地里真实滚大了。现在按住小雪球，把它抬到大雪球上方的绿色位置。 ");
          }, 460);
          bedtimeTimersRef.current.push(timer);
        }
        return { ...current, headX, headSize, playerX, headRolled: true };
      });
    }, 55);
  };

  const stackSnowHead = () => {
    if (!festivalDragReadyRef.current || festivalProcess?.id !== "firstSnow" || festivalProcess.step !== 1) return;
    festivalDragReadyRef.current = false;
    setFestivalDragging(false);
    setSnowBuild((current) => ({ ...current, headStacked: true }));
    setMessage("小雪球稳稳落在身体正上方，没有滚下来。接下来要亲手装五样装饰。 ");
    playTone(880);
    const timer = window.setTimeout(() => {
      setFestivalProcess({ id: "firstSnow", step: 2 });
      setFestivalActionCount(0);
    }, 560);
    bedtimeTimersRef.current.push(timer);
  };

  const placeSnowDecoration = () => {
    if (!festivalDragReadyRef.current || festivalProcess?.id !== "firstSnow" || festivalProcess.step !== 2) return;
    festivalDragReadyRef.current = false;
    setFestivalDragging(false);
    performFestivalDetailAction();
  };

  const stopFestivalHoldAction = () => {
    if (festivalHoldTimerRef.current !== null) window.clearInterval(festivalHoldTimerRef.current);
    festivalHoldTimerRef.current = null;
  };

  const beginFestivalHoldAction = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!festivalProcess || festivalHoldTimerRef.current !== null) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setMessage(`一直按住并观察“${FESTIVAL_PROCESS_STEPS[festivalProcess.id]?.steps[festivalProcess.step].label}”的场景变化，松手就会暂停。`);
    festivalHoldTimerRef.current = window.setInterval(() => {
      if (!festivalProcess) return;
      const required = festivalActionRequirements[festivalProcess.id]?.[festivalProcess.step] ?? 1;
      const finishing = festivalActionCountRef.current + 1 >= required;
      performFestivalDetailAction();
      if (finishing) stopFestivalHoldAction();
    }, 520);
  };

  const beginFestivalSweep = (event: ReactPointerEvent<HTMLButtonElement>) => {
    festivalSweepActiveRef.current = true;
    festivalSweepLastPointRef.current = { x: event.clientX, y: event.clientY };
    festivalSweepDistanceRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
    setMessage("按住实物沿着场景来回移动；移动距离不够、只点一下都不会完成。 ");
  };

  const moveFestivalSweep = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!festivalSweepActiveRef.current || !festivalSweepLastPointRef.current || !festivalProcess) return;
    const previous = festivalSweepLastPointRef.current;
    festivalSweepDistanceRef.current += Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
    festivalSweepLastPointRef.current = { x: event.clientX, y: event.clientY };
    if (festivalSweepDistanceRef.current < 74) return;
    festivalSweepDistanceRef.current -= 74;
    const required = festivalActionRequirements[festivalProcess.id]?.[festivalProcess.step] ?? 1;
    const finishing = festivalActionCountRef.current + 1 >= required;
    performFestivalDetailAction();
    if (finishing) {
      festivalSweepActiveRef.current = false;
      festivalSweepLastPointRef.current = null;
    }
  };

  const endFestivalSweep = () => {
    festivalSweepActiveRef.current = false;
    festivalSweepLastPointRef.current = null;
  };

  const renderFestivalHandsOn = (process: { title: string; intro: string; steps: { label: string; detail: string; icon: string }[] }, step: { label: string; detail: string; icon: string }) => {
    if (!festivalProcess) return null;
    if (festivalProcess.id === "firstSnow") {
      if (festivalProcess.step === 0) return <div className="snow-rolling-workshop"><strong>按住“前进”，让小禾真的跑起来推雪球</strong><div className="snow-rolling-field"><i className="snow-track" /><div className="snow-runner" style={{ left: `${snowBuild.playerX}%` }}><i /><b /><em /></div><i className={`rolling-snowball body-ball ${snowBuild.bodyPlaced ? "placed" : ""}`} style={{ left: `${snowBuild.bodyX}%`, width: `${snowBuild.bodySize}px`, height: `${snowBuild.bodySize}px` }} />{snowBuild.bodyPlaced && <i className={`rolling-snowball head-ball ${snowBuild.headRolled ? "ready" : ""}`} style={{ left: `${snowBuild.headX}%`, width: `${snowBuild.headSize}px`, height: `${snowBuild.headSize}px` }} />}<div className="snow-watching-villagers"><i /><i /><i /></div></div><button className="snow-hold-forward" disabled={snowBuild.headRolled} onPointerDown={beginSnowPushing} onPointerUp={stopSnowPushing} onPointerCancel={stopSnowPushing}><i>→</i><span>{snowBuild.headRolled ? "两个雪球都滚好了" : snowBuild.bodyPlaced ? "一直按住 · 跑着推头部雪球" : "一直按住 · 往前跑着推身体雪球"}</span></button><div className="snow-roll-status"><span className={snowBuild.bodyPlaced ? "done" : "active"}>① 推大身体雪球</span><span className={snowBuild.bodyPlaced && !snowBuild.headRolled ? "active" : snowBuild.headRolled ? "done" : ""}>② 回起点推头部雪球</span></div><small>松手就会停下；先把大雪球放稳，再回来推第二个雪球。</small></div>;
      if (festivalProcess.step === 1) return <div className="snow-stacking-workshop"><strong>按住小雪球，抬到大雪球正上方再松手</strong><div className="snow-stack-field"><i className="stack-ground" /><div className="snow-base-ball"><i /></div><button data-festival-drop="snow-stack" className="snow-head-target" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); stackSnowHead(); }}><i>{snowBuild.headStacked ? "✓" : "放在这里"}</i></button>{!snowBuild.headStacked && <button draggable className={`snow-head-source ${festivalDragging ? "dragging" : ""}`} onDragStart={() => beginFestivalDrag("双手托住小雪球，把它拖到大雪球正上方的绿色圆圈。 ")} onPointerDown={() => beginFestivalDrag("按住小雪球不要松手，抬到大雪球正上方。 ")}><i /><span>按住小雪球</span></button>}<button data-festival-drop="wrong" className="snow-stack-wrong" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); dropFestivalObject(false); }}>地面太偏<br />会滚下来</button><div className="snow-lifter"><i /><b /></div></div><small>落点偏到旁边，小雪球会滚回地面，必须重新抬。</small></div>;
      const decorations = [{ icon: "煤", name: "两颗煤球眼睛", target: "眼睛位置" }, { icon: "萝", name: "胡萝卜鼻子", target: "鼻子位置" }, { icon: "枝", name: "左边树枝手", target: "左肩" }, { icon: "枝", name: "右边树枝手", target: "右肩" }, { icon: "巾", name: "红色围巾", target: "脖子" }];
      const decoration = decorations[Math.min(festivalActionCount, decorations.length - 1)];
      return <div className="snow-decorating-workshop"><strong>逐件拿起装饰，放到雪人身体的正确位置 · {festivalActionCount}/5</strong><div className="snow-decoration-field"><button draggable className={`snow-decoration-source part-${festivalActionCount} ${festivalDragging ? "dragging" : ""}`} onDragStart={() => beginFestivalDrag(`拿起${decoration.name}，拖到雪人的${decoration.target}。 `)} onPointerDown={() => beginFestivalDrag(`按住${decoration.name}不要松手，拖到${decoration.target}。 `)}><i>{decoration.icon}</i><span>{decoration.name}</span></button><div className={`detailed-snowman decorated-${festivalActionCount}`}><i className="snowman-head" /><i className="snowman-body" /><i className="coal-eye eye-one" /><i className="coal-eye eye-two" /><i className="carrot-nose" /><i className="branch-arm arm-left" /><i className="branch-arm arm-right" /><i className="snowman-scarf" /><button data-festival-drop="snow-decoration" className={`snow-part-target target-${festivalActionCount}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); placeSnowDecoration(); }}>{decoration.target}</button></div><button data-festival-drop="wrong" className="snow-decoration-wrong" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); dropFestivalObject(false); }}>装饰篮<br />放回这里不算安装</button><div className="snow-cheering-crowd"><i /><i /><i /><i /></div></div><small>眼睛、鼻子、左右树枝手和围巾都有专属位置，放错不会计入完成。</small></div>;
    }
    const bespokeRequired = festivalActionRequirements[festivalProcess.id]?.[festivalProcess.step] ?? 1;
    const bespokeIcons = festivalActionIcons[festivalProcess.id]?.[festivalProcess.step] ?? [step.icon];
    const bespokeIcon = bespokeIcons[Math.min(festivalActionCount, bespokeIcons.length - 1)] ?? step.icon;
    const bespokeProgress = `${Math.min(100, (festivalActionCount / Math.max(1, bespokeRequired)) * 100)}%`;
    const dragSource = (label: string, className = "") => <button draggable className={`bespoke-drag-source ${className} ${festivalDragging ? "dragging" : ""}`} onDragStart={() => beginFestivalDrag(`拿稳${label}，拖到场景里发绿光的正确位置。`)} onPointerDown={() => beginFestivalDrag(`按住${label}不要松手，拖到发绿光的位置。`)}><i>{bespokeIcon}</i><span>{label}</span></button>;
    const dropTarget = (label: string, className = "") => <button data-festival-drop="correct" className={`bespoke-drop-target ${className}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); dropFestivalObject(true); }}><i /><span>{label}</span></button>;
    const sweepTool = (label: string, className = "") => <button className={`bespoke-sweep-tool ${className}`} onPointerDown={beginFestivalSweep} onPointerMove={moveFestivalSweep} onPointerUp={endFestivalSweep} onPointerCancel={endFestivalSweep}><i>{bespokeIcon}</i><span>{label}</span></button>;
    const holdControl = (label: string, className = "") => <button className={`bespoke-hold-control ${className}`} onPointerDown={beginFestivalHoldAction} onPointerUp={stopFestivalHoldAction} onPointerCancel={stopFestivalHoldAction}><i>{bespokeIcon}</i><span>{label}</span></button>;

    if (festivalProcess.id === "lantern") {
      if (festivalProcess.step === 0) return <div className="festival-story-workshop lantern-frame-workshop"><strong>逐件拿起竹骨，把它装到发光接口上</strong><div className="lantern-frame-table">{dragSource(["圆形竹圈","十字撑杆","中心铜扣","红色提绳"][festivalActionCount] ?? "灯架零件","lantern-frame-source")}<div className={`real-lantern-frame built-${festivalActionCount}`}><i /><b /><em /><u /></div>{dropTarget("灯架接口","lantern-frame-target")}</div><div className="bespoke-meter"><i style={{ width: bespokeProgress }} /><span>骨架 {festivalActionCount}/4</span></div><small>触屏也要按住零件移动到右边接口再松手，直接点接口不会安装。</small></div>;
      if (festivalProcess.step === 1) return <div className="festival-story-workshop lantern-paper-workshop"><strong>按住糊纸刷，沿当前发光的边缘来回移动</strong><div className="lantern-paper-table"><div className={`real-paper-lantern pasted-${festivalActionCount}`}><i /><b /><em /><u /><s /></div><div className="lantern-paper-edges">{[0,1,2,3,4].map((index)=><i key={index} className={index < festivalActionCount ? "done" : index === festivalActionCount ? "current" : ""} />)}</div>{sweepTool("按住刷子沿亮边来回糊纸","lantern-paper-brush")}</div><div className="bespoke-meter"><i style={{ width: bespokeProgress }} /><span>糊纸 {festivalActionCount}/5</span></div><small>刷子必须真的移动；彩纸、上下包边、流苏和谜签会一件件出现。</small></div>;
      if (festivalProcess.step === 2) return <div className="festival-story-workshop lantern-light-workshop"><strong>一直按住火折子，依次等四盏灯芯稳定亮起</strong><div className="lantern-light-yard"><div className="festival-lantern-row">{[0,1,2,3].map((index)=><i key={index} className={index < festivalActionCount ? "lit" : index === festivalActionCount ? "lighting" : ""}><b /><em /><u /></i>)}</div>{holdControl("按住火折子点灯，松手就暂停","lantern-wick-lighter")}</div><div className="bespoke-meter"><i style={{ width: bespokeProgress }} /><span>已点亮 {festivalActionCount}/4</span></div><small>灯芯会从微火慢慢变亮，四盏花灯不会同时凭空亮起来。</small></div>;
      const riddle = LANTERN_RIDDLES[Math.min(festivalActionCount, LANTERN_RIDDLES.length - 1)];
      return <div className="festival-story-workshop lantern-riddle-workshop"><strong>第 {festivalActionCount + 1} 张灯谜 · 读谜面后亲手拖动答案</strong><div className="lantern-riddle-stage"><div className="hanging-riddle-lantern"><i /><b /><em /></div><div className="festival-riddle-scroll"><b>{riddle.question}</b><span>把正确答案卡拖到右边灯谜签</span></div><div className="festival-riddle-answers">{riddle.answers.map((answer,index)=><button key={answer} draggable className={festivalDragging ? "dragging" : ""} onDragStart={() => { festivalRiddleCorrectRef.current = index === riddle.correct; beginFestivalDrag(`拿起“${answer}”答案卡，把它拖到右边灯谜签。`); }} onPointerDown={() => { festivalRiddleCorrectRef.current = index === riddle.correct; beginFestivalDrag(`按住“${answer}”不要松手，拖到右边灯谜签。`); }}><i>{answer.slice(0,1)}</i><span>{answer}</span></button>)}</div><button data-festival-drop="lantern-riddle" className="festival-riddle-target" onDragOver={(event)=>event.preventDefault()} onDrop={(event)=>{ event.preventDefault(); const correct = festivalRiddleCorrectRef.current === true; festivalRiddleCorrectRef.current = null; dropFestivalObject(correct); }}><i /><span>灯谜答案签<br />拖到这里松手</span></button></div><div className="bespoke-meter"><i style={{ width: bespokeProgress }} /><span>答对 {festivalActionCount}/3</span></div><small>选错的卡片会回到桌上，不会直接替你跳到正确答案。</small></div>;
    }

    if (festivalProcess.id === "medical") {
      if (festivalProcess.step === 0) return <div className="festival-story-workshop medical-exam-workshop"><strong>移动检查器，依次观察四项真实症状</strong><div className="medical-exam-room"><div className="medical-patient"><i /><b /><em /><u /></div><div className="medical-vital-cards"><i className={festivalActionCount > 0 ? "done" : ""}>精神</i><i className={festivalActionCount > 1 ? "done" : ""}>体温</i><i className={festivalActionCount > 2 ? "done" : ""}>呼吸</i><i className={festivalActionCount > 3 ? "done" : ""}>淋雨</i></div>{sweepTool("按住检查器在病人身边缓慢移动","medical-scanner")}</div><div className="bespoke-meter"><i style={{ width: bespokeProgress }} /><span>{festivalActionCount}/4 项</span></div><small>检查器要真的来回移动；只碰一下病人不会得到记录。</small></div>;
      if (festivalProcess.step === 1) return <div className="festival-story-workshop medical-tray-workshop"><strong>逐件把干净护理器具放进绿色护理盘</strong><div className="medical-tray-room">{dragSource(["干净毛巾","温度计","温水杯","记录本"][festivalActionCount] ?? "护理器具","medical-tool-source")}<div className="dirty-medical-tools"><i>脏</i><span>用过的器具<br />不能放进去</span></div>{dropTarget("干净护理盘","medical-clean-tray")}</div><div className="placed-medical-tools">{["巾","计","水","本"].map((item,index)=><i key={item} className={index < festivalActionCount ? "done" : ""}>{item}</i>)}</div><small>触屏：按住左边器具，手指移到护理盘再松开；脏器具会被排除。</small></div>;
      if (festivalProcess.step === 2) return <div className="festival-story-workshop medical-clean-workshop"><strong>拿消毒棉沿六个位置来回擦拭</strong><div className="medical-clean-room"><div className="medical-clean-spots">{["桌面","杯口","勺子","双手","药罐","毛巾"].map((item,index)=><i key={item} className={index < festivalActionCount ? "done" : index === festivalActionCount ? "current" : ""}>{item}</i>)}</div>{sweepTool("按住消毒棉左右擦","medical-cotton")}</div><small>每一处都要产生足够的移动距离，发亮变绿才算消毒完成。</small></div>;
      if (festivalProcess.step === 3) return <div className="festival-story-workshop medical-mix-workshop"><strong>看病例卡，把五份配料逐一加入量杯</strong><div className="medical-mix-room"><div className="medical-case-card"><b>游戏病例配方</b><span>药片 2 · 温水 1<br />草药 1 · 量杯 1</span></div>{dragSource(["第一份药片","第二份药片","温水","草药","量杯"][festivalActionCount] ?? "配料","medical-ingredient")}{dropTarget("刻度量杯","medical-measuring-cup")}</div><div className="medicine-level"><i style={{ height: bespokeProgress }} /></div><small>这是青禾谷里的虚构游戏训练，不是真实医疗建议；放错桌面会退回。</small></div>;
      return <div className="festival-story-workshop medical-care-workshop"><strong>连续完成热敷、补水、记录、休息和复查</strong><div className="medical-care-room"><div className="recovering-patient"><i /><b /><em /></div><div className="care-checklist">{["热敷","补水","记录","休息","复查"].map((item,index)=><i key={item} className={index < festivalActionCount ? "done" : index === festivalActionCount ? "current" : ""}>{item}</i>)}</div>{holdControl("一直按住护理，松手会暂停","medical-care-hold")}</div><small>病人的脸色和呼吸会随着护理进度逐渐恢复。</small></div>;
    }

    if (festivalProcess.id === "kite") {
      if (festivalProcess.step === 0) return <div className="festival-story-workshop kite-frame-workshop"><strong>把四件竹骨零件装到纸鸢工作台</strong><div className="kite-craft-table">{dragSource(["长竹条","横竹条","中心扣","牵引线"][festivalActionCount] ?? "竹骨","kite-part-source")}<div className={`real-kite-frame built-${festivalActionCount}`}><i /><b /><em /><u /></div>{dropTarget("竹骨发光接口","kite-frame-target")}</div><div className="bespoke-meter"><i style={{ width: bespokeProgress }} /><span>骨架 {festivalActionCount}/4</span></div><small>竹条、中心扣和线都有自己的安装位置，要按顺序装牢。</small></div>;
      if (festivalProcess.step === 1) return <div className="festival-story-workshop kite-paper-workshop"><strong>沿纸鸢四条边刷胶、压紧彩纸</strong><div className="kite-paper-table"><div className={`real-kite-paper pasted-${festivalActionCount}`}><i /><b /><em /><u /></div><div className="kite-edge-lights">{[0,1,2,3].map(index=><i key={index} className={index < festivalActionCount ? "done" : index === festivalActionCount ? "current" : ""} />)}</div>{sweepTool("按住刷子，沿亮边来回刷","kite-glue-brush")}</div><small>每一条边都要完整刷过；刷子没有移动就不会贴牢。</small></div>;
      return <div className="festival-story-workshop kite-flying-workshop"><strong>迎风奔跑，把纸鸢一段一段放上天空</strong><div className="kite-flying-field"><div className="kite-runner" style={{ left: `${8 + festivalActionCount * 10}%` }}><i /><b /></div><div className="flying-real-kite" style={{ right: `${10 + festivalActionCount * 7}%`, top: `${54 - festivalActionCount * 7}%` }}><i /><b /></div><i className="kite-string" style={{ width: `${25 + festivalActionCount * 8}%` }} /><div className="kite-wind"><i /><i /><i /></div>{holdControl("一直按住奔跑并放线","kite-run-hold")}</div><small>松手小禾就会停下；风筝要经过六段放线才会稳定飞起来。</small></div>;
    }

    if (festivalProcess.id === "flower") {
      if (festivalProcess.step === 0) return <div className="festival-story-workshop flower-observe-workshop"><strong>用放大镜依次扫过红、黄、蓝、白四种花</strong><div className="flower-observe-field"><div className="real-flower-bed">{["red","yellow","blue","white"].map((color,index)=><i key={color} className={`${color} ${index < festivalActionCount ? "observed" : index === festivalActionCount ? "current" : ""}`}><b /><em /></i>)}</div>{sweepTool("按住放大镜，在花瓣上移动","flower-magnifier")}</div><small>花瓣的层数、花心和叶脉会在放大镜经过后记录下来。</small></div>;
      if (festivalProcess.step === 1) return <div className="festival-story-workshop flower-scent-workshop"><strong>闻香后，把三张香气记录卡放到对应花瓶</strong><div className="flower-scent-table">{dragSource(["清甜香气卡","淡草香气卡","浓花香气卡"][festivalActionCount] ?? "香气卡","scent-card-source")}<div className="scent-bottles"><i /><i /><i /></div>{dropTarget("本轮对应花瓶","scent-bottle-target")}</div><small>卡片的颜色和花瓶花瓣相互对应，放错会退回记录桌。</small></div>;
      return <div className="festival-story-workshop bee-hotel-workshop"><strong>把五种天然材料逐层装进蜜蜂小花屋</strong><div className="bee-hotel-scene">{dragSource(["木片","细草","竹管","干叶","固定绳"][festivalActionCount] ?? "花屋材料","bee-material-source")}<div className={`real-bee-hotel filled-${festivalActionCount}`}><i /><b /><em /><u /><s /></div>{dropTarget("花屋空格","bee-hotel-target")}<div className="flying-bees"><i /><i /><i /></div></div><small>材料都装好后，蜜蜂只在花屋外活动，不会被手抓住。</small></div>;
    }

    if (festivalProcess.id === "water") {
      const pipeParts = [{ label: "蓝色弯管", icon: "弯" }, { label: "长直管", icon: "直" }, { label: "铜接头", icon: "接" }, { label: "总水阀", icon: "阀" }];
      if (festivalProcess.step === 0) return <div className="festival-story-workshop water-pipe-workshop"><strong>自己辨认形状，把四段水管装到对应接口</strong><div className="water-pipe-yard"><div className="water-pipe-rack">{pipeParts.map((part, index) => <button key={part.label} draggable={!waterFestival.installedPipes[index]} disabled={waterFestival.installedPipes[index]} className={`water-pipe-piece pipe-${index} ${waterFestival.heldPipe === index ? "held" : ""} ${waterFestival.installedPipes[index] ? "used" : ""}`} onDragStart={() => selectWaterPipe(index)} onPointerDown={() => selectWaterPipe(index)}><i>{part.icon}</i><span>{waterFestival.installedPipes[index] ? "已装好" : part.label}</span></button>)}</div><div className="water-pipe-board">{pipeParts.map((part, index) => <button key={part.label} data-water-pipe-slot={index} className={`water-pipe-slot slot-${index} ${waterFestival.installedPipes[index] ? "installed" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); installWaterPipe(index); }}><i>{waterFestival.installedPipes[index] ? part.icon : "?"}</i><span>{part.label}接口</span></button>)}<div className={`connected-water-main ${waterFestival.installedPipes.every(Boolean) ? "ready" : ""}`}><i /><b /></div></div></div><div className="bespoke-meter"><i style={{ width: `${festivalActionCount * 25}%` }} /><span>水管 {festivalActionCount}/4</span></div><small>电脑可拖动；平板可先点水管再点接口。装错会漏水并退回材料架。</small></div>;
      if (festivalProcess.step === 1) return <div className="festival-story-workshop water-bucket-workshop"><strong>一直按住红色水阀，亲眼把四只水桶逐只接满</strong><div className="water-bucket-yard"><div className={`festival-water-tap ${waterFestival.bucketFill.some((fill) => fill > 0 && fill < 100) ? "running" : ""}`}><i /><b /><em /></div><div className="real-water-buckets">{waterFestival.bucketFill.map((fill, index) => <i key={index} className={fill >= 100 ? "full" : index === festivalActionCount ? "filling" : ""}><b style={{ height: `${Math.min(82, fill * .82)}%` }} /><span>{Math.round(fill)}%</span></i>)}</div><button className="water-valve-physical" onPointerDown={beginWaterFilling} onPointerUp={stopWaterFilling} onPointerCancel={stopWaterFilling}><i /><span>一直按住水阀</span></button></div><div className="bespoke-meter"><i style={{ width: `${festivalActionCount * 25}%` }} /><span>装满 {festivalActionCount}/4 桶</span></div><small>太早松手，水就会停；已经接进桶里的水会保留，接满才会换下一桶。</small></div>;
      const splashTargets = [{ name: "安安", x: 30, color: "mint" }, { name: "阿麦", x: 58, color: "red" }, { name: "小玲", x: 82, color: "purple" }];
      return <div className="festival-story-workshop water-relay-workshop"><strong>按住方向键跑到发光的人身边，再亲手按“泼水”</strong><div className={`water-relay-field soaked-${waterFestival.soaked}`}><div className="water-relay-lanes"><i /><i /><i /></div>{splashTargets.map((target, index) => <div key={target.name} className={`festival-water-resident resident-${target.color} ${index === waterFestival.hits ? "target" : ""} ${index < waterFestival.hits ? "splashed" : ""}`} style={{ left: `${target.x}%` }}><i /><b /><em /><span>{target.name}</span></div>)}<div className="water-relay-runner controllable" style={{ left: `${waterFestival.playerX}%` }}><i /><b /><em /><span>小禾</span></div>{waterFestival.soaked > 0 && <div className="counter-water-splash"><i /><i /><i /><b>他们也泼回来了！</b></div>}<div className="water-relay-controls"><button onPointerDown={(event) => beginWaterMoving(-1, event)} onPointerUp={stopWaterMoving} onPointerCancel={stopWaterMoving}><i>←</i><span>按住向左</span></button><button className="splash-button" onClick={splashWaterResident}><i>水</i><span>泼水</span></button><button onPointerDown={(event) => beginWaterMoving(1, event)} onPointerUp={stopWaterMoving} onPointerCancel={stopWaterMoving}><i>→</i><span>按住向右</span></button></div></div><div className="bespoke-meter"><i style={{ width: `${waterFestival.hits / 3 * 100}%` }} /><span>泼中居民 {waterFestival.hits}/3</span></div><small>站得太远会泼不到；每次命中，对方也会跑动并把水泼回小禾。</small></div>;
    }

    if (festivalProcess.id === "firefly") {
      if (festivalProcess.step === 0) return <div className="festival-story-workshop firefly-lamp-workshop"><strong>在夜色变深前装好柔光观察灯</strong><div className="firefly-lamp-table">{dragSource(["磨砂灯罩","暖色灯芯","固定卡扣","提灯细绳"][festivalActionCount] ?? "灯具零件","lamp-part-source")}<div className={`real-observation-lamp assembled-${festivalActionCount}`}><i /><b /><em /><u /></div>{dropTarget("观察灯接口","lamp-part-target")}</div><small>柔光灯不会惊扰萤火虫；零件要逐件装上，不是按一下就出现整盏灯。</small></div>;
      if (festivalProcess.step === 1) return <div className="festival-story-workshop firefly-search-workshop"><strong>提灯走过三片草丛，缓慢寻找自然微光</strong><div className="firefly-night-meadow"><div className="night-bushes">{[0,1,2].map(index=><i key={index} className={index < festivalActionCount ? "found" : index === festivalActionCount ? "current" : ""}><b /><em /></i>)}</div><div className="night-fireflies"><i /><i /><i /><i /><i /><i /></div>{sweepTool("按住观察灯，沿草丛慢慢移动","firefly-search-lamp")}</div><small>移动太快或只点一下都看不清；发现后萤火点会留在原处闪烁。</small></div>;
      return <div className="festival-story-workshop firefly-record-workshop"><strong>把时间、地点、亮度和数量记录进夜间观察册</strong><div className="firefly-record-table">{dragSource(["出现时间卡","草丛地点卡","微光亮度卡","萤火数量卡"][festivalActionCount] ?? "观察卡","firefly-card-source")}<div className={`real-firefly-notebook written-${festivalActionCount}`}><i /><b /><em /><u /></div>{dropTarget("观察册横线","firefly-notebook-target")}</div><small>四张记录卡全部归档后才算完成观察，不会捕捉或伤害萤火虫。</small></div>;
    }

    if (festivalProcess.id === "harvest") {
      if (festivalProcess.step === 0) return <div className="festival-story-workshop harvest-pick-workshop"><strong>从幼苗里找出四种真正成熟的作物并装筐</strong><div className="harvest-pick-field"><div className="mixed-harvest-crops"><i className="young" /><i className="ripe-pumpkin" /><i className="young" /><i className="ripe-corn" /><i className="ripe-berry" /><i className="young" /><i className="ripe-potato" /></div>{dragSource(["成熟南瓜","成熟玉米","成熟草莓","成熟土豆"][festivalActionCount] ?? "成熟作物","harvest-crop-source")}{dropTarget("丰收竹筐","harvest-main-basket")}</div><small>幼苗不会被拿走；成熟作物有完整果实、颜色和叶片。</small></div>;
      if (festivalProcess.step === 1) return <div className="festival-story-workshop harvest-grade-workshop"><strong>按大小和完整度把五份作物放进对应木筐</strong><div className="harvest-grade-yard">{dragSource(["大果","中果","小果","带叶果","整筐"][festivalActionCount] ?? "作物","grade-crop-source")}<div className="harvest-grade-baskets"><i><b>大</b></i><i><b>中</b></i><i><b>小</b></i></div>{dropTarget("当前发光木筐","grade-basket-target")}</div><small>木筐会按当前作物亮起，放错大小会送回分拣桌。</small></div>;
      return <div className="festival-story-workshop harvest-cart-workshop"><strong>推车上秤、校准重量，再跑到丰收交接点</strong><div className="harvest-cart-yard"><div className="real-harvest-cart" style={{ left: `${8 + festivalActionCount * 16}%` }}><i /><b /><em /></div><div className={`harvest-scale phase-${festivalActionCount}`}><i /><b /></div><div className="harvest-finish-flag"><i /><b /></div>{holdControl(["推向地秤","等待秤稳","继续推车","交给收货员"][festivalActionCount] ?? "完成交接","harvest-cart-hold")}</div><small>车轮、秤针和终点旗都会随四段过程移动，松手推车就停。</small></div>;
    }

    if (festivalProcess.id === "leafMusic") {
      if (festivalProcess.step === 0) return <div className="festival-story-workshop leaf-pick-workshop"><strong>挑出四片完整干燥的叶子，破叶不要装篮</strong><div className="leaf-pick-yard"><div className="mixed-autumn-leaves"><i className="broken" /><i /><i className="wet" /><i /><i className="broken" /><i /><i /></div>{dragSource(["完整枫叶","干燥银杏叶","完整橡叶","干燥桦叶"][festivalActionCount] ?? "完整落叶","leaf-source")}{dropTarget("干叶藤篮","leaf-basket-target")}</div><small>卷边破叶和湿叶不适合发声，拿错不会计入乐器材料。</small></div>;
      if (festivalProcess.step === 1) return <div className="festival-story-workshop leaf-tuning-workshop"><strong>用拨片沿五根琴弦来回校准音高</strong><div className="leaf-instrument-stage"><div className="real-leaf-zither">{[0,1,2,3,4].map(index=><i key={index} className={index < festivalActionCount ? "tuned" : index === festivalActionCount ? "current" : ""} />)}<b /><em /></div>{sweepTool("按住拨片，沿亮起琴弦滑动","leaf-tuning-pick")}</div><small>每根弦都要听到稳定音后才变绿；仅点琴弦不会调好。</small></div>;
      return <div className="festival-story-workshop leaf-concert-workshop"><strong>沿着六个亮起音符滑动，和乐队完成整段合奏</strong><div className="leaf-concert-stage"><div className="autumn-band"><i /><i /><i /><i /></div><div className="concert-note-track">{["♪","♫","♩","♪","♫","♩"].map((note,index)=><i key={index} className={index < festivalActionCount ? "played" : index === festivalActionCount ? "current" : ""}>{note}</i>)}</div>{sweepTool("按住叶笛，沿音符轨迹移动","leaf-concert-pipe")}</div><small>舞台上的居民会一起演奏；六拍必须按轨迹滑完，不是连续点按钮。</small></div>;
    }

    if (festivalProcess.id === "hotSoup") {
      if (festivalProcess.step === 0) return <div className="festival-story-workshop soup-ingredient-workshop"><strong>检查新鲜度，把四样好食材放进备菜盘</strong><div className="soup-pantry">{dragSource(["新鲜蘑菇","青菜","土豆","香草"][festivalActionCount] ?? "食材","soup-food-source")}<div className="spoiled-food"><i /><span>蔫掉的菜<br />不要使用</span></div>{dropTarget("木质备菜盘","soup-prep-tray")}</div><small>新鲜食材有自然颜色和完整叶片，坏掉的会被留在检查篮。</small></div>;
      if (festivalProcess.step === 1) return <div className="festival-story-workshop soup-chop-workshop"><strong>先清洗，再沿食材纹理完成四次切配</strong><div className="soup-chop-table"><div className={`real-chopping-board chopped-${festivalActionCount}`}><i /><b /><em /><u /><s /></div><div className="sink-water"><i /><b /></div>{sweepTool(["按住食材在水下清洗","沿纹理切第一刀","沿纹理切第二刀","沿纹理切第三刀","把切片推入盘中"][festivalActionCount] ?? "完成切配","soup-knife")}</div><small>手指要沿砧板横向移动；只按一下刀不会把食材切开。</small></div>;
      if (festivalProcess.step === 2) return <div className="festival-story-workshop soup-heat-workshop"><strong>持续看火，把汤温保持在橙色暖区六段时间</strong><div className="soup-stove-scene"><div className={`real-soup-pot heat-${festivalActionCount}`}><i /><b /><em /></div><div className="soup-heat-gauge"><i /><b style={{ height: `${22 + festivalActionCount * 11}%` }} /><em /></div>{holdControl("按住旋钮维持小火","soup-fire-knob")}</div><small>汤会冒出越来越稳定的蒸汽；松手火力就停止增加。</small></div>;
      return <div className="festival-story-workshop soup-serving-workshop"><strong>把五碗热汤逐碗端给等候的居民</strong><div className="soup-serving-hall">{dragSource(`第 ${festivalActionCount + 1} 碗热汤`,"soup-bowl-source")}<div className="soup-waiting-residents">{[0,1,2,3,4].map(index=><i key={index} className={index < festivalActionCount ? "served" : index === festivalActionCount ? "waiting" : ""}><b /><em /></i>)}</div>{dropTarget("当前居民的餐桌","soup-table-target")}</div><small>汤碗要稳稳拖到亮起的餐桌；居民喝到后脸和动作会变得暖和。</small></div>;
    }
    if (festivalProcess.id === "craft") {
      if (festivalProcess.step === 0) return <div className="wood-selection-workshop"><strong>检查四块木板 · 其中两块有不同位置的损坏</strong><div className="wood-board-row">{[0, 1, 2, 3].map((index) => { const damaged = damagedCraftBoards.includes(index); return <button key={`workshop-board-${index}`} className={`real-wood-board board-${index + 1} ${damaged ? `damaged damage-${index + 1}` : "sound"}`} onClick={() => chooseCraftWood(index)} aria-label={`第 ${index + 1} 块木板${damaged ? "，能看到裂痕" : "，木纹完整"}`}><i /><b /><em /><span>木板 {index + 1}</span></button>; })}</div><small>仔细看木板表面的深色裂纹。选中的木板会直接拿到雕刻台。</small></div>;
      if (festivalProcess.step === 1) return <div className="wood-carving-workshop"><strong>按住刻刀，顺着横向木纹左右刮 · {Math.round(craftCarveProgress)}%</strong><div className={`carving-board ${craftWoodChoice !== null && damagedCraftBoards.includes(craftWoodChoice) ? `damaged damage-${(craftWoodChoice ?? 0) + 1}` : "sound"}`}><i className="grain-line grain-one" /><i className="grain-line grain-two" /><i className="grain-line grain-three" /><span className="carved-bird-outline" style={{ opacity: Math.max(.08, craftCarveProgress / 100) }} /><button className={`carving-knife ${craftKnifeDragging ? "dragging" : ""}`} style={{ left: `${8 + craftCarveProgress * .68}%` }} onPointerDown={beginCraftCarving} onPointerMove={moveCraftKnife} onPointerUp={endCraftCarving} onPointerCancel={endCraftCarving} aria-label="按住并沿木纹左右拖动刻刀"><i /><b /></button></div><div className="wood-carve-meter"><i style={{ width: `${craftCarveProgress}%` }} /><span>顺纹进度 {Math.round(craftCarveProgress)}%　·　歪刀 {craftWrongCarves} 次</span></div><small>木纹是横向的。左右来回拖动会雕出轮廓，上下拖动会留下歪痕。</small></div>;
      return <div className={`wood-result-workshop quality-${craftResultQuality ?? "poor"}`}><strong>{craftResultQuality === "good" ? "顺着木纹雕出的精致木鸟" : "有裂口和歪痕的木鸟"}</strong><div className="finished-wood-bird"><i className="bird-body" /><i className="bird-wing" /><i className="bird-tail" /><i className="bird-eye" /><b className="display-plinth" /></div><p>{craftResultQuality === "good" ? "圆润的鸟身、展开的翅膀和尖尖的尾羽都能看清。" : "木板裂口或逆纹刀痕让翅膀一高一低，尾巴也歪了。下次换块好木板并顺着纹理刮，会更漂亮。"}</p><button onClick={advanceFestivalProcess}>把这件成品摆上展示台</button></div>;
    }
    if (festivalProcess.id === "seeds") {
      if (festivalProcess.step === 0) { const cleaned = !seedWorkshopBugs.some(Boolean) && !seedWorkshopDebris.some(Boolean); return <div className="seed-cleaning-workshop"><strong>清理四种种子里的小虫和杂物</strong><div className="seed-cleaning-table"><button className={`seed-sprayer ${seedSprayerPicked ? "picked" : ""}`} onClick={() => { setSeedSprayerPicked(true); setMessage("拿起了桌上的杀虫剂。现在点击种子旁边的小虫。 "); }}><i /><b /><span>{seedSprayerPicked ? "杀虫剂已拿起" : "桌上的杀虫剂"}</span></button><div className="mixed-seed-tray">{WORKSHOP_SEEDS.map((seed) => <i key={seed.id} className={`loose-seed seed-${seed.id}`} title={seed.name} />)}{seedWorkshopBugs.map((visible, index) => visible && <button key={`seed-bug-${index}`} className={`seed-bug bug-${index + 1}`} onClick={() => spraySeedBug(index)} aria-label={`种子旁边的第 ${index + 1} 只小虫`}><i /></button>)}{seedWorkshopDebris.map((visible, index) => visible && <button key={`seed-debris-${index}`} draggable className={`seed-debris debris-${index + 1} ${seedDebrisPicked === index ? "picked" : ""}`} onDragStart={() => { setSeedDebrisPicked(index); setMessage("拿起了一块混进种子里的杂物，把它拖到右边废料盒。 "); }} onClick={() => { setSeedDebrisPicked(index); setMessage("选中了杂物，再点击右边的废料盒。 "); }} aria-label={`混进种子里的第 ${index + 1} 块杂物`}><i /></button>)}</div><button className="seed-waste-bin" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); discardSeedDebris(); }} onClick={discardSeedDebris}><i /><span>废料盒</span></button></div><button className="seed-clean-finish" disabled={!cleaned} onClick={finishSeedCleaning}>{cleaned ? "种子已清干净 · 开始分类" : `还要清理：小虫 ${seedWorkshopBugs.filter(Boolean).length} · 杂物 ${seedWorkshopDebris.filter(Boolean).length}`}</button><small>先拿杀虫剂点小虫；杂物可以拖进废料盒，触屏也可以先点杂物再点废料盒。</small></div>; }
      if (festivalProcess.step === 1) { const heldSeed = WORKSHOP_SEEDS.find((seed) => seed.id === seedWorkshopHeld); return <div className="seed-sorting-workshop"><strong>把四种种子拖进春夏秋冬篮子</strong><div className="seed-sort-scene"><div className="seed-source-pile"><span>待分类种子</span>{WORKSHOP_SEEDS.filter((seed) => !seedWorkshopSorted.includes(seed.id)).map((seed) => <button key={seed.id} draggable className={`sort-seed seed-${seed.id} ${seedWorkshopHeld === seed.id ? "held" : ""}`} onDragStart={() => pickWorkshopSeed(seed.id)} onClick={() => pickWorkshopSeed(seed.id)}><i /><b>{seed.name}</b></button>)}</div><div className="season-baskets">{(["春", "夏", "秋", "冬"] as WorkshopSeason[]).map((season) => { const sortedSeed = WORKSHOP_SEEDS.find((seed) => seed.season === season && seedWorkshopSorted.includes(seed.id)); return <button key={season} className={`season-basket season-${season} ${sortedSeed ? "filled" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); sortWorkshopSeed(season); }} onClick={() => sortWorkshopSeed(season)}><span>{season}</span><i />{sortedSeed && <b>{sortedSeed.name}</b>}</button>; })}</div></div><div className="held-seed-name">{heldSeed ? <>正在拿：<b>{heldSeed.name}</b> · {heldSeed.hint}</> : "拿起左边任意种子，就会显示它的名字和提示"}</div><small>拖错篮子不会消失，可以重新辨认后再放。</small></div>; }
      return <div className={`seed-gift-workshop ${seedGiftTied ? "gift-tied" : ""}`}><strong>{seedGiftTied ? "种子礼包已经扎好" : "点击礼包，用丝绸扎出蝴蝶结"}</strong><button className="seed-gift-bag" onClick={tieSeedGift}><i className="gift-seed seed-strawberry" /><i className="gift-seed seed-watermelon" /><i className="gift-seed seed-corn" /><i className="gift-seed seed-pumpkin" /><b className="gift-ribbon" /><em /><span>{seedGiftTied ? "蝴蝶结扎好了 · 收进背包" : "点击扎上红色丝绸"}</span></button><small>{seedGiftTied ? "四种种子分袋装好，丝绸蝴蝶结已经出现在袋口。" : "礼包里装着草莓、西瓜、玉米和南瓜种子。"}</small></div>;
    }
    if (festivalProcess.id === "midAutumn") {
      if (festivalProcess.step === 0) return <div className={`river-lantern-craft fold-${riverLanternFold}`}><strong>按住纸角，拖到虚线折痕上，一折一折做灯罩</strong><button draggable className={`lantern-paper ${festivalDragging ? "paper-held" : ""}`} onDragStart={() => beginFestivalDrag("按住纸角，把它拖到右边发光的虚线折痕上。 ")} onPointerDown={() => beginFestivalDrag("手指不要松开，把纸角拖到右边发光的虚线折痕上。 ")}><i /><b /><span>按住纸角 · 已折 {riverLanternFold}/3</span></button><button data-festival-drop="lantern-fold" className="lantern-fold-guide" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (festivalDragReadyRef.current) { festivalDragReadyRef.current = false; setFestivalDragging(false); foldRiverLanternPaper(); } }}><i /><span>虚线折痕</span></button><small>必须把纸角拖到折痕；只点纸不会完成。</small></div>;
      if (festivalProcess.step === 1) return <div className="river-lantern-craft wick-stage"><strong>把灯芯缓缓拖进做好的灯罩</strong><button draggable className={`lantern-wick ${riverLanternWickPicked ? "picked" : ""}`} onDragStart={() => { setRiverLanternWickPicked(true); setMessage("已经拿起灯芯，慢慢拖到右边灯罩里面。 "); }} onClick={() => { setRiverLanternWickPicked(true); setMessage("灯芯已经拿起，再点击右边的灯罩也可以放进去。 "); }}><i /><span>灯芯</span></button><button className="folded-lantern-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); installRiverLanternWick(); }} onClick={() => riverLanternWickPicked ? installRiverLanternWick() : setMessage("先从左边拿起灯芯。 ")}><i /><b /><span>拖到这里</span></button></div>;
      return <div className="river-lantern-water-stage"><strong>来到河边 · 点击河面上想放灯的位置</strong><button className="festival-river-surface" onClick={placeRiverLantern}>{riverLanternPosition && <i className="placed-river-lantern" style={{ left: `${riverLanternPosition.x}%`, top: `${riverLanternPosition.y}%` }}><b /></i>}<span>{riverLanternPosition ? "河灯正在缓缓漂动…" : "点击任意一处水面"}</span></button></div>;
    }
    if (festivalProcess.id === "coffee" && festivalProcess.step === 0) return <div className={`coffee-machine-task ${festivalActionCount ? "beans-loading" : ""}`}><strong>按住咖啡豆碗，拖到磨豆机上方的漏斗</strong><button draggable className={`coffee-bean-bowl ${festivalDragging ? "picked" : ""}`} onDragStart={() => beginFestivalDrag("端稳咖啡豆碗，拖到右边磨豆机的玻璃漏斗上。 ")} onPointerDown={() => beginFestivalDrag("手不要松开，把咖啡豆碗拖到右边的玻璃漏斗上。 ")}><i /><i /><i /><i /><span>{festivalActionCount ? "豆子正在滚进去…" : "按住整碗咖啡豆"}</span></button><div className="festival-coffee-grinder"><button data-festival-drop="coffee-beans" className="grinder-hopper" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (festivalDragReadyRef.current) { festivalDragReadyRef.current = false; setFestivalDragging(false); playCoffeeMachineAnimation("beans"); } }} aria-label="把咖啡豆倒进这里" /><b /><em /></div><small>没有对准漏斗，豆碗会回到桌上。</small></div>;
    if (festivalProcess.id === "coffee" && festivalProcess.step === 1) return <div className="coffee-machine-task handle-stage"><strong>按住木把手绕圈研磨 · {festivalActionCount}/6 圈</strong><div className="festival-coffee-grinder"><i className="grinder-hopper" /><b /><button className="grinder-handle-button" onPointerDown={beginCoffeeGrinding} onPointerMove={moveCoffeeGrinder} onPointerUp={endCoffeeGrinding} onPointerCancel={endCoffeeGrinding} aria-label="按住并绕圈转动磨豆机把手"><em style={{ rotate: `${festivalActionCount * 60}deg` }} /><span>按住绕圈</span></button></div><small>画小圆会带动把手转动；只点一下不会磨出咖啡粉。</small></div>;
    if (festivalProcess.id === "coffee" && festivalProcess.step === 2) return <div className={`coffee-water-task ${festivalActionCount ? "water-running" : ""}`}><strong>一直按住出水阀，直到细嘴壶接满</strong><button className="coffee-water-dispenser" onPointerDown={beginCoffeeWater} onPointerUp={cancelCoffeeWater} onPointerLeave={cancelCoffeeWater} onPointerCancel={cancelCoffeeWater}><i /><b /><em /><span>{festivalActionCount ? "不要松手，正在接水…" : "按住出水阀"}</span></button><div className="coffee-pour-kettle"><i /><b /></div><small>太早松开，水量会归零，需要重新接满。</small></div>;
    if (festivalProcess.id === "coffee" && festivalProcess.step === 3) return <div className="coffee-pour-workshop"><strong>按住细嘴壶，拖到滤杯上方绕圈冲泡</strong><button draggable className={`real-gooseneck-kettle ${festivalDragging ? "picked" : ""}`} onDragStart={() => beginFestivalDrag("拿稳装满热水的细嘴壶，拖到右边滤杯上方。 ")} onPointerDown={() => beginFestivalDrag("手不要松开，把细嘴壶拖到右边滤杯上方。 ")}><i /><b /><span>按住细嘴壶</span></button><button data-festival-drop="coffee-filter" className="coffee-filter-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); dropFestivalObject(); }}><i /><b /><em /><span>滤杯 · 对准这里冲泡</span></button><small>放到别处会失败；对准后热水会绕着咖啡粉一圈圈流下。</small></div>;
    if (festivalProcess.id === "coffee" && festivalProcess.step === 4) { const coffeeActions = [{ icon: "香", label: "把香气拖到鼻尖", target: "鼻尖" }, { icon: "杯", label: "把咖啡杯拖到嘴边", target: "嘴边" }, { icon: "酥", label: "把点心拖到嘴边", target: "嘴边" }]; const action = coffeeActions[festivalActionCount] ?? coffeeActions[2]; return <div className="coffee-tasting-workshop"><strong>真实品鉴 · {action.label}</strong><div className="coffee-tasting-table"><button draggable className={`coffee-taste-object taste-${festivalActionCount} ${festivalDragging ? "picked" : ""}`} onDragStart={() => beginFestivalDrag(`${action.label}，到右边人物脸上的发光位置再松手。 `)} onPointerDown={() => beginFestivalDrag(`${action.label}，手不要松开。 `)}><i>{action.icon}</i><span>{action.label}</span></button><div className="coffee-taster"><i /><b /><button data-festival-drop="coffee-taste" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); dropFestivalObject(); }}>{action.target}</button></div></div><small>闻香、啜饮、吃点心都要亲手拖到正确位置，顺序不能跳过。</small></div>; }
    if (festivalProcess.id === "spring") {
      if (festivalProcess.step === 0) return <div className={`spring-jam-workshop jam-stage-${festivalActionCount}`}><strong>先闻草莓香，再舀果酱，最后亲口品尝</strong><div className="jam-table-scene"><button className="jam-smell-action" disabled={festivalActionCount !== 0} onClick={performFestivalDetailAction}><i /><span>{festivalActionCount > 0 ? "闻过了 ✓" : "靠近果酱闻香"}</span></button><button draggable className={`jam-spoon ${festivalDragging ? "picked" : ""}`} disabled={festivalActionCount !== 1} onDragStart={() => { setFestivalDragging(true); setMessage("拿起小木勺，拖进中间的草莓果酱罐。 "); }} onClick={() => { setFestivalDragging(true); setMessage("木勺已经拿起，再点击果酱罐把果酱舀起来。 "); }}><i /><span>小木勺</span></button><button className="real-jam-jar" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (festivalActionCount === 1 && festivalDragging) { setFestivalDragging(false); performFestivalDetailAction(); } }} onClick={() => { if (festivalActionCount === 1 && festivalDragging) { setFestivalDragging(false); performFestivalDetailAction(); } else setMessage("先闻香，再拿起左边的小木勺。 "); }}><i /><b /><span>草莓果酱</span></button><button className="jam-taste-action" disabled={festivalActionCount !== 2} onClick={performFestivalDetailAction}><i /><span>尝一口木勺上的果酱</span></button></div><small>果酱会真的被木勺舀起来，不会按一下就结束。</small></div>;
      if (festivalProcess.step === 1) { const views = ["左侧羽纹", "正面轮廓", "右侧尾羽"]; return <div className={`spring-sculpture-workshop sculpture-view-${festivalActionCount}`}><strong>转动木雕展示台，从三个方向仔细参观</strong><div className="market-wood-sculpture"><i /><b /><em /></div><div className="sculpture-view-controls">{views.map((view, index) => <button key={view} disabled={index !== festivalActionCount} onClick={performFestivalDetailAction}>{index < festivalActionCount ? "✓ " : ""}{view}</button>)}</div><small>展示台会随着观察方向转动，三面都看完才能继续。</small></div>; }
      const notes = ["♪", "♫", "♩", "♪", "♫", "♩"]; return <div className="spring-music-workshop"><strong>跟着乐手听完整段旋律 · {festivalActionCount}/6</strong><div className="festival-musicians"><i /><i /><i /></div><div className="music-note-path">{notes.map((note, index) => <button key={`market-note-${index}`} disabled={index !== festivalActionCount} className={index < festivalActionCount ? "heard" : index === festivalActionCount ? "playing" : ""} onClick={performFestivalDetailAction}>{index < festivalActionCount ? "✓" : note}</button>)}</div><small>音符会一颗一颗亮起，完整听完六拍才结束。</small></div>;
    }
    if (festivalProcess.id === "springFestival") {
      if (festivalProcess.step === 0) return <div className="lion-ribbon-workshop"><strong>把红绸和铃铛拖到实体狮头上系好</strong><button draggable className={`lion-red-ribbon ${festivalDragging ? "picked" : ""}`} onDragStart={() => beginFestivalDrag("拿起红绸和铃铛，拖到右边狮头的额头上。 ")} onPointerDown={() => beginFestivalDrag("手指按住红绸不要松开，移动到右边狮头额头上再松手。 ")}><i /><b /><span>红绸与铃铛</span></button><button data-festival-drop="correct" className="festival-lion-head" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); dropFestivalObject(true); }}><i /><b /><em /><span>狮头 · 系在这里</span></button><small>平板上按住左边红绸，手指一直不松开，拖到右边整颗狮头区域再松手。</small></div>;
      if (festivalProcess.step === 1) { const beats = ["咚", "咚", "锵", "咚", "锵", "咚", "咚", "锵"]; return <div className="lion-drum-workshop"><strong>看准鼓谱，亲手敲完八拍 · {festivalActionCount}/8</strong><div className="lion-drum-score">{beats.map((beat, index) => <i key={`lion-beat-${index}`} className={index < festivalActionCount ? "done" : index === festivalActionCount ? "current" : ""}>{beat}</i>)}</div><button className="physical-festival-drum" onClick={performFestivalDetailAction}><i /><b /><span>{beats[festivalActionCount] ?? "完成"}！敲鼓</span></button><small>鼓面每敲一次都会震动，舞狮队会按节拍抬头、摆尾。</small></div>; }
      const route = ["↑", "→", "↓", "←", "↑", "→"]; return <div className="lion-parade-workshop"><strong>跟着舞狮沿广场路线走完六个路口</strong><div className="parade-map"><i className="parade-lion" style={{ left: `${14 + festivalActionCount * 12}%`, top: `${festivalActionCount % 2 ? 53 : 26}%` }} /><span /></div><div className="parade-route-controls">{route.map((direction, index) => <button key={`parade-turn-${index}`} disabled={index !== festivalActionCount} className={index < festivalActionCount ? "done" : index === festivalActionCount ? "current" : ""} onClick={performFestivalDetailAction}>{index < festivalActionCount ? "✓" : direction}</button>)}</div><small>按亮起的下一个方向，狮子会在地图上真实走到对应路口。</small></div>;
    }
    const required = festivalActionRequirements[festivalProcess.id]?.[festivalProcess.step] ?? 1;
    const icons = festivalActionIcons[festivalProcess.id]?.[festivalProcess.step] ?? [step.icon];
    const currentIcon = icons[Math.min(festivalActionCount, icons.length - 1)] ?? step.icon;
    const interactionModes: Partial<Record<FestivalId, Array<"drag" | "sweep" | "hold">>> = {
      lantern: ["drag", "sweep", "hold", "drag"],
      medical: ["sweep", "drag", "sweep", "drag", "hold"], kite: ["drag", "sweep", "hold"], flower: ["sweep", "drag", "drag"], water: ["drag", "hold", "hold"],
      firefly: ["drag", "sweep", "drag"], harvest: ["drag", "drag", "hold"], leafMusic: ["drag", "sweep", "hold"], hotSoup: ["drag", "sweep", "hold", "drag"],
    };
    const mode = interactionModes[festivalProcess.id]?.[festivalProcess.step] ?? "drag";
    const physicalLabels: Partial<Record<FestivalId, string[]>> = {
      lantern: ["把竹骨逐件装到灯架接口", "沿五条亮边刷胶糊纸", "按住火折子逐盏点灯", "挑选正确答案拖到灯谜签"],
      medical: ["移动观察镜检查病人", "把干净器具放进护理盘", "拿消毒棉沿六处来回擦", "按病例卡逐份配药", "按住护理直到复查完成"],
      kite: ["把竹条拖进交叉骨架", "按住刷子沿纸鸢边缘来回刷胶", "按住奔跑，让小禾迎风放线"],
      flower: ["按住放大镜扫过不同花瓣", "把香气卡拖到对应花朵", "把木片、细草和竹管装进蜂屋"],
      water: ["把不同弯管拖到水道接口", "按住水阀，把四只水桶接满", "按住奔跑，和队伍完成泼水接力"],
      firefly: ["把柔光灯罩装到观察灯上", "按住观察镜慢慢扫过三处草丛", "把时间、地点和亮度卡拖进记录本"],
      harvest: ["辨认成熟作物并拖进收获筐", "按大小把作物拖进不同木筐", "按住推车，称重后跑到交接终点"],
      leafMusic: ["挑出完整干燥的叶片放入篮中", "按住调音拨片沿琴弦来回校准", "按住演奏，跟随乐队完成整段合奏"],
      hotSoup: ["把新鲜食材逐样放进备菜盘", "按住刀具沿食材纹理清洗切配", "按住火力旋钮，把汤维持在暖色区", "把装好的热汤逐碗端给居民"],
    };
    const actionLabel = physicalLabels[festivalProcess.id]?.[festivalProcess.step] ?? step.label;
    return <div className={`festival-hands-on festival-real-workshop detailed-${festivalProcess.id} action-${festivalProcess.id}-${festivalProcess.step} mode-${mode}`}><div className="festival-action-backdrop"><i /><i /><i /></div><div className="festival-moving-crowd"><i /><i /><i /><i /></div><div className="festival-theme-props"><i /><i /><i /><i /><i /></div><strong>{step.label}</strong><p>{actionLabel}</p><div className="festival-real-action-field">{mode === "drag" ? <><button draggable className={`festival-real-object ${festivalDragging ? "dragging" : ""}`} onDragStart={() => beginFestivalDrag(`按住“${currentIcon}”实物，观察场地后拖到正确的${step.label}位置。 `)} onPointerDown={() => beginFestivalDrag(`手不要松开，把“${currentIcon}”拖到正确的${step.label}位置。 `)}><i>{currentIcon}</i><span>按住真实物品拖动</span></button><button data-festival-drop="wrong" className="festival-wrong-target" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); dropFestivalObject(false); }}><i>×</i><span>错误位置<br />放错会退回</span></button><button data-festival-drop="correct" className="festival-real-target" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); dropFestivalObject(true); }}><i>✦</i><span>{step.label}<br />对准后松手</span></button></> : mode === "sweep" ? <><div className="festival-sweep-surface"><i /><i /><i /><i /><span>沿发光轨迹来回移动</span></div><button className="festival-sweep-tool" onPointerDown={beginFestivalSweep} onPointerMove={moveFestivalSweep} onPointerUp={endFestivalSweep} onPointerCancel={endFestivalSweep}><i>{currentIcon}</i><span>按住来回操作</span></button></> : <><div className="festival-hold-scene"><i /><i /><i /><i /><b style={{ width: `${(festivalActionCount / Math.max(1, required)) * 100}%` }} /></div><button className="festival-hold-control" onPointerDown={beginFestivalHoldAction} onPointerUp={stopFestivalHoldAction} onPointerCancel={stopFestivalHoldAction}><i>{currentIcon}</i><span>一直按住进行</span></button></>}<i className="festival-action-runner" style={{ left: `${10 + (festivalActionCount / Math.max(1, required)) * 72}%` }}><b /><em /></i></div><div className="festival-detail-meter"><i style={{ width: `${(festivalActionCount / Math.max(1, required)) * 100}%` }} /><span>实际完成 {festivalActionCount}/{required}</span></div><small>{mode === "drag" ? "必须拿起真实物品并对准，放错会退回" : mode === "sweep" ? "必须按住来回移动，单点不会产生进度" : "必须持续按住并观察场景，松手会暂停"}</small></div>;
  };

  const advanceFestivalProcess = () => {
    if (!festivalProcess) return;
    const process = FESTIVAL_PROCESS_STEPS[festivalProcess.id];
    if (!process) return;
    if (festivalProcess.step < process.steps.length - 1) {
      const nextStep = festivalProcess.step + 1;
      setFestivalProcess({ ...festivalProcess, step: nextStep });
      festivalActionCountRef.current = 0;
      setFestivalActionCount(0);
      setFestivalDragging(false);
      setMessage(`完成“${process.steps[festivalProcess.step].label}”，接下来：${process.steps[nextStep].label}。`);
      playTone(620 + nextStep * 80);
      return;
    }
    const completionKey = `${game.year}-${game.season}-${game.day}-${festivalProcess.id}`;
    const alreadyCompleted = game.festivalActivitiesCompleted.includes(completionKey);
    setGame((current) => {
      if (alreadyCompleted) return current;
      const seedReward = festivalProcess.id === "seeds" ? {
        seeds: current.seeds + 2, strawberrySeeds: current.strawberrySeeds + 2, cornSeeds: current.cornSeeds + 2,
        pineappleSeeds: current.pineappleSeeds + 2, watermelonSeeds: current.watermelonSeeds + 2,
        tomatoSeeds: current.tomatoSeeds + 2, potatoSeeds: current.potatoSeeds + 2,
        pumpkinSeeds: current.pumpkinSeeds + 2, blueberrySeeds: current.blueberrySeeds + 2,
      } : {};
      return {
        ...current,
        ...seedReward,
        medicalTrained: festivalProcess.id === "medical" ? true : current.medicalTrained,
        coins: current.coins + 100,
        energy: Math.min(100, current.energy + 15),
        festivalActivitiesCompleted: [...current.festivalActivitiesCompleted, completionKey],
      };
    });
    setMessage(alreadyCompleted ? `${process.title}的全部过程今天已经体验过了。` : festivalProcess.id === "medical" ? `${process.title}全部完成！取得基础医疗学习资格。现在可以在诊所逐种学习八种病症。` : `${process.title}全部完成！获得 100 金币和 15 点体力。`);
    setFestivalProcess(null);
    setFestivalActionCount(0);
    setFestivalDragging(false);
    playTone(980);
  };

  const startDragonBoatTrip = () => {
    setDragonBoatTraveling(true);
    setDragonBoatOpen(false);
    setDragonBoatRole(null);
    setDragonBoatScore(0);
    setDragonBoatOpponent(0);
    setDragonBoatWinner(null);
    setMessage("老师和村民已经集合，小禾正和大家坐大巴前往龙舟比赛河道。 ");
    playTone(520);
    const travelTimer = window.setTimeout(() => {
      setDragonBoatTraveling(false);
      setDragonBoatOpen(true);
      setMessage("大巴到达比赛河道。先选择划桨手或鼓手，再亲手参加比赛。 ");
    }, 1_400);
    bedtimeTimersRef.current.push(travelTimer);
  };

  const pushDragonBoat = () => {
    if (!dragonBoatRole || dragonBoatWinner) return;
    setDragonBoatScore((current) => {
      const next = Math.min(14, current + (dragonBoatRole === "drummer" ? 1.25 : 1));
      if (next >= 14) {
        const completionKey = `${game.year}-${game.season}-${game.day}-dragonBoat`;
        const alreadyCompleted = game.festivalActivitiesCompleted.includes(completionKey);
        setDragonBoatWinner("player");
        setGame((latest) => alreadyCompleted ? latest : ({
          ...latest,
          coins: latest.coins + 180,
          energy: Math.max(0, latest.energy - staminaCost(latest, 5)),
          festivalActivitiesCompleted: [...latest.festivalActivitiesCompleted, completionKey],
        }));
        setMessage(alreadyCompleted ? "红队再次划过终点！今天的获胜奖励已经领过了。" : "红队先冲过终点！获得龙舟冠军和 180 金币！");
        playTone(1020);
      } else {
        playTone(dragonBoatRole === "drummer" ? 460 : 640);
      }
      return next;
    });
  };

  const answerLanternRiddle = (answerIndex: number) => {
    if (lanternRiddle === null) return;
    const riddle = LANTERN_RIDDLES[lanternRiddle];
    if (answerIndex !== riddle.correct) {
      setMessage("这个答案还不对，花灯轻轻晃了晃，可以再猜一次。 ");
      playTone(240);
      return;
    }
    const solvedKey = `${game.year}-${lanternRiddle}`;
    const alreadySolved = game.lanternRiddlesSolved.includes(solvedKey);
    setGame((current) => alreadySolved ? current : ({
      ...current,
      coins: current.coins + 30,
      lanternRiddlesSolved: [...current.lanternRiddlesSolved, solvedKey],
    }));
    setMessage(alreadySolved ? "答对啦！这盏花灯的灯谜今天已经猜过了。" : "灯谜答对啦！花灯亮得更漂亮了，获得 30 金币。 ");
    setLanternRiddle(null);
    playTone(920);
  };

  const finishExcursion = () => {
    if (excursionTimerRef.current) window.clearTimeout(excursionTimerRef.current);
    excursionTimerRef.current = null;
    setAmusementOpen(false);
    setBusTraveling(false);
    setGame((current) => ({ ...current, seasonExcursionCompleted: true, hour: Math.min(24, current.hour + 1) }));
    setMessage(`${excursionName}结束了，老师和同学们坐大巴回到学校。下面已经恢复成正常的开始听课。`);
    playTone(760);
  };

  const goToFestival = (festivalOverride?: (typeof FESTIVAL_SCHEDULE)[number]) => {
    const festival = festivalOverride ?? currentFestival ?? nextFestival;
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
    } else if (festival.id === "medical") {
      setScene("town"); setPlayer({ x: 9, y: 4 }); setActiveBuilding("clinic"); setMessage("青禾医疗节开始了！先完成基础实习，再在诊所逐种学习不同病症。 ");
    } else if (festival.id === "hotSoup") {
      setScene("town"); setPlayer({ x: 10, y: 6 }); setActiveBuilding("cafe"); setMessage("冬日热汤会开始了，阿麦正在等大家亲手煮汤。 ");
    } else if (festival.id === "flower") {
      setScene("eastNeighbor"); setPlayer({ x: 4, y: 5 }); setMessage("来到东郊果园参加百花观察节。 ");
    } else if (festival.id === "firefly") {
      setScene("westFriendFarm"); setPlayer({ x: 5, y: 5 }); setMessage("天色暗下来，安安带大家在林边寻找萤火虫。 ");
    } else if (festival.id === "harvest") {
      setScene("farm"); setPlayer({ x: 6, y: 5 }); setMessage("金秋丰收赛在青禾农场开始了。 ");
    } else if (festival.id === "leafMusic") {
      setScene("cultureDistrict"); setPlayer({ x: 5, y: 5 }); setMessage("枫叶音乐节在文化街开始了。 ");
    } else {
      setScene("town"); setPlayer({ x: 5, y: 5 }); setMessage(TRADITIONAL_FESTIVALS[festival.id]?.greeting ?? `${festival.name}开始啦！`);
    }
  };

  const previewFestivalFromCalendar = (festival: (typeof FESTIVAL_SCHEDULE)[number]) => {
    if (!festivalPreview) {
      setFestivalPreview({
        festivalId: festival.id,
        season: festival.season,
        day: festival.day,
        returnScene: scene,
        returnPlayer: player,
        returnActiveBuilding: activeBuilding,
        returnGame: game,
      });
    } else {
      setFestivalPreview((current) => current ? { ...current, festivalId: festival.id, season: festival.season, day: festival.day } : current);
    }
    setTownhallCalendarOpen(false);
    setFestivalProcess(null);
    festivalActionCountRef.current = 0;
    setFestivalActionCount(0);
    festivalDragReadyRef.current = false;
    setFestivalDragging(false);
    goToFestival(festival);
    setMessage(`正在体验${SEASONS[festival.season]}第 ${festival.day} 天的${festival.name}。右上角的 × 可以随时退出并回到原来的日期和位置。`);
    playTone(900);
  };

  const exitFestivalPreview = () => {
    if (!festivalPreview) return;
    const returning = festivalPreview;
    setGame((previewGame) => {
      const learnedTreatments = Array.from(new Set<IllnessId>([
        ...returning.returnGame.learnedTreatments,
        ...previewGame.learnedTreatments,
      ]));
      const medicalJournalEntries = previewGame.journalEntries.filter((entry) =>
        entry.includes("医疗节学会了") && !returning.returnGame.journalEntries.includes(entry),
      );
      return {
        ...returning.returnGame,
        medicalTrained: returning.returnGame.medicalTrained || previewGame.medicalTrained,
        learnedTreatments,
        journalEntries: [...medicalJournalEntries, ...returning.returnGame.journalEntries].slice(0, 40),
      };
    });
    setScene(returning.returnScene);
    setPlayer(returning.returnPlayer);
    setActiveBuilding(returning.returnActiveBuilding);
    setFestivalPreview(null);
    setFestivalProcess(null);
    festivalActionCountRef.current = 0;
    setFestivalActionCount(0);
    festivalDragReadyRef.current = false;
    setFestivalDragging(false);
    setDragonBoatOpen(false);
    setDragonBoatTraveling(false);
    setLanternRiddle(null);
    setMessage(`节日体验结束，已经回到第 ${returning.returnGame.year} 年${SEASONS[returning.returnGame.season]}第 ${returning.returnGame.day} 天。医疗节学到的资格和 ${Array.from(new Set([...returning.returnGame.learnedTreatments, ...game.learnedTreatments])).length} 种病症会永久保留。`);
    playTone(720);
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
    if (game.year === 1 && game.season === 0) {
      setMessage("这是最开始的道路修建期。完成以后，道路就会永久通车，不会每年夏天重复施工。 ");
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

  const buyAnimalRaincoat = () => {
    const price = 45;
    if (game.mallItems.animalRaincoat >= 4) {
      setMessage("四件黄色宠物雨衣已经买齐了，可以在左边背包里选择雨衣，再点击脚边的小宠物穿上。 ");
      return;
    }
    if (game.coins < price) {
      setMessage(`一件黄色宠物雨衣需要 ${price} 金币，现在的钱不够。`);
      playTone(220);
      return;
    }
    setGame((current) => ({
      ...current,
      coins: current.coins - price,
      mallItems: { ...current.mallItems, animalRaincoat: current.mallItems.animalRaincoat + 1 },
    }));
    setMessage(`买到第 ${game.mallItems.animalRaincoat + 1} 件黄色宠物雨衣！最多买四件，回到农场后从背包选择雨衣，再点击脚边的小宠物穿上。`);
    playTone(780);
  };

  const toggleAnimalRaincoat = (animalId: string, animalName: string) => {
    const wearing = game.animalRaincoatAssignments.includes(animalId);
    if (!wearing && game.animalRaincoatAssignments.length >= game.mallItems.animalRaincoat) {
      setMessage("没有空闲的宠物雨衣了。可以先从另一只小宠物身上脱下，或去商场二楼再买一件。 ");
      playTone(240);
      return;
    }
    setGame((current) => ({
      ...current,
      animalRaincoatAssignments: wearing
        ? current.animalRaincoatAssignments.filter((id) => id !== animalId)
        : [...current.animalRaincoatAssignments, animalId],
    }));
    setMessage(wearing ? `帮${animalName}脱下了黄色小雨衣。` : `帮${animalName}穿上了黄色小雨衣！雨天不会因淋雨生病，还会开心地跳水坑。`);
    playTone(wearing ? 520 : 820);
  };

  const handleFarmAnimalClick = (animal: FarmAnimalType) => {
    const name = farmAnimalName(animal);
    if (raincoatDressing) {
      setMessage(`${name}属于农场动物，不会淋雨生病，也不需要小雨衣。请点击跟在小禾脚边的小宠物穿雨衣。`);
      playTone(420);
      return;
    }
    collectAnimalProduct(animal);
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
    const petRecord: PetRecord = { id: `${pet.id}-${Date.now()}`, type: pet.id, sex: selectedPetSex, bornDay: game.day, bornSeason: game.season, bornYear: game.year };
    setGame((current) => ({ ...current, coins: current.coins - pet.price, pets: [...current.pets, petRecord] }));
    setMessage(`领养了${selectedPetSex}${pet.name}！它已经住进农舍旁的小宠物院。养到同种的一男一女，之后有机会生小宝宝。`);
    playTone(880);
  };

  const inspectPetNursery = () => {
    const pairedFamilies = PET_CATALOG.flatMap((kind) => {
      const sameType = game.pets.filter((pet) => pet.type === kind.id && !pet.id.includes("-baby-"));
      const hasPair = sameType.some((pet) => pet.sex === "男生") && sameType.some((pet) => pet.sex === "女生");
      if (!hasPair) return [];
      const lastBirthYear = game.lastPetBirthYears[kind.id];
      const familyStartYear = Math.max(1, ...sameType.map((pet) => pet.bornYear ?? 1));
      const yearsTogether = lastBirthYear ? game.year - lastBirthYear : game.year - familyStartYear + 1;
      return [{ kind, yearsTogether }];
    });
    const readyFamilies = pairedFamilies.filter((family) => family.yearsTogether >= 5);
    if (readyFamilies.length) {
      setGame((current) => {
        const lastPetBirthYears = { ...current.lastPetBirthYears };
        const newborns = readyFamilies.map(({ kind }, index): PetRecord => {
          lastPetBirthYears[kind.id] = current.year;
          return {
            id: `${kind.id}-baby-${current.year}-${current.season}-${current.day}-${Date.now()}-${index}`,
            type: kind.id,
            sex: (current.day + current.season + index) % 2 ? "女生" : "男生",
            bornDay: current.day,
            bornSeason: current.season,
            bornYear: current.year,
          };
        });
        return { ...current, pets: [...current.pets, ...newborns], lastPetBirthYears };
      });
      setMessage(`${readyFamilies.map(({ kind }) => kind.name).join("、")}家庭的五年记录已经核对完成，宝宝现在就在小育幼垫上！`);
      playTone(980);
      return;
    }
    if (!pairedFamilies.length) {
      setMessage("育幼垫还在等宝宝。需要同一种宠物各有一只男生和一只女生；只有不同种类，或者只有相同性别，都不会生宝宝。 ");
      playTone(320);
      return;
    }
    const soonest = pairedFamilies.reduce((best, family) => family.yearsTogether > best.yearsTogether ? family : best);
    setMessage(`${soonest.kind.name}家庭已经一起生活 ${Math.max(1, soonest.yearsTogether)} 年，还要再过 ${Math.max(1, 5 - soonest.yearsTogether)} 年。达到第五年时，点育幼垫就会补生宝宝。`);
    playTone(420);
  };

  const contestCueFor = (rival: string, exchange: number): PetContestCue => {
    const code = [...rival].reduce((total, letter) => total + (letter.codePointAt(0) ?? 0), game.day + game.season * 3);
    return (["left", "rush", "right"] as PetContestCue[])[(code + exchange * 2) % 3];
  };

  const startPetContest = () => {
    const ownPet = game.pets.find((pet) => pet.id === selectedContestPet && !isNurseryPet(pet) && pet.id !== game.missingPetId);
    if (!ownPet) {
      setMessage(game.pets.length ? "请选择一只已经长大、现在没有走失的宠物上场。" : "家里还没有宠物。先去宠物之家领养一只，再来参加友谊赛。 ");
      playTone(230);
      return;
    }
    setPetContest({ ownPetId: ownPet.id, rival: selectedContestRival, round: 0, playerScore: 0, rivalScore: 0, exchanges: 0, boutWins: 0, boutLosses: 0, cue: contestCueFor(selectedContestRival, 0), finished: false });
    setPetContestAim(7);
    setPetContestPower(0);
    petContestAimDirectionRef.current = 1;
    setMessage("第一轮开始：彩带正在场中来回飘，看准它进入绿色区域时再让宠物扑过去！");
    playTone(760);
  };

  const finishPetContest = (result: PetContestState) => {
    const ownPet = game.pets.find((pet) => pet.id === result.ownPetId);
    const ownName = PET_CATALOG.find((pet) => pet.id === ownPet?.type)?.name ?? "小宠物";
    const rivalPet = residentPetProfile(result.rival);
    const won = result.playerScore > result.rivalScore;
    const tied = result.playerScore === result.rivalScore;
    const reward = won ? 60 : tied ? 35 : 20;
    const bond = won ? 8 : tied ? 5 : 3;
    setGame((current) => withFriendship({
      ...current,
      coins: current.coins + reward,
      petContestWins: current.petContestWins + (won ? 1 : 0),
      petBonds: { ...current.petBonds, [result.ownPetId]: Math.min(100, (current.petBonds[result.ownPetId] ?? 0) + bond) },
      journalEntries: [`${SEASONS[current.season]}第${current.day}天：${ownName}和${result.rival}的${rivalPet.nickname}完成三轮宠物友谊赛，比分 ${result.playerScore}:${result.rivalScore}。`, ...current.journalEntries].slice(0, 40),
    }, result.rival, won ? 4 : 2));
    setPetContest({ ...result, finished: true });
    setMessage(won ? `${ownName}赢下了友谊赛！获得 ${reward} 金币，宠物默契 +${bond}，和${result.rival}的好感也提高了。` : tied ? `双方打成平手！各自认真完成了比赛，获得 ${reward} 金币和 ${bond} 点宠物默契。` : `${ownName}这次没有赢，但完整比赛并学会了新动作，获得 ${reward} 金币和 ${bond} 点宠物默契。`);
    playTone(won ? 1040 : tied ? 820 : 620);
  };

  const catchContestRibbon = () => {
    if (!petContest || petContest.finished || petContest.round !== 0) return;
    const ownPet = game.pets.find((pet) => pet.id === petContest.ownPetId);
    const agile = ownPet?.type === "rabbit" || ownPet?.type === "chick" || ownPet?.type === "cat";
    const hit = petContestAim >= (agile ? 38 : 44) && petContestAim <= (agile ? 64 : 58);
    const rivalCode = [...petContest.rival].reduce((total, letter) => total + (letter.codePointAt(0) ?? 0), game.day);
    const rivalHit = rivalCode % 4 !== 0;
    setPetContest({ ...petContest, round: 1, playerScore: petContest.playerScore + (hit ? 1 : 0), rivalScore: petContest.rivalScore + (rivalHit ? 1 : 0) });
    setPetContestPower(0);
    setMessage(hit ? "彩带抓到了！第二轮要推软球：按住蓄力，力量进入绿色刻度时松手。" : "扑早了，彩带从爪边飘走。比赛继续：按住推球键蓄力，到绿色刻度再松手。 ");
    playTone(hit ? 850 : 330);
  };

  const startContestPush = () => {
    if (!petContest || petContest.finished || petContest.round !== 1 || petContestPowerTimerRef.current !== null) return;
    setPetContestPower(0);
    petContestPowerTimerRef.current = window.setInterval(() => setPetContestPower((current) => Math.min(100, current + 2)), 42);
    setMessage("宠物正抵住软球向前推，继续按住，注意力量刻度。 ");
  };

  const releaseContestPush = () => {
    if (!petContest || petContest.finished || petContest.round !== 1 || petContestPowerTimerRef.current === null) return;
    window.clearInterval(petContestPowerTimerRef.current);
    petContestPowerTimerRef.current = null;
    const ownPet = game.pets.find((pet) => pet.id === petContest.ownPetId);
    const strong = ownPet?.type === "dog" || ownPet?.type === "duck" || ownPet?.type === "hamster";
    const hit = petContestPower >= (strong ? 54 : 62) && petContestPower <= (strong ? 84 : 78);
    const rivalCode = [...petContest.rival].reduce((total, letter) => total + (letter.codePointAt(0) ?? 0), game.year + game.day);
    const rivalHit = rivalCode % 3 !== 0;
    setPetContest({ ...petContest, round: 2, playerScore: petContest.playerScore + (hit ? 1 : 0), rivalScore: petContest.rivalScore + (rivalHit ? 1 : 0), cue: contestCueFor(petContest.rival, 0) });
    setMessage(hit ? "软球稳稳推进终点！最后是三回合软垫对抗，先看对方动作，再选择正确的闪避或绕后轻推。" : "力气太小或太大，软球偏出了跑道。最后还有三回合软垫对抗，可以追回比分！");
    playTone(hit ? 880 : 360);
  };

  const answerPetContestCue = (move: "dodgeLeft" | "dodgeRight" | "circle") => {
    if (!petContest || petContest.finished || petContest.round !== 2) return;
    const correctMove = petContest.cue === "left" ? "dodgeRight" : petContest.cue === "right" ? "dodgeLeft" : "circle";
    const correct = move === correctMove;
    const nextExchange = petContest.exchanges + 1;
    const nextBoutWins = petContest.boutWins + (correct ? 1 : 0);
    const nextBoutLosses = petContest.boutLosses + (correct ? 0 : 1);
    if (nextExchange < 3) {
      setPetContest({ ...petContest, exchanges: nextExchange, boutWins: nextBoutWins, boutLosses: nextBoutLosses, cue: contestCueFor(petContest.rival, nextExchange) });
      setMessage(correct ? `躲开后轻轻碰到了对方的肩垫！还剩 ${3 - nextExchange} 回合，继续观察动作。` : `方向判断错了，对方先碰到你的肩垫。还剩 ${3 - nextExchange} 回合，可以追回来。`);
      playTone(correct ? 820 : 310);
      return;
    }
    const playerRoundPoint = nextBoutWins > nextBoutLosses ? 1 : 0;
    const rivalRoundPoint = nextBoutWins > nextBoutLosses ? 0 : 1;
    finishPetContest({ ...petContest, exchanges: nextExchange, boutWins: nextBoutWins, boutLosses: nextBoutLosses, playerScore: petContest.playerScore + playerRoundPoint, rivalScore: petContest.rivalScore + rivalRoundPoint, finished: true });
  };

  const sellPetToShop = (petRecord: PetRecord) => {
    const pet = PET_CATALOG.find((entry) => entry.id === petRecord.type);
    if (!pet) return;
    if (game.missingPetId === petRecord.id) {
      setMessage(`${pet.name}现在跑进山洞里了，要先把它找回来，宠物店才能接回去。`);
      playTone(210);
      return;
    }
    const isBaby = isNurseryPet(petRecord);
    if (!window.confirm(`要让宠物店接回这只${petRecord.sex}${pet.name}吗？店里会付给你 ${pet.price} 金币。`)) return;
    setGame((current) => ({
      ...current,
      coins: current.coins + pet.price,
      pets: current.pets.filter((owned) => owned.id !== petRecord.id),
      sickPetIds: current.sickPetIds.filter((id) => id !== petRecord.id),
      animalRaincoatAssignments: current.animalRaincoatAssignments.filter((id) => id !== petRecord.id),
      missingPetId: current.missingPetId === petRecord.id ? null : current.missingPetId,
    }));
    setMessage(`宠物店接回了${isBaby ? "后来出生的" : "这只"}${pet.name}，你获得 ${pet.price} 金币。小桃会继续好好照顾它。`);
    playTone(820);
  };

  const buyPetFood = () => {
    const price = 5;
    if (game.coins < price) { setMessage("宠物粮小袋只需要 5 金币，现在的钱还不够。 "); playTone(210); return; }
    setGame((current) => ({ ...current, coins: current.coins - price, petFood: current.petFood + 10 }));
    setMessage("买到一袋平价宠物粮，共 10 份，已经放进资源记录。每天睡觉前会自动喂给跟随的小宠物。 ");
    playTone(720);
  };

  const beginBabyPetCare = (pet: PetRecord) => {
    const petName = PET_CATALOG.find((entry) => entry.id === pet.type)?.name ?? "小宠物";
    if (!isNurseryPet(pet)) {
      setMessage(`${petName}已经长大了，现在会跟着小禾在外面跑动，不需要再住育幼垫。`);
      playTone(650);
      return;
    }
    const dayKey = `${game.year}-${game.season}-${game.day}`;
    if (game.lastBabyCareDays[pet.id] === dayKey) {
      setMessage(`${petName}宝宝今天已经吃饱、喝好、梳过毛并玩过软球了。明天再进行下一次完整照顾。`);
      playTone(620);
      return;
    }
    setBabyCare({ petId: pet.id, stage: 0, feedHits: 0, brushProgress: 0, mistakes: 0 });
    setBabyCareAim(8);
    setBabyCareWater(0);
    setBabyCareToyAim(12);
    babyCareAimDirectionRef.current = 1;
    babyCareToyDirectionRef.current = 1;
    babyCareBrushDistanceRef.current = 0;
    babyCareBrushLastPointRef.current = null;
    setMessage(`开始照顾刚出生的${petName}宝宝：先看准它张嘴的时机，把两勺食物送到嘴边。`);
    playTone(760);
  };

  const feedBabyAtRightMoment = () => {
    if (!babyCare || babyCare.stage !== 0) return;
    if (babyCareAim < 42 || babyCareAim > 58) {
      setBabyCare({ ...babyCare, mistakes: babyCare.mistakes + 1 });
      setMessage("食勺放早了或放晚了，宝宝转开了脑袋。观察绿色区域，再等嘴巴对准食勺。 ");
      playTone(220);
      return;
    }
    const nextHits = babyCare.feedHits + 1;
    if (nextHits >= 2) {
      setBabyCare({ ...babyCare, stage: 1, feedHits: 2 });
      setBabyCareWater(0);
      setMessage("两勺食物都稳稳喂到了。现在按住水壶加水，在水面进入绿色刻度时松手。 ");
      playTone(760);
      return;
    }
    setBabyCare({ ...babyCare, feedHits: nextHits });
    setBabyCareAim(8);
    setMessage("第一勺喂好了，宝宝会再次探头，继续看准时机喂第二勺。 ");
    playTone(610);
  };

  const startBabyWaterPour = () => {
    if (!babyCare || babyCare.stage !== 1 || babyCareWaterTimerRef.current !== null) return;
    setBabyCareWater(0);
    babyCareWaterTimerRef.current = window.setInterval(() => {
      setBabyCareWater((current) => Math.min(100, current + 3));
    }, 55);
    setMessage("水正在流进小碗，继续按住；到绿色刻度再松手。 ");
  };

  const stopBabyWaterPour = () => {
    if (!babyCare || babyCare.stage !== 1) return;
    if (babyCareWaterTimerRef.current !== null) window.clearInterval(babyCareWaterTimerRef.current);
    babyCareWaterTimerRef.current = null;
    if (babyCareWater < 64 || babyCareWater > 80) {
      setBabyCare({ ...babyCare, mistakes: babyCare.mistakes + 1 });
      setBabyCareWater(0);
      setMessage(babyCareWater < 64 ? "水还太少，宝宝喝不到。重新按住水壶，把水加到绿色刻度。 " : "水倒得太满，溅出了小碗。擦干以后重新控制水量。 ");
      playTone(230);
      return;
    }
    setBabyCare({ ...babyCare, stage: 2 });
    setMessage("水量刚刚好。现在按住梳子，沿着宝宝身体来回梳理，不能只点一下。 ");
    playTone(760);
  };

  const brushBabyPet = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!babyCare || babyCare.stage !== 2) return;
    const point = { x: event.clientX, y: event.clientY };
    if (event.type === "pointerdown") {
      event.currentTarget.setPointerCapture(event.pointerId);
      babyCareBrushLastPointRef.current = point;
      setMessage("梳子贴住毛发了，沿着身体左右来回移动。 ");
      return;
    }
    const last = babyCareBrushLastPointRef.current;
    if (!last || event.buttons === 0) return;
    const distance = Math.hypot(point.x - last.x, point.y - last.y);
    babyCareBrushLastPointRef.current = point;
    babyCareBrushDistanceRef.current += distance;
    const progress = Math.min(100, babyCareBrushDistanceRef.current / 2.3);
    if (progress >= 100) {
      babyCareBrushLastPointRef.current = null;
      setBabyCare({ ...babyCare, stage: 3, brushProgress: 100 });
      setBabyCareToyAim(12);
      setMessage("毛发梳顺了。最后瞄准正在跑动的宝宝，把软球投进它前面的绿色范围。 ");
      playTone(810);
      return;
    }
    setBabyCare({ ...babyCare, brushProgress: progress });
  };

  const throwBabyToy = () => {
    if (!babyCare || babyCare.stage !== 3) return;
    if (babyCareToyAim < 58 || babyCareToyAim > 76) {
      setBabyCare({ ...babyCare, mistakes: babyCare.mistakes + 1 });
      setMessage("软球从宝宝身边滚过去了。看它跑到绿色接球区时再投。 ");
      playTone(230);
      return;
    }
    const caredPet = game.pets.find((pet) => pet.id === babyCare.petId);
    const petName = PET_CATALOG.find((entry) => entry.id === caredPet?.type)?.name ?? "小宠物";
    const dayKey = `${game.year}-${game.season}-${game.day}`;
    const nextCareCount = (game.babyCareStreaks[babyCare.petId] ?? 0) + 1;
    const growsUpNow = Boolean(caredPet && petAgeDays(caredPet) >= 28 && nextCareCount >= 4);
    setGame((current) => ({
      ...current,
      lastBabyCareDays: { ...current.lastBabyCareDays, [babyCare.petId]: dayKey },
      babyCareStreaks: { ...current.babyCareStreaks, [babyCare.petId]: (current.babyCareStreaks[babyCare.petId] ?? 0) + 1 },
      journalEntries: [`${SEASONS[current.season]}第${current.day}天：亲手给${petName}宝宝喂食、控水、梳毛并陪它接球。`, ...current.journalEntries].slice(0, 40),
    }));
    setBabyCare(null);
    setMessage(growsUpNow ? `${petName}宝宝完成了第四次照顾，也已经满一个季节，长大后跑到了小禾脚边！` : `${petName}宝宝接住了软球，今天的照顾真正完成！它吃饱喝足、毛发整齐，也更信任你了。`);
    playTone(1020);
  };

  const healPetWithHerb = (pet: PetRecord) => {
    const petName = PET_CATALOG.find((entry) => entry.id === pet.type)?.name ?? "小宠物";
    if (!game.sickPetIds.includes(pet.id)) { setMessage(`${petName}精神很好，正在小禾脚边开心地跑动。`); return; }
    if (game.herbs <= 0) { setMessage(`${petName}很不舒服，但背包里没有药材。可以开车带它去远方新区的宠物医院。`); playTone(210); return; }
    setGame((current) => ({ ...current, herbs: current.herbs - 1, sickPetIds: current.sickPetIds.filter((id) => id !== pet.id) }));
    setMessage(`给${petName}用了一份药材，它的颜色恢复了，眼睛也重新亮起来！`);
    playTone(870);
  };

  const feedBoneToDog = () => {
    const dog = game.pets.find((pet) => pet.type === "dog" && pet.id !== game.missingPetId);
    if (!dog) {
      setMessage("小骨头是喂给柴犬的。家里还没有柴犬，可以去远方新区的宠物店领养。 ");
      playTone(260);
      return;
    }
    if (game.petBones <= 0) {
      setMessage("现在没有小骨头。小鸡偶尔外出探险时可能会叼回来。 ");
      playTone(260);
      return;
    }
    if (game.sickPetIds.includes(dog.id)) {
      setMessage("柴犬现在不舒服，先用一份药材或带它去宠物医院；小骨头不能代替药。 ");
      playTone(240);
      return;
    }
    setGame((current) => ({ ...current, petBones: current.petBones - 1, seeds: current.seeds + 1 }));
    setMessage("把 1 块小骨头喂给了柴犬！它开心地摇尾巴，又从草丛里叼回 1 颗萝卜种子送给你。 ");
    playTone(880);
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

  // Newborn pets remain on the small nursery mat for their first season and
  // until they have received four complete care sessions. After that they use
  // the same real follower path as the older household pets.
  const nurseryPets = game.pets.filter(isNurseryPet);
  const followingPets = game.pets.filter((pet) => pet.id !== game.missingPetId && !isNurseryPet(pet));
  const farmAnimalEntries = ([("chicken" as FarmAnimalType), "cow", "sheep"] as FarmAnimalType[]).flatMap((type) => {
    const count = type === "chicken" ? game.chickens : type === "cow" ? game.cows : game.sheep;
    return Array.from({ length: count }, (_, index) => ({ type, index, id: farmAnimalId(type, index), name: farmAnimalName(type) }));
  });
  const renderPetFollowers = () => followingPets.length ? <span className="pet-followers" aria-label={`${followingPets.length}只宠物跟着小禾`}>
    {followingPets.slice(0, 4).map((pet, index) => { const petName = PET_CATALOG.find((entry) => entry.id === pet.type)?.name ?? "小宠物"; const wearingRaincoat = game.animalRaincoatAssignments.includes(pet.id); const rainy = game.weather === "rain" || game.weather === "thunder"; return <button key={pet.id} className={`following-pet pet-${pet.type} follower-${index + 1} ${game.sickPetIds.includes(pet.id) ? "sick-pet" : ""} ${wearingRaincoat ? "wearing-animal-raincoat" : ""} ${wearingRaincoat && rainy ? "puddle-jumping" : ""}`} onClick={(event) => { event.stopPropagation(); if (raincoatDressing) toggleAnimalRaincoat(pet.id, petName); else healPetWithHerb(pet); }} aria-label={`${petName}${wearingRaincoat ? "穿着黄色雨衣，" : ""}${game.sickPetIds.includes(pet.id) ? "生病了，点击使用药材" : raincoatDressing ? "点击穿上或脱下雨衣" : "正在跟随"}`}><i /><b />{wearingRaincoat && <u className="animal-raincoat-art" />}</button>; })}
    {followingPets.length > 4 && <em>+{followingPets.length - 4}</em>}
  </span> : null;

  const wearMallOutfit = (outfit: "redCoat" | "blueOutfit") => {
    if (game.mallItems[outfit] <= 0) return;
    const removing = game.equippedOutfit === outfit;
    setGame((current) => ({ ...current, equippedOutfit: removing ? "default" : outfit }));
    setMessage(removing ? "换回了原来的农夫服装。" : `换上了${outfit === "redCoat" ? "红色节日外套" : "蓝色旅行套装"}！`);
    playTone(680);
  };

  const togglePajamas = () => {
    const puttingOn = game.equippedOutfit !== "pajamas";
    setGame((current) => ({ ...current, equippedOutfit: puttingOn ? "pajamas" : "default" }));
    setMessage(puttingOn ? "小禾在床边换上了蓝紫色星月睡衣。现在身上能看见睡衣，可以再点击床睡觉。" : "小禾把睡衣叠到床头，换回了平常的农场服。 ");
    playTone(puttingOn ? 690 : 450);
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
    if (activeBuilding || neighborInterior || residentHome || friendHomeOpen || craftingOpen || chestOpen || shippingBinOpen || multiplayerOpen || builderOpen || ranchOpen || farmInterior || festivalDisplay || bulkChestPrompt || bulkShippingPrompt || ananBeachOpen || ananBeachTraveling || drivingSchoolOpen || carTraveling || mallOpen || petShopOpen || petHospitalOpen || bedtimePhase || farmEdgeTraveling) return;
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
    const destination = scene === "farm"
      ? {
          x: Math.max(worldVillage === "qinghe" ? QINGHE_WEST_EXIT : -6, Math.min(14, player.x + Math.round((percentX - 50) / 7.7))),
          y: Math.max(1, Math.min(7, player.y + Math.round((percentY - 55) / 10.5))),
        }
      : { x: Math.max(0, Math.min(11, Math.round((percentX - 4) / 7.7))), y: Math.max(0, Math.min(7, Math.round((percentY - 8) / 10.5))) };
    if (advanceOrdinaryDream(destination.x, destination.y)) return;
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
    setCafePlayerSitting(false);
    const bounds = event.currentTarget.getBoundingClientRect();
    const destination = { x: Math.max(20, Math.min(80, ((event.clientX - bounds.left) / bounds.width) * 100)), y: Math.max(62, Math.min(76, ((event.clientY - bounds.top) / bounds.height) * 100)) };
    showWalking(destination.x - indoorPlayer.x, destination.y - indoorPlayer.y);
    setIndoorPlayer(destination);
    setMessage("小禾走到了屋里点击的位置。 ");
  };

  const renderOrdinaryDreamSetting = () => dreamPhase === "inside" ? (
    <div className="dream-farmhouse-shell service-panel farmhouse-panel">
      <header><div><span>{activeVillageInfo.farm}室内</span><h2>{displayName}的农舍</h2></div></header>
      <div className={`dream-copy-interior farmhouse-room ${game.upgrades.house ? "expanded-farmhouse-room" : ""} farmhouse-level-${game.upgrades.house}`}>
        <div className="room-window"><i /><i /></div>
        <div className="house-bed"><i /><b /><span>小禾的床</span></div>
        <div className="house-table"><i /><i /></div>
        <div className="house-stove"><i /><b /><span /></div>
        <div className="house-rug" />
        <button className="house-door dream-copy-door" onClick={() => { setDreamPhase("outside"); setDreamPlayer({ x: 50, y: 68 }); setMessage("小禾像平常一样从农舍走到农场。 "); playTone(610); }} aria-label="从农舍走到农场"><span>出口</span></button>
        <i className="dream-tiny-difference dream-room-difference" aria-hidden="true" />
      </div>
      <div className="service-dialogue"><strong>回到家啦</strong><p>床铺得软软的，炉灶还留着余温。可以从门口回到农场。</p></div>
      <footer><span>{message}</span><small>方向键也可以走动</small></footer>
    </div>
  ) : (
    <div className={`dream-copy-farm farm-world season-${game.season} weather-world-${game.weather} dream-oddity-${dreamOddity}`}>
      <div className="cloud cloud-one" /><div className="cloud cloud-two" />
      <div className="mountain mountain-one" /><div className="mountain mountain-two" />
      <div className="farm-camera-layer dream-copy-camera">
        <div className="path path-one" /><div className="path path-two" />
        <div className="pond dream-copy-pond"><i /><i /><i /><span className="pond-label">钓鱼池</span></div>
        <div className={`house ${game.upgrades.house ? "expanded-house" : ""} house-level-${game.upgrades.house}`}><span className="roof" /><span className="chimney" /><span className="wall" /><span className="door" /><span className="window" /><span className="sign">{displayName}的农舍</span></div>
        <div className="tree tree-a" /><div className="tree tree-b" /><div className="tree tree-c" /><div className="tree tree-d" />
        <div className={`field dream-copy-field ${game.tiles.length > 32 ? "expanded-field" : ""}`}>{game.tiles.map((tile, index) => <i key={`dream-tile-${index}`} className={`farm-tile ${tile.state} ${tile.cropType ?? "radish"} ${tile.watered ? "watered" : ""} ${tile.hybrid ? "hybrid-crop" : ""}`}>{tile.state === "crop" && <span className={`crop-stage stage-${tile.stage}`}><i /><i /><b /></span>}</i>)}</div>
        <div className="flowers flowers-a">✿ · ✿</div><div className="flowers flowers-b">· ✿ ·</div>
        <i className="dream-tiny-difference dream-water-difference" aria-hidden="true" /><i className="dream-tiny-difference dream-tree-difference" aria-hidden="true" /><i className="dream-tiny-difference dream-sky-difference" aria-hidden="true" />
      </div>
    </div>
  );

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
    <main className={`game-shell ${embeddedMode ? "embedded-game" : ""} ${dreamScene !== null ? `dream-reality-active dream-reality-${dreamOddity} dream-variant-${dreamScene % 16}` : ""}`}>
      {trailExpedition && (() => { const route = AGE_WORLD_TRAIL_ROUTES[trailExpedition.routeIndex]; const directionLabel: Record<TrailDirection, string> = { up: "↑", down: "↓", left: "←", right: "→" }; return <div className="world-trail-hud" role="status" aria-label={`林间循迹，已完成${trailExpedition.step}段`}><div><i>迹</i><span><small>主世界本领正在使用</small><strong>沿脚印亲自走 · {trailExpedition.step}/5</strong></span><button onClick={() => { setTrailExpedition(null); setMessage("暂时停止林间循迹。今天还可以从第一枚脚印重新开始。 "); }} aria-label="停止林间循迹">×</button></div><section>{route.map((direction, index) => <i key={`${direction}-${index}`} className={index < trailExpedition.step ? "done" : index === trailExpedition.step ? "active" : ""}><b>{index < trailExpedition.step ? "✓" : directionLabel[direction]}</b><span>{index === trailExpedition.step ? "下一步" : index < trailExpedition.step ? "走过" : "脚印"}</span></i>)}</section><small>方向键、WASD 和平板方向键都会真实推进；走错只会走到旁边，不会自动完成。错 {trailExpedition.mistakes} 次</small></div>; })()}
      {hybridLab && <div className="world-ability-overlay hybrid-world-overlay" role="presentation"><section className="hybrid-world-lab" role="dialog" aria-modal="true" aria-label="主世界四季育种台"><header><div><span>四岁永久本领 · 主世界实际操作</span><h2>四季育种台</h2></div><button onClick={() => { endHybridPollination(); setHybridHeldSeed(null); setHybridLab(null); setMessage("收起四季育种台，种子没有消耗。 "); }} aria-label="收起育种台">×</button></header><div className="hybrid-world-scene"><aside className="hybrid-seed-tray"><strong>第一步 · 选择两个亲本</strong><small>拖进亲本盆；平板上也可以先点种子，再点空盆</small><div>{CROP_TYPES.filter((crop) => game[CROP_INFO[crop].seedField] > 0).map((crop) => <button key={`hybrid-parent-${crop}`} draggable className={hybridHeldSeed === crop ? "held" : ""} onDragStart={() => setHybridHeldSeed(crop)} onClick={() => { setHybridHeldSeed(crop); if (hybridLab.parents.length < 2) addHybridParent(crop); }}><i className={`${crop}-icon`}>{CROP_INFO[crop].short}</i><span>{CROP_INFO[crop].name}<small>种子 {game[CROP_INFO[crop].seedField]}</small></span></button>)}</div></aside><div className="hybrid-workbench"><div className="hybrid-parent-pots">{[0, 1].map((slot) => { const parent = hybridLab.parents[slot]; return <button key={`hybrid-pot-${slot}`} data-hybrid-parent-slot onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (hybridHeldSeed) addHybridParent(hybridHeldSeed); }} onClick={() => parent ? removeHybridParent(parent) : hybridHeldSeed ? addHybridParent(hybridHeldSeed) : setMessage("先从左边拿起一种种子，再放进这个亲本盆。 ")} className={parent ? "filled" : ""}><i /><b>{parent ? CROP_INFO[parent].short : "+"}</b><span>{parent ? `${CROP_INFO[parent].name}亲本` : `亲本盆 ${slot + 1}`}<small>{parent ? "点击可以取回" : "放入一种种子"}</small></span></button>; })}</div><label className="hybrid-temperature"><span><strong>第二步 · 按天气调节培养温度</strong><small>今天是{WEATHER_INFO[game.weather].name}，把滑块移进发亮刻度</small></span><div><i className="hybrid-target-zone" style={{ left: `${HYBRID_WEATHER_BALANCE[game.weather] - 6}%`, width: "12%" }} /><input aria-label="育种培养温度" type="range" min="0" max="100" value={hybridLab.balance} onChange={(event) => setHybridLab({ ...hybridLab, balance: Number(event.target.value), pollination: 0 })} /><b style={{ left: `${hybridLab.balance}%` }}>{hybridLab.balance}</b></div></label><button className={`hybrid-pollination-board ${hybridLab.parents.length === 2 ? "ready" : ""}`} onPointerDown={beginHybridPollination} onPointerMove={moveHybridPollination} onPointerUp={endHybridPollination} onPointerCancel={endHybridPollination}><i className="hybrid-flower flower-one" /><i className="hybrid-flower flower-two" /><b className="hybrid-brush" style={{ left: `${12 + hybridLab.pollination * .7}%` }} /><span><strong>第三步 · 按住授粉刷来回移动</strong><small>往返距离 {hybridLab.pollination}% · 不能只点一下</small></span></button></div></div><footer><span>育种粉库存 {game.hybridSeedCharges} 份 · 配错 {hybridLab.mistakes} 次</span><button onClick={() => { endHybridPollination(); setHybridHeldSeed(null); setHybridLab(null); }}>暂时收起</button></footer></section></div>}
      {echoSurvey && <div className="world-ability-overlay echo-world-overlay" role="presentation"><section className="echo-world-panel" role="dialog" aria-modal="true" aria-label="主世界听石寻晶"><header><div><span>五岁永久本领 · 青禾山洞实地探矿</span><h2>听石寻晶</h2></div><button onClick={() => { setEchoSurvey(null); setMessage("停止听石寻晶，本次没有消耗每日机会。 "); }} aria-label="停止听石寻晶">×</button></header><div className="echo-world-cave"><div className={`echo-world-rocks echo-hit-${echoSurvey.hits}`}><i /><i /><i /><b /></div><strong>听准三层岩壁回声</strong><small>不是直接送钻石；定位后还要自己走到矿旁用镐子挖</small><div className="echo-world-timing"><i /><em /><b style={{ left: `${ageEchoPulse}%` }} /></div><button onClick={strikeWorldEcho}><i>⚒</i><span>光点进入绿色区域时敲击</span></button><div className="echo-world-results">{[0, 1, 2].map((index) => <i key={`world-echo-${index}`} className={index < echoSurvey.hits ? "found" : ""}>{index < echoSurvey.hits ? "◆" : "?"}</i>)}</div></div><footer><span>听准 {echoSurvey.hits}/3 · 敲空 {echoSurvey.misses} 次</span><button onClick={() => setEchoSurvey(null)}>停止探矿</button></footer></section></div>}
      {festivalPreview && <button className="festival-preview-exit" onClick={exitFestivalPreview} aria-label="退出节日体验并回到原来的日期"><b>×</b><span><strong>退出节日体验</strong><small>回到{SEASONS[festivalPreview.returnGame.season]}第 {festivalPreview.returnGame.day} 天</small></span></button>}
      {newsBroadcast && <div className={`tv-broadcast-overlay tv-channel-${newsBroadcast.channel} news-kind-${newsBroadcast.news.kind}`} role="dialog" aria-modal="true" aria-label="青禾电视节目">
        <section className="tv-broadcast-frame">
          <header><div><i>QH</i><span><strong>{newsBroadcast.channel === "news" ? newsBroadcast.news.urgent ? "青禾紧急新闻" : "青禾新闻频道" : newsBroadcast.channel === "sports" ? "青禾体育频道" : newsBroadcast.channel === "national" ? "国家人文频道" : newsBroadcast.channel === "kids" ? "青苗少儿频道" : "田园农场频道"}</strong><small>{newsBroadcast.channel === "news" ? "正在直播当天真实地点" : "青禾电视 · 今日节目"}</small></span></div><button onClick={() => setNewsBroadcast(null)} aria-label="关闭电视节目">×</button></header>
          <nav aria-label="电视遥控器频道"><button className={newsBroadcast.channel === "news" ? "active" : ""} onClick={() => setNewsBroadcast((current) => current ? { ...current, channel: "news" } : current)}>1 新闻</button><button className={newsBroadcast.channel === "sports" ? "active" : ""} onClick={() => setNewsBroadcast((current) => current ? { ...current, channel: "sports" } : current)}>2 体育</button><button className={newsBroadcast.channel === "national" ? "active" : ""} onClick={() => setNewsBroadcast((current) => current ? { ...current, channel: "national" } : current)}>3 国家</button><button className={newsBroadcast.channel === "kids" ? "active" : ""} onClick={() => setNewsBroadcast((current) => current ? { ...current, channel: "kids" } : current)}>4 少儿</button><button className={newsBroadcast.channel === "farm" ? "active" : ""} onClick={() => setNewsBroadcast((current) => current ? { ...current, channel: "farm" } : current)}>5 农场</button></nav>
          <div className="tv-program-screen">
            {newsBroadcast.channel === "news" && <><div className="news-location-scene"><i className="news-place-building" /><i className="news-place-roof" /><i className="news-place-door" /><b className="news-place-event" /><em className="news-place-person" /><u className="news-place-detail" /><span>{newsBroadcast.news.kind === "fire" ? "中心街 · 木匠工坊" : newsBroadcast.news.kind === "theft" ? "中心街 · 青禾超市" : newsBroadcast.news.kind === "injury" ? "中心街 · 健康诊所外" : newsBroadcast.news.kind === "cave" || newsBroadcast.news.kind === "missingPet" ? "青禾农场 · 山洞内部" : newsBroadcast.news.kind === "anan" ? "西边 · 安安的林边小屋" : newsBroadcast.news.kind === "school" ? "文化街 · 青禾学校" : newsBroadcast.news.kind === "supermarket" ? "中心街 · 青禾超市" : newsBroadcast.news.kind === "festival" ? "节日活动现场" : "青禾农场 · 雷雨现场"}</span></div><div className="news-presenter"><i /><b /><em className="presenter-microphone" /><u className="presenter-pointing-arm" /><span>主持人 青青</span></div><div className="news-caption"><strong>{newsBroadcast.news.urgent ? "紧急" : "今日"}新闻</strong><p>{newsBroadcast.news.text}</p><small>{newsBroadcast.forecast}</small></div></>}
            {newsBroadcast.channel === "sports" && <div className={`sports-program sports-match-${tvEpisodeDay % 2} tv-story-step-${tvProgramStep}`}><div className="sports-scoreboard"><span>青禾队</span><b>{2 + game.day % 4 + (tvProgramStep >= 4 ? 1 : 0)} : {1 + (game.day * 2) % 4}</b><span>枫叶队</span></div><div className="sports-field"><i className="sports-player player-one" /><i className="sports-player player-two" /><i className="sports-player player-three" /><i className="sports-player player-four" /><b className="sports-ball" /><em className="sports-goal" /><span className="sports-referee" /></div><strong>{sportsStory.title}</strong><div className="tv-story-caption"><b>第 {tvProgramStep + 1} 幕</b><span>{sportsStory.beats[tvProgramStep]}</span></div></div>}
            {newsBroadcast.channel === "national" && <div className={`national-program national-episode-${tvEpisodeDay % 4} tv-story-step-${tvProgramStep}`}><i className="national-mountain" /><i className="national-river" /><i className="national-train" /><b className="national-village" /><span className="national-camera-team"><i /><b /></span><strong>{nationalStory.title}</strong><div className="tv-story-caption"><b>纪录片 · 第 {tvProgramStep + 1} 段</b><span>{nationalStory.beats[tvProgramStep]}</span></div></div>}
            {newsBroadcast.channel === "kids" && <div className={`kids-program kids-episode-${tvEpisodeDay % 8} tv-story-step-${tvProgramStep}`} style={{ "--episode-hue": `${(tvEpisodeDay * 47) % 360}deg`, "--episode-sky": `hsl(${(tvEpisodeDay * 37) % 360} 62% 76%)`, "--episode-ground": `hsl(${(tvEpisodeDay * 29 + 84) % 360} 46% 61%)` } as CSSProperties}><div className="cartoon-sky"><i /><i /></div><div className="cartoon-story-prop"><i /><b /><em /></div><div className="cartoon-characters"><i /><b /><em /></div><strong>{kidsStory.title}</strong><div className="cartoon-speech">{tvProgramStep === 4 ? "今天的故事圆满结束！" : tvProgramStep === 0 ? "新的故事开始啦！" : "我们一起继续想办法！"}</div><div className="tv-story-caption"><b>第 {tvProgramStep + 1} 幕</b><span>{kidsStory.beats[tvProgramStep]}</span></div></div>}
            {newsBroadcast.channel === "farm" && <div className={`farm-channel-program tv-story-step-${tvProgramStep}`}><div className="farm-channel-field"><i /><i /><i /><i /><b /><span className="farm-host" /></div><strong>{farmStory.title}</strong><div className="tv-story-caption"><b>步骤 {tvProgramStep + 1}/5</b><span>{farmStory.beats[tvProgramStep]}</span></div><small>{newsBroadcast.forecast}</small></div>}
          </div>
          <footer><span>{newsBroadcast.automatic && newsBroadcast.news.urgent ? "紧急节目结束后，请立即赶到画面里的地点帮忙" : newsBroadcast.channel === "news" ? "新闻播放完会自动关闭 · 也可以使用上方遥控器换台" : "五幕剧情会依次播放 · 播完自动关闭 · 可随时换台"}</span><i /></footer>
        </section>
      </div>}
      {mallOpen && mallFloor === 1 && <button className="mall-pet-food-kiosk" onClick={buyPetFood}><i /><span><b>宠物补给柜</b><small>便宜宠物粮 · 5 金币 / 10份</small></span></button>}
      {petHospitalOpen && <div className="pet-hospital-overlay" role="dialog" aria-modal="true" aria-label="远方新区宠物医院"><section className="pet-hospital-panel"><header><div><span>远方新区动物健康中心</span><h2>青禾宠物医院</h2></div><div className="pet-wallet">● {game.coins.toLocaleString()}</div><button onClick={() => setPetHospitalOpen(false)}>×</button></header><div className="pet-hospital-room"><aside><button className="pet-vet"><i /><b /></button><strong>宠物医生苏苏</strong><small>检查 · 配药 · 恢复健康</small><span className="vet-counter" /></aside><div className="pet-patient-list">{game.pets.length === 0 ? <p>小禾还没有领养宠物，可以先去旁边的宠物之家看看。</p> : game.pets.map((pet) => { const sick = game.sickPetIds.includes(pet.id); const petName = PET_CATALOG.find((entry) => entry.id === pet.type)?.name; return <article key={`patient-${pet.id}`} className={sick ? "sick-patient" : ""}><div className={`pet-patient-art pet-${pet.type} ${sick ? "sick-pet" : ""}`}><i /><b /></div><span><strong>{petName} · {pet.sex}</strong><small>{sick ? "颜色发灰 · 眼睛下垂 · 很不舒服" : "精神很好 · 不需要治疗"}</small></span><button disabled={!sick} onClick={() => treatPetAtHospital(pet.id)}>{sick ? "检查配药 · 35金币" : "健康"}</button></article>; })}</div></div><footer><span>{message}</span><button onClick={() => setPetHospitalOpen(false)}>离开宠物医院</button></footer></section></div>}
      <header className="topbar">
        <div className="brand-lockup">
          <button className="brand-mark" onClick={() => setBrandMenuOpen((open) => !open)} aria-label="打开青禾谷菜单" aria-expanded={brandMenuOpen}><i /><i /><i /></button>
          <div><strong>青禾谷</strong><span>GREENFIELD VALLEY</span></div>
          <div key={game.coins} className="coins top-coins coin-value-updated" aria-label={`现有 ${game.coins} 金币`}><span>●</span><b>{game.coins.toLocaleString()}</b></div>
          {brandMenuOpen && <div className="brand-menu"><span>青禾谷村庄菜单</span><strong>想做什么？</strong><button className="brand-guide-entry" onClick={() => { setGuideOpen(true); setBrandMenuOpen(false); }}><i className="mini-guide-icon">?</i><b>游戏说明</b><small>第一次玩也能看懂 · 带动画演示</small></button><button onClick={() => { setBrandMenuOpen(false); if (game.ageSkillsLearned.includes("teleport")) { setMapOpen(true); setMessage("打开本人瞬移地图，点击想去的地点就会立刻到达。 "); } else { setAgeBookOpen(true); setAgeTraining(null); setMessage(`本人瞬移要到八岁并完成训练后才能使用。小禾现在 ${game.playerAge} 岁。`); } }}><i className="mini-map-icon" /><b>本人瞬移</b><small>{game.ageSkillsLearned.includes("teleport") ? "点开地图 · 点击地点直接到达" : "八岁训练后解锁"}</small></button><button className="brand-craft-entry" onClick={() => { setCraftingOpen(true); setBrandMenuOpen(false); setMessage("打开制作手册，选择想做的东西。"); }}><i className="mini-craft-icon">⚒</i><b>打开制作</b><small>使用木头和石材做东西</small></button><button className="brand-journal-entry" onClick={() => { setJournalOpen(true); setBrandMenuOpen(false); }}><i className="mini-journal-icon">记</i><b>山谷日记</b><small>好感、任务、收藏与食谱</small></button></div>}
        </div>
        <div className={`day-card ${festivalPreview ? "festival-preview-day" : ""}`}>
          <span className={`season-dot season-dot-${displaySeason}`}>{SEASON_SHORT[displaySeason]}</span>
          <div><strong>{festivalPreview ? "节日体验 · " : `第 ${game.year} 年 · `}{SEASONS[displaySeason]}第 {displayDay} 天 · {WEEKDAYS[(displayDay - 1) % 7]}</strong><span>{calendarMonth}月{displayDay}日 · {String(clockHour).padStart(2, "0")}:{String(clockMinute).padStart(2, "0")}</span></div>
        </div>
        <div className="top-stats">
          <div className={`weather weather-${game.weather} ${isNight ? "night-weather" : ""}`}><span className={isNight && game.weather === "sunny" ? "moon-icon" : `weather-icon weather-icon-${game.weather}`} />{isNight && game.weather === "sunny" ? "月夜" : isNight ? `${weatherInfo.name}夜` : weatherInfo.name} <small>{isNight ? `${Number.parseInt(weatherInfo.temperature) - 3}°C` : weatherInfo.temperature}</small></div>
          <button className="multiplayer-button" onClick={() => setSplitScreen(true)}>双人模式</button>
          <button className="cloud-transfer-button" onClick={transferSaveToWeb} disabled={transferringSave}>{transferringSave ? "转移中…" : "转移到网页版"}</button>
          <button className="round-button home-button" onClick={returnToFarm} aria-label="回到农场" title="回到农场">⌂</button>
          <button className="round-button" onClick={toggleSound} aria-label={soundOn ? "关闭全部声音" : "打开人物语音和音效"} title={soundOn ? "人物语音与音效已开启" : "人物语音与音效已关闭"}>{soundOn ? "♪" : "×"}</button>
          <button className="round-button" onClick={resetGame} aria-label="重新开始">↻</button>
        </div>
      </header>

      {ageBookOpen && (ageTraining?.skill === "clone" || ageTraining?.skill === "teleport") && (() => { const skill = AGE_SKILLS.find((item) => item.id === ageTraining.skill)!; const route = AGE_CLONE_ROUTES[Math.min(ageTraining.progress, AGE_CLONE_ROUTES.length - 1)]; return <div className="clone-training-overlay" role="presentation"><section role="dialog" aria-modal="true" aria-label={ageTraining.skill === "teleport" ? "本人地图瞬移实际训练" : "分身穿墙瞬移实际训练"}><header><div><span>{ageTraining.skill === "teleport" ? "八岁本领 · 本人瞬移落点训练" : "七岁本领 · 分身穿墙落点训练"}</span><h2>{skill.name}</h2><small>成功 {ageTraining.progress}/{skill.required} 次 · 撞墙 {ageTraining.mistakes} 次</small></div><button onClick={() => { setAgeTraining(null); setMessage("暂时退出瞬移训练，回到成长手册。 "); }} aria-label="退出穿墙训练">×</button></header><div className="clone-training-course"><div className="training-original"><i /><b /><span>小禾</span></div><div className="training-solid-wall"><i /><i /><i /><strong>厚石墙</strong></div><div className="training-landing"><i /><b /><span>{route.destination}</span></div><div className="training-signal"><small>墙上的真实落点信号</small><strong>{route.signal}</strong><p>从三个入口中辨认与落点相同的纹样。选错会撞在墙上，不能直接通过。</p></div></div><div className="clone-gate-choices">{route.answers.map((answer) => <button key={`${route.destination}-${answer}`} onClick={() => ageTraining.skill === "teleport" ? trainAgeTeleport(answer) : trainAgeClone(answer)}><i>{answer.slice(0, 1)}</i><span>{answer}</span></button>)}</div><div className="clone-training-progress">{AGE_CLONE_ROUTES.map((item, index) => <i key={item.destination} className={index < ageTraining.progress ? "done" : index === ageTraining.progress ? "active" : ""}>{index < ageTraining.progress ? "✓" : index + 1}</i>)}</div><footer><span>{message}</span><button onClick={() => setAgeTraining(null)}>返回成长手册</button></footer></section></div>; })()}

      {shippingReport && <div className="shipping-report-toast" role="dialog" aria-modal="true" aria-label="昨晚售卖收入"><span>大号售卖箱通知</span><strong>昨晚卖出 {shippingReport.itemCount} 件东西</strong><b>+ {shippingReport.earnings.toLocaleString()} 金币</b><button onClick={() => setShippingReport(null)}>知道了</button></div>}

      {cloneMission && !cloneWorkOpen && <button className="clone-mission-hud" onClick={() => setCloneWorkOpen(true)}><i>{cloneMission.icon}</i><span><strong>分身正在{cloneMission.label}</strong><small>{cloneMission.destination} · 你可以继续行动</small></span></button>}

      {cloneWorkOpen && <div className="clone-work-overlay" role="presentation"><section role="dialog" aria-modal="true" aria-label="分身穿墙瞬移工作台"><header><div><span>七岁永久本领 · 主游戏可用</span><h2>分身穿墙瞬移工作台</h2></div><button onClick={() => { setCloneWorkOpen(false); setMessage(cloneMission ? "收起工作台；分身继续工作，小禾可以照常行动。 " : "收起分身工作台，回到游戏。 "); }} aria-label="关闭分身工作台">×</button></header><div className={`clone-live-route ${cloneMission ? "mission-running" : "mission-idle"}`}><div className="clone-original"><i /><b /><span>正在游玩的你</span></div><div className="clone-wall"><i /><i /><i /><strong>可穿越障碍</strong></div><div className="clone-worker"><i /><b /><span>{cloneMission ? cloneMission.label : "等待安排"}</span></div><div className="clone-portal" /><p>{cloneMission ? `分身已经穿墙瞬移到${cloneMission.destination}，成果完成后会自动加入游戏记录。` : "选择一件工作后，另一个小禾会出现并自动前往目标；原来的你仍能继续玩。"}</p></div><div className="clone-job-scroll"><section><h3>农田工作</h3><div className="clone-job-grid"><button disabled={Boolean(cloneMission)} onClick={() => dispatchCloneWork("water")}><i>水</i><span>给作物浇水<small>最多 8 株</small></span></button><button disabled={Boolean(cloneMission)} onClick={() => dispatchCloneWork("fertilize")}><i>肥</i><span>给作物施肥<small>提高照料值</small></span></button>{CROP_TYPES.map((crop) => <button key={`clone-${crop}`} disabled={Boolean(cloneMission)} onClick={() => dispatchCloneWork("plant", crop)}><i>{CROP_INFO[crop].short}</i><span>播种{CROP_INFO[crop].name}<small>最多 4 格</small></span></button>)}</div></section><section><h3>山野与资源</h3><div className="clone-job-grid"><button disabled={Boolean(cloneMission)} onClick={() => dispatchCloneWork("mineDiamond")}><i>◆</i><span>进山洞挖钻石<small>金铁镐会增产</small></span></button><button disabled={Boolean(cloneMission)} onClick={() => dispatchCloneWork("chopWood")}><i>木</i><span>砍树<small>木头、树脂、松果</small></span></button><button disabled={Boolean(cloneMission)} onClick={() => dispatchCloneWork("breakStone")}><i>石</i><span>敲碎石头<small>收集石材</small></span></button><button disabled={Boolean(cloneMission)} onClick={() => dispatchCloneWork("gatherHerbs")}><i>药</i><span>采集药材<small>加入资源记录</small></span></button><button disabled={Boolean(cloneMission)} onClick={() => dispatchCloneWork("fish")}><i>鱼</i><span>池塘钓鱼<small>鱼钩会落进水里</small></span></button></div></section><section><h3>帮助居民</h3><div className="clone-resident-grid">{CLONE_HELP_RESIDENTS.map((person) => <button key={`clone-help-${person}`} disabled={Boolean(cloneMission)} style={personClothesStyle(person)} onClick={() => dispatchCloneWork("helpResident", undefined, person)}><i /><b /><span>帮助{person}<small>完成委托 · 好感 +15</small></span></button>)}</div></section></div><footer><span>{message}</span><button onClick={() => setCloneWorkOpen(false)}>回到主游戏</button></footer></section></div>}

      {petContestOpen && (() => {
        const ownPet = game.pets.find((pet) => pet.id === petContest?.ownPetId);
        const ownPetInfo = PET_CATALOG.find((pet) => pet.id === ownPet?.type);
        const rivalPet = residentPetProfile(petContest?.rival ?? selectedContestRival);
        const closeContest = () => { if (petContestPowerTimerRef.current !== null) window.clearInterval(petContestPowerTimerRef.current); petContestPowerTimerRef.current = null; setPetContestOpen(false); setPetContest(null); };
        const cueText = petContest?.cue === "left" ? `${rivalPet.nickname}从左边扑向肩垫！` : petContest?.cue === "right" ? `${rivalPet.nickname}从右边扑向肩垫！` : `${rivalPet.nickname}低下身体向前冲！`;
        return <div className="pet-contest-overlay" role="presentation"><section role="dialog" aria-modal="true" aria-label="宠物友谊比赛"><header><div><span>中心广场 · 居民宠物友谊赛</span><h2>两只宠物真正上场比赛</h2><small>{petContest ? petContest.finished ? "比赛完成" : `第 ${petContest.round + 1}/3 轮 · 比分 ${petContest.playerScore}:${petContest.rivalScore}` : `累计胜场 ${game.petContestWins}`}</small></div><button onClick={closeContest} aria-label="离开宠物友谊赛场">×</button></header>{!petContest ? <div className="pet-contest-registration"><section><h3>1. 选择小禾的参赛宠物</h3><div className="contest-own-pets">{game.pets.filter((pet) => !isNurseryPet(pet) && pet.id !== game.missingPetId).map((pet) => { const info = PET_CATALOG.find((entry) => entry.id === pet.type)!; return <button key={`contest-own-${pet.id}`} className={`${selectedContestPet === pet.id ? "selected" : ""} pet-${pet.type}`} onClick={() => setSelectedContestPet(pet.id)}><span className="contest-pet-art"><i /><b /></span><strong>{pet.sex}{info.name}</strong><small>默契 {game.petBonds[pet.id] ?? 0}/100</small></button>; })}{!game.pets.some((pet) => !isNurseryPet(pet) && pet.id !== game.missingPetId) && <p>还没有能上场的成年宠物。宝宝长大以后也可以参赛。</p>}</div></section><section><h3>2. 选择居民和她/他的宠物</h3><div className="contest-rival-pets">{relationshipPeople.map((name) => { const profile = residentPetProfile(name); return <button key={`contest-rival-${name}`} className={`${selectedContestRival === name ? "selected" : ""} pet-${profile.id}`} onClick={() => setSelectedContestRival(name)}><span className="contest-pet-art"><i /><b /></span><span><strong>{name}和{profile.nickname}</strong><small>{profile.name} · {profile.strength}</small></span></button>; })}</div></section><button className="start-pet-contest" disabled={!selectedContestPet} onClick={startPetContest}>一起走进赛场，开始三轮比赛</button></div> : <div className={`pet-contest-stage contest-round-${petContest.round} ${petContest.finished ? "contest-finished" : ""}`}><div className="contest-scoreboard"><span><b>小禾队</b><strong>{petContest.playerScore}</strong></span><em>VS</em><span><b>{petContest.rival}队</b><strong>{petContest.rivalScore}</strong></span></div><div className="contest-pet-duo"><div className={`contest-live-pet own pet-${ownPet?.type ?? "cat"}`}><i /><b /><span>{ownPetInfo?.name ?? "小宠物"}</span></div><div className="contest-field-mark" /><div className={`contest-live-pet rival pet-${rivalPet.id} variant-${rivalPet.variant}`}><i /><b /><span>{rivalPet.nickname}</span></div></div>{!petContest.finished && petContest.round === 0 && <div className="contest-ribbon-game"><strong>抢彩带：看准飘动位置</strong><div className="contest-timing-track"><i /><b style={{ left: `${petContestAim}%` }}><em /></b></div><button onClick={catchContestRibbon}>现在扑向彩带</button><small>{ownPet && ["rabbit", "chick", "cat"].includes(ownPet.type) ? "这只宠物动作灵巧，绿色成功区更宽" : "彩带进入绿色区域才抓得到"}</small></div>}{!petContest.finished && petContest.round === 1 && <div className="contest-ball-game"><strong>推软球：按住蓄力，松手出发</strong><div className="contest-power-track"><i /><b style={{ width: `${petContestPower}%` }} /><em style={{ left: `${petContestPower}%` }} /></div><button onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); startContestPush(); }} onPointerUp={releaseContestPush} onPointerCancel={releaseContestPush}>按住推球 · 绿色时松手</button><small>当前力量 {petContestPower}% · 力量过小或过大都会让球偏出跑道</small></div>}{!petContest.finished && petContest.round === 2 && <div className="contest-soft-bout"><strong>软垫友谊对抗 · 第 {petContest.exchanges + 1}/3 回合</strong><div className={`contest-cue cue-${petContest.cue}`}><i /><span>{cueText}</span></div><div className="contest-counter-moves"><button onClick={() => answerPetContestCue("dodgeLeft")}>← 向左闪</button><button onClick={() => answerPetContestCue("circle")}>绕后轻推</button><button onClick={() => answerPetContestCue("dodgeRight")}>向右闪 →</button></div><small>观察对方从哪边来：躲开后再轻碰肩垫，不咬、不抓，也不会受伤</small></div>}{petContest.finished && <div className="contest-result"><i>{petContest.playerScore > petContest.rivalScore ? "🏆" : petContest.playerScore === petContest.rivalScore ? "🤝" : "★"}</i><strong>{petContest.playerScore > petContest.rivalScore ? "小禾队赢得友谊赛！" : petContest.playerScore === petContest.rivalScore ? "双方打成平手！" : "完整比赛，学会了新动作！"}</strong><p>{message}</p><div><button onClick={() => { setPetContest(null); setPetContestAim(7); setPetContestPower(0); }}>换对手再比一次</button><button onClick={closeContest}>带宠物离开赛场</button></div></div>}</div>}<footer><span>{message}</span><small>所有居民都有自己的宠物 · 比赛只用彩带、软球和厚软垫</small></footer></section></div>;
      })()}

      {babyCare && (() => { const petRecord = game.pets.find((pet) => pet.id === babyCare.petId); const petName = PET_CATALOG.find((pet) => pet.id === petRecord?.type)?.name ?? "小宠物"; return <div className="baby-care-overlay" role="presentation"><section role="dialog" aria-modal="true" aria-label={`照顾${petName}宝宝`}><header><div><span>农舍里的新生小动物 · 真实照顾</span><h2>照顾{petName}宝宝</h2><small>第 {babyCare.stage + 1}/4 段 · 失误 {babyCare.mistakes} 次</small></div><button onClick={() => { if (babyCareWaterTimerRef.current !== null) window.clearInterval(babyCareWaterTimerRef.current); babyCareWaterTimerRef.current = null; setBabyCare(null); }} aria-label="暂时离开照顾">×</button></header><div className={`baby-care-stage baby-stage-${babyCare.stage} pet-${petRecord?.type ?? "cat"}`}><div className="baby-pet-art"><i /><b /><em /></div>{babyCare.stage === 0 && <div className="baby-feed-game"><strong>等宝宝的嘴对准食勺</strong><div className="baby-timing-track"><i className="baby-good-zone" /><b style={{ left: `${babyCareAim}%` }} /></div><button onClick={feedBabyAtRightMoment}>现在喂一勺</button><small>已经喂好 {babyCare.feedHits}/2 勺；光点进入绿色区域才算喂到</small></div>}{babyCare.stage === 1 && <div className="baby-water-game"><strong>按住水壶，在正确水位松手</strong><div className="baby-water-bowl"><i style={{ height: `${babyCareWater}%` }} /><b /></div><div className="baby-water-meter"><i className="baby-water-zone" /><b style={{ height: `${babyCareWater}%` }} /></div><button onPointerDown={startBabyWaterPour} onPointerUp={stopBabyWaterPour} onPointerLeave={stopBabyWaterPour} onPointerCancel={stopBabyWaterPour}>按住倒水 · 松手停下</button><small>水量 {babyCareWater}% · 少了喝不到，多了会溅出来</small></div>}{babyCare.stage === 2 && <div className="baby-brush-game"><strong>按住梳子，沿身体来回梳毛</strong><div className="baby-brush-surface" onPointerDown={brushBabyPet} onPointerMove={brushBabyPet} onPointerUp={() => { babyCareBrushLastPointRef.current = null; }} onPointerCancel={() => { babyCareBrushLastPointRef.current = null; }}><i className="baby-fur-lines" /><b className="baby-brush-tool" style={{ left: `${Math.min(88, 4 + babyCare.brushProgress * .82)}%` }} /></div><div className="baby-brush-meter"><i style={{ width: `${babyCare.brushProgress}%` }} /></div><small>梳理 {Math.round(babyCare.brushProgress)}% · 只点一下不会增加进度</small></div>}{babyCare.stage === 3 && <div className="baby-play-game"><strong>看准宝宝跑进绿色接球区再投球</strong><div className="baby-play-lane"><i className="baby-catch-zone" /><b className="baby-running-target" /><em className="baby-toy-marker" style={{ left: `${babyCareToyAim}%` }} /></div><button onClick={throwBabyToy}>把软球投出去</button><small>投偏不会完成；瞄准绿色范围再出手</small></div>}</div><div className="baby-care-progress">{["喂食", "控水", "梳毛", "陪玩"].map((label, index) => <i key={label} className={index < babyCare.stage ? "done" : index === babyCare.stage ? "active" : ""}><b>{index < babyCare.stage ? "✓" : index + 1}</b><span>{label}</span></i>)}</div><footer><span>{message}</span><button onClick={() => setBabyCare(null)}>暂时离开</button></footer></section></div>; })()}

      {birthdayCeremony && <div className="birthday-ceremony-overlay" role="presentation"><section role="dialog" aria-modal="true" aria-label={`${birthdayCeremony.person}的生日仪式`}><header><div><span>亲手完成生日仪式 · 第 {birthdayCeremony.step + 1}/3 步</span><h2>{birthdayCeremony.person}的生日会</h2></div><button onClick={() => { setBirthdayCeremony(null); setMessage("生日仪式暂时停下了，再点一次蛋糕就能重新开始。 "); }} aria-label="暂时离开生日仪式">×</button></header><div className={`birthday-ceremony-stage ceremony-step-${birthdayCeremony.step}`}>
        {birthdayCeremony.step === 0 && <div className="birthday-song-game"><div className="birthday-singers" aria-hidden="true">{BIRTHDAY_GUESTS.slice(0, 6).map((name, index) => <i key={`singer-${name}`} className={index < birthdayCeremony.songTaps + 2 ? "singing" : ""} style={personClothesStyle(name)}><b /><em /></i>)}</div><strong>跟着亮起的音符唱生日歌</strong><div className="birthday-notes">{["祝", "生", "快", "乐"].map((note, index) => <button key={note} className={index < birthdayCeremony.songTaps ? "sung" : index === birthdayCeremony.songTaps ? "next-note" : ""} disabled={index !== birthdayCeremony.songTaps} onClick={tapBirthdaySong}><i>♪</i><span>{note}</span></button>)}</div><small>依次点击四个音符，所有人会一起开口唱歌</small></div>}
        {birthdayCeremony.step === 1 && <div className="birthday-blow-game"><strong>连续吹气，把三根蜡烛逐一吹灭</strong><div className="ceremony-cake"><i /><div className="ceremony-candles">{[0, 1, 2].map((candle) => <b key={`candle-${candle}`} className={candle < birthdayCeremony.blowTaps ? "blown" : ""}><em /></b>)}</div></div><button onClick={blowBirthdayCandle}><i>呼——</i><span>{birthdayCeremony.blowTaps < 3 ? `吹第 ${birthdayCeremony.blowTaps + 1} 根蜡烛` : "蜡烛都灭了"}</span></button><small>每点一次，火焰会真正少一根</small></div>}
        {birthdayCeremony.step === 2 && <div className="birthday-cut-game"><strong>按住蛋糕刀，从左边慢慢拖到右边</strong><div className="cake-cut-board" onPointerDown={dragBirthdayKnife} onPointerMove={(event) => { if (event.buttons > 0 || event.pressure > 0) dragBirthdayKnife(event); }}><div className="cuttable-cake"><i /><i /><b className="cake-cut-line" style={{ width: `${birthdayCeremony.cutProgress}%` }} /></div><span className="birthday-knife" style={{ left: `${Math.max(4, birthdayCeremony.cutProgress)}%` }}><i /><b /></span></div><div className="birthday-cut-progress"><i style={{ width: `${birthdayCeremony.cutProgress}%` }} /><span>已经切开 {Math.round(birthdayCeremony.cutProgress)}%</span></div><button onClick={() => updateBirthdayCut(Math.min(100, birthdayCeremony.cutProgress + 25))}>平板不好拖动时，点这里切一段</button></div>}
      </div><footer><span>{birthdayCeremony.step === 0 ? "唱完四句，才可以吹蜡烛" : birthdayCeremony.step === 1 ? "三根火焰全部熄灭，才能拿蛋糕刀" : "把刀拖到最右边，蛋糕才会真正切开并发放奖励"}</span></footer></section></div>}

      {ageBookOpen && ageTraining?.skill !== "clone" && ageTraining?.skill !== "teleport" && <div className="age-growth-overlay" role="presentation" onPointerUpCapture={handleAgeTrainingPointerRelease}><section role="dialog" aria-modal="true" aria-label="小禾的年龄成长手册"><header><div><span>每年春天第十九日过完生日才会长大</span><h2>小禾的成长手册 · {game.playerAge} 岁</h2></div><button onClick={() => { setAgeBookOpen(false); setAgeTraining(null); setAgeTrainingHeldPart(null); }} aria-label="关闭成长手册">×</button></header>{!ageTraining ? <><div className="age-book-intro"><div className={`age-portrait age-${Math.min(5, game.playerAge)}`}><img src={game.sick ? "/xiaohe-sick-sprite.png" : "/xiaohe-sprite.png"} alt="小禾" /></div><div><strong>{displayName}现在 {game.playerAge} 岁</strong><p>一岁不能提前做两岁的事情。达到年龄只代表可以开始学习，仍要亲手完成完整训练，能力才会永久生效。</p><small>下次长大：第 {game.year + (game.birthdayGrowthYear === game.year ? 1 : 0)} 年春天第十九日生日派对结束后</small></div></div><div className="age-skill-grid">{AGE_SKILLS.map((skill) => { const locked = game.playerAge < skill.age; const learned = game.ageSkillsLearned.includes(skill.id); return <article key={skill.id} className={`${locked ? "locked" : ""} ${learned ? "learned" : ""}`}><i>{learned ? "✓" : skill.age}</i><span><small>{skill.age} 岁解锁 · {skill.kind}</small><strong>{skill.name}</strong><p>{skill.description}</p><em>{skill.benefit}</em></span><button disabled={locked} onClick={() => beginAgeTraining(skill.id)}>{learned ? "已经学会" : locked ? `还要长到 ${skill.age} 岁` : "进入实际训练"}</button></article>; })}</div></> : (() => { const skill = AGE_SKILLS.find((item) => item.id === ageTraining.skill)!; if (ageTraining.skill === "trail") return <div className="age-training-stage trail-training"><div className="age-training-title"><span>{skill.age} 岁本领 · {skill.kind}</span><strong>{skill.name}</strong><small>已经走过 {ageTraining.progress}/{skill.required} 段 · 走错 {ageTraining.mistakes} 次</small></div><div className="age-trail-map"><i className="trail-river" /><i className="trail-bridge" /><div className="trail-footprints">{AGE_TRAIL_ROUTE.map((direction,index)=><i key={`foot-${index}`} style={{ rotate: direction === "up" ? "0deg" : direction === "right" ? "90deg" : direction === "down" ? "180deg" : "270deg" }} className={index < ageTraining.progress ? "found" : index === ageTraining.progress ? "current" : ""} />)}</div><div className="age-trail-player" style={{ left: `${12 + ageTraining.progress * 12}%`, top: `${68 - (ageTraining.progress % 3) * 16}%` }}><i /><b /></div><div className="trail-treasure"><i /><b /></div></div><div className="age-direction-pad"><button onClick={() => trainAgeTrail("up")}>↑<small>向上</small></button><button onClick={() => trainAgeTrail("left")}>←<small>向左</small></button><button onClick={() => trainAgeTrail("down")}>↓<small>向下</small></button><button onClick={() => trainAgeTrail("right")}>→<small>向右</small></button></div><p>观察当前发亮脚印的朝向，再用方向键走。走错会退回上一处，不能连续乱按。</p></div>; if (ageTraining.skill === "shelter") { const expected = AGE_CAMP_PARTS[ageTraining.progress]; return <div className="age-training-stage shelter-training"><div className="age-training-title"><span>{skill.age} 岁本领 · {skill.kind}</span><strong>{skill.name}</strong><small>工具带 {ageTraining.progress}/{skill.required} · 装错 {ageTraining.mistakes} 次</small></div><div className="age-shelter-yard"><div className={`training-tent tool-bench built-${ageTraining.progress}`}><i /><b /><em /><u /><s /><span /></div><button data-age-camp-target className="age-camp-target" onDragOver={(event)=>event.preventDefault()} onDrop={(event)=>{event.preventDefault();dropAgeCampPart();}}><i /><strong>本轮接口</strong><small>需要：{expected}</small></button><div className="age-camp-parts">{AGE_CAMP_PARTS.map((part)=><button key={part} draggable className={ageTrainingHeldPart === part ? "held" : ""} onDragStart={() => { setAgeTrainingHeldPart(part); setMessage(`拿起${part}，拖到农具养护台右边的接口。`); }} onPointerDown={() => { setAgeTrainingHeldPart(part); setMessage(`按住${part}不要松手，拖到右边发光接口。`); }}><i>{part.slice(0,1)}</i><span>{part}</span></button>)}</div></div><p>养护零件会逐件装到真实工具台上；必须拖动正确零件，装错的会退回工具盘。</p></div>; } if (ageTraining.skill === "hybrid") { const round = AGE_HYBRID_ROUNDS[ageTraining.progress]; return <div className="age-training-stage hybrid-training"><div className="age-training-title"><span>{skill.age} 岁本领 · {skill.kind}</span><strong>{skill.name}</strong><small>观察实验 {ageTraining.progress + 1}/{skill.required} · 配错 {ageTraining.mistakes} 次</small></div><div className="age-seed-lab"><div className={`weather-observation-card weather-round-${ageTraining.progress}`}><i /><b>{round.weather}</b><span>观察叶片、温度和土壤，找出最能形成丰收的作物</span></div><div className="seed-observation-pots"><i /><i /><i /></div><div className="age-seed-choices">{round.answers.map((answer)=><button key={answer} onClick={() => trainAgeHybrid(answer)}><i>{answer.slice(0,1)}</i><span>{answer}</span></button>)}</div></div><p>判断错了，作物收成会变少；必须根据四季和天气重新比较，不会自动告诉答案。</p></div>; } return <div className="age-training-stage echo-training"><div className="age-training-title"><span>{skill.age} 岁本领 · {skill.kind}</span><strong>{skill.name}</strong><small>找到 {ageTraining.progress}/{skill.required} 处回声 · 敲空 {ageTraining.mistakes} 次</small></div><div className="age-echo-cave"><div className="echo-rocks"><i /><i /><i /><i /></div><div className="echo-timing-bar"><i className="echo-good-zone" /><b style={{ left: `${ageEchoPulse}%` }} /></div><button onClick={strikeAgeEcho}><i>⚒</i><span>光点进入绿色区域时敲击</span></button><div className={`echo-crystal-progress found-${ageTraining.progress}`}><i /><i /><i /><i /></div></div><p>光点会不断来回移动。太早或太晚都只会敲到普通石头，连续四次听准才能找到矿脉。</p></div>; })()}<footer><span>{message}</span>{ageTraining && <button onClick={() => { setAgeTraining(null); setAgeTrainingHeldPart(null); setMessage("暂时退出训练，已经学会的能力不会消失。 "); }}>返回成长手册</button>}</footer></section></div>}

      {residentInvitation && <div className={`resident-invitation-card ${residentInvitation.travelMode === "car" ? "car-invitation" : ""}`} role="dialog" aria-label={`${residentInvitation.person}邀请一起出门`}><button className="invitation-person" style={personClothesStyle(residentInvitation.person)} onClick={() => setMessage(`${residentInvitation.person}${residentInvitation.travelMode === "car" ? "已经把车开到咖啡店门口" : "正在路边等小禾跟上"}。`)}><i /><b /></button><div><span>临时邀请 · 只在现在有效</span><strong>{residentInvitation.person}要去{HIDDEN_TRIPS[residentInvitation.trip].name}</strong><p>{residentInvitation.travelMode === "car" ? "居民的车已经停在门口，小禾不能独自前往，但可以坐在副驾驶一起去。" : "这个地方不在地图上，也不能自己开车到达。"}</p></div>{residentInvitation.travelMode === "car" && <i className="resident-trip-car" aria-hidden="true"><b /><em /></i>}<button onClick={followResidentToHiddenPlace}>{residentInvitation.travelMode === "car" ? "跟着上车" : "现在跟上"}</button><button className="decline-invitation" onClick={() => { setResidentInvitation(null); setMessage(`小禾这次没有跟去，${residentInvitation.person}挥挥手独自出发了。`); }}>这次不去</button></div>}

      {residentOuting && <div className={`resident-outing-overlay outing-${residentOuting.trip}`} role="presentation"><section role="dialog" aria-modal="true" aria-label={HIDDEN_TRIPS[residentOuting.trip].name}><header><div><span>朋友专属旅行 · 比节日更自由</span><h2>{HIDDEN_TRIPS[residentOuting.trip].name}</h2><small>{residentOuting.travelMode === "car" ? `坐着${residentOuting.person}的车来到这里` : `只有跟着${residentOuting.person}才能来到这里`} · 已体验 {outingActivitiesDone.length}/3</small></div><button onClick={() => { setResidentOuting(null); setOutingActivitiesDone([]); setMessage(`小禾跟着${residentOuting.person}沿原路回到了${sceneLabel}。`); }}>×</button></header><div className="hidden-trip-scene" onClick={(event) => { if (event.target !== event.currentTarget) return; const bounds = event.currentTarget.getBoundingClientRect(); setOutingPlayer({ x: Math.max(8, Math.min(92, ((event.clientX - bounds.left) / bounds.width) * 100)), y: Math.max(28, Math.min(76, ((event.clientY - bounds.top) / bounds.height) * 100)) }); }}><div className="trip-sky"><i /><i /></div><div className="trip-land"><i /><i /><b /></div><div className="trip-building"><i /><b /></div>{residentOuting.travelMode === "car" && <div className="outing-parked-car"><i /><b /><em /></div>}{HIDDEN_TRIP_ACTIVITIES[residentOuting.trip].map((activity, index) => <button key={`${residentOuting.trip}-${activity.name}`} className={`trip-activity ${outingActivitiesDone.includes(index) ? "done" : ""}`} style={{ left: `${activity.x}%`, top: `${activity.y}%` }} onClick={() => playOutingActivity(index)}><i>{outingActivitiesDone.includes(index) ? "✓" : activity.icon}</i><span><strong>{activity.name}</strong><small>{outingActivitiesDone.includes(index) ? "已经亲手完成" : "走近后再点一次"}</small></span></button>)}<button className="trip-resident" style={personClothesStyle(residentOuting.person)} onClick={() => setMessage(`${residentOuting.person}：先在这里自由走一走，靠近三个有名字的玩法，再点一次就能和我一起动手。`)}><i /><b /><span>{residentOuting.person}</span></button><div className="trip-player" style={{ left: `${outingPlayer.x}%`, top: `${outingPlayer.y}%` }}><PlayerSprite facing="right" sick={game.sick} /><span>{displayName}</span></div><p>{HIDDEN_TRIPS[residentOuting.trip].description}</p></div><footer><span>点空地自由走动 · 靠近玩法再亲手完成</span><button disabled={outingActivitiesDone.length < 3} onClick={enjoyResidentOuting}>{outingActivitiesDone.length < 3 ? `还差 ${3 - outingActivitiesDone.length} 项` : `完成旅行 · ${HIDDEN_TRIPS[residentOuting.trip].action}`}</button><button onClick={() => { setResidentOuting(null); setOutingActivitiesDone([]); setMessage(`小禾跟着${residentOuting.person}沿原路回来了。`); }}>{residentOuting.travelMode === "car" ? "坐居民的车回去" : "跟着居民回去"}</button></footer></section></div>}

      {tripHandsOn && residentOuting && (() => {
        const activity = HIDDEN_TRIP_ACTIVITIES[residentOuting.trip][tripHandsOn.index];
        const details = TRIP_HANDS_ON_DETAILS[residentOuting.trip][tripHandsOn.index];
        const checkpoints = TRIP_MOVE_CHECKPOINTS[residentOuting.trip];
        const parts = details.parts ?? [];
        return <div className={`trip-hands-on-overlay trip-game-${residentOuting.trip} trip-mode-${tripHandsOn.mode}`} role="presentation" onPointerUpCapture={handleTripHandsOnPointerRelease}>
          <section role="dialog" aria-modal="true" aria-label={`${activity.name}实际操作`}>
            <header><div><span>{HIDDEN_TRIPS[residentOuting.trip].name} · 第 {tripHandsOn.index + 1}/3 项</span><h2>{activity.name}</h2><small>{tripHandsOn.mode === "move" ? "按住方向键让小禾在场地里连续走，亲自靠近每个发亮物件；松手就会停下。" : details.instruction}</small></div><button onClick={() => { stopTripMove(); setTripHandsOn(null); stopTripGesture(); setMessage(`暂时离开“${activity.name}”，它还没有算完成。走近后可以重新开始。`); }} aria-label="退出当前旅行玩法">×</button></header>
            <main>
              {tripHandsOn.mode === "move" && <div className="trip-move-game">
                <div className={`trip-route-world route-${residentOuting.trip}`}><i className="trip-route-water" /><i className="trip-route-bridge" /><div className="trip-route-marks">{checkpoints.map((point, index) => <i key={`route-${index}`} aria-label={`第 ${index + 1} 个场景目标`} style={{ left: `${point.x}%`, top: `${point.y}%` }} className={`trip-checkpoint ${index < tripHandsOn.progress ? "passed" : index === tripHandsOn.progress ? "current" : ""}`}><b /></i>)}</div><div className="trip-route-player" style={{ left: `${tripHandsOn.x}%`, top: `${tripHandsOn.y}%` }}><PlayerSprite facing={tripHandsOn.facing} sick={false} /></div><div className="trip-route-goal"><i>{activity.icon}</i><span>{tripHandsOn.progress}/{checkpoints.length}</span></div><p className="trip-move-hint">走到发亮物件旁边会自动互动</p></div>
                <div className="trip-direction-controls" aria-label="按住方向键连续移动"><button onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); startTripMove("up"); }} onPointerUp={stopTripMove} onPointerCancel={stopTripMove}>↑<small>按住向上走</small></button><button onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); startTripMove("left"); }} onPointerUp={stopTripMove} onPointerCancel={stopTripMove}>←<small>按住向左走</small></button><button onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); startTripMove("down"); }} onPointerUp={stopTripMove} onPointerCancel={stopTripMove}>↓<small>按住向下走</small></button><button onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); startTripMove("right"); }} onPointerUp={stopTripMove} onPointerCancel={stopTripMove}>→<small>按住向右走</small></button></div>
              </div>}
              {tripHandsOn.mode === "drag" && <div className="trip-drag-game"><div className="trip-part-tray"><strong>零件托盘</strong>{parts.map((part, index) => { const placed = index < tripHandsOn.progress; return <button key={part} disabled={placed} draggable={!placed} className={`${placed ? "placed" : ""} ${tripHandsOn.heldPart === part ? "held" : ""}`} onDragStart={() => setTripHandsOn({ ...tripHandsOn, heldPart: part })} onPointerDown={() => { if (!placed) { setTripHandsOn({ ...tripHandsOn, heldPart: part }); setMessage(`按住“${part}”，拖到右侧发光位置再松手。`); } }}><i>{placed ? "✓" : part.slice(0, 1)}</i><span>{part}</span></button>; })}</div><div className="trip-assembly-scene"><div className={`trip-assembled-object object-${residentOuting.trip} stage-${tripHandsOn.progress}`}><i /><b /><em /><span>{activity.name}</span></div><div data-trip-part-target className="trip-part-target" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); dropTripHandsOnPart(); }}><i /><strong>本轮需要</strong><span>{parts[tripHandsOn.progress]}</span></div></div></div>}
              {tripHandsOn.mode === "gesture" && <div className="trip-gesture-game"><div className={`trip-gesture-scene gesture-${residentOuting.trip}`} onPointerDown={startTripGesture} onPointerMove={moveTripGesture} onPointerUp={stopTripGesture} onPointerCancel={stopTripGesture}><i className="gesture-prop prop-one" /><i className="gesture-prop prop-two" /><i className="gesture-prop prop-three" /><b style={{ left: `${12 + tripHandsOn.progress * .76}%`, top: `${residentOuting.trip === "hillsideTea" ? 17 + (tripHandsOn.progress % 18) : residentOuting.trip === "riverKitchen" ? 56 : 22 + (tripHandsOn.progress % 48)}%` }} /><span>按住场景拖动 · {tripHandsOn.progress}%</span></div><div className="trip-gesture-progress"><i style={{ width: `${tripHandsOn.progress}%` }} /><span>{details.gesture === "horizontal" ? "保持横向平稳移动" : details.gesture === "vertical" ? "上下反复拉动" : "沿场景路线连续拖动"}</span></div></div>}
            </main>
            <footer><span>{message}</span><small>失误 {tripHandsOn.mistakes} 次 · 只有亲手完成才会记录旅行进度</small></footer>
          </section>
        </div>;
      })()}
      {guideOpen && <div className="game-guide-overlay" role="presentation">
        <section className="game-guide-panel" role="dialog" aria-modal="true" aria-labelledby="game-guide-title">
          <header><div><span>青禾谷新手手册 · 动画教学</span><h2 id="game-guide-title">游戏说明</h2><small>从第一次走路到多人游戏，没玩过也能一步一步学会</small></div><button onClick={() => setGuideOpen(false)} aria-label="关闭游戏说明">×</button></header>
          <div className="game-guide-layout">
            <nav aria-label="游戏说明分类">{GUIDE_TOPICS.map((topic) => <button key={topic.id} className={guideTopic === topic.id ? "active" : ""} onClick={() => { setGuideTopic(topic.id); setGuideReplay((value) => value + 1); }}><i>{topic.icon}</i><span>{topic.title}</span></button>)}</nav>
            <article className="guide-topic-card">
              <div key={`${guideTopic}-${guideReplay}`} className={`guide-demo guide-demo-${guideTopic}`} aria-label={`${currentGuideTopic.title}动画演示`}>
                <div className="guide-demo-sky"><i /><i /></div><div className="guide-demo-ground" />
                <div className="guide-demo-house"><i /><b /></div><div className="guide-demo-field"><i /><i /><i /><i /></div>
                <div className="guide-demo-water"><i /></div><div className="guide-demo-tree"><i /><b /></div>
                <div className="guide-demo-player"><PlayerSprite facing="right" sick={false} /><span>小禾</span></div>
                <div className="guide-demo-npc"><i /><b /><span>居民</span></div><div className="guide-demo-pet"><i /><b /></div>
                <div className="guide-demo-tool"><i /></div><div className="guide-demo-bus"><i /><b /></div>
                <div className="guide-demo-caption"><b>{currentGuideTopic.icon}</b><span>{currentGuideTopic.summary}</span></div>
              </div>
              <div className="guide-topic-heading"><div><small>当前说明</small><h3>{currentGuideTopic.title}</h3></div><button onClick={() => setGuideReplay((value) => value + 1)}>↻ 重新播放演示</button></div>
              <p>{currentGuideTopic.summary}</p>
              <ol>{currentGuideTopic.steps.map((step, index) => <li key={step}><b>{index + 1}</b><span>{step}</span></li>)}</ol>
              <aside><strong>小提示</strong><span>{currentGuideTopic.tip}</span></aside>
            </article>
          </div>
          <footer><span>说明里的小禾、工具和场景会自动演示操作</span><button onClick={() => setGuideOpen(false)}>看懂了，回到游戏</button></footer>
        </section>
      </div>}

      {residentWishWorkshop && (() => {
        const definition = residentWishDefinition(residentWishWorkshop.person);
        const materials = wishCostEntries(definition);
        const allMaterialsPlaced = residentWishWorkshop.placed.length === materials.length;
        const assemblyDone = residentWishWorkshop.assemblyProgress >= 100;
        const visual = WISH_PRODUCT_VISUAL[residentWishWorkshop.person] ?? "memory";
        return <div className="wish-workshop-overlay" role="presentation" onPointerUpCapture={handleWishWorkshopPointerRelease}>
          <section role="dialog" aria-modal="true" aria-label={`${residentWishWorkshop.person}的愿望共同制作台`}>
            <header><div><span>不是一键交付 · 要亲手完成三段制作</span><h2>{residentWishWorkshop.person}和小禾制作“{definition.finalProduct}”</h2></div><button onClick={() => { setResidentWishWorkshop(null); setHeldWishMaterial(null); setHeldWishSeal(false); stopWishAssembly(); setMessage("暂时离开共同制作台。材料没有扣除，下次找到居民还可以接着重新做。 "); }} aria-label="关闭愿望制作台">×</button></header>
            <div className="wish-workshop-steps"><span className={allMaterialsPlaced ? "done" : "active"}>1 拖入材料</span><span className={assemblyDone ? "done" : allMaterialsPlaced ? "active" : ""}>2 沿纹理加工</span><span className={assemblyDone ? "active" : ""}>3 拖入落款</span></div>
            <main>
              <aside className="wish-material-tray"><strong>材料盘</strong><small>按住一包，拖到中间发光工作台</small>{materials.map(([material, amount]) => { const placed = residentWishWorkshop.placed.includes(material); return <button key={material} disabled={placed} draggable={!placed} className={`${placed ? "placed" : ""} ${heldWishMaterial === material ? "held" : ""}`} onDragStart={() => { setHeldWishMaterial(material); setMessage(`拿起了${WISH_MATERIAL_INFO[material]}材料包，拖到中间工作台再松手。`); }} onPointerDown={() => { setHeldWishMaterial(material); setMessage(`按住${WISH_MATERIAL_INFO[material]}材料包，拖到中间发光区域再松手。`); }}><i>{placed ? "✓" : WISH_MATERIAL_ICONS[material]}</i><span>{WISH_MATERIAL_INFO[material]}<b>× {amount}</b><small>{placed ? "已摆上工作台" : `现有 ${game[material]}`}</small></span></button>; })}</aside>
              <div className="wish-build-bench">
                <div data-wish-material-target className={`wish-material-target ${allMaterialsPlaced ? "filled" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); dropWishWorkshopMaterial(); }}><span>{allMaterialsPlaced ? "材料已经放齐" : `把材料拖到这里 · ${residentWishWorkshop.placed.length}/${materials.length}`}</span>{materials.map(([material]) => <i key={`slot-${material}`} className={residentWishWorkshop.placed.includes(material) ? `material-${material} filled` : `material-${material}`}>{residentWishWorkshop.placed.includes(material) ? WISH_MATERIAL_ICONS[material] : ""}</i>)}</div>
                <div className={`wish-product-object wish-product-${visual} built-${residentWishWorkshop.placed.length} ${assemblyDone ? "finished-shape" : ""}`}><i /><b /><em /><u /><s /><span>{definition.finalProduct}</span></div>
                {allMaterialsPlaced && <div className={`wish-assembly-surface ${assemblyDone ? "complete" : ""}`} onPointerDown={startWishAssembly} onPointerMove={moveWishAssembly} onPointerUp={stopWishAssembly} onPointerCancel={stopWishAssembly}>
                  <i className="wish-grain grain-one" /><i className="wish-grain grain-two" /><i className="wish-grain grain-three" />
                  <b style={{ width: `${residentWishWorkshop.assemblyProgress}%` }} />
                  <span>{assemblyDone ? "接缝平整 · 等待落款" : `按住这里，沿横向纹理来回拖动 ${residentWishWorkshop.assemblyProgress}%`}</span>
                </div>}
                {assemblyDone && <div data-wish-seal-target className="wish-seal-target" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (heldWishSeal) completeResidentWishWorkshop(); }}><i /><span>把右边落款拖到这里</span></div>}
              </div>
              <aside className="wish-resident-helper" style={personClothesStyle(residentWishWorkshop.person)}><div className="wish-helper-person"><i /><b /></div><strong>{residentWishWorkshop.person}</strong><p>{assemblyDone ? "最后一步不能替你完成：把我们的落款牌拖到成品中央吧。" : allMaterialsPlaced ? "顺着发亮的横纹来回加工，竖着乱划不会增加进度。" : "我扶住工作台，你把每一包配方材料亲手放上来。"}</p><button disabled={!assemblyDone} draggable={assemblyDone} className={heldWishSeal ? "held" : ""} onDragStart={() => { setHeldWishSeal(true); setMessage("拿起共同落款牌，拖到成品中央的发光位置。 "); }} onPointerDown={() => { if (!assemblyDone) return; setHeldWishSeal(true); setMessage("按住共同落款牌，拖到成品中央的发光位置再松手。 "); }}><i>印</i><span>{residentWishWorkshop.person} × 小禾<small>{assemblyDone ? "按住拖动" : "加工完成后才能使用"}</small></span></button></aside>
            </main>
            <footer><span>{message}</span><small>失误 {residentWishWorkshop.mistakes} 次 · 中途退出不会扣材料</small></footer>
          </section>
        </div>;
      })()}
      {journalOpen && <div className="valley-journal-overlay" role="presentation">
        <section className="valley-journal-panel" role="dialog" aria-modal="true" aria-labelledby="valley-journal-title">
          <header><div><span>小禾的生活记录</span><h2 id="valley-journal-title">山谷日记与收藏册</h2></div><button onClick={() => setJournalOpen(false)} aria-label="关闭山谷日记">×</button></header>
          <nav><button className={journalTab === "today" ? "active" : ""} onClick={() => setJournalTab("today")}>日记与任务</button><button className={journalTab === "friends" ? "active" : ""} onClick={() => setJournalTab("friends")}>居民好感</button><button className={journalTab === "collection" ? "active" : ""} onClick={() => setJournalTab("collection")}>收藏图鉴</button><button className={journalTab === "recipes" ? "active" : ""} onClick={() => setJournalTab("recipes")}>料理食谱</button></nav>
          <div className="journal-pages">
            {journalTab === "today" && <><div className="task-refresh-board"><article><i>日</i><div><strong>今日小目标</strong><span>{game.daily.rewardClaimed ? "今天已经完成" : `${completed}/3 已完成`}</span><small>还有 1 个游戏日 · 明天早上 7:00 刷新</small></div></article><article><i>委</i><div><strong>居民轮流发布委托</strong><span>{completedResidentQuestCount}/3 已完成 · {residentBoardDaysLeft} 天后换一批</span><small>林婶、鲁师傅、叶老师等居民都会发布任务</small></div></article><article className={game.forestQuestStage === 5 ? "waiting-story" : "active-story"}><i>林</i><div><strong>安安的连续森林故事</strong><span>{game.forestQuestStage === 5 ? forestStoryDaysLeft > 0 ? `还有 ${forestStoryDaysLeft} 个游戏日出现新任务` : "新线索已经出现，去找安安" : `正在进行：${forestStoryTitle}`}</span><small>森林故事只是任务中的一条，不是全部任务</small></div></article></div><section className="resident-quest-journal"><header><div><span>本期三份委托 · 每三天轮换</span><h3>邻居们正在等小禾帮忙</h3></div><b>{completedResidentQuestCount}/3</b></header><div>{activeResidentQuests.map((quest) => { const done = game.residentQuestCompletions.includes(residentQuestKey(quest)); const here = quest.village === activeVillage && quest.scene === scene; return <article key={quest.id} className={done ? "completed" : here ? "at-location" : ""} style={personClothesStyle(quest.giver)}><i>{quest.icon}</i><div><small>{quest.giver}发布 · {quest.location}</small><strong>{quest.title}</strong><p>{quest.detail}</p><em>{done ? `已领取 ${quest.reward} 金币 · ${quest.giver}好感 +5` : here ? `已到达 · 奖励 ${quest.reward} 金币 · 好感 +5` : `前往${quest.location} · 完成后好感 +5`}</em></div><button disabled={done} onClick={() => { setJournalOpen(false); if (here) setMessage(`${quest.giver}的委托就在这里：${quest.action}。寻找带黄色感叹号的任务物品。`); else { setMapOpen(true); setMessage(`打开地图，准备前往${quest.location}完成${quest.giver}的委托。`); } }}>{done ? "完成 ✓" : here ? "去现场查看" : "打开地图找地点"}</button></article>; })}</div></section><article className="forest-story-journal"><span>另外保留 · 第 {game.forestQuestEpisode + 1} 段森林故事</span><h3>安安与{forestStoryTitle}</h3><div className="forest-story-progress">{[0, 1, 2, 3, 4, 5].map((stage) => <i key={stage} className={game.forestQuestStage >= stage ? "done" : ""}>{stage === 5 ? "★" : stage + 1}</i>)}</div><p>{game.forestQuestStage === 5 ? forestStoryDaysLeft > 0 ? `这段故事已经完成。安安还在观察森林，${forestStoryDaysLeft} 个游戏日后日记会出现新的动静。` : "纸页边缘出现了新记号，安安似乎已经发现下一件事。" : game.forestQuestEpisode === 0 ? game.forestQuestStage === 0 ? "老松树的颜色有些不对，先去安安的小农场亲自看看。" : "日记只记录已经观察到的现象；去现场、等待天气与材料慢慢发生变化。" : game.forestQuestEpisode === 1 ? "玻璃瓶里的小种子会对不同气味和夜晚光线产生反应。" : game.forestQuestEpisode === 2 ? "湿木板、羽毛和树脂留下的痕迹，正在慢慢指向一座旧鸟屋。" : "小溪石缝里仍有很轻的水声，答案可能藏在潮湿的泥土下面。"}</p></article><div className="journal-entry-list">{game.journalEntries.length ? game.journalEntries.map((entry, index) => <p key={`${entry}-${index}`}><i>{index === 0 ? "今" : "记"}</i><span>{entry}</span></p>) : <p>今天还没有写下新的事情。</p>}</div></>}
            {journalTab === "friends" && <div className="friendship-grid">{relationshipPeople.map((name) => {
              const points = game.friendship[name] ?? 0;
              const hearts = Math.min(5, Math.floor(points / 20));
              const activity = residentActivity(name, game.hour, game.day, game.weather);
              const bestFriend = points >= 100;
              const farmFriend = (YOUNG_FRIENDS as readonly string[]).includes(name);
              const wishDefinition = residentWishDefinition(name);
              const wish = game.residentWishes[name];
              const wishNumbers = wish ? wishProgressNumbers(game, name, wish) : null;
              const wishObjectivesReady = Boolean(wish && wishNumbers && !wish.completed && wishNumbers.first >= wishDefinition.firstNeed && wishNumbers.second >= wishDefinition.secondNeed && wishNumbers.days >= 2);
              const wishMaterialsReady = hasWishMaterials(game, wishDefinition);
              const wishReady = wishObjectivesReady && wishMaterialsReady;
              return <article key={name} className={`${bestFriend ? "best-friend" : ""} ${wish?.completed ? "wish-completed" : wish ? "wish-active" : ""}`} style={personClothesStyle(name)}>
                <div className="friend-portrait"><i /><b /></div>
                <div className="friend-summary"><strong>{name}{bestFriend && <em className="best-friend-badge">挚友</em>}</strong><span className="heart-row">{"♥".repeat(hearts)}<em>{"♡".repeat(5 - hearts)}</em></span><small>{points}/100 · {activity.label}</small>{farmFriend && <small>会每天轮流来农场实际浇水、施肥或播种</small>}{bestFriend && <small>更常邀请旅行 · 主动帮助 · 挚友纪念奖励</small>}</div>
                <section className="resident-wish-card">
                  <header><span>心愿</span><strong>{wishDefinition.title}</strong></header>
                  {!wish && <><p>{wishDefinition.story}</p><button onClick={() => startResidentWish(name)}>认真听听愿望</button></>}
                  {wish && !wish.completed && wishNumbers && <>
                    <div className="wish-progress-line"><span>{wishDefinition.firstLabel}</span><b>{wishNumbers.first}/{wishDefinition.firstNeed}</b><i><em style={{ width: `${Math.min(100, wishNumbers.first / wishDefinition.firstNeed * 100)}%` }} /></i></div>
                    <div className="wish-progress-line"><span>{wishDefinition.secondLabel}</span><b>{wishNumbers.second}/{wishDefinition.secondNeed}</b><i><em style={{ width: `${Math.min(100, wishNumbers.second / wishDefinition.secondNeed * 100)}%` }} /></i></div>
                    <small>共同观察 {Math.min(2, wishNumbers.days)}/2 天 · 不能一天完成</small>
                    <div className="wish-final-recipe"><strong>最后一起制作：{wishDefinition.finalProduct}</strong><span>{wishCostEntries(wishDefinition).map(([material, amount]) => <em key={`${name}-${material}`} className={game[material] >= amount ? "enough" : "missing"}>{WISH_MATERIAL_INFO[material]} {game[material]}/{amount}</em>)}</span><small>{wishDefinition.finalPlace}</small></div>
                    <button className={wishReady ? "wish-ready-button" : ""} onClick={() => { if (wishReady) { setJournalOpen(false); setMessage(`全部准备好了。亲自找到${name}，点击本人，再点“交付愿望材料”。`); } else if (wishObjectivesReady) setMessage(`调查完成了，但合成材料还没有齐：需要${wishCostText(wishDefinition)}。`); else setMessage("还不能收尾：继续亲手完成两段行动，并让记录跨过至少两个游戏日。"); }}>{wishReady ? `去找${name} · 当面交付` : wishObjectivesReady ? "调查完成 · 继续准备材料" : "查看还差什么"}</button>
                  </>}
                  {wish?.completed && <div className="wish-finished"><b>愿望已实现 ✓</b><span>你们花了几天亲手完成，获得 260 金币与 30 好感。</span></div>}
                </section>
              </article>;
            })}</div>}
            {journalTab === "collection" && <div className="collection-grid"><article><b>★</b><strong>作物品质</strong><span>普通 {qualityTotals.normal}</span><span>银星 {qualityTotals.silver}</span><span>金星 {qualityTotals.gold}</span></article><article><b>书</b><strong>山谷图书</strong><span>{game.libraryBooks.length}/{LOST_BOOKS.length} 本归还</span></article><article><b>◆</b><strong>博物馆藏品</strong><span>{game.museumArtifacts.length}/{RARE_ARTIFACTS.length} 件捐赠</span></article><article><b>视</b><strong>动画收藏</strong><span>看过 {game.watchedTvEpisodes.length} 集不同动画</span></article><article><b>鱼</b><strong>钓鱼记录</strong><span>累计钓到 {game.fishCaught} 条鱼</span></article><article><b>梦</b><strong>梦境记录</strong><span>{game.lastDreamAbsoluteDay > 0 ? "已经遇见过神秘梦境" : "还没有做过特别的梦"}</span></article></div>}
            {journalTab === "recipes" && <div className="recipe-journal"><article className={game.recipesDiscovered.includes("香草烤螃蟹") ? "discovered" : "locked"}><i className="cooked-crab-icon" /><div><strong>香草烤螃蟹</strong><p>切开蟹壳、控制火候，最后放进深盘。熟食在餐桌吃恢复更多体力。</p></div><span>{game.recipesDiscovered.includes("香草烤螃蟹") ? "已学会" : "去二楼厨房发现"}</span></article><article className={game.recipesDiscovered.includes("清香炒小虾") ? "discovered" : "locked"}><i className="cooked-shrimp-icon" /><div><strong>清香炒小虾</strong><p>处理小虾、及时翻面，再装进白瓷盘，保持清亮颜色。</p></div><span>{game.recipesDiscovered.includes("清香炒小虾") ? "已学会" : "去二楼厨房发现"}</span></article></div>}
          </div>
          <footer><span>聊天、送礼、看电视、做饭与重要事件都会自动写进日记</span><button onClick={() => setJournalOpen(false)}>合上日记</button></footer>
        </section>
      </div>}

      {cookingGame && <div className="cooking-game-overlay" role="presentation">
        <section className={`cooking-game-panel cooking-step-${cookingGame.step}`} role="dialog" aria-modal="true" aria-labelledby="cooking-game-title">
          <header><div><span>二楼厨房 · 亲手料理</span><h2 id="cooking-game-title">{cookingGame.food === "crabs" ? "香草烤螃蟹" : "清香炒小虾"}</h2></div><button onClick={() => { setCookingGame(null); setMessage("暂时离开烹饪台，食材没有消耗。 "); }}>×</button></header>
          <div className="cooking-worktop">
            <div className="cooking-window"><i /><i /></div><div className="cooking-counter" />
            {cookingGame.step === "chop" && <button className={`cooking-board food-${cookingGame.food}`} onClick={chopCookingIngredient} aria-label="点击菜刀处理食材"><i className="cooking-food" /><b className="cooking-knife" /><span>点击菜刀，沿纹理处理食材</span><em>{cookingGame.chops}/4 刀</em></button>}
            {cookingGame.step === "heat" && <div className="cooking-pan-stage"><div className={`cooking-pan food-${cookingGame.food}`}><i /><b /></div><div className="cooking-heat-meter"><span>小火</span><div><i className="safe-heat-zone" /><b style={{ left: `${cookingHeat}%` }} /></div><span>焦糊</span></div><button onClick={stopCookingHeat}>现在翻面</button><small>让红色游标进入绿色区域再点击</small></div>}
            {cookingGame.step === "plate" && <div className="cooking-plating"><strong>最后一步 · 选择合适的盘子</strong><div><button className="plate-wood" onClick={() => finishCooking("wood")}><i />木盘</button><button className="plate-white" onClick={() => finishCooking("white")}><i />白瓷盘<small>适合小虾</small></button><button className="plate-deep" onClick={() => finishCooking("deep")}><i />深口盘<small>适合螃蟹</small></button></div></div>}
          </div>
          <footer><span>{cookingGame.step === "chop" ? "第一步：处理食材" : cookingGame.step === "heat" ? "第二步：观察火候并及时翻面" : "第三步：认真装盘"}</span><button onClick={() => { setCookingGame(null); setMessage("烹饪暂停，食材仍然保留。 "); }}>暂停烹饪</button></footer>
        </section>
      </div>}

      {mapOpen && <div className="map-overlay" role="presentation">
        <section className={`village-map-panel village-map-${activeVillage}`} role="dialog" aria-modal="true" aria-labelledby="village-map-title">
          <header><div><span>八岁本人瞬移 · 选择真实目的地</span><h2 id="village-map-title">{activeVillageInfo.name}瞬移地图</h2></div><button onClick={() => setMapOpen(false)} aria-label="关闭地图">×</button></header>
          {activeVillage === "qinghe" ? <div className="village-map-canvas qinghe-map-canvas" onClickCapture={(event) => { if (!game.ageSkillsLearned.includes("teleport") && (event.target as HTMLElement).closest(".map-place")) { event.preventDefault(); event.stopPropagation(); setMessage("这里只能查看道路；八岁完成本人瞬移训练后，才可以点击地点直接到达。 "); playTone(230); } }}>
            <i className="map-river" /><i className="actual-route route-wild-farm" /><i className="actual-route route-farm-town" /><i className="actual-route route-town-east" /><i className="actual-route route-east-maple" /><i className="actual-route route-town-culture" /><i className="actual-route route-culture-north" /><i className="actual-route route-culture-residential" /><i className="actual-route route-town-south" /><i className="map-tree-cluster tree-cluster-one" /><i className="map-tree-cluster tree-cluster-two" />
            <button className={`map-place map-farm ${activeVillage === "qinghe" && scene === "farm" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("farm", { x: 8, y: 5 }, "青禾农场"); }}><i className="map-scene-picture picture-farm"><em /><em /><em /></i><b>青禾农场</b><span>农舍 · 农田 · 鱼塘</span></button>
            <button className={`map-place map-wild-farm ${activeVillage === "qinghe" && scene === "westFriendFarm" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("westFriendFarm", { x: 8, y: 5 }, "安安的小农场"); }}><i className="map-scene-picture picture-wild-farm"><em /><em /><em /></i><b>安安的小农场</b><span>青禾农场左边 · 野外朋友</span></button>
            <button className={`map-place map-town ${activeVillage === "qinghe" && scene === "town" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("town", { x: 5, y: 5 }, "中心街"); }}><i className="map-scene-picture picture-town"><em /><em /><em /></i><b>中心街</b><span>商店和居民建筑</span></button>
            <button className={`map-place map-culture ${activeVillage === "qinghe" && scene === "cultureDistrict" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("cultureDistrict", { x: 6, y: 7 }, "清河文化街"); }}><i className="map-scene-picture picture-culture"><em /><em /><em /></i><b>清河文化街</b><span>镇公所 · 学校 · 博物馆</span></button>
            <button className={`map-place map-east ${activeVillage === "qinghe" && scene === "eastNeighbor" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("eastNeighbor", { x: 3, y: 5 }, "林婶的果园小屋"); }}><i className="map-scene-picture picture-orchard"><em /><em /><em /></i><b>东郊果园</b><span>林婶家</span></button>
            <button className={`map-place map-maple ${activeVillage === "maple" ? "you-are-here" : ""}`} onClick={() => { switchVillage("maple"); travelFromMap("farm", { x: 1, y: 5 }, "枫叶村"); }}><i className="map-scene-picture picture-maple"><em /><em /><em /></i><b>枫叶村</b><span>从东郊继续向右</span></button>
            <button className={`map-place map-south ${activeVillage === "qinghe" && scene === "southNeighbor" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("southNeighbor", { x: 6, y: 3 }, "鲁师傅的院子"); }}><i className="map-scene-picture picture-workshop"><em /><em /><em /></i><b>南坡院子</b><span>鲁师傅家</span></button>
            <button className={`map-place map-north ${activeVillage === "qinghe" && scene === "northNeighbor" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("northNeighbor", { x: 6, y: 5 }, "叶老师的书屋"); }}><i className="map-scene-picture picture-library"><em /><em /><em /></i><b>北林书屋</b><span>叶老师家</span></button>
            <button className={`map-place map-residential ${activeVillage === "qinghe" && scene === "residentialDistrict" ? "you-are-here" : ""}`} onClick={() => { switchVillage("qinghe"); travelFromMap("residentialDistrict", { x: 2, y: 5 }, "青禾住宅坡"); }}><i className="map-scene-picture picture-residential"><em /><em /><em /></i><b>青禾住宅坡</b><span>居民院落 · 小玲、豆豆、小满、阿禾等朋友的家</span></button>
            <div className="map-legend"><span><i />你现在的位置</span><small>点击地点，让小禾本人直接瞬移</small></div>
          </div> : <div className="village-map-canvas maple-map-canvas" onClickCapture={(event) => { if (!game.ageSkillsLearned.includes("teleport") && (event.target as HTMLElement).closest(".map-place")) { event.preventDefault(); event.stopPropagation(); setMessage("这里只能查看道路；八岁完成本人瞬移训练后，才可以点击地点直接到达。 "); playTone(230); } }}>
            <i className="maple-map-ridge ridge-one" /><i className="maple-map-ridge ridge-two" /><i className="maple-map-stream" /><i className="maple-map-road maple-route-crossing-farm" /><i className="maple-map-road maple-route-farm-town" /><i className="maple-map-road maple-route-town-east" /><i className="maple-map-road maple-route-town-culture" /><i className="maple-map-road maple-route-culture-north" /><i className="maple-map-road maple-route-culture-residential" /><i className="maple-map-road maple-route-town-south" /><i className="maple-leaf-grove grove-one" /><i className="maple-leaf-grove grove-two" /><i className="maple-leaf-grove grove-three" />
            <button className={`map-place maple-map-farm ${scene === "farm" ? "you-are-here" : ""}`} onClick={() => { switchVillage("maple"); travelFromMap("farm", { x: 6, y: 5 }, "枫叶农场"); }}><i className="map-scene-picture picture-maple-farm"><em /><em /><em /></i><b>枫叶农场</b><span>红顶农舍 · 坡田 · 山泉池</span></button>
            <button className={`map-place maple-map-town ${scene === "town" ? "you-are-here" : ""}`} onClick={() => { switchVillage("maple"); travelFromMap("town", { x: 5, y: 5 }, "枫叶村中心街"); }}><i className="map-scene-picture picture-maple-town"><em /><em /><em /></i><b>枫叶中心街</b><span>枫木商店 · 山路广场</span></button>
            <button className={`map-place maple-map-culture ${scene === "cultureDistrict" ? "you-are-here" : ""}`} onClick={() => { switchVillage("maple"); travelFromMap("cultureDistrict", { x: 6, y: 7 }, "枫叶文化坡"); }}><i className="map-scene-picture picture-maple-culture"><em /><em /><em /></i><b>枫叶文化坡</b><span>村公所 · 山林学校 · 展览屋</span></button>
            <button className={`map-place maple-map-east ${scene === "eastNeighbor" ? "you-are-here" : ""}`} onClick={() => { switchVillage("maple"); travelFromMap("eastNeighbor", { x: 3, y: 5 }, "东山红枫林"); }}><i className="map-scene-picture picture-maple-grove"><em /><em /><em /></i><b>东山红枫林</b><span>观景坡 · 村东山路</span></button>
            <button className={`map-place maple-map-south ${scene === "southNeighbor" ? "you-are-here" : ""}`} onClick={() => { switchVillage("maple"); travelFromMap("southNeighbor", { x: 6, y: 3 }, "南坡木屋"); }}><i className="map-scene-picture picture-maple-south"><em /><em /><em /></i><b>南坡木屋</b><span>木料院 · 山脚小径</span></button>
            <button className={`map-place maple-map-north ${scene === "northNeighbor" ? "you-are-here" : ""}`} onClick={() => { switchVillage("maple"); travelFromMap("northNeighbor", { x: 6, y: 5 }, "北岭书屋"); }}><i className="map-scene-picture picture-maple-north"><em /><em /><em /></i><b>北岭书屋</b><span>枫林书房 · 北山小路</span></button>
            <button className={`map-place maple-map-residential ${scene === "residentialDistrict" ? "you-are-here" : ""}`} onClick={() => { switchVillage("maple"); travelFromMap("residentialDistrict", { x: 2, y: 5 }, "枫叶住宅坡"); }}><i className="map-scene-picture picture-maple-residential"><em /><em /><em /></i><b>枫叶住宅坡</b><span>村民各自的红枫小院</span></button>
            <button className="map-place maple-map-crossing" onClick={() => { switchVillage("qinghe"); travelFromMap("farm", { x: 11, y: 5 }, "青禾村西边山路"); }}><i className="map-scene-picture picture-qinghe-crossing"><em /><em /><em /></i><b>通往青禾村</b><span>沿农场左侧一直走</span></button>
            <div className="map-legend maple-map-legend"><span><i />你现在的位置</span><small>这张图只画枫叶村与出村山路</small></div>
          </div>}
          <footer><span>{activeVillage === "qinghe" ? "青禾农场一直向左到安安的小农场；中心街向上到文化街，文化街向上去北林。" : "枫叶农场是这张地图的起点；向右进中心街，向上到文化坡，沿农场左侧山路可以回青禾村。"}</span><button onClick={() => setMapOpen(false)}>取消瞬移</button></footer>
        </section>
      </div>}

      {drivingSchoolOpen && <div className="driving-school-overlay" role="dialog" aria-modal="true" aria-label="青禾驾驶学校"><section className="driving-school-panel"><header><div><span>青禾谷安全驾驶中心</span><h2>青禾驾驶学校</h2></div><button onClick={() => setDrivingSchoolOpen(false)} aria-label="离开驾校">×</button></header>{game.driverLicense ? <div className="license-earned"><i>驾</i><strong>青禾谷驾驶证</strong><span>持证人：{displayName}</span><p>理论考试和驾驶练习都已通过。道路修好后会永久通车，现在可以去买车出发。</p><button onClick={() => { setGame((current) => ({ ...current, driverLicense: false })); setDrivingQuizStep(0); setDrivingPracticeStep(0); setMessage("开始重新练习驾照考试。 "); }}>重新练习考试</button></div> : drivingQuizStep < DRIVING_QUESTIONS.length ? <div className="driving-theory"><span>理论考试 · 第 {drivingQuizStep + 1}/{DRIVING_QUESTIONS.length} 题</span><strong>{DRIVING_QUESTIONS[drivingQuizStep].question}</strong><div>{DRIVING_QUESTIONS[drivingQuizStep].answers.map((answer, index) => <button key={answer} onClick={() => answerDrivingQuestion(index)}>{answer}</button>)}</div><small>答错会从第一题重新开始，认真想一想。</small></div> : <div className="driving-practice"><span>驾驶练习 · 小汽车绕桩</span><div className={`practice-road practice-step-${drivingPracticeStep}`}><i className="practice-car" /><b /><b /><b /></div><strong>{drivingPracticeStep === 0 ? "第一步：向左转" : drivingPracticeStep === 1 ? "第二步：向右绕桩" : drivingPracticeStep === 2 ? "第三步：停进停车框" : "练习完成"}</strong><div><button onClick={() => doDrivingPractice(0)}>← 左转</button><button onClick={() => doDrivingPractice(1)}>右转 →</button><button onClick={() => doDrivingPractice(2)}>▣ 停车</button></div></div>}<footer><span>{game.driverLicense ? "已经取得驾照" : "先通过理论，再完成驾驶练习"}</span><button onClick={() => setDrivingSchoolOpen(false)}>离开驾校</button></footer></section></div>}

      {townhallCalendarOpen && <div className="townhall-calendar-overlay" role="presentation">
        <section className="townhall-calendar-panel" role="dialog" aria-modal="true" aria-labelledby="townhall-calendar-title">
          <header><div><span>镇公所公告栏 · 第 {game.year} 年</span><h2 id="townhall-calendar-title">青禾谷全年节日与生日表</h2></div><button onClick={() => setTownhallCalendarOpen(false)} aria-label="收起全年节日公告">×</button></header>
          <p>点击任意节日就能临时体验那一天；体验时右上角有 ×，退出后会回到原来的日期和位置。每位居民的生日也登记在对应季节。</p>
          <div className="year-festival-board">
            {SEASONS.map((seasonName, seasonIndex) => <section key={`festival-season-${seasonName}`} className={`festival-season-column season-column-${seasonIndex}`}>
              <header><i>{["芽", "阳", "叶", "雪"][seasonIndex]}</i><div><strong>{seasonName}</strong><small>第 {game.year} 年</small></div></header>
              <div>
                {FESTIVAL_SCHEDULE.filter((festival) => festival.season === seasonIndex).map((festival) => { const festivalPosition = festival.season * 28 + festival.day; const isTodayFestival = actualFestival?.id === festival.id; const isPastFestival = festivalPosition < calendarPosition; return <button key={`townhall-festival-${festival.id}`} className={`${isTodayFestival ? "today" : isPastFestival ? "past" : "upcoming"}`} onClick={() => previewFestivalFromCalendar(festival)}><span><b>{festival.day}</b><small>第{festival.day}天</small></span><div><strong>{festival.name}</strong><small>{festival.place}</small><p>{festival.description}</p></div><em>{isTodayFestival ? "今天举行 · 点击进入" : "点击体验"}</em></button>; })}
                <div className="resident-birthday-list"><strong>居民生日</strong>{RESIDENT_BIRTHDAYS.filter((birthday) => birthday.season === seasonIndex).sort((a, b) => a.day - b.day).map((birthday) => { const isToday = game.season === birthday.season && game.day === birthday.day; return <button key={`birthday-${birthday.name}`} className={isToday ? "birthday-today" : ""} onClick={() => setMessage(`${birthday.name}的生日是${seasonName}第 ${birthday.day} 天。${isToday ? birthday.name === "小禾" ? "今天大家会在农舍真正举办生日派对。" : "今天中心广场有真实生日会，可以聊天、送礼、唱歌和切蛋糕！" : "公告栏已经替你记好了；到了当天会出现真正的庆祝现场。"}`)}><i>{birthday.day}</i><span><b>{birthday.name}</b><small>{isToday ? "今天生日" : `${seasonName}第 ${birthday.day} 天`}</small></span></button>; })}</div>
              </div>
            </section>)}
          </div>
          <footer><span>{message}</span><div>{actualFestival && <button className="go-current-festival" onClick={() => { setTownhallCalendarOpen(false); goToFestival(actualFestival); }}>前往今天的{actualFestival.name}</button>}<button onClick={() => setTownhallCalendarOpen(false)}>收起公告栏</button></div></footer>
        </section>
      </div>}

      {mallOpen && <div className="mall-overlay" role="dialog" aria-modal="true" aria-label="青禾大商场"><section className="mall-panel three-floor-mall"><header><div><span>远方新区购物中心 · {mallFloor} 楼</span><h2>青禾大商场</h2></div><div className="mall-wallet">● {game.coins.toLocaleString()}</div><button onClick={() => setMallOpen(false)} aria-label="离开商场">×</button></header><div className="mall-building-interior"><aside className="mall-elevator" aria-label="商场电梯"><strong>电梯</strong>{([1, 2, 3] as const).map((floor) => <button key={floor} className={mallFloor === floor ? "active" : ""} onClick={() => { setMallFloor(floor); setMessage(`电梯到达 ${floor} 楼，门打开了。`); playTone(540 + floor * 60); }}>{floor}F</button>)}<i /><small>点击楼层</small></aside><div className={`mall-floor mall-floor-${mallFloor}`}><div className="mall-floor-sign"><b>{mallFloor}F</b><span>{mallFloor === 1 ? "美食与生鲜" : mallFloor === 2 ? "服装与旅行用品" : "家居、园艺与户外"}</span></div><div className="mall-aisles">{mallFloor === 1 ? <><article><h3>麦香烘焙店</h3><button onClick={() => buyMallItem("奶油蛋糕", 80, 30)}><i className="mall-cake" /><span><b>奶油蛋糕</b><small>80 金币 · 体力 +30</small></span></button><button onClick={() => buyMallItem("热牛角包", 38, 12)}><i className="mall-cake bread" /><span><b>热牛角包</b><small>38 金币 · 体力 +12</small></span></button></article><article><h3>田园生鲜店</h3><button onClick={() => buyMallItem("水果便当", 55, 20)}><i className="mall-lunch" /><span><b>水果便当</b><small>55 金币 · 体力 +20</small></span></button><button onClick={() => buyMallItem("暖汤套餐", 68, 25)}><i className="mall-lunch soup" /><span><b>暖汤套餐</b><small>68 金币 · 体力 +25</small></span></button></article><article><h3>山谷咖啡角</h3><button onClick={() => buyMallItem("热拿铁", 35, 10)}><i className="mall-coffee" /><span><b>热拿铁</b><small>35 金币 · 体力 +10</small></span></button></article></> : mallFloor === 2 ? <><article><h3>四季衣橱</h3><button onClick={() => buyMallItem("红色节日外套", 260, 0, "redCoat")}><i className="mall-coat red-coat" /><span><b>红色节日外套</b><small>260 金币 · 可穿着</small></span></button><button onClick={() => buyMallItem("蓝色旅行套装", 320, 0, "blueOutfit")}><i className="mall-coat blue-coat" /><span><b>蓝色旅行套装</b><small>320 金币 · 可穿着</small></span></button></article><article><h3>雨天旅行铺</h3><button onClick={() => buyMallItem("彩色雨伞", 120, 0, "umbrella")}><i className="mall-umbrella" /><span><b>彩色雨伞</b><small>120 金币 · 撑伞不会淋病</small></span></button><button disabled={game.mallItems.animalRaincoat >= 4} onClick={buyAnimalRaincoat}><i className="mall-animal-raincoat" /><span><b>黄色动物雨衣</b><small>{game.mallItems.animalRaincoat >= 4 ? "四件已经买齐" : "45 金币 · 最多四件"}</small></span></button></article><article><h3>配饰小店</h3><button onClick={() => buyMallItem("柔软围巾", 75, 8)}><i className="mall-scarf" /><span><b>柔软围巾</b><small>75 金币 · 休息体力 +8</small></span></button></article></> : <><article><h3>阳台园艺店</h3><button onClick={() => buyMallItem("家庭种子礼盒", 180, 0, "seedBox")}><i className="mall-seed-box" /><span><b>家庭种子礼盒</b><small>180 金币 · 可打开</small></span></button></article><article><h3>温暖家居店</h3><button onClick={() => buyMallItem("柔软靠垫", 90, 15)}><i className="mall-cushion" /><span><b>柔软靠垫</b><small>90 金币 · 体力 +15</small></span></button></article><article><h3>山野户外店</h3><button onClick={() => buyMallItem("登山补给包", 70, 25)}><i className="mall-hiking" /><span><b>登山补给包</b><small>70 金币 · 体力 +25</small></span></button></article></>}</div></div></div><footer><span>乘电梯可以到三层不同商店，衣服、雨伞和礼盒会进入背包。</span><button onClick={() => setMallOpen(false)}>走出商场</button></footer></section></div>}

      {petShopOpen && <div className="pet-shop-overlay" role="dialog" aria-modal="true" aria-label="青禾宠物店"><section className="pet-shop-panel"><header><div><span>远方新区宠物生活区</span><h2>青禾宠物之家</h2></div><div className="pet-wallet">● {game.coins.toLocaleString()}</div><button onClick={() => setPetShopOpen(false)} aria-label="离开宠物店">×</button></header><div className="pet-shop-scene"><aside className="pet-counter"><button style={personClothesStyle("小桃")} className="pet-clerk" onClick={() => setMessage("店员小桃：慢慢看吧，点击玻璃房里的宠物，就能了解它的性格和照料方法。 ")}><i /><b /></button><strong>店员小桃</strong><small>领养咨询 · 宠物接回</small><span className="counter-desk"><i /></span></aside><div className="pet-glass-room" aria-label="宠物们会在玻璃活动区跑动和嬉戏">{PET_CATALOG.map((pet, index) => <button key={pet.id} className={`shop-pet pet-${pet.id} pet-motion-${index + 1} ${selectedPet === pet.id ? "selected" : ""}`} onClick={() => { setSelectedPet(pet.id); setMessage(`正在查看${pet.name}的信息。`); }} aria-label={`查看${pet.name}信息`}><i /><b /><span>{pet.name}</span></button>)}<i className="glass-shine" /><span className="pet-toy toy-ball" /><span className="pet-toy toy-tunnel" /></div></div>{(() => { const pet = PET_CATALOG.find((entry) => entry.id === selectedPet)!; const ownedMale = game.pets.filter((owned) => owned.type === pet.id && owned.sex === "男生").length; const ownedFemale = game.pets.filter((owned) => owned.type === pet.id && owned.sex === "女生").length; return <div className="pet-information"><div className={`pet-profile-art pet-${pet.id}`}><i /><b /></div><div><span>宠物资料</span><h3>{pet.name}</h3><p><b>性格：</b>{pet.personality}</p><p><b>每天吃：</b>{pet.food}　<b>每天喝：</b>{pet.water}</p><small>家里已有：男生 {ownedMale} 只 · 女生 {ownedFemale} 只。同种一男一女生活满五年，会生一只宝宝。</small></div><div className="pet-adopt-controls"><span>选择性别</span><div><button className={selectedPetSex === "男生" ? "active" : ""} onClick={() => setSelectedPetSex("男生")}>男生</button><button className={selectedPetSex === "女生" ? "active" : ""} onClick={() => setSelectedPetSex("女生")}>女生</button></div><button onClick={buyPet}>领养 · ● {pet.price}</button></div></div>; })()}<section className="pet-return-section"><header><div><strong>让宠物店接回</strong><small>领养的宠物和后来出生的宝宝都按同样价格接回</small></div></header>{game.pets.length ? <div className="pet-return-list">{game.pets.map((owned, index) => { const pet = PET_CATALOG.find((entry) => entry.id === owned.type)!; const isBaby = owned.id.includes("-baby-"); const isMissing = game.missingPetId === owned.id; return <article key={owned.id}><span className={`pet-return-art pet-${owned.type}`}><i /><b /></span><div><strong>{owned.sex}{pet.name}</strong><small>{isBaby ? "家里出生的宝宝" : `第 ${index + 1} 只宠物`} · {isMissing ? "现在在山洞里" : "可以接回"}</small></div><button disabled={isMissing} onClick={() => sellPetToShop(owned)}>接回 · ● {pet.price}</button></article>; })}</div> : <p className="no-pets-to-return">家里还没有可以让宠物店接回的宠物。</p>}</section><footer><span>{message}</span><button onClick={() => setPetShopOpen(false)}>离开宠物店</button></footer></section></div>}

      {carTraveling && <div className={`car-travel-overlay ${carStopped ? "car-stopped" : "car-moving"}`} role="dialog" aria-modal="true" aria-label="自己驾驶汽车"><div className="travel-sky"><i /><i /></div><div className={`travel-road route-step-${carRouteStep} turn-${carRouteTarget === "district" ? carRouteStep === 2 ? "right" : "left" : carRouteStep === 2 ? "left" : "right"}`}><div className="road-landscape"><i /><i /><i /><i /></div><span className={`travel-car car-heading-${carHeading}`}><i /><i /></span><div className="road-intersection" /><div className="road-branch" />{carRouteStep === 1 && <div className={`traffic-light traffic-${trafficLight}`} aria-label={`${trafficLight === "red" ? "红" : "绿"}灯`}><i /><b /><em /><span /></div>}<div className="road-stop-line" /></div><strong>{carStopped ? "车辆已经刹停" : "车辆正在自动前进"} · 路程 {Math.min(carRouteStep, 5)}/5</strong><small className="driving-dashboard">观察红绿灯和道路真实弯向，不再显示“下一步动作”。</small><div className="car-driving-controls"><button onClick={() => driveCar("left")}>↶<span>左转</span></button><button className="brake-control" onClick={() => driveCar("brake")}>■<span>刹车</span></button><button className="forward-control" onClick={() => driveCar("forward")}>↑<span>前进</span></button><button onClick={() => driveCar("right")}>↷<span>右转</span></button><button className="uturn-control" onClick={() => driveCar("uturn")}>↩<span>掉头返回</span></button></div></div>}

      {festivalProcessAtVenue && currentFestival && !festivalProcess && <button className="festival-process-entry" onClick={() => startFestivalProcess(currentFestival.id)}><i>★</i><span><strong>进入{FESTIVAL_PROCESS_STEPS[currentFestival.id]?.title}</strong><small>亲手完成全部活动步骤</small></span></button>}


      {bulkChestPrompt && (
        <div className="bulk-chest-prompt" role="dialog" aria-modal="true" aria-label={`是否把所有${RESOURCE_INFO[bulkChestPrompt].name}放进收纳箱`}>
          <span>已经连续放入 5 个</span>
          <strong>是否把所有{RESOURCE_INFO[bulkChestPrompt].name}都放到收纳箱里面去？</strong>
          <small>背包里还剩 {game.inventory[bulkChestPrompt]} 个{RESOURCE_INFO[bulkChestPrompt].name}</small>
          <div><button onClick={storeAllPromptedResource}>把所有{RESOURCE_INFO[bulkChestPrompt].name}放入</button><button onClick={() => { setBulkChestPrompt(null); setChestDepositStreak(null); setMessage(`暂时保留剩下的${RESOURCE_INFO[bulkChestPrompt].name}。`); }}>暂时不要</button></div>
        </div>
      )}

      {bulkShippingPrompt && (() => {
        const item = SHIPPING_CATALOG.find((entry) => entry.id === bulkShippingPrompt);
        if (!item) return null;
        return (
          <div className="bulk-chest-prompt bulk-shipping-prompt" role="dialog" aria-modal="true" aria-label={`是否把所有${item.name}放进大号售卖箱`}>
            <span>已经连续放入 5 个</span>
            <strong>是否把所有{item.name}都放到大号售卖箱里面去？</strong>
            <small>背包里还剩 {shippingItemCount(game, item)} 个{item.name}</small>
            <div><button onClick={putAllPromptedItemsInShippingBin}>把所有{item.name}放入</button><button onClick={() => { setBulkShippingPrompt(null); setShippingDepositStreak(null); setMessage(`暂时保留剩下的${item.name}。`); }}>暂时不要</button></div>
          </div>
        );
      })()}

      <section className="game-layout">
        <aside className="side-panel">
          <div className="portrait-card">
            <div className="portrait"><img src={game.sick ? "/xiaohe-sick-sprite.png" : "/xiaohe-sprite.png"} alt="小禾" draggable={false} /></div>
            <div><span>{game.playerAge} 岁 · 新手农夫</span><strong>{displayName}</strong></div>
          </div>
          <button className="age-growth-card" onClick={() => { setAgeBookOpen(true); setAgeTraining(null); setMessage(`打开成长手册：小禾现在 ${game.playerAge} 岁，已经学会 ${game.ageSkillsLearned.length} 项年龄本领。`); }}><i>{game.playerAge}</i><span><small>年龄与新本领</small><strong>{game.playerAge} 岁成长手册</strong><em>{game.ageSkillsLearned.length ? `已学会 ${game.ageSkillsLearned.length} 项` : AGE_SKILLS.some((skill) => skill.age <= game.playerAge) ? "有可以开始的实际训练" : `长到 ${AGE_SKILLS[0].age} 岁解锁第一项本领`}</em></span><b>›</b></button>
          {multiplayerSession && <div className="multiplayer-status-card"><div><span>双人村庄</span><button onClick={() => setMultiplayerOpen(true)}>查看</button></div><strong>{activeVillageInfo.name} · {multiplayerSession.roomCode}</strong><small>{partner ? `${partner.online ? "● 在线" : "○ 离线"} ${partner.playerName}住在${VILLAGE_INFO[partner.village].name}` : "等待另一位玩家加入"}</small></div>}
          {game.ageSkillsLearned.includes("clone") && <button className={`clone-work-card ${cloneMission ? "clone-busy" : ""}`} onClick={() => { setCloneWorkOpen(true); setMessage(cloneMission ? `分身正在${cloneMission.destination}${cloneMission.label}。` : "打开七岁分身工作台，安排另一个小禾去做一件真实工作。 "); }}><i>双</i><span><small>七岁永久本领</small><strong>分身穿墙瞬移</strong><em>{cloneMission ? `正在${cloneMission.label}` : "点击安排农活、采集或帮居民"}</em></span><b>›</b></button>}
          {game.ageSkillsLearned.includes("trail") && <button className="clone-work-card age-world-ability-card trail-ability-card" onClick={() => setMessage("灵巧采集永久生效：双击捡起地上的种子、药材和食物时，每次都会获得双份。 ")}><i>双</i><span><small>两岁永久本领 · 自动生效</small><strong>灵巧采集</strong><em>地上拾取物永久双份</em></span><b>✓</b></button>}
          {game.ageSkillsLearned.includes("shelter") && <button className="clone-work-card age-world-ability-card shelter-ability-card" onClick={() => setMessage("省力农具永久生效：锄地、播种、浇水、收获、砍树和挖矿，每次少消耗 1 点体力。 ")}><i>省</i><span><small>三岁永久本领 · 自动生效</small><strong>省力农具</strong><em>所有农具少耗 1 点体力</em></span><b>✓</b></button>}
          {game.ageSkillsLearned.includes("hybrid") && <button className="clone-work-card age-world-ability-card hybrid-ability-card" onClick={() => setMessage("丰收巧手永久生效：每次收获多 1 份作物，同时多返还 1 颗同类种子。 ")}><i>丰</i><span><small>四岁永久本领 · 自动生效</small><strong>丰收巧手</strong><em>作物与返还种子都多 1 份</em></span><b>✓</b></button>}
          {game.ageSkillsLearned.includes("echo") && <button className="clone-work-card age-world-ability-card echo-ability-card" onClick={startWorldEchoSurvey}><i>晶</i><span><small>五岁永久本领 · 山洞实地使用</small><strong>听石寻晶</strong><em>{game.lastAgeAbilityDays.echo === `${game.year}-${game.season}-${game.day}` ? "今天已定位隐藏矿脉" : farmInterior === "cave" ? "听准三层回声定位矿脉" : "进入山洞点火后使用"}</em></span><b>›</b></button>}
          {game.ageSkillsLearned.includes("teleport") && <button className="clone-work-card age-world-ability-card teleport-ability-card" onClick={() => { setMapOpen(true); setMessage("打开本人瞬移地图，点击一个地点就会让小禾本人直接到达。 "); }}><i>移</i><span><small>八岁永久本领 · 主游戏</small><strong>本人地图瞬移</strong><em>选择目的地 · 本人立即到达</em></span><b>›</b></button>}
          {isBirthday && <button className="birthday-card" onClick={() => { setDismissedBirthdayPartyKey(null); setScene("farm"); setActiveBuilding("farmhouse"); setIndoorPlayer({ x: 34, y: 70 }); setMessage(`今天是${displayName}的生日！大家已经来到农舍，点击生日蛋糕可以一起分享。`); }}><span>二月十九日 · 今日活动</span><strong>{displayName}的生日派对</strong><small>{showBirthdayParty ? "大家都在农舍 · 点击回家庆祝" : "生日会已收起 · 点击重新打开"}</small></button>}
          <button className={`festival-card ${currentFestival ? "festival-open" : ""}`} onClick={() => { if (currentFestival) goToFestival(); else setMessage(`下一场是${nextFestival.name}，${SEASONS[nextFestival.season]}第 ${nextFestival.day} 天${WEEKDAYS[(nextFestival.day - 1) % 7]}在${nextFestival.place}举行，还有 ${daysUntilFestival} 天。`); }}><span>{currentFestival ? "今日活动" : "下一场活动"}</span><strong>{(currentFestival ?? nextFestival).name}</strong><small>{currentFestival ? `正在${currentFestival.place}举行 · 点击前往` : `${SEASONS[nextFestival.season]}第 ${nextFestival.day} 天${WEEKDAYS[(nextFestival.day - 1) % 7]} · 还有 ${daysUntilFestival} 天`}</small></button>
          <div className="meter-block">
            <div className="meter-label"><span>体力</span><b>{game.energy}/100</b></div>
            <div className="meter"><i style={{ width: `${game.energy}%` }} /></div>
          </div>
          {game.sick && <button className={`health-treatment-card ${game.diagnosed ? "diagnosed" : "needs-check"}`} onClick={openHealthTreatment}>
            <i>＋</i><div><span>{game.diagnosed && game.illness ? ILLNESSES[game.illness].name : "身体不舒服"}</span><strong>{!game.diagnosed ? "去诊所免费检查" : game.illness && game.learnedTreatments.includes(game.illness) ? ILLNESSES[game.illness].method === "clinicOnly" ? "去诊所使用处方药" : ILLNESSES[game.illness].method === "baths" ? "前往卫生间热浴" : "开始六段自我治疗" : "尚未学会这种治疗"}</strong><small>{game.diagnosed && game.illness ? game.learnedTreatments.includes(game.illness) ? "点击进入真正的治疗操作" : "需要在医疗节学习对应病种" : "必须先知道病种，不能乱用药"}</small></div><b>›</b>
          </button>}
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
              {(Object.keys(RESOURCE_INFO) as StorableResource[]).map((resource) => <button key={resource} className={heldItem?.kind === "resource" && heldItem.id === resource ? "resource-item held-material" : selectedResource === resource ? "resource-item selected" : "resource-item"} onClick={() => clickResource(resource)} onDoubleClick={() => pickUpResource(resource)} onPointerDown={() => startEating(resource)} onPointerUp={stopEating} onPointerCancel={stopEating} onPointerLeave={stopEating} onContextMenu={(event) => event.preventDefault()} aria-pressed={selectedResource === resource} aria-label={`${RESOURCE_INFO[resource].name} ${game.inventory[resource]} 个，双击拿起送人，长按食用`} title="双击拿起送人，长按吃掉"><span className={`harvest-icon ${resource}-icon`}>{resource === "fish" ? "鱼" : CROP_INFO[resource].short}</span><p>{resource === "fish" ? "鱼获" : CROP_INFO[resource].name}<strong>{game.inventory[resource]}</strong><small>双击拿起</small>{isCropResource(resource) && (game.cropQualityStock[resource].gold > 0 || game.cropQualityStock[resource].silver > 0) && <em className="crop-quality-badges">{game.cropQualityStock[resource].gold > 0 && <b>★{game.cropQualityStock[resource].gold}</b>}{game.cropQualityStock[resource].silver > 0 && <i>★{game.cropQualityStock[resource].silver}</i>}</em>}</p></button>)}
              <button className={heldItem?.kind === "material" && heldItem.id === "wood" ? "resource-item held-material" : "resource-item"} onDoubleClick={() => pickUpMaterial("wood")} title="双击拿起木头"><span className="harvest-icon wood-icon">木</span><p>木头<strong>{game.wood}</strong><small>双击拿起</small></p></button>
              <button className={heldItem?.kind === "material" && heldItem.id === "stone" ? "resource-item held-material" : "resource-item"} onDoubleClick={() => pickUpMaterial("stone")} title="双击拿起石材"><span className="harvest-icon stone-icon">石</span><p>石材<strong>{game.stone}</strong><small>双击拿起</small></p></button>
              <button className="resource-item diamond-record" onClick={() => setMessage(`山洞里挖到的钻石共有 ${game.diamonds} 颗。钻石矿每天会慢慢重新长出一处；放进大号售卖箱，每颗可以卖 2800 金币。`)}><span className="harvest-icon diamond-icon">◆</span><p>钻石<strong>{game.diamonds}</strong><small>高价稀有物 · 可售卖</small></p></button>
              <button className="resource-item fishing-oddity-item" onClick={() => setMessage(`钓鱼时意外捞到的饮料共有 ${game.drinks} 瓶，瓶子还没有打开。`)}><span className="harvest-icon drink-icon" /><p>漂流饮料<strong>{game.drinks}</strong><small>钓鱼意外收获</small></p></button>
              <button className="resource-item fishing-oddity-item" onClick={() => setMessage(`鱼钩一共带回 ${game.oldSocks} 只旧袜子。这是奇怪收藏，也能放进大号售卖箱，每只卖 18 金币。`)}><span className="harvest-icon sock-icon" /><p>旧袜子<strong>{game.oldSocks}</strong><small>奇怪收藏 · 可售卖</small></p></button>
              <button className="resource-item puddle-oddity-item" onClick={() => setMessage(`穿雨衣的小宠物从水坑里找到了 ${game.puddleHoes} 把旧锄头。这是收藏品，可以放进大号售卖箱，不会替代你的基础锄头。`)}><span className="harvest-icon puddle-hoe-icon" /><p>水坑旧锄头<strong>{game.puddleHoes}</strong><small>小宠物雨天发现</small></p></button>
              <button className={heldItem?.kind === "forest" && heldItem.id === "pineNut" ? "resource-item held-material" : "resource-item"} onClick={clickPineNut} onDoubleClick={doubleClickPineNut} title="单击吃掉恢复体力，双击拿起"><span className="harvest-icon pine-nut-icon">子</span><p>松子<strong>{game.pineNuts}</strong><small>单击吃 · 双击拿</small></p></button>
              <button className={heldItem?.kind === "herb" ? "resource-item herb-record held-material" : "resource-item herb-record"} onClick={clickHerb} onDoubleClick={pickUpHerb} aria-label={`药材 ${game.herbs} 份，生病时单击使用，双击拿起送人`} title="生病时单击使用，双击拿起送人"><span className="harvest-icon herb-icon">药</span><p>药材<strong>{game.herbs}</strong><small>{game.sick ? "单击用 · 双击拿" : "双击拿起"}</small></p></button>
              <button className={heldItem?.kind === "resin" ? "resource-item resin-record held-material" : "resource-item resin-record"} onDoubleClick={pickUpResin} title="双击拿起绿色树脂"><span className="harvest-icon resin-icon" /><p>树脂<strong>{game.resin}</strong><small>双击拿起 · 做火柴</small></p></button>
              <button className={heldItem?.kind === "product" && heldItem.id === "egg" ? "resource-item animal-product-item held-material" : "resource-item animal-product-item"} onClick={() => clickAnimalProduct("egg")} onDoubleClick={() => doubleClickAnimalProduct("egg")} title="单击食用，双击拿起鸡蛋"><span className="harvest-icon egg-icon" /><p>鸡蛋<strong>{game.eggs}</strong><small>单击吃 · 双击拿起</small></p></button>
              <button className={heldItem?.kind === "product" && heldItem.id === "milk" ? "resource-item animal-product-item held-material" : "resource-item animal-product-item"} onClick={() => clickAnimalProduct("milk")} onDoubleClick={() => doubleClickAnimalProduct("milk")} title="单击食用，双击拿起牛奶"><span className="harvest-icon milk-icon" /><p>牛奶<strong>{game.milk}</strong><small>单击喝 · 双击拿起</small></p></button>
              <button className={heldItem?.kind === "product" && heldItem.id === "wool" ? "resource-item animal-product-item held-material" : "resource-item animal-product-item"} onClick={clickWool} onDoubleClick={doubleClickWool} title="单击打开制作手册，双击拿起羊毛"><span className="harvest-icon wool-icon" /><p>羊毛<strong>{game.wool}</strong><small>单击打开制作 · 双击拿起</small></p></button>
              <button className={heldItem?.kind === "petGift" && heldItem.id === "feather" ? "resource-item animal-product-item held-material" : "resource-item animal-product-item"} onClick={() => setMessage(`小鸡和小鸭留下的羽毛共有 ${game.feathers} 根，双击可以拿起。`)} onDoubleClick={() => pickUpPetGift("feather")}><span className="harvest-icon feather-icon" /><p>羽毛<strong>{game.feathers}</strong><small>宠物每日可能赠送</small></p></button>
              <button className={heldItem?.kind === "petGift" && heldItem.id === "softFur" ? "resource-item animal-product-item held-material" : "resource-item animal-product-item"} onClick={() => setMessage(`兔子梳下的柔软绒毛共有 ${game.softFur} 团，双击可以拿起。`)} onDoubleClick={() => pickUpPetGift("softFur")}><span className="harvest-icon soft-fur-icon" /><p>兔子软毛<strong>{game.softFur}</strong><small>宠物每日可能赠送</small></p></button>
              <button className="resource-item animal-product-item" onClick={() => setMessage(`宠物粮还剩 ${game.petFood} 份。每只跟随宠物睡前自动吃 1 份，可以去远方新区大商场购买。`)}><span className="harvest-icon pet-food-icon" /><p>宠物粮<strong>{game.petFood}</strong><small>每晚自动喂食</small></p></button>
              <button className={heldItem?.kind === "petGift" && heldItem.id === "bone" ? "resource-item animal-product-item held-material" : "resource-item animal-product-item"} onClick={feedBoneToDog} onDoubleClick={() => pickUpPetGift("bone")} title="单击喂给柴犬，双击拿起送人"><span className="harvest-icon pet-bone-icon" /><p>小骨头<strong>{game.petBones}</strong><small>单击喂柴犬 · 双击拿</small></p></button>
              <button className="resource-item anan-cookie-item" onClick={eatAnanCookie} title="点击食用，恢复 18 点体力"><span className="harvest-icon cookie-icon" /><p>安安的饼干<strong>{game.cookies}</strong><small>单击食用</small></p></button>
              <button className="resource-item beach-food-item" onClick={eatCrab} title="点击食用，恢复 20 点体力"><span className="harvest-icon crab-icon" /><p>海边螃蟹<strong>{game.crabs}</strong><small>单击食用</small></p></button>
              <button className="resource-item beach-food-item" onClick={eatShrimp} title="点击食用，恢复 12 点体力"><span className="harvest-icon shrimp-icon" /><p>海边小虾<strong>{game.shrimp}</strong><small>单击食用</small></p></button>
              <button className="resource-item cooked-food-item" onClick={() => eatCookedSeafood("cookedCrabs")} title="点击食用；在二楼餐桌吃恢复更多"><span className="harvest-icon cooked-crab-icon" /><p>熟螃蟹<strong>{game.cookedCrabs}</strong><small>餐桌食用加成</small></p></button>
              <button className="resource-item cooked-food-item" onClick={() => eatCookedSeafood("cookedShrimp")} title="点击食用；在二楼餐桌吃恢复更多"><span className="harvest-icon cooked-shrimp-icon" /><p>熟小虾<strong>{game.cookedShrimp}</strong><small>餐桌食用加成</small></p></button>
              {game.bookBag.map((bookId) => <button key={`bag-book-${bookId}`} className={heldItem?.kind === "book" && heldItem.id === bookId ? "resource-item held-material" : "resource-item"} onClick={() => setMessage(`${LOST_BOOKS[bookId].title}：${LOST_BOOKS[bookId].content}`)} onDoubleClick={() => carryLostBook(bookId)} title="点击阅读，双击拿起来送给叶老师"><span className="harvest-icon book-icon">书</span><p>{LOST_BOOKS[bookId].title}<strong>1</strong><small>双击拿起</small></p></button>)}
              {game.artifactBag.map((artifactId) => <button key={`bag-artifact-${artifactId}`} className={heldItem?.kind === "artifact" && heldItem.id === artifactId ? "resource-item held-material" : "resource-item"} onClick={() => setMessage(`${RARE_ARTIFACTS[artifactId].title}：${RARE_ARTIFACTS[artifactId].description}`)} onDoubleClick={() => carryArtifact(artifactId)} title="点击查看，双击拿起来送到博物馆"><span className={`harvest-icon artifact-icon artifact-icon-${artifactId + 1}`}>{RARE_ARTIFACTS[artifactId].short}</span><p>{RARE_ARTIFACTS[artifactId].title}<strong>1</strong><small>双击拿起</small></p></button>)}
            </div>
            {Object.values(game.mallItems).some((count) => count > 0) && <div className="mall-item-backpack"><div><strong>衣服与雨伞</strong><small>雨伞放在这里 · 点击即可撑开或收起</small></div><section>{game.mallItems.umbrella > 0 && <button className={`umbrella-bag-button ${game.umbrellaOpen ? "wearing" : ""}`} onClick={toggleUmbrella}><i className="bag-umbrella" /><span>彩色雨伞<b>{game.mallItems.umbrella}</b><small>{game.umbrellaOpen ? "正在撑着 · 点击收起" : "点击撑开雨伞"}</small></span></button>}{game.mallItems.redCoat > 0 && <button className={game.equippedOutfit === "redCoat" ? "wearing" : ""} onClick={() => wearMallOutfit("redCoat")}><i className="bag-coat red" /><span>红色外套<b>{game.mallItems.redCoat}</b><small>{game.equippedOutfit === "redCoat" ? "正在穿 · 点击脱下" : "点击穿着"}</small></span></button>}{game.mallItems.blueOutfit > 0 && <button className={game.equippedOutfit === "blueOutfit" ? "wearing" : ""} onClick={() => wearMallOutfit("blueOutfit")}><i className="bag-coat blue" /><span>蓝色旅行装<b>{game.mallItems.blueOutfit}</b><small>{game.equippedOutfit === "blueOutfit" ? "正在穿 · 点击脱下" : "点击穿着"}</small></span></button>}{game.mallItems.seedBox > 0 && <button onClick={openMallSeedBox}><i className="bag-seed-box" /><span>种子礼盒<b>{game.mallItems.seedBox}</b><small>点击打开</small></span></button>}{game.mallItems.animalRaincoat > 0 && <button className={raincoatDressing ? "animal-raincoat-bag-button wearing" : "animal-raincoat-bag-button"} onClick={() => { setRaincoatDressing((current) => !current); setMessage(raincoatDressing ? "收起了宠物雨衣。" : "选中了黄色宠物雨衣。现在点击跟在小禾脚边的小宠物，就能给它穿上或脱下；鸡、牛、羊不需要雨衣。"); }}><i className="bag-animal-raincoat" /><span>宠物雨衣<b>{game.mallItems.animalRaincoat}</b><small>小宠物已穿 {game.animalRaincoatAssignments.length} · 点击选择</small></span></button>}</section></div>}
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
          <div className={`world ${scene === "farm" ? "farm-world" : scene === "westFriendFarm" ? "friend-farm-world" : scene === "mysteryRoad" ? "mystery-road-world" : scene === "town" ? "town-world" : scene === "cultureDistrict" ? "culture-world" : scene === "residentialDistrict" ? "residential-world" : "neighbor-world"} ${activeVillage}-village season-${displaySeason} weather-world-${game.weather} ${twilightLevel > 0 ? "twilight-world" : ""} ${activeBuilding || neighborInterior || residentHome || friendHomeOpen || mallOpen ? "interior-open" : ""} ${playingWithAnan ? "playing-with-anan" : ""}`} style={{ "--twilight": twilightLevel } as CSSProperties} onClick={walkToPointer}>
            <div className="location-chip"><span>{scene === "farm" ? "⌂" : scene === "westFriendFarm" ? "♣" : scene === "mysteryRoad" ? "▤" : scene === "cultureDistrict" ? "▣" : scene === "residentialDistrict" ? "屋" : "◆"}</span>{sceneLabel}</div>
            {residentSpeech && <div className={`resident-speech-card ${speakingPerson === residentSpeech.person ? "resident-is-speaking" : ""}`} role="status" aria-live="polite" onClick={(event) => event.stopPropagation()}>
              <span className="resident-speech-portrait" style={personClothesStyle(residentSpeech.person)} aria-hidden="true"><i /><b /></span>
              <p><strong>{residentSpeech.person}</strong><span>{residentSpeech.text}</span>{relationshipPeople.includes(residentSpeech.person) && <span className="resident-speech-actions">{speakingWishProgress && !speakingWishProgress.completed && <button className={speakingWishCanSubmit ? "resident-speech-submit-wish ready" : "resident-speech-submit-wish"} onClick={() => finishResidentWish(residentSpeech.person)}>交付愿望材料{speakingWishCanSubmit ? " ✓" : ""}</button>}<button className="resident-work-request" onClick={() => setWorkMenuPerson(residentSpeech.person)}>请帮我干活</button><button className="resident-speech-wish" onClick={() => { if (!game.residentWishes[residentSpeech.person]) startResidentWish(residentSpeech.person); setJournalTab("friends"); setJournalOpen(true); setResidentSpeech(null); setWorkMenuPerson(null); }}>{game.residentWishes[residentSpeech.person]?.completed ? "心愿已经一起实现 ✓" : game.residentWishes[residentSpeech.person] ? "打开日记查看详细进度" : `听听${residentSpeech.person}的心愿`}</button></span>}</p>
              <button onClick={() => { setResidentSpeech(null); setWorkMenuPerson(null); }} aria-label="收起居民对话">×</button>
            </div>}
            {workMenuPerson && residentSpeech?.person === workMenuPerson && <section className="resident-work-menu" onClick={(event) => event.stopPropagation()} aria-label={`请${workMenuPerson}帮忙`}><header><div><small>当面拜托居民</small><strong>请{workMenuPerson}帮我做什么？</strong></div><button onClick={() => setWorkMenuPerson(null)} aria-label="关闭帮忙菜单">×</button></header><div>{RESIDENT_WORK_OPTIONS.map((option) => <button key={option.job} onClick={() => requestResidentWork(workMenuPerson, option.job)}><i>{option.icon}</i><span>{option.label}<small>{option.place} · 成果直接生效</small></span></button>)}</div><footer>每位居民每天可以接受一项工作，第二天还能再次拜托。</footer></section>}
            {dreamScene !== null && dreamPhase === "outside" && <div className={`dream-reality-anomalies anomaly-${dreamOddity}`} aria-hidden="true"><i className="dream-wrong-ripple" /><i className="dream-rising-leaves" /><i className="dream-second-moon" /><i className="dream-strange-watcher" /><i className="dream-backward-birds" /><i className="dream-long-shadow" /><i className="dream-floating-light" /><i className="dream-pale-animal" /><i className="dream-cookie-rain" /><i className="dream-dancing-crops" /><i className="dream-bubble-fish" /><i className="dream-tiny-footprints" /><i className="dream-pond-stars" /><i className="dream-winking-window" /><i className="dream-walking-scarecrow" /><i className="dream-grass-train" /><i className="dream-floating-sheep" /><i className="dream-rainbow-rain" /><i className="dream-twin-moons" /></div>}
            <div className="cloud cloud-one" /><div className="cloud cloud-two" />
            <div className="mountain mountain-one" /><div className="mountain mountain-two" />
            {(game.weather === "rain" || game.weather === "thunder") && <div className="rain-weather-layer" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>}
            {game.weather === "thunder" && <div className="lightning-weather-layer" aria-hidden="true"><i /></div>}
            {twilightLevel > 0 && <div className="night-sky" aria-hidden="true"><span className="moon" /><i /><i /><i /><i /><i /><i /></div>}
            {twilightLevel > 0 && <div className="twilight-layer" aria-hidden="true" />}
            {scene !== "farm" && <div className={`outdoor-lamps outdoor-lamps-${scene}`} aria-hidden="true"><i /><i /><i /><i /></div>}
            {!activeBuilding && !neighborInterior && !residentHome && !friendHomeOpen && !(scene === "town" && todayResidentBirthday) && roamingResidents.length > 0 && <div className={`roaming-residents roaming-${scene}`} aria-label="按照当天作息来到这里的居民">{roamingResidents.map(({ name, schedule }, index) => { const companion = residentPetProfile(name); return <button key={`roaming-${name}`} className={`roaming-resident npc-activity-${schedule.key}`} style={{ ...personClothesStyle(name), "--roam-x": `${22 + (index % 6) * 11}%`, "--roam-y": `${42 + (index % 3) * 14}%` } as CSSProperties} onClick={(event) => { event.stopPropagation(); meetScheduledResident(name, schedule); }}><i /><b /><u className={`resident-companion-pet pet-${companion.id} resident-pet-variant-${companion.variant}`} title={`${name}的宠物${companion.nickname}`}><i /><b /></u><span>{name}<small>{schedule.label}</small><small className="resident-pet-name">宠物：{companion.nickname}</small>{schedule.invite && (game.friendship[name] ?? 0) >= 20 && <em>可能邀请小禾一起去玩</em>}</span></button>; })}</div>}
            {scene === "town" && !activeBuilding && todayResidentBirthday && <div className="resident-birthday-party" aria-label={`${todayResidentBirthday.name}正在中心广场举办生日会`} onClick={(event) => event.stopPropagation()}><div className="resident-party-bunting" aria-hidden="true"><i /><i /><i /><i /><i /></div><button className="resident-party-person" style={personClothesStyle(todayResidentBirthday.name)} onClick={() => interactWithPerson(todayResidentBirthday.name, `${todayResidentBirthday.name}：谢谢大家真的来陪我过生日！可以一起切蛋糕，也可以把举着的礼物送给我。`)}><i />{todayResidentBirthday.name === "安安" && <em className="anan-pigtails" />}<b /><span>寿星 · {todayResidentBirthday.name}</span></button><button className="resident-party-cake" onClick={() => beginResidentBirthdayCeremony(todayResidentBirthday.name)} aria-label={`和大家分享${todayResidentBirthday.name}的生日蛋糕`}><i /><b /><em /><span>开始生日仪式</span></button><div className="resident-party-guests">{BIRTHDAY_GUESTS.filter((name) => name !== todayResidentBirthday.name).slice(0, 5).map((name, index) => <button key={`resident-party-${name}`} className={`resident-party-guest party-guest-${index + 1}`} style={personClothesStyle(name)} onClick={() => interactWithPerson(name, `${name}：我们专门来到中心广场，等${todayResidentBirthday.name}吹完蜡烛就一起分蛋糕！`)}><i />{name === "安安" && <em className="anan-pigtails" />}<b /><span>{name}</span></button>)}</div><strong>{SEASONS[game.season]}第 {game.day} 天 · {todayResidentBirthday.name}生日会</strong><small>这不是公告文字：现场可以聊天、送礼、唱歌和分享蛋糕</small></div>}
            {!activeBuilding && !neighborInterior && !residentHome && !friendHomeOpen && residentQuestsHere.length > 0 && <div className={`resident-quest-scene quest-scene-${scene}`} aria-label="当前地点的居民委托">{residentQuestsHere.map((quest, index) => <button key={`scene-quest-${quest.id}`} className={`resident-quest-object quest-${quest.id}`} style={{ "--quest-index": index } as CSSProperties} onClick={(event) => { event.stopPropagation(); completeResidentQuest(quest); }}><span className="quest-alert">!</span><i>{quest.icon}</i><div><small>{quest.giver}发布的任务</small><strong>{quest.title}</strong><p>{quest.action}</p><em>完成奖励：{quest.reward} 金币 · 好感 +5</em></div><b>动手完成</b></button>)}</div>}
            {selectedCraftItem && scene === "farm" && <div className="placement-controls" onClick={(event) => event.stopPropagation()}><strong>正在摆放：{CRAFT_RECIPES[selectedCraftItem].name}</strong>{(selectedCraftItem === "sign" || selectedCraftItem === "bench") && <div><button className={craftRotation === 0 ? "selected" : ""} onClick={() => setCraftRotation(0)}>横着</button><button className={craftRotation === 90 ? "selected" : ""} onClick={() => setCraftRotation(90)}>竖着</button><button className={craftRotation === 45 ? "selected" : ""} onClick={() => setCraftRotation(45)}>斜着</button></div>}<span>{selectedCraftItem === "fence" ? "点击农田四周的绿色位置，围栏会自动对齐" : "选好方向后，点击农场空地"}</span><button className="cancel-placement" onClick={() => setSelectedCraftItem(null)}>取消</button></div>}

            {scene === "farm" ? (
              <div className="farm-camera-layer" style={{ "--farm-camera-x": `${(6 - farmCameraX) * 2.7}%`, "--farm-camera-y": `${(4 - player.y) * 1.8}%` } as CSSProperties}>
                <div className="farm-southwest-extension" aria-hidden="true"><i /><i /><i /><b /></div>
                <div className="outdoor-lamps outdoor-lamps-farm farm-fixed-lamps" aria-hidden="true"><i /><i /><i /><i /></div>
                <div className="path path-one" /><div className="path path-two" />
                <button className={`pond ${isFishing ? "fishing" : ""} ${currentFestival?.id === "fishing" ? "fishing-festival-pond" : ""}`} onClick={castLine} aria-label="在钓鱼池钓鱼">
                  <i /><i /><i /><b className="fishing-float" />{currentFestival?.id === "fishing" && <span className="festival-hooks-in-water" aria-label="六位参赛者的鱼钩都落在池塘水里">{FESTIVAL_GUESTS.map((name, index) => <em key={`hook-${name}`} className={`pond-hook pond-hook-${index + 1}`} />)}</span>}{fishingPhase === "bite" && <strong className="bite-question">?</strong>}<span className="pond-label">{fishingPhase === "waiting" ? "等待鱼儿咬钩…" : fishingPhase === "bite" ? "快点！点击问号" : currentFestival?.id === "fishing" ? "钓鱼节会场 · 所有鱼钩都在水中" : "钓鱼池"}</span>
                </button>
                {fishingPhase === "reeling" && <div className="fishing-challenge" onClick={(event) => event.stopPropagation()}><header><span>提竿小游戏</span><b>{fishingScore}/3</b></header><p>等红色游标进入绿色区域时，点击提竿！</p><div className="fishing-timing-bar"><i className={game.toolUpgrades.rod ? "lucky-zone" : ""} /><b ref={fishingMarkerElementRef} style={{ left: "4%" }} /></div><button onClick={attemptReel}>提竿！</button><small>{game.toolUpgrades.rod ? "幸运鱼竿：咬钩更快，成功区域更宽" : "连续命中 3 次才能把鱼钓上来"}</small></div>}
                {currentFestival?.id === "fishing" && <div className="festival-crowd fishing-festival-crowd" aria-label="参加钓鱼节并不断挥竿钓鱼的居民">{FESTIVAL_GUESTS.map((name, index) => <button key={name} style={personClothesStyle(name)} className={`crowd-person crowd-${index + 1} fishing-villager fishing-villager-${index + 1} ${name === "安安" ? "anan-character" : ""} ${isNpcSick(name) ? "sick-npc" : ""}`} onClick={() => interactWithPerson(name, `${name}：提竿时要咬紧牙用力拉！有时也会钓到石头、袜子或饮料。`)}><i />{name === "安安" && <em className="anan-pigtails" />}<b /><em className="festival-fishing-rod" /><u className="fishing-effort-mouth" /><u className="festival-caught-fish" /><u className="festival-surprise-catch" /><span>{name}<small>等待鱼儿咬钩</small></span></button>)}</div>}
                {isBirthday && <div className="birthday-farm-friends" aria-label="在生日当天跑到菜地和农场玩耍的朋友">{BIRTHDAY_GUESTS.slice(0, 6).map((name, index) => <button key={`farm-party-${name}`} style={personClothesStyle(name)} className={`birthday-field-friend field-friend-${index + 1} ${name === "安安" ? "anan-character" : ""}`} onClick={() => interactWithPerson(name, `${name}：我们从农舍跑到菜地边玩啦，一会儿再回去吃生日蛋糕！`)}><i />{name === "安安" && <em className="anan-pigtails" />}<b /><span>{name}</span></button>)}</div>}
                {game.farmHelperToday && <button className="farm-helper-friend" style={personClothesStyle(game.farmHelperToday)} onClick={(event) => { event.stopPropagation(); interactWithPerson(game.farmHelperToday!, `${game.farmHelperToday}：我今天真的干过活啦！有作物时我会浇水施肥，有空地和种子时我会播种；如果田里没活，我就整理农具并留下种子。`, true); }} aria-label={`和今天来农场帮忙的${game.farmHelperToday}说话`}><i /><b /><span>{game.farmHelperToday}<small>今天的帮助已经生效</small></span></button>}
                {currentResidentWorkers.length > 0 && <div className="resident-work-team" aria-label="今天被拜托来农场工作的居民">{currentResidentWorkers.map((order, index) => <button key={`${order.person}-${order.job}`} className={`resident-work-person work-${order.job}`} style={{ ...personClothesStyle(order.person), "--worker-index": index } as CSSProperties} onClick={(event) => { event.stopPropagation(); interactWithPerson(order.person, `${order.person}：${order.result}，已经直接加到你的田地或资源记录里啦。`, true); }}><i /><b /><em>{RESIDENT_WORK_OPTIONS.find((option) => option.job === order.job)?.icon}</em><span>{order.person}<small>{order.result}</small></span></button>)}</div>}
                <button className={`house ${game.upgrades.house ? "expanded-house" : ""} house-level-${game.upgrades.house} ${game.upgrades.secondFloor ? "has-second-floor" : ""} ${isNight ? "night-house" : ""} ${isNight && stoveLit ? "fire-lit-house" : ""}`} onClick={() => { setHouseFloor(1); setUpstairsRoom(null); setActiveBuilding("farmhouse"); setMessage(`走进${displayName}的农舍，屋里暖洋洋的。`); }} aria-label={`进入${displayName}的农舍`}><span className="roof" /><span className={`chimney ${stoveLit ? "smoking" : ""}`}>{stoveLit && <><i /><i /><i /></>}</span><span className="wall" /><span className="door" /><span className="window" />{game.upgrades.secondFloor > 0 && <><span className="upper-window upper-window-left" /><span className="upper-window upper-window-right" /></>}<span className="sign">{displayName}的农舍{game.upgrades.secondFloor ? " · 两层" : game.upgrades.house ? ` · 扩建 ${game.upgrades.house} 级` : ""} · 点击进入</span></button>
                <button className={`crafted-object crafted-chest home-storage-chest ${selectedResource ? "ready-to-store" : ""}`} onClick={() => { if (selected === "axe") { setMessage("这是农舍旁边固定的收纳木箱，不会被斧头拆掉。 "); return; } useChest(); }} aria-label={`农舍旁的木箱，内有 ${Object.values(game.chestStorage).reduce((sum, count) => sum + count, 0)} 件物品`}><i /><b>{Object.values(game.chestStorage).reduce((sum, count) => sum + count, 0)}</b></button>
                <button className="home-shipping-bin" onClick={() => { setShippingBinOpen(true); setMessage("打开大号售卖箱。单击物品放进去，睡到第二天就会卖掉换成金币。 "); }} aria-label={`农舍旁的大号售卖箱，已有 ${Object.values(game.shippingBin).reduce((sum, count) => sum + count, 0)} 件待售物品`}><i /><i /><b>{Object.values(game.shippingBin).reduce((sum, count) => sum + count, 0)}</b><span>大号售卖箱</span></button>
                {game.rockStates.map((standing, index) => <button key={`rock-${index}`} className={`farm-rock rock-${index + 1} ${standing ? "" : "broken"}`} onClick={() => breakRock(index)} aria-label={standing ? `敲碎第 ${index + 1} 块石头` : `第 ${index + 1} 处碎石`} />)}
                {game.treeStates.map((standing, index) => (
                  <button key={index} className={`tree tree-${["a", "b", "c", "d"][index]} ${standing ? "" : "stump"}`} onClick={() => chopTree(index)} aria-label={standing ? `砍伐第 ${index + 1} 棵树` : `第 ${index + 1} 个树桩`} />
                ))}
                {game.plantedTrees.map((tree) => <button key={tree.id} className={`planted-pine-tree pine-stage-${tree.stage} ${tree.watered ? "watered" : ""}`} style={{ left: `${tree.x}%`, top: `${tree.y}%` }} onClick={() => chopPlantedTree(tree)} aria-label={tree.stage >= 3 ? "松果种出的成熟松树" : `正在生长的松树苗，第 ${tree.stage + 1} 阶段，${tree.watered ? "今天已经浇水" : "今天还没浇水"}`}><i /><i /><b /><span>{tree.stage >= 3 ? "大树" : tree.watered ? "已浇水" : "需要浇水"}</span></button>)}
                <div className="flowers flowers-a">✿ · ✿</div><div className="flowers flowers-b">· ✿ ·</div>
                {selectedCraftItem === "fence" && FENCE_PLACEMENT_SLOTS.map((slot) => { const occupied = game.placedCrafts.some((craft) => craft.type === "fence" && Math.abs(craft.x - slot.x) < 1 && Math.abs(craft.y - slot.y) < 1); return <button key={slot.id} className={`fence-placement-slot ${slot.rotation === 90 ? "slot-vertical" : "slot-horizontal"} ${occupied ? "occupied" : ""}`} style={{ left: `${slot.x}%`, top: `${slot.y}%` }} onClick={(event) => { event.stopPropagation(); placeFenceInSlot(slot); }} disabled={occupied} aria-label={occupied ? "这里已经放有围栏" : "点击在绿色位置放置木围栏"}><i /><span>{occupied ? "已放" : "+"}</span></button>; })}
                {game.placedCrafts.map((craft) => <button key={craft.id} className={`placed-craft placed-${craft.type} ${selected === "axe" ? "dismantle-ready" : ""} ${craft.type === "fence" && craft.rotation === 90 ? "fence-vertical" : ""} ${craft.type === "gate" && farmGateOpen ? "gate-open" : ""} ${craft.type === "lamp" && isNight ? "placed-lamp-lit" : ""}`} style={{ left: `${craft.x}%`, top: `${craft.y}%`, transform: `translate(-50%,-50%) rotate(${craft.rotation}deg)` }} onClick={(event) => { event.stopPropagation(); usePlacedCraft(craft); }} aria-label={`${CRAFT_RECIPES[craft.type].name}，${craft.type === "gate" ? (farmGateOpen ? "现在打开，点击关门" : "现在关闭，点击开门") : selected === "axe" ? "点击拆除" : "点击使用或查看"}`}><i /><i /><i /><b>{craft.type === "chest" ? Object.values(game.chestStorage).reduce((sum, count) => sum + count, 0) : ""}</b></button>)}
                {game.farmVisitor === "crow" && <div className="farm-visitor crow-visitor" aria-label="乌鸦飞进农田"><i /><i /><span>嘎！</span></div>}
                {game.farmVisitor === "animal" && <div className="farm-visitor animal-visitor" aria-label="小动物跑进农田"><i /><b /><span>偷吃幼苗</span></div>}
                {game.upgrades.stoneWall > 0 && <div className="farm-stone-wall" aria-label="鲁师傅修建的农场石墙"><i /><i /><i /><i /></div>}

                <button className={`farm-cave ${isNight ? "night-active" : ""}`} onClick={() => { setFarmInterior("cave"); setInteriorFireLit(false); setMessage("走进青禾山洞，里面很暗，可以使用火柴照明。 "); }} aria-label="进入青禾山洞"><i /><b /><em /><span>青禾山洞<small>点击进入探险</small></span></button>
                <button className={`farm-camp ${isNight ? "night-active" : ""}`} onClick={() => { setFarmInterior("camp"); setInteriorFireLit(false); setMessage("掀开门帘进入溪边帐篷，可以使用火柴点亮露营灯。 "); }} aria-label="进入溪边帐篷"><i /><i /><b /><em /><span>溪边露营地 · 点击进入</span></button>
                <button className="animal-ranch" onClick={() => { setRanchOpen(true); setMessage("来到青禾动物牧场，这里可以买鸡和奶牛，也能委托修建动物围栏。 "); }} aria-label="进入青禾动物牧场"><i className="ranch-roof" /><i className="ranch-wall" /><i className="ranch-door" /><b>青禾动物牧场</b><small>鸡 · 奶牛 · 围栏</small></button>
                {game.animalPen && <div className={`animal-pen ${game.weather === "rain" || game.weather === "thunder" ? "rainy-animal-pen" : ""}`} aria-label={`动物围栏，${game.chickens}只鸡，${game.cows}头奶牛，${game.sheep}只绵羊`}>
                  <span className="pen-rail rail-top" /><span className="pen-rail rail-bottom" /><span className="pen-post post-one" /><span className="pen-post post-two" /><span className="pen-post post-three" /><span className="pen-post post-four" />
                  {farmAnimalEntries.map((animal) => <button key={animal.id} className={`farm-animal ${animal.type} ${animal.type}-${animal.index + 1}`} onClick={() => handleFarmAnimalClick(animal.type)} aria-label={`${animal.name}，${raincoatDressing ? "农场动物不会淋雨生病，不需要雨衣" : animal.type === "chicken" ? "点击收鸡蛋" : animal.type === "cow" ? "点击挤牛奶" : "点击收羊毛"}`}><i /><b /><em /></button>)}
                  <strong>{game.chickens || game.cows || game.sheep ? `鸡 ${game.chickens} · 牛 ${game.cows} · 羊 ${game.sheep}` : "动物围栏已建好"}</strong>
                  <small>{raincoatDressing ? "鸡、牛、羊不会淋雨生病 · 雨衣只给脚边小宠物" : "每天可收鸡蛋、牛奶和羊毛 · 农场动物不会淋雨生病"}</small>
                </div>}

                <div className={`field ${game.tiles.length > 32 ? "expanded-field" : ""}`} aria-label={`${game.tiles.length} 格农田`}>
                  {game.tiles.map((tile, index) => (
                    <button
                      key={index}
                      className={`farm-tile ${tile.state} ${tile.cropType ?? "radish"} ${tile.watered ? "watered" : ""} ${tile.hybrid ? "hybrid-crop" : ""}`}
                      onClick={(event) => actOnTile(index, event)}
                      aria-label={`农田 ${index + 1}，${tile.state === "grass" ? "未开垦" : tile.state === "soil" ? "已松土" : `${tile.hybrid ? "四季育种" : ""}作物第 ${tile.stage} 阶段`}`}
                    >
                      {tile.state === "crop" && <span className={`crop-stage stage-${tile.stage}`}><i /><i /><b /></span>}
                    </button>
                  ))}
                </div>

                <button className="edge-gate farm-exit" onClick={() => { setScene("town"); setPlayer({ x: 0, y: 5 }); setMessage(`欢迎来到${activeVillageInfo.name}！超市在左上方。`); }} aria-label={`前往${activeVillageInfo.name}`}>
                  <span>{activeVillageInfo.name}</span><b>→</b><small>继续向右走</small>
                </button>
                {activeVillage === "qinghe" && <button className="edge-gate wild-farm-crossing" onClick={walkToAnanFarmEdge}><b>←</b><span>安安的小农场</span><small>沿箭头走到最左边缘</small></button>}
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
                <button className={`forest-story-tree forest-story-stage-${game.forestQuestStage}`} onClick={(event) => { event.stopPropagation(); progressForestStoryWithAnan(); }}><i /><b /><span>{game.forestQuestStage === 5 ? forestStoryDaysLeft > 0 ? `${forestStoryDaysLeft} 天后有新动静` : "安安发现了新的线索" : forestStoryTitle}<small>{game.forestQuestStage === 5 ? "连续故事会按时间继续更新" : "点击观察现场，不会提前告诉全部答案"}</small></span></button>
                <div className={`seasonal-road ${game.year === 1 && game.season === 0 ? "road-season-0" : "road-finished"}`} aria-label={game.year === 1 && game.season === 0 ? "最开始的道路修建区" : "已经永久通车的新公路"}><i className="road-surface" /><span>{game.year === 1 && game.season === 0 ? "最初修建中 · 完工后永久通车" : "远方新区公路 · 已永久通车"}</span>{game.year === 1 && game.season === 0 && <div className="road-workers"><b /><b /><b /><em /><em /></div>}</div>
                <button className="driving-school-building" onClick={(event) => { event.stopPropagation(); setDrivingSchoolOpen(true); setDrivingQuizStep(game.driverLicense ? DRIVING_QUESTIONS.length : 0); setDrivingPracticeStep(game.driverLicense ? 3 : 0); setMessage(game.driverLicense ? "来到青禾驾校复习安全驾驶。 " : "进入青禾驾校，先参加汽车常识考试。 "); }}><i /><b>青禾驾驶学校</b><small>{game.driverLicense ? "已取得驾照 · 可以复习" : "理论考试 · 驾驶练习"}</small></button>
                <button className={`road-car ${game.ownsCar ? "owned-car" : ""} ${game.year === 1 && game.season === 0 ? "road-closed" : ""}`} onClick={(event) => { event.stopPropagation(); buyOrDriveCar(); }}><i /><i /><b>{game.year === 1 && game.season === 0 ? "查看最初修建进度" : !game.driverLicense ? "先考驾照" : game.ownsCar ? "驾驶汽车去远方" : "购买汽车 · 3000金币"}</b></button>
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
                <button className="pet-contest-entry" onClick={(event) => { event.stopPropagation(); const availablePet = game.pets.find((pet) => !isNurseryPet(pet) && pet.id !== game.missingPetId); setSelectedContestPet(availablePet?.id ?? null); setSelectedContestRival("安安"); setPetContest(null); setPetContestOpen(true); setMessage(availablePet ? "来到宠物友谊赛场。先选自己的宠物和一位居民的宠物，再亲手完成三轮比赛。" : "来到宠物友谊赛场。每位居民都有自己的宠物；小禾需要先领养一只长大的宠物才能报名。 "); }} aria-label="进入宠物友谊赛场"><i /><b /><strong>宠物友谊赛场</strong><small>抢彩带 · 推软球 · 软垫对抗</small></button>
                {currentFestival?.id === "spring" && <><div className="saturday-market" aria-label="周六春日集市"><strong>春日集市</strong><button onClick={tasteFestivalJam}>草莓果酱<small>恢复 25 体力</small></button><button onClick={() => { setFestivalDisplay("wood"); setMessage("鲁师傅把精雕细刻的木工作品摆到了展示台上。 "); }}>木工作品<small>点击看展品</small></button><button className={festivalMusicPlaying ? "music-playing" : ""} onClick={playValleyMusic}>山谷音乐<small>{festivalMusicPlaying ? "正在演奏♪" : "点击播放"}</small></button></div><div className="festival-crowd" aria-label="参加春日集市的居民">{FESTIVAL_GUESTS.map((name, index) => <button key={name} style={personClothesStyle(name)} className={`crowd-person crowd-${index + 1} ${isNpcSick(name) ? "sick-npc" : ""}`} onClick={() => interactWithPerson(name, `${name}：春日集市真热闹，大家都来到中心广场啦！`)}><i /><b /><span>{name}</span></button>)}</div></>}
                {currentFestival && TRADITIONAL_FESTIVALS[currentFestival.id] && <><div className={`traditional-festival festival-${currentFestival.id}`}><i>{TRADITIONAL_FESTIVALS[currentFestival.id]?.symbol}</i><strong>{currentFestival.name}</strong><span>{currentFestival.description}</span><button onClick={claimTraditionalTreat}>免费领取{TRADITIONAL_FESTIVALS[currentFestival.id]?.treat}<small>恢复 20 体力</small></button></div><div className="festival-crowd traditional-festival-crowd" aria-label={`参加${currentFestival.name}的居民`}>{[...FESTIVAL_GUESTS, "安安"].map((name, index) => <button key={`traditional-${name}`} style={personClothesStyle(name)} className={`crowd-person crowd-${(index % 6) + 1} traditional-guest-${index + 1} ${name === "安安" ? "anan-character" : ""}`} onClick={() => interactWithPerson(name, `${name}：${currentFestival.name}真热闹，大家都在广场上走走看看！`)}><i />{name === "安安" && <em className="anan-pigtails" />}<b /><span>{name}</span></button>)}</div></>}
                {currentFestival?.id === "lantern" && <div className="lantern-fair-ground" aria-label="摆在广场地面上的元宵花灯和灯谜摊">{LANTERN_RIDDLES.map((riddle, index) => <button key={`lantern-${index}`} className={`physical-lantern lantern-shape-${index + 1}`} onClick={() => { setLanternRiddle(index); setMessage(`走到第 ${index + 1} 盏花灯前，灯笼下面挂着一张灯谜。`); }}><i /><b /><span>点击猜灯谜</span></button>)}</div>}
                {currentFestival?.id === "dragonBoat" && <div className="dragon-boat-ground dragon-boat-departure" aria-label="端午节龙舟比赛集合处"><div className="festival-river"><i /><i /></div><div className="dragon-bus-stop"><i /><strong>龙舟比赛专线大巴</strong><small>村民集合后一起去真正的比赛河道</small></div><button className="dragon-trip-button" onClick={startDragonBoatTrip}>集合并乘大巴去比赛</button></div>}
                {currentFestival?.id === "midAutumn" && <div className="mid-autumn-ground" aria-label="中秋赏月台和河灯池"><i className="moon-view-platform" /><button onClick={() => { setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 10) })); setMessage("小禾坐在赏月台上看圆月，安静休息了一会儿，恢复 10 点体力。 "); playTone(760); }}><i /><span>坐下赏月</span></button><button onClick={() => { setMessage("小禾把一盏河灯轻轻放到水面，河灯沿着岸边慢慢漂远。 "); playTone(700); }}><i /><span>在水面放河灯</span></button></div>}
                {currentFestival?.id === "springFestival" && <div className="spring-festival-ground" aria-label="春节舞狮场和大鼓"><div className="physical-lion"><i /><b /><em /></div><button onClick={() => { setMessage("小禾跟着节拍敲响地面上的大鼓，舞狮队绕着广场热闹地走了一圈！"); playTone(380); }}><i /><b /><span>敲鼓看舞狮</span></button></div>}
                <div className="street-lamp lamp-one" /><div className="street-lamp lamp-two" /><div className="street-lamp lamp-three" />
                {game.urgentEvent && game.urgentEvent !== "assembly" && !game.urgentEventResolved && <button className={`urgent-town-incident incident-${game.urgentEvent}`} onClick={(event) => { event.stopPropagation(); resolveUrgentEvent(); }} aria-label={game.urgentEvent === "fire" ? "木匠工坊旁着火，点击提水灭火" : game.urgentEvent === "theft" ? "被偷的种子货箱，点击捡回并交还" : "摔倒受伤的居民，点击扶起送诊所"}><i /><b /><em /><u /><span><strong>{game.urgentEvent === "fire" ? "现场着火！" : game.urgentEvent === "theft" ? "被偷的货箱" : "居民受伤"}</strong><small>{game.urgentEvent === "fire" ? "点击提水灭火" : game.urgentEvent === "theft" ? "点击捡回交还" : "点击扶起送诊所"}</small></span></button>}

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
                  {RESIDENT_HOMES.map((home, index) => { const activity = residentActivity(home.owner, game.hour, game.day, game.weather); const youngFriend = (YOUNG_FRIENDS as readonly string[]).includes(home.owner); return <article className={`resident-plot resident-plot-${index + 1} ${youngFriend ? "young-friend-plot" : ""}`} key={home.owner}><span className="plot-fence" /><i className="plot-tree" /><button className="resident-house" onClick={() => { setResidentHome(home.owner); setIndoorPlayer({ x: 33, y: 70 }); setMessage(`走进${home.home}，${home.owner}住在这里。`); }} aria-label={`进入${home.home}`}><span className="resident-roof" /><span className="resident-wall" /><span className="resident-door" /><span className="resident-window" /><strong>{home.home}<small>{youngFriend ? "朋友的家 · 点击进入" : "点击进入"}</small></strong></button>{activity.scene === "residentialDistrict" ? <button style={personClothesStyle(home.owner)} className={`residential-resident npc-activity-${activity.key} ${isNpcSick(home.owner) ? "sick-npc" : ""} ${home.owner === "诊所助手" ? "red-uniform-resident" : ""}`} onClick={() => interactWithPerson(home.owner, `${home.owner}：${home.greeting}`)} aria-label={heldItem ? `把${carriedItemName}送给${home.owner}` : `和${home.owner}交谈`}><i /><b /><span>{home.owner}<small>{activity.label}</small></span></button> : <button className="resident-away-note" onClick={() => setMessage(`${home.owner}现在${activity.label}，可以在山谷里找到本人。`)}><b>{home.owner}外出了</b><small>{activity.label}</small></button>}</article>; })}
                </div>
                <button className="edge-gate residential-return" onClick={() => { setScene("cultureDistrict"); setPlayer({ x: 11, y: 5 }); setMessage("从住宅坡回到清河文化街。 "); }}><b>←</b><span>返回文化街</span><small>沿着小路向左</small></button>
              </>
            ) : (
              <>
                <div className="neighbor-path" />
                <button className={`neighbor-house ${scene}`} onClick={() => { setNeighborInterior(scene as NeighborScene); setIndoorPlayer({ x: 31, y: 70 }); setMessage(`进入${scene === "eastNeighbor" ? "林婶的果园小屋" : scene === "southNeighbor" ? "鲁师傅的山脚院子" : "叶老师的林间书屋"}。`); }}><span className="neighbor-roof" /><span className="neighbor-wall" /><span className="neighbor-door" /><span className="neighbor-window" /><strong>{scene === "eastNeighbor" ? "林婶的果园小屋" : scene === "southNeighbor" ? "鲁师傅的山脚院子" : "叶老师的林间书屋"}<small>点击进入</small></strong></button>
                {(() => { const neighborName = scene === "eastNeighbor" ? "林婶" : scene === "southNeighbor" ? "鲁师傅" : "叶老师"; const schedule = residentActivity(neighborName, game.hour, game.day, game.weather); return schedule.scene === scene ? <button style={personClothesStyle(neighborName)} className={`npc-villager npc-${scene} ${isNpcSick(neighborName) ? "sick-npc" : ""}`} onClick={() => schedule.invite ? meetScheduledResident(neighborName, schedule) : talkToNeighbor(scene as NeighborScene)} aria-label="和居民人机说话或送礼"><i className="npc-hair" /><i className="npc-head" /><i className="npc-body" /><span>{neighborName}<small>{heldItem ? `点击送出${carriedItemName}` : schedule.label}</small></span></button> : <button className="neighbor-away-schedule" onClick={() => setMessage(`${neighborName}现在${schedule.label}，可以按照日记里的居民作息去${schedule.scene === "town" ? "中心街" : schedule.scene === "cultureDistrict" ? "文化街" : schedule.scene === "farm" ? "青禾农场" : "她现在所在的地方"}找她。`)}><b>{neighborName}出门了</b><small>{schedule.label}</small></button>; })()}
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

            {!ananBeachOpen && !ananBeachTraveling && <div className={`player facing-${facing} ${isWalking ? "walking" : ""} ${scene === "farm" ? "farm-centered-player" : ""} ${farmEdgeTraveling ? "farm-edge-traveling-player" : ""}`} style={{ left: scene === "farm" ? `${farmPlayerScreenLeft}%` : `${4 + player.x * 7.7}%`, top: scene === "farm" ? "55%" : `${8 + player.y * 10.5}%` }} aria-label={`玩家角色，面朝${facing === "left" ? "左" : facing === "right" ? "右" : facing === "up" ? "上" : "前"}`}>
              {renderCarriedItem()}{renderWearables()}{renderPetFollowers()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} />
              {game.sick && game.diagnosed && game.illness && <button className={`self-treatment-button method-${ILLNESSES[game.illness].method}`} onClick={(event) => { event.stopPropagation(); beginSelfTreatment(); }}><i>＋</i><span>{game.learnedTreatments.includes(game.illness) ? "自己治疗" : "尚未学会"}<small>{ILLNESSES[game.illness].name}</small></span></button>}
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

            {lanternRiddle !== null && (
              <div className="shop-overlay lantern-riddle-overlay" role="presentation">
                <section className="lantern-riddle-panel" role="dialog" aria-modal="true" aria-labelledby="lantern-riddle-title">
                  <header><div><span>元宵灯会 · 第 {lanternRiddle + 1} 盏花灯</span><h2 id="lantern-riddle-title">猜灯谜</h2></div><button onClick={() => setLanternRiddle(null)} aria-label="暂时不猜">×</button></header>
                  <div className={`riddle-lantern-preview lantern-shape-${lanternRiddle + 1}`}><i /><b /></div>
                  <strong>{LANTERN_RIDDLES[lanternRiddle].question}</strong>
                  <div className="riddle-answer-grid">{LANTERN_RIDDLES[lanternRiddle].answers.map((answer, index) => <button key={answer} onClick={() => answerLanternRiddle(index)}>{answer}</button>)}</div>
                  <footer><span>{message}</span><button onClick={() => setLanternRiddle(null)}>回到灯会</button></footer>
                </section>
              </div>
            )}

            {careSession && (() => {
              const illness = ILLNESSES[careSession.illness];
              const casePatientIndex = ILLNESS_IDS.indexOf(careSession.illness) % 3;
              const symptomChoices = ["发热并且呼吸急促", "体温偏低并持续发冷", "体温正常但眼鼻受刺激"];
              const caseChoiceIndex = ILLNESS_IDS.indexOf(careSession.illness) % symptomChoices.length;
              const stepTitles = ["找出异常并完成三种检查", "从真假器具中准备护理盘", "亲手擦净六处操作区", "调准病种配比并绕圈混合", "连续完成五段床边护理", "读刻度、听诊并判断恢复结果"];
              return <div className="care-session-overlay" role="presentation">
                <section className={`care-session-panel care-${illness.method}`} role="dialog" aria-modal="true" aria-label={`${illness.name}${careSession.mode === "training" ? "实习" : "自我治疗"}`} onPointerUpCapture={handleCarePointerRelease} onPointerCancel={() => { setCareHeldItem(null); setMedicalThermometerPicked(false); }}>
                  <header><div><span>{careSession.mode === "training" ? "医疗节 · 病例实习" : "已确诊 · 复杂自我治疗"}</span><h2>{illness.name}</h2><small>第 {careSession.step + 1}/6 段 · 总治疗会消耗 35 点体力</small></div><button onClick={() => { stopCareTimedHold(false); endCareGesture(); setCareSession(null); }}>×</button></header>
                  <div className="care-case-file"><i>诊</i><div><strong>{stepTitles[careSession.step]}</strong><p>{careSession.step === 3 ? illness.advice : `${illness.cause}。当前这段必须把所有操作完成，不能直接跳到痊愈。`}</p></div></div>
                  {careSession.step === 0 ? <div className="medical-observation-room difficult-exam">
                    <div className="medical-step-guide"><span className={careSession.selected.includes("观察喘气") ? "done" : "active"}><i>1</i>在三个人中找出异常呼吸</span><span className={careSession.selected.includes("测量体温") ? "done" : careSession.selected.includes("观察喘气") ? "active" : ""}><i>2</i>按住温度计直到读数稳定</span><span className={careSession.selected.includes("记录呼吸频率") ? "done" : careSession.selected.includes("测量体温") ? "active" : ""}><i>3</i>根据表现选对症状卡</span></div>
                    <div className="breathing-patient-row">{["一号病人", "二号病人", "三号病人"].map((patient, index) => <div key={patient} className={`breathing-patient patient-${index + 1} case-pattern-${caseChoiceIndex} ${index === casePatientIndex ? "case-patient" : "decoy-patient"} ${careSession.selected.includes("观察喘气") && index === casePatientIndex ? "observed" : ""}`}><i className="patient-head"><b className="strained-mouth" /></i><i className="patient-chest" /><em className="breath-cloud breath-one" /><em className="breath-cloud breath-two" /><span>{patient}<small>{index === casePatientIndex ? "呼吸节奏和另外两人不同" : "呼吸较平稳"}</small></span>{!careSession.selected.includes("观察喘气") && <button type="button" className="care-chest-scan" onPointerDown={(event) => index === casePatientIndex ? beginCareGesture(event, "按住听诊器，在这个人的胸口来回移动，移动够一整段距离才会听清。 ") : setMessage("这个人的呼吸比较平稳。继续观察另外两个人，不要急着下结论。 ")} onPointerMove={(event) => { if (index === casePatientIndex) moveCareGesture(event, "观察喘气", 180); }} onPointerUp={endCareGesture} onPointerCancel={endCareGesture}>按住听诊器来回检查</button>}{careSession.selected.includes("观察喘气") && index === casePatientIndex && !careSession.selected.includes("测量体温") && <button type="button" className="care-temperature-hold" onPointerDown={() => beginCareTimedHold("测量体温", 1600, "把温度计稳稳放在脸旁测温")} onPointerUp={() => stopCareTimedHold(true)} onPointerLeave={() => stopCareTimedHold(true)} onPointerCancel={() => stopCareTimedHold(true)}><i style={{ height: `${careHoldProgress}%` }} />一直按住测温 {Math.round(careHoldProgress)}%</button>}</div>)}</div>
                    {careSession.selected.includes("测量体温") && <div className="care-symptom-choice"><strong>观察身体表现，选出与病人相符的记录</strong>{symptomChoices.map((choice, index) => <button key={choice} onClick={() => { if (index !== caseChoiceIndex) { setMessage("这张症状卡与刚才看到的呼吸和体温不一致，再仔细比较。 "); playTone(210); return; } performCareAction("记录呼吸频率"); }}>{choice}</button>)}</div>}
                    <div className="care-live-meter"><i style={{ width: `${careHoldProgress}%` }} /><span>{careSession.selected.length === 0 ? "听诊移动距离" : careSession.selected.length === 1 ? "温度计稳定时间" : "判断病例"}</span></div>
                    <small>这一步不是拖三件东西：先辨认真正异常的人，再完成听诊移动、持续测温和病例判断。</small>
                  </div> : renderDetailedCareStep()}
                  <div className="care-long-progress">{[0, 1, 2, 3, 4, 5].map((step) => <i key={step} className={step < careSession.step ? "done" : step === careSession.step ? "active" : ""}>{step < careSession.step ? "✓" : step + 1}</i>)}</div>
                  <footer><span>{message}</span><button onClick={() => { stopCareTimedHold(false); endCareGesture(); setCareSession(null); }}>暂停并离开</button></footer>
                </section>
              </div>;
            })()}

            {schoolLesson && <div className={`school-lesson-overlay ${schoolLesson.assembly ? "assembly-lesson" : ""}`} role="presentation"><button className="lesson-floating-exit" onClick={() => { setSchoolLesson(null); setMessage("已经退出课堂，回到学校教室。下次可以重新开始这节课。 "); }}>× 退出课堂</button><section className="school-lesson-panel" role="dialog" aria-modal="true" aria-label={schoolLesson.title}><header><div><span>{schoolLesson.assembly ? "紧急新闻 · 全谷集合" : "青禾学校 · 真实课堂"}</span><h2>{schoolLesson.title}</h2><small>第 {schoolLesson.step + 1}/{schoolLesson.pages.length} 段 · 可以随时退出</small></div><div className="lesson-header-actions"><button className="lesson-header-next" onClick={advanceSchoolLesson}>{schoolLesson.step === schoolLesson.pages.length - 1 ? "听完并记录" : `继续第 ${schoolLesson.step + 2} 段`}</button><button className="lesson-header-close" onClick={() => { setSchoolLesson(null); setMessage("已经退出课堂，回到学校教室。下次可以重新开始这节课。 "); }} aria-label="退出课堂">×</button></div></header><div className="lesson-classroom"><div className="lesson-blackboard"><strong>{schoolLesson.title}</strong><p>{schoolLesson.pages[schoolLesson.step]}</p><i /></div><button className="lesson-teacher" style={personClothesStyle(schoolLesson.assembly ? (schoolLesson.step === 0 ? "周镇长" : schoolLesson.step === 1 ? "白医生" : "许老师") : "许老师")}><i /><b /><span>{schoolLesson.assembly ? schoolLesson.step === 0 ? "周镇长" : schoolLesson.step === 1 ? "白医生" : "许老师" : "许老师"}</span></button><div className="lesson-audience">{(schoolLesson.assembly ? [...SCHEDULED_RESIDENTS, ...SCHOOL_STUDENTS] : SCHOOL_STUDENTS).map((name, index) => <i key={`${name}-${index}`} style={personClothesStyle(name)}><b /><span>{name}</span></i>)}</div></div><div className="lesson-page-dots">{schoolLesson.pages.map((_, index) => <button key={index} className={index < schoolLesson.step ? "done" : index === schoolLesson.step ? "active" : ""} disabled={index > schoolLesson.step} onClick={() => setSchoolLesson({ ...schoolLesson, step: index })}>{index < schoolLesson.step ? "✓" : index + 1}</button>)}</div><footer><span>{message}</span><button onClick={advanceSchoolLesson}>{schoolLesson.step === schoolLesson.pages.length - 1 ? "听完并记录" : `认真听第 ${schoolLesson.step + 2} 段`}</button></footer></section></div>}

            {festivalProcess && FESTIVAL_PROCESS_STEPS[festivalProcess.id] && (() => {
              const process = FESTIVAL_PROCESS_STEPS[festivalProcess.id]!;
              const step = process.steps[festivalProcess.step];
              return <div className={`festival-process-overlay process-${festivalProcess.id}`} role="presentation"><section className="festival-process-panel" role="dialog" aria-modal="true" aria-label={process.title} onPointerUpCapture={handleFestivalPointerRelease} onPointerCancel={() => { festivalDragReadyRef.current = false; setFestivalDragging(false); }}><header><div><span>节日专属活动 · 第 {festivalProcess.step + 1}/{process.steps.length} 步</span><h2>{process.title}</h2></div><button onClick={() => setFestivalProcess(null)} aria-label="暂时离开活动">×</button></header><p>{process.intro}</p>{renderFestivalHandsOn(process, step)}<div className="festival-progress-track">{process.steps.map((item, index) => <span key={item.label} className={index < festivalProcess.step ? "done" : index === festivalProcess.step ? "active" : ""}><i>{index < festivalProcess.step ? "✓" : index + 1}</i><b>{item.label}</b></span>)}</div><footer><span>{message}</span><button onClick={() => setFestivalProcess(null)}>暂时离开</button></footer></section></div>;
            })()}

            {dragonBoatTraveling && <div className="dragon-boat-travel-overlay" role="status"><div className="festival-trip-bus"><i /><b /><span>青禾节日专线</span></div><div className="passing-scenery"><i /><i /><i /><i /></div><strong>老师、同学和村民正一起乘大巴去比赛河道…</strong></div>}

            {dragonBoatOpen && <div className="dragon-race-overlay" role="presentation"><section className="dragon-race-panel" role="dialog" aria-modal="true" aria-label="端午龙舟比赛"><header><div><span>端午龙舟节 · 实时比赛</span><h2>河道龙舟赛</h2></div><button onClick={() => setDragonBoatOpen(false)} aria-label="离开龙舟比赛">×</button></header><div className="dragon-race-river"><div className="race-lane lane-player"><span className="race-boat red-race-boat" style={{ left: `${4 + (dragonBoatScore / 14) * 79}%` }}><i /><b /><em /></span></div><div className="race-lane lane-opponent"><span className="race-boat blue-race-boat" style={{ left: `${4 + (dragonBoatOpponent / 14) * 79}%` }}><i /><b /><em /></span></div><i className="race-finish-line" /></div>{!dragonBoatRole ? <div className="dragon-role-choice"><strong>选择你在红队的位置</strong><p>划桨手要连续划桨；鼓手要快速敲鼓带动全船。</p><button onClick={() => setDragonBoatRole("paddler")}>成为划桨手</button><button onClick={() => setDragonBoatRole("drummer")}>成为鼓手</button></div> : <div className="dragon-race-controls"><strong>{dragonBoatWinner === "player" ? "红队获得冠军！" : dragonBoatWinner === "opponent" ? "蓝队先到终点" : dragonBoatRole === "paddler" ? "连续点击，让红队向前划！" : "连续敲鼓，让全队加快节奏！"}</strong>{!dragonBoatWinner && <button onClick={pushDragonBoat}>{dragonBoatRole === "paddler" ? "划桨！" : "咚！敲鼓"}</button>}{dragonBoatWinner && <button onClick={() => { setDragonBoatOpen(false); setDragonBoatRole(null); setMessage("比赛结束，大家坐大巴回到了中心广场。 "); }}>乘大巴返回广场</button>}<small>红队 {Math.floor(dragonBoatScore)}/14　·　蓝队 {dragonBoatOpponent}/14</small></div>}<footer><span>{message}</span><button onClick={() => setDragonBoatOpen(false)}>离开比赛河道</button></footer></section></div>}

            {friendHomeOpen && (
              <div className="shop-overlay neighbor-home-interior anan-home-interior" role="presentation">
                <section className="service-panel neighbor-home-panel anan-home-panel" role="dialog" aria-modal="true" aria-labelledby="anan-home-title">
                  {renderIndoorRoofRain()}
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
                  {renderIndoorRoofRain()}
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
                  {renderIndoorRoofRain()}
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
              <>
              <button className="builder-emergency-close" onClick={() => { setBuilderOpen(false); setMessage("收起鲁师傅的委托单，回到原来的游戏画面。 "); }} aria-label="退出鲁师傅的建造委托"><b>×</b><span>退出委托</span></button>
              <div className={`shop-overlay builder-overlay ${neighborInterior ? "nested-house-overlay" : ""}`} role="presentation"><section className="builder-panel" role="dialog" aria-modal="true" aria-labelledby="builder-title"><header><div><span>鲁师傅的扩建与家具委托</span><h2 id="builder-title">选择扩建项目或室内家具</h2></div><button onClick={() => setBuilderOpen(false)}>×</button></header><div className="builder-supplies"><span>已经交给鲁师傅</span><strong>{game.builderSupplies.wood} 木头 · {game.builderSupplies.stone} 石材</strong><small>回到资源栏双击木头或石材，再点击鲁师傅，可以继续交材料。</small></div><div className="builder-grid"><button onClick={() => commissionBuilder("land")} disabled={Boolean(game.upgrades.land)}><b>扩大地盘</b><span>{game.upgrades.land ? "已经完成" : "12 木 · 18 石"}</span></button><button onClick={() => commissionBuilder("house")} disabled={game.upgrades.house >= 3}><b>扩大农舍</b><span>{game.upgrades.house >= 3 ? "三级扩建已经完成" : `${20 + game.upgrades.house * 10} 木 · ${12 + game.upgrades.house * 8} 石 · 安装${["暖光灯", "自动水箱", "料理台"][game.upgrades.house]}`}</span></button><button onClick={() => commissionBuilder("field")} disabled={Boolean(game.upgrades.field)}><b>扩大土地</b><span>{game.upgrades.field ? "已经增加 8 格土地" : "10 木 · 10 石 · 增加 8 格"}</span></button><button onClick={() => commissionBuilder("storage")} disabled={Boolean(game.upgrades.storage)}><b>扩建售卖仓库</b><span>{game.upgrades.storage ? "售卖价已经提高 10%" : "18 木 · 12 石 · 售价 +10%"}</span></button><button onClick={() => commissionBuilder("greenhouse")} disabled={Boolean(game.upgrades.greenhouse)}><b>修建玻璃温室</b><span>{game.upgrades.greenhouse ? "每天会自动照料作物" : "28 木 · 22 石 · 作物自动生长"}</span></button><button onClick={() => commissionBuilder("pond")} disabled={Boolean(game.upgrades.pond)}><b>扩大钓鱼池</b><span>{game.upgrades.pond ? "每次钓鱼额外 +1" : "16 木 · 24 石 · 鱼获 +1"}</span></button><button onClick={() => commissionBuilder("stoneWall")} disabled={Boolean(game.upgrades.stoneWall)}><b>修建农场石墙</b><span>{game.upgrades.stoneWall ? "小动物无法进入" : "8 木 · 32 石 · 永久防动物"}</span></button><button className="builder-major-project" onClick={() => commissionBuilder("secondFloor")} disabled={Boolean(game.upgrades.secondFloor)}><b>修建农舍二楼</b><span>{game.upgrades.secondFloor ? "二楼主体已经完成" : "80 木 · 60 石 · 大块空旷空间"}</span></button><button onClick={() => commissionBuilder("upstairsKitchen")} disabled={Boolean(game.upgrades.upstairsKitchen)}><b>单独扩建二楼厨房</b><span>{game.upgrades.upstairsKitchen ? "厨房已经完成" : game.upgrades.secondFloor ? "45 木 · 30 石 · 烹饪生食" : "需要先建二楼 · 45 木 · 30 石"}</span></button><button onClick={() => commissionBuilder("upstairsBathroom")} disabled={Boolean(game.upgrades.upstairsBathroom)}><b>单独扩建二楼卫生间</b><span>{game.upgrades.upstairsBathroom ? "卫生间已经完成" : game.upgrades.secondFloor ? "35 木 · 45 石 · 洗去淋雨疲劳" : "需要先建二楼 · 35 木 · 45 石"}</span></button><div className="builder-furniture-heading"><strong>鲁师傅的室内家具</strong><small>这里只做适合放在家里的家具；户外灯柱、长椅和方向牌已经移出本区</small></div>{INDOOR_FURNITURE.map((furniture) => <button key={`builder-furniture-${furniture}`} className="builder-furniture-project" onClick={() => commissionFurniture(furniture)}><b>{CRAFT_RECIPES[furniture].name}</b><span>{CRAFT_RECIPES[furniture].wood} 木 · {CRAFT_RECIPES[furniture].stone} 石 · {CRAFT_RECIPES[furniture].description}</span></button>)}</div><footer><span>{message}</span><button onClick={() => setBuilderOpen(false)}>收起委托单</button></footer></section></div>
              </>
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
                  <header><div><span>{farmInterior === "cave" ? "青禾农场西侧" : "户外随身营地"}</span><h2 id="farm-special-title">{farmInterior === "cave" ? "青禾山洞内部" : "双顶帐篷内部"}</h2></div><button onClick={() => { setFarmInterior(null); setInteriorFireLit(false); }} aria-label="离开这里">×</button></header>
                  <div className="farm-special-scene" onClick={walkInsidePointer}>
                    {farmInterior === "cave" ? <><i className="cave-rock cave-rock-one" /><i className="cave-rock cave-rock-two" />{game.caveDiamondSpots.map((spotIndex, index) => { const diamond = CAVE_DIAMOND_SPOTS[spotIndex]; const echoRevealed = diamond.hidden && game.ageSkillsLearned.includes("echo") && game.caveDiamondStates[index]; return <button key={`cave-diamond-${index}-${spotIndex}`} className={`cave-diamond-mine cave-diamond-${index + 1} ${diamond.hidden ? "diamond-partly-hidden" : ""} ${echoRevealed ? "echo-revealed-diamond" : ""} ${game.caveDiamondStates[index] ? "" : "mined"}`} style={{ left: `${diamond.x}%`, top: `${diamond.y}%` }} onClick={(event) => { event.stopPropagation(); mineCaveDiamond(index); }} aria-label={game.caveDiamondStates[index] ? `${diamond.hidden ? "岩石后露出尖角的" : "地面上的"}钻石矿，使用镐子挖掘` : `第 ${index + 1} 处钻石矿已经挖完`}><i /><b>{game.caveDiamondStates[index] ? echoRevealed ? "回声定位 · 晶尖" : diamond.hidden ? "露出的晶尖" : "钻石矿" : "碎矿"}</b></button>; })}<span className="cave-path" /><b className="cave-fire" />{currentCaveWorkers.map((order, index) => <button key={`cave-worker-${order.person}`} className={`resident-cave-worker cave-worker-${index + 1}`} style={personClothesStyle(order.person)} onClick={(event) => { event.stopPropagation(); interactWithPerson(order.person, `${order.person}：${order.result}，钻石和石材已经放进你的资源记录。`, true); }}><i /><b /><em>⚒</em><span>{order.person}<small>{order.result}</small></span></button>)}</> : <><button className="camp-bed" onClick={(event) => { event.stopPropagation(); nextDay(); setFarmInterior("camp"); setIndoorPlayer({ x: 32, y: 72 }); setMessage("小禾钻进睡袋，盖好条纹毯住了一晚。早上七点，在帐篷睡袋里醒来了。 "); }} aria-label="睡进帐篷睡袋并住到第二天"><i className="camp-pillow" /><b className="camp-blanket" /><span>帐篷睡袋<small>点击盖好毯子睡到明早</small></span></button><i className="camp-bag" /><i className="camp-table" /><span className="camp-lantern" /><b className="camp-window" />{wildFriendVisit === "camp" && <button style={personClothesStyle("安安")} className="camp-resident anan-character" onClick={() => interactWithPerson("安安", "安安：今晚风很轻，我们可以住在帐篷里听着溪水声睡觉。 ")}><i /><em className="anan-pigtails" /><b /><span>安安住在帐篷里</span></button>}</>}
                    {wildFriendVisit === farmInterior && <button style={personClothesStyle("安安")} className="wild-friend-visitor anan-character" onClick={() => interactWithPerson("安安", farmInterior === "cave" ? "安安：这里的水晶真漂亮！我们点亮火柴，再一起找找通往深处的小路吧。" : "安安：今晚风很轻，我们可以在帐篷里讲山谷探险的故事。") }><i /><em className="anan-pigtails" /><b /><span>安安<small>来陪你玩</small></span></button>}
                    {farmInterior === "cave" && game.missingPetId && (() => { const lostPet = game.pets.find((pet) => pet.id === game.missingPetId); if (!lostPet) return null; const petName = PET_CATALOG.find((pet) => pet.id === lostPet.type)?.name; return <button className={`lost-pet-in-cave pet-${lostPet.type}`} onClick={() => { setGame((current) => ({ ...current, missingPetId: null })); setMessage(`在岩石后面找到了${petName}，小禾把它轻轻抱起来带回家，它又会跟着你了！`); playTone(900); }}><i /><b /><span>{petName}躲在洞里<small>点击抱回家</small></span></button>; })()}
                    {farmInterior === "cave" && dailyNews.kind === "cave" && <button className="cave-prospector" style={personClothesStyle("阿木")} onClick={(event) => { event.stopPropagation(); setMessage("山洞勘探员阿木：新闻是真的。今天三处矿脉的位置已经重新标记，留意岩石后露出的小尖角。"); playTone(680); }}><i /><b /><em className="prospector-helmet" /><span>勘探员阿木<small>点击询问矿脉</small></span></button>}
                    {farmInterior === "cave" && game.forestQuestEpisode === 0 && game.forestQuestStage === 2 && <button type="button" className={`forest-cave-clue ${collectingForestCrystal ? "collecting" : ""}`} disabled={collectingForestCrystal} onClick={(event) => { event.stopPropagation(); inspectForestCaveClue(); }}><i /><b /><em className="forest-medicine-bottle"><i /></em><span>蓝晶水<small>{currentAbsoluteDay() <= game.forestQuestProgressDay ? "明天才会显出光" : interiorFireLit ? collectingForestCrystal ? "水滴正在流进药瓶…" : "点击，让水滴流进药瓶" : "先点亮火把"}</small></span></button>}
                    <div className={`player indoor-player farm-special-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }}><span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
                    {!interiorFireLit && <div className="special-darkness"><span>{farmInterior === "cave" ? "山洞里很暗" : "帐篷里还没点灯"}</span></div>}
                  </div>
                  <div className="farm-special-actions"><button onClick={igniteWithMatches} disabled={interiorFireLit}>{interiorFireLit ? "火光已经点亮" : `使用火柴照明 · 剩 ${game.crafted.matches}`}</button>{farmInterior === "cave" && <button className={selected === "pickaxe" ? "active-special-tool" : ""} onClick={() => { setSelected("pickaxe"); setMessage(game.toolUpgrades.pickaxe ? "拿出了金铁镐子。每处矿脉能挖到 3 颗钻石。 " : "拿出了镐子。点击地面走到钻石矿旁，再点击钻石矿挖掘。 "); }}>{game.toolUpgrades.pickaxe ? `拿出金铁镐子 · 剩 ${game.toolUpgradeDays.pickaxe} 天` : "拿出镐子"} · 已有 {game.diamonds} 钻石</button>}{farmInterior === "cave" && game.ageSkillsLearned.includes("echo") && <button className="cave-echo-action" onClick={startWorldEchoSurvey}>{game.lastAgeAbilityDays.echo === `${game.year}-${game.season}-${game.day}` ? "今天已定位矿脉" : "听石寻晶 · 定位隐藏矿脉"}</button>}{farmInterior === "camp" && <button className="camp-sleep-action" onClick={() => { nextDay(); setFarmInterior("camp"); setIndoorPlayer({ x: 32, y: 72 }); setMessage("小禾钻进睡袋，盖好毯子睡了一夜。第二天早上仍在帐篷里醒来。 "); }}>钻进睡袋 · 睡到明早</button>}<button onClick={() => { setFarmInterior(null); setInteriorFireLit(false); setMessage(farmInterior === "cave" ? "从山洞回到大农场。" : "从帐篷出来，回到刚才搭营的户外地点。 "); }}>从入口出去</button></div>
                </section>
              </div>
            )}

            {craftingOpen && (
              <div className="shop-overlay crafting-book-overlay" role="presentation" onClick={() => { setCraftingOpen(false); setMessage("收起制作手册，可以继续走路了。"); }}>
                <section className="craft-panel" role="dialog" aria-modal="true" aria-labelledby="craft-title" onClick={(event) => event.stopPropagation()}>
                  <header className="craft-sticky-header"><div><span>农场手作</span><h2 id="craft-title">制作手册</h2></div><div className="wood-wallet"><small>现有材料</small><strong>{game.wood} 木 · {game.stone} 石 · {game.resin} 树脂 · {game.wool} 羊毛</strong></div><button className="craft-close-button" onClick={() => setCraftingOpen(false)} aria-label="关闭制作菜单">×</button></header>
                  <div className="craft-intro"><span>⚒</span><p><strong>把木头、石材、树脂和羊毛做成实用物品</strong>火柴需要 3 木和 2 树脂；羊毛毯需要 3 团羊毛。</p><button className="start-dismantle-button" onClick={() => { setSelected("axe"); setSelectedCraftItem(null); setCraftingOpen(false); setMessage("进入拆除模式：已经摆放的物品会亮出红色虚线。点击一件就能拆掉并回收木头；有物品的木箱必须先清空。 "); }}>拆除已摆物品<small>回收成木头</small></button></div>
                  <div className="recipe-grid">
                    {CRAFT_GROUPS.map((group) => <section className="recipe-group" key={group.title}><header><strong>{group.title}</strong><small>{group.note}</small></header><div>{group.items.map((item) => { const recipe = CRAFT_RECIPES[item]; return <article className="recipe-card" key={item}><span className={`recipe-icon ${item}-recipe`}>{recipe.short}</span><div><strong>{recipe.name}</strong><small>{recipe.description}</small><em>背包里 {game.crafted[item]} 个{INDOOR_FURNITURE.includes(item) ? ` · 屋内已摆 ${game.atticPlacedCrafts.filter((placed) => placed.type === item).length} 个` : !HANDCRAFTS.includes(item) && ` · 农场已摆 ${game.placedCrafts.filter((placed) => placed.type === item).length} 个`}</em></div><button onClick={() => craftItem(item)}>{recipe.wood > 0 && <><span>木</span>{recipe.wood}</>}{recipe.stone > 0 && <> · <span>石</span>{recipe.stone}</>}{(recipe.resin ?? 0) > 0 && <> · <span>脂</span>{recipe.resin}</>}{(recipe.wool ?? 0) > 0 && <><span>毛</span>{recipe.wool}</>}</button></article>; })}</div></section>)}
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
                  <header><div><span>农舍旁的大号箱子</span><h2 id="shipping-bin-title">大号售卖箱</h2></div><div className="shop-wallet"><small>睡觉后预计收入 · 星级作物会加价</small><strong>● {Math.round((SHIPPING_CATALOG.reduce((sum, item) => sum + (game.shippingBin[item.id] ?? 0) * item.price, 0) + cropQualityBonus(game.shippingCropQualityStock)) * (game.upgrades.storage ? 1.1 : 1)).toLocaleString()}</strong></div><button onClick={() => setShippingBinOpen(false)} aria-label="关上大号售卖箱">×</button></header>
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
                  {renderIndoorRoofRain()}
                  <header><div><span>{activeVillageInfo.farm}室内</span><h2 id="farmhouse-title">{displayName}的农舍</h2></div><button onClick={leaveBuilding} aria-label={`离开${displayName}的农舍`}>×</button></header>
                  <div className={`interior-room farmhouse-room ${game.upgrades.house ? "expanded-farmhouse-room" : ""} farmhouse-level-${game.upgrades.house} ${isNight ? "night-room" : ""} ${isNight && stoveLit ? "stove-lit-room" : ""} ${isNight && game.equipment.lampOn ? "lamp-lit-room" : ""} ${bedtimePhase === "tuckedIn" || bedtimePhase === "waking" ? "bedtime-sleeping" : ""}`} onClick={walkInsidePointer}>
                    <div className="room-window"><i /><i /></div>
                    {game.upgrades.secondFloor > 0 && <button className={`house-stairs real-house-staircase ${stairTravel === "up" ? "stairs-in-use" : ""}`} onClick={(event) => { event.stopPropagation(); travelHouseStairs("up"); }} aria-label="走上真正的木楼梯到二楼"><span className="stair-flight">{Array.from({ length: 7 }, (_, index) => <i key={`lower-stair-${index}`} style={{ "--stair-index": index } as CSSProperties} />)}</span><b className="stair-railing" /><em className="stair-landing" /></button>}
                    {showBirthdayParty && <><button className="birthday-party-room-close" onClick={(event) => { event.stopPropagation(); setBirthdayCeremony(null); setDismissedBirthdayPartyKey(currentBirthdayPartyKey); setMessage("生日会页面已经关闭，朋友们先收拾好房间；回到左边生日卡片可以再次打开。 "); }} aria-label="关闭生日会页面">×<span>关闭生日会</span></button><div className="birthday-banner">二月十九日 · {displayName}生日快乐！</div><div className="birthday-loft" aria-label="生日派对时可以跑上去的小阁楼"><i /><b /><span>小阁楼</span></div><div className="birthday-house-guests" aria-label="会在农舍里跑动、看窗户、跳床和玩耍的所有朋友">{BIRTHDAY_GUESTS.map((name, index) => <button key={`birthday-${name}`} style={personClothesStyle(name)} className={`birthday-guest birthday-guest-${index + 1} birthday-behavior-${index % 5} ${name === "安安" ? "anan-character" : ""}`} onClick={() => interactWithPerson(name, `${name}：生日快乐！我们刚才在屋里跑来跑去、看窗外，还轮流在床上跳呢！`)} aria-label={`和参加生日派对的${name}聊天`}><i />{name === "安安" && <em className="anan-pigtails" />}<b /><span>{name}</span></button>)}</div><button className={`birthday-cake ${game.birthdayCakeYear === game.year ? "cake-eaten" : ""}`} onClick={eatBirthdayCake} aria-label="分享生日蛋糕恢复体力"><i /><b /><em /><span>{game.birthdayCakeYear === game.year ? "蛋糕已经分享完" : "点击吃生日蛋糕 · 恢复40体力"}</span></button></>}
                    <button className="house-bed" onClick={sleepAtHome} aria-label="点击床睡到第二天"><i /><b /><span>点击睡觉</span></button>
                    <button className={`bedside-pajama-button ${game.equippedOutfit === "pajamas" ? "wearing" : ""}`} onClick={(event) => { event.stopPropagation(); togglePajamas(); }} aria-label={game.equippedOutfit === "pajamas" ? "脱下睡衣" : "换上睡衣"}><i /><span>{game.equippedOutfit === "pajamas" ? "脱下睡衣" : "穿上睡衣"}</span></button>
                    {houseFloor === 1 && game.firstFloorNightstandPlaced && <button className={`first-floor-nightstand ${selected === "axe" ? "dismantle-ready" : ""}`} onClick={(event) => { event.stopPropagation(); if (selected === "axe") { const woodBack = Math.max(1, Math.floor(CRAFT_RECIPES.nightstand.wood / 2)); setGame((current) => ({ ...current, firstFloorNightstandPlaced: false, wood: current.wood + woodBack, energy: Math.max(0, current.energy - staminaCost(current, 2)) })); setMessage(`拆掉了床边小柜，回收成 ${woodBack} 块木头。`); playTone(360); return; } setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 5) })); setMessage("从床边小柜拿起温水慢慢喝完，恢复 5 点体力。 "); playTone(610); }} aria-label={selected === "axe" ? "点击拆除床边小柜并回收木头" : "床边小柜，点击喝温水恢复体力"}><i /><b /><span>床边小柜</span></button>}
                    {(bedtimePhase === "tuckedIn" || bedtimePhase === "waking") && <div className={`sleeping-player-in-bed ${bedtimePhase}`} aria-label={bedtimePhase === "waking" ? "小禾第二天在床上醒来" : "小禾盖着被子睡觉"}><i className="sleep-head" /><b className="sleep-blanket" /><span>{bedtimePhase === "waking" ? "早上七点 · 点击房间起床" : "盖好被子睡觉中…"}</span></div>}
                    {(bedtimePhase === "tuckedIn" || bedtimePhase === "waking") && followingPets.length > 0 && <div className="sleeping-pet-cages" aria-label="睡觉时宠物们回到农舍里的小窝"><strong>宠物们的睡觉小窝</strong>{followingPets.slice(0, 6).map((pet) => <span key={`sleep-${pet.id}`} className={`sleep-pet-cage pet-${pet.type} ${game.sickPetIds.includes(pet.id) ? "sick-pet" : ""}`}><i /><b /><em /></span>)}</div>}
                    <div className="home-baby-pets" aria-label="出生在家里的小动物宝宝">
                      <strong>小育幼垫<small>{nurseryPets.length ? `${nurseryPets.length}只宝宝` : "点垫子核对"}</small></strong>
                      {!nurseryPets.length && <button className="empty-baby-nursery" onClick={(event) => { event.stopPropagation(); inspectPetNursery(); }}><i>？</i><span>检查宝宝<small>满五年会立即补生</small></span></button>}
                      {nurseryPets.slice(0, 4).map((pet, index) => {
                        const petName = PET_CATALOG.find((entry) => entry.id === pet.type)?.name ?? "小宠物";
                        const caredToday = game.lastBabyCareDays[pet.id] === `${game.year}-${game.season}-${game.day}`;
                        const careCount = game.babyCareStreaks[pet.id] ?? 0;
                        const ageDays = petAgeDays(pet);
                        return <button key={`home-baby-${pet.id}`} className={`home-baby-pet baby-${index + 1} pet-${pet.type} ${caredToday ? "cared" : "needs-care"}`} onClick={(event) => { event.stopPropagation(); beginBabyPetCare(pet); }} aria-label={`${petName}宝宝，${caredToday ? "今天已经照顾" : "需要喂食、加水、梳毛和陪玩"}`}><i /><b /><em>{caredToday ? "✓" : "!"}</em><span>{petName}宝宝<small>{caredToday ? `照顾 ${careCount}/4 次` : `出生 ${ageDays} 天 · 点击照顾`}</small></span></button>;
                      })}
                    </div>
                    <div className="house-table"><i /><i /></div>
                    <button className={`house-stove ${stoveLit ? "lit" : ""}`} onClick={() => { setStoveLit((lit) => !lit); setMessage(stoveLit ? "把炉火熄灭了。" : "炉灶点着了，屋里暖和起来！"); playTone(stoveLit ? 300 : 660); }} aria-pressed={stoveLit} aria-label={stoveLit ? "熄灭炉灶" : "点燃炉灶"}><i /><b /><span /></button>
                    {game.upgrades.house >= 1 && <button className={`house-equipment house-lamp ${game.equipment.lampOn ? "active" : ""}`} onClick={() => { setGame((current) => ({ ...current, equipment: { ...current.equipment, lampOn: !current.equipment.lampOn } })); setMessage(game.equipment.lampOn ? "关掉了暖光灯。" : "暖光灯亮起来，夜晚的房间变得明亮了！"); }}><i />暖光灯</button>}
                    {game.upgrades.house >= 2 && <button className="house-equipment house-water-tank" onClick={() => { setGame((current) => ({ ...current, water: current.toolUpgrades.water ? 18 : 12 })); setMessage("自动水箱把洒水壶补满了！"); playTone(620); }}><i />自动水箱</button>}
                    {game.upgrades.house >= 3 && <button className="house-equipment house-kitchen" onClick={() => { setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 20) })); setMessage("在料理台吃了一份热饭，恢复 20 点体力！"); playTone(740); }}><i />料理台</button>}
                    {wildFriendAtPlayerHome && <button style={personClothesStyle("安安")} className="neighbor-indoor-npc anan-farmhouse-visitor anan-character" onClick={() => interactWithPerson("安安", `安安：我直接跑来${displayName}家找你啦！今天一起去农场、帐篷或者山洞玩吧。`)} aria-label={heldItem ? `把${carriedItemName}送给安安` : "和来家里找你的安安聊天"}><i className="npc-hair" /><i className="npc-face" /><em className="anan-pigtails" /><i className="npc-body" /><span>安安<small>来找你玩</small></span></button>}
                    <div className="house-rug" />
                    <button className="house-door" onClick={leaveBuilding} aria-label="点击出口离开农舍"><span>出口</span></button>
                    <div className={`player indoor-player facing-${facing} ${isWalking ? "walking" : ""} ${stairTravel ? `stair-traveler stair-${stairTravel}` : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }} aria-label="小禾站在农舍里">{renderCarriedItem()}{renderWearables()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
                    {houseFloor === 2 && <div className={`upstairs-room ${isNight ? "upstairs-night" : ""} ${game.equipment.lampOn ? "upstairs-lamp-on" : ""}`} onClick={(event) => event.stopPropagation()}>
                      <div className="upstairs-wall"><div className="upstairs-window"><i /><i /></div><strong>农舍二楼</strong><small>空旷空间 · 家具由你摆放</small></div>
                      <button className={`upstairs-stairs real-house-staircase upper-staircase ${stairTravel === "down" ? "stairs-in-use" : ""}`} onClick={(event) => { event.stopPropagation(); travelHouseStairs("down"); }} aria-label="沿真正的木楼梯回到一楼"><span className="stair-flight">{Array.from({ length: 7 }, (_, index) => <i key={`upper-stair-${index}`} style={{ "--stair-index": index } as CSSProperties} />)}</span><b className="stair-railing" /><em className="stair-landing" /></button>
                      <div className="upstairs-room-entrances">
                        {game.upgrades.upstairsKitchen > 0 && <button className="upstairs-room-door kitchen-room-door" onClick={() => { setUpstairsRoom("kitchen"); setSelectedAtticCraft(null); setMessage("推门进入二楼厨房，灶台、水槽和料理柜都是可以使用的家具。 "); }}><i /><b /><strong>厨房</strong><small>点击进入</small></button>}
                        {game.upgrades.upstairsBathroom > 0 && <button className="upstairs-room-door bathroom-room-door" onClick={() => { setUpstairsRoom("bathroom"); setSelectedAtticCraft(null); setMessage("推门进入二楼卫生间，浴缸、花洒、洗手台和镜子都可以使用。 "); }}><i /><b /><strong>卫生间</strong><small>点击进入</small></button>}
                      </div>
                      {selectedAtticCraft && <div className="upstairs-placement-grid" aria-label="绿色家具摆放位置">{ATTIC_PLACEMENT_SLOTS.map((slot, index) => game.atticPlacedCrafts.some((craft) => craft.x === index) ? null : <button key={`attic-slot-${index}`} style={{ left: `${slot.x}%`, top: `${slot.y}%` }} onClick={() => placeFurnitureUpstairs(index)} aria-label={`在第 ${index + 1} 个绿色方格摆放${CRAFT_RECIPES[selectedAtticCraft].name}`}><i /></button>)}</div>}
                      <div className="upstairs-placed-furniture">{game.atticPlacedCrafts.map((craft) => { const slot = ATTIC_PLACEMENT_SLOTS[craft.x]; if (!slot) return null; return <button key={craft.id} className={`upstairs-furniture upstairs-furniture-${craft.type} ${selected === "axe" ? "dismantle-ready" : ""} ${craft.type === "floorLamp" && game.equipment.lampOn ? "floor-lamp-on" : ""}`} style={{ left: `${slot.x}%`, top: `${slot.y}%` }} onClick={() => useUpstairsFurniture(craft)} aria-label={selected === "axe" ? `拆除${CRAFT_RECIPES[craft.type].name}并回收木头` : craft.type === "floorLamp" ? `室内落地灯，现在${game.equipment.lampOn ? "亮着" : "关闭"}，点击${game.equipment.lampOn ? "关灯" : "开灯"}` : CRAFT_RECIPES[craft.type].name}><i /><b /><span>{selected === "axe" ? `拆除${CRAFT_RECIPES[craft.type].name}` : craft.type === "floorLamp" ? game.equipment.lampOn ? "落地灯 · 亮着" : "落地灯 · 点击开灯" : CRAFT_RECIPES[craft.type].name}</span></button>; })}</div>
                      {upstairsRoom && <div className={`upstairs-private-room private-${upstairsRoom}`}>
                        <button className="private-room-back" onClick={() => { setUpstairsRoom(null); setMessage("从小房间回到宽敞的二楼。 "); }}>← 回到二楼</button>
                        {upstairsRoom === "kitchen" ? <><div className="private-room-title"><strong>二楼厨房</strong><small>每道料理都要切配、控制火候并亲手装盘</small></div><button className="functional-kitchen-stove" onClick={() => setMessage("灶台已经烧热了。选择下面的螃蟹或小虾，开始完整的做饭过程。 ")}><i /><b /><span>灶台 · 点火</span></button><button className="functional-kitchen-sink" onClick={() => { setMessage("用水槽把海鲜和蔬菜洗干净了，准备放到砧板上处理。 "); playTone(610); }}><i /><b /><span>水槽 · 清洗食材</span></button><button className="functional-kitchen-cabinet" onClick={() => setMessage(`料理柜里记录着：生螃蟹 ${game.crabs}、生小虾 ${game.shrimp}、熟螃蟹 ${game.cookedCrabs}、熟小虾 ${game.cookedShrimp}。已发现食谱 ${game.recipesDiscovered.length}/2。`)}><i /><b /><span>料理柜 · 查看食材</span></button><div className="private-kitchen-actions"><button disabled={game.crabs <= 0} onClick={() => startCookingSeafood("crabs")}>亲手做螃蟹 ×{game.crabs}</button><button disabled={game.shrimp <= 0} onClick={() => startCookingSeafood("shrimp")}>亲手做小虾 ×{game.shrimp}</button></div></> : <><div className="private-room-title"><strong>二楼卫生间</strong><small>洗澡会恢复健康，并让明天更有精神</small></div><button className="functional-bathtub" onClick={takeTherapeuticBath}><i /><b /><span>浴缸与花洒 · 洗澡</span></button><button className="functional-bath-sink" onClick={() => { setGame((current) => ({ ...current, rainExposure: 0, energy: Math.min(100, current.energy + 3) })); setMessage("在洗手台洗净泥土和雨水，恢复 3 点体力。 "); }}><i /><b /><span>洗手台 · 清洁</span></button><button className="functional-bath-mirror" onClick={() => { const nextOutfit = game.mallItems.redCoat > 0 && game.equippedOutfit !== "redCoat" ? "redCoat" : game.mallItems.blueOutfit > 0 && game.equippedOutfit !== "blueOutfit" ? "blueOutfit" : "default"; setGame((current) => ({ ...current, equippedOutfit: nextOutfit })); setMessage(nextOutfit === "default" ? "照了照镜子，换回平常的农场衣服。" : `在镜子前整理衣服，换上了${nextOutfit === "redCoat" ? "红色外套" : "蓝色套装"}。`); }}><i /><b /><span>镜子 · 整理换装</span></button></>}
                      </div>}
                      <div className={`player indoor-player upstairs-player facing-${facing} ${isWalking ? "walking" : ""} ${stairTravel ? `stair-traveler stair-${stairTravel}` : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }} aria-label="小禾站在农舍二楼">{renderCarriedItem()}{renderWearables()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
                    </div>}
                  </div>
                  {houseFloor === 2 && atticStorageOpen && <div className="attic-storage-modal"><section><header><div><span>二楼专用收纳</span><h3>二楼木箱</h3></div><button onClick={() => setAtticStorageOpen(false)}>×</button></header><div className="attic-storage-grid">{(Object.keys(ATTIC_RESOURCE_INFO) as AtticResource[]).map((resource) => <article key={`attic-resource-${resource}`}><i>{ATTIC_RESOURCE_INFO[resource].short}</i><div><strong>{ATTIC_RESOURCE_INFO[resource].name}</strong><small>背包 {game[resource]} · 箱内 {game.atticStorage[resource]}</small></div><button disabled={game[resource] <= 0} onClick={() => putInAtticStorage(resource)}>放入 1 个</button><button disabled={game.atticStorage[resource] <= 0} onClick={() => takeFromAtticStorage(resource)}>取出 1 个</button></article>)}</div><footer><span>{message}</span><button onClick={() => setAtticStorageOpen(false)}>关上木箱</button></footer></section></div>}
                  <div className="service-dialogue"><strong>{showBirthdayParty ? `${displayName}的生日派对` : wildFriendAtPlayerHome ? "安安来找你啦" : game.pets.some((pet) => pet.id.includes("-baby-")) ? "家里的小动物宝宝" : "回到家啦"}</strong><p>{showBirthdayParty ? "每一年的春天第十九天，大家都会来到农舍庆祝二月十九日生日。点击朋友可以聊天，点击蛋糕能恢复体力；右上方叉叉可以关闭整个生日会。" : wildFriendAtPlayerHome ? "安安有时会从西边的小农场直接跑来你家。点击她可以聊天，也可以把头顶举着的礼物送给她。" : game.pets.some((pet) => pet.id.includes("-baby-")) ? "刚出生的宝宝住在育幼垫上，比大宠物更小。每天要亲手完成喂食、控水、梳毛和瞄准接球。" : "床铺得软软的，炉灶还留着余温。可以休息到明天，也可以从门口回农场。"}</p></div>
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
                  {renderIndoorRoofRain()}
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
                    <article className="product-card"><span className="product-icon diamond-growth-bag">◆</span><div><strong>钻石矿脉生长包</strong><small>让山洞重新长出 3 处会换位置的钻石矿</small></div><button onClick={() => buyItem("diamondGrowth")}><span>●</span>850</button></article>
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
                  {renderIndoorRoofRain()}
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
                    {activeBuilding === "cafe" && cafeResidents.length > 0 && currentFestival?.id !== "coffee" && <div className="festival-indoor-guests daily-cafe-guests" aria-label="在麦香咖啡吃饭的居民">{cafeResidents.slice(0, 6).map(({ name, schedule }, index) => <button key={`cafe-daily-${name}`} style={personClothesStyle(name)} className={`indoor-guest guest-${index + 1} ${isNpcSick(name) ? "sick-npc" : ""}`} onClick={() => talkWithCafeResident(name, schedule)}><i /><b /><span>{name}<small>{schedule.key === "breakfast" ? "正在吃早餐" : "正在吃午饭"}</small></span></button>)}</div>}
                    {activeBuilding === "cafe" && <button className={`cafe-player-seat ${cafePlayerSitting ? "occupied" : ""}`} onClick={(event) => { event.stopPropagation(); setCafePlayerSitting((sitting) => { const next = !sitting; if (next) { setIndoorPlayer({ x: 45, y: 68 }); setFacing("down"); setMessage("小禾拉开空椅子坐下来，可以慢慢吃东西，也可以点击身边的居民聊天。 "); } else { setIndoorPlayer({ x: 45, y: 74 }); setMessage("小禾从咖啡店的椅子上站起来了。 "); } return next; }); }} aria-pressed={cafePlayerSitting}><i /><b /><span>{cafePlayerSitting ? "小禾坐在这里" : "空椅子 · 点击坐下"}</span></button>}
                    {((activeBuilding === "cafe" && currentFestival?.id === "coffee") || (activeBuilding === "workshop" && currentFestival?.id === "craft")) && <div className={`festival-indoor-guests guests-${activeBuilding}`} aria-label={`参加${currentFestival.name}的居民`}>{FESTIVAL_GUESTS.map((name, index) => <button key={name} style={personClothesStyle(name)} className={`indoor-guest guest-${index + 1} ${name === "安安" ? "anan-character" : ""} ${isNpcSick(name) ? "sick-npc" : ""}`} onClick={() => interactWithPerson(name, `${name}：${currentFestival.name}真热闹，屋里坐满了村民！`)}><i />{name === "安安" && <em className="anan-pigtails" />}<b /><span>{name}</span></button>)}</div>}
                    {activeBuilding === "clinic" && currentFestival?.id === "medical" && <div className="medical-festival-cases"><header><strong>八种病症 · 必须逐种学习</strong><small>{game.medicalTrained ? `已学会 ${game.learnedTreatments.length}/8` : "先完成上方的医疗节基础实习"}</small></header><div>{ILLNESS_IDS.map((illnessId) => <button key={illnessId} disabled={!game.medicalTrained} className={game.learnedTreatments.includes(illnessId) ? "learned" : ""} onClick={() => beginMedicalCourse(illnessId)}><i>{game.learnedTreatments.includes(illnessId) ? "✓" : "诊"}</i><span><strong>{ILLNESSES[illnessId].name}</strong><small>{ILLNESSES[illnessId].lesson} · {ILLNESSES[illnessId].method === "clinicOnly" ? "必须处方药" : ILLNESSES[illnessId].method === "baths" ? "连续热浴" : ILLNESSES[illnessId].method === "remedy" ? "材料配方" : "复杂自疗"}</small></span></button>)}</div></div>}
                    <div className="interior-counter" />
                    <div className="interior-sign">{activeBuilding === "townhall" ? "公告" : activeBuilding === "clinic" ? "健康" : activeBuilding === "cafe" ? "今日菜单" : activeBuilding === "workshop" ? "制作台" : activeBuilding === "museum" ? "山谷馆藏" : activeBuilding === "school" ? "今日课堂" : "农事图鉴"}</div>
                    <div className={`room-specials special-${activeBuilding}`}>
                      {BUILDING_ITEMS[activeBuilding].map((item) => <button type="button" key={item} onClick={() => inspectBuildingItem(item)}>{item}</button>)}
                      {activeBuilding === "library" && game.libraryBooks.map((bookId) => <button type="button" className="recovered-book" key={`library-book-${bookId}`} onClick={() => inspectBuildingItem(LOST_BOOKS[bookId].title)}>{LOST_BOOKS[bookId].title}</button>)}
                      {activeBuilding === "museum" && game.museumArtifacts.map((artifactId) => <button type="button" className={`museum-case artifact-case-${artifactId + 1}`} key={`museum-artifact-${artifactId}`} onClick={() => inspectBuildingItem(RARE_ARTIFACTS[artifactId].title)}><span className="museum-artifact-thumb"><img src="/museum-artifacts.png" alt="" draggable={false} /></span>{RARE_ARTIFACTS[artifactId].title}</button>)}
                    </div>
                    {activeBuilding === "cafe" && !festivalProcess && <button className="coffee-practice-action" onClick={(event) => { event.stopPropagation(); startFestivalProcess("coffee"); }}><i>豆</i><span>亲手磨豆和冲咖啡<small>点击重新体验完整过程</small></span></button>}
                    <div className={`player indoor-player facing-${facing} ${isWalking ? "walking" : ""} ${activeBuilding === "cafe" && cafePlayerSitting ? "cafe-player-sitting" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }} aria-label={activeBuilding === "cafe" && cafePlayerSitting ? "小禾坐在咖啡店的椅子上" : "小禾站在房子里面"}>{renderCarriedItem()}{renderWearables()}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
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
                    <kbd>{TOOL_INFO[tool].key}</kbd><PixelIcon type={tool} /><span>{tool === "seed" ? `${CROP_INFO[selectedCrop].name}种子` : tool === "water" && game.toolUpgrades.water ? "大号洒水壶" : tool === "axe" && game.toolUpgrades.axe ? `精铁斧头 · ${game.toolUpgradeDays.axe}天` : tool === "rod" && game.toolUpgrades.rod ? `幸运鱼竿 · ${game.toolUpgradeDays.rod}天` : tool === "pickaxe" && game.toolUpgrades.pickaxe ? `金铁镐子 · ${game.toolUpgradeDays.pickaxe}天` : TOOL_INFO[tool].name}</span>
                    {tool === "seed" && <b>{game[CROP_INFO[selectedCrop].seedField]}</b>}
                    {tool === "water" && <b>{game.water}</b>}
                    {tool === "rod" && <b>{game.inventory.fish}</b>}
                    {tool === "axe" && <b>{game.wood}</b>}
                    {tool === "pickaxe" && <b>{game.diamonds}</b>}
                  </button>
                ))}
                <div className="selected-hint"><span>{scene === "farm" ? "当前" : "所在地点"}</span><strong>{scene === "farm" ? plantingPinecone ? "拿着松果 · 点击树桩种树" : selectedResource ? `拿着${RESOURCE_INFO[selectedResource].name}` : selected === "rod" ? `鱼竿 · 鱼饵 ${game.bait}` : selected === "seed" ? `${CROP_INFO[selectedCrop].name}种子` : TOOL_INFO[selected].name : sceneLabel}</strong></div>
              </div>
              <div className="crafted-backpack" aria-label="制作物和松果背包"><button className={plantingPinecone ? "crafted-bag-item pinecone-bag-item selected" : "crafted-bag-item pinecone-bag-item"} onClick={clickPinecone} onDoubleClick={doubleClickPinecone} disabled={game.pinecones <= 0} aria-label={`松果 ${game.pinecones} 个，点击选择种树，双击拿起`}><span>果</span><small>松果·种树</small><b>{game.pinecones}</b></button>{(Object.keys(CRAFT_RECIPES) as CraftType[]).map((item) => <button key={`crafted-bag-${item}`} className={`${selectedCraftItem === item ? "crafted-bag-item selected" : "crafted-bag-item"} ${item === "matches" ? "matches-bag-item" : item === "blanket" ? "blanket-bag-item" : ""}`} onClick={item === "matches" ? clickMatches : () => chooseCraftForPlacement(item)} onDoubleClick={item === "matches" ? pickUpMatches : undefined} disabled={game.crafted[item] <= 0} aria-label={`${CRAFT_RECIPES[item].name} ${game.crafted[item]} 个，${item === "matches" ? "点击使用，双击拿起" : item === "blanket" ? "点击盖上休息并恢复体力" : "点击选择摆放"}`}><span>{CRAFT_RECIPES[item].short}</span><small>{CRAFT_RECIPES[item].name}</small><b>{game.crafted[item]}</b></button>)}</div>
            </div>
          </div>
        </section>
      </section>

      <div className="mobile-controls" aria-label="触屏方向键">
        <span>方向键</span>
        <div className="mobile-control-grid">
          <button className="mobile-up" onClick={() => move(0, -1)} aria-label="向上走一步">↑</button>
          <button className="mobile-left" onClick={() => move(-1, 0)} aria-label="向左走一步">←</button>
          <i aria-hidden="true" />
          <button className="mobile-right" onClick={() => move(1, 0)} aria-label="向右走一步">→</button>
          <button className="mobile-down" onClick={() => move(0, 1)} aria-label="向下走一步">↓</button>
        </div>
      </div>
    </main>
  );
}
