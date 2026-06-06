import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  INITIAL_NODES, INITIAL_LINKS, SAMPLE_AUDIO, 
  SAMPLE_AGENDA, INITIAL_NOTIFICATIONS, ALL_STORIES 
} from './data/nodesData';
import { 
  SomaticNode, SomaticLink, World, Domain, NodeStatus,
  UserProfile, ActivityNotification, AgendaQuestion, Story 
} from './types';
import MyceliumGraph from './components/MyceliumGraph';
import NodeCard from './components/NodeCard';
import AudioPlayer from './components/AudioPlayer';
import AddSenseModal from './components/AddSenseModal';
import PhilosophyOnboarding from './components/PhilosophyOnboarding';
import AgendaPanel from './components/AgendaPanel';
import { 
  Search, SlidersHorizontal, Plus, Globe, 
  Volume2, Shield, Calendar, User, Zap, Sparkles, Check, 
  Flame, Bell, BookOpen, KeyRound, RefreshCcw, X 
} from 'lucide-react';

const DOMAIN_DOT_COLORS: Record<Domain, string> = {
  body: 'bg-[#E8A95C]',      // Warm Amber
  science: 'bg-[#5C9BE8]',   // Cold Blue
  philosophy: 'bg-[#9B5CE8]',// Purple
  movement: 'bg-[#5CE87A]',  // Green
  cognition: 'bg-[#EAEAEA]',  // White/Silver
  hybrid: 'bg-[#E85C7A]'     // Red-Rose
};

export default function App() {
  // Global States
  const [language, setLanguage] = useState<'ru' | 'en'>('ru');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  const [currentWorld, setCurrentWorld] = useState<World>('atlas');
  const [userEmail, setUserEmail] = useState<string | null>('botovroman45@gmail.com'); // default logged-in user email

  // Tracking dynamic user highlight states for MyceliumGraph
  const [resonatedNodeIds, setResonatedNodeIds] = useState<Set<string>>(() =>
    new Set(JSON.parse(localStorage.getItem('su_resonated') || '[]'))
  );
  const [carriedNodeIds, setCarriedNodeIds] = useState<Set<string>>(() =>
    new Set(JSON.parse(localStorage.getItem('su_carried') || '[]'))
  );
  const [activeAudioNodeId, setActiveAudioNodeId] = useState<string | null>(null);

  // Elegant floating notification messages (Russia / England responsive translations)
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const calcScore = (n: SomaticNode) =>
    (n.resonances || 0) * 1.0 + (n.connections || 0) * 5.0 + (n.carries || 0) * 3.0;

  const getStatus = (score: number): NodeStatus => {
    if (score >= 100) return 'rooted';
    if (score >= 50)  return 'alive';
    if (score >= 10)  return 'sprout';
    return 'seed';
  };

  const showFlash = (msg: string) => {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(null), 3500);
  };
  
  // Graph & Node collections in State to support full interactivity!
  const [nodes, setNodes] = useState<SomaticNode[]>(INITIAL_NODES);
  const [links, setLinks] = useState<SomaticLink[]>(INITIAL_LINKS);
  const [stories, setStories] = useState<Story[]>(ALL_STORIES);
  const [agendaQuestions, setAgendaQuestions] = useState<AgendaQuestion[]>(SAMPLE_AGENDA);
  const [notifications, setNotifications] = useState<ActivityNotification[]>(INITIAL_NOTIFICATIONS);

  // Focus node card side sheet
  const [selectedNode, setSelectedNode] = useState<SomaticNode | null>(null);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<Domain | 'all'>('all');
  const [selectedEpoch, setSelectedEpoch] = useState<number>(3); // 0: All, 1: Antiquity, 2: 20th Cent, 3: Modern/All
  const [showFiltersShelf, setShowFiltersShelf] = useState<boolean>(false);
  
  // Custom visibility layers state checklist
  const [visibleLayers, setVisibleLayers] = useState<{
    atlas: boolean;
    field: boolean;
    hot: boolean;
    withAudio: boolean;
  }>({
    atlas: true,
    field: true,
    hot: false,
    withAudio: false,
  });

  // Custom interactive overlay name
  const [overlayPersona, setOverlayPersona] = useState<string | null>(null);

  // Modals view states
  const [isAddSenseOpen, setIsAddSenseOpen] = useState<boolean>(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState<boolean>(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [activeAudioTriggerNode, setActiveAudioTriggerNode] = useState<string | null>(null);

  // User Profile Data
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Роман Ботов',
    domains: ['movement', 'philosophy', 'body'],
    sensesAdded: 12,
    storiesWritten: 7,
    nodesMovedToAtlas: 1,
    archetypes: {
      connector: true,   // created connections
      storyteller: true,  // stories written
      resonator: false,
      pioneer: false,
      bridge: true      // across multiple domains
    },
    privacySettings: {
      myGraph: 'public',
      myResonances: 'visible'
    }
  });

  // Calculate dynamic archetypes based on user logs
  const calculateArchetypes = (profile: UserProfile): string[] => {
    const list: string[] = [];
    if (profile.archetypes.connector) list.push(language === 'ru' ? 'CONNECTOR (Связующий)' : 'CONNECTOR (Synapse-Weaver)');
    if (profile.archetypes.storyteller) list.push(language === 'ru' ? 'STORYTELLER (Рассказчик)' : 'STORYTELLER (Narrator)');
    if (profile.archetypes.bridge) list.push(language === 'ru' ? 'BRIDGE (Мост доменов)' : 'BRIDGE (Interdisciplinary)');
    if (profile.archetypes.pioneer) list.push(language === 'ru' ? 'PIONEER (Первопроходец)' : 'PIONEER (Atlas Pioneer)');
    return list;
  };

  // Mutator actions supporting full client-side persistence and response
  const handleAddObservation = (obs: { name: string; text: string; domain: Domain; linkToId?: string; isPrivate?: boolean }) => {
    // Inject node
    const newId = `node-user-${Date.now()}`;
    const newNode: SomaticNode = {
      id: newId,
      nameRu: obs.name,
      nameEn: obs.name,
      type: 'observation',
      level: 'meso',
      domain: obs.domain,
      world: 'field',
      status: 'seed',
      resonances: 1,
      connections: 0,
      carries: 0,
      score: 1,
      descriptionRu: obs.text,
      descriptionEn: obs.text,
      addedBy: userProfile.name,
      lastActiveAt: Date.now(),
      isPrivate: obs.isPrivate || false
    };

    setNodes(prev => [newNode, ...prev]);

    // Attach to existing node if specified
    if (obs.linkToId) {
      const newLnk: SomaticLink = {
        id: `lnk-user-${Date.now()}`,
        source: newId,
        target: obs.linkToId,
        type: 'practical',
        world: 'field',
        resonanceWeight: 2,
        activity: 3
      };
      setLinks(prev => [...prev, newLnk]);
    }

    // Append telemetry log
    const timestamp = new Date().toLocaleTimeString();
    const newLog: ActivityNotification = {
      id: `log-user-${Date.now()}`,
      timestamp,
      textRu: `${userProfile.name} создал новое наблюдение: [${obs.name}] в домене Поля`,
      textEn: `${userProfile.name} seeded custom observation: [${obs.name}] in the Field pool`
    };
    setNotifications(prev => [newLog, ...prev]);

    // Update user stats
    setUserProfile(prev => ({
      ...prev,
      sensesAdded: prev.sensesAdded + 1
    }));

    // Switch perspective based on privacy settings and trigger corresponding localized flash message
    if (obs.isPrivate) {
      setCurrentWorld('me');
      showFlash(language === 'ru'
        ? `🔒 "${obs.name}" добавлено в вашу личную вселенную`
        : `🔒 "${obs.name}" added to your private universe`
      );
    } else {
      setCurrentWorld('field');
      showFlash(language === 'ru'
        ? `✦ "${obs.name}" проросло в Поле как Семя`
        : `✦ "${obs.name}" seeded into the Field`
      );
    }
  };

  const handleAddConnection = (conn: { sourceId: string; targetId: string; text: string }) => {
    // Append link
    const newLnk: SomaticLink = {
      id: `lnk-user-${Date.now()}`,
      source: conn.sourceId,
      target: conn.targetId,
      type: 'practical',
      world: 'field',
      resonanceWeight: 3,
      activity: 5
    };
    
    setLinks(prev => [...prev, newLnk]);

    // Increment connection counts, update scores and statuses of both endpoint nodes
    setNodes(prev => prev.map(n => {
      if (n.id !== conn.sourceId && n.id !== conn.targetId) return n;
      const nextConnections = (n.connections || 0) + 1;
      const newScore = calcScore({ ...n, connections: nextConnections });
      const updated: SomaticNode = {
        ...n,
        connections: nextConnections,
        score: newScore,
        status: n.status === 'atlas' ? 'atlas' : getStatus(newScore),
        lastActiveAt: Date.now()
      };
      if (selectedNode?.id === n.id) {
        setSelectedNode(updated);
      }
      return updated;
    }));

    // Find nodes to generate log descriptors
    const sNode = nodes.find(n => n.id === conn.sourceId);
    const tNode = nodes.find(n => n.id === conn.targetId);
    const sName = sNode ? (language === 'ru' ? sNode.nameRu : sNode.nameEn) : 'A';
    const tName = tNode ? (language === 'ru' ? tNode.nameRu : tNode.nameEn) : 'B';

    const timestamp = new Date().toLocaleTimeString();
    const newLog: ActivityNotification = {
      id: `log-user-${Date.now()}`,
      timestamp,
      textRu: `${userProfile.name} установил перекрестный мост: [${sName}] ↔ [${tName}]`,
      textEn: `${userProfile.name} forged interdisciplinary link: [${sName}] ↔ [${tName}]`
    };
    setNotifications(prev => [newLog, ...prev]);
  };

  const handleAddAgendaQuestion = (q: { text: string; domains: Domain[] }) => {
    const newQ: AgendaQuestion = {
      id: `q-user-${Date.now()}`,
      questionRu: q.text,
      questionEn: q.text,
      domains: q.domains,
      contributorsCount: 1,
      contributors: [{ name: userProfile.name, avatar: userProfile.name[0] }],
      answers: []
    };

    setAgendaQuestions(prev => [newQ, ...prev]);

    const timestamp = new Date().toLocaleTimeString();
    const newLog: ActivityNotification = {
      id: `log-user-${Date.now()}`,
      timestamp,
      textRu: `${userProfile.name} вынес на Повестку вопрос: «${q.text}»`,
      textEn: `${userProfile.name} issued inquiry quest: "${q.text}"`
    };
    setNotifications(prev => [newLog, ...prev]);
  };

  const handleAddGlobalStory = (story: { nodeId: string; text: string }) => {
    // Find or create a link connected to this node
    let activeLink = links.find(l => l.source === story.nodeId || l.target === story.nodeId);
    
    if (!activeLink) {
      // Create a dynamic link in State
      const targetId = 'root'; // fallback target
      const linkId = `lnk-dyn-user-${Date.now()}`;
      const newLnk: SomaticLink = {
        id: linkId,
        source: story.nodeId,
        target: targetId,
        type: 'practical',
        world: 'field',
        resonanceWeight: 3,
        activity: 4,
        storyIds: [],
        createdAt: Date.now()
      };
      setLinks(prev => [...prev, newLnk]);
      activeLink = newLnk;
    }

    const newStory: Story = {
      id: `story-user-${Date.now()}`,
      edgeId: activeLink.id,
      titleRu: 'История взаимодействия',
      titleEn: 'Interaction Story',
      textRu: story.text,
      textEn: story.text,
      resonances: 1,
      verified: false
    };

    setStories(prev => [newStory, ...prev]);

    // Log update
    const timestamp = new Date().toLocaleTimeString();
    const newLog: ActivityNotification = {
      id: `log-user-${Date.now()}`,
      timestamp,
      textRu: `${userProfile.name} опубликовал историю связей к ноде`,
      textEn: `${userProfile.name} appended semantic story elements`
    };
    setNotifications(prev => [newLog, ...prev]);
    
    setUserProfile(prev => ({ ...prev, storiesWritten: prev.storiesWritten + 1 }));
  };

  const handleAddAnswerToQuestion = (qId: string, answerText: string, linkedNodeId?: string) => {
    // Find node name
    const lNode = nodes.find(n => n.id === linkedNodeId);
    const nodeRu = lNode?.nameRu;
    const nodeEn = lNode?.nameEn;

    setAgendaQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          contributorsCount: q.contributorsCount + 1,
          answers: [
            ...q.answers,
            {
              id: `ans-user-${Date.now()}`,
              author: userProfile.name,
              textRu: answerText,
              textEn: answerText,
              linkedNodeId,
              linkedNodeNameRu: nodeRu,
              linkedNodeNameEn: nodeEn
            }
          ]
        };
      }
      return q;
    }));
  };

  const handleNodeResonated = (nodeId: string) => {
    // Record into personal resonance Set backed by localStorage
    setResonatedNodeIds(prev => {
      const next = new Set(prev);
      next.add(nodeId);
      localStorage.setItem('su_resonated', JSON.stringify([...next]));
      return next;
    });

    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const nextResonances = n.resonances + 1;
        // Check evolutionary threshold upgrades
        let nextStatus = n.status;
        if (n.status !== 'atlas') {
          if (nextResonances >= 100) nextStatus = 'rooted';
          else if (nextResonances >= 50) nextStatus = 'alive';
          else if (nextResonances >= 10) nextStatus = 'sprout';
        }

        const score = calcScore({ ...n, resonances: nextResonances });
        const updated: SomaticNode = {
          ...n,
          resonances: nextResonances,
          score,
          status: nextStatus,
          lastActiveAt: Date.now()
        };

        // If card details select focus is active, re-sync selected details
        if (selectedNode?.id === nodeId) {
          setSelectedNode(updated);
        }

        return updated;
      }
      return n;
    }));

    // Trigger log entry
    const matchingNode = nodes.find(n => n.id === nodeId);
    if (matchingNode) {
      showFlash(language === 'ru'
        ? `♦ Резонанс с "${matchingNode.nameRu}" записан в вашей вселенной`
        : `♦ Resonance with "${matchingNode.nameEn}" recorded`
      );
    }
    const nodeName = matchingNode ? (language === 'ru' ? matchingNode.nameRu : matchingNode.nameEn) : 'Unknown';
    const timestamp = new Date().toLocaleTimeString();
    
    const newLog: ActivityNotification = {
      id: `log-res-${Date.now()}`,
      timestamp,
      textRu: `${userProfile.name ? userProfile.name : 'Аноним'} задействовал РЕЗОНАНС на ноду [${nodeName}]`,
      textEn: `${userProfile.name ? userProfile.name : 'Anonymous'} registered RESONANCE on node [${nodeName}]`
    };
    setNotifications(prev => [newLog, ...prev]);
  };

  // Carry Over: insert node into personal universe list
  const handleCarryOver = (nodeId: string) => {
    // Pocket into personal carry tracking set backed by localStorage
    setCarriedNodeIds(prev => {
      const next = new Set(prev);
      next.add(nodeId);
      localStorage.setItem('su_carried', JSON.stringify([...next]));
      return next;
    });

    // Update carries count and compile corresponding score/evolution status
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const nextCarries = (n.carries || 0) + 1;
        const newScore = calcScore({ ...n, carries: nextCarries });
        const updated: SomaticNode = {
          ...n,
          carries: nextCarries,
          score: newScore,
          status: n.status === 'atlas' ? 'atlas' : getStatus(newScore),
          lastActiveAt: Date.now()
        };

        if (selectedNode?.id === nodeId) {
          setSelectedNode(updated);
        }
        return updated;
      }
      return n;
    }));

    // Localized alert toast and activity report compilation
    const matched = nodes.find(n => n.id === nodeId);
    if (matched) {
      showFlash(language === 'ru'
        ? `↗ "${matched.nameRu}" добавлено в вашу вселенную`
        : `↗ "${matched.nameEn}" carried to your universe`
      );

      const timestamp = new Date().toLocaleTimeString();
      const newLog: ActivityNotification = {
        id: `log-carry-${Date.now()}`,
        timestamp,
        textRu: `Вы забрали ноду [${language === 'ru' ? matched.nameRu : matched.nameEn}] в свою личную вселенную`,
        textEn: `You pocketed concept: [${language === 'ru' ? matched.nameRu : matched.nameEn}] into your Me database`
      };
      setNotifications(prev => [newLog, ...prev]);
    }
  };

  // Standard search match evaluation
  const getFilteredNodesForInteractions = () => {
    return nodes.filter(n => {
      // General name queries match
      const title = language === 'ru' ? n.nameRu : n.nameEn;
      if (searchQuery && !title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // Domain check
      if (selectedDomainFilter !== 'all' && n.domain !== selectedDomainFilter) return false;

      // Chronological epoch ranges
      if (selectedEpoch === 1) {
        // Antiquity / Classic
        return n.epochRu?.includes('Античность') || n.epochEn?.includes('Antiquity');
      }
      if (selectedEpoch === 2) {
        // 20th Century
        return n.epochRu?.includes('XX') || n.epochEn?.includes('20th') || n.epochEn?.includes('1970') || n.epochEn?.includes('1945') || n.epochEn?.includes('1906') || n.epochEn?.includes('1991') || n.epochEn?.includes('1980');
      }

      return true;
    });
  };

  // Handle direct play inside NodeCard
  const handleTriggerPlayAudio = (nodeId: string) => {
    setActiveAudioTriggerNode(nodeId);
  };

  // Simulated Google Auth actions
  const handleGoogleAuthSimulation = () => {
    setUserEmail('botovroman45@gmail.com');
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUserEmail(null);
    setCurrentWorld('atlas'); // Return to atlas readonly
  };

  const activeInteractiveNodes = getFilteredNodesForInteractions();

  return (
    <div className="relative w-screen h-screen flex flex-col bg-[#050505] text-[#E0D8D0] overflow-hidden select-none font-sans" id="seamless-cosmos-hub">
      {flashMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none
          bg-emerald-900/90 border border-emerald-500/30 text-emerald-300
          text-xs px-5 py-2.5 rounded-full backdrop-blur-md shadow-xl animate-fade-in">
          {flashMessage}
        </div>
      )}
      
      {/* 0. PHILOSOPHICAL ONBOARDING DECK (Initially visible to spark the somatic mood) */}
      {showOnboarding && (
        <PhilosophyOnboarding 
          onComplete={() => setShowOnboarding(false)} 
          language={language}
          onToggleLanguage={() => setLanguage(prev => prev === 'ru' ? 'en' : 'ru')}
        />
      )}

      {/* 1. BRAND HUD NAVIGATION TOP ROW */}
      <header className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#050505] via-[#050505]/95 to-transparent flex items-center justify-between px-6 z-30 select-none pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Glowing Mycelial Node logo placeholder */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-300 via-indigo-500 to-emerald-400 p-[1.5px] shadow-lg animate-pulse">
            <div className="w-full h-full bg-[#050505] rounded-[10px] flex items-center justify-center text-[#DFB757] font-bold text-xs font-mono">
              SU
            </div>
          </div>
          
          <div className="text-left font-display">
            <span className="text-sm font-bold text-white tracking-[0.16em] block">
              SEAMLESS UNIVERSE
            </span>
            <span className="text-[8px] font-mono tracking-widest text-[#DFB757] uppercase leading-none block mt-0.5">
              living map of meaning v3.0
            </span>
          </div>
        </div>

        {/* Dynamic World Morph switcher (ATLAS / FIELD / ME) centring in header */}
        <div className="hidden md:flex items-center p-1 bg-[#ffffff08] rounded-xl border border-[#ffffff10] shadow-inner backdrop-blur-md">
          <button
            onClick={() => {
              setCurrentWorld('atlas');
              setSelectedNode(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide cursor-pointer transition-all ${
              currentWorld === 'atlas' 
                ? 'bg-[#DFB757] text-[#050505] font-extrabold shadow-md' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {language === 'ru' ? 'АТЛАС' : 'ATLAS'}
          </button>
          <button
            onClick={() => {
              setCurrentWorld('field');
              setSelectedNode(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide cursor-pointer transition-all ${
              currentWorld === 'field' 
                ? 'bg-[#DFB757] text-[#050505] font-extrabold shadow-md' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {language === 'ru' ? 'ПОЛЕ СВЯЗЕЙ' : 'THE FIELD'}
          </button>
          <button
            onClick={() => {
              if (!userEmail) {
                setShowAuthModal(true);
              } else {
                setCurrentWorld('me');
                setSelectedNode(null);
              }
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide cursor-pointer transition-all ${
              currentWorld === 'me' 
                ? 'bg-[#DFB757] text-[#050505] font-extrabold shadow-md' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {language === 'ru' ? 'МОЯ ВСЕЛЕННАЯ [Я]' : 'MY UNIVERSE [ME]'}
          </button>
        </div>

        {/* Global toggles bar (Language & User actions) */}
        <div className="flex items-center gap-3">
          
          {/* RU / EN switcher */}
          <button
            onClick={() => setLanguage(prev => prev === 'ru' ? 'en' : 'ru')}
            className="w-10 h-8 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 flex items-center justify-center text-xs font-mono font-bold tracking-tight text-white cursor-pointer transition-all"
            title="Переключить язык / Toggle language interface"
            id="lang-switch-btn"
          >
            {language === 'ru' ? 'RU' : 'EN'}
          </button>

          {/* Activity drawer trigger */}
          <button
            onClick={() => setShowActivityDrawer(!showActivityDrawer)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-gray-400 hover:text-[#DFB757] transition-all relative cursor-pointer"
            title="История активности в реальном времени"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500"></span>
          </button>

          {/* User Profile Simulator Avatar */}
          {userEmail ? (
            <div 
              onClick={() => setShowProfileDrawer(!showProfileDrawer)}
              className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/35 flex items-center justify-center font-bold text-xs text-[#DFB757] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
              title="Мой Профиль / Личный вклад"
              id="profile-hud-avatar"
            >
              РБ
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#DFB757] text-[#050505] rounded-lg font-bold text-xs shadow-md hover:bg-yellow-400 active:scale-95 transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5 fill-current" />
              <span>{language === 'ru' ? 'Войти' : 'Sign In'}</span>
            </button>
          )}

        </div>
      </header>

      {/* MOBILE LOWER MORPHER ROW VIEWPORT (for screens narrowing layout) */}
      <div className="md:hidden absolute top-16 left-0 right-1 px-4 py-2 z-30 select-none flex justify-center bg-transparent">
        <div className="flex items-center p-1 bg-[#050505]/95 rounded-xl border border-[#ffffff10] shadow-xl w-full backdrop-blur-md">
          <button
            onClick={() => {
              setCurrentWorld('atlas');
              setSelectedNode(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all ${
              currentWorld === 'atlas' ? 'bg-[#DFB757] text-[#050505]' : 'text-gray-400'
            }`}
          >
            {language === 'ru' ? 'АТЛАС' : 'ATLAS'}
          </button>
          <button
            onClick={() => {
              setCurrentWorld('field');
              setSelectedNode(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all ${
              currentWorld === 'field' ? 'bg-[#DFB757] text-[#050505]' : 'text-gray-400'
            }`}
          >
            {language === 'ru' ? 'ПОЛЕ' : 'FIELD'}
          </button>
          <button
            onClick={() => {
              if (!userEmail) setShowAuthModal(true);
              else {
                setCurrentWorld('me');
                setSelectedNode(null);
              }
            }}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all ${
              currentWorld === 'me' ? 'bg-[#DFB757] text-[#050505]' : 'text-gray-400'
            }`}
          >
            {language === 'ru' ? 'МОЙ МИР' : 'MY UNIVERSE'}
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC MAIN BODY VIEWPORT (Divided between Mycelium graph and content) */}
      <main className="flex-1 w-full h-full relative" id="universe-main-area">
        
        {/* UPPER HUD LAYOUT COVERS: Search fields and Filter selectors */}
        <div className="absolute top-28 md:top-20 left-4 z-20 flex flex-col gap-2 max-w-sm w-[calc(100vw-32px)]">
          <div className="flex gap-1.5">
            {/* Elegant Search Input */}
            <div className="flex-1 bg-[#ffffff08]/85 backdrop-blur-md rounded-xl border border-[#ffffff10] flex items-center px-3 gap-2 shadow-xl focus-within:border-[#DFB757] transition-all">
              <Search className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ru' ? 'Поиск нод и смыслов...' : 'Filter somatic nodes...'}
                className="w-full text-xs text-white py-2.5 bg-transparent focus:outline-none placeholder-gray-500"
                id="graph-search"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-gray-400 hover:text-white font-mono px-1 p-0.5 rounded hover:bg-white/5 shrink-0"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Expander filter settings panel button */}
            <button
               onClick={() => setShowFiltersShelf(!showFiltersShelf)}
               className={`w-11 h-11 rounded-xl bg-[#ffffff08]/85 backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer ${
                 showFiltersShelf ? 'border-[#DFB757] text-[#DFB757]' : 'border-[#ffffff10] text-gray-400 hover:text-white hover:bg-white/5'
               }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* DYNAMIC SHADOW FILTER SHELF BLOCK (Shorthand Filters dropdown drawer) */}
          {showFiltersShelf && (
            <div className="bg-[#050505]/95 border border-[#ffffff10] backdrop-blur-md p-4 rounded-2xl flex flex-col gap-4 shadow-2xl animate-fade-in select-none text-left">
              {/* Category selector */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono tracking-widest text-[#DFB757] uppercase">
                  {language === 'ru' ? 'РАЗДЕЛ СОМАТИКИ:' : 'SOMATIC DISCIPLINE:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedDomainFilter('all')}
                    className={`px-2.5 py-1 text-[10px] rounded-lg transition-all font-semibold ${
                      selectedDomainFilter === 'all' ? 'bg-[#DFB757] text-[#07090E]' : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {language === 'ru' ? 'Все' : 'All'}
                  </button>
                  {(['body', 'philosophy', 'movement', 'science', 'cognition', 'hybrid'] as Domain[]).map(dom => (
                    <button
                      key={dom}
                      onClick={() => setSelectedDomainFilter(dom)}
                      className={`px-2.5 py-1 text-[10px] rounded-lg transition-all font-semibold flex items-center gap-1 ${
                        selectedDomainFilter === dom ? 'bg-[#DFB757] text-[#07090E]' : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${DOMAIN_DOT_COLORS[dom]}`} />
                      <span className="capitalize">{dom === 'hybrid' ? (language === 'ru' ? 'Гибрид' : 'hybrid') : dom}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chronology slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-mono uppercase">
                  <span className="text-[#DFB757]">{language === 'ru' ? 'ХРОНОЛОГИЯ И ЭПОХА:' : 'CHRONOLOGY SLICE CONSTELLANT:'}</span>
                  <span className="text-gray-500 font-bold">
                    {selectedEpoch === 0 && (language === 'ru' ? 'Все времена' : 'Unlimited')}
                    {selectedEpoch === 1 && (language === 'ru' ? 'Античность' : 'Antiquity / Classical')}
                    {selectedEpoch === 2 && (language === 'ru' ? 'XX век / Соматика' : '20th Century / Growth')}
                    {selectedEpoch === 3 && (language === 'ru' ? 'Современность / Все' : 'Contemporary / All')}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={selectedEpoch}
                  onChange={(e) => setSelectedEpoch(parseInt(e.target.value))}
                  className="w-full accent-[#DFB757] cursor-pointer h-1.5 bg-white/10 rounded-full"
                />
                <div className="flex justify-between text-[8px] font-mono text-gray-600">
                  <span>{language === 'ru' ? 'Античность' : 'Classical'}</span>
                  <span>{language === 'ru' ? 'XX век' : '20th Cent'}</span>
                  <span>{language === 'ru' ? 'Совр.' : 'Contemp.'}</span>
                </div>
              </div>

              {/* Visibility Layers checklist checkboxes */}
              <div className="space-y-2 border-t border-white/5 pt-3">
                <span className="text-[9px] font-mono tracking-widest text-[#DFB757] uppercase block">
                  {language === 'ru' ? 'АКТИВНЫЕ СЛОИ ПРОСТРАНСТВА:' : 'ACTIVE SPACE LAYERS:'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'atlas', ru: 'Атлас (Исторический)', en: 'Atlas (Historical)' },
                    { key: 'field', ru: 'Поле (Живые смыслы)', en: 'Field (Living Meanings)' },
                    { key: 'hot', ru: '🔥 Горячие (50+ резон)', en: '🔥 Hot (50+ resonances)' },
                    { key: 'withAudio', ru: '🎵 Только с аудио', en: '🎵 Only with audio' }
                  ].map(layer => (
                    <label key={layer.key} className="flex items-center gap-2 cursor-pointer p-1 rounded-md hover:bg-white/5 transition-colors">
                      <input
                        type="checkbox"
                        checked={visibleLayers[layer.key as keyof typeof visibleLayers]}
                        onChange={() => setVisibleLayers(prev => ({
                          ...prev,
                          [layer.key]: !prev[layer.key as keyof typeof visibleLayers]
                        }))}
                        className="accent-[#DFB757] w-3.5 h-3.5 rounded border-white/15 cursor-pointer text-[#DFB757]"
                      />
                      <span className="text-[10px] text-gray-300 font-sans">
                        {language === 'ru' ? layer.ru : layer.en}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dynamic comparative Graph Overlay Trigger (Наложение двух графов) */}
              <div className="space-y-2 border-t border-white/5 pt-3">
                <span className="text-[9px] font-mono tracking-widest text-[#DFB757] uppercase block">
                  {language === 'ru' ? 'НАЛОЖЕНИЕ ДРУГОГО ГРАФА (ПЕРЕСЕЧЕНИЯ):' : 'GRAPH COMPARATIVE OVERLAY:'}
                </span>
                
                <div className="flex gap-1.5">
                  <select
                    value={overlayPersona || ''}
                    onChange={(e) => setOverlayPersona(e.target.value ? e.target.value : null)}
                    className="flex-1 bg-black/40 border border-white/5 focus:border-[#DFB757] text-xs text-white rounded-lg p-2 focus:outline-none"
                  >
                    <option value="">{language === 'ru' ? '-- Наложить граф исследователя --' : '-- Choose partner map --'}</option>
                    <option value="Steve Paxton">Steve Paxton (Movement Origin)</option>
                    <option value="Thomas Hanna">Thomas Hanna (Somatics Founder)</option>
                    <option value="Gregory Bateson">Gregory Bateson (Ecology of Mind)</option>
                  </select>
                  {overlayPersona && (
                    <button
                      type="button"
                      onClick={() => setOverlayPersona(null)}
                      className="px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs rounded-lg active:scale-95 transition-all cursor-pointer"
                    >
                      {language === 'ru' ? 'Снять' : 'Reset'}
                    </button>
                  )}
                </div>
                
                <p className="text-[9px] text-gray-500 font-mono leading-relaxed mt-1">
                  {overlayPersona 
                    ? (language === 'ru' ? `⚡️ Наложен граф ${overlayPersona}. Общие ноды вспыхнули ярким золотом, образовав мосты пересечений!` : `⚡️ Shared thoughts aligned! Constellation overlap active with ${overlayPersona}. Golden spark bridges trace overlap interest.`)
                    : (language === 'ru' ? 'При наложении графа общие концепты со вспышкой протягивают золотые мосты.' : 'Align maps with historical pioneers to reveal direct golden structural connections.')}
                </p>
              </div>

            </div>
          )}
        </div>

        {/* 2D CANVAS MYCELIUM PHYSICS COGNITIVE WORKSPACE */}
        <MyceliumGraph
          nodes={activeInteractiveNodes}
          links={links}
          currentWorld={currentWorld}
          language={language}
          onNodeSelect={(n) => setSelectedNode(n)}
          selectedNodeId={selectedNode?.id || null}
          themeColor="#DFB757"
          overlayUser={overlayPersona}
          onNodeResonate={handleNodeResonated}
          resonatedNodeIds={resonatedNodeIds}
          carriedNodeIds={carriedNodeIds}
          activeAudioNodeId={activeAudioNodeId}
          currentUserName={userProfile.name}
          visibleLayers={visibleLayers}
        />

        {/* RIGHT DRAWER DETAILED SIDE SHEET NODE CARD */}
        {selectedNode && (
          <NodeCard
            node={selectedNode}
            allNodes={nodes}
            onClose={() => setSelectedNode(null)}
            language={language}
            onSelectNode={(n) => setSelectedNode(n)}
            onResonate={handleNodeResonated}
            onConnectNodes={(sourceId, targetId) => handleAddConnection({ sourceId, targetId, text: 'Direct soma bridge' })}
            onCarryOver={handleCarryOver}
            onAddStory={(nodeId, text) => handleAddGlobalStory({ nodeId, text })}
            onPlayAudio={handleTriggerPlayAudio}
            allStories={stories}
            links={links}
          />
        )}

        {/* MOCK GOOGLE AUTH OVERLAY POPUP */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="max-w-xs w-full bg-[#0E1528] rounded-3xl border border-white/10 p-6 text-center select-none shadow-2xl animate-fade-in relative">
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-[#DFB757] mx-auto mb-4 animate-bounce">
                <KeyRound className="w-6 h-6" />
              </div>

              <h3 className="text-sm font-bold text-white tracking-tight">
                {language === 'ru' ? 'Вход в Seamless Universe' : 'Join Seamless Universe'}
              </h3>
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                {language === 'ru' 
                  ? 'Персональный соматический граф и добавление весов в Поле доступны после авторизации.' 
                  : 'Establish private spaces, track your own resonance and help Field nodes ascend to Atlas verification.'}
              </p>

              <button
                onClick={handleGoogleAuthSimulation}
                className="w-full mt-5 py-2.5 bg-white hover:bg-yellow-400 text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
              >
                {/* Simulated Google Icon */}
                <span className="font-bold text-indigo-700">G</span>
                <span>{language === 'ru' ? 'Войти через Google' : 'Sign in with Google'}</span>
              </button>
            </div>
          </div>
        )}

        {/* USER PROFILE DRAWER PANEL */}
        {showProfileDrawer && (
          <div className="fixed md:top-24 top-auto bottom-0 right-0 md:w-[460px] w-full md:h-[calc(100vh-120px)] h-[82vh] bg-[#050505]/98 border-t md:border-t-0 md:border-l border-[#ffffff10] backdrop-blur-lg text-gray-200 z-40 shadow-2xl flex flex-col overflow-hidden animate-slide-in rounded-t-3xl md:rounded-t-none text-left">
            <div className="p-5 border-b border-[#ffffff10] flex items-center justify-between shrink-0 bg-[#ffffff05]">
              <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider">
                {language === 'ru' ? 'ЛИЧНЫЙ ПРОФИЛЬ ИССЛЕДОВАТЕЛЯ' : 'INVESTIGATOR PROFILE INDEX'}
              </span>
              <button 
                onClick={() => setShowProfileDrawer(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Profile card metadata details */}
              <div className="flex items-center gap-4 bg-[#ffffff05] border border-[#ffffff10] p-4 rounded-2xl relative overflow-hidden">
                <div className="w-12 h-12 bg-[#DFB757] text-[#050505] rounded-full flex items-center justify-center text-lg font-bold">
                  РБ
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-white tracking-tight">{userProfile.name}</h3>
                  <p className="text-[10px] text-[#DFB757] font-mono truncate max-w-[240px]">{userEmail}</p>
                </div>
                <span className="absolute -bottom-6 -right-6 text-7xl font-bold opacity-5 text-indigo-500 font-mono">ID</span>
              </div>

              {/* AUTOMATIC SOMATIC ARCHETYPE/CHARACTER METRIC (As specified) */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-widest text-[#DFB757] uppercase block">
                  {language === 'ru' ? 'ХАРАКТЕР ИССЛЕДОВАТЕЛЯ (ПАТТЕРН):' : 'AUTOMATIC INVESTIGATOR CHARACTER PATTERNS:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {calculateArchetypes(userProfile).map((arch, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#DFB757]/10 border border-[#DFB757]/20 text-[#DFB757] text-[10px] font-bold font-mono rounded-full"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#DFB757]" />
                      {arch}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 font-sans leading-relaxed mt-1">
                  {language === 'ru' 
                    ? 'Ваш характер вычисляется автоматически на основе вашей активности: создание связей, рецензирование гипотез или написание историй.' 
                    : 'Tactile cognitive archetypes evaluated procedurally. Build connections to gain "Connector" titles, or tell anecdotes to trigger "Storyteller" patterns.'}
                </p>
              </div>

              {/* Statistics ledger */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="block text-xl font-mono text-white font-bold">{userProfile.sensesAdded}</span>
                  <span className="block text-[8px] text-gray-500 tracking-wider font-mono uppercase mt-1">
                    {language === 'ru' ? 'Смыслов' : 'Senses'}
                  </span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="block text-xl font-mono text-white font-bold">{userProfile.storiesWritten}</span>
                  <span className="block text-[8px] text-gray-500 tracking-wider font-mono uppercase mt-1">
                    {language === 'ru' ? 'Нарративов' : 'Narratives'}
                  </span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="block text-xl font-mono text-[#DFB757] font-bold">{userProfile.nodesMovedToAtlas}</span>
                  <span className="block text-[8px] text-gray-500 tracking-wider font-mono uppercase mt-1">
                    {language === 'ru' ? 'В Атласе' : 'In Atlas'}
                  </span>
                </div>
              </div>

              {/* Collaborative Agenda component inside Profile */}
              <div className="border-t border-white/5 pt-4">
                <AgendaPanel
                  questions={agendaQuestions}
                  allNodes={nodes}
                  language={language}
                  onSelectNode={(n) => {
                    setSelectedNode(n);
                    setShowProfileDrawer(false);
                  }}
                  onAddAnswerToQuestion={handleAddAnswerToQuestion}
                />
              </div>

              {/* Sign out simulator */}
              <div className="border-t border-white/5 pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all active:scale-95 text-center cursor-pointer"
                >
                  {language === 'ru' ? 'ВЫЙТИ ИЗ СИСТЕМЫ' : 'SIGN OUT OF NETWORK'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVITY Drawer Panel (Left/right drawer displaying live feed logs) */}
        {showActivityDrawer && (
          <div className="fixed md:top-24 top-auto bottom-0 right-0 md:w-[460px] w-full md:h-[calc(100vh-120px)] h-[82vh] bg-[#050505]/98 border-t md:border-t-0 md:border-l border-[#ffffff10] backdrop-blur-lg text-gray-200 z-40 shadow-2xl flex flex-col overflow-hidden animate-slide-in rounded-t-3xl md:rounded-t-none text-left">
            <div className="p-5 border-b border-[#ffffff10] flex items-center justify-between shrink-0 bg-[#ffffff05]">
              <span className="text-[10px] font-mono text-gray-400 tracking-wider uppercase flex items-center gap-1.5">
                <Bell className="w-3.5 h-[#DFB757] text-[#DFB757] animate-swing" />
                {language === 'ru' ? 'ЖИВАЯ ЛЕНТА ПЛАТФОРМЫ' : 'LIVE SOMATIC INTEL FEED'}
              </span>
              <button 
                onClick={() => setShowActivityDrawer(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar">
              {notifications.map((not) => (
                <div key={not.id} className="p-3.5 bg-white/5 border border-white/5 rounded-xl text-xs space-y-1.5 relative overflow-hidden animate-fade-in">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/40"></div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                    <span className="font-bold flex items-center gap-1">
                      <RefreshCcw className="w-3 h-3 text-indigo-400" />
                      SECURE SYNCED
                    </span>
                    <span>{not.timestamp}</span>
                  </div>
                  <p className="text-gray-300 font-sans leading-normal">
                    {language === 'ru' ? not.textRu : not.textEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

    </main>

    <AudioPlayer
      tracks={SAMPLE_AUDIO}
      allNodes={nodes}
      language={language}
      onSelectNode={(n) => setSelectedNode(n)}
      directPlayNodeId={activeAudioTriggerNode}
      onClearDirectPlay={() => setActiveAudioTriggerNode(null)}
      onActiveNode={setActiveAudioNodeId}
    />

    {/* 3. FIXED BOTTOM CONTROLS HUD OVERLAYS BAR */}
    <footer className="h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] border-t border-[#ffffff10] bg-[#050505]/95 backdrop-blur-md flex items-center justify-between px-6 z-50 relative shrink-0 w-full bottom-0 left-0">
      
      {/* Helper informational text block */}
      <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-gray-500 leading-none">
        <Shield className="w-3.5 h-3.5 text-[#DFB757]" />
        <span>ROUTING EXCLUSIVELY VIA SECURE NODE PORT 3000 // READONLY FOR VISITOR MODE APPROVED</span>
      </div>

      {/* Big Glow interactive ADD Button Centred (✧ Добавить смысл ✧) */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-50">
        <button
          onClick={() => {
            if (!userEmail) {
              setShowAuthModal(true);
            } else {
              setIsAddSenseOpen(true);
            }
          }}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-yellow-400 via-indigo-600 to-emerald-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 active:shadow-inner transition-all cursor-pointer shadow-[0_0_20px_rgba(234,179,8,0.35)]"
          title={language === 'ru' ? 'Добавить свое соматическое наблюдение или связь' : 'Forge customized somatic observation'}
          id="spawn-meaning-btn"
        >
          <Plus className="w-6 h-6 stroke-[3px]" />
        </button>
      </div>

      {/* Placeholder to balance layout */}
      <div className="flex-1 lg:flex-initial flex justify-end" />
    </footer>

      {/* Interactive Creation modal forms */}
      <AddSenseModal
        isOpen={isAddSenseOpen}
        onClose={() => setIsAddSenseOpen(false)}
        allNodes={nodes}
        language={language}
        onAddObservation={handleAddObservation}
        onAddConnection={handleAddConnection}
        onAddAgendaQuestion={handleAddAgendaQuestion}
        onAddGlobalStory={handleAddGlobalStory}
      />

    </div>
  );
}
