const child_process = require('child_process');
const url = require('url');
const { resolve } = require('dns');
const fs = require('fs');
const fsPromise = require('fs/promises');
const path = require('path');

let baseUrl = new url.URL(
  'wraps/',
  process.env.BASE_URL === undefined
    ? 'http://localhost:8000/'
    : process.env.BASE_URL,
);

let tmpPath = `/tmp/gatsby-wraps-${process.pid}`;

async function rmTree(dir) {
  let content = await fsPromise.readdir(dir, { withFileTypes: true });
  await Promise.all(
    content.map(async (ent) => {
      if (ent.isBlockDevice()) {
        throw new Error('trying to delete block device');
      } else if (ent.isCharacterDevice()) {
        throw new Error('trying to delete character device');
      } else if (ent.isDirectory()) {
        await rmTree(path.join(dir, ent.name));
      } else {
        await fsPromise.unlink(path.join(dir, ent.name));
      }
    }),
  );
  await fsPromise.rmdir(dir);
}

async function copyTree(from, to) {
  let content = await fsPromise.readdir(from, { withFileTypes: true });
  await Promise.all(
    content.map(async (ent) => {
      if (ent.isDirectory()) {
        let newFrom = path.join(from, ent.name);
        let newTo = path.join(to, ent.name);
        await fsPromise.mkdir(newTo);
        await copyTree(newFrom, newTo);
      } else if (ent.isFile()) {
        await fsPromise.copyFile(
          path.join(from, ent.name),
          path.join(to, ent.name),
        );
      }
    }),
  );
}

async function copyProjects() {
  let to = './static/wraps';
  try {
    await rmTree('./static');
  } catch {}
  let content = fsPromise.readdir(tmpPath, { withFileTypes: true });
  await fsPromise.mkdir('./static');
  await fsPromise.mkdir(to);
  await Promise.all(
    (await content).map(async (ent) => {
      if (ent.isDirectory()) {
        let newFrom = path.join(tmpPath, ent.name);
        let newTo = path.join(to, ent.name);
        await fsPromise.mkdir(newTo);
        await copyTree(newFrom, newTo);
      }
    }),
  );
}



let updateReady = false;
let requestUpdate = false;

async function addFileNode(createNode, createNodeId, createContentDigest) {
  if (updateReady) {
    updateReady = false;

    const content = await fsPromise.readFile(`${tmpPath}/index.json`, 'utf8');
    createNode({
      id: createNodeId('wraps-gen-index-json'),
      parent: null,
      children: [],
      internal: {
        type: 'WrapsIndex',
        mediaType: 'application/json',
        content,
        contentDigest: createContentDigest(content),
      },
    });

    updateReady = true;
    if (requestUpdate) {
      requestUpdate = false;
      await addFileNode(createNode, createNodeId, createContentDigest);
    }
  } else {
    requestUpdate = true;
  }
}

let helpers = null;

function updateFileNode() {
  if (helpers===null)return;
  const { createNode, createNodeId, createContentDigest } = helpers;
  return addFileNode(createNode, createNodeId, createContentDigest);
}

function initFileNode({ actions, createNodeId, createContentDigest }) {
  const { createNode } = actions;
  helpers = { createNode, createNodeId, createContentDigest };
  updateReady = true;
  return addFileNode(createNode, createNodeId, createContentDigest);
}

let genReady=false;
let genRequested=false;

async function runGen() {
  if(genReady){
    genReady=false;
  let args = `../wraps ${tmpPath} ${baseUrl}`;
  console.log(`Running ../gen.py ${args}`);
  let gen = child_process.exec(`../gen.py ${args}`);
  let genPromise = new Promise((resolve, reject) => {
    let exit_guard = { b: false };
    gen.on('exit', (code, signal) => {
      if (exit_guard.b) return;
      exit_guard.b = true;
      if (code === 0) resolve();
      else reject(new Error(`gen.py exited abnormally, code: ${code}`));
    });
    gen.on('error', (err) => {
      if (exit_guard.b) return;
      exit_guard.b = true;
      reject(err);
    });
  });
  gen.stderr.pipe(process.stderr, { end: false });
  gen.stdout.pipe(process.stdout, { end: false });
  await genPromise;
  await copyProjects();
    await updateFileNode();
    genReady=true;
    if(genRequested){
      genRequested=false;
      await runGen();
    }
  }else{
    genRequested=true;
  }
}

let watchers={watcher:null,children:new Map()};

async function watchFIles(dir,watchers){
  if(process.env.DONT_WATCH==="1")return;
  watchers.watcher=fs.watch(dir,{persistent:false,recursive:false});
  watchers.watcher.on("change",(event,filename)=>{
    async function helper(filename,dir,watchers){
      if(filename){
        try{
          let stat=await fsPromise.lstat(path.join(dir,filename));
          if(stat.isDirectory()){
            if(watchers.children.has(filename)){
              watchers.children.get(filename).watcher.close();
              watchers.children.delete(filename);
            }
            watchers.children.set(filename,{watcher:null,children:new Map()});
            await watchFIles(path.join(dir,filename),watchers.children.get(filename));
          }
        }catch{
          if(watchers.chidren.has(filename)){
            watchers.children.get(filename).watcher.close();
            watchers.children.delete(filename);
          }
        }
      }else{console.error("No filename provided")}
      await runGen();
    }
    helper(filename,dir,watchers).catch(console.error);
  });
  watchers.watcher.on("close",()=>{
    for (let watcher in watchers.children.entries()){
      watcher.watcher.close();
    }
    watchers.children.clear();
  });
  watchers.watcher.on("error",console.error);
  Promise.all((await fsPromise.readdir(dir,{withFileTypes:true})).map(async (ent)=>{
    if(ent.isDirectory()){
      watchers.children.set(ent.name,{watcher:null,children:new Map()});
      await watchFIles(path.join(dir,ent.name),watchers.children.get(ent.name));
    }}));
}

exports.onPreInit = async ()=>{
  await watchFIles('../wraps',watchers);
  let gen_watcher=fs.watch("..",{persistent:false,recursive:false});
  gen_watcher.on("change",(event,filename)=>{
    if(filename==="gen.py")runGen().catch(console.error);
  });
  gen_watcher.on("error",console.error);
  genReady=true;
  await runGen();
};
exports.sourceNodes = initFileNode;
