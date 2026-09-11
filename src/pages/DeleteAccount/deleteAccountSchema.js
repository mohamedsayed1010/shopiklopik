import * as Yup from "yup";

export const REASON_MAX_LENGTH = 500;

const deleteAccountSchema = Yup.object({
  confirm: Yup.boolean().oneOf([true], "أكّد أنك تريد حذف حسابك للمتابعة"),

  password: Yup.string().required("أدخل كلمة المرور الحالية لتأكيد هويتك"),

  reason: Yup.string()
    .trim()
    .max(
      REASON_MAX_LENGTH,
      `سبب الحذف يجب ألا يتجاوز ${REASON_MAX_LENGTH} حرف`
    ),
});

export default deleteAccountSchema;
