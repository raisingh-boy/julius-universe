import React, { useState } from 'react';
import { SomaticNode, Domain } from '../types';
import { 
  X, Sparkles, AlertCircle, Plus, ChevronRight, Check,
  BookOpen, HelpCircle, Network, Eye 
} from 'lucide-react';

interface AddSenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  allNodes: SomaticNode[];
  language: 'ru' | 'en';
  onAddObservation: (obs: { name: string; text: string; domain: Domain; linkToId?: string; isPrivate?: boolean }) => void;
  onAddConnection: (conn: { sourceId: string; targetId: string; text: string }) => void;
  onAddAgendaQuestion: (q: { text: string; domains: Domain[] }) => void;
  onAddGlobalStory: (story: { nodeId: string; text: string }) => void;
}

const DOMAIN_OPTIONS: { value: Domain; labelRu: string; labelEn: string; color: string }[] = [
  { value: 'body', labelRu: 'Тело / Соматика', labelEn: 'Body / Somatics', color: '#E8A95C' },
  { value: 'science', labelRu: 'Наука / Физика', labelEn: 'Science / Physics', color: '#5C9BE8' },
  { value: 'philosophy', labelRu: 'Философия / Мышление', labelEn: 'Philosophy / Mind', color: '#9B5CE8' },
  { value: 'movement', labelRu: 'Движение / Практика', labelEn: 'Movement / Practice', color: '#5CE87A' },
  { value: 'cognition', labelRu: 'Язык / Когниция', labelEn: 'Language / Cognition', color: '#EAEAEA' },
  { value: 'hybrid', labelRu: 'Пересечение (Гибрид)', labelEn: 'Hybrid / Intersection', color: '#E85C7A' }
];

export default function AddSenseModal({
  isOpen,
  onClose,
  allNodes,
  language,
  onAddObservation,
  onAddConnection,
  onAddAgendaQuestion,
  onAddGlobalStory
}: AddSenseModalProps) {
  const [activeTab, setActiveTab] = useState<'observation' | 'connection' | 'agenda' | 'story'>('observation');
  
  // Animation state triggers
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);

  // Form 1: Observation
  const [obsName, setObsName] = useState('');
  const [obsText, setObsText] = useState('');
  const [obsDomain, setObsDomain] = useState<Domain>('body');
  const [obsTargetNodeId, setObsTargetNodeId] = useState('');
  const [isPrivateObs, setIsPrivateObs] = useState(false);

  // Form 2: Connection
  const [connSourceId, setConnSourceId] = useState('');
  const [connTargetId, setConnTargetId] = useState('');
  const [connText, setConnText] = useState('');

  // Form 3: Agenda Question
  const [agendaQuestionText, setAgendaQuestionText] = useState('');
  const [agendaSelectedDomains, setAgendaSelectedDomains] = useState<Domain[]>([]);

  // Form 4: Narrative
  const [storyNodeId, setStoryNodeId] = useState('');
  const [storyText, setStoryText] = useState('');

  if (!isOpen && !showNotification) return null;

  const triggerAscendAnimation = (submitCallback: () => void) => {
    setIsFlying(true);
    
    // Play sound simulation and let the spore float off-screen
    setTimeout(() => {
      submitCallback();
      setIsFlying(false);
      setShowNotification(true);
      
      // Clear forms
      setObsName(''); setObsText(''); setObsTargetNodeId('');
      setConnSourceId(''); setConnTargetId(''); setConnText('');
      setAgendaQuestionText(''); setAgendaSelectedDomains([]);
      setStoryNodeId(''); setStoryText('');

      // Auto close success notification after 3.2 seconds
      setTimeout(() => {
        setShowNotification(false);
        onClose();
      }, 3200);
    }, 1500); // 1.5 seconds flying animation duration
  };

  const handleObservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsName.trim() || !obsText.trim()) return;

    triggerAscendAnimation(() => {
      onAddObservation({
        name: obsName,
        text: obsText,
        domain: obsDomain,
        linkToId: obsTargetNodeId || undefined,
        isPrivate: isPrivateObs
      });
      setIsPrivateObs(false);
    });
  };

  const handleConnectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connSourceId || !connTargetId || !connText.trim()) return;

    triggerAscendAnimation(() => {
      onAddConnection({
        sourceId: connSourceId,
        targetId: connTargetId,
        text: connText
      });
    });
  };

  const handleAgendaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaQuestionText.trim() || agendaSelectedDomains.length === 0) return;

    triggerAscendAnimation(() => {
      onAddAgendaQuestion({
        text: agendaQuestionText,
        domains: agendaSelectedDomains
      });
    });
  };

  const handleStorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyNodeId || !storyText.trim()) return;

    triggerAscendAnimation(() => {
      onAddGlobalStory({
        nodeId: storyNodeId,
        text: storyText
      });
    });
  };

  const toggleAgendaDomain = (dom: Domain) => {
    if (agendaSelectedDomains.includes(dom)) {
      setAgendaSelectedDomains(prev => prev.filter(d => d !== dom));
    } else {
      setAgendaSelectedDomains(prev => [...prev, dom]);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#04060A]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto select-none">
      
      {/* SUCCESS FLYING SPARK BEACON PARTICLE (Visual flight requirement) */}
      {isFlying && (
        <div className="absolute inset-0 z-55 flex flex-col items-center justify-center pointer-events-none">
          {/* Spore dot rising higher */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-300 via-indigo-400 to-emerald-400 animate-ascend shadow-[0_0_40px_rgba(250,204,21,1)]"></div>
          <div className="absolute mt-24 text-xs font-mono text-[#DFB757] tracking-widest uppercase animate-pulse">
            {language === 'ru' ? 'Смысл улетает в Поле...' : 'Meaning ascending to Field...'}
          </div>
        </div>
      )}

      {/* FLOAT NOTIFICATION ALERT */}
      {showNotification && (
        <div className="max-w-md w-full bg-[#0E1528] border-2 border-emerald-500/50 p-6 rounded-3xl text-center shadow-2xl animate-fade-in z-55">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7" />
          </div>
          <p className="text-base font-bold text-white tracking-tight">
            {language === 'ru' ? 'Связь Зарегистрирована!' : 'Soma Integration Complete!'}
          </p>
          <p className="text-xs text-gray-400 font-sans mt-2 Leading-relaxed">
            {language === 'ru' 
              ? 'Ваше наблюдение теперь успешно живёт и пульсирует в Поле смыслов.' 
              : 'Your custom somatic seed is now successfully alive, breathing and pulsing in the Field of Meaning.'}
          </p>
        </div>
      )}

      {/* PRIMARY FORM BODY */}
      {!isFlying && !showNotification && (
        <div 
          className="relative max-w-lg w-full bg-[#080D16]/95 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
          id="add-sense-card"
        >
          {/* Close trigger */}
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white font-sans tracking-tight">
              {language === 'ru' ? 'ДОБАВИТЬ СМЫСЛ В МИЦЕЛИЙ' : 'SEED NEW SOMATIC SYNAPSE'}
            </h2>
          </div>

          <p className="text-xs text-gray-400 leading-normal mb-5">
            {language === 'ru' 
              ? 'Каждая идея рождается как Семя, укореняется резонансом сообщества и восходит в проверенный Атлас.' 
              : 'Every concept originates here as a tiny Seed. Resonance feeds its cellular weight, culminating in final verification.'}
          </p>

          {/* Sub Categories Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#06090F] rounded-xl border border-white/5 text-[9px] font-mono tracking-wider text-center shrink-0 mb-5">
            <button
              onClick={() => setActiveTab('observation')}
              className={`py-2 rounded-lg transition-all font-bold cursor-pointer flex flex-col items-center justify-center gap-1 ${
                activeTab === 'observation' ? 'bg-[#DFB757] text-black font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{language === 'ru' ? 'НАБЛЮДЕНИЕ' : 'OBSERVE'}</span>
            </button>
            <button
              onClick={() => setActiveTab('connection')}
              className={`py-2 rounded-lg transition-all font-bold cursor-pointer flex flex-col items-center justify-center gap-1 ${
                activeTab === 'connection' ? 'bg-[#DFB757] text-black font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>{language === 'ru' ? 'ПЕРЕСЕЧЕНИЕ' : 'LINK'}</span>
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              className={`py-2 rounded-lg transition-all font-bold cursor-pointer flex flex-col items-center justify-center gap-1 ${
                activeTab === 'agenda' ? 'bg-[#DFB757] text-black font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{language === 'ru' ? 'ПОВЕСТКА' : 'INQUIRE'}</span>
            </button>
            <button
              onClick={() => setActiveTab('story')}
              className={`py-2 rounded-lg transition-all font-bold cursor-pointer flex flex-col items-center justify-center gap-1 ${
                activeTab === 'story' ? 'bg-[#DFB757] text-black font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{language === 'ru' ? 'ИСТОРИЯ' : 'NARRATE'}</span>
            </button>
          </div>

          {/* SCROLLABLE INPUT ZONE */}
          <div className="flex-1 overflow-y-auto pr-1">

            {/* ① OBSERVATION FORM */}
            {activeTab === 'observation' && (
              <form onSubmit={handleObservationSubmit} className="space-y-4 animate-fade-in text-xs">
                {/* Domain Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-gray-500">
                    {language === 'ru' ? 'ДОМЕН СОМАТИКИ (ОБЯЗАТЕЛЬНО):' : 'SOMATIC DISCIPLINE DOMAIN:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DOMAIN_OPTIONS.map(opt => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setObsDomain(opt.value)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                          obsDomain === opt.value 
                            ? 'bg-white/5 text-white font-semibold' 
                            : 'bg-transparent border-white/5 text-gray-400 hover:text-white'
                        }`}
                        style={{ borderLeftColor: obsDomain === opt.value ? opt.color : 'rgba(255,255,255,0.05)', borderLeftWidth: obsDomain === opt.value ? '4px' : '1px' }}
                      >
                        <span>{language === 'ru' ? opt.labelRu : opt.labelEn}</span>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: opt.color }}></span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Proposed Title name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-gray-500">
                    {language === 'ru' ? 'ПРЕДЛАГАЕМОЕ НАЗВАНИЕ НОДЫ:' : 'PROPOSED NODE IDENTIFIER:'}
                  </label>
                  <input
                    type="text"
                    value={obsName}
                    onChange={(e) => setObsName(e.target.value)}
                    placeholder={language === 'ru' ? 'Например: Дыхание костями пальцев' : 'e.g.: Inner Bone Friction Waves'}
                    className="w-full bg-[#06090F] border border-white/10 p-3 rounded-xl focus:outline-none focus:border-[#DFB757] text-white"
                    required
                  />
                </div>

                {/* Scope descriptor text */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-gray-500">
                    {language === 'ru' ? 'ОПИСАНИЕ НАБЛЮДЕНИЯ (3-6 ПРЕДЛОЖЕНИЙ):' : 'SOMATIC DIGEST (3-6 SENTENCES):'}
                  </label>
                  <textarea
                    value={obsText}
                    onChange={(e) => setObsText(e.target.value)}
                    placeholder={language === 'ru' ? 'Я заметил в своей клинической практике, что...' : 'I have observed that structural patterns of gravity alignment...'}
                    rows={4}
                    className="w-full bg-[#06090F] border border-white/10 p-3 rounded-xl focus:outline-none focus:border-[#DFB757] text-white font-sans"
                    required
                  />
                </div>

                {/* Attachment Link */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-gray-500">
                    {language === 'ru' ? 'ПРИВЯЗКА К СУЩЕСТВУЮЩЕЙ НОДЕ (ОПЦИОНАЛЬНО):' : 'CONNECT TO OTHER PRIMITIVE (OPTIONAL):'}
                  </label>
                  <select
                    value={obsTargetNodeId}
                    onChange={(e) => setObsTargetNodeId(e.target.value)}
                    className="w-full bg-[#06090F] border border-white/10 p-3 rounded-xl focus:outline-none focus:border-[#DFB757] text-white"
                  >
                    <option value="">{language === 'ru' ? '-- Нет --' : '-- None --'}</option>
                    {allNodes.map(n => (
                      <option key={n.id} value={n.id}>{language === 'ru' ? n.nameRu : n.nameEn}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivateObs}
                    onChange={() => setIsPrivateObs(!isPrivateObs)}
                    className="accent-[#DFB757] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-gray-300">
                    {language === 'ru'
                      ? '🔒 Приватное — только в моём мире, не в Поле'
                      : '🔒 Private — only in my universe, not in Field'}
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 via-indigo-600 to-emerald-500 py-3.5 rounded-xl text-white font-bold hover:opacity-95 transition-all text-center border border-white/10 cursor-pointer active:scale-[0.99]"
                >
                  {language === 'ru' ? 'ОПУБЛИКОВАТЬ НАБЛЮДЕНИЕ ✨' : 'ASCEND OBSERVATION SPORE ✨'}
                </button>
              </form>
            )}

            {/* ② CONNECTION FORM */}
            {activeTab === 'connection' && (
              <form onSubmit={handleConnectionSubmit} className="space-y-4 animate-fade-in text-xs">
                <p className="p-3 bg-indigo-500/15 border border-indigo-500/25 rounded-xl text-indigo-300">
                  {language === 'ru' 
                    ? 'Построение связей (рёбер) — самое ценное действие платформы. Вы связываете две далёкие идеи мостом!' 
                    : 'Constructing bridging links between disparate nodes is extremely valued. Prove the pattern that connects!'}
                </p>

                {/* Source Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-gray-500">
                    {language === 'ru' ? 'ИСХОДНАЯ НОДА А:' : 'SOURCE CONCEPT A:'}
                  </label>
                  <select
                    value={connSourceId}
                    onChange={(e) => setConnSourceId(e.target.value)}
                    className="w-full bg-[#06090F] border border-white/10 p-3 rounded-xl focus:outline-none"
                    required
                  >
                    <option value="">{language === 'ru' ? '-- Выберите ноду --' : '-- Choose first --'}</option>
                    {allNodes.map(n => (
                      <option key={n.id} value={n.id}>{language === 'ru' ? n.nameRu : n.nameEn}</option>
                    ))}
                  </select>
                </div>

                {/* Target Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-gray-500">
                    {language === 'ru' ? 'ВТОРАЯ НОДА Б:' : 'TARGET CONCEPT B:'}
                  </label>
                  <select
                    value={connTargetId}
                    onChange={(e) => setConnTargetId(e.target.value)}
                    className="w-full bg-[#06090F] border border-white/10 p-3 rounded-xl focus:outline-none"
                    required
                  >
                    <option value="">{language === 'ru' ? '-- Выберите ноду --' : '-- Choose second --'}</option>
                    {allNodes
                      .filter(n => n.id !== connSourceId)
                      .map(n => (
                        <option key={n.id} value={n.id}>{language === 'ru' ? n.nameRu : n.nameEn}</option>
                      ))
                    }
                  </select>
                </div>

                {/* Explanation */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-gray-500">
                    {language === 'ru' ? 'ПОЧЕМУ ОНИ СВЯЗАНЫ? ОБОСНОВАНИЕ:' : 'STATION LOGIC (NARRATE RELATION):'}
                  </label>
                  <textarea
                    value={connText}
                    onChange={(e) => setConnText(e.target.value)}
                    placeholder={language === 'ru' ? 'Опишите невидимое пересечение...' : 'Explain why this bridge makes somatic and structural sense...'}
                    rows={4}
                    className="w-full bg-[#06090F] border border-white/10 p-3 rounded-xl focus:outline-none focus:border-[#DFB757] text-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-indigo-600 py-3.5 rounded-xl text-white font-bold hover:opacity-95 transition-all text-center border border-white/10 cursor-pointer active:scale-[0.99]"
                >
                  {language === 'ru' ? 'СОЕДИНИТЬ МОСТОМ ⟷' : 'FORGE CONSTELLATION LINK ⟷'}
                </button>
              </form>
            )}

            {/* ③ AGENDA QUESTION FORM */}
            {activeTab === 'agenda' && (
              <form onSubmit={handleAgendaSubmit} className="space-y-4 animate-fade-in text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-gray-500">
                    {language === 'ru' ? 'ОТКРЫТЫЙ ВОПРОС НА ПОВЕСТКУ:' : 'OPEN COLLABORATIVE ENQUIRY QUEST:'}
                  </label>
                  <textarea
                    value={agendaQuestionText}
                    onChange={(e) => setAgendaQuestionText(e.target.value)}
                    placeholder={language === 'ru' ? 'Например: Как тело проживает сопротивление властным структурам?' : 'e.g., How does somatic fascial tension change in physical protests?'}
                    rows={3}
                    className="w-full bg-[#06090F] border border-white/10 p-3 rounded-xl focus:outline-none focus:border-[#DFB757] text-white"
                    required
                  />
                </div>

                {/* Multi domain flags */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-gray-500">
                    {language === 'ru' ? 'ОТМЕТЬТЕ ОТНОСЯЩИЕСЯ ОТРЯДЫ СМЫСЛОВ (МНОЖЕСТВЕННО):' : 'AFFECTED CATEGORIES (MULTI-CHOICE):'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DOMAIN_OPTIONS.map(opt => {
                      const isSelected = agendaSelectedDomains.includes(opt.value);
                      return (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => toggleAgendaDomain(opt.value)}
                          className={`px-3 py-1.5 text-[10px] font-semibold border rounded-lg transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-white/5 border-white text-white shadow-xl' 
                              : 'bg-transparent border-white/5 text-gray-500 hover:text-white'
                          }`}
                        >
                          {language === 'ru' ? opt.labelRu : opt.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-700 py-3.5 rounded-xl text-white font-bold hover:opacity-95 transition-all text-center border border-white/10 cursor-pointer active:scale-[0.99]"
                >
                  {language === 'ru' ? 'ПОСТАВИТЬ ВОПРОС ?' : 'LAUCH QUESTION QUEST ?'}
                </button>
              </form>
            )}

            {/* ④ NARRATIVE STORY */}
            {activeTab === 'story' && (
              <form onSubmit={handleStorySubmit} className="space-y-4 animate-fade-in text-xs">
                {/* Select target node */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-gray-500">
                    {language === 'ru' ? 'ВЫБЕРИТЕ СУЩЕСТВУЮЩУЮ НОДУ АТЛАСА/ПОЛЯ:' : 'SELECT ANCHOR CONCEPT CELL:'}
                  </label>
                  <select
                    value={storyNodeId}
                    onChange={(e) => setStoryNodeId(e.target.value)}
                    className="w-full bg-[#06090F] border border-white/10 p-3 rounded-xl focus:outline-none"
                    required
                  >
                    <option value="">{language === 'ru' ? '-- Выберите ноду --' : '-- Choose node --'}</option>
                    {allNodes.map(n => (
                      <option key={n.id} value={n.id}>{language === 'ru' ? n.nameRu : n.nameEn}</option>
                    ))}
                  </select>
                </div>

                {/* Narrative text */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-gray-500">
                    {language === 'ru' ? 'ТЕКСТ ИСТОРИИ («ВЫ ЗНАЕТЕ, ЧТО...»):' : 'ANECDOTIC NARRATIVE ("DO YOU KNOW THAT..."):'}
                  </label>
                  <textarea
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder={language === 'ru' ? 'Моше Фельденкрайз разрабатывал свой метод параллельно с...' : 'Steve Paxton formulation of falling vectors coincided with...'}
                    rows={5}
                    className="w-full bg-[#06090F] border border-white/10 p-3 rounded-xl focus:outline-none focus:border-[#DFB757] text-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 py-3.5 rounded-xl text-white font-bold hover:opacity-95 transition-all text-center border border-white/10 cursor-pointer active:scale-[0.99]"
                >
                  {language === 'ru' ? 'ОПУБЛИКОВАТЬ ИСТОРИЮ + ' : 'APPEND NARRATIVE + '}
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
