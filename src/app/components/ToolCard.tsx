import Link from "next/link";

interface ToolCardProps {
  title: string;
  description: string;
  slug: string;
}

export default function ToolCard({ title, description, slug }: ToolCardProps) {
  return (
    <Link href={`/${slug}`}>
      {/* カード全体の高さを固定し、テキスト量に関わらず高さをそろえる */}
      <div
        className="
          group cursor-pointer
          bg-amber-700 rounded-lg shadow-md p-6
          transition-all
          hover:shadow-xl hover:scale-105 hover:bg-amber-500
          flex flex-col items-start
          w-full max-w-xs mx-auto
          h-36
        "
      >
        <h2 className="text-xl font-bold text-yellow-100 mb-3">{title}</h2>
        <p className="text-sm text-gray-100 overflow-hidden text-ellipsis line-clamp-3">
          {description}
        </p>
      </div>
    </Link>
  );
}
