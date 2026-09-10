(() => {
  const $ = id => document.getElementById(id);
  const canvas = $("preview");
  const ctx = canvas.getContext("2d", { alpha: false });
  const W = 1080, H = 1920;
  const TEXTURE_METAL = "https://cdn.architextures.org/textures/23/6/stainless-steel-none-g8nd1f.jpg";
  const TEXTURE_DIAMOND = "https://img.magnific.com/premium-photo/metal-diamond-plate-surface-seamless-tileable-texture_226262-1043.jpg?semt=ais_hybrid&w=740&q=80";
  let photo = null, photoURL = null;
  let metalImg = null, diamondImg = null;
  let logo = new Image(); logo.src = "umbrella-logo.png";
  const state = { zoom:100, x:50, y:50, panelY:50, logoSize:100 };
  const defaults = [["Placeholder1",2,"1"],["Placeholder2",1,"1"],["Placeholder3",1,"2"]];

  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function text(v,fallback=""){const s=String(v??"").trim();return s||fallback}
  function makePattern(kind){
    const c=document.createElement("canvas"); c.width=256;c.height=256; const x=c.getContext("2d");
    if(kind==="metal"){
      x.fillStyle="#c5c8c9";x.fillRect(0,0,256,256);
      for(let i=0;i<256;i++){x.fillStyle=`rgba(255,255,255,${0.06+Math.random()*0.05})`;x.fillRect(0,i,256,1)}
      for(let i=0;i<256;i+=5){x.fillStyle="rgba(0,0,0,.025)";x.fillRect(i,0,1,256)}
    }else{
      x.fillStyle="#aeb3b5";x.fillRect(0,0,256,256);
      x.strokeStyle="rgba(45,48,49,.6)";x.lineWidth=2;
      for(let y=-64;y<320;y+=32)for(let xx=-64;xx<320;xx+=32){x.beginPath();x.moveTo(xx+16,y);x.lineTo(xx+32,y+16);x.lineTo(xx+16,y+32);x.lineTo(xx,y+16);x.closePath();x.fillStyle="rgba(255,255,255,.13)";x.fill();x.stroke()}
    }
    return x.createPattern(c,"repeat");
  }
  let metalPattern=makePattern("metal"), diamondPattern=makePattern("diamond");

  async function loadTexture(url,onload){
    try{
      const response=await fetch(url,{mode:"cors",cache:"force-cache"});
      if(!response.ok)throw new Error("texture request failed");
      const blob=await response.blob();
      const img=new Image();
      const objectUrl=URL.createObjectURL(blob);
      img.onload=()=>{URL.revokeObjectURL(objectUrl);onload(img)};
      img.onerror=()=>{URL.revokeObjectURL(objectUrl)};
      img.src=objectUrl;
    }catch(e){
      // The procedural local fallback remains active if a texture host blocks the request.
    }
  }
  loadTexture(TEXTURE_METAL,img=>{metalImg=img;draw()});
  loadTexture(TEXTURE_DIAMOND,img=>{diamondImg=img;draw()});

  function framePath(){
    const p=new Path2D();
    p.moveTo(74,310);p.lineTo(770,310);p.lineTo(930,225);p.lineTo(1006,225);p.lineTo(1006,1845);p.lineTo(74,1845);p.closePath();return p;
  }
  function innerPhotoPath(){
    const p=new Path2D();p.moveTo(105,350);p.lineTo(784,350);p.lineTo(899,290);p.lineTo(965,290);p.lineTo(965,1804);p.lineTo(105,1804);p.closePath();return p;
  }
  function patternFrom(img,fallback){return img && img.complete && img.naturalWidth ? ctx.createPattern(img,"repeat") : fallback}

  function drawPhoto(){
    const p=innerPhotoPath();
    ctx.save();ctx.clip(p);ctx.fillStyle="#111";ctx.fillRect(0,0,W,H);
    if(!photo){
      ctx.fillStyle="#181818";ctx.fillRect(105,290,860,1520);
      ctx.fillStyle="#a0a0a0";ctx.font="700 28px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("SELECT A MATCH PHOTO",535,1050);
      ctx.restore();return;
    }
    const iw=photo.naturalWidth||photo.width,ih=photo.naturalHeight||photo.height;
    const shapeW=860,shapeH=1514,scale=Math.max(shapeW/iw,shapeH/ih)*(state.zoom/100),dw=iw*scale,dh=ih*scale;
    const x=105-(dw-shapeW)*(state.x/100), y=290-(dh-shapeH)*(state.y/100);
    ctx.drawImage(photo,x,y,dw,dh);ctx.restore();
  }
  function roundedPath(x,y,w,h,r){const p=new Path2D();p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);p.closePath();return p}
  function fitFont(str,max,min,width,weight="800"){let s=max;ctx.font=`${weight} ${s}px Arial`;while(s>min&&ctx.measureText(str).width>width){s--;ctx.font=`${weight} ${s}px Arial`}return s}
  function getScorers(){return [...$("scorers").querySelectorAll(".scorer-row")].map(r=>({name:text(r.querySelector(".scorer-name").value),goals:clamp(parseInt(r.querySelector(".scorer-goals").value||1,10),1,99),team:r.querySelector(".scorer-team").value})).filter(s=>s.name)}
  function panelY(){return 930 + (state.panelY-50)*4.8}

  function drawLogo(){
    if(!logo.complete||!logo.naturalWidth)return;
    const baseW=285*(state.logoSize/100),baseH=baseW*(logo.naturalHeight/logo.naturalWidth);
    ctx.drawImage(logo,72,70,baseW,baseH);
  }

  function drawInfoPanel(){
    const y=panelY(),x=145,w=790,h=570,r=30;
    const p=roundedPath(x,y,w,h,r);
    ctx.save();ctx.fillStyle="rgba(5,7,8,.72)";ctx.fill(p);ctx.strokeStyle="rgba(230,233,234,.72)";ctx.lineWidth=2;ctx.stroke(p);ctx.restore();

    const t1=text($("team1").value,"TEAM 1"),t2=text($("team2").value,"TEAM 2");
    const s1=String(clamp(parseInt($("score1").value||0,10),0,99)),s2=String(clamp(parseInt($("score2").value||0,10),0,99));
    ctx.textBaseline="middle";ctx.textAlign="center";ctx.fillStyle="#f5f5f5";
    let f=fitFont(t1,34,20,225,"800");ctx.font=`800 ${f}px Arial`;ctx.fillText(t1,x+155,y+76);
    f=fitFont(t2,34,20,225,"800");ctx.font=`800 ${f}px Arial`;ctx.fillText(t2,x+w-155,y+76);
    ctx.fillStyle="#fff";ctx.font="900 62px Arial";ctx.fillText(`${s1} - ${s2}`,x+w/2,y+77);

    const scorers=getScorers();
    const left=scorers.filter(s=>s.team==="1"), right=scorers.filter(s=>s.team==="2");
    ctx.font="800 15px Arial";ctx.fillStyle="#dfe2e3";ctx.fillText("SCORERS",x+190,y+137);ctx.fillText("SCORERS",x+w-190,y+137);
    ctx.fillStyle="rgba(255,255,255,.2)";ctx.fillRect(x+40,y+165,w-80,1);
    function list(arr,cx,align){
      ctx.textAlign=align; const max=6,rowH=46; const shown=arr.slice(0,max); 
      shown.forEach((s,i)=>{const yy=y+215+i*rowH;const nm=fitFont(s.name,23,15,260,"700");ctx.font=`700 ${nm}px Arial`;ctx.fillStyle="#f2f3f3";ctx.fillText(s.name,cx,yy);ctx.font="800 20px Arial";ctx.fillStyle="#fff";ctx.fillText(`×${s.goals}`,align==="left"?cx+270:cx-270,yy)});
      if(arr.length>max){ctx.font="600 12px Arial";ctx.fillStyle="#999";ctx.fillText(`+${arr.length-max} more`,cx,y+215+max*rowH)}
      if(!arr.length){ctx.font="600 14px Arial";ctx.fillStyle="#858b8d";ctx.fillText("—",cx,y+215)}
    }
    list(left,x+75,"left");list(right,x+w-75,"right");
  }

  function draw(){
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);
    // Always paint a safe fallback first so the preview can never be an empty black canvas.
    ctx.fillStyle="#c7cbcc";ctx.fillRect(0,0,W,H);
    const metal=patternFrom(metalImg,metalPattern);ctx.fillStyle=metal;ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(255,255,255,.08)";ctx.fillRect(0,0,W,180);
    const frame=framePath();const diamond=patternFrom(diamondImg,diamondPattern);
    ctx.fillStyle=diamond;ctx.fill(frame);
    drawPhoto();
    // No red border and no black outline around the diamond plate.
    drawLogo();
    drawInfoPanel();
  }

  function update(){
    state.zoom=+$('zoom').value;state.x=+$('posX').value;state.y=+$('posY').value;state.panelY=+$('panelY').value;state.logoSize=+$('logoSize').value;
    $('zoomValue').textContent=state.zoom+'%';$('xValue').textContent=state.x+'%';$('yValue').textContent=state.y+'%';$('panelYValue').textContent=state.panelY+'%';$('logoSizeValue').textContent=state.logoSize+'%';
    $('scorerCount').textContent=$('scorers').children.length;draw();
  }
  function addScorer(name="",goals=1,team="1"){
    const row=document.createElement('div');row.className='scorer-row';row.innerHTML='<input class="scorer-name" type="text" maxlength="24" placeholder="Player"><input class="scorer-goals" type="number" min="1" max="99" value="1"><select class="scorer-team" aria-label="Scorer team"><option value="1">T1</option><option value="2">T2</option></select><button class="remove" type="button" aria-label="Remove">×</button>';
    row.querySelector('.scorer-name').value=name;row.querySelector('.scorer-goals').value=goals;row.querySelector('.scorer-team').value=team;
    row.querySelectorAll('input,select').forEach(e=>e.addEventListener('input',update));row.querySelector('.remove').addEventListener('click',()=>{row.remove();update()});$('scorers').appendChild(row);update();
  }
  function loadFile(file){if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)){alert('Please choose a JPG, PNG, or WEBP image.');return}if(photoURL)URL.revokeObjectURL(photoURL);photoURL=URL.createObjectURL(file);photo=new Image();photo.onload=()=>{$('fileName').textContent=file.name;state.zoom=100;state.x=50;state.y=50;$('zoom').value=100;$('posX').value=50;$('posY').value=50;update()};photo.onerror=()=>{photo=null;draw()};photo.src=photoURL}

  $('chooseImage').addEventListener('click',e=>{e.stopPropagation();$('imageInput').click()});$('dropzone').addEventListener('click',e=>{if(e.target!==$('chooseImage'))$('imageInput').click()});$('dropzone').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')$('imageInput').click()});$('imageInput').addEventListener('change',e=>loadFile(e.target.files[0]));
  ['dragenter','dragover'].forEach(ev=>$('dropzone').addEventListener(ev,e=>{e.preventDefault();$('dropzone').classList.add('drag')}));['dragleave','drop'].forEach(ev=>$('dropzone').addEventListener(ev,e=>{e.preventDefault();$('dropzone').classList.remove('drag')}));$('dropzone').addEventListener('drop',e=>loadFile(e.dataTransfer.files[0]));
  ['team1','team2','score1','score2','zoom','posX','posY','panelY','logoSize'].forEach(id=>$(id).addEventListener('input',update));$('addScorer').addEventListener('click',()=>addScorer('',1,'1'));$('resetPosition').addEventListener('click',()=>{$('zoom').value=100;$('posX').value=50;$('posY').value=50;update()});
  $('resetAll').addEventListener('click',()=>{$('team1').value='TEAM 1';$('team2').value='TEAM 2';$('score1').value=0;$('score2').value=0;$('scorers').innerHTML='';defaults.forEach(s=>addScorer(...s));$('zoom').value=100;$('posX').value=50;$('posY').value=50;$('panelY').value=50;$('logoSize').value=100;if(photoURL)URL.revokeObjectURL(photoURL);photo=null;photoURL=null;$('imageInput').value='';$('fileName').textContent='No image selected';update()});
  function download(){draw();canvas.toBlob(blob=>{if(!blob){alert('PNG export failed.');return}const a=document.createElement('a');const u=URL.createObjectURL(blob);a.href=u;a.download='Umbrella-Graphic.png';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},1000)},'image/png')}
  $('download').addEventListener('click',download);$('downloadTop').addEventListener('click',download);
  defaults.forEach(s=>addScorer(...s));
  logo.onload=draw;logo.onerror=draw;update();
})();
