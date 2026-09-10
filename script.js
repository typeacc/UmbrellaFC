(() => {
  const $ = id => document.getElementById(id);
  const canvas = $("preview"), ctx = canvas.getContext("2d");
  const W = 1080, H = 1920;
  let photo = null, photoURL = null;
  const logo = new Image(); logo.src = "umbrella-logo.png";
  const steel = new Image(); steel.crossOrigin = "anonymous"; steel.src = "https://cdn.architextures.org/textures/23/6/stainless-steel-none-g8nd1f.jpg";
  const plate = new Image(); plate.crossOrigin = "anonymous"; plate.src = "https://img.magnific.com/premium-photo/metal-diamond-plate-surface-seamless-tileable-texture_226262-1043.jpg?semt=ais_hybrid&w=740&q=80";
  const state = { zoom:100, x:50, y:50, panelY:68 };
  const defaults1 = [["Placeholder1",2],["Placeholder2",1],["Placeholder3",1]];
  const defaults2 = [["Placeholder1",2],["Placeholder2",1]];

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const clean=v=>String(v??"").trim();

  function addScorer(team,name="",goals=1){
    const box=$(team===1?"scorers1":"scorers2");
    const row=document.createElement("div"); row.className="scorer-row";
    row.innerHTML='<input class="scorer-name" type="text" maxlength="24" placeholder="Placeholder"><input class="scorer-goals" type="number" min="1" max="99" value="'+goals+'"><button class="remove" type="button" aria-label="Remove scorer">×</button>';
    row.querySelector(".scorer-name").value=name;
    row.querySelector(".remove").addEventListener("click",()=>{row.remove();update()});
    row.querySelectorAll("input").forEach(i=>i.addEventListener("input",update));
    box.appendChild(row); updateCount(team);
  }
  function updateCount(team){$(team===1?"scorerCount1":"scorerCount2").textContent=$(team===1?"scorers1":"scorers2").children.length}
  function getScorers(team){return [...$(team===1?"scorers1":"scorers2").querySelectorAll(".scorer-row")].map(r=>({name:clean(r.querySelector(".scorer-name").value),goals:clamp(parseInt(r.querySelector(".scorer-goals").value||1,10),1,99)})).filter(s=>s.name)}

  function framePath(){
    const p=new Path2D();
    p.moveTo(58,310);p.lineTo(795,310);p.lineTo(935,235);p.lineTo(1022,235);p.lineTo(1022,1830);p.lineTo(58,1830);p.closePath();return p;
  }
  function drawTiled(img, fallback, x,y,w,h){
    if(img.complete&&img.naturalWidth){try{const pat=ctx.createPattern(img,"repeat");ctx.save();ctx.translate(x,y);ctx.fillStyle=pat;ctx.fillRect(0,0,w,h);ctx.restore();return}catch(e){}}
    ctx.fillStyle=fallback;ctx.fillRect(x,y,w,h);
  }
  function drawPhoto(){
    if(!photo)return;
    ctx.save();ctx.clip(framePath());
    const iw=photo.naturalWidth||photo.width,ih=photo.naturalHeight||photo.height;
    const shapeW=964,shapeH=1595;
    const scale=Math.max(shapeW/iw,shapeH/ih)*(state.zoom/100);
    const dw=iw*scale,dh=ih*scale;
    const x=58-(dw-shapeW)*(state.x/100);
    const y=235-(dh-shapeH)*(state.y/100);
    ctx.drawImage(photo,x,y,dw,dh);ctx.restore();
  }
  function roundRect(x,y,w,h,r){const p=new Path2D();p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);p.closePath();return p}
  function fit(text,max,min,width,weight="800"){let s=max;while(s>min){ctx.font=`${weight} ${s}px Arial`;if(ctx.measureText(text).width<=width)break;s--}return s}

  function drawScorerColumn(list,x,y,w,align){
    ctx.textAlign=align;ctx.fillStyle="#ff0000";ctx.font="900 24px Arial";ctx.fillText("GOALS",x,y);
    if(!list.length){ctx.fillStyle="#aeb3b5";ctx.font="600 22px Arial";ctx.fillText("—",x,y+55);return}
    const rowH=list.length>6?47:54;
    list.slice(0,8).forEach((s,i)=>{
      const yy=y+58+i*rowH;const maxName=w-80;const f=fit(s.name,27,16,maxName,"700");ctx.font=`700 ${f}px Arial`;ctx.fillStyle="#f2f3f3";ctx.fillText(s.name,x,yy);
      ctx.font=`900 ${Math.max(18,f)}px Arial`;ctx.fillStyle="#fff";ctx.textAlign=align;const goalX=align==="left"?x+w:x-w;ctx.fillText(`×${s.goals}`,goalX,yy);
      ctx.fillStyle="rgba(255,255,255,.16)";const lineX=align==="left"?x:x-w;ctx.fillRect(lineX,yy+17,w,1);
    });
  }

  function drawInfoPanel(){
    const pw=930,ph=650; const py=H*(state.panelY/100)-ph/2; const px=75;
    const p=roundRect(px,py,pw,ph,28);
    ctx.save();ctx.fillStyle="rgba(5,7,8,.70)";ctx.fill(p);ctx.strokeStyle="rgba(235,238,239,.75)";ctx.lineWidth=3;ctx.stroke(p);ctx.restore();
    ctx.fillStyle="#ff0000";ctx.fillRect(px+35,py+28,190,5);
    const t1=clean($("team1").value)||"TEAM 1",t2=clean($("team2").value)||"TEAM 2";
    const s1=String(clamp(parseInt($("score1").value||0,10),0,99)),s2=String(clamp(parseInt($("score2").value||0,10),0,99));
    ctx.textBaseline="middle";
    ctx.fillStyle="#f5f5f5";ctx.textAlign="center";
    let fs=fit(t1,40,20,250);ctx.font=`800 ${fs}px Arial`;ctx.fillText(t1,px+250,py+112);
    fs=fit(t2,40,20,250);ctx.font=`800 ${fs}px Arial`;ctx.fillText(t2,px+680,py+112);
    ctx.fillStyle="#fff";ctx.font="900 72px Arial";ctx.fillText(`${s1} - ${s2}`,px+465,py+112);
    ctx.fillStyle="#ff0000";ctx.fillRect(px+420,py+158,90,4);
    drawScorerColumn(getScorers(1),px+60,py+215,365,"left");
    drawScorerColumn(getScorers(2),px+870,py+215,365,"right");
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    drawTiled(steel,"#aeb3b5",0,0,W,H);
    ctx.fillStyle="rgba(255,255,255,.08)";ctx.fillRect(0,0,W,H);
    ctx.save();ctx.fillStyle=plate.complete&&plate.naturalWidth?ctx.createPattern(plate,"repeat"):"#aeb4b7";ctx.fill(framePath());ctx.restore();
    drawPhoto();
    ctx.save();ctx.strokeStyle="rgba(0,0,0,.72)";ctx.lineWidth=18;ctx.stroke(framePath());ctx.strokeStyle="rgba(255,255,255,.55)";ctx.lineWidth=3;ctx.stroke(framePath());ctx.restore();
    if(logo.complete&&logo.naturalWidth){ctx.drawImage(logo,72,62,400,111)}
    drawInfoPanel();
  }

  function update(){
    state.zoom=+$('zoom').value;state.x=+$('posX').value;state.y=+$('posY').value;state.panelY=+$('panelY').value;
    $('zoomValue').textContent=state.zoom+"%";$('xValue').textContent=state.x+"%";$('yValue').textContent=state.y+"%";$('panelYValue').textContent=state.panelY+"%";
    updateCount(1);updateCount(2);draw();
  }
  function loadFile(file){if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)){alert("Please choose a JPG, PNG, or WEBP image.");return}if(photoURL)URL.revokeObjectURL(photoURL);photoURL=URL.createObjectURL(file);photo=new Image();photo.onload=()=>{$('fileName').textContent=file.name;state.zoom=100;state.x=50;state.y=50;$('zoom').value=100;$('posX').value=50;$('posY').value=50;update()};photo.src=photoURL}

  $('chooseImage').addEventListener('click',e=>{e.stopPropagation();$('imageInput').click()});$('dropzone').addEventListener('click',e=>{if(e.target.id!=="chooseImage")$('imageInput').click()});$('dropzone').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')$('imageInput').click()});$('imageInput').addEventListener('change',e=>loadFile(e.target.files[0]));
  ['dragenter','dragover'].forEach(ev=>$('dropzone').addEventListener(ev,e=>{e.preventDefault();$('dropzone').classList.add('drag')}));['dragleave','drop'].forEach(ev=>$('dropzone').addEventListener(ev,e=>{e.preventDefault();$('dropzone').classList.remove('drag')}));$('dropzone').addEventListener('drop',e=>loadFile(e.dataTransfer.files[0]));
  ['team1','team2','score1','score2'].forEach(id=>$(id).addEventListener('input',update));['zoom','posX','posY','panelY'].forEach(id=>$(id).addEventListener('input',update));
  $('addScorer1').addEventListener('click',()=>addScorer(1,"",1));$('addScorer2').addEventListener('click',()=>addScorer(2,"",1));
  $('resetPosition').addEventListener('click',()=>{$('zoom').value=100;$('posX').value=50;$('posY').value=50;update()});$('resetPanelPosition').addEventListener('click',()=>{$('panelY').value=68;update()});
  $('resetAll').addEventListener('click',()=>{ $('team1').value='Umbrella FC';$('team2').value='RPD FC';$('score1').value=4;$('score2').value=2;$('scorers1').innerHTML='';$('scorers2').innerHTML='';defaults1.forEach(s=>addScorer(1,s[0],s[1]));defaults2.forEach(s=>addScorer(2,s[0],s[1]));$('zoom').value=100;$('posX').value=50;$('posY').value=50;$('panelY').value=68;if(photoURL)URL.revokeObjectURL(photoURL);photo=null;photoURL=null;$('imageInput').value='';$('fileName').textContent='No image selected';update()});
  $('download').addEventListener('click',()=>{draw();canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement('a');a.href=URL.createObjectURL(blob);const t1=(clean($('team1').value)||'Team1').replace(/[^a-z0-9]+/gi,'-');const t2=(clean($('team2').value)||'Team2').replace(/[^a-z0-9]+/gi,'-');a.download=`Umbrella-Match-${t1}-vs-${t2}.png`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)},'image/png')});
  [logo,steel,plate].forEach(img=>img.addEventListener('load',draw));
  defaults1.forEach(s=>addScorer(1,s[0],s[1]));defaults2.forEach(s=>addScorer(2,s[0],s[1]));update();
})();
