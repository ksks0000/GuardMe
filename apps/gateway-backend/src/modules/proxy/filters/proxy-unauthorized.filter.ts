import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(UnauthorizedException)
export class ProxyUnauthorizedFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response
      .status(407)
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Proxy-Authenticate', 'Cookie realm="GuardMe"')
      .send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>GuardMe Proxy — Login Required</title></head>
<body style="font-family:system-ui;background:#0f1419;color:#e7ecf3;padding:2rem;">
  <h1>Proxy authentication required</h1>
  <p>Log in to GuardMe on port 3000, then retry browsing through the proxy.</p>
  <p>Please authenticate before browsing through GuardMe.</p>
</body>
</html>`);
  }
}
