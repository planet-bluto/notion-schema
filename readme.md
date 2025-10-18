# Notion Schema
Simple wrapper for [@notionhq/client](https://www.npmjs.com/package/@notionhq/client) to parse Notion databases entries to follow a simple defined schema

**Make sure your integration is added to all pages you want it to have access to!**

[Notion Integrations](https://www.notion.so/profile/integrations)

## Examples
```ts
import { NotionSchemaClass, Field, PropField } from "notion-schema";

const schema = new NotionSchemaClass("<API_SECRET>")

let entries = await schema.entries("<DATABASE_ID>", [
  Field("id"),
  PropField("Name", "title"),
  Field("icon"),
  PropField("text", "desc"),
  PropField("number"),
  PropField("relations", "children", {
    schema: [
        Field("id"),
        PropField("title"),
    ]
  })
])

/*
entries: {
  id: string;
  title: string;
  icon: string; // URL to icon, parses emojis to twemoji CDN
  desc: string;
  number: string;
  children: { id: string; title: string; }[]
}
*/
```

## API

### ``Field`` & ``PropField``
- These are for defining a row on a schema
- The different is ``Field`` is a field on the page and ``PropField`` is a field under ``properties`` [(according to the NotionAPI)](https://developers.notion.com/reference/page)
```ts
Field(
  <source_property_key>, // string | Key of source
  <destination_property_key>, // ?string | Key of resulting schema
  <opts>, // ?SchemaRowOpts | Options (consult SchemaRowOpts)
): SchemaRow // Generated automatically from function

PropField(
  <source_property_key>, // string | Key of source, usually the name of property on Notion's front-end
  <destination_property_key>, // ?string | Key of resulting schema
  <opts>, // ?SchemaRowOpts | Options (consult SchemaRowOpts)
): SchemaRow // Generated automatically from function
```

### ``NotionSchemaClass``
- the simple class for getting the entries of a Notion database
- 

### ```SchemaRowOpts```
```ts
interface SchemaRowOpts {
  transformer?: (params: {[index: string]: any}) => any, // For raw editing of property object (consult Notion API to understand returned objects here)
  flag?: string; // Different overrides for props (consult the flag Reference)
  schema?: SchemaRow[] // For specifying the schema of the pages under a relation (SchemaRow is the result of the Field & PropField functions)

  client?: Client; // Sometimes passed thru internally for using the same client, will be overwritten if set
}
```

### ```EntriesOpts```
```ts
interface EntriesOpts {
  validate?: (database: DatabaseObjectResponse) => Promise<boolean>; // Promise function that returns a bool that determines whether to continue the function after getting the database OR return null not further process.
}
```

### ``flag`` Reference
Flags are put in place to do simple overrides of property values without having to use ``opts.transformers``.

*They are based on the property type...*
- **date**
  - *"start" (default)*: Return the start datetime as a Date object
  - *"end"*: Return the end datetime as a Date object
- **multi_select, select, & status**
  - *"name"*: Return the name field of the property
  - *"color"*: Return the color field of the property
- **formula**
  - if formula results in date, the date flags are used
- **relation & rollup**
  - flags are passthru to the pages that are retrieved from the relation

---
And that's about it! This package is very weird but it allows me to kind of use Notion as a sort of CMS for my portfolio site, but I'll put this up here for everyone just in case someone else has a use for this