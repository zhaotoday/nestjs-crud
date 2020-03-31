import { ApiOperation, ApiPropertyOptional } from "@nestjs/swagger";

export class PlaceholderDto {
  @ApiOperation({
    description: "排序",
    example: 2
  })
  @ApiPropertyOptional()
  order: number;
}
