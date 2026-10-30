export type PuzzleType='tango'|'battleship'|'skyscraper'|'slitherlink';
type Matrix<T>=T[][];
export type Mark='sun'|'moon'|null;
export type Relation='equals'|'different'|null;
export type Edge='empty'|'line'|'cross';
export type Sides={top:(number|null)[];bottom:(number|null)[];left:(number|null)[];right:(number|null)[]};
export type PuzzleState=
 | {type:'tango';size:number;board:{grid:Matrix<Mark>;horizontalConstraints:Matrix<Relation>;verticalConstraints:Matrix<Relation>}}
 | {type:'battleship';size:number;grid:Matrix<string>;clues:{top:(number|null)[];left:(number|null)[];cells:Record<string,string>}}
 | {type:'skyscraper';size:number;clues:Sides;grid:Matrix<number|null>}
 | {type:'slitherlink';size:number;grid:Matrix<number|string|null>;horizontal:Matrix<Edge>;vertical:Matrix<Edge>};
const obj=(v:unknown):Record<string,unknown>=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid puzzle');return v as Record<string,unknown>;};
function matrix<T>(v:unknown,rows:number,cols:number,valid:(x:unknown)=>boolean):Matrix<T>{if(!Array.isArray(v)||v.length!==rows)throw Error('Invalid grid dimensions');return v.map(row=>{if(!Array.isArray(row)||row.length!==cols||!row.every(valid))throw Error('Invalid grid values');return [...row] as T[];});}
const bounded=(v:unknown,max:number,min=0)=>v===null||(Number.isInteger(v)&&Number(v)>=min&&Number(v)<=max);
function counts(v:unknown,n:number,min=0):(number|null)[]{if(!Array.isArray(v)||v.length!==n||!v.every(x=>bounded(x,n,min)))throw Error('Invalid clues');return [...v];}
export function parseState(input:unknown,expected?:PuzzleType):PuzzleState {
 const s=obj(input),type=s.type,n=Number(s.size);if(!['tango','battleship','skyscraper','slitherlink'].includes(String(type))||expected&&type!==expected||!Number.isInteger(s.size)||n<4||n>12)throw Error('Invalid puzzle type or size');
 if(type==='tango'){if(n>6)throw Error('Invalid Tango size');const b=obj(s.board);return {type,size:n,board:{grid:matrix(b.grid,n,n,x=>x===null||x==='sun'||x==='moon'),horizontalConstraints:matrix(b.horizontalConstraints,n,n-1,x=>x===null||x==='equals'||x==='different'),verticalConstraints:matrix(b.verticalConstraints,n-1,n,x=>x===null||x==='equals'||x==='different')}};}
 if(type==='battleship'){if(![8,10,12].includes(n))throw Error('Invalid Battleship size');const grid=matrix<string>(s.grid,n,n,x=>typeof x==='string'&&['','o','d','u','l','r','m','w'].includes(x));const c=obj(s.clues);const cells:Record<string,string>={};for(let r=0;r<n;r++)for(let col=0;col<n;col++)if(grid[r][col])cells[`${r},${col}`]=grid[r][col];return {type,size:n,grid,clues:{top:counts(c.top,n),left:counts(c.left,n),cells}};}
 if(type==='skyscraper'){if(n>6)throw Error('Invalid Skyscraper size');const c=obj(s.clues);return {type,size:n,clues:{top:counts(c.top,n,1),bottom:counts(c.bottom,n,1),left:counts(c.left,n,1),right:counts(c.right,n,1)},grid:matrix(s.grid,n,n,x=>bounded(x,n,1))};}
 if(n>6)throw Error('Invalid Slitherlink size');return {type:'slitherlink',size:n,grid:matrix(s.grid,n,n,x=>x==='s'||x==='w'||bounded(x,4)),horizontal:matrix(s.horizontal,n+1,n,x=>['empty','line','cross'].includes(String(x))),vertical:matrix(s.vertical,n,n+1,x=>['empty','line','cross'].includes(String(x)))};
}
export function puzzleCode(s:PuzzleState){return `PZ/v1/${s.type}/${encodeURIComponent(JSON.stringify(parseState(s)))}`;}
export function decodeCode(text:string,type:PuzzleType):PuzzleState {if(text.length>100000)throw Error('Code too large');const matches=[...text.matchAll(/PZ\/v1\/(tango|battleship|skyscraper|slitherlink)\/([^\s]+)/g)];if(matches.length!==1||matches[0][1]!==type)throw Error('Use one code for this puzzle type');return parseState(JSON.parse(decodeURIComponent(matches[0][2])),type);}
export function readDraft(raw:string|null,type:PuzzleType){if(raw===null)return null;if(raw.length>100000)throw Error('Draft too large');const envelope=obj(JSON.parse(raw));if(envelope.version!==1)throw Error('Unsupported draft');return parseState(envelope.puzzle,type);}
export function writeDraft(storage:Pick<Storage,'getItem'|'setItem'>,key:string,state:PuzzleState,expected:string|null){if(storage.getItem(key)!==expected)throw Error('Saved board changed in another tab');const raw=JSON.stringify({version:1,puzzle:parseState(state)});storage.setItem(key,raw);return raw;}
export interface Deduction {kind:'cell'|'h'|'v';row:number;col:number;value:string|number;cause:{row:number;col:number}[];en:string;tr:string}
const cell=(row:number,col:number,value:string|number,en:string,tr:string,cause:{row:number;col:number}[]=[]):Deduction=>({kind:'cell',row,col,value,en,tr,cause});
const opposite=(m:Mark):Mark=>m==='sun'?'moon':'sun';
function tangoValid(s:Extract<PuzzleState,{type:'tango'}>){const n=s.size,g=s.board.grid;for(let a=0;a<n;a++)for(const line of [g[a],g.map(r=>r[a])]){for(let i=0;i<n-2;i++)if(line[i]&&line[i]===line[i+1]&&line[i]===line[i+2])throw Error('Three identical symbols conflict');if(n%2===0&&(['sun','moon'] as const).some(v=>line.filter(x=>x===v).length>n/2))throw Error('Symbol count conflict');}for(let r=0;r<n;r++)for(let c=0;c<n;c++){for(const [rr,cc,relation] of [[r,c+1,s.board.horizontalConstraints[r]?.[c]],[r+1,c,s.board.verticalConstraints[r]?.[c]]] as const){const a=g[r][c],b=g[rr]?.[cc];if(a&&b&&relation&&(relation==='equals'?a!==b:a===b))throw Error('Relation conflict');}}}
function propose(input:PuzzleState):Deduction|null {
 const s=parseState(input),n=s.size;
 if(s.type==='tango'){
  tangoValid(s);const g=s.board.grid;
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!g[r][c]){
   for(const [rr,cc,relation] of [[r,c-1,s.board.horizontalConstraints[r]?.[c-1]],[r,c+1,s.board.horizontalConstraints[r]?.[c]],[r-1,c,s.board.verticalConstraints[r-1]?.[c]],[r+1,c,s.board.verticalConstraints[r]?.[c]]] as const){const m=g[rr]?.[cc];if(m&&relation)return cell(r,c,(relation==='equals'?m:opposite(m))!,`The ${relation==='equals'?'=':'×'} link fixes this neighbour.`,`Komşu hücreyi ${relation==='equals'?'=':'×'} bağlantısı belirler.`,[{row:rr,col:cc}]);}
   for(const [dr,dc] of [[0,1],[1,0]])for(const offset of [-2,-1,0]){const points=[0,1,2].map(k=>({row:r+(offset+k)*dr,col:c+(offset+k)*dc}));const others=points.filter(p=>p.row!==r||p.col!==c);if(points.every(p=>p.row>=0&&p.col>=0&&p.row<n&&p.col<n)&&g[others[0].row][others[0].col]&&g[others[0].row][others[0].col]===g[others[1].row][others[1].col])return cell(r,c,opposite(g[others[0].row][others[0].col])!,'Three identical symbols may not be consecutive.','Üç aynı simge art arda gelemez.',others);}
   if(n%2===0)for(const line of [g[r],g.map(row=>row[c])])for(const mark of ['sun','moon'] as const)if(line.filter(v=>v===mark).length===n/2)return cell(r,c,opposite(mark)!,'This row or column already has half of this symbol; fill with the other.','Bu satır veya sütunda bu simgenin yarısı dolu; diğer simgeyi yerleştir.');
  }return null;
 }
 if(s.type==='battleship'){
  const ship=(v:string)=>!!v&&v!=='w';for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(ship(s.grid[r][c]))for(const dc of [-1,1])if(s.grid[r+1]?.[c+dc]&&ship(s.grid[r+1][c+dc]))throw Error('Diagonal ships conflict');for(let i=0;i<n;i++)for(const [line,count] of [[s.grid[i],s.clues.left[i]],[s.grid.map(r=>r[i]),s.clues.top[i]]] as const){if(count!==null&&(line.filter(ship).length>count||line.filter(v=>v!=='w').length<count))throw Error('Ship count conflict');}
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(s.grid[r][c]===''){
   for(const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]])if(s.grid[r+dr]?.[c+dc]&&ship(s.grid[r+dr][c+dc]))return cell(r,c,'w','Ships cannot touch diagonally, so this cell is water.','Gemiler çapraz temas edemez; bu hücre sudur.',[{row:r+dr,col:c+dc}]);
   for(const [line,count] of [[s.grid[r],s.clues.left[r]],[s.grid.map(row=>row[c]),s.clues.top[c]]] as const)if(count!==null&&line.filter(ship).length===count)return cell(r,c,'w','The row or column ship count is complete; remaining cells are water.','Satır veya sütunun gemi sayısı tamamlandı; kalan hücreler sudur.');
  }return null;
 }
 if(s.type==='skyscraper'){
  for(let i=0;i<n;i++)for(const line of [s.grid[i],s.grid.map(r=>r[i])]){const values=line.filter(v=>v!==null);if(new Set(values).size!==values.length)throw Error('Repeated height');}
  for(const side of ['top','bottom','left','right'] as const)for(let i=0;i<n;i++){const clue=s.clues[side][i];if(clue!==1&&clue!==n)continue;for(let distance=0;distance<(clue===1?1:n);distance++){const r=side==='top'?distance:side==='bottom'?n-1-distance:i,c=side==='left'?distance:side==='right'?n-1-distance:i;const value=clue===1?n:distance+1;if(s.grid[r][c]!==null&&s.grid[r][c]!==value)throw Error('Height conflicts with an edge clue');if(s.grid[r][c]===null)return cell(r,c,value,clue===1?'A clue of 1 puts the tallest building beside that edge.':'A clue equal to the grid size requires ascending heights from that edge.',clue===1?'1 ipucu, en yüksek binayı o kenarın yanına yerleştirir.':'Boyuta eşit ipucu, o kenardan başlayarak artan yükseklikler gerektirir.');}}return null;
 }
 const edges=(r:number,c:number)=>[{kind:'h' as const,row:r,col:c,value:s.horizontal[r][c]},{kind:'h' as const,row:r+1,col:c,value:s.horizontal[r+1][c]},{kind:'v' as const,row:r,col:c,value:s.vertical[r][c]},{kind:'v' as const,row:r,col:c+1,value:s.vertical[r][c+1]}];
 for(let r=0;r<n;r++)for(let c=0;c<n;c++){const clue=s.grid[r][c];if(typeof clue!=='number')continue;const around=edges(r,c),lines=around.filter(e=>e.value==='line').length,unknown=around.filter(e=>e.value==='empty');if(lines>clue||lines+unknown.length<clue)throw Error('Edge count conflict');}
 for(let r=0;r<=n;r++)for(let c=0;c<=n;c++){const adjacent=[{kind:'h' as const,row:r,col:c-1,value:s.horizontal[r]?.[c-1]},{kind:'h' as const,row:r,col:c,value:s.horizontal[r]?.[c]},{kind:'v' as const,row:r-1,col:c,value:s.vertical[r-1]?.[c]},{kind:'v' as const,row:r,col:c,value:s.vertical[r]?.[c]}].filter(e=>e.value!==undefined);const lines=adjacent.filter(e=>e.value==='line').length,unknown=adjacent.filter(e=>e.value==='empty');if(lines>2||lines===1&&!unknown.length)throw Error('Loop vertex conflict');}
 for(let r=0;r<n;r++)for(let c=0;c<n;c++){const clue=s.grid[r][c];if(typeof clue!=='number')continue;const around=edges(r,c),lines=around.filter(e=>e.value==='line').length,unknown=around.filter(e=>e.value==='empty');if(unknown.length&&(lines===clue||lines+unknown.length===clue)){const e=unknown[0];return {...e,value:lines===clue?'cross':'line',cause:[{row:r,col:c}],en:'The clue fixes the number of surrounding lines; finish its remaining edges.',tr:'İpucu çevresindeki çizgi sayısını belirler; kalan kenarları tamamla.'};}}
 return null;
}
function place(input:PuzzleState,hint:Deduction):PuzzleState{const s=parseState(input);if(hint.kind==='cell'){
 if(s.type==='tango')s.board.grid[hint.row][hint.col]=hint.value as Mark;
 else if(s.type==='battleship'){s.grid[hint.row][hint.col]=String(hint.value);s.clues.cells[`${hint.row},${hint.col}`]=String(hint.value);}
 else if(s.type==='skyscraper')s.grid[hint.row][hint.col]=Number(hint.value);
 }else if(s.type==='slitherlink'){(hint.kind==='h'?s.horizontal:s.vertical)[hint.row][hint.col]=hint.value as Edge;}
 return parseState(s);
}
export function nextDeduction(input:PuzzleState):Deduction|null{const hint=propose(input);if(hint)propose(place(input,hint));return hint;}
export function applyDeduction(input:PuzzleState,hint:Deduction):PuzzleState{const fresh=nextDeduction(input);if(JSON.stringify(fresh)!==JSON.stringify(hint))throw Error('The board changed; request a new hint');return place(input,hint);}
