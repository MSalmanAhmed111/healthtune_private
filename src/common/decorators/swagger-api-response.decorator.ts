import { SuccessResponseMessages } from '@messages';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function SwaggerApiResponse(description: string) {
  return applyDecorators(
    ApiOperation({ summary: description }),
    ApiResponse({ status: 201, description: SuccessResponseMessages.successGeneral }),
  );
}
