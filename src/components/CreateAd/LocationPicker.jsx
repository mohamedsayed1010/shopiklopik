import { useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";

import {
  hintClass,
  inputBase,
  inputIdle,
  inputInvalid,
  inputSize,
} from "../ui/formStyles";

/** The shape `dynamicForm` reads; `""` is its "nothing chosen yet". */
function coordinateOf(value, key) {
  const held = value && typeof value === "object" ? value[key] : null;

  return held === null || held === undefined ? "" : String(held);
}

export default function LocationPicker({
  value,
  invalid,
  helpText,
  onChange,
  onBlur,
}) {
  const [status, setStatus] = useState("");

  const latitude = coordinateOf(value, "latitude");

  const longitude = coordinateOf(value, "longitude");

  /* A half-filled pair is not a location, so the field is cleared rather than
     handed a partial object — `locationValue` would reject it anyway. */
  const write = (next) => {
    const complete = next.latitude !== "" && next.longitude !== "";

    onChange(complete ? next : "");
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setStatus("المتصفح لا يدعم تحديد الموقع.");

      return;
    }

    setStatus("جارٍ تحديد موقعك…");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus("");

        write({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
      },
      () => setStatus("تعذّر تحديد الموقع. أدخل الإحداثيات يدويًا."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fieldClass = `${inputBase} ${inputSize} ${
    invalid ? inputInvalid : inputIdle
  }`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={locateMe}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-800 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-900"
        >
          <LocateFixed size={16} strokeWidth={2} aria-hidden="true" />
          تحديد موقعي الحالي
        </button>

        {latitude && longitude && (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-soft">
            <MapPin size={14} strokeWidth={2} aria-hidden="true" />
            {latitude}, {longitude}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="number"
          step="any"
          inputMode="decimal"
          aria-label="خط العرض"
          placeholder="خط العرض"
          value={latitude}
          onBlur={onBlur}
          onChange={(event) =>
            write({ latitude: event.target.value, longitude })
          }
          className={fieldClass}
        />

        <input
          type="number"
          step="any"
          inputMode="decimal"
          aria-label="خط الطول"
          placeholder="خط الطول"
          value={longitude}
          onBlur={onBlur}
          onChange={(event) =>
            write({ latitude, longitude: event.target.value })
          }
          className={fieldClass}
        />
      </div>

      {(status || helpText) && (
        <p className={hintClass}>{status || helpText}</p>
      )}
    </div>
  );
}
