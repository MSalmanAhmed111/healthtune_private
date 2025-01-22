import { SuccessResponseMessages } from '@messages';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function SwaggerApiResponse(description: string, bodyDto?: any, paramDto?: any, queryDto?: any) {
  return applyDecorators(
    ApiOperation({ summary: description }),
    ApiResponse({ status: 201, description: SuccessResponseMessages.successGeneral }),
    ...(bodyDto ? [ApiBody({ type: bodyDto })] : []),
    ...(paramDto ? [ApiParam({ name: 'param', type: paramDto })] : []),
    ...(queryDto ? [ApiQuery({ type: queryDto })] : []),
  );
}
