import { Client, DatabaseObjectResponse, PageObjectResponse } from '@notionhq/client'
import axios from "axios";

class Notion {
  _token: string;
  _api_host: string;
  constructor(token: string) {
    this._token = token
    this._api_host = "https://api.notion.com/v1"
  }

  async _baseRequest(method: string, path: string, data?: {[index: string]: any}) {
    let res = await axios({
      method,
      url: (this._api_host+path),
      headers: {
        "Authorization": `Bearer ${this._token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2025-09-03",
      },
      data
    })

    return res.data
  }

  async get(path: string) {
    return this._baseRequest("GET", path)
  }

  async post(path: string, data = {}) {
    return this._baseRequest("POST", path, data)
  }
}

import { parse } from 'twemoji-parser';

export interface EntriesOpts {
  validate?: (database: DatabaseObjectResponse) => Promise<boolean>;
}

export interface SchemaRowOpts {
  transformer?: (params: {[index: string]: any}) => any,
  flag?: string;
  client?: Notion;
  schema?: SchemaRow[]
}

export type FieldSourceProp = "icon" | "cover" | "id" | "created_time" | "last_edited_time" | "parent" | "url" | "public_url"
export type SchemaField = ((source: FieldSourceProp, dest?: string, opts?: SchemaRowOpts) => SchemaRow)
export type SchemaPropField = ((source: string, dest?: string, opts?: SchemaRowOpts) => SchemaRow)
export type SchemaRow = ({dest: string, parser: SchemaParserDatabase, type: "database"}) | ({dest: string, parser: SchemaParserPage, type: "page"})
export type SchemaParserDatabase = ((database: DatabaseObjectResponse, passthru?: any) => Promise<any>)
export type SchemaParserPage = ((page: PageObjectResponse, passthru?: any) => Promise<any>)

export const Field: SchemaField = (source: FieldSourceProp, dest?: string, opts?: SchemaRowOpts) => {
  return {
    dest: (dest ?? source),
    parser: async (page: PageObjectResponse) => {
      if (page[source] == null) { return null }
      switch (source) {
        case "icon":
          switch (page[source].type) {
            case "custom_emoji":
              return page[source].custom_emoji.url
            case "external":
              return page[source].external.url
            case "emoji":
              return parse(page[source].emoji)[0].url.replace("/svg/", "/72x72/").replace(".svg", ".png")
            case "file":
              return page[source].file.url
          }
        break;
        default:
          return page[source]
      }
    },
    type: "page"
  }
}

let dummy_page: PageObjectResponse

const _super_cache: Map<string, any[]> = new Map()
var _idx: number = 0

async function parseNode(propNode: typeof dummy_page.properties[0], opts?: SchemaRowOpts): Promise<any> {
  switch (propNode.type) {
    case "title":
      return propNode.title.map(part => part.plain_text).join("")
    case "number":
      return propNode.number
    case "url":
      return propNode.url
    case "rich_text":
      return propNode.rich_text.map(part => part.plain_text).join("")
    case "date":
      switch (opts?.flag ?? "start") {
        case "start":
          return (propNode.date?.start ? new Date(propNode.date?.start) : null)
        case "end":
          return (propNode.date?.end ? new Date(propNode.date?.end) : null)
      }
    break;
    case "multi_select":
      return propNode.multi_select.map(entry => entry[(opts?.flag ?? "name") as "name" | "color"])
    case "select":
      return (propNode.select ? propNode.select[(opts?.flag ?? "name") as "name" | "color"] : null)
    case "status":
      return (propNode.status ? propNode.status[(opts?.flag ?? "name") as "name" | "color"] : null)
    case "files":
      return propNode.files.map(entry => {
        switch (entry.type) {
          case "external":
            return entry.external.url
          case "file":
            return entry.file.url
        }
      })
    case "formula":
      switch (propNode.formula.type) {
        case "string":
          return propNode.formula.string
        case "number":
          return propNode.formula.number
        case "boolean":
          return propNode.formula.boolean
        case "date":
          switch (opts?.flag ?? "start") {
            case "start":
              return (propNode.formula.date?.start ? new Date(propNode.formula.date?.start) : null)
            case "end":
              return (propNode.formula.date?.end ? new Date(propNode.formula.date?.end) : null)
          }
        break;
      }
    break;
    case "phone_number":
      return propNode.phone_number
    case "relation":
      let relationPageProms = propNode.relation.map(relation => opts?.client?.get("/pages/"+relation.id))

      let relationPages = []
      for await (const prom of relationPageProms) {
        let page = await prom
        // console.log(page)
        if (page) {
          relationPages.push(await applyPageSchema(page as PageObjectResponse, (opts?.schema ?? [])))
        }
      }

      if (opts?.flag == "single") {
        return relationPages[0]
      } else {
        return relationPages
      }
    break;
    case "rollup":
      switch (propNode.rollup.type) {
        case "number":
          return propNode.rollup.number
        case "array":
          let res: any[] = []

          let _super_idx = _idx + "_" + propNode.id
          // console.log("_super_idx: ", _super_idx)
          // console.log("HAS: ", _super_cache.has(_super_idx))

          if (_super_cache.has(_super_idx)) {
            res = (_super_cache.get(_super_idx) ?? [])
          } else {
            let resProms = []
            for await (const entry of (propNode.rollup.array as any[])) {
              resProms.push(await parseNode(entry, opts))
            }
            // console.log("resProms: ", resProms)
            

            for await (const prom of resProms) { res.push(await prom) }
            // console.log("res: ", res)

            _super_cache.set(_super_idx, res)
          }

          if (opts?.flag == "unmerge") {
            return res
          } else {
            return [].concat(...res)
          }
        case "date":
          switch (opts?.flag ?? "start") {
            case "start":
              return (propNode.rollup.date?.start ? new Date(propNode.rollup.date?.start) : null)
            case "end":
              return (propNode.rollup.date?.end ? new Date(propNode.rollup.date?.end) : null)
          }
        break;
      }
      break;
    case "people":
      return propNode.people.map(entry => entry.id)
    case "unique_id":
      return (propNode.unique_id.prefix ? `${propNode.unique_id.prefix}-${propNode.unique_id.number}` : propNode.unique_id.number)
    case "email":
      return propNode.email
    case "created_time":
      return new Date(propNode.created_time)
    case "created_by":
      return null //...
    case "last_edited_time":
      return new Date(propNode.last_edited_time)
    case "last_edited_by":
      return null //...
    case "checkbox":
      return propNode.checkbox
    default:
      return null
  }
}

export const PropField: SchemaPropField = (source: string, dest?: string, opts?: SchemaRowOpts) => {
  return {
    dest: (dest ?? source),
    parser: async (page: PageObjectResponse, passthru?: any) => {
      page.id
      let propNode = page.properties[source]
      if (propNode == null) { return null }
      if (opts?.transformer) { return opts.transformer(propNode) }

      opts = Object.assign((opts ?? {}), (passthru ?? {}))

      return (await parseNode(propNode, opts))
    },
    type: "page"
  }
}

async function applyPageSchema(entity: DatabaseObjectResponse | PageObjectResponse | [DatabaseObjectResponse, PageObjectResponse], schema: SchemaRow[], passthru?: any) {
  let obj: any = {}

  for await (const {parser, dest, type} of schema) {
    if (type == "database") {
      obj[dest] = (await parser(Array.isArray(entity) ? entity[0] : entity as DatabaseObjectResponse, passthru))
    } else {
      obj[dest] = (await parser(Array.isArray(entity) ? entity[1] : entity as PageObjectResponse, passthru))
    }
  }

  return obj
}

export class NotionSchemaClass {
  notion: Notion;
  constructor(auth: string) {
    this.notion = new Notion(auth)
  }

  async entries(database_id: string, schema: SchemaRow[], opts?: EntriesOpts): Promise<any | null> {
      const database: DatabaseObjectResponse = (await this.notion.get("/databases/"+database_id) as DatabaseObjectResponse)
      console.log(database.data_sources)

      let passthru = {client: this.notion}

      if (opts?.validate) {
        let valid = await opts.validate(database)

        if (!valid) { return null }
      }

      var pages: PageObjectResponse[] = []
      var has_more = true
      var cursor = undefined

      while (has_more) {
        let opts: any = {}
        if (cursor) { opts["start_cursor"] = cursor }
        // console.log("Fetching...")
        let query = await this.notion.post(`/data_sources/${database.data_sources[0].id}/query`, opts)
        pages = pages.concat(query.results as PageObjectResponse[])
        has_more = query.has_more
        cursor = query.next_cursor
      }

    //  console.log(pages)

      let pageProms = pages.map(page => applyPageSchema([database, page], schema, passthru))

      let pageRes = []
      for await (const prom of pageProms) { pageRes.push(await prom); _idx += 1 }

      return pageRes
  }
}

export async function batch(obj: {[index: string]: Promise<any>}) {
  let new_obj: {[index: string]: any} = {}
  for await (const key of Object.keys(obj)) {
    new_obj[key] = await obj[key]
  }

  return new_obj
}