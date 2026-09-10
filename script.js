(() => {
const $=id=>document.getElementById(id), canvas=$("preview"), ctx=canvas.getContext("2d");
const W=1080,H=1920;
let photo=null, photoURL=null;
const logo=new Image(); logo.src="umbrella-logo.png";
const metal=new Image(); metal.src="stainless-steel.jpg";
const diamond=new Image(); diamond.src="diamond-plate.jpg";
const state={zoom:100,x:50,y:50,panelY:0,logoSize:100};
const defaults1=[["Placeholder 1",2],["Placeholder 2",1]], defaults2=[["Placeholder 3",1]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const text=v=>String(v??"").trim();
function roundRect(x,y,w,h,r){const p=new Path2D();p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);p.closePath();return p}
function fit(t,max,min,width,weight="800"){let s=max;ctx.font=`${weight} ${s}px Arial`;while(s>min&&ctx.measureText(t).width>width){s--;ctx.font=`${weight} ${s}px Arial`}return s}
function pattern(img,fallback){return img.complete&&img.naturalWidth?ctx.createPattern(img,"repeat"):fallback}
function fallbackMetal(){const c=document.createLinearGradient(0,0,0,H);c.addColorStop(0,"#c8cccd");c.addColorStop(.5,"#aeb4b6");c.addColorStop(1,"#c1c5c6");return c}
function fallbackDiamond(){return "#aeb4b7"}
function templatePath(){const p=new Path2D();p.moveTo(52,270);p.lineTo(820,270);p.lineTo(935,195);p.lineTo(1028,195);p.lineTo(1028,1865);p.lineTo(52,1865);p.closePath();return p}
function photoArea(){return {x:52,y:195,w:976,h:1670}}
function drawPhoto(){if(!photo)return;const a=photoArea();ctx.save();ctx.clip(templatePath());const iw=photo.naturalWidth,ih=photo.naturalHeight;const scale=Math.max(a.w/iw,a.h/ih)*(state.zoom/100);const dw=iw*scale,dh=ih*scale;const x=a.x-(dw-a.w)*(state.x/100);const y=a.y-(dh-a.h)*(state.y/100);ctx.drawImage(photo,x,y,dw,dh);ctx.restore()}
function addRow(container,name="",goals=1){const row=document.createElement("div");row.className="scorer-row";row.innerHTML='<input class="scorer-name" type="text" maxlength="24" placeholder="Player name"><input class="scorer-goals" type="number" min="1" max="99"><button class="remove" type="button" aria-label="Remove scorer">×</button>';row.querySelector('.scorer-name').value=name;row.querySelector('.scorer-goals').value=goals;row.querySelector('.remove').onclick=()=>{row.remove();update()};row.querySelectorAll('input').forEach(i=>i.addEventListener('input',update));$(container).appendChild(row);updateCounts()}
function rows(container){return [...$(container).querySelectorAll('.scorer-row')].map(r=>({name:text(r.querySelector('.scorer-name').value),goals:clamp(parseInt(r.querySelector('.scorer-goals').value||1,10),1,99)})).filter(s=>s.name)}
function updateCounts(){$('count1').textContent=$("scorers1").children.length;$('count2').textContent=$("scorers2").children.length}
function drawHeader(){const size=300*(state.logoSize/100),x=48,y=35;ctx.drawImage(logo,x,y,size,size*(logo.naturalHeight/logo.naturalWidth));}
function drawInfoPanel(){
 const pw=940,ph=610,px=70,py=1030+state.panelY;
 const p=roundRect(px,py,pw,ph,30);
 ctx.save();ctx.fillStyle="rgba(5,6,7,.70)";ctx.fill(p);ctx.strokeStyle="rgba(225,229,230,.75)";ctx.lineWidth=3;ctx.stroke(p);ctx.restore();
 const t1=text($("team1").value)||"Team 1",t2=text($("team2").value)||"Team 2";
 const s1=String(clamp(parseInt($("score1").value||0,10),0,99)),s2=String(clamp(parseInt($("score2").value||0,10),0,99));
 const leftX=285,rightX=825,centerX=555;
 ctx.textBaseline="middle";ctx.textAlign="center";ctx.fillStyle="#f5f5f5";
 let fs=fit(t1,52,22,350);ctx.font=`800 ${fs}px Arial`;ctx.fillText(t1,leftX,py+86);
 fs=fit(t2,52,22,350);ctx.font=`800 ${fs}px Arial`;ctx.fillText(t2,rightX,py+86);
 ctx.fillStyle="#fff";ctx.font="900 68px Arial";ctx.fillText(`${s1} - ${s2}`,centerX,py+88);
 ctx.fillStyle="#e00000";ctx.fillRect(centerX-32,py+135,64,4);
 const a=rows("scorers1"),b=rows("scorers2");
 ctx.font="800 17px Arial";ctx.fillStyle="#e00000";ctx.textAlign="left";ctx.fillText("GOALS",px+42,py+178);ctx.textAlign="right";ctx.fillText("GOALS",px+pw-42,py+178);
 const maxRows=5, usable=ph-205, rowH=Math.min(55,usable/maxRows); const start=py+225;
 function col(list,side){const baseX=side==='left'?px+42:px+pw-42;ctx.textAlign=side==='left'?'left':'right';if(!list.length){ctx.fillStyle="#aeb3b5";ctx.font="600 17px Arial";ctx.fillText("—",baseX,start);return}list.slice(0,maxRows).forEach((s,i)=>{const yy=start+i*rowH;const maxW=330;const f=fit(s.name,23,13,maxW,"700");ctx.font=`700 ${f}px Arial`;ctx.fillStyle="#f2f3f3";ctx.fillText(s.name,baseX,yy);ctx.font="900 20px Arial";ctx.fillStyle="#fff";if(side==='left'){ctx.textAlign='right';ctx.fillText(`×${s.goals}`,px+pw/2-34,yy);ctx.textAlign='left'}else{ctx.textAlign='left';ctx.fillText(`×${s.goals}`,px+pw/2+34,yy);ctx.textAlign='right'}ctx.strokeStyle="rgba(255,255,255,.13)";ctx.lineWidth=1;ctx.beginPath();if(side==='left'){ctx.moveTo(px+42,yy+20);ctx.lineTo(px+pw/2-55,yy+20)}else{ctx.moveTo(px+pw/2+55,yy+20);ctx.lineTo(px+pw-42,yy+20)}ctx.stroke()})}
 col(a,'left');col(b,'right');
}
function draw(){
 ctx.clearRect(0,0,W,H);
 // Never leave a black canvas while assets are loading.
 ctx.fillStyle="#b9bec0";ctx.fillRect(0,0,W,H);
 ctx.fillStyle=pattern(metal,fallbackMetal());ctx.fillRect(0,0,W,H);
 const p=templatePath();ctx.save();ctx.fillStyle=pattern(diamond,fallbackDiamond());ctx.fill(p);ctx.restore();
 drawPhoto();
 if(!photo){ctx.save();ctx.clip(p);ctx.fillStyle="rgba(20,22,23,.25)";ctx.fillRect(0,0,W,H);ctx.fillStyle="rgba(255,255,255,.55)";ctx.font="700 24px Arial";ctx.textAlign="center";ctx.fillText("SELECT A MATCH PHOTO",540,1030);ctx.restore()}
 drawHeader();
 drawInfoPanel();
}
function update(){state.zoom=+$('zoom').value;state.x=+$('posX').value;state.y=+$('posY').value;state.panelY=+$('panelY').value;state.logoSize=+$('logoSize').value;$('zoomValue').textContent=state.zoom+'%';$('xValue').textContent=state.x+'%';$('yValue').textContent=state.y+'%';$('panelValue').textContent=(state.panelY>0?'+':'')+state.panelY;$('logoValue').textContent=state.logoSize+'%';updateCounts();draw()}
function loadFile(file){if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)){alert('Please choose a JPG, PNG, or WEBP image.');return}if(photoURL)URL.revokeObjectURL(photoURL);photoURL=URL.createObjectURL(file);const im=new Image();im.onload=()=>{photo=im;$('fileName').textContent=file.name;$('zoom').value=100;$('posX').value=50;$('posY').value=50;update()};im.onerror=()=>{photo=null;draw();alert('That image could not be loaded.')};im.src=photoURL}
$('chooseImage').onclick=e=>{$('imageInput').click();e.stopPropagation()};$('dropzone').onclick=e=>{if(e.target!==$('chooseImage'))$('imageInput').click()};$('dropzone').onkeydown=e=>{if(e.key==='Enter'||e.key===' ')$('imageInput').click()};$('imageInput').onchange=e=>loadFile(e.target.files[0]);['dragenter','dragover'].forEach(ev=>$('dropzone').addEventListener(ev,e=>{e.preventDefault();$('dropzone').classList.add('drag')}));['dragleave','drop'].forEach(ev=>$('dropzone').addEventListener(ev,e=>{e.preventDefault();$('dropzone').classList.remove('drag')}));$('dropzone').addEventListener('drop',e=>loadFile(e.dataTransfer.files[0]));
['team1','team2','score1','score2','zoom','posX','posY','panelY','logoSize'].forEach(id=>$(id).addEventListener('input',update));
$('add1').onclick=()=>addRow('scorers1','',1);$('add2').onclick=()=>addRow('scorers2','',1);
$('resetPosition').onclick=()=>{$('zoom').value=100;$('posX').value=50;$('posY').value=50;update()};$('resetPanel').onclick=()=>{$('panelY').value=0;update()};$('resetLogo').onclick=()=>{$('logoSize').value=100;update()};
function download(){draw();canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Umbrella-Match-Graphic.png';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)},'image/png')}
$('download').onclick=download;$('downloadTop').onclick=download;
$('resetAll').onclick=()=>{if(photoURL)URL.revokeObjectURL(photoURL);photo=null;photoURL=null;$('imageInput').value='';$('fileName').textContent='No image selected';$('team1').value='Team 1';$('team2').value='Team 2';$('score1').value=4;$('score2').value=2;$('scorers1').innerHTML='';$('scorers2').innerHTML='';defaults1.forEach(s=>addRow('scorers1',s[0],s[1]));defaults2.forEach(s=>addRow('scorers2',s[0],s[1]));$('zoom').value=100;$('posX').value=50;$('posY').value=50;$('panelY').value=0;$('logoSize').value=100;update()};
[logo,metal,diamond].forEach(im=>im.onload=draw);defaults1.forEach(s=>addRow('scorers1',s[0],s[1]));defaults2.forEach(s=>addRow('scorers2',s[0],s[1]));update();
})();
