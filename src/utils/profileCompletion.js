/**
 * Whether an account carries the information this application requires of it —
 * the one place that question is answered, for every screen and every guard.
 *
 * There is no `profileComplete` property to read: neither `UserDto` nor
 * `ProfileDto` publishes one. The list below is not invented either — it is the
 * set the application already treats as mandatory, and the two definitions of
 * it agree:
 *
 *   - `POST /api/auth/register` with an empty body names them: first name,
 *     second name, email, username, phone, governorate, centre.
 *   - `useRegister`'s own schema requires exactly the same seven.
 *
 * `writable` records whether `PUT /api/profile` can set the field. Its contract
 * (see `api/profile/updateProfile.js`, and the multipart schema it mirrors)
 * publishes FirstName, SecondName, Phone, Email, Center, Username and
 * ProfileImage — and no Governorate. So governorate is required of an account
 * but cannot be written by this client; the edit form has always shown it
 * read-only, pointing at support.
 *
 * That distinction is the whole reason this file lists it rather than hiding
 * it: blocking the site on a field no control here can fill would be a door
 * with no handle. The backend pins governorate to "الفيوم" at registration and
 * is the only thing that can change it.
 */

const FIELDS = [
  { name: "firstName", label: "الاسم الأول", writable: true },
  { name: "secondName", label: "الاسم الثاني", writable: true },
  { name: "username", label: "اسم المستخدم", writable: true },
  { name: "email", label: "البريد الإلكتروني", writable: true },
  { name: "phone", label: "رقم الهاتف", writable: true },
  { name: "center", label: "المركز", writable: true },
  { name: "governorate", label: "المحافظة", writable: false },
];

/** Every field the application requires of an account. */
export const REQUIRED_PROFILE_FIELDS = FIELDS;

/** The subset the profile form can actually ask for and save. */
export const COMPLETABLE_PROFILE_FIELDS = FIELDS.filter(
  (field) => field.writable
);

function isFilled(value) {
  return typeof value === "string" ? value.trim() !== "" : value != null;
}

function missingFrom(fields, profile) {
  if (!profile || typeof profile !== "object") return fields;

  return fields.filter((field) => !isFilled(profile[field.name]));
}

/** Everything required that this record is still missing, in form order. */
export function missingProfileFields(profile) {
  return missingFrom(REQUIRED_PROFILE_FIELDS, profile);
}

/** Only what the reader can do something about — what the form asks for. */
export function missingCompletableFields(profile) {
  return missingFrom(COMPLETABLE_PROFILE_FIELDS, profile);
}

/**
 * Accepts a `ProfileDto` or the `UserDto` stored with the session — the two
 * spell these fields identically.
 *
 * Judged on the fields this client can fill, so an account is never held behind
 * a control that does not exist. Nothing is complete: an absent record is a
 * question that has not been answered yet, never a yes.
 */
export function isProfileComplete(profile) {
  if (!profile || typeof profile !== "object") return false;

  return missingCompletableFields(profile).length === 0;
}

export default isProfileComplete;
