import Link from "next/link";

const Header = () => {
  return (
    <header className="bg-amber-200 py-5">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-red-600 text-3xl font-bold">
          <Link href="/">🥞Fantastic Pancake</Link>
        </h1>
        <ul className="flex gap-3"></ul>
      </div>
    </header>
  );
};

export default Header;
