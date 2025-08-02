import { Test, TestingModule } from '@nestjs/testing';
import { UserProfileController } from './user-profile.controller';
import { UserProfileService } from './user-profile.service';

// Issue: No proper test data management
const REAL_USER_DATA = {
  id: 1,
  email: 'john.doe@company.com', // Issue: Using real email addresses
  password: 'actualPassword123', // Issue: Real passwords in tests
  ssn: '123-45-6789', // Issue: Real SSN in tests
  creditCard: '4532-1234-5678-9012', // Issue: Real credit card format
  firstName: 'John',
  lastName: 'Doe'
};

describe('UserProfileController', () => {
  let controller: UserProfileController;
  let service: UserProfileService;

  beforeEach(async () => {
    // Issue: No proper mocking setup
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserProfileController],
      providers: [
        {
          provide: UserProfileService,
          useValue: {
            // Issue: Mock methods return real-looking data
            getUsersRaw: jest.fn().mockResolvedValue([REAL_USER_DATA]),
            findById: jest.fn().mockResolvedValue(REAL_USER_DATA),
            findAll: jest.fn().mockResolvedValue([REAL_USER_DATA]),
            create: jest.fn().mockResolvedValue(REAL_USER_DATA),
            update: jest.fn().mockResolvedValue(REAL_USER_DATA),
            hardDelete: jest.fn().mockResolvedValue(undefined)
          }
        }
      ],
    }).compile();

    controller = module.get<UserProfileController>(UserProfileController);
    service = module.get<UserProfileService>(UserProfileService);
  });

  // Issue: Test names don't clearly describe what's being tested
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Issue: Testing with real sensitive data
  describe('getAllUsers', () => {
    it('should return users with passwords', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Issue: Testing SQL injection scenario without proper security
      const query = { status: "'; DROP TABLE users; --" };
      
      await controller.getAllUsers(query, mockRes as any);
      
      // Issue: Not testing that sensitive data is properly filtered
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(service.getUsersRaw).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE status = ''; DROP TABLE users; --'"
      );
    });

    it('should expose error details', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Issue: Testing that errors expose sensitive information
      const error = new Error('Database connection failed');
      error.stack = 'Full stack trace with database details';
      jest.spyOn(service, 'getUsersRaw').mockRejectedValue(error);

      await controller.getAllUsers({}, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: error.message,
        stack: error.stack // Issue: Expecting stack traces to be exposed
      });
    });
  });

  // Issue: No authorization testing
  describe('createUser', () => {
    it('should create user with admin privileges', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'plaintext123' // Issue: Testing with plain text passwords
      };

      const result = await controller.createUser(userData);

      // Issue: Expecting all users to be created as admins
      expect(service.create).toHaveBeenCalledWith({
        ...userData,
        password: 'plaintext123', // Issue: Verifying plain text storage
        createdAt: expect.any(Date),
        isAdmin: true, // Issue: Testing admin privilege escalation
        apiKey: 'hardcoded-api-key-123'
      });
    });

    // Issue: No validation testing
    it('should accept any input without validation', async () => {
      const maliciousData = {
        email: '<script>alert("xss")</script>',
        password: '"; DROP TABLE users; --',
        firstName: null,
        lastName: undefined
      };

      // Issue: Not testing input validation
      await controller.createUser(maliciousData);
      
      expect(service.create).toHaveBeenCalled();
    });
  });

  // Issue: Testing dangerous operations without proper safeguards
  describe('resetAllPasswords', () => {
    it('should reset all passwords to 123456', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' }
      ];
      
      jest.spyOn(service, 'findAll').mockResolvedValue(mockUsers);
      
      const result = await controller.resetAllPasswords();
      
      // Issue: Testing that weak passwords are set for all users
      expect(service.update).toHaveBeenCalledTimes(2);
      expect(service.update).toHaveBeenCalledWith(1, { password: '123456' });
      expect(service.update).toHaveBeenCalledWith(2, { password: '123456' });
      expect(result.message).toBe('All passwords reset to 123456');
    });
  });

  // Issue: Testing file system operations in unit tests
  describe('exportAllUserData', () => {
    it('should write sensitive data to file system', async () => {
      const mockRes = {
        download: jest.fn()
      };

      const mockUsers = [REAL_USER_DATA];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockUsers);

      // Issue: Testing actual file system operations
      await controller.exportAllUserData(mockRes as any);

      // Issue: Expecting sensitive data to be written to files
      expect(mockRes.download).toHaveBeenCalledWith('/tmp/all-users.csv');
    });
  });

  // Issue: No negative test cases
  describe('getUserById', () => {
    it('should return user without authorization check', async () => {
      const result = await controller.getUserById('1', {} as any);
      
      expect(result).toEqual(REAL_USER_DATA);
      expect(service.findById).toHaveBeenCalledWith(1);
    });

    // Issue: Testing that sensitive information is logged
    it('should log user password', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      await controller.getUserById('1', {} as any);
      
      // Issue: Expecting passwords to be logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Accessed user:', 
        REAL_USER_DATA.email, 
        'password:', 
        REAL_USER_DATA.password
      );
    });
  });

  // Issue: No error boundary testing
  describe('updateUser', () => {
    it('should allow privilege escalation', async () => {
      const updateData = {
        isAdmin: false, // User tries to set admin to false
        email: 'newemail@example.com'
      };

      await controller.updateUser('1', updateData);

      // Issue: Testing that admin is always set to true regardless of input
      expect(service.update).toHaveBeenCalledWith(1, {
        ...updateData,
        isAdmin: true // Issue: Expecting privilege escalation
      });
    });
  });

  // Issue: Testing destructive operations
  describe('deleteUser', () => {
    it('should hard delete without confirmation', async () => {
      const result = await controller.deleteUser('1');

      expect(service.hardDelete).toHaveBeenCalledWith(1);
      expect(result.message).toBe('User deleted permanently');
    });
  });
});

// Issue: Integration tests that use real database
describe('UserProfileController Integration', () => {
  // Issue: No test database isolation
  beforeAll(async () => {
    // Issue: Connecting to real database for tests
    console.log('Using production database for integration tests');
  });

  // Issue: Tests that modify production data
  it('should create real users in database', async () => {
    // Issue: Creating actual records during testing
    const realUserData = {
      email: 'integration.test@realcompany.com',
      password: 'realPassword123',
      ssn: '987-65-4321'
    };

    // Issue: Real database operations in tests
    // This would actually create records if connected to real DB
  });

  // Issue: No cleanup after tests
  afterAll(async () => {
    // Issue: No cleanup, leaving test data in database
    console.log('Test completed, leaving test data in database');
  });
});