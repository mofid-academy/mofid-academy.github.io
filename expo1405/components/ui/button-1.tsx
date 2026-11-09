'use client';
import React from 'react';
import {ShinyButton} from '@/components/ui/shiny-button';
import type {ButtonProps} from '@/components/ui/button';
import {cn} from '@/lib/utils';

export interface GradientButtonProps extends Omit<ButtonProps,'asChild'>{width?:string|number;height?:string|number}
const GradientButton=React.forwardRef<HTMLButtonElement,GradientButtonProps>(({width,height,style,className,children,...props},ref)=><ShinyButton ref={ref} className={cn('gradient-button',className)} style={{...style,...(width!==undefined?{width}:{}),...(height!==undefined?{height}:{})}} {...props}><span className="gradient-button-label">{children}</span></ShinyButton>);
GradientButton.displayName='GradientButton';
export default GradientButton;
