export interface ApplicantData {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  about: string;
}

const STORAGE_KEY_APPLICANTS = 'cleanr_applicants';

export const saveApplicant = (data: ApplicantData): boolean => {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY_APPLICANTS);
    const applicants = existingStr ? JSON.parse(existingStr) : [];
    
    const newApplicant = {
      id: Date.now().toString(),
      submittedAt: new Date().toISOString(),
      ...data
    };
    
    applicants.push(newApplicant);
    localStorage.setItem(STORAGE_KEY_APPLICANTS, JSON.stringify(applicants));
    return true;
  } catch (error) {
    console.error("Failed to save applicant", error);
    return false;
  }
};