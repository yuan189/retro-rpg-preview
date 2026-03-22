import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, ChevronRight, Monitor, Activity, Move, List, Save, Play, Edit3, Trash2, Plus, Download, Upload, Crop, MessageSquare, Image as ImageIcon, Shield, Sliders, Zap } from 'lucide-react';

// --- CSS Matrix ---
const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
  :root { --rpg-font: 'VT323', monospace; }
  body { margin: 0; overflow: hidden; background-color: #000; font-family: var(--rpg-font); user-select: none; }
  
  .pixelated { image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges; }

  .rpg-box { border: 4px solid #e2e8f0; background-color: #050505; color: #fff; position: relative; box-shadow: inset 0 0 10px rgba(0,0,0,0.8); transition: all 0.3s; }
  .rpg-box::after { content: ''; position: absolute; top: 2px; left: 2px; right: 2px; bottom: 2px; border: 1px solid rgba(255,255,255,0.2); pointer-events: none; }
  .rpg-box-active { border-color: #fde047; box-shadow: inset 0 0 15px rgba(253, 224, 71, 0.4), 0 0 10px rgba(253, 224, 71, 0.5); z-index: 30; }
  .is-dead { filter: grayscale(1) brightness(0.4); pointer-events: none; }
  .is-dead.targetable-ally { pointer-events: auto; } 

  .targeting-mode .targetable-ally, .targeting-mode .targetable-enemy { cursor: crosshair; animation: target-pulse 1s infinite alternate; }
  .targeting-mode .targetable-ally:hover, .targeting-mode .targetable-enemy:hover { border-color: #ef4444; box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.6); }
  @keyframes target-pulse { 0% { border-color: rgba(255,255,255,0.5); } 100% { border-color: rgba(255,255,255,1); } }

  @keyframes combat-text-anim { 0% { opacity: 1; transform: translateY(0) scale(1.5); } 80% { opacity: 1; transform: translateY(-40px) scale(1); } 100% { opacity: 0; transform: translateY(-50px) scale(1); } }
  .combat-text { position: absolute; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000; pointer-events: none; z-index: 100; animation: combat-text-anim 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
  .dmg-text { color: #ff3333; } .heal-text { color: #33ff33; } .miss-text { color: #aaaaaa; font-style: italic; }

  @keyframes idle-breathe { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.02) translateY(-2px); } } .anim-idle-breathe { animation: idle-breathe 4s ease-in-out infinite; }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } } .anim-float { animation: float 3s ease-in-out infinite; }
  @keyframes float-fast { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } } .anim-float-fast { animation: float-fast 1.5s ease-in-out infinite; }
  @keyframes shake { 0%, 100% { transform: translate(0, 0); } 10%, 30%, 50%, 70%, 90% { transform: translate(-4px, 0); } 20%, 40%, 60%, 80% { transform: translate(4px, 0); } } .anim-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) infinite; }
  @keyframes flash { 0%, 100% { filter: brightness(1) drop-shadow(0 0 0 transparent); } 50% { filter: brightness(2.5) drop-shadow(0 0 15px white); } } .anim-flash { animation: flash 0.15s infinite; }
  @keyframes hurt { 0%, 100% { filter: sepia(0) hue-rotate(0deg) saturate(1); transform: translateX(0); } 25% { filter: sepia(1) hue-rotate(-50deg) saturate(5); transform: translateX(-5px); } 75% { filter: sepia(1) hue-rotate(-50deg) saturate(5); transform: translateX(5px); } } .anim-hurt { animation: hurt 0.3s infinite; }
  @keyframes lunge { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.1); } } .anim-lunge { animation: lunge 0.3s cubic-bezier(.25,.8,.25,1) infinite; }
  @keyframes lunge-down { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(30px) scale(1.1); } } .anim-lunge-down { animation: lunge-down 0.3s cubic-bezier(.25,.8,.25,1) infinite; }
  @keyframes indicator-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } } .indicator-bounce { animation: indicator-bounce 1s ease-in-out infinite; }
  @keyframes spin { 100% { transform: rotate(360deg); } } .anim-spin { animation: spin 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
  @keyframes ghost { 0%, 100% { filter: blur(0); opacity: 1; transform: scale(1); } 50% { filter: blur(4px); opacity: 0.3; transform: scale(1.15); } } .anim-ghost { animation: ghost 0.8s ease-out; }

  .trans-fade { animation: trans-fade-anim 0.8s ease-in-out forwards; }
  @keyframes trans-fade-anim { 0%, 100% { opacity: 1; filter: brightness(1); } 49% { opacity: 0; filter: brightness(0); } 51% { opacity: 0; filter: brightness(0); } }
  
  .trans-glitch { animation: trans-glitch-anim 0.8s linear forwards; }
  @keyframes trans-glitch-anim {
    0%, 100% { filter: none; transform: translate(0); opacity: 1; }
    20% { filter: invert(1) hue-rotate(90deg); transform: translate(-10px, 5px); }
    40% { filter: contrast(3) hue-rotate(180deg); transform: translate(10px, -5px) scale(1.1); }
    49% { filter: brightness(10); opacity: 0; }
    51% { filter: brightness(10); opacity: 0; }
    60% { filter: invert(1) sepia(1); transform: translate(-5px, 10px) skewX(20deg); }
    80% { filter: hue-rotate(270deg); transform: translate(5px, -10px); opacity: 1; }
  }

  .speech-bubble {
    position: absolute; top: -65px; left: 50%; transform: translateX(-50%);
    background: #fff; color: #000; padding: 6px 12px; border: 3px solid #000;
    font-size: 16px; z-index: 150; white-space: nowrap; box-shadow: 4px 4px 0px rgba(0,0,0,0.8);
    animation: bubble-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  .speech-bubble::after { content: ''; position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); border-width: 8px 8px 0; border-style: solid; border-color: #fff transparent transparent transparent; }
  .speech-bubble::before { content: ''; position: absolute; bottom: -13px; left: 50%; transform: translateX(-50%); border-width: 10px 10px 0; border-style: solid; border-color: #000 transparent transparent transparent; z-index: -1; }
  @keyframes bubble-pop { 0% { opacity: 0; transform: translate(-50%, 10px) scale(0.8); } 100% { opacity: 1; transform: translate(-50%, 0) scale(1); } }

  .crt-overlay { background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 4px, 6px 100%; pointer-events: none; z-index: 100; }
  .crt-vignette { box-shadow: inset 0 0 100px rgba(0,0,0,0.9); pointer-events: none; z-index: 101; }
  @keyframes noise-anim { 0%,100% { transform: translate(0,0) } 20% { transform: translate(-5%,5%) } 40% { transform: translate(5%,-5%) } 60% { transform: translate(5%,5%) } 80% { transform: translate(-5%,-5%) } }
  .noise-overlay { position: absolute; top: -50%; left: -50%; right: -50%; bottom: -50%; width: 200%; height: 200%; background: transparent url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="n"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23n)" opacity="0.15"/%3E%3C/svg%3E'); animation: noise-anim 0.2s infinite; pointer-events: none; z-index: 99; opacity: 0.6; }
  
  @keyframes glitch-fx { 0%,100% { transform: translate(0) } 25% { transform: translate(-4px, 2px); filter: drop-shadow(4px 0 0 rgba(255,0,0,0.8)) drop-shadow(-4px 0 0 rgba(0,255,255,0.8)); } 50% { transform: translate(4px, -2px); } 75% { transform: translate(-2px, -4px); filter: drop-shadow(-4px 0 0 rgba(255,0,0,0.8)) drop-shadow(4px 0 0 rgba(0,255,255,0.8)); } }
  .effect-glitch { animation: glitch-fx 0.15s linear infinite; }
  .effect-invert { filter: invert(1) hue-rotate(180deg); }
  .effect-sepia { filter: sepia(0.8) contrast(1.2); }

  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }
  input[type="number"] { -moz-appearance: textfield; } input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
`;

// --- UI Components ---
const MediaElement = ({ media, className, alt }) => {
  if (!media || !media.url) return <div className={`flex items-center justify-center text-gray-700/50 ${className}`}>无图片</div>;
  const tStyle = {
    transform: `translate(${media.x || 0}px, ${media.y || 0}px) scale(${media.scale || 1})`,
    transformOrigin: 'center'
  };
  if (media.type === 'video') return <video src={media.url} style={tStyle} className={`object-cover ${className} pixelated`} autoPlay loop muted playsInline />;
  return <img src={media.url} alt={alt} style={tStyle} className={`object-cover ${className} pixelated`} draggable="false" />;
};

const FxControl = ({ fx = {}, onChange }) => {
  const toggle = (key) => onChange({ ...fx, [key]: !fx[key] });
  return (
    <div className="flex gap-2 text-[10px] bg-gray-900 px-2 py-1 border border-gray-600 rounded">
      <label className="flex items-center gap-1 cursor-pointer text-gray-400 hover:text-white">
        <input type="checkbox" checked={!!fx.glitch} onChange={() => toggle('glitch')} className="accent-indigo-500"/> 撕裂
      </label>
      <label className="flex items-center gap-1 cursor-pointer text-gray-400 hover:text-white">
        <input type="checkbox" checked={!!fx.invert} onChange={() => toggle('invert')} className="accent-indigo-500"/> 反色
      </label>
      <label className="flex items-center gap-1 cursor-pointer text-gray-400 hover:text-white">
        <input type="checkbox" checked={!!fx.sepia} onChange={() => toggle('sepia')} className="accent-indigo-500"/> 褪色
      </label>
    </div>
  );
};

const ImageCropper = ({ src, ratio = 1, onConfirm, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const canvasW = 320;
  const canvasH = 320 / ratio;

  const handleMouseDown = (e) => {
    setDragging(true);
    setStartPos({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPos({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };
  const handleMouseUp = () => setDragging(false);

  const applyCrop = () => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.save();
      ctx.translate(canvasW / 2 + pos.x, canvasH / 2 + pos.y);
      const baseScale = Math.max(canvasW / img.width, canvasH / img.height);
      ctx.scale(baseScale * zoom, baseScale * zoom);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      onConfirm(canvas.toDataURL('image/png'));
    };
    img.src = src;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="text-white mb-4 text-sm tracking-widest">调整图片显示范围</div>
      <div className="relative overflow-hidden border border-gray-500 cursor-move bg-gray-900" style={{ width: canvasW, height: canvasH }} onMouseDown={handleMouseDown}>
         <img src={src} style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`, transformOrigin: 'center' }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" draggable={false} alt="preview"/>
      </div>
      <div className="w-[320px] mt-6 flex items-center gap-4">
        <span className="text-gray-400 text-xs">缩放</span>
        <input type="range" min="0.5" max="3" step="0.05" value={zoom} onChange={(e)=>setZoom(Number(e.target.value))} className="flex-1 accent-indigo-500" />
      </div>
      <div className="flex gap-4 mt-8">
        <button onClick={onCancel} className="px-6 py-2 bg-gray-800 text-white hover:bg-gray-700 text-sm">取消</button>
        <button onClick={applyCrop} className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-sm flex items-center gap-2"><Crop size={16}/>确认裁剪</button>
      </div>
    </div>
  );
};

const MediaControl = ({ label, onMediaChange, onClear, currentMedia, cropRatio = 1, onRequestCrop, minimal = false }) => {
  const [urlStr, setUrlStr] = useState('');
  const [isVid, setIsVid] = useState('image');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (event) => {
      if (isVideo || !onRequestCrop) {
         onMediaChange({ url: event.target.result, type: isVideo ? 'video' : 'image', x: 0, y: 0, scale: 1 });
      } else {
         onRequestCrop({ src: event.target.result, ratio: cropRatio, callback: (croppedSrc) => onMediaChange({ url: croppedSrc, type: 'image' }) });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUrl = () => {
    if (urlStr) onMediaChange({ url: urlStr, type: isVid, x: 0, y: 0, scale: 1 });
  };

  const updateTransform = (key, val) => {
    if (!currentMedia) return;
    onMediaChange({ ...currentMedia, [key]: Number(val) });
  };

  return (
    <div className={`bg-gray-800 rounded border border-gray-700 ${minimal ? 'p-1' : 'p-2 mb-2'}`}>
      <div className="flex justify-between items-center mb-1">
         <label className={`text-gray-400 font-bold ${minimal ? 'text-[10px]' : 'text-xs'}`}>{label}</label>
         {currentMedia && <button onClick={onClear} className="text-[10px] text-red-400 hover:text-red-300">清除</button>}
      </div>
      <div className="flex gap-1 text-[10px] mb-1">
        <input type="file" accept="image/*,video/*" onChange={handleFile} className="flex-1 text-[10px] file:bg-gray-700 file:border-0 file:text-white file:px-2 file:py-1 file:rounded cursor-pointer hover:file:bg-gray-600 bg-gray-900 rounded" />
      </div>
      <div className="flex gap-1 text-[10px]">
        <input type="text" placeholder="输入相对路径或外链" value={urlStr} onChange={(e) => setUrlStr(e.target.value)} className="flex-1 bg-gray-900 border border-gray-600 px-1 text-white" />
        <select value={isVid} onChange={(e) => setIsVid(e.target.value)} className="bg-gray-900 border border-gray-600 text-white px-1 outline-none">
          <option value="image">图片</option><option value="video">视频</option>
        </select>
        <button onClick={handleUrl} className="bg-gray-700 hover:bg-gray-600 text-white px-2 rounded">载入</button>
      </div>
      {currentMedia && (
        <div className="flex gap-1 mt-1 text-[9px]">
          <div className="flex-1 flex items-center bg-gray-900 border border-gray-600 px-1 rounded">
            <span className="text-gray-500 mr-1">X</span>
            <input type="number" value={currentMedia.x || 0} onChange={e=>updateTransform('x', e.target.value)} className="w-full bg-transparent text-white outline-none text-center"/>
          </div>
          <div className="flex-1 flex items-center bg-gray-900 border border-gray-600 px-1 rounded">
            <span className="text-gray-500 mr-1">Y</span>
            <input type="number" value={currentMedia.y || 0} onChange={e=>updateTransform('y', e.target.value)} className="w-full bg-transparent text-white outline-none text-center"/>
          </div>
          <div className="flex-1 flex items-center bg-gray-900 border border-gray-600 px-1 rounded">
            <span className="text-gray-500 mr-1">Z</span>
            <input type="number" step="0.1" value={currentMedia.scale || 1} onChange={e=>updateTransform('scale', e.target.value)} className="w-full bg-transparent text-white outline-none text-center"/>
          </div>
        </div>
      )}
    </div>
  );
};

// 预设数据
const createDefaultMenus = () => ({
  main: [
    { id: `m1_${Date.now()}`, text: '攻击', color: '#ffffff', size: 24, desc: '普通物理攻击', target: 'manual_enemy', actionType: 'damage', value: 10, mpCost: 0, accuracy: 100, effect: 'hurt', duration: 0.8, subMenu: 'none' },
    { id: `m2_${Date.now()}`, text: '技能', color: '#ffffff', size: 24, desc: '消耗MP释放技能', target: 'none', actionType: 'none', value: 0, mpCost: 0, accuracy: 100, effect: 'none', duration: 0, subMenu: 'skills' },
    { id: `m3_${Date.now()}`, text: '防御', color: '#ffffff', size: 24, desc: '进入防御状态', target: 'self', actionType: 'defend', value: 0, mpCost: 0, accuracy: 100, effect: 'shake', duration: 0.5, subMenu: 'none' },
    { id: `m4_${Date.now()}`, text: '物品', color: '#ffffff', size: 24, desc: '使用背包物品', target: 'none', actionType: 'none', value: 0, mpCost: 0, accuracy: 100, effect: 'none', duration: 0, subMenu: 'items' },
  ],
  skills: [
    { id: `s1_${Date.now()}`, text: '重击', color: '#ffea00', size: 22, desc: '消耗MP造成大量伤害', target: 'manual_enemy', actionType: 'damage', value: 40, mpCost: 20, accuracy: 90, effect: 'lunge', duration: 1, subMenu: 'none' },
    { id: `s2_${Date.now()}`, text: '战吼', color: '#ff5500', size: 22, desc: '提升我方全体攻击力', target: 'party_all', actionType: 'buff_atk', value: 15, mpCost: 15, accuracy: 100, effect: 'flash', duration: 1, subMenu: 'none' },
    { id: `s4_${Date.now()}`, text: '返回', color: '#888888', size: 20, desc: '返回上一层', target: 'none', actionType: 'none', value: 0, mpCost: 0, accuracy: 100, effect: 'none', duration: 0, subMenu: 'main' },
  ],
  items: [
    { id: `i1_${Date.now()}`, text: '回复药', color: '#ff5555', size: 22, desc: '恢复目标HP', target: 'manual_party', actionType: 'heal', value: 50, mpCost: 0, accuracy: 100, effect: 'float-fast', duration: 1, subMenu: 'none' },
    { id: `i2_${Date.now()}`, text: '破甲榴弹', color: '#aaaaaa', size: 22, desc: '降低敌方全体防御', target: 'enemy_all', actionType: 'debuff_def', value: 10, mpCost: 0, accuracy: 85, effect: 'shake', duration: 1, subMenu: 'none' },
    { id: `i3_${Date.now()}`, text: '返回', color: '#888888', size: 20, desc: '返回上一层', target: 'none', actionType: 'none', value: 0, mpCost: 0, accuracy: 100, effect: 'none', duration: 0, subMenu: 'main' },
  ]
});

// --- Core Engine ---
export default function App() {
  const [isGameMode, setIsGameMode] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [panelTab, setPanelTab] = useState('global'); 
  const [globalMessage, setGlobalMessage] = useState("");
  const [cropRequest, setCropRequest] = useState(null);
  
  const [bgMedia, setBgMedia] = useState({ url: './assets/bg.png', type: 'image', x: 0, y: 0, scale: 1, fx: { glitch: false, invert: false, sepia: false } });
  const [effects, setEffects] = useState({ crt: true, noise: false, blur: false, screenShake: false, glitch: false, invert: false, sepia: false });
  const [title, setTitle] = useState({ show: true, text: "RPG 战斗引擎" });
  
  const [globalRules, setGlobalRules] = useState({ defendReduction: 50, damageVariance: 10, hpLabel: 'HP', mpLabel: 'MP' });
  const [turnSettings, setTurnSettings] = useState({ playerActions: 2, bossActions: 1 });

  const [boss, setBoss] = useState({
    name: "Boss", hp: 1000, maxHp: 1000, atk: 45, def: 15, anim: 'idle-breathe', isDefending: false, phase: 1,
    media1: { url: './assets/boss.png', type: 'image', x: 0, y: 0, scale: 1 }, 
    media2: { url: './assets/boss_alt.png', type: 'image', x: 0, y: 0, scale: 1 },
    media2Threshold: 50, transitionType: 'glitch', fx: { glitch: false, invert: false, sepia: false }, interruptAtPhase2: true,
    aiRules: [
      { id: 'ai1', condition: 'hp_below', threshold: 30, text: '重攻击', actionType: 'damage', value: 120, accuracy: 90, target: 'party_all', effect: 'flash', duration: 1.5 },
      { id: 'ai2', condition: 'always', threshold: 0, text: '普通攻击', actionType: 'damage', value: 50, accuracy: 95, target: 'party_random', effect: 'lunge-down', duration: 0.8 }
    ],
    dialogueRules: [
      { id: 'bd1', condition: 'hp_below', threshold: 50, text: '血量不足，进入二阶段！', duration: 3, triggered: false }
    ]
  });

  const [party, setParty] = useState([
    { id: 1, name: "角色1", phase: 1, media: { url: './assets/p1.png', type: 'image', x: 0, y: 0, scale: 1 }, mediaDamaged: null, damagedThreshold: 50, transitionType: 'fade', bgMedia: { url: './assets/p1_bg.png', type: 'image', x: 0, y: 0, scale: 1 }, anim: 'idle-breathe', hp: 150, maxHp: 150, mp: 50, maxMp: 50, atk: 40, def: 20, isDefending: false, fx: { glitch: false, invert: false, sepia: false }, menus: createDefaultMenus(), dialogueRules: [] },
    { id: 2, name: "角色2", phase: 1, media: { url: './assets/p2.png', type: 'image', x: 0, y: 0, scale: 1 }, mediaDamaged: null, damagedThreshold: 50, transitionType: 'fade', bgMedia: { url: './assets/p2_bg.png', type: 'image', x: 0, y: 0, scale: 1 }, anim: 'idle-breathe', hp: 80, maxHp: 80, mp: 100, maxMp: 100, atk: 60, def: 10, isDefending: false, fx: { glitch: false, invert: false, sepia: false }, menus: createDefaultMenus(), dialogueRules: [] },
    { id: 3, name: "角色3", phase: 1, media: { url: './assets/p3.png', type: 'image', x: 0, y: 0, scale: 1 }, mediaDamaged: null, damagedThreshold: 50, transitionType: 'fade', bgMedia: { url: './assets/p3_bg.png', type: 'image', x: 0, y: 0, scale: 1 }, anim: 'idle-breathe', hp: 100, maxHp: 100, mp: 40, maxMp: 40, atk: 50, def: 15, isDefending: false, fx: { glitch: false, invert: false, sepia: false }, menus: createDefaultMenus(), dialogueRules: [] },
    { id: 4, name: "角色4", phase: 1, media: { url: './assets/p4.png', type: 'image', x: 0, y: 0, scale: 1 }, mediaDamaged: null, damagedThreshold: 50, transitionType: 'fade', bgMedia: { url: './assets/p4_bg.png', type: 'image', x: 0, y: 0, scale: 1 }, anim: 'idle-breathe', hp: 90, maxHp: 90, mp: 90, maxMp: 90, atk: 20, def: 25, isDefending: false, fx: { glitch: false, invert: false, sepia: false }, menus: createDefaultMenus(), dialogueRules: [] },
  ]);

  const [currentMenuId, setCurrentMenuId] = useState('main');
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [editingMenuCharId, setEditingMenuCharId] = useState(1);
  const [editingMenuId, setEditingMenuId] = useState('main'); 

  const [battleState, setBattleState] = useState({ phase: 'player', actionCount: 0, activePartyId: 1 });
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [targetingAction, setTargetingAction] = useState(null);

  const activeTurnEntity = battleState.phase === 'boss' ? 'boss' : `party_${battleState.activePartyId}`;
  const isPlayerTurn = battleState.phase === 'player' && !isProcessingAction;

  const [combatTexts, setCombatTexts] = useState([]); 
  const [tempEffects, setTempEffects] = useState({});
  const [tempMedia, setTempMedia] = useState({});
  const [activeBubbles, setActiveBubbles] = useState({});
  const [phaseTransitions, setPhaseTransitions] = useState({});
  const timeoutRefs = useRef({});

  // 确保活着的角色被选中
  useEffect(() => {
    if (battleState.phase === 'player' && !isProcessingAction) {
       const currentP = party.find(p => p.id === battleState.activePartyId);
       if (!currentP || currentP.hp <= 0) {
           const firstAlive = party.find(p => p.hp > 0);
           if (firstAlive && firstAlive.id !== battleState.activePartyId) {
               setBattleState(s => ({ ...s, activePartyId: firstAlive.id }));
               setCurrentMenuId('main');
           }
       }
    }
  }, [party, battleState.phase, battleState.activePartyId, isProcessingAction]);

  let activeActorMenus = { main:[], skills:[], items:[] };
  if (activeTurnEntity.startsWith('party_')) {
      const p = party.find(x => x.id === battleState.activePartyId);
      if (p) activeActorMenus = p.menus;
  }
  const currentMenuItems = activeActorMenus[currentMenuId] || [];
  const hoveredItemData = currentMenuItems.find(i => i.id === hoveredItemId);

  // --- Logic Processing ---
  const showCombatText = (targetId, amountStr, type) => {
    const id = Date.now() + Math.random();
    setCombatTexts(prev => [...prev, { id, targetId, text: amountStr, type }]);
    setTimeout(() => { setCombatTexts(prev => prev.filter(t => t.id !== id)); }, 1500);
  };

  const showBubble = (targetId, text, durationSec) => {
    setActiveBubbles(prev => ({ ...prev, [targetId]: text }));
    setTimeout(() => {
      setActiveBubbles(prev => {
        const next = { ...prev };
        if (next[targetId] === text) delete next[targetId];
        return next;
      });
    }, durationSec * 1000);
  };

  const resetBattle = () => {
    setBattleState({ phase: 'player', actionCount: 0, activePartyId: 1 });
    setCurrentMenuId('main');
    setTargetingAction(null);
    setGlobalMessage("战斗已重置");
    setIsProcessingAction(false);
    
    setCombatTexts([]);
    setTempEffects({});
    setTempMedia({});
    setActiveBubbles({});
    setPhaseTransitions({});
    
    setBoss(b => ({ ...b, hp: b.maxHp, phase: 1, isDefending: false, aiRules: b.aiRules.map(r => ({...r, triggered: false})), dialogueRules: (b.dialogueRules||[]).map(r => ({...r, triggered: false})) }));
    setParty(pts => pts.map(p => ({ ...p, hp: p.maxHp, phase: 1, mp: p.maxMp, isDefending: false, dialogueRules: (p.dialogueRules||[]).map(r => ({...r, triggered: false})) })));
    setTimeout(() => setGlobalMessage(""), 1500);
  };

  const advanceTurn = (forceBossInterrupt = false) => {
    if (forceBossInterrupt) {
        setBattleState(s => ({ ...s, phase: 'boss', actionCount: 0 }));
        setCurrentMenuId('main');
        setIsProcessingAction(false);
        setTargetingAction(null);
        setGlobalMessage("Boss 强行介入了回合！");
        return;
    }

    if (battleState.phase === 'player') {
        const nextCount = battleState.actionCount + 1;
        if (nextCount >= turnSettings.playerActions) {
            setBattleState(s => ({ ...s, phase: 'boss', actionCount: 0 }));
            setBoss(b => ({ ...b, isDefending: false }));
        } else {
            setBattleState(s => ({ ...s, actionCount: nextCount }));
        }
    } else {
        const nextCount = battleState.actionCount + 1;
        if (nextCount >= turnSettings.bossActions) {
            setBattleState(s => ({ ...s, phase: 'player', actionCount: 0 }));
            setParty(pts => pts.map(p => ({ ...p, isDefending: false })));
        } else {
            setBattleState(s => ({ ...s, actionCount: nextCount }));
        }
    }

    setCurrentMenuId('main');
    setIsProcessingAction(false);
    setTargetingAction(null);
    setGlobalMessage("");
  };

  const getEntityAttr = (id, attr) => {
    if (id === 'boss') return boss[attr] || 0;
    if (id.startsWith('party_')) { const p = party.find(x => x.id === parseInt(id.split('_')[1])); return p ? p[attr] || 0 : 0; }
    return 0;
  };

  const commitStateUpdates = (action, actorId, targets, finalAmounts) => {
    let newParty = [...party];
    let newBoss = { ...boss };

    if (actorId.startsWith('party_')) {
      const aId = parseInt(actorId.split('_')[1]);
      newParty = newParty.map(p => p.id === aId ? { ...p, mp: Math.max(0, p.mp - (action.mpCost||0)) } : p);
    }

    const applyBuffDebuff = (entity, tId, actType, amount) => {
        const nextEntity = { ...entity };
        if (actType === 'buff_atk') { nextEntity.atk += amount; showCombatText(tId, `ATK+${amount}`, 'heal'); }
        if (actType === 'debuff_atk') { nextEntity.atk = Math.max(0, nextEntity.atk - amount); showCombatText(tId, `ATK-${amount}`, 'damage'); }
        if (actType === 'buff_def') { nextEntity.def += amount; showCombatText(tId, `DEF+${amount}`, 'heal'); }
        if (actType === 'debuff_def') { nextEntity.def = Math.max(0, nextEntity.def - amount); showCombatText(tId, `DEF-${amount}`, 'damage'); }
        return nextEntity;
    };

    targets.forEach(tId => {
      if (finalAmounts[tId] === 'MISS') {
         showCombatText(tId, 'MISS', 'miss'); return;
      }
      const finalAmount = finalAmounts[tId];

      if (tId === 'boss') {
        if (action.actionType === 'damage') {
           newBoss.hp = Math.max(0, newBoss.hp - finalAmount);
           showCombatText('boss', `-${finalAmount}`, 'damage');
        } else if (action.actionType === 'heal') {
           newBoss.hp = Math.min(newBoss.maxHp, newBoss.hp + finalAmount);
           showCombatText('boss', `+${finalAmount}`, 'heal');
        } else if (action.actionType === 'defend') {
           newBoss.isDefending = true;
        } else if (action.actionType.includes('buff')) {
           newBoss = applyBuffDebuff(newBoss, 'boss', action.actionType, finalAmount);
        }
      } else if (tId.startsWith('party_')) {
        const pId = parseInt(tId.split('_')[1]);
        newParty = newParty.map(p => {
          if(p.id !== pId) return p;
          if(action.actionType === 'damage') {
             showCombatText(`party_${p.id}`, `-${finalAmount}`, 'damage');
             return { ...p, hp: Math.max(0, p.hp - finalAmount) };
          }
          if(action.actionType === 'heal' || action.actionType === 'revive') {
             showCombatText(`party_${p.id}`, `+${finalAmount}`, 'heal');
             return { ...p, hp: Math.min(p.maxHp, p.hp + finalAmount) };
          }
          if(action.actionType === 'defend') return { ...p, isDefending: true };
          if(action.actionType.includes('buff')) {
             return applyBuffDebuff(p, tId, action.actionType, finalAmount);
          }
          return p;
        });
      }
    });

    const evaluateDialogues = (entityId, newHpPercent, rulesArray) => {
      if (!rulesArray || rulesArray.length === 0) return rulesArray;
      let triggeredAny = false;
      const updatedRules = rulesArray.map(rule => {
          if (rule.triggered) return rule;
          let conditionMet = false;
          if (rule.condition === 'hp_below' && newHpPercent <= rule.threshold) conditionMet = true;
          if (rule.condition === 'hp_above' && newHpPercent >= rule.threshold) conditionMet = true;
          if (conditionMet && !triggeredAny) {
              showBubble(entityId, rule.text, rule.duration);
              triggeredAny = true;
              return { ...rule, triggered: true };
          }
          return rule;
      });
      return updatedRules;
    };

    newBoss.dialogueRules = evaluateDialogues('boss', (newBoss.hp/newBoss.maxHp)*100, newBoss.dialogueRules);
    newParty = newParty.map(p => ({ ...p, dialogueRules: evaluateDialogues(`party_${p.id}`, (p.hp/p.maxHp)*100, p.dialogueRules) }));

    setParty(newParty);
    setBoss(newBoss);

    if (newBoss.hp <= 0) { setGlobalMessage("战斗胜利"); return false; }
    if (newParty.every(p => p.hp <= 0)) { setGlobalMessage("战斗失败"); return false; }
    return true;
  };

  const executeAction = (action, resolvedTargetId, actorId) => {
    setIsProcessingAction(true);
    setGlobalMessage(`${getEntityName(actorId)} 使用: ${action.text}`);

    triggerEffect(actorId, action.effect, action.duration, action.effectMedia); 
    
    let targets = [];
    if (resolvedTargetId === 'party_all') targets = party.filter(p => p.hp > 0).map(p => `party_${p.id}`);
    else if (resolvedTargetId === 'enemy_all') targets = ['boss']; 
    else if (resolvedTargetId === 'party_random') {
       const alive = party.filter(p => p.hp > 0);
       targets = alive.length > 0 ? [`party_${alive[Math.floor(Math.random() * alive.length)].id}`] : ['boss']; 
    } else targets = [resolvedTargetId];

    setTimeout(() => {
      let finalAmounts = {};
      let phaseChangeTargets = [];
      let forceBossInterrupt = false;

      targets.forEach(tId => {
        const acc = action.accuracy !== undefined ? action.accuracy : 100;
        
        const isBeneficial = ['heal', 'revive', 'buff_atk', 'buff_def', 'defend', 'none'].includes(action.actionType);
        if (!isBeneficial && (Math.random() * 100) > acc) {
           finalAmounts[tId] = 'MISS'; return;
        }

        let baseAmount = parseInt(action.value) || 0;
        let fAmt = 0;

        if (action.actionType === 'damage') {
           triggerEffect(tId, 'hurt', 0.5);
           const attackerAtk = getEntityAttr(actorId, 'atk');
           const targetDef = getEntityAttr(tId, 'def');
           const isDefending = getEntityAttr(tId, 'isDefending');

           let rawDmg = Math.max(1, baseAmount + attackerAtk - targetDef);
           if (isDefending) rawDmg = Math.floor(rawDmg * (1 - globalRules.defendReduction / 100));

           const variance = globalRules.damageVariance / 100;
           fAmt = Math.max(1, Math.floor(rawDmg * ((1 - variance) + Math.random() * (variance * 2)))); 
        } 
        else if (action.actionType === 'heal' || action.actionType === 'revive') {
           triggerEffect(tId, 'flash', 0.5);
           const variance = globalRules.damageVariance / 100;
           fAmt = Math.floor(baseAmount * ((1 - variance) + Math.random() * (variance * 2)));
        }
        else if (action.actionType.includes('buff')) {
           fAmt = baseAmount;
           triggerEffect(tId, action.actionType.startsWith('buff') ? 'flash' : 'hurt', 0.5);
        }
        
        finalAmounts[tId] = fAmt;

        if (['damage', 'heal', 'revive'].includes(action.actionType)) {
            const oldHp = getEntityAttr(tId, 'hp');
            const maxHp = getEntityAttr(tId, 'maxHp');
            const oldPhase = getEntityAttr(tId, 'phase') || 1;
            const newHp = action.actionType === 'damage' ? Math.max(0, oldHp - fAmt) : Math.min(maxHp, oldHp + fAmt);
            
            let threshold, transType;
            if (tId === 'boss') {
               threshold = boss.media2Threshold; transType = boss.transitionType || 'none';
            } else {
               const p = party.find(x => x.id === parseInt(tId.split('_')[1]));
               threshold = p.damagedThreshold; transType = p.transitionType || 'none';
            }

            const newPhase = (newHp / maxHp) * 100 <= threshold ? 2 : 1;
            if (oldPhase !== newPhase && transType !== 'none') {
                phaseChangeTargets.push({ id: tId, type: transType, newPhase });
            }
            if (tId === 'boss' && oldPhase === 1 && newPhase === 2 && boss.interruptAtPhase2 && battleState.phase === 'player') {
                forceBossInterrupt = true;
            }
        }
      });

      if (phaseChangeTargets.length > 0) {
          const newTrans = {};
          phaseChangeTargets.forEach(t => newTrans[t.id] = `trans-${t.type}`);
          setPhaseTransitions(newTrans);
          
          setTimeout(() => {
              phaseChangeTargets.forEach(t => {
                 if(t.id === 'boss') setBoss(b => ({ ...b, phase: t.newPhase }));
                 else setParty(pts => pts.map(p => p.id === parseInt(t.id.split('_')[1]) ? { ...p, phase: t.newPhase } : p));
              });
          }, 400);

          setTimeout(() => {
              const cont = commitStateUpdates(action, actorId, targets, finalAmounts);
              if(cont) setTimeout(() => { setPhaseTransitions({}); advanceTurn(forceBossInterrupt); }, 400 + (action.duration * 1000));
          }, 400); 
      } else {
          const cont = commitStateUpdates(action, actorId, targets, finalAmounts);
          if(cont) setTimeout(() => advanceTurn(forceBossInterrupt), (action.duration * 1000) || 1000);
      }

    }, 400);
  };

  useEffect(() => {
    if (battleState.phase === 'boss' && !isProcessingAction && boss.hp > 0) {
      setIsProcessingAction(true);
      setGlobalMessage("Boss 行动中...");
      
      setTimeout(() => {
        let chosenAction = boss.aiRules[boss.aiRules.length - 1] || { text: '发呆', actionType: 'none', effect: 'none', duration: 1, target: 'none', accuracy: 100 };
        const hpPercent = (boss.hp / boss.maxHp) * 100;
        
        for (let rule of boss.aiRules) {
           if (rule.condition === 'hp_below' && hpPercent <= rule.threshold) { chosenAction = rule; break; }
           if (rule.condition === 'hp_above' && hpPercent >= rule.threshold) { chosenAction = rule; break; }
           if (rule.condition === 'always') { chosenAction = rule; break; }
        }
        executeAction(chosenAction, chosenAction.target, 'boss');
      }, 1500);
    }
  }, [battleState.phase, battleState.actionCount, boss.hp, isProcessingAction]);

  const handlePlayerMenuClick = (item) => {
    if (isProcessingAction) return;

    if (item.actionType === 'none' && item.target === 'none' && item.effect === 'none') {
        if (item.subMenu && item.subMenu !== 'none') setCurrentMenuId(item.subMenu);
        return; 
    }

    const actor = party.find(p => p.id === battleState.activePartyId);
    if (actor && item.mpCost > actor.mp) {
       setGlobalMessage(`${globalRules.mpLabel} 不足`);
       setTimeout(() => setGlobalMessage(""), 1000);
       return;
    }

    if (item.target.startsWith('manual_')) {
       setTargetingAction(item);
       setGlobalMessage(`请选择目标: ${item.text}`);
       return;
    }
    
    let resolvedTarget = item.target;
    if (item.target === 'self') resolvedTarget = activeTurnEntity;
    if (item.target === 'enemy_all') resolvedTarget = 'enemy_all'; 
    
    executeAction(item, resolvedTarget, activeTurnEntity);
  };

  const handleEntityClick = (entityId) => {
    if (!targetingAction || isProcessingAction) return;
    const t = targetingAction.target;
    if (t === 'manual_party' && !entityId.startsWith('party_')) return;
    if (t === 'manual_enemy' && entityId !== 'boss') return;
    executeAction(targetingAction, entityId, activeTurnEntity);
  };

  const triggerEffect = (target, effect, durationSec, effectMedia) => {
    if (target === 'none' || effect === 'none' || !durationSec) return;
    if (timeoutRefs.current[target]) clearTimeout(timeoutRefs.current[target]);
    if (effect === 'media_swap' && effectMedia?.url) setTempMedia(prev => ({ ...prev, [target]: effectMedia }));
    else setTempEffects(prev => ({ ...prev, [target]: `anim-${effect}` }));

    timeoutRefs.current[target] = setTimeout(() => {
      setTempEffects(prev => { const next = { ...prev }; delete next[target]; return next; });
      setTempMedia(prev => { const next = { ...prev }; delete next[target]; return next; });
    }, durationSec * 1000);
  };

  const getEntityName = (id) => {
    if(id === 'boss') return boss.name;
    if(id.startsWith('party_')) { const p = party.find(x => x.id === parseInt(id.split('_')[1])); return p ? p.name : '未知'; }
    return id;
  };
  
  const getBaseAnimClass = (animType) => { 
    switch(animType) { case 'idle-breathe': return 'anim-idle-breathe'; case 'float': return 'anim-float'; case 'float-fast': return 'anim-float-fast'; default: return ''; } 
  };

  const requestCropHandler = ({ src, ratio, callback }) => {
    setCropRequest({ src, ratio, callback });
  };

  // --- Mutators ---
  const updateEntityRules = (type, charId, ruleType, index, field, value) => {
    const targetKey = ruleType === 'dialogue' ? 'dialogueRules' : 'aiRules';
    if (type === 'boss') {
       const newRules = [...boss[targetKey]];
       newRules[index] = { ...newRules[index], [field]: value };
       setBoss({ ...boss, [targetKey]: newRules });
    } else {
       setParty(party.map(p => {
          if(p.id !== charId) return p;
          const newRules = [...(p[targetKey]||[])];
          newRules[index] = { ...newRules[index], [field]: value };
          return { ...p, [targetKey]: newRules };
       }));
    }
  };
  
  const addMenuItem = () => {
    const newItem = { id: `item_${Date.now()}`, text: '新技能', color: '#ffffff', size: 22, desc: '', target: 'none', actionType: 'none', value: 0, mpCost: 0, accuracy: 100, effect: 'none', duration: 0, subMenu: 'none' };
    setParty(party.map(p => p.id === editingMenuCharId ? { ...p, menus: { ...p.menus, [editingMenuId]: [...p.menus[editingMenuId], newItem] } } : p));
  };

  const removeMenuItem = (index) => {
    setParty(party.map(p => {
        if (p.id !== editingMenuCharId) return p;
        const newCategory = [...p.menus[editingMenuId]];
        newCategory.splice(index, 1);
        return { ...p, menus: { ...p.menus, [editingMenuId]: newCategory } };
    }));
  };

  const copyMenusFrom = (sourceCharId) => {
    const sourceMenus = party.find(p => p.id === sourceCharId).menus;
    setParty(party.map(p => p.id === editingMenuCharId ? { ...p, menus: JSON.parse(JSON.stringify(sourceMenus)) } : p));
  };
  
  const addRule = (type, charId, ruleType) => {
    const newRule = ruleType === 'dialogue' 
        ? { id: Date.now(), condition: 'hp_below', threshold: 50, text: '示例文本', duration: 3, triggered: false }
        : { id: Date.now(), condition: 'always', threshold: 0, text: '普通攻击', actionType: 'damage', value: 20, accuracy: 100, target: 'party_random', effect: 'lunge-down', duration: 1 };
    if(type === 'boss') setBoss({ ...boss, [ruleType === 'dialogue' ? 'dialogueRules' : 'aiRules']: [...(boss[ruleType === 'dialogue' ? 'dialogueRules' : 'aiRules']||[]), newRule] });
    else setParty(party.map(p => p.id === charId ? { ...p, dialogueRules: [...(p.dialogueRules||[]), newRule] } : p));
  };

  const removeRule = (type, charId, ruleType, index) => {
    if(type === 'boss') {
       const rules = boss[ruleType === 'dialogue' ? 'dialogueRules' : 'aiRules'];
       setBoss({ ...boss, [ruleType === 'dialogue' ? 'dialogueRules' : 'aiRules']: rules.filter((_,i)=>i!==index) });
    } else setParty(party.map(p => p.id === charId ? { ...p, dialogueRules: p.dialogueRules.filter((_,i)=>i!==index) } : p));
  };

  // --- Snapshot IO ---
  const handleExportJson = () => {
    const data = { bgMedia, effects, title, globalRules, turnSettings, boss, party };
    const jsonStr = JSON.stringify(data);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "rpg_config_manifest.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if(data.bgMedia !== undefined) setBgMedia(data.bgMedia);
        if(data.effects) setEffects(data.effects);
        if(data.title) setTitle(data.title);
        if(data.globalRules) setGlobalRules({ hpLabel: 'HP', mpLabel: 'MP', ...data.globalRules });
        if(data.turnSettings) setTurnSettings({ playerActions: 2, bossActions: 1, ...data.turnSettings });
        if(data.boss) setBoss({ media2Threshold: 50, transitionType: 'none', fx: { glitch: false, invert: false, sepia: false }, interruptAtPhase2: true, ...data.boss, phase: 1, aiRules: (data.boss.aiRules||[]).map(r=>({...r, triggered:false})), dialogueRules: (data.boss.dialogueRules||[]).map(r=>({...r, triggered:false})) });
        if(data.party) setParty(data.party.map(p => ({ damagedThreshold: 50, mediaDamaged: null, transitionType: 'none', fx: { glitch: false, invert: false, sepia: false }, ...p, phase: 1, dialogueRules: (p.dialogueRules||[]).map(r=>({...r, triggered:false})) })));
        resetBattle();
      } catch (err) { alert("文件解析失败"); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const editingCharMenus = party.find(p => p.id === editingMenuCharId)?.menus || createDefaultMenus();
  
  const currentBossMedia = (boss.phase === 2 && boss.media2) ? boss.media2 : boss.media1;

  // --- View Layer ---
  return (
    <>
      <style>{customStyles}</style>
      
      {cropRequest && (
        <ImageCropper 
          src={cropRequest.src} 
          ratio={cropRequest.ratio} 
          onConfirm={(base64) => { cropRequest.callback(base64); setCropRequest(null); }} 
          onCancel={() => setCropRequest(null)} 
        />
      )}

      <div className={`relative w-full h-screen bg-black overflow-hidden flex flex-col font-[VT323] ${effects.screenShake ? 'anim-shake' : ''} ${effects.glitch ? 'effect-glitch' : ''} ${effects.invert ? 'effect-invert' : ''} ${effects.sepia ? 'effect-sepia' : ''} ${targetingAction ? 'targeting-mode' : ''}`}>
        
        {effects.crt && <div className="absolute inset-0 crt-overlay"></div>}
        {effects.crt && <div className="absolute inset-0 crt-vignette"></div>}
        {effects.noise && <div className="noise-overlay"></div>}

        <button onClick={() => setIsGameMode(!isGameMode)} className={`absolute top-4 right-4 z-50 p-2 rounded flex items-center gap-2 transition-colors ${isGameMode ? 'bg-transparent text-gray-700 hover:text-white' : 'bg-gray-800 border border-gray-600 text-white shadow-lg hover:bg-gray-700'}`}>
          {isGameMode ? <Edit3 size={20} /> : <><Play size={18} /> 预览</>}
        </button>

        <div className={`absolute inset-0 z-0 transition-all duration-300 ${effects.blur ? 'blur-md scale-105' : ''} ${bgMedia?.fx?.glitch ? 'effect-glitch' : ''} ${bgMedia?.fx?.invert ? 'effect-invert' : ''} ${bgMedia?.fx?.sepia ? 'effect-sepia' : ''}`}>
          <MediaElement media={bgMedia} className="w-full h-full object-cover opacity-60" />
        </div>

        {title.show && <div className="absolute top-4 left-4 z-20 text-white text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] opacity-70 tracking-widest cursor-default">{title.text}</div>}

        <div className="flex-1 relative z-10 flex flex-col items-center justify-center min-h-0 pt-10">
           <div className="w-[300px] max-w-[80vw] mb-4 text-center z-20">
              <div className="text-red-400 text-lg tracking-widest drop-shadow-[0_2px_2px_#000]">{boss.name}</div>
              <div className="h-3 bg-gray-900 border-2 border-gray-500 relative mt-1">
                 <div className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-300" style={{width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`}}></div>
              </div>
           </div>

           <div className="relative">
             {activeBubbles['boss'] && <div className="speech-bubble">{activeBubbles['boss']}</div>}
             {combatTexts.filter(t => t.targetId === 'boss').map(t => (
                <div key={t.id} className={`combat-text ${t.type === 'damage' ? 'dmg-text' : (t.type === 'miss' ? 'miss-text' : 'heal-text')} left-1/2 -ml-6 top-[20%]`}>{t.text}</div>
             ))}

             <div 
               className={`w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] flex items-end justify-center transition-transform ${tempEffects['boss'] || getBaseAnimClass(boss.anim)} ${phaseTransitions['boss'] || ''} ${targetingAction?.target === 'manual_enemy' || targetingAction?.target === 'manual_any' ? 'targetable-enemy' : ''} ${boss.fx?.glitch ? 'effect-glitch' : ''} ${boss.fx?.invert ? 'effect-invert' : ''} ${boss.fx?.sepia ? 'effect-sepia' : ''}`}
               onClick={() => handleEntityClick('boss')}
             >
                {boss.isDefending && <div className="absolute -top-8 text-3xl text-blue-400 drop-shadow-[0_0_10px_blue] z-50"><Shield size={36}/></div>}
                {tempMedia['boss'] ? (
                   <MediaElement media={tempMedia['boss']} className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] z-50" />
                ) : (
                   <MediaElement media={currentBossMedia} className="max-w-full max-h-full drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]" alt="Boss" />
                )}
             </div>
           </div>
        </div>

        <div className="relative z-20 w-full max-w-[1100px] mx-auto flex flex-col pb-4 px-4 h-[38vh] min-h-[240px] max-h-[300px]">
          <div className="w-full mb-2 flex gap-2">
            <div className={`rpg-box flex-1 h-[50px] px-3 text-lg flex items-center justify-between tracking-widest text-[#e2e8f0] overflow-hidden whitespace-nowrap ${(targetingAction||globalMessage) ? 'border-yellow-400 bg-[#221a00]' : ''}`}>
              <div className="text-yellow-400">
                {globalMessage ? globalMessage : (targetingAction ? `请选择目标: ${targetingAction.text}` : (hoveredItemData ? hoveredItemData.desc : <span className="text-gray-500">待机</span>))}
              </div>
              {targetingAction && !isProcessingAction && <button onClick={() => setTargetingAction(null)} className="bg-gray-800 border border-gray-600 text-gray-300 px-3 py-1 text-sm rounded hover:bg-gray-700">取消</button>}
            </div>
            
            <div className={`rpg-box h-[50px] px-3 flex items-center justify-between gap-3 bg-[#111] border-[#555] min-w-[200px] ${battleState.phase==='boss'?'border-red-600 bg-red-950/30':''}`}>
               <button onClick={resetBattle} className="text-gray-400 hover:text-white hover:bg-gray-800 p-1 px-2 rounded text-sm transition-colors border border-gray-700">重置战斗</button>
               <div className="w-[1px] h-3/4 bg-gray-700 mx-1"></div>
               <div className="text-center flex-1">
                 <div className="text-xs text-yellow-500 leading-tight">{battleState.phase === 'player' ? '玩家行动阶段' : '敌方行动阶段'}</div>
                 <div className={`text-md tracking-widest ${battleState.phase==='boss'?'text-red-400 font-bold':'text-green-400'}`}>剩余 {battleState.phase === 'player' ? turnSettings.playerActions - battleState.actionCount : turnSettings.bossActions - battleState.actionCount} 次</div>
               </div>
            </div>
          </div>

          <div className="flex-1 flex gap-3 min-h-0">
            <div className="flex-1 grid grid-cols-4 gap-2 min-w-0">
              {party.map((p) => {
                const entityId = `party_${p.id}`;
                const isSelected = isPlayerTurn && battleState.activePartyId === p.id;
                const canBeSelected = isPlayerTurn && !targetingAction && p.hp > 0;
                const currentAnim = tempEffects[entityId] || getBaseAnimClass(p.anim);
                const isTargetable = targetingAction?.target === 'manual_party' || targetingAction?.target === 'manual_any';
                const isDead = p.hp <= 0;
                
                const currentPartyMedia = (p.phase === 2 && p.mediaDamaged) ? p.mediaDamaged : p.media;
                
                return (
                  <div 
                    key={p.id} 
                    className={`rpg-box flex flex-col p-2 h-full transition-all duration-300 ${isSelected ? 'rpg-box-active transform -translate-y-2' : ''} ${canBeSelected && !isSelected ? 'cursor-pointer hover:border-yellow-200' : ''} ${isTargetable ? 'targetable-ally' : ''} ${isDead ? 'is-dead' : ''}`}
                    onClick={() => {
                      if (targetingAction) {
                          if (targetingAction.actionType === 'revive' || !isDead) { handleEntityClick(entityId); }
                      } else if (canBeSelected) {
                          setBattleState(s => ({ ...s, activePartyId: p.id }));
                          setCurrentMenuId('main');
                      }
                    }}
                  >
                    <div className="text-center text-sm lg:text-lg border-b-2 border-[#555] pb-1 mb-1 tracking-widest relative">
                      {isSelected && !isDead && <span className="absolute -left-1 top-0 text-yellow-400 text-xs indicator-bounce">▼</span>}
                      {p.name}
                    </div>
                    
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden mb-1 bg-[#111] border border-[#333]">
                      {activeBubbles[entityId] && <div className="speech-bubble">{activeBubbles[entityId]}</div>}
                      {combatTexts.filter(t => t.targetId === entityId).map(t => (
                         <div key={t.id} className={`combat-text ${t.type === 'damage' ? 'dmg-text' : (t.type === 'miss' ? 'miss-text' : 'heal-text')} z-50`}>{t.text}</div>
                      ))}
                      
                      {p.isDefending && !isDead && <div className="absolute top-1 right-1 text-blue-400 drop-shadow-[0_0_5px_blue] z-40"><Shield size={16}/></div>}

                      {tempMedia[entityId] ? (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50"><MediaElement media={tempMedia[entityId]} className="w-full h-full object-cover" /></div>
                      ) : (
                        <><div className="absolute inset-0 z-0 opacity-40"><MediaElement media={p.bgMedia} className="w-full h-full object-cover" /></div><div className={`absolute inset-0 z-10 flex items-center justify-center ${currentAnim} ${phaseTransitions[entityId] || ''} ${p.fx?.glitch ? 'effect-glitch' : ''} ${p.fx?.invert ? 'effect-invert' : ''} ${p.fx?.sepia ? 'effect-sepia' : ''}`}><MediaElement media={currentPartyMedia} className="w-[85%] h-[85%] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" /></div></>
                      )}
                    </div>

                    <div className="h-8 flex flex-col gap-1 justify-end mt-1">
                      <div className="flex items-center gap-1 text-[9px] lg:text-[11px]"><span className="text-[#a0aec0] w-4 text-center">{globalRules.hpLabel}</span><div className="flex-1 h-2 lg:h-3 bg-gray-800 border border-gray-600 relative"><div className="absolute top-0 left-0 h-full bg-[#48bb78] transition-all duration-300" style={{width:`${(p.hp/p.maxHp)*100}%`}}></div></div><span className="w-8 text-right leading-none">{p.hp}</span></div>
                      <div className="flex items-center gap-1 text-[9px] lg:text-[11px]"><span className="text-[#a0aec0] w-4 text-center">{globalRules.mpLabel}</span><div className="flex-1 h-2 lg:h-3 bg-gray-800 border border-gray-600 relative"><div className="absolute top-0 left-0 h-full bg-[#4299e1] transition-all duration-300" style={{width:`${(p.mp/p.maxMp)*100}%`}}></div></div><span className="w-8 text-right leading-none">{p.mp}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`rpg-box w-[160px] lg:w-[200px] h-full p-3 lg:p-4 flex flex-col gap-2 tracking-widest overflow-y-auto transition-opacity duration-300 ${isPlayerTurn && !targetingAction ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              {battleState.phase === 'boss' ? (
                 <div className="h-full flex items-center justify-center text-red-500 text-xl animate-pulse text-center">系统解析中</div>
              ) : (
                currentMenuItems.map((cmd) => {
                  const isHovered = hoveredItemId === cmd.id;
                  const canAfford = !cmd.mpCost || party.find(p => p.id === battleState.activePartyId)?.mp >= cmd.mpCost;
                  return (
                    <div key={cmd.id} className={`relative flex items-center cursor-pointer select-none group py-1 ${!canAfford ? 'opacity-50' : ''}`} onMouseEnter={() => setHoveredItemId(cmd.id)} onMouseLeave={() => setHoveredItemId(null)} onClick={() => canAfford && handlePlayerMenuClick(cmd)}>
                      <div className={`absolute -left-1 lg:-left-2 text-[#eab308] text-sm lg:text-lg transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>▶</div>
                      <span className="ml-3 lg:ml-4 transition-transform group-hover:translate-x-1" style={{ color: cmd.color, fontSize: `${cmd.size}px`, textShadow: '1px 1px 0 #000' }}>{cmd.text}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {!isGameMode && (
          <>
            <div className={`absolute top-0 left-0 h-full w-[440px] bg-gray-900 border-r border-gray-700 text-sm text-gray-300 transform transition-transform duration-300 z-50 overflow-y-auto custom-scrollbar shadow-[10px_0_20px_rgba(0,0,0,0.5)] ${showPanel ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="p-3 flex justify-between items-center border-b border-gray-700 sticky top-0 bg-gray-900 z-30"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings size={18}/> 战斗编辑器</h2><button onClick={() => setShowPanel(false)} className="hover:text-white p-1 bg-gray-800 rounded"><X size={18}/></button></div>
              <div className="flex bg-gray-800 text-xs border-b border-gray-700 sticky top-[53px] z-30">
                 <button onClick={()=>setPanelTab('global')} className={`flex-1 py-2 flex justify-center items-center gap-1 transition-colors ${panelTab==='global'?'bg-gray-700 text-white':'hover:bg-gray-700'}`}><Monitor size={14}/> 全局与画面</button>
                 <button onClick={()=>setPanelTab('party')} className={`flex-1 py-2 flex justify-center items-center gap-1 transition-colors ${panelTab==='party'?'bg-gray-700 text-white':'hover:bg-gray-700'}`}><Move size={14}/> 队伍设置</button>
                 <button onClick={()=>setPanelTab('menu')} className={`flex-1 py-2 flex justify-center items-center gap-1 transition-colors ${panelTab==='menu'?'bg-gray-700 text-white':'hover:bg-gray-700'}`}><List size={14}/> 菜单与技能</button>
                 <button onClick={()=>setPanelTab('save')} className={`flex-1 py-2 flex justify-center items-center gap-1 transition-colors ${panelTab==='save'?'bg-gray-700 text-white':'hover:bg-gray-700'}`}><Save size={14}/> 存档与导出</button>
              </div>

              <div className="p-4 space-y-6 pb-20">
                
                {panelTab === 'global' && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-white border-b border-gray-700 pb-1 font-bold flex items-center gap-2"><Sliders size={16}/> 全局参数</h3>
                      <div className="bg-gray-800 p-2 rounded border border-gray-700 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">伤害浮动</span>
                          <div className="flex items-center gap-1 bg-gray-900 px-2 py-1 border border-gray-600 rounded">
                            <input type="number" value={globalRules.damageVariance} onChange={(e)=>setGlobalRules({...globalRules, damageVariance:Number(e.target.value)})} className="w-12 bg-transparent text-white text-center outline-none"/> %
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">防御减伤比</span>
                          <div className="flex items-center gap-1 bg-gray-900 px-2 py-1 border border-gray-600 rounded">
                            <input type="number" value={globalRules.defendReduction} onChange={(e)=>setGlobalRules({...globalRules, defendReduction:Number(e.target.value)})} className="w-12 bg-transparent text-white text-center outline-none"/> %
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-gray-700">
                          <div className="flex-1 flex justify-between items-center bg-gray-900 px-2 py-1 border border-gray-600 rounded">
                            <span className="text-gray-500">生命值显示名</span>
                            <input type="text" value={globalRules.hpLabel} onChange={(e)=>setGlobalRules({...globalRules, hpLabel:e.target.value})} className="w-12 bg-transparent text-white text-center outline-none"/>
                          </div>
                          <div className="flex-1 flex justify-between items-center bg-gray-900 px-2 py-1 border border-gray-600 rounded">
                            <span className="text-gray-500">魔法值显示名</span>
                            <input type="text" value={globalRules.mpLabel} onChange={(e)=>setGlobalRules({...globalRules, mpLabel:e.target.value})} className="w-12 bg-transparent text-white text-center outline-none"/>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-gray-800 p-2 rounded">
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={effects.crt} onChange={() => setEffects({...effects, crt: !effects.crt})} className="accent-gray-500" /> CRT扫描线</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={effects.noise} onChange={() => setEffects({...effects, noise: !effects.noise})} className="accent-gray-500" /> 噪点</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={effects.glitch} onChange={() => setEffects({...effects, glitch: !effects.glitch})} className="accent-gray-500" /> 撕裂特效</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={effects.invert} onChange={() => setEffects({...effects, invert: !effects.invert})} className="accent-gray-500" /> 反色特效</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={effects.sepia} onChange={() => setEffects({...effects, sepia: !effects.sepia})} className="accent-gray-500" /> 复古滤镜</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={title.show} onChange={() => setTitle({...title, show: !title.show})} className="accent-gray-500" /> 显示标题</label>
                      </div>
                      {title.show && <input type="text" value={title.text} onChange={(e) => setTitle({...title, text: e.target.value})} className="w-full bg-gray-800 border border-gray-600 px-2 py-1 text-white text-xs mt-1" placeholder="标题..." />}
                      <MediaControl label="背景图片" cropRatio={16/9} onRequestCrop={requestCropHandler} currentMedia={bgMedia} onMediaChange={setBgMedia} onClear={() => setBgMedia(null)} />
                      <div className="flex gap-1 mb-2 items-center text-[10px]">
                         <span className="text-gray-400">独立滤镜:</span>
                         <FxControl fx={bgMedia?.fx} onChange={(fx) => setBgMedia({ ...bgMedia, fx })} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-white border-b border-gray-700 pb-1 font-bold text-red-400 flex items-center gap-1"><Zap size={16}/> Boss设置</h3>
                      <div className="flex gap-2 mb-1">
                        <input type="text" value={boss.name} onChange={(e)=>setBoss({...boss, name:e.target.value})} placeholder="名字" className="w-20 bg-gray-800 border border-gray-600 px-1 text-white text-[11px]"/>
                        <div className="flex-1 flex items-center gap-1 text-[10px] bg-gray-800 px-1 border border-gray-600 text-green-400">{globalRules.hpLabel}<input type="number" value={boss.hp} onChange={(e)=>setBoss({...boss, hp:Number(e.target.value), maxHp:Number(e.target.value)})} className="w-full bg-transparent text-white outline-none"/></div>
                        <div className="flex items-center gap-1 text-[10px] bg-gray-800 px-1 border border-gray-600 text-red-400">ATK<input type="number" value={boss.atk} onChange={(e)=>setBoss({...boss, atk:Number(e.target.value)})} className="w-10 bg-transparent text-white outline-none"/></div>
                        <div className="flex items-center gap-1 text-[10px] bg-gray-800 px-1 border border-gray-600 text-blue-300">DEF<input type="number" value={boss.def} onChange={(e)=>setBoss({...boss, def:Number(e.target.value)})} className="w-10 bg-transparent text-white outline-none"/></div>
                      </div>
                      <div className="flex gap-1 mb-2 items-center text-[10px]">
                         <span className="text-gray-400">待机动画:</span>
                         <select value={boss.anim} onChange={(e)=>setBoss({...boss, anim: e.target.value})} className="bg-gray-800 text-white outline-none p-1 border border-gray-600 flex-1">
                            <option value="none">无</option><option value="idle-breathe">呼吸</option><option value="float">悬浮</option><option value="float-fast">快速悬浮</option>
                         </select>
                      </div>
                      <MediaControl label="默认贴图" cropRatio={1} onRequestCrop={requestCropHandler} currentMedia={boss.media1} onMediaChange={(m)=>setBoss({...boss, media1:m})} onClear={() => setBoss({...boss, media1:null})} minimal/>
                      <div className="flex gap-1 mb-2 items-center text-[10px]">
                         <span className="text-gray-400">独立滤镜:</span>
                         <FxControl fx={boss.fx} onChange={(fx) => setBoss({ ...boss, fx })} />
                      </div>
                      <div className="bg-gray-900 border border-gray-700 p-2 mt-1 rounded relative">
                        <MediaControl label="二阶/战损贴图" cropRatio={1} onRequestCrop={requestCropHandler} currentMedia={boss.media2} onMediaChange={(m)=>setBoss({...boss, media2:m})} onClear={() => setBoss({...boss, media2:null})} minimal/>
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                          <span className="text-gray-500">转场特效:</span>
                          <select value={boss.transitionType} onChange={(e)=>setBoss({...boss, transitionType:e.target.value})} className="bg-gray-800 border border-gray-600 text-white outline-none px-1">
                             <option value="none">无缝切换</option><option value="fade">黑屏过渡</option><option value="glitch">撕裂过渡</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                          <span className="text-gray-500">形态切换阈值: {globalRules.hpLabel} 低于</span>
                          <input type="number" value={boss.media2Threshold} onChange={(e)=>setBoss({...boss, media2Threshold:Number(e.target.value)})} className="w-10 bg-gray-800 border border-gray-600 text-white text-center"/> %
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                          <label className="flex items-center gap-1 cursor-pointer text-red-400">
                             <input type="checkbox" checked={boss.interruptAtPhase2} onChange={(e)=>setBoss({...boss, interruptAtPhase2: e.target.checked})} className="accent-red-500" />
                             进二阶段时强制中断玩家并立刻行动
                          </label>
                        </div>
                      </div>
                      
                      <div className="mt-4 border border-red-900 bg-red-950/20 p-2 rounded space-y-2">
                        <h4 className="text-xs text-red-300 font-bold border-b border-red-900 pb-1">AI 行动逻辑</h4>
                        {boss.aiRules.map((rule, idx) => (
                           <div key={rule.id} className="bg-gray-900 border border-gray-700 p-2 rounded text-[10px] relative">
                              <button onClick={() => removeRule('boss', null, 'ai', idx)} className="absolute top-1 right-1 text-red-500 hover:text-red-300"><Trash2 size={12}/></button>
                              <div className="flex gap-1 mb-1 items-center pr-4">
                                <span className="text-gray-500">触发条件:</span>
                                <select value={rule.condition} onChange={(e)=>updateEntityRules('boss', null, 'ai', idx, 'condition', e.target.value)} className="bg-gray-800 text-white outline-none p-1 border border-gray-600 flex-1">
                                  <option value="hp_above">{globalRules.hpLabel} % 高于</option><option value="hp_below">{globalRules.hpLabel} % 低于</option><option value="always">无条件执行</option>
                                </select>
                                {rule.condition !== 'always' && <input type="number" value={rule.threshold} onChange={(e)=>updateEntityRules('boss', null, 'ai', idx, 'threshold', Number(e.target.value))} className="w-10 bg-gray-800 text-white p-1 border border-gray-600 text-center"/>}
                              </div>
                              <div className="flex gap-1 mb-1 items-center">
                                <span className="text-gray-500">技能名:</span>
                                <input type="text" value={rule.text} onChange={(e)=>updateEntityRules('boss', null, 'ai', idx, 'text', e.target.value)} className="w-16 bg-gray-800 text-white p-1 border border-gray-600"/>
                                <select value={rule.actionType} onChange={(e)=>updateEntityRules('boss', null, 'ai', idx, 'actionType', e.target.value)} className="bg-gray-800 text-white outline-none p-1 border border-gray-600">
                                  <option value="damage">攻击 (Damage)</option>
                                  <option value="heal">回复 (Heal)</option>
                                  <option value="buff_atk">提升攻击力</option>
                                  <option value="debuff_atk">降低攻击力</option>
                                  <option value="buff_def">提升防御力</option>
                                  <option value="debuff_def">降低防御力</option>
                                  <option value="defend">防御</option>
                                </select>
                                <span className="text-gray-500 ml-1">数值:</span>
                                <input type="number" value={rule.value} onChange={(e)=>updateEntityRules('boss', null, 'ai', idx, 'value', Number(e.target.value))} className="w-12 bg-gray-800 text-white p-1 border border-gray-600 text-center"/>
                                <span className="text-gray-500">命中:</span>
                                <input type="number" value={rule.accuracy} onChange={(e)=>updateEntityRules('boss', null, 'ai', idx, 'accuracy', Number(e.target.value))} className="w-10 bg-gray-800 text-white p-1 border border-gray-600 text-center"/>
                              </div>
                              <div className="flex gap-1 items-center">
                                <span className="text-gray-500">目标选取:</span>
                                <select value={rule.target} onChange={(e)=>updateEntityRules('boss', null, 'ai', idx, 'target', e.target.value)} className="flex-1 bg-gray-800 text-white outline-none p-1 border border-gray-600">
                                  <option value="party_random">随机我方单体</option>
                                  <option value="party_all">我方全体</option>
                                  <option value="boss">自身 (Boss)</option>
                                </select>
                                <select value={rule.effect} onChange={(e)=>updateEntityRules('boss', null, 'ai', idx, 'effect', e.target.value)} className="flex-1 bg-gray-800 text-white outline-none p-1 border border-gray-600">
                                  <option value="lunge-down">下砸</option><option value="flash">闪烁</option><option value="shake">震动</option><option value="spin">旋转</option>
                                </select>
                              </div>
                           </div>
                        ))}
                        <button onClick={() => addRule('boss', null, 'ai')} className="w-full py-1 border border-dashed border-red-800 text-red-400 hover:text-red-300 text-[10px]">添加 AI 行动</button>
                      </div>

                      <div className="mt-4 border border-yellow-900 bg-yellow-950/20 p-2 rounded space-y-2">
                        <h4 className="text-xs text-yellow-300 font-bold border-b border-yellow-900 pb-1 flex items-center gap-1"><MessageSquare size={12}/> 条件触发对话</h4>
                        {(boss.dialogueRules||[]).map((rule, idx) => (
                           <div key={rule.id} className="bg-gray-900 border border-gray-700 p-2 rounded text-[10px] relative">
                              <button onClick={() => removeRule('boss', null, 'dialogue', idx)} className="absolute top-1 right-1 text-red-500 hover:text-red-300"><Trash2 size={12}/></button>
                              <div className="flex gap-1 mb-1 items-center pr-4">
                                <span className="text-gray-500">触发条件:</span>
                                <select value={rule.condition} onChange={(e)=>updateEntityRules('boss', null, 'dialogue', idx, 'condition', e.target.value)} className="bg-gray-800 text-white outline-none p-1 border border-gray-600 flex-1">
                                  <option value="hp_above">{globalRules.hpLabel} % 高于</option><option value="hp_below">{globalRules.hpLabel} % 低于</option>
                                </select>
                                <input type="number" value={rule.threshold} onChange={(e)=>updateEntityRules('boss', null, 'dialogue', idx, 'threshold', Number(e.target.value))} className="w-10 bg-gray-800 text-white p-1 border border-gray-600 text-center"/>
                              </div>
                              <div className="flex gap-1 items-center">
                                <span className="text-gray-500">对话文本:</span>
                                <input type="text" value={rule.text} onChange={(e)=>updateEntityRules('boss', null, 'dialogue', idx, 'text', e.target.value)} className="flex-1 bg-gray-800 text-white p-1 border border-gray-600"/>
                                <span className="text-gray-500">持续时间(秒):</span>
                                <input type="number" value={rule.duration} onChange={(e)=>updateEntityRules('boss', null, 'dialogue', idx, 'duration', Number(e.target.value))} className="w-10 bg-gray-800 text-white p-1 border border-gray-600 text-center"/>
                              </div>
                           </div>
                        ))}
                        <button onClick={() => addRule('boss', null, 'dialogue')} className="w-full py-1 border border-dashed border-yellow-800 text-yellow-400 hover:text-yellow-300 text-[10px]">添加对话</button>
                      </div>
                    </div>
                  </div>
                )}

                {panelTab === 'party' && (
                  <div className="space-y-4">
                    {party.map((p) => (
                      <div key={p.id} className="bg-gray-800 p-2 border border-gray-700 space-y-2 rounded relative">
                        <div className="flex flex-wrap gap-1 mb-1 items-center">
                          <input type="text" value={p.name} onChange={(e) => setParty(party.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))} className="bg-gray-900 border border-gray-600 px-1 w-16 text-white font-[VT323] text-xs"/>
                          <div className="flex-1 flex items-center gap-1 text-[9px] bg-gray-900 px-1 border border-gray-600 text-green-400">{globalRules.hpLabel}<input type="number" value={p.hp} onChange={(e)=>setParty(party.map(x=>x.id===p.id?{...x,hp:Number(e.target.value),maxHp:Number(e.target.value)}:x))} className="w-full bg-transparent text-white outline-none text-center min-w-[30px]"/></div>
                          <div className="flex-1 flex items-center gap-1 text-[9px] bg-gray-900 px-1 border border-gray-600 text-blue-400">{globalRules.mpLabel}<input type="number" value={p.mp} onChange={(e)=>setParty(party.map(x=>x.id===p.id?{...x,mp:Number(e.target.value),maxMp:Number(e.target.value)}:x))} className="w-full bg-transparent text-white outline-none text-center min-w-[30px]"/></div>
                        </div>
                        <div className="flex gap-1 items-center">
                           <div className="flex-1 flex items-center gap-1 text-[9px] bg-gray-900 px-1 border border-gray-600 text-red-400">ATK<input type="number" value={p.atk} onChange={(e)=>setParty(party.map(x=>x.id===p.id?{...x,atk:Number(e.target.value)}:x))} className="w-full bg-transparent text-white outline-none text-center"/></div>
                           <div className="flex-1 flex items-center gap-1 text-[9px] bg-gray-900 px-1 border border-gray-600 text-blue-300">DEF<input type="number" value={p.def} onChange={(e)=>setParty(party.map(x=>x.id===p.id?{...x,def:Number(e.target.value)}:x))} className="w-full bg-transparent text-white outline-none text-center"/></div>
                           <select value={p.anim} onChange={(e)=>setParty(party.map(x=>x.id===p.id?{...x,anim:e.target.value}:x))} className="bg-gray-900 border border-gray-600 text-gray-400 text-[9px] px-1 outline-none">
                             <option value="none">无</option><option value="idle-breathe">呼吸</option><option value="float">悬浮</option>
                           </select>
                        </div>
                        <div className="border-t border-gray-700 pt-2">
                           <MediaControl label="默认贴图" cropRatio={1} onRequestCrop={requestCropHandler} currentMedia={p.media} onMediaChange={(media) => setParty(party.map(x => x.id === p.id ? { ...x, media } : x))} onClear={() => setParty(party.map(x => x.id === p.id ? { ...x, media: null } : x))} minimal />
                           <div className="flex gap-1 mb-2 items-center text-[10px]">
                              <span className="text-gray-400">独立滤镜:</span>
                              <FxControl fx={p.fx} onChange={(fx) => setParty(party.map(x => x.id === p.id ? { ...x, fx } : x))} />
                           </div>
                           <div className="bg-gray-900 border border-gray-700 p-2 mt-1 rounded relative">
                             <MediaControl label="二阶/战损贴图" cropRatio={1} onRequestCrop={requestCropHandler} currentMedia={p.mediaDamaged} onMediaChange={(media) => setParty(party.map(x => x.id === p.id ? { ...x, mediaDamaged: media } : x))} onClear={() => setParty(party.map(x => x.id === p.id ? { ...x, mediaDamaged: null } : x))} minimal />
                             <div className="flex items-center gap-2 mt-1 text-[10px]">
                               <span className="text-gray-500">转场特效:</span>
                               <select value={p.transitionType} onChange={(e)=>setParty(party.map(x=>x.id===p.id?{...x, transitionType:e.target.value}:x))} className="bg-gray-800 border border-gray-600 text-white outline-none px-1">
                                  <option value="none">无缝切换</option><option value="fade">黑屏过渡</option><option value="glitch">撕裂过渡</option>
                               </select>
                             </div>
                             <div className="flex items-center gap-2 mt-1 text-[10px]">
                               <span className="text-gray-500">形态切换阈值: {globalRules.hpLabel} 低于</span>
                               <input type="number" value={p.damagedThreshold} onChange={(e)=>setParty(party.map(x=>x.id===p.id?{...x, damagedThreshold:Number(e.target.value)}:x))} className="w-10 bg-gray-800 border border-gray-600 text-white text-center"/> %
                             </div>
                           </div>
                           <MediaControl label="背景图片" cropRatio={1} onRequestCrop={requestCropHandler} currentMedia={p.bgMedia} onMediaChange={(media) => setParty(party.map(x => x.id === p.id ? { ...x, bgMedia: media } : x))} onClear={() => setParty(party.map(x => x.id === p.id ? { ...x, bgMedia: null } : x))} minimal />
                        </div>
                        
                        <div className="mt-2 border border-yellow-900 bg-yellow-950/20 p-2 rounded space-y-2">
                           <h4 className="text-xs text-yellow-300 font-bold border-b border-yellow-900 pb-1 flex items-center gap-1"><MessageSquare size={12}/> 条件触发对话</h4>
                           {(p.dialogueRules||[]).map((rule, idx) => (
                             <div key={rule.id} className="bg-gray-900 border border-gray-700 p-2 rounded text-[10px] relative">
                                <button onClick={() => removeRule('party', p.id, 'dialogue', idx)} className="absolute top-1 right-1 text-red-500 hover:text-red-300"><Trash2 size={12}/></button>
                                <div className="flex gap-1 mb-1 items-center pr-4">
                                  <span className="text-gray-500">触发条件:</span>
                                  <select value={rule.condition} onChange={(e)=>updateEntityRules('party', p.id, 'dialogue', idx, 'condition', e.target.value)} className="bg-gray-800 text-white outline-none p-1 border border-gray-600 flex-1">
                                    <option value="hp_above">{globalRules.hpLabel} % 高于</option><option value="hp_below">{globalRules.hpLabel} % 低于</option>
                                  </select>
                                  <input type="number" value={rule.threshold} onChange={(e)=>updateEntityRules('party', p.id, 'dialogue', idx, 'threshold', Number(e.target.value))} className="w-10 bg-gray-800 text-white p-1 border border-gray-600 text-center"/>
                                </div>
                                <div className="flex gap-1 items-center">
                                  <span className="text-gray-500">对话文本:</span>
                                  <input type="text" value={rule.text} onChange={(e)=>updateEntityRules('party', p.id, 'dialogue', idx, 'text', e.target.value)} className="flex-1 bg-gray-800 text-white p-1 border border-gray-600"/>
                                  <span className="text-gray-500">持续时间(秒):</span>
                                  <input type="number" value={rule.duration} onChange={(e)=>updateEntityRules('party', p.id, 'dialogue', idx, 'duration', Number(e.target.value))} className="w-10 bg-gray-800 text-white p-1 border border-gray-600 text-center"/>
                                </div>
                             </div>
                           ))}
                           <button onClick={() => addRule('party', p.id, 'dialogue')} className="w-full py-1 border border-dashed border-yellow-800 text-yellow-400 hover:text-yellow-300 text-[10px]">添加对话</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {panelTab === 'menu' && (
                  <div className="space-y-4">
                    
                    <div className="space-y-2">
                      <h3 className="text-white border-b border-gray-700 pb-1 font-bold text-yellow-400">战斗阶段与行动数</h3>
                      <div className="bg-gray-800 p-2 rounded border border-gray-700 grid grid-cols-2 gap-2 text-xs">
                         <div className="flex justify-between items-center bg-gray-900 px-2 py-1 rounded border border-gray-600">
                           <span className="text-gray-400">玩家阶段行动数</span>
                           <input type="number" value={turnSettings.playerActions} onChange={e => setTurnSettings({...turnSettings, playerActions: Number(e.target.value)})} className="w-10 bg-transparent text-white text-center outline-none" min="1"/>
                         </div>
                         <div className="flex justify-between items-center bg-gray-900 px-2 py-1 rounded border border-gray-600">
                           <span className="text-gray-400">Boss阶段行动数</span>
                           <input type="number" value={turnSettings.bossActions} onChange={e => setTurnSettings({...turnSettings, bossActions: Number(e.target.value)})} className="w-10 bg-transparent text-white text-center outline-none" min="1"/>
                         </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 p-2 rounded border border-gray-700 mb-2">
                        <label className="text-xs text-gray-400 font-bold block mb-2">当前编辑角色菜单</label>
                        <div className="flex gap-1">
                           {party.map(p => (
                             <button key={p.id} onClick={()=>setEditingMenuCharId(p.id)} className={`flex-1 py-1 text-[11px] rounded transition-colors ${editingMenuCharId === p.id ? 'bg-gray-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-700 border border-gray-600'}`}>
                                {p.name}
                             </button>
                           ))}
                        </div>
                        {editingMenuCharId !== 1 && (
                           <button onClick={()=>copyMenusFrom(1)} className="w-full mt-2 py-1 flex justify-center items-center gap-1 text-[10px] text-gray-400 hover:text-white border border-dashed border-gray-600 hover:border-gray-400 rounded">
                             复制角色 1 的菜单设置
                           </button>
                        )}
                    </div>

                    <div className="flex gap-1 mb-2">
                      {['main', 'skills', 'items'].map(m => (
                        <button key={m} onClick={() => setEditingMenuId(m)} className={`flex-1 py-1 text-[11px] border ${editingMenuId === m ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-800 border-gray-600'}`}>{m === 'main' ? '主菜单' : m === 'skills' ? '技能' : '物品'}</button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {editingCharMenus[editingMenuId].map((item, index) => (
                        <div key={item.id} className="bg-gray-800 p-2 border border-gray-600 rounded relative shadow-lg">
                          <button onClick={() => removeMenuItem(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-300"><Trash2 size={14}/></button>
                          
                          <div className="flex gap-1 mb-1 pr-6">
                            <input type="text" value={item.text} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'text', e.target.value)} className="flex-1 bg-gray-900 border border-gray-600 text-white px-2 py-1 text-xs" placeholder="名称"/>
                            <input type="color" value={item.color} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'color', e.target.value)} className="w-8 h-6 p-0 border-none cursor-pointer bg-transparent"/>
                          </div>
                          
                          <div className="flex gap-1 mb-2 bg-gray-900 p-1 border border-gray-700 rounded text-[10px]">
                            <div className="flex-1 flex flex-col">
                              <span className="text-gray-400 mb-1">执行指令</span>
                              <select value={item.actionType} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'actionType', e.target.value)} className="bg-gray-800 text-white p-1 border border-gray-600 outline-none">
                                <option value="damage">造成伤害</option>
                                <option value="heal">恢复 HP</option>
                                <option value="buff_atk">提升攻击力</option>
                                <option value="debuff_atk">降低攻击力</option>
                                <option value="buff_def">提升防御力</option>
                                <option value="debuff_def">降低防御力</option>
                                <option value="revive">复活队友</option>
                                <option value="defend">防御</option>
                                <option value="none">仅返回或打开子菜单</option>
                              </select>
                            </div>
                            <div className="w-14 flex flex-col">
                              <span className="text-gray-400 mb-1">威力/数值</span>
                              <input type="number" value={item.value} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'value', Number(e.target.value))} className="bg-gray-800 text-white p-1 border border-gray-600 text-center"/>
                            </div>
                            <div className="w-10 flex flex-col">
                              <span className="text-blue-300 mb-1">消耗 {globalRules.mpLabel}</span>
                              <input type="number" value={item.mpCost} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'mpCost', Number(e.target.value))} className="bg-gray-800 text-white p-1 border border-gray-600 text-center"/>
                            </div>
                            <div className="w-12 flex flex-col">
                              <span className="text-green-300 mb-1">命中率</span>
                              <input type="number" value={item.accuracy !== undefined ? item.accuracy : 100} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'accuracy', Number(e.target.value))} className="bg-gray-800 text-white p-1 border border-gray-600 text-center"/>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                            <div>
                              <span className="text-gray-400 block mb-1">目标选取</span>
                              <select value={item.target} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'target', e.target.value)} className="w-full bg-gray-800 text-white p-1 border border-gray-600 outline-none">
                                <option value="manual_enemy">手动选择敌方单体</option>
                                <option value="enemy_all">对敌方全体</option>
                                <option value="manual_party">手动选择我方单体</option>
                                <option value="party_all">对我方全体</option>
                                <option value="self">仅自身</option>
                                <option value="none">无需选择</option>
                              </select>
                            </div>
                            <div>
                              <span className="text-gray-400 block mb-1">行动特效</span>
                              <select value={item.effect} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'effect', e.target.value)} className="w-full bg-gray-800 text-white p-1 border border-gray-600 outline-none">
                                <option value="none">无</option>
                                <option value="lunge">突进</option>
                                <option value="flash">闪烁</option>
                                <option value="shake">震动</option>
                                <option value="spin">旋转</option>
                                <option value="ghost">残影</option>
                                <option value="float-fast">弹跳</option>
                                <option value="media_swap" className="text-blue-300">临时替换贴图</option>
                              </select>
                            </div>
                          </div>

                          {item.effect === 'media_swap' && (
                            <div className="mb-2 p-1 bg-blue-900/30 border border-blue-700/50 rounded">
                              <MediaControl label="上传替换素材" cropRatio={1} onRequestCrop={requestCropHandler} currentMedia={item.effectMedia} onMediaChange={(m) => updateMenuData(editingMenuCharId, editingMenuId, index, 'effectMedia', m)} onClear={() => updateMenuData(editingMenuCharId, editingMenuId, index, 'effectMedia', null)} minimal />
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                            <input type="text" value={item.desc} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'desc', e.target.value)} className="col-span-1 bg-gray-900 border border-gray-600 text-white px-2 py-1" placeholder="说明文本..."/>
                            <div>
                              <select value={item.subMenu} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'subMenu', e.target.value)} className="w-full bg-gray-900 border border-gray-600 text-yellow-200 p-1 outline-none">
                                <option value="none">不返回或跳转</option>
                                <option value="main">返回主菜单</option>
                                <option value="skills">打开技能菜单</option>
                                <option value="items">打开物品菜单</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button onClick={addMenuItem} className="w-full py-2 bg-gray-800 border-2 border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center justify-center gap-2 rounded text-xs">
                        添加新选项
                      </button>
                    </div>
                  </div>
                )}

                {panelTab === 'save' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-gray-800 border border-gray-700 p-3 rounded space-y-3">
                       <h3 className="text-gray-300 font-bold text-sm flex items-center gap-1">本地存档与导出</h3>
                       
                       <button onClick={handleExportJson} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-xs transition-colors flex justify-center items-center gap-2 shadow-lg">
                         <Download size={14}/> 导出 JSON 配置文件
                       </button>

                       <div className="relative w-full mt-4">
                         <input type="file" accept=".json" onChange={handleImportJson} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                         <div className="w-full bg-gray-900 border border-dashed border-gray-600 text-gray-300 py-2 rounded text-xs flex justify-center items-center gap-2 hover:bg-gray-700 transition-colors pointer-events-none">
                           <Upload size={14}/> 导入 JSON 配置文件
                         </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!showPanel && (
              <button onClick={() => setShowPanel(true)} className="absolute top-16 left-0 bg-gray-900 border border-l-0 border-white text-white p-2 z-50 hover:bg-gray-800 opacity-50 hover:opacity-100 transition-opacity rounded-r"><ChevronRight size={24} /></button>
            )}
          </>
        )}
      </div>
    </>
  );
}