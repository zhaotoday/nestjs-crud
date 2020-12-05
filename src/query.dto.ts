import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Includeable, Order, WhereOptions } from "sequelize";

export class QueryDto {
  @ApiProperty({
    description: "查询条件",
    example: {}
  })
  @ApiPropertyOptional()
  where?: WhereOptions<any>;

  @ApiProperty({
    description: "包含",
    example: []
  })
  @ApiPropertyOptional()
  include?: Includeable[];

  @ApiProperty({
    description: "排序",
    example: []
  })
  order?: Order;

  @ApiProperty({
    description: "字段列表",
    example: []
  })
  attributes?: string[];

  @ApiProperty({
    description: "偏移量",
    example: 0
  })
  @ApiPropertyOptional()
  offset?: number;

  @ApiProperty({
    description: "限量",
    example: 10
  })
  @ApiPropertyOptional()
  limit?: number;
}
