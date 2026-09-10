(() => {
  const $ = id => document.getElementById(id);
  const canvas = $("preview");
  const ctx = canvas.getContext("2d");
  const W = 1080, H = 1920;
  let photo = null, photoURL = null;
  const logo = new Image();
  logo.src = "umbrella-logo.png";
  const state = { zoom:100, x:50, y:50, panelY:0 };

  const defaults1 = [["Placeholder1",2],["Placeholder2",1]];
  const defaults2 = [["Placeholder3",1]];

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function text(v,fallback=""){return String(v ?? "").trim() || fallback;}
  function fitFont(value,max,min,width,weight="800"){
    let size=max;
    while(size>min){ctx.font=`${weight} ${size}px Arial`;if(ctx.measureText(value).width<=width)break;size--;}
    return size;
  }

  function addScorer(listId,name="",goals=1){
    const row=document.createElement("div");row.className="scorer-row";
    row.innerHTML='<input class="scorer-name" type="text" maxlength="22" placeholder="Placeholder"><input class="scorer-goals" type="number" min="1" max="99"><button class="remove" type="button" aria-label="Remove scorer">×</button>';
    row.querySelector(".scorer-name").value=name;
    row.querySelector(".scorer-goals").value=goals;
    row.querySelector(".remove").addEventListener("click",()=>{row.remove();draw();});
    row.querySelectorAll("input").forEach(i=>i.addEventListener("input",draw));
    $(listId).appendChild(row);
  }
  function getScorers(id){return [...$(id).querySelectorAll(".scorer-row")].map(r=>({name:text(r.querySelector(".scorer-name").value),goals:clamp(parseInt(r.querySelector(".scorer-goals").value||1,10),1,99)})).filter(x=>x.name);}

  // Template geometry: vertical adaptation of the supplied reference silhouette.
  function framePath(){
    const p=new Path2D();
    p.moveTo(62,210);p.lineTo(820,210);p.lineTo(955,105);p.lineTo(1018,105);p.lineTo(1018,1850);p.lineTo(62,1850);p.closePath();
    return p;
  }
  function innerPhotoPath(){
    const p=new Path2D();
    p.moveTo(83,236);p.lineTo(810,236);p.lineTo(932,140);p.lineTo(991,140);p.lineTo(991,1818);p.lineTo(83,1818);p.closePath();return p;
  }

  // Local high-quality texture generation so preview/export can never be blocked by CORS.
  function brushedSteel(){
    const c=document.createElement("canvas");c.width=720;c.height=720;const x=c.getContext("2d");
    const g=x.createLinearGradient(0,0,720,0);g.addColorStop(0,"#777d80");g.addColorStop(.28,"#aeb3b5");g.addColorStop(.52,"#8b9194");g.addColorStop(.78,"#b9bdbe");g.addColorStop(1,"#747a7d");x.fillStyle=g;x.fillRect(0,0,720,720);
    for(let i=0;i<720;i++){let a=.035+Math.random()*.055;x.fillStyle=`rgba(255,255,255,${a})`;x.fillRect(0,i,720,1)}
    for(let i=0;i<900;i++){const y=Math.random()*720;x.fillStyle=`rgba(0,0,0,${.015+Math.random()*.025})`;x.fillRect(0,y,720,Math.random()*2+1)}
    return ctx.createPattern(c,"repeat");
  }
  function diamondPlate(){
    const c=document.createElement("canvas");c.width=160;c.height=160;const x=c.getContext("2d");
    x.fillStyle="#9fa5a8";x.fillRect(0,0,160,160);
    for(let y=-80;y<240;y+=40){for(let xx=-80;xx<240;xx+=40){
      x.save();x.translate(xx,y);x.rotate(Math.PI/4);
      const g=x.createLinearGradient(-15,-15,15,15);g.addColorStop(0,"#dfe2e3");g.addColorStop(.42,"#aeb4b7");g.addColorStop(1,"#686e71");x.fillStyle=g;x.fillRect(-14,-14,28,28);
      x.strokeStyle="rgba(35,38,39,.5)";x.lineWidth=1.5;x.strokeRect(-14,-14,28,28);x.restore();
    }}
    return ctx.createPattern(c,"repeat");
  }
  const metal=brushedSteel(), diamond=diamondPlate();

  function drawPhoto(){
    if(!photo)return;
    const p=innerPhotoPath();ctx.save();ctx.clip(p);
    const iw=photo.naturalWidth||photo.width,ih=photo.naturalHeight||photo.height;
    const boxW=908,boxH=1678;
    const scale=Math.max(boxW/iw,boxH/ih)*(state.zoom/100);
    const dw=iw*scale,dh=ih*scale;
    const x=83-(dw-boxW)*(state.x/100),y=140-(dh-boxH)*(state.y/100);
    ctx.drawImage(photo,x,y,dw,dh);ctx.restore();
  }

  function roundedRect(x,y,w,h,r){const p=new Path2D();p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);p.closePath();return p;}

  function drawInfoBox(){
    const boxW=900,boxH=600;
    const x=(W-boxW)/2, baseY=1020, y=baseY+(state.panelY/24)*420;
    const p=roundedRect(x,y,boxW,boxH,24);
    ctx.save();ctx.fillStyle="rgba(5,6,7,.72)";ctx.fill(p);ctx.strokeStyle="rgba(235,238,239,.82)";ctx.lineWidth=3;ctx.stroke(p);
    ctx.strokeStyle="rgba(255,255,255,.14)";ctx.lineWidth=1;ctx.stroke(roundedRect(x+12,y+12,boxW-24,boxH-24,17));ctx.restore();

    const t1=text($("team1").value,"Team 1").toUpperCase(),t2=text($("team2").value,"Team 2").toUpperCase();
    const s1=String(clamp(parseInt($("score1").value||0,10),0,99)),s2=String(clamp(parseInt($("score2").value||0,10),0,99));
    const leftX=x+220,rightX=x+680,mid=x+450;
    ctx.textBaseline="middle";ctx.textAlign="center";ctx.fillStyle="#f5f5f5";
    let fs=fitFont(t1,42,20,300,"800");ctx.font=`800 ${fs}px Arial`;ctx.fillText(t1,leftX,y+80);
    fs=fitFont(t2,42,20,300,"800");ctx.font=`800 ${fs}px Arial`;ctx.fillText(t2,rightX,y+80);
    ctx.fillStyle="#fff";ctx.font="800 66px Arial";ctx.fillText(`${s1} - ${s2}`,mid,y+84);
    ctx.fillStyle="#ff0000";ctx.fillRect(mid-38,y+125,76,3);

    const list1=getScorers("scorers1"),list2=getScorers("scorers2");
    ctx.textAlign="left";ctx.fillStyle="#fff";ctx.font="800 16px Arial";ctx.fillText(t1,leftX-185,y+170);
    ctx.fillText(t2,rightX-185,y+170);
    drawScorerColumn(list1,leftX-185,y+210,370);
    drawScorerColumn(list2,rightX-185,y+210,370);
  }

  function drawScorerColumn(list,x,y,width){
    const max=7,rowH=45;ctx.textBaseline="middle";
    if(!list.length){ctx.fillStyle="#999";ctx.font="600 14px Arial";ctx.fillText("No scorers",x,y);return;}
    list.slice(0,max).forEach((s,i)=>{const yy=y+i*rowH;const f=fitFont(s.name,24,13,width-55,"700");ctx.font=`700 ${f}px Arial`;ctx.fillStyle="#f1f2f2";ctx.fillText(s.name,x,yy);ctx.textAlign="right";ctx.font="800 18px Arial";ctx.fillStyle="#fff";ctx.fillText(`×${s.goals}`,x+width,yy);ctx.textAlign="left";ctx.fillStyle="rgba(255,255,255,.13)";ctx.fillRect(x,yy+18,width,1);});
    if(list.length>max){ctx.fillStyle="#999";ctx.font="600 12px Arial";ctx.fillText(`+${list.length-max} more`,x,y+max*rowH);}
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // Never leave the canvas black while an image/asset is loading.
    ctx.fillStyle=metal;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.fillStyle=diamond;ctx.fill(framePath());ctx.restore();
    drawPhoto();
    ctx.save();ctx.strokeStyle="#151719";ctx.lineWidth=18;ctx.stroke(framePath());ctx.strokeStyle="rgba(255,255,255,.45)";ctx.lineWidth=2;ctx.stroke(framePath());ctx.restore();

    // Logo only. No extra labels or technical text on the exported graphic.
    if(logo.complete && logo.naturalWidth)ctx.drawImage(logo,62,38,380,105);
    else {ctx.fillStyle="#fff";ctx.font="800 28px Arial";ctx.fillText("UMBRELLA",62,82);ctx.font="800 18px Arial";ctx.fillText("CORPORATION",62,108);}

    // restrained red brand accents, not a red border
    ctx.fillStyle="#ff0000";ctx.fillRect(62,164,330,4);ctx.fillRect(935,164,56,4);
    drawInfoBox();
  }

  function updatePositionUI(){
    $("zoomValue").textContent=state.zoom+"%";$("xValue").textContent=state.x+"%";$("yValue").textContent=state.y+"%";$("panelYValue").textContent=(state.panelY>0?"+":"")+state.panelY+"%";
  }
  function sync(){state.zoom=+$('zoom').value;state.x=+$('posX').value;state.y=+$('posY').value;state.panelY=+$('panelY').value;updatePositionUI();draw();}

  function loadFile(file){
    if(!file)return;
    if(!/^image\/(jpeg|png|webp)$/.test(file.type)){alert("Please choose a JPG, PNG, or WEBP image.");return;}
    if(photoURL)URL.revokeObjectURL(photoURL);photoURL=URL.createObjectURL(file);const img=new Image();
    img.onload=()=>{photo=img;$("fileName").textContent=file.name;$("zoom").value=100;$("posX").value=50;$("posY").value=50;sync();};
    img.onerror=()=>{photo=null;draw();alert("That image could not be loaded. Please try another JPG, PNG, or WEBP file.");};img.src=photoURL;
  }

  $("chooseImage").addEventListener("click",e=>{e.stopPropagation();$("imageInput").click();});
  $("dropzone").addEventListener("click",()=>$("imageInput").click());
  $("dropzone").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")$("imageInput").click();});
  $("imageInput").addEventListener("change",e=>loadFile(e.target.files[0]));
  ["dragenter","dragover"].forEach(ev=>$("dropzone").addEventListener(ev,e=>{e.preventDefault();$("dropzone").classList.add("drag");}));
  ["dragleave","drop"].forEach(ev=>$("dropzone").addEventListener(ev,e=>{e.preventDefault();$("dropzone").classList.remove("drag");}));
  $("dropzone").addEventListener("drop",e=>loadFile(e.dataTransfer.files[0]));

  ["team1","team2","score1","score2"].forEach(id=>$(id).addEventListener("input",draw));
  ["zoom","posX","posY","panelY"].forEach(id=>$(id).addEventListener("input",sync));
  $("addScorer1").addEventListener("click",()=>addScorer("scorers1","",1));
  $("addScorer2").addEventListener("click",()=>addScorer("scorers2","",1));
  $("resetPosition").addEventListener("click",()=>{$("zoom").value=100;$("posX").value=50;$("posY").value=50;sync();});
  $("resetPanel").addEventListener("click",()=>{$("panelY").value=0;sync();});
  $("resetAll").addEventListener("click",()=>{
    $("team1").value="Team 1";$("team2").value="Team 2";$("score1").value=4;$("score2").value=2;
    $("scorers1").innerHTML="";$("scorers2").innerHTML="";defaults1.forEach(s=>addScorer("scorers1",s[0],s[1]));defaults2.forEach(s=>addScorer("scorers2",s[0],s[1]));
    $("zoom").value=100;$("posX").value=50;$("posY").value=50;$("panelY").value=0;
    if(photoURL)URL.revokeObjectURL(photoURL);photo=null;photoURL=null;$("imageInput").value="";$("fileName").textContent="No image selected";sync();
  });

  $("download").addEventListener("click",()=>{draw();canvas.toBlob(blob=>{if(!blob){alert("PNG export failed. Please try again.");return;}const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="Umbrella-Template.png";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},1000);},"image/png");});

  defaults1.forEach(s=>addScorer("scorers1",s[0],s[1]));defaults2.forEach(s=>addScorer("scorers2",s[0],s[1]));
  updatePositionUI();draw();
  logo.onload=draw;logo.onerror=draw;
})();
