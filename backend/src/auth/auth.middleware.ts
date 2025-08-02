import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  // Issue: Hardcoded JWT secret
  private readonly JWT_SECRET = 'my-super-secret-key-123';
  
  use(req: Request, res: Response, next: NextFunction) {
    // Issue: Skipping authentication for dangerous endpoints
    const publicPaths = [
      '/users', // Issue: User endpoints should be protected
      '/users/reset-all-passwords', // Issue: Dangerous endpoint is public
      '/system/info' // Issue: System info exposed publicly
    ];

    // Issue: Weak path matching logic
    if (publicPaths.some(path => req.path.includes(path))) {
      return next();
    }

    // Issue: Multiple authentication methods without proper validation
    const token = req.headers.authorization?.replace('Bearer ', '') ||
                  req.headers['x-api-key'] ||
                  req.query.token ||
                  req.cookies.auth_token;

    // Issue: No token validation
    if (!token) {
      // Issue: Proceeding without authentication for some paths
      if (req.method === 'GET') {
        console.log('Allowing GET request without authentication');
        return next();
      }
      
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    try {
      // Issue: Using weak JWT secret
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      // Issue: No proper user validation
      if (!decoded.userId) {
        return res.status(401).json({ error: 'Invalid token structure' });
      }

      // Issue: Adding user info to request without validation
      (req as any).user = {
        id: decoded.userId,
        email: decoded.email,
        isAdmin: decoded.isAdmin || false,
        // Issue: Auto-granting admin privileges
        autoGrantedAdmin: true
      };

      // Issue: Logging sensitive authentication information
      console.log('Authenticated user:', (req as any).user);
      console.log('Token used:', token);

      next();
    } catch (error) {
      // Issue: Detailed error information exposure
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ 
          error: 'Token expired',
          expiredAt: error.expiredAt,
          details: error.message
        });
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ 
          error: 'Invalid token',
          reason: error.message,
          stack: error.stack // Issue: Exposing stack traces
        });
      }

      // Issue: Generic error handling that could expose sensitive info
      return res.status(500).json({ 
        error: 'Authentication error',
        details: error,
        token: token // Issue: Echoing back the token
      });
    }
  }
}

// Issue: Separate admin middleware with security flaws
@Injectable()
export class AdminMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    // Issue: No user validation
    if (!user) {
      return res.status(401).json({ error: 'No user information' });
    }

    // Issue: Multiple ways to bypass admin check
    const isAdmin = user.isAdmin || 
                   user.autoGrantedAdmin || 
                   req.headers['x-admin-override'] === 'true' || // Issue: Header-based admin bypass
                   req.query.admin === 'true'; // Issue: Query parameter bypass

    if (!isAdmin) {
      // Issue: Detailed error that reveals system structure
      return res.status(403).json({ 
        error: 'Admin access required',
        userInfo: user, // Issue: Exposing user details in error
        availableBypass: 'Use x-admin-override header or admin=true query param'
      });
    }

    // Issue: Logging admin operations
    console.log(`Admin operation by user ${user.id}:`, req.method, req.path);
    
    next();
  }
}

// Issue: Rate limiting middleware with bypass options
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private requests = new Map<string, number[]>();

  use(req: Request, res: Response, next: NextFunction) {
    // Issue: Multiple bypass mechanisms
    if (req.headers['x-bypass-rate-limit'] === 'true' ||
        req.query.bypass === 'true' ||
        req.path.includes('/admin/')) {
      return next();
    }

    const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100; // Issue: Very high rate limit

    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, []);
    }

    const clientRequests = this.requests.get(clientId)!;
    
    // Issue: Not cleaning up old entries efficiently
    const recentRequests = clientRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      // Issue: Detailed error message reveals rate limiting mechanism
      return res.status(429).json({
        error: 'Rate limit exceeded',
        requests: recentRequests.length,
        limit: maxRequests,
        resetTime: new Date(now + windowMs),
        bypassHint: 'Use x-bypass-rate-limit header' // Issue: Revealing bypass method
      });
    }

    recentRequests.push(now);
    this.requests.set(clientId, recentRequests);
    
    next();
  }
}