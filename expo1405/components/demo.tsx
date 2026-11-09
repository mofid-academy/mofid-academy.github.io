"use client";
import {motion} from 'framer-motion';
import {AuroraBackground} from '@/components/ui/aurora-background';
export function AuroraBackgroundDemo(){return <AuroraBackground><motion.div initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} transition={{delay:.3,duration:.8,ease:'easeInOut'}} className="relative flex flex-col items-center justify-center gap-4 px-4"><h1 className="text-center text-3xl font-bold dark:text-white md:text-7xl">نظرسنجی زنده</h1><p className="py-4 text-base font-light dark:text-neutral-200 md:text-4xl">نمایشگاه بورس، بانک و بیمه ۱۴۰۵</p></motion.div></AuroraBackground>}
