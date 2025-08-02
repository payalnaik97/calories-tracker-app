import { Injectable } from '@nestjs/common';
import * as mysql from 'mysql2';

@Injectable()
export class UserProfileService {
  private connection: any;

  constructor() {
    // Issue: Hardcoded database credentials
    this.connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin123', // Issue: Weak password in code
      database: 'calories_tracker'
    });
  }

  // Issue: Raw SQL queries, no prepared statements
  async getUsersRaw(query: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // Issue: Direct query execution with user input
      this.connection.query(query, (error: any, results: any) => {
        if (error) {
          console.log('Database error:', error); // Issue: Logging sensitive errors
          reject(error);
        }
        resolve(results);
      });
    });
  }

  async findById(id: number): Promise<any> {
    // Issue: No input validation
    const query = `SELECT * FROM users WHERE id = ${id}`; // Issue: SQL injection vulnerability
    
    return new Promise((resolve, reject) => {
      this.connection.query(query, (error: any, results: any) => {
        if (error) reject(error);
        
        // Issue: No null check
        resolve(results[0]);
      });
    });
  }

  async findAll(): Promise<any[]> {
    // Issue: No pagination, could return millions of records
    const query = 'SELECT * FROM users';
    
    return new Promise((resolve, reject) => {
      this.connection.query(query, (error: any, results: any) => {
        if (error) reject(error);
        resolve(results);
      });
    });
  }

  async create(userData: any): Promise<any> {
    // Issue: No data sanitization
    const query = `
      INSERT INTO users (email, password, firstName, lastName, ssn, creditCard, isAdmin, apiKey)
      VALUES ('${userData.email}', '${userData.password}', '${userData.firstName}', 
              '${userData.lastName}', '${userData.ssn}', '${userData.creditCard}', 
              ${userData.isAdmin}, '${userData.apiKey}')
    `; // Issue: SQL injection vulnerability
    
    return new Promise((resolve, reject) => {
      this.connection.query(query, (error: any, results: any) => {
        if (error) {
          // Issue: Exposing internal database errors
          throw new Error(`Database error: ${error.message}`);
        }
        resolve({ id: results.insertId, ...userData });
      });
    });
  }

  async update(id: number, updateData: any): Promise<any> {
    // Issue: Building SQL dynamically without validation
    let setClause = '';
    for (const [key, value] of Object.entries(updateData)) {
      setClause += `${key} = '${value}', `; // Issue: SQL injection vulnerability
    }
    setClause = setClause.slice(0, -2); // Remove last comma

    const query = `UPDATE users SET ${setClause} WHERE id = ${id}`;
    
    return new Promise((resolve, reject) => {
      this.connection.query(query, (error: any, results: any) => {
        if (error) reject(error);
        resolve(results);
      });
    });
  }

  async hardDelete(id: number): Promise<void> {
    // Issue: Hard delete without backup or soft delete option
    const query = `DELETE FROM users WHERE id = ${id}`;
    
    return new Promise((resolve, reject) => {
      this.connection.query(query, (error: any, results: any) => {
        if (error) reject(error);
        resolve();
      });
    });
  }

  // Issue: Method for admin operations without proper checks
  async makeAllUsersAdmin(): Promise<void> {
    const query = "UPDATE users SET isAdmin = true";
    
    return new Promise((resolve, reject) => {
      this.connection.query(query, (error: any, results: any) => {
        if (error) reject(error);
        resolve();
      });
    });
  }

  // Issue: Dangerous method that could crash the system
  async dropAllTables(): Promise<void> {
    const query = "DROP TABLE users";
    
    return new Promise((resolve, reject) => {
      this.connection.query(query, (error: any, results: any) => {
        if (error) reject(error);
        resolve();
      });
    });
  }

  // Issue: Method that reveals system information
  async getSystemInfo(): Promise<any> {
    const queries = [
      "SELECT VERSION() as mysql_version",
      "SELECT USER() as current_user",
      "SHOW DATABASES",
      "SELECT * FROM information_schema.tables"
    ];

    const results = [];
    for (const query of queries) {
      // Issue: Sequential database calls instead of parallel
      const result = await this.getUsersRaw(query);
      results.push(result);
    }
    
    return results;
  }
}