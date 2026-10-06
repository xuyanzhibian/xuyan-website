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
    /**
     * 显示一条底部提示。
     * @param {string} text 提示文案
     * @param {number} [duration=2000] 毫秒
     */
    function showTip(text, duration) {
        duration = duration || 2000;
        var tip = document.getElementById('tipBar') || document.querySelector('.tip-bar');
        if (!tip) return;
        tip.textContent = text;
        tip.classList.add('show');
        if (tipTimer) clearTimeout(tipTimer);
        tipTimer = setTimeout(function () { tip.classList.remove('show'); }, duration);
        /* 无障碍：同步播报 */
        tip.setAttribute('role', 'status');
        tip.setAttribute('aria-live', 'polite');
    }

    function hideTip() {
        var tip = document.getElementById('tipBar') || document.querySelector('.tip-bar');
        if (tip) tip.classList.remove('show');
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
       《虚衍网站内容配置总表》「点击后显示的文本」一列可直接写下列标记，
       页面调用 XY.renderRichText(text) 即可渲染成图片 / 视频 / 音频 / 富文本：

         [img:图片URL|描述]     插入图片（描述作为图注与 alt）
         [video:视频URL|标题]   插入视频（带播放控件）
         [audio:音频URL|标题]   插入音频（带播放控件）
         [b]粗[/b] [i]斜[/i] [u]下划线[/u] [s]删除线[/s]
         [center]整段居中[/center]
         <br><br>               换行分段（原生 HTML，直接写）

       地址支持相对路径（./media/xx.mp4）与 http(s) 外链；其余协议会被丢弃。
       ================================================================ */

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

        /* 1. 图片 [img:URL|描述] */
        html = html.replace(/\[img:([^\|\]]+)(?:\|([^\]]*))?\]/g, function (m, url, alt) {
            var u = safeMediaUrl(url);
            if (!u) return '';
            var cap = escapeHtml((alt || '').trim()) || '虚衍意象';
            return mediaBox('<img src="' + u + '" alt="' + cap +
                '" class="media-img" loading="lazy" decoding="async" />', cap);
        });

        /* 2. 视频 [video:URL|标题] */
        html = html.replace(/\[video:([^\|\]]+)(?:\|([^\]]*))?\]/g, function (m, url, title) {
            var u = safeMediaUrl(url);
            if (!u) return '';
            var cap = escapeHtml((title || '').trim()) || '虚衍回响 · 影像';
            return mediaBox('<video src="' + u +
                '" controls class="media-video" preload="metadata">您的浏览器不支持视频播放。</video>', cap);
        });

        /* 3. 音频 [audio:URL|标题] */
        html = html.replace(/\[audio:([^\|\]]+)(?:\|([^\]]*))?\]/g, function (m, url, title) {
            var u = safeMediaUrl(url);
            if (!u) return '';
            var cap = escapeHtml((title || '').trim()) || '虚衍回响 · 音声';
            return mediaBox('<audio src="' + u +
                '" controls class="media-audio" preload="metadata"></audio>', cap);
        });

        /* 4. 行内样式 */
        html = html.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<b>$1</b>');
        html = html.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<i>$1</i>');
        html = html.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');
        html = html.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<s>$1</s>');
        html = html.replace(/\[center\]([\s\S]*?)\[\/center\]/gi,
            '<div style="text-align:center;width:100%;">$1</div>');

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

    /**
     * 读取站点配置（结果会缓存）。不调用则完全不产生额外请求。
     * 走 no-store，避免浏览器缓存旧配置导致「改了表但页面不变」。
     * @param {string} [url='./assets/site-config.json']
     * @returns {Promise<Object>}
     */
    function loadSiteConfig(url) {
        url = url || './assets/site-config.json';
        if (siteConfigCache) return Promise.resolve(siteConfigCache);
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
       表格驱动页面（让元素「由表格控制」）
       ----------------------------------------------------------------
       给任意元素加这几个 data 属性，它就会自动套用《配置总表》里的值：

         data-config-name="主按钮 · 默认态"  元素名称（必填，须与表内一致）
         data-config-sheet="01_主页"         分表名（可省略，省略则全表查找）
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
            return { config: cfg, applied: applyConfig(root || document, cfg) };
        }).catch(function () {
            return { config: null, applied: 0 };
        });
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
        autoApplyConfig: autoApplyConfig
    };
})(window);
