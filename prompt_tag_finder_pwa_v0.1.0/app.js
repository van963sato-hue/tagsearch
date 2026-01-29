/* Prompt Tag Finder v0.1.0 */
const DATA_URL = "./data/tags.v0.1.0.json";

const $ = (id) => document.getElementById(id);

const state = {
  data: [],
  version: "",
  selected: new Set(),
};

function norm(s){
  return (s ?? "").toString().trim().toLowerCase();
}
function tokenSplit(q){
  return q.split(/[,\s、　]+/).map(t=>t.trim()).filter(Boolean);
}
function keyOf(row){
  // tag_en が空ならJPで代用（基本はENが主）
  return row.tag_en ? `en:${row.tag_en}` : `jp:${row.tag_jp}`;
}
function loadSelected(){
  try{
    const raw = localStorage.getItem("ptf.selected");
    if(!raw) return;
    const arr = JSON.parse(raw);
    state.selected = new Set(arr);
  }catch{}
}
function saveSelected(){
  try{
    localStorage.setItem("ptf.selected", JSON.stringify([...state.selected]));
  }catch{}
}
function buildSelectOptions(rows){
  const cats = new Set(["（すべて）"]);
  const srcs = new Set(["（すべて）"]);
  for(const r of rows){
    if(r.category_jp) cats.add(r.category_jp);
    if(r.source_site) srcs.add(r.source_site);
  }
  const catSel = $("fCategory");
  const srcSel = $("fSource");
  catSel.innerHTML = "";
  srcSel.innerHTML = "";
  for(const v of [...cats].sort()){
    const o = document.createElement("option");
    o.value = v === "（すべて）" ? "" : v;
    o.textContent = v;
    catSel.appendChild(o);
  }
  for(const v of [...srcs].sort()){
    const o = document.createElement("option");
    o.value = v === "（すべて）" ? "" : v;
    o.textContent = v;
    srcSel.appendChild(o);
  }
}
function passesFilters(r){
  const cat = $("fCategory").value;
  const src = $("fSource").value;
  if(cat && r.category_jp !== cat) return false;
  if(src && r.source_site !== src) return false;

  const nsfwOn = $("fNSFW").checked;
  const nsfwMax = parseInt($("fNsfwMax").value, 10);
  const incAge = $("fAgeRisk").checked;
  const incCon = $("fConsentRisk").checked;

  const isNSFW = norm(r.rating) === "nsfw";
  if(isNSFW){
    if(!nsfwOn) return false;
    if((r.nsfw_level ?? 0) > nsfwMax) return false;
    if(r.age_risk && !incAge) return false;
    if(r.consent_risk && !incCon) return false;
  }else{
    // SFWなら年齢/同意リスクは気にせず通す（必要ならここで弾ける）
  }
  return true;
}
function matchesQuery(r, tokens){
  if(tokens.length === 0) return true;
  const hay = [
    norm(r.tag_en),
    norm(r.tag_jp),
    norm(r.category_jp),
    norm(r.source_site),
  ].join(" ");
  return tokens.every(t => hay.includes(norm(t)));
}
function renderSelected(){
  const selectedRows = state.data.filter(r => state.selected.has(keyOf(r)));
  const en = [];
  const jp = [];
  for(const r of selectedRows){
    if(r.tag_en) en.push(r.tag_en);
    if(r.tag_jp) jp.push(r.tag_jp);
  }
  $("outEN").value = en.join(", ");
  $("outJP").value = jp.join("、");
}
function badge(label, cls){
  const b = document.createElement("span");
  b.className = "badge" + (cls ? ` ${cls}` : "");
  b.textContent = label;
  return b;
}
function renderList(rows){
  const q = $("q").value.trim();
  const tokens = tokenSplit(q);
  const list = $("list");
  list.innerHTML = "";

  const filtered = rows
    .filter(passesFilters)
    .filter(r => matchesQuery(r, tokens));

  $("hitCount").textContent = filtered.length.toString();

  // sort: SFW first, then shorter tag, then category
  filtered.sort((a,b)=>{
    const aN = norm(a.rating)==="nsfw" ? 1 : 0;
    const bN = norm(b.rating)==="nsfw" ? 1 : 0;
    if(aN !== bN) return aN - bN;
    const aLen = (a.tag_en || a.tag_jp || "").length;
    const bLen = (b.tag_en || b.tag_jp || "").length;
    if(aLen !== bLen) return aLen - bLen;
    return (a.category_jp || "").localeCompare(b.category_jp || "");
  });

  // limit (UI軽量化)
  const shown = filtered.slice(0, 400);

  for(const r of shown){
    const item = document.createElement("div");
    item.className = "item";
    const k = keyOf(r);
    const selected = state.selected.has(k);
    if(selected) item.classList.add("sel");

    const top = document.createElement("div");
    top.className = "itemTop";
    const left = document.createElement("div");
    left.style.flex = "1";

    const badges = document.createElement("div");
    badges.className = "badges";
    if(r.category_jp) badges.appendChild(badge(r.category_jp));
    if(r.source_site) badges.appendChild(badge(r.source_site));
    if(norm(r.rating)==="nsfw") badges.appendChild(badge(`NSFW${r.nsfw_level ?? ""}`, "nsfw"));
    if(r.age_risk) badges.appendChild(badge("age_risk", "risk"));
    if(r.consent_risk) badges.appendChild(badge("consent_risk", "risk"));

    const body = document.createElement("div");
    body.className = "itemBody";
    const en = r.tag_en ? `EN: ${r.tag_en}` : "";
    const jp = r.tag_jp ? `JP: ${r.tag_jp}` : "";
    body.textContent = [en, jp].filter(Boolean).join("   ");

    const small = document.createElement("div");
    small.className = "small";
    small.textContent = r.source_url ? r.source_url : "";

    left.appendChild(badges);
    left.appendChild(body);
    if(r.source_url) left.appendChild(small);

    top.appendChild(left);
    item.appendChild(top);

    item.addEventListener("click", ()=>{
      if(state.selected.has(k)) state.selected.delete(k);
      else state.selected.add(k);
      saveSelected();
      renderSelected();
      renderList(state.data);
    });

    list.appendChild(item);
  }

  if(filtered.length > shown.length){
    const more = document.createElement("div");
    more.className = "small";
    more.style.marginTop = "6px";
    more.textContent = `表示は先頭 ${shown.length} 件まで（検索語やフィルタで絞ってね）`;
    list.appendChild(more);
  }
}
async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    toast("コピーしたよ");
  }catch{
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    toast("コピーしたよ");
  }
}
function toast(msg){
  // tiny toast
  let t = document.getElementById("toast");
  if(!t){
    t = document.createElement("div");
    t.id = "toast";
    t.style.position = "fixed";
    t.style.left = "50%";
    t.style.bottom = "18px";
    t.style.transform = "translateX(-50%)";
    t.style.background = "rgba(0,0,0,.7)";
    t.style.color = "white";
    t.style.padding = "10px 12px";
    t.style.borderRadius = "12px";
    t.style.fontSize = "13px";
    t.style.zIndex = "999";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>{ t.style.opacity = "0"; }, 1100);
}

function wire(){
  $("btnClear").addEventListener("click", ()=>{
    $("q").value = "";
    renderList(state.data);
  });
  $("btnCopyEN").addEventListener("click", ()=> copyText($("outEN").value || ""));
  $("btnCopyJP").addEventListener("click", ()=> copyText($("outJP").value || ""));
  $("btnResetSel").addEventListener("click", ()=>{
    state.selected.clear();
    saveSelected();
    renderSelected();
    renderList(state.data);
  });

  const rerender = ()=> renderList(state.data);
  $("q").addEventListener("input", rerender);
  $("fCategory").addEventListener("change", rerender);
  $("fSource").addEventListener("change", rerender);
  $("fNSFW").addEventListener("change", ()=>{
    $("fNsfwMax").disabled = !$("fNSFW").checked;
    rerender();
  });
  $("fNsfwMax").addEventListener("change", rerender);
  $("fAgeRisk").addEventListener("change", rerender);
  $("fConsentRisk").addEventListener("change", rerender);

  // PWA install button
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    $("btnInstall").hidden = false;
  });
  $("btnInstall").addEventListener("click", async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $("btnInstall").hidden = true;
  });

  // Service worker
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }
}

async function init(){
  loadSelected();
  const res = await fetch(DATA_URL);
  const j = await res.json();
  state.version = j.version;
  state.data = j.tags;

  $("datasetInfo").textContent = `data v${j.version} / ${j.count} tags`;

  buildSelectOptions(state.data);
  wire();
  renderSelected();
  renderList(state.data);
}
init().catch(err=>{
  console.error(err);
  $("datasetInfo").textContent = "data load failed";
});
