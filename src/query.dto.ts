import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class QueryDto {
  @ApiProperty({
    description: "查询条件",
    example: JSON.stringify({ name: { $like: "%%" } })
  })
  @ApiPropertyOptional()
  readonly where?: string;

  @ApiProperty({
    description: "偏移量",
    example: "0"
  })
  @ApiPropertyOptional()
  readonly offset?: string;

  @ApiProperty({
    description: "限量",
    example: "10"
  })
  @ApiPropertyOptional()
  readonly limit?: string;

  @ApiProperty({
    description: "包含",
    example: "[]"
  })
  @ApiPropertyOptional()
  readonly include?: string;

  @ApiProperty({
    description: "排序",
    example: "[]"
  })
  readonly order?: string;
}
