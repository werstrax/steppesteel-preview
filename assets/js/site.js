/* ============================================================================
   Steppe Steel — интерактив v4 («Белый завод»).
   Без зависимостей. Каждый модуль — именованный IIFE, живёт независимо:
   падение одного не роняет остальные. Сайт полностью читается и без JS.
   ========================================================================= */

(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.__ssJsReady) window.__ssJsReady();

  /* Цели аналитики: подключены счётчики — события уйдут, нет — тишина. */
  function goal(name, params) {
    try {
      if (window.__ymId && window.ym) window.ym(window.__ymId, 'reachGoal', name, params || {});
      if (window.gtag) window.gtag('event', name, params || {});
    } catch (e) { /* аналитика не должна ломать сайт */ }
  }

  /* --- Шапка: тень при скролле ------------------------------------------- */
  (function header() {
    var el = $('[data-header]');
    if (!el) return;
    var update = function () {
      el.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  })();

  /* --- Мобильное меню ------------------------------------------------------ */
  (function menu() {
    var burger = $('.burger');
    var menuEl = $('[data-menu]');
    if (!burger || !menuEl) return;

    var open = false;
    function setOpen(next) {
      open = next;
      burger.setAttribute('aria-expanded', String(open));
      menuEl.hidden = false;
      requestAnimationFrame(function () {
        menuEl.classList.toggle('is-open', open);
      });
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (!open) setTimeout(function () { if (!open) menuEl.hidden = true; }, 260);
    }

    burger.addEventListener('click', function () { setOpen(!open); });
    menuEl.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { setOpen(false); burger.focus(); }
    });
  })();

  /* --- Выпадающие пункты навигации ---------------------------------------- */
  (function dropdown() {
    $$('[data-sub]').forEach(function (item) {
      var toggle = $('.nav__toggle', item);
      if (!toggle) return;
      toggle.addEventListener('click', function () {
        var isOpen = item.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
      });
      item.addEventListener('focusout', function () {
        requestAnimationFrame(function () {
          if (!item.contains(document.activeElement)) {
            item.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
          }
        });
      });
      document.addEventListener('click', function (e) {
        if (!item.contains(e.target)) {
          item.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  })();

  /* --- Появление блоков при скролле ---------------------------------------- */
  (function reveal() {
    var els = $$('[data-reveal]').concat($$('.hero-frame'));
    if (!els.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* --- Плавное проявление картинок ----------------------------------------- */
  (function images() {
    $$('img[data-fade]').forEach(function (img) {
      var done = function () { img.classList.add('is-loaded'); };
      if (img.complete && img.naturalWidth) done();
      else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
  })();

  /* --- Таблицы: подсказка «листается» --------------------------------------- */
  (function tableHints() {
    $$('.table-wrap').forEach(function (wrap) {
      var check = function () {
        var scrollable = wrap.scrollWidth > wrap.clientWidth + 4;
        var atEnd = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 8;
        var hint = $('.table-hint', wrap);
        if (scrollable && !atEnd && !hint) {
          hint = document.createElement('span');
          hint.className = 'table-hint';
          hint.textContent = 'листается →';
          wrap.appendChild(hint);
        } else if ((!scrollable || atEnd) && hint) {
          hint.remove();
        }
      };
      wrap.addEventListener('scroll', check, { passive: true });
      window.addEventListener('resize', check);
      check();
    });
  })();

  /* --- Аккордеон FAQ --------------------------------------------------------- */
  (function accordion() {
    $$('.faq__q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
      });
    });
  })();

  /* --- Табы (проектировщикам) ------------------------------------------------ */
  (function tabs() {
    $$('[data-tabs]').forEach(function (root) {
      var btns = $$('[role="tab"]', root);
      var panels = $$('[role="tabpanel"]', root);
      if (!btns.length) return;

      function select(idx, focus) {
        btns.forEach(function (b, i) {
          var on = i === idx;
          b.setAttribute('aria-selected', String(on));
          b.tabIndex = on ? 0 : -1;
          if (on && focus) b.focus();
        });
        panels.forEach(function (p, i) { p.hidden = i !== idx; });
      }

      btns.forEach(function (b, i) {
        b.addEventListener('click', function () { select(i); });
        b.addEventListener('keydown', function (e) {
          var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (!dir) return;
          e.preventDefault();
          select((i + dir + btns.length) % btns.length, true);
        });
      });
    });
  })();

  /* --- Лайтбокс галерей ------------------------------------------------------- */
  (function lightbox() {
    var containers = $$('[data-lightbox]');
    if (!containers.length) return;

    var overlay = null;
    function close() {
      if (!overlay) return;
      overlay.remove();
      overlay = null;
      document.documentElement.style.overflow = '';
    }
    function openSrc(src, alt) {
      close();
      overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:300;background:rgba(22,24,27,.92);display:grid;place-items:center;padding:2rem;cursor:zoom-out';
      var img = document.createElement('img');
      img.src = src;
      img.alt = alt || '';
      img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;box-shadow:0 20px 60px rgba(0,0,0,.5)';
      overlay.appendChild(img);
      var btn = document.createElement('button');
      btn.setAttribute('aria-label', 'Закрыть');
      btn.textContent = '×';
      btn.style.cssText = 'position:absolute;top:14px;right:20px;font-size:2.2rem;color:#fff;line-height:1';
      overlay.appendChild(btn);
      overlay.addEventListener('click', close);
      document.body.appendChild(overlay);
      document.documentElement.style.overflow = 'hidden';
      btn.focus();
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    containers.forEach(function (c) {
      c.addEventListener('click', function (e) {
        var img = e.target.closest('img');
        if (!img) return;
        e.preventDefault();
        // самый крупный webp из srcset, иначе src
        var best = img.currentSrc || img.src;
        var source = img.closest('picture') && $('source', img.closest('picture'));
        if (source && source.srcset) {
          var parts = source.srcset.split(',').map(function (s) { return s.trim().split(' '); });
          var top = parts[parts.length - 1];
          if (top && top[0]) best = top[0];
        }
        openSrc(best, img.alt);
      });
    });
  })();

  /* --- Фильтр портфолио -------------------------------------------------------- */
  (function filter() {
    var root = $('[data-filter]');
    var list = $('[data-filter-list]');
    if (!root || !list) return;
    var empty = $('[data-filter-empty]');
    var btns = $$('[data-filter-btn]', root);

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-filter-btn');
        btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var visible = 0;
        $$('.obj-card', list).forEach(function (card) {
          var show = id === 'all' || card.getAttribute('data-category') === id;
          card.classList.toggle('is-hidden', !show);
          if (show) visible++;
        });
        if (empty) empty.hidden = visible > 0;
      });
    });
  })();

  /* --- Калькулятор длины зернохранилища ----------------------------------------- */
  (function grainCalc() {
    var root = $('[data-grain-calc]');
    if (!root) return;
    var crop = $('[data-gc-crop]', root);
    var tons = $('[data-gc-tons]', root);
    var out = $('[data-gc-out]', root);
    var link = $('[data-gc-link]', root);

    function update() {
      var perM = parseFloat(crop.value) || 67;
      var t = Math.max(0, parseFloat(tons.value) || 0);
      if (!t) { out.textContent = '—'; return; }
      var len = Math.ceil(t / perM);
      var capped = Math.min(len, 140);
      out.textContent = '≈ ' + capped + ' м' + (len > 140 ? ' (несколько корпусов)' : '');
      if (link) {
        var u = new URL(link.getAttribute('href'), location.origin);
        u.searchParams.set('type', 'grain');
        u.searchParams.set('tons', String(t));
        link.setAttribute('href', u.pathname + u.search);
      }
    }
    crop.addEventListener('change', update);
    tons.addEventListener('input', update);
    update();
  })();

  /* --- Окупаемость: свой склад против элеватора ---------------------------------- */
  (function payback() {
    var root = $('[data-payback]');
    if (!root) return;
    var f = {};
    $$('[data-pb]', root).forEach(function (input) {
      f[input.getAttribute('data-pb')] = input;
      input.addEventListener('input', update);
    });
    var seasonEl = $('[data-pb-season]', root);
    var breakEl = $('[data-pb-breakdown]', root);
    var payRow = $('[data-pb-payback-row]', root);
    var payEl = $('[data-pb-payback]', root);

    var fmt = function (n) {
      return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
    };
    var val = function (id) { return Math.max(0, parseFloat(f[id] && f[id].value) || 0); };

    function update() {
      var tons = val('tons');
      var storage = tons * val('rate') * val('months');
      var intake = tons * val('intake');
      var delta = tons * val('delta');
      var season = storage + intake + delta;
      if (seasonEl) seasonEl.textContent = season ? fmt(season) : '—';
      if (breakEl) {
        breakEl.innerHTML = '';
        [['Хранение', storage], ['Приёмка, сушка, подработка', intake], ['Недополучено на осенней цене', delta]]
          .forEach(function (row) {
            if (!row[1]) return;
            var li = document.createElement('li');
            var t1 = document.createElement('span'); t1.textContent = row[0];
            var t2 = document.createElement('span'); t2.textContent = fmt(row[1]);
            li.appendChild(t1); li.appendChild(t2);
            breakEl.appendChild(li);
          });
      }
      var price = val('price');
      if (payRow) payRow.hidden = !(price && season);
      if (price && season && payEl) {
        var seasons = price / season;
        payEl.textContent = seasons < 1 ? '< 1 сезона' : '≈ ' + (Math.round(seasons * 10) / 10).toString().replace('.', ',') + ' сезона(ов)';
      }
    }
    update();
  })();

  /* --- Формы: заявка на расчёт и партнёрская --------------------------------------
     Без бэкенда заявка уходит через WhatsApp: собираем текст, открываем чат.
     Если задан forms.endpoint — шлём POST multipart (файл уходит на сервер). */

  var WA_PHONE = '77766031766';

  function fieldVal(form, name) {
    var el = form.elements[name];
    return el && el.value ? String(el.value).trim() : '';
  }

  function showStatus(form, text, isError) {
    var st = $('[data-form-status]', form);
    if (!st) return;
    var box = st.closest('[data-form-done]');
    if (box) box.hidden = false;
    st.hidden = false;
    st.textContent = text;
    st.classList.toggle('is-error', Boolean(isError));
  }

  function validateRequired(form) {
    var ok = true;
    $$('[required]', form).forEach(function (el) {
      var bad = !el.value.trim();
      el.setAttribute('aria-invalid', String(bad));
      if (bad && ok) { el.focus(); ok = false; }
    });
    return ok;
  }

  function openWa(text) {
    var url = 'https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(text);
    // С флагом 'noopener' window.open по спецификации всегда возвращает null,
    // и WhatsApp открывался дважды: вкладкой и в текущем окне. Отвязываем вручную.
    var w = window.open(url, '_blank');
    if (w) { try { w.opener = null; } catch (e) { /* чужой домен */ } }
    else location.href = url;
  }

  /* Источник заявки (ТЗ §24): метки первого захода на ЛЮБУЮ страницу сайта,
     а не только на /raschet/. Живёт во вкладке, на сервер не уходит. */
  var SRC_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'yclid', 'gclid', 'fbclid'];
  (function captureSource() {
    try {
      var q = new URLSearchParams(location.search);
      if (SRC_KEYS.some(function (k) { return q.get(k); }) && !sessionStorage.getItem('ss-landing')) {
        SRC_KEYS.forEach(function (k) { if (q.get(k)) sessionStorage.setItem('ss-' + k, q.get(k)); });
      }
      if (!sessionStorage.getItem('ss-landing')) sessionStorage.setItem('ss-landing', location.pathname);
      var ref = document.referrer;
      if (ref && !sessionStorage.getItem('ss-from')) {
        var host = '';
        try { host = new URL(ref).host; } catch (e) { /* битый referrer */ }
        if (host && host !== location.host) sessionStorage.setItem('ss-from', ref);
      }
    } catch (e) { /* без хранилища — без источника */ }
  })();

  /* Откуда пришла заявка — для менеджера и аналитики (ТЗ §24) */
  function sourceLine() {
    try {
      var utm = ['utm_source', 'utm_medium', 'utm_campaign'].map(function (k) { return sessionStorage.getItem('ss-' + k); }).filter(Boolean).join(' / ');
      var click = ['yclid', 'gclid', 'fbclid'].filter(function (k) { return sessionStorage.getItem('ss-' + k); });
      var from = sessionStorage.getItem('ss-from') || '';
      var landing = sessionStorage.getItem('ss-landing') || '';
      var page = location.pathname + location.search;
      return (utm ? utm + ' · ' : '') + (click.length ? click.join('+') + ' · ' : '') +
        (from ? 'с ' + from.replace(/^https?:\/\//, '') + ' · ' : '') +
        (landing && landing !== location.pathname ? 'вход ' + landing + ' · ' : '') + 'страница ' + page;
    } catch (e) { return location.pathname; }
  }

  (function calcForm() {
    var form = $('[data-calc-form]');
    if (!form) return;

    // Предзаполнение из ?type=, ?tons=, ?w=, ?l=.
    // type — slug решения (value опций) или старые коды из ссылок и калькулятора.
    // В комментарий только дописываем: введённое пользователем не затираем.
    try {
      var params = new URLSearchParams(location.search);
      var type = params.get('type');
      var map = { grain: 'zernohranilishcha', warehouse: 'angary', workshop: 'proizvodstvennye-zdaniya' };
      var slug = map[type] || type;
      var sel = form.elements.purpose;
      var comment = form.elements.comment;
      var addComment = function (line) {
        if (!comment || comment.value.indexOf(line) !== -1) return;
        comment.value = comment.value ? comment.value.replace(/\s+$/, '') + '\n' + line : line;
      };
      var hasOption = function (v) {
        return sel && $$('option', sel).some(function (o) { return o.value === v; });
      };
      if (slug && hasOption(slug)) sel.value = slug;
      if (type === 'project') {
        var radio = form.querySelector('input[name="mode"][value="project"]');
        if (radio) radio.checked = true;
      }
      if (type === 'builder') {
        addComment('Строительная компания: прошу условия сотрудничества по изготовлению металлокаркаса.');
        if (hasOption('other')) sel.value = 'other';
      }
      var tons = parseFloat(String(params.get('tons') || '').replace(',', '.'));
      if (tons > 0) addComment('Объём хранения: ' + tons + '\u00a0т');

      // Размеры типового решения: ?w= ширина, ?l= длина (в метрах)
      var sizeParam = function (key, field) {
        var n = parseFloat(String(params.get(key) || '').replace(',', '.'));
        if (!(n > 0)) return '';
        var input = form.elements[field];
        if (input && !input.value) input.value = String(n);
        return String(n).replace('.', ',');
      };
      var w = sizeParam('w', 'width');
      var l = sizeParam('l', 'len');
      if (w || l) {
        var kind = sel && sel.value && sel.value !== 'other' ? sel.options[sel.selectedIndex].text : '';
        var dims = w && l ? w + ' × ' + l + '\u00a0м' : (w ? 'ширина ' + w : 'длина ' + l) + '\u00a0м';
        addComment('Типовое решение: ' + (kind ? kind + ', ' : '') + dims);
      }
    } catch (e) { /* строка запроса не критична */ }

    // Имя выбранного файла
    var fileInput = $('[data-file-input]', form);
    var fileName = $('[data-file-name]', form);
    if (fileInput && fileName) {
      var defaultLabel = fileName.textContent;
      fileInput.addEventListener('change', function () {
        var f = fileInput.files && fileInput.files[0];
        if (!f) { fileName.textContent = defaultLabel; return; }
        var mb = (f.size / 1048576).toFixed(1).replace('.', ',');
        fileName.textContent = f.name + ' · ' + mb + ' МБ';
      });
    }

    /* Десктоп: WhatsApp часто не установлен, поэтому рядом со статусом —
       та же заявка письмом и кнопка копирования текста. */
    var alt = $('[data-form-alt]', form);
    var mailLink = alt && $('[data-form-mail]', alt);
    var copyBtn = alt && $('[data-form-copy]', alt);
    var lastText = '';

    function showAlt(text) {
      lastText = text;
      var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
      var email = form.getAttribute('data-email');
      if (!alt || !fine || !email) return;
      if (mailLink) {
        mailLink.setAttribute('href', 'mailto:' + email +
          '?subject=' + encodeURIComponent('Заявка на расчёт с сайта') +
          '&body=' + encodeURIComponent(text.replace(/\n/g, '\r\n')));
      }
      alt.hidden = false;
    }

    function legacyCopy(text) {
      return new Promise(function (resolve, reject) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
        document.body.appendChild(ta);
        ta.select();
        var done = false;
        try { done = document.execCommand('copy'); } catch (err) { /* старый браузер */ }
        ta.remove();
        if (done) resolve(); else reject(new Error('copy'));
      });
    }

    if (copyBtn) {
      var copyLabel = copyBtn.textContent;
      copyBtn.addEventListener('click', function () {
        if (!lastText) return;
        var job = navigator.clipboard && window.isSecureContext
          ? navigator.clipboard.writeText(lastText).catch(function () { return legacyCopy(lastText); })
          : legacyCopy(lastText);
        job.then(
          function () { copyBtn.textContent = 'Текст скопирован'; },
          function () { copyBtn.textContent = 'Не получилось — отправьте на почту'; }
        ).then(function () {
          setTimeout(function () { copyBtn.textContent = copyLabel; }, 2500);
        });
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (fieldVal(form, 'website')) return; // honeypot
      if (!validateRequired(form)) return;

      var purposeSel = form.elements.purpose;
      var purposeText = purposeSel.options[purposeSel.selectedIndex] ? purposeSel.options[purposeSel.selectedIndex].text : '';
      var mode = form.querySelector('input[name="mode"]:checked');
      var isProject = Boolean(mode && mode.value === 'project');
      var size = ['width', 'len', 'height'].map(function (n) { return fieldVal(form, n); });
      var hasFile = fileInput && fileInput.files && fileInput.files.length > 0;
      var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

      var lines = [
        'Заявка на расчёт с сайта Steppe Steel',
        '',
        'Тип: ' + (isProject ? 'есть готовый проект' : 'расчёт с нуля'),
        'Назначение: ' + (purposeText || '—'),
        fieldVal(form, 'region') && 'Регион: ' + fieldVal(form, 'region'),
        (size[0] || size[1] || size[2]) && 'Размеры (Ш×Д×В): ' + (size[0] || '—') + ' × ' + (size[1] || '—') + ' × ' + (size[2] || '—') + ' м',
        fieldVal(form, 'comment') && 'Комментарий: ' + fieldVal(form, 'comment'),
        '',
        'Имя: ' + fieldVal(form, 'name'),
        fieldVal(form, 'company') && 'Компания: ' + fieldVal(form, 'company'),
        'Телефон: ' + fieldVal(form, 'phone'),
        fieldVal(form, 'whatsapp') && 'WhatsApp: ' + fieldVal(form, 'whatsapp'),
        fieldVal(form, 'email') && 'E-mail: ' + fieldVal(form, 'email'),
        hasFile
          ? 'Проект: прикреплю файлом в чате (' + fileInput.files[0].name + ')'
          : isProject && !fileInput && 'Файл проекта: пришлю отдельно',
        '',
        'Источник: ' + sourceLine(),
      ].filter(Boolean);
      var text = lines.join('\n');

      var endpoint = form.getAttribute('data-endpoint');
      goal('calc_submit', { purpose: purposeSel.value || 'other', source: sourceLine() });

      if (endpoint) {
        var fd = new FormData(form);
        fd.append('message', text);
        fetch(endpoint, { method: 'POST', body: fd })
          .then(function (r) {
            if (!r.ok) throw new Error(String(r.status));
            location.href = '/raschet/spasibo/';
          })
          .catch(function () {
            showStatus(form, 'Не получилось отправить на сервер — открываем WhatsApp с готовой заявкой.', true);
            showAlt(text);
            openWa(text);
          });
        return;
      }

      openWa(text);
      var status = 'Открыли WhatsApp с текстом заявки — остаётся нажать «Отправить».';
      if (hasFile || isProject) status += ' Затем пришлите файл проекта в этот же чат — скрепка внизу.';
      status += fine
        ? ' Если WhatsApp на компьютере нет — отправьте заявку на почту или скопируйте текст.'
        : ' Если WhatsApp не установлен, напишите нам на почту.';
      showStatus(form, status);
      showAlt(text);
    });
  })();

  (function partnerForm() {
    var form = $('[data-partner-form]');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (fieldVal(form, 'website')) return; // honeypot
      if (!validateRequired(form)) return;

      var lines = [
        'Заявка на региональное партнёрство Steppe Steel',
        '',
        'Имя: ' + fieldVal(form, 'name'),
        'Компания: ' + fieldVal(form, 'company'),
        'Город/регион: ' + fieldVal(form, 'region'),
        'Телефон: ' + fieldVal(form, 'phone'),
        fieldVal(form, 'whatsapp') && 'WhatsApp: ' + fieldVal(form, 'whatsapp'),
        fieldVal(form, 'email') && 'E-mail: ' + fieldVal(form, 'email'),
        fieldVal(form, 'comment') && 'О компании: ' + fieldVal(form, 'comment'),
        '',
        'Источник: ' + sourceLine(),
      ].filter(Boolean);

      goal('partner_submit', { source: sourceLine() });
      openWa(lines.join('\n'));
      showStatus(form, 'Открыли WhatsApp с текстом заявки — остаётся нажать «Отправить».');
    });
  })();

  /* --- Мобильная панель действий (ТЗ §18): после первого экрана, не у футера --- */
  (function mbar() {
    var bar = $('[data-mbar]');
    if (!bar) return;
    var nearFooter = false;
    var footer = $('.footer');
    if (footer && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        nearFooter = entries[0].isIntersecting;
        update();
      }).observe(footer);
    }
    function update() {
      // ТЗ §18/§20: кнопки связи под рукой с первого экрана, а не после прокрутки,
      // поэтому порога прокрутки нет — панель скрывается только у подвала,
      // где те же действия уже стоят в тексте страницы.
      bar.classList.toggle('is-visible', !nearFooter);
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* --- Клики по телефону, WhatsApp и PDF (ТЗ §24) --------------------------------- */
  (function goals() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-goal]');
      if (el) goal(el.getAttribute('data-goal'));
      var pdf = e.target.closest('a[href$=".pdf"]');
      if (pdf) goal('pdf_download', { file: (pdf.getAttribute('href') || '').split('/').pop() });
    });
  })();

  /* --- Оглавление статьи: подсветка текущего раздела ------------------------------- */
  (function scrollspy() {
    var toc = $('[data-toc]');
    if (!toc || !('IntersectionObserver' in window)) return;
    var links = $$('.toc__link', toc);
    var map = {};
    links.forEach(function (l) { map[l.getAttribute('href').slice(1)] = l; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          map[en.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) io.observe(sec);
    });
  })();

  /* --- Видео с объекта: кнопка «Смотреть», главы с перемоткой, нарезка в зоне видимости --- */
  (function objectVideo() {
    $$('[data-video-player]').forEach(function (box) {
      var v = box.querySelector('video');
      var btn = box.querySelector('[data-video-play]');
      if (!v) return;
      var scope = box.closest('section') || box.parentNode;
      var chapters = $$('[data-video-seek]', scope);
      var started = false;

      function play() {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
        box.classList.add('is-playing');
        if (!started) { started = true; goal('video_play'); }
      }
      function seek(t) {
        if (v.readyState >= 1) { v.currentTime = t; play(); return; }
        // preload="none": до первого запуска currentTime не применяется — стартуем через медиафрагмент #t=
        var src = (v.currentSrc || (v.querySelector('source') || {}).src || v.getAttribute('src') || '').split('#')[0];
        if (src) { v.src = src + '#t=' + t; v.load(); }
        play();
      }

      // Штатные кнопки плеера — только после запуска: до него кадр закрывает кнопка «Смотреть»
      v.removeAttribute('controls');
      if (btn) btn.addEventListener('click', function () { play(); });
      v.addEventListener('play', function () { box.classList.add('is-playing'); v.setAttribute('controls', ''); });

      chapters.forEach(function (c) {
        c.addEventListener('click', function () {
          seek(parseFloat(c.getAttribute('data-video-seek')) || 0);
          if (window.innerWidth < 900) box.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        });
      });
      v.addEventListener('timeupdate', function () {
        var t = v.currentTime, active = null;
        chapters.forEach(function (c) { if (t >= (parseFloat(c.getAttribute('data-video-seek')) || 0)) active = c; });
        chapters.forEach(function (c) { c.classList.toggle('is-active', c === active); });
      });
    });

    // Нарезка без звука: играет только пока видна, при reduced-motion остаётся постер
    var loops = $$('[data-video-loop] video');
    if (!loops.length || reduced || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var lv = en.target;
        if (en.isIntersecting) { var p = lv.play(); if (p && p.catch) p.catch(function () {}); }
        else lv.pause();
      });
    }, { threshold: 0.25 });
    loops.forEach(function (lv) { io.observe(lv); });
  })();
})();
