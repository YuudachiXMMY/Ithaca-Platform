/**
 * Procedural geometry for the EV trike wireframe.
 *
 * Verbatim port of the `F{}` point arrays, `ringPoints()` helper, and `Wheel`
 * spoke builder from the React-Three-Fiber original
 * (`src/components/programs/ev-challenge/EVModel3D.tsx:35-223,246-346`).
 *
 * The R3F scene rendered ~103 drei `<Line>` primitives. Threlte has no drop-in
 * for drei's `<Line lineWidth>`, so this module flattens every line into a
 * plain `number[]` of `[x, y, z, …]` positions (what `LineGeometry.setPositions`
 * wants) and returns a descriptor list that `EVScene.svelte` maps over one
 * `FatLine.svelte` (Line2 + LineMaterial) per entry — 46 frame lines + 3 wheels
 * × 19 = 103 fat lines total. NO GLTF — the trike is 100% procedural.
 *
 * Coordinate frame: X = front(−) → rear(+), Y = up, Z = left(−) / right(+).
 */

/* Colors — the inverted-band palette (docs/DESIGN-TOKENS.md §3.8). A WebGL
   material cannot read a CSS variable, so these mirror the band tokens as
   JS-side constants: --band-brand (teal-300), --navy-500, --band-brand-strong
   (teal-100). Renamed from ACCENT* — the deleted --accent token was never
   their source. */
export const BRAND = '#5FC3C4';
export const BRAND_DIM = '#2B4C7E';
export const BRAND_GLOW = '#D9F1F1';

type V3 = [number, number, number];

/** One fat line: flat positions + material knobs. */
export interface TrikeLine {
	points: number[];
	color: string;
	lineWidth: number;
	opacity?: number;
	transparent?: boolean;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Ring of `n + 1` points of radius `r` in the XY plane (EVModel3D.tsx:35-40). */
function ringPoints(r: number, n = 48): V3[] {
	return Array.from({ length: n + 1 }, (_, i) => {
		const a = (i / n) * Math.PI * 2;
		return [Math.cos(a) * r, Math.sin(a) * r, 0] as V3;
	});
}

/** Flatten a list of V3 tuples (optionally offset by a wheel position) to `number[]`. */
function flat(points: V3[], offset: V3 = [0, 0, 0]): number[] {
	const out: number[] = [];
	for (const [x, y, z] of points) {
		out.push(x + offset[0], y + offset[1], z + offset[2]);
	}
	return out;
}

/* ------------------------------------------------------------------ */
/* Frame geometry data (verbatim EVModel3D.tsx:86-223)                 */
/* ------------------------------------------------------------------ */

const F = {
	leftRail: [
		[-2.1, 0.08, -0.08],
		[-1.6, 0.08, -0.2],
		[-0.8, 0.08, -0.3],
		[0.0, 0.08, -0.32],
		[0.6, 0.08, -0.3],
		[1.2, 0.08, -0.18],
		[1.65, 0.1, 0]
	] as V3[],

	rightRail: [
		[-2.1, 0.08, 0.08],
		[-1.6, 0.08, 0.2],
		[-0.8, 0.08, 0.3],
		[0.0, 0.08, 0.32],
		[0.6, 0.08, 0.3],
		[1.2, 0.08, 0.18],
		[1.65, 0.1, 0]
	] as V3[],

	crosses: [
		[
			[-1.6, 0.08, -0.2],
			[-1.6, 0.08, 0.2]
		],
		[
			[-0.8, 0.08, -0.3],
			[-0.8, 0.08, 0.3]
		],
		[
			[0.0, 0.08, -0.32],
			[0.0, 0.08, 0.32]
		],
		[
			[0.6, 0.08, -0.3],
			[0.6, 0.08, 0.3]
		],
		[
			[1.2, 0.08, -0.18],
			[1.2, 0.08, 0.18]
		]
	] as V3[][],

	leftUpper: [
		[-0.2, 0.08, -0.31],
		[0.0, 0.3, -0.31],
		[0.5, 0.36, -0.3],
		[0.9, 0.36, -0.24]
	] as V3[],

	rightUpper: [
		[-0.2, 0.08, 0.31],
		[0.0, 0.3, 0.31],
		[0.5, 0.36, 0.3],
		[0.9, 0.36, 0.24]
	] as V3[],

	upperCrosses: [
		[
			[0.1, 0.3, -0.31],
			[0.1, 0.3, 0.31]
		],
		[
			[0.5, 0.36, -0.3],
			[0.5, 0.36, 0.3]
		],
		[
			[0.9, 0.36, -0.24],
			[0.9, 0.36, 0.24]
		]
	] as V3[][],

	diagonals: [
		[
			[-0.8, 0.08, -0.3],
			[0.0, 0.3, -0.31]
		],
		[
			[-0.8, 0.08, 0.3],
			[0.0, 0.3, 0.31]
		],
		[
			[0.6, 0.08, -0.3],
			[0.5, 0.36, -0.3]
		],
		[
			[0.6, 0.08, 0.3],
			[0.5, 0.36, 0.3]
		],
		[
			[1.2, 0.08, -0.18],
			[0.9, 0.36, -0.24]
		],
		[
			[1.2, 0.08, 0.18],
			[0.9, 0.36, 0.24]
		]
	] as V3[][],

	cage: [
		[
			[0.45, 0.36, -0.28],
			[0.3, 0.98, -0.14]
		],
		[
			[0.45, 0.36, 0.28],
			[0.3, 0.98, 0.14]
		],
		[
			[0.3, 0.98, -0.14],
			[0.3, 0.98, 0.14]
		],
		[
			[0.9, 0.36, -0.24],
			[0.3, 0.98, -0.14]
		],
		[
			[0.9, 0.36, 0.24],
			[0.3, 0.98, 0.14]
		],
		[
			[0.1, 0.3, -0.3],
			[0.3, 0.98, -0.14]
		],
		[
			[0.1, 0.3, 0.3],
			[0.3, 0.98, 0.14]
		]
	] as V3[][],

	steering: [
		[-1.5, 0.1, 0],
		[-1.68, 0.55, 0]
	] as V3[],
	handlebar: [
		[-1.72, 0.57, -0.15],
		[-1.68, 0.55, 0],
		[-1.72, 0.57, 0.15]
	] as V3[],

	forks: [
		[
			[-1.65, 0.5, -0.06],
			[-1.55, 0.22, -0.22]
		],
		[
			[-1.65, 0.5, 0.06],
			[-1.55, 0.22, 0.22]
		]
	] as V3[][],

	frontAxle: [
		[-1.55, 0.22, -0.22],
		[-1.55, 0.22, 0.22]
	] as V3[],

	rearFork: [
		[
			[1.2, 0.08, -0.12],
			[1.65, 0.28, 0]
		],
		[
			[1.2, 0.08, 0.12],
			[1.65, 0.28, 0]
		],
		[
			[0.9, 0.36, -0.18],
			[1.65, 0.28, 0]
		],
		[
			[0.9, 0.36, 0.18],
			[1.65, 0.28, 0]
		]
	] as V3[][],

	panelBottom: [
		[-1.35, 0.1, 0.18],
		[-0.8, 0.1, 0.3],
		[-0.2, 0.1, 0.32],
		[0.4, 0.1, 0.32],
		[0.9, 0.1, 0.28],
		[1.15, 0.1, 0.2]
	] as V3[],

	panelTop: [
		[-1.35, 0.32, 0.14],
		[-1.1, 0.38, 0.22],
		[-0.7, 0.4, 0.28],
		[-0.15, 0.38, 0.32],
		[0.4, 0.3, 0.33],
		[0.9, 0.18, 0.29],
		[1.15, 0.12, 0.2]
	] as V3[],

	panelRibs: [
		[
			[-1.35, 0.1, 0.18],
			[-1.35, 0.32, 0.14]
		],
		[
			[-0.8, 0.1, 0.3],
			[-0.85, 0.39, 0.25]
		],
		[
			[-0.2, 0.1, 0.32],
			[-0.15, 0.38, 0.32]
		],
		[
			[0.4, 0.1, 0.32],
			[0.4, 0.3, 0.33]
		],
		[
			[0.9, 0.1, 0.28],
			[0.9, 0.18, 0.29]
		],
		[
			[1.15, 0.1, 0.2],
			[1.15, 0.12, 0.2]
		]
	] as V3[][],

	seatL: [
		[0.15, 0.1, -0.12],
		[0.05, 0.22, -0.12],
		[0.3, 0.34, -0.12],
		[0.55, 0.3, -0.12],
		[0.6, 0.15, -0.12]
	] as V3[],

	seatR: [
		[0.15, 0.1, 0.12],
		[0.05, 0.22, 0.12],
		[0.3, 0.34, 0.12],
		[0.55, 0.3, 0.12],
		[0.6, 0.15, 0.12]
	] as V3[],

	seatCrosses: [
		[
			[0.05, 0.22, -0.12],
			[0.05, 0.22, 0.12]
		],
		[
			[0.55, 0.3, -0.12],
			[0.55, 0.3, 0.12]
		]
	] as V3[][]
};

/* ------------------------------------------------------------------ */
/* Wheel builder (verbatim EVModel3D.tsx:46-79)                        */
/* ------------------------------------------------------------------ */

/** 19 fat lines for one wheel (tire + rim + hub + 16 spokes), baked to `pos`. */
function wheelLines(pos: V3, r = 0.24): TrikeLine[] {
	const lines: TrikeLine[] = [];

	const tire = ringPoints(r * 1.08, 48);
	const rim = ringPoints(r, 48);
	const hub = ringPoints(0.035, 12);

	lines.push({ points: flat(tire, pos), color: BRAND_DIM, lineWidth: 0.8 });
	lines.push({ points: flat(rim, pos), color: BRAND, lineWidth: 1.5 });
	lines.push({ points: flat(hub, pos), color: BRAND, lineWidth: 1 });

	const count = 16;
	for (let i = 0; i < count; i++) {
		const a = (i / count) * Math.PI * 2;
		const spoke: V3[] = [
			[0, 0, 0],
			[Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, 0]
		];
		lines.push({
			points: flat(spoke, pos),
			color: BRAND_DIM,
			lineWidth: 0.4,
			transparent: true,
			opacity: 0.35
		});
	}

	return lines;
}

/* ------------------------------------------------------------------ */
/* Full trike line list (verbatim render order EVModel3D.tsx:246-346)  */
/* ------------------------------------------------------------------ */

/** Build all 103 fat-line descriptors for the trike (46 frame + 3 × 19 wheels). */
export function buildTrikeLines(): TrikeLine[] {
	const lines: TrikeLine[] = [];

	// Rails
	lines.push({ points: flat(F.leftRail), color: BRAND, lineWidth: 1.5 });
	lines.push({ points: flat(F.rightRail), color: BRAND, lineWidth: 1.5 });

	// Cross members
	for (const pts of F.crosses) lines.push({ points: flat(pts), color: BRAND_DIM, lineWidth: 1 });

	// Upper rails
	lines.push({ points: flat(F.leftUpper), color: BRAND, lineWidth: 1.2 });
	lines.push({ points: flat(F.rightUpper), color: BRAND, lineWidth: 1.2 });
	for (const pts of F.upperCrosses)
		lines.push({ points: flat(pts), color: BRAND_DIM, lineWidth: 0.8 });

	// Diagonals
	for (const pts of F.diagonals)
		lines.push({
			points: flat(pts),
			color: BRAND_DIM,
			lineWidth: 0.6,
			transparent: true,
			opacity: 0.5
		});

	// Roll cage
	for (const pts of F.cage) lines.push({ points: flat(pts), color: BRAND_GLOW, lineWidth: 1.5 });

	// Steering + handlebar
	lines.push({ points: flat(F.steering), color: BRAND, lineWidth: 1.2 });
	lines.push({ points: flat(F.handlebar), color: BRAND, lineWidth: 1.2 });

	// Forks + front axle
	for (const pts of F.forks) lines.push({ points: flat(pts), color: BRAND_DIM, lineWidth: 1 });
	lines.push({ points: flat(F.frontAxle), color: BRAND_DIM, lineWidth: 0.8 });

	// Rear fork
	for (const pts of F.rearFork) lines.push({ points: flat(pts), color: BRAND_DIM, lineWidth: 1 });

	// Body panels
	lines.push({
		points: flat(F.panelBottom),
		color: BRAND,
		lineWidth: 1,
		transparent: true,
		opacity: 0.5
	});
	lines.push({
		points: flat(F.panelTop),
		color: BRAND,
		lineWidth: 1,
		transparent: true,
		opacity: 0.5
	});
	for (const pts of F.panelRibs)
		lines.push({
			points: flat(pts),
			color: BRAND_DIM,
			lineWidth: 0.4,
			transparent: true,
			opacity: 0.3
		});

	// Seat
	lines.push({
		points: flat(F.seatL),
		color: BRAND_DIM,
		lineWidth: 0.8,
		transparent: true,
		opacity: 0.4
	});
	lines.push({
		points: flat(F.seatR),
		color: BRAND_DIM,
		lineWidth: 0.8,
		transparent: true,
		opacity: 0.4
	});
	for (const pts of F.seatCrosses)
		lines.push({
			points: flat(pts),
			color: BRAND_DIM,
			lineWidth: 0.5,
			transparent: true,
			opacity: 0.3
		});

	// Wheels (front-left, front-right, rear)
	lines.push(...wheelLines([-1.55, 0.22, -0.22], 0.22));
	lines.push(...wheelLines([-1.55, 0.22, 0.22], 0.22));
	lines.push(...wheelLines([1.65, 0.28, 0], 0.28));

	return lines;
}

/* ------------------------------------------------------------------ */
/* Floating particles (verbatim EVModel3D.tsx:354-390)                 */
/* ------------------------------------------------------------------ */

export const PARTICLE_COUNT = 120;

/** Flat `Float32Array` of `count × 3` randomized particle positions. */
export function buildParticlePositions(count = PARTICLE_COUNT): Float32Array {
	const arr = new Float32Array(count * 3);
	for (let i = 0; i < count; i++) {
		arr[i * 3] = (Math.random() - 0.5) * 10;
		arr[i * 3 + 1] = Math.random() * 3 - 0.5;
		arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
	}
	return arr;
}
