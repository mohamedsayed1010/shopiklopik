
export const PAYMENT_FIELD_GROUPS = {
  phone: "phone",
  instaPay: "instaPay",
  bank: "bank",
};

const ALL_GROUPS = [
  PAYMENT_FIELD_GROUPS.phone,
  PAYMENT_FIELD_GROUPS.instaPay,
  PAYMENT_FIELD_GROUPS.bank,
];

/** Observed against the live API — see the note above. `99` needs no group. */
const GROUPS_BY_TYPE = {
  1: [PAYMENT_FIELD_GROUPS.phone],
  2: [PAYMENT_FIELD_GROUPS.instaPay],
  3: [PAYMENT_FIELD_GROUPS.bank],
  99: [],
};

export function fieldGroupsForType(type) {
  if (type === null || type === undefined || type === "") return [];

  const key = Number(type);

  return GROUPS_BY_TYPE[key] ?? ALL_GROUPS;
}

export function typeUsesGroup(type, group) {
  return fieldGroupsForType(type).includes(group);
}

/** A value worth rendering — the API returns `null` for every unused field. */
function present(value) {
  return typeof value === "string" ? value.trim() !== "" : value != null;
}

export function paymentDestinationRows(method) {
  if (!method) return [];

  const rows = [];

  if (present(method.phoneNumber)) {
    rows.push({
      key: "phoneNumber",
      label: "رقم المحفظة",
      value: method.phoneNumber,
      ltr: true,
      copyable: true,
    });
  }

  if (present(method.instaPayId)) {
    rows.push({
      key: "instaPayId",
      label: "معرّف إنستا باي",
      value: method.instaPayId,
      ltr: true,
      copyable: true,
    });
  }

  const bank = method.bank;

  if (bank) {
    if (present(bank.bankName)) {
      rows.push({ key: "bankName", label: "البنك", value: bank.bankName });
    }

    if (present(bank.accountHolderName)) {
      rows.push({
        key: "accountHolderName",
        label: "اسم صاحب الحساب",
        value: bank.accountHolderName,
      });
    }

    if (present(bank.accountNumber)) {
      rows.push({
        key: "accountNumber",
        label: "رقم الحساب",
        value: bank.accountNumber,
        ltr: true,
        copyable: true,
      });
    }

    if (present(bank.iban)) {
      rows.push({
        key: "iban",
        label: "IBAN",
        value: bank.iban,
        ltr: true,
        copyable: true,
      });
    }
  }

  return rows;
}

export function methodToFormValues(method) {
  return {
    name: method?.name ?? "",
    arabicName: method?.arabicName ?? "",
    type: method?.type ?? "",
    phoneNumber: method?.phoneNumber ?? "",
    instaPayIdentifier: method?.instaPayId ?? "",
    bankName: method?.bank?.bankName ?? "",
    accountHolderName: method?.bank?.accountHolderName ?? "",
    accountNumber: method?.bank?.accountNumber ?? "",
    iban: method?.bank?.iban ?? "",
    instructions: method?.instructions ?? "",
    isActive: method?.isActive ?? true,
    displayOrder: method?.displayOrder ?? 0,
  };
}

export function formValuesToRequest(values) {
  const groups = fieldGroupsForType(values.type);

  const pick = (group, value) => {
    if (!groups.includes(group)) return null;

    const text = typeof value === "string" ? value.trim() : value;

    return text === "" || text === undefined ? null : text;
  };

  const text = (value) => {
    const trimmed = typeof value === "string" ? value.trim() : value;

    return trimmed === "" || trimmed === undefined ? null : trimmed;
  };

  return {
    name: text(values.name),
    arabicName: text(values.arabicName),
    type: Number(values.type),
    phoneNumber: pick(PAYMENT_FIELD_GROUPS.phone, values.phoneNumber),
    instaPayIdentifier: pick(
      PAYMENT_FIELD_GROUPS.instaPay,
      values.instaPayIdentifier
    ),
    bankName: pick(PAYMENT_FIELD_GROUPS.bank, values.bankName),
    accountHolderName: pick(
      PAYMENT_FIELD_GROUPS.bank,
      values.accountHolderName
    ),
    accountNumber: pick(PAYMENT_FIELD_GROUPS.bank, values.accountNumber),
    iban: pick(PAYMENT_FIELD_GROUPS.bank, values.iban),
    instructions: text(values.instructions),
    isActive: Boolean(values.isActive),
    displayOrder: Number(values.displayOrder) || 0,
  };
}

const STATUS_TONES = {
  1: "bg-gold-50 text-gold-700 ring-gold-200",
  2: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  3: "bg-red-50 text-red-700 ring-red-200",
  4: "bg-orange-50 text-orange-700 ring-orange-200",
};

export function paymentStatusTone(status) {
  return STATUS_TONES[Number(status)] ?? "bg-canvas text-ink-soft ring-line-strong";
}

/** The three statuses the admin actions move a payment between. */
export const PAYMENT_STATUS = {
  pending: 1,
  approved: 2,
  rejected: 3,
  refunded: 4,
};

export function reasonLabelFor(status) {
  if (Number(status) === PAYMENT_STATUS.refunded) return "سبب الاسترداد";

  if (Number(status) === PAYMENT_STATUS.rejected) return "سبب الرفض";

  return "السبب";
}
