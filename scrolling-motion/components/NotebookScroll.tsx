"use client";

import { useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 300;
const IMAGES_FOLDER = "/notebook-frames";
const MIN_SCROLL_DISTANCE = 1800;
const SCROLL_DISTANCE_MULTIPLIER = 3.6;
const CROP_SCALE = 1.3;
const FINAL_FRAME_START = 0.9;
const FINAL_FRAME_SCALE = 1.1;

export default function NotebookScroll() {
  const containerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finalCanvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [scrollHeight, setScrollHeight] = useState(0);
  const isActiveRef = useRef(true);
  const navHiddenRef = useRef(false);

  const getScrollDistance = () =>
    Math.max(MIN_SCROLL_DISTANCE, window.innerHeight * SCROLL_DISTANCE_MULTIPLIER);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const frameIndex = useTransform(scrollYProgress, [0, 1], [1, FRAME_COUNT]);

  useEffect(() => {
    let isMounted = true;
    const loadImages = async () => {
      const loaded: HTMLImageElement[] = [];
      const promises: Promise<void>[] = [];
      for (let i = 1; i <= FRAME_COUNT; i += 1) {
        const p = new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.src = `${IMAGES_FOLDER}/frame_${i}.jpg`;
          img.onload = () => {
            loaded[i] = img;
            resolve();
          };
          img.onerror = reject;
        });
        promises.push(p);
      }
      try {
        await Promise.all(promises);
        if (!isMounted) return;
        setImages(loaded);
        setIsLoaded(true);
      } catch (e) {
        console.error("Failed to load notebook frames", e);
      }
    };
    loadImages();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  const renderFrame = (
    index: number,
    targetCanvas: HTMLCanvasElement | null = canvasRef.current
  ) => {
    const canvas = targetCanvas;
    if (!canvas || !isLoaded) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const clampedIndex = Math.max(1, Math.min(FRAME_COUNT, Math.floor(index)));
    const img = images[clampedIndex];
    if (!img) return;

    const progress = clampedIndex / FRAME_COUNT;
    const zoomOutT = Math.min(
      1,
      Math.max(0, (progress - FINAL_FRAME_START) / (1 - FINAL_FRAME_START))
    );
    const scaleFactor =
      CROP_SCALE - (CROP_SCALE - FINAL_FRAME_SCALE) * zoomOutT;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const viewportWidth = window.innerWidth || rect.width;
    const viewportHeight = window.innerHeight || rect.height;
    const displayWidth = Math.round(viewportWidth * dpr);
    const displayHeight = Math.round(viewportHeight * dpr);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);

    const hRatio = viewportWidth / img.width;
    const vRatio = viewportHeight / img.height;
    const scale = Math.max(hRatio, vRatio) * scaleFactor;
    const offsetX = (viewportWidth - img.width * scale) / 2;
    const offsetY = (viewportHeight - img.height * scale) / 2;

    ctx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      offsetX,
      offsetY,
      img.width * scale,
      img.height * scale
    );
  };

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const shouldHideNav = latest > 0 && latest < 1;
    if (navHiddenRef.current !== shouldHideNav) {
      navHiddenRef.current = shouldHideNav;
      window.dispatchEvent(
        new CustomEvent("nav-visibility", { detail: { hidden: shouldHideNav } })
      );
    }
    const shouldBeActive = latest < 1;
    if (isActiveRef.current !== shouldBeActive) {
      isActiveRef.current = shouldBeActive;
      setIsActive(shouldBeActive);
    }
  });

  useMotionValueEvent(frameIndex, "change", (latest) => {
    const frame = Math.max(1, Math.min(FRAME_COUNT, Math.round(latest)));
    if (canvasRef.current) {
      canvasRef.current.dataset.frame = String(frame);
    }
    requestAnimationFrame(() => renderFrame(frame));
  });

  useEffect(() => {
    if (isLoaded) {
      renderFrame(frameIndex.get());
      renderFrame(FRAME_COUNT, finalCanvasRef.current);
    }
  }, [frameIndex, isLoaded]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("nav-visibility", { detail: { hidden: false } }));
    return () => {
      window.dispatchEvent(new CustomEvent("nav-visibility", { detail: { hidden: false } }));
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      const scrollDistance = getScrollDistance();
      setScrollHeight(scrollDistance);
      if (isLoaded) {
        renderFrame(frameIndex.get());
        renderFrame(FRAME_COUNT, finalCanvasRef.current);
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [frameIndex, isLoaded]);

  return (
    <div className="relative w-screen bg-[#FDF6EB]">
      <section
        ref={containerRef}
        className="relative w-screen"
        style={{ height: scrollHeight ? `${scrollHeight}px` : "100vh" }}
      >
        <div
          className={`fixed left-0 top-0 z-30 w-screen bg-[#FDF6EB] transition-[height,opacity] duration-500 ${
            isActive ? "opacity-100" : "opacity-0 invisible"
          } pointer-events-none`}
          style={{ height: "100vh" }}
          aria-hidden="true"
        >
          <div className="relative h-screen w-screen">
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.4em] text-[#6E0B14]/80">
                Loading the notebook
              </div>
            )}
          </div>
        </div>
      </section>
      <div className="relative h-screen w-screen bg-[#FDF6EB]">
        <canvas ref={finalCanvasRef} className="absolute inset-0 h-full w-full" />
      </div>
      <section className="w-full bg-[#FDF6EB] py-28 md:py-40">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 text-center md:px-10">
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#6E0B14]/80">
            WHAT IREAL IS
          </p>
          <h2 className="mt-6 text-4xl font-serif leading-[1.05] text-[#0B0B0B]/90 md:text-6xl">
            A content system for creators who want to ship consistently.
          </h2>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-[#0B0B0B]/80 md:text-lg">
            <span className="block">
              IREAL turns scattered ideas into structured, on-brand content
            </span>
            <span className="block">and a reliable publishing rhythm.</span>
          </p>
          <div className="mt-12">
            <a
              href="#waitlist"
              className="inline-flex items-center justify-center rounded-full bg-[#6E0B14] px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#FDF6EB] shadow-[0_14px_30px_rgba(110,11,20,0.2)] transition-shadow hover:shadow-[0_18px_36px_rgba(110,11,20,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E0B14] md:text-sm"
            >
              Join the waitlist
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
