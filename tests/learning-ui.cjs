const {JSDOM}=require('jsdom');
const assert=require('node:assert/strict');
const dom=new JSDOM('<div id="root"></div>',{url:'https://puzzle.test'});
for(const key of ['window','document','navigator','HTMLElement','HTMLTextAreaElement','Element','Event','MouseEvent','MutationObserver','getComputedStyle','localStorage','Node','DocumentFragment'])Object.defineProperty(global,key,{value:key==='getComputedStyle'?dom.window.getComputedStyle.bind(dom.window):dom.window[key],configurable:true});
global.self=dom.window;global.IS_REACT_ACT_ENVIRONMENT=true;global.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
global.requestAnimationFrame=cb=>setTimeout(cb,0);global.cancelAnimationFrame=clearTimeout;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');
const {PuzzleTools,workedExample,puzzleCode,Tango,Battleship,Skyscraper,Slitherlink}=require(process.env.PUZZLE_UI_BUNDLE);
let root,container=document.getElementById('root');
const button=text=>[...container.querySelectorAll('button')].find(e=>e.textContent===text);
const click=async element=>{assert.ok(element,'control exists');await act(async()=>{element.dispatchEvent(new MouseEvent('click',{bubbles:true}));await new Promise(r=>setTimeout(r,5));});};
const enter=async(element,text)=>{assert.ok(element);await act(async()=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(element,text);element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,0));});};
const mount=async element=>{root=createRoot(container);await act(async()=>{root.render(element);await new Promise(r=>setTimeout(r,5));});};
const unmount=async()=>{await act(async()=>root.unmount());container.innerHTML='';};
(async()=>{
 let current,setValue,copied;Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{copied=text;}},configurable:true});const key='puzzlesolver.board.v1.tango';
 function Harness(){const [s,set]=React.useState(workedExample('tango'));setValue=set;current=s;return React.createElement(PuzzleTools,{type:'tango',value:s,active:true,onRestore:set,onReset:()=>set(workedExample('tango'))});}
 await mount(React.createElement(Harness));await click(button('Explain my next move'));assert.ok(container.querySelector('svg'),'deduction has highlighted diagram');await click(button('Türkçe'));assert.ok(container.querySelector('svg[aria-label^="Vurgulanan çıkarım"]'),'diagram label follows Turkish language');await click(button('English'));await click(button('Place only this deduction'));assert.equal(current.board.grid[0][2],'moon');
 await click(button('Save locally and keep saving changes'));assert.equal(JSON.parse(localStorage.getItem(key)).puzzle.board.grid[0][2],'moon');
 await click(container.querySelector('summary'));await click(container.querySelector('input[type=checkbox]'));assert.equal(button('Copy reviewed puzzle code').disabled,false);await click(button('Copy reviewed puzzle code'));assert.equal(copied,container.querySelector('textarea[readOnly]').value,'clipboard gets exact reviewed code');
 const reviewedBoard=structuredClone(current);
 await act(async()=>{const changed=workedExample('tango');changed.board.grid[2][0]='moon';setValue(changed);});assert.equal(button('Copy reviewed puzzle code').disabled,true,'changed board resets exact-preview consent');
 await act(async()=>setValue(reviewedBoard));assert.equal(button('Copy reviewed puzzle code').disabled,true,'returning to the earlier board still requires a fresh review');
 await act(async()=>{const changed=workedExample('tango');changed.board.grid[2][0]='moon';setValue(changed);});
 await act(async()=>{await new Promise(r=>setTimeout(r,400));});assert.equal(JSON.parse(localStorage.getItem(key)).puzzle.board.grid[2][0],'moon','editing updates a previously chosen local save');await unmount();await mount(React.createElement(Harness));await click(button('Resume my local board'));assert.equal(current.board.grid[2][0],'moon','restart restoration uses actual saved snapshot');
 await unmount();localStorage.setItem(key,'corrupt original');await mount(React.createElement(Harness));assert.equal(button('Save locally and keep saving changes').disabled,true);assert.equal(localStorage.getItem(key),'corrupt original');await unmount();localStorage.clear();
 for(const [name,Component,type] of [['Tango',Tango,'tango'],['Battleship',Battleship,'battleship'],['Skyscraper',Skyscraper,'skyscraper'],['Slitherlink',Slitherlink,'slitherlink']]){
  await mount(React.createElement(Component));assert.ok(button('Explain my next move'),name+' integrated toolbar');
  const target=workedExample(type); // differs from default size for Tango and Battleship
  await enter(container.querySelector('textarea[aria-label="Paste a puzzle code"]'),puzzleCode(target));await click(button('Validate pasted board'));assert.ok(button('Apply reviewed imported board'),name+' validates import');await click(button('Apply reviewed imported board'));
  await click(button('Explain my next move'));assert.ok(container.querySelector('svg[aria-label^="Highlighted deduction"]'),name+' restored board survives initialization effects');await click(button('Place only this deduction'));await click(button('Save locally and keep saving changes'));
  const saved=JSON.parse(localStorage.getItem('puzzlesolver.board.v1.'+type)).puzzle;assert.equal(saved.size,target.size,name+' size kept');
  if(type==='tango')assert.equal(saved.board.grid[0][2],'moon');if(type==='battleship')assert.equal(saved.grid[0][0],'w');if(type==='skyscraper')assert.equal(saved.grid[0][0],4);if(type==='slitherlink')assert.equal(saved.horizontal[0][0],'cross');
  await unmount();localStorage.clear();
 }
 console.log('UI checks pass: real deduction/apply, exact share consent reset, local saving, corrupt-data preservation and all four imported board integrations.');
})().catch(e=>{console.error(e);process.exitCode=1;});
