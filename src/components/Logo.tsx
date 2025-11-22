import logo from "@/assets/chunkylogo.svg";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Logo = ({ size = "md", className = "" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
  };

  return <img src={logo} alt="ChunkMaster Logo" className={`${sizeClasses[size]} w-auto ${className}`} />;
};
