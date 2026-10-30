const {mkdtempSync,rmSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {join,resolve}=require('node:path');
const {execFileSync}=require('node:child_process');
const dir=mkdtempSync(join(tmpdir(),'puzzlesolver-ui-'));
try {const bundle=join(dir,'components.cjs');execFileSync('bun',['build','tests/learning-ui-entry.tsx','--target','node','--format','cjs','--external','react','--external','react-dom','--outfile',bundle],{stdio:'inherit'});execFileSync(process.execPath,['tests/learning-ui.cjs'],{env:{...process.env,PUZZLE_UI_BUNDLE:bundle,NODE_PATH:resolve('node_modules')},stdio:'inherit'});}finally{rmSync(dir,{recursive:true,force:true});}
