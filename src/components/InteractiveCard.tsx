import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useSpring, a } from "@react-spring/three";
import * as THREE from "three";
import { trackEvent } from "../utils/analytics";
import type { CardTheme, Project } from "../types/project";
import useIsTouchDevice from "../hooks/useIsTouchDevice";

type CardSide = "front" | "back";

interface TextureSurface {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
}

const CARD_TEXTURE_WIDTH = 600;
const CARD_TEXTURE_HEIGHT = 960;
const CARD_TEXTURE_RADIUS = 40;
const TEXTURE_FPS = 24;

const DEFAULT_CARD_THEME: CardTheme = {
  palette: {
    baseStart: "#6e727e",
    baseEnd: "#5c5c5f",
    accent: "#d4d8df",
    accentSoft: "#a8b0bb",
    textMain: "#ffffff",
    textMuted: "rgba(255,255,255,0.84)",
    tagBg: "rgba(79,85,95,0.95)",
    linkBg: "rgba(0,0,0,0.8)",
    edgeColor: "#5c5c5f",
  },
  frontVariant: "night-panel",
  backMotif: "dark-connect-toggle-night",
  animationProfile: "pulse-drift",
  linkButtonStyle: "glass-pill",
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
) => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  yStart: number,
  maxWidth: number,
  lineHeight: number,
) => {
  const words = text.split(" ");
  let line = "";
  let y = yStart;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
};

const applyRoundedMask = (
  ctx: CanvasRenderingContext2D,
  radius = CARD_TEXTURE_RADIUS,
) => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(CARD_TEXTURE_WIDTH - radius, 0);
  ctx.quadraticCurveTo(CARD_TEXTURE_WIDTH, 0, CARD_TEXTURE_WIDTH, radius);
  ctx.lineTo(CARD_TEXTURE_WIDTH, CARD_TEXTURE_HEIGHT - radius);
  ctx.quadraticCurveTo(
    CARD_TEXTURE_WIDTH,
    CARD_TEXTURE_HEIGHT,
    CARD_TEXTURE_WIDTH - radius,
    CARD_TEXTURE_HEIGHT,
  );
  ctx.lineTo(radius, CARD_TEXTURE_HEIGHT);
  ctx.quadraticCurveTo(0, CARD_TEXTURE_HEIGHT, 0, CARD_TEXTURE_HEIGHT - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
};

const toRgba = (hex: string, alpha: number) => {
  if (!hex.startsWith("#")) return hex;
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => `${c}${c}`)
          .join("")
      : clean;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const createTextureSurface = () => {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_TEXTURE_WIDTH;
  canvas.height = CARD_TEXTURE_HEIGHT;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return { canvas, ctx, texture } satisfies TextureSurface;
};

const getProjectTheme = (project: Project | null) =>
  project?.cardTheme ?? DEFAULT_CARD_THEME;

const drawMetallicBase = (
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
  side: CardSide,
) => {
  const gradient = ctx.createLinearGradient(
    0,
    0,
    CARD_TEXTURE_WIDTH,
    CARD_TEXTURE_HEIGHT,
  );
  gradient.addColorStop(0, theme.palette.baseStart);
  gradient.addColorStop(1, theme.palette.baseEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_TEXTURE_WIDTH, CARD_TEXTURE_HEIGHT);

  const imageData = ctx.getImageData(
    0,
    0,
    CARD_TEXTURE_WIDTH,
    CARD_TEXTURE_HEIGHT,
  );
  const seed = side === "front" ? 91.733 : 157.311;
  for (let i = 0; i < imageData.data.length; i += 4) {
    const n = Math.sin((i / 4) * 12.9898 + seed) * 43758.5453;
    const grain = (n - Math.floor(n) - 0.5) * 16;
    imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + grain));
    imageData.data[i + 1] = Math.max(
      0,
      Math.min(255, imageData.data[i + 1] + grain),
    );
    imageData.data[i + 2] = Math.max(
      0,
      Math.min(255, imageData.data[i + 2] + grain),
    );
  }
  ctx.putImageData(imageData, 0, 0);
};

const drawFrontThemeAccent = (
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
) => {
  switch (theme.frontVariant) {
    case "mood-gradient":
      ctx.strokeStyle = toRgba(theme.palette.accent, 0.24);
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(440 + i * 34, 150 + i * 26, 20 + i * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    case "night-panel":
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      for (let y = 120; y < 360; y += 34) {
        ctx.beginPath();
        ctx.moveTo(46, y);
        ctx.lineTo(CARD_TEXTURE_WIDTH - 46, y);
        ctx.stroke();
      }
      break;
    case "academic-board":
      // Keep student card front fully clean.
      break;
  }
};

const drawProjectBackMotif = (
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
) => {
  switch (theme.backMotif) {
    case "gifoji-generative-frames": {
      drawRoundedRect(
        ctx,
        74,
        122,
        CARD_TEXTURE_WIDTH - 148,
        54,
        14,
        "rgba(0,0,0,0.24)",
      );
      drawRoundedRect(
        ctx,
        90,
        136,
        CARD_TEXTURE_WIDTH - 250,
        26,
        10,
        toRgba(theme.palette.accentSoft, 0.22),
      );

      for (let i = 0; i < 4; i++) {
        drawRoundedRect(
          ctx,
          90 + i * 110,
          196,
          88,
          28,
          12,
          toRgba(theme.palette.accent, 0.18),
        );
      }

      drawRoundedRect(ctx, 78, 262, 204, 244, 18, "rgba(0,0,0,0.22)");
      drawRoundedRect(ctx, 316, 262, 206, 244, 18, "rgba(0,0,0,0.2)");
      drawRoundedRect(
        ctx,
        92,
        280,
        176,
        144,
        14,
        toRgba(theme.palette.accentSoft, 0.16),
      );
      drawRoundedRect(
        ctx,
        330,
        280,
        178,
        144,
        14,
        toRgba(theme.palette.accent, 0.13),
      );
      drawRoundedRect(ctx, 96, 438, 70, 26, 10, "rgba(255,255,255,0.16)");
      drawRoundedRect(ctx, 334, 438, 82, 26, 10, "rgba(255,255,255,0.15)");

      drawRoundedRect(
        ctx,
        78,
        540,
        CARD_TEXTURE_WIDTH - 156,
        134,
        18,
        "rgba(0,0,0,0.22)",
      );
      drawRoundedRect(
        ctx,
        96,
        560,
        CARD_TEXTURE_WIDTH - 192,
        12,
        6,
        toRgba(theme.palette.accentSoft, 0.2),
      );
      drawRoundedRect(
        ctx,
        96,
        586,
        CARD_TEXTURE_WIDTH - 220,
        12,
        6,
        toRgba(theme.palette.accent, 0.18),
      );
      drawRoundedRect(
        ctx,
        96,
        616,
        120,
        34,
        14,
        toRgba(theme.palette.accent, 0.2),
      );
      break;
    }
    case "dark-connect-toggle-night": {
      ctx.fillStyle = toRgba(theme.palette.accentSoft, 0.18);
      ctx.beginPath();
      ctx.arc(468, 162, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = toRgba(theme.palette.baseEnd, 0.92);
      ctx.beginPath();
      ctx.arc(482, 157, 38, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 2; i++) {
        const y = 430 + i * 120;
        drawRoundedRect(ctx, 124, y, 352, 56, 28, "rgba(0,0,0,0.34)");
      }
      break;
    }
    case "student-offers-coupons": {
      drawRoundedRect(
        ctx,
        66,
        114,
        CARD_TEXTURE_WIDTH - 132,
        56,
        14,
        "rgba(0,0,0,0.2)",
      );
      drawRoundedRect(
        ctx,
        84,
        130,
        CARD_TEXTURE_WIDTH - 240,
        24,
        10,
        "rgba(255,255,255,0.18)",
      );
      drawRoundedRect(ctx, 466, 129, 44, 26, 12, "rgba(255,255,255,0.14)");

      drawRoundedRect(ctx, 66, 192, 142, 470, 16, "rgba(0,0,0,0.2)");
      for (let i = 0; i < 5; i++) {
        drawRoundedRect(
          ctx,
          82,
          214 + i * 82,
          108,
          30,
          10,
          toRgba(theme.palette.accentSoft, 0.18),
        );
      }

      for (let i = 0; i < 4; i++) {
        const y = 192 + i * 116;
        drawRoundedRect(
          ctx,
          228,
          y,
          CARD_TEXTURE_WIDTH - 294,
          96 + (i % 2) * 8,
          12,
          "rgba(0,0,0,0.2)",
        );
        drawRoundedRect(
          ctx,
          246,
          y + 18,
          CARD_TEXTURE_WIDTH - 340,
          14,
          7,
          toRgba(theme.palette.accentSoft, 0.2),
        );
        drawRoundedRect(
          ctx,
          246,
          y + 44,
          CARD_TEXTURE_WIDTH - 380,
          12,
          6,
          toRgba(theme.palette.accent, 0.16),
        );
      }
      drawRoundedRect(ctx, 408, 684, 112, 34, 12, "rgba(255,255,255,0.16)");
      break;
    }
  }
};

const drawLinkButton = (
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  switch (theme.linkButtonStyle) {
    case "glass-pill":
      drawRoundedRect(ctx, x, y, width, height, 20, theme.palette.linkBg);
      break;
    case "neon-outline":
      drawRoundedRect(ctx, x, y, width, height, 20, "rgba(0,0,0,0.68)");
      ctx.strokeStyle = toRgba(theme.palette.accent, 0.58);
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      break;
    case "paper-ticket":
      drawRoundedRect(ctx, x, y, width, height, 14, theme.palette.linkBg);
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = toRgba(theme.palette.accentSoft, 0.52);
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + 10, y + 10, width - 20, height - 20);
      ctx.setLineDash([]);
      break;
  }

  ctx.fillStyle = theme.palette.textMain;
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + width / 2, y + height / 2);
};

const createFrontStaticCanvas = (project: Project, theme: CardTheme) => {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_TEXTURE_WIDTH;
  canvas.height = CARD_TEXTURE_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  drawMetallicBase(ctx, theme, "front");
  drawFrontThemeAccent(ctx, theme);

  const externalLink = project.websiteLink ?? project.githubLink;
  const externalLinkLabel = project.websiteLink ? "Website" : "GitHub";

  ctx.fillStyle = theme.palette.textMain;
  ctx.font = "56px Metal Mania";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(project.title, CARD_TEXTURE_WIDTH / 2, 100);

  ctx.fillStyle = theme.palette.textMuted;
  ctx.font = "36px sans-serif";
  wrapText(
    ctx,
    project.shortDescription,
    CARD_TEXTURE_WIDTH / 2,
    180,
    CARD_TEXTURE_WIDTH - 80,
    40,
  );

  ctx.font = "26px sans-serif";
  const tagHeight = 60;
  const padding = 20;
  const gap = 15;
  const maxWidth = CARD_TEXTURE_WIDTH - 80;
  const buttonHeight = 80;
  const bottomMargin = 60;
  const buttonY = CARD_TEXTURE_HEIGHT - buttonHeight - bottomMargin;
  const maxTagY = CARD_TEXTURE_HEIGHT - buttonHeight - bottomMargin - tagHeight;
  let currentX = (CARD_TEXTURE_WIDTH - maxWidth) / 2;
  let currentY = 180 + 180;

  project.techStack.forEach((tag) => {
    const tagWidth = ctx.measureText(tag).width + padding * 2;
    if (currentX + tagWidth > (CARD_TEXTURE_WIDTH + maxWidth) / 2) {
      currentX = (CARD_TEXTURE_WIDTH - maxWidth) / 2;
      currentY += tagHeight + gap;
    }
    if (currentY > maxTagY) return;

    drawRoundedRect(
      ctx,
      currentX,
      currentY,
      tagWidth,
      tagHeight,
      15,
      theme.palette.tagBg,
    );
    ctx.fillStyle = theme.palette.textMain;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tag, currentX + tagWidth / 2, currentY + tagHeight / 2);
    currentX += tagWidth + gap;
  });

  if (externalLink) {
    const buttonWidth = CARD_TEXTURE_WIDTH - 320;
    const buttonX = (CARD_TEXTURE_WIDTH - buttonWidth) / 2;
    ctx.fillStyle = theme.palette.textMain;
    ctx.font = "italic 28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("Click to open", CARD_TEXTURE_WIDTH / 2, buttonY - 20);
    drawLinkButton(
      ctx,
      theme,
      externalLinkLabel,
      buttonX,
      buttonY,
      buttonWidth,
      buttonHeight,
    );
  }
  applyRoundedMask(ctx);

  return canvas;
};

const createBackStaticCanvas = (theme: CardTheme) => {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_TEXTURE_WIDTH;
  canvas.height = CARD_TEXTURE_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  drawMetallicBase(ctx, theme, "back");
  drawProjectBackMotif(ctx, theme);
  applyRoundedMask(ctx);

  return canvas;
};

const createEmptyStaticCanvas = () => {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_TEXTURE_WIDTH;
  canvas.height = CARD_TEXTURE_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  drawMetallicBase(ctx, DEFAULT_CARD_THEME, "front");
  ctx.fillStyle = "rgba(79, 85, 95, 0.42)";
  ctx.font = "400px Metal Mania";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", CARD_TEXTURE_WIDTH / 2, CARD_TEXTURE_HEIGHT / 2);
  applyRoundedMask(ctx);

  return canvas;
};

const drawAnimatedOverlay = (
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
  side: CardSide,
  time: number,
) => {
  switch (theme.animationProfile) {
    case "pulse-drift": {
      const x = -120 + ((time * 86) % (CARD_TEXTURE_WIDTH + 240));
      const y =
        side === "front"
          ? CARD_TEXTURE_HEIGHT * 0.76
          : CARD_TEXTURE_HEIGHT * 0.56;
      const radius = 70 + (Math.sin(time * 2.2) + 1) * 18;
      const glow = ctx.createRadialGradient(x, y, 12, x, y, radius);
      glow.addColorStop(
        0,
        toRgba(theme.palette.accentSoft, side === "back" ? 0.14 : 0.1),
      );
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, CARD_TEXTURE_WIDTH, CARD_TEXTURE_HEIGHT);
      if (side === "back" && theme.backMotif === "gifoji-generative-frames") {
        const chipX = -88 + ((time * 150) % (CARD_TEXTURE_WIDTH + 176));
        const progressX = -120 + ((time * 120) % (CARD_TEXTURE_WIDTH + 240));
        drawRoundedRect(
          ctx,
          chipX,
          196,
          88,
          28,
          12,
          toRgba(theme.palette.accentSoft, 0.3),
        );
        drawRoundedRect(
          ctx,
          progressX,
          586,
          120,
          12,
          6,
          toRgba(theme.palette.accent, 0.3),
        );
      }
      break;
    }
    case "scan-flicker": {
      const scanY = ((time * 200) % (CARD_TEXTURE_HEIGHT + 44)) - 22;
      const band = ctx.createLinearGradient(0, scanY - 16, 0, scanY + 16);
      band.addColorStop(0, "rgba(255,255,255,0)");
      band.addColorStop(
        0.5,
        toRgba(theme.palette.accent, side === "back" ? 0.16 : 0.1),
      );
      band.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, scanY - 16, CARD_TEXTURE_WIDTH, 32);
      if (side === "back" && theme.backMotif === "dark-connect-toggle-night") {
        const center = 300;
        const range = 70;
        const x1 = center + Math.sin(time * 2.1) * range;
        const x2 = center + Math.sin(time * 2.1 + Math.PI * 0.9) * range;
        drawRoundedRect(
          ctx,
          x1 - 24,
          438,
          48,
          40,
          20,
          toRgba(theme.palette.accentSoft, 0.82),
        );
        drawRoundedRect(
          ctx,
          x2 - 24,
          558,
          48,
          40,
          20,
          toRgba(theme.palette.accentSoft, 0.82),
        );
      }
      break;
    }
    case "float-glow": {
      for (let i = 0; i < 2; i++) {
        const x =
          CARD_TEXTURE_WIDTH / 2 +
          Math.cos(time * 0.8 + i * 2.2) * (140 - i * 34);
        const y =
          CARD_TEXTURE_HEIGHT / 2 + Math.sin(time + i * 1.8) * (190 - i * 30);
        const orb = ctx.createRadialGradient(x, y, 6, x, y, 50);
        orb.addColorStop(
          0,
          toRgba(theme.palette.accentSoft, side === "back" ? 0.12 : 0.08),
        );
        orb.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = orb;
        ctx.fillRect(x - 50, y - 50, 100, 100);
      }
      if (side === "back" && theme.backMotif === "student-offers-coupons") {
        const highlightY = 420 + Math.sin(time * 1.05 - Math.PI / 2) * 228;
        const railY = 408 + Math.sin(time * 1.25 + Math.PI * 0.35) * 164;
        drawRoundedRect(
          ctx,
          228,
          highlightY,
          CARD_TEXTURE_WIDTH - 294,
          34,
          10,
          toRgba(theme.palette.accentSoft, 0.18),
        );
        drawRoundedRect(
          ctx,
          178,
          railY,
          10,
          24,
          5,
          toRgba(theme.palette.accent, 0.5),
        );
      }
      break;
    }
  }
};

const renderAnimatedTexture = (
  surface: TextureSurface,
  staticCanvas: HTMLCanvasElement,
  theme: CardTheme,
  side: CardSide,
  time: number,
) => {
  const { ctx } = surface;
  ctx.clearRect(0, 0, CARD_TEXTURE_WIDTH, CARD_TEXTURE_HEIGHT);
  ctx.drawImage(staticCanvas, 0, 0);
  drawAnimatedOverlay(ctx, theme, side, time);
  applyRoundedMask(ctx);
  surface.texture.needsUpdate = true;
};

function useMouseInSection(sectionId: string) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const isTouch = useIsTouchDevice();

  useEffect(() => {
    if (isTouch) {
      setPos({ x: 0, y: 0 });
      return;
    }

    const section = document.getElementById(sectionId);
    if (!section) return;

    let frameId: number | null = null;
    let latestPosition = { clientX: 0, clientY: 0 };

    const updatePosition = () => {
      frameId = null;
      const rect = section.getBoundingClientRect();
      setPos({
        x: (latestPosition.clientX - rect.left) / rect.width - 0.5,
        y: (latestPosition.clientY - rect.top) / rect.height - 0.5,
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      latestPosition = { clientX: e.clientX, clientY: e.clientY };
      if (frameId === null) frameId = requestAnimationFrame(updatePosition);
    };

    const handleMouseLeave = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      setPos({ x: 0, y: 0 });
    };

    section.addEventListener("mousemove", handleMouseMove, { passive: true });
    section.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      section.removeEventListener("mousemove", handleMouseMove);
      section.removeEventListener("mouseleave", handleMouseLeave);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [sectionId, isTouch]);

  return pos;
}

export const InteractiveCard = ({
  project,
  isFlipped,
  isVisible,
  onReady,
  edgeColor,
  metalness = 0.6,
  roughness = 0.2,
}: {
  project: Project | null;
  isVisible: boolean;
  isFlipped: boolean;
  onReady: () => void;
  edgeColor?: string;
  metalness?: number;
  roughness?: number;
}) => {
  const mouseTrackRef = useRef<THREE.Group>(null!);
  const { x, y } = useMouseInSection("projects");
  const isTouch = useIsTouchDevice();
  const projectExternalLink = project?.websiteLink ?? project?.githubLink;

  const [isHovered, setIsHovered] = useState(false);
  const onReadyCalledRef = useRef(false);
  const lastTextureUpdateRef = useRef(0);

  const projectTheme = useMemo(() => getProjectTheme(project), [project]);
  const frontSurface = useMemo(() => createTextureSurface(), []);
  const backSurface = useMemo(() => createTextureSurface(), []);
  const staticFrontCanvas = useMemo(
    () =>
      project
        ? createFrontStaticCanvas(project, projectTheme)
        : createEmptyStaticCanvas(),
    [project, projectTheme],
  );
  const staticBackCanvas = useMemo(
    () =>
      project
        ? createBackStaticCanvas(projectTheme)
        : createEmptyStaticCanvas(),
    [project, projectTheme],
  );
  const resolvedEdgeColor = edgeColor ?? DEFAULT_CARD_THEME.palette.edgeColor;

  useEffect(() => {
    return () => {
      frontSurface.texture.dispose();
      backSurface.texture.dispose();
    };
  }, [frontSurface, backSurface]);

  useEffect(() => {
    if (isHovered && !isFlipped && projectExternalLink) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "auto";
    }
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [isHovered, isFlipped, projectExternalLink]);

  const drawTextures = useCallback(
    (time: number) => {
      renderAnimatedTexture(
        frontSurface,
        staticFrontCanvas,
        projectTheme,
        "front",
        time,
      );
      renderAnimatedTexture(
        backSurface,
        staticBackCanvas,
        projectTheme,
        "back",
        time,
      );
    },
    [
      frontSurface,
      backSurface,
      staticFrontCanvas,
      staticBackCanvas,
      projectTheme,
    ],
  );

  useEffect(() => {
    lastTextureUpdateRef.current = 0;
    drawTextures(0);
  }, [drawTextures]);

  const handleCardClick = () => {
    if (!isFlipped && project && projectExternalLink) {
      trackEvent("Projects", "click_card", project.title);
      window.open(projectExternalLink, "_blank", "noopener,noreferrer");
    }
  };

  const { rotation } = useSpring({
    rotation: isFlipped ? Math.PI : 0,
    config: { friction: 22, tension: 170 },
  });

  const CARD_WIDTH = 4.3;
  const CARD_HEIGHT = (960 / 600) * CARD_WIDTH;
  const CARD_DEPTH = 0.1;
  const CORNER_RADIUS = 0.2;

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const w = CARD_WIDTH;
    const h = CARD_HEIGHT;
    const r = CORNER_RADIUS;
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
    s.lineTo(w / 2, h / 2 - r);
    s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
    s.lineTo(-w / 2 + r, h / 2);
    s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(-w / 2, -h / 2 + r);
    s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  }, [CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS]);

  const extrudeGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: CARD_DEPTH,
      bevelEnabled: false,
    });
    g.translate(0, 0, -CARD_DEPTH / 2);
    return g;
  }, [shape]);

  const sideMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        transparent: true,
        color: resolvedEdgeColor,
        metalness,
        roughness,
      }),
    [resolvedEdgeColor, metalness, roughness],
  );

  const frontMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: frontSurface.texture,
        transparent: true,
        alphaTest: 0.01,
        metalness,
        roughness,
        side: THREE.FrontSide,
      }),
    [frontSurface.texture, metalness, roughness],
  );

  const backMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: backSurface.texture,
        transparent: true,
        alphaTest: 0.01,
        metalness,
        roughness,
        side: THREE.FrontSide,
      }),
    [backSurface.texture, metalness, roughness],
  );

  useEffect(() => {
    return () => {
      sideMaterial.dispose();
      frontMaterial.dispose();
      backMaterial.dispose();
      extrudeGeo.dispose();
    };
  }, [sideMaterial, frontMaterial, backMaterial, extrudeGeo]);

  const { rot } = useSpring({
    rot: [y * 0.9 * (isFlipped ? -1 : 1), x * 0.9],
    config: { mass: 1.2, tension: 160, friction: 8 },
    immediate: false,
    pause: !isVisible,
  });

  useFrame((state) => {
    if (!onReadyCalledRef.current) {
      onReady();
      onReadyCalledRef.current = true;
    }

    if (mouseTrackRef.current) {
      mouseTrackRef.current.rotation.x = rot.get()[0];
      mouseTrackRef.current.rotation.y = rot.get()[1];
    }

    if (!isVisible || !project) return;

    const now = state.clock.getElapsedTime();
    if (now - lastTextureUpdateRef.current < 1 / TEXTURE_FPS) return;
    lastTextureUpdateRef.current = now;
    drawTextures(now);
  });

  const EPS = 0.001;

  return (
    <a.group
      rotation-y={rotation}
      onPointerEnter={() => !isTouch && setIsHovered(true)}
      onPointerLeave={() => !isTouch && setIsHovered(false)}
    >
      <a.group ref={mouseTrackRef}>
        <a.mesh geometry={extrudeGeo} material={sideMaterial} />
        <a.mesh
          position-z={CARD_DEPTH / 2 + EPS}
          material={frontMaterial}
          onClick={handleCardClick}
        >
          <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        </a.mesh>
        <a.mesh
          position-z={-(CARD_DEPTH / 2 + EPS)}
          rotation-y={Math.PI}
          material={backMaterial}
        >
          <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        </a.mesh>
      </a.group>
    </a.group>
  );
};
