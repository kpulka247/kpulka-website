import type { SkillCategory } from "../types/skill";

import { FaReact, FaGitAlt } from "react-icons/fa";
import {
  SiTypescript,
  SiTailwindcss,
  SiWebpack,
  SiVite,
  SiDjango,
  SiJavascript,
  SiHtml5,
  SiCss3,
  SiThreedotjs,
  SiGithubactions,
  SiPostgresql,
  SiBootstrap,
  SiNextdotjs,
  SiPython,
  SiSupabase,
  SiOpenai,
  SiStripe,
  SiPaddle,
  SiLemonsqueezy,
  SiVercel,
  SiCloudflare,
  SiPosthog,
  SiGoogleanalytics,
  SiExpo,
  SiVitest,
  SiI18Next,
  SiTurborepo,
  SiChromewebstore,
  SiSemanticrelease,
} from "react-icons/si";
import {
  TbApi,
  TbPhotoAi,
  TbVideo,
  TbWebhook,
  TbBrandReactNative,
} from "react-icons/tb";

export const skillCategories: SkillCategory[] = [
  {
    title: "Frontend & UI",
    skills: [
      {
        name: "React.js",
        url: "https://react.dev/",
        icon: <FaReact size={30} />,
      },
      {
        name: "Next.js",
        url: "https://nextjs.org/",
        icon: <SiNextdotjs size={30} />,
      },
      {
        name: "TypeScript",
        url: "https://www.typescriptlang.org/",
        icon: <SiTypescript size={30} />,
      },
      {
        name: "JavaScript",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        icon: <SiJavascript size={30} />,
      },
      {
        name: "Three.js",
        url: "https://threejs.org/",
        icon: <SiThreedotjs size={30} />,
      },
      {
        name: "React Native",
        url: "https://reactnative.dev/",
        icon: <TbBrandReactNative size={30} />,
      },
      {
        name: "Expo",
        url: "https://expo.dev/",
        icon: <SiExpo size={30} />,
      },
      {
        name: "Chrome Extensions",
        url: "https://developer.chrome.com/docs/extensions/",
        icon: <SiChromewebstore size={30} />,
      },
      {
        name: "HTML5",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
        icon: <SiHtml5 size={30} />,
      },
      {
        name: "CSS3",
        url: "https://developer.mozilla.org/en-US/docs/Web/CSS",
        icon: <SiCss3 size={30} />,
      },
      {
        name: "Tailwind CSS",
        url: "https://tailwindcss.com/",
        icon: <SiTailwindcss size={30} />,
      },
      {
        name: "Bootstrap",
        url: "https://getbootstrap.com/",
        icon: <SiBootstrap size={30} />,
      },
      {
        name: "i18next",
        url: "https://www.i18next.com/",
        icon: <SiI18Next size={30} />,
      },
    ],
  },
  {
    title: "Backend, Data & APIs",
    skills: [
      {
        name: "Python",
        url: "https://www.python.org/",
        icon: <SiPython size={30} />,
      },
      {
        name: "Django",
        url: "https://www.djangoproject.com/",
        icon: <SiDjango size={30} />,
      },
      {
        name: "Django REST Framework",
        url: "https://www.django-rest-framework.org/",
        icon: <TbApi size={30} />,
      },
      {
        name: "PostgreSQL",
        url: "https://www.postgresql.org/",
        icon: <SiPostgresql size={30} />,
      },
      {
        name: "Supabase",
        url: "https://supabase.com/",
        icon: <SiSupabase size={30} />,
      },
      {
        name: "OpenAI API",
        url: "https://openai.com/api/",
        icon: <SiOpenai size={30} />,
      },
      {
        name: "fal.ai",
        url: "https://fal.ai/",
        icon: <TbPhotoAi size={30} />,
      },
      {
        name: "Runware",
        url: "https://runware.ai/",
        icon: <TbVideo size={30} />,
      },
      {
        name: "Webhooks",
        url: "https://docs.github.com/en/webhooks/about-webhooks",
        icon: <TbWebhook size={30} />,
      },
      {
        name: "Stripe",
        url: "https://stripe.com/",
        icon: <SiStripe size={30} />,
      },
      {
        name: "Paddle",
        url: "https://www.paddle.com/",
        icon: <SiPaddle size={30} />,
      },
      {
        name: "Lemon Squeezy",
        url: "https://www.lemonsqueezy.com/",
        icon: <SiLemonsqueezy size={30} />,
      },
    ],
  },
  {
    title: "Tools & DevOps",
    skills: [
      {
        name: "Webpack",
        url: "https://webpack.js.org/",
        icon: <SiWebpack size={30} />,
      },
      { name: "Vite", url: "https://vitejs.dev/", icon: <SiVite size={30} /> },
      {
        name: "Git",
        url: "https://git-scm.com/",
        icon: <FaGitAlt size={30} />,
      },
      {
        name: "GitHub Actions",
        url: "https://github.com/features/actions",
        icon: <SiGithubactions size={30} />,
      },
      {
        name: "Vitest",
        url: "https://vitest.dev/",
        icon: <SiVitest size={30} />,
      },
      {
        name: "Turborepo",
        url: "https://turborepo.dev/",
        icon: <SiTurborepo size={30} />,
      },
      {
        name: "semantic-release",
        url: "https://semantic-release.gitbook.io/semantic-release",
        icon: <SiSemanticrelease size={30} />,
      },
      {
        name: "Vercel",
        url: "https://vercel.com/",
        icon: <SiVercel size={30} />,
      },
      {
        name: "Cloudflare",
        url: "https://www.cloudflare.com/",
        icon: <SiCloudflare size={30} />,
      },
      {
        name: "PostHog",
        url: "https://posthog.com/",
        icon: <SiPosthog size={30} />,
      },
      {
        name: "Google Analytics 4",
        url: "https://marketingplatform.google.com/about/analytics/",
        icon: <SiGoogleanalytics size={30} />,
      },
    ],
  },
];
