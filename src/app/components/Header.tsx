import Link from "next/link";

const Header = () => {
  return (
    <header className="bg-amber-200 py-5">
      <div
        className="
      container
      flex justify-between items-center
      mx-auto          /* ← モバイル(～640px)では margin: 0 auto */
      md:mx-0          /* ← 640px以上の画面では margin: 0 */
    "
      >
        <h1 className="text-red-600 text-3xl font-bold">
          <Link href="/">🥞Fantastic Pancake</Link>
        </h1>
        <ul className="flex gap-3"></ul>
      </div>
    </header>
  );
};

export default Header;
