import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('./app',import.meta.url)));
const args=process.argv.slice(2);
const portIndex=args.indexOf('--port');
const port=portIndex===-1?8080:Number(args[portIndex+1]);
const mime:{[key:string]:string}={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json',
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml',
  '.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf',
};
createServer((request,response)=>{
  const url=new URL(request.url??'/',`http://${request.headers.host??'localhost'}`);
  let pathname;
  try { pathname=decodeURIComponent(url.pathname); }
  catch { response.writeHead(400).end('bad request'); return; }
  if(pathname.endsWith('/')) pathname+='index.html';
  const file=resolve(join(root,normalize(pathname)));
  if(file!==root&&!file.startsWith(root+sep)){response.writeHead(403).end('forbidden');return;}
  let size:number;
  try {
    const stats=statSync(file);
    if(!stats.isFile()) throw new Error();
    size=stats.size;
  } catch { response.writeHead(404).end('not found');return; }
  response.writeHead(200,{
    'content-type':mime[extname(file).toLowerCase()]??'application/octet-stream',
    'content-length':size,
    'cache-control':'no-store',
  });
  createReadStream(file).pipe(response);
}).listen(Number.isInteger(port)&&port>0&&port<65536?port:8080,'127.0.0.1',()=>{
  console.log(`app/ is on http://localhost:${Number.isInteger(port)&&port>0&&port<65536?port:8080}`);
});
