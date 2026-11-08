"use client";
import {cn} from '@/lib/utils';
import React,{type ReactNode} from 'react';
interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement>{children:ReactNode;showRadialGradient?:boolean;}
export const AuroraBackground=({className,children,showRadialGradient=true,...props}:AuroraBackgroundProps)=>{
 return <main><div className={cn('relative flex h-[100vh] w-full flex-col items-center justify-center bg-mofid-50 text-slate-950 transition-colors dark:bg-mofid-950',className)} {...props}>
  <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className={cn(`
    [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
    [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]
    [--aurora:repeating-linear-gradient(100deg,var(--mofid-500)_10%,var(--mofid-300)_15%,var(--mofid-200)_20%,var(--mofid-600)_25%,var(--mofid-400)_30%)]
    [background-image:var(--white-gradient),var(--aurora)] dark:[background-image:var(--dark-gradient),var(--aurora)]
    [background-size:300%,_200%] [background-position:50%_50%,50%_50%]
    absolute -inset-[10px] opacity-50 blur-[10px] invert-0 will-change-transform dark:invert-0
    after:absolute after:inset-0 after:content-[""] after:[background-image:var(--white-gradient),var(--aurora)]
    dark:after:[background-image:var(--dark-gradient),var(--aurora)] after:[background-size:200%,_100%]
    after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference motion-reduce:after:animate-none
   `,showRadialGradient&&'[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]')}/></div>
  {children}
 </div></main>;
};
