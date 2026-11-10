/* 奇门遁甲全书 · 时家转盘排盘器 + 页面交互
   规则依据见正文第四章：地盘固定序、值符加时干、值使按九宫数、八门顺时针填、八神阳顺阴逆。
   本文件不依赖任何第三方库。 */
(function () {
  'use strict';

  /* ========== 基础数据 ========== */
  var GAN = '甲乙丙丁戊己庚辛壬癸'.split('');
  var ZHI = '子丑寅卯辰巳午未申酉戌亥'.split('');
  var JIAZI = [];
  var i;
  for (i = 0; i < 60; i++) JIAZI.push(GAN[i % 10] + ZHI[i % 12]);

  var XUN_YI = ['戊', '己', '庚', '辛', '壬', '癸'];          // 六旬所遁之仪
  var XUN_KONG = ['戌亥', '申酉', '午未', '辰巳', '寅卯', '子丑']; // 六旬空亡
  var PLATE = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙']; // 地盘固定布序

  var STAR = { 1: '天蓬', 2: '天芮', 3: '天冲', 4: '天辅', 5: '天禽', 6: '天心', 7: '天柱', 8: '天任', 9: '天英' };
  var DOOR = { 1: '休门', 2: '死门', 3: '伤门', 4: '杜门', 6: '开门', 7: '惊门', 8: '生门', 9: '景门' };
  var PALACE = { 1: '坎一', 2: '坤二', 3: '震三', 4: '巽四', 5: '中五', 6: '乾六', 7: '兑七', 8: '艮八', 9: '离九' };

  var RING = [1, 8, 3, 4, 9, 2, 7, 6];        // 盘面顺时针环
  var GRID = [4, 9, 2, 3, 5, 7, 8, 1, 6];      // 九宫格填格顺序
  var DOOR_ORDER = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门'];
  var SHEN = ['值符', '螣蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];

  function ringIdx(p) { return RING.indexOf(p); }

  /* ========== 排盘 ========== */
  function compute(yy, ju, gz) {
    var idx = JIAZI.indexOf(gz);
    if (idx < 0) idx = 0;

    var xun = Math.floor(idx / 10);
    var xunShou = JIAZI[xun * 10];
    var yi = XUN_YI[xun];

    /* 1. 地盘：阳遁从局数宫顺行九宫，阴遁逆行 */
    var base = {};
    var p = ju;
    for (var k = 0; k < 9; k++) {
      base[p] = PLATE[k];
      p = yy === 'yang' ? (p % 9) + 1 : ((p - 2 + 9) % 9) + 1;
    }

    /* 2. 旬首落宫 → 值符星、值使门 */
    var shouPalace = 1;
    for (var q = 1; q <= 9; q++) if (base[q] === yi) shouPalace = q;

    var anchor = shouPalace === 5 ? 2 : shouPalace;   // 中五寄坤二
    var valueStar = STAR[shouPalace];
    var valueDoor = DOOR[anchor];

    /* 3. 时干宫（时干为甲则用旬首之仪） */
    var tg = JIAZI[idx].charAt(0);
    var tgan = tg === '甲' ? yi : tg;
    var tPalace = 1;
    for (var r = 1; r <= 9; r++) if (base[r] === tgan) tPalace = r;
    var target = tPalace === 5 ? 2 : tPalace;

    /* 4. 天盘九星：整体刚体旋转，值符星加时干宫 */
    var shift = (ringIdx(target) - ringIdx(anchor) + 8) % 8;
    var tian = {};
    for (var s = 0; s < 8; s++) {
      var from = RING[s];
      var to = RING[(s + shift) % 8];
      tian[to] = { star: STAR[from], gan: base[from] };
    }
    var ruiPos = RING[(ringIdx(2) + shift) % 8];   // 天禽与天芮同宫

    /* 5. 八门：值使按九宫数落宫，其余顺时针填 */
    var vdStart = shouPalace === 5 ? 2 : shouPalace;
    var step = idx % 10;
    var vdPalace;
    if (yy === 'yang') vdPalace = ((vdStart - 1 + step) % 9) + 1;
    else vdPalace = ((vdStart - 1 - step) % 9 + 9) % 9 + 1;
    if (vdPalace === 5) vdPalace = 2;

    var doors = {};
    var dStart = DOOR_ORDER.indexOf(valueDoor);
    var dRing = ringIdx(vdPalace);
    for (var u = 0; u < 8; u++) {
      doors[RING[(dRing + u) % 8]] = DOOR_ORDER[(dStart + u) % 8];
    }

    /* 6. 八神：值符神加值符星落宫，阳顺阴逆 */
    var shen = {};
    var sRing = ringIdx(target);
    var dir = yy === 'yang' ? 1 : -1;
    for (var v = 0; v < 8; v++) {
      shen[RING[((sRing + dir * v) % 8 + 8) % 8]] = SHEN[v];
    }

    return {
      base: base, tian: tian, doors: doors, shen: shen,
      qinPos: ruiPos, xunShou: xunShou, yi: yi, xun: xun,
      valueStar: valueStar, valueDoor: valueDoor,
      target: target, vdPalace: vdPalace, ju: ju, yy: yy, gz: gz
    };
  }

  /* ========== 渲染 ========== */
  function render(d) {
    var html = '<div class="pan">';
    for (var g = 0; g < GRID.length; g++) {
      var pal = GRID[g];
      if (pal === 5) {
        html += '<div class="cell mid">' +
          '<div class="top"><span class="star">天禽</span><span class="shen">寄坤</span></div>' +
          '<div class="gan">—<small>中宫</small></div>' +
          '<div class="bot"><span class="men">—</span><span class="base">' + d.base[5] + '</span></div>' +
          '</div>';
        continue;
      }
      var ti = d.tian[pal] || { star: '', gan: '' };
      var qin = (pal === d.qinPos) ? '<small>天盘 · 禽' + d.base[5] + '</small>' : '<small>天盘</small>';
      html += '<div class="cell">' +
        '<div class="top"><span class="star">' + ti.star + '</span><span class="shen">' + (d.shen[pal] || '') + '</span></div>' +
        '<div class="gan">' + ti.gan + qin + '</div>' +
        '<div class="bot"><span class="men">' + (d.doors[pal] || '') + '</span><span class="base">' + d.base[pal] + '</span></div>' +
        '</div>';
    }
    html += '</div>';

    html += '<p class="calc-meta"><b>' + (d.yy === 'yang' ? '阳遁' : '阴遁') + d.ju + '局</b> · ' + d.gz + '时 · 旬首' + d.xunShou +
      '（' + d.yi + '）· 值符' + d.valueStar + '落' + PALACE[d.target] +
      ' · 值使' + d.valueDoor + '落' + PALACE[d.vdPalace] + ' · 旬空' + XUN_KONG[d.xun] + '</p>';

    return html;
  }

  function run() {
    var yyEl = document.getElementById('c-yinyang');
    var juEl = document.getElementById('c-ju');
    var gzEl = document.getElementById('c-ganzhi');
    var outEl = document.getElementById('c-out');
    if (!yyEl || !juEl || !gzEl || !outEl) return;
    outEl.innerHTML = render(compute(yyEl.value, parseInt(juEl.value, 10), gzEl.value));
  }

  /* ========== 初始化 ========== */
  var gzEl = document.getElementById('c-ganzhi');
  if (gzEl) {
    var opts = '';
    for (i = 0; i < JIAZI.length; i++) {
      opts += '<option value="' + JIAZI[i] + '"' + (JIAZI[i] === '丙寅' ? ' selected' : '') + '>' + JIAZI[i] + '</option>';
    }
    gzEl.innerHTML = opts;
  }

  var runBtn = document.getElementById('c-run');
  if (runBtn) runBtn.addEventListener('click', run);
  if (gzEl) gzEl.addEventListener('change', run);
  if (runBtn) run();

  /* ========== 侧栏、进度条、移动端菜单 ========== */
  var side = document.getElementById('side');
  var menuBtn = document.getElementById('menu-btn');
  var prog = document.querySelector('#prog i');
  var links = Array.prototype.slice.call(document.querySelectorAll('#side nav a'));

  if (menuBtn && side) {
    menuBtn.addEventListener('click', function () {
      side.classList.toggle('open');
    });
    links.forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.innerWidth <= 820) side.classList.remove('open');
      });
    });
  }

  var items = links.map(function (a) {
    var id = a.getAttribute('href').slice(1);
    return { link: a, el: document.getElementById(id) };
  }).filter(function (o) { return o.el; });

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop || 0;

    if (prog) {
      var h = document.body.scrollHeight - window.innerHeight;
      prog.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
    }

    var current = items[0];
    for (var n = 0; n < items.length; n++) {
      var top = items[n].el.getBoundingClientRect().top + y;
      if (top - 150 <= y) current = items[n];
    }
    links.forEach(function (a) { a.classList.remove('active'); });
    if (current) current.link.classList.add('active');
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(function () {
        onScroll();
        ticking = false;
      });
    }
  }, { passive: true });
  onScroll();

  window.Qimen = { compute: compute };
})();
