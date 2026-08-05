"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";

type Tool = "hoe" | "seed" | "water" | "hand" | "rod" | "axe";
type TileState = "grass" | "soil" | "crop";
type Scene = "farm" | "town" | "eastNeighbor" | "southNeighbor" | "northNeighbor";
type NeighborScene = "eastNeighbor" | "southNeighbor" | "northNeighbor";
type BuildingId = "farmhouse" | "supermarket" | "townhall" | "clinic" | "cafe" | "workshop" | "library";
type CropType = "radish" | "strawberry" | "corn" | "watermelon" | "tomato" | "potato" | "pumpkin" | "blueberry";
type StorableResource = CropType | "fish";
type VillageId = "qinghe" | "maple";
type Facing = "down" | "up" | "left" | "right";
type FestivalId = "seeds" | "fishing" | "spring" | "coffee" | "craft";
type SeedField = "seeds" | "strawberrySeeds" | "cornSeeds" | "watermelonSeeds" | "tomatoSeeds" | "potatoSeeds" | "pumpkinSeeds" | "blueberrySeeds";

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
  treeStates: boolean[];
  rockStates: boolean[];
  crafted: { chest: number; fence: number; scarecrow: number };
  upgrades: { house: number; land: number };
  builderSupplies: { wood: number; stone: number };
  equipment: { lampOn: boolean };
  daily: { day: number; planted: number; watered: number; harvested: number; fish: number; chopped: number; sold: number; rewardClaimed: boolean };
  sick: boolean;
  diagnosed: boolean;
  lastIllnessDay: number;
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
  townhall: { name: "镇公所", owner: "周镇长", greeting: "镇上的公告、活动和居民委托都记在这里。", exit: { x: 6, y: 4 } },
  clinic: { name: "青禾诊所", owner: "白医生", greeting: "别让自己太累，健康也是农场生活的一部分。", exit: { x: 9, y: 4 } },
  cafe: { name: "麦香咖啡", owner: "阿麦", greeting: "刚出炉的面包和热咖啡最能恢复精神。", exit: { x: 10, y: 5 } },
  workshop: { name: "木匠工坊", owner: "鲁师傅", greeting: "等你攒够材料，我可以帮你扩建农舍。", exit: { x: 3, y: 5 } },
  library: { name: "山谷图书馆", owner: "叶老师", greeting: "这里收藏着作物、矿石和青禾谷的故事。", exit: { x: 8, y: 5 } },
};

const BUILDING_ITEMS: Record<BuildingId, string[]> = {
  farmhouse: [],
  supermarket: [],
  townhall: ["居民委托板", "小镇地图", "节日公告"],
  clinic: ["诊疗床", "药品柜", "健康档案"],
  cafe: ["面包展示柜", "咖啡机", "靠窗小桌"],
  workshop: ["木工台", "工具墙", "木料架"],
  library: ["作物图鉴", "故事书架", "阅读桌"],
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
};

const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

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

const makeTiles = (count = 32): FarmTile[] =>
  Array.from({ length: count }, () => ({ state: "grass", stage: 0, watered: false }));

const makeNewGame = (): GameState => ({
  day: 1,
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
  treeStates: [true, true, true, true],
  rockStates: [true, true, true],
  crafted: { chest: 0, fence: 0, scarecrow: 0 },
  upgrades: { house: 0, land: 0 },
  builderSupplies: { wood: 0, stone: 0 },
  equipment: { lampOn: false },
  daily: { day: 1, planted: 0, watered: 0, harvested: 0, fish: 0, chopped: 0, sold: 0, rewardClaimed: false },
  sick: false,
  diagnosed: false,
  lastIllnessDay: 0,
});

function PixelIcon({ type }: { type: Tool }) {
  return <span className={`tool-symbol tool-${type}`}>{TOOL_INFO[type].icon}</span>;
}

function PlayerSprite({ facing, sick }: { facing: Facing; sick: boolean }) {
  if (facing === "left" || facing === "right") {
    return <><img className="side-sprite side-upper" src="/xiaohe-side-right.png" alt="" draggable={false} /><span className="side-css-legs" aria-hidden="true"><i className="side-leg side-leg-near"><b className="side-leg-shape" /></i><i className="side-leg side-leg-far"><b className="side-leg-shape" /></i></span></>;
  }
  return <img className="front-sprite" src={sick ? "/xiaohe-sick-sprite.png" : "/xiaohe-sprite.png"} alt="" draggable={false} />;
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
  const [craftingOpen, setCraftingOpen] = useState(false);
  const [chestOpen, setChestOpen] = useState(false);
  const [stoveLit, setStoveLit] = useState(false);
  const [neighborInterior, setNeighborInterior] = useState<NeighborScene | null>(null);
  const [festivalDisplay, setFestivalDisplay] = useState<"wood" | null>(null);
  const [festivalMusicPlaying, setFestivalMusicPlaying] = useState(false);
  const [heldMaterial, setHeldMaterial] = useState<"wood" | "stone" | null>(null);
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
  const walkTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
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
            treeStates: parsed.treeStates?.length === 4 ? parsed.treeStates : defaults.treeStates,
            rockStates: parsed.rockStates?.length === 3 ? parsed.rockStates : defaults.rockStates,
            crafted: { ...defaults.crafted, ...(parsed.crafted ?? {}) },
            upgrades: { ...defaults.upgrades, ...(parsed.upgrades ?? {}) },
            builderSupplies: { ...defaults.builderSupplies, ...(parsed.builderSupplies ?? {}) },
            equipment: { ...defaults.equipment, ...(parsed.equipment ?? {}) },
            daily: parsed.daily?.day === parsed.day ? { ...defaults.daily, ...parsed.daily } : { ...defaults.daily, day: parsed.day ?? 1 },
            sick: parsed.sick ?? false,
            diagnosed: parsed.diagnosed ?? false,
            lastIllnessDay: parsed.lastIllnessDay ?? 0,
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
  }, []);

  const showWalking = useCallback((dx: number, dy: number) => {
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) setFacing(dx < 0 ? "left" : "right");
    else if (dy !== 0) setFacing(dy < 0 ? "up" : "down");
    setIsWalking(true);
    if (walkTimerRef.current) window.clearTimeout(walkTimerRef.current);
    walkTimerRef.current = window.setTimeout(() => setIsWalking(false), 360);
  }, []);

  const move = useCallback((dx: number, dy: number) => {
    if (craftingOpen || chestOpen) return;
    showWalking(dx, dy);
    if (neighborInterior) {
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
      setScene("northNeighbor");
      setPlayer({ x: 6, y: 7 });
      setMessage("来到叶老师的林间书屋，这里安静又凉快。 ");
      return;
    }
    if (scene === "eastNeighbor" && dx > 0 && player.x === 11 && worldVillage === "qinghe") {
      setWorldVillage("maple"); setScene("farm"); setPlayer({ x: 0, y: 5 }); setMessage("沿着右边山路走到了枫叶村！如果朋友也在这里，就能碰面啦。 "); return;
    }
    if (scene === "farm" && dx < 0 && player.x === 0 && worldVillage === "maple") {
      setWorldVillage("qinghe"); setScene("eastNeighbor"); setPlayer({ x: 11, y: 5 }); setMessage("沿着左边山路回到了青禾村！"); return;
    }
    if (scene === "eastNeighbor" && dx < 0 && player.x === 0) {
      setScene("town"); setPlayer({ x: 11, y: 5 }); setMessage("回到青禾镇中心街。"); return;
    }
    if (scene === "southNeighbor" && dy < 0 && player.y === 0) {
      setScene("town"); setPlayer({ x: 6, y: 7 }); setMessage("回到青禾镇中心街。"); return;
    }
    if (scene === "northNeighbor" && dy > 0 && player.y === 7) {
      setScene("town"); setPlayer({ x: 6, y: 0 }); setMessage("回到青禾镇中心街。"); return;
    }

    const next = {
      x: Math.max(0, Math.min(11, player.x + dx)),
      y: Math.max(0, Math.min(7, player.y + dy)),
    };
    setPlayer(next);

    if (scene === "town") {
      let entrance: BuildingId | null = null;
      if (next.x >= 2 && next.x <= 4 && next.y <= 3) entrance = "supermarket";
      else if (next.x >= 5 && next.x <= 7 && next.y <= 3) entrance = "townhall";
      else if (next.x >= 9 && next.y <= 3) entrance = "clinic";
      else if (next.x >= 2 && next.x <= 4 && next.y >= 6) entrance = "workshop";
      else if (next.x >= 7 && next.x <= 9 && next.y >= 6) entrance = "library";
      else if (next.x >= 10 && next.y >= 6) entrance = "cafe";

      if (entrance) {
        setActiveBuilding(entrance);
        setMessage(`进入${BUILDING_INFO[entrance].name}。`);
      }
    }
  }, [activeBuilding, chestOpen, craftingOpen, neighborInterior, player, scene, showWalking, worldVillage]);

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
        setMessage(`离开${building.name}，回到中心街。`);
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
  }, [activeBuilding, builderOpen, chestOpen, craftingOpen, embeddedMode, move, neighborInterior, splitScreen]);

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

  const castLine = () => {
    if (selected !== "rod") {
      setMessage("先在工具栏选择鱼竿，再点击钓鱼池。");
      playTone(260);
      return;
    }
    if (isFishing) return;
    if (game.energy < 5) {
      setMessage("体力不够了，明天再来钓鱼吧。");
      playTone(220);
      return;
    }

    setIsFishing(true);
    const baitUsed = game.bait > 0;
    setMessage("浮标落入水中……耐心等鱼儿上钩。");
    setGame((current) => ({ ...current, bait: baitUsed ? current.bait - 1 : current.bait, energy: current.energy - 5 }));
    playTone(390);

    window.setTimeout(() => {
      const catches = [
        { name: "银鳞鲫", coins: 32 },
        { name: "春溪鳟", coins: 48 },
        { name: "花尾鲤", coins: 40 },
        { name: "小泥鳅", coins: 24 },
      ];
      const caught = catches[Math.floor(Math.random() * catches.length)];
      const fishingFestivalBonus = currentFestival?.id === "fishing" ? 2 : 0;
      const amount = (baitUsed ? 2 : 1) + fishingFestivalBonus;
      setGame((current) => ({
        ...current,
        fishCaught: current.fishCaught + amount,
        inventory: { ...current.inventory, fish: current.inventory.fish + amount },
        daily: { ...current.daily, fish: current.daily.fish + amount },
      }));
      setMessage(`钓到${caught.name}！鱼获 +${amount}${fishingFestivalBonus ? "，钓鱼节额外奖励 2 条" : baitUsed ? "，鱼饵让收获翻倍" : ""}，已经放进背包。`);
      setIsFishing(false);
      playTone(780);
    }, 1100);
  };

  const chopTree = (index: number) => {
    if (selected !== "axe") {
      setMessage("先选择斧头，再点击树木砍伐。");
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
      wood: current.wood + 4,
      treeStates: current.treeStates.map((tree, treeIndex) => treeIndex === index ? false : tree),
      daily: { ...current.daily, chopped: current.daily.chopped + 1 },
    }));
    setMessage("砍下树木，获得 4 块木头！点击左上角“制作”使用木头。");
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
      stone: current.stone + 3,
      rockStates: current.rockStates.map((rock, rockIndex) => rockIndex === index ? false : rock),
    }));
    setMessage("敲碎石头，获得 3 块石材！木头和石材可以用来扩建。");
    playTone(290);
  };

  const craftItem = (item: "chest" | "fence" | "scarecrow") => {
    const recipes = {
      chest: { name: "木箱", cost: 8 },
      fence: { name: "木栅栏", cost: 4 },
      scarecrow: { name: "稻草人", cost: 12 },
    };
    const recipe = recipes[item];
    if (game.wood < recipe.cost) {
      setMessage(`制作${recipe.name}还差 ${recipe.cost - game.wood} 块木头。`);
      playTone(220);
      return;
    }

    setGame((current) => ({
      ...current,
      wood: current.wood - recipe.cost,
      crafted: { ...current.crafted, [item]: current.crafted[item] + 1 },
    }));
    setMessage(`制作完成：${recipe.name}！它已经放到农场里。`);
    playTone(700);
  };

  const pickUpMaterial = (material: "wood" | "stone") => {
    if (game[material] <= 0) {
      setMessage(material === "wood" ? "现在没有木头可以拿起来。" : "现在没有石材可以拿起来。 ");
      return;
    }
    setHeldMaterial(material);
    setMessage(`双击拿起了${material === "wood" ? "木头" : "石材"}。现在去南坡点击鲁师傅，把材料交给他。`);
    playTone(540);
  };

  const talkToNeighbor = (neighbor: NeighborScene) => {
    if (neighbor !== "southNeighbor") {
      setMessage(neighbor === "eastNeighbor" ? "林婶：你好呀！周六记得来尝我的草莓果酱。" : "叶老师：天气好的时候，我喜欢在林子里散步读书。 ");
      return;
    }
    if (heldMaterial) {
      const amount = game[heldMaterial];
      setGame((current) => ({
        ...current,
        [heldMaterial]: 0,
        builderSupplies: { ...current.builderSupplies, [heldMaterial]: current.builderSupplies[heldMaterial] + amount },
      }));
      setMessage(`把 ${amount} 块${heldMaterial === "wood" ? "木头" : "石材"}交给了鲁师傅。`);
      setHeldMaterial(null);
      setBuilderOpen(true);
      playTone(650);
      return;
    }
    setBuilderOpen(true);
    setMessage("鲁师傅：把木头和石材双击拿起来，再交给我，我就能帮你制作和扩建。 ");
  };

  const commissionBuilder = (item: "house" | "land") => {
    const houseLevel = game.upgrades.house;
    const recipes = {
      house: { name: "扩大农舍", wood: 20 + houseLevel * 10, stone: 12 + houseLevel * 8 },
      land: { name: "扩大地盘", wood: 12, stone: 18 },
    } as const;
    const recipe = recipes[item];
    if ((item === "house" && houseLevel >= 3) || (item === "land" && game.upgrades.land >= 1)) {
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
      tiles: item === "land" ? [...current.tiles, ...makeTiles(8)] : current.tiles,
    }));
    const installed = item === "house" ? ["暖光灯", "自动水箱", "料理台"][houseLevel] : "更大的农田";
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
    const earnings = resources.reduce((sum, resource) => sum + game.inventory[resource] * RESOURCE_INFO[resource].price, 0);
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
    setMessage(`自动售卖 ${itemCount} 件鱼和作物，赚到 ${earnings} 金币！木头没有清空。`);
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

  const buyItem = (item: SeedField | "water" | "snack" | "soup" | "bait" | "sapling") => {
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
    } as const)[item as "water" | "snack" | "soup" | "bait" | "sapling"];

    if (game.coins < details.price) {
      setMessage("金币不够，再去收获一些作物吧。");
      playTone(220);
      return;
    }

    setGame((current) => {
      const next = {
        ...current,
        coins: current.coins - details.price,
        water: item === "water" ? 12 : current.water,
        bait: item === "bait" ? current.bait + 5 : current.bait,
        treeStates: item === "sapling" ? current.treeStates.map(() => true) : current.treeStates,
        energy: item === "snack" ? Math.min(100, current.energy + 25) : item === "soup" ? Math.min(100, current.energy + 50) : current.energy,
      };
      if (seedCrop) next[CROP_INFO[seedCrop].seedField] = current[CROP_INFO[seedCrop].seedField] + 5;
      return next;
    });
    setMessage(details.success);
    playTone(details.tone);
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
    setMessage(`离开${building.name}。沿着左边道路可以回农场。`);
  };

  const returnToFarm = () => {
    setActiveBuilding(null);
    setInspectedItem(null);
    setCraftingOpen(false);
    setChestOpen(false);
    setBuilderOpen(false);
    setNeighborInterior(null);
    setHeldMaterial(null);
    setScene("farm");
    setPlayer({ x: 10, y: 5 });
    setMessage("已经安全回到农场，原来的进度都还在。");
  };

  const useBuildingService = (building: Exclude<BuildingId, "supermarket" | "farmhouse">) => {
    if (building === "clinic") {
      if (!game.diagnosed) {
        setGame((current) => ({ ...current, diagnosed: true }));
        setMessage(game.sick ? "白医生完成检查：小禾确实生病了，我来开一份处方药。" : "白医生完成检查：没有生病，不需要开药。 ");
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
      setMessage("白医生开了处方药。支付 50 金币后服下药，小禾恢复健康了！");
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
    } else {
      setMessage("农事图鉴：萝卜连续浇水三天即可成熟，晴天也不能偷懒哦。");
      playTone(600);
    }
  };

  const inspectBuildingItem = (item: string) => {
    setInspectedItem(item);
    if (item === "药品柜") {
      setMessage(!game.diagnosed ? "白医生：要先接受免费检查，检查以后才能查看处方药。" : game.sick ? "药品柜里有白医生刚配好的处方药，需要支付 50 金币。" : "检查结果不需要用药，药品柜暂时不能打开。 ");
    } else if (item === "健康档案" && !game.diagnosed) {
      setMessage("健康档案还是空白的，要先让白医生做免费检查。 ");
    } else {
      setMessage(`打开查看“${item}”：${ITEM_DESCRIPTIONS[item]}`);
    }
    playTone(560);
  };

  const nextDay = () => {
    const nextDayNumber = game.day === 28 ? 1 : game.day + 1;
    const daysSinceIllness = game.lastIllnessDay === 0
      ? nextDayNumber
      : (nextDayNumber - game.lastIllnessDay + 28) % 28;
    const becameSick = !game.sick && (game.energy <= 0 || (daysSinceIllness >= 6 && nextDayNumber % 6 === 0));
    const remainsSick = game.sick || becameSick;
    const morningMessage = becameSick
      ? "早上七点醒来，小禾看起来没什么精神，嘴角变成了伤心的样子。"
      : remainsSick
        ? "早上七点了，小禾的表情仍然有些伤心。"
        : "早上七点了！浇过水的作物长大了，也有一棵树重新长出。";
    setGame((current) => {
      const treeStates = [...current.treeStates];
      const emptySpot = treeStates.indexOf(false);
      if (emptySpot >= 0) treeStates[emptySpot] = true;
      const rockStates = [...current.rockStates];
      const emptyRock = rockStates.indexOf(false);
      if (emptyRock >= 0) rockStates[emptyRock] = true;
      return {
        ...current,
        day: nextDayNumber,
        hour: 7,
        daily: { ...makeNewGame().daily, day: nextDayNumber },
        energy: remainsSick ? 65 : 100,
        sick: remainsSick,
        diagnosed: false,
        lastIllnessDay: becameSick ? nextDayNumber : current.lastIllnessDay,
        water: 12,
        treeStates,
        rockStates,
        tiles: current.tiles.map((tile) =>
          tile.state === "crop"
            ? { ...tile, stage: tile.watered ? Math.min(3, tile.stage + 1) : tile.stage, watered: false }
            : tile,
        ),
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
    setIsFishing(false);
    setCraftingOpen(false);
    setChestOpen(false);
    setSelectedResource(null);
    setMessage("新的农场生活开始了！");
    localStorage.setItem(saveStorageKey, JSON.stringify(fresh));
  };

  const chooseTool = (tool: Tool) => {
    setSelectedResource(null);
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
  const clockHour = Math.floor(game.hour) % 24;
  const clockMinute = Math.round((game.hour - Math.floor(game.hour)) * 60) % 60;
  const activeVillage = worldVillage;
  const activeVillageInfo = VILLAGE_INFO[activeVillage];
  const partner = onlinePlayers.find((onlinePlayer) => onlinePlayer.deviceId !== multiplayerSession?.deviceId);
  const currentFestival = FESTIVAL_SCHEDULE.find((festival) => festival.day === game.day) ?? null;
  const nextFestival = FESTIVAL_SCHEDULE.find((festival) => festival.day >= game.day) ?? FESTIVAL_SCHEDULE[0];
  const daysUntilFestival = nextFestival.day >= game.day ? nextFestival.day - game.day : 28 - game.day + nextFestival.day;
  const displayName = multiplayerSession?.playerName ?? "小禾";
  const sceneLabel = scene === "farm" ? activeVillageInfo.farm : scene === "town" ? `${activeVillageInfo.name} · 中心街` : scene === "eastNeighbor" ? "东郊 · 林婶的果园小屋" : scene === "southNeighbor" ? "南坡 · 鲁师傅的院子" : "北林 · 叶老师的书屋";

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
    if (activeBuilding || neighborInterior || craftingOpen || chestOpen || multiplayerOpen || builderOpen || festivalDisplay) return;
    if ((event.target as HTMLElement).closest("button, input, .shop-overlay")) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const percentX = ((event.clientX - bounds.left) / bounds.width) * 100;
    const percentY = ((event.clientY - bounds.top) / bounds.height) * 100;
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
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <div><strong>青禾谷</strong><span>GREENFIELD VALLEY</span></div>
        </div>
        <div className="day-card">
          <span className="season-dot">春</span>
          <div><strong>第 {game.day} 天 · {WEEKDAYS[(game.day - 1) % 7]}</strong><span>{String(clockHour).padStart(2, "0")}:{String(clockMinute).padStart(2, "0")}</span></div>
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
                {CROP_TYPES.filter((crop) => game[CROP_INFO[crop].seedField] > 0).map((crop) => <button key={crop} className={selected === "seed" && selectedCrop === crop ? "selected" : ""} onClick={() => { setSelected("seed"); setSelectedCrop(crop); setSelectedResource(null); setMessage(`拿出${CROP_INFO[crop].name}种子，现在有 ${game[CROP_INFO[crop].seedField]} 颗，可以去松好的土地播种。`); playTone(560); }}><span className={`${crop}-icon`}>{CROP_INFO[crop].short}</span><strong>{game[CROP_INFO[crop].seedField]}</strong><small>{CROP_INFO[crop].name}种子</small></button>)}
              </div>
            </div>
            <div className="harvest-subtitle">已经收获的水果、蔬菜和鱼</div>
            <div className="harvest-items">
              {(Object.keys(RESOURCE_INFO) as StorableResource[]).map((resource) => <button key={resource} className={selectedResource === resource ? "resource-item selected" : "resource-item"} onClick={() => clickResource(resource)} onPointerDown={() => startEating(resource)} onPointerUp={stopEating} onPointerCancel={stopEating} onPointerLeave={stopEating} onContextMenu={(event) => event.preventDefault()} aria-pressed={selectedResource === resource} aria-label={`${RESOURCE_INFO[resource].name} ${game.inventory[resource]} 个，轻点拿起，长按食用`} title="轻点拿起，长按吃掉"><span className={`harvest-icon ${resource}-icon`}>{resource === "fish" ? "鱼" : CROP_INFO[resource].short}</span><p>{resource === "fish" ? "鱼获" : CROP_INFO[resource].name}<strong>{game.inventory[resource]}</strong><small>长按吃</small></p></button>)}
              <button className={heldMaterial === "wood" ? "resource-item held-material" : "resource-item"} onDoubleClick={() => pickUpMaterial("wood")} title="双击拿起木头"><span className="harvest-icon wood-icon">木</span><p>木头<strong>{game.wood}</strong><small>双击拿起</small></p></button>
              <button className={heldMaterial === "stone" ? "resource-item held-material" : "resource-item"} onDoubleClick={() => pickUpMaterial("stone")} title="双击拿起石材"><span className="harvest-icon stone-icon">石</span><p>石材<strong>{game.stone}</strong><small>双击拿起</small></p></button>
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
          <div className="tip-card"><span>?</span><p><strong>{scene === "farm" ? "农场小贴士" : "小镇指南"}</strong>{scene === "farm" ? "用斧头砍树获得木头，再点左上角“制作”。鱼竿可以在钓鱼池使用。" : "每栋建筑都能进入；走到门口或直接点击建筑。"}</p></div>
          <button className="sleep-button" onClick={nextDay}><span>☾</span><div><strong>结束今天</strong><small>回家睡一觉</small></div><b>›</b></button>
        </aside>

        <section className="world-card" aria-label={`${sceneLabel}游戏区域`}>
          <div className={`world ${scene === "farm" ? "farm-world" : scene === "town" ? "town-world" : "neighbor-world"} ${activeVillage}-village ${twilightLevel > 0 ? "twilight-world" : ""}`} style={{ "--twilight": twilightLevel } as CSSProperties} onClick={walkToPointer}>
            <div className="location-chip"><span>{scene === "farm" ? "⌂" : "◆"}</span>{sceneLabel}</div>
            <button className="craft-button" onClick={() => { setCraftingOpen(true); setMessage("打开制作手册，选择想做的东西。"); }} aria-label="打开制作菜单"><span>⚒</span><strong>制作</strong><b>{game.wood} 木</b></button>
            <div className="cloud cloud-one" /><div className="cloud cloud-two" />
            <div className="mountain mountain-one" /><div className="mountain mountain-two" />
            {twilightLevel > 0 && <div className="night-sky" aria-hidden="true"><span className="moon" /><i /><i /><i /><i /><i /><i /></div>}
            {twilightLevel > 0 && <div className="twilight-layer" aria-hidden="true" />}

            {scene === "farm" ? (
              <>
                <div className="path path-one" /><div className="path path-two" />
                <button className={`pond ${isFishing ? "fishing" : ""} ${currentFestival?.id === "fishing" ? "fishing-festival-pond" : ""}`} onClick={castLine} aria-label="在钓鱼池钓鱼">
                  <i /><i /><i /><b className="fishing-float" /><span className="pond-label">{currentFestival?.id === "fishing" ? "钓鱼节会场 · 鱼获 +2" : "钓鱼池"}</span>
                </button>
                {currentFestival?.id === "fishing" && <div className="festival-crowd fishing-festival-crowd" aria-label="参加钓鱼节的居民">{FESTIVAL_GUESTS.map((name, index) => <button key={name} className={`crowd-person crowd-${index + 1}`} onClick={() => setMessage(`${name}：钓鱼节开始啦，鱼塘边来了好多村民！`)}><i /><b /><span>{name}</span></button>)}</div>}
                <button className={`house ${game.upgrades.house ? "expanded-house" : ""} house-level-${game.upgrades.house} ${isNight ? "night-house" : ""} ${isNight && stoveLit ? "fire-lit-house" : ""}`} onClick={() => { setActiveBuilding("farmhouse"); setMessage(`走进${displayName}的农舍，屋里暖洋洋的。`); }} aria-label={`进入${displayName}的农舍`}><span className="roof" /><span className={`chimney ${stoveLit ? "smoking" : ""}`}>{stoveLit && <><i /><i /><i /></>}</span><span className="wall" /><span className="door" /><span className="window" /><span className="sign">{displayName}的农舍{game.upgrades.house ? ` · 扩建 ${game.upgrades.house} 级` : ""} · 点击进入</span></button>
                {game.rockStates.map((standing, index) => <button key={`rock-${index}`} className={`farm-rock rock-${index + 1} ${standing ? "" : "broken"}`} onClick={() => breakRock(index)} aria-label={standing ? `敲碎第 ${index + 1} 块石头` : `第 ${index + 1} 处碎石`} />)}
                {game.treeStates.map((standing, index) => (
                  <button key={index} className={`tree tree-${["a", "b", "c", "d"][index]} ${standing ? "" : "stump"}`} onClick={() => chopTree(index)} aria-label={standing ? `砍伐第 ${index + 1} 棵树` : `第 ${index + 1} 个树桩`} />
                ))}
                <div className="flowers flowers-a">✿ · ✿</div><div className="flowers flowers-b">· ✿ ·</div>
                {game.crafted.chest > 0 && <button className={`crafted-object crafted-chest ${selectedResource ? "ready-to-store" : ""}`} onClick={useChest} aria-label={`木箱 ${game.crafted.chest} 个，内有萝卜 ${game.chestStorage.radish} 个、鱼 ${game.chestStorage.fish} 条`}><i /><b>{game.chestStorage.radish + game.chestStorage.fish}</b></button>}
                {game.crafted.fence > 0 && <button className="crafted-object crafted-fence" onClick={() => dismantleItem("fence")} aria-label={`木栅栏 ${game.crafted.fence} 个，使用斧头可拆除`}><i /><i /><i /><b>{game.crafted.fence}</b></button>}
                {game.crafted.scarecrow > 0 && <button className="crafted-object crafted-scarecrow" onClick={() => dismantleItem("scarecrow")} aria-label={`稻草人 ${game.crafted.scarecrow} 个，使用斧头可拆除`}><i /><span /><b>{game.crafted.scarecrow}</b></button>}

                <div className="field" aria-label="32 格农田">
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
                {activeVillage === "maple" && <button className="edge-gate village-crossing crossing-left" onClick={() => { setWorldVillage("qinghe"); setScene("eastNeighbor"); setPlayer({ x: 11, y: 5 }); setMessage("沿着左边山路回到了青禾村！"); }}><b>←</b><span>前往青禾村</span><small>一直向左走</small></button>}
              </>
            ) : scene === "town" ? (
              <>
                <div className="town-road road-horizontal" /><div className="town-road road-vertical" />
                <div className="town-square"><span>✦</span><i /><i /><i /></div>
                {currentFestival?.id === "spring" && <><div className="saturday-market" aria-label="周六春日集市"><strong>春日集市</strong><button onClick={tasteFestivalJam}>草莓果酱<small>恢复 25 体力</small></button><button onClick={() => { setFestivalDisplay("wood"); setMessage("鲁师傅把精雕细刻的木工作品摆到了展示台上。 "); }}>木工作品<small>点击看展品</small></button><button className={festivalMusicPlaying ? "music-playing" : ""} onClick={playValleyMusic}>山谷音乐<small>{festivalMusicPlaying ? "正在演奏♪" : "点击播放"}</small></button></div><div className="festival-crowd" aria-label="参加春日集市的居民">{FESTIVAL_GUESTS.map((name, index) => <button key={name} className={`crowd-person crowd-${index + 1}`} onClick={() => setMessage(`${name}：春日集市真热闹，大家都来到中心广场啦！`)}><i /><b /><span>{name}</span></button>)}</div></>}
                <div className="street-lamp lamp-one" /><div className="street-lamp lamp-two" /><div className="street-lamp lamp-three" />

                <button className="town-building supermarket" onClick={() => setActiveBuilding("supermarket")} aria-label="进入青禾超市">
                  <span className="building-roof" /><span className="building-body" /><span className="shop-awning" /><span className="building-door" /><span className="building-windows" /><strong>青禾超市</strong><small>种子 · 食品 · 日用品</small>
                </button>
                <button className="town-building townhall" onClick={() => setActiveBuilding("townhall")} aria-label="进入镇公所"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>镇公所</strong></button>
                <button className="town-building clinic" onClick={() => setActiveBuilding("clinic")} aria-label="进入青禾诊所"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>青禾诊所</strong><b>＋</b></button>
                <button className="town-building cafe" onClick={() => setActiveBuilding("cafe")} aria-label="进入麦香咖啡"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>麦香咖啡</strong></button>
                <button className="town-building workshop" onClick={() => setActiveBuilding("workshop")} aria-label="进入木匠工坊"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>木匠工坊</strong></button>
                <button className="town-building library" onClick={() => setActiveBuilding("library")} aria-label="进入山谷图书馆"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>山谷图书馆</strong></button>

                <button className="edge-gate town-exit" onClick={() => { setScene("farm"); setPlayer({ x: 11, y: 5 }); setMessage("回到农场啦。"); }} aria-label={`返回${activeVillageInfo.farm}`}>
                  <b>←</b><span>{activeVillageInfo.farm}</span><small>继续向左走</small>
                </button>
                <div className="door-prompt"><span>↑</span>走到任意建筑门口即可进入</div>
              </>
            ) : (
              <>
                <div className="neighbor-path" />
                <button className={`neighbor-house ${scene}`} onClick={() => { setNeighborInterior(scene as NeighborScene); setIndoorPlayer({ x: 31, y: 70 }); setMessage(`进入${scene === "eastNeighbor" ? "林婶的果园小屋" : scene === "southNeighbor" ? "鲁师傅的山脚院子" : "叶老师的林间书屋"}。`); }}><span className="neighbor-roof" /><span className="neighbor-wall" /><span className="neighbor-door" /><span className="neighbor-window" /><strong>{scene === "eastNeighbor" ? "林婶的果园小屋" : scene === "southNeighbor" ? "鲁师傅的山脚院子" : "叶老师的林间书屋"}<small>点击进入</small></strong></button>
                <button className={`npc-villager npc-${scene}`} onClick={() => talkToNeighbor(scene as NeighborScene)} aria-label="和居民人机说话"><i className="npc-hair" /><i className="npc-head" /><i className="npc-body" /><span>{scene === "eastNeighbor" ? "林婶" : scene === "southNeighbor" ? "鲁师傅" : "叶老师"}<small>{scene === "southNeighbor" && heldMaterial ? "点击交材料" : "点击交谈"}</small></span></button>
                <div className="neighbor-decor"><i /><i /><i /></div>
                <button className={`edge-gate neighbor-return return-${scene}`} onClick={() => { setScene("town"); setPlayer(scene === "eastNeighbor" ? { x: 11, y: 5 } : scene === "southNeighbor" ? { x: 6, y: 7 } : { x: 6, y: 0 }); setMessage("回到青禾镇中心街。"); }}><b>{scene === "eastNeighbor" ? "←" : scene === "southNeighbor" ? "↑" : "↓"}</b><span>返回青禾镇</span><small>走到边缘也能返回</small></button>
                {scene === "eastNeighbor" && activeVillage === "qinghe" && <button className="edge-gate village-crossing crossing-right" onClick={() => { setWorldVillage("maple"); setScene("farm"); setPlayer({ x: 0, y: 5 }); setMessage("沿着右边山路走到了枫叶村！"); }}><span>前往枫叶村</span><b>→</b><small>一直向右走</small></button>}
              </>
            )}

            <div className={`player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${4 + player.x * 7.7}%`, top: `${8 + player.y * 10.5}%` }} aria-label={`玩家角色，面朝${facing === "left" ? "左" : facing === "right" ? "右" : facing === "up" ? "上" : "前"}`}>
              {heldMaterial && <span className={`held-overhead held-${heldMaterial}`}>{heldMaterial === "wood" ? "木" : "石"}</span>}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} />
            </div>
            {partner?.online && partner.currentVillage === activeVillage && partner.scene === scene && <div className="online-partner" style={{ left: `${4 + partner.x * 7.7}%`, top: `${8 + partner.y * 10.5}%` }} aria-label={`${partner.playerName}也在这里`}><span>{partner.playerName}<small>朋友</small></span><i className="player-shadow" /><img src={partner.sick ? "/xiaohe-sick-sprite.png" : "/xiaohe-sprite.png"} alt="" draggable={false} /></div>}

            <div className="speech-bubble"><span>{scene === "farm" ? "☀" : "◆"}</span>{message}</div>
            <div className="movement-help"><span>WASD / 方向键</span>移动</div>

            {festivalDisplay === "wood" && (
              <div className="shop-overlay festival-exhibit-overlay" role="presentation">
                <section className="festival-exhibit" role="dialog" aria-modal="true" aria-labelledby="wood-exhibit-title"><header><div><span>木匠工坊 · 免费常设展览</span><h2 id="wood-exhibit-title">鲁师傅的木工作品</h2></div><button onClick={() => setFestivalDisplay(null)}>×</button></header><div className="wood-exhibit-stage"><i className="wood-birdhouse" /><i className="wood-horse" /><i className="wood-carving" /><span>鸟屋</span><span>小木马</span><span>山谷木雕</span></div><p>每一件作品都用青禾谷的木材手工打磨，任何一天都可以免费参观。</p><footer><button onClick={() => setFestivalDisplay(null)}>看完展品</button></footer></section>
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
                    <button className="neighbor-indoor-npc" onClick={() => talkToNeighbor(neighborInterior)}><i className="npc-hair" /><i className="npc-face" /><i className="npc-body" /><span>{neighborInterior === "eastNeighbor" ? "林婶" : neighborInterior === "southNeighbor" ? "鲁师傅" : "叶老师"}</span></button>
                    <button className="house-door neighbor-home-door" onClick={() => { setNeighborInterior(null); setBuilderOpen(false); setMessage("从居民家的门口出来了。 "); }}><span>出口</span></button>
                    <div className={`player indoor-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }}>{heldMaterial && <span className={`held-overhead held-${heldMaterial}`}>{heldMaterial === "wood" ? "木" : "石"}</span>}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
                  </div>
                  <div className="service-dialogue"><strong>{neighborInterior === "eastNeighbor" ? "林婶" : neighborInterior === "southNeighbor" ? "鲁师傅" : "叶老师"}</strong><p>{neighborInterior === "eastNeighbor" ? "欢迎来我家！桌上放着果酱和刚摘下来的草莓。" : neighborInterior === "southNeighbor" ? "把木头和石材交给我，我能帮你制作东西、扩建农舍和地盘。" : "欢迎来到林间书屋，书架上的故事都可以慢慢看。"}</p></div>
                  <div className="service-actions"><button onClick={() => talkToNeighbor(neighborInterior)}>{neighborInterior === "southNeighbor" ? (heldMaterial ? "把手里的材料交给鲁师傅" : "打开鲁师傅的委托单") : "和主人聊天"}</button><button className="exit-action" onClick={() => { setNeighborInterior(null); setBuilderOpen(false); setMessage("从居民家的门口出来了。 "); }}>从门口出去</button></div>
                  <footer><span>{message}</span><small>屋里可以移动 · 按 Esc 出去</small></footer>
                </section>
              </div>
            )}

            {builderOpen && (
              <div className={`shop-overlay builder-overlay ${neighborInterior ? "nested-house-overlay" : ""}`} role="presentation"><section className="builder-panel" role="dialog" aria-modal="true" aria-labelledby="builder-title"><header><div><span>鲁师傅的扩建委托</span><h2 id="builder-title">选择扩建项目</h2></div><button onClick={() => setBuilderOpen(false)}>×</button></header><div className="builder-supplies"><span>已经交给鲁师傅</span><strong>{game.builderSupplies.wood} 木头 · {game.builderSupplies.stone} 石材</strong><small>回到资源栏双击木头或石材，再点击鲁师傅，可以继续交材料。</small></div><div className="builder-grid"><button onClick={() => commissionBuilder("land")} disabled={Boolean(game.upgrades.land)}><b>扩大地盘</b><span>{game.upgrades.land ? "已经完成" : "12 木 · 18 石"}</span></button><button onClick={() => commissionBuilder("house")} disabled={game.upgrades.house >= 3}><b>扩大农舍</b><span>{game.upgrades.house >= 3 ? "三级扩建已经完成" : `${20 + game.upgrades.house * 10} 木 · ${12 + game.upgrades.house * 8} 石 · 安装${["暖光灯", "自动水箱", "料理台"][game.upgrades.house]}`}</span></button></div><footer><span>{message}</span><button onClick={() => setBuilderOpen(false)}>收起扩建委托</button></footer></section></div>
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
                    <article className="recipe-card"><span className="recipe-icon chest-recipe">箱</span><div><strong>木箱</strong><small>存放农具和收获</small><em>已有 {game.crafted.chest}</em></div><button onClick={() => craftItem("chest")}><span>木</span>8</button></article>
                    <article className="recipe-card"><span className="recipe-icon fence-recipe">栏</span><div><strong>木栅栏</strong><small>围出整齐的农场</small><em>已有 {game.crafted.fence}</em></div><button onClick={() => craftItem("fence")}><span>木</span>4</button></article>
                    <article className="recipe-card"><span className="recipe-icon scarecrow-recipe">田</span><div><strong>稻草人</strong><small>守护正在成长的作物</small><em>已有 {game.crafted.scarecrow}</em></div><button onClick={() => craftItem("scarecrow")}><span>木</span>12</button></article>
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
                    {game.upgrades.house >= 2 && <button className="house-equipment house-water-tank" onClick={() => { setGame((current) => ({ ...current, water: 12 })); setMessage("自动水箱把洒水壶补满了！"); playTone(620); }}><i />自动水箱</button>}
                    {game.upgrades.house >= 3 && <button className="house-equipment house-kitchen" onClick={() => { setGame((current) => ({ ...current, energy: Math.min(100, current.energy + 20) })); setMessage("在料理台吃了一份热饭，恢复 20 点体力！"); playTone(740); }}><i />料理台</button>}
                    <div className="house-rug" />
                    <button className="house-door" onClick={leaveBuilding} aria-label="点击出口离开农舍"><span>出口</span></button>
                    <div className={`player indoor-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }} aria-label="小禾站在农舍里">{heldMaterial && <span className={`held-overhead held-${heldMaterial}`}>{heldMaterial === "wood" ? "木" : "石"}</span>}<span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
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
                  <div className="shopkeeper"><div className="shopkeeper-face"><i /><b /></div><p><strong>林婶</strong>{game.day === 3 ? "种子分享日快乐！今天所有水果和蔬菜种子都免费。" : "欢迎呀，小禾！今天想带点什么回农场？"}</p><div className={`player indoor-player indoor-shop-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: "0" }}><span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div></div>
                  {game.day === 3 && <><div className="free-seed-festival"><strong>种子分享日 · 全部免费</strong><span>西瓜、番茄、土豆、南瓜、蓝莓等 8 种种子</span><button onClick={takeFreeSeedBundle}>免费领取 8 种种子大礼包</button></div><div className="shop-festival-guests" aria-label="参加种子分享日的居民">{FESTIVAL_GUESTS.map((name, index) => <button key={name} onClick={() => setMessage(`${name}：种子分享日真热闹，大家都领到了喜欢的种子！`)}><i /><b /><span>{name}</span></button>)}</div></>}
                  <div className="product-grid">
                    {CROP_TYPES.map((crop) => <article className="product-card" key={crop}><span className={`product-icon ${crop}-seeds`}>{CROP_INFO[crop].short}</span><div><strong>{CROP_INFO[crop].name}种子包</strong><small>内含 5 颗种子</small></div><button className={game.day === 3 ? "free-shop-button" : ""} onClick={() => buyItem(CROP_INFO[crop].seedField)}>{game.day === 3 ? "免费" : <><span>●</span>{CROP_INFO[crop].seedPrice}</>}</button></article>)}
                    <article className="product-card"><span className="product-icon water-drop">水</span><div><strong>水壶补给</strong><small>立刻补满 12 格水</small></div><button onClick={() => buyItem("water")}><span>●</span>25</button></article>
                    <article className="product-card"><span className="product-icon berry-bread">食</span><div><strong>莓果面包</strong><small>恢复 25 点体力</small></div><button onClick={() => buyItem("snack")}><span>●</span>45</button></article>
                    <article className="product-card"><span className="product-icon soup-bowl">汤</span><div><strong>农家蔬菜汤</strong><small>恢复 50 点体力</small></div><button onClick={() => buyItem("soup")}><span>●</span>75</button></article>
                    <article className="product-card"><span className="product-icon bait-box">饵</span><div><strong>幸运鱼饵盒</strong><small>5 份鱼饵，钓鱼收获翻倍</small></div><button onClick={() => buyItem("bait")}><span>●</span>50</button></article>
                    <article className="product-card"><span className="product-icon sapling-bag">苗</span><div><strong>青绿树苗包</strong><small>让所有树桩重新长成树</small></div><button onClick={() => buyItem("sapling")}><span>●</span>80</button></article>
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
                  <div className="interior-room" onClick={walkInsidePointer}>
                    <div className="room-window"><i /><i /></div>
                    <div className="room-rug" />
                    <div className="room-furniture"><i /><i /><i /></div>
                    <div className="npc-character"><span className="npc-hair" /><span className="npc-face" /><span className="npc-body" /></div>
                    {((activeBuilding === "cafe" && currentFestival?.id === "coffee") || (activeBuilding === "workshop" && currentFestival?.id === "craft")) && <div className={`festival-indoor-guests guests-${activeBuilding}`} aria-label={`参加${currentFestival.name}的居民`}>{FESTIVAL_GUESTS.map((name, index) => <button key={name} className={`indoor-guest guest-${index + 1}`} onClick={() => setMessage(`${name}：${currentFestival.name}真热闹，屋里坐满了村民！`)}><i /><b /><span>{name}</span></button>)}</div>}
                    <div className="interior-counter" />
                    <div className="interior-sign">{activeBuilding === "townhall" ? "公告" : activeBuilding === "clinic" ? "健康" : activeBuilding === "cafe" ? "今日菜单" : activeBuilding === "workshop" ? "制作台" : "农事图鉴"}</div>
                    <div className={`room-specials special-${activeBuilding}`}>
                      {BUILDING_ITEMS[activeBuilding].map((item) => <button type="button" key={item} onClick={() => inspectBuildingItem(item)}>{item}</button>)}
                    </div>
                    <div className={`player indoor-player facing-${facing} ${isWalking ? "walking" : ""}`} style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }} aria-label="小禾站在房子里面"><span className="player-shadow" /><span className="walking-feet"><i /><i /></span><PlayerSprite facing={facing} sick={game.sick} /></div>
                  </div>
                  <div className="service-dialogue"><strong>{BUILDING_INFO[activeBuilding].owner}</strong><p>{BUILDING_INFO[activeBuilding].greeting}</p></div>
                  {inspectedItem && (
                    <div className="inspection-card"><div><strong>{inspectedItem}</strong><p>{inspectedItem === "药品柜" ? (!game.diagnosed ? "要先接受白医生的免费检查，才能查看药品。" : game.sick ? "里面放着白医生刚配好的处方药，价格 50 金币。" : "检查结果不需要用药。") : inspectedItem === "健康档案" && !game.diagnosed ? "还没有检查结果，档案暂时是空白的。" : ITEM_DESCRIPTIONS[inspectedItem]}</p></div><button onClick={() => setInspectedItem(null)}>收起</button></div>
                  )}
                  <div className="service-actions">
                    <button onClick={() => useBuildingService(activeBuilding)}>{activeBuilding === "clinic" ? (!game.diagnosed ? "接受免费检查" : game.sick ? "购买白医生开的药 · 50 金币" : "检查结果：没有生病") : activeBuilding === "cafe" ? (currentFestival?.id === "coffee" ? "免费领取咖啡和点心" : "购买咖啡套餐 · 35 金币") : activeBuilding === "townhall" ? "查看公告栏" : activeBuilding === "workshop" ? "免费参观手工作品" : "翻阅农事图鉴"}</button>
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
                <kbd>{TOOL_INFO[tool].key}</kbd><PixelIcon type={tool} /><span>{tool === "seed" ? `${CROP_INFO[selectedCrop].name}种子` : TOOL_INFO[tool].name}</span>
                {tool === "seed" && <b>{game[CROP_INFO[selectedCrop].seedField]}</b>}
                {tool === "water" && <b>{game.water}</b>}
                {tool === "rod" && <b>{game.inventory.fish}</b>}
                {tool === "axe" && <b>{game.wood}</b>}
              </button>
            ))}
            <div className="selected-hint"><span>{scene === "farm" ? "当前" : "所在地点"}</span><strong>{scene === "farm" ? selectedResource ? `拿着${RESOURCE_INFO[selectedResource].name}` : selected === "rod" ? `鱼竿 · 鱼饵 ${game.bait}` : selected === "seed" ? `${CROP_INFO[selectedCrop].name}种子` : TOOL_INFO[selected].name : "中心街"}</strong></div>
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
