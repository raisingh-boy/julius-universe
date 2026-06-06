import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { SomaticNode, SomaticLink, Domain, World, NodeStatus } from '../types';
import { SAMPLE_AUDIO } from '../data/nodesData';
import { Flame } from 'lucide-react';

// ============================================================
// ЦВЕТА ДОМЕНОВ (Domain Colors)
// ============================================================
const DOMAIN_COLORS: Record<Domain, string> = {
  body: '#E8A95C',      // Warm Amber
  science: '#5C9BE8',   // Cold Blue
  philosophy: '#9B5CE8',// Purple
  movement: '#5CE87A',  // Green
  cognition: '#EAEAEA',  // Silver-White
  hybrid: '#E85C7A'     // Coral
};

// ============================================================
// КОМПОНЕНТ НОДЫ (3D Sphere with Bloom / Pulsing)
// ============================================================
function SomaticSphere({
  node, isSelected, isHovered, isActiveAudio, color, onClick, currentWorld, overlayUser
}: {
  node: SomaticNode; isSelected: boolean; isHovered: boolean; isActiveAudio: boolean;
  color: string; onClick: (n: SomaticNode) => void; currentWorld: World; overlayUser: string | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const SCALE = 0.045; // Units conversion: physics scale -> WebGL coordinate system

  const isOverlayMatch = !!(overlayUser && (
    node.authorRu?.includes(overlayUser) ||
    node.authorEn?.includes(overlayUser) ||
    node.descriptionEn?.toLowerCase().includes(overlayUser.toLowerCase()) ||
    node.descriptionRu?.toLowerCase().includes(overlayUser.toLowerCase())
  ));

  const finalColor = isOverlayMatch ? '#FFD700' : color;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breath = 1 + Math.sin(t * (node.breathSpeed || 0.4) + (node.breathPhase || 0)) * 0.07;
    const base = (node.currentRadius || 10) * SCALE;
    let s = base * breath;
    if (isSelected) s *= 1.35;
    else if (isActiveAudio) s *= 1.25;

    meshRef.current.scale.setScalar(s);
    glowRef.current.scale.setScalar(s * (isActiveAudio ? 2.5 : 1.7));

    const x = (node.x || 0) * SCALE;
    const y = (node.y || 0) * SCALE;
    const z = (node.z || 0) * SCALE;
    meshRef.current.position.set(x, y, z);
    glowRef.current.position.set(x, y, z);

    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (isActiveAudio) {
      mat.emissive.set('#DFB757');
      mat.emissiveIntensity = 0.6 + Math.sin(t * 8) * 0.3;
    } else {
      mat.emissive.set(new THREE.Color(finalColor));
      mat.emissiveIntensity = isOverlayMatch ? 1.2 : isSelected ? 0.75 : isHovered ? 0.45 : 0.2;
    }
  });

  const c = new THREE.Color(finalColor);

  // Status opacity indicating the lifecycle of nodes in the field mind-map
  const statusOpacity: Record<NodeStatus, number> = {
    seed: 0.4, sprout: 0.65, alive: 0.85, rooted: 1.0, atlas: 1.0
  };
  const opacity = (currentWorld === 'field' && node.world === 'atlas')
    ? 0.25  // Contextual background transparency for Atlas nodes inside Field map
    : (statusOpacity[node.status] || 1.0);

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(node); }}>
      {/* Outer soft glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          color={c} transparent opacity={isSelected ? 0.25 : isActiveAudio ? 0.35 : 0.08}
          depthWrite={false}
        />
      </mesh>
      {/* Internal core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={0.2}
          roughness={0.3}
          metalness={0.2}
          transparent
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// КОМПОНЕНТ РЕБРА (Curved Mycelial Strand + Interactive Signal Particle)
// ============================================================
function MyceliumEdge({
  source, target, color, activity, isActive
}: {
  source: SomaticNode; target: SomaticNode;
  color: string; activity: number; isActive: boolean;
}) {
  const lineRef = useRef<THREE.Line>(null!);
  const particleRef = useRef<THREE.Mesh>(null!);
  const progressRef = useRef(Math.random());
  const SCALE = 0.045;

  // Calculates organic curved bezier points dynamically responding to physics force changes
  const getCurve = useCallback(() => {
    const s = new THREE.Vector3(
      (source.x || 0) * SCALE, (source.y || 0) * SCALE, (source.z || 0) * SCALE
    );
    const t = new THREE.Vector3(
      (target.x || 0) * SCALE, (target.y || 0) * SCALE, (target.z || 0) * SCALE
    );
    const mid = new THREE.Vector3().addVectors(s, t).multiplyScalar(0.5);
    const seed = ((source.id || '').charCodeAt(0) || 0) + ((target.id || '').charCodeAt(0) || 0);
    const perp = new THREE.Vector3(
      -(t.y - s.y), (t.x - s.x), (seed % 7) * 0.2
    ).normalize().multiplyScalar(0.6 + (seed % 20) / 20 * 1.0);
    return new THREE.QuadraticBezierCurve3(s, mid.clone().add(perp), t);
  }, [source.x, source.y, source.z, target.x, target.y, target.z]);

  useFrame((_, delta) => {
    const speed = isActive ? 0.005 : 0.0025;
    progressRef.current = (progressRef.current + speed * (1 + activity * 0.06)) % 1;

    const curve = getCurve();

    if (lineRef.current) {
      const pts = curve.getPoints(24);
      (lineRef.current.geometry as THREE.BufferGeometry).setFromPoints(pts);
    }

    if (particleRef.current) {
      const pt = curve.getPoint(progressRef.current);
      particleRef.current.position.copy(pt);
    }
  });

  const lineColor = new THREE.Color(color);
  const opacity = isActive ? 0.55 : 0.16;

  return (
    <group>
      <line ref={lineRef as any}>
        <bufferGeometry />
        <lineBasicMaterial color={lineColor} transparent opacity={opacity} />
      </line>
      <mesh ref={particleRef}>
        <sphereGeometry args={[isActive ? 0.055 : 0.038, 6, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// ============================================================
// ЗОЛОТЫЕ МОСТЫ СЕМЕЙСТВА ОВЕРЛЕЕВ (Golden Overlap Bridges)
// ============================================================
function GoldenOverlayBridges({ nodes, SCALE }: { nodes: SomaticNode[]; SCALE: number }) {
  const line1Ref = useRef<THREE.Line>(null!);
  const line2Ref = useRef<THREE.Line>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const opacity = 0.45 + Math.sin(t * 3.5) * 0.15;

    const somaticsNode = nodes.find(n => n.id === 'soma-hanna');
    const batesonNode = nodes.find(n => n.id === 'pattern-bateson');
    const gazeNode = nodes.find(n => n.id === 'field-gaze');

    if (somaticsNode && batesonNode && line1Ref.current) {
      const p1 = new THREE.Vector3((somaticsNode.x || 0) * SCALE, (somaticsNode.y || 0) * SCALE, (somaticsNode.z || 0) * SCALE);
      const p2 = new THREE.Vector3((batesonNode.x || 0) * SCALE, (batesonNode.y || 0) * SCALE, (batesonNode.z || 0) * SCALE);
      line1Ref.current.geometry.setFromPoints([p1, p2]);
      const mat = line1Ref.current.material as THREE.LineBasicMaterial;
      mat.opacity = opacity;
    }

    if (batesonNode && gazeNode && line2Ref.current) {
      const p1 = new THREE.Vector3((batesonNode.x || 0) * SCALE, (batesonNode.y || 0) * SCALE, (batesonNode.z || 0) * SCALE);
      const p2 = new THREE.Vector3((gazeNode.x || 0) * SCALE, (gazeNode.y || 0) * SCALE, (gazeNode.z || 0) * SCALE);
      line2Ref.current.geometry.setFromPoints([p1, p2]);
      const mat = line2Ref.current.material as THREE.LineBasicMaterial;
      mat.opacity = opacity;
    }
  });

  const somaticsNode = nodes.find(n => n.id === 'soma-hanna');
  const batesonNode = nodes.find(n => n.id === 'pattern-bateson');
  const gazeNode = nodes.find(n => n.id === 'field-gaze');

  return (
    <>
      {somaticsNode && batesonNode && (
        <line ref={line1Ref as any}>
          <bufferGeometry />
          <lineBasicMaterial color="#DFB757" transparent />
        </line>
      )}
      {batesonNode && gazeNode && (
        <line ref={line2Ref as any}>
          <bufferGeometry />
          <lineBasicMaterial color="#DFB757" transparent />
        </line>
      )}
    </>
  );
}

// ============================================================
// ВЫРАВНЕННЫЙ БИЛЛБОРД С НАЗВАНИЕМ НОДЫ (Labels Billboard)
// ============================================================
function NodeLabel({ node, language, SCALE, isSelected, isActiveAudio }: {
  node: SomaticNode; language: 'ru' | 'en'; SCALE: number; isSelected: boolean; isActiveAudio: boolean;
}) {
  const label = language === 'ru' ? node.nameRu : node.nameEn;
  const radius = (node.currentRadius || 10) * SCALE;

  return (
    <Billboard position={[
      (node.x || 0) * SCALE,
      (node.y || 0) * SCALE + radius + 0.16,
      (node.z || 0) * SCALE
    ]}>
      <Text
        fontSize={isSelected || isActiveAudio ? 0.19 : 0.14}
        color={isSelected || isActiveAudio ? '#DFB757' : '#D1D7E0'}
        anchorX="center"
        anchorY="bottom"
        maxWidth={2.5}
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
      >
        {label}
      </Text>
    </Billboard>
  );
}

export interface VisibleLayers {
  atlas: boolean;
  field: boolean;
  hot: boolean;
  withAudio: boolean;
}

// ============================================================
// ГЛАВНЫЙ СЦЕНИЧЕСКИЙ ОРКЕСТРАТОР (Physical Grid Simulation)
// ============================================================
interface GraphSceneProps {
  nodes: SomaticNode[];
  links: SomaticLink[];
  currentWorld: World;
  language: 'ru' | 'en';
  onNodeSelect: (node: SomaticNode) => void;
  selectedNodeId: string | null;
  overlayUser: string | null;
  resonatedNodeIds: Set<string>;
  carriedNodeIds: Set<string>;
  currentUserName?: string;
  isFilterHot?: boolean;
  activeAudioNodeId: string | null;
  visibleLayers?: VisibleLayers;
}

function GraphScene({
  nodes, links, currentWorld, language, onNodeSelect,
  selectedNodeId, overlayUser, resonatedNodeIds, carriedNodeIds,
  currentUserName, isFilterHot, activeAudioNodeId, visibleLayers
}: GraphSceneProps) {
  const SCALE = 0.045;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Physics state representation maintained synchronously inside useRef context to prevent stuttering
  const graphStateRef = useRef<{
    nodes: (SomaticNode & {
      z?: number;
      vz?: number;
      targetZ?: number;
    })[];
    links: SomaticLink[];
    lastWorld: World | null;
    transitionProgress: number;
  }>({ nodes: [], links: [], lastWorld: null, transitionProgress: 1.0 });

  // Update nodes configurations and automatically sync target positions inside graphStateRef
  useEffect(() => {
    const gState = graphStateRef.current;
    const internalNodes = gState.nodes;
    
    const worldChanged = gState.lastWorld !== currentWorld;
    if (worldChanged) {
      gState.lastWorld = currentWorld;
      gState.transitionProgress = 0.0;
    }

    const newNodes = nodes.map((n, idx) => {
      const ex = internalNodes.find(e => e.id === n.id);
      let x = ex?.x;
      let y = ex?.y;
      let z = ex?.z;

      if (x === undefined || y === undefined || z === undefined) {
        // Position new node beautifully in a random vector
        const angle = Math.random() * Math.PI * 2;
        const r = 50 + Math.random() * 80;
        x = Math.cos(angle) * r;
        y = Math.sin(angle) * r;
        z = (Math.random() - 0.5) * 80;
      }

      // Calculate target positions dynamically for this currentWorld
      let tx = 0, ty = 0, tz = 0;
      if (currentWorld === 'atlas') {
        const domainIdx = ['body', 'science', 'philosophy', 'movement', 'cognition', 'hybrid'].indexOf(n.domain);
        const angle = (domainIdx * Math.PI * 2 / 6) + (Math.random() * 0.3 - 0.15);
        const dist = 140 + (idx % 3) * 55;
        tx = Math.cos(angle) * dist;
        ty = Math.sin(angle) * dist;
        tz = (Math.random() - 0.5) * 80;
      } else if (currentWorld === 'field') {
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 320;
        tx = Math.cos(angle) * dist;
        ty = Math.sin(angle) * dist;
        tz = (Math.random() - 0.5) * 320; // Deep spatial field volume
      } else {
        // Personal Universe view
        if (n.id === 'central-me') {
          tx = 0; ty = 0; tz = 0;
        } else {
          const seed = Math.sin(idx * 1.5);
          const dist = 120 + Math.abs(seed) * 150;
          const angle = idx * 1.2;
          tx = Math.cos(angle) * dist;
          ty = Math.sin(angle) * dist;
          tz = idx * 16 * Math.sin(idx * 0.65); // Multi-layer overlapping shells
        }
      }

      return {
        ...n,
        x, y, z,
        vx: ex?.vx || 0, vy: ex?.vy || 0, vz: ex?.vz || 0,
        targetX: tx,
        targetY: ty,
        targetZ: tz,
        breathPhase: ex?.breathPhase ?? Math.random() * Math.PI * 2,
        breathSpeed: ex?.breathSpeed ?? (0.3 + Math.random() * 0.45),
        baseRadius: n.world === 'atlas' ? 14 : n.id === 'central-me' ? 18 : 10,
        currentRadius: ex?.currentRadius ?? (n.world === 'atlas' ? 14 : 10),
      };
    });

    gState.nodes = newNodes;
    gState.links = links;
  }, [nodes, links, currentWorld]);

  // Organic physics loops compiled per rendering interval
  useFrame((state) => {
    const gState = graphStateRef.current;
    if (!gState.nodes.length) return;
    const time = state.clock.elapsedTime;

    const gravityStrength = 0.045;
    const repulsionStrength = 2200;
    const attractionStrength = 0.038;
    const damping = 0.76;

    // Smooth lerp targeting coordinates
    if (gState.transitionProgress < 1.0) {
      gState.transitionProgress += 0.04;
      gState.nodes.forEach(node => {
        node.x = (node.x || 0) + ((node.targetX || 0) - (node.x || 0)) * 0.12;
        node.y = (node.y || 0) + ((node.targetY || 0) - (node.y || 0)) * 0.12;
        node.z = (node.z || 0) + ((node.targetZ || 0) - (node.z || 0)) * 0.12;
      });
    }

    // Repulsion forces
    for (let i = 0; i < gState.nodes.length; i++) {
      const n1 = gState.nodes[i];
      for (let j = i + 1; j < gState.nodes.length; j++) {
        const n2 = gState.nodes[j];
        if (n1.id === 'central-me' || n2.id === 'central-me') continue;
        let dx = (n2.x || 0) - (n1.x || 0);
        let dy = (n2.y || 0) - (n1.y || 0);
        let dz = (n2.z || 0) - (n1.z || 0);
        if (!dx && !dy && !dz) { dx = 0.1; dy = 0.1; dz = 0.1; }
        const distSq = dx*dx + dy*dy + dz*dz;
        const dist = Math.sqrt(distSq);
        if (dist < 310) {
          const force = repulsionStrength / (distSq + 120);
          n1.vx = (n1.vx || 0) - (dx / dist) * force;
          n1.vy = (n1.vy || 0) - (dy / dist) * force;
          n1.vz = (n1.vz || 0) - (dz / dist) * force;
          n2.vx = (n2.vx || 0) + (dx / dist) * force;
          n2.vy = (n2.vy || 0) + (dy / dist) * force;
          n2.vz = (n2.vz || 0) + (dz / dist) * force;
        }
      }
    }

    // Spring attraction forces along links
    gState.links.forEach(link => {
      const src = gState.nodes.find(n => n.id === link.source);
      const tgt = gState.nodes.find(n => n.id === link.target);
      if (!src || !tgt) return;
      const dx = (tgt.x || 0) - (src.x || 0);
      const dy = (tgt.y || 0) - (src.y || 0);
      const dz = (tgt.z || 0) - (src.z || 0);
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (!dist) return;
      const stretch = dist - 145;
      const pull = stretch * attractionStrength * Math.log(link.resonanceWeight + 1);
      if (src.id !== 'central-me') {
        src.vx = (src.vx || 0) + (dx / dist) * pull;
        src.vy = (src.vy || 0) + (dy / dist) * pull;
        src.vz = (src.vz || 0) + (dz / dist) * pull;
      }
      if (tgt.id !== 'central-me') {
        tgt.vx = (tgt.vx || 0) - (dx / dist) * pull;
        tgt.vy = (tgt.vy || 0) - (dy / dist) * pull;
        tgt.vz = (tgt.vz || 0) - (dz / dist) * pull;
      }
    });

    // Update coordinates and decay velocities using high-damping
    gState.nodes.forEach(node => {
      if (node.id === 'central-me') {
        node.x = 0; node.y = 0; node.z = 0;
        node.vx = 0; node.vy = 0; node.vz = 0;
      } else {
        node.vx = (node.vx || 0) + ((node.targetX || 0) - (node.x || 0)) * gravityStrength;
        node.vy = (node.vy || 0) + ((node.targetY || 0) - (node.y || 0)) * gravityStrength;
        node.vz = (node.vz || 0) + ((node.targetZ || 0) - (node.z || 0)) * gravityStrength;
        node.x = (node.x || 0) + (node.vx || 0);
        node.y = (node.y || 0) + (node.vy || 0);
        node.z = (node.z || 0) + (node.vz || 0);
        node.vx = (node.vx || 0) * damping;
        node.vy = (node.vy || 0) * damping;
        node.vz = (node.vz || 0) * damping;
        node.x += (Math.random() * 0.4 - 0.2);
        node.y += (Math.random() * 0.4 - 0.2);
        node.z += (Math.random() * 0.3 - 0.155);
      }
      const bp = (node.breathPhase || 0) + time * (node.breathSpeed || 0.4) * 0.03;
      node.currentRadius = (node.baseRadius || 10) * (1 + Math.sin(bp) * 0.08);
    });
  });

  // Dynamic nodes filtering
  const getFilteredNodes = (): SomaticNode[] => {
    const gState = graphStateRef.current;
    let base = [...gState.nodes];

    // Ensure central-me representation inside me universe
    if (currentWorld === 'me' && !base.find(n => n.id === 'central-me')) {
      base.unshift({
        id: 'central-me', nameRu: 'Я', nameEn: 'Me',
        type: 'concept', level: 'macro',
        domain: 'hybrid', world: 'me', status: 'rooted', resonances: 0,
        descriptionRu: 'Центр вашей личной вселенной',
        descriptionEn: 'The center of your personal universe',
        x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
        targetX: 0, targetY: 0, targetZ: 0,
        baseRadius: 18, currentRadius: 18, breathPhase: 0, breathSpeed: 0.5
      } as any);
      gState.nodes = base;
    }

    const audioNodeIds = new Set(SAMPLE_AUDIO?.flatMap(a => a.timelineNodes.map(t => t.nodeId)) || []);

    return base.filter(n => {
      // 1. World matching (Atlas world only shows world: 'atlas', Field shows only world: 'field')
      if (currentWorld === 'atlas') {
        if (n.world !== 'atlas') return false;
      }
      if (currentWorld === 'field') {
        if (n.world !== 'field') return false;
      }
      if (currentWorld === 'me') {
        if (n.id === 'central-me') return true;
        const isMine = n.addedBy === currentUserName;
        const isResonated = resonatedNodeIds?.has(n.id);
        const isCarried = carriedNodeIds?.has(n.id);
        if (!isMine && !isResonated && !isCarried) return false;
      }

      // 2. Visible checkboxes layers (visibleLayers: atlas, field, hot, withAudio)
      if (visibleLayers) {
        if (!visibleLayers.atlas && n.world === 'atlas' && n.id !== 'central-me') return false;
        if (!visibleLayers.field && n.world === 'field' && n.id !== 'central-me') return false;
        if (visibleLayers.hot && n.resonances < 50 && n.id !== 'central-me') return false;
        if (visibleLayers.withAudio && !audioNodeIds.has(n.id) && n.id !== 'central-me') return false;
      }

      // 3. Fallback hot filter button
      if (isFilterHot && n.resonances < 50 && n.id !== 'central-me') return false;

      return true;
    });
  };

  const filteredNodes = getFilteredNodes();
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

  // Filter links active in current perspective
  const activeLinks = links.filter(link => {
    return filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target);
  });

  return (
    <>
      <Stars radius={90} depth={55} count={1400} factor={4} fade speed={1.2} />

      <ambientLight intensity={0.4} />
      <pointLight position={[15, 15, 15]} intensity={2.2} color="#ccddff" />
      <pointLight position={[-15, -8, -15]} intensity={1.7} color="#9977ee" />
      <pointLight position={[8, -10, 8]} intensity={1.2} color="#7755aa" />

      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        zoomSpeed={0.8}
        panSpeed={0.7}
        rotateSpeed={0.5}
        minDistance={3}
        maxDistance={75}
        makeDefault
      />

      {/* Render Curved Mycelial links */}
      {activeLinks.map(link => {
        const src = filteredNodes.find(n => n.id === link.source);
        const tgt = filteredNodes.find(n => n.id === link.target);
        if (!src || !tgt) return null;
        const isActive = selectedNodeId === link.source || selectedNodeId === link.target;
        const color = DOMAIN_COLORS[src.domain] || '#ffffff';
        return (
          <MyceliumEdge
            key={link.id}
            source={src}
            target={tgt}
            color={color}
            activity={link.activity}
            isActive={isActive}
          />
        );
      })}

      {/* Golden Comparative Bridges */}
      {overlayUser && <GoldenOverlayBridges nodes={filteredNodes} SCALE={SCALE} />}

      {/* Somatic nodes representation */}
      {filteredNodes.map(node => {
        const color = node.id === 'central-me' ? '#DFB757' : (DOMAIN_COLORS[node.domain] || '#ffffff');
        return (
          <SomaticSphere
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            isHovered={hoveredId === node.id}
            isActiveAudio={activeAudioNodeId === node.id}
            color={color}
            onClick={onNodeSelect}
            currentWorld={currentWorld}
            overlayUser={overlayUser}
          />
        );
      })}

      {/* Responsive Text Billboards always looking at the viewport camera */}
      {filteredNodes.map(node => (
        <NodeLabel
          key={`label-${node.id}`}
          node={node}
          language={language}
          SCALE={SCALE}
          isSelected={selectedNodeId === node.id}
          isActiveAudio={activeAudioNodeId === node.id}
        />
      ))}
    </>
  );
}

// ============================================================
// MAIN COMPONENT CONTAINER EXPORT (With control overlays)
// ============================================================
interface MyceliumGraphProps {
  nodes: SomaticNode[];
  links: SomaticLink[];
  currentWorld: World;
  language: 'ru' | 'en';
  onNodeSelect: (node: SomaticNode) => void;
  selectedNodeId: string | null;
  themeColor: string;
  overlayUser: string | null;
  onNodeResonate?: (nodeId: string) => void;
  resonatedNodeIds?: Set<string> | string[];
  carriedNodeIds?: Set<string> | string[];
  currentUserName?: string;
  activeAudioNodeId?: string | null;
  visibleLayers?: VisibleLayers;
}

export default function MyceliumGraph(props: MyceliumGraphProps) {
  const [isFilterHot, setIsFilterHot] = useState(false);

  // Safely normalize set collections supporting both arrays or sets
  const resSet = props.resonatedNodeIds instanceof Set
    ? props.resonatedNodeIds
    : new Set(props.resonatedNodeIds || []);

  const carrSet = props.carriedNodeIds instanceof Set
    ? props.carriedNodeIds
    : new Set(props.carriedNodeIds || []);

  return (
    <div className="relative w-full h-full select-none" id="webgl-canvas-box-container">
      <Canvas
        camera={{ position: [0, 0, 24], fov: 55, near: 0.1, far: 500 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false
        }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
      >
        <color attach="background" args={['#050508']} />
        <fog attach="fog" args={['#050508', 35, 100]} />

        <GraphScene
          nodes={props.nodes}
          links={props.links}
          currentWorld={props.currentWorld}
          language={props.language}
          onNodeSelect={props.onNodeSelect}
          selectedNodeId={props.selectedNodeId}
          overlayUser={props.overlayUser}
          resonatedNodeIds={resSet}
          carriedNodeIds={carrSet}
          currentUserName={props.currentUserName}
          isFilterHot={isFilterHot}
          activeAudioNodeId={props.activeAudioNodeId || null}
          visibleLayers={props.visibleLayers}
        />
      </Canvas>

      {/* "HOT" resonances filter toggle bar */}
      <div className="absolute bottom-16 left-4 flex gap-1.5 z-20 bg-[#0C111D]/80 backdrop-blur-md p-1.5 rounded-xl border border-white/5 shadow-xl">
        <button
          onClick={() => setIsFilterHot(!isFilterHot)}
          className={`p-2 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 px-3 text-xs font-medium cursor-pointer ${
            isFilterHot ? 'text-amber-400 bg-amber-500/15' : 'text-gray-400 bg-white/5'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{isFilterHot
            ? (props.language === 'ru' ? 'ГОРЯЧИЕ' : 'HOT')
            : (props.language === 'ru' ? 'ВСЕ' : 'ALL')
          }</span>
        </button>
      </div>

      {/* Navigation Help overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/20 pointer-events-none select-none text-center">
        {props.language === 'ru'
          ? 'Вращение: левый клик + drag • Зум: скролл / два пальца • Пан: правый клик + drag'
          : 'Rotate: left-click drag • Zoom: scroll / pinch • Pan: right-click drag'}
      </div>
    </div>
  );
}
