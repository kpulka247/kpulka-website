import React from "react";
import { motion } from "framer-motion";
import SectionHeader from "../components/SectionHeader";
import { skillCategories } from "../data/skills";
import { staggerContainer, staggerItem } from "../utils/animations";

const allSkills = skillCategories.flatMap((category) => category.skills);

const Skills: React.FC = () => {
  const [hoveredSkillName, setHoveredSkillName] = React.useState<string | null>(
    null,
  );
  const [hoveredSliderIndex, setHoveredSliderIndex] = React.useState<
    number | null
  >(null);
  const duplicatedSkills = [...allSkills, ...allSkills];

  return (
    <section id="skills" className="py-10 md:py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="text-center">
          <SectionHeader
            title="SKILLS"
            subtitle="Technologies I work with."
            fileName="Skills"
          />
        </div>

        <div
          className="overflow-hidden flex relative h-16 items-center mt-10 md:mt-20"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          }}
        >
          <div className="flex gap-16 animate-loop-scroll">
            {duplicatedSkills.map((skill, index) => (
              <motion.div
                key={index}
                className="mx-2"
                animate={
                  hoveredSliderIndex === index % allSkills.length
                    ? { color: "#fff", scale: 1.2 }
                    : { color: "#27272a", scale: 1 }
                }
              >
                {skill.icon}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 items-start gap-6 text-left md:mt-20 md:grid-cols-3 md:gap-8 lg:gap-10">
          {skillCategories.map((category, index) => (
            <motion.div
              key={category.title}
              className={`${
                index === 1 ? "md:mt-10" : index === 2 ? "md:mt-20" : ""
              } relative overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm`}
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.05 }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-zinc-500/60 to-transparent"
              />
              <div className="mb-6 flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold tracking-widest text-zinc-500">
                  {category.title}
                </h3>
                <span className="font-mono text-xs tracking-widest text-zinc-700">
                  0{index + 1}
                </span>
              </div>
              <ul className="space-y-4">
                {category.skills.map((skill) => (
                  <motion.li key={skill.name} variants={staggerItem}>
                    <motion.a
                      href={skill.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative inline-block cursor-pointer font-mono text-md tracking-wide text-zinc-300 transition-colors duration-300 hover:text-white"
                      onMouseEnter={() => {
                        setHoveredSkillName(skill.name);
                        const sliderIndex = allSkills.findIndex(
                          (s) => s.name === skill.name,
                        );
                        setHoveredSliderIndex(sliderIndex);
                      }}
                      onMouseLeave={() => {
                        setHoveredSkillName(null);
                        setHoveredSliderIndex(null);
                      }}
                    >
                      {skill.name}
                      <motion.span
                        className="absolute left-0 -bottom-1 h-[2px] bg-white rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: hoveredSkillName === skill.name ? "100%" : 0,
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      />
                    </motion.a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
