import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap-reboot.min.css';
import { Clock3, Compass, FlaskConical, Lightbulb, Play, RefreshCw, RotateCcw, StepForward, Target, Zap, Network, Route, Pause, Square, Check, CircleDot } from 'lucide-react';
import { generateMaze } from './utils/maze';
import { solvers, algorithmList } from './algorithms/solvers';
import './styles.css';

const sizeOptions = [10, 15, 20, 25, 30, 40, 50];
const speedConfig = { Slow: 55, Medium: 22, Fast: 9, 'Very Fast': 2 };
const mazePatterns = ['Random', 'Spiral', 'Zigzag', 'Open Field'];
const initialMetrics = { nodesExplored: 0, pathLength: 0, executionTime: 0, efficiency: 0, current: '—' };

function MazeMark({ small = false }) {
  return <div className={`maze-mark ${small ? 'small' : ''}`} aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M8 20 32 7l24 13v29L32 62 8 49Z"/><path d="M17 24l15-8 15 8v18l-8 4V31l-7-4-7 4v15l-8-4Z"/><path d="m24 43 8 5 15-8"/></svg></div>;
}

function Header() {
 return <header className="hero"><div className="header-brand"><MazeMark small/><span>MAZERA<small>Intelligent pathfinding</small></span></div><div><h1><b>AI</b> Maze Solver</h1><p>Visualize. Compare. Learn. Go Beyond.</p></div><div className="header-script">Paths<br/>Build<br/>Better <i>Thinkers</i></div><div className="hero-lines"/></header>
}

function SelectField({ label, value, values, onChange, disabled }) { return <label className={`field ${disabled ? 'is-disabled' : ''}`}><span>{label}</span><select value={value} disabled={disabled} onChange={e => onChange(e.target.value)}>{values.map(v => <option key={v} value={v}>{v}</option>)}</select></label> }

function MazeControls({ algorithm, heuristic, setHeuristic, pattern, setPattern, size, setSize, speed, setSpeed, onGenerate, onReset, onSolve, solving, canSolve }) {
  const supportsHeuristic = ['astar', 'greedy'].includes(algorithm);
  return <div className="maze-controls">
    <div className="control-fields">
      <SelectField label="Heuristic" value={heuristic} onChange={setHeuristic} values={['Manhattan', 'Euclidean']} disabled={!supportsHeuristic}/>
      <SelectField label="Generation" value={pattern} onChange={setPattern} values={mazePatterns}/>
      <SelectField label="Maze Size" value={`${size} × ${size}`} onChange={setSize} values={sizeOptions.map(String).map(x => `${x} × ${x}`)} />
      <label className="speed-field"><span>Speed</span><input aria-label="Animation speed" type="range" min="0" max="3" value={Object.keys(speedConfig).indexOf(speed)} onChange={e => setSpeed(Object.keys(speedConfig)[Number(e.target.value)])}/><b>{speed}</b></label>
    </div>
    <div className="control-actions"><button className="secondary-btn" onClick={onGenerate}><RefreshCw size={17}/>Generate Maze</button><button className="secondary-btn" onClick={onReset}><RotateCcw size={17}/>Reset</button><button className="solve-btn" disabled={solving || !canSolve} onClick={onSolve}><Play size={17} fill="currentColor"/>Solve Maze</button></div>
  </div>
}

function MazeGrid({ maze, start, goal, visited, path, current, status }) {
 const visitedSet = useMemo(() => new Set(visited.map(([r,c]) => `${r}-${c}`)), [visited]);
 const pathSet = useMemo(() => new Set(path.map(([r,c]) => `${r}-${c}`)), [path]);
 return <div className="maze-frame"><div className={`maze-grid ${status === 'completed' ? 'maze-complete' : ''}`} style={{gridTemplateColumns: `repeat(${maze.length}, 1fr)`}} aria-label="Interactive maze visualization">
   {maze.flatMap((row,r) => row.map((cell,c) => { const key=`${r}-${c}`, state = r===start[0]&&c===start[1] ? 'start' : r===goal[0]&&c===goal[1] ? 'goal' : pathSet.has(key) ? 'path' : current?.[0]===r&&current?.[1]===c ? 'current' : visitedSet.has(key) ? 'visited' : cell ? 'wall' : 'empty'; return <span key={key} className={`cell ${state}`}>{state==='start' && <CircleDot/>}{state==='goal' && <Target/>}</span>}))}
 </div></div>;
}

function Legend() { return <div className="legend"><span><i className="start-dot"/>Start Node</span><span><i className="goal-dot"/>Goal Node</span><span><i className="path-dot"/>Shortest Path</span><span><i className="visited-dot"/>Explored Node</span><span><i className="wall-dot"/>Wall</span></div> }

function StatusPanel({ status, algorithm, metrics, onPause, onStop, onReplay, paused }) { const completed = status === 'completed'; return <div className="status-stack"><div className="status-card"><div className="status-title">{completed ? 'Solved with' : status === 'idle' ? 'Ready to solve with' : 'Solving with'} <b>{algorithmList.find(a=>a.id===algorithm)?.name}...</b></div><div className="progress-line"><span style={{width: `${completed ? 100 : Math.min(96, Math.max(4, metrics.nodesExplored / 5))}%`}}/></div><b className="progress-number">{completed ? '100%' : status === 'paused' ? 'Paused' : 'In progress'}</b><dl><div><dt>Nodes Explored</dt><dd>{metrics.nodesExplored}</dd></div><div><dt>Path Length</dt><dd>{metrics.pathLength || '—'}</dd></div><div><dt>Execution Time</dt><dd>{metrics.executionTime ? `${metrics.executionTime.toFixed(2)} ms` : '—'}</dd></div><div><dt>Current Position</dt><dd>{metrics.current}</dd></div></dl></div>
 {completed ? <><div className="success-card"><Check/><div><b>Path found!</b><span>Reached the goal successfully.</span></div></div><div className="status-actions"><button onClick={onReplay}><Play size={15} fill="currentColor"/>Play Again</button><button onClick={onReplay}><StepForward size={16}/>Step</button></div></> : status !== 'idle' && <div className="status-actions"><button onClick={onPause}>{paused ? <Play size={15}/> : <Pause size={15}/>} {paused ? 'Resume' : 'Pause'}</button><button onClick={onStop}><Square size={14} fill="currentColor"/>Stop</button></div>}</div> }

function AlgorithmLab({ selected, onSelect }) { return <section className="card lab-card"><div className="card-title"><div><FlaskConical/><h2>Algorithm Lab<small>This is the only place to choose an algorithm.</small></h2></div></div><div className="algorithm-grid">{algorithmList.map(({id,name,description,Icon}) => <button key={id} onClick={() => onSelect(id)} className={`algorithm-card ${selected===id?'selected':''}`}><Icon/><strong>{name}</strong><span>{description}</span></button>)}</div></section> }

function LiveMetrics({ metrics, status }) { const cards = [[Network,'Nodes Explored',metrics.nodesExplored,'purple'],[Route,'Path Length',metrics.pathLength || '—','green'],[Clock3,'Time Taken',metrics.executionTime ? `${metrics.executionTime.toFixed(2)}ms` : '—','blue'],[Zap,'Efficiency',metrics.efficiency ? `${metrics.efficiency}%` : '—','green']]; return <section className="card metrics-card"><div className="metrics-heading"><h2>Live Metrics</h2><span className={status}><i/>{status === 'completed' ? 'Completed' : status === 'idle' ? 'Ready' : status === 'paused' ? 'Paused' : 'Solving...'}</span></div><div className="metrics-grid">{cards.map(([Icon,label,value,color])=><div className="metric" key={label}><Icon className={color}/><span>{label}</span><b>{value}</b></div>)}</div></section> }

function AIInsight({ algorithm, metrics, status }) { const a = algorithmList.find(x => x.id === algorithm); let text = 'Choose an algorithm and run the maze to receive an explanation based on its actual traversal.'; if(status==='completed') { if(algorithm==='bfs') text=`Breadth-first search explores in layers, so it guarantees the shortest route through this unweighted maze. It reached the goal after considering ${metrics.nodesExplored} nodes.`; else if(algorithm==='astar') text=`A* used its ${'Manhattan'} distance heuristic to prioritize promising corridors. It found a ${metrics.pathLength}-step route while exploring ${metrics.nodesExplored} nodes.`; else if(algorithm==='dfs') text=`Depth-first search committed down branches before backtracking. It found a valid route, though that strategy does not guarantee the shortest path.`; else text=`${a.name} completed with a ${metrics.pathLength}-step route after exploring ${metrics.nodesExplored} nodes. Compare it against BFS on this same maze for context.`; } return <section className="insight-card"><div className="insight-icon"><Lightbulb/></div><div><h2>AI Insight</h2><p>{text}</p></div></section> }

function Comparison({ maze, start, goal, selected, onUse }) { const [metric, setMetric] = useState('time'); const data = useMemo(() => algorithmList.map(a => ({...a, result: solvers[a.id](maze,start,goal)})), [maze,start,goal]); const max = Math.max(...data.map(x=> metric==='time'?x.result.executionTime:metric==='visited'?x.result.nodesExplored:metric==='path'?x.result.pathLength:x.result.nodesExplored+x.result.pathLength),1); const labels={time:'Execution Time',visited:'Nodes Explored',path:'Path Length',memory:'Memory Usage'}; return <section className="card comparison"><div className="comparison-head"><div><h2>Algorithm Comparison</h2><p>Compare performance of different algorithms on the same maze.</p></div><div className="tabs">{Object.entries(labels).map(([id,l])=><button key={id} onClick={()=>setMetric(id)} className={metric===id?'active':''}>{l}</button>)}</div></div><div className="chart">{data.map((d,i)=>{const value=metric==='time'?d.result.executionTime:metric==='visited'?d.result.nodesExplored:metric==='path'?d.result.pathLength:d.result.nodesExplored+d.result.pathLength; return <button className={`bar-wrap ${selected===d.id?'chosen':''}`} onClick={()=>onUse(d.id)} key={d.id} title={`Use ${d.name}`}><span className="bar-value">{metric==='time'?`${value.toFixed(2)}ms`:value}</span><span className={`bar bar-${i}`} style={{height:`${Math.max(8,value/max*100)}%`}}/><b>{d.short}</b></button>})}</div></section> }

function MiniMaze({ item }) { const cells = item.preview || []; return <div className="mini-maze">{cells.length ? cells.map((v,i)=><i key={i} className={v?'filled':''}/>) : <span/>}</div> }
function RecentMazes({ items, onLoad }) { return <section className="card recent"><div className="recent-head"><h2>Recent Mazes</h2><span>Saved locally</span></div><div className="recent-grid">{items.length ? items.slice(0,4).map((item,i)=><button onClick={()=>onLoad(item)} className={`recent-item ${i===0?'featured':''}`} key={item.id}><MiniMaze item={item}/><b>{item.size} × {item.size}</b><span>{item.algorithm} • {item.time.toFixed(2)}ms</span></button>) : <div className="empty-recent">Solve a maze to build your library.</div>}</div></section> }

function App() {
 const [size, setSize] = useState(30); const [pattern, setPattern] = useState('Random'); const [maze, setMaze] = useState(()=>generateMaze(30, 'Random')); const start=[1,1], goal=[size-2,size-2];
 const [algorithm,setAlgorithm]=useState('astar'), [heuristic,setHeuristic]=useState('Manhattan'), [speed,setSpeed]=useState('Fast');
 const [visited,setVisited]=useState([]), [path,setPath]=useState([]), [current,setCurrent]=useState(null), [status,setStatus]=useState('idle'), [metrics,setMetrics]=useState(initialMetrics), [recent,setRecent]=useState([]), [paused,setPaused]=useState(false);
 const animation=useRef({cancel:false,paused:false});
 useEffect(()=>{ try{setRecent(JSON.parse(localStorage.getItem('mazera-history')||'[]'))}catch{} },[]);
 const reset=useCallback(()=>{animation.current.cancel=true;setVisited([]);setPath([]);setCurrent(null);setMetrics(initialMetrics);setStatus('idle');setPaused(false)},[]);
 const changeSize = value => { const n=Number(String(value).split(' ')[0]); setSize(n); setMaze(generateMaze(n, pattern)); reset(); };
 const generate=()=>{setMaze(generateMaze(size, pattern));reset()};
 const saveRecent=(result)=>{const preview=maze.slice(0,12).flatMap(r=>r.slice(0,12));const item={id:Date.now(),size,algorithm:algorithmList.find(a=>a.id===algorithm).name,time:result.executionTime,preview,maze};const next=[item,...recent].slice(0,8);setRecent(next);localStorage.setItem('mazera-history',JSON.stringify(next))};
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const run=async()=>{reset(); await sleep(30); const result=solvers[algorithm](maze,start,goal,heuristic); if(!result.success){setStatus('idle');return;} animation.current={cancel:false,paused:false};setStatus('solving');const delay=speedConfig[speed];const batch=delay<5?12:delay<12?5:1; let shown=0; for(let i=0;i<result.visitedOrder.length;i+=batch){while(animation.current.paused&&!animation.current.cancel)await sleep(80);if(animation.current.cancel)return; const next=result.visitedOrder.slice(0,i+batch);shown=next.length;setVisited(next); const node=next.at(-1);setCurrent(node);setMetrics(m=>({...m,nodesExplored:shown,current:`(${node[0]+1}, ${node[1]+1})`,executionTime:result.executionTime}));await sleep(delay);} for(let i=0;i<result.path.length;i++){while(animation.current.paused&&!animation.current.cancel)await sleep(80);if(animation.current.cancel)return;setPath(result.path.slice(0,i+1));setMetrics(m=>({...m,pathLength:i+1}));await sleep(Math.max(15,delay*1.7));}setCurrent(null);setMetrics({...result,current:'Goal',efficiency:Math.max(1,Math.round((1-result.nodesExplored/(size*size))*100))});setStatus('completed');saveRecent(result);};
 const togglePause=()=>{animation.current.paused=!animation.current.paused;setPaused(animation.current.paused);setStatus(animation.current.paused?'paused':'solving')};
 const loadRecent=item=>{if(item.maze){setSize(item.size);setMaze(item.maze);reset()}};
 const algName=algorithmList.find(a=>a.id===algorithm)?.name;
 return <div className="app-shell"><main><Header/><div className="dashboard"><section className="maze-workspace card"><MazeControls algorithm={algorithm} heuristic={heuristic} setHeuristic={setHeuristic} pattern={pattern} setPattern={setPattern} size={size} setSize={changeSize} speed={speed} setSpeed={setSpeed} onGenerate={generate} onReset={reset} onSolve={run} solving={status==='solving'||status==='paused'} canSolve={status!=='solving'&&status!=='paused'}/><div className="maze-content"><MazeGrid maze={maze} start={start} goal={goal} visited={visited} path={path} current={current} status={status}/><aside className="maze-aside"><Legend/><StatusPanel status={status} algorithm={algorithm} metrics={metrics} onPause={togglePause} onStop={reset} onReplay={run} paused={paused}/></aside></div></section><div className="right-column"><AlgorithmLab selected={algorithm} onSelect={id=>{setAlgorithm(id);reset()}}/><LiveMetrics metrics={metrics} status={status}/><AIInsight algorithm={algorithm} metrics={metrics} status={status}/></div><Comparison maze={maze} start={start} goal={goal} selected={algorithm} onUse={id=>{setAlgorithm(id);reset()}}/><RecentMazes items={recent} onLoad={loadRecent}/></div></main></div>
}
createRoot(document.getElementById('root')).render(<App/>);
