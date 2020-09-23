const child_process = require('child_process');
const url = require('url');
const { resolve } = require('dns');
const fs = require('fs');
const fsPromise = require('fs/promises');
const path=require('path');


let baseUrl=new url.URL('wraps/',process.env.BASE_URL===undefined?"http://localhost:8000/":process.env.BASE_URL);

let tmpPath=`/tmp/gatsby-wraps-${process.pid}`;

async function rmTree(dir){
  let content=await fsPromise.readdir(dir,{withFileTypes:true});
  await Promise.all(content.map(async (ent)=>{
    if(ent.isBlockDevice()){
      throw new Error("trying to delete block device");
    }else if(ent.isCharacterDevice()){
      throw new Error("trying to delete character device");
    }else if(ent.isDirectory()){
      await rmTree(path.join(dir,ent.name));
    }else{
      await fsPromise.unlink(path.join(dir,ent.name));
    }
  }));
  await fsPromise.rmdir(dir);
}

async function copyTree(from,to){
  let content=await fsPromise.readdir(from,{withFileTypes:true});
  await Promise.all(
  content.map(async (ent)=>{
    if(ent.isDirectory()){
      let newFrom=path.join(from,ent.name);
      let newTo=path.join(to,ent.name);
      await fsPromise.mkdir(newTo);
      await copyTree(newFrom,newTo);
    }else if(ent.isFile()){
      await fsPromise.copyFile(path.join(from,ent.name),path.join(to,ent.name));
    }
  }));
}

async function copyProjects(){
  let to='./static/wraps';
  try{
    await rmTree('./static');
  }catch{}
  let content=fsPromise.readdir(tmpPath,{withFileTypes:true});
  await fsPromise.mkdir('./static')
  await fsPromise.mkdir(to);
  await Promise.all((await content).map(async (ent)=>{
    if(ent.isDirectory()){
      let newFrom=path.join(tmpPath,ent.name);
      let newTo=path.join(to,ent.name);
      await fsPromise.mkdir(newTo);
      await copyTree(newFrom,newTo);
    }
  }));
}

let updateReady=false;
let requestUpdate=false;

async function addFileNode(createNode,createNodeId,createContentDigest){
  if(updateReady){
    updateReady=false;

    const content=await  fsPromise.readFile(`${tmpPath}/index.json`,"utf8");
    createNode({
      id: createNodeId('wraps-gen-index-json'),
      parent:null,
      children:[],
      internal: {
        type: 'WrapsIndex',
        mediaType:'application/json',
        content,
        contentDigest:createContentDigest(content),
      },
    });


    updateReady=true;
    if(requestUpdate){
      requestUpdate=false;
      await addFileNode(createNode,createNodeId,createContentDigest);
    }
  }else{
    requestUpdate=true;
  }
}

let helpers={}

function updateFileNode(){
  const {createNode,createNodeId,createContentDigest}=helpers;
  return addFileNode(createNode,createNodeId,createContentDigest);
}

function initFileNode({actions,createNodeId, createContentDigest}){
  const {createNode} = actions;
  helpers={createNode,createNodeId,createContentDigest};
  updateReady=true;
  return addFileNode(createNode,createNodeId,createContentDigest);
}

async function runGen(){
  let args=`../wraps ${tmpPath} ${baseUrl}`;
  console.log(`Running ../gen.py ${args}`);
  let gen=child_process.exec(`../gen.py ${args}`);
  let genPromise=new Promise((resolve,reject)=>{
    let exit_guard={b:false};
    gen.on('exit',(code,signal)=>{
      if (exit_guard.b)return;
      exit_guard.b=true;
      if(code===0)resolve();
      else reject(new Error(`gen.py exited abnormally, code: ${code}`));
    });
    gen.on('error',(err)=>{
      if(exit_guard.b)return;
      exit_guard.b=true;
      reject(err);
    })
  });
  gen.stderr.pipe(process.stderr,{end:false});
  gen.stdout.pipe(process.stdout,{end:false});
  await genPromise;
  await copyProjects();
}

exports.onPreInit = runGen;
exports.sourceNodes = initFileNode;
