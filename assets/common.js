/* 虚衍教派 — 公共脚本
 * 抽取自各页面重复代码：星空初始化、logo 交互、提示条、动画暂停、键盘可达性、
 * 富文本渲染（[img:] [video:] [audio:]）、站点配置读取
 * 各页面通过 <script src="./assets/common.js"></script> 引入（放在 <head> 内，
 * 确保早于页面自身脚本执行）
 */
(function (global) {
    'use strict';

    /* 系统是否要求减少动态效果 */
    var reduceMotion = global.matchMedia
        ? global.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    /* ---------- 星空初始化 ---------- */
    /**
     * 在 .sky-container 内生成随机星点。
     * @param {number} [count=45] 星点数量；减少动态效果时自动减半
     * @param {string} [selector='.sky-container']
     */
    function initStars(count, selector) {
        count = typeof count === 'number' ? count : 45;
        selector = selector || '.sky-container';
        var sky = document.querySelector(selector);
        if (!sky) return;

        // 幂等：重复调用先清理
        var old = sky.querySelectorAll('.distant-star');
        for (var k = 0; k < old.length; k++) old[k].remove();

        if (reduceMotion) count = Math.max(8, Math.round(count * 0.4));

        var frag = document.createDocumentFragment();
        for (var i = 0; i < count; i++) {
            var s = document.createElement('div');
            s.className = 'distant-star';
            s.setAttribute('aria-hidden', 'true');
            var sz = 1.5 + Math.random() * 4;
            /* 减少动态效果时冻结在静止亮度，不做闪烁 */
            var anim = reduceMotion
                ? 'animation:none'
                : 'animation-duration:' + (2 + Math.random() * 5).toFixed(2) +
                  's;animation-delay:' + (Math.random() * 5).toFixed(2) + 's';
            s.style.cssText =
                'width:' + sz.toFixed(2) + 'px;height:' + sz.toFixed(2) + 'px;' +
                'left:' + (Math.random() * 100).toFixed(2) + '%;' +
                'top:' + (Math.random() * 100).toFixed(2) + '%;' + anim;
            frag.appendChild(s);
        }
        sky.appendChild(frag);
    }

    /* ---------- Logo 交互 ---------- */
    var LOGO_FALLBACK_SVG =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E" +
        "%3Ccircle cx='50' cy='50' r='46' fill='%23131129' stroke='%23a88bff' stroke-width='2' /%3E" +
        "%3Cpath d='M32 40 L50 30 L68 40 L68 60 L50 70 L32 60 Z' fill='none' stroke='%23e0d8ff' stroke-width='2.2' /%3E" +
        "%3Ctext x='50' y='68' font-size='18' fill='%23e0d8ff' text-anchor='middle' font-weight='bold'%3E%E8%99%9A%3C/text%3E%3C/svg%3E";

    /**
     * 绑定 logo 点击跳转，并为加载失败的 logo 提供内联 SVG 兜底。
     * @param {string} [homeHref='./0虚衍主页.html'] 点击 logo 后的跳转地址
     * @param {string} [logoSel='.logo']             logo 容器选择器
     * @param {string} [imgId='logoImg']             logo 图片元素 id
     * @param {string} [ariaLabel='返回主页']         logo 的无障碍标签（各页可自定义）
     */
    function setupLogo(homeHref, logoSel, imgId, ariaLabel) {
        homeHref = homeHref || './0虚衍主页.html';
        logoSel = logoSel || '.logo';
        imgId = imgId || 'logoImg';
        ariaLabel = ariaLabel || '返回主页';

        var logo = document.querySelector(logoSel);
        if (logo) {
            logo.addEventListener('click', function () { global.location.href = homeHref; });
            /* 键盘可达：Enter / Space 等价于点击 */
            logo.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    global.location.href = homeHref;
                }
            });
            /* 语义与可聚焦 */
            if (logo.tagName !== 'A' && logo.tagName !== 'BUTTON') {
                if (!logo.hasAttribute('role')) logo.setAttribute('role', 'button');
                if (!logo.hasAttribute('tabindex')) logo.setAttribute('tabindex', '0');
            }
            /* 无障碍标签：以传入值为准（页面已有的 aria-label 优先保留） */
            if (!logo.hasAttribute('aria-label')) logo.setAttribute('aria-label', ariaLabel);
        }

        var logoImg = document.getElementById(imgId);
        if (logoImg && logoImg.complete && logoImg.naturalWidth === 0) {
            logoImg.src = LOGO_FALLBACK_SVG;
        }
    }

    /* ---------- 提示条 ---------- */
    var tipTimer = null;
    var tipEl = null;
    /**
     * 取提示容器。
     * 各页自带的底部提示条命名并不统一（tipBar / globalBottomTip /
     * bottomTextTip / bottomTip / .bottom-text-tip），这里统一兜底查找；
     * 实在没有才动态建一个，避免 showTip 静默失效。
     */
    function tipContainer() {
        if (tipEl && document.body && document.body.contains(tipEl)) return tipEl;
        tipEl = document.getElementById('tipBar')
            || document.querySelector('.tip-bar')
            || document.getElementById('globalBottomTip')
            || document.getElementById('bottomTextTip')
            || document.getElementById('bottomTip')
            || document.querySelector('.bottom-text-tip');
        if (!tipEl && document.body) {
            tipEl = document.createElement('div');
            tipEl.id = 'tipBar';
            tipEl.className = 'tip-bar';
            /* 页面没定义 .tip-bar 样式时给一套保底样式 */
            tipEl.style.cssText = 'position:fixed;bottom:30px;left:50%;'
                + 'transform:translateX(-50%);padding:10px 18px;border-radius:40px;'
                + 'background:rgba(20,16,36,.72);color:#e0d8ff;font-size:16px;'
                + 'z-index:10000;opacity:0;transition:opacity .35s ease;'
                + 'pointer-events:none;text-align:center;max-width:80%;';
            document.body.appendChild(tipEl);
        }
        return tipEl;
    }
    /**
     * 显示一条底部提示。
     * @param {string} text 提示文案
     * @param {number} [duration=2000] 毫秒
     */
    function showTip(text, duration) {
        duration = duration || 2000;
        var tip = tipContainer();
        if (!tip) return;
        tip.textContent = text;
        tip.classList.add('show');
        /* 有的页面用 .show，有的用内联 opacity，两种都兼容 */
        tip.style.opacity = '1';
        if (tipTimer) clearTimeout(tipTimer);
        tipTimer = setTimeout(function () {
            tip.classList.remove('show');
            tip.style.opacity = '';
        }, duration);
        /* 无障碍：同步播报 */
        tip.setAttribute('role', 'status');
        tip.setAttribute('aria-live', 'polite');
    }

    function hideTip() {
        var tip = tipContainer();
        if (tip) {
            tip.classList.remove('show');
            tip.style.opacity = '';
        }
        if (tipTimer) { clearTimeout(tipTimer); tipTimer = null; }
    }

    /* ---------- 动画暂停：页面不可见时停掉 rAF 循环 ---------- */
    var rafTasks = [];
    /**
     * 注册一个受可见性控制的 rAF 循环。
     * @param {(now:number)=>void} tick 每帧回调
     * @returns {()=>void} 取消函数
     */
    function registerRaf(tick) {
        var running = true;
        var handle = null;

        function loop(now) {
            if (!running) return;
            tick(now);
            handle = global.requestAnimationFrame(loop);
        }
        handle = global.requestAnimationFrame(loop);
        rafTasks.push({ stop: function () { running = false; if (handle) global.cancelAnimationFrame(handle); } });

        return function cancel() {
            running = false;
            if (handle) global.cancelAnimationFrame(handle);
        };
    }

    /* 页面切到后台时全部暂停，回到前台时交由各页面自行恢复 */
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            rafTasks.forEach(function (t) { t.stop(); });
            rafTasks.length = 0;
            document.dispatchEvent(new CustomEvent('xy:pause'));
        } else {
            document.dispatchEvent(new CustomEvent('xy:resume'));
        }
    });

    /* ---------- 工具：防抖 / 节流 ---------- */
    function debounce(fn, wait) {
        wait = wait || 120;
        var t = null;
        return function () {
            var ctx = this, args = arguments;
            if (t) clearTimeout(t);
            t = setTimeout(function () { fn.apply(ctx, args); }, wait);
        };
    }

    function throttle(fn, wait) {
        wait = wait || 60;
        var last = 0, t = null;
        return function () {
            var ctx = this, args = arguments, now = Date.now();
            if (now - last >= wait) { last = now; fn.apply(ctx, args); }
            else if (!t) {
                t = setTimeout(function () { last = Date.now(); t = null; fn.apply(ctx, args); },
                    wait - (now - last));
            }
        };
    }

    /* ---------- 通用键盘激活：让 div[role=button] 支持 Enter/Space ---------- */
    function bindKeyActivate(el, handler) {
        if (!el) return;
        if (el.tagName !== 'A' && el.tagName !== 'BUTTON') {
            if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
            if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
        }
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                handler(e);
            }
        });
    }

    /* ================================================================
       富文本渲染
       ----------------------------------------------------------------
       《虚衍网站内容配置总表》里凡是「点击后显示的文本」这类会被渲染的列，
       都可以直接写下面的标记，页面调 XY.renderRichText(text) 即可看到效果。
       两种写法等价，可以混用；都不写就是普通文字。

       ── 行内格式 ──────────────────────────────────────────────
         [b]粗[/b]        或 **粗**         加粗
         [i]斜[/i]        或 *斜*           斜体
         [u]下划线[/u]                      下划线
         [s]删除[/s]      或 ~~删除~~       删除线
         [small]小字[/small]                小一号字
         [sub]下标[/sub] [sup]上标[/sup]    上下标

       ── 段落与对齐（整段生效，可套住多行）────────────────────
         [center]居中[/center]              居中
         [left]靠左[/left]                  靠左
         [right]靠右[/right]                靠右
         [h1]大标题[/h1] [h2]中标题[/h2] [h3]小标题[/h3]
         [quote]引用段落[/quote]
         [hr]                               一条分隔线

       ── 换行 ────────────────────────────────────────────────
         单元格里直接按回车换行即可（换行符会变成 <br>）；
         也可显式写 <br>，空一行写 <br><br>。

       ── 媒体 ────────────────────────────────────────────────
         [img:图片URL|描述]     插入图片（描述作为图注与 alt）
         [video:视频URL|标题]   插入视频（带播放控件）
         [audio:音频URL|标题]   插入音频（带播放控件）

       地址支持相对路径（./media/xx.mp4）与 http(s) 外链；其余协议会被丢弃。
       表格里写的 <、>、& 会按文字显示；只放行 br/b/i/u/s/del/sub/sup/p/small 标签。
       ================================================================ */

    /** 表格里可以直接写、且会被当作标签保留的 HTML 标签白名单 */
    var HTML_ALLOW = /^(br|b|strong|i|em|u|s|del|sub|sup|p|small)$/i;

    /** 把已经转义的 &lt;tag&gt; 还原回来，但只放行白名单里的标签 */
    function restoreAllowedTags(s) {
        return s.replace(/&lt;(\/?)([a-zA-Z][a-zA-Z0-9]*)(\s*\/?)&gt;/g,
            function (m, slash, name, tail) {
                if (!HTML_ALLOW.test(name)) return m;
                if (name.toLowerCase() === 'br') return '<br>';
                return '<' + slash + name.toLowerCase() + '>';
            });
    }

    /** 转义为 HTML 文本（用于图注等纯文本位置） */
    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /** 媒体地址白名单校验：只放行相对路径、http(s) 与 data:image */
    function safeMediaUrl(url) {
        var u = String(url == null ? '' : url).trim();
        if (!u) return '';
        var ok = /^(https?:)?\/\//i.test(u)          // 绝对地址 / 协议相对
            || /^\.{1,2}\//.test(u)                  // ./ 与 ../
            || /^[A-Za-z0-9_\-]+\//.test(u)          // media/xx.mp4
            || /^[A-Za-z0-9_\-\.]+\.(png|jpe?g|gif|webp|avif|svg|mp4|webm|ogv|mov|m4v|mp3|wav|ogg|m4a|flac)$/i.test(u)
            || /^data:image\//i.test(u);             // 内联图片
        if (!ok) return '';
        return u.replace(/"/g, '%22').replace(/'/g, '%27').replace(/</g, '%3C').replace(/>/g, '%3E');
    }

    /** 生成一个媒体容器（图片 / 视频 / 音频 共用外壳） */
    function mediaBox(inner, caption) {
        return '<div class="media-container">' + inner +
            '<div class="media-fallback">✦ 媒体加载失败 ✦</div>' +
            '<div class="media-caption">' + caption + '</div></div>';
    }

    /**
     * 把富文本标记渲染成 HTML 字符串。
     * @param {string} text 含标记的文本
     * @returns {string} HTML
     */
    function renderRichText(text) {
        if (!text) return '';
        var html = String(text);
        var stash = [];
        function keep(box) { stash.push(box); return '\u0000' + (stash.length - 1) + '\u0000'; }

        /* 1. 先把媒体标记取出来（里面的 URL 不能被转义和换行规则碰到） */
        html = html.replace(/\[img:([^\|\]]+)(?:\|([^\]]*))?\]/g, function (m, url, alt) {
            var u = safeMediaUrl(url);
            if (!u) return '';
            var cap = escapeHtml((alt || '').trim()) || '虚衍意象';
            return keep(mediaBox('<img src="' + u + '" alt="' + cap +
                '" class="media-img" loading="lazy" decoding="async" />', cap));
        });
        html = html.replace(/\[video:([^\|\]]+)(?:\|([^\]]*))?\]/g, function (m, url, title) {
            var u = safeMediaUrl(url);
            if (!u) return '';
            var cap = escapeHtml((title || '').trim()) || '虚衍回响 · 影像';
            return keep(mediaBox('<video src="' + u +
                '" controls class="media-video" preload="metadata">您的浏览器不支持视频播放。</video>', cap));
        });
        html = html.replace(/\[audio:([^\|\]]+)(?:\|([^\]]*))?\]/g, function (m, url, title) {
            var u = safeMediaUrl(url);
            if (!u) return '';
            var cap = escapeHtml((title || '').trim()) || '虚衍回响 · 音声';
            return keep(mediaBox('<audio src="' + u +
                '" controls class="media-audio" preload="metadata"></audio>', cap));
        });

        /* 2. 转义，再把白名单标签还原（表格里可以直接写 <br> <b> 等） */
        html = restoreAllowedTags(escapeHtml(html));

        /* 3. 去掉 <br> 两侧多余的换行与缩进
              —— 表格里常写成 "上一行\n<br><br>\n下一行"，不处理会多出空行 */
        html = html.replace(/[ \t]*\r?\n[ \t]*(?=<\s*br\s*\/?>)/gi, '');
        html = html.replace(/(<\s*br\s*\/?>)[ \t]*\r?\n[ \t]*/gi, '$1');

        /* 4. 换行符 → <br>：表格单元格里直接回车换行也能生效 */
        html = html.replace(/\r\n?|\n/g, '<br>');

        /* 5. Markdown 风格别名（必须成对、不跨行）*/
        html = html.replace(/~~([^~\n]+?)~~/g, '<s>$1</s>');
        html = html.replace(/\*\*([^*\n]+?)\*\*/g, '<b>$1</b>');
        html = html.replace(/\*([^*\n]+?)\*/g, '<i>$1</i>');

        /* 6. 方括号行内标记 */
        html = html.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<b>$1</b>');
        html = html.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<i>$1</i>');
        html = html.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');
        html = html.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<s>$1</s>');
        html = html.replace(/\[small\]([\s\S]*?)\[\/small\]/gi, '<small>$1</small>');
        html = html.replace(/\[sub\]([\s\S]*?)\[\/sub\]/gi, '<sub>$1</sub>');
        html = html.replace(/\[sup\]([\s\S]*?)\[\/sup\]/gi, '<sup>$1</sup>');

        /* 7. 段落、对齐与块级标记 */
        html = html.replace(/\[(center|left|right)\]([\s\S]*?)\[\/\1\]/gi,
            function (m, dir, body) {
                return '<div class="rich-' + dir.toLowerCase() + '">' + body + '</div>';
            });
        html = html.replace(/\[(h1|h2|h3)\]([\s\S]*?)\[\/\1\]/gi,
            function (m, lv, body) {
                return '<div class="rich-' + lv.toLowerCase() + '">' + body + '</div>';
            });
        html = html.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi,
            '<blockquote class="rich-quote">$1</blockquote>');
        html = html.replace(/\[hr\]/gi, '<hr class="rich-hr" />');

        /* 8. 把媒体放回来 */
        html = html.replace(/\u0000(\d+)\u0000/g, function (m, i) {
            return stash[+i] || '';
        });

        return html;
    }

    /**
     * 渲染富文本并写入指定元素。
     * @param {Element|string} target 元素或选择器
     * @param {string} text 富文本
     */
    function renderRichTextInto(target, text) {
        var el = typeof target === 'string' ? document.querySelector(target) : target;
        if (el) el.innerHTML = renderRichText(text);
        return el;
    }

    /* 媒体加载失败时显示占位提示（error 事件不冒泡，故用捕获阶段统一处理） */
    document.addEventListener('error', function (e) {
        var el = e.target;
        if (!el || !el.className || typeof el.className !== 'string') return;
        if (!/\bmedia-(img|video|audio)\b/.test(el.className)) return;
        el.style.display = 'none';
        var box = el.parentNode;
        var fb = box && box.querySelector ? box.querySelector('.media-fallback') : null;
        if (fb) fb.style.display = 'block';
    }, true);

    /* ================================================================
       站点配置读取
       ----------------------------------------------------------------
       建表脚本会把《虚衍网站内容配置总表》同步导出一份
       ./assets/site-config.json，页面可按需读取，实现「改表 → 改站」。
       ================================================================ */
    var siteConfigCache = null;

    /* ---------- 防「先显示内置默认、配置到了再变」的闪烁 ----------
     * 成因：HTML 里写死了内置默认文案（首帧先画出来），配置要等异步请求回来
     * 才能覆盖，两者之间就有一瞬间的旧文案。
     * 对策分两层：
     *   1) <head> 里同步加载 assets/site-config.js，首次绘制前配置已就位（治本）；
     *   2) 本文件在 <head> 执行时先给 <html> 打上 xy-cfg-pending，
     *      配合 theme.css 把带 data-config-name 的元素暂时 visibility:hidden
     *      （保留占位、不跳版），配置套用完立即摘掉；1.5s 兜底强制摘掉，
     *      保证配置永远读不到时也不会一直空白。
     */
    var CFG_PENDING_CLASS = 'xy-cfg-pending';
    var CFG_PENDING_TIMEOUT = 1500;

    function markConfigPending() {
        var root = document.documentElement;
        if (!root || !root.classList) return;
        root.classList.add(CFG_PENDING_CLASS);
        global.setTimeout(clearConfigPending, CFG_PENDING_TIMEOUT);
    }

    function clearConfigPending() {
        var root = document.documentElement;
        if (root && root.classList) root.classList.remove(CFG_PENDING_CLASS);
    }

    markConfigPending();

    /**
     * 读取站点配置（结果会缓存）。
     * 优先取 <head> 里同步加载的 window.__XY_CONFIG__（无请求、零延迟、file:// 也能用）；
     * 没有时才回退到 fetch ./assets/site-config.json。
     * 该回退走 no-store，避免浏览器缓存旧配置导致「改了表但页面不变」。
     * @param {string} [url='./assets/site-config.json']
     * @returns {Promise<Object>}
     */
    function loadSiteConfig(url) {
        if (siteConfigCache) return Promise.resolve(siteConfigCache);
        if (global.__XY_CONFIG__) {
            siteConfigCache = global.__XY_CONFIG__;
            return Promise.resolve(siteConfigCache);
        }
        url = url || './assets/site-config.json';
        if (!global.fetch) return Promise.reject(new Error('当前环境不支持 fetch'));
        return global.fetch(url, { cache: 'no-store' }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).then(function (data) {
            siteConfigCache = data;
            return data;
        });
    }

    /**
     * 从配置中取一条记录。
     * @param {Object} config loadSiteConfig() 的返回值
     * @param {string} sheet 分表名，如 '01_主页'
     * @param {string} name  元素名称
     * @returns {Object|null}
     */
    function configItem(config, sheet, name) {
        var list = config && config.sheets && config.sheets[sheet];
        if (!list) return null;
        for (var i = 0; i < list.length; i++) {
            if (list[i]['元素名称'] === name) return list[i];
        }
        return null;
    }

    /** 先按分表找，找不到则全表查找 */
    function findConfigItem(config, sheet, name) {
        if (!name) return null;
        var item = sheet ? configItem(config, sheet, name) : null;
        if (item || !config || !config.sheets) return item;
        var keys = Object.keys(config.sheets);
        for (var i = 0; i < keys.length; i++) {
            item = configItem(config, keys[i], name);
            if (item) return item;
        }
        return null;
    }

    /* ================================================================
       表格驱动 —— 同步取值 API（页面脚本用）
       ----------------------------------------------------------------
       <head> 里同步加载的 site-config.js 会在首次绘制前把配置放进
       window.__XY_CONFIG__，所以下面这些函数**同步返回**，页面可以直接用它
       初始化自己的常量，既不会闪烁，也不用等 Promise：

         XY.cfgItem(sheet, '主标题')         → 整条记录（对象）或 null
         XY.cfgVal (sheet, '主标题', '默认')  → 「当前内容/值」
         XY.cfgText(sheet, '节点名', '默认')  → 「点击后显示的文本」
         XY.cfgHover(sheet, '节点名', '默认') → 「悬停文案」
         XY.cfgLink (sheet, '节点名', '默认') → 「跳转目标」
         XY.cfgRes (sheet, '节点名', '默认')  → 「资源路径」
         XY.cfgParams(sheet, '粒子参数')      → {minSize:5, ...}（键=值 · 键=值）

       统一约定：单元格为空、为「—」、或整条记录不存在时，一律返回默认值，
       所以页面永远可以写 XY.cfgVal('01_主页', '主标题', '虚衍文化科技')，
       表格读不到时自动回落内置文案。
       表名可省略：XY.cfgVal('主标题', '默认') 会全表查找。
       ================================================================ */

    var EMPTY_CELLS = { '': 1, '—': 1, '-': 1, '无': 1, 'NaN': 1, 'undefined': 1 };

    /** 取当前已就位的配置（同步；没有则返回 null） */
    function syncConfig() {
        if (!siteConfigCache && global.__XY_CONFIG__) siteConfigCache = global.__XY_CONFIG__;
        return siteConfigCache || null;
    }

    /** 取某分表的记录数组（同步） */
    function cfgSheet(sheet) {
        var c = syncConfig();
        return (c && c.sheets && c.sheets[sheet]) || null;
    }

    /** 同步查一条记录：先按分表，找不到再全表兜底 */
    function cfgItem(sheet, name) {
        if (name === undefined) { name = sheet; sheet = ''; }
        if (!name) return null;
        var it = findConfigItem(syncConfig(), sheet, name);
        return it || null;
    }

    /** 取某条记录的某一列，空/占位符/缺失时返回 fallback */
    function cfgCell(sheet, name, col, fallback) {
        var it = cfgItem(sheet, name);
        if (!it) return fallback;
        var v = it[col];
        if (v === undefined || v === null) return fallback;
        v = String(v).trim();
        if (EMPTY_CELLS[v]) return fallback;
        return v;
    }

    var COL_VALUE = '当前内容/值';
    var COL_TEXT = '点击后显示的文本';
    var COL_HOVER = '悬停文案';
    var COL_LINK = '跳转目标';
    var COL_RES = '资源路径';

    function cfgVal(sheet, name, d) { return cfgCell(sheet, name, COL_VALUE, d); }
    function cfgText(sheet, name, d) { return cfgCell(sheet, name, COL_TEXT, d); }
    function cfgHover(sheet, name, d) { return cfgCell(sheet, name, COL_HOVER, d); }
    function cfgRes(sheet, name, d) { return cfgCell(sheet, name, COL_RES, d); }

    /**
     * 取跳转目标：优先「跳转目标」列，没有就退回「当前内容/值」
     * （很多行本身就是一行「跳转链接」，值直接写在「当前内容/值」里）。
     */
    function cfgLink(sheet, name, d) {
        var v = cfgCell(sheet, name, COL_LINK, null);
        if (v !== null) return v;
        var it = cfgItem(sheet, name);
        if (it && String(it['内容类型'] || '').indexOf('链接') >= 0) {
            return cfgCell(sheet, name, COL_VALUE, d);
        }
        return d;
    }

    /** 数字或原样字符串 */
    function toNum(v) {
        var n = parseFloat(v);
        return isNaN(n) ? v : n;
    }

    /**
     * 解析「参数串」为对象。支持两种写法：
     *   1) KEY=值 · KEY=值 · …          （推荐，键名与代码里的常量名一致）
     *   2) 值 / 值 / …                  （键名按「代码标识」列里的顺序配对）
     * @returns {Object} 形如 { TRIGGER_NUM: 5 }
     */
    function cfgParams(sheet, name, fallback) {
        var raw = cfgCell(sheet, name, COL_VALUE, '');
        var out = {};
        if (!raw) return fallback || out;
        if (raw.indexOf('=') >= 0) {
            raw.split(/[·・]/).forEach(function (seg) {
                var i = seg.indexOf('=');
                if (i <= 0) return;
                var k = seg.slice(0, i).trim();
                if (k) out[k] = toNum(seg.slice(i + 1).trim());
            });
            return out;
        }
        var it = cfgItem(sheet, name);
        if (it) {
            var keys = String(it['代码标识'] || '').split(/\s*\/\s*/)
                .map(function (s) { return s.trim(); }).filter(Boolean);
            var vals = String(raw).split(/\s*\/\s*/)
                .map(function (s) { return s.trim(); }).filter(Boolean);
            if (keys.length === vals.length && keys.length) {
                keys.forEach(function (k, i) { out[k] = toNum(vals[i]); });
                return out;
            }
        }
        return fallback || out;
    }

    /** 按分隔符切成数组（默认 ' / '），顺手去空 */
    function splitList(s, sep) {
        var t = String(s == null ? '' : s).trim();
        if (!t || t === '—') return [];
        return t.split(sep || ' / ').map(function (x) { return x.trim(); }).filter(Boolean);
    }

    /** 把「主标题 / 副标题」这类双值串拆成两段（默认用 | 分隔） */
    function splitPair(s, sep) {
        sep = sep || '|';
        var t = String(s == null ? '' : s);
        var i = t.indexOf(sep);
        if (i < 0) return [t.trim(), ''];
        return [t.slice(0, i).trim(), t.slice(i + sep.length).trim()];
    }

    /* ---------- 样式令牌：把《08_全局公共》里的样式令牌注入 :root ---------- */

    /**
     * 把配置里的「样式令牌」行写成 CSS 变量。
     * 约定：代码标识列写变量名（/ 分隔），当前内容/值列写对应取值（/ 分隔），
     *       两边个数相等时才生效，例如：
     *         代码标识：--xy-accent / --xy-accent-soft
     *         当前内容/值：#a88bff / #e0d8ff
     * @returns {number} 实际写入的变量个数
     */
    function applyTokens(sheet) {
        var list = cfgSheet(sheet || '08_全局公共');
        if (!list) return 0;
        var root = document.documentElement, hit = 0;
        for (var i = 0; i < list.length; i++) {
            var it = list[i];
            if (String(it['内容类型'] || '') !== '样式令牌') continue;
            var keys = splitList(it['代码标识']);
            var vals = splitList(it[COL_VALUE]);
            if (!keys.length || keys.length !== vals.length) continue;
            for (var j = 0; j < keys.length; j++) {
                if (keys[j].indexOf('--') !== 0) continue;
                try { root.style.setProperty(keys[j], vals[j]); hit++; } catch (e) { /* 忽略非法值 */ }
            }
        }
        return hit;
    }

    /* ---------- 分享卡片 / 页面标题 / 图标 ---------- */

    function setMeta(sel, attr, val) {
        if (!val) return;
        var el = document.head.querySelector(sel);
        if (el) el.setAttribute(attr, val);
    }

    /**
     * 用表格驱动 <title>、og:*、twitter:*、favicon。
     * @param {string} sheet 分表名，如 '01_主页'
     * @param {Object} [opt] {titleName, faviconName, logoName, descName}
     */
    function applyDocMeta(sheet, opt) {
        opt = opt || {};
        var title = cfgVal(sheet, opt.titleName || '浏览器标签标题', null);
        if (title) {
            document.title = title;
            setMeta('meta[property="og:title"]', 'content', title);
            setMeta('meta[name="twitter:title"]', 'content', title);
        }
        var fav = cfgRes(sheet, opt.faviconName || '浏览器图标 Favicon', null)
            || cfgRes(sheet, opt.logoName || '左上角 Logo', null);
        if (fav) {
            var icon = document.getElementById('faviconLink')
                || document.head.querySelector('link[rel="icon"]');
            if (icon) icon.setAttribute('href', fav);
            var apple = document.querySelector('link[rel="apple-touch-icon"]');
            if (apple) apple.setAttribute('href', fav);
            setMeta('meta[property="og:image"]', 'content', fav);
            setMeta('meta[name="twitter:image"]', 'content', fav);
        }
        var desc = cfgCell(sheet, opt.descName || '分享卡片描述', COL_TEXT, null);
        if (desc) {
            setMeta('meta[name="description"]', 'content', desc);
            setMeta('meta[property="og:description"]', 'content', desc);
            setMeta('meta[name="twitter:description"]', 'content', desc);
        }
        return true;
    }

    /** 设置图片 src，加载失败时回落备用图 */
    function setImg(el, src, fallbackSrc) {
        if (!el || !src) return;
        el.setAttribute('src', src);
        if (fallbackSrc) {
            el.addEventListener('error', function onErr() {
                el.removeEventListener('error', onErr);
                el.setAttribute('src', fallbackSrc);
            });
        }
    }

    /* ================================================================
       表格驱动页面（让元素「由表格控制」）
       ----------------------------------------------------------------
       给任意元素加这几个 data 属性，它就会自动套用《配置总表》里的值：

         data-config-name="主按钮 · 默认态"  元素名称（必填，须与表内一致）
         data-config-sheet="01_主页"         分表名（可省略，省略则全表查找）
         data-config-col="悬停文案"          取哪一列（默认「当前内容/值」）
         data-config-mode="rich"             值按富文本渲染（默认纯文本）
         data-config-attr="href"             把值写到该属性上（默认写文案）
         data-config-active-name="主按钮 · 激活态"
                                             备用态元素名称；其值写入元素上
                                             data-config-active-value 属性，
                                             页面自行在切换时读取
         data-config-text-target="#box"      「点击后显示的文本」渲染进该容器

       应用后元素上还会留下 data-config-value（本次实际取值），
       页面可据此回读，便于处理多状态元素。

       例：<button id="mainBtn" data-config-sheet="01_主页"
                   data-config-name="主按钮 · 默认态"
                   data-config-active-name="主按钮 · 激活态">了解更多</button>
           页面里 XY.autoApplyConfig() 即可；读不到配置时静默跳过。
       ================================================================ */

    /**
     * 把配置值应用到 root 范围内带 data-config-name 的元素。
     * @param {Element|Document} [root=document]
     * @param {Object} config loadSiteConfig() 的返回值
     * @returns {number} 成功应用的条目数
     */
    function applyConfig(root, config) {
        if (!config || !config.sheets) return 0;
        root = root || document;
        if (!root.querySelectorAll) return 0;
        var nodes = root.querySelectorAll('[data-config-name]');
        var hit = 0;
        for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            var name = el.getAttribute('data-config-name');
            var sheet = el.getAttribute('data-config-sheet') || '';
            var item = findConfigItem(config, sheet, name);
            if (!item) continue;
            hit++;

            var value = item['当前内容/值'] || '';
            var col = el.getAttribute('data-config-col');
            if (col) value = item[col] || '';
            if (value) {
                el.setAttribute('data-config-value', value);
                var attr = el.getAttribute('data-config-attr');
                if (attr) {
                    el.setAttribute(attr, value);
                } else if (el.getAttribute('data-config-mode') === 'rich') {
                    el.innerHTML = renderRichText(value);
                } else {
                    el.textContent = value;
                }
            }

            /* 备用态（如按钮激活态）文案：挂到属性上由页面自取 */
            var activeName = el.getAttribute('data-config-active-name');
            if (activeName) {
                var ai = findConfigItem(config, sheet, activeName);
                if (ai && ai['当前内容/值']) {
                    el.setAttribute('data-config-active-value', ai['当前内容/值']);
                }
                if (ai && ai['点击后显示的文本']) {
                    el.setAttribute('data-config-active-text', ai['点击后显示的文本']);
                }
            }

            /* 「点击后显示的文本」渲染进指定容器 */
            var target = el.getAttribute('data-config-text-target');
            var longText = item['点击后显示的文本'] || '';
            if (target && longText) renderRichTextInto(target, longText);
        }
        return hit;
    }

    /**
     * 自动拉取配置并应用（失败静默，页面回落内置默认值）。
     * @param {Element|Document} [root=document]
     * @returns {Promise<{config:Object|null, applied:number}>}
     */
    function autoApplyConfig(root) {
        return loadSiteConfig().then(function (cfg) {
            var n = applyConfig(root || document, cfg);
            clearConfigPending();
            return { config: cfg, applied: n };
        }).catch(function () {
            clearConfigPending();   /* 读不到配置也要放行显示，避免一直空白 */
            return { config: null, applied: 0 };
        });
    }

    /* 若 <head> 已同步加载 site-config.js，则在 DOM 建好后立刻套用并放行，
       不经过任何异步等待 —— 首帧就是正确文案，从根上杜绝闪烁。 */
    function applyConfigEarly() {
        if (!global.__XY_CONFIG__) return;
        try {
            applyConfig(document, global.__XY_CONFIG__);
        } catch (e) { /* 配置异常不该影响页面，静默跳过 */ }
        clearConfigPending();
    }

    /* 样式令牌（配色/圆角/动画时长）与页面无关，配置一就位就注入 :root，
       越早越好 —— 放在这里能赶在首次绘制之前，避免颜色闪一下。 */
    if (global.__XY_CONFIG__) {
        try { applyTokens(); } catch (e) { /* 忽略 */ }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyConfigEarly);
    } else {
        applyConfigEarly();
    }

    global.XY = {
        reduceMotion: reduceMotion,
        initStars: initStars,
        setupLogo: setupLogo,
        showTip: showTip,
        hideTip: hideTip,
        registerRaf: registerRaf,
        debounce: debounce,
        throttle: throttle,
        bindKeyActivate: bindKeyActivate,
        escapeHtml: escapeHtml,
        safeMediaUrl: safeMediaUrl,
        renderRichText: renderRichText,
        renderRichTextInto: renderRichTextInto,
        loadSiteConfig: loadSiteConfig,
        configItem: configItem,
        findConfigItem: findConfigItem,
        applyConfig: applyConfig,
        autoApplyConfig: autoApplyConfig,
        clearConfigPending: clearConfigPending,
        /* 表格驱动 —— 同步取值 */
        syncConfig: syncConfig,
        cfgSheet: cfgSheet,
        cfgItem: cfgItem,
        cfgCell: cfgCell,
        cfgVal: cfgVal,
        cfgText: cfgText,
        cfgHover: cfgHover,
        cfgLink: cfgLink,
        cfgRes: cfgRes,
        cfgParams: cfgParams,
        splitList: splitList,
        splitPair: splitPair,
        applyTokens: applyTokens,
        applyDocMeta: applyDocMeta,
        setImg: setImg
    };
})(window);
