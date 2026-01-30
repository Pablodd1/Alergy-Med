import { IVisit } from '@/models/Visit';

// Simple user interface for mock database (without Mongoose Document methods)
export interface IMockUser {
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

// Simple in-memory storage for development/demo purposes
export class MockDatabase {
  static users = new Map<string, IMockUser>();
  static visits = new Map<string, IVisit>();

  static async connect(): Promise<void> {
    // Mock connection - no-op for now
    console.log('Connected to mock database');

    // Ensure default user exists
    if (!MockDatabase.users.has('demo-user-id')) {
      MockDatabase.users.set('demo-user-id', defaultUser);
    }
  }

  static async saveUser(user: IMockUser): Promise<void> {
    MockDatabase.users.set(user._id, user);
  }

  static async getUser(id: string): Promise<IMockUser | null> {
    return MockDatabase.users.get(id) || null;
  }

  static async getUserByUsername(username: string): Promise<IMockUser | null> {
    return Array.from(MockDatabase.users.values()).find(u => u.username === username) || null;
  }

  static async saveVisit(visit: IVisit): Promise<void> {
    MockDatabase.visits.set(visit._id.toString(), visit);
  }

  static async getVisit(id: string): Promise<IVisit | null> {
    return MockDatabase.visits.get(id) || null;
  }

  static async getVisitsByUserId(userId: string): Promise<IVisit[]> {
    return Array.from(MockDatabase.visits.values()).filter(v => v.userId === userId);
  }
}

// For demo purposes, create a default user
const defaultUser: IMockUser = {
  _id: 'demo-user-id',
  username: 'demo',
  password: '$2a$12$LQv3c1yqBWLHxk96U1eC6uO8OqWqQ2Yx4z3RZlZx5lZx5lZx5lZx5',
  email: 'demo@example.com',
  firstName: 'Demo',
  lastName: 'User',
  role: 'user',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  comparePassword: async () => true
};

MockDatabase.users.set(defaultUser._id, defaultUser);