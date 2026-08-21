import { FaGithub } from "react-icons/fa";

const Header = () => {
  return (
    <header className="py-0.5 px-3">
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-lg">Floppy FS</h1>
      <button className="transition-all hover:bg-black/7 p-1 rounded-sm"
        onClick={() =>
          window.open("https://github.com/umar-farooq-5757/floppy-fs")
        }>
        <FaGithub className="size-4.5"/>
      </button>
      </div>
    </header>
  );
};

export default Header;
