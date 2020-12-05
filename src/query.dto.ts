import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { WhereOptions } from "sequelize";

export class QueryDto {
  @ApiProperty({
    description: "查询条件",
    example: {}
  })
  @ApiPropertyOptional()
  readonly where?: WhereOptions;

  @ApiProperty({
    description: "偏移量",
    example: "0"
  })
  @ApiPropertyOptional()
  readonly offset?: number;

  @ApiProperty({
    description: "限量",
    example: "10"
  })
  @ApiPropertyOptional()
  readonly limit?: number;

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
