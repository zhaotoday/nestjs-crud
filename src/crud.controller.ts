import {
  Body,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res
} from "@nestjs/common";
import { Response } from "express";
import { QueryDto } from "./query.dto";
import { PlaceholderDto } from "./placeholder.dto";
import { ApiOperation } from "@nestjs/swagger";

export class CrudController {
  constructor(public repository: any) {}

  public include: Object;

  @Get()
  @ApiOperation({
    summary: "获取列表"
  })
  async findAll(@Query() query: QueryDto, @Res() res: Response): Promise<void> {
    res.json({
      data: {
        total: await this.repository.count(query),
        items: await this.repository.findAll({
          ...query,
          include: query.include && query.include[0]
            ? query.include.map(item => ({
              ...item,
              model: this.include[item.model]
            }))
            : []
        })
      }
    });
  }

  @Get(":id")
  @ApiOperation({
    summary: "获取详情"
  })
  async findByPk(
    @Param("id") id: string,
    @Query() query: QueryDto,
    @Res() res: Response
  ): Promise<void> {
    const ret = await this.repository.findByPk(id, {
      include: query.include && query.include[0]
        ? query.include.map(item => ({
          ...item,
          model: this.include[item.model]
        }))
        : []
    });

    if (ret) {
      res.json({ data: ret });
    } else {
      res.status(HttpStatus.NOT_FOUND).json();
    }
  }

  @Post()
  @ApiOperation({
    summary: "新增"
  })
  async create(
    @Body() body: PlaceholderDto,
    @Res() res: Response
  ): Promise<void> {
    res.json({ data: await this.repository.create(body) });
  }

  @Put(":id")
  @ApiOperation({
    summary: "编辑"
  })
  async update(
    @Param("id") id: string,
    @Body() body: PlaceholderDto,
    @Res() res: Response
  ): Promise<void> {
    const ret = await this.repository.update(body, { where: { id } });

    if (ret[0]) {
      res.json();
    } else {
      res.status(HttpStatus.NOT_FOUND).json();
    }
  }

  @Delete(":id")
  @ApiOperation({
    summary: "删除"
  })
  async destroy(@Param("id") id: string, @Res() res: Response): Promise<void> {
    const ret = await this.repository.destroy({ where: { id } });

    if (ret) {
      res.json();
    } else {
      res.status(HttpStatus.NOT_FOUND).json();
    }
  }
}
