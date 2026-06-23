/* ============================================================================
 * Kubeflow Design System — Web Components runtime (kf-elements.js)
 *
 * Framework-agnostic custom elements for static pages and any web-component
 * stack. Load the global stylesheet (styles.css) for tokens + the Material
 * Icons font, then this script:
 *
 *   <link rel="stylesheet" href="styles.css">
 *   <script src="components/kf-elements.js"></script>
 *
 * Then use the tags directly:
 *   <kf-button variant="raised" icon="add">New Notebook</kf-button>
 *
 * Elements render into the LIGHT DOM so the global tokens cascade in. A single
 * shared <style> block (below) holds all component CSS.
 * ========================================================================== */
(function () {
  'use strict';

  /* ---- shared stylesheet (injected once) ---- */
  var CSS = `
  .kf-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:36px;
    padding:0 16px;min-width:64px;border:none;border-radius:var(--radius);
    font:var(--font-weight-medium) 14px/1 var(--font-sans);letter-spacing:var(--letter-spacing-button);
    cursor:pointer;white-space:nowrap;box-sizing:border-box;
    transition:background-color .15s var(--ease-standard),box-shadow .15s var(--ease-standard);}
  .kf-btn .material-icons{font-size:18px;}
  .kf-btn--sm{height:30px;font-size:13px;}
  .kf-btn--lg{height:42px;font-size:15px;}
  .kf-btn--full{width:100%;}
  .kf-btn--text{background:transparent;color:var(--btn-main);}
  .kf-btn--text:hover{background:color-mix(in srgb, var(--btn-main) 8%, transparent);}
  .kf-btn--stroked{background:transparent;color:var(--btn-main);box-shadow:inset 0 0 0 1px var(--border-strong);}
  .kf-btn--stroked:hover{background:color-mix(in srgb, var(--btn-main) 8%, transparent);}
  .kf-btn--raised{background:var(--btn-main);color:var(--btn-contrast);box-shadow:var(--elevation-1);}
  .kf-btn--raised:hover{box-shadow:var(--elevation-2);}
  .kf-btn--raised:active{box-shadow:var(--elevation-4);}
  .kf-btn[disabled]{opacity:.45;pointer-events:none;cursor:default;}

  .kf-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;
    border:none;background:transparent;border-radius:50%;cursor:pointer;padding:0;color:var(--text-secondary);
    transition:background-color .15s var(--ease-standard);}
  .kf-iconbtn:hover{background:rgba(0,0,0,.06);}
  .kf-iconbtn[disabled]{opacity:.38;pointer-events:none;}
  .kf-iconbtn--primary{color:var(--color-primary);}
  .kf-iconbtn--warn{color:var(--kf-error);}

  .kf-card{display:block;background:var(--surface-card);border-radius:var(--radius);
    box-shadow:var(--elevation-4);overflow:hidden;color:var(--text-primary);}
  .kf-card__header{display:flex;align-items:center;justify-content:space-between;gap:12px;
    padding:12px 16px;min-height:48px;font:var(--font-weight-medium) 16px/1.4 var(--font-sans);}
  .kf-card__divider{height:1px;background:var(--border-divider);}
  .kf-card__body{padding:16px;}
  .kf-card__body--flush{padding:0;}

  .kf-chip{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;
    background:rgba(0,0,0,.08);color:var(--text-primary);border-radius:var(--radius-pill);
    font:var(--font-weight-regular) 13px/1 var(--font-sans);white-space:nowrap;}
  .kf-chip .material-icons{font-size:16px;}
  .kf-chip--sm{height:22px;padding:0 8px;font-size:12px;}
  .kf-chip--sm .material-icons{font-size:14px;}
  .kf-chip--blue{background:var(--color-primary);color:#fff;}
  .kf-chip--success{background:var(--kf-success-bg);color:var(--kf-success);}
  .kf-chip--warning{background:var(--kf-warning-bg);color:#9a6700;}
  .kf-chip--error{background:var(--kf-error-bg);color:var(--kf-error);}
  .kf-chip__remove{font-size:16px!important;cursor:pointer;margin-right:-4px;opacity:.7;}

  .kf-field{position:relative;display:flex;align-items:center;gap:8px;height:48px;padding:0 12px;
    border-radius:var(--radius);box-shadow:inset 0 0 0 1px var(--border-strong);background:transparent;
    transition:box-shadow .15s var(--ease-standard);}
  .kf-field:focus-within{box-shadow:inset 0 0 0 2px var(--color-primary);}
  .kf-field--error{box-shadow:inset 0 0 0 2px var(--kf-error);}
  .kf-field__lead{font-size:20px;color:var(--text-secondary);}
  .kf-field__input,.kf-field__select{flex:1;border:none;outline:none;background:transparent;
    font:var(--text-body-font);color:var(--text-primary);width:100%;padding:0;height:100%;}
  .kf-field__select{appearance:none;-webkit-appearance:none;cursor:pointer;}
  .kf-field__label{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:14px;
    line-height:1;color:var(--text-secondary);pointer-events:none;background:var(--surface-card);
    padding:0 4px;transition:all .15s var(--ease-standard);}
  .kf-field--has-lead .kf-field__label{left:40px;}
  .kf-field__input:focus ~ .kf-field__label,
  .kf-field__input:not(:placeholder-shown) ~ .kf-field__label,
  .kf-field--floated .kf-field__label{top:-8px;transform:none;font-size:11px;line-height:16px;}
  .kf-field:focus-within .kf-field__label{color:var(--color-primary);}
  .kf-field--error .kf-field__label{color:var(--kf-error);}
  .kf-field__chevron{font-size:22px;color:var(--text-secondary);pointer-events:none;}
  .kf-field-hint{font-size:12px;line-height:16px;margin-top:4px;padding:0 12px;color:var(--text-secondary);}
  .kf-field-hint--error{color:var(--kf-error);}

  .kf-status{display:inline-flex;align-items:center;gap:8px;}
  .kf-status .material-icons{line-height:1;}
  .kf-status__text{font:var(--text-body-font);color:var(--text-primary);}
  .kf-spinner{display:inline-block;border-radius:50%;border:2px solid var(--kf-blue-100);
    border-top-color:var(--color-primary);animation:kf-spin .9s linear infinite;}
  @keyframes kf-spin{to{transform:rotate(360deg);}}

  .kf-panel{display:flex;align-items:flex-start;gap:16px;border-radius:var(--radius);padding:14px 16px;
    font:var(--text-body-font);color:var(--text-primary);}
  .kf-panel .material-icons{font-size:22px;flex:none;}
  .kf-panel__title{font-weight:var(--font-weight-medium);margin-bottom:2px;}
  .kf-panel--info{background:var(--kf-info-bg);}
  .kf-panel--info>.material-icons{color:var(--color-primary);}
  .kf-panel--success{background:var(--kf-success-bg);}
  .kf-panel--success>.material-icons{color:var(--kf-success);}
  .kf-panel--warning{background:var(--kf-warning-bg);}
  .kf-panel--warning>.material-icons{color:#9a6700;}
  .kf-panel--error{background:var(--kf-error-bg);}
  .kf-panel--error>.material-icons{color:var(--kf-error);}
  .kf-panel--neutral{background:var(--surface-sunken);}
  .kf-panel--neutral>.material-icons{color:var(--text-secondary);}

  .kf-toolbar{width:100%;}
  .kf-toolbar__row{display:flex;align-items:center;gap:8px;padding:8px 20px;}
  .kf-toolbar__title{font:var(--text-headline-font);letter-spacing:var(--letter-spacing-headline);
    color:var(--text-primary);margin:0;padding:12px 0;}
  .kf-toolbar__spacer{flex:1;}
  .kf-toolbar__actions{display:flex;gap:8px;}
  .kf-toolbar__divider{height:1px;background:var(--border-divider);}

  .kf-nsselect{padding:20px 16px 8px;}
  .kf-nsselect__label{display:flex;align-items:center;gap:6px;font:var(--font-weight-medium) 11px/1 var(--font-sans);
    letter-spacing:.6px;text-transform:uppercase;color:var(--text-secondary);margin-bottom:10px;}
  .kf-nsselect__label .material-icons{font-size:16px;}

  .kf-table-wrap{width:100%;overflow:auto;}
  .kf-table{width:100%;border-collapse:collapse;font:var(--text-body-font);}
  .kf-table th{text-align:left;padding:10px 8px;color:var(--text-secondary);
    font-weight:var(--font-weight-medium);font-size:12px;letter-spacing:.4px;
    border-bottom:1px solid var(--border-divider);white-space:nowrap;}
  .kf-table td{padding:8px;border-bottom:1px solid var(--border-default);color:var(--text-primary);
    vertical-align:middle;white-space:nowrap;}
  .kf-table th.kf-right,.kf-table td.kf-right{text-align:right;}
  .kf-table tr.kf-row{transition:background-color .12s;}
  .kf-table tr.kf-row:hover{background:var(--surface-hover);}
  .kf-table tr.kf-row td a.kf-link{color:var(--text-primary);text-decoration:none;}
  .kf-table tr.kf-row:hover td a.kf-link{color:var(--color-link);text-decoration:underline;}
  .kf-row__actions{display:flex;justify-content:flex-end;gap:2px;opacity:.45;transition:opacity .12s;}
  .kf-table tr.kf-row:hover .kf-row__actions{opacity:1;}

  .kf-details__row{display:flex;gap:24px;align-items:baseline;padding:10px 0;}
  .kf-details__row--dense{padding:6px 0;}
  .kf-details__key{width:180px;flex:none;font-weight:var(--font-weight-medium);color:var(--text-primary);}
  .kf-details__val{flex:1;color:var(--text-secondary);word-break:break-word;}
  .kf-details__divider{height:1px;background:var(--border-default);}
  `;
  function injectStyles() {
    if (document.getElementById('kf-elements-styles')) return;
    var s = document.createElement('style');
    s.id = 'kf-elements-styles';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  injectStyles();
  function mi(name, cls, style) {
    return '<span class="material-icons' + (cls ? ' ' + cls : '') + '"' + (style ? ' style="' + style + '"' : '') + '>' + name + '</span>';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[c];
    });
  }
  function define(tag, cls) {
    if (!customElements.get(tag)) customElements.define(tag, cls);
  }

  // Elements that read their own light-DOM children (label text, slotted
  // nodes, <option>s) must wait until those children are parsed. When the
  // script is loaded in <head>, parser-created elements upgrade BEFORE their
  // children exist, and even a microtask runs too early — so defer to
  // DOMContentLoaded. Dynamically-created elements (readyState !== loading)
  // already have their children, so build immediately.
  function whenReady(build) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', build, {
        once: true
      });
    } else {
      build();
    }
  }
  var BTN_PALETTE = {
    primary: ['var(--color-primary)', 'var(--color-primary-contrast)'],
    accent: ['var(--kf-accent)', '#fff'],
    warn: ['var(--kf-error)', '#fff'],
    basic: ['var(--text-primary)', 'var(--text-primary)']
  };

  /* ------------------------------- kf-button ------------------------------ */
  class KfButton extends HTMLElement {
    static get observedAttributes() {
      return ['variant', 'color', 'size', 'icon', 'icon-trailing', 'disabled', 'full-width', 'label'];
    }
    connectedCallback() {
      if (this._init) {
        this.render();
        return;
      }
      var self = this;
      whenReady(function () {
        if (self._init) return;
        self._label = self.getAttribute('label') || self.textContent.trim();
        self._init = true;
        self.render();
      });
    }
    attributeChangedCallback(n, o, v) {
      if (this._init) {
        if (n === 'label') this._label = v;
        this.render();
      }
    }
    render() {
      var variant = this.getAttribute('variant') || 'text';
      var color = this.getAttribute('color') || 'primary';
      var size = this.getAttribute('size') || 'md';
      var icon = this.getAttribute('icon');
      var trailing = this.getAttribute('icon-trailing');
      var disabled = this.hasAttribute('disabled');
      var pal = BTN_PALETTE[color] || BTN_PALETTE.primary;
      var cls = 'kf-btn kf-btn--' + variant + (size !== 'md' ? ' kf-btn--' + size : '') + (this.hasAttribute('full-width') ? ' kf-btn--full' : '');
      this.style.setProperty('--btn-main', pal[0]);
      this.style.setProperty('--btn-contrast', pal[1]);
      this.style.display = this.hasAttribute('full-width') ? 'block' : 'inline-block';
      this.innerHTML = '<button class="' + cls + '"' + (disabled ? ' disabled' : '') + '>' + (icon ? mi(icon) : '') + '<span>' + esc(this._label) + '</span>' + (trailing ? mi(trailing) : '') + '</button>';
    }
  }
  define('kf-button', KfButton);

  /* ----------------------------- kf-icon-button --------------------------- */
  class KfIconButton extends HTMLElement {
    static get observedAttributes() {
      return ['icon', 'color', 'size', 'disabled', 'title'];
    }
    connectedCallback() {
      this.render();
    }
    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }
    render() {
      var icon = this.getAttribute('icon') || '';
      var color = this.getAttribute('color') || 'default';
      var size = parseInt(this.getAttribute('size') || '40', 10);
      var disabled = this.hasAttribute('disabled');
      var title = this.getAttribute('title') || icon;
      this.style.display = 'inline-block';
      var cls = 'kf-iconbtn' + (color !== 'default' ? ' kf-iconbtn--' + color : '');
      this.innerHTML = '<button class="' + cls + '" title="' + esc(title) + '" aria-label="' + esc(title) + '"' + (disabled ? ' disabled' : '') + ' style="width:' + size + 'px;height:' + size + 'px">' + mi(icon, null, 'font-size:' + Math.round(size * 0.6) + 'px') + '</button>';
    }
  }
  define('kf-icon-button', KfIconButton);

  /* -------------------------------- kf-card ------------------------------- */
  class KfCard extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      var self = this;
      whenReady(function () {
        self._build();
      });
    }
    _build() {
      var title = this.getAttribute('title');
      var elevation = this.getAttribute('elevation') || '4';
      var flush = this.hasAttribute('no-padding');
      var actionEl = this.querySelector('[slot="action"]');
      var body = document.createElement('div');
      body.className = 'kf-card__body' + (flush ? ' kf-card__body--flush' : '');
      var nodes = [];
      this.childNodes.forEach(function (n) {
        if (n !== actionEl) nodes.push(n);
      });
      nodes.forEach(function (n) {
        body.appendChild(n);
      });
      this.classList.add('kf-card');
      this.style.boxShadow = 'var(--elevation-' + elevation + ')';
      if (title || actionEl) {
        var header = document.createElement('div');
        header.className = 'kf-card__header';
        var t = document.createElement('div');
        t.textContent = title || '';
        header.appendChild(t);
        if (actionEl) {
          actionEl.removeAttribute('slot');
          header.appendChild(actionEl);
        }
        this.appendChild(header);
        var div = document.createElement('div');
        div.className = 'kf-card__divider';
        this.appendChild(div);
      }
      this.appendChild(body);
    }
  }
  define('kf-card', KfCard);

  /* -------------------------------- kf-chip ------------------------------- */
  class KfChip extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      var self = this;
      whenReady(function () {
        self._build();
      });
    }
    _build() {
      var color = this.getAttribute('color');
      var icon = this.getAttribute('icon');
      var size = this.getAttribute('size');
      var removable = this.hasAttribute('removable');
      var label = this.textContent.trim();
      this.style.display = 'inline-flex';
      this.className = 'kf-chip' + (color ? ' kf-chip--' + color : '') + (size === 'sm' ? ' kf-chip--sm' : '');
      this.innerHTML = (icon ? mi(icon) : '') + '<span>' + esc(label) + '</span>' + (removable ? mi('cancel', 'kf-chip__remove') : '');
      if (removable) {
        var self = this;
        this.querySelector('.kf-chip__remove').addEventListener('click', function () {
          self.dispatchEvent(new CustomEvent('remove', {
            bubbles: true
          }));
        });
      }
    }
  }
  define('kf-chip', KfChip);

  /* ------------------------------- kf-input ------------------------------- */
  class KfInput extends HTMLElement {
    static get observedAttributes() {
      return ['label', 'value', 'placeholder', 'hint', 'error', 'type', 'disabled', 'required', 'icon'];
    }
    connectedCallback() {
      this.render();
    }
    attributeChangedCallback(n, o, v) {
      if (this._input) {
        if (n === 'value') {
          this._input.value = v;
        } else {
          this.render();
        }
      }
    }
    get value() {
      return this._input ? this._input.value : this.getAttribute('value') || '';
    }
    set value(v) {
      this.setAttribute('value', v);
      if (this._input) this._input.value = v;
    }
    render() {
      var label = this.getAttribute('label');
      var icon = this.getAttribute('icon');
      var error = this.getAttribute('error');
      var hint = this.getAttribute('hint');
      var disabled = this.hasAttribute('disabled');
      var required = this.hasAttribute('required');
      this.style.display = 'block';
      var fieldCls = 'kf-field' + (icon ? ' kf-field--has-lead' : '') + (error ? ' kf-field--error' : '');
      this.innerHTML = '<div class="' + fieldCls + '">' + (icon ? mi(icon, 'kf-field__lead') : '') + '<input class="kf-field__input" type="' + (this.getAttribute('type') || 'text') + '" placeholder="' + esc(this.getAttribute('placeholder') || ' ') + '"' + (disabled ? ' disabled' : '') + '>' + (label ? '<label class="kf-field__label">' + esc(label) + (required ? ' *' : '') + '</label>' : '') + '</div>' + (hint || error ? '<div class="kf-field-hint' + (error ? ' kf-field-hint--error' : '') + '">' + esc(error || hint) + '</div>' : '');
      this._input = this.querySelector('input');
      this._input.value = this.getAttribute('value') || '';
      var self = this;
      this._input.addEventListener('input', function () {
        self.dispatchEvent(new CustomEvent('input', {
          bubbles: true,
          detail: {
            value: self._input.value
          }
        }));
      });
    }
  }
  define('kf-input', KfInput);

  /* ------------------------------- kf-select ------------------------------ */
  class KfSelect extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      var self = this;
      whenReady(function () {
        self._build();
      });
    }
    _build() {
      var label = this.getAttribute('label');
      var optionsAttr = this.getAttribute('options');
      var existing = Array.prototype.map.call(this.querySelectorAll('option'), function (o) {
        return {
          value: o.value,
          label: o.textContent
        };
      });
      var opts = optionsAttr ? JSON.parse(optionsAttr).map(function (o) {
        return typeof o === 'string' ? {
          value: o,
          label: o
        } : o;
      }) : existing;
      var value = this.getAttribute('value');
      this.style.display = 'block';
      this.innerHTML = '<div class="kf-field kf-field--floated">' + '<select class="kf-field__select">' + opts.map(function (o) {
        return '<option value="' + esc(o.value) + '"' + (o.value === value ? ' selected' : '') + '>' + esc(o.label) + '</option>';
      }).join('') + '</select>' + (label ? '<label class="kf-field__label">' + esc(label) + '</label>' : '') + mi('arrow_drop_down', 'kf-field__chevron') + '</div>';
      this._select = this.querySelector('select');
      var self = this;
      this._select.addEventListener('change', function () {
        self.dispatchEvent(new CustomEvent('change', {
          bubbles: true,
          detail: {
            value: self._select.value
          }
        }));
      });
    }
    get value() {
      return this._select ? this._select.value : this.getAttribute('value');
    }
    set value(v) {
      if (this._select) this._select.value = v;
    }
  }
  define('kf-select', KfSelect);

  /* ----------------------------- kf-status-icon --------------------------- */
  var STATUS_MAP = {
    ready: ['check_circle', 'var(--kf-success)'],
    warning: ['warning', 'var(--kf-warning)'],
    error: ['error', 'var(--kf-error)'],
    unavailable: ['timelapse', 'var(--text-secondary)'],
    uninitialized: ['radio_button_unchecked', 'var(--kf-neutral)'],
    stopped: ['stop_circle', 'var(--kf-neutral)']
  };
  class KfStatusIcon extends HTMLElement {
    static get observedAttributes() {
      return ['phase', 'label', 'size'];
    }
    connectedCallback() {
      this.render();
    }
    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }
    render() {
      var phase = this.getAttribute('phase') || 'ready';
      var label = this.getAttribute('label');
      var size = parseInt(this.getAttribute('size') || '20', 10);
      var spinning = phase === 'waiting' || phase === 'terminating';
      var cfg = STATUS_MAP[phase] || STATUS_MAP.warning;
      this.className = 'kf-status';
      this.innerHTML = (spinning ? '<span class="kf-spinner" style="width:' + size + 'px;height:' + size + 'px"></span>' : mi(cfg[0], null, 'font-size:' + size + 'px;color:' + cfg[1])) + (label ? '<span class="kf-status__text">' + esc(label) + '</span>' : '');
    }
  }
  define('kf-status-icon', KfStatusIcon);

  /* -------------------------------- kf-panel ------------------------------ */
  var PANEL_ICON = {
    info: 'info',
    success: 'check_circle',
    warning: 'warning',
    error: 'error',
    neutral: 'help_outline'
  };
  class KfPanel extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      var self = this;
      whenReady(function () {
        self._build();
      });
    }
    _build() {
      var type = this.getAttribute('type') || 'info';
      var icon = this.getAttribute('icon') || PANEL_ICON[type];
      var title = this.getAttribute('title');
      var msg = this.innerHTML;
      this.className = 'kf-panel kf-panel--' + type;
      this.innerHTML = mi(icon) + '<div>' + (title ? '<div class="kf-panel__title">' + esc(title) + '</div>' : '') + '<div>' + msg + '</div></div>';
    }
  }
  define('kf-panel', KfPanel);

  /* ------------------------------- kf-toolbar ----------------------------- */
  class KfToolbar extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      var self = this;
      whenReady(function () {
        self._build();
      });
    }
    _build() {
      var title = this.getAttribute('title');
      var back = this.hasAttribute('back');
      var actions = this.querySelectorAll('[slot="actions"]');
      var actionsWrap = document.createElement('div');
      actionsWrap.className = 'kf-toolbar__actions';
      actions.forEach(function (a) {
        a.removeAttribute('slot');
        actionsWrap.appendChild(a);
      });
      this.classList.add('kf-toolbar');
      this.innerHTML = '';
      var row = document.createElement('div');
      row.className = 'kf-toolbar__row';
      if (back) {
        var b = document.createElement('kf-icon-button');
        b.setAttribute('icon', 'arrow_back');
        b.setAttribute('title', 'Back');
        var self = this;
        b.addEventListener('click', function () {
          self.dispatchEvent(new CustomEvent('back', {
            bubbles: true
          }));
        });
        row.appendChild(b);
      }
      var h = document.createElement('h1');
      h.className = 'kf-toolbar__title';
      h.innerHTML = title || '';
      row.appendChild(h);
      var sp = document.createElement('div');
      sp.className = 'kf-toolbar__spacer';
      row.appendChild(sp);
      row.appendChild(actionsWrap);
      this.appendChild(row);
      var div = document.createElement('div');
      div.className = 'kf-toolbar__divider';
      this.appendChild(div);
    }
  }
  define('kf-toolbar', KfToolbar);

  /* --------------------------- kf-namespace-select ------------------------ */
  class KfNamespaceSelect extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      var nsAttr = this.getAttribute('namespaces') || '';
      var list = nsAttr.trim().charAt(0) === '[' ? JSON.parse(nsAttr) : nsAttr.split(',').map(function (s) {
        return s.trim();
      }).filter(Boolean);
      var value = this.getAttribute('value');
      var allOption = this.getAttribute('all-option') !== 'false';
      var opts = (allOption ? [{
        value: '{all}',
        label: 'All namespaces'
      }] : []).concat(list.map(function (n) {
        return {
          value: n,
          label: n
        };
      }));
      this.innerHTML = '<div class="kf-nsselect">' + '<div class="kf-nsselect__label">' + mi('folder_shared') + 'Namespace</div>' + '<kf-select options=\'' + JSON.stringify(opts) + '\'' + (value ? ' value="' + esc(value) + '"' : '') + '></kf-select>' + '</div>';
      var self = this;
      this.querySelector('kf-select').addEventListener('change', function (e) {
        self.dispatchEvent(new CustomEvent('change', {
          bubbles: true,
          detail: e.detail
        }));
      });
    }
  }
  define('kf-namespace-select', KfNamespaceSelect);

  /* ---------------------------- kf-resource-table ------------------------- */
  class KfResourceTable extends HTMLElement {
    set columns(v) {
      this._columns = v;
      this.render();
    }
    get columns() {
      return this._columns || [];
    }
    set rows(v) {
      this._rows = v;
      this.render();
    }
    get rows() {
      return this._rows || [];
    }
    connectedCallback() {
      if (this.getAttribute('columns')) this._columns = JSON.parse(this.getAttribute('columns'));
      if (this.getAttribute('rows')) this._rows = JSON.parse(this.getAttribute('rows'));
      this.render();
    }
    cell(col, row) {
      var v = col.field ? row[col.field] : undefined;
      if (col.type === 'status') {
        var ph = v && v.phase ? v.phase : v;
        var lbl = v && v.label ? v.label : '';
        return '<kf-status-icon phase="' + esc(ph) + '"' + (lbl ? ' label="' + esc(lbl) + '"' : '') + '></kf-status-icon>';
      }
      if (col.type === 'link') return '<a href="#" class="kf-link" onclick="return false">' + esc(v) + '</a>';
      if (col.type === 'actions') {
        return '<div class="kf-row__actions">' + (col.actions || []).map(function (a) {
          return '<kf-icon-button icon="' + esc(a.icon) + '" size="36"' + (a.color ? ' color="' + a.color + '"' : '') + ' title="' + esc(a.title || a.name) + '" data-action="' + esc(a.name) + '"></kf-icon-button>';
        }).join('') + '</div>';
      }
      return esc(v);
    }
    render() {
      var cols = this.columns,
        rows = this.rows,
        self = this;
      this.classList.add('kf-table-wrap');
      this.innerHTML = '<table class="kf-table"><thead><tr>' + cols.map(function (c) {
        return '<th class="' + (c.align === 'right' ? 'kf-right' : '') + '"' + (c.width ? ' style="width:' + (typeof c.width === 'number' ? c.width + 'px' : c.width) + '"' : '') + '>' + esc(c.header) + '</th>';
      }).join('') + '</tr></thead><tbody>' + rows.map(function (row, ri) {
        return '<tr class="kf-row" data-row="' + ri + '">' + cols.map(function (c) {
          return '<td class="' + (c.align === 'right' ? 'kf-right' : '') + '">' + self.cell(c, row) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
      this.querySelectorAll('kf-icon-button[data-action]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var ri = btn.closest('tr').getAttribute('data-row');
          self.dispatchEvent(new CustomEvent('row-action', {
            bubbles: true,
            detail: {
              action: btn.getAttribute('data-action'),
              row: rows[ri]
            }
          }));
        });
      });
    }
  }
  define('kf-resource-table', KfResourceTable);

  /* ----------------------------- kf-details-list -------------------------- */
  class KfDetailsList extends HTMLElement {
    set items(v) {
      this._items = v;
      this.render();
    }
    get items() {
      return this._items || [];
    }
    connectedCallback() {
      if (this.getAttribute('items')) this._items = JSON.parse(this.getAttribute('items'));
      this.render();
    }
    render() {
      var items = this.items,
        dense = this.hasAttribute('dense');
      this.style.display = 'block';
      this.innerHTML = items.map(function (it, i) {
        return '<div class="kf-details__row' + (dense ? ' kf-details__row--dense' : '') + '">' + '<div class="kf-details__key">' + (it.keyHtml || esc(it.key)) + '</div>' + '<div class="kf-details__val">' + (it.valueHtml || esc(it.value)) + '</div></div>' + (i < items.length - 1 ? '<div class="kf-details__divider"></div>' : '');
      }).join('');
    }
  }
  define('kf-details-list', KfDetailsList);
  window.KfElements = {
    version: '1.0.0'
  };
})();
