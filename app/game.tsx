"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Tool = "hoe" | "seed" | "water" | "hand" | "rod" | "axe";
type TileState = "grass" | "soil" | "crop";
type Scene = "farm" | "town";
type BuildingId = "farmhouse" | "supermarket" | "townhall" | "clinic" | "cafe" | "workshop" | "library";
type CropType = "radish" | "strawberry" | "corn";
type StorableResource = CropType | "fish";

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
  water: number;
  bait: number;
  tiles: FarmTile[];
  planted: number;
  wateredCount: number;
  harvested: number;
  fishCaught: number;
  inventory: { radish: number; strawberry: number; corn: number; fish: number };
  chestStorage: { radish: number; strawberry: number; corn: number; fish: number };
  wood: number;
  treeStates: boolean[];
  crafted: { chest: number; fence: number; scarecrow: number };
  daily: { day: number; planted: number; watered: number; harvested: number; fish: number; chopped: number; sold: number };
};

const TOOL_INFO: Record<Tool, { icon: string; name: string; key: string }> = {
  hoe: { icon: "⌁", name: "锄头", key: "1" },
  seed: { icon: "●", name: "萝卜种子", key: "2" },
  water: { icon: "◒", name: "洒水壶", key: "3" },
  hand: { icon: "✦", name: "收获", key: "4" },
  rod: { icon: "⌁", name: "鱼竿", key: "5" },
  axe: { icon: "⌂", name: "斧头", key: "6" },
};

const CROP_INFO: Record<CropType, { name: string; seedField: "seeds" | "strawberrySeeds" | "cornSeeds" }> = {
  radish: { name: "萝卜", seedField: "seeds" },
  strawberry: { name: "草莓", seedField: "strawberrySeeds" },
  corn: { name: "玉米", seedField: "cornSeeds" },
};

const RESOURCE_INFO: Record<StorableResource, { name: string; energy: number; price: number }> = {
  radish: { name: "萝卜", energy: 8, price: 65 },
  strawberry: { name: "草莓", energy: 12, price: 90 },
  corn: { name: "玉米", energy: 10, price: 80 },
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

const makeTiles = (): FarmTile[] =>
  Array.from({ length: 32 }, () => ({ state: "grass", stage: 0, watered: false }));

const makeNewGame = (): GameState => ({
  day: 1,
  hour: 6,
  coins: 280,
  energy: 100,
  seeds: 8,
  strawberrySeeds: 0,
  cornSeeds: 0,
  water: 12,
  bait: 0,
  tiles: makeTiles(),
  planted: 0,
  wateredCount: 0,
  harvested: 0,
  fishCaught: 0,
  inventory: { radish: 0, strawberry: 0, corn: 0, fish: 0 },
  chestStorage: { radish: 0, strawberry: 0, corn: 0, fish: 0 },
  wood: 0,
  treeStates: [true, true, true, true],
  crafted: { chest: 0, fence: 0, scarecrow: 0 },
  daily: { day: 1, planted: 0, watered: 0, harvested: 0, fish: 0, chopped: 0, sold: 0 },
});

function PixelIcon({ type }: { type: Tool }) {
  return <span className={`tool-symbol tool-${type}`}>{TOOL_INFO[type].icon}</span>;
}

export default function FarmGame() {
  const [game, setGame] = useState<GameState>(makeNewGame);
  const [selected, setSelected] = useState<Tool>("hoe");
  const [selectedCrop, setSelectedCrop] = useState<CropType>("radish");
  const [player, setPlayer] = useState({ x: 6, y: 5 });
  const [indoorPlayer, setIndoorPlayer] = useState({ x: 34, y: 69 });
  const [scene, setScene] = useState<Scene>("farm");
  const [activeBuilding, setActiveBuilding] = useState<BuildingId | null>(null);
  const [isFishing, setIsFishing] = useState(false);
  const [craftingOpen, setCraftingOpen] = useState(false);
  const [chestOpen, setChestOpen] = useState(false);
  const [stoveLit, setStoveLit] = useState(false);
  const [selectedResource, setSelectedResource] = useState<StorableResource | null>(null);
  const [message, setMessage] = useState("先用锄头开垦一块土地吧！");
  const [soundOn, setSoundOn] = useState(true);
  const [ready, setReady] = useState(false);
  const eatTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("qinghe-farm-save");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GameState;
        if (parsed.tiles?.length === 32) {
          const defaults = makeNewGame();
          setGame({
            ...defaults,
            ...parsed,
            strawberrySeeds: parsed.strawberrySeeds ?? 0,
            cornSeeds: parsed.cornSeeds ?? 0,
            bait: parsed.bait ?? 0,
            fishCaught: parsed.fishCaught ?? 0,
            inventory: { ...defaults.inventory, ...(parsed.inventory ?? { radish: parsed.harvested ?? 0, fish: parsed.fishCaught ?? 0 }) },
            chestStorage: { ...defaults.chestStorage, ...(parsed.chestStorage ?? {}) },
            wood: parsed.wood ?? 0,
            treeStates: parsed.treeStates?.length === 4 ? parsed.treeStates : defaults.treeStates,
            crafted: { ...defaults.crafted, ...(parsed.crafted ?? {}) },
            daily: parsed.daily?.day === parsed.day ? parsed.daily : { ...defaults.daily, day: parsed.day ?? 1 },
          });
        }
      } catch {
        localStorage.removeItem("qinghe-farm-save");
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("qinghe-farm-save", JSON.stringify(game));
  }, [game, ready]);

  useEffect(() => {
    if (!ready) return;
    const clock = window.setInterval(() => {
      setGame((current) => current.hour >= 23.5
        ? { ...current, day: current.day === 28 ? 1 : current.day + 1, hour: 0, daily: { ...makeNewGame().daily, day: current.day === 28 ? 1 : current.day + 1 } }
        : { ...current, hour: current.hour + 1 });
    }, 30_000);
    return () => window.clearInterval(clock);
  }, [ready]);

  useEffect(() => () => {
    if (eatTimerRef.current) window.clearTimeout(eatTimerRef.current);
  }, []);

  const move = useCallback((dx: number, dy: number) => {
    if (craftingOpen || chestOpen) return;
    if (activeBuilding === "farmhouse") {
      setIndoorPlayer((current) => ({
        x: Math.max(26, Math.min(76, current.x + dx * 5)),
        y: Math.max(65, Math.min(74, current.y + dy * 4)),
      }));
      setMessage("小禾在屋里的木地板上走动。");
      return;
    }
    if (activeBuilding) return;

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
  }, [activeBuilding, chestOpen, craftingOpen, player, scene]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
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
  }, [activeBuilding, chestOpen, craftingOpen, move]);

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
    setGame((current) => ({ ...current, bait: baitUsed ? current.bait - 1 : current.bait, energy: current.energy - 5, hour: Math.min(24, current.hour + 1) }));
    playTone(390);

    window.setTimeout(() => {
      const catches = [
        { name: "银鳞鲫", coins: 32 },
        { name: "春溪鳟", coins: 48 },
        { name: "花尾鲤", coins: 40 },
        { name: "小泥鳅", coins: 24 },
      ];
      const caught = catches[Math.floor(Math.random() * catches.length)];
      const amount = baitUsed ? 2 : 1;
      setGame((current) => ({
        ...current,
        fishCaught: current.fishCaught + amount,
        inventory: { ...current.inventory, fish: current.inventory.fish + amount },
        daily: { ...current.daily, fish: current.daily.fish + amount },
      }));
      setMessage(`钓到${caught.name}！鱼获 +${amount}${baitUsed ? "，鱼饵让收获翻倍" : ""}，已经放进背包。`);
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
      hour: Math.min(24, current.hour + 1),
      wood: current.wood + 4,
      treeStates: current.treeStates.map((tree, treeIndex) => treeIndex === index ? false : tree),
      daily: { ...current.daily, chopped: current.daily.chopped + 1 },
    }));
    setMessage("砍下树木，获得 4 块木头！点击左上角“制作”使用木头。");
    playTone(330);
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
      inventory: { radish: 0, strawberry: 0, corn: 0, fish: 0 },
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

  const buyItem = (item: "seeds" | "strawberrySeeds" | "cornSeeds" | "water" | "snack" | "soup" | "bait" | "sapling") => {
    const details = {
      seeds: { price: 60, success: "买到 5 颗萝卜种子！", tone: 660 },
      strawberrySeeds: { price: 90, success: "买到 5 颗草莓种子！在种子工具上再次点击即可切换。", tone: 720 },
      cornSeeds: { price: 110, success: "买到 5 颗玉米种子！在种子工具上再次点击即可切换。", tone: 680 },
      water: { price: 25, success: "水壶重新装满了！", tone: 580 },
      snack: { price: 45, success: "吃下莓果面包，恢复 25 点体力！", tone: 720 },
      soup: { price: 75, success: "喝下热腾腾的蔬菜汤，恢复 50 点体力！", tone: 760 },
      bait: { price: 50, success: "买到 5 份幸运鱼饵，下次钓鱼收获翻倍！", tone: 700 },
      sapling: { price: 80, success: "树苗种下了，农场里的树桩重新长成树！", tone: 620 },
    }[item];

    if (game.coins < details.price) {
      setMessage("金币不够，再去收获一些作物吧。");
      playTone(220);
      return;
    }

    setGame((current) => ({
      ...current,
      coins: current.coins - details.price,
      seeds: item === "seeds" ? current.seeds + 5 : current.seeds,
      strawberrySeeds: item === "strawberrySeeds" ? current.strawberrySeeds + 5 : current.strawberrySeeds,
      cornSeeds: item === "cornSeeds" ? current.cornSeeds + 5 : current.cornSeeds,
      water: item === "water" ? 12 : current.water,
      bait: item === "bait" ? current.bait + 5 : current.bait,
      treeStates: item === "sapling" ? current.treeStates.map(() => true) : current.treeStates,
      energy: item === "snack" ? Math.min(100, current.energy + 25) : item === "soup" ? Math.min(100, current.energy + 50) : current.energy,
    }));
    setMessage(details.success);
    playTone(details.tone);
  };

  const leaveBuilding = () => {
    if (!activeBuilding) return;
    const building = BUILDING_INFO[activeBuilding];
    setActiveBuilding(null);
    setPlayer(building.exit);
    setMessage(`离开${building.name}。沿着左边道路可以回农场。`);
  };

  const returnToFarm = () => {
    setActiveBuilding(null);
    setCraftingOpen(false);
    setChestOpen(false);
    setScene("farm");
    setPlayer({ x: 10, y: 5 });
    setMessage("已经安全回到农场，原来的进度都还在。");
  };

  const useBuildingService = (building: Exclude<BuildingId, "supermarket" | "farmhouse">) => {
    if (building === "clinic") {
      setGame((current) => ({ ...current, energy: 100 }));
      setMessage("白医生帮你恢复了全部体力。今天也要量力而行！");
      playTone(680);
    } else if (building === "cafe") {
      if (game.coins < 35) {
        setMessage("一份咖啡套餐需要 35 金币。");
        playTone(220);
        return;
      }
      setGame((current) => ({ ...current, coins: current.coins - 35, energy: Math.min(100, current.energy + 25) }));
      setMessage("享用麦香咖啡套餐，恢复 25 点体力！");
      playTone(720);
    } else if (building === "townhall") {
      setMessage("公告栏：本周六将在中心广场举办春日集市。");
      playTone(520);
    } else if (building === "workshop") {
      setMessage("鲁师傅：以后带来木材和石头，就能扩建农舍与仓库。");
      playTone(440);
    } else {
      setMessage("农事图鉴：萝卜连续浇水三天即可成熟，晴天也不能偷懒哦。");
      playTone(600);
    }
  };

  const nextDay = () => {
    setGame((current) => {
      const treeStates = [...current.treeStates];
      const emptySpot = treeStates.indexOf(false);
      if (emptySpot >= 0) treeStates[emptySpot] = true;
      return {
        ...current,
        day: current.day === 28 ? 1 : current.day + 1,
        hour: 6,
        daily: { ...makeNewGame().daily, day: current.day === 28 ? 1 : current.day + 1 },
        energy: 100,
        water: 12,
        treeStates,
        tiles: current.tiles.map((tile) =>
          tile.state === "crop"
            ? { ...tile, stage: tile.watered ? Math.min(3, tile.stage + 1) : tile.stage, watered: false }
            : tile,
        ),
      };
    });
    setMessage("新的一天！浇过水的作物长大了，也有一棵树重新长出。");
    playTone(540);
  };

  const sleepAtHome = () => {
    nextDay();
    setActiveBuilding(null);
    setPlayer(BUILDING_INFO.farmhouse.exit);
    setMessage("在温暖的农舍睡了一觉。早安，新的一天开始啦！");
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
    localStorage.setItem("qinghe-farm-save", JSON.stringify(fresh));
  };

  const chooseTool = (tool: Tool) => {
    setSelectedResource(null);
    if (tool === "seed" && selected === "seed") {
      const crops: CropType[] = ["radish", "strawberry", "corn"];
      const nextCrop = crops[(crops.indexOf(selectedCrop) + 1) % crops.length];
      setSelectedCrop(nextCrop);
      setMessage(`已切换为${CROP_INFO[nextCrop].name}种子，再点一次可以继续切换。`);
      playTone(560);
      return;
    }
    setSelected(tool);
  };

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

  return (
    <main className="game-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <div><strong>青禾谷</strong><span>GREENFIELD VALLEY</span></div>
        </div>
        <div className="day-card">
          <span className="season-dot">春</span>
          <div><strong>第 {game.day} 天 · 周一</strong><span>{String(clockHour).padStart(2, "0")}:{String(clockMinute).padStart(2, "0")}</span></div>
        </div>
        <div className="top-stats">
          <div className={`weather ${isNight ? "night-weather" : ""}`}><span className={isNight ? "moon-icon" : "sun-icon"} />{isNight ? "月夜" : "晴朗"} <small>{isNight ? "12°C" : "18°C"}</small></div>
          <div className="coins"><span>●</span>{game.coins.toLocaleString()}</div>
          <button className="round-button home-button" onClick={returnToFarm} aria-label="回到农场" title="回到农场">⌂</button>
          <button className="round-button" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "关闭音效" : "打开音效"}>{soundOn ? "♪" : "×"}</button>
          <button className="round-button" onClick={resetGame} aria-label="重新开始">↻</button>
        </div>
      </header>

      <section className="game-layout">
        <aside className="side-panel">
          <div className="portrait-card">
            <div className="portrait"><img src="/xiaohe-sprite.png" alt="小禾" draggable={false} /></div>
            <div><span>新手农夫</span><strong>小禾</strong></div>
          </div>
          <div className="meter-block">
            <div className="meter-label"><span>体力</span><b>{game.energy}/100</b></div>
            <div className="meter"><i style={{ width: `${game.energy}%` }} /></div>
          </div>
          <div className="harvest-log">
            <div className="section-title"><span>资源记录</span><button className="auto-sell-button" onClick={sellBackpack}>自动售卖</button></div>
            <div className="harvest-items">
              <button className={selectedResource === "radish" ? "resource-item selected" : "resource-item"} onClick={() => clickResource("radish")} onPointerDown={() => startEating("radish")} onPointerUp={stopEating} onPointerCancel={stopEating} onPointerLeave={stopEating} onContextMenu={(event) => event.preventDefault()} aria-pressed={selectedResource === "radish"} aria-label={`萝卜 ${game.inventory.radish} 个，轻点拿起，长按食用`} title="轻点拿起，长按吃掉"><span className="harvest-icon radish-icon">萝</span><p>萝卜<strong>{game.inventory.radish}</strong><small>长按吃</small></p></button>
              <button className={selectedResource === "strawberry" ? "resource-item selected" : "resource-item"} onClick={() => clickResource("strawberry")} onPointerDown={() => startEating("strawberry")} onPointerUp={stopEating} onPointerCancel={stopEating} onPointerLeave={stopEating} onContextMenu={(event) => event.preventDefault()} aria-pressed={selectedResource === "strawberry"} aria-label={`草莓 ${game.inventory.strawberry} 个，轻点拿起，长按食用`} title="轻点拿起，长按吃掉"><span className="harvest-icon strawberry-icon">莓</span><p>草莓<strong>{game.inventory.strawberry}</strong><small>长按吃</small></p></button>
              <button className={selectedResource === "corn" ? "resource-item selected" : "resource-item"} onClick={() => clickResource("corn")} onPointerDown={() => startEating("corn")} onPointerUp={stopEating} onPointerCancel={stopEating} onPointerLeave={stopEating} onContextMenu={(event) => event.preventDefault()} aria-pressed={selectedResource === "corn"} aria-label={`玉米 ${game.inventory.corn} 个，轻点拿起，长按食用`} title="轻点拿起，长按吃掉"><span className="harvest-icon corn-icon">玉</span><p>玉米<strong>{game.inventory.corn}</strong><small>长按吃</small></p></button>
              <button className={selectedResource === "fish" ? "resource-item selected" : "resource-item"} onClick={() => clickResource("fish")} onPointerDown={() => startEating("fish")} onPointerUp={stopEating} onPointerCancel={stopEating} onPointerLeave={stopEating} onContextMenu={(event) => event.preventDefault()} aria-pressed={selectedResource === "fish"} aria-label={`鱼 ${game.inventory.fish} 条，轻点拿起，长按食用`} title="轻点拿起，长按吃掉"><span className="harvest-icon fish-icon">鱼</span><p>鱼获<strong>{game.inventory.fish}</strong><small>长按吃</small></p></button>
              <div><span className="harvest-icon wood-icon">木</span><p>木头<strong>{game.wood}</strong></p></div>
            </div>
          </div>
          <div className="task-card">
            <div className="section-title"><span>今日小目标</span><b>{completed}/3</b></div>
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

        <section className="world-card" aria-label={scene === "farm" ? "青禾谷农场游戏区域" : "青禾镇游戏区域"}>
          <div className={`world ${scene === "town" ? "town-world" : "farm-world"} ${twilightLevel > 0 ? "twilight-world" : ""}`} style={{ "--twilight": twilightLevel } as CSSProperties}>
            <div className="location-chip"><span>{scene === "farm" ? "⌂" : "◆"}</span>{scene === "farm" ? "青禾农场" : "青禾镇 · 中心街"}</div>
            <button className="craft-button" onClick={() => { setCraftingOpen(true); setMessage("打开制作手册，选择想做的东西。"); }} aria-label="打开制作菜单"><span>⚒</span><strong>制作</strong><b>{game.wood} 木</b></button>
            <div className="cloud cloud-one" /><div className="cloud cloud-two" />
            <div className="mountain mountain-one" /><div className="mountain mountain-two" />
            {twilightLevel > 0 && <div className="night-sky" aria-hidden="true"><span className="moon" /><i /><i /><i /><i /><i /><i /></div>}
            {twilightLevel > 0 && <div className="twilight-layer" aria-hidden="true" />}

            {scene === "farm" ? (
              <>
                <div className="path path-one" /><div className="path path-two" />
                <button className={`pond ${isFishing ? "fishing" : ""}`} onClick={castLine} aria-label="在钓鱼池钓鱼">
                  <i /><i /><i /><b className="fishing-float" /><span className="pond-label">钓鱼池</span>
                </button>
                <button className={`house ${isNight ? "night-house" : ""} ${isNight && stoveLit ? "fire-lit-house" : ""}`} onClick={() => { setActiveBuilding("farmhouse"); setMessage("走进小禾农舍，屋里暖洋洋的。"); }} aria-label="进入小禾农舍"><span className="roof" /><span className={`chimney ${stoveLit ? "smoking" : ""}`}>{stoveLit && <><i /><i /><i /></>}</span><span className="wall" /><span className="door" /><span className="window" /><span className="sign">小禾农舍 · 点击进入</span></button>
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

                <button className="edge-gate farm-exit" onClick={() => { setScene("town"); setPlayer({ x: 0, y: 5 }); setMessage("欢迎来到青禾镇！超市在左上方。"); }} aria-label="前往青禾镇">
                  <span>青禾镇</span><b>→</b><small>继续向右走</small>
                </button>
              </>
            ) : (
              <>
                <div className="town-road road-horizontal" /><div className="town-road road-vertical" />
                <div className="town-square"><span>✦</span><i /><i /><i /></div>
                <div className="street-lamp lamp-one" /><div className="street-lamp lamp-two" /><div className="street-lamp lamp-three" />

                <button className="town-building supermarket" onClick={() => setActiveBuilding("supermarket")} aria-label="进入青禾超市">
                  <span className="building-roof" /><span className="building-body" /><span className="shop-awning" /><span className="building-door" /><span className="building-windows" /><strong>青禾超市</strong><small>种子 · 食品 · 日用品</small>
                </button>
                <button className="town-building townhall" onClick={() => setActiveBuilding("townhall")} aria-label="进入镇公所"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>镇公所</strong></button>
                <button className="town-building clinic" onClick={() => setActiveBuilding("clinic")} aria-label="进入青禾诊所"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>青禾诊所</strong><b>＋</b></button>
                <button className="town-building cafe" onClick={() => setActiveBuilding("cafe")} aria-label="进入麦香咖啡"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>麦香咖啡</strong></button>
                <button className="town-building workshop" onClick={() => setActiveBuilding("workshop")} aria-label="进入木匠工坊"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>木匠工坊</strong></button>
                <button className="town-building library" onClick={() => setActiveBuilding("library")} aria-label="进入山谷图书馆"><span className="building-roof" /><span className="building-body" /><span className="building-door" /><span className="building-windows" /><strong>山谷图书馆</strong></button>

                <button className="edge-gate town-exit" onClick={() => { setScene("farm"); setPlayer({ x: 11, y: 5 }); setMessage("回到农场啦。"); }} aria-label="返回农场">
                  <b>←</b><span>青禾农场</span><small>继续向左走</small>
                </button>
                <div className="door-prompt"><span>↑</span>走到任意建筑门口即可进入</div>
              </>
            )}

            <div className="player" style={{ left: `${4 + player.x * 7.7}%`, top: `${8 + player.y * 10.5}%` }} aria-label="玩家角色">
              <span className="player-shadow" /><img src="/xiaohe-sprite.png" alt="" draggable={false} />
            </div>

            <div className="speech-bubble"><span>{scene === "farm" ? "☀" : "◆"}</span>{message}</div>
            <div className="movement-help"><span>WASD / 方向键</span>移动</div>

            {craftingOpen && (
              <div className="shop-overlay" role="presentation">
                <section className="craft-panel" role="dialog" aria-modal="true" aria-labelledby="craft-title">
                  <header><div><span>农场手作</span><h2 id="craft-title">制作手册</h2></div><div className="wood-wallet"><small>现有木头</small><strong>{game.wood} 块</strong></div><button onClick={() => setCraftingOpen(false)} aria-label="关闭制作菜单">×</button></header>
                  <div className="craft-intro"><span>⚒</span><p><strong>把木头变成有用的农场设施</strong>选择配方即可制作，成品会放在农场里。</p></div>
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
                    <article className="product-card"><span className="product-icon radish-icon">萝</span><div><strong>萝卜</strong><small>箱内有 {game.chestStorage.radish} 个</small></div><button disabled={game.chestStorage.radish <= 0} onClick={() => takeFromChest("radish")}>取出 1 个</button></article>
                    <article className="product-card"><span className="product-icon strawberry-icon">莓</span><div><strong>草莓</strong><small>箱内有 {game.chestStorage.strawberry} 个</small></div><button disabled={game.chestStorage.strawberry <= 0} onClick={() => takeFromChest("strawberry")}>取出 1 个</button></article>
                    <article className="product-card"><span className="product-icon corn-icon">玉</span><div><strong>玉米</strong><small>箱内有 {game.chestStorage.corn} 个</small></div><button disabled={game.chestStorage.corn <= 0} onClick={() => takeFromChest("corn")}>取出 1 个</button></article>
                    <article className="product-card"><span className="product-icon fish-icon">鱼</span><div><strong>鱼获</strong><small>箱内有 {game.chestStorage.fish} 条</small></div><button disabled={game.chestStorage.fish <= 0} onClick={() => takeFromChest("fish")}>取出 1 条</button></article>
                  </div>
                  <footer><span>{message}</span><button onClick={() => setChestOpen(false)}>关上木箱</button></footer>
                </section>
              </div>
            )}

            {activeBuilding === "farmhouse" && (
              <div className="shop-overlay interior-farmhouse" role="presentation">
                <section className="service-panel farmhouse-panel" role="dialog" aria-modal="true" aria-labelledby="farmhouse-title">
                  <header><div><span>青禾农场室内</span><h2 id="farmhouse-title">小禾农舍</h2></div><button onClick={leaveBuilding} aria-label="离开小禾农舍">×</button></header>
                  <div className={`interior-room farmhouse-room ${isNight ? "night-room" : ""} ${isNight && stoveLit ? "stove-lit-room" : ""}`}>
                    <div className="room-window"><i /><i /></div>
                    <button className="house-bed" onClick={sleepAtHome} aria-label="点击床睡到第二天"><i /><b /><span>点击睡觉</span></button>
                    <div className="house-table"><i /><i /></div>
                    <button className={`house-stove ${stoveLit ? "lit" : ""}`} onClick={() => { setStoveLit((lit) => !lit); setMessage(stoveLit ? "把炉火熄灭了。" : "炉灶点着了，屋里暖和起来！"); playTone(stoveLit ? 300 : 660); }} aria-pressed={stoveLit} aria-label={stoveLit ? "熄灭炉灶" : "点燃炉灶"}><i /><b /><span /></button>
                    <div className="house-rug" />
                    <button className="house-door" onClick={leaveBuilding} aria-label="点击出口离开农舍"><span>出口</span></button>
                    <div className="player indoor-player" style={{ left: `${indoorPlayer.x}%`, top: `${indoorPlayer.y}%` }} aria-label="小禾站在农舍里"><span className="player-shadow" /><img src="/xiaohe-sprite.png" alt="" draggable={false} /></div>
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
                  <div className="shopkeeper"><div className="shopkeeper-face"><i /><b /></div><p><strong>林婶</strong>欢迎呀，小禾！今天想带点什么回农场？</p></div>
                  <div className="product-grid">
                    <article className="product-card"><span className="product-icon seed-bag">种</span><div><strong>萝卜种子包</strong><small>内含 5 颗春季种子</small></div><button onClick={() => buyItem("seeds")}><span>●</span>60</button></article>
                    <article className="product-card"><span className="product-icon strawberry-seeds">莓</span><div><strong>草莓种子包</strong><small>内含 5 颗甜草莓种子</small></div><button onClick={() => buyItem("strawberrySeeds")}><span>●</span>90</button></article>
                    <article className="product-card"><span className="product-icon corn-seeds">玉</span><div><strong>玉米种子包</strong><small>内含 5 颗金黄玉米种子</small></div><button onClick={() => buyItem("cornSeeds")}><span>●</span>110</button></article>
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
                  <div className="interior-room">
                    <div className="room-window"><i /><i /></div>
                    <div className="room-rug" />
                    <div className="room-furniture"><i /><i /><i /></div>
                    <div className="npc-character"><span className="npc-hair" /><span className="npc-face" /><span className="npc-body" /></div>
                    <div className="interior-counter" />
                    <div className="interior-sign">{activeBuilding === "townhall" ? "公告" : activeBuilding === "clinic" ? "健康" : activeBuilding === "cafe" ? "今日菜单" : activeBuilding === "workshop" ? "制作台" : "农事图鉴"}</div>
                  </div>
                  <div className="service-dialogue"><strong>{BUILDING_INFO[activeBuilding].owner}</strong><p>{BUILDING_INFO[activeBuilding].greeting}</p></div>
                  <div className="service-actions">
                    <button onClick={() => useBuildingService(activeBuilding)}>{activeBuilding === "clinic" ? "接受健康检查" : activeBuilding === "cafe" ? "购买咖啡套餐 · 35 金币" : activeBuilding === "townhall" ? "查看公告栏" : activeBuilding === "workshop" ? "询问扩建计划" : "翻阅农事图鉴"}</button>
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
