(() => {
  const $ = id => document.getElementById(id);
  const canvas = $("preview"), ctx = canvas.getContext("2d");
  const W = 1080, H = 1920;
  let photo = null, photoURL = null;
  const logo = new Image(); logo.src = "umbrella-logo.png";
  const state = {zoom:100,x:50,y:50};
  const defaultScorers = [["Placeholder1",2],["Placeholder2",1],["Placeholder3",1]];
  const esc = v => String(v ?? "").trim();
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));

  function addScorer(name="",goals=1){
    const row=document.createElement("div"); row.className="scorer-row";
    row.innerHTML='<input class="scorer-name" type="text" maxlength="24" placeholder="Player name"><input class="scorer-goals" type="number" min="1" max="99" value="'+goals+'"><button class="remove" type="button" aria-label="Remove scorer">×</button>';
    row.querySelector(".scorer-name").value=name;
    row.querySelector(".remove").addEventListener("click",()=>{row.remove();update()});
    row.querySelectorAll("input").forEach(i=>i.addEventListener("input",update));
    $("scorers").appendChild(row); updateCount();
  }
  function updateCount(){ $("scorerCount").textContent=$("scorers").children.length; }
  function getScorers(){return [...$("scorers").querySelectorAll(".scorer-row")].map(r=>({name:esc(r.querySelector(".scorer-name").value),goals:clamp(parseInt(r.querySelector(".scorer-goals").value||1,10),1,99)})).filter(s=>s.name)}

  // Matches the supplied vertical reference: large rectangular photo area with an angled upper-right corner.
  function framePath(){
    const p=new Path2D();
    p.moveTo(54,220); p.lineTo(720,220); p.lineTo(905,92); p.lineTo(1032,92);
    p.lineTo(1032,1868); p.lineTo(54,1868); p.closePath(); return p;
  }
  function makeMetal(){
    const c=document.createElement("canvas");c.width=180;c.height=180;const x=c.getContext("2d");
    const g=x.createLinearGradient(0,0,180,180);g.addColorStop(0,"#c9ced0");g.addColorStop(.35,"#aeb5b8");g.addColorStop(.7,"#d5d9da");g.addColorStop(1,"#9da5a8");x.fillStyle=g;x.fillRect(0,0,180,180);
    for(let i=0;i<180;i+=3){x.fillStyle=`rgba(255,255,255,${.018+Math.random()*.028})`;x.fillRect(0,i,180,1)}
    for(let i=-180;i<360;i+=30){x.strokeStyle="rgba(40,45,47,.045)";x.lineWidth=9;x.beginPath();x.moveTo(i,0);x.lineTo(i+180,180);x.stroke()}
    return ctx.createPattern(c,"repeat");
  }
  function makeDiamond(){
    const c=document.createElement("canvas");c.width=72;c.height=72;const x=c.getContext("2d");
    x.fillStyle="#b9c0c3";x.fillRect(0,0,72,72);
    for(let y=-72;y<144;y+=24) for(let xx=-72;xx<144;xx+=24){
      x.beginPath();x.moveTo(xx+12,y);x.lineTo(xx+24,y+12);x.lineTo(xx+12,y+24);x.lineTo(xx,y+12);x.closePath();
      const g=x.createLinearGradient(xx,y,xx+24,y+24);g.addColorStop(0,"#dfe3e4");g.addColorStop(.5,"#a0a8ab");g.addColorStop(1,"#c7ccce");x.fillStyle=g;x.fill();
      x.strokeStyle="rgba(45,48,49,.48)";x.lineWidth=1.6;x.stroke();
    }
    return ctx.createPattern(c,"repeat");
  }
  const metal=makeMetal(), diamond=makeDiamond();

  function drawPhoto(){
    if(!photo)return;
    ctx.save();ctx.clip(framePath());
    const iw=photo.naturalWidth||photo.width, ih=photo.naturalHeight||photo.height;
    const fw=978,fh=1778,scale=Math.max(fw/iw,fh/ih)*(state.zoom/100),dw=iw*scale,dh=ih*scale;
    const x=54-(dw-fw)*(state.x/100), y=92-(dh-fh)*(state.y/100);
    ctx.drawImage(photo,x,y,dw,dh);ctx.restore();
  }
  function roundedPath(x,y,w,h,r){const p=new Path2D();p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);p.closePath();return p}
  function fit(text,max,min,width,weight="800"){let s=max;ctx.font=`${weight} ${s}px Arial`;while(s>min&&ctx.measureText(text).width>width){s--;ctx.font=`${weight} ${s}px Arial`}return s}

  function drawPanel(){
    // Smaller, centered panel so the score never crowds or clips the surrounding text.
    const p=roundedPath(105,1075,870,560,28);ctx.save();
    ctx.fillStyle="rgba(5,7,8,.68)";ctx.fill(p);
    ctx.strokeStyle="rgba(235,238,239,.72)";ctx.lineWidth=3;ctx.stroke(p);
    ctx.strokeStyle="#f00";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(135,1075);ctx.lineTo(360,1075);ctx.stroke();ctx.restore();

    const t1=esc($("team1").value)||"Placeholder1",t2=esc($("team2").value)||"Placeholder2";
    const s1=String(clamp(parseInt($("score1").value||0,10),0,99)),s2=String(clamp(parseInt($("score2").value||0,10),0,99));
    ctx.textBaseline="middle";ctx.textAlign="center";ctx.fillStyle="#f5f5f5";
    let fs=fit(t1,42,20,240);ctx.font=`800 ${fs}px Arial`;ctx.fillText(t1,275,1160);
    fs=fit(t2,42,20,240);ctx.font=`800 ${fs}px Arial`;ctx.fillText(t2,805,1160);
    ctx.fillStyle="#fff";ctx.font="800 68px Arial";ctx.fillText(`${s1} - ${s2}`,540,1160);

    const scorers=getScorers();
    ctx.textAlign="left";ctx.fillStyle="#ff3030";ctx.font="800 18px Arial";ctx.fillText("GOALS",170,1240);
    if(!scorers.length){ctx.fillStyle="#a8adaf";ctx.font="600 18px Arial";ctx.fillText("No scorers entered",170,1288);return}
    const maxRows=Math.min(scorers.length,8), rowH=maxRows>6?42:50, startY=1290;
    for(let i=0;i<maxRows;i++){
      const s=scorers[i],yy=startY+i*rowH,f=fit(s.name,23,14,560,"700");
      ctx.font=`700 ${f}px Arial`;ctx.fillStyle="#f0f1f2";ctx.fillText(s.name,170,yy);
      ctx.textAlign="right";ctx.font=`800 ${Math.max(18,f)}px Arial`;ctx.fillStyle="#fff";ctx.fillText(`×${s.goals}`,910,yy);ctx.textAlign="left";
      ctx.fillStyle="rgba(255,255,255,.12)";ctx.fillRect(170,yy+18,740,1);
    }
    if(scorers.length>8){ctx.fillStyle="#8d9396";ctx.font="600 13px Arial";ctx.fillText(`+ ${scorers.length-8} MORE`,170,startY+8*rowH)}
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle=metal;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.fillStyle=diamond;ctx.fill(framePath());ctx.restore();
    drawPhoto();
    ctx.save();ctx.strokeStyle="#171919";ctx.lineWidth=16;ctx.stroke(framePath());ctx.strokeStyle="#f00";ctx.lineWidth=4;ctx.stroke(framePath());ctx.restore();
    if(logo.complete)ctx.drawImage(logo,58,40,440,122);
    drawPanel();
  }
  function update(){state.zoom=+$('zoom').value;state.x=+$('posX').value;state.y=+$('posY').value;$('zoomValue').textContent=state.zoom+'%';$('xValue').textContent=state.x+'%';$('yValue').textContent=state.y+'%';updateCount();draw()}
  function loadFile(file){if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)){alert('Please choose a JPG, PNG, or WEBP image.');return}if(photoURL)URL.revokeObjectURL(photoURL);photoURL=URL.createObjectURL(file);photo=new Image();photo.onload=()=>{$('fileName').textContent=file.name;resetPosition();};photo.src=photoURL}
  function resetPosition(){$('zoom').value=100;$('posX').value=50;$('posY').value=50;update()}

  $('chooseImage').addEventListener('click',e=>{e.stopPropagation();$('imageInput').click()});
  $('dropzone').addEventListener('click',e=>{if(e.target!==$('chooseImage'))$('imageInput').click()});
  $('dropzone').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')$('imageInput').click()});
  $('imageInput').addEventListener('change',e=>loadFile(e.target.files[0]));
  ['dragenter','dragover'].forEach(ev=>$('dropzone').addEventListener(ev,e=>{e.preventDefault();$('dropzone').classList.add('drag')}));
  ['dragleave','drop'].forEach(ev=>$('dropzone').addEventListener(ev,e=>{e.preventDefault();$('dropzone').classList.remove('drag')}));
  $('dropzone').addEventListener('drop',e=>loadFile(e.dataTransfer.files[0]));
  ['team1','team2','score1','score2'].forEach(id=>$(id).addEventListener('input',update));
  ['zoom','posX','posY'].forEach(id=>$(id).addEventListener('input',update));
  $('addScorer').addEventListener('click',()=>addScorer('',1));
  $('resetPosition').addEventListener('click',resetPosition);
  $('resetAll').addEventListener('click',()=>{
    $('team1').value='Placeholder1';$('team2').value='Placeholder2';$('score1').value=4;$('score2').value=2;
    $('scorers').innerHTML='';defaultScorers.forEach(s=>addScorer(s[0],s[1]));
    if(photoURL)URL.revokeObjectURL(photoURL);photo=null;photoURL=null;$('imageInput').value='';$('fileName').textContent='No image selected';resetPosition();
  });
  $('download').addEventListener('click',()=>{draw();canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Umbrella-Match-Graphic.png';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)},'image/png')});
  logo.onload=draw;defaultScorers.forEach(s=>addScorer(s[0],s[1]));update();
})();
