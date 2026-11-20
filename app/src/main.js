import { drawCover } from './cover.js';
import { runShot } from './shots.js';

const canvas=document.getElementById('cover');
const caption=document.getElementById('caption');
const status=document.getElementById('status');
const panelNames=['main','mid','close'];
const sizes={'1080x1080':[1080,1080],'1080x1350':[1080,1350],'1920x1080':[1920,1080]};
const photos=new Map();
const selected={main:null,mid:null,close:null};
const crops={
  main:{zoom:1,x:0,y:0},
  mid:{zoom:1,x:0,y:0},
  close:{zoom:1,x:0,y:0},
};
let active='main';
let photoNumber=0;

function redraw() {
  drawCover(canvas,Object.fromEntries(panelNames.map(name=>[name,photos.get(selected[name])?.image??null])),caption.value,crops);
}
function readImage(url) {
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('This image could not be opened.'));
    image.src=url;
  });
}
async function addPhoto(url,name,file=null) {
  const image=await readImage(url);
  const id=`photo-${++photoNumber}`;
  photos.set(id,{image,name,file,url});
  return id;
}
function shortName(name) { return name.length>18?name.slice(0,15)+'…':name; }
function refreshControls() {
  const list=document.getElementById('photo-list');
  list.replaceChildren();
  for(const [,photo] of photos) {
    const chip=document.createElement('span');
    chip.className='photo-chip';
    chip.textContent=shortName(photo.name);
    chip.title=photo.name;
    list.append(chip);
  }
  for(const name of panelNames) {
    const select=document.getElementById(`photo-${name}`);
    const previous=selected[name];
    select.replaceChildren();
    for(const [id,photo] of photos) {
      const option=document.createElement('option');
      option.value=id;
      option.textContent=shortName(photo.name);
      select.append(option);
    }
    if(photos.has(previous)) select.value=previous;
    else if(photos.size) { selected[name]=photos.keys().next().value; select.value=selected[name]; }
  }
}
function setActive(name) {
  active=name;
  document.querySelectorAll('.crop-tab').forEach(button=>button.classList.toggle('active',button.dataset.panel===name));
  const crop=crops[name];
  document.getElementById('zoom').value=crop.zoom;
  document.getElementById('zoom-value').value=`${crop.zoom.toFixed(1)}×`;
  document.getElementById('offset-x').value=crop.x;
  document.getElementById('offset-y').value=crop.y;
}

document.getElementById('photos').addEventListener('change',async event=>{
  const files=[...event.target.files].filter(file=>file.type.startsWith('image/'));
  if(!files.length) return;
  status.textContent=`Loading ${files.length} local photo${files.length===1?'':'s'}…`;
  try {
    const ids=await Promise.all(files.map(file=>addPhoto(URL.createObjectURL(file),file.name,file)));
    refreshControls();
    panelNames.forEach(name=>{selected[name]=ids[0];});
    refreshControls();
    redraw();
    status.textContent=`${files.length} photo${files.length===1?'':'s'} ready · stays on this device`;
  } catch(error) { status.textContent=error.message; }
  event.target.value='';
});
for(const name of panelNames) {
  document.getElementById(`photo-${name}`).addEventListener('change',event=>{
    selected[name]=event.target.value;
    redraw();
  });
}
document.querySelectorAll('.crop-tab').forEach(button=>{
  button.addEventListener('click',()=>setActive(button.dataset.panel));
});
document.getElementById('zoom').addEventListener('input',event=>{
  crops[active].zoom=Number(event.target.value);
  document.getElementById('zoom-value').value=`${crops[active].zoom.toFixed(1)}×`;
  redraw();
});
document.getElementById('offset-x').addEventListener('input',event=>{crops[active].x=Number(event.target.value);redraw();});
document.getElementById('offset-y').addEventListener('input',event=>{crops[active].y=Number(event.target.value);redraw();});
caption.addEventListener('input',redraw);
document.querySelectorAll('[data-caption]').forEach(button=>{
  button.addEventListener('click',()=>{
    caption.value=button.dataset.caption;
    redraw();
  });
});
document.getElementById('size').addEventListener('change',event=>{
  const [w,h]=sizes[event.target.value];
  canvas.width=w;canvas.height=h;
  document.getElementById('preview-size').textContent=`${w} × ${h} PX`;
  redraw();
});
document.getElementById('export').addEventListener('click',()=>{
  canvas.toBlob(blob=>{
    if(!blob){status.textContent='PNG export failed. Please try again.';return;}
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;
    anchor.download=`neon-hours-${canvas.width}x${canvas.height}.png`;
    anchor.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent=`Saved neon-hours-${canvas.width}x${canvas.height}.png`;
  },'image/png');
});

async function initialize() {
  const query=new URLSearchParams(location.search);
  const shot=query.get('shot');
  const photoName=query.get('photo')??'boulevard';
  const names=shot==='editor'?[photoName,photoName==='pier'?'boulevard':'pier']: [photoName];
  const ids=[];
  for(const name of [...new Set(names)]) ids.push(await addPhoto(`samples/${name}.jpg`,name));
  if(shot==='editor') {
    selected.main=ids[0];selected.mid=ids[1]??ids[0];selected.close=ids[0];
  } else if(shot) {
    panelNames.forEach(name=>selected[name]=ids[0]);
  } else {
    const boulevard=ids.find((id,i)=>photos.get(id)?.name==='boulevard');
    selected.main=boulevard??ids[0];
    selected.mid=ids[1]??selected.main;
    selected.close=selected.main;
  }
  if(!shot) {
    for(const name of ['boulevard','pier']) {
      if(![...photos.values()].some(photo=>photo.name===name)) {
        await addPhoto(`samples/${name}.jpg`,name);
      }
    }
  }
  refreshControls();
  setActive('main');
  if(shot) caption.value=query.get('caption')??'MIDNIGHT HEAT';
  redraw();
  if(shot) await runShot(shot,query,async text=>{caption.value=text;redraw();});
  else window.__shotReady=true;
}
initialize().catch(error=>{status.textContent=error.message;console.error(error);});
