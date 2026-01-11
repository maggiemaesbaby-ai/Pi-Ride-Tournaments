// Safari-compatible wrapper for class-variance-authority
// Falls back to local implementation if blob URL loading fails

let cvaFunction: any;
let VariantPropsType: any;

try {
  // Try to load the actual class-variance-authority module
  const cvaModule = await import('class-variance-authority');
  cvaFunction = cvaModule.cva;
  VariantPropsType = cvaModule.VariantProps;
} catch (error) {
  // Fallback implementation for Safari/iOS
  console.log('[v0] Using CVA fallback for Safari compatibility');
  
  VariantPropsType = {} as any;
  
  cvaFunction = (base: string, config?: any) => {
    return (props?: any) => {
      if (!config || !props) return base;
      
      let classes = base;
      
      // Handle variants
      if (config.variants && props) {
        for (const key in config.variants) {
          const value = props[key];
          if (value && config.variants[key][value]) {
            classes += ' ' + config.variants[key][value];
          }
        }
      }
      
      // Handle defaultVariants
      if (config.defaultVariants) {
        for (const key in config.defaultVariants) {
          if (props[key] === undefined) {
            const defaultValue = config.defaultVariants[key];
            if (config.variants?.[key]?.[defaultValue]) {
              classes += ' ' + config.variants[key][defaultValue];
            }
          }
        }
      }
      
      return classes.trim();
    };
  };
}

export const cva = cvaFunction;
export type VariantProps<T> = any;
