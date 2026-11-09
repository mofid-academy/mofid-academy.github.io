'use client';
import * as React from 'react';
import {Button,type ButtonProps} from '@/components/ui/button';
import {cn} from '@/lib/utils';

// The same Mofid conic border, dots and shimmer are shared with native poll buttons.
export const ShinyButton=React.forwardRef<HTMLButtonElement,ButtonProps>(({className,type='button',children,...props},ref)=><Button ref={ref} type={type} className={cn('shiny-cta',className)} {...props}>{children}</Button>);
ShinyButton.displayName='ShinyButton';
