import React, { useState, useEffect } from "react";
import { navigationItems } from "../config/navigation";
import ScrollLink from "./ScrollLink";

const Navbar: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isHoveringTop, setIsHoveringTop] = useState(false);

  useEffect(() => {
    let frameId: number | null = null;
    let shouldUpdateScroll = true;
    let latestMouseY = Number.POSITIVE_INFINITY;

    const updateNavigation = () => {
      frameId = null;

      if (shouldUpdateScroll) {
        shouldUpdateScroll = false;
        const scrollTop = window.scrollY;
        setIsAtTop(scrollTop < 50);

        const docHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const scrollableHeight = docHeight - clientHeight;

        if (scrollableHeight > 0) {
          const progress = scrollTop / scrollableHeight;
          setScrollProgress(Math.min(1, Math.max(0, progress)));
        } else {
          setScrollProgress(0);
        }
      }

      setIsHoveringTop(latestMouseY < 100);
    };

    const scheduleUpdate = () => {
      if (frameId === null) frameId = requestAnimationFrame(updateNavigation);
    };

    const handleScroll = () => {
      shouldUpdateScroll = true;
      scheduleUpdate();
    };

    const handleMouseMove = (event: MouseEvent) => {
      latestMouseY = event.clientY;
      scheduleUpdate();
    };

    const initializeNavigation = () => {
      const scrollTop = window.scrollY;
      setIsAtTop(scrollTop < 50);

      const docHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollableHeight = docHeight - clientHeight;

      if (scrollableHeight > 0) {
        const progress = scrollTop / scrollableHeight;
        setScrollProgress(Math.min(1, Math.max(0, progress)));
      } else {
        setScrollProgress(0);
      }
    };

    initializeNavigation();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, []);

  const isNavVisible = isAtTop || isHoveringTop;

  return (
    <nav className="mix-blend-difference p-4 fixed w-full z-50">
      <div className="container mx-auto flex justify-center items-center">
        <div
          className={`w-full md:w-auto relative h-8 transition-transform duration-300 ease-in-out
                    ${isNavVisible ? "translate-y-0" : "-translate-y-10"}`}
        >
          <ul
            className={`flex w-full justify-around md:w-auto md:justify-start md:space-x-6 
                        transition-opacity duration-300 ease-in-out
                        ${
                          isNavVisible
                            ? "opacity-100"
                            : "opacity-0 pointer-events-none"
                        }`}
          >
            {navigationItems.map((item) => (
              <li key={item.id} className="relative z-10">
                <ScrollLink
                  to={item.id}
                  className="text-white font-semibold hover:opacity-80 transition-opacity 
                                    text-base md:text-lg px-1 py-1"
                >
                  {item.name}
                </ScrollLink>
              </li>
            ))}
          </ul>

          <div
            className="absolute left-0 h-1 bg-white rounded-full top-8"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
