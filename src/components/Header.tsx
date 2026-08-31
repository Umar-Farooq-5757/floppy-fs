import { FaGithub } from "react-icons/fa";
import ToggleSwitch from "./ToggleSwitch";
import { useAppContext } from "../context/AppContext";

const Header = () => {
  const { checked, setChecked } = useAppContext();
  return (
    <header className={`py-0.5 px-3 ${!checked && 'bg-slate-900'}`}>
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-lg">Floppy FS</h1>
        <div className="flex items-center gap-3 md:gap-5 sm:gap-10">
          <div className="flex items-center gap-1 sm:gap-3">
            <p className="font-semibold font-mono">Terminal Mode</p>
            <ToggleSwitch checked={checked} onChange={setChecked} />
            <p className="font-semibold font-mono">UI Mode</p>
          </div>
          <button
            className="transition-all hover:bg-black/7 p-1 rounded-sm"
            onClick={() =>
              window.open("https://github.com/umar-farooq-5757/floppy-fs")
            }>
            <FaGithub className="size-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
