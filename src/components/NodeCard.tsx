import React, { useState } from 'react';
import { SomaticNode, SomaticLink, Story, Domain, NodeStatus } from '../types';
import { ALL_STORIES, INITIAL_LINKS, SAMPLE_AUDIO } from '../data/nodesData';
import { 
  X, Heart, Share2, Link2, BookOpen, MapPin, 
  Play, Pause, Award, User, HelpCircle, Flame, Plus, Check, FileText 
} from 'lucide-react';

interface NodeCardProps {
  node: SomaticNode | null;
  allNodes: SomaticNode[];
  onClose: () => void;
  language: 'ru' | 'en';
  onSelectNode: (node: SomaticNode) => void;
  onResonate: (nodeId: string) => void;
  onConnectNodes: (sourceId: string, targetId: string) => void;
  onCarryOver: (nodeId: string) => void;
  onAddStory: (nodeId: string, text: string) => void;
  onPlayAudio?: (nodeId: string) => void;
  playingNodeId?: string | null;
  allStories?: Story[];
  links?: SomaticLink[];
}

const DOMAIN_STYLES: Record<Domain, { color: string; bg: string; border: string; text: string }> = {
  body: { color: '#E8A95C', bg: 'bg-[#E8A95C]/10', border: 'border-[#E8A95C]/20', text: 'text-[#E8A95C]' },
  science: { color: '#5C9BE8', bg: 'bg-[#5C9BE8]/10', border: 'border-[#5C9BE8]/20', text: 'text-[#5C9BE8]' },
  philosophy: { color: '#9B5CE8', bg: 'bg-[#9B5CE8]/10', border: 'border-[#9B5CE8]/20', text: 'text-[#9B5CE8]' },
  movement: { color: '#5CE87A', bg: 'bg-[#5CE87A]/10', border: 'border-[#5CE87A]/20', text: 'text-[#5CE87A]' },
  cognition: { color: '#EAEAEA', bg: 'bg-white/5', border: 'border-white/10', text: 'text-white' },
  hybrid: { color: '#E85C7A', bg: 'bg-[#E85C7A]/10', border: 'border-[#E85C7A]/20', text: 'text-[#E85C7A]' }
};

const STATUS_LABELS = {
  ru: {
    seed: 'Семя (Поле)',
    sprout: 'Росток (Поле)',
    alive: 'Живая нода',
    rooted: 'Укоренившаяся',
    atlas: 'Атлас (Верифицировано)'
  },
  en: {
    seed: 'Seed (Field)',
    sprout: 'Sprout (Field)',
    alive: 'Active Cell',
    rooted: 'Rooted Node',
    atlas: 'Atlas Approved'
  }
};

const NODE_TYPE_LABELS: Record<string, { ru: string; en: string }> = {
  concept: { ru: 'Теоретический концепт', en: 'Theoretical Concept' },
  practice: { ru: 'Практический метод', en: 'Practical Method' },
  person: { ru: 'Деятель / Деятельница', en: 'Historical Figure' },
  movement: { ru: 'Техника движения', en: 'Movement Technique' },
  event: { ru: 'Школа / Событие', en: 'Movement / Historical Event' },
  observation: { ru: 'Наблюдение', en: 'Observation' },
  question: { ru: 'Вопрос повестки', en: 'Agenda Question' }
};

export default function NodeCard({
  node,
  allNodes,
  onClose,
  language,
  onSelectNode,
  onResonate,
  onConnectNodes,
  onCarryOver,
  onAddStory,
  onPlayAudio,
  playingNodeId,
  allStories,
  links
}: NodeCardProps) {
  const [activeTab, setActiveTab] = useState<'essence' | 'stories' | 'minimap' | 'materials'>('essence');
  const [isConnectingMode, setIsConnectingMode] = useState<boolean>(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [newStoryText, setNewStoryText] = useState<string>('');
  const [showAddStoryForm, setShowAddStoryForm] = useState<boolean>(false);
  const [hasResonated, setHasResonated] = useState<boolean>(false);
  const [hasCarried, setHasCarried] = useState<boolean>(false);

  if (!node) return null;

  const style = DOMAIN_STYLES[node.domain] || DOMAIN_STYLES.hybrid;

  // Determine scoring and progression metrics for field nodes
  const nextStatusLabel = () => {
    if (node.status === 'atlas') return '';
    if (node.resonances < 10) return language === 'ru' ? 'до статуса Росток: 10 р.' : 'to Sprout: 10 r.';
    if (node.resonances < 50) return language === 'ru' ? 'до статуса Живая: 50 р.' : 'to Active: 50 r.';
    if (node.resonances < 100) return language === 'ru' ? 'до Укоренения: 100 р.' : 'to Rooted: 100 r.';
    return language === 'ru' ? 'готово к восхождению в Атлас' : 'Ready for Atlas Ascension';
  };

  const getProgressionPercent = () => {
    if (node.status === 'atlas') return 100;
    if (node.resonances >= 100) return 95;
    return Math.min(100, Math.max(10, (node.resonances / 100) * 100));
  };

  // Find linked neighbor nodes dynamically from actual links
  const getLinkedNodes = () => {
    const activeLinks = links || INITIAL_LINKS;
    const connected = allNodes.filter(n => {
      if (n.id === node.id) return false;
      return activeLinks.some(l => 
        (l.source === node.id && l.target === n.id) || 
        (l.target === node.id && l.source === n.id)
      );
    });
    
    // fallback to peers of same domain
    return connected.length > 0 
      ? connected.slice(0, 5) 
      : allNodes.filter(n => n.id !== node.id && n.domain === node.domain).slice(0, 4);
  };

  // Gather coupling stories from edges
  const getStoriesForNode = () => {
    const activeLinks = links || INITIAL_LINKS;
    const activeStories = allStories || ALL_STORIES;
    const linkIds = activeLinks.filter(l => l.source === node.id || l.target === node.id).map(l => l.id);
    return activeStories.filter(story => 
      linkIds.includes(story.edgeId) || 
      story.figureA?.toLowerCase().includes(node.id.toLowerCase()) || 
      story.figureB?.toLowerCase().includes(node.id.toLowerCase())
    );
  };

  // Find associated audio guides
  const getAudiosForNode = () => {
    return SAMPLE_AUDIO.filter(track => 
      track.timelineNodes.some(tn => tn.nodeId === node.id)
    );
  };

  const handleResonateClick = () => {
    onResonate(node.id);
    setHasResonated(true);
    setTimeout(() => setHasResonated(false), 2000);
  };

  const handleCarryClick = () => {
    onCarryOver(node.id);
    setHasCarried(true);
    setTimeout(() => setHasCarried(false), 2000);
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) return;
    onConnectNodes(node.id, selectedTargetId);
    setIsConnectingMode(false);
    setSelectedTargetId('');
  };

  const handleStorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryText.trim()) return;
    onAddStory(node.id, newStoryText.trim());
    setNewStoryText('');
    setShowAddStoryForm(false);
  };

  const linkedNeighbors = getLinkedNodes();
  const matchedStories = getStoriesForNode();
  const matchedAudios = getAudiosForNode();

  return (
    <div 
      className="fixed md:top-24 top-auto bottom-0 right-0 md:w-[460px] w-full md:h-[calc(100vh-120px)] h-[82vh] bg-[#090D16]/95 border-t md:border-t-0 md:border-l border-white/10 backdrop-blur-md text-gray-200 z-40 shadow-2xl flex flex-col overflow-hidden animate-slide-in rounded-t-3xl md:rounded-t-none"
      id="somatic-node-board"
    >
      {/* Drawer Header Drag Handle (visual touch for mobile) */}
      <div className="md:hidden w-12 h-1 bg-white/20 mx-auto my-3 rounded-full shrink-0"></div>

      {/* Primary Header Section */}
      <div className="p-5 pb-4 border-b border-white/5 relative bg-[#0C1220]/75 shrink-0">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg active:scale-95 transition-all cursor-pointer"
          id="close-card-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Domain Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase ${style.bg} ${style.border} ${style.text}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {node.domain.toUpperCase()}
          </span>
          
          <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-mono border border-white/5 text-gray-400 uppercase">
            {node.level?.toUpperCase() || 'MESO'}
          </span>
        </div>

        {/* Real-time title of Node */}
        <h2 className="text-xl font-bold font-sans tracking-tight text-white mb-1 pr-8">
          {language === 'ru' ? node.nameRu : node.nameEn}
        </h2>

        {/* Context metadata details */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 font-mono mb-3">
          {node.authorRu && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 opacity-60 text-amber-400" />
              {language === 'ru' ? node.authorRu : node.authorEn}
            </span>
          )}
          {node.epochRu && (
            <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px]">
              {language === 'ru' ? node.epochRu : node.epochEn}
            </span>
          )}
          {node.addedBy && (
            <span className="text-gray-500">
              {language === 'ru' ? `Добавил: ${node.addedBy}` : `Added by: ${node.addedBy}`}
            </span>
          )}
          <span className="flex items-center gap-1 text-purple-400">
            <Flame className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            {node.resonances} {language === 'ru' ? 'резонансов' : 'resonances'}
          </span>
        </div>

        {/* Evolution Status and Metrics Bar */}
        <div className="bg-white/5 rounded-lg p-2.5 border border-white/5 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-sans flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              {STATUS_LABELS[language][node.status]}
            </span>
            <span className="text-[10px] text-gray-500 font-mono">{nextStatusLabel()}</span>
          </div>
          {node.status !== 'atlas' && (
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 via-indigo-400 to-emerald-400 h-full transition-all duration-1000"
                style={{ width: `${getProgressionPercent()}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Tabs navigation panel */}
      <div className="flex bg-[#070B13] border-b border-white/5 text-[10px] font-mono tracking-wider shrink-0 divide-x divide-white/5">
        <button 
          onClick={() => setActiveTab('essence')}
          className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer uppercase ${
            activeTab === 'essence' ? 'border-[#DFB757] text-[#DFB757] bg-white/5 font-bold' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {language === 'ru' ? 'Суть' : 'Essence'}
        </button>
        <button 
          onClick={() => setActiveTab('stories')}
          className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer uppercase ${
            activeTab === 'stories' ? 'border-[#DFB757] text-[#DFB757] bg-white/5 font-bold' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {language === 'ru' ? 'Истории' : 'Narratives'}
        </button>
        <button 
          onClick={() => setActiveTab('minimap')}
          className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer uppercase ${
            activeTab === 'minimap' ? 'border-[#DFB757] text-[#DFB757] bg-white/5 font-bold' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {language === 'ru' ? 'Карта' : 'Lattice'}
        </button>
        <button 
          onClick={() => setActiveTab('materials')}
          className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer uppercase ${
            activeTab === 'materials' ? 'border-[#DFB757] text-[#DFB757] bg-white/5 font-bold' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {language === 'ru' ? 'Материалы' : 'Data'}
        </button>
      </div>

      {/* Scrollable Tabs Viewport */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#060910]">
        
        {/* TAB 1: ESSENCE (СУТЬ) */}
        {activeTab === 'essence' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* The semantic digest */}
            <div className="bg-[#0C1220]/50 border border-white/5 p-4 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#DFB757]"></div>
              
              <div className="text-[10px] font-mono text-[#DFB757] mb-2 uppercase tracking-widest">
                {language === 'ru' ? 'КАТЕГОРИЗАЦИЯ УЗЛА:' : 'NODE ATTRIBUTES:'}
              </div>
              <p className="text-xs text-gray-400 font-mono mb-3 uppercase">
                {language === 'ru' ? 'Тип:' : 'Type:'} {NODE_TYPE_LABELS[node.type || 'concept'][language]}
              </p>

              <p className="text-sm font-sans text-gray-300 leading-relaxed italic border-t border-white/5 pt-3">
                "{language === 'ru' ? node.descriptionRu : node.descriptionEn}"
              </p>
            </div>

            {/* Clickable links topology references */}
            <div>
              <h4 className="text-[10px] font-mono tracking-widest text-[#DFB757] uppercase mb-2.5">
                {language === 'ru' ? 'БЛИЖАЙШИЕ ПЕРЕСЕЧЕНИЯ:' : 'CONNECTED CORRELATIONS:'}
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {linkedNeighbors.map(neighbor => {
                  return (
                    <button
                      key={neighbor.id}
                      onClick={() => onSelectNode(neighbor)}
                      className="w-full text-left p-2.5 bg-white/5 border border-white/5 hover:border-[#DFB757]/30 hover:bg-[#DFB757]/5 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DOMAIN_STYLES[neighbor.domain].color }} />
                        <span className="font-sans text-gray-300 group-hover:text-white transition-colors">
                          {language === 'ru' ? neighbor.nameRu : neighbor.nameEn}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                        <Link2 className="w-3 h-3 group-hover:text-white transition-colors" />
                        {neighbor.resonances}
                      </span>
                    </button>
                  );
                })}
                {linkedNeighbors.length === 0 && (
                  <p className="text-xs text-gray-500 font-mono">
                    {language === 'ru' ? 'Связей пока нет. Постройте первую!' : 'No links established yet. Create some!'}
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic visual node details card helper info */}
            <div className="bg-white/5 border border-white/5 p-3.5 rounded-xl flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-400 space-y-1 leading-relaxed">
                <p className="font-sans font-semibold text-white">
                  {language === 'ru' ? 'Как устроен Атлас?' : 'What is the Atlas?'}
                </p>
                <p>
                  {language === 'ru' 
                    ? 'Атлас хранит проверенное годами ручное знание. Пользовательские ноды в «Поле» эволюционируют укоренением за счёт ваших резонансов и растут в Атлас!'
                    : 'The Atlas stands for verified systemic somatic knowledge. User nodes proposed in the "Field" can blossom into full Atlas recognition once and for all!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STORIES (ИСТОРИИ) */}
        {activeTab === 'stories' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono tracking-widest text-[#DFB757] uppercase">
                {language === 'ru' ? 'ИСТОРИИ И СОЧЕТАНИЯ СВЯЗЕЙ:' : 'HISTORICAL COUPLING NARRATIVES:'}
              </h4>
              <button 
                onClick={() => setShowAddStoryForm(!showAddStoryForm)}
                className="text-xs font-mono text-indigo-400 hover:text-white flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {language === 'ru' ? 'Добавить историю' : 'Add Narrative'}
              </button>
            </div>

            {/* Story input form overlay inside cards */}
            {showAddStoryForm && (
              <form onSubmit={handleStorySubmit} className="bg-white/5 border border-white/10 p-3.5 rounded-xl flex flex-col gap-2 animate-fade-in">
                <p className="text-xs text-[#DFB757] font-mono">
                  {language === 'ru' ? 'РАССКАЖИТЕ НЕОБЫЧНЫЙ СИНТЕЗ СМЫСЛОВ:' : 'SHARE THE ANECDOTE LINK:'}
                </p>
                <textarea
                  value={newStoryText}
                  onChange={(e) => setNewStoryText(e.target.value)}
                  placeholder={language === 'ru' ? 'Вы знаете, что метод Фельденкрайза...' : 'Did you know that...'}
                  rows={3}
                  className="w-full text-xs bg-[#070B13] border border-white/10 p-2 rounded-lg text-white focus:outline-none focus:border-[#DFB757]"
                  required
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button 
                    type="button" 
                    onClick={() => setShowAddStoryForm(false)}
                    className="px-2.5 py-1 text-gray-400 hover:text-white cursor-pointer"
                  >
                    {language === 'ru' ? 'Отмена' : 'Cancel'}
                  </button>
                  <button 
                    type="submit" 
                    className="px-3 py-1 bg-indigo-500/80 hover:bg-indigo-600 rounded text-white font-semibold transition-all active:scale-95 cursor-pointer"
                  >
                    {language === 'ru' ? 'Опубликовать' : 'Submit'}
                  </button>
                </div>
              </form>
            )}

            {/* The archive narratives loop */}
            <div className="space-y-3">
              {matchedStories.map((story) => (
                <div key={story.id} className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono border-b border-white/5 pb-1.5">
                    <span className="flex items-center gap-1 uppercase tracking-wide text-indigo-400 font-semibold">
                      {story.titleRu || story.titleEn}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      {story.resonances} {language === 'ru' ? 'раз.' : 'res.'}
                    </span>
                  </div>
                  
                  {story.year && (
                    <span className="text-[10px] text-[#DFB757] font-mono uppercase">
                      {language === 'ru' ? `Эпоха пересечения: ${story.year} г.` : `Union Epoch: ${story.year}`}
                    </span>
                  )}

                  <p className="text-xs text-gray-300 font-sans leading-relaxed">
                    {language === 'ru' ? story.textRu : story.textEn}
                  </p>
                </div>
              ))}

              {matchedStories.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-gray-500 gap-1.5 bg-black/10">
                  <BookOpen className="w-8 h-8 opacity-40 text-[#DFB757]" />
                  <p className="text-xs font-semibold">
                    {language === 'ru' ? 'Историй связи пока нет.' : 'No stories registered.'}
                  </p>
                  <p className="text-[10px] text-gray-500 max-w-[280px]">
                    {language === 'ru' 
                      ? 'В новой архитектуре все соматические истории привязаны к ребрам пересечения концепций. Станьте первым, кто закрепит здесь междисциплинарный синтез!' 
                      : 'Somatic narratives are coupled directly to transdisciplinary edge linkages. Add a beautiful synthesis of concepts below!'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LOCAL GRID NAVIGATION LATTICE MAP (КАРТА) */}
        {activeTab === 'minimap' && (
          <div className="flex flex-col gap-3 animate-fade-in h-[320px]">
            <h4 className="text-[10px] font-mono tracking-widest text-[#DFB757] uppercase">
              {language === 'ru' ? 'ИНТЕРАКТИВНОЕ СОЗВЕЗДИЕ СВЯЗЕЙ (1-й УРОВЕНЬ):' : 'RADIAL INTERACTION CONSTELATION:'}
            </h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
              {language === 'ru' ? 'Паутина прямых соматических отношений. Нажмите на любой спутник, чтобы перенести фокус изучения на его карточку.' : 'Somatic relations immediately surrounding this center point. Tap neighborhood satellites to navigate seamlessly.'}
            </p>

            {/* Interactive local graph container */}
            <div className="relative flex-1 bg-[#060A12] border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
              
              {/* Draw animated circular nodes in a constellation orbiter layout */}
              <div className="absolute w-[220px] h-[220px] border border-white/5 rounded-full animate-spin flex items-center justify-center opacity-30" style={{ animationDuration: '40s' }}>
                <div className="absolute top-0 w-2 h-2 rounded-full bg-indigo-400"></div>
                <div className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-[#E8A95C]"></div>
              </div>

              {/* Central Primary Node */}
              <div className="relative z-10 w-24 h-24 rounded-full border-2 border-[#DFB757] bg-[#0E1528] flex flex-col items-center justify-center p-2 text-center shadow-xl animate-pulse">
                <span className="text-[8px] font-mono text-[#DFB757] mb-1">CENTER</span>
                <span className="text-[10px] font-bold text-white leading-tight line-clamp-2">
                  {language === 'ru' ? node.nameRu.replace(/\(.*\)/, '') : node.nameEn.replace(/\(.*\)/, '')}
                </span>
                <div className="absolute -inset-1 rounded-full border border-dashed border-[#DFB757]/30"></div>
              </div>

              {/* Orbiting related links */}
              {linkedNeighbors.map((neighbor, idx) => {
                const angle = (idx * (Math.PI * 2)) / Math.max(1, linkedNeighbors.length);
                const radius = 95;
                const tx = Math.cos(angle) * radius;
                const ty = Math.sin(angle) * radius;

                return (
                  <button
                    key={neighbor.id}
                    onClick={() => onSelectNode(neighbor)}
                    className="absolute p-2 bg-[#0C1221] hover:bg-white/5 border border-white/10 hover:border-[#DFB757] text-white rounded-xl shadow-lg text-[9px] flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 z-20 text-center w-20 truncate"
                    style={{
                      transform: `translate(${tx}px, ${ty}px)`,
                    }}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full mb-1" 
                      style={{ backgroundColor: DOMAIN_STYLES[neighbor.domain].color }} 
                    />
                    <span className="line-clamp-2 leading-tight">
                      {language === 'ru' ? neighbor.nameRu.replace(/\(.*\)/, '') : neighbor.nameEn.replace(/\(.*\)/, '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: MATERIALS & RESEARCH (МАТЕРИАЛЫ) */}
        {activeTab === 'materials' && (
          <div className="flex flex-col gap-4 animate-fade-in pb-4">
            <h4 className="text-[10px] font-mono tracking-widest text-[#DFB757] uppercase">
              {language === 'ru' ? 'НАУЧНЫЕ ПУБЛИКАЦИИ И СТАТЬИ:' : 'RESEARCH DIGESTS & ARTICLES:'}
            </h4>

            <div className="space-y-3">
              {node.articles?.map((art) => (
                <div key={art.id} className="p-3.5 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-[9px] uppercase tracking-wide">
                      {art.type}
                    </span>
                    {art.year && (
                      <span className="text-[9px] text-gray-500 font-mono">{art.year} г.</span>
                    )}
                  </div>

                  <h5 className="font-sans font-bold text-xs text-white leading-snug">
                    {language === 'ru' ? art.titleRu : art.titleEn}
                  </h5>

                  <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                    {language === 'ru' ? art.summaryRu : art.summaryEn}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 border-t border-white/5 pt-2 mt-1">
                    <span>{art.sourceTitle || 'Database index'}</span>
                    {art.sourceUrl && (
                      <a 
                        href={art.sourceUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-indigo-400 hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        {language === 'ru' ? 'Источник' : 'Source'}
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {(!node.articles || node.articles.length === 0) && (
                <p className="text-xs text-gray-500 font-mono italic">
                  {language === 'ru' ? 'Научных статей пока не занесено.' : 'No scientific publications categorized.'}
                </p>
              )}
            </div>

            {/* Simulated audio guide association */}
            {matchedAudios.length > 0 && (
              <div className="mt-4 border-t border-white/5 pt-4 space-y-2">
                <h4 className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase">
                  {language === 'ru' ? 'СВЯЗАННЫЕ АУДИОМАТЕРИАЛЫ:' : 'RELEVANT AUDIO LECTURES:'}
                </h4>
                {matchedAudios.map(audio => (
                  <div key={audio.id} className="p-3 bg-[#0C1221]/80 rounded-xl border border-white/5 flex items-center justify-between gap-3">
                    <div className="truncate text-xs">
                      <p className="font-semibold text-white truncate">{language === 'ru' ? audio.titleRu : audio.titleEn}</p>
                      <p className="text-[10px] text-gray-500 truncate">{language === 'ru' ? audio.authorRu : audio.authorEn}</p>
                    </div>
                    {onPlayAudio && (
                      <button 
                        onClick={() => onPlayAudio(node.id)}
                        className="px-2.5 py-1 text-[10px] font-bold text-white bg-indigo-500/20 hover:bg-indigo-500 border border-indigo-500/40 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        {language === 'ru' ? 'СТАРТ' : 'LISTEN'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* FIXED action panels always visible at bottom */}
      <div className="p-4 border-t border-white/10 bg-[#0E1424] shrink-0 space-y-3.5">
        
        {/* Toggle dynamic connect modal form */}
        {isConnectingMode && (
          <form onSubmit={handleConnectSubmit} className="bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col gap-2 text-xs">
            <span className="text-[10px] font-mono text-[#DFB757] uppercase block">
              {language === 'ru' ? 'СОБРАТЬ НОВОЕ РЕБРО (УСТАНОВИТЬ СВЯЗЬ):' : 'ESTABLISH NEW SOMATIC CONNECTOR EMBRYO:'}
            </span>
            <div className="flex gap-2">
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 text-white rounded-lg p-1.5 focus:outline-none"
                required
              >
                <option value="">{language === 'ru' ? '-- Выберите ноду --' : '-- Choose target --'}</option>
                {allNodes
                  .filter(n => n.id !== node.id)
                  .map(n => (
                    <option key={n.id} value={n.id}>
                      {language === 'ru' ? n.nameRu : n.nameEn}
                    </option>
                  ))
                }
              </select>
              <button 
                type="submit" 
                className="px-3 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-bold transition-all active:scale-95 cursor-pointer"
              >
                {language === 'ru' ? 'ОК' : 'Connect'}
              </button>
            </div>
          </form>
        )}

        {/* Primary Interactive Somatic Command Pad (♦ Резонирую • ⟷ Связываю • ↗ Несу дальше) */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Action 1: Resonate (Disabled placeholder if historical atlas) */}
          {node.world !== 'atlas' ? (
            <button
              onClick={handleResonateClick}
              className={`py-3 px-2 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1.5 border active:scale-95 cursor-pointer ${
                hasResonated 
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' 
                  : 'bg-white/5 border-white/5 hover:border-rose-500/30 text-gray-300 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasResonated ? 'fill-current animate-ping scale-110' : 'text-rose-400'}`} />
              <span className="font-sans font-bold tracking-tight text-[10px]">
                {hasResonated ? (language === 'ru' ? 'РЕЗОНАНС +1!' : 'RESONATED!') : (language === 'ru' ? '♦ РЕЗОНИРУЮ' : '♦ RESONATE')}
              </span>
            </button>
          ) : (
            <div className="py-3 px-2 rounded-xl border border-white/5 bg-white/5 opacity-40 flex flex-col items-center justify-center gap-1.5 select-none cursor-not-allowed">
              <Heart className="w-4 h-4 text-rose-500/40" />
              <span className="font-sans font-bold text-gray-500 text-[10px] text-center">
                {language === 'ru' ? 'В АТЛАСЕ' : 'IN ATLAS'}
              </span>
            </div>
          )}

          {/* Action 2: Connect */}
          <button
            onClick={() => setIsConnectingMode(!isConnectingMode)}
            className={`py-3 px-2 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1.5 border active:scale-95 cursor-pointer ${
              isConnectingMode 
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' 
                : 'bg-white/5 border-white/5 hover:border-indigo-500/30 text-gray-300 hover:text-white'
            }`}
          >
            <Link2 className="w-4 h-4 text-indigo-400" />
            <span className="font-sans font-bold tracking-tight text-[10px]">
              {language === 'ru' ? '⟷ СВЯЗЫВАЮ' : '⟷ CONNECT'}
            </span>
          </button>

          {/* Action 3: Carry Further / Pocket it (Disabled placeholder if historical atlas) */}
          {node.world !== 'atlas' ? (
            <button
              onClick={handleCarryClick}
              className={`py-3 px-2 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1.5 border active:scale-95 cursor-pointer ${
                hasCarried 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                  : 'bg-white/5 border-white/5 hover:border-emerald-500/30 text-gray-300 hover:text-white'
              }`}
            >
              {hasCarried ? (
                <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
              ) : (
                <Share2 className="w-4 h-4 text-emerald-400" />
              )}
              <span className="font-sans font-bold tracking-tight text-[10px]">
                {hasCarried ? (language === 'ru' ? 'ПРИНЯТО В Я' : 'POCKETED') : (language === 'ru' ? '↗ НЕСУ ДАЛЬШЕ' : '↗ CARRY OVER')}
              </span>
            </button>
          ) : (
            <div className="py-3 px-2 rounded-xl border border-white/5 bg-white/5 opacity-40 flex flex-col items-center justify-center gap-1.5 select-none cursor-not-allowed">
              <Check className="w-4 h-4 text-emerald-500/40" />
              <span className="font-sans font-bold text-gray-500 text-[10px] text-center">
                {language === 'ru' ? 'СОХРАНЕНО' : 'SAVED'}
              </span>
            </div>
          )}
        </div>

        {/* Embedded quick Audio Player Deck (if play support) */}
        {onPlayAudio && (
          <div className="bg-[#070B13] border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-xs transition-all hover:bg-black">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Play className="w-3.5 h-3.5 fill-current" />
              </div>
              <div className="truncate max-w-[200px]">
                <p className="font-semibold text-white leading-normal truncate">
                  {language === 'ru' ? 'Лекционные материалы по ноде' : 'Archive audio lecture materials'}
                </p>
                <p className="text-[10px] text-gray-500">
                  {language === 'ru' ? 'Доступно лекционное сопровождение' : 'Stream high fidelity somatic analysis'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onPlayAudio(node.id)}
              className="px-2.5 py-1 text-[10px] bg-indigo-500 hover:bg-indigo-600 hover:text-white text-white font-bold rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <Play className="w-3 h-3" />
              {language === 'ru' ? 'СЛУШАТЬ' : 'PLAY'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
