import metaData from "./meta.json";
import ToolCard from "./components/ToolCard";

export default function HomePage() {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mt-5 mb-10 text-center text-amber-800">
        トッピング一覧
      </h1>
      <div
        className="grid gap-4 justify-center"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 300px))",
        }}
      >
        {metaData.map((tool) => (
          <ToolCard
            key={tool.slug}
            title={tool.title}
            description={tool.description}
            slug={tool.slug}
          />
        ))}
      </div>
    </div>
  );
}
