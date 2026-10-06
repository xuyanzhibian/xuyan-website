/* 虚衍教派 — 公共脚本
 * 抽取自各页面重复代码：星空初始化、logo 交互、提示条、动画暂停、键盘可达性
 * 各页面通过 <script src="./assets/common.js"></script> 引入（在 body 末尾）
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
     * 绑定 logo 点击返回主页，并为加载失败的 logo 提供内联 SVG 兜底。
     * @param {string} [homeHref='./0虚衍主页.html']
     * @param {string} [logoSel='.logo']
     * @param {string} [imgId='logoImg']
     */
    function setupLogo(homeHref, logoSel, imgId) {
        homeHref = homeHref || './0虚衍主页.html';
        logoSel = logoSel || '.logo';
        imgId = imgId || 'logoImg';

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
                if (!logo.hasAttribute('aria-label')) logo.setAttribute('aria-label', '返回主页');
            }
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

    global.XY = {
        reduceMotion: reduceMotion,
        initStars: initStars,
        setupLogo: setupLogo,
        showTip: showTip,
        hideTip: hideTip,
        registerRaf: registerRaf,
        debounce: debounce,
        throttle: throttle,
        bindKeyActivate: bindKeyActivate
    };
})(window);
