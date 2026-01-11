export type VariantProps<T> = any;

export function cva(base: string, config?: any) {
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
}
