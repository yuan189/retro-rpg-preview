import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, ChevronRight, Monitor, Activity, Move, List, Save, Play, Edit3, Trash2, Plus, Zap, Shield, Sliders, FolderOpen, FileImage } from 'lucide-react';

// --- Electron Bridge ---
// 预留 IPC 通信接口。前端通过 invoke 获取绝对路径 (file://) 或执行本地 IO。
const ElectronBridge = {
  selectLocalFile: async (mediaType = 'image') => {
    // 待接入: ipcRenderer.invoke('dialog:openFile', mediaType)
    const mockPath = `file://C:/MockFolder/asset_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'png'}`;
    return { url: mockPath, type: mediaType };
  },
  importLocalFolder: async () => {
    // 待接入: ipcRenderer.invoke('dialog:openFolder')
    alert("触发本地文件夹读取。请在 Electron 主进程中处理。");
    return ['file://C:/Assets/1.png', 'file://C:/Assets/2.png'];
  },
  saveConfig: (slot, configObject) => {
    // 待接入: electron-store set
    localStorage.setItem(`rpg_save_${slot}`, JSON.stringify(configObject));
  },
  loadConfig: (slot) => {
    // 待接入: electron-store get
    const dataStr = localStorage.getItem(`rpg_save_${slot}`);
    return dataStr ? JSON.parse(dataStr) : null;
  }
};

// --- Styles ---
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

  /* 屏幕滤镜 */
  .crt-overlay { background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 4px, 6px 100%; pointer-events: none; z-index: 100; }
  .crt-vignette { box-shadow: inset 0 0 100px rgba(0,0,0,0.9); pointer-events: none; z-index: 101; }
  @keyframes noise-anim { 0%,100% { transform: translate(0,0) } 20% { transform: translate(-5%,5%) } 40% { transform: translate(5%,-5%) } 60% { transform: translate(5%,5%) } 80% { transform: translate(-5%,-5%) } }
  .noise-overlay { position: absolute; top: -50%; left: -50%; right: -50%; bottom: -50%; width: 200%; height: 200%; background: transparent url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="n"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23n)" opacity="0.15"/%3E%3C/svg%3E'); animation: noise-anim 0.2s infinite; pointer-events: none; z-index: 99; opacity: 0.6; }
  
  @keyframes glitch-anim { 0%,100% { transform: translate(0) } 25% { transform: translate(-4px, 2px); filter: drop-shadow(4px 0 0 rgba(255,0,0,0.8)) drop-shadow(-4px 0 0 rgba(0,255,255,0.8)); } 50% { transform: translate(4px, -2px); } 75% { transform: translate(-2px, -4px); filter: drop-shadow(-4px 0 0 rgba(255,0,0,0.8)) drop-shadow(4px 0 0 rgba(0,255,255,0.8)); } }
  .effect-glitch { animation: glitch-anim 0.15s linear infinite; }
  .effect-invert { filter: invert(1) hue-rotate(180deg); }
  .effect-sepia { filter: sepia(0.8) contrast(1.2); }

  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }
  input[type="number"] { -moz-appearance: textfield; } input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
`;

// --- UI Components ---
const MediaElement = ({ media, className, alt }) => {
  if (!media) return <div className={`flex items-center justify-center text-gray-700/50 ${className}`}>空</div>;
  if (media.type === 'video') return <video src={media.url} className={`object-cover ${className} pixelated`} autoPlay loop muted playsInline />;
  return <img src={media.url} alt={alt} className={`object-cover ${className} pixelated`} draggable="false" />;
};

const MediaControl = ({ label, onMediaChange, onClear, currentMedia, minimal = false }) => {
  const [urlStr, setUrlStr] = useState('');
  const [isVid, setIsVid] = useState('image');

  const handleSelectLocal = async () => {
    try {
      const result = await ElectronBridge.selectLocalFile(isVid);
      onMediaChange(result);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`bg-gray-800 rounded border border-gray-700 ${minimal ? 'p-1' : 'p-2 mb-2'}`}>
      <div className="flex justify-between items-center mb-1">
         <label className={`text-gray-400 font-bold ${minimal ? 'text-[10px]' : 'text-xs'}`}>{label}</label>
         {currentMedia && <button onClick={onClear} className="text-[10px] text-red-400 hover:text-red-300">清除</button>}
      </div>
      <div className="flex gap-1 text-[10px] mb-1">
        <select value={isVid} onChange={(e) => setIsVid(e.target.value)} className="bg-gray-900 border border-gray-600 text-white px-1 outline-none">
          <option value="image">图片</option><option value="video">视频</option>
        </select>
        <button onClick={handleSelectLocal} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded flex justify-center items-center gap-1 transition-colors">
           <FileImage size={12}/> 获取本地文件
        </button>
      </div>
      <div className="flex gap-1 text-[10px]">
        <input type="text" placeholder="输入外部链接或本地路径" value={urlStr} onChange={(e) => setUrlStr(e.target.value)} className="flex-1 bg-gray-900 border border-gray-600 px-1 text-white" />
        <button onClick={() => { if (urlStr) onMediaChange({ url: urlStr, type: isVid }); }} className="bg-gray-700 hover:bg-gray-600 text-white px-2 rounded">载入</button>
      </div>
    </div>
  );
};

// 实例数据工厂
const createDefaultMenus = () => ({
  main: [
    { id: `m1_${Date.now()}`, text: '攻击', color: '#ffffff', size: 24, desc: '普通攻击(受攻击力影响)。', target: 'manual_enemy', actionType: 'damage', value: 10, mpCost: 0, accuracy: 100, effect: 'hurt', duration: 0.8, subMenu: 'none' },
    { id: `m2_${Date.now()}`, text: '技能', color: '#ffffff', size: 24, desc: '消耗MP，释放特殊技能。', target: 'none', actionType: 'none', value: 0, mpCost: 0, accuracy: 100, effect: 'none', duration: 0, subMenu: 'skills' },
    { id: `m3_${Date.now()}`, text: '防守', color: '#ffffff', size: 24, desc: '进入防御状态。', target: 'self', actionType: 'defend', value: 0, mpCost: 0, accuracy: 100, effect: 'shake', duration: 0.5, subMenu: 'none' },
    { id: `m4_${Date.now()}`, text: '物品', color: '#ffffff', size: 24, desc: '打开道具栏。', target: 'none', actionType: 'none', value: 0, mpCost: 0, accuracy: 100, effect: 'none', duration: 0, subMenu: 'items' },
  ],
  skills: [
    { id: `s1_${Date.now()}`, text: '重击', color: '#ffea00', size: 22, desc: '消耗MP发动高倍率攻击。', target: 'manual_enemy', actionType: 'damage', value: 40, mpCost: 20, accuracy: 90, effect: 'lunge', duration: 1, subMenu: 'none' },
    { id: `s4_${Date.now()}`, text: '返回', color: '#888888', size: 20, desc: '返回上一级。', target: 'none', actionType: 'none', value: 0, mpCost: 0, accuracy: 100, effect: 'none', duration: 0, subMenu: 'main' },
  ],
  items: [
    { id: `i1_${Date.now()}`, text: '生命药水', color: '#ff5555', size: 22, desc: '恢复指定目标的HP。', target: 'manual_party', actionType: 'heal', value: 50, mpCost: 0, accuracy: 100, effect: 'float-fast', duration: 1, subMenu: 'none' },
    { id: `i3_${Date.now()}`, text: '返回', color: '#888888', size: 20, desc: '返回上一级。', target: 'none', actionType: 'none', value: 0, mpCost: 0, accuracy: 100, effect: 'none', duration: 0, subMenu: 'main' },
  ]
});

// --- Main Engine ---
export default function App() {
  const [isGameMode, setIsGameMode] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [panelTab, setPanelTab] = useState('global'); 
  const [globalMessage, setGlobalMessage] = useState("");
  
  const [bgMedia, setBgMedia] = useState(null);
  // 全局画面特效参数
  const [effects, setEffects] = useState({ crt: true, noise: false, blur: false, screenShake: false, glitch: false, invert: false, sepia: false });
  const [title, setTitle] = useState({ show: true, text: "RPG 桌面端配置工具" });
  
  const [globalRules, setGlobalRules] = useState({
    defendReduction: 50, 
    damageVariance: 10,  
  });

  const [boss, setBoss] = useState({
    name: "深渊目标", hp: 1000, maxHp: 1000, atk: 45, def: 15, anim: 'float', media1: null, media2: null, state: 1, isDefending: false,
    aiRules: [
      { id: 'ai1', condition: 'hp_below', threshold: 30, text: '终极判定', actionType: 'damage', value: 120, accuracy: 90, target: 'party_all', effect: 'flash', duration: 1.5 },
      { id: 'ai2', condition: 'always', threshold: 0, text: '常规判定', actionType: 'damage', value: 50, accuracy: 95, target: 'party_random', effect: 'lunge-down', duration: 0.8 }
    ]
  });

  const [party, setParty] = useState([
    { id: 1, name: "一号位", media: null, bgMedia: null, anim: 'none', hp: 150, maxHp: 150, mp: 50, maxMp: 50, atk: 40, def: 20, isDefending: false, menus: createDefaultMenus() },
    { id: 2, name: "二号位", media: null, bgMedia: null, anim: 'none', hp: 80, maxHp: 80, mp: 100, maxMp: 100, atk: 60, def: 10, isDefending: false, menus: createDefaultMenus() },
    { id: 3, name: "三号位", media: null, bgMedia: null, anim: 'none', hp: 100, maxHp: 100, mp: 40, maxMp: 40, atk: 50, def: 15, isDefending: false, menus: createDefaultMenus() },
    { id: 4, name: "四号位", media: null, bgMedia: null, anim: 'none', hp: 90, maxHp: 90, mp: 90, maxMp: 90, atk: 20, def: 25, isDefending: false, menus: createDefaultMenus() },
  ]);

  const [currentMenuId, setCurrentMenuId] = useState('main');
  const [hoveredItemId, setHoveredItemId] = useState(null);
  
  const [editingMenuCharId, setEditingMenuCharId] = useState(1);
  const [editingMenuId, setEditingMenuId] = useState('main'); 

  const [turnChain, setTurnChain] = useState(['party_1', 'party_2', 'party_3', 'party_4', 'boss']);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const activeTurnEntity = turnChain[currentTurnIdx] || 'none';

  const [combatTexts, setCombatTexts] = useState([]); 
  const [tempEffects, setTempEffects] = useState({});
  const [tempMedia, setTempMedia] = useState({});
  const timeoutRefs = useRef({});

  // 获取当前角色的菜单对象
  let activeActorMenus = { main:[], skills:[], items:[] };
  if (activeTurnEntity.startsWith('party_')) {
      const pId = parseInt(activeTurnEntity.split('_')[1]);
      const p = party.find(x => x.id === pId);
      if (p) activeActorMenus = p.menus;
  }
  const currentMenuItems = activeActorMenus[currentMenuId] || [];
  const hoveredItemData = currentMenuItems.find(i => i.id === hoveredItemId);
  const isPlayerTurn = activeTurnEntity.startsWith('party_') && !isProcessingAction;

  // --- Engine Logic ---
  const showCombatText = (targetId, amountStr, type) => {
    const id = Date.now() + Math.random();
    setCombatTexts(prev => [...prev, { id, targetId, text: amountStr, type }]);
    setTimeout(() => { setCombatTexts(prev => prev.filter(t => t.id !== id)); }, 1500);
  };

  const resetBattle = () => {
    setCurrentTurnIdx(0);
    setCurrentMenuId('main');
    setTargetingAction(null);
    setGlobalMessage("状态已初始化");
    setIsProcessingAction(false);
    
    setCombatTexts([]);
    setTempEffects({});
    setTempMedia({});
    
    setBoss(b => ({ ...b, hp: b.maxHp, isDefending: false }));
    setParty(pts => pts.map(p => ({ ...p, hp: p.maxHp, mp: p.maxMp, isDefending: false })));
    
    setTimeout(() => setGlobalMessage(""), 1500);
  };

  const advanceTurn = () => {
    let nextIdx = (currentTurnIdx + 1) % turnChain.length;
    let safeGuard = 0;
    while(safeGuard < turnChain.length) {
       const ent = turnChain[nextIdx];
       if (ent === 'boss' && boss.hp > 0) break;
       if (ent.startsWith('party_')) {
          const pId = parseInt(ent.split('_')[1]);
          const p = party.find(x => x.id === pId);
          if (p && p.hp > 0) break;
       }
       nextIdx = (nextIdx + 1) % turnChain.length;
       safeGuard++;
    }
    
    const nextEntity = turnChain[nextIdx];
    if (nextEntity === 'boss') setBoss(b => ({...b, isDefending: false}));
    else if (nextEntity.startsWith('party_')) {
       const pId = parseInt(nextEntity.split('_')[1]);
       setParty(pts => pts.map(p => p.id === pId ? {...p, isDefending: false} : p));
    }

    setCurrentTurnIdx(nextIdx);
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

  // 处理行动主干逻辑
  const executeAction = (action, resolvedTargetId, actorId) => {
    setIsProcessingAction(true);
    setGlobalMessage(`${getEntityName(actorId)} 使用 ${action.text}`);

    triggerEffect(actorId, action.effect, action.duration, action.effectMedia); 
    
    let targets = [];
    if (resolvedTargetId === 'party_all') targets = party.filter(p => p.hp > 0).map(p => `party_${p.id}`);
    else if (resolvedTargetId === 'party_random') {
       const alive = party.filter(p => p.hp > 0);
       if(alive.length > 0) targets = [`party_${alive[Math.floor(Math.random() * alive.length)].id}`];
       else targets = ['boss']; 
    } else {
       targets = [resolvedTargetId];
    }

    // 保证视觉时序的延迟处理
    setTimeout(() => {
      let newParty = [...party];
      let newBoss = { ...boss };

      if (actorId.startsWith('party_')) {
        const aId = parseInt(actorId.split('_')[1]);
        newParty = newParty.map(p => p.id === aId ? { ...p, mp: Math.max(0, p.mp - (action.mpCost||0)) } : p);
      }

      targets.forEach(tId => {
        const acc = action.accuracy !== undefined ? action.accuracy : 100;
        const isHit = (Math.random() * 100) <= acc;

        if (!isHit && (action.actionType === 'damage' || action.actionType === 'heal')) {
           showCombatText(tId, 'MISS', 'miss');
           return; 
        }

        let baseAmount = parseInt(action.value) || 0;
        let finalAmount = 0;

        // 计算数值体系
        if (action.actionType === 'damage') {
           triggerEffect(tId, 'hurt', 0.5);
           const attackerAtk = getEntityAttr(actorId, 'atk');
           const targetDef = getEntityAttr(tId, 'def');
           const isDefending = getEntityAttr(tId, 'isDefending');

           let rawDmg = baseAmount + attackerAtk - targetDef;
           if (rawDmg < 1) rawDmg = 1; 
           if (isDefending) rawDmg = Math.floor(rawDmg * (1 - globalRules.defendReduction / 100));

           const variance = globalRules.damageVariance / 100;
           finalAmount = Math.floor(rawDmg * ((1 - variance) + Math.random() * (variance * 2))); 
           if (finalAmount < 1) finalAmount = 1;
        } 
        else if (action.actionType === 'heal' || action.actionType === 'revive') {
           triggerEffect(tId, 'flash', 0.5);
           const variance = globalRules.damageVariance / 100;
           finalAmount = Math.floor(baseAmount * ((1 - variance) + Math.random() * (variance * 2)));
        }

        // 应用状态修改
        if (tId === 'boss') {
          if (action.actionType === 'damage') {
             newBoss.hp = Math.max(0, newBoss.hp - finalAmount);
             showCombatText('boss', `-${finalAmount}`, 'damage');
          } else if (action.actionType === 'heal') {
             newBoss.hp = Math.min(newBoss.maxHp, newBoss.hp + finalAmount);
             showCombatText('boss', `+${finalAmount}`, 'heal');
          } else if (action.actionType === 'defend') {
             newBoss.isDefending = true;
          }
        } else if (tId.startsWith('party_')) {
          const pId = parseInt(tId.split('_')[1]);
          newParty = newParty.map(p => {
            if(p.id !== pId) return p;
            if(action.actionType === 'damage') {
               showCombatText(`party_${p.id}`, `-${finalAmount}`, 'damage');
               return { ...p, hp: Math.max(0, p.hp - finalAmount) };
            }
            if(action.actionType === 'heal') {
               if(p.hp <= 0) return p; 
               showCombatText(`party_${p.id}`, `+${finalAmount}`, 'heal');
               return { ...p, hp: Math.min(p.maxHp, p.hp + finalAmount) };
            }
            if(action.actionType === 'revive') {
               if(p.hp > 0) return p; 
               showCombatText(`party_${p.id}`, `+${finalAmount}`, 'heal');
               return { ...p, hp: Math.min(p.maxHp, finalAmount) };
            }
            if(action.actionType === 'defend') {
               return { ...p, isDefending: true };
            }
            return p;
          });
        }
      });

      setParty(newParty);
      setBoss(newBoss);

      if (newBoss.hp <= 0) {
         setGlobalMessage("目标已消灭");
         return;
      }
      if (newParty.every(p => p.hp <= 0)) {
         setGlobalMessage("行动失败");
         return;
      }

      setTimeout(advanceTurn, (action.duration * 1000) || 1000);

    }, 400);
  };

  // 处理自动AI
  useEffect(() => {
    if (activeTurnEntity === 'boss' && !isProcessingAction && boss.hp > 0) {
      setIsProcessingAction(true);
      setGlobalMessage("目标行动");
      
      setTimeout(() => {
        let chosenAction = boss.aiRules[boss.aiRules.length - 1] || { text: '跳过', actionType: 'none', effect: 'none', duration: 1, target: 'none', accuracy: 100 };
        const hpPercent = (boss.hp / boss.maxHp) * 100;
        
        for (let rule of boss.aiRules) {
           if (rule.condition === 'hp_below' && hpPercent <= rule.threshold) { chosenAction = rule; break; }
           if (rule.condition === 'hp_above' && hpPercent >= rule.threshold) { chosenAction = rule; break; }
           if (rule.condition === 'always') { chosenAction = rule; break; }
        }
        executeAction(chosenAction, chosenAction.target, 'boss');
      }, 1500);
    }
  }, [activeTurnEntity, boss.hp, isProcessingAction]);

  // 处理玩家点选交互
  const [targetingAction, setTargetingAction] = useState(null);

  const handlePlayerMenuClick = (item) => {
    if (isProcessingAction) return;

    if (item.actionType === 'none' && item.target === 'none' && item.effect === 'none') {
        if (item.subMenu && item.subMenu !== 'none') setCurrentMenuId(item.subMenu);
        return; 
    }

    const actor = party.find(p => `party_${p.id}` === activeTurnEntity);
    if (actor && item.mpCost > actor.mp) {
       setGlobalMessage("MP不足");
       setTimeout(() => setGlobalMessage(""), 1000);
       return;
    }

    if (item.target.startsWith('manual_')) {
       setTargetingAction(item);
       setGlobalMessage(`请指定目标: ${item.text}`);
       return;
    }
    
    let resolvedTarget = item.target;
    if (item.target === 'self') resolvedTarget = activeTurnEntity;
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
    if(id.startsWith('party_')) { const p = party.find(x => x.id === parseInt(id.split('_')[1])); return p ? p.name : '未定义'; }
    return id;
  };
  
  const getBaseAnimClass = (animType) => { 
    switch(animType) { case 'float': return 'anim-float'; case 'float-fast': return 'anim-float-fast'; default: return ''; } 
  };

  const updateMenuData = (charId, category, index, field, value) => {
    setParty(party.map(p => {
        if (p.id !== charId) return p;
        const newCategory = [...p.menus[category]];
        newCategory[index] = { ...newCategory[index], [field]: value };
        return { ...p, menus: { ...p.menus, [category]: newCategory } };
    }));
  };
  
  const addMenuItem = () => {
    const newItem = { id: `item_${Date.now()}`, text: '未定义', color: '#ffffff', size: 22, desc: '', target: 'none', actionType: 'none', value: 0, mpCost: 0, accuracy: 100, effect: 'none', duration: 0, subMenu: 'none' };
    setParty(party.map(p => {
        if (p.id !== editingMenuCharId) return p;
        return { ...p, menus: { ...p.menus, [editingMenuId]: [...p.menus[editingMenuId], newItem] } };
    }));
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
    setParty(party.map(p => {
        if (p.id !== editingMenuCharId) return p;
        return { ...p, menus: JSON.parse(JSON.stringify(sourceMenus)) };
    }));
  };

  const updateBossAi = (index, field, value) => {
    const newRules = [...boss.aiRules]; newRules[index] = { ...newRules[index], [field]: value };
    setBoss({ ...boss, aiRules: newRules });
  };
  const addAiRule = () => setBoss({...boss, aiRules: [...boss.aiRules, { id: Date.now(), condition: 'always', threshold: 0, text: '攻击', actionType: 'damage', value: 20, accuracy: 100, target: 'party_random', effect: 'lunge-down', duration: 1 }]});
  const removeAiRule = (index) => setBoss({...boss, aiRules: boss.aiRules.filter((_,i)=>i!==index)});
  const updateTurnStep = (index, value) => { const newChain = [...turnChain]; newChain[index] = value; setTurnChain(newChain); };
  const removeTurnStep = (index) => { if(turnChain.length <= 1) return; setTurnChain(turnChain.filter((_, i) => i !== index)); if(currentTurnIdx >= turnChain.length - 1) setCurrentTurnIdx(0); };
  const addTurnStep = () => setTurnChain([...turnChain, 'party_1']);

  // --- Save Management ---
  const [savedSlots, setSavedSlots] = useState([]);
  
  useEffect(() => { 
    const slots = []; 
    for(let i=1; i<=3; i++) { 
       if(ElectronBridge.loadConfig(i)) slots.push(i); 
    } 
    setSavedSlots(slots); 
  }, []);
  
  const handleSaveToStore = (slot) => {
    const data = { bgMedia, effects, title, globalRules, boss, party, turnChain };
    ElectronBridge.saveConfig(slot, data);
    if(!savedSlots.includes(slot)) setSavedSlots([...savedSlots, slot]);
  };
  
  const handleLoadFromStore = (slot) => {
    try {
      const data = ElectronBridge.loadConfig(slot);
      if(data) {
        if(data.bgMedia !== undefined) setBgMedia(data.bgMedia);
        if(data.effects) setEffects(data.effects);
        if(data.title) setTitle(data.title);
        if(data.globalRules) setGlobalRules(data.globalRules);
        if(data.boss) setBoss(data.boss);
        if(data.party) setParty(data.party);
        if(data.turnChain) setTurnChain(data.turnChain);
        resetBattle();
      }
    } catch(e) { console.error("读取配置失败", e); }
  };

  const editingCharMenus = party.find(p => p.id === editingMenuCharId)?.menus || createDefaultMenus();

  // --- Render ---
  return (
    <>
      <style>{customStyles}</style>
      
      <div className={`relative w-full h-screen bg-black overflow-hidden flex flex-col font-[VT323] ${effects.screenShake ? 'anim-shake' : ''} ${effects.glitch ? 'effect-glitch' : ''} ${effects.invert ? 'effect-invert' : ''} ${effects.sepia ? 'effect-sepia' : ''} ${targetingAction ? 'targeting-mode' : ''}`}>
        
        {effects.crt && <div className="absolute inset-0 crt-overlay"></div>}
        {effects.crt && <div className="absolute inset-0 crt-vignette"></div>}
        {effects.noise && <div className="noise-overlay"></div>}

        <button onClick={() => setIsGameMode(!isGameMode)} className={`absolute top-4 right-4 z-50 p-2 rounded flex items-center gap-2 transition-colors ${isGameMode ? 'bg-transparent text-gray-700 hover:text-white' : 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-500'}`}>
          {isGameMode ? <Edit3 size={20} /> : <><Play size={18} /> 预览模式</>}
        </button>

        <div className={`absolute inset-0 z-0 transition-all duration-300 ${effects.blur ? 'blur-md scale-105' : ''}`}>
          {bgMedia && <MediaElement media={bgMedia} className="w-full h-full object-cover opacity-60" />}
        </div>

        {title.show && <div className="absolute top-4 left-4 z-20 text-white text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] opacity-70 tracking-widest cursor-default">{title.text}</div>}

        <div className="flex-1 relative z-10 flex flex-col items-center justify-center min-h-0 pt-10">
           <div className="w-[300px] max-w-[80vw] mb-4 text-center z-20">
              <div className="text-red-400 text-lg tracking-widest drop-shadow-[0_2px_2px_#000]">{boss.name}</div>
              <div className="h-3 bg-gray-900 border-2 border-gray-500 relative mt-1">
                 <div className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-300" style={{width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`}}></div>
              </div>
           </div>

           {activeTurnEntity === 'boss' && !isGameMode && <div className="absolute top-[30%] text-red-500 indicator-bounce text-4xl drop-shadow-[0_0_10px_red]">▼</div>}
           
           <div className="relative">
             {combatTexts.filter(t => t.targetId === 'boss').map(t => (
                <div key={t.id} className={`combat-text ${t.type === 'damage' ? 'dmg-text' : (t.type === 'miss' ? 'miss-text' : 'heal-text')} left-1/2 -ml-6 top-[20%]`}>{t.text}</div>
             ))}

             <div 
               className={`w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] flex items-end justify-center transition-transform ${tempEffects['boss'] || getBaseAnimClass(boss.anim)} ${targetingAction?.target === 'manual_enemy' || targetingAction?.target === 'manual_any' ? 'targetable-enemy' : ''}`}
               onClick={() => handleEntityClick('boss')}
             >
                {boss.isDefending && <div className="absolute -top-8 text-3xl text-blue-400 drop-shadow-[0_0_10px_blue] z-50"><Shield size={36}/></div>}
                {tempMedia['boss'] ? (
                   <MediaElement media={tempMedia['boss']} className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] z-50" />
                ) : (
                   <MediaElement media={boss.state === 1 ? boss.media1 : (boss.media2 || boss.media1)} className="max-w-full max-h-full drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]" alt="Boss" />
                )}
             </div>
           </div>
        </div>

        <div className="relative z-20 w-full max-w-[1100px] mx-auto flex flex-col pb-4 px-4 h-[38vh] min-h-[240px] max-h-[300px]">
          <div className="w-full mb-2 flex gap-2">
            <div className={`rpg-box flex-1 h-[50px] px-3 text-lg flex items-center justify-between tracking-widest text-[#e2e8f0] overflow-hidden whitespace-nowrap ${(targetingAction||globalMessage) ? 'border-yellow-400 bg-[#221a00]' : ''}`}>
              <div className="text-yellow-400">
                {globalMessage ? globalMessage : (targetingAction ? `执行指示: ${targetingAction.text}` : (hoveredItemData ? hoveredItemData.desc : <span className="text-gray-500">待机状态</span>))}
              </div>
              {targetingAction && !isProcessingAction && <button onClick={() => setTargetingAction(null)} className="bg-red-900/50 border border-red-500 text-red-300 px-3 py-1 text-sm rounded hover:bg-red-800">取消</button>}
            </div>
            
            <div className={`rpg-box h-[50px] px-3 flex items-center justify-between gap-3 bg-[#111] border-[#555] min-w-[200px] ${activeTurnEntity==='boss'?'border-red-600 bg-red-950/30':''}`}>
               <button onClick={resetBattle} className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-1 px-2 rounded text-sm transition-colors border border-red-900">重置状态</button>
               <div className="w-[1px] h-3/4 bg-gray-700 mx-1"></div>
               <div className="text-center flex-1">
                 <div className="text-xs text-yellow-500 leading-tight">当前序列</div>
                 <div className={`text-md tracking-widest ${activeTurnEntity==='boss'?'text-red-400 font-bold':'text-green-400'}`}>{getEntityName(activeTurnEntity)}</div>
               </div>
            </div>
          </div>

          <div className="flex-1 flex gap-3 min-h-0">
            <div className="flex-1 grid grid-cols-4 gap-2 min-w-0">
              {party.map((p) => {
                const entityId = `party_${p.id}`;
                const isMyTurn = activeTurnEntity === entityId;
                const currentAnim = tempEffects[entityId] || getBaseAnimClass(p.anim);
                const isTargetable = targetingAction?.target === 'manual_party' || targetingAction?.target === 'manual_any';
                const isDead = p.hp <= 0;
                
                return (
                  <div 
                    key={p.id} 
                    className={`rpg-box flex flex-col p-2 h-full transition-all duration-300 ${isMyTurn && !targetingAction && !isDead ? 'rpg-box-active transform -translate-y-2' : ''} ${isTargetable ? 'targetable-ally' : ''} ${isDead ? 'is-dead' : ''}`}
                    onClick={() => {
                      if (targetingAction?.actionType === 'revive') { handleEntityClick(entityId); }
                      else if (!isDead) { handleEntityClick(entityId); }
                    }}
                  >
                    <div className="text-center text-sm lg:text-lg border-b-2 border-[#555] pb-1 mb-1 tracking-widest relative">
                      {isMyTurn && !isDead && <span className="absolute -left-1 top-0 text-yellow-400 text-xs indicator-bounce">▼</span>}
                      {p.name}
                    </div>
                    
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden mb-1 bg-[#111] border border-[#333]">
                      {combatTexts.filter(t => t.targetId === entityId).map(t => (
                         <div key={t.id} className={`combat-text ${t.type === 'damage' ? 'dmg-text' : (t.type === 'miss' ? 'miss-text' : 'heal-text')} z-50`}>{t.text}</div>
                      ))}
                      
                      {p.isDefending && !isDead && <div className="absolute top-1 right-1 text-blue-400 drop-shadow-[0_0_5px_blue] z-40"><Shield size={16}/></div>}

                      {tempMedia[entityId] ? (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50"><MediaElement media={tempMedia[entityId]} className="w-full h-full object-cover" /></div>
                      ) : (
                        <><div className="absolute inset-0 z-0 opacity-40"><MediaElement media={p.bgMedia} className="w-full h-full object-cover" /></div><div className={`absolute inset-0 z-10 flex items-center justify-center ${currentAnim}`}><MediaElement media={p.media} className="w-[85%] h-[85%] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" /></div></>
                      )}
                    </div>

                    <div className="h-8 flex flex-col gap-1 justify-end mt-1">
                      <div className="flex items-center gap-1 text-[9px] lg:text-[11px]"><span className="text-[#a0aec0] w-3">HP</span><div className="flex-1 h-2 lg:h-3 bg-gray-800 border border-gray-600 relative"><div className="absolute top-0 left-0 h-full bg-[#48bb78] transition-all duration-300" style={{width:`${(p.hp/p.maxHp)*100}%`}}></div></div><span className="w-8 text-right leading-none">{p.hp}</span></div>
                      <div className="flex items-center gap-1 text-[9px] lg:text-[11px]"><span className="text-[#a0aec0] w-3">MP</span><div className="flex-1 h-2 lg:h-3 bg-gray-800 border border-gray-600 relative"><div className="absolute top-0 left-0 h-full bg-[#4299e1] transition-all duration-300" style={{width:`${(p.mp/p.maxMp)*100}%`}}></div></div><span className="w-8 text-right leading-none">{p.mp}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`rpg-box w-[160px] lg:w-[200px] h-full p-3 lg:p-4 flex flex-col gap-2 tracking-widest overflow-y-auto transition-opacity duration-300 ${isPlayerTurn && !targetingAction ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              {activeTurnEntity === 'boss' ? (
                 <div className="h-full flex items-center justify-center text-red-500 text-xl animate-pulse text-center">行动处理中</div>
              ) : (
                currentMenuItems.map((cmd) => {
                  const isHovered = hoveredItemId === cmd.id;
                  const canAfford = !cmd.mpCost || party.find(p => `party_${p.id}` === activeTurnEntity)?.mp >= cmd.mpCost;
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
              <div className="p-3 flex justify-between items-center border-b border-gray-700 sticky top-0 bg-gray-900 z-30"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings size={18}/> 渲染引擎配置</h2><button onClick={() => setShowPanel(false)} className="hover:text-white p-1 bg-gray-800 rounded"><X size={18}/></button></div>
              <div className="flex bg-gray-800 text-xs border-b border-gray-700 sticky top-[53px] z-30">
                 <button onClick={()=>setPanelTab('global')} className={`flex-1 py-2 flex justify-center items-center gap-1 transition-colors ${panelTab==='global'?'bg-indigo-600 text-white':'hover:bg-gray-700'}`}><Monitor size={14}/> 渲染/主轴</button>
                 <button onClick={()=>setPanelTab('party')} className={`flex-1 py-2 flex justify-center items-center gap-1 transition-colors ${panelTab==='party'?'bg-indigo-600 text-white':'hover:bg-gray-700'}`}><Move size={14}/> 矩阵参数</button>
                 <button onClick={()=>setPanelTab('menu')} className={`flex-1 py-2 flex justify-center items-center gap-1 transition-colors ${panelTab==='menu'?'bg-indigo-600 text-white':'hover:bg-gray-700'}`}><List size={14}/> 交互逻辑</button>
                 <button onClick={()=>setPanelTab('save')} className={`flex-1 py-2 flex justify-center items-center gap-1 transition-colors ${panelTab==='save'?'bg-indigo-600 text-white':'hover:bg-gray-700'}`}><Save size={14}/> 本地读写</button>
              </div>

              <div className="p-4 space-y-6 pb-20">
                {panelTab === 'global' && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-white border-b border-gray-700 pb-1 font-bold flex items-center gap-2"><Sliders size={16}/> 渲染与数值参数</h3>
                      <div className="bg-gray-800 p-2 rounded border border-gray-700 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">输出浮动率 (Variance)</span>
                          <div className="flex items-center gap-1 bg-gray-900 px-2 py-1 border border-gray-600 rounded">
                            <input type="number" value={globalRules.damageVariance} onChange={(e)=>setGlobalRules({...globalRules, damageVariance:Number(e.target.value)})} className="w-12 bg-transparent text-white text-center outline-none"/> %
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">防守指令减伤比</span>
                          <div className="flex items-center gap-1 bg-gray-900 px-2 py-1 border border-gray-600 rounded">
                            <input type="number" value={globalRules.defendReduction} onChange={(e)=>setGlobalRules({...globalRules, defendReduction:Number(e.target.value)})} className="w-12 bg-transparent text-white text-center outline-none"/> %
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-gray-800 p-2 rounded">
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={effects.crt} onChange={() => setEffects({...effects, crt: !effects.crt})} className="accent-indigo-500" /> CRT光栅</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={effects.noise} onChange={() => setEffects({...effects, noise: !effects.noise})} className="accent-indigo-500" /> 高频噪点</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={effects.glitch} onChange={() => setEffects({...effects, glitch: !effects.glitch})} className="accent-indigo-500" /> 信号撕裂</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={effects.invert} onChange={() => setEffects({...effects, invert: !effects.invert})} className="accent-indigo-500" /> 空间反色</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={effects.sepia} onChange={() => setEffects({...effects, sepia: !effects.sepia})} className="accent-indigo-500" /> 褪色滤镜</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={title.show} onChange={() => setTitle({...title, show: !title.show})} className="accent-indigo-500" /> 标题显示</label>
                      </div>
                      {title.show && <input type="text" value={title.text} onChange={(e) => setTitle({...title, text: e.target.value})} className="w-full bg-gray-800 border border-gray-600 px-2 py-1 text-white text-xs mt-1" placeholder="应用标题..." />}
                      <MediaControl label="场景矩阵背景" currentMedia={bgMedia} onMediaChange={setBgMedia} onClear={() => setBgMedia(null)} />
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-white border-b border-gray-700 pb-1 font-bold text-red-400 flex items-center gap-1"><Zap size={16}/> 敌对方配置</h3>
                      <div className="flex gap-2 mb-1">
                        <input type="text" value={boss.name} onChange={(e)=>setBoss({...boss, name:e.target.value})} placeholder="识别名" className="w-20 bg-gray-800 border border-gray-600 px-1 text-white text-[11px]"/>
                        <div className="flex-1 flex items-center gap-1 text-[10px] bg-gray-800 px-1 border border-gray-600 text-green-400">HP<input type="number" value={boss.hp} onChange={(e)=>setBoss({...boss, hp:Number(e.target.value), maxHp:Number(e.target.value)})} className="w-full bg-transparent text-white outline-none"/></div>
                        <div className="flex items-center gap-1 text-[10px] bg-gray-800 px-1 border border-gray-600 text-red-400">ATK<input type="number" value={boss.atk} onChange={(e)=>setBoss({...boss, atk:Number(e.target.value)})} className="w-10 bg-transparent text-white outline-none"/></div>
                        <div className="flex items-center gap-1 text-[10px] bg-gray-800 px-1 border border-gray-600 text-blue-300">DEF<input type="number" value={boss.def} onChange={(e)=>setBoss({...boss, def:Number(e.target.value)})} className="w-10 bg-transparent text-white outline-none"/></div>
                      </div>
                      <MediaControl label="实体渲染模型" currentMedia={boss.media1} onMediaChange={(m)=>setBoss({...boss, media1:m})} onClear={() => setBoss({...boss, media1:null})} minimal/>
                      
                      <div className="mt-4 border border-red-900 bg-red-950/20 p-2 rounded space-y-2">
                        <h4 className="text-xs text-red-300 font-bold border-b border-red-900 pb-1">行为模式 (自上游下解析)</h4>
                        {boss.aiRules.map((rule, idx) => (
                           <div key={rule.id} className="bg-gray-900 border border-gray-700 p-2 rounded text-[10px] relative">
                              <button onClick={() => removeAiRule(idx)} className="absolute top-1 right-1 text-red-500 hover:text-red-300"><Trash2 size={12}/></button>
                              <div className="flex gap-1 mb-1 items-center pr-4">
                                <span className="text-gray-500">条件:</span>
                                <select value={rule.condition} onChange={(e)=>updateBossAi(idx, 'condition', e.target.value)} className="bg-gray-800 text-white outline-none p-1 border border-gray-600 flex-1">
                                  <option value="hp_above">HP % 阈值上限</option>
                                  <option value="hp_below">HP % 阈值下限</option>
                                  <option value="always">无条件执行</option>
                                </select>
                                {rule.condition !== 'always' && <input type="number" value={rule.threshold} onChange={(e)=>updateBossAi(idx, 'threshold', Number(e.target.value))} className="w-10 bg-gray-800 text-white p-1 border border-gray-600 text-center"/>}
                              </div>
                              <div className="flex gap-1 mb-1 items-center">
                                <span className="text-gray-500">动作:</span>
                                <input type="text" value={rule.text} onChange={(e)=>updateBossAi(idx, 'text', e.target.value)} placeholder="内部名称" className="w-16 bg-gray-800 text-white p-1 border border-gray-600"/>
                                <select value={rule.actionType} onChange={(e)=>updateBossAi(idx, 'actionType', e.target.value)} className="bg-gray-800 text-white outline-none p-1 border border-gray-600">
                                  <option value="damage">输出伤害</option><option value="heal">状态恢复</option><option value="defend">变更防御</option>
                                </select>
                                <span className="text-gray-500">数值:</span>
                                <input type="number" value={rule.value} onChange={(e)=>updateBossAi(idx, 'value', Number(e.target.value))} className="w-12 bg-gray-800 text-white p-1 border border-gray-600 text-center"/>
                                <span className="text-gray-500">命中率:</span>
                                <input type="number" value={rule.accuracy} onChange={(e)=>updateBossAi(idx, 'accuracy', Number(e.target.value))} className="w-10 bg-gray-800 text-white p-1 border border-gray-600 text-center"/>
                              </div>
                              <div className="flex gap-1 items-center">
                                <span className="text-gray-500">寻的:</span>
                                <select value={rule.target} onChange={(e)=>updateBossAi(idx, 'target', e.target.value)} className="flex-1 bg-gray-800 text-white outline-none p-1 border border-gray-600">
                                  <option value="party_random">随机单位</option><option value="party_all">所有单位</option><option value="boss">本实体</option>
                                </select>
                                <select value={rule.effect} onChange={(e)=>updateBossAi(idx, 'effect', e.target.value)} className="flex-1 bg-gray-800 text-white outline-none p-1 border border-gray-600">
                                  <option value="lunge-down">物理下砸</option><option value="flash">泛光暴露</option><option value="shake">频闪</option><option value="spin">轴旋转</option>
                                </select>
                              </div>
                           </div>
                        ))}
                        <button onClick={addAiRule} className="w-full py-1 border border-dashed border-red-800 text-red-400 hover:text-red-300 text-[10px]">增设逻辑链</button>
                      </div>
                    </div>
                  </div>
                )}

                {panelTab === 'party' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500">编辑队伍成员实体参数。</p>
                    {party.map((p) => (
                      <div key={p.id} className="bg-gray-800 p-2 border border-gray-700 space-y-2 rounded relative">
                        <div className="flex flex-wrap gap-1 mb-1 items-center">
                          <input type="text" value={p.name} onChange={(e) => setParty(party.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))} className="bg-gray-900 border border-gray-600 px-1 w-16 text-white font-[VT323] text-xs"/>
                          <div className="flex-1 flex items-center gap-1 text-[9px] bg-gray-900 px-1 border border-gray-600 text-green-400">HP<input type="number" value={p.hp} onChange={(e)=>setParty(party.map(x=>x.id===p.id?{...x,hp:Number(e.target.value),maxHp:Number(e.target.value)}:x))} className="w-full bg-transparent text-white outline-none text-center min-w-[30px]"/></div>
                          <div className="flex-1 flex items-center gap-1 text-[9px] bg-gray-900 px-1 border border-gray-600 text-blue-400">MP<input type="number" value={p.mp} onChange={(e)=>setParty(party.map(x=>x.id===p.id?{...x,mp:Number(e.target.value),maxMp:Number(e.target.value)}:x))} className="w-full bg-transparent text-white outline-none text-center min-w-[30px]"/></div>
                        </div>
                        <div className="flex gap-1 items-center">
                           <div className="flex-1 flex items-center gap-1 text-[9px] bg-gray-900 px-1 border border-gray-600 text-red-400">ATK<input type="number" value={p.atk} onChange={(e)=>setParty(party.map(x=>x.id===p.id?{...x,atk:Number(e.target.value)}:x))} className="w-full bg-transparent text-white outline-none text-center"/></div>
                           <div className="flex-1 flex items-center gap-1 text-[9px] bg-gray-900 px-1 border border-gray-600 text-blue-300">DEF<input type="number" value={p.def} onChange={(e)=>setParty(party.map(x=>x.id===p.id?{...x,def:Number(e.target.value)}:x))} className="w-full bg-transparent text-white outline-none text-center"/></div>
                        </div>
                        <div className="border-t border-gray-700 pt-2">
                           <MediaControl label="实体渲染模型" currentMedia={p.media} onMediaChange={(media) => setParty(party.map(x => x.id === p.id ? { ...x, media } : x))} onClear={() => setParty(party.map(x => x.id === p.id ? { ...x, media: null } : x))} minimal />
                           <MediaControl label="局部背景层" currentMedia={p.bgMedia} onMediaChange={(media) => setParty(party.map(x => x.id === p.id ? { ...x, bgMedia: media } : x))} onClear={() => setParty(party.map(x => x.id === p.id ? { ...x, bgMedia: null } : x))} minimal />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {panelTab === 'menu' && (
                  <div className="space-y-4">
                    
                    <div className="space-y-2">
                      <h3 className="text-white border-b border-gray-700 pb-1 font-bold text-yellow-400">时间轴执行序列</h3>
                      <div className="bg-gray-800 p-2 rounded border border-gray-700 space-y-1">
                        {turnChain.map((actor, idx) => (
                          <div key={idx} className="flex gap-1 items-center bg-gray-900 p-1 rounded">
                            <span className="text-[10px] text-gray-500 w-4 text-center">{idx+1}.</span>
                            <select value={actor} onChange={(e)=>updateTurnStep(idx, e.target.value)} className="flex-1 bg-transparent text-white text-xs outline-none">
                               <option value="party_1">一号位</option><option value="party_2">二号位</option><option value="party_3">三号位</option><option value="party_4">四号位</option><option value="boss">敌方实体</option>
                            </select>
                            <button onClick={()=>removeTurnStep(idx)} className="text-red-500 hover:text-red-400 px-2 text-sm">×</button>
                          </div>
                        ))}
                        <button onClick={addTurnStep} className="w-full mt-2 py-1 border border-dashed border-gray-500 text-gray-400 hover:text-white hover:border-white text-xs">附加序列点</button>
                      </div>
                    </div>

                    <div className="bg-gray-800 p-2 rounded border border-gray-700 mb-2">
                        <label className="text-xs text-gray-400 font-bold block mb-2">交互映射绑定目标</label>
                        <div className="flex gap-1">
                           {party.map(p => (
                             <button key={p.id} onClick={()=>setEditingMenuCharId(p.id)} className={`flex-1 py-1 text-[11px] rounded transition-colors ${editingMenuCharId === p.id ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-700 border border-gray-600'}`}>
                                {p.name}
                             </button>
                           ))}
                        </div>
                        {editingMenuCharId !== 1 && (
                           <button onClick={()=>copyMenusFrom(1)} className="w-full mt-2 py-1 flex justify-center items-center gap-1 text-[10px] text-indigo-400 hover:text-white border border-dashed border-indigo-800 hover:border-indigo-400 rounded">
                             覆写同步一号位参数
                           </button>
                        )}
                    </div>

                    <div className="flex gap-1 mb-2">
                      {['main', 'skills', 'items'].map(m => (
                        <button key={m} onClick={() => setEditingMenuId(m)} className={`flex-1 py-1 text-[11px] border ${editingMenuId === m ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-gray-800 border-gray-600'}`}>{m === 'main' ? '主交互' : m === 'skills' ? '技能组' : '物品组'}</button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {editingCharMenus[editingMenuId].map((item, index) => (
                        <div key={item.id} className="bg-gray-800 p-2 border border-gray-600 rounded relative shadow-lg">
                          <button onClick={() => removeMenuItem(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-300"><Trash2 size={14}/></button>
                          
                          <div className="flex gap-1 mb-1 pr-6">
                            <input type="text" value={item.text} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'text', e.target.value)} className="flex-1 bg-gray-900 border border-gray-600 text-white px-2 py-1 text-xs" placeholder="显示文本"/>
                            <input type="color" value={item.color} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'color', e.target.value)} className="w-8 h-6 p-0 border-none cursor-pointer bg-transparent"/>
                          </div>
                          
                          <div className="flex gap-1 mb-2 bg-gray-900 p-1 border border-gray-700 rounded text-[10px]">
                            <div className="flex-1 flex flex-col">
                              <span className="text-gray-400 mb-1">执行指令</span>
                              <select value={item.actionType} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'actionType', e.target.value)} className="bg-gray-800 text-white p-1 border border-gray-600 outline-none">
                                <option value="damage">输出伤害</option>
                                <option value="heal">HP恢复</option>
                                <option value="revive">实体激活</option>
                                <option value="defend">防守协议</option>
                                <option value="none">纯路由跳转</option>
                              </select>
                            </div>
                            <div className="w-14 flex flex-col">
                              <span className="text-gray-400 mb-1">基础量级</span>
                              <input type="number" value={item.value} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'value', Number(e.target.value))} className="bg-gray-800 text-white p-1 border border-gray-600 text-center"/>
                            </div>
                            <div className="w-10 flex flex-col">
                              <span className="text-blue-300 mb-1">MP消耗</span>
                              <input type="number" value={item.mpCost} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'mpCost', Number(e.target.value))} className="bg-gray-800 text-white p-1 border border-gray-600 text-center"/>
                            </div>
                            <div className="w-12 flex flex-col">
                              <span className="text-green-300 mb-1">命中修正</span>
                              <input type="number" value={item.accuracy !== undefined ? item.accuracy : 100} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'accuracy', Number(e.target.value))} className="bg-gray-800 text-white p-1 border border-gray-600 text-center"/>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                            <div>
                              <span className="text-gray-400 block mb-1">寻的模式</span>
                              <select value={item.target} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'target', e.target.value)} className="w-full bg-gray-800 text-white p-1 border border-gray-600 outline-none">
                                <option value="manual_enemy">手动寻的: 敌方</option>
                                <option value="manual_party">手动寻的: 友方</option>
                                <option value="self">固定寻的: 自身</option>
                                <option value="none">忽略寻的</option>
                              </select>
                            </div>
                            <div>
                              <span className="text-gray-400 block mb-1">渲染反馈</span>
                              <select value={item.effect} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'effect', e.target.value)} className="w-full bg-gray-800 text-white p-1 border border-gray-600 outline-none">
                                <option value="none">屏蔽</option>
                                <option value="lunge">突进</option>
                                <option value="flash">泛光</option>
                                <option value="shake">频闪</option>
                                <option value="spin">旋转</option>
                                <option value="ghost">残影虚化</option>
                                <option value="float-fast">弹跳反馈</option>
                                <option value="media_swap" className="text-blue-300">模型覆盖</option>
                              </select>
                            </div>
                          </div>

                          {item.effect === 'media_swap' && (
                            <div className="mb-2 p-1 bg-blue-900/30 border border-blue-700/50 rounded">
                              <MediaControl label="导入覆盖文件" currentMedia={item.effectMedia} onMediaChange={(m) => updateMenuData(editingMenuCharId, editingMenuId, index, 'effectMedia', m)} onClear={() => updateMenuData(editingMenuCharId, editingMenuId, index, 'effectMedia', null)} minimal />
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                            <input type="text" value={item.desc} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'desc', e.target.value)} className="col-span-1 bg-gray-900 border border-gray-600 text-white px-2 py-1" placeholder="系统提示信息..."/>
                            <div>
                              <select value={item.subMenu} onChange={(e) => updateMenuData(editingMenuCharId, editingMenuId, index, 'subMenu', e.target.value)} className="w-full bg-gray-900 border border-gray-600 text-yellow-200 p-1 outline-none">
                                <option value="none">无路由跳转</option>
                                <option value="main">路由至主交互</option>
                                <option value="skills">路由至技能组</option>
                                <option value="items">路由至物品组</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button onClick={addMenuItem} className="w-full py-2 bg-gray-800 border-2 border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center justify-center gap-2 rounded text-xs">
                        分配新节点
                      </button>
                    </div>
                  </div>
                )}

                {panelTab === 'save' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-indigo-900/40 border border-indigo-700 p-3 rounded space-y-2">
                       <h3 className="text-indigo-300 font-bold text-sm flex items-center gap-1"><FolderOpen size={16}/> 本地资源 IO</h3>
                       <p className="text-[10px] text-gray-400">调用 Electron 原生模块解析本地文件节点。此功能依赖主进程通讯。</p>
                       <button onClick={async () => { await ElectronBridge.importLocalFolder(); }} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-xs transition-colors flex justify-center items-center gap-2">
                         <FolderOpen size={14}/> 挂载本地资源库
                       </button>
                    </div>

                    <div className="space-y-3">
                       <h3 className="text-white border-b border-gray-700 pb-1 font-bold text-xs flex items-center gap-1"><Save size={14}/> 存储阵列</h3>
                       {[1, 2, 3].map(slot => {
                         const hasSave = savedSlots.includes(slot);
                         return (
                           <div key={slot} className={`p-3 rounded border flex justify-between items-center ${hasSave ? 'bg-gray-800 border-green-700' : 'bg-gray-900 border-gray-700'}`}>
                              <div className="font-bold text-sm">扇区 {slot} {hasSave && <span className="text-green-500 text-[10px] ml-2">占用</span>}</div>
                              <div className="flex gap-2">
                                <button onClick={()=>handleSaveToStore(slot)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 text-xs rounded shadow transition-colors">写入</button>
                                {hasSave && <button onClick={()=>handleLoadFromStore(slot)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 text-xs rounded shadow transition-colors">加载</button>}
                              </div>
                           </div>
                         )
                       })}
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