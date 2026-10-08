const directions=[[2,0],[-2,0],[0,2],[0,-2]];

function ensureGoalConnection(grid) {
 const size=grid.length; let gr=size-2,gc=size-2;
 while(grid[gr][gc]){grid[gr][gc]=0;if(gc>1)gc--;else if(gr>1)gr--;else break;}
 return grid;
}

function randomMaze(size) {
 const grid=Array.from({length:size},()=>Array(size).fill(1)); const dirs=[[2,0],[-2,0],[0,2],[0,-2]]; const stack=[[1,1]]; grid[1][1]=0;
 while(stack.length){const [r,c]=stack[stack.length-1];const choices=dirs.map(([dr,dc])=>[r+dr,c+dc,dr,dc]).filter(([nr,nc])=>nr>0&&nc>0&&nr<size-1&&nc<size-1&&grid[nr][nc]);if(!choices.length){stack.pop();continue}const [nr,nc,dr,dc]=choices[Math.floor(Math.random()*choices.length)];grid[r+dr/2][c+dc/2]=0;grid[nr][nc]=0;stack.push([nr,nc]);}
 // Even dimensions place the visual goal off the odd-cell carving lattice.
 // Carve a short connector so every offered grid size remains solvable.
 return ensureGoalConnection(grid);
}
function emptyGrid(size){return Array.from({length:size},(_,r)=>Array.from({length:size},(_,c)=>r===0||c===0||r===size-1||c===size-1?1:0));}
function spiralMaze(size){const grid=emptyGrid(size);let top=2,left=2,bottom=size-3,right=size-3;while(top<=bottom&&left<=right){for(let c=left;c<=right;c++)grid[top][c]=1;for(let r=top;r<=bottom;r++)grid[r][right]=1;for(let c=right;c>=left;c--)grid[bottom][c]=1;for(let r=bottom;r>=top+2;r--)grid[r][left]=1;top+=2;left+=2;bottom-=2;right-=2;}return ensureGoalConnection(grid);}
function zigzagMaze(size){const grid=emptyGrid(size);for(let c=3;c<size-2;c+=3){for(let r=1;r<size-1;r++){const gap=c%2?size-3:2;if(r!==gap)grid[r][c]=1;}}return ensureGoalConnection(grid);}
export function generateMaze(size, pattern='Random') { if(pattern==='Spiral')return spiralMaze(size);if(pattern==='Zigzag')return zigzagMaze(size);if(pattern==='Open Field')return emptyGrid(size);return randomMaze(size); }
export function clearSearch(maze){return maze.map(r=>[...r])}
