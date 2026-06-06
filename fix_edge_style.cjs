const fs = require('fs');
let content = fs.readFileSync('src/components/MyceliumGraph.tsx', 'utf8');

// 1. Update MyceliumEdge props to accept 'type' and 'linkId' (optional)
const targetEdgeDef = `function MyceliumEdge({
  source, target, color, activity, isActive
}: {
  source: SomaticNode; target: SomaticNode;
  color: string; activity: number; isActive: boolean;
}) {`;

const replacementEdgeDef = `function MyceliumEdge({
  source, target, color, activity, isActive, edgeType
}: {
  source: SomaticNode; target: SomaticNode;
  color: string; activity: number; isActive: boolean;
  edgeType?: string;
}) {`;

content = content.replace(targetEdgeDef, replacementEdgeDef);

// 2. Modify rendering based on edgeType
// Line materials in react-three-fiber: <lineBasicMaterial> for solid, <lineDashedMaterial> for dashed/dotted.
// For dashed material, we need to call computeLineDistances on geometry, or just use colors and opacity.

const targetMaterial = `      <line ref={lineRef as any}>
        <bufferGeometry />
        <lineBasicMaterial color={lineColor} transparent opacity={opacity} />
      </line>`;

const replacementMaterial = `      <line ref={lineRef as any}>
        <bufferGeometry />
        {edgeType === 'conceptual' ? (
           <lineDashedMaterial color="#88CCFF" transparent opacity={opacity * 0.8} dashSize={0.2} gapSize={0.1} />
        ) : edgeType === 'historical' ? (
           <lineBasicMaterial color="#FFB84D" transparent opacity={opacity} />
        ) : edgeType === 'practical' ? (
           <lineDashedMaterial color="#4DFF88" transparent opacity={opacity} dashSize={0.05} gapSize={0.1} />
        ) : edgeType === 'opposition' ? (
           <lineBasicMaterial color="#FF4D4D" transparent opacity={opacity * (1.2 + Math.sin(Date.now() * 0.005) * 0.5)} />
        ) : edgeType === 'resonance' ? (
           <lineBasicMaterial color="#FFFFFF" transparent opacity={opacity * 0.3} linewidth={0.5} />
        ) : (
           <lineBasicMaterial color={lineColor} transparent opacity={opacity} />
        )}
      </line>`;

content = content.replace(targetMaterial, replacementMaterial);

// Add computeLineDistances for dashed materials to work correctly
const targetCurveLoop = `    if (lineRef.current) {
      const pts = curve.getPoints(24);
      (lineRef.current.geometry as THREE.BufferGeometry).setFromPoints(pts);
    }`;

const replacementCurveLoop = `    if (lineRef.current) {
      const pts = curve.getPoints(24);
      const geom = lineRef.current.geometry as THREE.BufferGeometry;
      geom.setFromPoints(pts);
      if (edgeType === 'conceptual' || edgeType === 'practical') {
        lineRef.current.computeLineDistances();
      }
    }`;

content = content.replace(targetCurveLoop, replacementCurveLoop);

// 3. Update MyceliumEdge call site
const targetCallSite = `        return (
          <MyceliumEdge
            key={link.id}
            source={src}
            target={tgt}
            color={color}
            activity={link.activity}
            isActive={isActive}
          />
        );`;

const replacementCallSite = `        return (
          <MyceliumEdge
            key={link.id}
            source={src}
            target={tgt}
            color={color}
            activity={link.activity}
            isActive={isActive}
            edgeType={link.type}
          />
        );`;

content = content.replace(targetCallSite, replacementCallSite);

fs.writeFileSync('src/components/MyceliumGraph.tsx', content);
console.log("Updated MyceliumGraph.tsx edge styles");
