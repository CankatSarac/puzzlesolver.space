'use client';
import {useState} from 'react';
import {PuzzleTools} from '@/learning/PuzzleTools';
import {workedExample} from '@/learning/examples';
import type {PuzzleState} from '@/learning/puzzle';
export default function QA(){
 const [board,setBoard]=useState<PuzzleState>(()=>workedExample('tango'));
 const change=()=>{const next=workedExample('tango'); if(next.type==='tango')next.board.grid[2][0]='moon';setBoard(next);};
 return <main><button onClick={change}>Change fictional board</button><button onClick={()=>setBoard(workedExample('tango'))}>Restore fictional board</button><PuzzleTools type="tango" value={board} active={true} onRestore={setBoard} onReset={()=>setBoard(workedExample('tango'))}/></main>;
}
