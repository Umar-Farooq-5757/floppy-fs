interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  "aria-label"?: string;
}

const ToggleSwitch = ({
  checked,
  onChange,
  className = "",
  "aria-label": ariaLabel = "Toggle",
}: ToggleSwitchProps) => {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="px-2 pl-6 sm:pl-12 cursor-pointer">
      <label
        className={`relative inline-block h-6 w-12 sm:w-16 ${className}`}
        onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            const nextChecked = e.target.checked;
            onChange(nextChecked);
            localStorage.setItem("mode", JSON.stringify(nextChecked));
          }}
          aria-label={ariaLabel}
          className="peer sr-only"
        />
        {/* track */}
        <span
          aria-hidden="true"
          className="absolute top-0 right-0 bottom-0 -left-1 rounded-full border-2 border-[#323232] bg-[#FFDA6E] shadow-[2px_2px_0_#323232] transition-all duration-300 peer-checked:-translate-x-6 sm:peer-checked:-translate-x-9.5"
        />

        {/* thumb */}
        <span
          aria-hidden="true"
          className="absolute size-4.5 bottom-0.75 left-0.5 rounded-full border-2 border-[#323232] bg-white transition-transform duration-300"
        />

        {/* static focus ring */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full peer-focus-visible:outline-2"
        />
      </label>
    </div>
  );
};

export default ToggleSwitch;
