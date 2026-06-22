# 鸡尾酒数据库项目 API 接口设计文档

## 1. 文档说明

本文档定义鸡尾酒数据库项目一期 API 接口设计，覆盖以下范围：

- 前台公开端接口
- 前台业务端接口
- 后台管理端接口
- 鉴权与权限约定
- 通用返回结构

本文档面向后端开发、前端联调和后续接口实现。

## 2. 接口设计原则

### 2.1 基本约定

- 接口风格：RESTful
- 数据格式：`application/json`
- 字符编码：`utf-8`
- 时间格式：`YYYY-MM-DD HH:mm:ss`
- 文件上传：`multipart/form-data`

### 2.2 路径规划建议

- 前台公开端：`/api/v1/public/*`
- 前台业务端：`/api/v1/app/*`
- 后台管理端：`/api/v1/admin/*`

### 2.3 页面入口与 API 映射说明

- 公开菜单页面入口为 `/` 或 `/menu`，直接调用 `/api/v1/public/*` 接口。
- 业务前台页面入口为 `/app/login`，登录后访问 `/app/*` 页面，并统一调用 `/api/v1/app/*` 接口。
- 后台管理页面入口为 `/admin/*`，统一调用 `/api/v1/admin/*` 接口。
- 一期不提供顾客在线下单入口，“服务员点单”在接口层统一对应待制作任务相关接口。

### 2.4 鉴权方式建议

- 一期建议使用 `JWT` 或基于 Token 的登录态。
- 登录成功后返回 `access_token`。
- 需要登录的接口通过请求头传递：

`Authorization: Bearer <token>`

## 3. 通用响应结构

## 3.1 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

## 3.2 失败响应

```json
{
  "code": 4001,
  "message": "参数错误",
  "data": null
}
```

## 3.3 分页响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total": 100,
      "total_pages": 10
    }
  }
}
```

## 4. 通用状态码建议

| code | 含义 |
| --- | --- |
| `0` | 成功 |
| `4001` | 参数错误 |
| `4003` | 未登录或 token 无效 |
| `4004` | 无权限访问 |
| `4040` | 数据不存在 |
| `4090` | 数据冲突 |
| `5000` | 服务器内部错误 |

## 5. 权限模型建议

| 角色 | 前台公开端 | 前台业务端 | 后台管理端 |
| --- | --- | --- | --- |
| `guest` | 可访问 | 不可访问 | 不可访问 |
| `staff` | 可访问 | 可访问 | 不可访问 |
| `admin` | 可访问 | 可访问 | 可访问 |
| `customer` | 一期预留，当前无独立入口 | 一期预留，当前不可访问 | 不可访问 |

说明：

- 前台业务端一期仅允许 `staff` 和 `admin` 登录。
- 后台管理端一期仅允许 `admin` 登录。
- 公开菜单入口始终可由未登录访客直接访问。

## 6. 前台公开端接口

## 6.1 获取鸡尾酒列表

- 方法：`GET`
- 路径：`/api/v1/public/cocktails`

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | int | 否 | 页码，默认 `1` |
| `page_size` | int | 否 | 每页数量，默认 `10` |
| `keyword` | string | 否 | 按名称搜索 |
| `category_id` | int | 否 | 分类 ID |
| `tag_id` | int | 否 | 标签 ID |
| `sort` | string | 否 | 排序字段，默认 `sort_order` |
| `order` | string | 否 | 排序方向：`asc` / `desc` |

### 返回字段

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 鸡尾酒 ID |
| `name_zh` | string | 中文名 |
| `name_en` | string | 英文名 |
| `short_description` | string | 简短描述 |
| `cover_image_url` | string | 封面图 |
| `base_spirit` | string | 基酒类型 |
| `taste_profile` | string | 口感说明 |
| `tags` | array | 标签列表 |

### 返回示例

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 1,
        "name_zh": "莫吉托",
        "name_en": "Mojito",
        "short_description": "清爽薄荷风味朗姆鸡尾酒",
        "cover_image_url": "/uploads/cocktails/mojito-cover.jpg",
        "base_spirit": "Rum",
        "taste_profile": "清爽、微甜、带酸",
        "tags": [
          { "id": 1, "name": "清爽", "color": "#38BDF8" }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

## 6.2 获取鸡尾酒详情

- 方法：`GET`
- 路径：`/api/v1/public/cocktails/{id}`

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | int | 是 | 鸡尾酒 ID |

### 返回字段

- 鸡尾酒基础信息
- 分类列表
- 标签列表
- 配方列表
- 图片列表

## 6.3 获取分类列表

- 方法：`GET`
- 路径：`/api/v1/public/categories`

### 返回字段

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 分类 ID |
| `name` | string | 分类名称 |
| `slug` | string | 标识 |
| `sort_order` | int | 排序值 |

## 6.4 获取标签列表

- 方法：`GET`
- 路径：`/api/v1/public/tags`

## 7. 前台业务端接口

说明：

- 前台业务端页面统一从 `/app/login` 进入，登录成功后再访问 `/app/*` 页面。
- 本章节中的“点单”语义统一指“新增待制作任务”，不表示顾客在线订单系统。

## 7.1 登录

- 方法：`POST`
- 路径：`/api/v1/app/auth/login`
- 权限：公开

### 请求参数

```json
{
  "username": "staff01",
  "password": "123456"
}
```

### 返回字段

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "access_token": "token_value",
    "token_type": "Bearer",
    "expires_in": 7200,
    "user": {
      "id": 2,
      "username": "staff01",
      "display_name": "服务员A",
      "role": {
        "id": 2,
        "code": "staff",
        "name": "服务员"
      }
    }
  }
}
```

## 7.2 获取当前登录用户信息

- 方法：`GET`
- 路径：`/api/v1/app/auth/me`
- 权限：`staff` / `admin`

## 7.3 退出登录

- 方法：`POST`
- 路径：`/api/v1/app/auth/logout`
- 权限：`staff` / `admin`

说明：
如果采用纯 JWT 无状态方案，此接口可仅由前端删除 token；若服务端维护黑名单或会话，也建议保留此接口。

## 7.4 获取业务端鸡尾酒列表

- 方法：`GET`
- 路径：`/api/v1/app/cocktails`
- 权限：`staff` / `admin`

说明：

- 用于前台业务人员快速搜索鸡尾酒。
- 可返回简化信息，供“加入待制作”使用。
- “加入待制作”即业务上的服务员点单入口之一。

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keyword` | string | 否 | 名称搜索 |
| `page` | int | 否 | 页码 |
| `page_size` | int | 否 | 每页数量 |

## 7.5 获取业务端鸡尾酒详情 / 配方

- 方法：`GET`
- 路径：`/api/v1/app/cocktails/{id}`
- 权限：`staff` / `admin`

### 返回重点字段

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 鸡尾酒 ID |
| `name_zh` | string | 中文名 |
| `name_en` | string | 英文名 |
| `recipe_items` | array | 配方明细 |
| `method` | string | 制作方法 |
| `garnish` | string | 装饰说明 |
| `glass_type` | string | 杯型 |

## 7.6 获取待制作任务列表

- 方法：`GET`
- 路径：`/api/v1/app/production-tasks`
- 权限：`staff` / `admin`

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | int | 否 | 页码 |
| `page_size` | int | 否 | 每页数量 |
| `status` | string | 否 | `pending` / `in_progress` / `completed` |
| `keyword` | string | 否 | 任务编号或鸡尾酒名称 |
| `created_by_user_id` | int | 否 | 创建人筛选 |

### 返回字段

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 任务 ID |
| `task_no` | string | 任务编号 |
| `cocktail_id` | int | 鸡尾酒 ID |
| `cocktail_name_snapshot` | string | 鸡尾酒名称 |
| `quantity` | int | 数量 |
| `remark` | string | 备注 |
| `status` | string | 状态 |
| `priority` | int | 优先级 |
| `created_by` | object | 创建人 |
| `assigned_to` | object | 指派人 |
| `created_at` | string | 创建时间 |
| `completed_at` | string | 完成时间 |

## 7.7 获取待制作任务详情

- 方法：`GET`
- 路径：`/api/v1/app/production-tasks/{id}`
- 权限：`staff` / `admin`

### 返回内容

- 任务基础信息
- 鸡尾酒基础信息
- 配方摘要
- 操作日志

## 7.8 新增待制作任务

- 方法：`POST`
- 路径：`/api/v1/app/production-tasks`
- 权限：`staff` / `admin`

说明：

- 该接口就是一期文档中“服务员点单”的标准落点。
- 接口命名继续沿用 `production-tasks`，不引入新的 `orders` 资源。

### 请求参数

```json
{
  "cocktail_id": 1,
  "quantity": 2,
  "remark": "少冰，优先制作",
  "priority": 1,
  "assigned_to_user_id": 2
}
```

### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cocktail_id` | int | 是 | 鸡尾酒 ID |
| `quantity` | int | 是 | 数量，最小为 `1` |
| `remark` | string | 否 | 备注 |
| `priority` | int | 否 | 优先级，默认 `3` |
| `assigned_to_user_id` | int | 否 | 指派人 |

## 7.9 修改待制作任务

- 方法：`PUT`
- 路径：`/api/v1/app/production-tasks/{id}`
- 权限：`staff` / `admin`

说明：

- 仅允许修改未完成任务。
- 建议可修改字段：`quantity`、`remark`、`priority`、`assigned_to_user_id`

### 请求示例

```json
{
  "quantity": 3,
  "remark": "去糖浆",
  "priority": 2
}
```

## 7.10 更新待制作任务状态

- 方法：`PATCH`
- 路径：`/api/v1/app/production-tasks/{id}/status`
- 权限：`staff` / `admin`

### 请求参数

```json
{
  "status": "completed",
  "action_note": "已完成出杯"
}
```

### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | string | 是 | `pending` / `in_progress` / `completed` |
| `action_note` | string | 否 | 操作备注 |

### 业务规则建议

- `pending -> in_progress` 允许
- `pending -> completed` 允许
- `in_progress -> completed` 允许
- `completed -> pending` 默认不允许

## 7.11 获取待制作任务日志

- 方法：`GET`
- 路径：`/api/v1/app/production-tasks/{id}/logs`
- 权限：`staff` / `admin`

## 8. 后台管理端接口

## 8.1 后台登录

- 方法：`POST`
- 路径：`/api/v1/admin/auth/login`
- 权限：公开

说明：

- 仅允许 `admin` 角色登录成功。
- `staff` 访问后台登录接口时应返回无权限错误。

## 8.2 获取后台当前用户信息

- 方法：`GET`
- 路径：`/api/v1/admin/auth/me`
- 权限：`admin`

## 8.3 后台退出登录

- 方法：`POST`
- 路径：`/api/v1/admin/auth/logout`
- 权限：`admin`

## 8.4 鸡尾酒管理接口

### 8.4.1 获取鸡尾酒列表

- 方法：`GET`
- 路径：`/api/v1/admin/cocktails`
- 权限：`admin`

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | int | 否 | 页码 |
| `page_size` | int | 否 | 每页数量 |
| `keyword` | string | 否 | 名称搜索 |
| `category_id` | int | 否 | 分类 ID |
| `publish_status` | string | 否 | 发布状态 |
| `is_visible` | int | 否 | 是否可见 |

### 8.4.2 获取鸡尾酒详情

- 方法：`GET`
- 路径：`/api/v1/admin/cocktails/{id}`
- 权限：`admin`

### 8.4.3 新增鸡尾酒

- 方法：`POST`
- 路径：`/api/v1/admin/cocktails`
- 权限：`admin`

### 请求参数示例

```json
{
  "name_zh": "莫吉托",
  "name_en": "Mojito",
  "slug": "mojito",
  "short_description": "清爽薄荷风味朗姆鸡尾酒",
  "description": "经典古巴鸡尾酒",
  "base_spirit": "Rum",
  "abv_note": "中等",
  "glass_type": "Highball",
  "taste_profile": "清爽、微甜、带酸",
  "garnish": "薄荷叶、青柠角",
  "method": "加冰后搅拌并加苏打水",
  "scene": "夏日、聚会",
  "cover_image_url": "/uploads/cocktails/mojito-cover.jpg",
  "publish_status": "published",
  "is_visible": 1,
  "sort_order": 1,
  "category_ids": [1, 2],
  "tag_ids": [1, 4],
  "recipe_items": [
    {
      "ingredient_id": 2,
      "amount": 45,
      "unit": "ml",
      "note": "",
      "sort_order": 1
    }
  ]
}
```

### 8.4.4 修改鸡尾酒

- 方法：`PUT`
- 路径：`/api/v1/admin/cocktails/{id}`
- 权限：`admin`

### 8.4.5 删除鸡尾酒

- 方法：`DELETE`
- 路径：`/api/v1/admin/cocktails/{id}`
- 权限：`admin`

说明：

- 删除前建议检查是否已被待制作任务引用。

## 8.5 分类管理接口

### 接口列表

- `GET /api/v1/admin/categories`
- `GET /api/v1/admin/categories/{id}`
- `POST /api/v1/admin/categories`
- `PUT /api/v1/admin/categories/{id}`
- `DELETE /api/v1/admin/categories/{id}`

### 分类新增 / 修改请求字段

```json
{
  "name": "经典鸡尾酒",
  "slug": "classic-cocktails",
  "description": "经典配方与常见酒单",
  "is_enabled": 1,
  "sort_order": 1
}
```

## 8.6 标签管理接口

### 接口列表

- `GET /api/v1/admin/tags`
- `GET /api/v1/admin/tags/{id}`
- `POST /api/v1/admin/tags`
- `PUT /api/v1/admin/tags/{id}`
- `DELETE /api/v1/admin/tags/{id}`

### 标签新增 / 修改请求字段

```json
{
  "name": "清爽",
  "slug": "fresh",
  "color": "#38BDF8",
  "is_enabled": 1,
  "sort_order": 1
}
```

## 8.7 原料管理接口

### 接口列表

- `GET /api/v1/admin/ingredients`
- `GET /api/v1/admin/ingredients/{id}`
- `POST /api/v1/admin/ingredients`
- `PUT /api/v1/admin/ingredients/{id}`
- `DELETE /api/v1/admin/ingredients/{id}`

### 原料新增 / 修改请求字段

```json
{
  "name": "Gin",
  "category": "base_spirit",
  "description": "杜松子风味烈酒",
  "abv": 40.0,
  "is_enabled": 1,
  "sort_order": 1
}
```

## 8.8 图片上传接口

## 8.8.1 上传鸡尾酒图片

- 方法：`POST`
- 路径：`/api/v1/admin/uploads/images`
- 权限：`admin`
- 类型：`multipart/form-data`

### 表单参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | file | 是 | 图片文件 |
| `module` | string | 否 | 模块名，如 `cocktails` |

### 返回示例

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "url": "/uploads/cocktails/20260617/abc123.jpg",
    "filename": "abc123.jpg",
    "size": 345678
  }
}
```

## 8.8.2 删除图片

- 方法：`DELETE`
- 路径：`/api/v1/admin/cocktail-images/{id}`
- 权限：`admin`

## 8.9 用户管理接口

### 8.9.1 获取用户列表

- 方法：`GET`
- 路径：`/api/v1/admin/users`
- 权限：`admin`

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | int | 否 | 页码 |
| `page_size` | int | 否 | 每页数量 |
| `keyword` | string | 否 | 用户名或昵称搜索 |
| `role_code` | string | 否 | `admin` / `staff` / `customer` |
| `status` | string | 否 | `active` / `disabled` |

### 8.9.2 获取用户详情

- 方法：`GET`
- 路径：`/api/v1/admin/users/{id}`
- 权限：`admin`

### 8.9.3 新增用户

- 方法：`POST`
- 路径：`/api/v1/admin/users`
- 权限：`admin`

### 请求示例

```json
{
  "username": "staff01",
  "password": "123456",
  "display_name": "服务员A",
  "phone": "13800000000",
  "email": "",
  "role_id": 2,
  "status": "active"
}
```

### 8.9.4 修改用户

- 方法：`PUT`
- 路径：`/api/v1/admin/users/{id}`
- 权限：`admin`

说明：

- 修改时密码可选传。
- 若不传密码，则保持原密码不变。

### 8.9.5 删除用户

- 方法：`DELETE`
- 路径：`/api/v1/admin/users/{id}`
- 权限：`admin`

说明：

- 建议逻辑删除或仅禁用，不建议物理删除历史业务用户。

## 8.10 后台待制作任务管理接口

### 接口列表

- `GET /api/v1/admin/production-tasks`
- `GET /api/v1/admin/production-tasks/{id}`
- `PATCH /api/v1/admin/production-tasks/{id}/status`
- `GET /api/v1/admin/production-tasks/{id}/logs`

### 管理用途

- 查看全部任务
- 按状态、创建人、时间范围筛选
- 协助调整状态
- 查看完整流转日志

## 9. 关键字段对象定义建议

## 9.1 标签对象

```json
{
  "id": 1,
  "name": "清爽",
  "color": "#38BDF8"
}
```

## 9.2 分类对象

```json
{
  "id": 1,
  "name": "经典鸡尾酒",
  "slug": "classic-cocktails"
}
```

## 9.3 配方对象

```json
{
  "id": 1,
  "ingredient_id": 2,
  "ingredient_name": "Rum",
  "amount": 45,
  "unit": "ml",
  "note": "",
  "sort_order": 1
}
```

## 9.4 用户摘要对象

```json
{
  "id": 2,
  "username": "staff01",
  "display_name": "服务员A",
  "role_code": "staff"
}
```

## 9.5 待制作任务对象

```json
{
  "id": 10,
  "task_no": "PT202606170001",
  "cocktail_id": 1,
  "cocktail_name_snapshot": "莫吉托",
  "quantity": 2,
  "remark": "少冰",
  "status": "pending",
  "priority": 1,
  "created_by": {
    "id": 2,
    "display_name": "服务员A"
  },
  "assigned_to": {
    "id": 3,
    "display_name": "服务员B"
  },
  "created_at": "2026-06-17 10:00:00",
  "completed_at": null
}
```

## 10. 参数校验建议

## 10.1 登录类接口

- `username` 必填
- `password` 必填

## 10.2 鸡尾酒管理

- `name_zh` 必填
- `publish_status` 必须为允许值
- `category_ids` 至少一个
- `recipe_items` 至少一条后才允许发布

## 10.3 待制作任务

- `cocktail_id` 必填
- `quantity` 必须大于等于 `1`
- `status` 仅允许规定流转

## 11. 一期不做但建议预留的接口方向

- 客户注册 / 登录
- 收藏鸡尾酒
- 客户下单
- 用户消息通知
- 图片批量上传

## 12. 总结

这套 API 设计已经覆盖了一期的核心业务闭环：

- 公开前台浏览鸡尾酒
- 业务前台登录、看配方、服务员点单（创建待制作任务）、改任务状态
- 后台管理鸡尾酒内容、原料、用户和任务

如果下一步继续推进，建议优先做以下其中一项：

- 生成 Swagger / OpenAPI 规范草稿
- 生成后端项目目录结构建议
- 直接初始化前后端项目骨架
