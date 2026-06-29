const state = { menu: null, cart: new Map() };
const $ = (id) => document.getElementById(id);
const fmt = (n) => `IDR ${Math.round(n).toLocaleString('en-US')}`;
const esc = (s = '') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

async function loadMenu() {
  const url = $('jsonUrl').value.trim() || 'menu.bilingual.json';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    state.menu = await res.json();
    $('notice').innerHTML = `資料源：<code>${esc(url)}</code> · ${state.menu.counts.items} items · 價格已包含 ${state.menu.tax_and_service.rate_percent}% service charge and government tax`;
    renderAll();
  } catch (err) {
    $('notice').innerHTML = `<strong>JSON 載入失敗：</strong>${esc(err.message)}<br>如果你用 file:// 直接打開，browser 會擋 fetch。請在此 folder 跑：<code>python3 -m http.server 8765</code>，再開 <code>http://localhost:8765/</code>`;
  }
}

function allItems() {
  return state.menu.sections.flatMap(section => section.items.map(item => ({ ...item, section })));
}
function findItem(id) { return allItems().find(item => item.id === id); }

function renderAll() {
  const m = state.menu;
  $('title').textContent = m.restaurant.en;
  $('subtitle').textContent = `${m.menu_name.zh_hant} / ${m.menu_name.en} · ${m.service_time} · ${m.footer_note.zh_hant}`;
  renderNav(); renderLegend(); renderMenu(); renderCart();
}

function renderNav() {
  $('sectionNav').innerHTML = state.menu.sections.map(sec => `<a href="#${sec.id}">${esc(sec.name.zh_hant)}<br><small>${esc(sec.name.en)}</small></a>`).join('');
}
function renderLegend() {
  $('legend').innerHTML = `<div class="legend-grid">${Object.entries(state.menu.dietary_legend).map(([k,v]) => `<div><b>${k}</b> ${esc(v.zh_hant)} <span class="en">/ ${esc(v.en)}</span></div>`).join('')}</div>`;
}
function tagLabel(tag) {
  const d = state.menu.dietary_legend[tag];
  return d ? `${tag} · ${d.zh_hant}` : tag;
}
function renderMenu() {
  $('menu').innerHTML = state.menu.sections.map(sec => `
    <section id="${sec.id}" class="menu-section">
      <div class="section-title"><h2>${esc(sec.name.zh_hant)} <span class="en">/ ${esc(sec.name.en)}</span></h2><small>page ${sec.page}</small></div>
      <div class="cards">
        ${sec.items.map(item => renderCard(item)).join('')}
      </div>
    </section>`).join('');
}
function renderCard(item) {
  return `<article class="card">
    <div>
      <div class="item-title"><div class="zh">${esc(item.name.zh_hant)}</div><div class="en">${esc(item.name.en)}</div></div>
      <div class="desc-zh">${esc(item.description.zh_hant)}</div>
      <div class="desc-en">${esc(item.description.en)}</div>
      <div class="tags">${item.dietary_tags.map(t => `<span class="tag">${esc(tagLabel(t))}</span>`).join('')}</div>
    </div>
    <div class="card-foot">
      <div><div class="price-main">${esc(item.price.display)}</div><span class="price-note">稅前估算 ${fmt(item.price.pre_service_tax_estimate)} · 已含21% ${fmt(item.price.included_service_tax_estimate)}</span></div>
      <button class="add" data-add="${esc(item.id)}">加入 Cart</button>
    </div>
  </article>`;
}

function addItem(id) { state.cart.set(id, (state.cart.get(id) || 0) + 1); renderCart(); }
function changeQty(id, delta) {
  const next = (state.cart.get(id) || 0) + delta;
  if (next <= 0) state.cart.delete(id); else state.cart.set(id, next);
  renderCart();
}
function renderCart() {
  const entries = [...state.cart.entries()].map(([id, qty]) => ({ item: findItem(id), qty })).filter(x => x.item);
  const totalQty = entries.reduce((s, x) => s + x.qty, 0);
  const subtotal = entries.reduce((s, x) => s + x.item.price.amount * x.qty, 0);
  const preTax = subtotal / 1.21;
  const included = subtotal - preTax;
  $('cartMeta').textContent = `${totalQty} item${totalQty === 1 ? '' : 's'}`;
  $('cartItems').classList.toggle('empty', entries.length === 0);
  $('cartItems').innerHTML = entries.length ? entries.map(({item, qty}) => `<div class="cart-row">
    <div><div class="cart-row-name">${esc(item.name.zh_hant)}</div><div class="cart-row-price">${esc(item.price.display)} × ${qty}</div></div>
    <div class="qty"><button data-dec="${esc(item.id)}">−</button><strong>${qty}</strong><button data-inc="${esc(item.id)}">+</button></div>
  </div>`).join('') : '未加入任何項目';
  $('subtotal').textContent = fmt(subtotal);
  $('preTax').textContent = fmt(preTax);
  $('includedTax').textContent = fmt(included);
  $('grandTotal').textContent = fmt(subtotal);
}

document.addEventListener('click', (ev) => {
  const add = ev.target.closest('[data-add]');
  const inc = ev.target.closest('[data-inc]');
  const dec = ev.target.closest('[data-dec]');
  if (add) addItem(add.dataset.add);
  if (inc) changeQty(inc.dataset.inc, 1);
  if (dec) changeQty(dec.dataset.dec, -1);
});
$('reloadBtn').addEventListener('click', loadMenu);
$('clearCartBtn').addEventListener('click', () => { state.cart.clear(); renderCart(); });
loadMenu();
