'use strict';
(function(){
  function roomContains(r,x,y){return x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h}
  function carveRoomLocal(grid,x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)grid[yy][xx]=1}
  function carveCorridorLocal(grid,a,b){
    let x=a.x,y=a.y;
    if(Math.random()<.5){
      while(x!==b.x){grid[y][x]=1;x+=Math.sign(b.x-x)}
      while(y!==b.y){grid[y][x]=1;y+=Math.sign(b.y-y)}
    }else{
      while(y!==b.y){grid[y][x]=1;y+=Math.sign(b.y-y)}
      while(x!==b.x){grid[y][x]=1;x+=Math.sign(b.x-x)}
    }
    grid[y][x]=1;
  }

  generateFloor=function(){
    const grid=Array.from({length:H},()=>Array(W).fill(0)),rooms=[];
    const targetRooms=5+rnd(3); // 5–7 rooms
    for(let tries=0;tries<120&&rooms.length<targetRooms;tries++){
      const w=2+rnd(3),h=2+rnd(3),x=1+rnd(W-w-2),y=1+rnd(H-h-2);
      if(rooms.some(r=>x<r.x+r.w&&x+w>r.x&&y<r.y+r.h&&y+h>r.y))continue;
      const room={x,y,w,h,cx:x+Math.floor(w/2),cy:y+Math.floor(h/2)};
      carveRoomLocal(grid,x,y,w,h);
      if(rooms.length)carveCorridorLocal(grid,{x:rooms.at(-1).cx,y:rooms.at(-1).cy},{x:room.cx,y:room.cy});
      rooms.push(room);
    }
    if(rooms.length<4){
      for(let y=0;y<H;y++)grid[y].fill(0);
      rooms.splice(0);
      const fixed=[{x:1,y:1,w:3,h:3},{x:8,y:1,w:3,h:3},{x:1,y:8,w:3,h:3},{x:8,y:8,w:3,h:3},{x:5,y:5,w:3,h:3}];
      for(const r of fixed){r.cx=r.x+1;r.cy=r.y+1;carveRoomLocal(grid,r.x,r.y,r.w,r.h);if(rooms.length)carveCorridorLocal(grid,{x:rooms.at(-1).cx,y:rooms.at(-1).cy},{x:r.cx,y:r.cy});rooms.push(r)}
    }

    game.grid=grid;
    game.rooms=rooms;
    game.player={x:rooms[0].cx,y:rooms[0].cy};
    game.exit={x:rooms.at(-1).cx,y:rooms.at(-1).cy};
    game.enemies=[];game.items=[];game.chest=null;game.mapReveal=false;

    const allOpen=[];
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(grid[y][x]&&key(x,y)!==key(game.player.x,game.player.y)&&key(x,y)!==key(game.exit.x,game.exit.y))allOpen.push({x,y});
    const used=new Set([key(game.player.x,game.player.y),key(game.exit.x,game.exit.y)]);
    const takeFrom=(arr)=>{if(!arr.length)return null;const i=rnd(arr.length),p=arr.splice(i,1)[0];used.add(key(p.x,p.y));return p};

    // Never start with enemies in the player's starting room or right beside the player.
    const startRoom=rooms[0];
    const enemySpots=allOpen.filter(p=>!roomContains(startRoom,p.x,p.y)&&Math.max(Math.abs(p.x-game.player.x),Math.abs(p.y-game.player.y))>=4);
    const enemyCount=2+Math.floor(game.floor*.45);
    for(let i=0;i<enemyCount&&enemySpots.length;i++){
      const p=takeFrom(enemySpots),pool=ENEMIES.filter(e=>game.floor>=e.min&&game.floor<=e.max),base=pool[rnd(pool.length)];
      game.enemies.push({...base,x:p.x,y:p.y,hp:base.hp+Math.floor(game.floor/3),maxHp:base.hp+Math.floor(game.floor/3),asleep:false});
    }

    // Fewer ordinary items: 1 most floors, occasionally 2. English chest remains one per floor.
    const itemSpots=allOpen.filter(p=>!used.has(key(p.x,p.y)));
    const itemCount=1+(Math.random()<.35?1:0);
    for(let i=0;i<itemCount&&itemSpots.length;i++){
      const p=takeFrom(itemSpots);game.items.push({...randomItem(false),x:p.x,y:p.y});
    }
    const chestSpots=allOpen.filter(p=>!used.has(key(p.x,p.y)));
    if(chestSpots.length){const p=takeFrom(chestSpots);game.chest={x:p.x,y:p.y,opened:false}}
    msg(`${game.floor}F。階段を探そう。`);
  };
})();
