import React from "react";
import { GrTooltip } from "react-icons/gr";

type CircleIconButtonProps = {
  onClick?: () => void; // onClick は任意プロパティとして定義
};

const CircleIconButton: React.FC<CircleIconButtonProps> = ({ onClick }) => {
  return (
    <button
      className="
        w-12
        h-12
        rounded-full
        bg-amber-300
        text-amber-800
        flex
        items-center
        justify-center
        hover:bg-amber-500
        active:bg-amber-600
        focus:outline-none
      "
      onClick={onClick}
    >
      <GrTooltip size={20} />
    </button>
  );
};

export default CircleIconButton;
