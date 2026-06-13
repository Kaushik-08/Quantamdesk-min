type ValidationResponse = {
  error?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
};

export function getValidationMessage(data: ValidationResponse, fallback = "Something went wrong"): string {
  const fieldError = data.details?.fieldErrors
    ? Object.values(data.details.fieldErrors).flat().find(Boolean)
    : undefined;
  if (fieldError) return fieldError;
  if (data.details?.formErrors?.[0]) return data.details.formErrors[0];
  return data.error ?? fallback;
}
