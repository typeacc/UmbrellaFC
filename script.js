(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const canvas = $("preview");
  const ctx = canvas.getContext("2d");
  const W = 1080, H = 1920;

  const TEXTURES = {
    metal: "https://cdn.architextures.org/textures/23/6/stainless-steel-none-g8nd1f.jpg",
    diamond: "https://img.magnific.com/premium-photo/metal-diamond-plate-surface-seamless-tileable-texture_226262-1043.jpg?semt=ais_hybrid&w=740&q=80"
  };

  const state = {
    photo: null,
    photoURL: null,
    zoom: 100, x: 50, y: 50,
    boxY: 50,
    logoSize: 100,
    scorers: [
      { name: "placeholder1", goals: 2, team: 1 },
      { name: "placeholder2", goals: 1, team: 1 },
      { name: "placeholder3", goals: 1, team: 2 }
    ]
  };

  const logo = new Image();
  logo.src = "umbrella-logo.png";
  let metalImage = null, diamondImage = null;
  let metalReady = false, diamondReady = false;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function safe(v, fallback = "") { return String(v ?? "").trim() || fallback; }
  function roundRectPath(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + rr, y); c.lineTo(x + w - rr, y);
    c.quadraticCurveTo(x + w, y, x + w, y + rr); c.lineTo(x + w, y + h - rr);
    c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h); c.lineTo(x + rr, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - rr); c.lineTo(x, y + rr);
    c.quadraticCurveTo(x, y, x + rr, y); c.closePath();
  }

  function makeMetalFallback() {
    const c = document.createElement("canvas"); c.width = 700; c.height = 700;
    const x = c.getContext("2d"); x.fillStyle = "#b9bdbe"; x.fillRect(0, 0, 700, 700);
    for (let i = 0; i < 700; i += 2) { x.fillStyle = i % 4 ? "rgba(255,255,255,.08)" : "rgba(70,75,77,.035)"; x.fillRect(i, 0, 1, 700); }
    for (let i = 0; i < 700; i += 24) { x.fillStyle = "rgba(255,255,255,.045)"; x.fillRect(0, i, 700, 2); }
    return c;
  }
  function makeDiamondFallback() {
    const c = document.createElement("canvas"); c.width = 180; c.height = 180;
    const x = c.getContext("2d"); x.fillStyle = "#9ea4a7"; x.fillRect(0,0,180,180);
    for (let y = -180; y < 360; y += 45) for (let xx = -180; xx < 360; xx += 45) {
      x.beginPath(); x.moveTo(xx+22,y); x.lineTo(xx+44,y+22); x.lineTo(xx+22,y+44); x.lineTo(xx,y+22); x.closePath();
      x.fillStyle = "#aeb4b7"; x.fill(); x.strokeStyle = "rgba(45,48,49,.42)"; x.lineWidth = 2; x.stroke();
      x.fillStyle = "rgba(255,255,255,.14)"; x.beginPath(); x.moveTo(xx+22,y); x.lineTo(xx+44,y+22); x.lineTo(xx+22,y+27); x.closePath(); x.fill();
    }
    return c;
  }
  const metalFallback = makeMetalFallback();
  const diamondFallback = makeDiamondFallback();

  function loadTexture(url, setter, flagSetter) {
    const im = new Image(); im.crossOrigin = "anonymous";
    im.onload = () => { setter(im); flagSetter(true); render(); };
    im.onerror = () => { flagSetter(false); render(); };
    im.src = url;
  }
  loadTexture(TEXTURES.metal, v => metalImage = v, v => metalReady = v);
  loadTexture(TEXTURES.diamond, v => diamondImage = v, v => diamondReady = v);

  function getTexture(img, fallback) { return ctx.createPattern(img || fallback, "repeat"); }

  function drawMetalBackground() {
    ctx.fillStyle = getTexture(metalReady ? metalImage : null, metalFallback); ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "rgba(255,255,255,.055)"; ctx.fillRect(0,0,W,H);
  }

  function photoRect() {
    return { x: 58, y: 250, w: 964, h: 1540 };
  }
  function drawPhoto() {
    const r = photoRect();
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    if (!state.photo) {
      ctx.fillStyle = "#17191a"; ctx.fillRect(r.x,r.y,r.w,r.h);
      ctx.fillStyle = "#858b8e"; ctx.textAlign = "center"; ctx.font = "700 30px Arial";
      ctx.fillText("SELECT A MATCH PHOTO", W/2, H/2);
      ctx.restore(); return;
    }
    const iw = state.photo.naturalWidth || state.photo.width, ih = state.photo.naturalHeight || state.photo.height;
    const scale = Math.max(r.w/iw, r.h/ih) * state.zoom/100;
    const dw = iw*scale, dh = ih*scale;
    const x = r.x - (dw-r.w)*(state.x/100), y = r.y - (dh-r.h)*(state.y/100);
    ctx.drawImage(state.photo, x, y, dw, dh);
    ctx.restore();
  }

  function drawDiamondFrame() {
    const r = photoRect();
    const outer = 34;
    const p = getTexture(diamondReady ? diamondImage : null, diamondFallback);
    ctx.fillStyle = p;
    ctx.fillRect(r.x-outer, r.y-outer, r.w+outer*2, r.h+outer*2);
    ctx.fillStyle = "rgba(255,255,255,.04)";
    ctx.fillRect(r.x-outer, r.y-outer, r.w+outer*2, outer);
    ctx.fillRect(r.x-outer, r.y+r.h, r.w+outer*2, outer);
    ctx.fillRect(r.x-outer, r.y, outer, r.h);
    ctx.fillRect(r.x+r.w, r.y, outer, r.h);
  }

  function drawLogo() {
    if (!logo.complete || !logo.naturalWidth) return;
    const maxW = 310 * state.logoSize/100;
    const maxH = 180 * state.logoSize/100;
    const scale = Math.min(maxW/logo.naturalWidth, maxH/logo.naturalHeight);
    const w = logo.naturalWidth*scale, h = logo.naturalHeight*scale;
    ctx.drawImage(logo, 55, 45, w, h);
  }

  function drawHeaderText() {
    ctx.fillStyle = "#111"; ctx.font = "700 16px Arial"; ctx.textAlign = "left"; ctx.fillText("MATCH", 58, 215);
    ctx.fillStyle = "#777"; ctx.fillRect(58,225,964,2);
  }

  function fitText(text, maxWidth, start, weight = 800) {
    let size = start;
    while (size > 18) {
      ctx.font = `${weight} ${size}px Arial`;
      if (ctx.measureText(text).width <= maxWidth) return size;
      size -= 2;
    }
    return size;
  }

  function getScorers(team) { return state.scorers.filter(s => s.team === team && safe(s.name)); }

  function drawScorerColumn(items, x, y, w, title, align) {
    ctx.textAlign = align;
    ctx.fillStyle = "#fff"; ctx.font = "800 24px Arial"; ctx.fillText(title, x, y);
    let yy = y + 50;
    if (!items.length) { ctx.fillStyle = "#aeb4b7"; ctx.font = "500 22px Arial"; ctx.fillText("—", x, yy); return; }
    const maxRows = 7;
    const shown = items.slice(0,maxRows);
    let fs = shown.length > 5 ? 19 : shown.length > 3 ? 21 : 23;
    ctx.font = `600 ${fs}px Arial`;
    shown.forEach(s => {
      ctx.fillStyle = "#f5f5f5"; ctx.fillText(s.name, x, yy);
      ctx.fillStyle = "#ff0000"; ctx.font = `800 ${fs}px Arial`;
      const goalText = `×${s.goals}`;
      const nameWidth = ctx.measureText(s.name).width;
      const gx = align === "left" ? x + nameWidth + 12 : x - nameWidth - 12;
      ctx.fillText(goalText, gx, yy);
      ctx.font = `600 ${fs}px Arial`;
      yy += Math.max(34, fs + 13);
    });
  }

  function drawInfoBox() {
    const team1 = safe($("team1").value, "Team 1");
    const team2 = safe($("team2").value, "Team 2");
    const score1 = clamp(parseInt($("score1").value || 0,10),0,99);
    const score2 = clamp(parseInt($("score2").value || 0,10),0,99);
    const y = H * (state.boxY/100);
    const w = 910, h = 475, x = (W-w)/2, top = y-h/2;

    ctx.save();
    roundRectPath(ctx,x,top,w,h,26); ctx.fillStyle="rgba(5,5,5,.72)"; ctx.fill();
    ctx.strokeStyle="rgba(245,245,245,.78)"; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle="#ff0000"; ctx.fillRect(x+34,top+32,110,4);

    const leftX=x+95, rightX=x+w-95, centerX=W/2;
    const teamFs1=fitText(team1,300,35), teamFs2=fitText(team2,300,35);
    ctx.fillStyle="#f5f5f5"; ctx.textAlign="left"; ctx.font=`800 ${teamFs1}px Arial`; ctx.fillText(team1,leftX,top+92);
    ctx.textAlign="right"; ctx.font=`800 ${teamFs2}px Arial`; ctx.fillText(team2,rightX,top+92);

    // Compact score: deliberately smaller than the team names' visual footprint.
    ctx.textAlign="center"; ctx.fillStyle="#fff"; ctx.font="800 58px Arial"; ctx.fillText(`${score1}  —  ${score2}`,centerX,top+92);
    ctx.fillStyle="rgba(245,245,245,.28)"; ctx.fillRect(x+44,top+125,w-88,1);

    drawScorerColumn(getScorers(1), leftX, top+180, 340, "GOALS", "left");
    drawScorerColumn(getScorers(2), rightX, top+180, 340, "GOALS", "right");

    ctx.restore();
  }

  function render() {
    // Always paint the whole canvas first so a failed texture/photo can never leave a black screen.
    ctx.clearRect(0,0,W,H);
    drawMetalBackground();
    drawLogo();
    drawHeaderText();
    drawDiamondFrame();
    drawPhoto();
    drawInfoBox();
  }

  function addScorer(data = {name:"placeholder1",goals:1,team:1}) {
    state.scorers.push({name:data.name, goals:data.goals, team:data.team});
    renderScorerInputs(); render();
  }
  function renderScorerInputs() {
    const wrap=$("scorers"); wrap.innerHTML="";
    state.scorers.forEach((s,i)=>{
      const row=document.createElement("div"); row.className="scorer-row";
      const name=document.createElement("input"); name.type="text"; name.maxLength=24; name.value=s.name; name.placeholder="placeholder1";
      const goals=document.createElement("input"); goals.type="number"; goals.min=1; goals.max=99; goals.value=s.goals;
      const remove=document.createElement("button"); remove.type="button"; remove.className="remove"; remove.textContent="×"; remove.title="Remove";
      const team=document.createElement("select"); team.setAttribute("aria-label","Scorer team");
      team.innerHTML=`<option value="1">Team 1</option><option value="2">Team 2</option>`; team.value=String(s.team);
      row.style.gridTemplateColumns="minmax(0,1fr) 58px 78px 30px";
      row.append(name,goals,team,remove); wrap.appendChild(row);
      name.addEventListener("input",()=>{s.name=name.value;render();});
      goals.addEventListener("input",()=>{s.goals=clamp(parseInt(goals.value||1,10),1,99);render();});
      team.addEventListener("change",()=>{s.team=Number(team.value);render();});
      remove.addEventListener("click",()=>{state.scorers.splice(i,1);renderScorerInputs();render();});
    });
  }

  function setFile(file) {
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return;
    if (state.photoURL) URL.revokeObjectURL(state.photoURL);
    state.photoURL=URL.createObjectURL(file);
    const im=new Image();
    im.onload=()=>{state.photo=im;$("fileName").textContent=file.name;render();};
    im.onerror=()=>{state.photo=null;$("fileName").textContent="Could not read that image";render();};
    im.src=state.photoURL;
  }

  $("chooseImage").addEventListener("click",()=>$("imageInput").click());
  $("imageInput").addEventListener("change",e=>setFile(e.target.files[0]));
  const dz=$("dropzone");
  ["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add("drag");}));
  ["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove("drag");}));
  dz.addEventListener("drop",e=>setFile(e.dataTransfer.files[0]));
  dz.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){$("imageInput").click();}});

  ["team1","team2","score1","score2"].forEach(id=>$(id).addEventListener("input",render));
  $("addScorer").addEventListener("click",()=>addScorer({name:`placeholder${state.scorers.length+1}`,goals:1,team:1}));

  function bindRange(id, valueId, key, format=v=>`${v}%`) {
    $(id).addEventListener("input",()=>{state[key]=Number($(id).value);$(valueId).textContent=format(state[key]);render();});
  }
  bindRange("boxY","boxYValue","boxY");
  bindRange("zoom","zoomValue","zoom");
  bindRange("posX","xValue","x");
  bindRange("posY","yValue","y");
  bindRange("logoSize","logoSizeValue","logoSize");
  $("resetPosition").addEventListener("click",()=>{
    state.zoom=100;state.x=50;state.y=50;
    $("zoom").value=100;$("posX").value=50;$("posY").value=50;
    $("zoomValue").textContent="100%";$("xValue").textContent="50%";$("yValue").textContent="50%";render();
  });

  function resetAll(){
    $("team1").value="Umbrella FC";$("team2").value="RPD FC";$("score1").value=4;$("score2").value=2;
    state.scorers=[{name:"placeholder1",goals:2,team:1},{name:"placeholder2",goals:1,team:1},{name:"placeholder3",goals:1,team:2}];
    state.boxY=50;state.zoom=100;state.x=50;state.y=50;state.logoSize=100;
    ["boxY","zoom","posX","posY","logoSize"].forEach(id=>$(id).value=id==="boxY"?50:100);
    $("posX").value=50;$("posY").value=50;
    $("boxYValue").textContent="50%";$("zoomValue").textContent="100%";$("xValue").textContent="50%";$("yValue").textContent="50%";$("logoSizeValue").textContent="100%";
    renderScorerInputs();render();
  }
  $("resetAll").addEventListener("click",resetAll);

  async function exportPNG(){
    render();
    try {
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Export failed")),"image/png",1));
      const url=URL.createObjectURL(blob), a=document.createElement("a"); a.href=url;a.download="umbrella-match-graphic.png";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    } catch(e) {
      // If a third-party texture blocks canvas export, repaint using only local fallbacks and export safely.
      metalReady=false;diamondReady=false;render();
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png",1));
      if(blob){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="umbrella-match-graphic.png";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
      else alert("The graphic could not be exported. Please try again.");
    }
  }
  $("download").addEventListener("click",exportPNG);$("downloadTop").addEventListener("click",exportPNG);

  logo.onload=render;
  renderScorerInputs();
  render();
})();
