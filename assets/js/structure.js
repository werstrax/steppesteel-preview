/* Dependency-free orthographic 3D structural study. Renders only on interaction/resize. */
(() => {
 const root=document.querySelector('[data-structure]'); if(!root)return;
 const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'); if(!ctx)return;
 let yaw=-.64,pitch=.43,width=18,length=36,cladding=false,drag=null,frame=0;
 const area=root.querySelector('[data-model-area]'),link=root.querySelector('[data-model-link]');
 const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const unit=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n)};
 function draw(){
  frame=0;const bounds=canvas.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
  const dpr=Math.min(devicePixelRatio||1,2),W=bounds.width,H=bounds.height;
  canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
  const scale=Math.min(W/(Math.hypot(width,length)+12),H/(Math.hypot(width,length)*.62+12));
  const transform=([x,y,z])=>{const a=x*Math.cos(yaw)-z*Math.sin(yaw),b=x*Math.sin(yaw)+z*Math.cos(yaw);return [a,y*Math.cos(pitch)-b*Math.sin(pitch),y*Math.sin(pitch)+b*Math.cos(pitch)]};
  const project=p=>{const [x,y,z]=transform(p);return [W*.5+x*scale,H*.57-y*scale,z]};
  const line=(a,b,color,lineWidth=.65)=>{const p=project(a),q=project(b);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke()};
  for(let v=-42;v<=42;v+=6){line([v,0,-42],[v,0,42],'#70856430');line([-42,0,v],[42,0,v],'#70856430')}
  const faces=[];
  function face(points,color){faces.push({points:points.map(project),depth:points.reduce((n,p)=>n+transform(p)[2],0)/points.length,color})}
  function beam(a,b,r=.09,color='#bfcab5'){
   const direction=unit(subtract(b,a));const side=unit(cross(direction,Math.abs(direction[1])>.9?[1,0,0]:[0,1,0]));const up=unit(cross(direction,side));
   const corners=p=>[[1,1],[-1,1],[-1,-1],[1,-1]].map(([s,t])=>p.map((v,i)=>v+r*(side[i]*s+up[i]*t)));
   const A=corners(a),B=corners(b);const shades=[color,'#e3e9d9','#7b8d72','#a0b295'];
   for(let i=0;i<4;i++)face([A[i],A[(i+1)%4],B[(i+1)%4],B[i]],shades[i]);face(A,color);face(B,color);
  }
  const w=width/2,L=length/2,h=6,ridge=8.1,frames=Math.round(length/6);
  for(let n=0;n<=frames;n++){
   const z=-L+n*6;
   beam([-w,0,z],[-w,h,z],.15);beam([w,0,z],[w,h,z],.15);
   beam([-w,h,z],[0,ridge,z],.14);beam([0,ridge,z],[w,h,z],.14);
   beam([-w,h-.4,z],[w,h-.4,z],.08);
   const count=8;for(let i=0;i<count;i++){const x=-w+i*width/count,nx=x+width/count,ny=h+(1-Math.abs(nx)/w)*(ridge-h);beam([x,h-.4,z],[nx,ny,z],.048);beam([nx,h-.4,z],[nx,ny,z],.04)}
   for(const x of [-w,w]){face([[x-.55,.04,z-.6],[x+.55,.04,z-.6],[x+.55,.04,z+.6],[x-.55,.04,z+.6]],'#7c8d6b');}
  }
  for(let i=0;i<=8;i++){const x=-w+i*width/8,y=h+(1-Math.abs(x)/w)*(ridge-h);beam([x,y,-L],[x,y,L],.07)}
  for(const x of [-w,w]){for(const y of [2,4,6])beam([x,y,-L],[x,y,L],.065);for(const z of [-L,L-6]){beam([x,.2,z],[x,h,z+6],.035,'#ed8053');beam([x,h,z],[x,.2,z+6],.035,'#ed8053')}}
  if(cladding){
   face([[-w,h,-L],[0,ridge,-L],[0,ridge,L],[-w,h,L]],'#afbeb1f0');
   face([[0,ridge,-L],[w,h,-L],[w,h,L],[0,ridge,L]],'#d8ded0f5');
   face([[-w,0,-L],[-w,h,-L],[-w,h,L],[-w,0,L]],'#a0b19dee');
   face([[w,0,-L],[w,h,-L],[w,h,L],[w,0,L]],'#879b85e8');
   face([[-w,0,L],[-w,h,L],[0,ridge,L],[w,h,L],[w,0,L]],'#a6b69def');
   for(let z=-L;z<=L;z+=1.2){beam([-w,h+.05,z],[0,ridge+.05,z],.015);beam([0,ridge+.05,z],[w,h+.05,z],.015)}
  }
  faces.sort((a,b)=>a.depth-b.depth);for(const f of faces){ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=f.color;ctx.fill()}
  const dim=(a,b,text)=>{line(a,b,'#ed875c',1);const p=project(a),q=project(b);ctx.fillStyle='#ed996e';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(text,(p[0]+q[0])/2,(p[1]+q[1])/2+17);for(const point of [a,b])line([point[0],-.3,point[2]],[point[0],.3,point[2]],'#ed875c',1)};
  dim([-w,0,L+3],[w,0,L+3],`${width} 000`);dim([w+3,0,-L],[w+3,0,L],`${length} 000`);
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw)};
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.009;pitch=Math.max(.16,Math.min(.85,pitch+(e.clientY-drag.y)*.003));drag={x:e.clientX,y:e.clientY};schedule()});
 const stop=()=>{drag=null};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);canvas.addEventListener('lostpointercapture',stop);
 canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();yaw+=e.key==='ArrowLeft'?-.15:.15;schedule()}});
 root.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',()=>{[width,length]=button.dataset.size.split(',').map(Number);root.querySelectorAll('[data-size]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));area.textContent=`${(width*length).toLocaleString('ru-RU')} м²`;const url=new URL(link.href);url.searchParams.set('w',width);url.searchParams.set('l',length);link.href=url.pathname+url.search;schedule()}));
 root.querySelector('[data-model-cladding]').addEventListener('change',e=>{cladding=e.target.checked;schedule()});
 root.querySelectorAll('[data-rotate]').forEach(button=>button.addEventListener('click',()=>{yaw+=Number(button.dataset.rotate)*.25;schedule()}));
 root.querySelector('[data-reset]').addEventListener('click',()=>{yaw=-.64;pitch=.43;schedule()});
 new ResizeObserver(schedule).observe(canvas);schedule();
})();
