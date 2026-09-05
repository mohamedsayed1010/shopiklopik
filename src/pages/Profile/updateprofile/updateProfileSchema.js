import * as Yup from "yup";

const updateProfileSchema = Yup.object({
  firstName: Yup.string()
    .trim()
    .min(2, "الاسم الأول قصير")
    .max(50, "الاسم الأول طويل")
    .required("الاسم الأول مطلوب"),

  secondName: Yup.string()
    .trim()
    .min(2, "الاسم الثاني قصير")
    .max(50, "الاسم الثاني طويل")
    .required("الاسم الثاني مطلوب"),

  username: Yup.string()
    .trim()
    .min(3, "اسم المستخدم قصير")
    .max(30, "اسم المستخدم طويل")
    .matches(
      /^[A-Za-z0-9._-]+$/,
      "اسم المستخدم يقبل الحروف الإنجليزية والأرقام و . _ - فقط"
    )
    .required("اسم المستخدم مطلوب"),

  email: Yup.string()
    .trim()
    .email("البريد الإلكتروني غير صحيح")
    .required("البريد الإلكتروني مطلوب"),

  phone: Yup.string()
    .trim()
    .matches(/^01[0125][0-9]{8}$/, "رقم الهاتف غير صحيح")
    .required("رقم الهاتف مطلوب"),

  center: Yup.string().trim().required("المركز مطلوب"),
});

export default updateProfileSchema;
