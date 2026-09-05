import * as Yup from "yup";

const STRONG_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

const changePasswordSchema = Yup.object({
  oldPassword: Yup.string().required("كلمة المرور الحالية مطلوبة"),

  newPassword: Yup.string()
    .required("كلمة المرور الجديدة مطلوبة")
    .matches(
      STRONG_PASSWORD,
      "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، وحرف كبير، وحرف صغير، ورقم، ورمز خاص."
    )
    .notOneOf(
      [Yup.ref("oldPassword")],
      "كلمة المرور الجديدة يجب أن تختلف عن الحالية"
    ),

  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "كلمتا المرور غير متطابقتين")
    .required("تأكيد كلمة المرور مطلوب"),
});

export default changePasswordSchema;
