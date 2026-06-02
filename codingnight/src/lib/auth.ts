import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Compare password
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Create JWT token
export function createToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
}

// Verify JWT token
export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Generate user ID
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get user from token
export function getUserFromToken(token: string): User | null {
  if (!token) return null;
  return verifyToken(token);
}

// Mock database for users (in production, use a real database)
const usersDatabase: Map<string, { id: string; name: string; email: string; password: string; createdAt: Date }> = new Map();

// Save user to mock database
export function saveUser(user: User & { password: string }): void {
  usersDatabase.set(user.id, {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    createdAt: user.createdAt,
  });
  // Also save to localStorage for browser persistence
  if (typeof window !== 'undefined') {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    users[user.email] = {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
    };
    localStorage.setItem('users', JSON.stringify(users));
  }
}

// Get user by email
export function getUserByEmail(email: string): (User & { password: string }) | null {
  for (const user of usersDatabase.values()) {
    if (user.email === email) {
      return user;
    }
  }
  
  // Check localStorage
  if (typeof window !== 'undefined') {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[email]) {
      return users[email];
    }
  }
  
  return null;
}

// Get user by ID
export function getUserById(id: string): (User & { password: string }) | null {
  const user = usersDatabase.get(id);
  if (user) return user;
  
  // Check localStorage
  if (typeof window !== 'undefined') {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    for (const u of Object.values(users) as any[]) {
      if (u.id === id) {
        return u;
      }
    }
  }
  
  return null;
}
