'use client';
import * as React from 'react';
import {cn} from '@/lib/utils';
export interface LiquidMetalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>{label?:string}
export const LiquidMetalButton=React.forwardRef<HTMLButtonElement,LiquidMetalButtonProps>(({label,children,className,type='button',...props},ref)=><button ref={ref} type={type} className={cn('liquid-metal-button',className)} {...props}><span>{children??label}</span></button>);
LiquidMetalButton.displayName='LiquidMetalButton';
