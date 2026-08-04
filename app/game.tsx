"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Tool = "hoe" | "seed" | "water" | "hand" | "rod";
type TileState = "grass" | "soil" | "crop";
type Scene = "farm" | "town";
type BuildingId = "supermarket" | "townhall" | "clinic" | "cafe" | "workshop" | "library";

type FarmTile = {
  state: TileState;
  stage: number;
  watered: boolean;
};

type GameState = {
  day: number;
  hour: number;
  coins: number;
  energy: number;
  seeds: number;
  water: number;
  tiles: FarmTile[];
  planted: number;
  wateredCount: number;
  harvested: number;
  fishCaught: number;
};

const TOOL_INFO: Record<Tool, { icon: string; name: string; key: string }> = {
  hoe: { icon: "⌁", name: "锄头", key: "1" },
  seed: { icon: "●", name: "萝卜种子", key: "2" },
  water: { icon: "◒", name: "洒水壶", key: "3" },
  hand: { icon: "✦", name: "收获", key: "4" },
  rod: { icon: "⌁", name: "鱼竿", key: "5" },
};

const BUILDING_INFO: Record<BuildingId, { name: string; owner: string; greeting: string; exit: { x: number; y: number } }> = {
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
  water: 12,
  tiles: makeTiles(),
  planted: 0,
  wateredCount: 0,
  harvested: 0,
  fishCaught: 0,
});

function PixelIcon({ type }: { type: Tool }) {
  return <span className={`tool-symbol tool-${type}`}>{TOOL_INFO[type].icon}</span>;
}

export default function FarmGame() {
  const [game, setGame] = useState<GameState>(makeNewGame);
  const [selected, setSelected] = useState<Tool>("hoe");
  const [player, setPlayer] = useState({ x: 6, y: 5 });
  const [scene, setScene] = useState<Scene>("farm");
  const [activeBuilding, setActiveBuilding] = useState<BuildingId | null>(null);
  const [isFishing, setIsFishing] = useState(false);
  const [message, setMessage] = useState("先用锄头开垦一块土地吧！");
  const [soundOn, setSoundOn] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("qinghe-farm-save");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GameState;
        if (parsed.tiles?.length === 32) {
          setGame({ ...makeNewGame(), ...parsed, fishCaught: parsed.fishCaught ?? 0 });
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

  const move = useCallback((dx: number, dy: number) => {
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
  }, [activeBuilding, player, scene]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
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
      if (key === "1") setSelected("hoe");
      if (key === "2") setSelected("seed");
      if (key === "3") setSelected("water");
      if (key === "4") setSelected("hand");
      if (key === "5") setSelected("rod");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeBuilding, move]);

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
    setMessage("浮标落入水中……耐心等鱼儿上钩。");
    setGame((current) => ({ ...current, energy: current.energy - 5, hour: Math.min(24, current.hour + 1) }));
    playTone(390);

    window.setTimeout(() => {
      const catches = [
        { name: "银鳞鲫", coins: 32 },
        { name: "春溪鳟", coins: 48 },
        { name: "花尾鲤", coins: 40 },
        { name: "小泥鳅", coins: 24 },
      ];
      const caught = catches[Math.floor(Math.random() * catches.length)];
      setGame((current) => ({ ...current, coins: current.coins + caught.coins, fishCaught: current.fishCaught + 1 }));
      setMessage(`钓到${caught.name}！鱼获 +1，卖出获得 ${caught.coins} 金币。`);
      setIsFishing(false);
      playTone(780);
    }, 1100);
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
        if (current.seeds <= 0) {
          feedback = "种子用完啦，收获后会补充新种子。";
          return current;
        }
        if (tile.state !== "soil") {
          feedback = "种子只能播在松好的土地里。";
          return current;
        }
        target.state = "crop";
        target.stage = 0;
        target.watered = false;
        next.seeds -= 1;
        next.energy = Math.max(0, current.energy - 2);
        next.planted += 1;
        feedback = "小小的种子睡进土里了。记得浇水！";
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
        next.coins += 65;
        next.seeds += 2;
        next.energy = Math.max(0, current.energy - 1);
        next.harvested += 1;
        feedback = "收获一颗脆甜萝卜！+65 金币、+2 种子";
        tone = 760;
      } else {
        feedback = "鱼竿要在左侧的钓鱼池使用。";
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

  const buyItem = (item: "seeds" | "water" | "snack") => {
    const details = {
      seeds: { price: 60, success: "买到 5 颗萝卜种子！", tone: 660 },
      water: { price: 25, success: "水壶重新装满了！", tone: 580 },
      snack: { price: 45, success: "吃下莓果面包，恢复 25 点体力！", tone: 720 },
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
      water: item === "water" ? 12 : current.water,
      energy: item === "snack" ? Math.min(100, current.energy + 25) : current.energy,
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
    setScene("farm");
    setPlayer({ x: 10, y: 5 });
    setMessage("已经安全回到农场，原来的进度都还在。");
  };

  const useBuildingService = (building: Exclude<BuildingId, "supermarket">) => {
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
    setGame((current) => ({
      ...current,
      day: current.day === 28 ? 1 : current.day + 1,
      hour: 6,
      energy: 100,
      water: 12,
      tiles: current.tiles.map((tile) =>
        tile.state === "crop"
          ? { ...tile, stage: tile.watered ? Math.min(3, tile.stage + 1) : tile.stage, watered: false }
          : tile,
      ),
    }));
    setMessage("新的一天！浇过水的作物长大了。");
    playTone(540);
  };

  const resetGame = () => {
    if (!window.confirm("要清空当前进度，重新开始吗？")) return;
    const fresh = makeNewGame();
    setGame(fresh);
    setSelected("hoe");
    setPlayer({ x: 6, y: 5 });
    setScene("farm");
    setActiveBuilding(null);
    setIsFishing(false);
    setMessage("新的农场生活开始了！");
    localStorage.setItem("qinghe-farm-save", JSON.stringify(fresh));
  };

  const tasks = useMemo(
    () => [
      { label: "播下第一颗种子", done: game.planted > 0 },
      { label: "给作物浇一次水", done: game.wateredCount > 0 },
      { label: "收获一颗萝卜", done: game.harvested > 0 },
    ],
    [game],
  );

  const completed = tasks.filter((task) => task.done).length;

  return (
    <main className="game-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <div><strong>青禾谷</strong><span>GREENFIELD VALLEY</span></div>
        </div>
        <div className="day-card">
          <span className="season-dot">春</span>
          <div><strong>第 {game.day} 天 · 周一</strong><span>{String(game.hour).padStart(2, "0")}:00</span></div>
        </div>
        <div className="top-stats">
          <div className="weather"><span className="sun-icon" />晴朗 <small>18°C</small></div>
          <div className="coins"><span>●</span>{game.coins.toLocaleString()}</div>
          <button className="round-button home-button" onClick={returnToFarm} aria-label="回到农场" title="回到农场">⌂</button>
          <button className="round-button" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "关闭音效" : "打开音效"}>{soundOn ? "♪" : "×"}</button>
          <button className="round-button" onClick={resetGame} aria-label="重新开始">↻</button>
        </div>
      </header>

      <section className="game-layout">
        <aside className="side-panel">
          <div className="portrait-card">
            <div className="portrait"><span className="hair" /><span className="face" /><span className="shirt" /></div>
            <div><span>新手农夫</span><strong>小禾</strong></div>
          </div>
          <div className="meter-block">
            <div className="meter-label"><span>体力</span><b>{game.energy}/100</b></div>
            <div className="meter"><i style={{ width: `${game.energy}%` }} /></div>
          </div>
          <div className="harvest-log">
            <div className="section-title"><span>收获记录</span><b>自动出售</b></div>
            <div className="harvest-items">
              <div><span className="harvest-icon radish-icon">萝</span><p>萝卜<strong>{game.harvested}</strong></p></div>
              <div><span className="harvest-icon fish-icon">鱼</span><p>鱼获<strong>{game.fishCaught}</strong></p></div>
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
          <div className="tip-card"><span>?</span><p><strong>{scene === "farm" ? "农场小贴士" : "小镇指南"}</strong>{scene === "farm" ? "选择鱼竿后点击左侧钓鱼池即可钓鱼。走到最右边可以前往小镇。" : "每栋建筑都能进入；走到门口或直接点击建筑。"}</p></div>
          <button className="sleep-button" onClick={nextDay}><span>☾</span><div><strong>结束今天</strong><small>回家睡一觉</small></div><b>›</b></button>
        </aside>

        <section className="world-card" aria-label={scene === "farm" ? "青禾谷农场游戏区域" : "青禾镇游戏区域"}>
          <div className={`world ${scene === "town" ? "town-world" : "farm-world"}`}>
            <div className="location-chip"><span>{scene === "farm" ? "⌂" : "◆"}</span>{scene === "farm" ? "青禾农场" : "青禾镇 · 中心街"}</div>
            <div className="cloud cloud-one" /><div className="cloud cloud-two" />
            <div className="mountain mountain-one" /><div className="mountain mountain-two" />

            {scene === "farm" ? (
              <>
                <div className="path path-one" /><div className="path path-two" />
                <button className={`pond ${isFishing ? "fishing" : ""}`} onClick={castLine} aria-label="在钓鱼池钓鱼">
                  <i /><i /><i /><b className="fishing-float" /><span className="pond-label">钓鱼池</span>
                </button>
                <div className="house"><span className="roof" /><span className="chimney" /><span className="wall" /><span className="door" /><span className="window" /><span className="sign">小禾农舍</span></div>
                <div className="tree tree-a" /><div className="tree tree-b" /><div className="tree tree-c" /><div className="tree tree-d" />
                <div className="flowers flowers-a">✿ · ✿</div><div className="flowers flowers-b">· ✿ ·</div>

                <div className="field" aria-label="32 格农田">
                  {game.tiles.map((tile, index) => (
                    <button
                      key={index}
                      className={`farm-tile ${tile.state} ${tile.watered ? "watered" : ""}`}
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
              <span className="player-shadow" /><span className="player-hat" /><span className="player-head" /><span className="player-body" /><span className="player-legs" />
            </div>

            <div className="speech-bubble"><span>{scene === "farm" ? "☀" : "◆"}</span>{message}</div>
            <div className="movement-help"><span>WASD / 方向键</span>移动</div>

            {activeBuilding === "supermarket" && (
              <div className="shop-overlay" role="presentation">
                <section className="shop-panel" role="dialog" aria-modal="true" aria-labelledby="shop-title">
                  <header><div><span>青禾镇杂货</span><h2 id="shop-title">青禾超市</h2></div><div className="shop-wallet"><small>你的金币</small><strong>● {game.coins}</strong></div><button onClick={leaveBuilding} aria-label="离开商店">×</button></header>
                  <div className="shopkeeper"><div className="shopkeeper-face"><i /><b /></div><p><strong>林婶</strong>欢迎呀，小禾！今天想带点什么回农场？</p></div>
                  <div className="product-grid">
                    <article className="product-card"><span className="product-icon seed-bag">种</span><div><strong>萝卜种子包</strong><small>内含 5 颗春季种子</small></div><button onClick={() => buyItem("seeds")}><span>●</span>60</button></article>
                    <article className="product-card"><span className="product-icon water-drop">水</span><div><strong>水壶补给</strong><small>立刻补满 12 格水</small></div><button onClick={() => buyItem("water")}><span>●</span>25</button></article>
                    <article className="product-card"><span className="product-icon berry-bread">食</span><div><strong>莓果面包</strong><small>恢复 25 点体力</small></div><button onClick={() => buyItem("snack")}><span>●</span>45</button></article>
                  </div>
                  <footer><span>{message}　按 Esc 也可以离开</span><button onClick={leaveBuilding}>从门口出去</button></footer>
                </section>
              </div>
            )}

            {activeBuilding && activeBuilding !== "supermarket" && (
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
              <button key={tool} className={selected === tool ? "tool-button selected" : "tool-button"} onClick={() => setSelected(tool)} aria-pressed={selected === tool}>
                <kbd>{TOOL_INFO[tool].key}</kbd><PixelIcon type={tool} /><span>{TOOL_INFO[tool].name}</span>
                {tool === "seed" && <b>{game.seeds}</b>}
                {tool === "water" && <b>{game.water}</b>}
                {tool === "rod" && <b>{game.fishCaught}</b>}
              </button>
            ))}
            <div className="selected-hint"><span>{scene === "farm" ? "当前" : "所在地点"}</span><strong>{scene === "farm" ? TOOL_INFO[selected].name : "中心街"}</strong></div>
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
