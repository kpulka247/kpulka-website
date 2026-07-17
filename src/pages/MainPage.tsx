import {
  useState,
  useEffect,
  useRef,
  lazy,
  Suspense,
  useCallback,
} from "react";
import ReactGA from "react-ga4";
import { motion, AnimatePresence, useInView } from "framer-motion";

import Navbar from "../components/Navbar";
import Hero from "../sections/Hero";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import { Spinner } from "../components/Loader";
import { fade, fadeIn } from "../utils/animations";

const InteractiveBg = lazy(() => import("../components/InteractiveBg"));
const Skills = lazy(() => import("../sections/Skills"));
const Projects = lazy(() => import("../sections/Projects"));
const About = lazy(() => import("../sections/About"));
const Contact = lazy(() => import("../sections/Contact"));

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const BACKGROUND_FALLBACK_COLOR = "#eaebef";

interface DeferredSectionProps {
  id: string;
  minHeight: number;
  component: React.LazyExoticComponent<React.ComponentType>;
}

const SectionController: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      variants={fadeIn}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
};

const DeferredSection: React.FC<DeferredSectionProps> = ({
  id,
  minHeight,
  component: SectionComponent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldRender(true);
        observer.disconnect();
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      id={id}
      ref={containerRef}
      style={shouldRender ? undefined : { minHeight }}
    >
      {shouldRender && (
        <Suspense
          fallback={
            <div
              className="flex justify-center py-10 md:py-20"
              style={{ minHeight }}
            >
              <Spinner />
            </div>
          }
        >
          <SectionController>
            <SectionComponent />
          </SectionController>
        </Suspense>
      )}
    </div>
  );
};

const MainPage = () => {
  const mousePosRef = useRef({ x: 0.5, y: 0.5 });
  const [isSimulationActive, setSimulationActive] = useState(true);
  const [isBgReady, setIsBgReady] = useState(false);
  const [shouldMountBg, setShouldMountBg] = useState(false);

  const handleBgReady = () => {
    setIsBgReady(true);
  };

  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      ReactGA.initialize(GA_MEASUREMENT_ID);
    }
  }, []);

  useEffect(() => {
    let frameId: number | null = null;
    let latestPosition = { clientX: 0, clientY: 0 };

    const updatePosition = () => {
      frameId = null;
      mousePosRef.current = {
        x: latestPosition.clientX / window.innerWidth,
        y: latestPosition.clientY / window.innerHeight,
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      latestPosition = { clientX: event.clientX, clientY: event.clientY };
      if (frameId === null) frameId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const mountBackground = () => setShouldMountBg(true);

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(mountBackground, {
        timeout: 1200,
      });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(mountBackground, 250);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  const handleHeroVisibilityChange = useCallback((isVisible: boolean) => {
    setSimulationActive(isVisible);
  }, []);

  const sections = [
    { id: "skills", component: Skills, minHeight: 520 },
    { id: "projects", component: Projects, minHeight: 760 },
    { id: "about", component: About, minHeight: 620 },
    { id: "contact", component: Contact, minHeight: 480 },
  ];

  return (
    <>
      <motion.div
        variants={fade}
        initial="hidden"
        animate="visible"
        className="text-zinc-800 antialiased min-h-screen flex flex-col"
      >
        <Navbar />
        <main className="flex-grow relative">
          <div className="relative z-10" style={{ isolation: "isolate" }}>
            <div
              className="fixed inset-0 z-0 pointer-events-none"
              style={{ backgroundColor: BACKGROUND_FALLBACK_COLOR }}
              aria-hidden="true"
            />

            <AnimatePresence>
              {shouldMountBg && (
                <Suspense fallback={null}>
                  <motion.div
                    className="fixed inset-0 z-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isBgReady ? 1 : 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    aria-hidden="true"
                  >
                    <InteractiveBg
                      mousePosRef={mousePosRef}
                      isSimulationActive={isSimulationActive}
                      onReady={handleBgReady}
                    />
                  </motion.div>
                </Suspense>
              )}
            </AnimatePresence>

            <Hero onVisibilityChange={handleHeroVisibilityChange} />
          </div>
          <div
            id="main-page"
            className="z-20 bg-black text-zinc-300 rounded-t-4xl relative"
          >
            {sections.map((section) => (
              <DeferredSection key={section.id} {...section} />
            ))}
          </div>
        </main>
        <Footer />
      </motion.div>

      <CookieBanner />
    </>
  );
};

export default MainPage;
