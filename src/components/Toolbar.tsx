import { MdOutlineFileOpen } from "react-icons/md";
import { VscNewFile } from "react-icons/vsc";

const Toolbar = () => {
  return (
    <section className="px-3 py-2 bg-black/4 border border-black/10 flex">
      <div className="flex items-center gap-2 hover:bg-black/10 w-fit py-1 px-2 cursor-default rounded-xs">
        <VscNewFile />
        <p className="text-sm">New File</p>
      </div>
      <div className="flex items-center gap-2 hover:bg-black/10 w-fit py-1 px-2 cursor-default rounded-xs">
        <MdOutlineFileOpen />
        <p className="text-sm">Open</p>
      </div>
    </section>
  );
};

export default Toolbar;
