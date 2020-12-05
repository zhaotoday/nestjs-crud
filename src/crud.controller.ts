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
import { CrudQueryDto } from "./crud-query.dto";
import { PlaceholderDto } from "./placeholder.dto";
import { ApiOperation } from "@nestjs/swagger";
import { CrudOrderAction } from "./crud-order-action.enum";

function getInclude(include) {
  return include && include[0]
    ? include.map(item => ({
        ...item,
        model: this.include[item.model],
        include: item.include ? arguments.callee.call(this, include) : []
      }))
    : [];
}

export class CrudController {
  public include;

  public orderable: boolean = false;

  constructor(private readonly repository) {}

  private getInclude(include) {
    return include && include[0]
      ? include.map(item => ({
          ...item,
          model: this.include[item.model],
          include: item.include ? arguments.callee(include) : []
        }))
      : [];
  }

  @ApiOperation({ summary: "获取列表" })
  @Get()
  async findAll(
    @Query() query: CrudQueryDto,
    @Res() res: Response
  ): Promise<void> {
    const { attributes, include, order, ...restQuery } = query;

    res.json({
      data: {
        total: await this.repository.count(restQuery),
        items: await this.repository.findAll({
          ...restQuery,
          attributes,
          include: getInclude.call(this, include),
          order: order && order[0] ? order : [["id", "DESC"]]
        })
      }
    });
  }

  @ApiOperation({ summary: "获取详情" })
  @Get(":id")
  async findByPk(
    @Param("id") id: number,
    @Query() query: CrudQueryDto,
    @Res() res: Response
  ): Promise<void> {
    const { attributes, include } = query;
    const ret = await this.repository.findByPk(id, {
      attributes,
      include: getInclude.call(this, include)
    });

    if (ret) {
      res.json({ data: ret });
    } else {
      res.status(HttpStatus.NOT_FOUND).json();
    }
  }

  @ApiOperation({ summary: "新增" })
  @Post()
  async create(
    @Body() body: PlaceholderDto,
    @Res() res: Response
  ): Promise<void> {
    if (this.orderable) {
      const maxId = (await this.repository.max("id")) || 1;
      body.order = maxId + 1;
    }
    res.json({ data: await this.repository.create(body) });
  }

  @ApiOperation({ summary: "编辑" })
  @Put(":id")
  async update(
    @Param("id") id: number,
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

  @ApiOperation({ summary: "删除" })
  @Delete(":id")
  async destroy(@Param("id") id: number, @Res() res: Response): Promise<void> {
    if (await this.repository.destroy({ where: { id } })) {
      res.json();
    } else {
      res.status(HttpStatus.NOT_FOUND).json();
    }
  }

  @ApiOperation({ summary: "排序" })
  @Post(":id/actions/order")
  async order(
    @Param("id") id: number,
    @Query() query: CrudQueryDto,
    @Body() body: PlaceholderDto,
    @Res() res: Response
  ) {
    const { where } = query;
    const { action } = body;
    const findByPkRes = await this.repository.findByPk(id);
    const findPrevRes = await this.repository.findAll({
      where: Object.assign(where, {
        order: { $gt: findByPkRes.order }
      }),
      order: [["order", "ASC"]],
      limit: 1
    });

    const findNextRes = await this.repository.findAll({
      where: Object.assign(where, {
        order: { $lt: findByPkRes.order }
      }),
      order: [["order", "DESC"]],
      limit: 1
    });

    if (action === CrudOrderAction.ToPrev && findPrevRes[0]) {
      await this.repository.update(
        { order: findPrevRes[0].order },
        {
          where: { id }
        }
      );

      await this.repository.update(
        { order: findByPkRes.order },
        {
          where: { id: findPrevRes[0].id }
        }
      );
    } else if (action === CrudOrderAction.ToNext && findNextRes[0]) {
      await this.repository.update(
        { order: findNextRes[0].order },
        { where: { id } }
      );

      await this.repository.update(
        { order: findByPkRes.order },
        { where: { id: findNextRes[0].id } }
      );
    }

    res.json();
  }
}
