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

### 改表 → 改站（两条路，都只刷新 `assets/site-config.json`）

```bash
# A. 在线表格改完（不用下载文件）
python .虚衍网站内容配置总表.ref/sync_online.py

# B. 改的是本地 xlsx
python .虚衍网站内容配置总表.ref/build.py --export-only

# ⚠ 不要直接运行 `python build.py`（无参数）——它会按脚本里的模板**重建整张表**，
#   把你手改的内容覆盖掉。只有新增页面 / 元素、需要重新生成表时才用它。
```

`sync_online.py` 额外支持 `--dry-run`（只打印不落盘）与 `--file-id <在线表ID>`。

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

> `site-config.json` 通过 fetch 读取（已带 `no-store`，避免改表后刷新不变），
> 需经 HTTP 访问——本地直接双击打开 HTML 时浏览器会拦截。
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
- 公共资源：`assets/theme.css`（设计令牌 / 星空 / 媒体容器 / 动画降级）、
  `assets/common.js`（星空 / logo / 提示条 / 键盘可达性 / 富文本渲染 / 配置读取）
- 无障碍：`role=button` + `tabindex` + `aria-label`，支持 Enter/Space；`prefers-reduced-motion` 降级
- 分享卡片：Open Graph + Twitter Card
- `archive/` 为历史版本存档
- `.nojekyll` 避免 GitHub Pages 的 Jekyll 处理中文路径

原始 PSD / 高清 PNG / 视频素材不在仓库内。
