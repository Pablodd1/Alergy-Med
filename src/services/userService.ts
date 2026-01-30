import { User, IUser } from '@/models/User';
import connectToDatabase from '@/lib/mongodb';
import { MockDatabase } from '@/lib/mock-database';
import { Types } from 'mongoose';

// Simple interface for mock users (without Mongoose Document methods)
interface IMockUser {
  _id: string;
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface CreateUserInput {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'user' | 'admin';
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export class UserService {
  static async createUser(input: CreateUserInput): Promise<IUser | IMockUser> {
    const conn = await connectToDatabase();

    if (!conn) {
      // Use mock database
      const existingUser = await MockDatabase.getUserByUsername(input.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const mockUser: IMockUser = {
        _id: `user_${Date.now()}`,
        username: input.username,
        password: input.password, // This should be hashed
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role || 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        comparePassword: async (candidatePassword: string) => candidatePassword === input.password
      };

      await MockDatabase.saveUser(mockUser);
      return mockUser;
    }

    // Use real MongoDB
    const existingUser = await User.findOne({ username: input.username });
    if (existingUser) {
      throw new Error('Username already exists');
    }

    if (input.email) {
      const existingEmail = await User.findOne({ email: input.email });
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    const user = new User(input);
    await user.save();
    return user;
  }

  static async findByUsername(username: string): Promise<IUser | IMockUser | null> {
    const conn = await connectToDatabase();

    if (!conn) {
      return MockDatabase.getUserByUsername(username);
    }

    return User.findOne({ username });
  }

  static async findById(id: string): Promise<IUser | IMockUser | null> {
    const conn = await connectToDatabase();

    if (!conn) {
      return MockDatabase.getUser(id);
    }

    return User.findById(id);
  }

  static async updateUser(id: string, updates: UpdateUserInput): Promise<IUser | IMockUser | null> {
    const conn = await connectToDatabase();

    if (!conn) {
      const user = await MockDatabase.getUser(id);
      if (!user) return null;

      Object.assign(user, updates, { updatedAt: new Date() });
      await MockDatabase.saveUser(user);
      return user;
    }

    return User.findByIdAndUpdate(id, updates, { new: true });
  }

  static async deleteUser(id: string): Promise<boolean> {
    const conn = await connectToDatabase();

    if (!conn) {
      const user = await MockDatabase.getUser(id);
      return !!user;
    }

    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  static async listUsers(page = 1, limit = 20): Promise<{ users: (IUser | IMockUser)[]; total: number }> {
    const conn = await connectToDatabase();

    if (!conn) {
      // Mock implementation - return all users
      const allUsers = Array.from(MockDatabase.users.values()) as IMockUser[];
      const start = (page - 1) * limit;
      const end = start + limit;
      return { users: allUsers.slice(start, end), total: allUsers.length };
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find({}).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments({})
    ]);

    return { users, total };
  }

  static async validatePassword(username: string, password: string): Promise<IUser | IMockUser | null> {
    const user = await this.findByUsername(username);
    if (!user || !user.isActive) {
      return null;
    }

    const isValid = await user.comparePassword(password);
    return isValid ? user : null;
  }
}