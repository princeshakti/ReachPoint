import { Check, LocateFixed, MapPin } from "lucide-react";
import type { RefObject } from "react";

interface AddressFieldProps {
  value: string;
  onChange: (value: string) => void;
  onUseLocation: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  locating: boolean;
  disabled: boolean;
  error: string | null;
  /** Confirmation shown when the address came from the device's location. */
  usingCurrentLocation: boolean;
}

export function AddressField({
  value,
  onChange,
  onUseLocation,
  inputRef,
  locating,
  disabled,
  error,
  usingCurrentLocation,
}: AddressFieldProps) {
  return (
    <div>
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-soft"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Street address, city or ZIP code"
          aria-label="Patient address"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "address-error" : undefined}
          autoComplete="off"
          disabled={disabled}
          className="h-14 w-full rounded-tile border border-line-strong bg-surface pr-4 pl-12 text-lg text-ink placeholder:text-ink-soft/80 hover:border-reach disabled:opacity-60 aria-invalid:border-danger"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={onUseLocation}
          disabled={disabled}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-reach hover:text-reach-deep disabled:opacity-60"
        >
          <LocateFixed className="size-4" aria-hidden="true" />
          {locating ? "Finding your location…" : "Use my current location"}
        </button>
        {usingCurrentLocation && !error && (
          <p className="inline-flex items-center gap-1.5 text-sm font-bold text-ok">
            <Check className="size-4" aria-hidden="true" />
            Using this device's location
          </p>
        )}
      </div>

      {error && (
        <p id="address-error" role="alert" className="mt-3 text-sm font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
