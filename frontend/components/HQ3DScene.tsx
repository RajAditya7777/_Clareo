"use client";

import { useRef, Suspense, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

// ─── Palette ──────────────────────────────────────────────────────────────────
const FL  = "#f0dab0"; // floor warm beige
const WB  = "#c2c1ba"; // back wall
const WS  = "#b2b1aa"; // side wall
const DK  = "#c07840"; // desk wood warm
const DKD = "#8B4A20"; // desk dark legs
const CH  = "#28282e"; // chair dark
const SB  = "#3a5888"; // sofa blue
const SL  = "#5c3020"; // shelf brown
const PG  = "#2a6a38"; // plant green
const PP  = "#8a6010"; // plant pot
const LP  = "#5a5a5a"; // lamp pole
const LS  = "#d4a040"; // lamp shade
const PT  = "#929290"; // partition
const MN  = "#1a1a28"; // monitor body
const SC  = "#2060a0"; // screen blue
const HT  = "#c07840"; // hex table
const CC  = "#c8b88a"; // counter/cabinet beige
const WC  = "#b0d0e0"; // water cooler
const RT  = "#c07840"; // round meeting table
const WH  = "#e8e8e0"; // whiteboard

// ─── Agents ───────────────────────────────────────────────────────────────────
const AGENTS = [
  {
    name: "Luke",
    outfit: "#3a8a9a", skin: "#c68642", pants: "#1a2a3a",
    role: "Job Scraper",
    emoji: "🔍",
    accent: "#3a8a9a",
    status: "Scraping web 24/7",
    tasks: [
      "Crawls LinkedIn, Greenhouse & Lever",
      "Extracts job titles, salaries & stacks",
      "Feeds raw listings to the pipeline",
    ],
  },
  {
    name: "Allan",
    outfit: "#2a5a6a", skin: "#a05028", pants: "#1a2030",
    role: "Resume Parser",
    emoji: "📄",
    accent: "#2a7a9a",
    status: "Parsing your profile",
    tasks: [
      "Reads and chunks your PDF resume",
      "Extracts skills, stack & seniority",
      "Builds your professional DNA vector",
    ],
  },
  {
    name: "Ben",
    outfit: "#2a9090", skin: "#c8a060", pants: "#1a2a3a",
    role: "JD Analyst",
    emoji: "🧠",
    accent: "#2a9090",
    status: "Analysing job descriptions",
    tasks: [
      "Decodes must-have vs nice-to-have skills",
      "Scores seniority and culture signals",
      "Flags salary range & remote policy",
    ],
  },
  {
    name: "Cory",
    outfit: "#c83060", skin: "#d09060", pants: "#1a1a2a",
    role: "Match Maker",
    emoji: "🎯",
    accent: "#c83060",
    status: "Running similarity scores",
    tasks: [
      "Computes semantic match score 0–100",
      "Ranks jobs by fit for your goals",
      "Filters out roles below 60% match",
    ],
  },
  {
    name: "neviton",
    outfit: "#c83070", skin: "#8a401a", pants: "#181828",
    role: "Ghost Writer",
    emoji: "✍️",
    accent: "#c83070",
    status: "Drafting cover letters",
    tasks: [
      "Writes tailored cover letters per job",
      "Adapts tone to company culture",
      "Generates ATS-optimised resume summaries",
    ],
  },
  {
    name: "Susie",
    outfit: "#7a7830", skin: "#d4a070", pants: "#2a2a1a",
    role: "Auto Applier",
    emoji: "🤖",
    accent: "#a0a030",
    status: "Filling application forms",
    tasks: [
      "Navigates Greenhouse & Lever forms",
      "Auto-fills fields from your profile",
      "Submits applications on your behalf",
    ],
  },
  {
    name: "Rex",
    outfit: "#5050c0", skin: "#c8a060", pants: "#1a1a3a",
    role: "Tracker",
    emoji: "📊",
    accent: "#5050c0",
    status: "Logging all applications",
    tasks: [
      "Saves every submission to your dashboard",
      "Monitors status changes & rejections",
      "Alerts you when interviews are scheduled",
    ],
  },
  {
    name: "Maya",
    outfit: "#a03080", skin: "#d4a070", pants: "#2a1a2a",
    role: "Market Intel",
    emoji: "📊",
    accent: "#a03080",
    status: "Monitoring market trends",
    tasks: [
      "Tracks salary benchmarks by role",
      "Spots rising & declining tech stacks",
      "Reports weekly demand shifts to you",
    ],
  },
];

// Roaming zones for agents (spread around the office)
const WALK_CENTERS: [number, number, number][] = [
  [-2.0, 0, -3.0],
  [ 1.5, 0, -4.5],
  [ 3.5, 0,  1.0],
  [-4.5, 0,  1.5],
  [ 0.5, 0,  0.0],
  [-8.0, 0,  0.5],
  [ 6.5, 0, -2.0],
  [ 1.0, 0,  4.5],
];

// ─── Primitives ───────────────────────────────────────────────────────────────
type V3 = [number, number, number];

function B({ p, s, c, r }: { p: V3; s: V3; c: string; r?: V3 }) {
  return (
    <mesh position={p} rotation={r ?? [0, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshLambertMaterial color={c} />
    </mesh>
  );
}

function Cy({ p, r, h, c, sides = 10, rx = 0 }: {
  p: V3; r: number; h: number; c: string; sides?: number; rx?: number;
}) {
  return (
    <mesh position={p} rotation={[rx, 0, 0]} castShadow>
      <cylinderGeometry args={[r, r, h, sides]} />
      <meshLambertMaterial color={c} />
    </mesh>
  );
}

// ─── Workstation (desk + monitor + keyboard) ──────────────────────────────────
function Desk({ p, ry = 0 }: { p: V3; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <B p={[0, 0.75, 0]}    s={[1.5, 0.06, 0.8]}  c={DK} />
      <B p={[0, 0.5,  0.38]} s={[1.5, 0.44, 0.06]} c="#a06838" />
      {([-0.66, 0.66] as number[]).map((x, i) =>
        ([-0.35, 0.35] as number[]).map((z, j) => (
          <B key={`${i}${j}`} p={[x, 0.35, z]} s={[0.06, 0.72, 0.06]} c={DKD} />
        ))
      )}
      {/* Monitor */}
      <B p={[0, 1.15, -0.24]} s={[0.6, 0.42, 0.05]} c={MN} />
      <B p={[0, 1.15, -0.21]} s={[0.54, 0.36, 0.01]} c={SC} />
      <B p={[0, 0.82, -0.22]} s={[0.05, 0.16, 0.05]} c={MN} />
      <B p={[0, 0.79,  0.08]} s={[0.46, 0.02, 0.2]}  c="#222230" />
    </group>
  );
}

// ─── Chair ────────────────────────────────────────────────────────────────────
function Chair({ p, ry = 0 }: { p: V3; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <B p={[0, 0.48, 0]}    s={[0.46, 0.06, 0.46]} c={CH} />
      <B p={[0, 0.79, -0.22]} s={[0.46, 0.62, 0.06]} c="#202028" />
      <B p={[-0.2, 0.62, 0]} s={[0.05, 0.28, 0.42]} c="#202028" />
      <B p={[ 0.2, 0.62, 0]} s={[0.05, 0.28, 0.42]} c="#202028" />
      <Cy p={[0, 0.22, 0]} r={0.04} h={0.44} c="#1a1a22" />
      <B p={[0, 0.04, 0]} s={[0.32, 0.04, 0.32]} c="#1a1a22" />
    </group>
  );
}

// ─── Hex conference table ─────────────────────────────────────────────────────
function HexTable({ p, scale = 1 }: { p: V3; scale?: number }) {
  return (
    <group position={p}>
      <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[1.3 * scale, 1.3 * scale, 0.09, 6]} />
        <meshLambertMaterial color={HT} />
      </mesh>
      <Cy p={[0, 0.42, 0]} r={0.07} h={0.8} c={DKD} />
      <B p={[0, 0.04, 0]} s={[0.44, 0.06, 0.44]} c={DKD} />
    </group>
  );
}

// ─── Round meeting table ─────────────────────────────────────────────────────
function RoundTable({ p, r = 0.7 }: { p: V3; r?: number }) {
  return (
    <group position={p}>
      <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
        <cylinderGeometry args={[r, r, 0.07, 24]} />
        <meshLambertMaterial color={RT} />
      </mesh>
      <Cy p={[0, 0.38, 0]} r={0.05} h={0.74} c={DKD} />
      <B p={[0, 0.04, 0]} s={[0.36, 0.05, 0.36]} c={DKD} />
    </group>
  );
}

// ─── Sofa ─────────────────────────────────────────────────────────────────────
function Sofa({ p, ry = 0, w = 2.0 }: { p: V3; ry?: number; w?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <B p={[ 0,         0.36, 0]}        s={[w,    0.44, 0.78]} c={SB} />
      <B p={[ 0,         0.72, -0.37]}    s={[w,    0.66, 0.15]} c="#2a4878" />
      <B p={[-(w/2-0.05), 0.58, 0]}       s={[0.15, 0.56, 0.78]} c="#2a4878" />
      <B p={[ (w/2-0.05), 0.58, 0]}       s={[0.15, 0.56, 0.78]} c="#2a4878" />
      {[-0.55, 0.55].map((x, i) => (
        <B key={i} p={[x*(w*0.44), 0.06, 0]} s={[0.12, 0.12, 0.6]} c="#1a2838" />
      ))}
    </group>
  );
}

// ─── Coffee table ─────────────────────────────────────────────────────────────
function CoffeeTable({ p, w = 1.0 }: { p: V3; w?: number }) {
  return (
    <group position={p}>
      <B p={[0, 0.34, 0]} s={[w, 0.06, 0.55]} c="#8a4a18" />
      {([-w*0.4, w*0.4] as number[]).map((x, i) =>
        ([-0.2, 0.2] as number[]).map((z, j) => (
          <B key={`${i}${j}`} p={[x, 0.16, z]} s={[0.05, 0.32, 0.05]} c="#6a3a10" />
        ))
      )}
    </group>
  );
}

// ─── Bookshelf ────────────────────────────────────────────────────────────────
function Bookshelf({ p, ry = 0, tall = false }: { p: V3; ry?: number; tall?: boolean }) {
  const h = tall ? 2.4 : 1.8;
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <B p={[0, h/2, 0]} s={[0.5, h, 0.28]} c={SL} />
      {[0.2, 0.55, 0.9, 1.26, ...(tall ? [1.62, 2.0] : [])].map((y, i) => (
        <B key={i} p={[0, y, 0.01]} s={[0.46, 0.04, 0.26]} c="#6e4030" />
      ))}
      {["#c84028","#2850a0","#28a050","#d0a020","#8030c0","#e06020"].map((col, i) => (
        <B key={i} p={[-0.16 + (i % 3)*0.14, 0.38 + Math.floor(i/3)*0.36, 0.01]}
          s={[0.1, 0.3, 0.22]} c={col} />
      ))}
    </group>
  );
}

// ─── Plant ────────────────────────────────────────────────────────────────────
function Plant({ p, big = false }: { p: V3; big?: boolean }) {
  const scale = big ? 1.4 : 1;
  return (
    <group position={p}>
      <Cy p={[0, 0.15*scale, 0]} r={0.14*scale} h={0.3*scale} c={PP} />
      <mesh castShadow position={[0, 0.52*scale, 0]}>
        <sphereGeometry args={[0.3*scale, 8, 6]} />
        <meshLambertMaterial color={PG} />
      </mesh>
      {big && (
        <mesh castShadow position={[0.18, 0.62*scale, 0]}>
          <sphereGeometry args={[0.18, 8, 6]} />
          <meshLambertMaterial color="#1a5228" />
        </mesh>
      )}
      <B p={[0, 0.36*scale, 0]} s={[0.05, 0.2*scale, 0.05]} c="#4a3010" />
    </group>
  );
}

// ─── Floor lamp ───────────────────────────────────────────────────────────────
function FloorLamp({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Cy p={[0, 0.8, 0]} r={0.025} h={1.6} c={LP} />
      <mesh castShadow position={[0, 1.65, 0]}>
        <coneGeometry args={[0.2, 0.28, 10, 1, true]} />
        <meshLambertMaterial color={LS} side={THREE.DoubleSide} />
      </mesh>
      <Cy p={[0, 0.05, 0]} r={0.09} h={0.1} c={LP} />
      <pointLight color="#ffeecc" intensity={0.6} distance={4} position={[0, 1.55, 0]} />
    </group>
  );
}

// ─── Partition wall ───────────────────────────────────────────────────────────
function Partition({ p, w = 3.0, h = 1.9, ry = 0 }: { p: V3; w?: number; h?: number; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <B p={[0, h/2, 0]} s={[w, h, 0.1]} c={PT} />
      <B p={[-(w/2), h/2, 0]} s={[0.07, h+0.06, 0.13]} c="#727270" />
      <B p={[ (w/2), h/2, 0]} s={[0.07, h+0.06, 0.13]} c="#727270" />
      <B p={[0, h+0.03, 0]} s={[w+0.07, 0.06, 0.13]} c="#727270" />
    </group>
  );
}

// ─── Whiteboard ───────────────────────────────────────────────────────────────
function Whiteboard({ p, ry = 0 }: { p: V3; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <B p={[0, 0, 0]}    s={[2.0, 1.1, 0.06]} c="#888880" />
      <B p={[0, 0, 0.04]} s={[1.88, 1.0, 0.02]} c={WH} />
      {/* Line drawings on whiteboard */}
      <B p={[-0.4, 0.1, 0.06]} s={[0.8, 0.02, 0.01]} c="#cccccc" />
      <B p={[-0.4, 0.0, 0.06]} s={[0.5, 0.02, 0.01]} c="#aaaaff" />
      <B p={[ 0.5, 0.2, 0.06]} s={[0.3, 0.3,  0.01]} c="#ffaaaa" />
    </group>
  );
}

// ─── Cabinet / kitchen counter ────────────────────────────────────────────────
function Cabinet({ p, w = 1.8, ry = 0 }: { p: V3; w?: number; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <B p={[0, 0.48, 0]}  s={[w, 0.96, 0.52]} c={CC} />
      <B p={[0, 0.98, 0]}  s={[w+0.02, 0.06, 0.54]} c="#d8c89a" />
      {/* Doors */}
      <B p={[-w*0.25, 0.46, 0.27]} s={[w*0.46, 0.88, 0.02]} c="#daced0" />
      <B p={[ w*0.25, 0.46, 0.27]} s={[w*0.46, 0.88, 0.02]} c="#daced0" />
      <B p={[-w*0.25, 0.46, 0.28]} s={[0.04, 0.04, 0.02]} c="#888" />
      <B p={[ w*0.25, 0.46, 0.28]} s={[0.04, 0.04, 0.02]} c="#888" />
    </group>
  );
}

// ─── Water cooler ─────────────────────────────────────────────────────────────
function WaterCooler({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <B p={[0, 0.54, 0]} s={[0.3, 1.06, 0.3]} c="#d0d8e0" />
      <mesh castShadow position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.28, 14]} />
        <meshLambertMaterial color={WC} />
      </mesh>
      <B p={[0, 0.06, 0]} s={[0.32, 0.12, 0.32]} c="#b0b8c0" />
    </group>
  );
}

// ─── Wall TV ──────────────────────────────────────────────────────────────────
function WallTV({ p, ry = 0, w = 1.2 }: { p: V3; ry?: number; w?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <B p={[0, 0, 0]}    s={[w, 0.65, 0.07]} c="#1a1a28" />
      <B p={[0, 0, 0.04]} s={[w*0.92, 0.57, 0.02]} c="#1a3a60" />
    </group>
  );
}

// ─── Executive L-desk ─────────────────────────────────────────────────────────
function LDesk({ p, ry = 0 }: { p: V3; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <B p={[0, 0.75, 0]}    s={[1.8, 0.07, 0.85]} c={DK} />
      <B p={[0.85, 0.75, 0.7]} s={[0.12, 0.07, 0.72]} c={DK} />
      <B p={[0, 0.5, 0.4]}   s={[1.8, 0.44, 0.07]} c="#a06838" />
      {([-0.82, 0.82] as number[]).map((x, i) =>
        ([-0.38, 0.38] as number[]).map((z, j) => (
          <B key={`${i}${j}`} p={[x, 0.35, z]} s={[0.07, 0.72, 0.07]} c={DKD} />
        ))
      )}
      <B p={[0.82, 0.35, 0.76]}  s={[0.07, 0.72, 0.07]} c={DKD} />
      {/* Dual monitors */}
      <B p={[-0.3, 1.17, -0.26]} s={[0.58, 0.42, 0.05]} c={MN} />
      <B p={[-0.3, 1.17, -0.23]} s={[0.52, 0.36, 0.01]} c={SC} />
      <B p={[-0.3, 0.83, -0.23]} s={[0.05, 0.16, 0.05]} c={MN} />
      <B p={[ 0.4, 1.17, -0.26]} s={[0.58, 0.42, 0.05]} c={MN} />
      <B p={[ 0.4, 1.17, -0.23]} s={[0.52, 0.36, 0.01]} c={SC} />
      <B p={[ 0.4, 0.83, -0.23]} s={[0.05, 0.16, 0.05]} c={MN} />
      <B p={[0, 0.79, 0.1]}      s={[0.5,  0.02, 0.2]}  c="#222230" />
    </group>
  );
}

// ─── Blocky agent character ───────────────────────────────────────────────────
function AgentAvatar({
  agent, center, idx,
}: {
  agent: typeof AGENTS[number];
  center: V3;
  idx: number;
}) {
  const groupRef     = useRef<THREE.Group>(null!);
  const leftLegRef   = useRef<THREE.Mesh>(null!);
  const rightLegRef  = useRef<THREE.Mesh>(null!);
  const leftArmRef   = useRef<THREE.Mesh>(null!);
  const rightArmRef  = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const phase  = (idx / AGENTS.length) * Math.PI * 2;
  const radius = 0.55 + (idx % 4) * 0.12;
  const speed  = 0.24 + (idx % 5) * 0.05;

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + phase;
    groupRef.current.position.set(
      center[0] + Math.cos(t) * radius,
      Math.sin(state.clock.elapsedTime * 4 + phase) * 0.022,
      center[2] + Math.sin(t) * radius * 0.7,
    );
    const dx = -Math.sin(t) * radius;
    const dz =  Math.cos(t) * radius * 0.7;
    groupRef.current.rotation.y = Math.atan2(dx, dz);
    const swing = Math.sin(state.clock.elapsedTime * 5 + phase) * 0.4;
    if (leftLegRef.current)  leftLegRef.current.rotation.x  =  swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    if (leftArmRef.current)  leftArmRef.current.rotation.x  = -swing * 0.7;
    if (rightArmRef.current) rightArmRef.current.rotation.x  =  swing * 0.7;
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Head */}
      <mesh position={[0, 1.38, 0]} castShadow>
        <boxGeometry args={[0.32, 0.32, 0.32]} />
        <meshLambertMaterial color={hovered ? "#ffffff" : agent.skin} />
      </mesh>
      {/* Eyes */}
      {[-0.07, 0.07].map((ex, i) => (
        <mesh key={i} position={[ex, 1.39, 0.162]}>
          <planeGeometry args={[0.055, 0.055]} />
          <meshLambertMaterial color="#1a1a1a" />
        </mesh>
      ))}
      {/* Body */}
      <mesh position={[0, 0.92, 0]} castShadow>
        <boxGeometry args={[0.3, 0.42, 0.2]} />
        <meshLambertMaterial color={agent.outfit} />
      </mesh>
      {/* Left arm */}
      <mesh ref={leftArmRef} position={[-0.22, 0.9, 0]} castShadow>
        <boxGeometry args={[0.11, 0.4, 0.13]} />
        <meshLambertMaterial color={agent.outfit} />
      </mesh>
      {/* Right arm */}
      <mesh ref={rightArmRef} position={[0.22, 0.9, 0]} castShadow>
        <boxGeometry args={[0.11, 0.4, 0.13]} />
        <meshLambertMaterial color={agent.outfit} />
      </mesh>
      {/* Left leg */}
      <mesh ref={leftLegRef} position={[-0.09, 0.44, 0]} castShadow>
        <boxGeometry args={[0.13, 0.42, 0.15]} />
        <meshLambertMaterial color={agent.pants} />
      </mesh>
      {/* Right leg */}
      <mesh ref={rightLegRef} position={[0.09, 0.44, 0]} castShadow>
        <boxGeometry args={[0.13, 0.42, 0.15]} />
        <meshLambertMaterial color={agent.pants} />
      </mesh>
      {/* Name tag and Tooltip */}
      <Html 
        position={[0, 1.78, 0]} 
        center 
        style={{ 
          pointerEvents: "none", 
          whiteSpace: "nowrap",
          zIndex: hovered ? 100 : 1
        }}
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              background: "rgba(10, 10, 12, 0.92)",
              backdropFilter: "blur(12px)",
              color: "#fff",
              padding: hovered ? "12px 16px" : "4px 10px",
              borderRadius: hovered ? "12px" : "6px",
              fontSize: "12px",
              fontFamily: "var(--font-inter, system-ui, sans-serif)",
              display: "flex",
              flexDirection: "column",
              gap: hovered ? "8px" : "0px",
              boxShadow: hovered 
                ? "0 10px 25px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.1) inset" 
                : "0 4px 12px rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.08)",
              minWidth: hovered ? 220 : "auto",
              pointerEvents: "none",
            }}
          >
            {/* Header: Name + Status */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{agent.name}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 500, background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4 }}>
                  {agent.role}
                </span>
              </div>
              <span style={{ color: "#10B981", fontSize: 10 }}>●</span>
            </div>

            {/* Expanded content on hover */}
            {hovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                <div style={{ 
                  fontSize: 11, 
                  color: "rgba(255,255,255,0.6)", 
                  fontStyle: "italic",
                  lineHeight: 1.4
                }}>
                  "{agent.status}"
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Core Responsibilities
                  </div>
                  {agent.tasks.map((task, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>
                      <span style={{ color: agent.accent, marginTop: 1 }}>•</span>
                      {task}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </Html>
    </group>
  );
}

// ─── Camera: proper isometric lookAt ─────────────────────────────────────────
function IsometricCamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(14, 14, 14);
    (camera as THREE.OrthographicCamera).zoom = 52;
    camera.lookAt(1, 0, -2);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

// ─── Full scene ───────────────────────────────────────────────────────────────
function SceneContent() {
  return (
    <>
      {/* ── LIGHTING ── */}
      <ambientLight intensity={0.72} color="#fff5e8" />
      <directionalLight
        position={[8, 14, 8]} intensity={0.95} color="#fff8f0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18} shadow-camera-right={18}
        shadow-camera-top={14}  shadow-camera-bottom={-14}
      />
      <directionalLight position={[-6, 8, -6]} intensity={0.22} color="#dde8ff" />

      {/* ── ROOM: 22 × 16 ── */}
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 16]} />
        <meshLambertMaterial color={FL} />
      </mesh>
      {/* Back wall Z=-8 */}
      <B p={[0, 1.9, -8]}  s={[22, 3.8, 0.14]} c={WB} />
      {/* Left wall X=-11 */}
      <B p={[-11, 1.9, 0]} s={[0.14, 3.8, 16]} c={WS} />
      {/* Right wall X=11 */}
      <B p={[11, 1.9, 0]}  s={[0.14, 3.8, 16]} c={WS} />
      {/* Skirting */}
      <B p={[0, 0.07, -7.94]}  s={[22, 0.14, 0.04]} c="#787870" />
      <B p={[-10.94, 0.07, 0]} s={[0.04, 0.14, 16]} c="#787870" />

      {/* ══════════════════════════════════════════
          ZONE 1 — CONFERENCE ROOM (top-left)
          X: -11..−3   Z: -8..−3
         ══════════════════════════════════════════ */}
      {/* Partition separating conference from open office */}
      <Partition p={[-3.2, 0, -2.8] as V3} w={0.14} h={2.2} ry={0} />
      <Partition p={[-6.5, 0, -2.8] as V3} w={5.5}  h={2.2} />
      {/* Back of conference: partition inside */}
      <Partition p={[-3.2, 0, -5.5] as V3} w={0.14} h={2.2} ry={0} />

      {/* Large hex conference table */}
      <HexTable p={[-7.0, 0, -5.5] as V3} scale={1.25} />
      {/* 6 chairs around hex table */}
      <Chair p={[-7.0, 0, -4.1] as V3} ry={0} />
      <Chair p={[-7.0, 0, -6.9] as V3} ry={Math.PI} />
      <Chair p={[-8.5, 0, -5.5] as V3} ry={Math.PI / 2} />
      <Chair p={[-5.5, 0, -5.5] as V3} ry={-Math.PI / 2} />
      <Chair p={[-8.2, 0, -4.3] as V3} ry={Math.PI * 0.7} />
      <Chair p={[-5.8, 0, -6.6] as V3} ry={-Math.PI * 0.3} />

      {/* Whiteboard on back wall of conference */}
      <Whiteboard p={[-7.0, 2.0, -7.92] as V3} />

      {/* Plants in conference corners */}
      <Plant p={[-10.5, 0, -7.5] as V3} big />
      <Plant p={[-4.0,  0, -7.5] as V3} />

      {/* ══════════════════════════════════════════
          ZONE 2 — OPEN OFFICE (center)
          X: -3..6   Z: -8..2
         ══════════════════════════════════════════ */}

      {/* Row A — back row, 4 desks */}
      <Desk p={[-2.0, 0, -6.5] as V3} />
      <Chair p={[-2.0, 0, -5.7] as V3} ry={0} />
      <Desk p={[ 0.5, 0, -6.5] as V3} />
      <Chair p={[ 0.5, 0, -5.7] as V3} ry={0} />
      <Desk p={[ 3.0, 0, -6.5] as V3} />
      <Chair p={[ 3.0, 0, -5.7] as V3} ry={0} />
      <Desk p={[ 5.5, 0, -6.5] as V3} />
      <Chair p={[ 5.5, 0, -5.7] as V3} ry={0} />

      {/* Row B — middle row, 4 desks (facing opposite) */}
      <Desk p={[-2.0, 0, -4.6] as V3} ry={Math.PI} />
      <Chair p={[-2.0, 0, -3.9] as V3} ry={0} />
      <Desk p={[ 0.5, 0, -4.6] as V3} ry={Math.PI} />
      <Chair p={[ 0.5, 0, -3.9] as V3} ry={0} />
      <Desk p={[ 3.0, 0, -4.6] as V3} ry={Math.PI} />
      <Chair p={[ 3.0, 0, -3.9] as V3} ry={0} />
      <Desk p={[ 5.5, 0, -4.6] as V3} ry={Math.PI} />
      <Chair p={[ 5.5, 0, -3.9] as V3} ry={0} />

      {/* Row C — front row, 4 desks */}
      <Desk p={[-2.0, 0, -2.6] as V3} />
      <Chair p={[-2.0, 0, -1.8] as V3} ry={0} />
      <Desk p={[ 0.5, 0, -2.6] as V3} />
      <Chair p={[ 0.5, 0, -1.8] as V3} ry={0} />
      <Desk p={[ 3.0, 0, -2.6] as V3} />
      <Chair p={[ 3.0, 0, -1.8] as V3} ry={0} />
      <Desk p={[ 5.5, 0, -2.6] as V3} />
      <Chair p={[ 5.5, 0, -1.8] as V3} ry={0} />

      {/* Plants between desk rows */}
      <Plant p={[-3.1, 0, -5.55] as V3} />
      <Plant p={[ 6.8, 0, -5.55] as V3} />
      <Plant p={[-3.1, 0, -3.6] as V3} />
      <Plant p={[ 6.8, 0, -3.6] as V3} />

      {/* ══════════════════════════════════════════
          ZONE 3 — EXECUTIVE AREA (right)
          X: 7..11   Z: -8..2
         ══════════════════════════════════════════ */}
      <Partition p={[6.8, 0, -1.5] as V3} w={0.14} h={2.4} ry={0} />
      <Partition p={[6.8, 0, -5.0] as V3} w={0.14} h={2.4} ry={0} />

      <LDesk p={[8.8, 0, -5.5] as V3} ry={Math.PI / 2} />
      <Chair p={[7.9, 0, -5.5] as V3} ry={Math.PI / 2} />

      {/* Small meeting area inside exec zone */}
      <RoundTable p={[9.0, 0, -2.5] as V3} r={0.8} />
      <Chair p={[9.0, 0, -1.5] as V3} ry={0} />
      <Chair p={[9.0, 0, -3.5] as V3} ry={Math.PI} />
      <Chair p={[8.0, 0, -2.5] as V3} ry={Math.PI / 2} />
      <Chair p={[10.0,0, -2.5] as V3} ry={-Math.PI / 2} />

      {/* Bookshelves along right wall */}
      <Bookshelf p={[10.5, 0, -7.0] as V3} ry={Math.PI / 2} tall />
      <Bookshelf p={[10.5, 0, -5.6] as V3} ry={Math.PI / 2} tall />

      {/* Wall TV in exec area */}
      <WallTV p={[10.93, 2.0, -3.5] as V3} ry={-Math.PI / 2} w={1.4} />

      <Plant p={[10.5, 0, -0.5] as V3} big />
      <FloorLamp p={[10.2, 0, -1.4] as V3} />

      {/* ══════════════════════════════════════════
          ZONE 4 — LOUNGE / BREAKOUT (bottom-right)
          X: 2..11   Z: 2..8
         ══════════════════════════════════════════ */}
      <Partition p={[1.8, 0, 1.8] as V3} w={9.4} h={1.8} />

      {/* Facing sofas */}
      <Sofa p={[5.0, 0, 3.0] as V3} ry={0} w={2.2} />
      <Sofa p={[5.0, 0, 5.5] as V3} ry={Math.PI} w={2.2} />
      <CoffeeTable p={[5.0, 0, 4.25] as V3} w={1.3} />

      {/* Side sofa */}
      <Sofa p={[9.0, 0, 4.2] as V3} ry={-Math.PI / 2} w={2.0} />

      {/* Plants, lamps */}
      <Plant p={[2.5, 0, 3.0] as V3} big />
      <Plant p={[7.8, 0, 3.0] as V3} />
      <Plant p={[2.5, 0, 7.5] as V3} />
      <Plant p={[10.5,0, 7.5] as V3} big />
      <FloorLamp p={[2.8,  0, 5.5] as V3} />
      <FloorLamp p={[7.5,  0, 7.0] as V3} />

      {/* ══════════════════════════════════════════
          ZONE 5 — KITCHEN / BREAK ROOM (bottom-left)
          X: -11..-2   Z: 2..8
         ══════════════════════════════════════════ */}
      <Partition p={[-1.8, 0, 1.8] as V3} w={9.4} h={1.8} />

      {/* Counter along back wall */}
      <Cabinet p={[-7.5, 0, 7.5] as V3} w={3.4} ry={0} />
      <Cabinet p={[-3.5, 0, 7.5] as V3} w={2.0} ry={0} />

      {/* Water cooler */}
      <WaterCooler p={[-10.5, 0, 7.0] as V3} />

      {/* Small break table with chairs */}
      <RoundTable p={[-7.0, 0, 5.0] as V3} r={0.7} />
      <Chair p={[-7.0, 0, 4.1] as V3} ry={0} />
      <Chair p={[-7.0, 0, 5.9] as V3} ry={Math.PI} />
      <Chair p={[-6.1, 0, 5.0] as V3} ry={Math.PI / 2} />
      <Chair p={[-7.9, 0, 5.0] as V3} ry={-Math.PI / 2} />

      <Plant p={[-10.5, 0, 3.0] as V3} big />
      <Plant p={[-2.5,  0, 3.0] as V3} />
      <Plant p={[-5.5,  0, 7.5] as V3} />
      <FloorLamp p={[-10.2, 0, 5.0] as V3} />
      <FloorLamp p={[-3.0,  0, 7.0] as V3} />

      {/* ══════════════════════════════════════════
          ZONE 6 — OPEN COLLAB DESKS (bottom-center)
          X: -2..2   Z: 2..8
         ══════════════════════════════════════════ */}
      <Desk p={[-0.5, 0, 3.0] as V3} ry={Math.PI} />
      <Chair p={[-0.5, 0, 3.7] as V3} ry={0} />
      <Desk p={[ 1.5, 0, 3.0] as V3} ry={Math.PI} />
      <Chair p={[ 1.5, 0, 3.7] as V3} ry={0} />
      <Desk p={[-0.5, 0, 5.0] as V3} />
      <Chair p={[-0.5, 0, 4.3] as V3} ry={Math.PI} />
      <Desk p={[ 1.5, 0, 5.0] as V3} />
      <Chair p={[ 1.5, 0, 4.3] as V3} ry={Math.PI} />

      {/* ── AGENTS ── */}
      <Suspense fallback={null}>
        {AGENTS.map((agent, i) => (
          <AgentAvatar key={agent.name} agent={agent} center={WALK_CENTERS[i]} idx={i} />
        ))}
      </Suspense>

      {/* ── CAMERA ── */}
      <IsometricCamera />
    </>
  );
}


// ─── Loader ───────────────────────────────────────────────────────────────────
function HQLoader() {
  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#1a1408",
    }}>
      <div style={{
        width: 38, height: 38,
        border: "3px solid #c07840", borderTopColor: "transparent",
        borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 12,
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color: "#c07840", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em" }}>
        LOADING HQ...
      </span>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function HQ3DScene() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#1a1408", overflow: "hidden" }}>
      <Suspense fallback={<HQLoader />}>
        <Canvas
          orthographic
          shadows
          camera={{ zoom: 52, near: -300, far: 600 }}
          gl={{ antialias: true, alpha: false }}
          style={{ width: "100%", height: "100%", background: "#1a1408" }}
          dpr={[1, 1.5]}
        >
          <SceneContent />
        </Canvas>
      </Suspense>
    </div>
  );
}
