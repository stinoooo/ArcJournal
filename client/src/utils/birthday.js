import { format, parseISO } from 'date-fns';

/**
 * Returns true if today is the user's birthday
 * Compares only month and day, ignoring year and timezone
 */
export function isTodayBirthday(dateOfBirth) {
  if (!dateOfBirth) return false;
  const today = new Date();
  const dob = parseISO(dateOfBirth);
  return today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate();
}

/**
 * Returns true if a given YYYY-MM-DD string is the user's birthday (any year)
 */
export function isDateBirthday(dateStr, dateOfBirth) {
  if (!dateOfBirth || !dateStr) return false;
  const dob = parseISO(dateOfBirth);
  const date = parseISO(dateStr);
  return date.getMonth() === dob.getMonth() && date.getDate() === dob.getDate();
}

/**
 * Returns the user's birthday date string in the current month's year
 * e.g. "2025-07-14" if birthday is July 14
 */
export function birthdayDateInYear(dateOfBirth, year) {
  if (!dateOfBirth) return null;
  const dob = parseISO(dateOfBirth);
  const targetYear = year ?? new Date().getFullYear();
  const month = String(dob.getMonth() + 1).padStart(2, '0');
  const day = String(dob.getDate()).padStart(2, '0');
  return `${targetYear}-${month}-${day}`;
}

/**
 * Returns a time-aware greeting string
 */
export function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Returns the display name to use for a user
 */
export function getUserDisplayName(user) {
  if (!user) return '';
  return user.displayName?.trim() || user.username || '';
}

/**
 * Returns the user's age based on dateOfBirth
 */
export function getUserAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = parseISO(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age;
}
