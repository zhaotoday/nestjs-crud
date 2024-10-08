import {
  Body,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { CrudQueryDto } from "./crud-query.dto";
import { PlaceholderDto } from "./placeholder.dto";
import { ApiOperation } from "@nestjs/swagger";
import { CrudOrderAction } from "./crud-order-action.enum";
import { Op } from "sequelize";
import { CrudBulkDestroyDto } from "./crud-bulk-destroy.dto";
import { JwtRequest } from "./types/jwt-request";

function getInclude(that, include) {
  return include?.[0]
    ? include.map((item) => ({
        ...item,
        model: that.include[item.model],
        include: item.include ? getInclude(that, item.include) : [],
      }))
    : [];
}

export class CrudController {
  public include;

  public attributes;

  public hasOrder: boolean;

  public filteredByUser: boolean;

  constructor(private readonly repository) {}

  @ApiOperation({
    summary: "获取列表",
  })
  @Get()
  async findAll(
    @Req() req: JwtRequest,
    @Query() query: CrudQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const { attributes, include, order, ...restQuery } = query;

    if (this.filteredByUser) {
      if (restQuery.where) {
        restQuery.where.userId = req?.user?.id || null;
      } else {
        restQuery.where = {
          userId: req?.user?.id || null,
        };
      }
    }

    res.json({
      data: {
        total: await this.repository.count(restQuery),
        items: await this.repository.findAll({
          ...restQuery,
          attributes: attributes || this.attributes,
          include: getInclude(this, include),
          order: order && order[0] ? order : [["createdAt", "DESC"]],
        }),
      },
    });
  }

  @ApiOperation({
    summary: "获取详情",
  })
  @Get(":id")
  async findByPk(
    @Param("id") id: number,
    @Query() query: CrudQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const { attributes, include } = query;
    const ret = await this.repository.findByPk(id, {
      attributes: attributes || this.attributes,
      include: getInclude(this, include),
    });

    if (ret) {
      res.json({ data: ret });
    } else {
      res.status(HttpStatus.NOT_FOUND).json();
    }
  }

  @ApiOperation({
    summary: "新增",
  })
  @Post()
  async create(
    @Req() req: JwtRequest,
    @Query() query: CrudQueryDto,
    @Body() body: PlaceholderDto,
    @Res() res: Response,
  ): Promise<void> {
    const { where } = query;

    if (this.filteredByUser) {
      body.userId = req?.user?.id || null;
    }

    if (this.hasOrder) {
      const findAllRes = await this.repository.findAll({
        where: where || null,
        order: [["order", "DESC"]],
        limit: 1,
      });

      body.order = findAllRes && findAllRes[0] ? findAllRes[0].order + 1 : 1;
    }
    res.json({ data: await this.repository.create(body) });
  }

  @ApiOperation({
    summary: "编辑",
  })
  @Put(":id")
  async update(
    @Param("id") id: number,
    @Body() body: PlaceholderDto,
    @Res() res: Response,
  ): Promise<void> {
    const findByPkRes = await this.repository.findByPk(id);

    if (findByPkRes) {
      Object.keys(body).forEach((key) => {
        findByPkRes[key] = body[key];
      });

      await findByPkRes.save();

      res.json();
    } else {
      res.status(HttpStatus.NOT_FOUND).json();
    }
  }

  @ApiOperation({
    summary: "删除",
  })
  @Delete(":id")
  async destroy(@Param("id") id: number, @Res() res: Response): Promise<void> {
    if (await this.repository.destroy({ where: { id } })) {
      res.json();
    } else {
      res.status(HttpStatus.NOT_FOUND).json();
    }
  }

  @ApiOperation({
    summary: "排序",
  })
  @Post(":id/actions/order")
  async order(
    @Param("id") id: number,
    @Query() query: CrudQueryDto,
    @Body() body: PlaceholderDto,
    @Res() res: Response,
  ) {
    const { where } = query;
    const { action, order } = body;
    const findByPkRes = await this.repository.findByPk(id);
    const findPrevRes = await this.repository.findAll({
      where: Object.assign(where, {
        order: { [Op.gt]: findByPkRes.order },
      }),
      order: [["order", "ASC"]],
      limit: 1,
    });
    const findNextRes = await this.repository.findAll({
      where: Object.assign(where, {
        order: { [Op.lt]: findByPkRes.order },
      }),
      order: [["order", "DESC"]],
      limit: 1,
    });

    switch (action) {
      case CrudOrderAction.TO_PREV:
        if (findPrevRes[0]) {
          await this.repository.update(
            { order: findPrevRes[0].order },
            { where: { id } },
          );

          await this.repository.update(
            { order: findByPkRes.order },
            { where: { id: findPrevRes[0].id } },
          );
        }
        break;

      case CrudOrderAction.TO_NEXT:
        if (findNextRes[0]) {
          await this.repository.update(
            { order: findNextRes[0].order },
            { where: { id } },
          );

          await this.repository.update(
            { order: findByPkRes.order },
            { where: { id: findNextRes[0].id } },
          );
        }
        break;

      case CrudOrderAction.UPDATE:
        await this.repository.update({ order }, { where: { id } });
        break;

      default:
        break;
    }

    res.json();
  }

  @ApiOperation({
    summary: "批量删除",
  })
  @Post("actions/bulkDestroy")
  async bulkDestroy(@Body() body: CrudBulkDestroyDto, @Res() res: Response) {
    const destroyRes = await this.repository.destroy({
      where: {
        id: { [Op.in]: body.ids },
      },
    });

    if (destroyRes) {
      res.json();
    } else {
      res.status(HttpStatus.NOT_FOUND).json();
    }
  }
}
