import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_CONFIG } from './swagger.config';
//import * as basicAuth from 'express-basic-auth';

export function createDocument(app: INestApplication, docsPrefix: string, user: string, password: string): OpenAPIObject {
  // app.use(`${docsPrefix}*`,
  //   basicAuth({
  //     challenge: true,
  //     users: {
  //       [user]: password
  //     }
  //   })
  // );
  const builder = new DocumentBuilder()
    .setTitle(SWAGGER_CONFIG.title)
    .setDescription(SWAGGER_CONFIG.description)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in the controller!
    )
    .setVersion(SWAGGER_CONFIG.version)
    .setLicense(SWAGGER_CONFIG.licenseName, SWAGGER_CONFIG.licenseURL)
    .setTermsOfService(SWAGGER_CONFIG.termsOfService)
    .setContact(SWAGGER_CONFIG.contactName, SWAGGER_CONFIG.contactURL, SWAGGER_CONFIG.contactEmail);
  const options = builder.build();
  return SwaggerModule.createDocument(app, options);
}
