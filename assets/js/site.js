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
    var w = window.open(url, '_blank', 'noopener');
    if (!w) location.href = url;
  }

  /* Откуда пришла заявка — для менеджера и аналитики (ТЗ §24) */
  function sourceLine() {
    try {
      var utm = ['utm_source', 'utm_medium', 'utm_campaign'].map(function (k) { return sessionStorage.getItem('ss-' + k); }).filter(Boolean).join(' / ');
      var from = sessionStorage.getItem('ss-from') || '';
      var page = location.pathname + location.search;
      return (utm ? utm + ' · ' : '') + (from ? 'с ' + from.replace(/^https?:\/\//, '') + ' · ' : '') + 'страница ' + page;
    } catch (e) { return location.pathname; }
  }

  (function calcForm() {
    var form = $('[data-calc-form]');
    if (!form) return;

    // Источник заявки (ТЗ §24): utm первого визита + страница, с которой пришли
    try {
      var q = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
        if (q.get(k)) sessionStorage.setItem('ss-' + k, q.get(k));
      });
      if (document.referrer && !sessionStorage.getItem('ss-from')) sessionStorage.setItem('ss-from', document.referrer);
    } catch (e) { /* без хранилища — без источника */ }

    // Предзаполнение из ?type= и ?tons=
    try {
      var params = new URLSearchParams(location.search);
      var type = params.get('type');
      var map = { grain: 'zernohranilishcha', warehouse: 'angary', workshop: 'proizvodstvennye-zdaniya' };
      var slug = map[type] || type;
      var sel = form.elements.purpose;
      if (slug && sel && $$('option', sel).some(function (o) { return o.value === slug; })) sel.value = slug;
      if (type === 'project') {
        var radio = form.querySelector('input[name="mode"][value="project"]');
        if (radio) radio.checked = true;
      }
      if (type === 'builder' && form.elements.comment && !form.elements.comment.value) {
        form.elements.comment.value = 'Строительная компания: прошу условия сотрудничества по изготовлению металлокаркаса.';
        if (sel) sel.value = 'other';
      }
      var tons = params.get('tons');
      if (tons && form.elements.comment && !form.elements.comment.value) {
        form.elements.comment.value = 'Объём хранения: ' + tons + ' т';
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

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (fieldVal(form, 'website')) return; // honeypot
      if (!validateRequired(form)) return;

      var purposeSel = form.elements.purpose;
      var purposeText = purposeSel.options[purposeSel.selectedIndex] ? purposeSel.options[purposeSel.selectedIndex].text : '';
      var mode = form.querySelector('input[name="mode"]:checked');
      var size = ['width', 'len', 'height'].map(function (n) { return fieldVal(form, n); });
      var hasFile = fileInput && fileInput.files && fileInput.files.length > 0;

      var lines = [
        'Заявка на расчёт с сайта Steppe Steel',
        '',
        'Тип: ' + (mode && mode.value === 'project' ? 'есть готовый проект' : 'расчёт с нуля'),
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
        hasFile && 'Проект: прикреплю файлом в чате (' + fileInput.files[0].name + ')',
        '',
        'Источник: ' + sourceLine(),
      ].filter(Boolean);

      var endpoint = form.getAttribute('data-endpoint');
      goal('calc_submit', { purpose: purposeSel.value || 'other', source: sourceLine() });

      if (endpoint) {
        var fd = new FormData(form);
        fd.append('message', lines.join('\n'));
        fetch(endpoint, { method: 'POST', body: fd })
          .then(function (r) {
            if (!r.ok) throw new Error(String(r.status));
            location.href = '/raschet/spasibo/';
          })
          .catch(function () {
            showStatus(form, 'Не получилось отправить на сервер — открываем WhatsApp с готовой заявкой.', true);
            openWa(lines.join('\n'));
          });
        return;
      }

      openWa(lines.join('\n'));
      showStatus(form,
        hasFile
          ? 'Открыли WhatsApp с текстом заявки. Прикрепите файл проекта прямо в чат — скрепка внизу.'
          : 'Открыли WhatsApp с текстом заявки — остаётся нажать «Отправить». Если WhatsApp не установлен, напишите нам на почту.');
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
      var pastHero = window.scrollY > window.innerHeight * 0.7;
      bar.classList.toggle('is-visible', pastHero && !nearFooter);
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
})();
