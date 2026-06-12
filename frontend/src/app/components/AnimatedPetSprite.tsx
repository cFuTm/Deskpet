import { motion } from "motion/react";

type AnimatedPetSpriteProps = {
  src: string;
  alt: string;
  color: string;
  size?: "sm" | "md" | "lg";
  mood?: "idle" | "happy" | "thinking" | "sleepy" | "surprised" | "angry" | "shy" | "sad";
  interactive?: boolean;
  clicked?: boolean;
  className?: string;
  onClick?: () => void;
};

const sizeClass = {
  sm: {
    stage: "w-12 h-12",
    image: "w-10 h-10",
    shadow: "w-8 h-1",
  },
  md: {
    stage: "w-40 h-40",
    image: "w-36 h-36",
    shadow: "w-24 h-2",
  },
  lg: {
    stage: "w-52 h-52",
    image: "w-48 h-48",
    shadow: "w-32 h-2.5",
  },
};

const motionPreset = {
  idle: { y: [0, -7, 0], scaleY: [1, 1.018, 1], rotate: [0, 0.5, 0], duration: 3.8 },
  happy: { y: [0, -10, 0], scaleY: [1, 1.025, 1], rotate: [-0.8, 0.8, -0.8], duration: 3 },
  thinking: { y: [0, -5, 0], scaleY: [1, 1.012, 1], rotate: [-1.2, 1.2, -1.2], duration: 4.4 },
  sleepy: { y: [0, -3, 0], scaleY: [1, 1.03, 1], rotate: [0, -0.3, 0], duration: 5.2 },
  surprised: { y: [0, -12, 0], scaleY: [1, 0.99, 1], rotate: [0, 1.2, 0], duration: 2.6 },
  angry: { y: [0, -4, 0], scaleY: [1, 1.01, 1], rotate: [-1, 1, -1], duration: 2.1 },
  shy: { y: [0, -6, 0], scaleY: [1, 1.02, 1], rotate: [-0.6, 0.2, -0.6], duration: 4.2 },
  sad: { y: [0, -4, 0], scaleY: [1, 1.015, 1], rotate: [0.4, -0.2, 0.4], duration: 4.8 },
};

export function AnimatedPetSprite({
  src,
  alt,
  color,
  size = "md",
  mood = "idle",
  interactive = false,
  clicked = false,
  className = "",
  onClick,
}: AnimatedPetSpriteProps) {
  const sizes = sizeClass[size];
  const preset = motionPreset[mood] ?? motionPreset.idle;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <motion.button
        type="button"
        aria-label={alt}
        onClick={onClick}
        disabled={!interactive}
        whileHover={interactive ? { scale: 1.035 } : undefined}
        whileTap={interactive ? { scale: 0.965 } : undefined}
        className={`${sizes.stage} relative flex items-center justify-center bg-transparent p-0 outline-none ${interactive ? "cursor-pointer" : "cursor-default"}`}
      >
        <motion.div
          className="absolute inset-0 rounded-full opacity-70"
          style={{ border: `1.5px dashed ${color}55` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-[10%] rounded-full blur-xl"
          style={{ backgroundColor: `${color}22` }}
          animate={{ scale: [0.92, 1.05, 0.92], opacity: [0.45, 0.72, 0.45] }}
          transition={{ duration: preset.duration + 0.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={src}
          alt=""
          draggable={false}
          className={`${sizes.image} relative z-10 object-contain select-none drop-shadow-[0_18px_18px_rgba(60,53,48,0.16)]`}
          animate={{
            y: preset.y,
            scaleY: clicked ? [1, 0.94, 1.04, 1] : preset.scaleY,
            scaleX: clicked ? [1, 1.08, 0.98, 1] : [1, 0.992, 1],
            rotate: preset.rotate,
          }}
          transition={{ duration: clicked ? 0.55 : preset.duration, repeat: clicked ? 0 : Infinity, ease: "easeInOut" }}
        />
      </motion.button>
      <motion.div
        className={`${sizes.shadow} rounded-full bg-black/10 blur-md dark:bg-white/10`}
        animate={{ scaleX: [1, 0.78, 1], opacity: [0.16, 0.08, 0.16] }}
        transition={{ duration: preset.duration, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
