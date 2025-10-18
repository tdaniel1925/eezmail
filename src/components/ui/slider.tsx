import * as React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    { value, onValueChange, min = 0, max = 100, step = 1, className, ...props },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange([parseInt(e.target.value)]);
    };

    return (
      <div
        ref={ref}
        className={cn('relative flex w-full items-center', className)}
        {...props}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
