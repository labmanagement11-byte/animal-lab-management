export function calculateAge(dateOfBirth: string | Date | null): string {
  if (!dateOfBirth) return 'N/A';
  
  const birthDate = new Date(dateOfBirth);
  const currentDate = new Date();
  
  if (isNaN(birthDate.getTime())) return 'N/A';
  
  const diffTime = currentDate.getTime() - birthDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Not born yet';
  
  // Handle days < 7
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
  
  // Calculate total months using calendar math
  let totalMonths = (currentDate.getFullYear() - birthDate.getFullYear()) * 12 + 
                   (currentDate.getMonth() - birthDate.getMonth());
  
  // Adjust if current day is before birth day in the month
  if (currentDate.getDate() < birthDate.getDate()) {
    totalMonths--;
  }
  
  // Calculate remaining days after full months
  const monthsToAdd = totalMonths;
  const dateAfterMonths = new Date(birthDate);
  dateAfterMonths.setMonth(dateAfterMonths.getMonth() + monthsToAdd);
  
  const remainingTime = currentDate.getTime() - dateAfterMonths.getTime();
  const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
  const remainingWeeks = Math.floor(remainingDays / 7);
  
  if (totalMonths < 1) {
    const totalWeeks = Math.floor(diffDays / 7);
    return `${totalWeeks} week${totalWeeks !== 1 ? 's' : ''}`;
  } else if (totalMonths < 12) {
    if (remainingWeeks > 0) {
      return `${totalMonths} month${totalMonths !== 1 ? 's' : ''}, ${remainingWeeks} week${remainingWeeks !== 1 ? 's' : ''}`;
    } else {
      return `${totalMonths} month${totalMonths !== 1 ? 's' : ''}`;
    }
  } else {
    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths - (years * 12);
    if (remainingMonths > 0) {
      return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
  }
}

export function formatDate(date: string | Date | null): string {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'N/A';
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}