import { useState, useRef, useEffect } from "react";
import { BANGALORE_AREAS } from "@/data/bangalore-areas";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

/** Match by prefix first, then by contains (e.g. "nagar" → Jayanagar, Rajajinagar). */
function filterAreas(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return BANGALORE_AREAS;
  const prefixMatches = BANGALORE_AREAS.filter((area) =>
    area.toLowerCase().startsWith(q)
  );
  const rest = BANGALORE_AREAS.filter(
    (area) =>
      !prefixMatches.includes(area) &&
      area.toLowerCase().includes(q)
  );
  return [...prefixMatches, ...rest];
}

type CityAreaInputBaseProps = {
  placeholder?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
};

type CityAreaInputSingleProps = CityAreaInputBaseProps & {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
};

type CityAreaInputMultiProps = CityAreaInputBaseProps & {
  multiple: true;
  values: string[];
  onValuesChange: (values: string[]) => void;
};

type CityAreaInputProps = CityAreaInputSingleProps | CityAreaInputMultiProps;

export function CityAreaInput({
  placeholder = "e.g. Rajajinagar, Electronic City",
  id,
  className,
  inputClassName,
  ...props
}: CityAreaInputProps) {
  const isMultiple = "multiple" in props && props.multiple === true;
  const singleValue = !isMultiple ? props.value : "";
  const selectedValues = isMultiple ? props.values : [];
  const [lockedSingleBySelect, setLockedSingleBySelect] = useState(false);
  const lockedSingle = !isMultiple && lockedSingleBySelect;

  const [query, setQuery] = useState("");
  const effectiveValue = isMultiple ? query : singleValue;

  const onChangeSingle = (v: string) => {
    if (isMultiple) return;
    props.onChange(v);
  };

  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = filterAreas(effectiveValue).filter((a) =>
    isMultiple ? !selectedValues.includes(a) : true
  );
  const showDropdown = open && suggestions.length > 0;

  const closeDropdown = () => setOpen(false);

  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [effectiveValue]);

  // For single-select, close the dropdown once we have a value (locked mode).
  useEffect(() => {
    if (!isMultiple && lockedSingle) setOpen(false);
  }, [isMultiple, lockedSingle]);

  useEffect(() => {
    if (!isMultiple && !singleValue) setLockedSingleBySelect(false);
  }, [isMultiple, singleValue]);

  const handleSelect = (area: string) => {
    if (isMultiple) {
      const next = selectedValues.includes(area) ? selectedValues : [...selectedValues, area];
      props.onValuesChange(next);
      setQuery("");
      setOpen(true);
      return;
    }
    setLockedSingleBySelect(true);
    onChangeSingle(area);
    closeDropdown();
  };

  const clearSingle = () => {
    if (isMultiple) return;
    setLockedSingleBySelect(false);
    onChangeSingle("");
    setQuery("");
    setOpen(false);
  };

  const removeSelected = (area: string) => {
    if (!isMultiple) return;
    props.onValuesChange(selectedValues.filter((v) => v !== area));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isMultiple && e.key === "Backspace" && !effectiveValue) {
      if (selectedValues.length) {
        props.onValuesChange(selectedValues.slice(0, -1));
      }
      return;
    }

    if (!showDropdown) {
      if (e.key === "ArrowDown" || e.key === "Escape") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(suggestions[highlightIndex]);
      return;
    }
    if (e.key === "Escape") {
      closeDropdown();
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {isMultiple && selectedValues.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedValues.map((area) => (
            <button
              key={area}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => removeSelected(area)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground hover:bg-muted/70"
              aria-label={`Remove ${area}`}
            >
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{area}</span>
              <span className="text-muted-foreground">×</span>
            </button>
          ))}
        </div>
      )}
      <Input
        id={id}
        type="text"
        value={effectiveValue}
        disabled={lockedSingle}
        onChange={(e) => {
          if (isMultiple) setQuery(e.target.value);
          else {
            setLockedSingleBySelect(false);
            onChangeSingle(e.target.value);
          }
        }}
        onFocus={() => {
          if (!lockedSingle) setOpen(true);
        }}
        onBlur={() => setTimeout(closeDropdown, 150)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls="city-area-list"
        aria-activedescendant={showDropdown ? `city-area-option-${highlightIndex}` : undefined}
        className={cn("h-10", lockedSingle ? "pr-12" : "", inputClassName)}
      />

      {lockedSingle && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearSingle}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-muted/70"
            aria-label="Clear selected location"
          >
            ×
          </button>
        </div>
      )}
      {showDropdown && (
        <ul
          id="city-area-list"
          role="listbox"
          className="absolute z-[1000] mt-1 w-full rounded-md border border-border bg-background py-1 shadow-lg max-h-56 overflow-auto"
        >
          {suggestions.map((area, i) => (
            <li
              key={area}
              id={`city-area-option-${i}`}
              role="option"
              aria-selected={i === highlightIndex}
              onMouseEnter={() => setHighlightIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(area);
              }}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm",
                i === highlightIndex
                  ? "bg-primary/10 text-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {area}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
