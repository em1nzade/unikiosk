export function cleanRegistrationText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  return cleaned || null;
}

export function validateRegistrationInput(body: any) {
  const eventId = Number(body?.event_id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    throw new Error('Tədbir tapılmadı');
  }

  const fullName = cleanRegistrationText(body?.full_name, 120);
  if (!fullName || fullName.length < 3) {
    throw new Error('Ad Soyad ən azı 3 simvol olmalıdır');
  }

  const groupName = cleanRegistrationText(body?.group_name, 80);
  if (!groupName || groupName.length < 2) {
    throw new Error('Qrup ən azı 2 simvol olmalıdır');
  }

  return { eventId, fullName, groupName };
}
