import * as bootstrap from 'bootstrap';
import Chart from 'chart.js/auto';
import './main.scss';

window.bootstrap = bootstrap;

const API_BASE = window.AMANI_ADMIN_API_BASE || '';
const API_KEY = window.AMANI_ADMIN_API_KEY || '';
const charts = new Map();

const panel = {
  label: 'Admin Panel',
  home: 'index.html',
  subtitle: 'Amani operations, content, reports and business actions',
  sections: [
    { title: 'Amani Administration', groups: [
      { icon: 'bi-house', title: 'Overview & Reports', items: [['index.html','Property Portfolio'],['index2.html','Listings & Occupancy'],['index3.html','Tenant Financials'],['index4.html','Billing & Reports'],['widgets.html','Live KPIs'],['landing.html','Amani Overview']] },
      { icon: 'bi-buildings', title: 'Properties & Leasing', items: [['form.html','Properties'],['form_advanced.html','Property Units'],['projects.html','Properties / Listings'],['project_detail.html','Property Detail'],['pricing_tables.html','Unit Pricing'],['level2.html','Location Hierarchy'],['map.html','Property Locations'],['form_wizards.html','Tenancy Setup'],['rental_admin.html','Tenancies / Rentals'],['calendar.html','Notices & Vacating'],['form_validation.html','Maintenance Requests']] },
      { icon: 'bi-people', title: 'Clients & Finance', items: [['tables.html','Clients / Tenants'],['invoice.html','Payments & Receipts'],['tables_dynamic.html','Billing Charges'],['e_commerce.html','Billing Accounts'],['inbox.html','Contract Delivery'],['form_upload.html','Client Documents']] },
      { icon: 'bi-window', title: 'Content & Team', items: [['general_elements.html','Website Content'],['media_gallery.html','Property Media'],['icons.html','Property Features'],['form_buttons.html','Amani Services'],['contacts.html','Agents / Team'],['profile.html','Agent Profiles']] },
      { icon: 'bi-bar-chart-line', title: 'Visual Reports', items: [['chartjs.html','Portfolio Visuals'],['echarts.html','Financial Visuals'],['other_charts.html','Operations Visuals']] }
    ]}
  ]
};

const profiles = {
  'index.html': { type:'dashboard', title:'Property Portfolio', charts:['properties_by_status','units_by_status','portfolio_snapshot','maintenance_by_status'], table:'properties' },
  'index2.html': { type:'dashboard', title:'Listings & Occupancy', charts:['units_by_status','properties_by_status','reservations_by_status','portfolio_snapshot'], table:'units' },
  'index3.html': { type:'dashboard', title:'Tenant Financials', charts:['tenancies_by_status','monthly_financial_comparison','monthly_received_payments','payments_by_method'], table:'tenancies' },
  'index4.html': { type:'dashboard', title:'Billing & Reports', charts:['monthly_financial_comparison','financial_position','charges_by_type','contracts_by_status'], table:'payments' },
  'form.html': { type:'resource', title:'Properties', resource:'properties' },
  'form_advanced.html': { type:'resource', title:'Property Units', resource:'units' },
  'form_validation.html': { type:'resource', title:'Maintenance Requests', resource:'maintenance' },
  'form_wizards.html': { type:'resource', title:'Tenancy Setup', resource:'tenancies' },
  'form_upload.html': { type:'resource', title:'Client Documents', resource:'documents' },
  'form_buttons.html': { type:'resource', title:'Amani Services', resource:'services' },
  'general_elements.html': { type:'resource', title:'Website Content', resource:'content' },
  'media_gallery.html': { type:'resource', title:'Property Media', resource:'media' },
  'icons.html': { type:'resource', title:'Property Features', resource:'features' },
  'widgets.html': { type:'dashboard', title:'Live Amani KPIs', charts:['portfolio_snapshot','financial_position','operational_volume','monthly_financial_comparison'], table:'properties' },
  'invoice.html': { type:'resource', title:'Payments & Receipts', resource:'payments' },
  'inbox.html': { type:'resource', title:'Contract Delivery Queue', resource:'contract-delivery' },
  'calendar.html': { type:'resource', title:'Notices & Vacating Calendar', resource:'notices' },
  'tables.html': { type:'resource', title:'Clients / Tenants', resource:'clients' },
  'tables_dynamic.html': { type:'resource', title:'Billing Charges', resource:'charges' },
  'chartjs.html': { type:'dashboard', title:'Portfolio Visuals', charts:['properties_by_status','units_by_status','reservations_by_status','tenancies_by_status','portfolio_snapshot'], table:'properties' },
  'echarts.html': { type:'dashboard', title:'Financial Visuals', charts:['monthly_financial_comparison','monthly_received_payments','payments_by_method','charges_by_type','financial_position'], table:'payments' },
  'other_charts.html': { type:'dashboard', title:'Operations Visuals', charts:['maintenance_by_status','maintenance_by_priority','contracts_by_status','notices_by_type','operational_volume'], table:'maintenance' },
  'e_commerce.html': { type:'resource', title:'Billing Accounts', resource:'billing-accounts' },
  'projects.html': { type:'resource', title:'Properties / Listings', resource:'properties' },
  'project_detail.html': { type:'resource', title:'Property Detail Records', resource:'properties' },
  'contacts.html': { type:'resource', title:'Agents / Team', resource:'agents' },
  'profile.html': { type:'resource', title:'Agent Profiles', resource:'agents' },
  'pricing_tables.html': { type:'resource', title:'Unit Pricing', resource:'units' },
  'level2.html': { type:'resource', title:'Location Hierarchy', resource:'locations' },
  'landing.html': { type:'dashboard', title:'Amani Overview', charts:['portfolio_snapshot','properties_by_status','units_by_status','monthly_financial_comparison'], table:'properties' },
  'rental_admin.html': { type:'resource', title:'Tenancies / Rentals', resource:'tenancies' },
  'map.html': { type:'resource', title:'Property Locations', resource:'locations' }
};

function filename() { return location.pathname.split('/').pop() || 'index.html'; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function labelize(value) { return String(value || '').replaceAll('_',' ').replace(/\b\w/g, m => m.toUpperCase()); }
function money(value) { return new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES',maximumFractionDigits:0}).format(Number(value||0)); }
function number(value) { return Number(value || 0).toLocaleString('en-KE'); }
function safeJson(value) { try { return JSON.stringify(value, null, 2); } catch { return String(value ?? ''); } }

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { Accept: 'application/json', ...(options.body ? {'Content-Type':'application/json'} : {}), ...(API_KEY ? {'x-admin-api-key':API_KEY} : {}), ...(options.headers || {}) }
    });
  } catch (cause) {
    const error = new Error('Amani backend is not reachable on port 4000. Start E:\\amani-backend first.');
    error.cause = cause; throw error;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.error || `Request failed with status ${response.status}`);
    error.status = response.status; error.details = payload.details; throw error;
  }
  return payload;
}


function menuHtml() {
  const current = filename();
  return panel.sections.map(section => `
    <div class="amani-menu-section">${escapeHtml(section.title)}</div>
    <ul class="amani-menu">${section.groups.map((group, groupIndex) => `
      <li class="amani-menu-group">
        <button class="group-title" type="button" aria-expanded="false" aria-controls="submenu-admin-${groupIndex}">
          <i class="bi ${group.icon}"></i><span class="menu-text">${escapeHtml(group.title)}</span><i class="bi bi-chevron-down submenu-caret"></i>
        </button>
        <ul class="amani-submenu" id="submenu-admin-${groupIndex}" hidden>${group.items.map(([href,text]) => `<li><a class="${href===current?'active':''}" href="${href}">${escapeHtml(text)}</a></li>`).join('')}</ul>
      </li>`).join('')}</ul>`).join('');
}

function setupMenuAccordion() {
  const groups = [...document.querySelectorAll('.amani-menu-group')];
  const closeGroup = (group) => {
    group.classList.remove('open');
    const button = group.querySelector('.group-title');
    const submenu = group.querySelector('.amani-submenu');
    button?.setAttribute('aria-expanded','false');
    if (submenu) submenu.hidden = true;
  };
  const openGroup = (group) => {
    groups.forEach(other => { if (other !== group) closeGroup(other); });
    group.classList.add('open');
    const button = group.querySelector('.group-title');
    const submenu = group.querySelector('.amani-submenu');
    button?.setAttribute('aria-expanded','true');
    if (submenu) submenu.hidden = false;
  };
  groups.forEach(group => {
    closeGroup(group);
    group.querySelector('.group-title')?.addEventListener('click', () => {
      if (document.body.classList.contains('sidebar-collapsed')) document.body.classList.remove('sidebar-collapsed');
      if (group.classList.contains('open')) closeGroup(group); else openGroup(group);
    });
  });
  document.querySelectorAll('.amani-submenu a').forEach(link => link.addEventListener('click', () => {
    if (innerWidth <= 900) document.body.classList.remove('sidebar-open');
  }));
}


function renderShell(profile) {
  document.title = `${profile.title} | Amani Admin`;
  document.getElementById('amani-app').innerHTML = `
    <div class="amani-shell">
      <aside class="amani-sidebar">
        <a class="amani-brand" href="${panel.home}"><img src="/logo.svg" alt="Amani"></a>
        <div class="amani-profile"><img src="/logo-icon.svg" alt="Amani"><div><small>${escapeHtml(panel.subtitle)}</small><strong>${escapeHtml(panel.label)}</strong></div></div>
        <nav>${menuHtml()}</nav>
      </aside>
      <div class="amani-content-wrap">
        <header class="amani-topbar"><button class="amani-menu-toggle" type="button" aria-label="Toggle menu"><i class="bi bi-list"></i></button><div class="amani-topbar-right"><span class="amani-area-badge"><i class="bi bi-briefcase"></i> Admin Panel</span><div class="amani-status" id="backend-status"><span class="amani-dot"></span><span>Checking backend…</span></div></div></header>
        <main class="amani-main" id="amani-main"><div class="amani-empty">Loading live Amani data…</div></main>
        <footer class="amani-footer">Amani Admin · business operations and reporting through the central Amani backend</footer>
      </div>
    </div>`;
  setupMenuAccordion();
  document.querySelector('.amani-menu-toggle').addEventListener('click', () => {
    if (innerWidth <= 900) document.body.classList.toggle('sidebar-open'); else document.body.classList.toggle('sidebar-collapsed');
  });
}

async function checkBackend() {
  const el = document.getElementById('backend-status');
  try {
    const health = await api('/health');
    el.className = 'amani-status ok';
    el.innerHTML = `<span class="amani-dot"></span><span>Backend + DB connected · ${number(health.data?.properties_count)} properties</span>`;
  } catch (error) {
    el.className = 'amani-status bad';
    el.innerHTML = `<span class="amani-dot"></span><span>${escapeHtml(error.message)}</span>`;
  }
}

function pageHeader(profile, subtitle = 'All values below come from the current Amani database through amani-backend.') {
  return `<div class="amani-page-title"><div><h1>${escapeHtml(profile.title)}</h1><div class="small text-muted mt-1">${escapeHtml(subtitle)}</div></div></div>`;
}

function kpiHtml(label, value, format='number') {
  const shown = format === 'money' ? money(value) : number(value);
  return `<div class="col-xl-3 col-md-6 mb-3"><div class="amani-kpi"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(shown)}</div></div></div>`;
}


function destroyChart(id) { if (charts.has(id)) { charts.get(id).destroy(); charts.delete(id); } }

const chartStyles = {
  properties_by_status: { title:'Property Status Distribution', type:'doughnut' },
  units_by_status: { title:'Unit Status Comparison', type:'bar', indexAxis:'y' },
  tenancies_by_status: { title:'Tenancy Status Distribution', type:'pie' },
  payments_by_method: { title:'Received Payments by Method', type:'polarArea' },
  monthly_received_payments: { title:'Monthly Received Payments', type:'line', smooth:true, fill:true, money:true },
  monthly_financial_comparison: { title:'Monthly Received Payments vs Posted / Paid Charges', type:'line', smooth:true, comparison:true, money:true },
  charges_by_type: { title:'Charges by Type', type:'bar', indexAxis:'y' },
  contracts_by_status: { title:'Contract Status Profile', type:'radar' },
  notices_by_type: { title:'Notice Types', type:'doughnut' },
  reservations_by_status: { title:'Reservation Status', type:'pie' },
  maintenance_by_status: { title:'Maintenance Status', type:'bar' },
  maintenance_by_priority: { title:'Maintenance Priority', type:'polarArea' },
  portfolio_snapshot: { title:'Portfolio Comparison', type:'bar' },
  financial_position: { title:'Financial Position Comparison', type:'bar', money:true },
  operational_volume: { title:'Operational Record Volumes', type:'bar', indexAxis:'y' }
};

const chartPalette = ['#1abb9c','#3498db','#9b59b6','#f39c12','#e74c3c','#2c3e50','#16a085','#7f8c8d','#2980b9','#8e44ad'];
const chartPaletteSoft = ['rgba(26,187,156,.22)','rgba(52,152,219,.22)','rgba(155,89,182,.22)','rgba(243,156,18,.22)','rgba(231,76,60,.22)','rgba(44,62,80,.22)'];

function chartTitle(key) { return chartStyles[key]?.title || labelize(key); }

function renderChart(id, key, data) {
  const canvas = document.getElementById(id); if (!canvas) return;
  destroyChart(id);
  const style = chartStyles[key] || { type:'bar' };
  const labels = data?.labels || [];
  const rawDatasets = Array.isArray(data?.datasets) && data.datasets.length
    ? data.datasets
    : [{ label: chartTitle(key), values: data?.values || [] }];
  if (!labels.length || !rawDatasets.some(dataset => (dataset.values || []).length)) {
    canvas.parentElement.innerHTML = '<div class="amani-empty">No live records available for this visualization.</div>';
    return;
  }
  const isCircular = ['doughnut','pie','polarArea'].includes(style.type);
  const datasets = rawDatasets.map((dataset,index) => ({
    label: dataset.label || chartTitle(key),
    data: dataset.values || [],
    borderColor: isCircular ? '#fff' : chartPalette[index % chartPalette.length],
    backgroundColor: isCircular ? labels.map((_,i)=>chartPalette[i % chartPalette.length]) : (style.fill ? chartPaletteSoft[index % chartPaletteSoft.length] : chartPalette[index % chartPalette.length]),
    borderWidth: isCircular ? 2 : 2,
    tension: style.smooth ? .38 : 0,
    cubicInterpolationMode: style.smooth ? 'monotone' : 'default',
    fill: Boolean(style.fill && style.type === 'line'),
    pointRadius: style.type === 'line' ? 3 : undefined,
    pointHoverRadius: style.type === 'line' ? 5 : undefined
  }));
  const options = {
    responsive:true,
    maintainAspectRatio:false,
    indexAxis: style.indexAxis || 'x',
    interaction: style.comparison ? { mode:'index', intersect:false } : undefined,
    plugins: {
      legend: { position: isCircular || style.comparison || style.type === 'radar' ? 'bottom' : 'top' },
      tooltip: style.money ? { callbacks:{ label: context => `${context.dataset.label}: ${money(context.raw)}` } } : undefined
    },
    scales: isCircular || style.type === 'radar' ? undefined : {
      y: style.indexAxis === 'y' ? undefined : { beginAtZero:true, ticks: style.money ? { callback:value=>money(value) } : undefined },
      x: style.indexAxis === 'y' ? { beginAtZero:true, ticks: style.money ? { callback:value=>money(value) } : undefined } : undefined
    }
  };
  const chart = new Chart(canvas, { type:style.type, data:{ labels, datasets }, options });
  charts.set(id, chart);
}

function dashboardKpis(stats, title) {
  if (/financial|billing|report/i.test(title)) return [
    ['Received Payments',stats.received_payments_amount,'money'],['Outstanding Charges',stats.outstanding_charges_amount,'money'],['Payment Records',stats.total_payments],['Contracts',stats.total_contracts]
  ];
  if (/tenant/i.test(title)) return [
    ['Clients',stats.total_clients],['Tenancies',stats.total_tenancies],['Active Tenancies',stats.active_tenancies],['Payments',stats.total_payments]
  ];
  if (/occupancy|listing/i.test(title)) return [
    ['Properties',stats.total_properties],['Units',stats.total_units],['Occupied Units',stats.occupied_units],['Vacant Units',stats.vacant_units]
  ];
  return [['Properties',stats.total_properties],['Units',stats.total_units],['Clients',stats.total_clients],['Tenancies',stats.total_tenancies]];
}

function chooseColumns(rows, max=8) {
  const preferred = ['id','title','full_name','tenant_name','unit_code','status','contract_status','payment_date','amount','payment_method','receipt_no','reference_no','updated_at','created_at'];
  const keys = [...new Set(rows.flatMap(row => Object.keys(row || {})))];
  return [...preferred.filter(k=>keys.includes(k)), ...keys.filter(k=>!preferred.includes(k) && !/_json$|metadata|search_tsv/.test(k))].slice(0,max);
}

function displayCell(value, key='') {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return escapeHtml(safeJson(value).replace(/\s+/g,' ').slice(0,140));
  if (/amount|rent|balance|cost|price|charge|fee/i.test(key) && Number.isFinite(Number(value))) return escapeHtml(money(value));
  return escapeHtml(String(value));
}

function tableHtml(rows, columns = chooseColumns(rows)) {
  if (!rows.length) return '<div class="amani-empty">No live Amani records found.</div>';
  return `<div class="amani-table-wrap"><table class="table table-striped table-hover amani-table"><thead><tr>${columns.map(c=>`<th>${escapeHtml(labelize(c))}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map(c=>`<td title="${escapeHtml(typeof row[c]==='object'?safeJson(row[c]):row[c])}">${displayCell(row[c],c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

async function renderDashboard(profile) {
  const main = document.getElementById('amani-main');
  try {
    const analytics = (await api('/api/admin/live/analytics')).data || {};
    const stats = analytics.stats || {}; const chartDefs = profile.charts || [];
    const recent = analytics.recent?.[profile.table] || [];
    main.innerHTML = `${pageHeader(profile)}<div class="row">${dashboardKpis(stats,profile.title).map(x=>kpiHtml(...x)).join('')}</div>
      <div class="row">${chartDefs.map((key,i)=>`<div class="col-xl-6 mb-3"><div class="amani-panel"><h5>${escapeHtml(chartTitle(key))}</h5><div class="amani-chart"><canvas id="amani-chart-${i}"></canvas></div></div></div>`).join('')}</div>
      <div class="amani-panel"><div class="d-flex justify-content-between align-items-center mb-3"><h5 class="mb-0">Recent ${escapeHtml(labelize(profile.table))}</h5><a class="btn btn-sm btn-outline-secondary" href="${resourceLink(profile.table)}">Open records</a></div>${tableHtml(recent)}</div>`;
    chartDefs.forEach((key,i)=>renderChart(`amani-chart-${i}`,key,analytics.charts?.[key]));
  } catch (error) { main.innerHTML = `${pageHeader(profile)}<div class="alert alert-danger"><strong>Live data unavailable.</strong> ${escapeHtml(error.message)}</div>`; }
}

function resourceLink(resource) {
  const entry = Object.entries(profiles).find(([,p]) => p.type==='resource' && p.resource===resource);
  return entry ? entry[0] : 'index.html';
}


let resourceMeta = null;
let currentRows = [];
let currentResource = null;
let currentMeta = null;

async function getResourceMeta(resource) {
  if (!resourceMeta) resourceMeta = (await api('/api/admin/live/resources')).data || [];
  return resourceMeta.find(x => x.key === resource);
}

function actionsCell(row) {
  return `<div class="btn-group btn-group-sm"><button class="btn btn-outline-secondary" data-action="view" data-id="${escapeHtml(row.id)}">View</button><button class="btn btn-outline-primary" data-action="edit" data-id="${escapeHtml(row.id)}">Edit</button><button class="btn btn-outline-danger" data-action="delete" data-id="${escapeHtml(row.id)}">Delete</button></div>`;
}

function resourceTable(rows) {
  if (!rows.length) return '<div class="amani-empty">No live Amani records found.</div>';
  const displayRows = rows.map(row => recordForDisplay(row,currentMeta));
  const cols = chooseColumns(displayRows,7);
  return `<div class="amani-table-wrap"><table class="table table-striped table-hover amani-table"><thead><tr>${cols.map(c=>`<th>${escapeHtml(labelize(c))}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${rows.map((row,index)=>`<tr>${cols.map(c=>`<td>${displayCell(displayRows[index][c],c)}</td>`).join('')}<td>${actionsCell(row)}</td></tr>`).join('')}</tbody></table></div>`;
}

const BOOLEAN_FIELDS = new Set([
  'featured','has_multiple_units','available_for_public','is_listed','is_active','is_primary','is_published',
  'is_primary_record','is_notice_given','contract_email_sent','contract_whatsapp_sent','is_verified','is_recurring',
  'is_synthetic','email_sent','whatsapp_sent'
]);

function isJsonField(field, meta) {
  return field.endsWith('_json') || field === 'metadata' ||
    (meta?.key === 'agents' && ['languages','status','specialties'].includes(field));
}

function isTechnicalField(field, meta) {
  return isJsonField(field, meta) || /template|legacy_json|is_synthetic/i.test(field);
}

function fieldsForMeta(meta, technical = false) {
  const writable = meta?.writable || [];
  if (technical) return writable;
  const required = new Set(meta?.required || []);
  return writable.filter(field => required.has(field) || !isTechnicalField(field, meta));
}

function recordForDisplay(row, meta, technical = false) {
  if (technical || !row || typeof row !== 'object') return row;
  return Object.fromEntries(Object.entries(row).filter(([field]) => !isTechnicalField(field, meta)));
}

function isNumberField(field) {
  return /amount|rent|balance|cost|price|fee|count|floors|units|bedrooms|bathrooms|toilets|kitchens|slots|depth|order|year_built|billing_day|occupant_count|square_|area_sqft|floor_no|office_rooms|attempts|bytes|delay/i.test(field);
}

function isDateField(field) {
  return /_date$|^date_of_birth$|^start_date$|^end_date$|^signed_date$|^activation_date$|^due_date$/.test(field);
}

function fieldInput(field, value, required, meta) {
  const raw = value === undefined || value === null ? '' : (typeof value === 'object' ? safeJson(value) : String(value));
  const req = required ? 'required' : '';
  if (isJsonField(field, meta)) return `<textarea class="form-control" rows="3" name="${escapeHtml(field)}" ${req}>${escapeHtml(raw)}</textarea>`;
  if (BOOLEAN_FIELDS.has(field)) return `<select class="form-select" name="${escapeHtml(field)}" ${req}><option value="">—</option><option value="true" ${raw==='true'?'selected':''}>True</option><option value="false" ${raw==='false'?'selected':''}>False</option></select>`;
  const type = isDateField(field) ? 'date' : (isNumberField(field) ? 'number' : 'text');
  const step = type === 'number' ? 'step="any"' : '';
  return `<input class="form-control" type="${type}" ${step} name="${escapeHtml(field)}" value="${escapeHtml(raw)}" ${req}>`;
}

function parseField(field, value, meta) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (BOOLEAN_FIELDS.has(field)) return text === 'true';
  if (isJsonField(field, meta)) {
    try { return JSON.parse(text); }
    catch { throw new Error(`${labelize(field)} must contain valid JSON.`); }
  }
  if (isNumberField(field) && /^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  return text;
}

function modalShell(title, body, footer='') {
  let host = document.getElementById('amani-modal-host');
  if (!host) { host = document.createElement('div'); host.id='amani-modal-host'; document.body.appendChild(host); }
  host.innerHTML = `<div class="modal fade" tabindex="-1"><div class="modal-dialog modal-xl modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">${escapeHtml(title)}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body">${body}</div>${footer?`<div class="modal-footer">${footer}</div>`:''}</div></div></div>`;
  const modalEl = host.querySelector('.modal'); const modal = new bootstrap.Modal(modalEl); modal.show(); return { modal, modalEl };
}

function showRecord(row) {
  const shown = recordForDisplay(row,currentMeta);
  modalShell('Amani Record', `<div class="amani-json">${escapeHtml(safeJson(shown))}</div>`, '<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>');
}

async function showForm(meta, row=null) {
  const fields = fieldsForMeta(meta);
  const form = fields.map(field => `<div class="col-md-6 mb-3"><label class="form-label">${escapeHtml(labelize(field))}${meta.required.includes(field)?' *':''}</label>${fieldInput(field,row?.[field],meta.required.includes(field),meta)}</div>`).join('');
  const { modal, modalEl } = modalShell(row ? `Edit ${meta.label}` : `Create ${meta.label}`, `<form id="amani-record-form"><div class="row">${form}</div><div class="alert alert-danger d-none" id="amani-form-error"></div></form>`, `<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="amani-save-record">Save to Amani DB</button>`);
  modalEl.querySelector('#amani-save-record').addEventListener('click', async () => {
    const formEl = modalEl.querySelector('#amani-record-form');
    if (!formEl.reportValidity()) return;
    try {
      const body = {}; const fd = new FormData(formEl);
      for (const field of fields) { const parsed = parseField(field, fd.get(field),meta); if (parsed !== null) body[field] = parsed; }
      const path = row ? `/api/admin/live/${encodeURIComponent(currentResource)}/${encodeURIComponent(row.id)}` : `/api/admin/live/${encodeURIComponent(currentResource)}`;
      await api(path,{method:row?'PATCH':'POST',body:JSON.stringify(body)});
      modal.hide(); await loadResourceRows();
    } catch (error) {
      const el=modalEl.querySelector('#amani-form-error'); el.classList.remove('d-none'); el.textContent=error.message;
    }
  });
}

async function deleteRecord(row) {
  if (!confirm(`Delete this ${currentResource} record from the Amani database?\n\nID: ${row.id}\n\nDatabase constraints will block deletion when the record is still required by related Amani data.`)) return;
  try { await api(`/api/admin/live/${encodeURIComponent(currentResource)}/${encodeURIComponent(row.id)}`,{method:'DELETE'}); await loadResourceRows(); }
  catch (error) { alert(`Amani delete was not completed: ${error.message}`); }
}

async function loadResourceRows(search='') {
  const table = document.getElementById('amani-resource-table'); if (!table) return;
  table.innerHTML = '<div class="amani-empty">Loading live Amani records…</div>';
  const qs = new URLSearchParams({limit:'200'}); if (search) qs.set('search',search);
  try {
    const payload = await api(`/api/admin/live/${encodeURIComponent(currentResource)}?${qs}`);
    currentRows = payload.data || [];
    table.innerHTML = resourceTable(currentRows);
    document.getElementById('amani-record-count').textContent = `${number(payload.meta?.total ?? currentRows.length)} database record(s)`;
    table.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', async () => {
      const row = currentRows.find(x => String(x.id) === btn.dataset.id); if (!row) return;
      if (btn.dataset.action==='view') showRecord(row);
      if (btn.dataset.action==='edit') await showForm(await getResourceMeta(currentResource),row);
      if (btn.dataset.action==='delete') await deleteRecord(row);
    }));
  } catch (error) { table.innerHTML = `<div class="alert alert-danger">${escapeHtml(error.message)}</div>`; }
}


async function renderResource(profile) {
  currentResource = profile.resource; const main=document.getElementById('amani-main');
  try {
    const meta = await getResourceMeta(currentResource);
    currentMeta = meta;
    if (!meta) throw new Error(`Backend does not expose the Amani resource “${currentResource}”.`);
    main.innerHTML = `${pageHeader(profile, 'Admin view: operational fields and business actions only. Technical JSON/template fields are intentionally excluded from this application.')}<div class="amani-panel"><div class="d-flex gap-2 justify-content-between align-items-center flex-wrap mb-3"><div><h5 class="mb-0">${escapeHtml(meta.label)}</h5><small id="amani-record-count" class="text-muted">Loading…</small></div><div class="d-flex gap-2"><input id="amani-search" class="form-control form-control-sm" placeholder="Search live records"><button id="amani-create" class="btn btn-sm btn-success"><i class="bi bi-plus-lg"></i> Create</button></div></div><div id="amani-resource-table"></div></div>`;
    document.getElementById('amani-create').addEventListener('click',()=>showForm(meta));
    let timer; document.getElementById('amani-search').addEventListener('input',e=>{clearTimeout(timer);timer=setTimeout(()=>loadResourceRows(e.target.value.trim()),250);});
    await loadResourceRows();
  } catch(error) { main.innerHTML = `${pageHeader(profile)}<div class="alert alert-danger">${escapeHtml(error.message)}</div>`; }
}


async function boot() {
  const profile = profiles[filename()] || profiles['index.html'];
  renderShell(profile); checkBackend();
  if (profile.type === 'resource') await renderResource(profile);
  else await renderDashboard(profile);
}

boot();
