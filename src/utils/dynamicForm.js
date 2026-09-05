
/** Field types whose value is a list of `File`s. */
export const FILE_TYPES = ["image", "file", "video", "audio", "pdf"];

/** Field types whose value is an array. */
const ARRAY_TYPES = ["multiselect", ...FILE_TYPES];

export const LOCATION_TYPE = "location";

/** The two keys a location writes, per its config (never assumed). */
export function locationTargets(field) {
  const targets = Array.isArray(field?.writesFields) ? field.writesFields : [];

  return {
    latitudeKey: targets[0] ?? "Latitude",
    longitudeKey: targets[1] ?? "Longitude",
  };
}

/** A finite coordinate, or null. Accepts the strings a text input produces. */
function coordinate(value) {
  if (value === undefined || value === null || value === "") return null;

  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : null;
}

export function locationValue(value) {
  if (!value || typeof value !== "object") return null;

  const latitude = coordinate(value.latitude);

  const longitude = coordinate(value.longitude);

  if (latitude === null || longitude === null) return null;

  // Outside these bounds it is not a point on Earth, whatever it parsed as.
  if (latitude < -90 || latitude > 90) return null;

  if (longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

export const SUBMISSION_KEYS = {
  "/api/furniture": { GoogleMapsUrl: "GoogleMaps" },
  "/api/furnishings-curtains": { GoogleMapsUrl: "GoogleMaps" },
  "/api/lighting-decor": { GoogleMapsUrl: "GoogleMaps" },
  "/api/kitchen-tools": { GoogleMapsUrl: "GoogleMaps" },
  "/api/home-appliances": { GoogleMapsUrl: "GoogleMaps" },
  "/api/bathroom-supplies": { GoogleMapsUrl: "GoogleMaps" },
  "/api/plants-ornaments": { GoogleMapsUrl: "GoogleMaps" },
};

/** The key a field's value should be submitted under, for a given endpoint. */
export function submissionKey(name, endpoint) {
  return SUBMISSION_KEYS[endpoint]?.[name] ?? name;
}

export function normalizeOption(raw) {
  if (raw === null || typeof raw !== "object") {
    return { value: raw, label: String(raw ?? ""), group: null };
  }

  const value = raw.id !== undefined && raw.id !== null ? raw.id : raw.value;

  return {
    value,
    label: String(raw.label ?? raw.name ?? raw.nameEn ?? value ?? ""),
    group: raw.groupAr ?? raw.group ?? raw.groupName ?? null,
  };
}

const DISPLAY_KEYS = new Set([
  "name",
  "namear",
  "nameen",
  "label",
  "labelar",
  "labelen",
  "text",
  "title",
  "description",
  "url",
  "imageurl",
  "icon",
  "group",
  "groupar",
  "groupname",
  "order",
  "isprimary",
  "isactive",
]);

export function optionValueOf(item) {
  if (item === null || typeof item !== "object") return item;

  if (item.id !== undefined && item.id !== null) return item.id;

  if (item.value !== undefined && item.value !== null) return item.value;

  const entry = Object.entries(item).find(
    ([key, value]) =>
      !DISPLAY_KEYS.has(key.toLowerCase()) &&
      (typeof value === "number" ||
        (typeof value === "string" && value !== ""))
  );

  return entry ? entry[1] : "";
}

/** Inline `options` win when present; otherwise resolve `optionsSource`. */
export function resolveOptions(field, lookups = {}) {
  const raw = field?.options ?? lookups?.[field?.optionsSource] ?? [];

  return Array.isArray(raw) ? raw.map(normalizeOption) : [];
}

/** Loose scalar equality — the API mixes `1`, `"1"` and `true` freely. */
const sameValue = (a, b) => String(a) === String(b);

export function matchesCondition(condition, value) {
  if (!condition || !Array.isArray(condition.values)) return false;

  if (Array.isArray(value)) {
    return value.some((item) =>
      condition.values.some((candidate) => sameValue(candidate, item))
    );
  }

  // An unset value must not satisfy a condition, not even one listing "".
  if (value === undefined || value === null || value === "") return false;

  return condition.values.some((candidate) => sameValue(candidate, value));
}

/** Visibility: `visibleWhen` when present, else the static `visible` flag. */
export function isFieldVisible(field, values = {}) {
  if (field?.visibleWhen) {
    return matchesCondition(field.visibleWhen, values[field.visibleWhen.field]);
  }

  return field?.visible !== false;
}

export function isFieldRequired(field, values = {}) {
  if (!isFieldVisible(field, values)) return false;

  if (field?.required) return true;

  if (field?.requiredWhen) {
    return matchesCondition(field.requiredWhen, values[field.requiredWhen.field]);
  }

  return false;
}

/** The fields to render right now, in the order the backend asked for. */
export function getVisibleFields(fields = [], values = {}) {
  return fields
    .filter((field) => isFieldVisible(field, values))
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** Sections, in first-appearance order, with their visible fields attached. */
export function getSections(fields = [], values = {}) {
  const sections = [];
  const index = new Map();

  getVisibleFields(fields, values).forEach((field) => {
    const key = field.section ?? "";

    if (!index.has(key)) {
      index.set(key, { title: field.section ?? "", fields: [] });
      sections.push(index.get(key));
    }

    index.get(key).fields.push(field);
  });

  return sections;
}

/** The empty value for a field type — never `""` for an array or a boolean. */
export function emptyValueFor(field) {
  if (ARRAY_TYPES.includes(field?.type)) return [];

  if (field?.type === "checkbox") return false;

  return "";
}

export function createInitialValues(fields = []) {
  return fields.reduce((values, field) => {
    values[field.name] =
      field.defaultValue !== undefined && field.defaultValue !== null
        ? field.defaultValue
        : emptyValueFor(field);

    return values;
  }, {});
}

export function pruneHiddenValues(fields = [], values = {}) {
  let changed = false;

  const next = { ...values };

  fields.forEach((field) => {
    if (isFieldVisible(field, values)) return;

    const empty = emptyValueFor(field);

    const current = next[field.name];

    const alreadyEmpty = Array.isArray(current)
      ? current.length === 0
      : current === empty || current === "" || current === undefined;

    if (alreadyEmpty) return;

    next[field.name] = empty;

    changed = true;
  });

  return changed ? next : values;
}

const isBlank = (value) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

export function validateFields(fields = [], values = {}, satisfied = null) {
  const errors = {};

  getVisibleFields(fields, values).forEach((field) => {
    const value = values[field.name];

    const required = isFieldRequired(field, values);

    if (required && field.type === "checkbox") {
      if (value !== true) errors[field.name] = "يجب تفعيل هذا الخيار";

      return;
    }

    if (field.type === LOCATION_TYPE) {
      /* A half-filled or out-of-range pair is rejected whether or not the field
         is required: sending one coordinate would store a point nobody chose. */
      const point = locationValue(value);

      if (point) return;

      if (required || !isBlank(value)) {
        errors[field.name] = "حدد الموقع على الخريطة أو أدخل الإحداثيات كاملة";
      }

      return;
    }

    if (required && isBlank(value)) {
      if (satisfied?.has(field.name)) return;

      errors[field.name] = "هذا الحقل مطلوب";

      return;
    }

    if (isBlank(value)) return;

    if (typeof value === "string") {
      if (field.minLength && value.trim().length < field.minLength) {
        errors[field.name] = `أقل عدد للأحرف ${field.minLength}`;

        return;
      }

      if (field.maxLength && value.length > field.maxLength) {
        errors[field.name] = `أقصى عدد للأحرف ${field.maxLength}`;

        return;
      }

      if (field.pattern && !new RegExp(field.pattern).test(value)) {
        errors[field.name] = field.patternMessage || "صيغة غير صحيحة";

        return;
      }
    }

    if (field.type === "number") {
      const numeric = Number(value);

      if (Number.isNaN(numeric)) {
        errors[field.name] = "أدخل رقمًا صحيحًا";

        return;
      }

      if (field.minValue !== undefined && numeric < field.minValue) {
        errors[field.name] = `أقل قيمة ${field.minValue}`;

        return;
      }

      if (field.maxValue !== undefined && numeric > field.maxValue) {
        errors[field.name] = `أقصى قيمة ${field.maxValue}`;

        return;
      }
    }

    if (field.type === "multiselect" && Array.isArray(value)) {
      if (field.minItems && value.length < field.minItems) {
        errors[field.name] = `اختر ${field.minItems} على الأقل`;

        return;
      }

      if (field.maxSelections && value.length > field.maxSelections) {
        errors[field.name] = `أقصى عدد للاختيارات ${field.maxSelections}`;

        return;
      }
    }

    if (FILE_TYPES.includes(field.type) && Array.isArray(value)) {
      if (field.maxFiles && value.length > field.maxFiles) {
        errors[field.name] = `أقصى عدد للملفات ${field.maxFiles}`;

        return;
      }

      const tooBig = field.maxSizeMb
        ? value.find((file) => file.size > field.maxSizeMb * 1024 * 1024)
        : null;

      if (tooBig) {
        errors[field.name] = `أقصى حجم للملف ${field.maxSizeMb} ميجابايت`;

        return;
      }

      const extensions = field.allowedExtensions;

      if (Array.isArray(extensions) && extensions.length) {
        const allowed = extensions.map((item) =>
          String(item).replace(/^\./, "").toLowerCase()
        );

        const rejected = value.find((file) => {
          const ext = String(file.name ?? "").split(".").pop()?.toLowerCase();

          return !ext || !allowed.includes(ext);
        });

        if (rejected) errors[field.name] = "صيغة الملف غير مدعومة";
      }
    }
  });

  return errors;
}

const IDENTITY_KEYS = { categoryId: "CategoryId", subCategoryId: "SubCategoryId" };

export function ensureSubmissionIdentity(formData, context = null) {
  if (!formData || !context) return formData;

  Object.entries(IDENTITY_KEYS).forEach(([source, key]) => {
    const value = context[source];

    if (value === undefined || value === null) return;

    // Already sent — either as a real field, or by `buildFormData` itself.
    if (formData.has(key)) return;

    formData.append(key, String(value));
  });

  return formData;
}

export function buildFormData(fields = [], values = {}, context = null) {
  const formData = new FormData();

  const endpoint = context?.endpoint;

  const fieldNames = new Set(
    fields.map((field) => submissionKey(field.name, endpoint))
  );

  if (context) {
    Object.entries(IDENTITY_KEYS).forEach(([source, key]) => {
      const value = context[source];

      if (value === undefined || value === null) return;

      // A config that publishes its own identity field owns that key.
      if (fieldNames.has(key)) return;

      formData.append(key, String(value));
    });
  }

  getVisibleFields(fields, values).forEach((field) => {
    const value = values[field.name];

    if (isBlank(value)) return;

    const key = submissionKey(field.name, endpoint);

    /* One field, two keys. `Location` itself is bound by no endpoint — the
       contract declares `Latitude` and `Longitude`, and the config says so in
       `writesFields`, so that is what is sent. */
    if (field.type === LOCATION_TYPE) {
      const point = locationValue(value);

      if (!point) return;

      const { latitudeKey, longitudeKey } = locationTargets(field);

      formData.append(submissionKey(latitudeKey, endpoint), String(point.latitude));

      formData.append(
        submissionKey(longitudeKey, endpoint),
        String(point.longitude)
      );

      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null || item === "") return;

        formData.append(key, item instanceof File ? item : String(item));
      });

      return;
    }

    if (value instanceof File) {
      formData.append(key, value);

      return;
    }

    if (typeof value === "boolean") {
      formData.append(key, value ? "true" : "false");

      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

function pickEntityValue(entity, field) {
  const key = field.name.charAt(0).toLowerCase() + field.name.slice(1);

  if (field.type === LOCATION_TYPE) {
    const { latitudeKey, longitudeKey } = locationTargets(field);

    const camel = (name) => name.charAt(0).toLowerCase() + name.slice(1);

    const point = locationValue({
      latitude: entity[camel(latitudeKey)],
      longitude: entity[camel(longitudeKey)],
    });

    return point ?? undefined;
  }

  if (entity[key] !== undefined) return entity[key];

  // A few payloads suffix the URL-bearing variant of a media field.
  for (const suffix of ["Url", "Urls", "Id", "Ids"]) {
    if (entity[key + suffix] !== undefined) return entity[key + suffix];
  }

  return undefined;
}

export function fieldsWithExistingMedia(fields = [], entity = null) {
  const satisfied = new Set();

  if (!entity) return satisfied;

  fields.forEach((field) => {
    if (!FILE_TYPES.includes(field.type)) return;

    const raw = pickEntityValue(entity, field);

    const hasMedia = Array.isArray(raw)
      ? raw.length > 0
      : typeof raw === "string"
        ? raw.trim() !== ""
        : raw !== undefined && raw !== null;

    if (hasMedia) satisfied.add(field.name);
  });

  return satisfied;
}

export function entityToFormValues(fields = [], entity = null) {
  const values = createInitialValues(fields);

  if (!entity) return values;

  const pick = (field) => pickEntityValue(entity, field);

  fields.forEach((field) => {
    if (FILE_TYPES.includes(field.type)) return;

    const raw = pick(field);

    if (raw === undefined || raw === null) return;

    if (field.type === "multiselect") {
      values[field.name] = Array.isArray(raw) ? raw.map(optionValueOf) : [];

      return;
    }

    /* `pickEntityValue` already rebuilt the coordinate pair. It is an object,
       so it has to be taken before the lookup-row branch below, which would
       otherwise reduce it to a single option value. */
    if (field.type === LOCATION_TYPE) {
      values[field.name] = raw;

      return;
    }

    if (raw !== null && typeof raw === "object") {
      // A single lookup returned whole rather than as its value.
      values[field.name] = optionValueOf(raw);

      return;
    }

    values[field.name] = raw;
  });

  // A branch whose parent no longer selects it must not arrive pre-filled.
  return pruneHiddenValues(fields, values);
}

export const UPDATE_AS_JSON = new Set(["/api/ads"]);

/** The field an update binds to drop images the record already holds. */
export const REMOVE_IMAGES_FIELD = "RemoveImageIds";

export function removableImagesOf(item) {
  if (!Array.isArray(item?.images)) return [];

  return item.images.filter((image) => image && image.id);
}

function configDeclaresImageRemoval(formData, readConfig) {
  const names = (formData?.fields ?? []).map((field) => field?.name);

  if (names.includes(REMOVE_IMAGES_FIELD)) return true;

  const update = readConfig?.operations?.update ?? readConfig?.update ?? null;

  const published = [
    ...(update?.fields ?? []),
    ...(update?.formParameters ?? []),
    ...(update?.queryParameters ?? []),
  ].map((entry) => (typeof entry === "string" ? entry : entry?.name));

  return published.includes(REMOVE_IMAGES_FIELD);
}

export function supportsImageRemoval({ formData, readConfig, item, endpoint }) {
  if (updatesAsJson(endpoint)) return false;

  if (configDeclaresImageRemoval(formData, readConfig)) return true;

  return removableImagesOf(item).length > 0;
}

/** Does this module's update take a JSON body? */
export function updatesAsJson(endpoint) {
  return UPDATE_AS_JSON.has(endpoint);
}

export function buildJsonBody(fields = [], values = {}, context = null) {
  const body = {};

  const endpoint = context?.endpoint;

  const camel = (name) => name.charAt(0).toLowerCase() + name.slice(1);

  const fieldNames = new Set(
    fields.map((field) => camel(submissionKey(field.name, endpoint)))
  );

  if (context) {
    Object.entries(IDENTITY_KEYS).forEach(([source, key]) => {
      const value = context[source];

      if (value === undefined || value === null) return;

      if (fieldNames.has(camel(key))) return;

      body[camel(key)] = Number(value);
    });
  }

  getVisibleFields(fields, values).forEach((field) => {
    if (FILE_TYPES.includes(field.type)) return;

    const value = values[field.name];

    if (isBlank(value)) return;

    const key = camel(submissionKey(field.name, endpoint));

    // Two keys, for the reason documented in `buildFormData`.
    if (field.type === LOCATION_TYPE) {
      const point = locationValue(value);

      if (!point) return;

      const { latitudeKey, longitudeKey } = locationTargets(field);

      body[camel(submissionKey(latitudeKey, endpoint))] = point.latitude;

      body[camel(submissionKey(longitudeKey, endpoint))] = point.longitude;

      return;
    }

    if (Array.isArray(value)) {
      body[key] = value.filter(
        (item) => item !== undefined && item !== null && item !== ""
      );

      return;
    }

    if (field.type === "number" || field.type === "range") {
      const numeric = Number(value);

      body[key] = Number.isNaN(numeric) ? value : numeric;

      return;
    }

    body[key] = value;
  });

  return body;
}

/** Readable multipart dump, for debugging and verification. */
export function describeFormData(formData) {
  const entries = [];

  for (const [key, value] of formData.entries()) {
    entries.push([
      key,
      value instanceof File ? `File(${value.name}, ${value.size}b)` : value,
    ]);
  }

  return entries;
}
