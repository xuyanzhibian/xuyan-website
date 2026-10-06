# 虚衍教派 官方网站

虚衍文化科技 — 世界观 / 造物 / 知我 / 归我 单页静态站点。

## 在线访问

**https://xuyanzhibian.github.io/xuyan-website/**

## 站点结构

| 页面 | 标题 | 说明 |
|---|---|---|
| `index.html` | 虚衍\|主页 | 入口页（星空 + 长按/键盘进入） |
| `0-1虚衍导航.html` | 虚衍\|万象 | 卡片式导航总览（三层菜单树） |
| `1虚衍世界.html` | 虚衍\|世界 | 虚衍之书 / 神明之泣 / 临世时空 |
| `1-1虚衍之书.html` | 虚衍\|虚衍之书 | 可折叠节点树（9 章 38 节，带正文与配图） |
| `2造物信息.html` | 虚衍\|造物 | 虚拟幻想 / 现实具象 虚实切换 |
| `3了解我们.html` | 虚衍\|知我 | 时间轴（过去 / 如今 / 未来） |
| `4加入我们.html` | 虚衍\|归我 | 三念化生 + 三篇文章正文 |

## 内容配置总表（改内容看这里）

**在线表格（推荐，可直接编辑）：<https://docs.qq.com/sheet/DVHFSYURTdkZxTnNq>**

本地副本 `虚衍网站内容配置总表.xlsx` 是**全站内容清单**：一个界面对应一个分表，
逐条登记按钮文案、切换形式、文本展示状态、特效、背景贴图、跳转链接与数值参数。

- 共 10 个工作表：`00_总览与索引` + `01_主页` ~ `08_全局公共` + `09_新增指南`
- 统一 13 列，其中 **`点击后显示的文本`** 一列存放「点击/悬停后页面上出现的文字」
- 该列支持富文本标记，网页端由 `XY.renderRichText()` 渲染成图片 / 视频 / 音频

### 改表 → 改站（三种方式，按省事程度挑）

腾讯文档里的表格和网页上的内容是**两个地方**：表格是数据源，
网页读的是仓库里的 `assets/site-config.json` / `assets/site-config.js`。
所以改完表必须「同步 + 发布」才会生效 —— 下面三种方式都帮你把这两步做掉了。

**① 什么都不用做（已配置好，推荐）**

Windows 计划任务「虚衍网站自动发布」**每 5 分钟**检查一次在线表格：
有改动就自动同步并发布，没改动就 4~5 秒安静退出（零 GitHub 请求、不产生空提交）。

**改完表格直接关掉页面就行**，最迟约 5 分钟自动上线。

这条链路**完全在本机独立运行** —— 不需要 WorkBuddy，也不需要任何其它软件。

- 双击 `查看自动发布状态.bat` → 看任务状态 + 最近日志
- 双击 `关闭自动同步上线.bat` / `开启自动同步上线.bat` → 关掉或重开

**② 想立刻生效**：双击 **`一键发布到网站.bat`**（同步 + 推送，约 1 分钟上线）。

**③ 命令行**：

```bash
# 在线表格改完 → 同步 → 推送到 GitHub（一条命令搞定）
python .虚衍网站内容配置总表.ref/publish.py

# 只想同步到本地看看效果、先不发布
python .虚衍网站内容配置总表.ref/publish.py --sync-only

# 只想知道改了什么，什么都不写
python .虚衍网站内容配置总表.ref/publish.py --dry-run

# 无人值守发布器（计划任务调用的就是它，无变化时直接跳过）
python .虚衍网站内容配置总表.ref/autopublish.py
python .虚衍网站内容配置总表.ref/install_schedule.py --interval 10   # 改成每 10 分钟
```

### 网页是怎么读到表格内容的（两条通道）

读表默认走 **opendoc 直读**：直接请求腾讯文档网页自身的预加载接口，把表格数据解出来。
**不需要登录、不需要 WorkBuddy、不需要任何外部程序**，因此本机双击 `.bat` 也能跑。

前提是表格的分享权限为「互联网上获得链接的人可查看」——当前**已设置**。
这是**只读**分享，别人改不了内容；随时可在腾讯文档的「分享」里改回私密（改回后直读会失效）。

若直读不可用（权限被改回私密、或接口变更），会自动回退到第二条通道
（通过本机的腾讯文档 skill 读表，仅在 WorkBuddy 内有效），并在输出里写明原因。

随时可自检直读通道是否正常：

```bash
python .虚衍网站内容配置总表.ref/tdoc_online.py DVHFSYURTdkZxTnNq --selftest
```

### 凭证放在哪

| 文件 | 内容 | 说明 |
|---|---|---|
| `.虚衍网站内容配置总表.ref/.token` | GitHub 推送令牌 | **已内置**，一行；`publish.py` / `push_github.py` 自动读取 |

> 读腾讯表格**不再需要任何票据** —— 直读通道是匿名只读的。
> 历史上用过的 `.tdoc-token.json`（腾讯文档登录票据）现在只作为直读失败时的兜底，平时不用管。

`.token` 不在推送清单里，不会被传到 GitHub，但请当密码看待、不要外发。
GitHub token 的覆盖顺序：环境变量 `GITHUB_TOKEN` > 命令行参数 > `.token` 文件。

单独的两个步骤（需要时用）：

```bash
# 改的是本地 xlsx，而不是在线表格
python .虚衍网站内容配置总表.ref/build.py --export-only

# 推送 + 线上复验
python .虚衍网站内容配置总表.ref/push_github.py
python .虚衍网站内容配置总表.ref/verify_online.py
```

> ⚠️ **两个数据源别搞混**：`publish.py` 以**在线表格**为准；
> `build.py --export-only` 以**本地 xlsx** 为准。用后者会把在线表里的改动盖回去，
> 所以日常只用 `publish.py`（或那个 .bat）。
>
> ⚠️ 不要直接运行 `python build.py`（无参数）——它会按脚本里的模板**重建整张表**，
> 把你手改的内容覆盖掉。只有新增页面 / 元素、需要重新生成表时才用它。

### 让某个元素「由表格控制」

给元素加 `data-config-*` 属性，页面加载时调用一次 `XY.autoApplyConfig()` 即可，
无需为每处写读取代码：

```html
<h1 data-config-sheet="01_主页" data-config-name="主标题">虚衍文化科技</h1>

<button data-config-sheet="01_主页"
        data-config-name="主按钮 · 默认态"
        data-config-active-name="主按钮 · 激活态">了解更多</button>
```

| 属性 | 作用 |
|---|---|
| `data-config-name` | 元素名称（必填，须与表内一致） |
| `data-config-sheet` | 分表名，可省（省略则全表查找） |
| `data-config-mode="rich"` | 值按富文本渲染 |
| `data-config-attr="href"` | 把值写到该属性上而不是文案 |
| `data-config-active-name` | 备用态文案，写入 `data-config-active-value` 供切换时读取 |
| `data-config-text-target="#box"` | 把「点击后显示的文本」渲染进该容器 |

读不到配置（离线打开、网络异常）时静默回落 HTML 里的内置默认值。
主页的主按钮（双态）、主标题、副标题已按此方式接入。

要写代码的场合：

```js
XY.loadSiteConfig().then(function (cfg) {
    var it = XY.configItem(cfg, '04_虚衍之书', '章节节点 · 虚无之域');
    XY.renderRichTextInto('#articleBody', it['点击后显示的文本']);
});
```

### 为什么没有「先显示旧文案、再变成新文案」的闪烁

早期版本用 `fetch` 异步读 `site-config.json`：浏览器会先把 HTML 里写死的
内置默认文案画出来，配置请求回来后再覆盖，中间那一瞬旧文案是**可见**的。

现在改为两层保障：

1. **同步配置**：构建脚本额外导出一份 `assets/site-config.js`
   （内容是 `window.__XY_CONFIG__ = {…}`），页面在 `<head>` 里用
   `<script src="./assets/site-config.js"></script>` **同步**加载。
   首次绘制之前配置就已就位，从根上消除时序差。
   顺带好处：直接双击打开 HTML（`file://`）也能读到配置，不再被 fetch 的同源策略拦住。
2. **未就绪先隐藏**：`common.js` 在 `<head>` 执行时先给 `<html>` 加 `xy-cfg-pending`，
   `theme.css` 把带 `data-config-name` 的元素设为 `visibility:hidden`（保留占位、不跳版）；
   配置套用完成立即摘掉。若配置始终读不到，1.5 秒后强制摘掉，绝不长时间空白。

`assets/site-config.js` 不存在时自动回退到 fetch 读 `site-config.json`，两条链路都可用。

> 本地可直接打开 HTML 预览（配置走 JS 版）；但 `fetch` 回退链路需经 HTTP 访问。
> 不调用 `autoApplyConfig()` / `loadSiteConfig()` 就不会产生任何额外请求。

### 富文本标记

| 写法 | 作用 |
|---|---|
| `[img:图片URL\|描述]` | 插入图片（描述作为图注与 alt） |
| `[video:视频URL\|标题]` | 插入视频（带播放控件） |
| `[audio:音频URL\|标题]` | 插入音频（带播放控件） |
| `[b]…[/b]` `[i]…[/i]` `[u]…[/u]` `[s]…[/s]` | 加粗 / 斜体 / 下划线 / 删除线 |
| `[center]…[/center]` | 整段居中 |
| `<br><br>` | 分段换行 |

地址支持相对路径（`./media/x.mp4`）与 `https://` 外链；其他协议会被丢弃。
媒体加载失败时自动显示占位提示。

## 技术说明

- 纯静态、零构建、无外部依赖
- 全部配图 WebP 格式，1024px 内自适应缩放；视频 / 音频建议放 `./media/`
- 公共资源：`assets/theme.css`（设计令牌 / 星空 / 媒体容器 / 动画降级 / 防闪占位）、
  `assets/common.js`（星空 / logo / 提示条 / 键盘可达性 / 富文本渲染 / 配置读取）
- 站点配置：`assets/site-config.js`（同步加载，页面实际读取的）+ `assets/site-config.json`
  （同内容，供 fetch 回退与其它程序消费），两者都由表格自动生成
- 发布链路脚本都在 `.虚衍网站内容配置总表.ref/`：
  `autopublish.py`（无人值守，无变化则跳过）、`install_schedule.py`（计划任务开关）、
  `tdoc_online.py`（**直读在线表格**，无需登录）、`publish.py`（手动一键）、
  `sync_online.py`（在线表 → 配置，默认直读、失败回退）、`build.py`（本地表 → 配置 / 重建表）、
  `push_github.py`（GitHub Git Data API 推送）、`verify_online.py`（线上复验）、
  `refresh_tdoc_token.py`（导出腾讯文档票据，仅兜底用）
- 无障碍：`role=button` + `tabindex` + `aria-label`，支持 Enter/Space；`prefers-reduced-motion` 降级
- 分享卡片：Open Graph + Twitter Card
- `archive/` 为历史版本存档
- `.nojekyll` 避免 GitHub Pages 的 Jekyll 处理中文路径

原始 PSD / 高清 PNG / 视频素材不在仓库内。
