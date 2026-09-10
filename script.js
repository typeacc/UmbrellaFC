(() => {
  const $ = id => document.getElementById(id);
  const canvas = $("preview"), ctx = canvas.getContext("2d");
  const W = 1920, H = 1080;
  let photo = null;
  let photoURL = null;
  let logo = new Image();
  logo.src = "umbrella-logo.png";

  const state = { zoom:100, x:50, y:50 };
  const defaultScorers = [
    ["Leon Kennedy",2],["Chris Redfield",1],["Jill Valentine",1]
  ];

  function escText(v){ return String(v ?? "").trim(); }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

  function addScorer(name="", goals=1){
    const row=document.createElement("div");
    row.className="scorer-row";
    row.innerHTML=`<input class="scorer-name" type="text" maxlength="24" placeholder="Player name"><input class="scorer-goals" type="number" min="1" max="99" value="${goals}"><button class="remove" type="button" title="Remove scorer" aria-label="Remove scorer">×</button>`;
    row.querySelector(".scorer-name").value=name;
    row.querySelector(".remove").addEventListener("click",()=>{row.remove(); update();});
    row.querySelectorAll("input").forEach(i=>i.addEventListener("input",update));
    $("scorers").appendChild(row); updateCount();
  }
  function updateCount(){ $("scorerCount").textContent=$(".scorer-row", $("scorers"))?.length ?? $("scorers").children.length; }

  function getScorers(){
    return [...$("scorers").querySelectorAll(".scorer-row")].map(row=>({
      name:escText(row.querySelector(".scorer-name").value),
      goals:clamp(parseInt(row.querySelector(".scorer-goals").value||1,10),1,99)
    })).filter(s=>s.name);
  }

  function pathTemplate(){
    // The silhouette follows the supplied reference: a large rectangular content field
    // with the distinctive angled upper-right shoulder.
    const p=new Path2D();
    p.moveTo(108,190); p.lineTo(1450,190); p.lineTo(1665,82); p.lineTo(1845,82);
    p.lineTo(1845,998); p.lineTo(108,998); p.closePath();
    return p;
  }

  function metalPattern(base="#8c9497"){
    const c=document.createElement("canvas"); c.width=180; c.height=180;
    const x=c.getContext("2d"); x.fillStyle=base; x.fillRect(0,0,180,180);
    for(let i=0;i<180;i+=3){x.fillStyle=`rgba(255,255,255,${0.018+Math.random()*0.025})`;x.fillRect(0,i,180,1)}
    for(let i=-180;i<360;i+=24){x.strokeStyle="rgba(0,0,0,.035)";x.lineWidth=8;x.beginPath();x.moveTo(i,0);x.lineTo(i+180,180);x.stroke()}
    return ctx.createPattern(c,"repeat");
  }
  function diamondPattern(){
    const c=document.createElement("canvas");c.width=72;c.height=72;const x=c.getContext("2d");
    x.fillStyle="#aeb4b7";x.fillRect(0,0,72,72);
    x.strokeStyle="rgba(40,43,44,.55)";x.lineWidth=2;
    for(let y=-72;y<144;y+=24){for(let xx=-72;xx<144;xx+=24){
      x.beginPath();x.moveTo(xx+12,y);x.lineTo(xx+24,y+12);x.lineTo(xx+12,y+24);x.lineTo(xx,y+12);x.closePath();x.stroke();
      x.fillStyle="rgba(255,255,255,.11)";x.fill();
      x.fillStyle="rgba(0,0,0,.07)";x.beginPath();x.moveTo(xx+12,y+24);x.lineTo(xx+24,y+12);x.lineTo(xx+12,y+18);x.closePath();x.fill();
    }}
    return ctx.createPattern(c,"repeat");
  }

  let metal=metalPattern(), diamond=diamondPattern();

  function drawPhoto(){
    if(!photo) return;
    ctx.save(); ctx.clip(pathTemplate());
    const iw=photo.naturalWidth||photo.width, ih=photo.naturalHeight||photo.height;
    const shapeW=1737, shapeH=916;
    const scale=Math.max(shapeW/iw,shapeH/ih)*(state.zoom/100);
    const dw=iw*scale, dh=ih*scale;
    const x=108-(dw-shapeW)*(state.x/100);
    const y=82-(dh-shapeH)*(state.y/100);
    ctx.drawImage(photo,x,y,dw,dh);
    ctx.restore();
  }

  function roundedRectPath(x,y,w,h,r){
    const p=new Path2D();p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);
    p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);p.lineTo(x+r,y+h);
    p.quadraticCurveTo(x,y+h,x,y+h-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);p.closePath();return p;
  }

  function fitFont(text,maxPx,minPx,maxWidth,weight="800",family="Arial"){
    let size=maxPx;ctx.font=`${weight} ${size}px ${family}`;
    while(size>minPx && ctx.measureText(text).width>maxWidth){size--;ctx.font=`${weight} ${size}px ${family}`}
    return size;
  }

  function drawPanel(){
    const p=roundedRectPath(520,355,910,545,28);
    ctx.save();
    ctx.fillStyle="rgba(5,7,8,.66)";ctx.fill(p);
    ctx.strokeStyle="rgba(235,238,239,.72)";ctx.lineWidth=3;ctx.stroke(p);
    ctx.strokeStyle="rgba(255,0,0,.8)";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(552,355);ctx.lineTo(850,355);ctx.stroke();
    ctx.restore();

    const t1=escText($("team1").value)||"TEAM 1", t2=escText($("team2").value)||"TEAM 2";
    ctx.textBaseline="middle";ctx.textAlign="center";
    const teamMax=320;
    ctx.fillStyle="#f5f5f5";
    let fs=fitFont(t1,54,26,teamMax,"800");ctx.font=`800 ${fs}px Arial`;ctx.fillText(t1,735,445);
    fs=fitFont(t2,54,26,teamMax,"800");ctx.font=`800 ${fs}px Arial`;ctx.fillText(t2,1215,445);

    const s1=String(clamp(parseInt($("score1").value||0,10),0,99)), s2=String(clamp(parseInt($("score2").value||0,10),0,99));
    ctx.fillStyle="#fff";ctx.font="900 104px Arial";ctx.fillText(`${s1} - ${s2}`,975,448);
    ctx.fillStyle="#ff0000";ctx.fillRect(948,500,54,4);

    const scorers=getScorers();
    ctx.textAlign="left";ctx.fillStyle="#ff3333";ctx.font="900 20px Arial";ctx.letterSpacing="3px";ctx.fillText("GOALS",585,548);
    const maxRows=Math.min(scorers.length,7);
    const rowH=maxRows>4?42:48;
    const startY=594;
    if(!scorers.length){
      ctx.fillStyle="#a8adaf";ctx.font="600 21px Arial";ctx.fillText("No scorers entered",585,startY);
    } else {
      const maxName=680;
      for(let i=0;i<maxRows;i++){
        const s=scorers[i], yy=startY+i*rowH;
        const f=fitFont(s.name,25,15,maxName,"700");
        ctx.font=`700 ${f}px Arial`;ctx.fillStyle="#f0f1f2";ctx.fillText(s.name,585,yy);
        ctx.textAlign="right";ctx.fillStyle="#fff";ctx.font=`900 ${Math.max(19,f)}px Arial`;ctx.fillText(`×${s.goals}`,1360,yy);ctx.textAlign="left";
        ctx.fillStyle="rgba(255,255,255,.12)";ctx.fillRect(585,yy+18,775,1);
      }
      if(scorers.length>7){ctx.fillStyle="#8d9396";ctx.font="600 14px Arial";ctx.fillText(`+ ${scorers.length-7} MORE`,585,startY+7*rowH)}
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // Base lab metal
    ctx.fillStyle=metal;ctx.fillRect(0,0,W,H);
    const sheen=ctx.createLinearGradient(0,0,0,H);sheen.addColorStop(0,"rgba(255,255,255,.22)");sheen.addColorStop(.35,"rgba(255,255,255,.02)");sheen.addColorStop(1,"rgba(0,0,0,.15)");ctx.fillStyle=sheen;ctx.fillRect(0,0,W,H);
    // Diamond plate border/frame
    ctx.save();ctx.fillStyle=diamond;ctx.fill(pathTemplate());ctx.restore();
    // Inner black separation line and photo
    drawPhoto();
    ctx.save();ctx.clip(pathTemplate());ctx.fillStyle="rgba(0,0,0,.07)";ctx.fillRect(0,0,W,H);ctx.restore();
    // Cut-out center edge
    ctx.save();ctx.strokeStyle="#111";ctx.lineWidth=20;ctx.stroke(pathTemplate());ctx.strokeStyle="#ff0000";ctx.lineWidth=5;ctx.stroke(pathTemplate());ctx.restore();

    // Header/logo
    if(logo.complete) ctx.drawImage(logo,92,52,365,101);
    ctx.fillStyle="rgba(5,5,5,.7)";ctx.fillRect(90,158,420,2);
    ctx.fillStyle="#f5f5f5";ctx.font="700 12px Arial";ctx.fillText("FOOTBALL DIVISION // MATCH REPORT",96,178);

    // small technical frame marks
    ctx.fillStyle="#ff0000";ctx.fillRect(1540,82,86,4);ctx.fillRect(1728,82,117,4);
    ctx.fillStyle="rgba(255,255,255,.65)";ctx.font="700 11px Arial";ctx.fillText("UMB // 1920-1080",1640,65);

    drawPanel();

    // bottom technical strip
    ctx.fillStyle="rgba(5,5,5,.72)";ctx.fillRect(108,1001,1737,30);
    ctx.fillStyle="#cdd2d4";ctx.font="700 10px Arial";ctx.fillText("UMBRELLA CORPORATION • SPORTS MEDIA UNIT",125,1020);
    ctx.textAlign="right";ctx.fillText("INTERNAL USE // LOCAL RENDER",1828,1020);ctx.textAlign="left";
  }

  function update(){
    state.zoom=+$("zoom").value;state.x=+$("posX").value;state.y=+$("posY").value;
    $("zoomValue").textContent=state.zoom+"%";$("xValue").textContent=state.x+"%";$("yValue").textContent=state.y+"%";
    updateCount();draw();
  }

  $("chooseImage").addEventListener("click",()=>$("imageInput").click());
  $("dropzone").addEventListener("click",e=>{if(e.target.id!=="chooseImage")$("imageInput").click()});
  $("dropzone").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")$("imageInput").click()});
  $("imageInput").addEventListener("change",e=>loadFile(e.target.files[0]));
  ["dragenter","dragover"].forEach(ev=>$("dropzone").addEventListener(ev,e=>{e.preventDefault();$("dropzone").classList.add("drag")}));
  ["dragleave","drop"].forEach(ev=>$("dropzone").addEventListener(ev,e=>{e.preventDefault();$("dropzone").classList.remove("drag")}));
  $("dropzone").addEventListener("drop",e=>loadFile(e.dataTransfer.files[0]));

  function loadFile(file){
    if(!file)return;
    if(!/^image\/(jpeg|png|webp)$/.test(file.type)){alert("Please choose a JPG, PNG, or WEBP image.");return;}
    if(photoURL)URL.revokeObjectURL(photoURL);
    photoURL=URL.createObjectURL(file);photo=new Image();
    photo.onload=()=>{ $("fileName").textContent=file.name;state.zoom=100;state.x=50;state.y=50;$("zoom").value=100;$("posX").value=50;$("posY").value=50;update(); };
    photo.src=photoURL;
  }

  ["team1","team2","score1","score2"].forEach(id=>$(id).addEventListener("input",update));
  ["zoom","posX","posY"].forEach(id=>$(id).addEventListener("input",update));
  $("addScorer").addEventListener("click",()=>addScorer("",1));

  $("resetPosition").addEventListener("click",()=>{
    $("zoom").value=100;$("posX").value=50;$("posY").value=50;update();
  });

  $("resetAll").addEventListener("click",()=>{
    $("team1").value="Umbrella FC";$("team2").value="RPD FC";$("score1").value=4;$("score2").value=2;
    $("scorers").innerHTML="";defaultScorers.forEach(s=>addScorer(s[0],s[1]));
    $("zoom").value=100;$("posX").value=50;$("posY").value=50;
    if(photoURL)URL.revokeObjectURL(photoURL);photo=null;photoURL=null;$("imageInput").value="";$("fileName").textContent="No image selected";update();
  });

  $("download").addEventListener("click",()=>{
    draw();
    canvas.toBlob(blob=>{
      if(!blob)return;
      const a=document.createElement("a");a.href=URL.createObjectURL(blob);
      const t1=(escText($("team1").value)||"Team1").replace(/[^a-z0-9]+/gi,"-");
      const t2=(escText($("team2").value)||"Team2").replace(/[^a-z0-9]+/gi,"-");
      a.download=`Umbrella-Match-${t1}-vs-${t2}.png`;document.body.appendChild(a);a.click();
      setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
    },"image/png");
  });

  logo.onload=draw;
  defaultScorers.forEach(s=>addScorer(s[0],s[1]));
  update();
})();
