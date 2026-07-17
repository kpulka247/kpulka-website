import React, { useState, Suspense, useRef, useEffect } from "react";
import SectionHeader from "../components/SectionHeader";
import { Canvas } from "@react-three/fiber";
import { InteractiveCard } from "../components/InteractiveCard";
import { MovingLight } from "../components/MovingLight";
import { Spinner } from "../components/Loader";
import { motion } from "framer-motion";
import { fadeIn } from "../utils/animations";
import { projectsData } from "../data/projects";
import { BsPersonFill, BsStarFill, BsArrowRepeat } from "react-icons/bs";

const Projects: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const [isCardReady, setIsCardReady] = useState(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const selectedProject =
    projectsData.find((p) => p.id === selectedProjectId) || null;

  const handleProjectSelect = (projectId: number) => {
    if (selectedProjectId !== null && selectedProjectId !== projectId) {
      setSelectedProjectId(null);

      setTimeout(() => {
        setSelectedProjectId(projectId);
        setIsFlipped(false);
      }, 300);
    } else {
      setSelectedProjectId((prevId) =>
        prevId === projectId ? null : projectId,
      );
      setIsFlipped(false);
    }
  };

  const handleCardReady = () => {
    setIsCardReady(true);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCanvasVisible(entry.isIntersecting);
      },
      {
        threshold: 0,
      },
    );

    const currentContainer = canvasContainerRef.current;
    if (currentContainer) {
      observer.observe(currentContainer);
    }

    return () => {
      if (currentContainer) {
        observer.unobserve(currentContainer);
      }
    };
  }, []);

  return (
    <section className="py-10 md:py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="md:col-span-1 flex flex-col items-center md:items-end">
            <div className="text-center md:text-right mb-6">
              <SectionHeader
                title="PROJECTS"
                subtitle="Click on a project to see the details."
                fileName="Projects"
              />
            </div>
            <ul className="w-full">
              {projectsData.map((project) => (
                <li
                  key={project.id}
                  className="flex flex-col items-center md:items-end"
                >
                  <button
                    onClick={() => handleProjectSelect(project.id)}
                    className={`font-mono py-4 text-lg transition-all duration-300 cursor-pointer
                                            ${
                                              selectedProjectId === project.id
                                                ? "text-white font-bold"
                                                : "hover:text-white"
                                            }
                                        `}
                  >
                    <div className="flex items-center gap-3">
                      {project.chromeExtensionId && (
                        <div className="flex items-center justify-center">
                          <BsPersonFill size={16} className="mr-1" />
                          <img
                            src={`https://img.shields.io/chrome-web-store/users/${project.chromeExtensionId}?style=flat-square&label=&color=black`}
                            alt="Chrome Web Store Users"
                            loading="lazy"
                            decoding="async"
                            width={32}
                            height={20}
                            style={{ height: "20px", width: "auto" }}
                          />
                          <BsStarFill size={16} className="mx-1" />
                          <img
                            src={`https://img.shields.io/chrome-web-store/rating/${project.chromeExtensionId}?style=flat-square&label=&color=black`}
                            alt="Chrome Web Store rating"
                            loading="lazy"
                            decoding="async"
                            width={32}
                            height={20}
                            style={{ height: "20px", width: "auto" }}
                          />
                        </div>
                      )}
                      {project.title}
                    </div>
                  </button>
                  <div
                    className={`overflow-hidden text-center md:text-right transition-all duration-300 ease-in-out
                                            ${
                                              selectedProjectId === project.id
                                                ? "max-h-screen opacity-100"
                                                : "max-h-0 opacity-0"
                                            }
                                        `}
                  >
                    <div className="flex justify-center md:justify-end text-sm font-mono gap-3">
                      {project.chromeExtensionId && (
                        <a
                          href={`https://chrome.google.com/webstore/detail/${project.chromeExtensionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-600 hover:text-white underline pb-4"
                        >
                          Chrome
                        </a>
                      )}
                      {project.firefoxExtensionId && (
                        <a
                          href={`https://addons.mozilla.org/firefox/addon/${project.firefoxExtensionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-600 hover:text-white underline pb-4"
                        >
                          Firefox
                        </a>
                      )}
                      {(() => {
                        const externalLink =
                          project.websiteLink ?? project.githubLink;

                        if (!externalLink) return null;

                        return (
                          <a
                            href={externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-600 hover:text-white underline pb-4"
                          >
                            {project.websiteLink ? "Website" : "GitHub"}
                          </a>
                        );
                      })()}
                    </div>
                    <p className="pb-4 text-md">{project.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div
            ref={canvasContainerRef}
            className="md:col-span-1 flex flex-col items-center justify-center min-h-[500px] md:h-[600px] relative"
          >
            {!isCardReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner />
              </div>
            )}

            <motion.div
              className="w-full h-full"
              variants={fadeIn}
              initial="hidden"
              animate={isCardReady ? "visible" : "hidden"}
            >
              <Canvas
                camera={{ position: [0, 0, 9], fov: 52 }}
                frameloop={isCanvasVisible ? "always" : "never"}
              >
                <directionalLight position={[20, 7, -5]} intensity={0.4} />
                <rectAreaLight
                  width={20}
                  height={20}
                  intensity={6}
                  color="#ffffff"
                  position={[-10, 10, 10]}
                />
                <Suspense fallback={null}>
                  <InteractiveCard
                    project={selectedProject}
                    isFlipped={isFlipped}
                    isVisible={isCanvasVisible}
                    onReady={handleCardReady}
                  />
                  <MovingLight />
                </Suspense>
              </Canvas>
            </motion.div>

            <div className="mt-4">
              <button
                onClick={() => setIsFlipped((prev) => !prev)}
                className="p-2 hover:text-white transition-all duration-300 cursor-pointer"
                style={{
                  transform: isFlipped ? "rotate(180deg)" : "rotate(0deg)",
                }}
                aria-label="Flip Card"
                title="Flip Card"
              >
                <BsArrowRepeat className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
