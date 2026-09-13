'use strict';
(function(){
  const PREV_GENERATE=generateFloor;

  function isFloor(x,y){return x>=0&&y>=0&&x<W&&y<H&&!!game.grid[y][x]}

  function buildRoomMap(){
    if(!game?.grid)return;
    const map=Array.from({length:H},()=>Array(W).fill(-1));
    const candidate=Array.from({length:H},()=>Array(W).fill(false));
    for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++){
      if(isFloor(x,y)&&isFloor(x+1,y)&&isFloor(x,y+1)&&isFloor(x+1,y+1)){
        candidate[y][x]=candidate[y][x+1]=candidate[y+1][x]=candidate[y+1][x+1]=true;
      }
    }
    let id=0;
    const q=[];
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      if(!candidate[y][x]||map[y][x]>=0)continue;
      map[y][x]=id;q.push([x,y]);
      while(q.length){
        const [cx,cy]=q.shift();
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const nx=cx+dx,ny=cy+dy;
          if(nx>=0&&ny>=0&&nx<W&&ny<H&&candidate[ny][nx]&&map[ny][nx]<0){map[ny][nx]=id;q.push([nx,ny]);}
        }
      }
      id++;
    }
    game.roomMap=map;
    game.roomCount=id;
  }

  function ensureRoomMap(){
    if(!game?.roomMap||game.roomMap.length!==H)buildRoomMap();
  }

  function roomIdAt(x,y){
    ensureRoomMap();
    return game?.roomMap?.[y]?.[x] ?? -1;
  }

  function currentRoomId(){
    if(!game?.player)return -1;
    ensureRoomMap();
    const {x,y}=game.player;
    const direct=roomIdAt(x,y);
    if(direct>=0)return direct;
    const near=[];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const id=roomIdAt(x+dx,y+dy);
      if(id>=0&&!near.includes(id))near.push(id);
    }
    return near.length===1?near[0]:-1;
  }

  function roomCells(){
    ensureRoomMap();
    const out=[];
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(roomIdAt(x,y)>=0)out.push({x,y});
    return out;
  }
  function occupiedByFixed(x,y){
    return (game.player.x===x&&game.player.y===y)||(game.exit.x===x&&game.exit.y===y)||game.enemies.some(e=>e.hp>0&&e.x===x&&e.y===y);
  }
  function freeRoomSpot(used){
    const cells=roomCells().filter(p=>!occupiedByFixed(p.x,p.y)&&!used.has(key(p.x,p.y)));
    return cells.length?cells[rnd(cells.length)]:null;
  }
  function forceLootIntoRooms(){
    const used=new Set();
    for(const it of game.items){
      if(roomIdAt(it.x,it.y)>=0&&!used.has(key(it.x,it.y))){used.add(key(it.x,it.y));continue}
      const p=freeRoomSpot(used);if(p){it.x=p.x;it.y=p.y;used.add(key(p.x,p.y));}
    }
    if(game.chest){
      if(roomIdAt(game.chest.x,game.chest.y)<0||used.has(key(game.chest.x,game.chest.y))){
        const p=freeRoomSpot(used);if(p){game.chest.x=p.x;game.chest.y=p.y;}
      }
    }
  }

  generateFloor=function(){
    PREV_GENERATE();
    buildRoomMap();
    forceLootIntoRooms();
    game.seen=new Set();
    rememberSeen();
  };

  visibleNow=function(x,y){
    if(!game||!game.player)return false;
    const px=game.player.x,py=game.player.y;

    // Adjacent enemies must always be visible, even at corridor/room boundaries.
    if(game.enemies?.some(e=>e.hp>0&&e.x===x&&e.y===y&&Math.max(Math.abs(x-px),Math.abs(y-py))<=1))return true;

    const pr=currentRoomId();
    if(pr>=0){
      if(roomIdAt(x,y)===pr)return true;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        if(roomIdAt(x+dx,y+dy)===pr)return true;
      }
      return false;
    }
    return Math.max(Math.abs(x-px),Math.abs(y-py))<=1;
  };

  rememberSeen=function(){
    if(!game||!game.player)return;
    if(!(game.seen instanceof Set))game.seen=new Set();
    ensureRoomMap();
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(visibleNow(x,y))game.seen.add(key(x,y));
  };

  window.sushiDungeonRoomIdAt=roomIdAt;
  window.sushiDungeonCurrentRoomId=currentRoomId;
  window.sushiDungeonVisibleNow=(x,y)=>visibleNow(x,y);
  window.sushiDungeonRememberSeen=()=>rememberSeen();
  window.sushiDungeonRebuildRoomMap=buildRoomMap;
})();
