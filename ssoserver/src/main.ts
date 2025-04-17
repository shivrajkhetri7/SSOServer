import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; // Add this import
import * as session from 'express-session';
import { AppModule } from './app.module';
import * as crypto from 'crypto';
import * as hbs from 'hbs';
import { ConfigService } from '@nestjs/config';
import { join } from 'path'; // Add this import

if (typeof global !== 'undefined' && !(global as any).crypto) {
  (global as any).crypto = crypto;
}

async function bootstrap() {
  // Change to NestExpressApplication
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Configure Handlebars as the view engine
  app.setBaseViewsDir(join(__dirname, '../src/views')); // Set views directory
  app.setViewEngine('hbs'); // Set view engine

  // Register partials if needed (optional)
  // hbs.registerPartials(join(__dirname, '..', 'views/partials'));

  // Enable CORS with proper configuration
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  // Session configuration
  app.use(
    session({
      secret: configService.get<string>('SESSION_SECRET') || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      }, 
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();