import React, { useState } from "react";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import SectionHeader from "../components/SectionHeader";
import { trackEvent } from "../utils/analytics";

const Contact: React.FC = () => {
  const [isCopied, setIsCopied] = useState(false);
  const email = "contact@kpulka.com";

  const handleCopyEmail = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    navigator.clipboard
      .writeText(email)
      .then(() => {
        setIsCopied(true);
        trackEvent("Contact", "click_icon", "Copy email");
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy email address: ", err);
      });
  };

  const handleEmailClick = () => {
    trackEvent("Contact", "click_icon", "Email");
  };

  const handleGitHubClick = () => {
    trackEvent("Contact", "click_icon", "GitHub");
  };

  const handleLinkedInClick = () => {
    trackEvent("Contact", "click_icon", "LinkedIn");
  };

  return (
    <section className="py-10 md:py-20">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <SectionHeader
          title="GET IN TOUCH"
          subtitle="Let's connect and build something awesome together."
          fileName="Contact"
        />

        <p className="text-md mb-10">
          Whether you want to talk about a project, collaboration, or just say
          hi, feel free to reach out through any of the platforms below.
        </p>

        <div className="flex text-zinc-200 justify-center items-center gap-12">
          {/* Email */}
          <div className="relative flex items-center group">
            <div
              className="absolute right-full top-1/2 -translate-y-1/2 flex items-center gap-3
                         opacity-0 -translate-x-4 transition-all duration-300
                         group-hover:opacity-100 group-hover:translate-x-0
                         pointer-events-none group-hover:pointer-events-auto mr-4"
            >
              <span className="font-mono whitespace-nowrap">{email}</span>
              <button
                onClick={handleCopyEmail}
                className={`font-semibold text-sm py-1 px-3 rounded-md transition-all duration-300 ease-in-out ${
                  isCopied
                    ? "bg-white text-black"
                    : "bg-transparent cursor-pointer border border-zinc-300 text-zinc-300 hover:bg-white hover:text-black"
                }`}
              >
                {isCopied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="absolute right-full top-0 h-full w-4 group-hover:block hidden pointer-events-auto"></div>

            <a
              href={`mailto:${email}`}
              aria-label="Send an email or hover to copy"
              className="transition transform hover:scale-110"
              onClick={handleEmailClick}
            >
              <FaEnvelope className="text-4xl group-hover:text-white transition-colors duration-300" />
            </a>
          </div>

          {/* GitHub */}
          <a
            href="https://github.com/kpulka247"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center transition transform hover:scale-110"
            aria-label="GitHub Profile"
            onClick={handleGitHubClick}
          >
            <FaGithub className="text-4xl group-hover:text-white transition-colors duration-300" />
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/kpulka247/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center transition transform hover:scale-110"
            aria-label="LinkedIn Profile"
            onClick={handleLinkedInClick}
          >
            <FaLinkedin className="text-4xl group-hover:text-white transition-colors duration-300" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Contact;
