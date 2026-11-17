export function inferSemester(earliest: Date): string {
  const month = earliest.getMonth() + 1
  const year = earliest.getFullYear()
  if (month >= 8) return `${year}1`
  if (month <= 5) return `${year - 1}2`
  return `${year - 1}3`
}

export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
