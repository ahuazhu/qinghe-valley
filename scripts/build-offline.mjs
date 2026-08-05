import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { build } from "vite";

const projectDir = resolve(import.meta.dirname, "..");
const workDir = resolve(projectDir, ".offline-build");
const outputDir = resolve(projectDir, "offline-dist");
const publicDir = resolve(projectDir, "public");

const imageFiles = [
  "museum-artifacts.png",
  "woodcraft-showcase.png",
  "xiaohe-sick-sprite.png",
  "xiaohe-side-right.png",
  "xiaohe-sprite.png",
  "xiaohe-walk-down-a.png",
  "xiaohe-walk-down-b.png",
  "xiaohe-walk-right-a.png",
  "xiaohe-walk-right-b.png",
  "xiaohe-walk-up-a.png",
  "xiaohe-walk-up-b.png",
];

await rm(workDir, { recursive: true, force: true });
await rm(outputDir, { recursive: true, force: true });

await build({
  configFile: false,
  publicDir: false,
  plugins: [react()],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: workDir,
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: true,
    rollupOptions: {
      output: {
        assetFileNames: "style[extname]",
      },
    },
    lib: {
      entry: resolve(projectDir, "app/offline-entry.tsx"),
      name: "QingheValleyOffline",
      formats: ["iife"],
      fileName: () => "qinghe-valley.js",
    },
  },
});

let javascript = await readFile(resolve(workDir, "qinghe-valley.js"), "utf8");
const stylesheet = await readFile(resolve(workDir, "style.css"), "utf8");

for (const file of imageFiles) {
  const image = await readFile(resolve(publicDir, file));
  const dataUrl = `data:image/png;base64,${image.toString("base64")}`;
  javascript = javascript.replaceAll(`/${file}`, dataUrl);
}
javascript = javascript.replaceAll('/?splitVillage=', '?splitVillage=');

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <meta name="theme-color" content="#315440">
  <title>青禾谷｜离线版</title>
  <style>${stylesheet}</style>
</head>
<body>
  <div id="qinghe-offline-root"></div>
  <script>${javascript}</script>
</body>
</html>`;

await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, "青禾谷-双击打开.html"), html);
await writeFile(
  resolve(outputDir, "使用说明.txt"),
  "青禾谷离线版\n\n1. 解压整个 ZIP。\n2. 双击“青禾谷-双击打开.html”开始游戏。\n3. 游戏进度会保存在当前设备的浏览器里。\n\n离线可用：单人游戏、种田、钓鱼、地图、房屋、物品，以及同一台设备的双人分屏。\n需要联网：两个设备实时联机、云端存档转移。\n这个 HTML 已经包含全部角色和场景图片，可以单独保存或发送。\n",
);

await rm(workDir, { recursive: true, force: true });
