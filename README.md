# 虚衍教派 官方网站

虚衍文化科技 — 世界观 / 造物 / 知我 / 归我 单页静态站点。

## 在线访问

**https://xuyanzhibian.github.io/xuyan-website/**

## 站点结构

| 页面 | 标题 | 说明 |
|---|---|---|
| `index.html` | 虚衍\|主页 | 入口页（星空 + 长按/键盘进入） |
| `0-1虚衍导航.html` | 虚衍\|万象 | 卡片式导航总览 |
| `1虚衍世界.html` | 虚衍\|世界 | 虚衍之书 / 神明之泣 / 临世时空 |
| `1-1虚衍之书.html` | 虚衍\|虚衍之书 | 可折叠节点树（9章38节分镜图） |
| `2造物信息.html` | 虚衍\|造物 | 虚拟幻想 / 现实具象 虚实切换 |
| `3了解我们.html` | 虚衍\|知我 | 时间轴（过去 / 如今 / 未来） |
| `4加入我们.html` | 虚衍\|归我 | 三念化生 |

## 技术说明

- 纯静态、零构建、无外部依赖
- 全部配图 WebP 格式（约 2MB），1024px 内自适应缩放
- 公共资源：`assets/theme.css`（设计令牌/星空/动画降级）、`assets/common.js`（星空/logo/提示/键盘可达性）
- 无障碍：`role=button` + `tabindex` + `aria-label`，支持 Enter/Space 键盘操作；`prefers-reduced-motion` 动画降级
- 分享卡片：Open Graph + Twitter Card 元信息
- `archive/` 为历史版本存档
- `.nojekyll` 避免 GitHub Pages 的 Jekyll 处理中文路径

原始 PSD / 高清 PNG / 视频素材不在仓库内。
