import Lottie from "lottie-react";
import mascot from "../../../../assets/motion/characters/mascot-idle-loop.json";

type Props = {
  className?: string;
};

export function AgentLottie({ className }: Props) {
  return (
    <Lottie
      className={className}
      animationData={mascot}
      loop
      autoplay
      style={{ width: "100%", height: "100%" }}
    />
  );
}
