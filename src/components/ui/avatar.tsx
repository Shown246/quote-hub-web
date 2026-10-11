import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            {src && <AvatarImage src={src} alt={alt || "Avatar"} />}
            {fallback && <AvatarFallback>{fallback}</AvatarFallback>}
          </>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export interface AvatarImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, alt = "", onError, onLoad, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    if (hasError) {
      return null;
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        alt={alt}
        className={cn(
          "relative z-10 aspect-square h-full w-full object-cover",
          className
        )}
        onError={(e) => {
          setHasError(true);
          onError?.(e);
        }}
        onLoad={onLoad}
        {...props}
      />
    );
  }
);
AvatarImage.displayName = "AvatarImage";

export interface AvatarFallbackProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute inset-0 flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
