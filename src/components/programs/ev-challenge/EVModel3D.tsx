"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Grid } from "@react-three/drei";
import { useRef, useMemo, useEffect, Suspense } from "react";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/* Colors (match globals.css theme)                                   */
/* ------------------------------------------------------------------ */

const ACCENT = "#ccdef0";
const ACCENT_DIM = "#4a6a88";
const ACCENT_GLOW = "#e0eeff";

/* ------------------------------------------------------------------ */
/* Track tags (static — not translated)                               */
/* ------------------------------------------------------------------ */

const ENG_TAGS = ["CAD Design", "Chassis Build", "Electrical Systems", "Testing"];
const BIZ_TAGS = ["Sponsorship", "Budget", "Logistics", "Team Mgmt"];

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

type V3 = [number, number, number];

function ringPoints(r: number, n = 48): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r, 0] as V3;
  });
}

/* ------------------------------------------------------------------ */
/* Wheel                                                               */
/* ------------------------------------------------------------------ */

function Wheel({ pos, r = 0.24 }: { pos: V3; r?: number }) {
  const spokes = useMemo(() => {
    const count = 16;
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2;
      return [
        [0, 0, 0] as V3,
        [Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, 0] as V3,
      ];
    });
  }, [r]);

  const rim = useMemo(() => ringPoints(r, 48), [r]);
  const tire = useMemo(() => ringPoints(r * 1.08, 48), [r]);
  const hub = useMemo(() => ringPoints(0.035, 12), []);

  return (
    <group position={pos}>
      <Line points={tire} color={ACCENT_DIM} lineWidth={0.8} />
      <Line points={rim} color={ACCENT} lineWidth={1.5} />
      <Line points={hub} color={ACCENT} lineWidth={1} />
      {spokes.map((s, i) => (
        <Line
          key={i}
          points={s}
          color={ACCENT_DIM}
          lineWidth={0.4}
          transparent
          opacity={0.35}
        />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Frame geometry data                                                 */
/* X = front(-) to rear(+),  Y = up,  Z = left(-) / right(+)        */
/* ------------------------------------------------------------------ */

const F = {
  leftRail: [
    [-2.1, 0.08, -0.08],
    [-1.6, 0.08, -0.2],
    [-0.8, 0.08, -0.3],
    [0.0, 0.08, -0.32],
    [0.6, 0.08, -0.3],
    [1.2, 0.08, -0.18],
    [1.65, 0.1, 0],
  ] as V3[],

  rightRail: [
    [-2.1, 0.08, 0.08],
    [-1.6, 0.08, 0.2],
    [-0.8, 0.08, 0.3],
    [0.0, 0.08, 0.32],
    [0.6, 0.08, 0.3],
    [1.2, 0.08, 0.18],
    [1.65, 0.1, 0],
  ] as V3[],

  crosses: [
    [[-1.6, 0.08, -0.2], [-1.6, 0.08, 0.2]],
    [[-0.8, 0.08, -0.3], [-0.8, 0.08, 0.3]],
    [[0.0, 0.08, -0.32], [0.0, 0.08, 0.32]],
    [[0.6, 0.08, -0.3], [0.6, 0.08, 0.3]],
    [[1.2, 0.08, -0.18], [1.2, 0.08, 0.18]],
  ] as V3[][],

  leftUpper: [
    [-0.2, 0.08, -0.31],
    [0.0, 0.3, -0.31],
    [0.5, 0.36, -0.3],
    [0.9, 0.36, -0.24],
  ] as V3[],

  rightUpper: [
    [-0.2, 0.08, 0.31],
    [0.0, 0.3, 0.31],
    [0.5, 0.36, 0.3],
    [0.9, 0.36, 0.24],
  ] as V3[],

  upperCrosses: [
    [[0.1, 0.3, -0.31], [0.1, 0.3, 0.31]],
    [[0.5, 0.36, -0.3], [0.5, 0.36, 0.3]],
    [[0.9, 0.36, -0.24], [0.9, 0.36, 0.24]],
  ] as V3[][],

  diagonals: [
    [[-0.8, 0.08, -0.3], [0.0, 0.3, -0.31]],
    [[-0.8, 0.08, 0.3], [0.0, 0.3, 0.31]],
    [[0.6, 0.08, -0.3], [0.5, 0.36, -0.3]],
    [[0.6, 0.08, 0.3], [0.5, 0.36, 0.3]],
    [[1.2, 0.08, -0.18], [0.9, 0.36, -0.24]],
    [[1.2, 0.08, 0.18], [0.9, 0.36, 0.24]],
  ] as V3[][],

  cage: [
    [[0.45, 0.36, -0.28], [0.3, 0.98, -0.14]],
    [[0.45, 0.36, 0.28], [0.3, 0.98, 0.14]],
    [[0.3, 0.98, -0.14], [0.3, 0.98, 0.14]],
    [[0.9, 0.36, -0.24], [0.3, 0.98, -0.14]],
    [[0.9, 0.36, 0.24], [0.3, 0.98, 0.14]],
    [[0.1, 0.3, -0.3], [0.3, 0.98, -0.14]],
    [[0.1, 0.3, 0.3], [0.3, 0.98, 0.14]],
  ] as V3[][],

  steering: [[-1.5, 0.1, 0], [-1.68, 0.55, 0]] as V3[],
  handlebar: [
    [-1.72, 0.57, -0.15],
    [-1.68, 0.55, 0],
    [-1.72, 0.57, 0.15],
  ] as V3[],

  forks: [
    [[-1.65, 0.5, -0.06], [-1.55, 0.22, -0.22]],
    [[-1.65, 0.5, 0.06], [-1.55, 0.22, 0.22]],
  ] as V3[][],

  frontAxle: [[-1.55, 0.22, -0.22], [-1.55, 0.22, 0.22]] as V3[],

  rearFork: [
    [[1.2, 0.08, -0.12], [1.65, 0.28, 0]],
    [[1.2, 0.08, 0.12], [1.65, 0.28, 0]],
    [[0.9, 0.36, -0.18], [1.65, 0.28, 0]],
    [[0.9, 0.36, 0.18], [1.65, 0.28, 0]],
  ] as V3[][],

  panelBottom: [
    [-1.35, 0.1, 0.18],
    [-0.8, 0.1, 0.3],
    [-0.2, 0.1, 0.32],
    [0.4, 0.1, 0.32],
    [0.9, 0.1, 0.28],
    [1.15, 0.1, 0.2],
  ] as V3[],

  panelTop: [
    [-1.35, 0.32, 0.14],
    [-1.1, 0.38, 0.22],
    [-0.7, 0.4, 0.28],
    [-0.15, 0.38, 0.32],
    [0.4, 0.3, 0.33],
    [0.9, 0.18, 0.29],
    [1.15, 0.12, 0.2],
  ] as V3[],

  panelRibs: [
    [[-1.35, 0.1, 0.18], [-1.35, 0.32, 0.14]],
    [[-0.8, 0.1, 0.3], [-0.85, 0.39, 0.25]],
    [[-0.2, 0.1, 0.32], [-0.15, 0.38, 0.32]],
    [[0.4, 0.1, 0.32], [0.4, 0.3, 0.33]],
    [[0.9, 0.1, 0.28], [0.9, 0.18, 0.29]],
    [[1.15, 0.1, 0.2], [1.15, 0.12, 0.2]],
  ] as V3[][],

  seatL: [
    [0.15, 0.1, -0.12],
    [0.05, 0.22, -0.12],
    [0.3, 0.34, -0.12],
    [0.55, 0.3, -0.12],
    [0.6, 0.15, -0.12],
  ] as V3[],

  seatR: [
    [0.15, 0.1, 0.12],
    [0.05, 0.22, 0.12],
    [0.3, 0.34, 0.12],
    [0.55, 0.3, 0.12],
    [0.6, 0.15, 0.12],
  ] as V3[],

  seatCrosses: [
    [[0.05, 0.22, -0.12], [0.05, 0.22, 0.12]],
    [[0.55, 0.3, -0.12], [0.55, 0.3, 0.12]],
  ] as V3[][],
};

/* ------------------------------------------------------------------ */
/* EV model (all structural lines + wheels)                           */
/* ------------------------------------------------------------------ */

function EVModel({ reduceMotion, scrollProgress }: { reduceMotion: boolean; scrollProgress: { current: number } }) {
  const group = useRef<THREE.Group>(null);
  const rotationRef = useRef(0);
  const prevScrollRef = useRef(0);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (!reduceMotion) {
      const scrollDelta = scrollProgress.current - prevScrollRef.current;
      prevScrollRef.current = scrollProgress.current;
      rotationRef.current += 0.15 * delta + scrollDelta * Math.PI * 1.5;
      group.current.rotation.y = rotationRef.current;
      group.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.4) * 0.025;
    }
  });

  return (
    <group ref={group}>
      <Line points={F.leftRail} color={ACCENT} lineWidth={1.5} />
      <Line points={F.rightRail} color={ACCENT} lineWidth={1.5} />

      {F.crosses.map((pts, i) => (
        <Line key={`cx${i}`} points={pts} color={ACCENT_DIM} lineWidth={1} />
      ))}

      <Line points={F.leftUpper} color={ACCENT} lineWidth={1.2} />
      <Line points={F.rightUpper} color={ACCENT} lineWidth={1.2} />
      {F.upperCrosses.map((pts, i) => (
        <Line key={`uc${i}`} points={pts} color={ACCENT_DIM} lineWidth={0.8} />
      ))}

      {F.diagonals.map((pts, i) => (
        <Line
          key={`dg${i}`}
          points={pts}
          color={ACCENT_DIM}
          lineWidth={0.6}
          transparent
          opacity={0.5}
        />
      ))}

      {F.cage.map((pts, i) => (
        <Line
          key={`cg${i}`}
          points={pts}
          color={ACCENT_GLOW}
          lineWidth={1.5}
        />
      ))}

      <Line points={F.steering} color={ACCENT} lineWidth={1.2} />
      <Line points={F.handlebar} color={ACCENT} lineWidth={1.2} />

      {F.forks.map((pts, i) => (
        <Line key={`fk${i}`} points={pts} color={ACCENT_DIM} lineWidth={1} />
      ))}
      <Line points={F.frontAxle} color={ACCENT_DIM} lineWidth={0.8} />

      {F.rearFork.map((pts, i) => (
        <Line key={`rf${i}`} points={pts} color={ACCENT_DIM} lineWidth={1} />
      ))}

      <Line
        points={F.panelBottom}
        color={ACCENT}
        lineWidth={1}
        transparent
        opacity={0.5}
      />
      <Line
        points={F.panelTop}
        color={ACCENT}
        lineWidth={1}
        transparent
        opacity={0.5}
      />
      {F.panelRibs.map((pts, i) => (
        <Line
          key={`pr${i}`}
          points={pts}
          color={ACCENT_DIM}
          lineWidth={0.4}
          transparent
          opacity={0.3}
        />
      ))}

      <Line
        points={F.seatL}
        color={ACCENT_DIM}
        lineWidth={0.8}
        transparent
        opacity={0.4}
      />
      <Line
        points={F.seatR}
        color={ACCENT_DIM}
        lineWidth={0.8}
        transparent
        opacity={0.4}
      />
      {F.seatCrosses.map((pts, i) => (
        <Line
          key={`sc${i}`}
          points={pts}
          color={ACCENT_DIM}
          lineWidth={0.5}
          transparent
          opacity={0.3}
        />
      ))}

      <Wheel pos={[-1.55, 0.22, -0.22]} r={0.22} />
      <Wheel pos={[-1.55, 0.22, 0.22]} r={0.22} />
      <Wheel pos={[1.65, 0.28, 0]} r={0.28} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Floating particles                                                  */
/* ------------------------------------------------------------------ */

function Particles({ count = 120 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = Math.random() * 3 - 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.015;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.01}
        color={ACCENT}
        transparent
        opacity={0.2}
        sizeAttenuation
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Scene composition                                                   */
/* ------------------------------------------------------------------ */

function Scene({ reduceMotion, scrollProgress }: { reduceMotion: boolean; scrollProgress: { current: number } }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.15} color={ACCENT} />

      <EVModel reduceMotion={reduceMotion} scrollProgress={scrollProgress} />

      {!reduceMotion && <Particles />}

      <Grid
        position={[0, -0.03, 0]}
        args={[20, 20]}
        cellSize={0.4}
        cellThickness={0.5}
        cellColor="#1c1f26"
        sectionSize={2}
        sectionThickness={0.8}
        sectionColor="#252830"
        fadeDistance={8}
        infiniteGrid
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        enableDamping
        dampingFactor={0.05}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.55}
        target={[0, 0.25, 0]}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Track card (shared between animated & static renders)              */
/* ------------------------------------------------------------------ */

function TrackCard({
  title,
  description,
  tags,
  className,
}: {
  readonly title: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly className?: string;
}) {
  return (
    <div
      className={`backdrop-blur-md bg-card-bg/70 border border-border rounded-sm p-6 ${className ?? ""}`}
    >
      <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-foreground/60 leading-relaxed mb-4 max-w-[48ch]">
        {description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] bg-accent/10 text-accent px-2.5 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Spec strip                                                          */
/* ------------------------------------------------------------------ */

const SPECS = [
  { label: "Drivetrain", value: "Electric" },
  { label: "Layout", value: "3-wheel trike" },
  { label: "Frame", value: "Aluminum tube" },
  { label: "Built by", value: "Students" },
] as const;

/* ------------------------------------------------------------------ */
/* Exported section: combined "The Machine" + "Two Tracks"            */
/* ------------------------------------------------------------------ */

export default function EVModel3DSection() {
  const reduce = useReducedMotion() ?? false;
  const t = useTranslations("programs.evChallenge.model3d");

  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const machineHeadRef = useRef<HTMLDivElement>(null);
  const machineSpecRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tracksRef = useRef<HTMLDivElement>(null);
  const tracksHeadRef = useRef<HTMLDivElement>(null);
  const engRef = useRef<HTMLDivElement>(null);
  const bizRef = useRef<HTMLDivElement>(null);
  const seamRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    if (reduce || !sectionRef.current) return;
    const isLg = window.innerWidth >= 1024;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=400%",
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            scrollProgressRef.current = self.progress;
          },
        },
      });

      /* Set initial states for cinematic entrance */
      gsap.set(machineHeadRef.current, { opacity: 0, y: -30 });
      gsap.set(machineSpecRef.current, { opacity: 0, y: 20 });
      gsap.set(hintRef.current, { opacity: 0 });
      gsap.set(canvasRef.current, { scale: 0.98, opacity: 0.6 });

      /* 0.00 - 0.12  Cinematic entrance: The Machine reveals */
      tl.to(
        canvasRef.current,
        { scale: 1, opacity: 1, duration: 0.12, ease: "power2.out" },
        0.0,
      )
        .to(
          machineHeadRef.current,
          { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" },
          0.02,
        )
        .to(
          machineSpecRef.current,
          { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" },
          0.08,
        )
        .to(
          hintRef.current,
          { opacity: 1, duration: 0.08, ease: "power2.out" },
          0.1,
        );

      /* 0.12 - 0.35  Hold: car is the star */

      /* 0.35 - 0.70  Cinematic cross-dissolve: machine fades while tracks emerge */
      /* Machine text fades out (smooth, overlaps with tracks appearing) */
      tl.to(
        machineHeadRef.current,
        { opacity: 0, y: -20, duration: 0.2, ease: "power2.inOut" },
        0.35,
      )
        .to(
          machineSpecRef.current,
          { opacity: 0, y: 8, duration: 0.15, ease: "power2.inOut" },
          0.35,
        )
        .to(hintRef.current, { opacity: 0, duration: 0.12, ease: "power2.inOut" }, 0.35)
        /* Car stays full-size, only dims gently as background */
        .to(
          canvasRef.current,
          { opacity: 0.45, duration: 0.3, ease: "power2.inOut" },
          0.38,
        )
        .to(
          overlayRef.current,
          { opacity: 1, duration: 0.25, ease: "power2.inOut" },
          0.4,
        );

      /* Tracks emerge while machine is still fading (cross-dissolve overlap) */
      tl.to(tracksRef.current, { opacity: 1, duration: 0.01 }, 0.44);

      tl.fromTo(
        tracksHeadRef.current,
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.2, ease: "power2.inOut" },
        0.46,
      );

      if (isLg) {
        /* Desktop: panels glide in gently from partial offset */
        tl.fromTo(
          engRef.current,
          { x: "-60%", opacity: 0 },
          { x: "0%", opacity: 1, duration: 0.3, ease: "power2.inOut" },
          0.45,
        )
          .fromTo(
            bizRef.current,
            { x: "60%", opacity: 0 },
            { x: "0%", opacity: 1, duration: 0.3, ease: "power2.inOut" },
            0.48,
          )
          .fromTo(
            seamRef.current,
            { scaleY: 0, opacity: 0 },
            { scaleY: 1, opacity: 1, duration: 0.2, ease: "power2.inOut" },
            0.62,
          );
      } else {
        /* Mobile: stacked fade-in */
        tl.fromTo(
          engRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.25, ease: "power2.inOut" },
          0.46,
        ).fromTo(
          bizRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.25, ease: "power2.inOut" },
          0.54,
        );
      }

      /* Extend timeline so original animations (totalDuration ~0.82)
         still map to the first 250% of scroll. The extra 200% is pure
         Two Tracks hold. Formula: 0.82 * (450 / 250) ≈ 1.48 */
      tl.to({}, { duration: 0.01 }, 1.3);
    }, sectionRef);

    return () => ctx.revert();
  }, [reduce]);

  const canvasElement = (
    <Suspense fallback={null}>
      <Canvas
        camera={{ position: [3.5, 2, 3.5], fov: 32 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene reduceMotion={reduce} scrollProgress={scrollProgressRef} />
      </Canvas>
    </Suspense>
  );

  /* ---- Reduced motion: stacked static layout ---- */
  if (reduce) {
    return (
      <section
        className="border-t border-border bg-background"
        aria-label="The Ithaca EV trike and program tracks"
      >
        <div className="relative min-h-[calc(80dvh_-_var(--nav-h))] max-h-[calc(100dvh_-_var(--nav-h))] overflow-hidden">
          <div className="absolute inset-0">{canvasElement}</div>
          <div className="relative z-10 pointer-events-none flex flex-col justify-between px-6 md:px-12 lg:px-[8vw] pt-[calc(var(--nav-h)_+_1rem)] pb-8 md:pb-12 min-h-[calc(80dvh_-_var(--nav-h))]">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tighter">
                {t("machineName")}
              </h2>
              <p className="text-foreground/40 text-sm mt-2 max-w-[30ch]">
                {t("machineDesc")}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              {(["drivetrain", "layout", "frame", "builtBy"] as const).map((key) => (
                <div key={key}>
                  <span className="text-[10px] text-foreground/30 uppercase tracking-wider block">
                    {t(`specs.${key}`)}
                  </span>
                  <span className="font-mono text-xs text-foreground/60">
                    {t(`specs.${key}Value`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-6 right-6 md:right-12 lg:right-[8vw] z-10">
            <p className="text-[10px] text-foreground/20 uppercase tracking-wider">
              {t("dragToRotate")}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden max-h-[calc(100dvh_-_var(--nav-h))]">
          <h2 className="text-center text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tighter pt-10 pb-8 px-6">
            {t("twoTracksTitle")}
          </h2>
          <div className="flex flex-col lg:flex-row">
            <div className="relative flex-1 overflow-hidden min-h-[220px] lg:min-h-[320px]">
              <div className="absolute inset-0 dissolve-panel-eng" />
              <div className="relative z-10 px-6 md:px-12 lg:pl-[8vw] lg:pr-20 py-8 lg:py-16">
                <span className="font-mono text-[10px] text-accent/30 uppercase tracking-[0.25em] mb-3 block">
                  {t("trackA")}
                </span>
                <h3 className="text-lg md:text-xl font-bold text-foreground tracking-tight mb-2">
                  {t("engineering.title")}
                </h3>
                <p className="text-sm text-foreground/50 leading-relaxed mb-4 max-w-[40ch]">
                  {t("engineering.description")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ENG_TAGS.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] bg-accent/8 text-accent/60 px-2.5 py-1 rounded-full border border-accent/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="relative flex-1 overflow-hidden min-h-[220px] lg:min-h-[320px]">
              <div className="absolute inset-0 dissolve-panel-biz" />
              <div className="relative z-10 px-6 md:px-12 lg:pr-[8vw] lg:pl-20 py-8 lg:py-16 lg:flex lg:flex-col lg:items-end">
                <div className="lg:max-w-[400px]">
                  <span className="font-mono text-[10px] text-accent/30 uppercase tracking-[0.25em] mb-3 block">
                    {t("trackB")}
                  </span>
                  <h3 className="text-lg md:text-xl font-bold text-foreground tracking-tight mb-2">
                    {t("business.title")}
                  </h3>
                  <p className="text-sm text-foreground/50 leading-relaxed mb-4 max-w-[40ch]">
                    {t("business.description")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {BIZ_TAGS.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] bg-accent/8 text-accent/60 px-2.5 py-1 rounded-full border border-accent/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ---- Animated: scroll-pinned cinematic transition ---- */
  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] overflow-hidden bg-background border-t border-border"
      aria-label="Interactive 3D wireframe of the Ithaca EV trike and program tracks"
    >
      {/* Layer 0: 3D Canvas (transforms via GSAP, origin-center for dissolve) */}
      <div ref={canvasRef} className="absolute inset-0 z-0 origin-center">
        {canvasElement}
      </div>

      {/* Layer 1: Light scrim so 3D car stays visible as background */}
      <div
        ref={overlayRef}
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          opacity: 0,
          background:
            "radial-gradient(ellipse at center, rgba(17,19,24,0.15), rgba(17,19,24,0.4) 60%)",
        }}
      />

      {/* Layer 2: "The Machine" text overlay */}
      <div className="absolute inset-x-0 top-[var(--nav-h)] bottom-0 z-10 pointer-events-none flex flex-col justify-between px-6 md:px-12 lg:px-[8vw] py-4 md:py-8">
        <div ref={machineHeadRef}>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tighter">
            {t("machineName")}
          </h2>
          <p className="text-foreground/40 text-sm mt-2 max-w-[30ch]">
            {t("machineDesc")}
          </p>
        </div>

        <div ref={machineSpecRef} className="flex flex-wrap gap-x-8 gap-y-2">
          {(["drivetrain", "layout", "frame", "builtBy"] as const).map((key) => (
            <div key={key}>
              <span className="text-[10px] text-foreground/30 uppercase tracking-wider block">
                {t(`specs.${key}`)}
              </span>
              <span className="font-mono text-xs text-foreground/60">
                {t(`specs.${key}Value`)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Layer 3: Drag hint */}
      <div
        ref={hintRef}
        className="absolute bottom-6 right-6 md:right-12 lg:right-[8vw] z-10"
      >
        <p className="text-[10px] text-foreground/20 uppercase tracking-wider">
          {t("dragToRotate")}
        </p>
      </div>

      {/* Layer 4: "Two Tracks" - Full-screen split with dissolve */}
      <div
        ref={tracksRef}
        className="absolute inset-0 z-20 overflow-hidden"
        style={{ opacity: 0 }}
      >
        {/* Title centered at top */}
        <div
          ref={tracksHeadRef}
          className="absolute top-20 lg:top-28 left-0 right-0 z-30 text-center px-6"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tighter">
            {t("twoTracksTitle")}
          </h2>
        </div>

        {/* Split panels — backgrounds cover full section, content starts below title */}
        <div className="absolute inset-0 flex flex-col lg:flex-row">
          {/* Engineering half */}
          <div
            ref={engRef}
            className="relative flex-1 overflow-hidden"
          >
            <div className="absolute inset-0 dissolve-panel-eng" />
            <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-12 lg:pl-[8vw] lg:pr-28 py-6 pt-28 md:pt-36 lg:py-0 lg:pt-[max(10rem,12vh)]">
              <span className="font-mono text-[10px] text-accent/30 uppercase tracking-[0.25em] mb-3">
                {t("trackA")}
              </span>
              <h3 className="text-lg md:text-2xl lg:text-3xl font-bold text-foreground tracking-tight mb-1 md:mb-2">
                {t("engineering.title")}
              </h3>
              <p className="text-xs md:text-sm text-foreground/50 leading-relaxed mb-3 md:mb-5 max-w-[40ch]">
                {t("engineering.description")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ENG_TAGS.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] bg-accent/8 text-accent/60 px-2.5 py-1 rounded-full border border-accent/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Business half */}
          <div
            ref={bizRef}
            className="relative flex-1 overflow-hidden"
          >
            <div className="absolute inset-0 dissolve-panel-biz" />
            <div className="relative z-10 h-full flex flex-col lg:items-end px-6 md:px-12 lg:pr-[8vw] lg:pl-28 py-6 lg:py-0 lg:justify-end lg:pb-[12vh]">
              <div className="lg:max-w-[400px]">
                <span className="font-mono text-[10px] text-accent/30 uppercase tracking-[0.25em] mb-2 md:mb-3 block">
                  {t("trackB")}
                </span>
                <h3 className="text-lg md:text-2xl lg:text-3xl font-bold text-foreground tracking-tight mb-1 md:mb-2">
                  {t("business.title")}
                </h3>
                <p className="text-xs md:text-sm text-foreground/50 leading-relaxed mb-3 md:mb-5 max-w-[40ch]">
                  {t("business.description")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {BIZ_TAGS.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] bg-accent/8 text-accent/60 px-2.5 py-1 rounded-full border border-accent/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dissolve seam - luminous center line (desktop only) */}
        <div
          ref={seamRef}
          className="hidden lg:flex absolute inset-y-0 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex-col items-center origin-center"
        >
          <div
            className="w-px flex-1"
            style={{
              background:
                "linear-gradient(to bottom, transparent 15%, rgba(204,222,240,0.2) 35%, rgba(204,222,240,0.35) 50%, rgba(204,222,240,0.2) 65%, transparent 85%)",
            }}
          />
        </div>

        {/* Wider glow aura around seam */}
        <div className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-[100px] pointer-events-none z-[5]">
          <div
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(204,222,240,0.04), transparent 70%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
