import { z } from 'zod';

// Password validation: min 8 chars, 1 uppercase, 1 digit, 1 special char
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resumeSchema = z.object({
  title: z.string().min(1, 'Resume title is required'),
  content: z.object({
    personalInfo: z.object({
      fullName: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      location: z.string().optional(),
      summary: z.string().optional(),
    }),
    experience: z.array(z.object({
      jobTitle: z.string(),
      company: z.string(),
      duration: z.object({
        startDate: z.string(),
        endDate: z.string(),
        isCurrently: z.boolean(),
      }),
      location: z.string().optional(),
      description: z.string(),
    })),
    education: z.array(z.object({
      degree: z.string(),
      institution: z.string(),
      field: z.string(),
      graduationDate: z.string(),
      gpa: z.string().optional(),
    })),
    skills: z.array(z.string()),
    projects: z.array(z.object({
      title: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
      link: z.string().optional(),
    })),
  }),
});

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
