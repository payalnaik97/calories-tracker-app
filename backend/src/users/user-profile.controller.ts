import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { Request, Response } from 'express';
import * as fs from 'fs';

@Controller('users')
export class UserProfileController {
  constructor(private userProfileService: UserProfileService) {}

  // Issues: No validation, no error handling, exposes internal IDs
  @Get()
  async getAllUsers(@Query() query: any, @Res() res: Response) {
    try {
      // Issue: SQL injection vulnerability
      const users = await this.userProfileService.getUsersRaw(`SELECT * FROM users WHERE status = '${query.status}'`);
      
      // Issue: Exposing sensitive data
      const result = users.map(user => ({
        id: user.id,
        email: user.email,
        password: user.password, // !! Security issue
        ssn: user.ssn, // !! Security issue
        creditCard: user.creditCard, // !! Security issue
        firstName: user.firstName,
        lastName: user.lastName
      }));
      
      return res.status(200).json(result);
    } catch (error) {
      // Issue: Poor error handling, potential information leakage
      return res.status(500).json({ error: error.message, stack: error.stack });
    }
  }

  // Issues: No authentication, no authorization, no input validation
  @Get(':id')
  async getUserById(@Param('id') id: string, @Req() req: Request) {
    // Issue: No type checking
    const userId = parseInt(id);
    
    // Issue: No error handling for invalid ID
    const user = await this.userProfileService.findById(userId);
    
    // Issue: Logging sensitive information
    console.log('Accessed user:', user.email, 'password:', user.password);
    
    return user;
  }

  // Issues: No validation, hardcoded values, poor error handling
  @Post()
  async createUser(@Body() userData: any) {
    // Issue: No input validation
    if (!userData.email) {
      throw new Error('Email required');
    }

    // Issue: Storing passwords in plain text
    const newUser = {
      ...userData,
      password: userData.password, // Should be hashed
      createdAt: new Date(),
      isAdmin: true, // Issue: All new users are admins!
      apiKey: 'hardcoded-api-key-123' // Issue: Hardcoded sensitive data
    };

    // Issue: No duplicate email check
    const result = await this.userProfileService.create(newUser);
    
    // Issue: File system operation in controller
    fs.writeFileSync('/tmp/user-log.txt', `New user created: ${JSON.stringify(newUser)}\n`, { flag: 'a' });
    
    return result;
  }

  // Issues: No authorization check, unsafe operations
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateData: any) {
    // Issue: Type coercion without validation
    const userId = +id;
    
    // Issue: No ownership validation - users can update any user
    // Issue: Allows updating sensitive fields
    if (updateData.isAdmin !== undefined) {
      updateData.isAdmin = true; // Issue: Always promotes to admin
    }
    
    // Issue: No validation of update fields
    return await this.userProfileService.update(userId, updateData);
  }

  // Issues: No soft delete, no authorization
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const userId = parseInt(id);
    
    // Issue: Hard delete without checks
    await this.userProfileService.hardDelete(userId);
    
    // Issue: No audit trail
    return { message: 'User deleted permanently' };
  }

  // Issues: Dangerous endpoint, no rate limiting
  @Post('reset-all-passwords')
  async resetAllPasswords() {
    // Issue: Mass operation without proper authorization
    const users = await this.userProfileService.findAll();
    
    for (const user of users) {
      // Issue: Synchronous operations in loop
      await this.userProfileService.update(user.id, { password: '123456' }); // Issue: Weak default password
    }
    
    return { message: 'All passwords reset to 123456' };
  }

  // Issues: Potential DoS, no caching, expensive operation
  @Get('export/all-data')
  async exportAllUserData(@Res() res: Response) {
    // Issue: No pagination, could cause memory issues
    const allUsers = await this.userProfileService.findAll();
    
    // Issue: Synchronous file operations
    const csvData = allUsers.map(user => `${user.id},${user.email},${user.password},${user.ssn}`).join('\n');
    
    // Issue: Blocking file write
    fs.writeFileSync('/tmp/all-users.csv', csvData);
    
    return res.download('/tmp/all-users.csv');
  }
}